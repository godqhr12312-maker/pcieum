import assert from "node:assert/strict";

const base = new URL(process.argv[2] || "http://localhost:51694");
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) {
  throw new Error("Member-disabled checks are restricted to local previews.");
}
const hiddenId = process.argv[3];
const anonymous = { user: null, profile: null, isAdmin: false, favoriteIds: [] };
const identities = [
  ["anonymous", {}],
  ["supplied identity headers", { "oai-authenticated-user-id": "local_seedy", "oai-authenticated-user-email": "seedy@sites.test" }],
  ["existing local session", { Cookie: "__sites_local_auth=1" }],
  ["local session and supplied headers", { Cookie: "__sites_local_auth=1", "oai-authenticated-user-id": "smoke_admin", "oai-authenticated-user-email": "admin@example.test" }],
];
const mutations = [
  ["POST", "/api/posts"],
  ["PATCH", "/api/posts/sample-seoul"],
  ["DELETE", "/api/posts/sample-seoul"],
  ["POST", "/api/posts/sample-seoul/comments"],
  ["POST", "/api/posts/sample-seoul/favorite"],
  ["POST", "/api/profile"],
  ["POST", "/api/uploads"],
  ["PATCH", "/api/admin/posts/sample-seoul"],
];
let requests = 0;

async function call(path, method, headers, body) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: { Origin: base.origin, ...headers },
    body,
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
  requests++;
  assert.match(response.headers.get("content-type") || "", /application\/json/, `${method} ${path}: JSON response required`);
  assert.equal(response.headers.get("cache-control"), "no-store");
  return { response, data: await response.json() };
}

async function expectDisabled(path, method, headers, body) {
  const { response, data } = await call(path, method, headers, body);
  assert.equal(response.status, 403, `${method} ${path}: ${JSON.stringify(data)}`);
  assert.equal(data.code, "MEMBER_FEATURES_DISABLED", `${method} ${path}: disabled feature must take precedence over authentication/body validation`);
}

for (const [label, headers] of identities) {
  const me = await call("/api/me", "GET", headers);
  assert.equal(me.response.status, 200);
  assert.deepEqual(me.data, anonymous, label);
  await expectDisabled("/api/admin/posts", "GET", headers);
  for (const [method, path] of mutations) {
    // Malformed input avoids persistent changes if the feature guard regresses.
    // The disabled response must happen before request body parsing.
    await expectDisabled(path, method, { ...headers, "Content-Type": "application/json" }, "{");
  }
  if (hiddenId) {
    const hidden = await call(`/api/posts/${encodeURIComponent(hiddenId)}`, "GET", headers);
    assert.equal(hidden.response.status, 404, `${label}: a hidden post must stay private`);
  }
}

// The preview framework can reject cross-origin requests before the API runs.
const crossOrigin = await fetch(new URL("/api/posts", base), {
  method: "POST", headers: { Origin: "https://different.example", Cookie: "__sites_local_auth=1" },
  body: "{", redirect: "manual", signal: AbortSignal.timeout(15000),
});
requests++;
assert.equal(crossOrigin.status, 403, "Cross-origin writes must also stay blocked");
const visible = await call("/api/posts/sample-seoul", "GET", {});
assert.equal(visible.response.status, 200);
assert.equal(visible.data.post.id, "sample-seoul");
assert.equal(visible.data.post.demo, true);
const list = await call("/api/posts?limit=1", "GET", {});
assert.equal(list.response.status, 200);
assert.ok(Array.isArray(list.data.posts));

console.log(JSON.stringify({ passed: true, requests, identities: identities.length, mutationRoutes: mutations.length, hiddenPostChecked: Boolean(hiddenId) }));

import assert from "node:assert/strict";

// Uses fake platform identity headers only against a local preview. Never target a hosted site.
const base = new URL(process.argv[2] || "http://127.0.0.1:3000");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)) throw new Error("Smoke checks are restricted to local previews.");
const run = Date.now().toString(36);
const userA = `smoke-a-${run}`;
const userB = `smoke-b-${run}`;
const adminUser = process.argv[3];
let checks = 0;

async function call(path, { user, method = "GET", body, origin = base.origin, raw } = {}) {
  const headers = { Origin: origin };
  if (user) {
    headers["oai-authenticated-user-id"] = user;
    headers["oai-authenticated-user-email"] = `${user}@example.test`;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const request = new Request(new URL(path, base), { method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)), signal: AbortSignal.timeout(15000) });
  const response = await fetch(request);
  const data = response.headers.get("content-type")?.includes("application/json") ? await response.json() : await response.text();
  return { response, data };
}

function status(result, expected, label) {
  assert.equal(result.response.status, expected, `${label}: ${JSON.stringify(result.data)}`);
  checks++;
}

const input = {
  kind: "listing", category: "NORMAL", type: "SELL", title: `기능검증 매물 ${run}`,
  body: "로컬 기능 검증용 글입니다. 공개 사이트에 게시되지 않습니다.", region: "서울", district: "강남구",
  price: 15000, premium: 12000, deposit: 3000, seats: 80, contact: "010-0000-0000", images: [],
};

const anonymous = await call("/api/me");
status(anonymous, 200, "anonymous me");
assert.equal(anonymous.data.user, null);
status(await call("/api/posts", { method: "POST", body: input }), 401, "anonymous cannot post");
status(await call("/api/profile", { user: userA, method: "POST", origin: "https://untrusted.example", body: { nickname: "차단확인", region: "서울" } }), 403, "cross-origin rejected");
const noProfile = await call("/api/posts", { user: userA, method: "POST", body: input });
status(noProfile, 403, "profile required");
assert.equal(noProfile.data.code, "PROFILE_REQUIRED");
for (const [user, label] of [[userA, "A"], [userB, "B"]]) {
  status(await call("/api/profile", { user, method: "POST", body: { nickname: `검증${label}${run}`, region: "서울" } }), 200, `save profile ${label}`);
}
status(await call("/api/profile", { user: userB, method: "POST", body: { nickname: `검증A${run}`, region: "서울" } }), 409, "unique nickname");
status(await call("/api/posts", { user: userA, method: "POST", body: { ...input, price: -1 } }), 400, "invalid price");
status(await call("/api/posts", { user: userA, method: "POST", body: { ...input, category: "PCROOM" } }), 400, "invalid category");
status(await call("/api/posts", { user: userA, method: "POST", body: { ...input, type: "POST" } }), 400, "invalid transaction type");
status(await call("/api/posts", { user: userA, method: "POST", body: { ...input, kind: "job", category: "HIRE", type: "RESUME" } }), 400, "mismatched job category");
status(await call("/api/posts", { user: userA, method: "POST", body: { ...input, kind: "board", category: "NOTICE", type: "POST" } }), 403, "notice requires administrator");

const badImage = new FormData();
badImage.append("file", new Blob(["not an image"], { type: "image/png" }), "bad.png");
status(await call("/api/uploads", { user: userA, method: "POST", raw: badImage }), 415, "image signature enforced");
const image = new FormData();
image.append("file", new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64")], { type: "image/png" }), "pixel.png");
const upload = await call("/api/uploads", { user: userA, method: "POST", raw: image });
status(upload, 201, "image upload persists");
const media = await call(upload.data.url);
status(media, 200, "uploaded image accessible");
assert.equal(media.response.headers.get("content-type"), "image/png");
assert.equal(media.response.headers.get("x-content-type-options"), "nosniff");
input.images = [upload.data.url];
status(await call("/api/posts", { user: userB, method: "POST", body: input }), 400, "image ownership enforced");

const created = await call("/api/posts", { user: userA, method: "POST", body: { ...input, authorId: userB, status: "HIDDEN" } });
status(created, 201, "create post");
const id = created.data.post.id;
assert.equal(created.data.post.authorId, userA);
assert.equal(created.data.post.status, "ACTIVE");
assert.equal(created.data.post.premium, 12000);
const path = `/api/posts/${id}`;

try {
  status(await call(path), 200, "public detail");
  const search = await call(`/api/posts?q=${encodeURIComponent(run)}`);
  status(search, 200, "search");
  assert.ok(search.data.posts.some((post) => post.id === id));
  const injection = await call(`/api/posts?q=${encodeURIComponent("' OR 1=1 --")}`);
  status(injection, 200, "query handled as literal");
  assert.equal(injection.data.total, 0);
  status(await call(path, { user: userB, method: "PATCH", body: { title: "타인 수정" } }), 403, "non-owner update rejected");
  status(await call(path, { user: userA, method: "PATCH", body: { category: "FREE" } }), 400, "update category compatible with original kind");
  status(await call(path, { user: userA, method: "PATCH", body: { type: "HIRE" } }), 400, "update transaction type compatible with original kind");
  status(await call(path, { user: userB, method: "DELETE" }), 403, "non-owner delete rejected");
  status(await call("/api/admin/posts", { user: userB }), 403, "admin list protected");
  status(await call(`/api/admin/posts/${id}`, { user: userB, method: "PATCH", body: { status: "HIDDEN" } }), 403, "admin moderation protected");
  if (adminUser) {
    const adminList = await call("/api/admin/posts", { user: adminUser });
    status(adminList, 200, "allowlisted admin can list posts");
    assert.ok(adminList.data.posts.some((post) => post.id === id));
    status(await call(`/api/admin/posts/${id}`, { user: adminUser, method: "PATCH", body: { status: "HIDDEN" } }), 200, "admin hides post");
    status(await call(path, { user: userA, method: "PATCH", body: { status: "ACTIVE" } }), 403, "owner cannot undo moderation");
    status(await call(`/api/admin/posts/${id}`, { user: adminUser, method: "PATCH", body: { status: "ACTIVE" } }), 200, "admin restores post");
  }
  const updated = await call(path, { user: userA, method: "PATCH", body: { title: `수정된 검증 글 ${run}`, status: "SOLD" } });
  status(updated, 200, "owner update");
  assert.equal(updated.data.post.status, "SOLD");
  assert.equal(updated.data.post.body, input.body);
  assert.equal(updated.data.post.price, input.price);
  assert.equal(updated.data.post.images[0], upload.data.url);
  const comment = await call(`${path}/comments`, { user: userB, method: "POST", body: { body: "정상 댓글 등록을 확인합니다." } });
  status(comment, 201, "create comment");
  const detail = await call(path);
  assert.ok(detail.data.comments.some((item) => item.id === comment.data.comment.id));
  const favorite = await call(`${path}/favorite`, { user: userB, method: "POST" });
  status(favorite, 200, "favorite on");
  assert.equal(favorite.data.favorite, true);
  const me = await call("/api/me", { user: userB });
  assert.ok(me.data.favoriteIds.includes(id));
  const unfavorite = await call(`${path}/favorite`, { user: userB, method: "POST" });
  status(unfavorite, 200, "favorite off");
  assert.equal(unfavorite.data.favorite, false);
} finally {
  status(await call(path, { user: userA, method: "DELETE" }), 200, "owner soft delete");
}
status(await call(path), 404, "hidden detail unavailable publicly");
status(await call(path, { user: userA }), 200, "owner can inspect hidden post");
status(await call(`${path}/comments`, { user: userB, method: "POST", body: { body: "숨김 댓글 확인" } }), 404, "hidden comments prevented");
console.log(`Backend smoke checks passed (${checks} HTTP assertions plus payload assertions). Test post was soft-hidden.`);

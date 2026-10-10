import assert from "node:assert/strict";
const base = new URL(process.argv[2] || "http://127.0.0.1:5173");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)) throw new Error("Local preview only");
let checks = 0;
async function call(path, method = "GET", body, expected = 200) {
  const headers = { Origin: base.origin, Cookie: "__sites_local_auth=1" };
  const isForm = body instanceof FormData;
  if (body && !isForm) headers["Content-Type"] = "application/json";
  const response = await fetch(new URL(path, base), { method, headers, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body), signal: AbortSignal.timeout(12000) });
  const data = response.headers.get("content-type")?.includes("application/json") ? await response.json() : null;
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  checks++;
  return { response, data };
}
const me = await call("/api/me");
assert.equal(me.data.user.userId, "local_seedy");
assert.ok(me.data.profile, "Create a profile with local sign-in before running this test.");
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
const form = new FormData();
form.append("file", new Blob([pixel], { type: "image/png" }), "pixel.png");
const upload = await call("/api/uploads", "POST", form, 201);
const media = await call(upload.data.url);
assert.equal(media.response.headers.get("content-type"), "image/png");
assert.equal(media.response.headers.get("x-content-type-options"), "nosniff");
assert.deepEqual(Buffer.from(await media.response.arrayBuffer()), pixel);
const input = { kind: "listing", category: "NORMAL", type: "SELL", title: "업로드 포함 로컬 API 검증", body: "로컬 자동 검증용 게시물입니다. 검증 종료 후 숨김 처리합니다.", region: "서울", district: "강남구", price: 15000, deposit: 3000, premium: 12000, seats: 80, contact: "010-0000-0000", images: [upload.data.url] };
const created = await call("/api/posts", "POST", input, 201);
const path = `/api/posts/${created.data.post.id}`;
assert.equal(created.data.post.images[0], upload.data.url);
assert.equal(created.data.post.authorId, "local_seedy");
try {
  const comment = await call(`${path}/comments`, "POST", { body: "댓글 저장을 확인합니다." }, 201);
  const detail = await call(path);
  assert.ok(detail.data.comments.some((item) => item.id === comment.data.comment.id));
  const favorite = await call(`${path}/favorite`, "POST");
  assert.equal(favorite.data.favorited, true);
  const unfavorite = await call(`${path}/favorite`, "POST");
  assert.equal(unfavorite.data.favorited, false);
  const updated = await call(path, "PATCH", { title: "수정된 로컬 API 검증", status: "SOLD" });
  assert.equal(updated.data.post.status, "SOLD");
  assert.equal(updated.data.post.price, 15000);
  assert.equal(updated.data.post.body, input.body);
  await call("/api/posts", "POST", { ...input, category: "PCROOM" }, 400);
  await call("/api/posts", "POST", { ...input, type: "POST" }, 400);
  await call("/api/posts", "POST", { ...input, kind: "job", category: "HIRE", type: "RESUME" }, 400);
  await call(path, "PATCH", { category: "FREE" }, 400);
} finally {
  await call(path, "DELETE");
}
const hidden = await call(path);
assert.equal(hidden.data.post.status, "HIDDEN");
console.log(`Cookie-auth API smoke passed: ${checks} HTTP assertions plus D1 content, R2 byte equality, comments, favorites, update retention, strict type/category validation and soft-hide assertions. Cross-user/admin isolation is not covered by this single-user test.`);

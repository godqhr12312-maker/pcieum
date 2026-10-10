import { z } from "zod";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { database, getPost, getProfile, isAdmin, StorageUnavailableError } from "@/lib/store";
import type { Post, Profile } from "@/lib/types";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function handleApi(action: () => Promise<Response>): Promise<Response> {
  try { return await action(); }
  catch (error) {
    if (error instanceof ApiError) return json({ error: error.message, code: error.code }, error.status);
    if (error instanceof z.ZodError) return json({ error: error.issues[0]?.message ?? "입력 내용을 확인해 주세요.", code: "VALIDATION_ERROR" }, 400);
    if (error instanceof StorageUnavailableError) return json({ error: error.message, code: "STORAGE_UNAVAILABLE" }, 503);
    console.error("API request failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", code: "SERVER_ERROR" }, 500);
  }
}

export function verifyOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "이 사이트에서 요청을 다시 보내 주세요.", "INVALID_ORIGIN");
  }
}

export async function requireUser(request?: Request): Promise<ChatGPTUser> {
  if (request) verifyOrigin(request);
  const user = await getChatGPTUser();
  if (!user) throw new ApiError(401, "로그인 후 이용할 수 있습니다.", "AUTH_REQUIRED");
  return user;
}

export async function requireProfile(user: ChatGPTUser): Promise<Profile> {
  const profile = await getProfile(user.userId);
  if (!profile) throw new ApiError(403, "먼저 내 프로필에서 닉네임과 지역을 등록해 주세요.", "PROFILE_REQUIRED");
  return profile;
}

export async function requireAdmin(request?: Request): Promise<ChatGPTUser> {
  const user = await requireUser(request);
  if (!isAdmin(user.userId)) throw new ApiError(403, "관리자 권한이 필요합니다.", "FORBIDDEN");
  return user;
}

export async function editablePost(id: string, user: ChatGPTUser): Promise<Post> {
  const post = await getPost(id, { includeHidden: true });
  if (!post) throw new ApiError(404, "게시글을 찾을 수 없습니다.");
  if (post.demo) throw new ApiError(400, "미리보기 예시 글은 변경할 수 없습니다.", "DEMO_READ_ONLY");
  const admin = isAdmin(user.userId);
  if (post.authorId !== user.userId && !admin) throw new ApiError(403, "작성자만 변경할 수 있습니다.", "FORBIDDEN");
  if (post.status === "HIDDEN" && !admin) throw new ApiError(403, "숨김 처리된 글은 수정할 수 없습니다.");
  return post;
}

export async function writablePost(id: string): Promise<Post> {
  const post = await getPost(id);
  if (!post) throw new ApiError(404, "게시글을 찾을 수 없습니다.");
  if (post.demo) throw new ApiError(400, "미리보기 예시 글에는 참여할 수 없습니다. 새 글을 등록해 보세요.", "DEMO_READ_ONLY");
  return post;
}

export async function readBody(request: Request, maxBytes = 64 * 1024): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new ApiError(413, "전송 가능한 크기를 초과했습니다.");
  if (!request.body) throw new ApiError(400, "요청 내용이 비어 있습니다.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel(); throw new ApiError(413, "전송 가능한 크기를 초과했습니다."); }
    chunks.push(value);
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

export async function bodyJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ApiError(415, "JSON 형식으로 요청해 주세요.");
  const bytes = await readBody(request);
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiError(400, "요청 형식이 올바르지 않습니다."); }
}

const money = z.number().int("금액은 정수로 입력해 주세요.").min(0).max(1_000_000_000).nullable().optional().default(null);
const safeText = (max: number) => z.string().trim().max(max).refine((value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value), "사용할 수 없는 문자가 있습니다.");
export const postSchema = z.object({
  kind: z.enum(["listing", "market", "job", "board"]),
  category: safeText(40).refine((value) => value.length > 0, "분류를 선택해 주세요."),
  type: safeText(30).refine((value) => value.length > 0, "거래 유형을 선택해 주세요."),
  title: safeText(120).refine((value) => value.length >= 2, "제목을 2자 이상 입력해 주세요."),
  body: safeText(20000).refine((value) => value.length >= 5, "본문을 5자 이상 입력해 주세요."),
  region: safeText(30).refine((value) => value.length > 0, "지역을 선택해 주세요."),
  district: safeText(60).optional().default(""),
  price: money, premium: money, deposit: money,
  seats: z.number().int().min(0).max(10000).nullable().optional().default(null),
  contact: safeText(100).optional().default(""),
  images: z.array(z.string().regex(/^\/api\/media\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/, "직접 업로드한 이미지만 첨부할 수 있습니다.")).max(8, "이미지는 최대 8장까지 첨부할 수 있습니다.").optional().default([]),
});
export type PostInput = z.infer<typeof postSchema>;
export const updatePostSchema = postSchema.partial().extend({ status: z.enum(["ACTIVE", "SOLD"]).optional() }).strict();
export const profileSchema = z.object({
  nickname: safeText(20).refine((value) => value.length >= 2, "닉네임은 2~20자로 입력해 주세요."),
  region: safeText(30).refine((value) => value.length > 0, "지역을 선택해 주세요."),
}).strict();
export const commentSchema = z.object({ body: safeText(2000).refine((value) => value.length > 0, "댓글을 입력해 주세요.") }).strict();

export function authorizeCategory(kind: string, category: string, userId: string): void {
  if (kind === "board" && category.toUpperCase() === "NOTICE" && !isAdmin(userId)) {
    throw new ApiError(403, "공지사항은 관리자만 작성할 수 있습니다.", "FORBIDDEN");
  }
}

export function validatePostCombination(input: Pick<Post, "kind" | "category" | "type">): void {
  const categories: Record<Post["kind"], readonly string[]> = {
    listing: ["ADULT", "NORMAL", "OTHER"],
    market: ["PC", "MONITOR", "CHAIR", "OTHER"],
    job: ["HIRE", "RESUME"],
    board: ["FREE", "TIPS", "NOTICE", "NEWS", "GAME", "CUSTOMER"],
  };
  const validType = input.kind === "board" ? input.type === "POST"
    : input.kind === "job" ? input.type === input.category && ["HIRE", "RESUME"].includes(input.type)
    : ["SELL", "BUY"].includes(input.type);
  if (!categories[input.kind].includes(input.category) || !validType) {
    throw new ApiError(400, "게시판에 맞는 카테고리와 거래 유형을 선택해 주세요.", "VALIDATION_ERROR");
  }
}

export async function validateImages(images: string[], authorId: string): Promise<void> {
  for (const url of images) {
    const owned = await database().prepare("SELECT key FROM uploads WHERE key = ? AND user_id = ?").bind(url.slice("/api/media/".length), authorId).first();
    if (!owned) throw new ApiError(400, "직접 업로드한 이미지만 첨부할 수 있습니다.");
  }
}

export async function checkDailyLimit(table: "posts" | "comments" | "uploads", authorId: string, limit: number): Promise<void> {
  const column = table === "uploads" ? "user_id" : "author_id";
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = await database().prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column} = ? AND created_at > ?`).bind(authorId, since).first<{ count: number }>();
  if ((result?.count ?? 0) >= limit) throw new ApiError(429, "하루 이용 한도에 도달했습니다. 잠시 후 다시 이용해 주세요.");
}

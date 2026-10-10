import { env } from "cloudflare:workers";
import { database } from "@/lib/store";
import { ApiError, checkDailyLimit, handleApi, json, readBody, requireUser } from "@/app/api/_shared";

const maxImageSize = 5 * 1024 * 1024;

function imageType(bytes: Uint8Array): { mime: string; extension: string } | null {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9) return { mime: "image/jpeg", extension: "jpg" };
  if (bytes.length >= 24 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return { mime: "image/png", extension: "png" };
  if (bytes.length >= 16 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") return { mime: "image/webp", extension: "webp" };
  return null;
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireUser(request);
    const db = database();
    if (!env.BUCKET) throw new ApiError(503, "이미지 저장소 연결이 준비되지 않았습니다.", "STORAGE_UNAVAILABLE");
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) throw new ApiError(415, "파일 형식의 요청이 필요합니다.");
    await checkDailyLimit("uploads", user.userId, 40);
    const body = await readBody(request, maxImageSize + 64 * 1024);
    let form: FormData;
    try { form = await new Response(body, { headers: { "Content-Type": contentType } }).formData(); }
    catch { throw new ApiError(400, "업로드 요청 형식이 올바르지 않습니다."); }
    const file = form.get("file");
    if (!file || typeof file === "string" || !file.size) throw new ApiError(400, "이미지 파일을 선택해 주세요.");
    if (form.getAll("file").length !== 1 || file.size > maxImageSize) throw new ApiError(413, "이미지는 한 번에 한 장, 최대 5MB까지 올릴 수 있습니다.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = imageType(bytes);
    if (!format || file.type !== format.mime) throw new ApiError(415, "실제 JPG, PNG, WebP 이미지 파일만 업로드할 수 있습니다.");
    const key = `${crypto.randomUUID()}.${format.extension}`;
    await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: format.mime, cacheControl: "public, max-age=86400" } });
    try {
      await db.prepare("INSERT INTO uploads (key, user_id, size, content_type, created_at) VALUES (?, ?, ?, ?, ?)").bind(key, user.userId, file.size, format.mime, new Date().toISOString()).run();
    } catch (error) { await env.BUCKET.delete(key); throw error; }
    return json({ key, url: `/api/media/${key}` }, 201);
  });
}

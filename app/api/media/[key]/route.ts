import { env } from "cloudflare:workers";
import { ApiError, handleApi, json } from "@/app/api/_shared";

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  return handleApi(async () => {
    const { key } = await context.params;
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key)) return json({ error: "이미지를 찾을 수 없습니다." }, 404);
    if (!env.BUCKET) throw new ApiError(503, "이미지 저장소 연결이 준비되지 않았습니다.");
    const object = await env.BUCKET.get(key);
    if (!object) return json({ error: "이미지를 찾을 수 없습니다." }, 404);
    const mime = key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".png") ? "image/png" : "image/webp";
    const headers = new Headers({ "Content-Type": mime, "Content-Length": String(object.size),
      "Content-Disposition": `inline; filename="${key}"`, "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox", "Cache-Control": "public, max-age=86400",
      "ETag": object.httpEtag, "Cross-Origin-Resource-Policy": "same-origin" });
    if (request.headers.get("if-none-match") === object.httpEtag) return new Response(null, { status: 304, headers });
    return new Response(object.body, { headers });
  });
}

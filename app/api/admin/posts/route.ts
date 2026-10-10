import { listPosts } from "@/lib/store";
import { handleApi, json, requireAdmin } from "@/app/api/_shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleApi(async () => {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page")) || 1;
    return json(await listPosts({ includeHidden: true, limit: 100, page: Number.isFinite(page) ? page : 1, q: params.get("q")?.slice(0, 120) || undefined }));
  });
}

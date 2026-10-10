import { z } from "zod";
import { database, getPost } from "@/lib/store";
import { ApiError, bodyJson, handleApi, json, requireAdmin } from "@/app/api/_shared";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    await requireAdmin(request);
    const { id } = await context.params;
    const input = z.object({ status: z.enum(["ACTIVE", "SOLD", "HIDDEN"]) }).strict().parse(await bodyJson(request));
    const post = await getPost(id, { includeHidden: true });
    if (!post) throw new ApiError(404, "게시글을 찾을 수 없습니다.");
    if (post.demo) throw new ApiError(400, "미리보기 예시 글은 변경할 수 없습니다.", "DEMO_READ_ONLY");
    await database().prepare("UPDATE posts SET status = ?, updated_at = ? WHERE id = ?").bind(input.status, new Date().toISOString(), id).run();
    return json({ post: await getPost(id, { includeHidden: true }) });
  });
}

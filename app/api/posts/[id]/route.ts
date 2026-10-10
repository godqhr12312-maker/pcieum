import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database, getPost, isAdmin, listComments } from "@/lib/store";
import { ApiError, authorizeCategory, bodyJson, editablePost, handleApi, json, requireUser, updatePostSchema, validateImages, validatePostCombination } from "@/app/api/_shared";

type Context = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: Context) {
  return handleApi(async () => {
    const { id } = await context.params;
    const post = await getPost(id, { includeHidden: true });
    if (!post) throw new ApiError(404, "게시글을 찾을 수 없습니다.");
    if (post.status === "HIDDEN") {
      const user = await getChatGPTUser();
      if (!user || (user.userId !== post.authorId && !isAdmin(user.userId))) throw new ApiError(404, "게시글을 찾을 수 없습니다.");
    }
    return json({ post, comments: await listComments(id) });
  });
}

export async function PATCH(request: Request, context: Context) {
  return handleApi(async () => {
    const user = await requireUser(request);
    const { id } = await context.params;
    const current = await editablePost(id, user);
    const patch = updatePostSchema.parse(await bodyJson(request));
    if (Object.keys(patch).length === 0) throw new ApiError(400, "수정할 내용을 입력해 주세요.");
    if (patch.kind && patch.kind !== current.kind) throw new ApiError(400, "게시판 종류는 변경할 수 없습니다.");
    const input = { ...current, ...patch };
    validatePostCombination(input);
    authorizeCategory(input.kind, input.category, user.userId);
    await validateImages(input.images, current.authorId);
    const updated = await database().prepare(`UPDATE posts SET category = ?, type = ?, title = ?, body = ?, region = ?, district = ?, price = ?, premium = ?, deposit = ?, seats = ?, contact = ?, images = ?, status = ?, updated_at = ? WHERE id = ?${isAdmin(user.userId) ? "" : " AND status != 'HIDDEN'"}`)
      .bind(input.category, input.type, input.title, input.body, input.region, input.district, input.price, input.premium ?? null, input.deposit ?? null,
        input.seats, input.contact ?? "", JSON.stringify(input.images), input.status, new Date().toISOString(), id).run();
    if (!updated.meta.changes) throw new ApiError(409, "게시글 상태가 변경되었습니다. 페이지를 새로고침해 주세요.");
    return json({ post: await getPost(id, { includeHidden: true }) });
  });
}

export async function DELETE(request: Request, context: Context) {
  return handleApi(async () => {
    const user = await requireUser(request);
    const { id } = await context.params;
    await editablePost(id, user);
    await database().prepare("UPDATE posts SET status = 'HIDDEN', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
    return json({ ok: true });
  });
}

import { database } from "@/lib/store";
import { bodyJson, checkDailyLimit, commentSchema, handleApi, json, requireProfile, requireUser, writablePost } from "@/app/api/_shared";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const user = await requireUser(request);
    const profile = await requireProfile(user);
    const { id: postId } = await context.params;
    await writablePost(postId);
    const input = commentSchema.parse(await bodyJson(request));
    await checkDailyLimit("comments", user.userId, 100);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await database().prepare("INSERT INTO comments (id, post_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, postId, user.userId, input.body, createdAt).run();
    return json({ comment: { id, postId, authorId: user.userId, authorName: profile.nickname, body: input.body, createdAt } }, 201);
  });
}

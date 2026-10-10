import { database, getFavoriteIds } from "@/lib/store";
import { ApiError, handleApi, json, requireUser, writablePost } from "@/app/api/_shared";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const user = await requireUser(request);
    const { id } = await context.params;
    await writablePost(id);
    const db = database();
    const existing = await db.prepare("SELECT post_id FROM favorites WHERE user_id = ? AND post_id = ?").bind(user.userId, id).first();
    if (existing) await db.prepare("DELETE FROM favorites WHERE user_id = ? AND post_id = ?").bind(user.userId, id).run();
    else {
      const count = await db.prepare("SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?").bind(user.userId).first<{ count: number }>();
      if ((count?.count ?? 0) >= 500) throw new ApiError(400, "관심 글은 최대 500개까지 저장할 수 있습니다.");
      await db.prepare("INSERT OR IGNORE INTO favorites (user_id, post_id, created_at) VALUES (?, ?, ?)").bind(user.userId, id, new Date().toISOString()).run();
    }
    const favoriteIds = await getFavoriteIds(user.userId);
    const favorite = favoriteIds.includes(id);
    return json({ favorite, favorited: favorite, favoriteIds });
  });
}

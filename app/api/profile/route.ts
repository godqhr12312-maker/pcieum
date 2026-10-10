import { database } from "@/lib/store";
import { ApiError, bodyJson, handleApi, json, profileSchema, requireUser } from "@/app/api/_shared";

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireUser(request);
    const input = profileSchema.parse(await bodyJson(request));
    const db = database();
    const duplicate = await db.prepare("SELECT id FROM profiles WHERE nickname = ? AND id != ?").bind(input.nickname, user.userId).first();
    if (duplicate) throw new ApiError(409, "이미 사용 중인 닉네임입니다.");
    const now = new Date().toISOString();
    try {
      await db.prepare(`INSERT INTO profiles (id, nickname, region, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET nickname = excluded.nickname, region = excluded.region, updated_at = excluded.updated_at`)
        .bind(user.userId, input.nickname, input.region, now, now).run();
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint")) throw new ApiError(409, "이미 사용 중인 닉네임입니다.");
      throw error;
    }
    return json({ profile: { id: user.userId, ...input } });
  });
}

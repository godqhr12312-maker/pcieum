import { database, getPost, listPosts } from "@/lib/store";
import { authorizeCategory, bodyJson, checkDailyLimit, handleApi, json, postSchema, requireProfile, requireUser, validateImages, validatePostCombination } from "@/app/api/_shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleApi(async () => {
    const params = new URL(request.url).searchParams;
    const number = (key: string, fallback: number) => { const value = Number(params.get(key)); return Number.isFinite(value) && value > 0 ? value : fallback; };
    return json(await listPosts({ kind: params.get("kind") || undefined, category: params.get("category") || undefined,
      type: params.get("type") || undefined, region: params.get("region") || undefined, q: params.get("q")?.slice(0, 120) || undefined,
      sort: params.get("sort") || undefined, page: number("page", 1), limit: number("limit", 24) }));
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireUser(request);
    await requireProfile(user);
    const input = postSchema.parse(await bodyJson(request));
    validatePostCombination(input);
    authorizeCategory(input.kind, input.category, user.userId);
    await checkDailyLimit("posts", user.userId, 20);
    await validateImages(input.images, user.userId);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await database().prepare(`INSERT INTO posts (id, kind, category, type, title, body, region, district, price, premium, deposit, seats, contact, images, author_id, status, created_at, updated_at, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 0)`).bind(id, input.kind, input.category, input.type, input.title, input.body,
      input.region, input.district, input.price, input.premium, input.deposit, input.seats, input.contact, JSON.stringify(input.images), user.userId, now, now).run();
    return json({ post: await getPost(id) }, 201);
  });
}

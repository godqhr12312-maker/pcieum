import { env } from "cloudflare:workers";
import type { Comment, Post, PostFilters, Profile } from "@/lib/types";

export class StorageUnavailableError extends Error {
  constructor() { super("데이터베이스 연결이 준비되지 않았습니다. 잠시 후 다시 시도해 주세요."); }
}

export function database(): D1Database {
  if (!env.DB) throw new StorageUnavailableError();
  return env.DB;
}

type PostRow = Omit<Post, "images" | "demo"> & { images: string };
const postSelect = `SELECT p.id, p.kind, p.category, p.type, p.title, p.body, p.region, p.district,
  p.price, p.premium, p.deposit, p.seats, p.contact, p.images, p.author_id AS authorId,
  u.nickname AS authorName, p.status, p.created_at AS createdAt, p.updated_at AS updatedAt, p.views
  FROM posts p JOIN profiles u ON u.id = p.author_id`;

function mapPost(row: PostRow): Post {
  let images: string[] = [];
  try { const parsed: unknown = JSON.parse(row.images); if (Array.isArray(parsed)) images = parsed.filter((v): v is string => typeof v === "string"); } catch { /* Legacy malformed data has no images. */ }
  return { ...row, images };
}

export async function listPosts(filters: PostFilters = {}): Promise<{ posts: Post[]; total: number }> {
  const db = database();
  const clauses: string[] = [];
  const values: (string | number)[] = [];
  if (!filters.includeHidden) clauses.push("p.status != 'HIDDEN'");
  for (const [field, column] of [["kind", "kind"], ["category", "category"], ["type", "type"], ["region", "region"], ["authorId", "author_id"]] as const) {
    const value = filters[field];
    if (value) { clauses.push(`p.${column} = ?`); values.push(value); }
  }
  if (filters.q) {
    clauses.push("(p.title LIKE ? ESCAPE '\\' OR p.body LIKE ? ESCAPE '\\' OR p.region LIKE ? ESCAPE '\\' OR p.district LIKE ? ESCAPE '\\')");
    const term = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    values.push(term, term, term, term);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  const sort = filters.sort;
  const order = sort === "popular" || sort === "views" ? "p.views DESC, p.created_at DESC" : sort === "price-asc" || sort === "price_asc" ? "p.price IS NULL, p.price ASC" : sort === "price-desc" || sort === "price_desc" ? "p.price DESC" : "p.created_at DESC, p.id ASC";
  const limit = Math.min(100, Math.max(1, Math.floor(filters.limit ?? 24)));
  const page = Math.min(1000, Math.max(1, Math.floor(filters.page ?? 1)));
  const offset = (page - 1) * limit;
  const [count, result] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS total FROM posts p${where}`).bind(...values).first<{ total: number }>(),
    db.prepare(`${postSelect}${where} ORDER BY ${order} LIMIT ? OFFSET ?`).bind(...values, limit, offset).all<PostRow>(),
  ]);
  return { posts: result.results.map(mapPost), total: count?.total ?? 0 };
}

export async function getPost(id: string, options: { includeHidden?: boolean } = {}): Promise<Post | null> {
  const row = await database().prepare(`${postSelect} WHERE p.id = ?${options.includeHidden ? "" : " AND p.status != 'HIDDEN'"}`).bind(id).first<PostRow>();
  return row ? mapPost(row) : null;
}

export async function listComments(postId: string): Promise<Comment[]> {
  const result = await database().prepare(`SELECT c.id, c.post_id AS postId, c.author_id AS authorId, u.nickname AS authorName, c.body, c.created_at AS createdAt
    FROM comments c JOIN profiles u ON u.id = c.author_id JOIN posts p ON p.id = c.post_id
    WHERE c.post_id = ? AND p.status != 'HIDDEN' ORDER BY c.created_at ASC LIMIT 200`).bind(postId).all<Comment>();
  return result.results;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  return database().prepare("SELECT id, nickname, region FROM profiles WHERE id = ?").bind(userId).first<Profile>();
}

export function isAdmin(userId: string): boolean {
  const setting = (env as unknown as Record<string, unknown>).ADMIN_USER_IDS;
  return typeof setting === "string" && setting.split(",").map((id) => id.trim()).filter(Boolean).includes(userId);
}

export async function getFavoriteIds(userId: string): Promise<string[]> {
  const result = await database().prepare("SELECT f.post_id AS id FROM favorites f JOIN posts p ON p.id = f.post_id WHERE f.user_id = ? AND p.status != 'HIDDEN' ORDER BY f.created_at DESC LIMIT 500").bind(userId).all<{ id: string }>();
  return result.results.map((item) => item.id);
}

export async function listFavorites(userId: string): Promise<Post[]> {
  const result = await database().prepare(`${postSelect} JOIN favorites f ON f.post_id = p.id WHERE f.user_id = ? AND p.status != 'HIDDEN' ORDER BY f.created_at DESC LIMIT 500`).bind(userId).all<PostRow>();
  return result.results.map(mapPost);
}

export async function recordPostView(id: string): Promise<void> {
  await database().prepare("UPDATE posts SET views = views + 1 WHERE id = ? AND status != 'HIDDEN'").bind(id).run();
}

import { indexable, origin, postUrl } from "@/lib/config";
import { PUBLIC_PAGES } from "@/lib/seo-routes";
import { database } from "@/lib/store";

export const dynamic = "force-dynamic";

// Leave room for public pages under the sitemap protocol's 50,000 URL limit.
const POSTS_PER_SITEMAP = 40_000;
const headers = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=300",
  "X-Content-Type-Options": "nosniff",
};
type SitemapPost = { id: string; kind: string; category: string; updated_at: string };
type SitemapEntry = { loc: string; lastmod?: string };

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function lastModified(value: string): string | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function urlset(entries: SitemapEntry[]): Response {
  const body = entries.map(({ loc, lastmod }) => `<url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}</url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, { headers });
}

export async function GET(request: Request): Promise<Response> {
  if (!indexable()) return urlset([]);
  const base = await origin();
  const db = database();
  // Query persisted posts directly: preview samples never enter the sitemap.
  const count = await db.prepare("SELECT COUNT(*) AS total FROM posts WHERE status = 'ACTIVE'").first<{ total: number }>();
  const totalPages = Math.max(1, Math.ceil((count?.total ?? 0) / POSTS_PER_SITEMAP));
  const rawPage = new URL(request.url).searchParams.get("page");
  if (totalPages > 1 && rawPage === null) {
    const entries = Array.from({ length: totalPages }, (_, index) => `<sitemap><loc>${escapeXml(`${base}/sitemap.xml?page=${index + 1}`)}</loc></sitemap>`).join("");
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`, { headers });
  }
  const page = rawPage === null ? 1 : Number(rawPage);
  if (!Number.isSafeInteger(page) || page < 1 || page > totalPages) {
    return new Response("Sitemap page not found.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
  const rows = await db.prepare("SELECT id, kind, category, updated_at FROM posts WHERE status = 'ACTIVE' ORDER BY updated_at DESC, id ASC LIMIT ? OFFSET ?")
    .bind(POSTS_PER_SITEMAP, (page - 1) * POSTS_PER_SITEMAP).all<SitemapPost>();
  const entries: SitemapEntry[] = page === 1 ? PUBLIC_PAGES.map(({ path }) => ({ loc: base + path })) : [];
  entries.push(...rows.results.map(post => ({ loc: base + postUrl(post), lastmod: lastModified(post.updated_at) })));
  return urlset(entries);
}

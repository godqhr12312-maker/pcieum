import { indexable, origin } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const base = await origin();
  const rules = indexable()
    ? ["Allow: /", "Disallow: /api/", "Allow: /api/media/", "Disallow: /signin-with-chatgpt", "Disallow: /signout-with-chatgpt", "Disallow: /callback"]
    : ["Disallow: /"];
  // Private HTML pages stay crawlable so crawlers can read their noindex tags.
  return new Response(["User-agent: *", ...rules, `Sitemap: ${base}/sitemap.xml`, ""].join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
}

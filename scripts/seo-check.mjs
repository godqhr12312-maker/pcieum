import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const BOARDS = ["FREE", "TIPS", "NOTICE", "NEWS", "GAME", "CUSTOMER"];
const CATEGORIES = { "pc-room": ["ADULT", "NORMAL", "OTHER"], market: ["PC", "MONITOR", "CHAIR", "OTHER"], job: ["HIRE", "RESUME"] };
const TYPES = { "pc-room": ["SELL", "BUY"], market: ["SELL", "BUY"], job: ["HIRE", "RESUME"] };
const PUBLIC = ["/", "/pc-room", "/market", "/job", ...BOARDS.map((name) => `/board/${name}`), "/slot", "/terms", "/privacy"];
const PRIVATE = ["/join", "/mypage", "/write", "/admin"];
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function parseOptions(args = process.argv.slice(2)) {
  const options = { base: "http://localhost:51694", siteUrl: undefined, preview: false, fixture: false, lighthouse: false, smoke: false, maxPages: 250, json: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--site-url") options.siteUrl = args[++i];
    else if (arg === "--max-pages") options.maxPages = Number(args[++i]);
    else if (arg === "--preview") options.preview = true;
    else if (arg === "--fixture") options.fixture = true;
    else if (arg === "--lighthouse") options.lighthouse = true;
    else if (arg === "--smoke") options.smoke = true;
    else if (arg === "--json") options.json = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else options.base = arg;
  }
  if (!Number.isInteger(options.maxPages) || options.maxPages < 1) throw new Error("--max-pages must be a positive integer.");
  if (options.lighthouse && !options.fixture) throw new Error("--lighthouse requires --fixture.");
  if (options.lighthouse && options.preview) throw new Error("Lighthouse SEO 100 requires public mode; remove --preview or --lighthouse.");
  return options;
}

function decode(value = "") {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity) => {
    const known = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
    if (!entity.startsWith("#")) return known[entity.toLowerCase()] || match;
    const point = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : "�";
  });
}
function attrs(tag) {
  const result = {};
  for (const match of tag.replace(/^<\/?[^\s>]+/, "").matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? "");
  return result;
}
function text(html) { return decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim(); }
export function inspectHtml(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, "");
  const tags = (name, source = markup) => [...source.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => attrs(match[0]));
  const head = markup.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1] || "";
  const metas = tags("meta");
  const named = (name) => metas.filter((meta) => (meta.name || meta.property || "").toLowerCase() === name).map((meta) => meta.content || "");
  const headNamed = (name) => tags("meta", head).filter((meta) => (meta.name || meta.property || "").toLowerCase() === name).map((meta) => meta.content || "");
  return {
    markup, metas, named, headNamed, html: tags("html")[0] || {},
    headTitles: [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => text(match[1])),
    headCanonical: tags("link", head).filter((link) => (link.rel || "").toLowerCase().split(/\s+/).includes("canonical")).map((link) => link.href || ""),
    titles: [...markup.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => text(match[1])),
    h1: [...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => text(match[1])),
    canonical: tags("link").filter((link) => (link.rel || "").toLowerCase().split(/\s+/).includes("canonical")).map((link) => link.href || ""),
    images: tags("img"),
    links: [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)].map((match) => ({ ...attrs(`<a ${match[1]}>`), text: text(match[2]), imageAlt: (attrs(match[2].match(/<img\b[^>]*>/i)?.[0] || "").alt || "") })),
    jsonLd: scripts.filter((match) => (attrs(`<script ${match[1]}>`).type || "").toLowerCase() === "application/ld+json").map((match) => match[2]),
  };
}
function comparable(url) {
  const parsed = new URL(url); parsed.hash = ""; parsed.searchParams.sort();
  return parsed.href;
}
function canonicalPath(url) {
  const parts = url.pathname.split("/").filter(Boolean);
  const section = parts[0];
  const isList = parts.length === 1 && Object.hasOwn(CATEGORIES, section) || parts.length === 2 && section === "board" && BOARDS.includes(parts[1]);
  const query = new URLSearchParams();
  if (isList) {
    const type = url.searchParams.get("type");
    const category = url.searchParams.get("category");
    const page = url.searchParams.get("page");
    if (TYPES[section]?.includes(type)) query.set("type", type);
    if (CATEGORIES[section]?.includes(category)) query.set("category", category);
    if (page && /^\d+$/.test(page) && Number(page) > 1) query.set("page", String(Number(page)));
  }
  return url.pathname + (query.size ? `?${query}` : "");
}
function routeKind(url) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (/^\/(?:api|signin-with-chatgpt|signout-with-chatgpt|callback)(?:\/|$)/.test(url.pathname)) return "reserved";
  if (PRIVATE.includes(url.pathname)) return "private";
  if (PUBLIC.includes(url.pathname)) {
    if ([...url.searchParams.keys()].some((key) => !["type", "category", "page", "sort", "q", "region"].includes(key))) return "unknown";
    if (url.searchParams.get("q") || url.searchParams.get("region") || url.searchParams.has("sort") && !["", "latest"].includes(url.searchParams.get("sort"))) return "filtered";
    if (url.searchParams.get("type") && !TYPES[parts[0]]?.includes(url.searchParams.get("type"))) return "unknown";
    if (url.searchParams.get("category") && !CATEGORIES[parts[0]]?.includes(url.searchParams.get("category"))) return "unknown";
    if (url.searchParams.has("page") && !/^[1-9]\d*$/.test(url.searchParams.get("page"))) return "unknown";
    return "public";
  }
  if (parts.length === 2 && Object.hasOwn(CATEGORIES, parts[0]) || parts.length === 3 && parts[0] === "board" && BOARDS.includes(parts[1])) return parts.at(-1).startsWith("sample-") ? "demo" : "post";
  return "unknown";
}
function schemaNodes(value, result = []) {
  if (Array.isArray(value)) for (const item of value) schemaNodes(item, result);
  else if (value && typeof value === "object") {
    if (value["@type"]) result.push(value);
    if (value["@graph"]) schemaNodes(value["@graph"], result);
  }
  return result;
}

export async function runSeoCheck(options = {}) {
  const config = { ...parseOptions([]), ...options };
  const base = new URL(config.base);
  const failures = [], warnings = [], pages = [], sitemapUrls = new Set(), queued = new Set(), visitedSitemaps = new Set();
  const queue = [];
  let assertions = 0, siteOrigin = config.siteUrl ? new URL(config.siteUrl).origin : null, requests = 0, fixtureCount = 0;
  const check = (condition, label, path) => { assertions++; if (!condition) failures.push(`${path}: ${label}`); return !!condition; };
  const localUrl = (path) => new URL(typeof path === "string" ? path : path.pathname + path.search, base);
  async function request(path, init = {}) {
    requests++;
    const url = path instanceof URL ? localUrl(path) : localUrl(path);
    const response = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(15000), headers: { "Cache-Control": "no-cache", ...init.headers } });
    return { response, body: await response.text(), url };
  }
  function enqueue(path, expectedKind, from = "navigation") {
    const url = new URL(path, base);
    if (![base.origin, siteOrigin].includes(url.origin)) return;
    url.hash = "";
    url.searchParams.sort();
    const key = url.pathname + url.search;
    if (queued.has(key)) return;
    queued.add(key);
    queue.push({ path: key, kind: expectedKind || routeKind(url), from });
  }
  async function collectSitemap(source, depth = 0) {
    const url = new URL(source, siteOrigin || base.origin);
    if (!check(depth < 12, "sitemap recursion exceeds 12 levels", url.pathname)) return;
    if (!check([base.origin, siteOrigin].includes(url.origin), "sitemap points to an unexpected origin", source)) return;
    if (visitedSitemaps.has(url.href)) return;
    visitedSitemaps.add(url.href);
    if (!check(visitedSitemaps.size <= 100, "more than 100 sitemap files; crawl incomplete", source)) return;
    const result = await request(url);
    if (!check(result.response.status === 200, `sitemap HTTP ${result.response.status}`, url.pathname)) return;
    check(/(?:application|text)\/xml/.test(result.response.headers.get("content-type") || ""), "sitemap XML content type", url.pathname);
    const index = /<sitemapindex\b/i.test(result.body);
    check(index || /<urlset\b/i.test(result.body), "sitemap XML root exists", url.pathname);
    for (const match of result.body.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)) {
      const loc = decode(match[1].trim());
      let item;
      try { item = new URL(loc); } catch { check(false, "sitemap loc must be absolute", loc); continue; }
      check(item.origin === siteOrigin, "sitemap loc uses configured public origin", loc);
      if (index) await collectSitemap(item.href, depth + 1);
      else {
        sitemapUrls.add(comparable(item));
        const detected = routeKind(item);
        // New static routes are discovered from the sitemap without changing this test's registry.
        const kind = detected === "unknown" ? "public" : detected;
        check(["public", "post"].includes(kind), "intentional noindex URL must not appear in sitemap", item.pathname + item.search);
        check(item.href === new URL(canonicalPath(item), siteOrigin).href, "sitemap URL is the normalized canonical URL", item.pathname + item.search);
        if (kind !== "reserved") enqueue(item.href, kind, "sitemap");
      }
    }
  }
  async function validatePage(path, kind = routeKind(new URL(path, base)), { fixtureTitle, fixtureBody } = {}) {
    const { response, body, url } = await request(path);
    // Removed member screens may return 404; still validate their noindex policy.
    const expectedStatus = kind === "missing" || kind === "private" && response.status === 404 ? 404 : 200;
    if (!check(response.status === expectedStatus, `expected HTTP ${expectedStatus}, received ${response.status}`, path)) return null;
    check(/text\/html/.test(response.headers.get("content-type") || ""), "HTML content type", path);
    const html = inspectHtml(body);
    if (expectedStatus === 404) {
      const robots = `${html.named("robots").join(",")},${response.headers.get("x-robots-tag") || ""}`.toLowerCase();
      check(/(?:^|[,\s])noindex(?:$|[,\s])/.test(robots), "404 is intentionally noindex", path);
      pages.push({ path, status: response.status, policy: "noindex", title: html.titles[0], canonical: html.canonical[0] });
      return { html, schemas: [], canonical: null, noindex: true };
    }
    check(html.titles.length === 1 && !!html.titles[0], "exactly one nonempty title", path);
    check(html.named("description").length === 1 && !!html.named("description")[0]?.trim(), "exactly one nonempty description", path);
    check(html.headTitles.length === 1 && html.headTitles[0] === html.titles[0], "title is emitted inside the initial HTML head", path);
    check(html.headNamed("description").length === 1 && html.headNamed("description")[0] === html.named("description")[0], "description is emitted inside the initial HTML head", path);
    check(html.html.lang?.toLowerCase() === "ko", 'html lang="ko"', path);
    check(html.h1.length === 1 && !!html.h1[0], "exactly one nonempty server-rendered h1", path);
    check(html.named("viewport").some((value) => /width=device-width/.test(value)), "mobile viewport", path);
    check(html.canonical.length === 1, "exactly one canonical", path);
    check(html.headCanonical.length === 1 && html.headCanonical[0] === html.canonical[0], "canonical is emitted inside the initial HTML head", path);
    let canonical;
    try { canonical = new URL(html.canonical[0]); } catch { check(false, "canonical must be an absolute URL", path); }
    if (canonical) {
      check(canonical.origin === siteOrigin, "canonical uses configured public origin", path);
      check(["http:", "https:"].includes(canonical.protocol), "canonical uses HTTP(S)", path);
      const expected = new URL(canonicalPath(url), siteOrigin).href;
      check(canonical.href === expected, `canonical must equal ${expected}`, path);
    }
    const robots = html.named("robots").join(",").toLowerCase();
    check(!!robots.trim(), "nonempty robots metadata", path);
    check(html.headNamed("robots").some((value) => !!value.trim()), "robots is emitted inside the initial HTML head", path);
    let noindex = config.preview || ["private", "filtered", "demo", "missing"].includes(kind);
    if (kind === "post") {
      const detail = await request(`/api/posts/${encodeURIComponent(url.pathname.split("/").at(-1))}`);
      try {
        const post = JSON.parse(detail.body).post;
        check(detail.response.status === 200 && !!post?.id, "post API readable for visibility policy", path);
        noindex ||= post?.demo === true || post?.status !== "ACTIVE";
      } catch { check(false, "post API readable for visibility policy", path); }
    }
    check(noindex ? /(?:^|[,\s])noindex(?:$|[,\s])/.test(robots) : /(?:^|[,\s])index(?:$|[,\s])/.test(robots) && !robots.includes("noindex"), noindex ? "intentional noindex respected" : "public page is indexable", path);
    const headerRobots = (response.headers.get("x-robots-tag") || "").toLowerCase();
    if (!noindex) check(!headerRobots.includes("noindex") && !headerRobots.includes("none"), "HTTP headers do not block indexing", path);
    for (const name of ["og:title", "og:description", "og:type", "og:url", "og:image", "og:locale", "og:site_name", "twitter:card", "twitter:title", "twitter:description", "twitter:image"]) check(html.headNamed(name).some((value) => !!value.trim()), `${name} metadata exists inside the initial HTML head`, path);
    if (canonical) check(html.named("og:url").some((value) => { try { return comparable(value) === comparable(canonical); } catch { return false; } }), "Open Graph URL matches canonical", path);
    for (const name of ["og:image", "twitter:image"]) for (const value of html.named(name)) {
      try { check(["http:", "https:"].includes(new URL(value).protocol), `${name} is absolute HTTP(S)`, path); } catch { check(false, `${name} is absolute HTTP(S)`, path); }
    }
    check(html.named("og:locale").includes("ko_KR"), "Open Graph locale ko_KR", path);
    check(html.jsonLd.length > 0, "server-rendered JSON-LD exists", path);
    const schemas = [];
    for (const [index, source] of html.jsonLd.entries()) {
      try {
        const parsed = JSON.parse(source);
        schemas.push(...schemaNodes(parsed));
        check(!!parsed && typeof parsed === "object", "JSON-LD document is an object or array", path);
        const roots = Array.isArray(parsed) ? parsed : [parsed];
        check(roots.every((root) => root?.["@context"] === "https://schema.org" || root?.["@context"] === "http://schema.org"), "JSON-LD has a schema.org context", path);
      }
      catch (error) { check(false, `JSON-LD ${index + 1} parses: ${error.message}`, path); }
    }
    const schemaTypes = schemas.flatMap((schema) => Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]]);
    check(schemaTypes.filter((type) => type === "Organization").length === 1, "exactly one Organization JSON-LD", path);
    if (url.pathname === "/") check(schemaTypes.filter((type) => type === "WebSite").length === 1, "homepage has exactly one WebSite JSON-LD", path);
    for (const image of html.images) {
      check(Object.hasOwn(image, "alt"), `image alt attribute: ${image.src || "missing src"}`, path);
      check(!!image.src && !/^javascript:/i.test(image.src), "image has a safe nonempty src", path);
    }
    for (const link of html.links) {
      check(!!link.href && !/^javascript:/i.test(link.href), "anchor has a crawlable safe href", path);
      check(!!(link.text || link["aria-label"] || link.title || link.imageAlt), `link has accessible text: ${link.href || "missing href"}`, path);
    }
    if (fixtureTitle) {
      check(html.titles[0]?.includes(fixtureTitle), "new/edited post title automatically updates metadata", path);
      check(html.h1[0]?.includes(fixtureTitle), "new/edited post title server-rendered", path);
      check(html.named("og:title").some((value) => value.includes(fixtureTitle)), "new/edited post Open Graph title", path);
      check(html.named("twitter:title").some((value) => value.includes(fixtureTitle)), "new/edited post Twitter title", path);
    }
    if (fixtureBody) check(html.named("description")[0]?.includes(fixtureBody), "new/edited body automatically updates description", path);
    if (html.titles[0]?.length > 80) warnings.push(`${path}: title exceeds 80 characters; check display truncation.`);
    if (html.named("description")[0]?.length > 200) warnings.push(`${path}: description exceeds 200 characters; check display truncation.`);
    pages.push({ path, status: response.status, policy: noindex ? "noindex" : "index", title: html.titles[0], canonical: html.canonical[0] });
    return { html, schemas, canonical, noindex };
  }
  async function api(path, method = "GET", body) {
    const result = await request(path, { method, headers: { Cookie: "__sites_local_auth=1", Origin: base.origin, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let data;
    try { data = JSON.parse(result.body); } catch { throw new Error(`${method} ${path}: non-JSON HTTP ${result.response.status}`); }
    if (!result.response.ok) throw new Error(`${method} ${path}: HTTP ${result.response.status} ${data.error || ""}`);
    return data;
  }
  async function sitemapSnapshot(source = "/sitemap.xml", seen = new Set(), depth = 0) {
    if (depth > 12 || seen.size >= 100) throw new Error("Fixture sitemap crawl limit reached; snapshot incomplete.");
    const url = new URL(source, siteOrigin);
    if (![siteOrigin, base.origin].includes(url.origin)) throw new Error("Unexpected fixture sitemap origin.");
    if (seen.has(url.href)) return new Map();
    seen.add(url.href);
    const result = await request(url);
    if (result.response.status !== 200) throw new Error(`Sitemap snapshot HTTP ${result.response.status}`);
    const entries = new Map();
    if (/<sitemapindex\b/i.test(result.body)) {
      for (const match of result.body.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)) {
        for (const [loc, lastmod] of await sitemapSnapshot(decode(match[1].trim()), seen, depth + 1)) entries.set(loc, lastmod);
      }
    } else for (const match of result.body.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)) {
      const loc = match[1].match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i)?.[1];
      const lastmod = match[1].match(/<lastmod\b[^>]*>([\s\S]*?)<\/lastmod>/i)?.[1];
      if (loc) entries.set(comparable(decode(loc.trim())), lastmod ? decode(lastmod.trim()) : null);
    }
    return entries;
  }
  async function lighthouse(path, kind) {
    const root = fileURLToPath(new URL("../", import.meta.url));
    const output = resolve(root, "outputs", `seo-fixture-${kind}.json`);
    await mkdir(resolve(root, "outputs"), { recursive: true });
    const cli = fileURLToPath(new URL("../node_modules/lighthouse/cli/index.js", import.meta.url));
    const child = spawnSync(process.execPath, [cli, new URL(path, base).href, "--only-categories=seo", "--output=json", `--output-path=${output}`, "--chrome-flags=--headless=new", "--quiet"], { cwd: root, shell: false, encoding: "utf8", timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
    if (!check(child.status === 0 && !child.error, `Lighthouse exited successfully: ${child.error?.message || child.stderr || child.status}`, path)) return;
    const report = JSON.parse(await readFile(output, "utf8"));
    const failed = (report.categories?.seo?.auditRefs || []).map((ref) => [ref.id, report.audits?.[ref.id]]).filter(([, audit]) => audit?.score !== null && audit?.score !== 1).map(([id, audit]) => `${id}: ${audit?.explanation || audit?.title || "failed"}`);
    check(report.categories?.seo?.score === 1, `Lighthouse SEO must be 100, received ${Math.round((report.categories?.seo?.score || 0) * 100)}; ${failed.join("; ")} (report: ${output})`, path);
  }
  async function fixtures() {
    if (!LOOPBACK.has(base.hostname)) throw new Error("--fixture is restricted to loopback previews; no hosted records will be changed.");
    const created = [];
    const stamp = Date.now().toString(36);
    try {
      const me = await api("/api/me");
      if (me.user?.userId !== "local_seedy") throw new Error("Fixture requires the built-in local_seedy preview session.");
      if (!me.profile) await api("/api/profile", "POST", { nickname: `SEO검증${stamp}`, region: "서울" });
      for (const [kind, category, type, section] of [["listing", "NORMAL", "SELL", "pc-room"], ["market", "PC", "SELL", "market"], ["job", "HIRE", "HIRE", "job"], ["board", "FREE", "POST", "board/FREE"]]) {
        const title = `SEO 자동 생성 확인 ${kind} ${stamp}`;
        const body = `신규 게시글 본문 자동 설명 확인 ${kind} ${stamp}`;
        const result = await api("/api/posts", "POST", { kind, category, type, title, body, region: "서울", district: "강남구", price: 100, seats: kind === "listing" ? 10 : null, images: [] });
        const path = `/${section}/${result.post.id}`;
        created.push({ id: result.post.id, path });
        fixtureCount++;
        const page = await validatePage(path, "post", { fixtureTitle: title, fixtureBody: body });
        check(page?.schemas.some((schema) => JSON.stringify(schema).includes(title)), "new post has content-specific JSON-LD", path);
        const canonical = comparable(new URL(path, siteOrigin));
        const sitemap = await sitemapSnapshot();
        check(config.preview ? !sitemap.has(canonical) : sitemap.has(canonical), config.preview ? "preview sitemap excludes new post" : "new post automatically enters sitemap", path);
        if (config.lighthouse) await lighthouse(path, kind);
        const updatedTitle = `SEO 수정 반영 확인 ${kind} ${stamp}`;
        const updatedBody = `수정된 게시글 본문 설명 확인 ${kind} ${stamp}`;
        const updated = await api(`/api/posts/${result.post.id}`, "PATCH", { title: updatedTitle, body: updatedBody });
        await validatePage(path, "post", { fixtureTitle: updatedTitle, fixtureBody: updatedBody });
        if (!config.preview) {
          const revised = await sitemapSnapshot();
          check(Date.parse(revised.get(canonical)) >= Date.parse(updated.post.updatedAt) - 1000, "edited post automatically refreshes sitemap lastmod", path);
        }
      }
    } finally {
      for (const item of created.reverse()) {
        try {
          await api(`/api/posts/${item.id}`, "DELETE");
          const sitemap = await sitemapSnapshot();
          check(!sitemap.has(comparable(new URL(item.path, siteOrigin))), "hidden fixture removed from sitemap", item.path);
          await validatePage(item.path, "missing");
        } catch (error) { check(false, `fixture cleanup failed for ${item.id}: ${error.message}`, item.path); }
      }
    }
  }
  try {
    const robots = await request("/robots.txt");
    check(robots.response.status === 200, "robots HTTP 200", "/robots.txt");
    check(/text\/plain/.test(robots.response.headers.get("content-type") || ""), "robots text content type", "/robots.txt");
    check(/User-agent:\s*\*/i.test(robots.body), "robots wildcard user agent", "/robots.txt");
    const sitemapSources = [...robots.body.matchAll(/^Sitemap:\s*(\S+)/gim)].map((match) => match[1]);
    check(sitemapSources.length > 0, "robots declares sitemap", "/robots.txt");
    if (!siteOrigin) siteOrigin = sitemapSources.length ? new URL(sitemapSources[0]).origin : base.origin;
    check(config.preview ? /^Disallow:\s*\/\s*$/m.test(robots.body) : !/^Disallow:\s*\/\s*$/m.test(robots.body), config.preview ? "preview robots blocks whole site" : "public robots does not block whole site", "/robots.txt");
    for (const source of sitemapSources.length ? sitemapSources : [new URL("/sitemap.xml", siteOrigin).href]) await collectSitemap(source);
    if (!config.preview) for (const path of PUBLIC) check(sitemapUrls.has(comparable(new URL(path, siteOrigin))), "public route present in sitemap", path);
    else check(sitemapUrls.size === 0, "preview sitemap contains no indexable pages", "/sitemap.xml");
    for (const path of PUBLIC) enqueue(path, "public", "required");
    const variants = ["/pc-room?type=SELL", "/pc-room?type=BUY", "/pc-room?type=SELL&category=NORMAL", "/pc-room?type=BUY&category=ADULT", "/market?category=PC", "/market?category=MONITOR", "/job?type=HIRE", "/job?type=RESUME", "/pc-room?page=1", "/pc-room?sort=latest"];
    for (const path of config.smoke ? variants.slice(-2) : variants) enqueue(path, "public", "required query");
    enqueue('/?filter=ALL&filter=ADULT_SELL', 'public', 'repeated query regression');
    enqueue('/pc-room?q=first&q=second', 'filtered', 'repeated query regression');
    for (const path of PRIVATE) enqueue(path, "private", "intentional noindex");
    for (const path of ["/pc-room?q=SEO", "/pc-room?region=서울", "/pc-room?sort=popular", "/pc-room/sample-seoul", "/missing-route-for-seo-check"]) enqueue(path, path.includes("missing-route") ? "missing" : routeKind(new URL(path, base)), "intentional noindex");
    let cursor = 0;
    while (cursor < queue.length) {
      if (!check(cursor < config.maxPages, `crawl exceeds --max-pages=${config.maxPages}; ${queue.length - cursor} queued URLs remain (not a pass)`, "crawl")) break;
      const item = queue[cursor++];
      try {
        const result = await validatePage(item.path, item.kind);
        if (!result || config.smoke || !["public", "post", "unknown"].includes(item.kind) || result.noindex) continue;
        for (const link of result.html.links) {
          if (!link.href || /^(?:#|mailto:|tel:|javascript:)/i.test(link.href)) continue;
          let url;
          try { url = new URL(link.href, new URL(item.path, siteOrigin)); } catch { check(false, `invalid linked URL: ${link.href}`, item.path); continue; }
          if (![base.origin, siteOrigin].includes(url.origin)) continue;
          if (/^\/(?:api|signin-with-chatgpt|signout-with-chatgpt|callback)(?:\/|$)/.test(url.pathname) || /\.(?:avif|gif|ico|jpe?g|png|svg|webp|css|js|mjs|txt|xml|pdf)$/i.test(url.pathname)) continue;
          const kind = routeKind(url);
          if (["public", "post", "demo", "unknown"].includes(kind)) enqueue(url.href, kind, item.path);
        }
      } catch (error) { check(false, error.message, item.path); }
    }
    if (config.fixture) await fixtures();
  } catch (error) { check(false, error.message, "run"); }
  return { passed: failures.length === 0, mode: config.preview ? "preview" : "public", base: base.origin, siteOrigin, requests, assertions, pages: pages.length, sitemapUrls: sitemapUrls.size, fixtures: fixtureCount, failures, warnings: [...new Set(warnings)], results: pages };
}

export function reportSeoCheck(result, json = false) {
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`SEO ${result.passed ? "PASS" : "FAIL"} (${result.mode}): ${result.pages} pages, ${result.assertions} assertions, ${result.sitemapUrls} sitemap URLs, ${result.fixtures} temporary posts.`);
    console.log(`Requested: ${result.base} | Canonical origin: ${result.siteOrigin}`);
    for (const failure of result.failures) console.error(`FAIL ${failure}`);
    for (const warning of result.warnings) console.warn(`NOTE ${warning}`);
  }
  if (!result.passed) process.exitCode = 1;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { const options = parseOptions(); reportSeoCheck(await runSeoCheck(options), options.json); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

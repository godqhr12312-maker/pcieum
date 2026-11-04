/** HTTP policy for the application Worker. Static assets use public/_headers. */
export const HTML_EDGE_TTL = 300;
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
export const HTML_BROWSER_CACHE_CONTROL = 'public, max-age=0, must-revalidate';
const PRIVATE_CACHE_CONTROL = 'private, no-store';
const MAX_HTML_BYTES = 1_048_576;
const TEMPLATE_NONCE_HEADER = 'X-PCIEUM-Template-Nonce';

export type HtmlCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};
export type HtmlCacheStorage = { open(name: string): Promise<HtmlCache> };

/** Workers for Platforms disables caches.default; named caches are isolated. */
export async function openPublicHtmlCache(storage: HtmlCacheStorage): Promise<HtmlCache | undefined> {
  try { return await storage.open('pcieum-public-html-v1'); }
  catch { return undefined; }
}

export type HttpPolicyOptions = {
  development?: boolean;
  siteOrigin: string;
  publicPaths: readonly string[];
  memberFeaturesEnabled: boolean;
  hasRequestCapabilities?: boolean;
  buildId?: string;
  cache?: HtmlCache;
  waitUntil?: (task: Promise<unknown>) => void;
};

export function canonicalRedirectUrl(request: Request): string | null {
  const url = new URL(request.url);
  if (!['pcieum.com', 'www.pcieum.com'].includes(url.hostname)) return null;
  if (url.protocol === 'https:' && url.hostname === 'pcieum.com' && !url.port) return null;
  url.protocol = 'https:';
  url.hostname = 'pcieum.com';
  url.port = '';
  return url.href;
}

export function createNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
}

export function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'", `script-src 'self' 'nonce-${nonce}'`, "script-src-attr 'none'",
    // React styles and the mini-game use inline style attributes; scripts do not.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com", "connect-src 'self'", "object-src 'none'",
    "base-uri 'self'", "form-action 'self'",
    "frame-src 'self' https://challenges.cloudflare.com",
    // Sites can be previewed inside ChatGPT; do not allow arbitrary Sites tenants.
    "frame-ancestors 'self' https://chatgpt.com https://chat.openai.com",
    'upgrade-insecure-requests',
  ].join('; ');
}

function secureHeaders(headers: Headers, request: Request, development: boolean, nonce?: string) {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()');
  // No preload/includeSubDomains: other future subdomains have not been audited.
  if (!development && new URL(request.url).protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000');
  }
  if (!development) {
    // Preserve the stricter sandbox CSP used by uploaded image responses.
    if (nonce || !headers.has('Content-Security-Policy')) {
      headers.set('Content-Security-Policy', nonce ? contentSecurityPolicy(nonce) : "default-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'");
    }
  }
}

export function isPublicHtmlRequest(request: Request, options: HttpPolicyOptions): boolean {
  const url = new URL(request.url);
  if (options.development || options.memberFeaturesEnabled || options.hasRequestCapabilities || !options.buildId) return false;
  if (url.origin !== options.siteOrigin || url.protocol !== 'https:' || url.hostname !== 'pcieum.com') return false;
  if (request.headers.has('host') && request.headers.get('host') !== url.host) return false;
  if (!['GET', 'HEAD'].includes(request.method) || url.search || !options.publicPaths.includes(url.pathname)) return false;
  const accept = request.headers.get('accept') ?? '';
  if (accept && !accept.includes('text/html') && accept !== '*/*') return false;
  for (const [name] of request.headers) {
    if (/^(?:oai-|x-oai-|x-openai-|x-sites-|cf-access-|x-auth-|x-user-|x-middleware-|x-vinext-|next-|rsc(?:$|-))/.test(name)) return false;
    if (['cookie', 'authorization', 'proxy-authorization', 'range', 'if-range', 'if-none-match', 'if-modified-since',
      'forwarded', 'x-forwarded-host', 'x-original-url', 'x-rewrite-url', 'content-security-policy',
      'content-security-policy-report-only', 'x-nonce', 'x-csp-nonce'].includes(name)) return false;
  }
  if (/no-cache|no-store|max-age\s*=\s*0/i.test(request.headers.get('cache-control') ?? '') || /no-cache/i.test(request.headers.get('pragma') ?? '')) return false;
  if (/prefetch/i.test(`${request.headers.get('purpose') ?? ''} ${request.headers.get('sec-purpose') ?? ''}`)) return false;
  return true;
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

export function isPublicHtmlResponse(response: Response, html: string, request: Request): boolean {
  if (response.status !== 200 || !/^text\/html(?:;|$)/i.test(response.headers.get('content-type') ?? '')) return false;
  if (response.headers.has('set-cookie') || response.headers.has('location') || response.headers.has('www-authenticate')) return false;
  if (/\bprivate\b/i.test(response.headers.get('cache-control') ?? '') || /\b(?:noindex|none)\b/i.test(response.headers.get('x-robots-tag') ?? '')) return false;
  const allowedVary = /^(?:accept-encoding|rsc|next-router-state-tree|next-router-prefetch|next-router-segment-prefetch|next-url|x-vinext-interception-context|x-vinext-mounted-slots|x-vinext-rsc-render-mode)$/i;
  if ((response.headers.get('vary') ?? '').split(',').some(value => value.trim() && !allowedVary.test(value.trim()))) return false;
  // Only actual head tags count; embedded RSC strings must not make a page cacheable.
  const head = html.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head\s*>/i)?.[1]
    .replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '') ?? '';
  const meta = [...head.matchAll(/<meta\s[^>]*>/gi)].map(match => match[0]);
  for (const name of ['robots', 'googlebot']) {
    const values = meta.filter(tag => attribute(tag, 'name')?.toLowerCase() === name).map(tag => attribute(tag, 'content') ?? '');
    if (values.length !== 1 || !/\bindex\b/i.test(values[0]) || /\b(?:noindex|none)\b/i.test(values[0])) return false;
  }
  const canonical = [...head.matchAll(/<link\s[^>]*>/gi)].map(match => match[0]).filter(tag => attribute(tag, 'rel') === 'canonical');
  if (canonical.length !== 1) return false;
  try { return new URL(attribute(canonical[0], 'href') ?? '').href === new URL(request.url).href; }
  catch { return false; }
}

/** Read at most 1 MiB. Oversized HTML continues streaming and is never cached. */
async function readBoundedHtml(response: Response): Promise<{ html?: string; response: Response }> {
  if (!response.body) return { response };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) {
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return { html: new TextDecoder().decode(bytes), response };
    }
    chunks.push(result.value);
    length += result.value.byteLength;
    if (length > MAX_HTML_BYTES) {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) { for (const chunk of chunks) controller.enqueue(chunk); },
        async pull(controller) { const next = await reader.read(); if (next.done) controller.close(); else controller.enqueue(next.value); },
        cancel(reason) { return reader.cancel(reason); },
      });
      return { response: new Response(stream, response) };
    }
  }
}

function removeBodyValidators(headers: Headers) {
  for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified', 'Content-MD5', 'Digest', 'Age', TEMPLATE_NONCE_HEADER]) headers.delete(name);
}

function prohibitOuterCache(headers: Headers) {
  // The Cache API below owns the 300-second TTL. A shared outer cache must never
  // reuse a response nonce or bypass our Cookie/identity/RSC eligibility checks.
  headers.set('CDN-Cache-Control', 'no-store');
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
}

function htmlResponse(html: string, template: Response, templateNonce: string, request: Request, state: 'HIT' | 'MISS'): Response {
  const nonce = createNonce();
  const headers = new Headers(template.headers);
  removeBodyValidators(headers);
  headers.set('Cache-Control', HTML_BROWSER_CACHE_CONTROL);
  prohibitOuterCache(headers);
  headers.set('X-PCIEUM-Cache', state);
  headers.set('Vary', [...new Set([...(headers.get('vary') ?? '').split(',').map(value => value.trim()).filter(Boolean), 'Cookie', 'Authorization', 'OAI-Authenticated-User-Id'])].join(', '));
  secureHeaders(headers, request, false, nonce);
  // Vinext propagates the request nonce through SSR scripts and RSC payloads.
  // Replace all copies together so hydration and next/script keep the fresh nonce.
  return new Response(request.method === 'HEAD' ? null : html.replaceAll(templateNonce, nonce), { status: 200, headers });
}

export async function withHttpPolicy(request: Request, render: (request: Request) => Promise<Response>, options: HttpPolicyOptions): Promise<Response> {
  const development = Boolean(options.development);
  const redirect = !development && canonicalRedirectUrl(request);
  if (redirect) {
    const headers = new Headers({ Location: redirect, 'Cache-Control': 'no-store', 'X-PCIEUM-Cache': 'BYPASS' });
    prohibitOuterCache(headers);
    secureHeaders(headers, request, development);
    return new Response(null, { status: 308, headers });
  }
  const eligible = isPublicHtmlRequest(request, options);
  const cacheKey = eligible && options.cache ? new Request(`${options.siteOrigin}/.pcieum-html-cache/${encodeURIComponent(options.buildId!)}${new URL(request.url).pathname}`) : null;
  if (cacheKey && options.cache) {
    try {
      const cached = await options.cache.match(cacheKey);
      const templateNonce = cached?.headers.get(TEMPLATE_NONCE_HEADER);
      if (cached && templateNonce && /^[A-Za-z0-9+/]{32}$/.test(templateNonce)) {
        const html = await cached.text();
        return htmlResponse(html, cached, templateNonce, request, 'HIT');
      }
    } catch { /* Cache availability never controls site availability. */ }
  }

  const renderNonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  if (!development) {
    // Do not trust a caller-supplied CSP/nonce: Vinext reads these request headers.
    requestHeaders.set('Content-Security-Policy', contentSecurityPolicy(renderNonce));
    requestHeaders.delete('Content-Security-Policy-Report-Only');
    requestHeaders.delete('x-nonce');
    requestHeaders.delete('x-csp-nonce');
  }
  let response = await render(new Request(request, { headers: requestHeaders }));
  const isHtml = /^text\/html(?:;|$)/i.test(response.headers.get('content-type') ?? '');
  if (eligible && request.method === 'GET' && isHtml) {
    const read = await readBoundedHtml(response);
    response = read.response;
    if (read.html !== undefined) {
      if (isPublicHtmlResponse(response, read.html, request)) {
        if (cacheKey && options.cache) {
          const headers = new Headers(response.headers);
          removeBodyValidators(headers);
          headers.delete('Content-Security-Policy');
          headers.delete('CDN-Cache-Control');
          headers.delete('Cloudflare-CDN-Cache-Control');
          headers.set('Cache-Control', `public, max-age=${HTML_EDGE_TTL}`);
          headers.set(TEMPLATE_NONCE_HEADER, renderNonce);
          const task = options.cache.put(cacheKey, new Response(read.html, { status: 200, headers })).catch(() => undefined);
          if (options.waitUntil) options.waitUntil(task); else await task;
        }
        return htmlResponse(read.html, response, renderNonce, request, 'MISS');
      }
      response = new Response(read.html, response);
    }
  }
  const headers = new Headers(response.headers);
  secureHeaders(headers, request, development, isHtml && !development ? renderNonce : undefined);
  headers.delete(TEMPLATE_NONCE_HEADER);
  headers.set('X-PCIEUM-Cache', 'BYPASS');
  // Preserve only safe immutable asset caching; APIs and all other variants stay
  // private. Assets normally bypass the Worker and get this from _headers.
  if (!development && ['GET', 'HEAD'].includes(request.method) && response.status === 200 && !headers.has('set-cookie') && !isHtml && /^\/_next\/static\/(?:chunks|css|media)\/.+[.-][A-Za-z0-9_-]{8}\.[a-z0-9.]+$/i.test(new URL(request.url).pathname)) {
    headers.set('Cache-Control', IMMUTABLE_CACHE_CONTROL);
  } else {
    headers.set('Cache-Control', PRIVATE_CACHE_CONTROL);
    prohibitOuterCache(headers);
  }
  return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, statusText: response.statusText, headers });
}

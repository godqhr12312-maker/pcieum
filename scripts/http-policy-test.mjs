// Run with Node >= 22.18: node --test scripts/http-policy-test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  withHttpPolicy, isPublicHtmlRequest, canonicalRedirectUrl, HTML_EDGE_TTL,
  HTML_BROWSER_CACHE_CONTROL, IMMUTABLE_CACHE_CONTROL,
} from '../lib/http-policy.ts';

const origin = 'https://pcieum.com';
const settings = {
  siteOrigin: origin, publicPaths: ['/', '/market', '/pc-room', '/board/NOTICE'],
  memberFeaturesEnabled: false, buildId: 'test-build-1',
};
const req = (path = '/', headers = {}, method = 'GET') => new Request(new URL(path, origin), { method, headers });
const nonceOf = headers => headers.get('content-security-policy')?.match(/'nonce-([^']+)'/)?.[1];
function mockCache() {
  const entries = new Map();
  return {
    entries, matches: 0, puts: 0,
    async match(request) { this.matches++; return entries.get(request.url)?.clone(); },
    async put(request, response) { this.puts++; entries.set(request.url, response.clone()); },
  };
}
function renderer({ status = 200, robots = 'index, follow', extraHeaders = {}, extraHead = '', bodySize = 0 } = {}) {
  let calls = 0;
  const render = async request => {
    calls++;
    const nonce = nonceOf(request.headers);
    const html = `<!doctype html><html><head><meta name="robots" content="${robots}"><meta name="googlebot" content="${robots}"><link rel="canonical" href="${request.url}">${extraHead}</head><body><p>USER_SENTINEL</p><script nonce="${nonce}">globalThis.nonceFromRsc = "${nonce}";</script>${'x'.repeat(bodySize)}</body></html>`;
    return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store, must-revalidate', Vary: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch', ...extraHeaders } });
  };
  return { render, calls: () => calls };
}

test('anonymous HTML MISS -> HIT, 300-second internal TTL, fresh CSP nonce and hydration payload', async () => {
  const cache = mockCache();
  const app = renderer();
  const options = { ...settings, cache };
  const first = await withHttpPolicy(req(), app.render, options);
  const firstBody = await first.text();
  const second = await withHttpPolicy(req(), app.render, options);
  const secondBody = await second.text();
  assert.equal(first.headers.get('x-pcieum-cache'), 'MISS');
  assert.equal(second.headers.get('x-pcieum-cache'), 'HIT');
  assert.equal(app.calls(), 1);
  assert.equal(cache.puts, 1);
  const stored = [...cache.entries.values()][0];
  const internalNonce = stored.headers.get('x-pcieum-template-nonce');
  assert.equal(stored.headers.get('cache-control'), `public, max-age=${HTML_EDGE_TTL}`);
  assert.equal(stored.headers.get('content-security-policy'), null);
  assert.notEqual(nonceOf(first.headers), nonceOf(second.headers));
  for (const [response, html] of [[first, firstBody], [second, secondBody]]) {
    const nonce = nonceOf(response.headers);
    assert.match(nonce, /^[A-Za-z0-9+/]{32}$/);
    assert.notEqual(nonce, internalNonce);
    assert.ok(!html.includes(internalNonce));
    assert.ok(html.includes(`nonce="${nonce}"`));
    assert.ok(html.includes(`globalThis.nonceFromRsc = "${nonce}"`));
    assert.ok(html.includes('USER_SENTINEL'));
    assert.equal(response.headers.get('x-pcieum-template-nonce'), null);
    assert.equal(response.headers.get('cache-control'), HTML_BROWSER_CACHE_CONTROL);
    assert.equal(response.headers.get('cdn-cache-control'), 'no-store');
    assert.equal(response.headers.get('cloudflare-cdn-cache-control'), 'no-store');
    assert.match(response.headers.get('vary'), /RSC/);
    assert.match(response.headers.get('vary'), /Cookie/);
  }
});

test('HEAD can reuse a GET template without returning or overwriting its body', async () => {
  const cache = mockCache();
  const app = renderer();
  await withHttpPolicy(req(), app.render, { ...settings, cache });
  const response = await withHttpPolicy(req('/', {}, 'HEAD'), app.render, { ...settings, cache });
  assert.equal(response.headers.get('x-pcieum-cache'), 'HIT');
  assert.equal(await response.text(), '');
  assert.equal(app.calls(), 1);
  assert.equal(cache.puts, 1);
});

test('cache entries are isolated by build ID', async () => {
  const cache = mockCache();
  const app = renderer();
  await withHttpPolicy(req(), app.render, { ...settings, cache });
  const response = await withHttpPolicy(req(), app.render, { ...settings, cache, buildId: 'test-build-2' });
  assert.equal(response.headers.get('x-pcieum-cache'), 'MISS');
  assert.equal(app.calls(), 2);
});

const excludedHeaders = [
  ['cookie', 'session=secret'], ['cookie', '__cf_bm=bot-cookie'], ['authorization', 'Bearer fake'],
  ['proxy-authorization', 'Basic fake'], ['oai-authenticated-user-id', 'spoofed'],
  ['oai-authenticated-user-email', 'spoof@example.test'], ['oai-sites-authorization', 'Bearer fake'],
  ['x-openai-user', 'spoofed'], ['x-sites-auth', 'spoofed'], ['cf-access-jwt-assertion', 'fake'],
  ['x-auth-user', 'spoofed'], ['x-user-id', 'spoofed'], ['rsc', '1'],
  ['next-router-state-tree', 'fake'], ['next-router-prefetch', '1'], ['next-action', 'fake'],
  ['x-vinext-rsc-render-mode', 'fake'], ['x-middleware-subrequest', 'fake'],
  ['range', 'bytes=0-10'], ['if-none-match', 'fake'], ['if-modified-since', 'yesterday'],
  ['forwarded', 'host=evil.test'], ['x-forwarded-host', 'evil.test'], ['x-original-url', '/admin'],
  ['x-rewrite-url', '/api/me'], ['content-security-policy', "script-src 'nonce-attacker'"],
  ['content-security-policy-report-only', "script-src 'nonce-attacker'"], ['x-nonce', 'attacker'],
  ['x-csp-nonce', 'attacker'], ['host', 'evil.test'], ['cache-control', 'no-cache'], ['pragma', 'no-cache'],
  ['purpose', 'prefetch'], ['sec-purpose', 'prefetch'], ['accept', 'text/x-component'],
];
for (const [header, value] of excludedHeaders) {
  test(`request with ${header} cannot read or fill the public cache`, async () => {
    const cache = mockCache();
    const app = renderer();
    const response = await withHttpPolicy(req('/', { [header]: value }), app.render, { ...settings, cache });
    assert.equal(cache.matches, 0);
    assert.equal(cache.puts, 0);
    assert.equal(response.headers.get('x-pcieum-cache'), 'BYPASS');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.notEqual(nonceOf(response.headers), 'attacker');
  });
}

for (const path of ['/admin', '/join', '/write', '/mypage', '/api/me', '/api/posts', '/api/media/test.png', '/missing',
  '/market?type=BUY', '/market?region=서울', '/market?q=test', '/market?page=1', '/market?page=2',
  '/market?sort=latest', '/market?_rsc=123', '/market?type=BUY&type=SELL', '/?utm_source=test', '/market/file.css']) {
  test(`route/query ${path} bypasses HTML cache`, () => {
    assert.equal(isPublicHtmlRequest(req(path), settings), false);
  });
}

for (const [label, options] of [
  ['development', { development: true }], ['member features enabled', { memberFeaturesEnabled: true }],
  ['request connector capability', { hasRequestCapabilities: true }], ['missing build id', { buildId: undefined }],
]) {
  test(`${label} disables shared HTML caching`, () => assert.equal(isPublicHtmlRequest(req(), { ...settings, ...options }), false));
}

test('temporary/foreign hosts and non-read methods are never cache candidates', () => {
  for (const url of ['http://localhost:51694/', 'https://pc-ium-community.godqhr12312.chatgpt.site/', 'https://evil.test/']) {
    assert.equal(isPublicHtmlRequest(new Request(url), settings), false);
  }
  for (const method of ['POST', 'PATCH', 'DELETE', 'OPTIONS']) assert.equal(isPublicHtmlRequest(req('/', {}, method), settings), false);
});

for (const [label, config] of [
  ['Set-Cookie', { extraHeaders: { 'Set-Cookie': 'session=secret' } }],
  ['private response', { extraHeaders: { 'Cache-Control': 'private, no-store' } }],
  ['X-Robots-Tag', { extraHeaders: { 'X-Robots-Tag': 'noindex' } }],
  ['unknown Vary', { extraHeaders: { Vary: 'User-Agent' } }], ['Vary wildcard', { extraHeaders: { Vary: '*' } }],
  ['noindex metadata', { robots: 'noindex, follow' }], ['404', { status: 404 }], ['500', { status: 500 }],
  ['conflicting metadata', { extraHead: '<meta name="robots" content="noindex">' }],
  ['oversized HTML', { bodySize: 1_048_577 }],
]) {
  test(`${label} response is never stored`, async () => {
    const cache = mockCache();
    const response = await withHttpPolicy(req(), renderer(config).render, { ...settings, cache });
    assert.equal(cache.puts, 0);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('x-pcieum-cache'), 'BYPASS');
    assert.ok((await response.text()).includes('USER_SENTINEL'));
  });
}

test('security headers preserve hydration, Google Fonts, uploads and narrow Sites framing', async () => {
  const response = await withHttpPolicy(req(), renderer().render, settings);
  const csp = response.headers.get('content-security-policy');
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.match(response.headers.get('permissions-policy'), /camera=\(\).*microphone=\(\)/);
  assert.ok(!csp.match(/script-src[^;]*(?:unsafe-inline|unsafe-eval)/));
  assert.match(csp, /style-src[^;]*fonts.googleapis.com/);
  assert.match(csp, /font-src[^;]*fonts.gstatic.com/);
  assert.match(csp, /img-src 'self' data: blob: https:/);
  assert.match(csp, /frame-ancestors 'self' https:\/\/chatgpt.com https:\/\/chat.openai.com/);
});

test('existing upload sandbox CSP remains strict; JSON API stays private', async () => {
  const response = await withHttpPolicy(req('/api/media/test.png'), async () => new Response('image', { headers: {
    'Content-Type': 'image/png', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Cache-Control': 'public, max-age=86400',
  } }), settings);
  assert.equal(response.headers.get('content-security-policy'), "default-src 'none'; sandbox");
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('HTTP and www use 308 with exact path/query, ignoring spoofed forwarded host', async () => {
  const pairs = [
    ['http://pcieum.com/market?type=BUY&region=%EC%84%9C%EC%9A%B8', 'https://pcieum.com/market?type=BUY&region=%EC%84%9C%EC%9A%B8'],
    ['https://www.pcieum.com/board/NOTICE?page=1', 'https://pcieum.com/board/NOTICE?page=1'],
    ['http://www.pcieum.com/market?category=PC', 'https://pcieum.com/market?category=PC'],
  ];
  for (const [from, to] of pairs) {
    const request = new Request(from, { headers: { 'x-forwarded-host': 'evil.test' } });
    assert.equal(canonicalRedirectUrl(request), to);
    const response = await withHttpPolicy(request, async () => { throw new Error('Redirect must not render'); }, settings);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), to);
  }
  assert.equal(canonicalRedirectUrl(req()), null);
  assert.equal(canonicalRedirectUrl(new Request('http://localhost:51694/')), null);
});

test('cache failures fall back to render; dev remains HMR-compatible and uncached', async () => {
  const brokenCache = { match: async () => { throw new Error('unavailable'); }, put: async () => { throw new Error('unavailable'); } };
  const response = await withHttpPolicy(req(), renderer().render, { ...settings, cache: brokenCache });
  assert.equal(response.status, 200);
  const dev = await withHttpPolicy(new Request('http://localhost:51694/'), renderer().render, { ...settings, development: true });
  assert.equal(dev.headers.get('content-security-policy'), null);
  assert.equal(dev.headers.get('strict-transport-security'), null);
  assert.equal(dev.headers.get('cache-control'), 'private, no-store');
});

test('static asset manifest grants immutable caching only to reserved build output and the hashed hero', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  assert.ok(headers.includes(`/_next/static/*\n  Cache-Control: ${IMMUTABLE_CACHE_CONTROL}`));
  assert.ok(headers.includes(`/hero.93b030a133d9.jpg\n  Cache-Control: ${IMMUTABLE_CACHE_CONTROL}`));
  assert.ok(headers.includes('/hero.jpg\n  Cache-Control: public, max-age=0, must-revalidate'));
  assert.ok(!headers.includes(`\n/*\n  Cache-Control: ${IMMUTABLE_CACHE_CONTROL}`));
});

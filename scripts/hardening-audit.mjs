import { writeFile, mkdir } from 'node:fs/promises';
import { inspectHtml } from './seo-check.mjs';

const base = process.argv[2] || 'https://pcieum.com';
const checks = [], responses = [], pending = [];
const check = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
async function get(path, init = {}) {
  const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(20000), ...init });
  const headers = Object.fromEntries([...response.headers].filter(([key]) => !['set-cookie', 'report-to', 'nel'].includes(key)));
  const binary = /image\//.test(headers['content-type'] || '');
  const body = binary ? '' : await response.text();
  if (binary) await response.arrayBuffer();
  responses.push({ path, status: response.status, headers });
  return { status: response.status, headers, body };
}

const first = await get('/');
const second = await get('/');
check('homepage HTTP 200', first.status === 200);
for (const key of ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy']) check(`security header: ${key}`, first.headers[key], first.headers[key]);
const firstNonce = first.headers['content-security-policy']?.match(/'nonce-([^']+)'/)?.[1];
const secondNonce = second.headers['content-security-policy']?.match(/'nonce-([^']+)'/)?.[1];
check('fresh CSP nonce for each response', firstNonce && secondNonce && firstNonce !== secondNonce);
check('scripts do not allow unsafe-inline/eval', !/script-src[^;]*(?:unsafe-inline|unsafe-eval)/.test(first.headers['content-security-policy'] || ''));
check('anonymous public HTML edge cache hit', second.headers['x-pcieum-cache'] === 'HIT', second.headers['x-pcieum-cache']);
check('browser HTML uses revalidation', /max-age=0/.test(first.headers['cache-control'] || '') && !/no-store/.test(first.headers['cache-control'] || ''), first.headers['cache-control']);
const privateResponse = await get('/', { headers: { Cookie: 'audit=1' } });
check('cookie request bypasses public cache', privateResponse.headers['x-pcieum-cache'] === 'BYPASS', privateResponse.headers['x-pcieum-cache']);
const rsc = await get('/', { headers: { RSC: '1' } });
check('RSC request bypasses HTML cache', rsc.headers['x-pcieum-cache'] === 'BYPASS', rsc.headers['x-pcieum-cache']);
const user = await get('/api/me');
check('account API is not cached', /no-store/.test(user.headers['cache-control'] || ''), user.headers['cache-control']);

const parsed = inspectHtml(first.body);
const graph = parsed.jsonLd.flatMap(source => { const json = JSON.parse(source); return json['@graph'] || [json]; });
const organization = graph.find(item => item['@type'] === 'Organization');
const website = graph.find(item => item['@type'] === 'WebSite');
const page = graph.find(item => item['@type'] === 'WebPage');
check('WebSite publisher links to Organization', website?.publisher?.['@id'] === organization?.['@id']);
check('WebPage links to WebSite', page?.isPartOf?.['@id'] === website?.['@id']);
check('PNG logo dimensions are sufficient', organization?.logo?.url?.endsWith('/logo.png') && organization.logo.width >= 112 && organization.logo.height >= 112);
check('hero img has alt, dimensions and fetchpriority', parsed.images.some(img => /hero\.[a-f0-9]+\.jpg/.test(img.src) && img.alt && img.width === '1672' && img.height === '941' && img.fetchpriority === 'high'));
const mainText = parsed.markup.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
check('visible homepage guidance is substantive', mainText.length >= 1500, { characters: mainText.length });

const css = first.body.match(/href="([^"?]+-[a-z0-9_-]+\.css)(?:\?[^"]*)?"/i)?.[1];
check('hashed CSS discovered', !!css);
for (const asset of [css, parsed.images.find(img => /hero\./.test(img.src))?.src].filter(Boolean)) {
  const result = await get(asset);
  check(`immutable one-year asset: ${asset}`, result.status === 200 && /max-age=31536000/.test(result.headers['cache-control'] || '') && /immutable/.test(result.headers['cache-control'] || ''), result.headers['cache-control']);
}
for (const path of ['/favicon.ico', '/logo.png', '/llms.txt']) {
  const result = await get(path);
  check(`${path} HTTP 200`, result.status === 200);
}
const sitemap = await get('/sitemap.xml');
const entries = [...sitemap.body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => match[1]);
check('sitemap excludes query filters', entries.length >= 13 && entries.every(item => !/<loc>[^<]*\?/.test(item)), { urls: entries.length });
check('sitemap has meaningful lastmod', entries.every(item => /<lastmod>[^<]+<\/lastmod>/.test(item)));
const filter = await get('/pc-room?type=SELL&category=ADULT');
check('browse filters are noindex', inspectHtml(filter.body).named('robots').some(value => /noindex/.test(value)));
check('filter responses bypass public cache', filter.headers['x-pcieum-cache'] === 'BYPASS');
const http = await get('http://pcieum.com/pc-room?type=SELL&category=ADULT');
if (![301, 308].includes(http.status)) pending.push({ item: 'HTTP→HTTPS permanent redirect', status: http.status, location: http.headers.location, scope: 'Sites hosting layer before application Worker' });
const www = await get('https://www.pcieum.com/pc-room?type=SELL&category=ADULT');
check('www permanently redirects preserving query', [301, 308].includes(www.status) && www.headers.location === 'https://pcieum.com/pc-room?type=SELL&category=ADULT');

const result = { measuredAt: new Date().toISOString(), base, passed: checks.every(item => item.pass), checks, pending, responses };
await mkdir('outputs', { recursive: true });
await writeFile('outputs/hardening-live-audit.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks: checks.length, failures: checks.filter(item => !item.pass), pending }, null, 2));
if (!result.passed) process.exitCode = 1;

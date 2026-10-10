import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { launch } from 'chrome-launcher';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { parseOptions, runSeoCheck, reportSeoCheck } from './seo-check.mjs';

const retryFailed = process.argv.includes('--retry-failed');
const options = parseOptions(process.argv.slice(2).filter(arg => arg !== '--retry-failed'));
const runCli = promisify(execFile);
const cli = fileURLToPath(new URL('../node_modules/lighthouse/cli/index.js', import.meta.url));
if (options.preview) throw new Error('SEO 100 audits require public indexing mode. Use seo:check --preview for a private staging site.');
if (options.fixture || options.lighthouse) throw new Error('Run seo:check --fixture --lighthouse separately: its temporary posts are removed before a full-site audit starts.');
const output = resolve('outputs/seo');
await mkdir(output, { recursive: true });
const crawl = await runSeoCheck(options);
await writeFile(resolve(output, 'crawl.json'), JSON.stringify(crawl, null, 2));
reportSeoCheck(crawl);
if (!crawl.passed) process.exit(1);

// Audit every discovered indexable URL, including future sitemap entries and pagination.
// No custom Lighthouse weights or disabled SEO audits are used.
const paths = [...new Set(crawl.results.filter(page => page.policy === 'index').map(page => page.path))];
let previous = {results:[]};
if (retryFailed) {
  previous = JSON.parse(await readFile(resolve(output, 'summary.json'), 'utf8'));
  if (new URL(previous.base).origin !== new URL(options.base).origin) throw new Error('Cannot retry a report from another site.');
}
const scores = previous.results.filter(item => item.passed && paths.includes(item.path));
const pendingPaths = paths.filter(path => !scores.some(item => item.path === path));
let cursor = 0;
async function worker() {
  const chrome = await launch({ chromeFlags: ['--headless=new'] });
  try {
    while (cursor < pendingPaths.length) {
      const path = pendingPaths[cursor++];
      const url = new URL(path, options.base).href;
      const slug = (new URL(url).pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home') + '-' + createHash('sha256').update(path).digest('hex').slice(0, 8);
      try {
        // Isolate Lighthouse's process-global performance marks between concurrent audits.
        await runCli(process.execPath, [cli, url, `--port=${chrome.port}`, '--only-categories=seo', '--output=json', '--output=html', `--output-path=${resolve(output, slug)}`, '--quiet'], { shell:false, timeout:90000, maxBuffer:8*1024*1024 });
        const lhr = JSON.parse(await readFile(resolve(output, `${slug}.report.json`), 'utf8'));
        const score = Math.round((lhr.categories.seo.score ?? 0) * 100);
        const failed = lhr.categories.seo.auditRefs.filter(ref => ref.weight > 0).map(ref => lhr.audits[ref.id]).filter(audit => audit.score !== 1 && audit.scoreDisplayMode !== 'notApplicable').map(audit => ({ id: audit.id, title: audit.title, explanation: audit.explanation }));
        scores.push({ path, url, score, passed: lhr.categories.seo.score === 1 && !lhr.runtimeError, lighthouseVersion: lhr.lighthouseVersion, report: `${slug}.report.html`, measuredAt: lhr.fetchTime, failed, ...(lhr.runtimeError ? { error: lhr.runtimeError.message } : {}) });
        console.log(`[${scores.length}/${paths.length}] ${score}/100 ${path}`);
      } catch (error) {
        scores.push({ path, url, score: null, passed: false, error: error.message });
        console.error(`FAIL ${path}: ${error.message}`);
      }
    }
  } finally { await chrome.kill(); }
}
await Promise.all([worker(), worker()]);
scores.sort((a, b) => paths.indexOf(a.path) - paths.indexOf(b.path));
const passed = scores.length === paths.length && scores.every(item => item.passed);
const summary = { passed, measuredAt: new Date().toISOString(), base: options.base, audit: 'Lighthouse SEO (default mobile configuration)', pages: scores.length, minimumScore: Math.min(...scores.map(item => item.score ?? 0)), excluded: crawl.results.filter(page => page.policy !== 'index'), results: scores };
await writeFile(resolve(output, 'summary.json'), JSON.stringify(summary, null, 2));
const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
await writeFile(resolve(output, 'index.html'), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>피씨이음 Lighthouse SEO 검사 결과</title><style>body{font-family:system-ui,sans-serif;background:#f2f5f9;color:#142139;margin:0;padding:48px 24px}main{max-width:1024px;margin:auto}header{background:#142139;color:white;border-radius:20px;padding:36px;display:flex;justify-content:space-between;gap:24px;align-items:center}h1{font-size:25px;margin:0 0 12px}.score{font-size:56px;color:${passed ? '#71efa5' : '#ffb17d'};font-weight:800}.caption{font-size:13px;color:#b4c0d2}table{width:100%;background:white;border-collapse:collapse;margin:24px 0}th,td{padding:13px 18px;text-align:left;border-bottom:1px solid #e5eaf1}th{background:#e6edf7}td:last-child{font-weight:700;color:#087640}a{color:#235ecc}p{line-height:1.7}details{background:white;padding:18px;border-radius:12px}code{font-size:12px;word-break:break-all}</style></head><body><main><header><div><h1>피씨이음 SEO 검사 결과</h1><p>Lighthouse 공식 SEO 검사 · 모바일 기본 설정<br>공개 페이지 ${scores.length}개 ${passed ? '전체 통과' : '검토 필요'}</p><span class="caption">${escape(summary.measuredAt)} · ${escape(summary.base)}</span></div><div class="score">${summary.minimumScore}<span style="font-size:18px"> / 100</span></div></header><p>표의 점수는 각 URL에서 실제 측정한 결과입니다. 경로를 누르면 원본 Lighthouse 보고서가 열립니다.</p><table><thead><tr><th>검사한 URL</th><th>SEO 점수</th></tr></thead><tbody>${scores.map(item => `<tr><td>${item.report ? `<a href="${escape(item.report)}">${escape(item.path)}</a>` : escape(item.path)}</td><td>${item.score ?? '오류'} / 100</td></tr>`).join('')}</tbody></table><details><summary>검색 제외 정책 검사: ${summary.excluded.length}개 URL</summary><p>회원·관리·검색 결과·예시 글·404 등은 의도적으로 noindex를 유지합니다. 점수 100 대상인 공개 페이지와 별도로 HTTP 및 메타 설정을 검증했습니다.</p>${summary.excluded.map(item => `<p><code>${escape(item.path)}</code> · ${escape(item.status)} · noindex</p>`).join('')}</details><p>이 점수는 Lighthouse의 기술 SEO 검사 결과이며 검색 순위나 실제 검색엔진 등록을 보장하지 않습니다.</p></main></body></html>`);
console.log(`Lighthouse SEO ${passed ? 'PASS' : 'FAIL'}: ${scores.length} pages, minimum ${summary.minimumScore}/100. Report: ${output}/index.html`);
if (!passed) process.exitCode = 1;

// Read-only unit tests: real source + fake D1, with no server or database writes.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { observeD1Read, classifyServerError, reportServerError } from '../lib/observability.ts';
import { ensureInstrumentationRegistered } from '../node_modules/vinext/dist/server/instrumentation-runtime.js';
import { reportRequestError } from '../node_modules/vinext/dist/server/instrumentation.js';
import { createRscOnErrorHandler, sanitizeErrorForClient } from '../node_modules/vinext/dist/server/app-rsc-errors.js';

const environmentKey = Symbol.for('pcieum.observability.test.env');
const fakeEnv = {};
globalThis[environmentKey] = fakeEnv;
const observabilityUrl = new URL('../lib/observability.ts', import.meta.url).href;

async function loadSource(path) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  let compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  compiled = compiled.replace(/import\s+\{\s*env\s*\}\s+from\s*['"]cloudflare:workers['"];?/, 'const env = globalThis[Symbol.for("pcieum.observability.test.env")];');
  compiled = compiled.replace(/from\s+['"](?:@\/lib\/observability|\.\/lib\/observability)['"]/g, `from ${JSON.stringify(observabilityUrl)}`);
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
const store = await loadSource('lib/store.ts');
const instrumentation = await loadSource('instrumentation.ts');

async function capture(run) {
  const messages = [];
  const previous = console.error;
  console.error = message => messages.push(message);
  try { await run(messages); }
  finally { console.error = previous; }
  return messages.map(message => JSON.parse(message));
}

function fakeDatabase({ failingStage, error, synchronous = false } = {}) {
  const calls = { count: 0, select: 0, bound: [] };
  return { calls, prepare(sql) {
    const stage = sql.startsWith('SELECT COUNT(*)') ? 'count' : 'select';
    if (synchronous && stage === failingStage) { calls[stage]++; throw error; }
    return { bind(...values) {
      calls.bound.push(values);
      return {
        async first() { calls.count++; if (failingStage === 'count') throw error; return { total: 0 }; },
        async all() { calls.select++; if (failingStage === 'select') throw error; return { results: [] }; },
      };
    } };
  } };
}

test('successful listPosts reads execute once, preserve result and emit no error logs', async () => {
  const db = fakeDatabase(); fakeEnv.DB = db;
  const logs = await capture(async () => {
    assert.deepEqual(await store.listPosts({ kind: 'listing', type: 'SELL', category: 'OTHER' }), { posts: [], total: 0 });
  });
  assert.equal(db.calls.count, 1); assert.equal(db.calls.select, 1);
  assert.deepEqual(logs, []);
});

for (const stage of ['count', 'select']) test(`actual listPosts ${stage} failure is labelled, rethrown unchanged, never retried or converted to empty success`, async () => {
  const failure = new Error('D1_ERROR: private-query-secret');
  failure.stack = 'private-stack-secret';
  failure.cause = new Error('SQLITE_BUSY: private-cause-secret');
  const db = fakeDatabase({ failingStage: stage, error: failure }); fakeEnv.DB = db;
  const logs = await capture(async () => {
    await assert.rejects(store.listPosts({ kind: 'listing', category: 'OTHER', q: 'private-search-secret', authorId: 'private-author-secret' }), error => error === failure);
    instrumentation.onRequestError(failure,
      { path: '/pc-room?secret=private-url-secret', method: 'GET', headers: { cookie: 'private-cookie-secret', authorization: 'private-authorization-secret', 'cf-connecting-ip': '192.0.2.77' } },
      { routeType: 'render' });
  });
  assert.equal(db.calls.count, 1); assert.equal(db.calls.select, 1);
  assert.equal(logs.length, 2);
  assert.equal(logs[0].event, 'pcieum.d1_read_error');
  assert.equal(logs[0].operation, `listPosts.${stage}`);
  assert.equal(logs[0].errorClass, 'database_busy');
  assert.ok(Number.isInteger(logs[0].durationMs) && logs[0].durationMs >= 0);
  assert.match(logs[0].correlationId, /^[0-9a-f-]{36}$/);
  assert.equal(logs[1].correlationId, logs[0].correlationId);
  assert.equal(logs[1].operation, logs[0].operation);
  assert.equal(logs[1].route, '/pc-room');
  const output = JSON.stringify(logs);
  for (const secret of ['private-', '192.0.2.77', 'SQLITE_BUSY', 'D1_ERROR', 'SELECT', 'WHERE', 'cookie', 'authorization']) assert.ok(!output.includes(secret));
});

test('synchronous D1 prepare failure is observed and preserves its original error', async () => {
  const failure = new Error('D1_ERROR: no such table: private-table');
  const db = fakeDatabase({ failingStage: 'count', error: failure, synchronous: true }); fakeEnv.DB = db;
  const logs = await capture(async () => { await assert.rejects(store.listPosts(), error => error === failure); });
  assert.equal(db.calls.count, 1); assert.equal(db.calls.select, 1);
  assert.equal(logs.length, 1); assert.equal(logs[0].operation, 'listPosts.count');
  assert.equal(logs[0].errorClass, 'database_schema');
});

test('missing DB binding remains a failure with a bounded classification', async () => {
  delete fakeEnv.DB;
  const logs = await capture(async () => {
    await assert.rejects(store.listPosts(), error => {
      assert.ok(error instanceof store.StorageUnavailableError);
      instrumentation.onRequestError(error, { path: '/pc-room', method: 'GET', headers: {} }, { routeType: 'render' });
      return true;
    });
  });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].errorClass, 'storage_binding_unavailable');
});

test('actual Vinext production RSC handler registers the hook, unwraps its sanitized error, and retains D1 correlation', async () => {
  const previous = globalThis.__VINEXT_onRequestErrorHandler__;
  try {
    await ensureInstrumentationRegistered(instrumentation);
    assert.equal(globalThis.__VINEXT_onRequestErrorHandler__, instrumentation.onRequestError);
    const failure = new Error('D1_ERROR: timeout private-message');
    const logs = await capture(async () => {
      await assert.rejects(observeD1Read('listPosts.select', async () => { throw failure; }), error => error === failure);
      const sanitized = sanitizeErrorForClient(failure, 'production');
      assert.notEqual(sanitized, failure);
      const handler = createRscOnErrorHandler({ nodeEnv: 'production', reportRequestError,
        requestInfo: { path: '/pc-room?secret=private-url', method: 'GET', headers: { cookie: 'private-cookie' } },
        errorContext: { routerKind: 'App Router', routePath: '/[...route]', routeType: 'render' },
      });
      assert.equal(handler(sanitized), sanitized.digest);
    });
    assert.equal(logs.length, 2);
    assert.equal(logs[1].event, 'pcieum.request_error');
    assert.equal(logs[1].correlationId, logs[0].correlationId);
    assert.equal(logs[1].errorClass, 'timeout');
    assert.ok(!JSON.stringify(logs).includes('private-'));
  } finally { globalThis.__VINEXT_onRequestErrorHandler__ = previous; }
});

test('framework navigation and cancellation signals remain unreported', async () => {
  let reports = 0;
  const handler = createRscOnErrorHandler({ nodeEnv: 'production', reportRequestError: () => { reports++; },
    requestInfo: { path: '/missing', method: 'GET', headers: {} }, errorContext: { routerKind: 'App Router', routePath: '/[...route]', routeType: 'render' } });
  const logs = await capture(async () => {
    handler(Object.assign(new Error('missing'), { digest: 'NEXT_NOT_FOUND' }));
    handler(Object.assign(new Error('redirect'), { digest: 'NEXT_REDIRECT;replace;/;308;' }));
    handler(Object.assign(new Error('cancelled'), { name: 'AbortError' }));
  });
  assert.equal(reports, 0); assert.deepEqual(logs, []);
});

test('logging failures do not mask an application failure or trigger another read', async () => {
  const original = console.error;
  const failure = new Error('D1_ERROR'); let calls = 0;
  try {
    console.error = () => { throw new Error('log sink unavailable'); };
    await assert.rejects(observeD1Read('listPosts.count', async () => { calls++; throw failure; }), error => error === failure);
    assert.doesNotThrow(() => reportServerError(failure, { path: '/', method: 'GET' }, { routeType: 'render' }));
  } finally { console.error = original; }
  assert.equal(calls, 1);
});

test('unknown routes, dynamic identifiers, request headers and hostile thrown values cannot leak', async () => {
  const hostile = new Proxy({}, { get() { throw new Error('private-accessor'); } });
  const headers = { get cookie() { throw new Error('headers must not be read'); } };
  const logs = await capture(async () => {
    for (const path of ['/guides/private-slug?private-query', '/pc-room/private-id', '/private-path', '/api/private-action']) {
      instrumentation.onRequestError(hostile, { path, method: 'private-method', headers }, { routeType: 'private-phase' });
    }
    let caught;
    try { await observeD1Read('private-operation', async () => { throw hostile; }); }
    catch (error) { caught = error; }
    assert.equal(caught, hostile);
  });
  assert.deepEqual(logs.slice(0, 4).map(log => log.route), ['/guides/[slug]', '/pc-room/[id]', 'unknown', '/api/[route]']);
  assert.ok(logs.every(log => log.errorClass === 'unknown'));
  assert.ok(!JSON.stringify(logs).includes('private-'));
});

test('independent concurrent errors receive different correlations', async () => {
  const logs = await capture(async () => {
    await Promise.allSettled([
      observeD1Read('listPosts.count', async () => { throw new Error('D1_ERROR'); }),
      observeD1Read('listPosts.select', async () => { throw new Error('D1_ERROR'); }),
    ]);
  });
  assert.equal(logs.length, 2); assert.notEqual(logs[0].correlationId, logs[1].correlationId);
});

test('bounded error classification handles cycles and never returns arbitrary error text', () => {
  const error = new Error('private-error'); error.cause = error;
  assert.equal(classifyServerError(error), 'unknown');
  assert.equal(classifyServerError(Object.assign(new Error('private'), { code: 'SQLITE_CONSTRAINT' })), 'database_constraint');
  assert.equal(classifyServerError('private-string'), 'unknown');
  assert.equal(classifyServerError(null), 'unknown');
});

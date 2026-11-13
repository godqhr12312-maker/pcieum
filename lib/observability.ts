type ReadOperation = 'listPosts.count' | 'listPosts.select';
type ErrorClass = 'storage_binding_unavailable' | 'cancelled' | 'timeout' | 'database_busy'
  | 'database_schema' | 'database_constraint' | 'database_error' | 'type_error'
  | 'range_error' | 'syntax_error' | 'unknown';
type Observation = { correlationId: string; operation?: ReadOperation; durationMs?: number };

// Vinext can load the hook and RSC code in separate module graphs. Share only
// non-sensitive error observations across them; WeakMap entries expire with errors.
const stateKey = Symbol.for('pcieum.error-observations.v1');
const shared = globalThis as typeof globalThis & { [key: symbol]: unknown };
if (!(shared[stateKey] instanceof WeakMap)) shared[stateKey] = new WeakMap<object, Observation>();
const observations = shared[stateKey] as WeakMap<object, Observation>;

function property(value: unknown, name: string): unknown {
  try { return value !== null && (typeof value === 'object' || typeof value === 'function') ? Reflect.get(value, name) : undefined; }
  catch { return undefined; }
}

/** Inspect bounded error hints, but never emit their text, stack, code or cause. */
export function classifyServerError(error: unknown): ErrorClass {
  const hints: string[] = [];
  let current = error;
  for (let depth = 0; current && depth < 3; depth++) {
    for (const key of ['name', 'code', 'message']) {
      const value = property(current, key);
      if (typeof value === 'string') hints.push(value.slice(0, 1024));
    }
    current = property(current, 'cause');
  }
  const hint = hints.join('\n');
  if (/\bStorageUnavailableError\b/.test(hint)) return 'storage_binding_unavailable';
  if (/\b(?:AbortError|ResponseAborted)\b/.test(hint)) return 'cancelled';
  if (/\b(?:TimeoutError|timed? out|timeout)\b/i.test(hint)) return 'timeout';
  if (/\bSQLITE_(?:BUSY|LOCKED)\b/.test(hint)) return 'database_busy';
  if (/\bSQLITE_SCHEMA\b|\bno such (?:table|column)\b/i.test(hint)) return 'database_schema';
  if (/\bSQLITE_CONSTRAINT\b/.test(hint)) return 'database_constraint';
  if (/\b(?:D1_(?:ERROR|EXEC_ERROR|TYPE_ERROR)|SQLITE_[A-Z_]+)\b/.test(hint)) return 'database_error';
  if (/\bTypeError\b/.test(hint)) return 'type_error';
  if (/\bRangeError\b/.test(hint)) return 'range_error';
  if (/\bSyntaxError\b/.test(hint)) return 'syntax_error';
  return 'unknown';
}

function observationFor(error: unknown): Observation {
  const object = error !== null && (typeof error === 'object' || typeof error === 'function') ? error as object : null;
  const existing = object && observations.get(object);
  if (existing) return existing;
  const observation = { correlationId: crypto.randomUUID() };
  if (object) observations.set(object, observation);
  return observation;
}

/** Return only known route names/patterns, never user slugs or query strings. */
function safeRoute(path: unknown): string {
  if (typeof path !== 'string' || path.length > 4096) return 'unknown';
  const pathname = path.split(/[?#]/, 1)[0];
  const publicPaths = ['/', '/pc-room', '/market', '/job', '/guides', '/slot', '/terms', '/privacy', '/about', '/contact', '/editorial-policy'];
  if (publicPaths.includes(pathname)) return pathname;
  if (/^\/(?:pc-room|market|job)\/[^/]+$/.test(pathname)) return `/${pathname.split('/')[1]}/[id]`;
  if (/^\/guides\/[^/]+$/.test(pathname)) return '/guides/[slug]';
  if (/^\/board\/[^/]+\/[^/]+$/.test(pathname)) return '/board/[category]/[id]';
  if (/^\/board\/[^/]+$/.test(pathname)) return '/board/[category]';
  if (/^\/api(?:\/|$)/.test(pathname)) return '/api/[route]';
  return 'unknown';
}

function emit(event: Record<string, string | number | undefined>): void {
  try { console.error(JSON.stringify(event)); }
  catch { /* Logging failure must never replace the original application error. */ }
}

/** Observe failed reads only. Preserve result/error identity and execute once. */
export async function observeD1Read<T>(operation: ReadOperation, read: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try { return await read(); }
  catch (error) {
    try {
      const observation = observationFor(error);
      // This runtime check also prevents accidental untrusted operation labels.
      if (operation === 'listPosts.count' || operation === 'listPosts.select') observation.operation = operation;
      observation.durationMs = Math.min(86_400_000, Math.max(0, Math.round(performance.now() - started)));
      emit({ event: 'pcieum.d1_read_error', ...observation, errorClass: classifyServerError(error) });
    } catch { /* Diagnostics cannot turn the original failure into another one. */ }
    throw error;
  }
}

export function reportServerError(error: unknown, request: { path: unknown; method: unknown }, context: { routeType: unknown }): void {
  try {
    const observation = observationFor(error);
    const method = typeof request.method === 'string' && ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(request.method) ? request.method : 'OTHER';
    const routeType = typeof context.routeType === 'string' && ['render', 'route', 'action', 'middleware', 'proxy'].includes(context.routeType) ? context.routeType : 'other';
    emit({ event: 'pcieum.request_error', ...observation, route: safeRoute(request.path), method, routeType, errorClass: classifyServerError(error) });
  } catch { /* The framework keeps its original failure response. */ }
}

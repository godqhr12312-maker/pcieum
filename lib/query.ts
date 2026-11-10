export type SearchQuery = Record<string, string | string[] | undefined>;

/** Match URLSearchParams.get(): a repeated query key uses its first value. */
export function normalizeQuery(query: SearchQuery): Record<string, string> {
  return Object.fromEntries(Object.entries(query)
    .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

/** A blank default search is the same adult landing, not a filtered result. */
export function emptyAdultSearchRedirect(path: string, query: SearchQuery): string | undefined {
  if (path !== '/pc-room' || query.category !== 'ADULT' || (query.type !== 'SELL' && query.type !== 'BUY') || query.q !== '') return;
  if (query.sort !== undefined && query.sort !== 'latest') return;
  if (Object.entries(query).some(([key, value]) => value !== undefined && (Array.isArray(value) || !['type', 'category', 'q', 'sort'].includes(key)))) return;
  return `/pc-room?type=${query.type}&category=ADULT`;
}

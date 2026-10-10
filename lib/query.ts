export type SearchQuery = Record<string, string | string[] | undefined>;

/** Match URLSearchParams.get(): a repeated query key uses its first value. */
export function normalizeQuery(query: SearchQuery): Record<string, string> {
  return Object.fromEntries(Object.entries(query)
    .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

const APPROVED_KEYS = ['category', 'room', 'option', 'priceFrom', 'priceTo', 'inStock', 'sort', 'page', 'q'] as const;
const LIST_KEYS = new Set(['category', 'room', 'option']);

function stableValues(searchParams: URLSearchParams, key: string): string | null {
  const values = searchParams.getAll(key).flatMap((value) => value.split(','));
  const seen = new Set<string>();
  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value && !seen.has(value) && seen.add(value));
  return normalized.length ? normalized.join(',') : null;
}

function normalizedValue(searchParams: URLSearchParams, key: string): string | null {
  const value = searchParams.get(key)?.trim() ?? '';
  return value || null;
}

export function catalogBQueryFromSearchParams(sp: URLSearchParams): URLSearchParams {
  const query = new URLSearchParams();

  for (const key of APPROVED_KEYS) {
    const value = LIST_KEYS.has(key) ? stableValues(sp, key) : normalizedValue(sp, key);
    if (value !== null) query.set(key, value);
  }

  return query;
}

export function normalizeCatalogBQuery(sp: URLSearchParams): URLSearchParams {
  // Normalization is read-only. Callers changing filters, room, or sort must delete page before calling.
  return catalogBQueryFromSearchParams(sp);
}

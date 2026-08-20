import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkDadataRateLimit, extractClientIp } from '@/lib/rate-limit';
import { tooManyRequests } from '@/lib/rate-limit-response';

export const runtime = 'nodejs';

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isAllowedRegion(data: Record<string, unknown>): boolean {
  const regions = [data.region_with_type, data.region]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase());

  return regions.some(
    (region) => /^(?:г\.?\s*)?москва$/.test(region) || /^московская(?:\s+обл(?:асть)?|\s+область)?$/.test(region),
  );
}

function narrowSuggestions(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('suggestions' in payload) || !Array.isArray(payload.suggestions)) {
    return [];
  }
  return payload.suggestions.slice(0, 5).flatMap((suggestion) => {
    if (
      !suggestion ||
      typeof suggestion !== 'object' ||
      !('value' in suggestion) ||
      typeof suggestion.value !== 'string'
    ) {
      return [];
    }
    const data = 'data' in suggestion && suggestion.data && typeof suggestion.data === 'object' ? suggestion.data : {};
    if (!isAllowedRegion(data)) return [];
    return [
      {
        value: suggestion.value,
        city: stringOrNull('city' in data ? data.city : null),
        region: stringOrNull('region_with_type' in data ? data.region_with_type : null),
        street: stringOrNull('street_with_type' in data ? data.street_with_type : null),
        house: stringOrNull('house' in data ? data.house : null),
      },
    ];
  });
}

export async function POST(req: Request) {
  const token = process.env.DADATA_TOKEN;
  if (!token) return NextResponse.json({ suggestions: [] });

  try {
    const ip = extractClientIp({ headers: req.headers });
    const rl = await checkDadataRateLimit(ip);
    if (!rl.success) return tooManyRequests(rl, 'Слишком много запросов к подсказкам адреса');

    const { query } = await req.json();
    if (!query || typeof query !== 'string') return NextResponse.json({ suggestions: [] });
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return NextResponse.json({ suggestions: [] });
    if (normalizedQuery.length > 120) {
      return NextResponse.json({ suggestions: [] }, { status: 400 });
    }

    const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
      method: 'POST',
      headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: normalizedQuery,
        count: 5,
        language: 'ru',
        locations: [{ region: 'Москва' }, { region: 'Московская область' }],
      }),
    });
    if (!res.ok) {
      logger.error('dadata_suggest_upstream_failed', new Error(`status ${res.status}`));
      return NextResponse.json({ suggestions: [] });
    }
    return NextResponse.json({ suggestions: narrowSuggestions(await res.json()) });
  } catch (e) {
    logger.error('dadata_suggest_failed', e);
    return NextResponse.json({ suggestions: [] });
  }
}

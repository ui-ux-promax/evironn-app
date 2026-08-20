import { describe, expect, it } from 'vitest';
import { buildOrderBy, buildProductWhere, isInStockParam, parseCatalogParams } from '@/lib/catalog-filters';

describe('parseCatalogParams', () => {
  it('uses furniture defaults for an empty query', () => {
    expect(parseCatalogParams({})).toEqual({
      categories: [],
      rooms: [],
      options: {},
      priceFrom: undefined,
      priceTo: undefined,
      inStock: false,
      sort: 'new',
      page: 1,
      query: undefined,
    });
  });

  it('normalizes and deduplicates category, room, and option CSV values', () => {
    const params = parseCatalogParams({
      category: ' Sofas,chairs,sofas, ,CHAIRS ',
      room: ' Living, dining,living ',
      option: 'finish:Oak, finish:oak, upholstery:Sage-Linen, finish:Walnut',
    });

    expect(params.categories).toEqual(['sofas', 'chairs']);
    expect(params.rooms).toEqual(['living', 'dining']);
    expect(params.options).toEqual({
      finish: ['oak', 'walnut'],
      upholstery: ['sage-linen'],
    });
  });

  it('ignores malformed and prototype-pollution option tokens', () => {
    const params = parseCatalogParams({
      option: 'finish:oak,missing-colon,:empty,finish:,__proto__:polluted,constructor:value,valid:walnut',
    });

    expect(params.options).toEqual({ finish: ['oak'], valid: ['walnut'] });
    expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('parses price, stock, search, sort, and page', () => {
    const params = parseCatalogParams({
      priceFrom: '50000',
      priceTo: '180000',
      inStock: 'true',
      sort: 'price-asc',
      page: '2',
      q: ' Noma ',
    });

    expect(params).toMatchObject({
      priceFrom: 50000,
      priceTo: 180000,
      inStock: true,
      sort: 'price-asc',
      page: 2,
      query: 'Noma',
    });
  });

  it('treats both canonical URL spellings as the in-stock value', () => {
    expect(isInStockParam('1')).toBe(true);
    expect(isInStockParam('true')).toBe(true);
    expect(isInStockParam('0')).toBe(false);
    expect(isInStockParam(undefined)).toBe(false);
  });
});

describe('buildProductWhere', () => {
  it('builds one active SKU predicate shared by stock, price, and option groups', () => {
    const where = buildProductWhere(
      parseCatalogParams({
        category: 'sofas',
        room: 'living',
        option: 'finish:oak,finish:walnut,upholstery:sage-linen',
        priceFrom: '50000',
        priceTo: '180000',
        inStock: '1',
      }),
    );

    expect(where).toMatchObject({
      active: true,
      category: { slug: { in: ['sofas'] } },
      rooms: { some: { room: { slug: { in: ['living'] } } } },
      skus: {
        some: {
          active: true,
          stock: { gt: 0 },
          price: { gte: 50000, lte: 180000 },
          AND: [
            {
              selections: {
                some: {
                  optionGroup: { slug: 'finish' },
                  optionValue: { slug: { in: ['oak', 'walnut'] } },
                },
              },
            },
            {
              selections: {
                some: {
                  optionGroup: { slug: 'upholstery' },
                  optionValue: { slug: { in: ['sage-linen'] } },
                },
              },
            },
          ],
        },
      },
    });
  });

  it('ORs values in one group and ANDs different groups', () => {
    const skuWhere = buildProductWhere(
      parseCatalogParams({ option: 'upholstery:linen,upholstery:velvet,finish:oak' }),
    ).skus;

    expect(skuWhere).toEqual({
      some: {
        active: true,
        AND: [
          {
            selections: {
              some: {
                optionGroup: { slug: 'finish' },
                optionValue: { slug: { in: ['oak'] } },
              },
            },
          },
          {
            selections: {
              some: {
                optionGroup: { slug: 'upholstery' },
                optionValue: { slug: { in: ['linen', 'velvet'] } },
              },
            },
          },
        ],
      },
    });
  });

  it('keeps category, room, and case-insensitive name as product predicates', () => {
    expect(buildProductWhere(parseCatalogParams({ category: 'sofas', room: 'living', q: 'Noma' }))).toEqual({
      active: true,
      category: { slug: { in: ['sofas'] } },
      rooms: { some: { room: { slug: { in: ['living'] } } } },
      name: { contains: 'Noma', mode: 'insensitive' },
    });
  });
});

describe('buildOrderBy', () => {
  it('keeps deterministic denormalized product sorts', () => {
    expect(buildOrderBy('new')).toEqual([{ createdAt: 'desc' }, { id: 'asc' }]);
    expect(buildOrderBy('popular')).toEqual([{ salesCount: 'desc' }, { isBestseller: 'desc' }, { id: 'asc' }]);
    expect(buildOrderBy('price-asc')).toEqual([{ minPrice: 'asc' }, { id: 'asc' }]);
    expect(buildOrderBy('price-desc')).toEqual([{ minPrice: 'desc' }, { id: 'asc' }]);
    expect(buildOrderBy('discount')).toEqual([{ discountPct: 'desc' }, { id: 'asc' }]);
  });

  it('ends every sort with the id ascending tiebreaker', () => {
    for (const sort of ['new', 'popular', 'price-asc', 'price-desc', 'discount'] as const) {
      const orderBy = buildOrderBy(sort);
      expect(orderBy.at(-1)).toEqual({ id: 'asc' });
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  parseOptionParam,
  productDetailInclude,
  resolveSelectedSku,
  serializeOptionParam,
  type FurnitureProductForSelection,
} from '@/lib/product-selection';

const optionGroup = (
  slug: string,
  name: string,
  sortOrder: number,
  values: Array<{ slug: string; name: string; swatchHex: string | null }>,
) => ({
  productId: 'product-noma',
  optionGroupId: `group-${slug}`,
  optionGroup: { id: `group-${slug}`, name, slug, sortOrder },
  values: values.map((value, sortOrder) => ({
    productId: 'product-noma',
    optionGroupId: `group-${slug}`,
    optionValueId: `value-${value.slug}`,
    optionValue: { id: `value-${value.slug}`, optionGroupId: `group-${slug}`, ...value, sortOrder },
  })),
});

const selection = (
  groupSlug: string,
  groupName: string,
  groupSortOrder: number,
  valueSlug: string,
  valueName: string,
  swatchHex: string | null,
) => ({
  optionGroup: { id: `group-${groupSlug}`, name: groupName, slug: groupSlug, sortOrder: groupSortOrder },
  optionValue: {
    id: `value-${valueSlug}`,
    optionGroupId: `group-${groupSlug}`,
    name: valueName,
    slug: valueSlug,
    swatchHex,
    sortOrder: valueSlug === 'oak' ? 0 : 1,
  },
});

const product = {
  id: 'product-noma',
  name: 'Noma Woven Lounge',
  optionGroups: [
    optionGroup('finish', 'Отделка', 1, [
      { slug: 'oak', name: 'Дуб', swatchHex: '#c8a97e' },
      { slug: 'walnut', name: 'Орех', swatchHex: '#6b4a30' },
    ]),
    optionGroup('upholstery', 'Обивка', 2, [{ slug: 'ivory-boucle', name: 'Кремовая букле', swatchHex: '#efe7d8' }]),
  ],
  media: [
    {
      id: 'product-image',
      kind: 'IMAGE' as const,
      url: '/assets/products/noma.webp',
      alt: 'Noma product',
      sortOrder: 0,
    },
    {
      id: 'turntable-video',
      kind: 'TURN_TABLE_VIDEO' as const,
      url: '/assets/noma.mp4',
      alt: 'Noma 360',
      sortOrder: 0,
    },
    {
      id: 'turntable-poster',
      kind: 'TURN_TABLE_POSTER' as const,
      url: '/assets/noma-poster.webp',
      alt: 'Noma poster',
      sortOrder: 0,
    },
    {
      id: 'turntable-fallback',
      kind: 'TURN_TABLE_FALLBACK' as const,
      url: '/assets/noma-fallback.webp',
      alt: 'Noma fallback',
      sortOrder: 0,
    },
  ],
  skus: [
    {
      id: 'sku-oak',
      productId: 'product-noma',
      articleNumber: 'EV-NWL-OAK',
      combinationKey: 'finish=oak|upholstery=ivory-boucle',
      price: 124000,
      oldPrice: null,
      stock: 3,
      active: true,
      media: [
        {
          id: 'sku-oak-image',
          kind: 'IMAGE' as const,
          url: '/assets/products/noma-oak.webp',
          alt: 'Noma oak',
          sortOrder: 0,
        },
      ],
      selections: [
        selection('finish', 'Отделка', 1, 'oak', 'Дуб', '#c8a97e'),
        selection('upholstery', 'Обивка', 2, 'ivory-boucle', 'Кремовая букле', '#efe7d8'),
      ],
    },
    {
      id: 'sku-walnut',
      productId: 'product-noma',
      articleNumber: 'EV-NWL-WAL',
      combinationKey: 'finish=walnut|upholstery=ivory-boucle',
      price: 129000,
      oldPrice: 139000,
      stock: 2,
      active: true,
      media: [],
      selections: [
        selection('finish', 'Отделка', 1, 'walnut', 'Орех', '#6b4a30'),
        selection('upholstery', 'Обивка', 2, 'ivory-boucle', 'Кремовая букле', '#efe7d8'),
      ],
    },
    {
      id: 'sku-inactive',
      productId: 'product-noma',
      articleNumber: 'EV-NWL-BLK',
      combinationKey: 'finish=black|upholstery=ivory-boucle',
      price: 1000,
      oldPrice: null,
      stock: 50,
      active: false,
      media: [],
      selections: [
        selection('finish', 'Отделка', 1, 'black', 'Чёрный', '#111111'),
        selection('upholstery', 'Обивка', 2, 'ivory-boucle', 'Кремовая букле', '#efe7d8'),
      ],
    },
  ],
} satisfies FurnitureProductForSelection;

describe('canonical product option URL helpers', () => {
  it('parses valid options, ignores malformed input, and rejects prototype keys', () => {
    expect(parseOptionParam('upholstery:ivory-boucle,finish:oak')).toEqual({
      upholstery: 'ivory-boucle',
      finish: 'oak',
    });
    expect(
      parseOptionParam('finish:oak,broken,finish:walnut,:empty,constructor:value,__proto__:polluted,prototype:x'),
    ).toEqual({
      finish: 'oak',
    });
  });

  it('serializes selections with stable group ordering', () => {
    expect(serializeOptionParam({ upholstery: 'ivory-boucle', finish: 'oak' })).toBe(
      'finish:oak,upholstery:ivory-boucle',
    );
  });
});

describe('server-side canonical SKU resolution', () => {
  it('resolves complete selections and prefers a valid SKU when completing partial input', () => {
    expect(resolveSelectedSku(product, { finish: 'oak', upholstery: 'ivory-boucle' }).sku.id).toBe('sku-oak');
    expect(resolveSelectedSku(product, { finish: 'walnut' }).canonicalSelection).toEqual({
      finish: 'walnut',
      upholstery: 'ivory-boucle',
    });
  });

  it('falls back deterministically for invalid or impossible selections and never resolves inactive SKUs', () => {
    const defaultCompleteSelection = { finish: 'oak', upholstery: 'ivory-boucle' };

    expect(resolveSelectedSku(product, { finish: 'invalid' }).canonicalSelection).toEqual(defaultCompleteSelection);
    expect(resolveSelectedSku(product, { finish: 'walnut', upholstery: 'impossible' }).canonicalSelection).toEqual(
      defaultCompleteSelection,
    );
    expect(resolveSelectedSku(product, { finish: 'black' }).sku.id).toBe('sku-oak');
  });

  it('uses SKU images first, product images second, and keeps complete turntable media product-level', () => {
    expect(resolveSelectedSku(product, { finish: 'oak', upholstery: 'ivory-boucle' }).images).toEqual([
      { url: '/assets/products/noma-oak.webp', alt: 'Noma oak' },
    ]);
    expect(resolveSelectedSku(product, { finish: 'walnut', upholstery: 'ivory-boucle' }).images).toEqual([
      { url: '/assets/products/noma.webp', alt: 'Noma product' },
    ]);
    expect(resolveSelectedSku(product, {}).turntable).toEqual({
      videoUrl: '/assets/noma.mp4',
      posterUrl: '/assets/noma-poster.webp',
      fallbackUrl: '/assets/noma-fallback.webp',
      alt: 'Noma 360',
    });
  });

  it('marks values available when an active SKU supports them with the other selected groups', () => {
    const result = resolveSelectedSku(product, { finish: 'walnut' });
    expect(result.optionGroups[0].values).toEqual([
      { slug: 'oak', name: 'Дуб', swatchHex: '#c8a97e', available: true },
      { slug: 'walnut', name: 'Орех', swatchHex: '#6b4a30', available: true },
    ]);
  });

  it('defines a canonical detail include without legacy relations', () => {
    expect(productDetailInclude).toMatchObject({
      category: expect.any(Object),
      rooms: expect.any(Object),
      optionGroups: expect.any(Object),
      skus: expect.any(Object),
      media: expect.any(Object),
    });
    expect(productDetailInclude).not.toHaveProperty('colorways');
  });
});

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CatalogResult } from '@/lib/find-products';
import { buildCatalogBModel, mediaForFurnitureCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';

const product = (overrides: Partial<CatalogResult['products'][number]> = {}): CatalogResult['products'][number] => ({
  id: 'product-1',
  slug: 'chair-1',
  name: 'Noma Woven Lounge',
  brand: 'Evironn',
  categoryName: 'Кресла',
  imageUrl: '/assets/products/01-bar-stool-idle.webp',
  imageAlt: 'Noma Woven Lounge',
  primarySkuId: 'sku-1',
  minPrice: 89000,
  minOldPrice: 109000,
  badges: [],
  soldOut: false,
  optionSwatches: [
    { groupSlug: 'finish', valueSlug: 'oak', label: 'Дуб', swatchHex: '#c89b6d' },
    { groupSlug: 'upholstery', valueSlug: 'linen', label: 'Лён', swatchHex: null },
  ],
  ...overrides,
});

const resultFixture: CatalogResult = {
  products: [
    '/assets/products/01-bar-stool-idle.webp',
    '/assets/products/02-rocking-chair-idle.webp',
    '/assets/products/03-ivory-lounge-idle.webp',
    '/assets/products/04-dark-accent-idle.webp',
    '/assets/products/05-two-seat-sofa-idle.webp',
    '/assets/products/01-bar-stool-cutout.webp',
    '/assets/products/04-dark-accent-idle.webp',
    '/assets/products/03-ivory-lounge-cutout.webp',
    '/assets/products/05-terracotta-walnut-chair-alpha.webp',
    '/assets/products/05-two-seat-sofa-idle.webp',
    '/assets/products/01-bar-stool-idle.webp',
    '/assets/products/02-rocking-chair-idle.webp',
  ].map((imageUrl, index) => product({ id: `product-${index + 1}`, imageUrl })),
  total: 12,
  page: 1,
  totalPages: 2,
  facets: {
    categories: [
      { value: 'sofas', label: 'Диваны', count: 4 },
      { value: 'armchairs', label: 'Кресла', count: 8 },
    ],
    rooms: [],
    options: [
      {
        slug: 'finish',
        name: 'Отделка',
        values: [{ value: 'oak', label: 'Дуб', swatchHex: '#c89b6d', count: 3 }],
      },
      {
        slug: 'upholstery',
        name: 'Обивка',
        values: [{ value: 'linen', label: 'Лён', swatchHex: null, count: 2 }],
      },
    ],
    price: { min: 24900, max: 189000 },
  },
};

describe('Catalog Variant B adapter', () => {
  it('adapts canonical furniture cards to showcase-linked Variant B cards', () => {
    const model = buildCatalogBModel(resultFixture);

    expect(model.cards).toHaveLength(12);
    expect(
      model.cards.every(
        (card) => card.href === '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
      ),
    ).toBe(true);
    expect(model.cards[0].media.idle).toBe('/assets/products/01-bar-stool-idle.webp');
    expect(model.cards[0].note).toContain('Кресла');
    expect(model.cards[0].colors).toEqual([
      { label: 'Дуб', swatchHex: '#c89b6d' },
      { label: 'Лён', swatchHex: null },
    ]);
  });

  it('preserves server facet order, counts, and swatch classification', () => {
    const model = buildCatalogBModel(resultFixture);

    expect(model.facetGroups.map((group) => group.key)).toEqual(['category', 'finish', 'upholstery']);
    expect(model.facetGroups[0]).toMatchObject({ key: 'category', title: 'Категория', kind: 'pill' });
    expect(model.facetGroups[0].values.map((value) => [value.id, value.count])).toEqual([
      ['sofas', 4],
      ['armchairs', 8],
    ]);
    expect(model.facetGroups[1].kind).toBe('swatch');
    expect(model.facetGroups[2].kind).toBe('check');
  });

  it('uses exact room tab assets and server pagination values', () => {
    const model = buildCatalogBModel(resultFixture);

    expect(model.roomTabs).toEqual([
      { id: 'all', label: 'Все', image: '/assets/hero/kitchen-idle.webp' },
      { id: 'living', label: 'Гостиная', image: '/assets/editorial/images/71c2b8589fc6.webp' },
      { id: 'dining', label: 'Столовая', image: '/assets/hero/kitchen-idle.webp' },
      { id: 'bedroom', label: 'Спальня', image: '/assets/hero/bedroom-idle.webp' },
      { id: 'terrace', label: 'Терраса', image: '/assets/hero/terrace-idle.webp' },
    ]);
    expect(model).toMatchObject({ total: 12, shown: 12, page: 1, totalPages: 2, price: { min: 24900, max: 189000 } });
  });

  it('resolves every seeded card media set, including cutout and alpha basenames', () => {
    const knownBasenames = [
      '01-bar-stool-idle.webp',
      '02-rocking-chair-idle.webp',
      '03-ivory-lounge-idle.webp',
      '04-dark-accent-idle.webp',
      '05-two-seat-sofa-idle.webp',
      '01-bar-stool-cutout.webp',
      '03-ivory-lounge-cutout.webp',
      '05-terracotta-walnut-chair-alpha.webp',
    ];

    for (const imageUrl of knownBasenames.map((basename) => `/assets/products/${basename}`)) {
      const media = mediaForFurnitureCard(product({ imageUrl }));
      expect(media.idle).toMatch(/^\/assets\/products\/\d\d-.+-idle\.webp$/);
      expect(media.forward).toMatch(/^\/assets\/products\/\d\d-.+-forward\.mp4$/);
      expect(media.reverse).toMatch(/^\/assets\/products\/\d\d-.+-reverse\.mp4$/);
      for (const asset of Object.values(media)) {
        expect(existsSync(resolve(process.cwd(), 'public', asset.slice(1)))).toBe(true);
      }
    }

    expect(mediaForFurnitureCard(product({ imageUrl: '/assets/products/server-upload.webp' }))).toEqual({
      idle: '/assets/products/server-upload.webp',
      forward: '/assets/products/03-ivory-lounge-forward.mp4',
      reverse: '/assets/products/03-ivory-lounge-reverse.mp4',
    });
  });

  it('keeps adapter output JSON serializable and excludes clone product fields', () => {
    const model = buildCatalogBModel(resultFixture);
    const serialized = JSON.parse(JSON.stringify(model)) as Record<string, unknown>;

    expect(serialized).toEqual(model);
    expect(model.cards).toHaveLength(12);
    expect(
      model.cards.every(
        (card) => card.href === '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
      ),
    ).toBe(true);
    for (const card of model.cards) {
      for (const asset of Object.values(card.media)) {
        expect(existsSync(resolve(process.cwd(), 'public', asset.slice(1)))).toBe(true);
      }
    }
    expect(model.cards[0]).not.toHaveProperty('rating');
    expect(model.cards[0]).not.toHaveProperty('reviews');
    expect(model.cards[0]).not.toHaveProperty('material');
    expect(model.cards[0]).not.toHaveProperty('seats');
  });
});

import { describe, expect, it } from 'vitest';
import { formatPrice } from '@/lib/format';
import { SHOWCASE_PRODUCT_PATH } from '@/components/evironn/public-routes';
import { PRODUCT_SCENE_BACKGROUND, PRODUCT_SCENE_CHAIRS } from '@/components/evironn/product/productPageState';
import { buildCombinationKey } from '@/lib/furniture-sku';
import type { FurnitureProductForSelection } from '@/lib/product-selection';
import {
  buildShowcaseProductPageDto,
  ShowcaseProductContractError,
  type ShowcaseUpholsteryId,
  type ShowcaseWoodId,
} from '@/lib/showcase-product';

const selection = (groupSlug: string, valueSlug: string, sortOrder: number) => ({
  optionGroup: {
    id: `group-${groupSlug}`,
    name: groupSlug,
    slug: groupSlug,
    sortOrder,
  },
  optionValue: {
    id: `value-${valueSlug}`,
    optionGroupId: `group-${groupSlug}`,
    name: valueSlug,
    slug: valueSlug,
    swatchHex: null,
    sortOrder: 0,
  },
});

const canonicalPairs: Array<[ShowcaseUpholsteryId, ShowcaseWoodId, string, string, string]> = [
  ['ivory', 'pine', 'finish:oak,upholstery:ivory-boucle', 'EV-NWL-OAK', 'sku-ivory-pine'],
  ['ivory', 'walnut', 'finish:walnut,upholstery:ivory-boucle', 'EV-NWL-WAL', 'sku-ivory-walnut'],
  ['charcoal', 'pine', 'finish:oak,upholstery:graphite', 'EV-NWL-GPH-OAK', 'sku-charcoal-pine'],
  ['charcoal', 'walnut', 'finish:walnut,upholstery:graphite', 'EV-NWL-GPH-WAL', 'sku-charcoal-walnut'],
  ['terracotta', 'pine', 'finish:oak,upholstery:terracotta', 'EV-NWL-TER-OAK', 'sku-terracotta-pine'],
  ['terracotta', 'walnut', 'finish:walnut,upholstery:terracotta', 'EV-NWL-TER-WAL', 'sku-terracotta-walnut'],
];

const product = {
  id: 'product-noma',
  name: 'Noma Woven Lounge',
  description: 'Noma lounge chair description',
  category: { name: 'Armchairs', slug: 'armchairs' },
  optionGroups: [
    {
      optionGroup: { id: 'group-finish', name: 'Finish', slug: 'finish', sortOrder: 1 },
      values: ['oak', 'walnut'].map((slug, sortOrder) => ({
        productId: 'product-noma',
        optionGroupId: 'group-finish',
        optionValueId: `value-${slug}`,
        optionValue: {
          id: `value-${slug}`,
          optionGroupId: 'group-finish',
          name: slug,
          slug,
          swatchHex: null,
          sortOrder,
        },
      })),
    },
    {
      optionGroup: { id: 'group-upholstery', name: 'Upholstery', slug: 'upholstery', sortOrder: 2 },
      values: ['ivory-boucle', 'graphite', 'terracotta'].map((slug, sortOrder) => ({
        productId: 'product-noma',
        optionGroupId: 'group-upholstery',
        optionValueId: `value-${slug}`,
        optionValue: {
          id: `value-${slug}`,
          optionGroupId: 'group-upholstery',
          name: slug,
          slug,
          swatchHex: null,
          sortOrder,
        },
      })),
    },
  ],
  media: [
    {
      id: 'noma-image',
      kind: 'IMAGE' as const,
      url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
      alt: 'Noma Woven Lounge',
      sortOrder: 0,
    },
    {
      id: 'noma-video',
      kind: 'TURN_TABLE_VIDEO' as const,
      url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
      alt: 'Noma 360',
      sortOrder: 0,
    },
    {
      id: 'noma-poster',
      kind: 'TURN_TABLE_POSTER' as const,
      url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
      alt: 'Noma poster',
      sortOrder: 0,
    },
    {
      id: 'noma-fallback',
      kind: 'TURN_TABLE_FALLBACK' as const,
      url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
      alt: 'Noma fallback',
      sortOrder: 0,
    },
  ],
  skus: canonicalPairs.map(([upholstery, wood, canonicalOption, articleNumber, id]) => {
    const [finishValue, upholsteryValue] = canonicalOption.split(',').map((part) => part.split(':')[1]);
    return {
      id,
      productId: 'product-noma',
      articleNumber,
      combinationKey: buildCombinationKey([
        { groupSlug: 'finish', valueSlug: finishValue },
        { groupSlug: 'upholstery', valueSlug: upholsteryValue },
      ]),
      price: 89990,
      oldPrice: 109990,
      stock: 3,
      active: true,
      media: [],
      selections: [selection('finish', finishValue, 1), selection('upholstery', upholsteryValue, 2)],
    };
  }),
} satisfies FurnitureProductForSelection & {
  description: string;
  category: { name: string; slug: string };
};

describe('showcase product DTO', () => {
  it('selects ivory/walnut by default and serializes the server projection', () => {
    const dto = buildShowcaseProductPageDto(product);

    expect(dto.selected).toMatchObject({
      upholstery: 'ivory',
      wood: 'walnut',
      canonicalOption: 'finish:walnut,upholstery:ivory-boucle',
      canonicalPath: `${SHOWCASE_PRODUCT_PATH}?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle`,
      chairUrl: PRODUCT_SCENE_CHAIRS.ivory.walnut,
      sku: {
        id: 'sku-ivory-walnut',
        articleNumber: 'EV-NWL-WAL',
        price: 89990,
        oldPrice: 109990,
        stock: 3,
        priceLabel: formatPrice(89990),
        oldPriceLabel: formatPrice(109990),
      },
    });
    expect(dto.product).toEqual({
      name: '\u041a\u0440\u0435\u0441\u043b\u043e Graphite',
      description: 'Мягкое кресло с графитовой обивкой и каркасом из тёмного ореха для спокойных жилых пространств.',
      categoryName: 'Armchairs',
      categorySlug: 'armchairs',
    });
    expect(dto.sceneBackgroundUrl).toBe(PRODUCT_SCENE_BACKGROUND);
    expect(dto.turntable).toEqual({
      videoUrl: '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
      posterUrl: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
      fallbackUrl: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
      alt: 'Noma 360',
    });
    expect(JSON.parse(JSON.stringify(dto))).toEqual(dto);
  });

  it('returns every visual pair with one canonical server SKU and path', () => {
    const dto = buildShowcaseProductPageDto(product);

    expect(dto.combinations.map(({ upholstery, wood }) => [upholstery, wood])).toEqual([
      ['ivory', 'pine'],
      ['ivory', 'walnut'],
      ['charcoal', 'pine'],
      ['charcoal', 'walnut'],
      ['terracotta', 'pine'],
      ['terracotta', 'walnut'],
    ]);
    expect(new Set(dto.combinations.map((combination) => combination.sku.id)).size).toBe(6);
    for (const [upholstery, wood, canonicalOption, articleNumber, skuId] of canonicalPairs) {
      const combination = dto.combinations.find(
        (candidate) => candidate.upholstery === upholstery && candidate.wood === wood,
      );
      expect(combination).toMatchObject({
        canonicalOption,
        canonicalPath: `${SHOWCASE_PRODUCT_PATH}?option=${encodeURIComponent(canonicalOption)}`,
        chairUrl: PRODUCT_SCENE_CHAIRS[upholstery][wood],
        sku: { id: skuId, articleNumber, priceLabel: '89 990 ₽', oldPriceLabel: '109 990 ₽' },
      });
    }
  });

  it('merges partial or unknown canonical values over the default and redirects to canonical data', () => {
    expect(buildShowcaseProductPageDto(product, 'finish:oak').selected.canonicalOption).toBe(
      'finish:oak,upholstery:ivory-boucle',
    );
    expect(buildShowcaseProductPageDto(product, 'upholstery:unknown').selected.canonicalOption).toBe(
      'finish:walnut,upholstery:ivory-boucle',
    );
    expect(buildShowcaseProductPageDto(product, 'finish:walnut,upholstery:graphite').selected.canonicalPath).toBe(
      `${SHOWCASE_PRODUCT_PATH}?option=finish%3Awalnut%2Cupholstery%3Agraphite`,
    );
  });

  it('projects prices from each resolved SKU', () => {
    const pricedProduct = {
      ...product,
      skus: product.skus.map((sku, index) => ({ ...sku, price: 80000 + index, oldPrice: 100000 + index })),
    } satisfies FurnitureProductForSelection;
    const dto = buildShowcaseProductPageDto(pricedProduct);

    expect(dto.combinations.map(({ sku }) => [sku.price, sku.priceLabel])).toEqual(
      pricedProduct.skus.map((sku) => [sku.price, formatPrice(sku.price)]),
    );
  });

  it.each([
    ['incomplete matrix', (value: typeof product) => ({ ...value, skus: value.skus.slice(1) })],
    [
      'duplicate SKU',
      (value: typeof product) => ({ ...value, skus: value.skus.map((sku) => ({ ...sku, id: 'duplicate' })) }),
    ],
    ['missing turntable trio', (value: typeof product) => ({ ...value, media: value.media.slice(0, 1) })],
  ])('throws ShowcaseProductContractError for %s', (_label, mutate) => {
    expect(() => buildShowcaseProductPageDto(mutate(product))).toThrow(ShowcaseProductContractError);
  });

  it('throws from the resolver drift guard with six unique fixture SKU IDs', () => {
    const driftedProduct = {
      ...product,
      skus: product.skus.map((sku) =>
        sku.id === 'sku-ivory-pine' ? { ...sku, combinationKey: 'finish=oak|upholstery=graphite' } : sku,
      ),
    } satisfies FurnitureProductForSelection;

    expect(new Set(driftedProduct.skus.map((sku) => sku.id)).size).toBe(6);
    expect(() => buildShowcaseProductPageDto(driftedProduct)).toThrow(
      'Resolver drift for canonical showcase option finish:oak,upholstery:ivory-boucle',
    );
    expect(() => buildShowcaseProductPageDto(driftedProduct)).toThrow(ShowcaseProductContractError);
  });

  it('throws for unexpected selected option groups', () => {
    expect(() => buildShowcaseProductPageDto(product, 'finish:walnut,dimensions:bar')).toThrow(
      ShowcaseProductContractError,
    );
  });
});

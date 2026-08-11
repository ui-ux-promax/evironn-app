import { describe, expect, it } from 'vitest';
import { buildCombinationKey } from '@/lib/furniture-sku';
import { furnitureCategories, furnitureProducts } from '../prisma/seed-data';

describe('furniture SKU combinations', () => {
  it('builds canonical keys independent of option input order', () => {
    const first = buildCombinationKey([
      { groupSlug: 'finish', valueSlug: 'walnut' },
      { groupSlug: 'upholstery', valueSlug: 'ivory-boucle' },
    ]);
    const second = buildCombinationKey([
      { groupSlug: 'upholstery', valueSlug: 'ivory-boucle' },
      { groupSlug: 'finish', valueSlug: 'walnut' },
    ]);

    expect(first).toBe('finish=walnut|upholstery=ivory-boucle');
    expect(second).toBe(first);
  });

  it('rejects duplicate option groups', () => {
    expect(() =>
      buildCombinationKey([
        { groupSlug: 'finish', valueSlug: 'walnut' },
        { groupSlug: 'finish', valueSlug: 'oak' },
      ]),
    ).toThrow('Each SKU can contain only one value per option group');
  });
});

describe('furniture seed integrity', () => {
  it('contains 12 to 15 furniture products with unique SKU identities', () => {
    expect(furnitureProducts.length).toBeGreaterThanOrEqual(12);
    expect(furnitureProducts.length).toBeLessThanOrEqual(15);

    const productSlugs = furnitureProducts.map((product) => product.slug);
    const articleNumbers = furnitureProducts.flatMap((product) => product.skus.map((sku) => sku.articleNumber));
    const combinationKeys = furnitureProducts.flatMap((product) =>
      product.skus.map((sku) => `${product.slug}:${sku.combinationKey}`),
    );

    expect(new Set(productSlugs).size).toBe(productSlugs.length);
    expect(new Set(articleNumbers).size).toBe(articleNumbers.length);
    expect(new Set(combinationKeys).size).toBe(combinationKeys.length);
    expect(furnitureProducts.every((product) => product.optionGroups.length > 0)).toBe(true);
  });

  it('keeps one optional turntable product contract per category', () => {
    const turntableProducts = furnitureProducts.filter((product) => product.turntable);
    const turntableCategorySlugs = furnitureCategories
      .filter((category) => category.turntableProductSlug)
      .map((category) => category.slug);

    expect(turntableProducts).toHaveLength(1);
    expect(turntableProducts[0].media.filter((media) => media.kind === 'TURN_TABLE_VIDEO')).toHaveLength(1);
    expect(turntableProducts[0].media.filter((media) => media.kind === 'TURN_TABLE_POSTER')).toHaveLength(1);
    expect(turntableProducts[0].media.filter((media) => media.kind === 'TURN_TABLE_FALLBACK')).toHaveLength(1);
    expect(new Set(turntableCategorySlugs).size).toBe(turntableCategorySlugs.length);
    expect(turntableCategorySlugs).toContain(turntableProducts[0].categorySlug);
  });
});

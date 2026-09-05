import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCombinationKey } from '@/lib/furniture-sku';
import { furnitureCategories, furnitureProducts, rooms } from '../prisma/seed-data';

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
  it('defines the six canonical Noma showcase SKUs and audited turntable media', () => {
    const noma = furnitureProducts.find((product) => product.slug === 'noma-woven-lounge');

    expect(noma).toBeDefined();
    expect(noma?.optionGroups.find((group) => group.slug === 'finish')?.values.map((value) => value.slug)).toEqual([
      'oak',
      'walnut',
    ]);
    expect(noma?.optionGroups.find((group) => group.slug === 'upholstery')?.values.map(({ slug, swatchHex }) => [slug, swatchHex])).toEqual([
      ['ivory-boucle', '#efe7d8'],
      ['graphite', '#31312f'],
      ['terracotta', '#a85b43'],
    ]);

    const skus = noma?.skus ?? [];
    expect(skus).toHaveLength(6);
    expect(skus.every((sku) => sku.active)).toBe(true);
    expect(
      skus.map(({ articleNumber, combinationKey, price, oldPrice, stock }) => ({
        articleNumber,
        combinationKey,
        price,
        oldPrice,
        stock,
      })),
    ).toEqual([
      {
        articleNumber: 'EV-NWL-OAK',
        combinationKey: 'finish=oak|upholstery=ivory-boucle',
        price: 89990,
        oldPrice: 109990,
        stock: 3,
      },
      {
        articleNumber: 'EV-NWL-WAL',
        combinationKey: 'finish=walnut|upholstery=ivory-boucle',
        price: 89990,
        oldPrice: 109990,
        stock: 3,
      },
      {
        articleNumber: 'EV-NWL-GPH-OAK',
        combinationKey: 'finish=oak|upholstery=graphite',
        price: 89990,
        oldPrice: 109990,
        stock: 3,
      },
      {
        articleNumber: 'EV-NWL-GPH-WAL',
        combinationKey: 'finish=walnut|upholstery=graphite',
        price: 89990,
        oldPrice: 109990,
        stock: 3,
      },
      {
        articleNumber: 'EV-NWL-TER-OAK',
        combinationKey: 'finish=oak|upholstery=terracotta',
        price: 89990,
        oldPrice: 109990,
        stock: 3,
      },
      {
        articleNumber: 'EV-NWL-TER-WAL',
        combinationKey: 'finish=walnut|upholstery=terracotta',
        price: 89990,
        oldPrice: 109990,
        stock: 3,
      },
    ]);
    expect(noma?.media).toEqual([
      {
        kind: 'IMAGE',
        url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.webp',
        alt: 'Noma Woven Lounge',
        sortOrder: 0,
      },
      {
        kind: 'TURN_TABLE_VIDEO',
        url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
        alt: 'Noma Woven Lounge 360',
        sortOrder: 0,
      },
      {
        kind: 'TURN_TABLE_POSTER',
        url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.webp',
        alt: 'Noma Woven Lounge 360 poster',
        sortOrder: 0,
      },
      {
        kind: 'TURN_TABLE_FALLBACK',
        url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.webp',
        alt: 'Noma Woven Lounge static view',
        sortOrder: 0,
      },
    ]);
  });

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

  it('defines a complete valid option selection and canonical key for every SKU', () => {
    for (const product of furnitureProducts) {
      const groupSlugs = product.optionGroups.map((group) => group.slug);
      const valuesByGroup = new Map(
        product.optionGroups.map((group) => [group.slug, new Set(group.values.map((value) => value.slug))]),
      );
      expect(new Set(groupSlugs).size, product.slug).toBe(groupSlugs.length);

      for (const sku of product.skus) {
        expect(sku.selectedOptions.map((selection) => selection.groupSlug).sort(), sku.articleNumber).toEqual(
          [...groupSlugs].sort(),
        );
        for (const selection of sku.selectedOptions) {
          expect(valuesByGroup.get(selection.groupSlug)?.has(selection.valueSlug), sku.articleNumber).toBe(true);
        }
        expect(buildCombinationKey(sku.selectedOptions), sku.articleNumber).toBe(sku.combinationKey);
        expect(sku.price, sku.articleNumber).toBeGreaterThanOrEqual(0);
        expect(sku.stock, sku.articleNumber).toBeGreaterThanOrEqual(0);
        if (sku.oldPrice !== null) expect(sku.oldPrice, sku.articleNumber).toBeGreaterThan(sku.price);
      }
    }
  });

  it('references known rooms, categories and existing local media assets', () => {
    const roomSlugs = new Set(rooms.map((room) => room.slug));
    const categorySlugs = new Set(furnitureCategories.map((category) => category.slug));

    for (const product of furnitureProducts) {
      expect(categorySlugs.has(product.categorySlug), product.slug).toBe(true);
      expect(product.roomSlugs.length, product.slug).toBeGreaterThan(0);
      expect(
        product.roomSlugs.every((slug) => roomSlugs.has(slug)),
        product.slug,
      ).toBe(true);
      expect(
        product.media.some((media) => media.kind === 'IMAGE'),
        product.slug,
      ).toBe(true);
      for (const media of product.media) {
        if (media.url.startsWith('/')) {
          expect(existsSync(resolve(process.cwd(), 'public', media.url.slice(1))), media.url).toBe(true);
        }
      }
    }
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

import { describe, expect, it } from 'vitest';
import type { FurnitureProductForCard } from '@/lib/furniture-product-summary';
import { buildFurnitureProductCardData } from '@/lib/furniture-product-summary';

const category = { name: 'Кресла', slug: 'armchairs' };

const productMedia = [
  {
    id: 'media-oak',
    productId: 'product-chair',
    kind: 'IMAGE' as const,
    url: '/assets/products/chair-oak.webp',
    publicId: null,
    alt: 'Oak chair',
    sortOrder: 0,
  },
  {
    id: 'media-walnut',
    productId: 'product-chair',
    kind: 'IMAGE' as const,
    url: '/assets/products/chair-walnut.webp',
    publicId: null,
    alt: 'Walnut chair',
    sortOrder: 1,
  },
];

const makeSelection = (
  groupSlug: string,
  groupName: string,
  valueSlug: string,
  valueName: string,
  swatchHex: string,
  skuId = 'sku-fixture',
) => ({
  skuId,
  optionGroupId: `group-${groupSlug}`,
  optionValueId: `value-${valueSlug}`,
  optionGroup: {
    id: `group-${groupSlug}`,
    name: groupName,
    slug: groupSlug,
    sortOrder: groupSlug === 'finish' ? 1 : 2,
  },
  optionValue: {
    id: `value-${valueSlug}`,
    optionGroupId: `group-${groupSlug}`,
    name: valueName,
    slug: valueSlug,
    swatchHex,
    sortOrder: valueSlug === 'oak' ? 0 : 1,
  },
});

const baseProduct = {
  id: 'product-chair',
  name: 'Noma Woven Lounge',
  slug: 'noma-woven-lounge',
  brand: 'Evironn',
  gender: 'UNISEX' as const,
  categoryId: 'category-armchairs',
  description: null,
  fitNote: null,
  specs: null,
  isBestseller: true,
  active: true,
  sortOrder: 1,
  salesCount: 10,
  minPrice: 0,
  discountPct: 0,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  category,
  media: productMedia,
};

const product = {
  ...baseProduct,
  skus: [
    {
      id: 'sku-cheap',
      productId: baseProduct.id,
      combinationKey: 'finish=oak',
      articleNumber: 'EV-NWL-OAK',
      price: 124000,
      oldPrice: 139000,
      stock: 3,
      active: true,
      media: [],
      selections: [makeSelection('finish', 'Отделка', 'oak', 'Дуб', '#c8a97e')],
    },
    {
      id: 'sku-walnut',
      productId: baseProduct.id,
      combinationKey: 'finish=walnut',
      articleNumber: 'EV-NWL-WAL',
      price: 129000,
      oldPrice: 139000,
      stock: 2,
      active: true,
      media: [],
      selections: [makeSelection('finish', 'Отделка', 'walnut', 'Орех', '#6b4a30')],
    },
    {
      id: 'sku-inactive',
      productId: baseProduct.id,
      combinationKey: 'finish=black',
      articleNumber: 'EV-NWL-BLK',
      price: 1000,
      oldPrice: 2000,
      stock: 50,
      active: false,
      media: [],
      selections: [makeSelection('finish', 'Отделка', 'black', 'Чёрный', '#111111')],
    },
  ],
} satisfies FurnitureProductForCard;

describe('canonical furniture product card projection', () => {
  it('projects the cheapest in-stock canonical SKU and unique furniture swatches', () => {
    const card = buildFurnitureProductCardData(product, new Date('2026-08-11T00:00:00.000Z'), {
      newWindowDays: 30,
      lowStock: 3,
    });

    expect(card.primarySkuId).toBe('sku-cheap');
    expect(card.primaryOption).toBe('finish:oak');
    expect(card.minPrice).toBe(124000);
    expect(card.minOldPrice).toBe(139000);
    expect(card.imageUrl).toBe('/assets/products/chair-oak.webp');
    expect(card.soldOut).toBe(false);
    expect(card.optionSwatches).toEqual([
      { groupSlug: 'finish', valueSlug: 'oak', label: 'Дуб', swatchHex: '#c8a97e' },
      { groupSlug: 'finish', valueSlug: 'walnut', label: 'Орех', swatchHex: '#6b4a30' },
    ]);
    expect(card).not.toHaveProperty('colorways');
    expect(card).not.toHaveProperty('sizes');
  });

  it('ignores inactive SKUs and falls back to the first ordered product image when sold out', () => {
    const soldOutProduct = {
      ...product,
      skus: product.skus.map((sku) =>
        sku.id === 'sku-cheap'
          ? { ...sku, active: true, stock: 0, price: 125000, oldPrice: 140000, media: [] }
          : sku.id === 'sku-walnut'
            ? { ...sku, active: false, stock: 99, price: 1, oldPrice: 2, media: [] }
            : sku,
      ),
    } satisfies FurnitureProductForCard;

    const card = buildFurnitureProductCardData(soldOutProduct, new Date('2026-08-11T00:00:00.000Z'), {
      newWindowDays: 30,
      lowStock: 3,
    });

    expect(card.primarySkuId).toBe('sku-cheap');
    expect(card.minPrice).toBe(125000);
    expect(card.minOldPrice).toBe(140000);
    expect(card.imageUrl).toBe('/assets/products/chair-oak.webp');
    expect(card.soldOut).toBe(true);
    expect(card.optionSwatches.map((swatch) => swatch.valueSlug)).toEqual(['oak']);
  });
});

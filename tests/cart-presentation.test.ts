import { describe, expect, it } from 'vitest';
import { buildCartDto } from '@/lib/cart-presentation';
import type { CartWithItems } from '@/lib/cart-details';

function canonicalCart(): CartWithItems {
  return {
    id: 'cart-1',
    token: 'token-1',
    userId: null,
    totalAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'line-1',
        cartId: 'cart-1',
        skuId: 'sku-1',
        productVariantId: null,
        quantity: 2,
        createdAt: new Date(),
        sku: {
          id: 'sku-1',
          productId: 'product-1',
          combinationKey: 'finish=walnut,upholstery=linen',
          articleNumber: 'EV-NOMA-WAL-LIN',
          price: 80000,
          oldPrice: 100000,
          stock: 3,
          active: true,
          product: {
            id: 'product-1',
            name: 'Кресло Noma',
            slug: 'noma',
            active: true,
            media: [{ id: 'product-media', url: '/product.jpg', alt: 'Product', sortOrder: 0 }],
          },
          media: [{ id: 'sku-media', url: '/sku.jpg', alt: 'SKU', sortOrder: 0 }],
          selections: [
            {
              optionGroup: { name: 'Дерево', slug: 'finish', sortOrder: 2 },
              optionValue: { name: 'Орех', slug: 'walnut', swatchHex: '#6b4226', sortOrder: 1 },
            },
            {
              optionGroup: { name: 'Обивка', slug: 'upholstery', sortOrder: 1 },
              optionValue: { name: 'Лён', slug: 'linen', swatchHex: null, sortOrder: 1 },
            },
          ],
        },
        productVariant: null,
      },
      {
        id: 'line-2',
        cartId: 'cart-1',
        skuId: 'sku-2',
        productVariantId: null,
        quantity: 1,
        createdAt: new Date(),
        sku: {
          id: 'sku-2',
          productId: 'product-2',
          combinationKey: 'finish=oak',
          articleNumber: 'EV-CHAIR-OAK',
          price: 25000,
          oldPrice: null,
          stock: 0,
          active: true,
          product: {
            id: 'product-2',
            name: 'Стул Oak',
            slug: 'oak-chair',
            active: true,
            media: [{ id: 'fallback-media', url: '/product-fallback.jpg', alt: null, sortOrder: 0 }],
          },
          media: [],
          selections: [],
        },
        productVariant: null,
      },
    ],
  } as unknown as CartWithItems;
}

describe('buildCartDto', () => {
  it('projects canonical SKU identity, ordered options, media fallback, totals, and counts', () => {
    const dto = buildCartDto(canonicalCart(), 10);

    expect(dto.items[0]).toMatchObject({
      id: 'line-1',
      skuId: 'sku-1',
      articleNumber: 'EV-NOMA-WAL-LIN',
      imageUrl: '/sku.jpg',
      unitPrice: 80000,
      oldUnitPrice: 100000,
      lineTotal: 160000,
      compareAtLineTotal: 200000,
      available: true,
    });
    expect(dto.items[0].configuration).toEqual([
      {
        groupSlug: 'upholstery',
        groupName: 'Обивка',
        valueSlug: 'linen',
        valueName: 'Лён',
        swatchHex: null,
      },
      {
        groupSlug: 'finish',
        groupName: 'Дерево',
        valueSlug: 'walnut',
        valueName: 'Орех',
        swatchHex: '#6b4226',
      },
    ]);
    expect(dto.items[1]).toMatchObject({ imageUrl: '/product-fallback.jpg', available: false });
    expect(dto.totals).toEqual({
      subtotal: 185000,
      compareAtSubtotal: 225000,
      saleDiscount: 40000,
      couponDiscount: 18500,
      total: 166500,
      itemCount: 3,
      lineCount: 2,
    });
  });

  it('returns an empty canonical snapshot', () => {
    const cart = canonicalCart();
    cart.items = [];
    expect(buildCartDto(cart)).toEqual({
      items: [],
      totals: {
        subtotal: 0,
        compareAtSubtotal: 0,
        saleDiscount: 0,
        couponDiscount: 0,
        total: 0,
        itemCount: 0,
        lineCount: 0,
      },
    });
  });

  it('projects inherited ProductVariant rows for reads without exposing them as a new write shape', () => {
    const cart = canonicalCart();
    cart.items = [
      {
        id: 'legacy-line',
        cartId: 'cart-1',
        skuId: null,
        productVariantId: 'variant-1',
        quantity: 1,
        createdAt: new Date(),
        sku: null,
        productVariant: {
          id: 'variant-1',
          colorwayId: 'colorway-1',
          size: 'M',
          sku: 'LEGACY-M',
          price: 12000,
          compareAtPrice: 15000,
          stock: 2,
          active: true,
          colorway: {
            id: 'colorway-1',
            productId: 'product-legacy',
            name: 'Молочный',
            slug: 'milk',
            swatchHex: '#f4efe7',
            isDefault: true,
            sortOrder: 1,
            product: { id: 'product-legacy', name: 'Legacy', slug: 'legacy', active: true, media: [] },
            images: [{ id: 'legacy-image', colorwayId: 'colorway-1', url: '/legacy.jpg', alt: null, sortOrder: 0 }],
          },
        },
      },
    ] as unknown as CartWithItems['items'];

    const line = buildCartDto(cart).items[0];
    expect(line).toMatchObject({
      productVariantId: 'variant-1',
      skuId: null,
      articleNumber: 'LEGACY-M',
      available: true,
    });
    expect(line).not.toHaveProperty('skuWriteInput');
  });
});

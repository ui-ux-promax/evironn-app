import { describe, it, expect } from 'vitest';
import { buildOrderSnapshot, formatOrderItemConfiguration } from '@/lib/order';
import type { CartWithItems } from '@/lib/cart-details';

function fakeCart(): CartWithItems {
  return {
    id: 'c1',
    token: 't',
    userId: 'u1',
    totalAmount: 0,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    items: [
      {
        id: 'ci1',
        cartId: 'c1',
        productVariantId: 'v1',
        quantity: 2,
        createdAt: new Date(0),
        productVariant: {
          id: 'v1',
          sku: 'SKU-1',
          price: 5000,
          size: 'L',
          stock: 9,
          active: true,
          colorway: {
            name: 'Black',
            product: { name: 'RITM Белая футболка Oversize', slug: 'ritm-white-tee-oversize', active: true },
            images: [{ url: '/img/1.jpg' }],
          },
        },
      },
    ],
  } as unknown as CartWithItems;
}

describe('buildOrderSnapshot', () => {
  it('строит снапшот позиций и считает itemsTotal', () => {
    const snap = buildOrderSnapshot(fakeCart());
    expect(snap.itemsTotal).toBe(10000);
    expect(snap.items).toEqual([
      {
        productVariantId: 'v1',
        sku: 'SKU-1',
        productName: 'RITM Белая футболка Oversize',
        colorwayName: 'Black',
        size: 'L',
        imageUrl: '/img/1.jpg',
        unitPrice: 5000,
        quantity: 2,
        lineTotal: 10000,
      },
    ]);
  });

  it('stores SKU identity, selected configuration, image, and pricing snapshot', () => {
    const cart = {
      items: [
        {
          id: 'ci2',
          quantity: 1,
          sku: {
            id: 'sku2',
            articleNumber: 'EV-NWL-OAK',
            combinationKey: 'finish=oak|upholstery=ivory-boucle',
            price: 124000,
            oldPrice: 139000,
            product: { name: 'Noma Woven Lounge', slug: 'noma-woven-lounge' },
            media: [{ url: '/assets/noma.webp' }],
            selections: [
              {
                optionGroup: { name: 'Отделка', slug: 'finish' },
                optionValue: { name: 'Дуб', slug: 'oak' },
              },
              {
                optionGroup: { name: 'Обивка', slug: 'upholstery' },
                optionValue: { name: 'Кремовая букле', slug: 'ivory-boucle' },
              },
            ],
          },
        },
      ],
    } as unknown as CartWithItems;

    expect(buildOrderSnapshot(cart).items[0]).toEqual({
      skuId: 'sku2',
      skuArticleNumber: 'EV-NWL-OAK',
      skuCombinationKey: 'finish=oak|upholstery=ivory-boucle',
      productName: 'Noma Woven Lounge',
      productSlug: 'noma-woven-lounge',
      configuration: [
        { groupSlug: 'finish', groupName: 'Отделка', valueSlug: 'oak', valueName: 'Дуб' },
        { groupSlug: 'upholstery', groupName: 'Обивка', valueSlug: 'ivory-boucle', valueName: 'Кремовая букле' },
      ],
      imageUrl: '/assets/noma.webp',
      unitPrice: 124000,
      oldUnitPrice: 139000,
      quantity: 1,
      lineTotal: 124000,
    });
  });

  it('falls back to product media when the SKU has no image', () => {
    const cart = {
      items: [
        {
          id: 'ci3',
          quantity: 1,
          sku: {
            id: 'sku3',
            articleNumber: 'EV-NWL-WALNUT',
            combinationKey: 'finish=walnut',
            price: 125000,
            oldPrice: null,
            product: {
              name: 'Noma Woven Lounge',
              slug: 'noma-woven-lounge',
              media: [{ url: '/assets/noma-product.webp' }],
            },
            media: [],
            selections: [],
          },
        },
      ],
    } as unknown as CartWithItems;

    expect(buildOrderSnapshot(cart).items[0].imageUrl).toBe('/assets/noma-product.webp');
  });
});

describe('formatOrderItemConfiguration', () => {
  it('formats canonical immutable configuration JSON', () => {
    expect(
      formatOrderItemConfiguration({
        configuration: [
          { groupName: 'Finish', valueName: 'Oak' },
          { groupName: 'Fabric', valueName: 'Ivory' },
        ],
      }),
    ).toBe('Finish: Oak · Fabric: Ivory');
  });

  it('falls back to legacy snapshot fields and ignores malformed JSON', () => {
    expect(formatOrderItemConfiguration({ configuration: { unsafe: true }, colorwayName: 'Black', size: 'M' })).toBe(
      'Black · Размер M',
    );
  });
});

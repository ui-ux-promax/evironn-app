import { describe, it, expect } from 'vitest';
import { buildOrderSnapshot } from '@/lib/order';
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
});

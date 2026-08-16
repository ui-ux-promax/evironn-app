import { describe, expect, it, vi } from 'vitest';
import { buildCheckoutOrderData, type CheckoutDataClient } from '@/lib/checkout-page';
import { buildDeliverySlots } from '@/lib/checkout-domain';

const now = new Date('2026-08-16T09:00:00.000Z');
const slot = buildDeliverySlots(now, 'pickup-point')[0];
const raw = {
  deliveryMethod: 'pickup-point',
  deliverySlotId: slot.id,
  pickupPointId: 'pt-danilov',
  services: { carrying: false, assembly: false, removal: false },
};
const cart = {
  id: 'cart-1',
  userId: 'user-1',
  token: 'token',
  totalAmount: 0,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  items: [
    {
      id: 'line-1',
      cartId: 'cart-1',
      skuId: 'sku-1',
      productVariantId: null,
      quantity: 1,
      createdAt: new Date(0),
      productVariant: null,
      sku: {
        id: 'sku-1',
        articleNumber: 'EV-1',
        combinationKey: 'finish=oak',
        price: 100000,
        oldPrice: null,
        stock: 2,
        active: true,
        media: [],
        selections: [],
        product: { id: 'product-1', name: 'Noma', slug: 'noma', active: true, media: [] },
      },
    },
  ],
};

function client(coupon: { code: string; percent: number; active: boolean; expiresAt: Date | null } | null) {
  return {
    cart: { findFirst: vi.fn(async () => cart) },
    coupon: { findUnique: vi.fn(async () => coupon) },
  } as unknown as CheckoutDataClient;
}

describe('transactional order coupon snapshot', () => {
  it('re-reads eligible coupon through transaction client and snapshots server discount', async () => {
    const transaction = client({ code: 'EV10', percent: 10, active: true, expiresAt: null });
    const result = await buildCheckoutOrderData({
      userId: 'user-1',
      cartId: 'cart-1',
      raw: { ...raw, couponCode: 'ev10' },
      now,
      client: transaction,
    });
    expect(transaction.coupon.findUnique).toHaveBeenCalledWith({ where: { code: 'EV10' } });
    expect(result.quote.coupon).toEqual({ code: 'EV10', percent: 10 });
    expect(result.quote.totals).toMatchObject({ itemsSubtotal: 100000, couponDiscount: 10000, total: 90000 });
  });

  it('does not invent coupon usage writes or compensation', async () => {
    const transaction = client(null);
    const result = await buildCheckoutOrderData({ userId: 'user-1', cartId: 'cart-1', raw, now, client: transaction });
    expect(result.quote.coupon).toBeNull();
    expect(result.quote.totals.couponDiscount).toBe(0);
    expect(transaction.coupon.findUnique).not.toHaveBeenCalled();
    expect(transaction).not.toHaveProperty('couponUsage');
  });

  it('rejects an expired coupon before stock/order writes can start', async () => {
    const transaction = client({ code: 'OLD', percent: 50, active: true, expiresAt: new Date('2020-01-01') });
    await expect(
      buildCheckoutOrderData({
        userId: 'user-1',
        cartId: 'cart-1',
        raw: { ...raw, couponCode: 'OLD' },
        now,
        client: transaction,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_COUPON' });
  });
});

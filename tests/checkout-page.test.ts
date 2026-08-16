import { describe, expect, it, vi } from 'vitest';
import { cartPresentationInclude } from '@/lib/cart-presentation';
import { buildCheckoutQuote, getCheckoutPageDto } from '@/lib/checkout-page';

const now = new Date('2026-08-16T12:00:00.000Z');

function canonicalCart() {
  return {
    id: 'cart-owner',
    token: 'owner-token',
    userId: 'user-1',
    totalAmount: 0,
    createdAt: now,
    updatedAt: now,
    items: [
      {
        id: 'line-1',
        cartId: 'cart-owner',
        skuId: 'sku-1',
        productVariantId: null,
        quantity: 2,
        createdAt: now,
        updatedAt: now,
        productVariant: null,
        sku: {
          id: 'sku-1',
          productId: 'product-1',
          articleNumber: 'EV-001',
          combinationKey: 'finish:oak',
          price: 50_000,
          oldPrice: 60_000,
          stock: 3,
          active: true,
          createdAt: now,
          updatedAt: now,
          product: { id: 'product-1', name: 'Стол', slug: 'table', active: true, media: [] },
          media: [],
          selections: [],
        },
      },
    ],
  };
}

function client(cart: ReturnType<typeof canonicalCart> | null = canonicalCart()) {
  return {
    user: {
      findUnique: vi.fn(async () => ({
        name: 'Иван Петров',
        email: 'owner@example.com',
        phone: '+79990000000',
        passwordHash: 'never-serialize',
        addresses: [
          {
            id: 'address-2',
            label: 'Дача',
            city: 'Химки',
            street: 'ул. Ленина, дом 1, кв. 7',
            comment: 'Позвонить заранее',
            isDefault: false,
            createdAt: new Date('2026-08-02T00:00:00Z'),
          },
          {
            id: 'address-1',
            label: 'Дом',
            city: 'Москва',
            street: 'Тверская, 10',
            comment: null,
            isDefault: true,
            createdAt: new Date('2026-08-03T00:00:00Z'),
          },
        ],
      })),
    },
    cart: { findFirst: vi.fn(async () => cart) },
    coupon: {
      findUnique: vi.fn(async () => ({
        code: 'PHASE4',
        percent: 10,
        active: true,
        expiresAt: new Date('2026-08-20T00:00:00.000Z'),
      })),
    },
  };
}

const quoteRaw = {
  deliveryMethod: 'courier',
  deliveryZone: 'moscow',
  deliverySlotId: '2026-08-18:10-14',
  address: {
    city: 'Москва',
    addressLine: 'ул. Ленина, дом 1, кв. 7',
    addressComment: 'Позвонить заранее',
  },
  services: { carrying: false, assembly: true, removal: false },
  couponCode: ' phase4 ',
};

describe('getCheckoutPageDto', () => {
  it('reads only the authenticated owner cart and returns a serializable default-first model', async () => {
    const db = client();

    const result = await getCheckoutPageDto({
      userId: 'user-1',
      cookieToken: 'stolen-cart-token',
      now,
      client: db,
    });

    expect(db.cart.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: cartPresentationInclude,
    });
    expect(result.status).toBe('READY');
    expect(result.contactDefaults).toEqual({
      contactName: 'Иван Петров',
      contactEmail: 'owner@example.com',
      contactPhone: '+79990000000',
    });
    expect(result.savedAddresses.map((address) => address.id)).toEqual(['address-1', 'address-2']);
    expect(result.savedAddresses[1]).toEqual({
      id: 'address-2',
      label: 'Дача',
      city: 'Химки',
      street: 'ул. Ленина, дом 1, кв. 7',
      comment: 'Позвонить заранее',
      isDefault: false,
    });
    expect(result.addressDefaults).toEqual({
      city: 'Москва',
      addressLine: 'Тверская, 10',
      addressComment: null,
    });
    expect(result.initialCart.totals.subtotal).toBe(100_000);
    expect(result.deliveryOptions.map((option) => option.id)).toEqual(['courier', 'showroom', 'pickup-point']);
    expect(result.pickupPoints).toHaveLength(3);
    expect(result.initialSlots.courier).toHaveLength(12);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('user-1');
    expect(serialized).not.toContain('never-serialize');
    expect(serialized).not.toContain('stolen-cart-token');
    expect(serialized).not.toContain('createdAt');
  });

  it('returns EMPTY_CART without creating a cart', async () => {
    const db = client(null);

    const result = await getCheckoutPageDto({ userId: 'user-1', cookieToken: 'cookie', now, client: db });

    expect(result.status).toBe('EMPTY_CART');
    expect(result.initialCart.items).toEqual([]);
    expect(db.cart.findFirst).toHaveBeenCalledTimes(1);
    expect('create' in db.cart).toBe(false);
  });

  it('fails closed when the owner cart contains a legacy or inactive line', async () => {
    const inactive = canonicalCart();
    inactive.items[0].sku.active = false;

    await expect(
      getCheckoutPageDto({ userId: 'user-1', cookieToken: undefined, now, client: client(inactive) }),
    ).rejects.toThrow('Canonical active checkout cart required');

    const legacy = canonicalCart();
    legacy.items[0].sku = null as never;
    const legacyLine = legacy.items[0] as unknown as { productVariantId: string | null; productVariant: unknown };
    legacyLine.productVariantId = 'legacy-variant';
    legacyLine.productVariant = {};

    await expect(
      getCheckoutPageDto({ userId: 'user-1', cookieToken: undefined, now, client: client(legacy) }),
    ).rejects.toThrow('Canonical active checkout cart required');
  });
});

describe('buildCheckoutQuote', () => {
  it('re-reads canonical cart facts and calculates all money on the server', async () => {
    const db = client();

    const result = await buildCheckoutQuote({
      userId: 'user-1',
      cookieToken: 'stolen-token',
      raw: quoteRaw,
      now,
      client: db,
    });

    expect(result).toEqual({
      ok: true,
      quote: {
        cart: expect.objectContaining({ items: [expect.objectContaining({ skuId: 'sku-1', unitPrice: 50_000 })] }),
        coupon: { code: 'PHASE4', percent: 10 },
        delivery: {
          method: 'courier',
          zone: 'moscow',
          slot: { id: '2026-08-18:10-14', date: '2026-08-18', windowId: '10-14', windowLabel: '10:00 – 14:00' },
          pickupPoint: null,
        },
        serviceLines: [{ id: 'assembly', label: 'Сборка', amount: 3900 }],
        totals: {
          itemsSubtotal: 100_000,
          compareAtSubtotal: 120_000,
          saleDiscount: 20_000,
          couponDiscount: 10_000,
          deliveryAmount: 1900,
          serviceAmount: 3900,
          total: 95_800,
          itemCount: 2,
          lineCount: 1,
        },
      },
    });
    expect(db.cart.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: cartPresentationInclude,
    });
    expect(db.coupon.findUnique).toHaveBeenCalledWith({ where: { code: 'PHASE4' } });
  });

  it('rejects stale slots, unavailable SKUs, and quantities above current stock', async () => {
    await expect(
      buildCheckoutQuote({
        userId: 'user-1',
        cookieToken: undefined,
        raw: { ...quoteRaw, deliverySlotId: '2026-08-30:10-14' },
        now,
        client: client(),
      }),
    ).resolves.toMatchObject({ ok: false, code: 'STALE_DELIVERY_SLOT' });

    const inactive = canonicalCart();
    inactive.items[0].sku.active = false;
    await expect(
      buildCheckoutQuote({ userId: 'user-1', raw: quoteRaw, now, client: client(inactive) }),
    ).resolves.toMatchObject({ ok: false, code: 'SKU_UNAVAILABLE' });

    const overstock = canonicalCart();
    overstock.items[0].quantity = 4;
    await expect(
      buildCheckoutQuote({ userId: 'user-1', raw: quoteRaw, now, client: client(overstock) }),
    ).resolves.toMatchObject({ ok: false, code: 'QUANTITY_EXCEEDS_STOCK', stock: 3 });
  });

  it('rejects empty carts, invalid coupon, and forged input with typed errors', async () => {
    await expect(
      buildCheckoutQuote({ userId: 'user-1', raw: quoteRaw, now, client: client(null) }),
    ).resolves.toMatchObject({ ok: false, code: 'EMPTY_CART' });

    const badCoupon = client();
    badCoupon.coupon.findUnique.mockResolvedValueOnce(null as never);
    await expect(
      buildCheckoutQuote({ userId: 'user-1', raw: quoteRaw, now, client: badCoupon }),
    ).resolves.toMatchObject({ ok: false, code: 'INVALID_COUPON' });

    await expect(
      buildCheckoutQuote({ userId: 'user-1', raw: { ...quoteRaw, price: 1 }, now, client: client() }),
    ).resolves.toMatchObject({ ok: false, code: 'INVALID_INPUT' });
  });
});

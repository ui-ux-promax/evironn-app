import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDeliverySlots } from '@/lib/checkout-domain';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cookies: vi.fn(),
  resolveOwnerCart: vi.fn(),
  transaction: vi.fn(),
  orderCreate: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/cart', () => ({ resolveOwnerCart: mocks.resolveOwnerCart }));
vi.mock('@/lib/prisma-client', () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock('@/lib/payment-initialization', () => ({ ensureOnlinePayment: vi.fn() }));
vi.mock('@/lib/yookassa', () => ({
  validateYooKassaConfiguration: vi.fn(),
  cancelPayment: vi.fn(),
  siteUrl: () => 'https://preview.test',
  toOrigin: (value: string) => value,
}));
vi.mock('@/lib/sales-count', () => ({ adjustSalesCount: vi.fn() }));
vi.mock('@/app/actions/address', () => ({ saveAddressFromOrder: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

import { placeOrder } from '@/app/actions/order';

const now = new Date('2026-08-16T09:00:00.000Z');
const slot = buildDeliverySlots(now, 'pickup-point')[0];
const courierSlot = buildDeliverySlots(now, 'courier')[0];
const form = {
  contactName: 'Ivan Petrov',
  contactPhone: '+79990000000',
  contactEmail: 'ivan@example.test',
  deliveryMethod: 'pickup-point',
  deliverySlotId: slot.id,
  pickupPointId: 'pt-danilov',
  services: { carrying: false, assembly: false, removal: false },
  paymentMethod: 'cod',
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'token' }) });
  mocks.resolveOwnerCart.mockResolvedValue({ id: 'cart-1', token: 'token' });
  mocks.orderCreate.mockResolvedValue({ id: 'order-1', orderNumber: 1042, createdAt: now, totalAmount: 100000 });
  const transaction = {
    cart: { findFirst: vi.fn(async () => cart) },
    coupon: { findUnique: vi.fn() },
    sku: { updateMany: vi.fn(async () => ({ count: 1 })) },
    order: { create: mocks.orderCreate },
    cartItem: { deleteMany: vi.fn(async () => ({ count: 1 })) },
  };
  mocks.transaction.mockImplementation(async (operation: (client: typeof transaction) => unknown) =>
    operation(transaction),
  );
});

describe('placeOrder and checkout builder integration', () => {
  it('projects a valid full placement form into the strict quote schema', async () => {
    await expect(placeOrder(form)).resolves.toEqual({ ok: true, code: 'ORDER_READY', orderNumber: 1042 });
    expect(mocks.orderCreate).toHaveBeenCalledOnce();
  });

  it('reruns real transaction-aware authority after P2034 and commits only second-attempt values', async () => {
    const conflict = Object.assign(new Error('conflict'), { code: 'P2034' });
    const secondCart = {
      ...cart,
      items: [
        {
          ...cart.items[0],
          sku: {
            ...cart.items[0].sku,
            price: 120000,
            stock: 5,
            media: [{ url: '/second.webp' }],
            selections: [
              {
                optionGroup: { name: 'Finish', slug: 'finish', sortOrder: 0 },
                optionValue: { name: 'Walnut', slug: 'walnut', swatchHex: null },
              },
            ],
          },
        },
      ],
    };
    const transactionFor = (authoritativeCart: typeof cart, percent: number) => ({
      cart: { findFirst: vi.fn(async () => authoritativeCart) },
      coupon: {
        findUnique: vi.fn(async () => ({ code: 'EV10', percent, active: true, expiresAt: null })),
      },
      sku: { updateMany: vi.fn(async () => ({ count: 1 })) },
      order: {
        create: vi.fn(async () => ({ id: 'order-1', orderNumber: 1042, createdAt: now, totalAmount: 99900 })),
      },
      cartItem: { deleteMany: vi.fn(async () => ({ count: 1 })) },
    });
    const first = transactionFor(cart, 10);
    const second = transactionFor(secondCart as typeof cart, 20);
    let attempt = 0;
    mocks.transaction.mockImplementation(async (operation: (client: typeof first) => unknown) => {
      attempt += 1;
      const result = await operation(attempt === 1 ? first : second);
      if (attempt === 1) throw conflict;
      return result;
    });

    await expect(
      placeOrder({
        ...form,
        deliveryMethod: 'courier',
        deliveryZone: 'moscow',
        deliverySlotId: courierSlot.id,
        pickupPointId: undefined,
        address: { city: 'Moscow', addressLine: 'Tverskaya 1', floor: 2, liftType: 'passenger' },
        couponCode: 'EV10',
        services: { carrying: false, assembly: true, removal: false },
      }),
    ).resolves.toEqual({ ok: true, code: 'ORDER_READY', orderNumber: 1042 });

    for (const tx of [first, second]) {
      expect(tx.cart.findFirst).toHaveBeenCalledTimes(2);
      expect(tx.coupon.findUnique).toHaveBeenCalledOnce();
      expect(tx.sku.updateMany).toHaveBeenCalledOnce();
      expect(tx.order.create).toHaveBeenCalledOnce();
      expect(tx.cartItem.deleteMany).toHaveBeenCalledOnce();
    }
    expect(second.sku.updateMany).toHaveBeenCalledWith({
      where: { id: 'sku-1', active: true, stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    });
    expect(second.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemsTotal: 120000,
        discountAmount: 24000,
        serviceAmount: 3900,
        shippingAmount: 1900,
        totalAmount: 101800,
        couponCode: 'EV10',
        deliveryWindow: courierSlot.windowLabel,
        serviceDetails: [{ id: 'assembly', label: 'Сборка', amount: 3900 }],
        items: {
          create: [
            expect.objectContaining({
              skuId: 'sku-1',
              imageUrl: '/second.webp',
              unitPrice: 120000,
              lineTotal: 120000,
              configuration: [{ groupSlug: 'finish', groupName: 'Finish', valueSlug: 'walnut', valueName: 'Walnut' }],
            }),
          ],
        },
      }),
      select: { id: true, orderNumber: true, createdAt: true, totalAmount: true },
    });
  });
});

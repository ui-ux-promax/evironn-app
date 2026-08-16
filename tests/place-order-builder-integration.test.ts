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
});

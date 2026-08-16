import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBlockedPaymentInitializationDto } from '@/services/dto/checkout-page.dto';
import { buildDeliverySlots } from '@/lib/checkout-domain';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cookies: vi.fn(),
  resolveOwnerCart: vi.fn(),
  buildCheckoutOrderData: vi.fn(),
  ensureOnlinePayment: vi.fn(),
  assertPaymentMode: vi.fn(),
  validateYooKassaConfiguration: vi.fn(),
  transaction: vi.fn(),
  orderUpdate: vi.fn(),
}));
vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/cart', () => ({ resolveOwnerCart: mocks.resolveOwnerCart }));
vi.mock('@/lib/checkout-page', () => ({ buildCheckoutOrderData: mocks.buildCheckoutOrderData }));
vi.mock('@/lib/payment-initialization', () => ({ ensureOnlinePayment: mocks.ensureOnlinePayment }));
vi.mock('@/lib/payment-environment', () => ({ assertPortfolioPaymentMode: mocks.assertPaymentMode }));
vi.mock('@/lib/yookassa', () => ({
  validateYooKassaConfiguration: mocks.validateYooKassaConfiguration,
  cancelPayment: vi.fn(),
  siteUrl: () => 'https://preview.test',
  toOrigin: (value: string) => value,
}));
vi.mock('@/lib/sales-count', () => ({ adjustSalesCount: vi.fn() }));
vi.mock('@/app/actions/address', () => ({ saveAddressFromOrder: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/prisma-client', () => ({ prisma: { $transaction: mocks.transaction } }));

import { placeOrder } from '@/app/actions/order';
import type { PlaceOrderResult } from '@/services/dto/order.dto';

const invalidBlockedResult: PlaceOrderResult = {
  ok: false,
  code: 'PAYMENT_INITIALIZATION_BLOCKED',
  // @ts-expect-error blocked placement must carry the exact DTO and no generic error branch
  error: 'generic',
};
void invalidBlockedResult;

const now = new Date('2026-08-16T09:00:00.000Z');
const originalYooKassaMode = process.env.YOOKASSA_MODE;
const slot = buildDeliverySlots(now, 'pickup-point')[0];
const form = {
  contactName: 'Иван Петров',
  contactPhone: '+79990000000',
  contactEmail: 'ivan@example.test',
  deliveryMethod: 'pickup-point',
  deliverySlotId: slot.id,
  pickupPointId: 'pt-danilov',
  services: { carrying: false, assembly: false, removal: false },
  paymentMethod: 'online',
};
const data = {
  cartId: 'cart-1',
  cartItemIds: ['line-1'],
  salesItems: [{ productId: 'product-1', quantity: 1 }],
  snapshot: {
    itemsTotal: 100000,
    items: [{ skuId: 'sku-1', productName: 'Noma', imageUrl: null, unitPrice: 100000, quantity: 1, lineTotal: 100000 }],
  },
  quote: {
    coupon: null,
    delivery: {
      method: 'pickup-point',
      zone: null,
      slot,
      pickupPoint: { id: 'pt-danilov', name: 'Пункт', address: 'Адрес' },
    },
    serviceLines: [],
    totals: { itemsSubtotal: 100000, couponDiscount: 0, deliveryAmount: 0, serviceAmount: 0, total: 100000 },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  process.env.YOOKASSA_MODE = 'sandbox';
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'token' }) });
  mocks.resolveOwnerCart.mockResolvedValue({ id: 'cart-1', token: 'token' });
  mocks.buildCheckoutOrderData.mockResolvedValue(data);
  mocks.orderUpdate.mockResolvedValue({});
  mocks.transaction.mockImplementation(async (operation: (tx: object) => unknown) =>
    operation({
      sku: { updateMany: vi.fn(async () => ({ count: 1 })) },
      order: {
        create: vi.fn(async () => ({ id: 'order-1', orderNumber: 1042, createdAt: now, totalAmount: 100000 })),
        update: mocks.orderUpdate,
      },
      cartItem: { deleteMany: vi.fn(async () => ({ count: 1 })) },
    }),
  );
});

afterEach(() => {
  if (originalYooKassaMode === undefined) delete process.env.YOOKASSA_MODE;
  else process.env.YOOKASSA_MODE = originalYooKassaMode;
});

describe('placeOrder online initialization', () => {
  it('validates sandbox before transaction and persists exact return URL before provider dispatch', async () => {
    mocks.ensureOnlinePayment.mockResolvedValue({ outcome: 'CREATED', confirmationUrl: 'https://yoo/confirm' });
    expect(await placeOrder(form)).toEqual({
      ok: true,
      code: 'PAYMENT_REDIRECT_READY',
      orderNumber: 1042,
      paymentUrl: 'https://yoo/confirm',
    });
    expect(mocks.assertPaymentMode).toHaveBeenCalledOnce();
    expect(mocks.assertPaymentMode.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.transaction.mock.invocationCallOrder[0],
    );
    expect(mocks.orderUpdate).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { paymentReturnUrl: 'https://preview.test/orders/1042' },
    });
    expect(mocks.orderUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.ensureOnlinePayment.mock.invocationCallOrder[0],
    );
    expect(mocks.ensureOnlinePayment).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'order-1', now }));
  });

  it('preserves durable order for indeterminate initialization', async () => {
    mocks.ensureOnlinePayment.mockResolvedValue({ outcome: 'INDETERMINATE' });
    expect(await placeOrder(form)).toEqual({
      ok: false,
      code: 'PAYMENT_INITIALIZATION_PENDING',
      orderNumber: 1042,
      error: 'Заказ сохранён. Статус платежа проверяется.',
    });
  });

  it('returns canceled result only for verified no-dispatch', async () => {
    mocks.ensureOnlinePayment.mockResolvedValue({ outcome: 'NOT_CREATED' });
    expect(await placeOrder(form)).toEqual({
      ok: false,
      code: 'PAYMENT_NOT_CREATED',
      orderNumber: 1042,
      error: 'Не удалось создать платёж. Попробуйте оформить заказ снова.',
    });
  });

  it('returns exact blocked DTO without URL or retry action', async () => {
    mocks.ensureOnlinePayment.mockResolvedValue({ outcome: 'BLOCKED_AFTER_RETRY_WINDOW' });
    expect(await placeOrder(form)).toEqual({
      ok: false,
      code: 'PAYMENT_INITIALIZATION_BLOCKED',
      paymentInitialization: buildBlockedPaymentInitializationDto(1042),
    });
  });

  it('COD never validates or invokes provider code', async () => {
    mocks.ensureOnlinePayment.mockResolvedValue({ outcome: 'CREATED', confirmationUrl: 'unused' });
    expect(await placeOrder({ ...form, paymentMethod: 'cod' })).toEqual({
      ok: true,
      code: 'ORDER_READY',
      orderNumber: 1042,
    });
    expect(mocks.assertPaymentMode).not.toHaveBeenCalled();
    expect(mocks.ensureOnlinePayment).not.toHaveBeenCalled();
  });

  it('rejects live YooKassa mode before any transaction or provider initialization', async () => {
    process.env.YOOKASSA_MODE = 'live';
    expect(await placeOrder(form)).toEqual({
      ok: false,
      code: 'PAYMENT_NOT_CONFIGURED',
      error: 'Онлайн-оплата временно недоступна.',
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.validateYooKassaConfiguration).not.toHaveBeenCalled();
    expect(mocks.ensureOnlinePayment).not.toHaveBeenCalled();
  });
});

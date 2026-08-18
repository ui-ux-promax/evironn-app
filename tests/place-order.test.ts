import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDeliverySlots } from '@/lib/checkout-domain';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cookies: vi.fn(),
  resolveOwnerCart: vi.fn(),
  buildCheckoutOrderData: vi.fn(),
  ensureOnlinePayment: vi.fn(),
  assertPaymentMode: vi.fn(),
  validateYooKassaConfiguration: vi.fn(),
  adjustSalesCount: vi.fn(),
  saveAddress: vi.fn(),
  loggerError: vi.fn(),
  transaction: vi.fn(),
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
vi.mock('@/lib/sales-count', () => ({ adjustSalesCount: mocks.adjustSalesCount }));
vi.mock('@/app/actions/address', () => ({ saveAddressFromOrder: mocks.saveAddress }));
vi.mock('@/lib/logger', () => ({ logger: { error: mocks.loggerError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/prisma-client', () => ({ prisma: { $transaction: mocks.transaction } }));

import { placeOrder } from '@/app/actions/order';

const now = new Date('2026-08-16T09:00:00.000Z');
const slot = buildDeliverySlots(now, 'courier')[0];
const validForm = {
  contactName: 'Иван Петров',
  contactPhone: '+79990000000',
  contactEmail: 'ivan@example.test',
  deliveryMethod: 'courier',
  deliveryZone: 'moscow',
  deliverySlotId: slot.id,
  address: { city: 'Москва', addressLine: 'Тверская, 1', floor: 5, liftType: 'none', intercom: '12' },
  services: { carrying: true, assembly: true, removal: false },
  couponCode: 'EV10',
  paymentMethod: 'cod',
};

const orderData = {
  cartId: 'cart-1',
  cartItemIds: ['line-1'],
  salesItems: [{ productId: 'product-1', quantity: 2 }],
  snapshot: {
    items: [
      {
        skuId: 'sku-1',
        skuArticleNumber: 'EV-NOMA-OAK',
        skuCombinationKey: 'finish=oak',
        productName: 'Noma',
        productSlug: 'noma',
        configuration: [{ groupSlug: 'finish', groupName: 'Отделка', valueSlug: 'oak', valueName: 'Дуб' }],
        imageUrl: '/noma.webp',
        unitPrice: 100000,
        oldUnitPrice: 120000,
        quantity: 2,
        lineTotal: 200000,
      },
    ],
    itemsTotal: 200000,
  },
  quote: {
    coupon: { code: 'EV10', percent: 10 },
    delivery: { method: 'courier', zone: 'moscow', slot, pickupPoint: null },
    serviceLines: [
      { id: 'carrying', label: 'Подъём без лифта', amount: 1400 },
      { id: 'assembly', label: 'Сборка', amount: 3900 },
    ],
    totals: {
      itemsSubtotal: 200000,
      couponDiscount: 20000,
      deliveryAmount: 0,
      serviceAmount: 5300,
      total: 185300,
    },
  },
};

function transactionClient() {
  return {
    sku: { updateMany: vi.fn(async () => ({ count: 1 })) },
    order: {
      create: vi.fn(async () => ({
        id: 'order-1',
        orderNumber: 1042,
        createdAt: now,
        totalAmount: 185300,
      })),
    },
    cartItem: { deleteMany: vi.fn(async () => ({ count: 1 })) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'cart-token' }) });
  mocks.resolveOwnerCart.mockResolvedValue({ id: 'cart-1', token: 'cart-token' });
  mocks.buildCheckoutOrderData.mockResolvedValue(orderData);
  mocks.transaction.mockImplementation(async (operation: (transaction: ReturnType<typeof transactionClient>) => unknown) =>
    operation(transactionClient()),
  );
});

describe('placeOrder transactional canonical placement', () => {
  it('writes stock, immutable snapshots, order totals, and placed cart deletion through one transaction client', async () => {
    const tx = transactionClient();
    mocks.transaction.mockImplementation(async (operation: (transaction: typeof tx) => unknown, options: unknown) => {
      expect(options).toEqual({ isolationLevel: 'Serializable' });
      return operation(tx);
    });

    await expect(placeOrder(validForm)).resolves.toEqual({ ok: true, code: 'ORDER_READY', orderNumber: 1042 });
    expect(mocks.buildCheckoutOrderData).toHaveBeenCalledWith({
      userId: 'user-1',
      cartId: 'cart-1',
      raw: validForm,
      now,
      client: tx,
    });
    expect(tx.sku.updateMany).toHaveBeenCalledWith({
      where: { id: 'sku-1', active: true, stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        itemsTotal: 200000,
        discountAmount: 20000,
        shippingAmount: 0,
        serviceAmount: 5300,
        totalAmount: 185300,
        couponCode: 'EV10',
        deliveryZone: 'moscow',
        deliveryWindow: slot.windowLabel,
        paymentReturnUrl: null,
        paymentInitializationState: null,
        serviceDetails: [
          { id: 'carrying', label: 'Подъём без лифта', amount: 1400 },
          { id: 'assembly', label: 'Сборка', amount: 3900 },
        ],
        items: { create: [expect.objectContaining({ skuId: 'sku-1', productVariantId: undefined })] },
      }),
      select: { id: true, orderNumber: true, createdAt: true, totalAmount: true },
    });
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1', id: { in: ['line-1'] } } });
  });

  it('aborts before order creation when any canonical SKU decrement fails', async () => {
    const tx = transactionClient();
    tx.sku.updateMany.mockResolvedValue({ count: 0 });
    mocks.transaction.mockImplementation(async (operation: (transaction: typeof tx) => unknown) => operation(tx));
    const result = await placeOrder(validForm);
    expect(result).toMatchObject({ ok: false });
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects quantities above the canonical maximum before reservation', async () => {
    const tx = transactionClient();
    const overLimit = {
      ...orderData,
      snapshot: {
        ...orderData.snapshot,
        items: [{ ...orderData.snapshot.items[0], quantity: 100, lineTotal: 10_000_000 }],
      },
    };
    mocks.buildCheckoutOrderData.mockResolvedValue(overLimit);
    mocks.transaction.mockImplementation(async (operation: (transaction: typeof tx) => unknown) => operation(tx));

    await expect(placeOrder(validForm)).resolves.toEqual({
      ok: false,
      code: 'QUANTITY_EXCEEDS_STOCK',
      error: 'Количество товара в одной позиции не может превышать 99.',
    });
    expect(tx.sku.updateMany).not.toHaveBeenCalled();
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('rejects buy-now and client-owned money fields through the one strict schema', async () => {
    await expect(placeOrder({ ...validForm, buyNowVariantId: 'legacy', totalAmount: 1 })).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_INPUT',
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('returns empty cart on repeat submission after atomic deletion', async () => {
    mocks.buildCheckoutOrderData.mockRejectedValue(Object.assign(new Error('Корзина пуста'), { code: 'EMPTY_CART' }));
    await expect(placeOrder(validForm)).resolves.toEqual({ ok: false, code: 'EMPTY_CART', error: 'Корзина пуста' });
  });

  it('returns honest retry conflict after three P2034 attempts', async () => {
    mocks.transaction.mockRejectedValue(Object.assign(new Error('conflict'), { code: 'P2034' }));
    await expect(placeOrder(validForm)).resolves.toMatchObject({ ok: false, code: 'ORDER_TRANSACTION_CONFLICT' });
    expect(mocks.transaction).toHaveBeenCalledTimes(3);
  });

  it('reruns the complete authoritative placement callback and commits changed retry values', async () => {
    const conflict = Object.assign(new Error('conflict'), { code: 'P2034' });
    const first = transactionClient();
    const second = transactionClient();
    const changed = {
      ...orderData,
      snapshot: {
        itemsTotal: 210000,
        items: [{ ...orderData.snapshot.items[0], unitPrice: 105000, lineTotal: 210000 }],
      },
      quote: {
        ...orderData.quote,
        coupon: { code: 'EV20', percent: 20 },
        serviceLines: [{ id: 'assembly', label: 'Сборка', amount: 4500 }],
        totals: {
          ...orderData.quote.totals,
          itemsSubtotal: 210000,
          couponDiscount: 42000,
          serviceAmount: 4500,
          total: 172500,
        },
      },
    };
    mocks.buildCheckoutOrderData.mockResolvedValueOnce(orderData).mockResolvedValueOnce(changed);
    let attempt = 0;
    mocks.transaction.mockImplementation(async (operation: (tx: ReturnType<typeof transactionClient>) => unknown) => {
      attempt += 1;
      const result = await operation(attempt === 1 ? first : second);
      if (attempt === 1) throw conflict;
      return result;
    });

    await expect(placeOrder(validForm)).resolves.toMatchObject({ ok: true, code: 'ORDER_READY' });
    expect(mocks.buildCheckoutOrderData).toHaveBeenCalledTimes(2);
    expect(first.sku.updateMany).toHaveBeenCalledOnce();
    expect(first.order.create).toHaveBeenCalledOnce();
    expect(first.cartItem.deleteMany).toHaveBeenCalledOnce();
    expect(second.sku.updateMany).toHaveBeenCalledWith({
      where: { id: 'sku-1', active: true, stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(second.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemsTotal: 210000,
        discountAmount: 42000,
        serviceAmount: 4500,
        totalAmount: 172500,
        couponCode: 'EV20',
        serviceDetails: [{ id: 'assembly', label: 'Сборка', amount: 4500 }],
        items: { create: [expect.objectContaining({ unitPrice: 105000, lineTotal: 210000 })] },
      }),
      select: { id: true, orderNumber: true, createdAt: true, totalAmount: true },
    });
    expect(second.cartItem.deleteMany).toHaveBeenCalledOnce();
  });

  it('sanitizes coded infrastructure failures instead of exposing raw details', async () => {
    mocks.buildCheckoutOrderData.mockRejectedValue(Object.assign(new Error('database secret'), { code: 'P2002' }));
    await expect(placeOrder(validForm)).resolves.toEqual({
      ok: false,
      code: 'ORDER_FAILED',
      error: 'Не удалось оформить заказ. Попробуйте позже.',
    });
    expect(mocks.loggerError).toHaveBeenCalledWith('place_order_failed', expect.any(Error));
  });

  it.each([
    ['auth', () => mocks.auth.mockRejectedValue(new Error('auth secret'))],
    ['cookies', () => mocks.cookies.mockRejectedValue(new Error('cookie secret'))],
    ['owner', () => mocks.resolveOwnerCart.mockRejectedValue(new Error('owner secret'))],
  ])('sanitizes pre-transaction %s failures', async (_boundary, fail) => {
    fail();
    await expect(placeOrder(validForm)).resolves.toMatchObject({ ok: false, code: 'ORDER_FAILED' });
    expect(mocks.loggerError).toHaveBeenCalledWith('place_order_failed', expect.any(Error));
  });
});

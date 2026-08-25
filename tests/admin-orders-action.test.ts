import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/yookassa', () => ({ cancelPayment: vi.fn(), getPaymentDetails: vi.fn() }));
vi.mock('@/lib/review', () => ({ pruneReviewsAfterCancel: vi.fn() }));
vi.mock('@/lib/sales-count', () => ({ adjustSalesCount: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/prisma-client', () => {
  const prisma = {
    order: { findUnique: vi.fn(), updateMany: vi.fn() },
    payment: { update: vi.fn() },
    productVariant: { update: vi.fn() },
    sku: { update: vi.fn() },
  };
  return { prisma };
});

import { advanceOrderStatus, cancelOrderByAdmin } from '@/app/actions/admin/orders';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { cancelPayment, getPaymentDetails } from '@/lib/yookassa';
import { pruneReviewsAfterCancel } from '@/lib/review';
import { adjustSalesCount } from '@/lib/sales-count';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const cancelPaymentMock = cancelPayment as unknown as ReturnType<typeof vi.fn>;
const getPaymentDetailsMock = getPaymentDetails as unknown as ReturnType<typeof vi.fn>;
const pruneMock = pruneReviewsAfterCancel as unknown as ReturnType<typeof vi.fn>;
const adjustMock = adjustSalesCount as unknown as ReturnType<typeof vi.fn>;
const p = prisma as unknown as {
  order: Record<string, ReturnType<typeof vi.fn>>;
  payment: Record<string, ReturnType<typeof vi.fn>>;
  productVariant: Record<string, ReturnType<typeof vi.fn>>;
  sku: Record<string, ReturnType<typeof vi.fn>>;
};

// Заказ с двумя позициями (для проверки возврата стока по каждой).
function makeOrder(over: Record<string, unknown> = {}) {
  return {
    id: 'o1',
    userId: 'u1',
    orderNumber: 1001,
    status: 'PENDING',
    totalAmount: 159900,
    payment: null,
    items: [
      { productVariantId: 'v1', quantity: 2, productVariant: { colorway: { productId: 'p1' } } },
      { productVariantId: 'v2', quantity: 1, productVariant: { colorway: { productId: 'p2' } } },
    ],
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'admin1', role: 'ADMIN' } });
  p.order.updateMany.mockResolvedValue({ count: 1 });
  p.payment.update.mockResolvedValue({});
  p.productVariant.update.mockResolvedValue({});
  p.sku.update.mockResolvedValue({});
  getPaymentDetailsMock.mockResolvedValue({
    id: 'pay1',
    status: 'pending',
    amountRub: 159900,
    orderNumber: '1001',
    confirmationUrl: null,
  });
});

describe('advanceOrderStatus', () => {
  it('PENDING → PROCESSING via guarded updateMany', async () => {
    const r = await advanceOrderStatus({
      orderId: 'o1',
      expectedStatus: 'PENDING',
      nextStatus: 'PROCESSING',
    });
    expect(r).toMatchObject({ ok: true, data: { status: 'PROCESSING' } });
    expect(p.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });
  });

  it('invalid jump PENDING → SHIPPED → error, no write', async () => {
    const r = await advanceOrderStatus({
      orderId: 'o1',
      expectedStatus: 'PENDING',
      nextStatus: 'SHIPPED',
    });
    expect(r.ok).toBe(false);
    expect(p.order.updateMany).not.toHaveBeenCalled();
  });

  it('race (count:0) → error', async () => {
    p.order.updateMany.mockResolvedValue({ count: 0 });
    const r = await advanceOrderStatus({
      orderId: 'o1',
      expectedStatus: 'PENDING',
      nextStatus: 'PROCESSING',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r).toMatchObject({ code: 'STALE_VALUE' });
  });

  it('order not found → error', async () => {
    p.order.updateMany.mockResolvedValue({ count: 0 });
    const r = await advanceOrderStatus({
      orderId: 'oX',
      expectedStatus: 'PENDING',
      nextStatus: 'PROCESSING',
    });
    expect(r).toMatchObject({ ok: false, code: 'STALE_VALUE' });
    expect(p.order.updateMany).toHaveBeenCalledTimes(1);
  });

  it('non-admin → error, no prisma touch', async () => {
    authMock.mockResolvedValue(null);
    const r = await advanceOrderStatus({
      orderId: 'o1',
      expectedStatus: 'PENDING',
      nextStatus: 'PROCESSING',
    });
    expect(r.ok).toBe(false);
    expect(p.order.findUnique).not.toHaveBeenCalled();
  });

  it('bad input (zod) → error', async () => {
    const r = await advanceOrderStatus({
      orderId: '',
      expectedStatus: 'PENDING',
      nextStatus: 'PROCESSING',
    });
    expect(r.ok).toBe(false);
    expect(p.order.findUnique).not.toHaveBeenCalled();
  });
});

describe('cancelOrderByAdmin', () => {
  it('PENDING COD (no payment) → restock both items, salesCount -1, prune, no cancelPayment', async () => {
    p.order.findUnique.mockResolvedValue(makeOrder());
    const r = await cancelOrderByAdmin('o1');
    expect(r.ok).toBe(true);
    expect(p.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: { in: ['PENDING', 'PROCESSING'] } },
      data: { status: 'CANCELLED' },
    });
    expect(p.productVariant.update).toHaveBeenCalledTimes(2);
    expect(p.productVariant.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { stock: { increment: 2 } },
    });
    expect(adjustMock).toHaveBeenCalledWith(
      [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ],
      -1,
    );
    expect(pruneMock).toHaveBeenCalledWith('u1', ['p1', 'p2']);
    expect(cancelPaymentMock).not.toHaveBeenCalled();
  });

  it('PENDING online pending → local cancel without provider cancel or false payment status', async () => {
    p.order.findUnique.mockResolvedValue(makeOrder({ payment: { id: 'pay1', status: 'pending' } }));
    const r = await cancelOrderByAdmin('o1');
    expect(r.ok).toBe(true);
    expect(getPaymentDetailsMock).toHaveBeenCalledWith('pay1');
    expect(cancelPaymentMock).not.toHaveBeenCalled();
    expect(p.payment.update).not.toHaveBeenCalled();
  });

  it('PENDING online waiting_for_capture → provider cancel and local payment canceled', async () => {
    p.order.findUnique.mockResolvedValue(makeOrder({ payment: { id: 'pay1', status: 'pending' } }));
    getPaymentDetailsMock
      .mockResolvedValueOnce({ id: 'pay1', status: 'waiting_for_capture', amountRub: 159900, orderNumber: '1001', confirmationUrl: null })
      .mockResolvedValueOnce({ id: 'pay1', status: 'canceled', amountRub: 159900, orderNumber: '1001', confirmationUrl: null });
    const r = await cancelOrderByAdmin('o1');
    expect(r.ok).toBe(true);
    expect(cancelPaymentMock).toHaveBeenCalledWith('pay1');
    expect(p.payment.update).toHaveBeenCalledWith({ where: { id: 'pay1' }, data: { status: 'canceled' } });
  });

  it('PROCESSING with succeeded payment → cancelled, no refund (cancelPayment not called)', async () => {
    p.order.findUnique.mockResolvedValue(
      makeOrder({ status: 'PROCESSING', payment: { id: 'pay2', status: 'succeeded' } }),
    );
    const r = await cancelOrderByAdmin('o1');
    expect(r.ok).toBe(true);
    expect(cancelPaymentMock).not.toHaveBeenCalled();
    expect(p.payment.update).not.toHaveBeenCalled();
    expect(p.productVariant.update).toHaveBeenCalledTimes(2);
  });

  it('canonical order restores SKU stock and product side effects', async () => {
    p.order.findUnique.mockResolvedValue(
      makeOrder({
        items: [
          {
            skuId: 'sku-1',
            productVariantId: null,
            quantity: 2,
            canonicalSku: { productId: 'product-1' },
            productVariant: null,
          },
        ],
      }),
    );

    expect(await cancelOrderByAdmin('o1')).toEqual({ ok: true });
    expect(p.sku.update).toHaveBeenCalledWith({ where: { id: 'sku-1' }, data: { stock: { increment: 2 } } });
    expect(adjustMock).toHaveBeenCalledWith([{ productId: 'product-1', quantity: 2 }], -1);
    expect(pruneMock).toHaveBeenCalledWith('u1', ['product-1']);
  });

  it('terminal (count:0) → error, no stock/salesCount side-effects', async () => {
    p.order.findUnique.mockResolvedValue(makeOrder({ status: 'SHIPPED' }));
    p.order.updateMany.mockResolvedValue({ count: 0 });
    const r = await cancelOrderByAdmin('o1');
    expect(r.ok).toBe(false);
    expect(p.productVariant.update).not.toHaveBeenCalled();
    expect(adjustMock).not.toHaveBeenCalled();
    expect(pruneMock).not.toHaveBeenCalled();
  });

  it('order not found → error', async () => {
    p.order.findUnique.mockResolvedValue(null);
    const r = await cancelOrderByAdmin('oX');
    expect(r.ok).toBe(false);
    expect(p.order.updateMany).not.toHaveBeenCalled();
  });

  it('non-admin → error', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', role: 'CUSTOMER' } });
    const r = await cancelOrderByAdmin('o1');
    expect(r.ok).toBe(false);
    expect(p.order.findUnique).not.toHaveBeenCalled();
  });
});

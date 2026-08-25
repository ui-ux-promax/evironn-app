import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/yookassa', () => ({ cancelPayment: vi.fn(), getPaymentDetails: vi.fn() }));
vi.mock('@/lib/review', () => ({ pruneReviewsAfterCancel: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/prisma-client', () => {
  const prisma = {
    $transaction: vi.fn(),
    order: { findUnique: vi.fn(), updateMany: vi.fn() },
    payment: { update: vi.fn() },
    product: { update: vi.fn() },
    productVariant: { update: vi.fn() },
    sku: { update: vi.fn() },
  };
  return { prisma };
});

import { advanceOrderStatus, cancelOrderByAdmin } from '@/app/actions/admin/orders';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-client';
import { cancelPayment, getPaymentDetails } from '@/lib/yookassa';
import { pruneReviewsAfterCancel } from '@/lib/review';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const transactionMock = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const revalidatePathMock = revalidatePath as unknown as ReturnType<typeof vi.fn>;
const cancelPaymentMock = cancelPayment as unknown as ReturnType<typeof vi.fn>;
const getPaymentDetailsMock = getPaymentDetails as unknown as ReturnType<typeof vi.fn>;
const pruneMock = pruneReviewsAfterCancel as unknown as ReturnType<typeof vi.fn>;
const p = prisma as unknown as {
  $transaction: ReturnType<typeof vi.fn>;
  order: Record<string, ReturnType<typeof vi.fn>>;
  payment: Record<string, ReturnType<typeof vi.fn>>;
  product: Record<string, ReturnType<typeof vi.fn>>;
  productVariant: Record<string, ReturnType<typeof vi.fn>>;
  sku: Record<string, ReturnType<typeof vi.fn>>;
};

function makeOrder(over: Record<string, unknown> = {}) {
  return {
    id: 'o1',
    userId: 'u1',
    orderNumber: 1001,
    status: 'PENDING',
    paymentInitializationState: null,
    paymentInitializationClaimedAt: null,
    paymentEverDispatchedAt: null,
    payment: null,
    items: [
      {
        skuId: 'sku-1',
        canonicalSku: { id: 'sku-1', productId: 'p1' },
        productVariantId: null,
        productVariant: null,
        quantity: 2,
      },
      {
        skuId: null,
        canonicalSku: null,
        productVariantId: 'variant-1',
        productVariant: { id: 'variant-1', colorway: { productId: 'p2' } },
        quantity: 1,
      },
    ],
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'admin1', role: 'ADMIN' } });
  p.order.updateMany.mockResolvedValue({ count: 1 });
  p.product.update.mockResolvedValue({});
  p.productVariant.update.mockResolvedValue({});
  p.sku.update.mockResolvedValue({});
  transactionMock.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
});

describe('advanceOrderStatus', () => {
  it('PENDING → PROCESSING via guarded updateMany', async () => {
    const r = await advanceOrderStatus({ orderId: 'o1', expectedStatus: 'PENDING', nextStatus: 'PROCESSING' });
    expect(r).toMatchObject({ ok: true, data: { status: 'PROCESSING' } });
    expect(p.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });
  });

  it('invalid jump PENDING → SHIPPED → error, no write', async () => {
    const r = await advanceOrderStatus({ orderId: 'o1', expectedStatus: 'PENDING', nextStatus: 'SHIPPED' });
    expect(r).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(p.order.updateMany).not.toHaveBeenCalled();
  });

  it('race (count:0) → typed stale conflict', async () => {
    p.order.updateMany.mockResolvedValue({ count: 0 });
    const r = await advanceOrderStatus({ orderId: 'o1', expectedStatus: 'PROCESSING', nextStatus: 'SHIPPED' });
    expect(r).toMatchObject({ ok: false, code: 'STALE_VALUE' });
  });

  it('non-admin → error, no prisma touch', async () => {
    authMock.mockResolvedValue(null);
    const r = await advanceOrderStatus({ orderId: 'o1', expectedStatus: 'PENDING', nextStatus: 'PROCESSING' });
    expect(r.ok).toBe(false);
    expect(p.order.updateMany).not.toHaveBeenCalled();
  });
});

describe('cancelOrderByAdmin', () => {
  it('cancels mixed canonical and legacy lines atomically and revalidates only after commit', async () => {
    p.order.findUnique.mockResolvedValue(makeOrder());

    const result = await cancelOrderByAdmin({ orderId: 'o1', expectedStatus: 'PENDING' });

    expect(result).toEqual({ ok: true, data: { status: 'CANCELLED', stockRestored: true } });
    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(p.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    expect(p.sku.update).toHaveBeenCalledWith({ where: { id: 'sku-1' }, data: { stock: { increment: 2 } } });
    expect(p.productVariant.update).toHaveBeenCalledWith({
      where: { id: 'variant-1' },
      data: { stock: { increment: 1 } },
    });
    expect(p.product.update).toHaveBeenCalledTimes(2);
    expect(revalidatePathMock).toHaveBeenNthCalledWith(1, '/admin/orders');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(2, '/admin/orders/o1');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(3, '/admin/customers');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(4, '/admin/customers/u1');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(5, '/profile');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(6, '/orders/1001');
    expect(cancelPaymentMock).not.toHaveBeenCalled();
    expect(getPaymentDetailsMock).not.toHaveBeenCalled();
    expect(pruneMock).not.toHaveBeenCalled();
    expect(p.payment.update).not.toHaveBeenCalled();
  });

  it('requires expectedStatus and rejects unknown fields without opening a transaction', async () => {
    const malformed = await cancelOrderByAdmin({ orderId: 'o1' });
    const unknown = await cancelOrderByAdmin({ orderId: 'o1', expectedStatus: 'PENDING', paymentStatus: 'succeeded' });
    expect(malformed).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(unknown).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(transactionMock).not.toHaveBeenCalled();
  });
});

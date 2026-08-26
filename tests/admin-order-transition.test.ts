import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/yookassa', () => ({ cancelPayment: vi.fn(), getPaymentDetails: vi.fn() }));
vi.mock('@/lib/review', () => ({ pruneReviewsAfterCancel: vi.fn() }));
vi.mock('@/lib/sales-count', () => ({ adjustSalesCount: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    order: { updateMany: vi.fn() },
    payment: { update: vi.fn() },
    sku: { update: vi.fn() },
    productVariant: { update: vi.fn() },
    review: { update: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { advanceOrderStatus } from '@/app/actions/admin/orders';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-client';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const revalidatePathMock = revalidatePath as unknown as ReturnType<typeof vi.fn>;
const p = prisma as unknown as {
  order: { updateMany: ReturnType<typeof vi.fn> };
  payment: { update: ReturnType<typeof vi.fn> };
  sku: { update: ReturnType<typeof vi.fn> };
  productVariant: { update: ReturnType<typeof vi.fn> };
  review: { update: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  p.order.updateMany.mockResolvedValue({ count: 1 });
});

describe('advanceOrderStatus', () => {
  it('checks ADMIN before touching Prisma', async () => {
    authMock.mockResolvedValue({ user: { id: 'customer-1', role: 'CUSTOMER' } });

    const result = await advanceOrderStatus({
      orderId: 'order-1',
      expectedStatus: 'PENDING',
      nextStatus: 'PROCESSING',
    });

    expect(result).toMatchObject({ ok: false });
    expect(p.order.updateMany).not.toHaveBeenCalled();
  });

  it('rejects malformed input and unknown fields without writing', async () => {
    const malformed = await advanceOrderStatus({
      orderId: '',
      expectedStatus: 'PENDING',
      nextStatus: 'PROCESSING',
    });
    const unknown = await advanceOrderStatus({
      orderId: 'order-1',
      expectedStatus: 'PENDING',
      nextStatus: 'PROCESSING',
      paymentStatus: 'succeeded',
    });

    expect(malformed).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(unknown).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(p.order.updateMany).not.toHaveBeenCalled();
  });

  it('rejects illegal jumps without writing', async () => {
    const result = await advanceOrderStatus({
      orderId: 'order-1',
      expectedStatus: 'PENDING',
      nextStatus: 'SHIPPED',
    });

    expect(result).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(p.order.updateMany).not.toHaveBeenCalled();
  });

  it('returns typed stale conflict from the expected-status guard', async () => {
    p.order.updateMany.mockResolvedValue({ count: 0 });

    const result = await advanceOrderStatus({
      orderId: 'order-1',
      expectedStatus: 'PROCESSING',
      nextStatus: 'SHIPPED',
    });

    expect(result).toMatchObject({ ok: false, code: 'STALE_VALUE' });
    expect(p.order.updateMany).toHaveBeenCalledTimes(1);
    expect(p.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', status: 'PROCESSING' },
      data: { status: 'SHIPPED' },
    });
  });

  it('performs one conditional write and revalidates list and detail on success', async () => {
    const result = await advanceOrderStatus({
      orderId: 'order-1',
      expectedStatus: 'SHIPPED',
      nextStatus: 'DELIVERED',
    });

    expect(result).toEqual({ ok: true, data: { status: 'DELIVERED' } });
    expect(p.order.updateMany).toHaveBeenCalledTimes(1);
    expect(p.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', status: 'SHIPPED' },
      data: { status: 'DELIVERED' },
    });
    expect(revalidatePathMock).toHaveBeenNthCalledWith(1, '/admin/orders');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(2, '/admin/orders/order-1');
    expect(p.payment.update).not.toHaveBeenCalled();
    expect(p.sku.update).not.toHaveBeenCalled();
    expect(p.productVariant.update).not.toHaveBeenCalled();
    expect(p.review.update).not.toHaveBeenCalled();
    expect(p.review.deleteMany).not.toHaveBeenCalled();
  });
});

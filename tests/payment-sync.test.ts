import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const fixedNow = new Date('2026-07-02T10:00:00.000Z');

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    payment: { update: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
    order: { update: vi.fn(), updateMany: vi.fn() },
    productVariant: { update: vi.fn() },
    product: { update: vi.fn() },
  },
}));

import {
  applyPaymentCanceled,
  applyPaymentSucceeded,
  reconcilePaymentStatus,
  type YooKassaPaymentStatus,
} from '@/lib/payment-sync';
import { prisma } from '@/lib/prisma-client';

const paymentUpdate = prisma.payment.update as unknown as ReturnType<typeof vi.fn>;
const paymentUpdateMany = prisma.payment.updateMany as unknown as ReturnType<typeof vi.fn>;
const paymentFindUnique = prisma.payment.findUnique as unknown as ReturnType<typeof vi.fn>;
const orderUpdate = prisma.order.update as unknown as ReturnType<typeof vi.fn>;
const orderUpdateMany = prisma.order.updateMany as unknown as ReturnType<typeof vi.fn>;
const variantUpdate = prisma.productVariant.update as unknown as ReturnType<typeof vi.fn>;
const productUpdate = prisma.product.update as unknown as ReturnType<typeof vi.fn>;

const orderItems = [{ productVariantId: 'v1', quantity: 2, productVariant: { colorway: { productId: 'prod_1' } } }];

function payment(status = 'pending', paidAt: Date | null = null, orderStatus = 'PENDING') {
  return {
    id: 'pay_1',
    orderId: 'o1',
    status,
    paidAt,
    order: { id: 'o1', status: orderStatus, items: orderItems },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  paymentUpdate.mockResolvedValue({});
  paymentUpdateMany.mockResolvedValue({ count: 1 });
  orderUpdate.mockResolvedValue({});
  orderUpdateMany.mockResolvedValue({ count: 1 });
  variantUpdate.mockResolvedValue({});
  productUpdate.mockResolvedValue({});
  paymentFindUnique.mockResolvedValue(payment());
});

describe('reconcilePaymentStatus', () => {
  it('pending + succeeded applies guarded success effects and sets paidAt', async () => {
    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'succeeded',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'applied', transition: 'succeeded' });
    expect(paymentFindUnique).toHaveBeenCalledWith({
      where: { id: 'pay_1' },
      include: {
        order: {
          include: {
            items: { include: { productVariant: { select: { colorway: { select: { productId: true } } } } } },
          },
        },
      },
    });
    expect(paymentUpdateMany).toHaveBeenCalledWith({
      where: { id: 'pay_1', status: { notIn: ['succeeded', 'canceled'] } },
      data: { status: 'succeeded', paidAt: fixedNow },
    });
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });
    expect(paymentUpdate).not.toHaveBeenCalled();
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(variantUpdate).not.toHaveBeenCalled();
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it('repeated succeeded preserves existing paidAt but repairs a pending order', async () => {
    const paidAt = new Date('2026-07-01T10:00:00.000Z');
    paymentFindUnique.mockResolvedValue(payment('succeeded', paidAt, 'PENDING'));

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'succeeded',
      source: 'order-page',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'repaired', transition: 'succeeded' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });
  });

  it('repeated succeeded is ignored when the order is already repaired', async () => {
    const paidAt = new Date('2026-07-01T10:00:00.000Z');
    paymentFindUnique.mockResolvedValue(payment('succeeded', paidAt, 'PROCESSING'));

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'succeeded',
      source: 'order-page',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'ignored', reason: 'already-succeeded' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).not.toHaveBeenCalled();
  });

  it('pending + canceled applies guarded cancel effects once', async () => {
    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'canceled',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'applied', transition: 'canceled' });
    expect(paymentUpdateMany).toHaveBeenCalledWith({
      where: { id: 'pay_1', status: { notIn: ['succeeded', 'canceled'] } },
      data: { status: 'canceled' },
    });
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    expect(variantUpdate).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { stock: { increment: 2 } } });
    expect(productUpdate).toHaveBeenCalledWith({ where: { id: 'prod_1' }, data: { salesCount: { increment: -2 } } });
    expect(paymentUpdate).not.toHaveBeenCalled();
    expect(orderUpdate).not.toHaveBeenCalled();
  });

  it('repeated canceled repairs a pending order without restoring stock twice after repair loses', async () => {
    paymentFindUnique.mockResolvedValue(payment('canceled', null, 'PENDING'));
    orderUpdateMany.mockResolvedValueOnce({ count: 0 });

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'canceled',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'ignored', reason: 'order-not-pending' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    expect(variantUpdate).not.toHaveBeenCalled();
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it('repeated canceled repairs a pending order and applies side effects when repair wins', async () => {
    paymentFindUnique.mockResolvedValue(payment('canceled', null, 'PENDING'));

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'canceled',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'repaired', transition: 'canceled' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    expect(variantUpdate).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { stock: { increment: 2 } } });
    expect(productUpdate).toHaveBeenCalledWith({ where: { id: 'prod_1' }, data: { salesCount: { increment: -2 } } });
  });

  it('repeated canceled is ignored when the order is already repaired', async () => {
    paymentFindUnique.mockResolvedValue(payment('canceled', null, 'CANCELLED'));

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'canceled',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'ignored', reason: 'already-canceled' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).not.toHaveBeenCalled();
    expect(variantUpdate).not.toHaveBeenCalled();
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it('succeeded + canceled is ignored without downgrade', async () => {
    paymentFindUnique.mockResolvedValue(payment('succeeded', fixedNow, 'PROCESSING'));

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'canceled',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'ignored', reason: 'final-state-conflict' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).not.toHaveBeenCalled();
    expect(variantUpdate).not.toHaveBeenCalled();
  });

  it('canceled + succeeded is ignored without upgrade', async () => {
    paymentFindUnique.mockResolvedValue(payment('canceled', null, 'CANCELLED'));

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'succeeded',
      source: 'order-page',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'ignored', reason: 'final-state-conflict' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).not.toHaveBeenCalled();
  });

  it('lost guarded payment finalization is ignored without side effects', async () => {
    paymentUpdateMany.mockResolvedValueOnce({ count: 0 });

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'succeeded',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'ignored', reason: 'payment-state-changed' });
    expect(orderUpdateMany).not.toHaveBeenCalled();
    expect(variantUpdate).not.toHaveBeenCalled();
  });

  it('pending local payment + canceled remote status skips stock restore if order transition loses', async () => {
    orderUpdateMany.mockResolvedValueOnce({ count: 0 });

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'canceled',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'ignored', reason: 'order-not-pending' });
    expect(paymentUpdateMany).toHaveBeenCalledWith({
      where: { id: 'pay_1', status: { notIn: ['succeeded', 'canceled'] } },
      data: { status: 'canceled' },
    });
    expect(variantUpdate).not.toHaveBeenCalled();
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it.each(['pending', 'waiting_for_capture'] satisfies YooKassaPaymentStatus[])(
    'pending local payment + %s remote status is a no-op',
    async (remoteStatus) => {
      const result = await reconcilePaymentStatus({
        paymentId: 'pay_1',
        remoteStatus,
        source: 'webhook',
        now: () => fixedNow,
      });

      expect(result).toEqual({ kind: 'ignored', reason: 'remote-not-final' });
      expect(paymentUpdateMany).not.toHaveBeenCalled();
      expect(orderUpdateMany).not.toHaveBeenCalled();
    },
  );

  it('unknown remote status is ignored without side effects', async () => {
    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'refunded',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'ignored', reason: 'unknown-remote-status' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).not.toHaveBeenCalled();
  });

  it('unknown local payment status is ignored without side effects', async () => {
    paymentFindUnique.mockResolvedValue(payment('refunded'));

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_1',
      remoteStatus: 'succeeded',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'ignored', reason: 'unknown-local-status' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).not.toHaveBeenCalled();
  });

  it('missing local payment is a no-op', async () => {
    paymentFindUnique.mockResolvedValue(null);

    const result = await reconcilePaymentStatus({
      paymentId: 'pay_x',
      remoteStatus: 'succeeded',
      source: 'webhook',
      now: () => fixedNow,
    });

    expect(result).toEqual({ kind: 'missing' });
    expect(paymentUpdateMany).not.toHaveBeenCalled();
    expect(orderUpdateMany).not.toHaveBeenCalled();
  });
});

describe('compatibility wrappers', () => {
  it('applyPaymentSucceeded delegates to reconciliation', async () => {
    await applyPaymentSucceeded('pay_1');

    expect(paymentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay_1', status: { notIn: ['succeeded', 'canceled'] } },
        data: expect.objectContaining({ status: 'succeeded' }),
      }),
    );
  });

  it('applyPaymentCanceled delegates to reconciliation', async () => {
    await applyPaymentCanceled('pay_1');

    expect(paymentUpdateMany).toHaveBeenCalledWith({
      where: { id: 'pay_1', status: { notIn: ['succeeded', 'canceled'] } },
      data: { status: 'canceled' },
    });
  });
});

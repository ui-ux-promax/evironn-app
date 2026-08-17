import { describe, it, expect, beforeEach, vi } from 'vitest';

const fixedNow = new Date('2026-07-02T10:00:00.000Z');

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    $transaction: vi.fn(),
    payment: { update: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
    order: { update: vi.fn(), updateMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    productVariant: { update: vi.fn() },
    sku: { update: vi.fn() },
    product: { update: vi.fn() },
  },
}));
vi.mock('@/lib/yookassa', () => ({ getPaymentDetails: vi.fn() }));

import {
  applyPaymentCanceled,
  applyPaymentSucceeded,
  reconcilePaymentStatus,
  recoverPaymentCorrelation,
  type YooKassaPaymentStatus,
} from '@/lib/payment-sync';
import { prisma } from '@/lib/prisma-client';
import { getPaymentDetails } from '@/lib/yookassa';

const paymentUpdate = prisma.payment.update as unknown as ReturnType<typeof vi.fn>;
const paymentUpdateMany = prisma.payment.updateMany as unknown as ReturnType<typeof vi.fn>;
const paymentFindUnique = prisma.payment.findUnique as unknown as ReturnType<typeof vi.fn>;
const orderUpdate = prisma.order.update as unknown as ReturnType<typeof vi.fn>;
const orderUpdateMany = prisma.order.updateMany as unknown as ReturnType<typeof vi.fn>;
const variantUpdate = prisma.productVariant.update as unknown as ReturnType<typeof vi.fn>;
const skuUpdate = prisma.sku.update as unknown as ReturnType<typeof vi.fn>;
const productUpdate = prisma.product.update as unknown as ReturnType<typeof vi.fn>;
const transaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const orderFindMany = prisma.order.findMany as unknown as ReturnType<typeof vi.fn>;
const orderFindUnique = prisma.order.findUnique as unknown as ReturnType<typeof vi.fn>;
const detailsMock = getPaymentDetails as unknown as ReturnType<typeof vi.fn>;

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
  skuUpdate.mockResolvedValue({});
  productUpdate.mockResolvedValue({});
  paymentFindUnique.mockResolvedValue(payment());
  orderFindUnique.mockResolvedValue({
    id: 'order-1',
    orderNumber: 1042,
    status: 'PENDING',
    paymentMethod: 'online',
    totalAmount: 159900,
    paymentEverDispatchedAt: null,
    payment: null,
  });
  transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
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
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(paymentFindUnique).toHaveBeenCalledWith({
      where: { id: 'pay_1' },
      include: {
        order: {
          include: {
            items: {
              include: {
                canonicalSku: { select: { productId: true } },
                productVariant: { select: { colorway: { select: { productId: true } } } },
              },
            },
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

  it('canceled canonical order restores SKU stock and product sales count', async () => {
    paymentFindUnique.mockResolvedValue({
      ...payment(),
      order: {
        id: 'o1',
        status: 'PENDING',
        items: [
          {
            skuId: 'sku-1',
            productVariantId: null,
            quantity: 2,
            canonicalSku: { productId: 'product-1' },
            productVariant: null,
          },
        ],
      },
    });

    expect(await reconcilePaymentStatus({ paymentId: 'pay_1', remoteStatus: 'canceled', source: 'webhook' })).toEqual({
      kind: 'applied',
      transition: 'canceled',
    });
    expect(skuUpdate).toHaveBeenCalledWith({ where: { id: 'sku-1' }, data: { stock: { increment: 2 } } });
    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { salesCount: { increment: -2 } },
    });
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

describe('recoverPaymentCorrelation', () => {
  it('correlates one exact pending online order from verified provider details', async () => {
    detailsMock.mockResolvedValue({ id: 'pay-recovered', status: 'succeeded', amountRub: 159900, orderNumber: '1042', confirmationUrl: null });
    orderFindMany.mockResolvedValue([{ id: 'order-1', orderNumber: 1042, status: 'PENDING', paymentMethod: 'online', totalAmount: 159900, payment: null }]);
    (prisma.payment as any).create = vi.fn().mockResolvedValue({});
    await expect(recoverPaymentCorrelation('pay-recovered')).resolves.toEqual({ kind: 'recovered', paymentId: 'pay-recovered' });
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  });

  it('rejects forged metadata without writes', async () => {
    detailsMock.mockResolvedValue({ id: 'pay-forged', status: 'canceled', amountRub: 159900, orderNumber: 'not-an-order-number', confirmationUrl: null });
    await expect(recoverPaymentCorrelation('pay-forged')).resolves.toEqual({ kind: 'ignored', reason: 'invalid-provider-correlation' });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects a provider response whose id does not match the requested payment', async () => {
    detailsMock.mockResolvedValue({ id: 'pay-other', status: 'canceled', amountRub: 159900, orderNumber: '1042', confirmationUrl: null });
    await expect(recoverPaymentCorrelation('pay-requested')).resolves.toEqual({ kind: 'ignored', reason: 'invalid-provider-correlation' });
    expect(orderFindMany).not.toHaveBeenCalled();
  });

  it('preserves state when exact metadata and amount do not identify exactly one pending online order', async () => {
    detailsMock.mockResolvedValue({
      id: 'pay-ambiguous',
      status: 'canceled',
      amountRub: 159900,
      orderNumber: '1042',
      confirmationUrl: null,
    });
    orderFindMany.mockResolvedValue([
      { id: 'order-1', payment: null },
      { id: 'order-2', payment: null },
    ]);
    await expect(recoverPaymentCorrelation('pay-ambiguous')).resolves.toEqual({
      kind: 'ignored',
      reason: 'order-correlation-conflict',
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('repairs CORRELATED idempotently for an existing exact local payment', async () => {
    detailsMock.mockResolvedValue({
      id: 'pay-existing',
      status: 'pending',
      amountRub: 159900,
      orderNumber: '1042',
      confirmationUrl: null,
    });
    orderFindMany.mockResolvedValue([
      {
        id: 'order-1',
        paymentEverDispatchedAt: null,
        payment: { id: 'pay-existing', amount: 159900 },
      },
    ]);
    orderFindUnique.mockResolvedValue({
      id: 'order-1',
      orderNumber: 1042,
      status: 'PENDING',
      paymentMethod: 'online',
      totalAmount: 159900,
      paymentEverDispatchedAt: null,
      payment: { id: 'pay-existing', amount: 159900 },
    });
    await expect(recoverPaymentCorrelation('pay-existing')).resolves.toEqual({
      kind: 'recovered',
      paymentId: 'pay-existing',
    });
    expect(orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ paymentInitializationState: 'CORRELATED' }) }),
    );
  });

  it('preserves fresh write-once dispatch evidence acquired after the recovery candidate read', async () => {
    const freshEvidence = new Date('2026-08-17T10:00:00.000Z');
    detailsMock.mockResolvedValue({
      id: 'pay-race',
      status: 'pending',
      amountRub: 159900,
      orderNumber: '1042',
      confirmationUrl: null,
    });
    orderFindMany.mockResolvedValue([
      {
        id: 'order-1',
        orderNumber: 1042,
        totalAmount: 159900,
        paymentEverDispatchedAt: null,
        payment: null,
      },
    ]);
    orderFindUnique.mockResolvedValue({
      id: 'order-1',
      orderNumber: 1042,
      status: 'PENDING',
      paymentMethod: 'online',
      totalAmount: 159900,
      paymentEverDispatchedAt: freshEvidence,
      payment: null,
    });
    (prisma.payment as any).create = vi.fn().mockResolvedValue({});

    await expect(recoverPaymentCorrelation('pay-race')).resolves.toEqual({
      kind: 'recovered',
      paymentId: 'pay-race',
    });
    expect(orderFindUnique).toHaveBeenCalledWith({
      where: { id: 'order-1', orderNumber: 1042 },
      select: expect.any(Object),
    });
    expect(orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'order-1', orderNumber: 1042 }),
        data: expect.objectContaining({ paymentEverDispatchedAt: freshEvidence }),
      }),
    );
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

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

import { cancelOrderByAdmin } from '@/app/actions/admin/orders';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { cancelPayment, getPaymentDetails } from '@/lib/yookassa';
import { pruneReviewsAfterCancel } from '@/lib/review';
import {
  resolveCancelledOrderInventoryReferences,
  type ResolvedCancelledOrderItem,
} from '@/lib/admin/order-cancellation.server';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const transactionMock = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
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

function canonical(quantity = 2) {
  return {
    quantity,
    skuId: 'sku-1',
    canonicalSku: { id: 'sku-1', productId: 'product-1' },
    productVariantId: null,
    productVariant: null,
  };
}

function legacy(quantity = 1) {
  return {
    quantity,
    skuId: null,
    canonicalSku: null,
    productVariantId: 'variant-1',
    productVariant: { id: 'variant-1', colorway: { productId: 'product-1' } },
  };
}

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 1001,
    userId: 'user-1',
    status: 'PENDING',
    paymentInitializationState: null,
    paymentInitializationClaimedAt: null,
    paymentEverDispatchedAt: null,
    payment: null,
    items: [canonical()],
    ...overrides,
  };
}

function useTransactionClient() {
  transactionMock.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  p.order.updateMany.mockResolvedValue({ count: 1 });
  p.product.update.mockResolvedValue({});
  p.productVariant.update.mockResolvedValue({});
  p.sku.update.mockResolvedValue({});
  useTransactionClient();
});

describe('resolveCancelledOrderInventoryReferences', () => {
  it('resolves canonical, legacy, and mixed lines to one inventory reference each', () => {
    expect(resolveCancelledOrderInventoryReferences([canonical(), legacy()])).toEqual({
      ok: true,
      items: [
        { kind: 'canonical', inventoryId: 'sku-1', productId: 'product-1', quantity: 2 },
        { kind: 'legacy', inventoryId: 'variant-1', productId: 'product-1', quantity: 1 },
      ],
    });
  });

  it.each([
    [
      'dual reference',
      {
        ...canonical(),
        productVariantId: 'variant-1',
        productVariant: { id: 'variant-1', colorway: { productId: 'product-1' } },
      },
    ],
    ['missing canonical relation', { ...canonical(), canonicalSku: null }],
    ['mismatched canonical id', { ...canonical(), canonicalSku: { id: 'other-sku', productId: 'product-1' } }],
    ['missing legacy relation', { ...legacy(), productVariant: null }],
    [
      'mismatched legacy id',
      { ...legacy(), productVariant: { id: 'other-variant', colorway: { productId: 'product-1' } } },
    ],
    ['invalid quantity', canonical(0)],
  ])('%s is rejected before any write', (_name, item) => {
    expect(resolveCancelledOrderInventoryReferences([item])).toEqual({
      ok: false,
      reason: 'INVALID_INVENTORY_REFERENCE',
    });
  });
});

describe('cancelOrderByAdmin invariants', () => {
  it('blocks every unsafe policy state before the conditional status write', async () => {
    const unsafeOrders = [
      makeOrder({ status: 'SHIPPED' }),
      makeOrder({ paymentEverDispatchedAt: new Date() }),
      makeOrder({ payment: { status: 'succeeded' } }),
      makeOrder({ paymentInitializationState: 'CLAIMED' }),
      makeOrder({ paymentInitializationState: 'DISPATCHED' }),
      makeOrder({ payment: { status: 'pending' } }),
      makeOrder({ payment: { status: 'provider-added-status' } }),
    ];

    for (const order of unsafeOrders) {
      p.order.findUnique.mockResolvedValueOnce(order);
      const result = await cancelOrderByAdmin({ orderId: 'order-1', expectedStatus: 'PENDING' });
      expect(result).toMatchObject({ ok: false, code: 'ORDER_CANCELLATION_BLOCKED' });
    }

    expect(p.order.updateMany).not.toHaveBeenCalled();
    expect(p.sku.update).not.toHaveBeenCalled();
    expect(p.productVariant.update).not.toHaveBeenCalled();
    expect(p.product.update).not.toHaveBeenCalled();
  });

  it('allows safe COD and failed online payment states without provider or Payment writes', async () => {
    p.order.findUnique
      .mockResolvedValueOnce(makeOrder())
      .mockResolvedValueOnce(makeOrder({ payment: { id: 'payment-1', status: 'canceled' } }));

    await expect(cancelOrderByAdmin({ orderId: 'order-1', expectedStatus: 'PENDING' })).resolves.toMatchObject({
      ok: true,
    });
    await expect(cancelOrderByAdmin({ orderId: 'order-1', expectedStatus: 'PENDING' })).resolves.toMatchObject({
      ok: true,
    });

    expect(cancelPaymentMock).not.toHaveBeenCalled();
    expect(getPaymentDetailsMock).not.toHaveBeenCalled();
    expect(p.payment.update).not.toHaveBeenCalled();
    expect(pruneMock).not.toHaveBeenCalled();
  });

  it('does not restore anything when the expected status race loses', async () => {
    p.order.findUnique.mockResolvedValue(makeOrder());
    p.order.updateMany.mockResolvedValue({ count: 0 });

    const result = await cancelOrderByAdmin({ orderId: 'order-1', expectedStatus: 'PENDING' });

    expect(result).toMatchObject({ ok: false, code: 'STALE_VALUE' });
    expect(p.sku.update).not.toHaveBeenCalled();
    expect(p.productVariant.update).not.toHaveBeenCalled();
    expect(p.product.update).not.toHaveBeenCalled();
  });

  it('rejects invalid references before status or inventory writes', async () => {
    p.order.findUnique.mockResolvedValue(makeOrder({ items: [{ ...canonical(), canonicalSku: null }] }));

    const result = await cancelOrderByAdmin({ orderId: 'order-1', expectedStatus: 'PENDING' });

    expect(result).toMatchObject({ ok: false, code: 'ORDER_CANCELLATION_BLOCKED' });
    expect(p.order.updateMany).not.toHaveBeenCalled();
    expect(p.sku.update).not.toHaveBeenCalled();
    expect(p.product.update).not.toHaveBeenCalled();
  });

  it('rolls back the operation when inventory or sales update fails', async () => {
    p.order.findUnique.mockResolvedValue(makeOrder());
    p.product.update.mockRejectedValue(new Error('sales update failed'));

    const result = await cancelOrderByAdmin({ orderId: 'order-1', expectedStatus: 'PENDING' });

    expect(result).toMatchObject({ ok: false, code: 'UNEXPECTED' });
    expect(p.order.updateMany).toHaveBeenCalledTimes(1);
    expect(p.sku.update).toHaveBeenCalledTimes(1);
    expect(p.product.update).toHaveBeenCalledTimes(1);
  });

  it('retries the complete transaction on a serializable conflict', async () => {
    p.order.findUnique.mockResolvedValue(makeOrder());
    const conflict = Object.assign(new Error('serialization conflict'), { code: 'P2034' });
    transactionMock
      .mockImplementationOnce(async (callback: (tx: typeof prisma) => unknown) => {
        await callback(prisma);
        throw conflict;
      })
      .mockImplementationOnce(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));

    await expect(cancelOrderByAdmin({ orderId: 'order-1', expectedStatus: 'PENDING' })).resolves.toMatchObject({
      ok: true,
    });
    expect(transactionMock).toHaveBeenCalledTimes(2);
    expect(p.order.updateMany).toHaveBeenCalledTimes(2);
    expect(p.sku.update).toHaveBeenCalledTimes(2);
    expect(p.product.update).toHaveBeenCalledTimes(2);
  });

  it('performs one sales update per product inside the same transaction', async () => {
    const items: ResolvedCancelledOrderItem[] = [
      { kind: 'canonical', inventoryId: 'sku-1', productId: 'product-1', quantity: 2 },
      { kind: 'canonical', inventoryId: 'sku-2', productId: 'product-1', quantity: 3 },
    ];
    p.order.findUnique.mockResolvedValue(
      makeOrder({
        items: items.map((item) => ({
          skuId: item.inventoryId,
          canonicalSku: { id: item.inventoryId, productId: item.productId },
          productVariantId: null,
          productVariant: null,
          quantity: item.quantity,
        })),
      }),
    );

    await cancelOrderByAdmin({ orderId: 'order-1', expectedStatus: 'PENDING' });

    expect(p.product.update).toHaveBeenCalledOnce();
    expect(p.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { salesCount: { increment: -5 } },
    });
  });
});

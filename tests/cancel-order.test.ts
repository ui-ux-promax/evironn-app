import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/cart', () => ({ recalcCartTotalByToken: vi.fn() }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    $transaction: vi.fn(),
    order: { findUnique: vi.fn(), updateMany: vi.fn() },
    productVariant: { update: vi.fn() },
    sku: { update: vi.fn() },
    product: { update: vi.fn() },
  },
}));
vi.mock('@/lib/yookassa', () => ({ cancelPayment: vi.fn(), getPaymentDetails: vi.fn() }));
vi.mock('@/lib/payment-initialization', () => ({ ensureOnlinePayment: vi.fn() }));
vi.mock('@/lib/payment-sync', () => ({ reconcilePaymentStatus: vi.fn() }));
vi.mock('@/lib/review', () => ({ pruneReviewsAfterCancel: vi.fn() }));

import { cancelOrder } from '@/app/actions/order';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { cancelPayment, getPaymentDetails } from '@/lib/yookassa';
import { ensureOnlinePayment } from '@/lib/payment-initialization';
import { reconcilePaymentStatus } from '@/lib/payment-sync';
import { pruneReviewsAfterCancel } from '@/lib/review';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const findUnique = prisma.order.findUnique as unknown as ReturnType<typeof vi.fn>;
const orderUpdateMany = prisma.order.updateMany as unknown as ReturnType<typeof vi.fn>;
const variantUpdate = prisma.productVariant.update as unknown as ReturnType<typeof vi.fn>;
const skuUpdate = prisma.sku.update as unknown as ReturnType<typeof vi.fn>;
const transaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const cancelMock = cancelPayment as unknown as ReturnType<typeof vi.fn>;
const detailsMock = getPaymentDetails as unknown as ReturnType<typeof vi.fn>;
const ensureMock = ensureOnlinePayment as unknown as ReturnType<typeof vi.fn>;
const reconcileMock = reconcilePaymentStatus as unknown as ReturnType<typeof vi.fn>;
const pruneMock = pruneReviewsAfterCancel as unknown as ReturnType<typeof vi.fn>;

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: 'o1',
    orderNumber: 1025,
    userId: 'u1',
    status: 'PENDING',
    paymentMethod: 'cod',
    totalAmount: 159900,
    paymentInitializationState: null,
    payment: null,
    items: [{ skuId: 'sku-1', productVariantId: null, quantity: 2, canonicalSku: { productId: 'p1' }, productVariant: null }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'u1' } });
  findUnique.mockResolvedValue(order());
  orderUpdateMany.mockResolvedValue({ count: 1 });
  skuUpdate.mockResolvedValue({});
  variantUpdate.mockResolvedValue({});
  transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
  ensureMock.mockResolvedValue({ outcome: 'CREATED', confirmationUrl: null });
  cancelMock.mockResolvedValue(undefined);
  detailsMock.mockResolvedValue({ id: 'pay-1', status: 'canceled', amountRub: 159900, orderNumber: '1025', confirmationUrl: null });
  reconcileMock.mockResolvedValue({ kind: 'applied', transition: 'canceled' });
});

describe('cancelOrder', () => {
  it('cancels COD in one serializable transaction and restores canonical stock', async () => {
    await expect(cancelOrder('o1')).resolves.toEqual({ ok: true });
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(skuUpdate).toHaveBeenCalledWith({ where: { id: 'sku-1' }, data: { stock: { increment: 2 } } });
    expect(cancelMock).not.toHaveBeenCalled();
    expect(pruneMock).toHaveBeenCalledWith('u1', ['p1']);
  });

  it('keeps legacy ProductVariant as read-only cancellation compatibility', async () => {
    findUnique.mockResolvedValue(
      order({
        items: [
          {
            skuId: null,
            productVariantId: 'variant-1',
            quantity: 1,
            canonicalSku: null,
            productVariant: { colorway: { productId: 'legacy-product' } },
          },
        ],
      }),
    );
    await expect(cancelOrder('o1')).resolves.toEqual({ ok: true });
    expect(variantUpdate).toHaveBeenCalledWith({
      where: { id: 'variant-1' },
      data: { stock: { increment: 1 } },
    });
  });

  it.each([{ userId: 'other' }, { status: 'SHIPPED' }])('rejects unsafe order without mutation', async (change) => {
    findUnique.mockResolvedValue(order(change));
    await expect(cancelOrder('o1')).resolves.toMatchObject({ ok: false });
    expect(transaction).not.toHaveBeenCalled();
    expect(cancelMock).not.toHaveBeenCalled();
  });

  it('verifies provider cancellation before shared local reconciliation', async () => {
    const correlated = order({
      paymentMethod: 'online',
      paymentInitializationState: 'CORRELATED',
      payment: { id: 'pay-1', status: 'pending', amount: 159900 },
    });
    findUnique.mockResolvedValueOnce(correlated).mockResolvedValueOnce(correlated);
    await expect(cancelOrder('o1')).resolves.toEqual({ ok: true });
    expect(cancelMock).toHaveBeenCalledWith('pay-1');
    expect(detailsMock).toHaveBeenCalledWith('pay-1');
    expect(reconcileMock).toHaveBeenCalledWith({ paymentId: 'pay-1', remoteStatus: 'canceled', source: 'order-page' });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('uses newly persisted payment only after fresh owner-scoped reread', async () => {
    findUnique
      .mockResolvedValueOnce(order({ paymentMethod: 'online' }))
      .mockResolvedValueOnce(order({
        paymentMethod: 'online',
        paymentInitializationState: 'CORRELATED',
        payment: { id: 'pay-new', status: 'pending', amount: 159900 },
      }));
    detailsMock.mockResolvedValue({ id: 'pay-new', status: 'canceled', amountRub: 159900, orderNumber: '1025', confirmationUrl: null });
    await expect(cancelOrder('o1')).resolves.toEqual({ ok: true });
    expect(ensureMock).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'o1' }));
    expect(cancelMock).toHaveBeenCalledWith('pay-new');
  });

  it.each([
    { payment: null, paymentInitializationState: 'CORRELATED' },
    { payment: { id: 'pay-1', status: 'pending', amount: 159900 }, paymentInitializationState: 'CLAIMED' },
    { payment: { id: 'pay-1', status: 'pending', amount: 1 }, paymentInitializationState: 'CORRELATED' },
  ])('returns pending sync for unsafe fresh correlation', async (fresh) => {
    findUnique.mockResolvedValueOnce(order({ paymentMethod: 'online' })).mockResolvedValueOnce(order({ paymentMethod: 'online', ...fresh }));
    await expect(cancelOrder('o1')).resolves.toMatchObject({ ok: false, code: 'CANCELLATION_PENDING_SYNC' });
    expect(cancelMock).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('preserves local state when provider cancellation fails or is non-final', async () => {
    const correlated = order({ paymentMethod: 'online', paymentInitializationState: 'CORRELATED', payment: { id: 'pay-1', status: 'pending', amount: 159900 } });
    findUnique.mockResolvedValueOnce(correlated).mockResolvedValueOnce(correlated);
    cancelMock.mockRejectedValue(new Error('timeout'));
    detailsMock.mockResolvedValue({
      id: 'pay-1',
      status: 'pending',
      amountRub: 159900,
      orderNumber: '1025',
      confirmationUrl: null,
    });
    await expect(cancelOrder('o1')).resolves.toMatchObject({ ok: false, code: 'CANCELLATION_PENDING_SYNC' });
    expect(reconcileMock).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('reconciles an already-canceled provider payment even when repeated cancel rejects', async () => {
    const correlated = order({
      paymentMethod: 'online',
      paymentInitializationState: 'CORRELATED',
      payment: { id: 'pay-1', status: 'pending', amount: 159900 },
    });
    findUnique.mockResolvedValueOnce(correlated).mockResolvedValueOnce(correlated);
    cancelMock.mockRejectedValue(new Error('payment already canceled'));
    detailsMock.mockResolvedValue({
      id: 'pay-1',
      status: 'canceled',
      amountRub: 159900,
      orderNumber: '1025',
      confirmationUrl: null,
    });

    await expect(cancelOrder('o1')).resolves.toEqual({ ok: true });
    expect(detailsMock).toHaveBeenCalledWith('pay-1');
    expect(reconcileMock).toHaveBeenCalledWith({
      paymentId: 'pay-1',
      remoteStatus: 'canceled',
      source: 'order-page',
    });
  });

  it('preserves local state when provider reload is not canceled', async () => {
    const correlated = order({
      paymentMethod: 'online',
      paymentInitializationState: 'CORRELATED',
      payment: { id: 'pay-1', status: 'pending', amount: 159900 },
    });
    findUnique.mockResolvedValueOnce(correlated).mockResolvedValueOnce(correlated);
    detailsMock.mockResolvedValue({
      id: 'pay-1',
      status: 'pending',
      amountRub: 159900,
      orderNumber: '1025',
      confirmationUrl: null,
    });
    await expect(cancelOrder('o1')).resolves.toMatchObject({ ok: false, code: 'CANCELLATION_PENDING_SYNC' });
    expect(reconcileMock).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('returns pending sync when verified provider cancellation cannot commit locally', async () => {
    const correlated = order({
      paymentMethod: 'online',
      paymentInitializationState: 'CORRELATED',
      payment: { id: 'pay-1', status: 'pending', amount: 159900 },
    });
    findUnique.mockResolvedValueOnce(correlated).mockResolvedValueOnce(correlated);
    reconcileMock.mockRejectedValue(new Error('serializable transaction failed'));
    await expect(cancelOrder('o1')).resolves.toMatchObject({ ok: false, code: 'CANCELLATION_PENDING_SYNC' });
    expect(cancelMock).toHaveBeenCalledWith('pay-1');
    expect(pruneMock).not.toHaveBeenCalled();
  });

  it('does not run a second transaction after NOT_CREATED', async () => {
    findUnique.mockResolvedValue(order({ paymentMethod: 'online' }));
    ensureMock.mockResolvedValue({ outcome: 'NOT_CREATED' });
    await expect(cancelOrder('o1')).resolves.toEqual({ ok: true });
    expect(transaction).not.toHaveBeenCalled();
    expect(cancelMock).not.toHaveBeenCalled();
  });
});

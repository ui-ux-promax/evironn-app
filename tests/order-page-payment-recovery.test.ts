import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  ensure: vi.fn(),
  details: vi.fn(),
  reconcile: vi.fn(),
  eligibility: vi.fn(),
}));
vi.mock('@/lib/prisma-client', () => ({ prisma: { order: { findFirst: mocks.findFirst } } }));
vi.mock('@/lib/payment-initialization', async (original) => ({
  ...(await original<typeof import('@/lib/payment-initialization')>()),
  ensureOnlinePayment: mocks.ensure,
}));
vi.mock('@/lib/yookassa', async (original) => ({
  ...(await original<typeof import('@/lib/yookassa')>()),
  getPaymentDetails: mocks.details,
}));
vi.mock('@/lib/payment-sync', () => ({ reconcilePaymentStatus: mocks.reconcile }));
vi.mock('@/lib/review', () => ({ getReviewEligibility: mocks.eligibility }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { getOrderPageDto } from '@/lib/order-page';

const base = {
  id: 'o1',
  orderNumber: 52,
  userId: 'u1',
  status: 'PENDING',
  paymentMethod: 'online',
  contactName: 'A',
  contactPhone: '+7',
  contactEmail: 'a@b.c',
  city: 'Москва',
  addressLine: 'Адрес',
  addressComment: null,
  shippingMethod: 'courier',
  deliveryDate: null,
  deliveryWindow: null,
  pickupPointId: null,
  pickupPointName: null,
  pickupPointAddress: null,
  deliveryZone: 'moscow',
  floor: null,
  liftType: null,
  intercom: null,
  serviceDetails: [],
  itemsTotal: 1000,
  discountAmount: 0,
  shippingAmount: 0,
  serviceAmount: 0,
  totalAmount: 1000,
  couponCode: null,
  paymentReturnUrl: 'https://site/orders/52',
  paymentInitializationState: 'READY',
  paymentInitializationClaimedAt: null,
  paymentEverDispatchedAt: null,
  createdAt: new Date('2026-08-18T10:00:00Z'),
  updatedAt: new Date('2026-08-18T10:00:00Z'),
  items: [],
  payment: null,
};

describe('order page payment recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eligibility.mockResolvedValue('not-purchased');
  });

  it('ensures missing payment correlation before W and refetches', async () => {
    const correlated = {
      ...base,
      paymentInitializationState: 'CORRELATED',
      paymentEverDispatchedAt: new Date('2026-08-18T10:01:00Z'),
      payment: { id: 'pay-1', status: 'pending', confirmationUrl: 'https://pay/continue', amount: 1000, paidAt: null },
    };
    mocks.findFirst.mockResolvedValueOnce(base).mockResolvedValue(correlated);
    mocks.ensure.mockResolvedValue({ outcome: 'CREATED', confirmationUrl: 'https://pay/continue' });
    mocks.details.mockResolvedValue({
      id: 'pay-1',
      status: 'pending',
      amountRub: 1000,
      orderNumber: '52',
      confirmationUrl: 'https://pay/continue',
    });
    mocks.reconcile.mockResolvedValue({ kind: 'ignored', reason: 'already-current' });
    const dto = await getOrderPageDto({ userId: 'u1', orderNumber: 52, now: new Date('2026-08-18T12:00:00Z') });
    expect(mocks.ensure).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'o1' }));
    expect(mocks.findFirst).toHaveBeenCalledTimes(2);
    if (dto?.payment.kind === 'online') expect(dto.payment.initialization?.status).toBe('PAYMENT_INITIALIZATION_READY');
  });

  it('passes a live clock into payment initialization after the request crosses W', async () => {
    const startedAt = new Date('2026-08-18T10:00:00Z');
    const beforeWindow = new Date(startedAt.getTime() + 22 * 60 * 60 * 1000);
    const afterWindow = new Date(startedAt.getTime() + 23 * 60 * 60 * 1000);
    mocks.findFirst.mockResolvedValue(base);
    mocks.ensure.mockImplementation(async ({ clock }) => {
      expect(clock()).toEqual(afterWindow);
      return { outcome: 'BLOCKED_AFTER_RETRY_WINDOW' };
    });
    const dto = await getOrderPageDto({ userId: 'u1', orderNumber: 52, now: beforeWindow, clock: () => afterWindow });
    expect(mocks.ensure).toHaveBeenCalledOnce();
    expect(dto?.payment).toMatchObject({
      kind: 'online',
      initialization: expect.objectContaining({
        status: 'PAYMENT_INITIALIZATION_BLOCKED',
        orderNumber: 52,
        continuePaymentUrl: null,
      }),
    });
  });

  it('does not create after W and suppresses stale actions when lookup fails', async () => {
    const correlated = {
      ...base,
      createdAt: new Date('2026-08-17T10:00:00Z'),
      paymentInitializationState: 'CORRELATED',
      paymentEverDispatchedAt: new Date('2026-08-17T10:01:00Z'),
      payment: { id: 'pay-1', status: 'pending', confirmationUrl: 'https://pay/continue', amount: 1000, paidAt: null },
    };
    mocks.findFirst.mockResolvedValue(correlated);
    mocks.details.mockRejectedValue(new Error('offline'));
    const dto = await getOrderPageDto({ userId: 'u1', orderNumber: 52, now: new Date('2026-08-18T12:00:00Z') });
    expect(mocks.ensure).not.toHaveBeenCalled();
    expect(dto?.canCancel).toBe(false);
    if (dto?.payment.kind === 'online')
      expect(dto.payment.initialization).toEqual(
        expect.objectContaining({ status: 'PAYMENT_INITIALIZATION_BLOCKED', allowedActions: ['RESYNC_PAYMENT'] }),
      );
  });

  it('scopes the read to the owner and does not mutate for a missing order', async () => {
    mocks.findFirst.mockResolvedValue(null);
    const dto = await getOrderPageDto({ userId: 'owner-1', orderNumber: 52, now: new Date('2026-08-18T12:00:00Z') });
    expect(dto).toBeNull();
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'owner-1', orderNumber: 52 } }),
    );
    expect(mocks.ensure).not.toHaveBeenCalled();
    expect(mocks.details).not.toHaveBeenCalled();
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });

  it.each(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])(
    'does not mutate provider state for %s orders',
    async (status) => {
      mocks.findFirst.mockResolvedValue({ ...base, status });
      await getOrderPageDto({ userId: 'u1', orderNumber: 52, now: new Date('2026-08-18T12:00:00Z') });
      expect(mocks.ensure).not.toHaveBeenCalled();
      expect(mocks.details).not.toHaveBeenCalled();
      expect(mocks.reconcile).not.toHaveBeenCalled();
    },
  );

  it.each(['applied', 'repaired'])('refetches after %s reconciliation', async (kind) => {
    const correlated = {
      ...base,
      paymentInitializationState: 'CORRELATED',
      paymentEverDispatchedAt: new Date('2026-08-18T10:01:00Z'),
      payment: { id: 'pay-1', status: 'pending', confirmationUrl: 'https://pay/continue', amount: 1000, paidAt: null },
    };
    mocks.findFirst.mockResolvedValueOnce(correlated).mockResolvedValue({ ...correlated, status: 'PROCESSING' });
    mocks.details.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'succeeded',
      amountRub: 1000,
      orderNumber: '52',
      confirmationUrl: null,
    });
    mocks.reconcile.mockResolvedValue({ kind, transition: 'succeeded' });
    await getOrderPageDto({ userId: 'u1', orderNumber: 52, now: new Date('2026-08-18T12:00:00Z') });
    expect(mocks.findFirst).toHaveBeenCalledTimes(2);
  });

  it('does not treat a non-pending provider status as continuation or cancellation proof', async () => {
    const correlated = {
      ...base,
      paymentInitializationState: 'CORRELATED',
      paymentEverDispatchedAt: new Date('2026-08-18T10:01:00Z'),
      payment: { id: 'pay-1', status: 'pending', confirmationUrl: 'https://pay/continue', amount: 1000, paidAt: null },
    };
    mocks.findFirst.mockResolvedValue(correlated);
    mocks.details.mockResolvedValue({
      id: 'pay-1',
      status: 'succeeded',
      amountRub: 1000,
      orderNumber: '52',
      confirmationUrl: null,
    });
    mocks.reconcile.mockResolvedValue({ kind: 'ignored', reason: 'transition-conflict' });
    const dto = await getOrderPageDto({ userId: 'u1', orderNumber: 52, now: new Date('2026-08-18T12:00:00Z') });
    expect(dto?.canCancel).toBe(false);
    if (dto?.payment.kind === 'online')
      expect(dto.payment.initialization?.status).toBe('PAYMENT_INITIALIZATION_PENDING');
  });

  it('exposes cancellation when YooKassa proves pending or waiting_for_capture', async () => {
    const correlated = {
      ...base,
      paymentInitializationState: 'CORRELATED',
      paymentEverDispatchedAt: new Date('2026-08-18T10:01:00Z'),
      payment: { id: 'pay-1', status: 'pending', confirmationUrl: 'https://pay/continue', amount: 1000, paidAt: null },
    };
    mocks.findFirst.mockResolvedValue(correlated);
    mocks.details.mockResolvedValue({
      id: 'pay-1',
      status: 'waiting_for_capture',
      amountRub: 1000,
      orderNumber: '52',
      confirmationUrl: null,
    });
    mocks.reconcile.mockResolvedValue({ kind: 'ignored', reason: 'remote-not-final' });
    const dto = await getOrderPageDto({ userId: 'u1', orderNumber: 52, now: new Date('2026-08-18T12:00:00Z') });
    expect(dto?.canCancel).toBe(true);

    mocks.details.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'pending',
      amountRub: 1000,
      orderNumber: '52',
      confirmationUrl: 'https://pay/continue',
    });
    await expect(
      getOrderPageDto({ userId: 'u1', orderNumber: 52, now: new Date('2026-08-18T12:00:00Z') }),
    ).resolves.toMatchObject({
      canCancel: true,
    });
  });

  it('derives review targets through shared eligibility while preserving snapshot items', async () => {
    const snapshot = {
      ...base,
      paymentMethod: 'cod',
      items: [
        {
          id: 'line-1',
          productName: 'Snapshot name',
          imageUrl: '/snapshot.jpg',
          configuration: null,
          unitPrice: 1000,
          quantity: 1,
          lineTotal: 1000,
          canonicalSku: { product: { id: 'product-1', slug: 'live-slug', name: 'Live name' } },
          productVariant: null,
        },
      ],
    };
    mocks.findFirst.mockResolvedValue(snapshot);
    mocks.eligibility.mockResolvedValue('eligible');
    const dto = await getOrderPageDto({ userId: 'u1', orderNumber: 52, now: new Date('2026-08-18T12:00:00Z') });
    expect(mocks.eligibility).toHaveBeenCalledWith('u1', 'product-1');
    expect(dto?.items[0]).toEqual(expect.objectContaining({ name: 'Snapshot name', imageUrl: '/snapshot.jpg' }));
    expect(dto?.reviewTargets[0]).toEqual(expect.objectContaining({ productId: 'product-1', eligible: true }));
  });
});

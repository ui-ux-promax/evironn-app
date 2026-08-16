import { describe, expect, it, vi } from 'vitest';
import {
  PAYMENT_CREATE_RETRY_WINDOW_MS,
  ensureOnlinePayment,
  type PaymentInitializationClient,
  type PaymentProviderAdapter,
} from '@/lib/payment-initialization';

const createdAt = new Date('2026-08-16T00:00:00.000Z');

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 1042,
    status: 'PENDING',
    paymentMethod: 'online',
    totalAmount: 159900,
    paymentReturnUrl: 'https://preview.test/orders/1042',
    createdAt,
    payment: null,
    items: [{ skuId: 'sku-1', quantity: 2 }],
    ...overrides,
  };
}

function harness(providerResult: Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>) {
  const state = { order: order(), payment: null as null | Record<string, unknown>, stock: 8 };
  const tx = {
    order: {
      updateMany: vi.fn(async () => {
        if (state.order.status !== 'PENDING') return { count: 0 };
        state.order.status = 'CANCELLED';
        return { count: 1 };
      }),
    },
    sku: { update: vi.fn(async () => ((state.stock += 2), {})) },
  };
  const client = {
    order: { findUnique: vi.fn(async () => ({ ...state.order, payment: state.payment })) },
    payment: {
      upsert: vi.fn(async ({ create }: { create: Record<string, unknown> }) => {
        state.payment = create;
        return create;
      }),
    },
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
  } as unknown as PaymentInitializationClient;
  const provider = {
    createPayment: vi.fn(async () => providerResult),
    getPaymentDetails: vi.fn(async () => null),
  } satisfies PaymentProviderAdapter;
  return { state, client, provider, tx };
}

describe('ensureOnlinePayment', () => {
  it('persists a verified provider correlation from durable request data', async () => {
    const h = harness({
      outcome: 'CREATED',
      payment: {
        id: 'pay-1',
        status: 'pending',
        amountRub: 159900,
        orderNumber: '1042',
        confirmationUrl: 'https://yookassa.test/confirm',
      },
    });

    const result = await ensureOnlinePayment({
      orderId: 'order-1',
      now: new Date('2026-08-16T01:00:00.000Z'),
      client: h.client,
      provider: h.provider,
    });

    expect(result).toEqual({ outcome: 'CREATED', confirmationUrl: 'https://yookassa.test/confirm' });
    expect(h.provider.createPayment).toHaveBeenCalledWith({
      amountRub: 159900,
      capture: true,
      description: 'Заказ #1042',
      idempotencyKey: 'payment-order-1',
      locale: 'ru_RU',
      metadata: { orderNumber: '1042' },
      returnUrl: 'https://preview.test/orders/1042',
    });
    expect(h.client.payment.upsert).toHaveBeenCalledWith({
      where: { orderId: 'order-1' },
      create: {
        id: 'pay-1',
        orderId: 'order-1',
        amount: 159900,
        status: 'pending',
        confirmationUrl: 'https://yookassa.test/confirm',
      },
      update: { amount: 159900, status: 'pending', confirmationUrl: 'https://yookassa.test/confirm' },
    });
  });

  it('cancels and restores exactly once only for adapter-proven no dispatch', async () => {
    const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
    expect(
      await ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).toEqual({ outcome: 'NOT_CREATED' });
    expect(h.tx.order.updateMany).toHaveBeenCalledOnce();
    expect(h.tx.sku.update).toHaveBeenCalledOnce();
    expect(h.state.stock).toBe(10);

    await ensureOnlinePayment({
      orderId: 'order-1',
      now: new Date('2026-08-16T02:00:00.000Z'),
      client: h.client,
      provider: h.provider,
    });
    expect(h.state.stock).toBe(10);
  });

  it.each([
    { outcome: 'INDETERMINATE', dispatched: true, reason: 'timeout' } as const,
    { outcome: 'INDETERMINATE', dispatched: true, reason: 'http-400' } as const,
    { outcome: 'INDETERMINATE', dispatched: true, reason: 'malformed-response' } as const,
  ])('preserves order and stock for $reason after dispatch', async (providerResult) => {
    const h = harness(providerResult);
    expect(
      await ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).toEqual({ outcome: 'INDETERMINATE' });
    expect(h.client.$transaction).not.toHaveBeenCalled();
    expect(h.state.stock).toBe(8);
  });

  it('treats a thrown adapter result without dispatch proof as indeterminate', async () => {
    const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
    h.provider.createPayment.mockRejectedValue(new Error('unknown adapter failure'));
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(h.client.$transaction).not.toHaveBeenCalled();
    expect(h.state.stock).toBe(8);
  });

  it('blocks create at the exact 23-hour application boundary', async () => {
    const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
    const now = new Date(createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS);
    expect(await ensureOnlinePayment({ orderId: 'order-1', now, client: h.client, provider: h.provider })).toEqual({
      outcome: 'BLOCKED_AFTER_RETRY_WINDOW',
    });
    expect(h.provider.createPayment).not.toHaveBeenCalled();
    expect(h.client.$transaction).not.toHaveBeenCalled();
  });

  it('fails closed when provider metadata or amount conflicts', async () => {
    const h = harness({
      outcome: 'CREATED',
      payment: {
        id: 'pay-other',
        status: 'pending',
        amountRub: 1,
        orderNumber: 'other',
        confirmationUrl: null,
      },
    });
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).rejects.toThrow('Provider payment correlation conflict');
    expect(h.client.payment.upsert).not.toHaveBeenCalled();
    expect(h.client.$transaction).not.toHaveBeenCalled();
  });

  it('returns indeterminate when local correlation persistence fails', async () => {
    const h = harness({
      outcome: 'CREATED',
      payment: {
        id: 'pay-1',
        status: 'pending',
        amountRub: 159900,
        orderNumber: '1042',
        confirmationUrl: 'https://yookassa.test/confirm',
      },
    });
    (h.client.payment.upsert as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('write failed'));
    expect(
      await ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).toEqual({ outcome: 'INDETERMINATE' });
    expect(h.client.$transaction).not.toHaveBeenCalled();
  });
});

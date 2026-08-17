import { describe, expect, it, vi } from 'vitest';
import {
  PAYMENT_CREATE_RETRY_WINDOW_MS,
  ensureOnlinePayment as ensureOnlinePaymentProduction,
  type PaymentInitializationClient,
  type PaymentProviderAdapter,
} from '@/lib/payment-initialization';

const createdAt = new Date('2026-08-16T00:00:00.000Z');

function ensureOnlinePayment(
  input: Parameters<typeof ensureOnlinePaymentProduction>[0],
): ReturnType<typeof ensureOnlinePaymentProduction> {
  return ensureOnlinePaymentProduction({ ...input, clock: input.clock ?? (() => input.now) });
}

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 1042,
    status: 'PENDING',
    paymentMethod: 'online',
    totalAmount: 159900,
    paymentReturnUrl: 'https://preview.test/orders/1042',
    createdAt,
    paymentInitializationState: 'READY',
    paymentInitializationClaimedAt: null,
    paymentEverDispatchedAt: null,
    payment: null,
    items: [{ skuId: 'sku-1', quantity: 2 }],
    ...overrides,
  };
}

function harness(providerResult: Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>) {
  const state: { order: any; payment: null | Record<string, unknown>; stock: number; allowDuplicateClaim: boolean } = {
    order: order(),
    payment: null,
    stock: 8,
    allowDuplicateClaim: false,
  };
  const tx = {
    order: {
      updateMany: vi.fn(async ({ where, data }: { where: Record<string, any>; data: Record<string, any> }) => {
        if (state.order.status !== 'PENDING') return { count: 0 };
        if (where.paymentMethod && where.paymentMethod !== state.order.paymentMethod) return { count: 0 };
        if (where.payment?.is === null && state.payment !== null) return { count: 0 };
        if (where.payment?.isNot === null && state.payment === null) return { count: 0 };
        if (
          where.paymentInitializationState &&
          where.paymentInitializationState !== state.order.paymentInitializationState
        ) {
          if (
            state.allowDuplicateClaim &&
            where.paymentInitializationState === 'READY' &&
            state.order.paymentInitializationState === 'CLAIMED'
          )
            return { count: 1 };
          return { count: 0 };
        }
        if (
          'paymentInitializationClaimedAt' in where &&
          where.paymentInitializationClaimedAt?.getTime?.() !== state.order.paymentInitializationClaimedAt?.getTime?.()
        )
          return { count: 0 };
        if (
          'paymentEverDispatchedAt' in where &&
          where.paymentEverDispatchedAt?.getTime?.() !== state.order.paymentEverDispatchedAt?.getTime?.()
        )
          return { count: 0 };
        Object.assign(state.order, data);
        return { count: 1 };
      }),
    },
    payment: {
      findUnique: vi.fn(async () => (state.payment ? { id: String(state.payment.id) } : null)),
      upsert: vi.fn(
        async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
          state.payment = state.payment ? { ...state.payment, ...update } : create;
          return state.payment;
        },
      ),
    },
    sku: { update: vi.fn(async () => ((state.stock += 2), {})) },
  };
  const client = {
    order: { findUnique: vi.fn(async () => ({ ...state.order, payment: state.payment })) },
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
  } as unknown as PaymentInitializationClient;
  const provider = {
    createPayment: vi.fn(async () => providerResult),
    getPaymentDetails: vi.fn(async () => null),
  } satisfies PaymentProviderAdapter;
  return { state, client, provider, tx };
}

describe('ensureOnlinePayment', () => {
  it('keeps CREATED persistence and proven NOT_CREATED cancellation mutually exclusive', async () => {
    const h = harness({ outcome: 'INDETERMINATE', dispatched: true, reason: 'unused' });
    h.state.allowDuplicateClaim = true;
    let resolveCreated!: (value: Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>) => void;
    let resolveNotCreated!: (value: Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>) => void;
    const createdProvider = {
      ...h.provider,
      createPayment: vi.fn(
        () =>
          new Promise<Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>>(
            (resolve) => (resolveCreated = resolve),
          ),
      ),
    };
    const notCreatedProvider = {
      ...h.provider,
      createPayment: vi.fn(
        () =>
          new Promise<Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>>(
            (resolve) => (resolveNotCreated = resolve),
          ),
      ),
    };

    const created = ensureOnlinePayment({
      orderId: 'order-1',
      now: new Date('2026-08-16T01:00:00.000Z'),
      client: h.client,
      provider: createdProvider,
    });
    const notCreated = ensureOnlinePayment({
      orderId: 'order-1',
      now: new Date('2026-08-16T01:00:00.000Z'),
      client: h.client,
      provider: notCreatedProvider,
    });
    await vi.waitFor(() => {
      expect(createdProvider.createPayment).toHaveBeenCalledOnce();
      expect(notCreatedProvider.createPayment).toHaveBeenCalledOnce();
    });

    resolveCreated({
      outcome: 'CREATED',
      payment: {
        id: 'pay-1',
        status: 'pending',
        amountRub: 159900,
        orderNumber: '1042',
        confirmationUrl: 'https://yookassa.test/confirm',
      },
    });
    await expect(created).resolves.toEqual({
      outcome: 'CREATED',
      confirmationUrl: 'https://yookassa.test/confirm',
    });
    resolveNotCreated({ outcome: 'NOT_CREATED', dispatched: false });
    await expect(notCreated).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(h.state.order.status).toBe('PENDING');
    expect(h.state.stock).toBe(8);
    expect(h.state.payment).toMatchObject({ id: 'pay-1' });
  });

  it('lets first no-dispatch cancellation win the same-claim race against correlation', async () => {
    const h = harness({ outcome: 'INDETERMINATE', dispatched: true, reason: 'unused' });
    h.state.allowDuplicateClaim = true;
    let resolveCreated!: (value: Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>) => void;
    let resolveNotCreated!: (value: Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>) => void;
    const createdProvider = {
      ...h.provider,
      createPayment: vi.fn(
        () =>
          new Promise<Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>>(
            (resolve) => (resolveCreated = resolve),
          ),
      ),
    } satisfies PaymentProviderAdapter;
    const notCreatedProvider = {
      ...h.provider,
      createPayment: vi.fn(
        () =>
          new Promise<Awaited<ReturnType<PaymentProviderAdapter['createPayment']>>>(
            (resolve) => (resolveNotCreated = resolve),
          ),
      ),
    } satisfies PaymentProviderAdapter;
    const args = { orderId: 'order-1', now: new Date('2026-08-16T01:00:00.000Z'), client: h.client };
    const created = ensureOnlinePayment({ ...args, provider: createdProvider });
    const notCreated = ensureOnlinePayment({ ...args, provider: notCreatedProvider });
    await vi.waitFor(() => expect(notCreatedProvider.createPayment).toHaveBeenCalledOnce());

    resolveNotCreated({ outcome: 'NOT_CREATED', dispatched: false });
    await expect(notCreated).resolves.toEqual({ outcome: 'NOT_CREATED' });
    resolveCreated({
      outcome: 'CREATED',
      payment: { id: 'pay-1', status: 'pending', amountRub: 159900, orderNumber: '1042', confirmationUrl: null },
    });
    await expect(created).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(h.state.order.status).toBe('CANCELLED');
    expect(h.state.stock).toBe(10);
    expect(h.state.payment).toBeNull();
  });

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
    expect(h.tx.payment.upsert).toHaveBeenCalledWith({
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
    expect(h.tx.order.updateMany).toHaveBeenCalledTimes(2);
    expect(h.tx.order.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELLED', paymentInitializationState: 'NOT_CREATED' }),
      }),
    );
    expect(h.client.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
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

  it('fails closed as indeterminate when guarded cancellation cannot commit', async () => {
    const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
    let calls = 0;
    (h.client.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback: any) => {
      calls += 1;
      if (calls === 2) throw new Error('transaction failed');
      return callback(h.tx);
    });
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(h.state.order.status).toBe('PENDING');
    expect(h.state.stock).toBe(8);
  });

  it.each([
    [
      'initial read',
      (h: ReturnType<typeof harness>) =>
        (h.client.order.findUnique as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('read')),
    ],
    [
      'claim',
      (h: ReturnType<typeof harness>) =>
        (h.client.$transaction as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('claim')),
    ],
    ['durable request', (h: ReturnType<typeof harness>) => (h.state.order.paymentReturnUrl = null)],
  ])('makes %s failure total and indeterminate', async (_boundary, fail) => {
    const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
    fail(h);
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
  });

  it('makes dispatched-state persistence failure total and indeterminate', async () => {
    const h = harness({ outcome: 'INDETERMINATE', dispatched: true, reason: 'timeout' });
    let calls = 0;
    (h.client.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback: any) => {
      calls += 1;
      if (calls === 2) throw new Error('dispatch persist');
      return callback(h.tx);
    });
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
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
    expect(h.client.$transaction).toHaveBeenCalledTimes(2);
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
    expect(h.client.$transaction).toHaveBeenCalledTimes(2);
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

  it.each(['READY', 'DISPATCHED'] as const)(
    'releases an exact %s claim when the live clock crosses the window',
    async (origin) => {
      const evidence = origin === 'DISPATCHED' ? new Date('2026-08-16T00:30:00.000Z') : null;
      const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
      Object.assign(h.state.order, { paymentInitializationState: origin, paymentEverDispatchedAt: evidence });
      const claimNow = new Date(createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS - 1);
      const dispatchNow = new Date(createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS);
      const times = [claimNow, dispatchNow];

      await expect(
        ensureOnlinePayment({
          orderId: 'order-1',
          now: claimNow,
          clock: () => times.shift()!,
          client: h.client,
          provider: h.provider,
        }),
      ).resolves.toEqual({ outcome: 'BLOCKED_AFTER_RETRY_WINDOW' });
      expect(h.provider.createPayment).not.toHaveBeenCalled();
      expect(h.state.order).toMatchObject({
        paymentInitializationState: origin,
        paymentInitializationClaimedAt: null,
        paymentEverDispatchedAt: evidence,
      });
    },
  );

  it('persists verified correlation with a null confirmation URL as CREATED', async () => {
    const h = harness({
      outcome: 'CREATED',
      payment: { id: 'pay-1', status: 'pending', amountRub: 159900, orderNumber: '1042', confirmationUrl: null },
    });
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'CREATED', confirmationUrl: null });
    expect(h.state.order.paymentInitializationState).toBe('CORRELATED');
  });

  it('uses claim time in the atomic retry-window guard', async () => {
    const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
    await ensureOnlinePayment({
      orderId: 'order-1',
      now: new Date('2026-08-16T01:00:00.000Z'),
      client: h.client,
      provider: h.provider,
    });
    expect(h.tx.order.updateMany.mock.calls[0][0].where.createdAt).toEqual({
      gt: new Date('2026-08-15T02:00:00.000Z'),
    });
  });

  it('uses the live claim clock instead of a stale caller timestamp', async () => {
    const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
    const staleNow = new Date('2026-08-16T01:00:00.000Z');
    const liveNow = new Date(createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS);
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: staleNow,
        clock: () => liveNow,
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'BLOCKED_AFTER_RETRY_WINDOW' });
    expect(h.client.$transaction).not.toHaveBeenCalled();
    expect(h.provider.createPayment).not.toHaveBeenCalled();
  });

  it('replays DISPATCHED with the original write-once evidence', async () => {
    const evidence = new Date('2026-08-16T00:30:00.000Z');
    const h = harness({ outcome: 'INDETERMINATE', dispatched: true, reason: 'timeout' });
    Object.assign(h.state.order, { paymentInitializationState: 'DISPATCHED', paymentEverDispatchedAt: evidence });
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(h.state.order).toMatchObject({
      paymentInitializationState: 'DISPATCHED',
      paymentEverDispatchedAt: evidence,
    });
  });

  it('fails closed when write-once dispatch evidence changes after claim', async () => {
    const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
    h.provider.createPayment.mockImplementation(async () => {
      h.state.order.paymentEverDispatchedAt = new Date('2026-08-16T01:00:01.000Z');
      return { outcome: 'NOT_CREATED', dispatched: false };
    });
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(h.state.order.status).toBe('PENDING');
    expect(h.state.stock).toBe(8);
  });

  it('returns indeterminate when an expired exact-claim release throws', async () => {
    const h = harness({ outcome: 'NOT_CREATED', dispatched: false });
    let calls = 0;
    (h.client.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback: any) => {
      calls += 1;
      if (calls === 2) throw new Error('release failed');
      return callback(h.tx);
    });
    const claimNow = new Date(createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS - 1);
    const dispatchNow = new Date(createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS);
    const times = [claimNow, dispatchNow];
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: claimNow,
        clock: () => times.shift()!,
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(h.provider.createPayment).not.toHaveBeenCalled();
  });

  it('treats provider lookup rejection as indeterminate', async () => {
    const h = harness({ outcome: 'INDETERMINATE', dispatched: true, reason: 'lookup' });
    h.state.payment = { id: 'pay-1', amount: 159900, status: 'pending', confirmationUrl: null };
    h.provider.getPaymentDetails.mockRejectedValue(new Error('lookup timeout'));
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
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
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(h.tx.payment.upsert).not.toHaveBeenCalled();
    expect(h.client.$transaction).toHaveBeenCalledOnce();
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
    h.tx.payment.upsert.mockRejectedValue(new Error('write failed'));
    expect(
      await ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-16T01:00:00.000Z'),
        client: h.client,
        provider: h.provider,
      }),
    ).toEqual({ outcome: 'INDETERMINATE' });
    expect(h.client.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  });
});

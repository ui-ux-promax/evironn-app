import { describe, it, expect, beforeEach, vi } from 'vitest';

const createMock = vi.fn();
const cancelMock = vi.fn();
const loadMock = vi.fn();
vi.mock('@webzaytsev/yookassa-ts-sdk', () => ({
  YooKassa: () => ({ payments: { create: createMock, cancel: cancelMock, load: loadMock } }),
  CurrencyEnum: { RUB: 'RUB' },
  LocaleEnum: { ru_RU: 'ru_RU' },
}));

import {
  createPayment,
  createPaymentAttempt,
  cancelPayment,
  getPaymentDetails,
  getPaymentStatus,
} from '@/lib/yookassa';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.YOOKASSA_SHOP_ID = 'shop';
  process.env.YOOKASSA_SECRET_KEY = 'secret';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://shop.test';
});

describe('createPayment', () => {
  it('передаёт сумму в рублях (value в рублях, 2 знака) и прокидывает return_url/idempotency', async () => {
    createMock.mockResolvedValue({ id: 'pay_1', confirmation: { confirmation_url: 'https://yoo/redirect' } });
    const res = await createPayment({ orderId: 'order-uuid-1025', orderNumber: 1025, amountRub: 15999 });
    expect(res).toEqual({ id: 'pay_1', confirmationUrl: 'https://yoo/redirect' });
    const [payload, idempotencyKey] = createMock.mock.calls[0];
    expect(payload.amount).toEqual({ value: '15999.00', currency: 'RUB' });
    expect(payload.capture).toBe(true);
    expect(payload.confirmation).toEqual({
      type: 'redirect',
      return_url: 'https://shop.test/orders/1025',
      locale: 'ru_RU',
    });
    expect(payload.metadata).toEqual({ orderNumber: '1025' });
    expect(idempotencyKey).toBe('payment-order-uuid-1025');
  });

  it('amount.value в рублях, без ×100 (регресс: переплата в 100 раз, инцидент order-17)', async () => {
    createMock.mockResolvedValue({ id: 'pay_5', confirmation: { confirmation_url: 'https://yoo/r5' } });
    await createPayment({ orderId: 'order-uuid-17', orderNumber: 17, amountRub: 15490 });
    const [payload] = createMock.mock.calls[0];
    // ЮKassa ждёт сумму в рублях ("15490.00"), а не в копейках ("1549000").
    expect(payload.amount).toEqual({ value: '15490.00', currency: 'RUB' });
  });

  it('использует baseUrl если передан, приоритетнее siteUrl', async () => {
    createMock.mockResolvedValue({ id: 'pay_2', confirmation: { confirmation_url: 'https://yoo/r2' } });
    await createPayment({
      orderId: 'order-uuid-1026',
      orderNumber: 1026,
      amountRub: 100,
      baseUrl: 'https://preview.vercel.app',
    });
    const [payload] = createMock.mock.calls[0];
    expect(payload.confirmation.return_url).toBe('https://preview.vercel.app/orders/1026');
  });

  it('нормализует baseUrl до origin: выкусывает путь и хвостовой \\n (регресс инцидента order-16)', async () => {
    createMock.mockResolvedValue({ id: 'pay_3', confirmation: { confirmation_url: 'https://yoo/r3' } });
    await createPayment({
      orderId: 'order-uuid-16',
      orderNumber: 16,
      amountRub: 13490,
      // В env по ошибке попал URL вебхука с хвостовым переносом строки.
      baseUrl: 'https://sneakers-store-v1-13k4jbj23-s1aw3ns-projects.vercel.app/api/yookassa/webhook\n',
    });
    const [payload] = createMock.mock.calls[0];
    expect(payload.confirmation.return_url).toBe(
      'https://sneakers-store-v1-13k4jbj23-s1aw3ns-projects.vercel.app/orders/16',
    );
  });

  it('нормализует загрязнённый NEXT_PUBLIC_SITE_URL через siteUrl()', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://shop.test/api/yookassa/webhook\n';
    createMock.mockResolvedValue({ id: 'pay_4', confirmation: { confirmation_url: 'https://yoo/r4' } });
    await createPayment({ orderId: 'order-uuid-20', orderNumber: 20, amountRub: 100 });
    const [payload] = createMock.mock.calls[0];
    expect(payload.confirmation.return_url).toBe('https://shop.test/orders/20');
  });
});

describe('createPaymentAttempt', () => {
  const input = {
    amountRub: 15999,
    capture: true as const,
    description: 'Заказ #1025',
    idempotencyKey: 'payment-order-uuid-1025',
    locale: 'ru_RU' as const,
    metadata: { orderNumber: '1025' },
    returnUrl: 'https://shop.test/orders/1025',
  };

  it('returns sanitized provider details after dispatch', async () => {
    createMock.mockResolvedValue({
      id: 'pay-1',
      status: 'pending',
      amount: { value: '15999.00', currency: 'RUB' },
      metadata: { orderNumber: '1025' },
      confirmation: { confirmation_url: 'https://yoo/redirect' },
    });
    await expect(createPaymentAttempt(input)).resolves.toEqual({
      outcome: 'CREATED',
      payment: {
        id: 'pay-1',
        status: 'pending',
        amountRub: 15999,
        orderNumber: '1025',
        confirmationUrl: 'https://yoo/redirect',
      },
    });
  });

  it('classifies every SDK failure after invocation as indeterminate', async () => {
    createMock.mockRejectedValue(Object.assign(new Error('HTTP 400 invalid_request'), { status: 400 }));
    await expect(createPaymentAttempt(input)).resolves.toEqual({
      outcome: 'INDETERMINATE',
      dispatched: true,
      reason: 'provider-error',
    });
  });

  it('classifies malformed returned data as indeterminate', async () => {
    createMock.mockResolvedValue({ id: 'pay-1', status: 'pending' });
    await expect(createPaymentAttempt(input)).resolves.toEqual({
      outcome: 'INDETERMINATE',
      dispatched: true,
      reason: 'malformed-response',
    });
  });

  it('proves no dispatch when local adapter configuration fails before SDK invocation', async () => {
    delete process.env.YOOKASSA_SHOP_ID;
    await expect(createPaymentAttempt(input)).resolves.toEqual({ outcome: 'NOT_CREATED', dispatched: false });
    expect(createMock).not.toHaveBeenCalled();
  });
});

describe('cancelPayment', () => {
  it('зовёт sdk.payments.cancel с id', async () => {
    cancelMock.mockResolvedValue({ id: 'pay_1', status: 'canceled' });
    await cancelPayment('pay_1');
    expect(cancelMock).toHaveBeenCalledWith('pay_1');
  });
});

describe('getPaymentStatus', () => {
  it('возвращает статус платежа от sdk.payments.load', async () => {
    loadMock.mockResolvedValue({ id: 'pay_1', status: 'succeeded' });
    const status = await getPaymentStatus('pay_1');
    expect(loadMock).toHaveBeenCalledWith('pay_1');
    expect(status).toBe('succeeded');
  });

  it.each([[{ id: 'pay-1' }], [{ id: 'pay-1', status: 'refunded' }]])(
    'rejects malformed or unknown provider status',
    async (payload) => {
      loadMock.mockResolvedValue(payload);
      await expect(getPaymentStatus('pay-1')).rejects.toThrow('Malformed YooKassa payment status response');
    },
  );
});

describe('getPaymentDetails', () => {
  it('returns only bounded correlation fields', async () => {
    loadMock.mockResolvedValue({
      id: 'pay-1',
      status: 'pending',
      amount: { value: '15999.00', currency: 'RUB' },
      metadata: { orderNumber: '1025', ignored: 'secret-shaped-provider-data' },
      confirmation: { confirmation_url: 'https://yoo/redirect' },
    });
    await expect(getPaymentDetails('pay-1')).resolves.toEqual({
      id: 'pay-1',
      status: 'pending',
      amountRub: 15999,
      orderNumber: '1025',
      confirmationUrl: 'https://yoo/redirect',
    });
  });

  it('rejects malformed provider data', async () => {
    loadMock.mockResolvedValue({ id: 'pay-1', status: 'pending' });
    await expect(getPaymentDetails('pay-1')).rejects.toThrow('Malformed YooKassa payment response');
  });

  it('returns null only for provider not-found', async () => {
    loadMock.mockRejectedValue(Object.assign(new Error('not found'), { status: 404 }));
    await expect(getPaymentDetails('pay-missing')).resolves.toBeNull();
  });

  it.each(['not_found', 'HTTP_404'])('returns null for installed SDK YooKassaErr name %s', async (name) => {
    loadMock.mockRejectedValue(Object.assign(new Error('payment absent'), { name }));
    await expect(getPaymentDetails('pay-missing')).resolves.toBeNull();
  });

  it('propagates provider transport and authentication failures', async () => {
    loadMock.mockRejectedValue(Object.assign(new Error('provider unavailable'), { status: 503 }));
    await expect(getPaymentDetails('pay-1')).rejects.toThrow('provider unavailable');
  });

  it('rejects invalid successful provider payloads instead of treating them as absence', async () => {
    loadMock.mockResolvedValue({
      id: 'pay-1',
      status: 'pending',
      amount: { value: '15999.00', currency: 'USD' },
      metadata: { orderNumber: '1025' },
    });
    await expect(getPaymentDetails('pay-1')).rejects.toThrow('Malformed YooKassa payment response');
  });

  it('rejects unknown payment status in otherwise valid provider details', async () => {
    loadMock.mockResolvedValue({
      id: 'pay-1',
      status: 'refunded',
      amount: { value: '15999.00', currency: 'RUB' },
      metadata: { orderNumber: '1025' },
    });
    await expect(getPaymentDetails('pay-1')).rejects.toThrow('Malformed YooKassa payment response');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cookies: vi.fn(),
  buildCheckoutQuote: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/checkout-page', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/checkout-page')>();
  return { ...actual, buildCheckoutQuote: mocks.buildCheckoutQuote };
});

import { getCheckoutQuote } from '@/app/actions/checkout';
import { checkCoupon } from '@/lib/coupon';
import {
  PAYMENT_INITIALIZATION_STATUSES,
  buildBlockedPaymentInitializationDto,
} from '@/services/dto/checkout-page.dto';

const raw = {
  deliveryMethod: 'courier',
  deliveryZone: 'moscow',
  deliverySlotId: '2026-08-19:10-14',
  address: { city: 'Москва', addressLine: 'Тверская, 10' },
  services: { carrying: false, assembly: true, removal: false },
  couponCode: ' phase4 ',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.cookies.mockResolvedValue({ get: vi.fn(() => ({ value: 'cookie-token' })) });
});

describe('getCheckoutQuote', () => {
  it('owns authentication and cookie lookup and forwards no client ownership or money', async () => {
    mocks.buildCheckoutQuote.mockResolvedValue({ ok: false, code: 'EMPTY_CART', message: 'Корзина пуста' });

    await expect(getCheckoutQuote({ ...raw, userId: 'forged', cartId: 'forged', total: 1, price: 1 })).resolves.toEqual(
      { ok: false, code: 'INVALID_INPUT', message: 'Некорректные данные оформления' },
    );

    await expect(getCheckoutQuote(raw)).resolves.toEqual({
      ok: false,
      code: 'EMPTY_CART',
      message: 'Корзина пуста',
    });
    expect(mocks.buildCheckoutQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        cookieToken: 'cookie-token',
        raw: { ...raw, couponCode: 'phase4' },
      }),
    );
  });

  it('returns UNAUTHENTICATED before reading checkout state', async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(getCheckoutQuote(raw)).resolves.toEqual({
      ok: false,
      code: 'UNAUTHENTICATED',
      message: 'Требуется вход',
    });
    expect(mocks.buildCheckoutQuote).not.toHaveBeenCalled();
  });
});

describe('payment initialization vocabulary', () => {
  it('pins exact statuses and blocked formatter without provider state', () => {
    expect(PAYMENT_INITIALIZATION_STATUSES).toEqual([
      'PAYMENT_INITIALIZATION_READY',
      'PAYMENT_INITIALIZATION_PENDING',
      'PAYMENT_INITIALIZATION_BLOCKED',
    ]);
    expect(buildBlockedPaymentInitializationDto(1042)).toEqual({
      status: 'PAYMENT_INITIALIZATION_BLOCKED',
      orderNumber: 1042,
      heading: 'Платёж требует проверки',
      message: 'Заказ №1042 сохранён. Повторное создание платежа отключено; статус проверяется.',
      continuePaymentUrl: null,
      canRetryCreate: false,
      allowedActions: ['OPEN_ORDER'],
    });
  });
});

describe('checkout coupon reader', () => {
  it('uses the injected transaction-compatible reader and clock', async () => {
    const reader = {
      coupon: {
        findUnique: vi.fn(async () => ({
          code: 'PHASE4',
          percent: 12,
          active: true,
          expiresAt: new Date('2025-01-01T00:00:00.000Z'),
        })),
      },
    };

    await expect(checkCoupon(' phase4 ', reader, () => new Date('2024-12-31T00:00:00.000Z'))).resolves.toEqual({
      ok: true,
      code: 'PHASE4',
      percent: 12,
    });
    expect(reader.coupon.findUnique).toHaveBeenCalledWith({ where: { code: 'PHASE4' } });
  });
});

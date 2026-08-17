import React from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cookies: vi.fn(),
  getCheckoutPageDto: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT_TEST:${path}`);
  }),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/checkout-page', () => ({ getCheckoutPageDto: mocks.getCheckoutPageDto }));
vi.mock('@/components/evironn/checkout/checkout-variant-a', () => ({
  CheckoutVariantA: () => React.createElement('div', { 'data-testid': 'checkout-mock' }),
}));

let CheckoutPage: typeof import('@/app/(shop)/checkout/page').default;

beforeAll(async () => {
  CheckoutPage = (await import('@/app/(shop)/checkout/page')).default;
});

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.cookies.mockReset();
  mocks.getCheckoutPageDto.mockReset();
  mocks.redirect.mockClear();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });
});

describe('checkout route readiness', () => {
  it.each(['EMPTY_CART', 'NON_READY_CART'])('redirects %s carts to the truthful cart route', async (status) => {
    mocks.getCheckoutPageDto.mockResolvedValue({ status });

    await expect(CheckoutPage()).rejects.toThrow('NEXT_REDIRECT_TEST:/cart');
    expect(mocks.redirect).toHaveBeenCalledWith('/cart');
  });
});

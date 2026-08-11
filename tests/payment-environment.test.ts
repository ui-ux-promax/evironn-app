import { expect, it } from 'vitest';
import { assertPortfolioPaymentMode } from '@/lib/payment-environment';

it('requires an explicit sandbox declaration in demo mode', () => {
  expect(() => assertPortfolioPaymentMode({ DEMO_MODE: 'true', YOOKASSA_MODE: 'sandbox' })).not.toThrow();
  expect(() => assertPortfolioPaymentMode({ DEMO_MODE: 'true', YOOKASSA_MODE: 'live' })).toThrow(
    'Portfolio demo requires YooKassa sandbox',
  );
  expect(() => assertPortfolioPaymentMode({ DEMO_MODE: 'true' })).toThrow('Portfolio demo requires YooKassa sandbox');
  expect(() => assertPortfolioPaymentMode({ DEMO_MODE: 'false', YOOKASSA_MODE: 'live' })).not.toThrow();
});

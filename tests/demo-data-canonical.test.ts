import { CANONICAL_COUPONS, CANONICAL_INVENTORY } from '@/lib/demo-data/canonical';
import { assertDemoEnvironment } from '@/lib/demo-data/contracts';
import { expect, it } from 'vitest';

it('derives unique inventory from source-controlled seed data', () => {
  expect(CANONICAL_INVENTORY.length).toBeGreaterThan(0);
  expect(new Set(CANONICAL_INVENTORY.map((row) => row.sku)).size).toBe(CANONICAL_INVENTORY.length);
  expect(CANONICAL_COUPONS.map((coupon) => coupon.code)).toContain('WELCOME10');
});

it('fails closed outside portfolio production', () => {
  expect(() => assertDemoEnvironment({ DEMO_MODE: 'true', VERCEL_ENV: 'production' })).not.toThrow();
  expect(() => assertDemoEnvironment({ DEMO_MODE: 'false', VERCEL_ENV: 'production' })).toThrow(
    'Demo reset is disabled',
  );
  expect(() => assertDemoEnvironment({ DEMO_MODE: 'false', VERCEL_ENV: 'preview' })).toThrow('Demo reset is disabled');
  expect(() => assertDemoEnvironment({ DEMO_MODE: 'true', VERCEL_ENV: 'preview' })).toThrow('Demo reset is disabled');
});

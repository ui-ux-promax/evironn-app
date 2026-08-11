import { CANONICAL_COUPONS, CANONICAL_INVENTORY } from '@/lib/demo-data/canonical';
import { resetDemoData } from '@/lib/demo-data/reset';
import { expect, it, vi } from 'vitest';

function makeDb(calls: string[] = []) {
  const op = (name: string, result: unknown = { count: 1 }) =>
    vi.fn(async () => {
      calls.push(name);
      return result;
    });

  return {
    payment: { deleteMany: op('payments') },
    orderItem: { deleteMany: op('orderItems') },
    order: { deleteMany: op('orders') },
    cartItem: { deleteMany: op('cartItems') },
    cart: { deleteMany: op('carts'), count: vi.fn().mockResolvedValue(0) },
    wishlistItem: { deleteMany: op('wishlistItems') },
    wishlist: { deleteMany: op('wishlists') },
    subscriber: { deleteMany: op('subscribers'), count: vi.fn().mockResolvedValue(0) },
    emailVerificationCode: { deleteMany: op('codes') },
    verificationToken: { deleteMany: op('tokens') },
    user: {
      updateMany: op('markFixtures'),
      deleteMany: op('users'),
      count: vi.fn(async (args?: { where?: { isPortfolioFixture?: boolean } }) =>
        args?.where?.isPortfolioFixture ? 8 : 0,
      ),
    },
    productVariant: { update: op('variant'), count: vi.fn().mockResolvedValue(CANONICAL_INVENTORY.length) },
    coupon: { upsert: op('coupon') },
    category: { count: vi.fn().mockResolvedValue(4) },
    product: { count: vi.fn().mockResolvedValue(8) },
  };
}

it('deletes ephemeral data, restores canonical values, and returns invariants', async () => {
  const calls: string[] = [];
  const db = makeDb(calls);

  const result = await resetDemoData({
    db,
    env: { DEMO_MODE: 'true', VERCEL_ENV: 'production' },
  });

  expect(calls.indexOf('orders')).toBeLessThan(calls.indexOf('users'));
  expect(calls.indexOf('markFixtures')).toBeLessThan(calls.indexOf('orders'));
  expect(calls).toContain('variant');
  expect(calls).toContain('coupon');
  expect(result).toEqual({
    categories: 4,
    products: 8,
    variants: CANONICAL_INVENTORY.length,
    fixtureUsers: 8,
    visitorUsers: 0,
    carts: 0,
    subscribers: 0,
  });
});

it('returns equal invariants across repeated resets', async () => {
  const db = makeDb();
  const env = { DEMO_MODE: 'true', VERCEL_ENV: 'production' };

  const first = await resetDemoData({ db, env });
  const second = await resetDemoData({ db, env });

  expect(second).toEqual(first);
  expect(db.user.updateMany).toHaveBeenCalledTimes(2);
  expect(db.productVariant.update).toHaveBeenCalledTimes(CANONICAL_INVENTORY.length * 2);
  expect(db.coupon.upsert).toHaveBeenCalledTimes(CANONICAL_COUPONS.length * 2);
});

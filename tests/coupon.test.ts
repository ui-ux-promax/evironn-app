import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => ({
  prisma: { coupon: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() }, cart: { findFirst: vi.fn() } },
}));

const { authMock, cookiesMock, resolveOwnerCartMock, buildCartDtoMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  cookiesMock: vi.fn(),
  resolveOwnerCartMock: vi.fn(),
  buildCartDtoMock: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/cart', () => ({ resolveOwnerCart: resolveOwnerCartMock }));
vi.mock('@/lib/cart-presentation', () => ({ buildCartDto: buildCartDtoMock, cartPresentationInclude: {} }));

import { normalizeCouponCode, calcCouponDiscount, checkCoupon } from '@/lib/coupon';
import { validateCoupon } from '@/app/actions/coupon';
import { prisma } from '@/lib/prisma-client';

const findUnique = prisma.coupon.findUnique as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(null);
  cookiesMock.mockResolvedValue({ get: vi.fn(() => ({ value: 'cart-token' })) });
  resolveOwnerCartMock.mockResolvedValue({ id: 'cart-1' });
});

describe('normalizeCouponCode', () => {
  it('тримит и приводит к UPPERCASE', () => {
    expect(normalizeCouponCode('  ritm10 ')).toBe('RITM10');
  });
  it('пустое → пустая строка', () => {
    expect(normalizeCouponCode('   ')).toBe('');
  });
});

describe('calcCouponDiscount', () => {
  it('10% от 10000 = 1000', () => {
    expect(calcCouponDiscount(10000, 10)).toBe(1000);
  });
  it('округляет вниз (33% от 100 = 33)', () => {
    expect(calcCouponDiscount(100, 33)).toBe(33);
  });
  it('не превышает сумму товаров (clamp при 100%)', () => {
    expect(calcCouponDiscount(5000, 100)).toBe(5000);
  });
  it('отрицательный процент → 0 (не overcharge)', () => {
    expect(calcCouponDiscount(10000, -50)).toBe(0);
  });
  it('процент 0 → 0', () => {
    expect(calcCouponDiscount(10000, 0)).toBe(0);
  });
  it('процент > 100 → не больше суммы товаров', () => {
    expect(calcCouponDiscount(5000, 200)).toBe(5000);
  });
});

describe('checkCoupon', () => {
  it('валидный бессрочный → ok', async () => {
    findUnique.mockResolvedValue({ code: 'RITM10', percent: 10, active: true, expiresAt: null });
    expect(await checkCoupon('ritm10')).toEqual({ ok: true, code: 'RITM10', percent: 10 });
  });
  it('неактивный → отказ', async () => {
    findUnique.mockResolvedValue({ code: 'X', percent: 10, active: false, expiresAt: null });
    expect((await checkCoupon('x')).ok).toBe(false);
  });
  it('истёкший → отказ', async () => {
    findUnique.mockResolvedValue({ code: 'X', percent: 10, active: true, expiresAt: new Date('2020-01-01') });
    expect((await checkCoupon('x')).ok).toBe(false);
  });
  it('несуществующий → отказ', async () => {
    findUnique.mockResolvedValue(null);
    expect((await checkCoupon('nope')).ok).toBe(false);
  });
  it('процент вне 1..100 → отказ (fail-closed)', async () => {
    findUnique.mockResolvedValue({ code: 'BAD', percent: 0, active: true, expiresAt: null });
    expect((await checkCoupon('bad')).ok).toBe(false);
    findUnique.mockResolvedValue({ code: 'BAD', percent: 150, active: true, expiresAt: null });
    expect((await checkCoupon('bad')).ok).toBe(false);
  });
  it('пустой код → отказ без запроса к БД', async () => {
    expect((await checkCoupon('   ')).ok).toBe(false);
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe('validateCoupon server totals', () => {
  it('returns complete current server totals, floors discount, and never persists coupon', async () => {
    const cart = { id: 'cart-1', items: [{ id: 'line-1' }] };
    const serverTotals = {
      subtotal: 101,
      compareAtSubtotal: 151,
      saleDiscount: 50,
      couponDiscount: 0,
      total: 101,
      itemCount: 1,
      lineCount: 1,
    };
    (prisma.cart.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(cart);
    buildCartDtoMock.mockReturnValue({ items: [{ id: 'line-1' }], totals: serverTotals });
    findUnique.mockResolvedValue({ code: 'RITM10', percent: 33, active: true, expiresAt: null });

    const result = await validateCoupon('RITM10');

    expect(result).toEqual({
      ok: true,
      code: 'RITM10',
      percent: 33,
      discount: 33,
      totals: { ...serverTotals, couponDiscount: 33, total: 68 },
    });
    expect(buildCartDtoMock).toHaveBeenCalledWith(cart);
    expect(prisma.coupon.update as unknown as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
    expect(prisma.coupon.create as unknown as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it('rejects empty carts before calculating or persisting coupon', async () => {
    (prisma.cart.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cart-1', items: [] });
    findUnique.mockResolvedValue({ code: 'RITM10', percent: 10, active: true, expiresAt: null });

    await expect(validateCoupon('RITM10')).resolves.toEqual({ ok: false, error: 'Корзина пуста' });
    expect(buildCartDtoMock).not.toHaveBeenCalled();
  });
});

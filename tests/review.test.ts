import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    order: { findFirst: vi.fn() },
    review: { findUnique: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { isValidRating, canReview, getReviewEligibility, pruneReviewsAfterCancel } from '@/lib/review';
import { prisma } from '@/lib/prisma-client';

const orderFindFirst = prisma.order.findFirst as unknown as ReturnType<typeof vi.fn>;
const reviewFindUnique = prisma.review.findUnique as unknown as ReturnType<typeof vi.fn>;
const reviewDeleteMany = prisma.review.deleteMany as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('isValidRating', () => {
  it('1..5 целые → true', () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(3)).toBe(true);
  });
  it('вне диапазона / не целое → false', () => {
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(2.5)).toBe(false);
    expect(isValidRating(NaN)).toBe(false);
  });
});

describe('canReview', () => {
  it('есть не-CANCELLED заказ + нет отзыва → true', async () => {
    orderFindFirst.mockResolvedValue({ id: 'o1' });
    reviewFindUnique.mockResolvedValue(null);
    expect(await canReview('u1', 'p1')).toBe(true);
  });
  it('нет заказа → false (и отзыв не проверяется)', async () => {
    orderFindFirst.mockResolvedValue(null);
    expect(await canReview('u1', 'p1')).toBe(false);
    expect(reviewFindUnique).not.toHaveBeenCalled();
  });
  it('есть заказ, но уже оставил отзыв → false', async () => {
    orderFindFirst.mockResolvedValue({ id: 'o1' });
    reviewFindUnique.mockResolvedValue({ id: 'r1' });
    expect(await canReview('u1', 'p1')).toBe(false);
  });
});

describe('getReviewEligibility', () => {
  it('нет заказа → not-purchased (отзыв не проверяется)', async () => {
    orderFindFirst.mockResolvedValue(null);
    expect(await getReviewEligibility('u1', 'p1')).toBe('not-purchased');
    expect(reviewFindUnique).not.toHaveBeenCalled();
  });
  it('есть заказ + нет отзыва → eligible', async () => {
    orderFindFirst.mockResolvedValue({ id: 'o1' });
    reviewFindUnique.mockResolvedValue(null);
    expect(await getReviewEligibility('u1', 'p1')).toBe('eligible');
    // COD qualifies only after delivery; online only after successful payment.
    expect(orderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: 'CANCELLED' },
          items: {
            some: {
              OR: [{ canonicalSku: { productId: 'p1' } }, { productVariant: { colorway: { productId: 'p1' } } }],
            },
          },
          OR: [
            { paymentMethod: 'cod', status: 'DELIVERED' },
            { paymentMethod: 'online', payment: { is: { status: 'succeeded' } } },
          ],
        }),
      }),
    );
  });
  it('есть заказ + уже есть отзыв → already-reviewed', async () => {
    orderFindFirst.mockResolvedValue({ id: 'o1' });
    reviewFindUnique.mockResolvedValue({ id: 'r1' });
    expect(await getReviewEligibility('u1', 'p1')).toBe('already-reviewed');
  });

  it('canonical SKU purchase is qualifying', async () => {
    orderFindFirst.mockResolvedValue({ id: 'canonical-order' });
    reviewFindUnique.mockResolvedValue(null);

    expect(await getReviewEligibility('u1', 'p1')).toBe('eligible');
    expect(orderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          items: {
            some: {
              OR: [{ canonicalSku: { productId: 'p1' } }, { productVariant: { colorway: { productId: 'p1' } } }],
            },
          },
        }),
      }),
    );
  });

  it('legacy ProductVariant purchase remains a read-compatible fallback', async () => {
    orderFindFirst.mockResolvedValue({ id: 'legacy-order' });
    reviewFindUnique.mockResolvedValue(null);

    expect(await getReviewEligibility('u1', 'p1')).toBe('eligible');
    const where = orderFindFirst.mock.calls[0][0].where;
    expect(where.items.some.OR).toEqual([
      { canonicalSku: { productId: 'p1' } },
      { productVariant: { colorway: { productId: 'p1' } } },
    ]);
  });

  it('unrelated product is not represented by the purchase predicate', async () => {
    orderFindFirst.mockImplementation(async ({ where }: { where: { items: { some: { OR: unknown[] } } } }) => {
      return where.items.some.OR.some((entry) => JSON.stringify(entry).includes('p1')) ? { id: 'matching' } : null;
    });

    expect(await getReviewEligibility('u1', 'p2')).toBe('not-purchased');
    expect(reviewFindUnique).not.toHaveBeenCalled();
  });

  it('excludes cancelled orders', async () => {
    orderFindFirst.mockResolvedValue(null);
    expect(await getReviewEligibility('u1', 'p1')).toBe('not-purchased');
    expect(reviewFindUnique).not.toHaveBeenCalled();
    expect(orderFindFirst.mock.calls[0][0].where.status).toEqual({ not: 'CANCELLED' });
  });

  it.each(['PENDING', 'PROCESSING'])('%s COD order cannot qualify before delivery', async () => {
    orderFindFirst.mockResolvedValue(null);
    expect(await getReviewEligibility('u1', 'p1')).toBe('not-purchased');
    expect(reviewFindUnique).not.toHaveBeenCalled();
    expect(orderFindFirst.mock.calls[0][0].where.OR).toEqual([
      { paymentMethod: 'cod', status: 'DELIVERED' },
      { paymentMethod: 'online', payment: { is: { status: 'succeeded' } } },
    ]);
  });

  it('requires succeeded online payment and delivered COD state', async () => {
    orderFindFirst.mockResolvedValue({ id: 'o1' });
    reviewFindUnique.mockResolvedValue(null);
    await getReviewEligibility('u1', 'p1');

    expect(orderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: 'CANCELLED' },
          OR: [
            { paymentMethod: 'cod', status: 'DELIVERED' },
            { paymentMethod: 'online', payment: { is: { status: 'succeeded' } } },
          ],
        }),
      }),
    );
  });

  it.each(['pending', 'failed'])('%s online payment cannot qualify', async (paymentStatus) => {
    orderFindFirst.mockResolvedValue(null);
    expect(await getReviewEligibility('u1', 'p1')).toBe('not-purchased');
    const onlineBranch = orderFindFirst.mock.calls[0][0].where.OR[1];
    expect(onlineBranch).toEqual({ paymentMethod: 'online', payment: { is: { status: 'succeeded' } } });
    expect(JSON.stringify(onlineBranch)).not.toContain(paymentStatus);
  });
});

describe('pruneReviewsAfterCancel', () => {
  it('не осталось квалифицирующего заказа → отзыв удаляется', async () => {
    orderFindFirst.mockResolvedValue(null);
    await pruneReviewsAfterCancel('u1', ['p1']);
    expect(reviewDeleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', productId: 'p1' } });
  });
  it('есть другой квалифицирующий заказ на тот же товар → отзыв сохраняется', async () => {
    orderFindFirst.mockResolvedValue({ id: 'o2' });
    await pruneReviewsAfterCancel('u1', ['p1']);
    expect(reviewDeleteMany).not.toHaveBeenCalled();
  });
  it('несколько товаров → удаляются только осиротевшие', async () => {
    orderFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'o3' });
    await pruneReviewsAfterCancel('u1', ['p1', 'p2']);
    expect(reviewDeleteMany).toHaveBeenCalledTimes(1);
    expect(reviewDeleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', productId: 'p1' } });
  });

  it('prunes only after the last qualifying purchase disappears', async () => {
    orderFindFirst.mockResolvedValueOnce({ id: 'still-delivered-cod' }).mockResolvedValueOnce(null);

    await pruneReviewsAfterCancel('u1', ['p1', 'p2']);

    expect(reviewDeleteMany).toHaveBeenCalledTimes(1);
    expect(reviewDeleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', productId: 'p2' } });
    expect(orderFindFirst.mock.calls[0][0].where.status).toEqual(orderFindFirst.mock.calls[1][0].where.status);
    expect(orderFindFirst.mock.calls[0][0].where.OR).toEqual(orderFindFirst.mock.calls[1][0].where.OR);
  });
});

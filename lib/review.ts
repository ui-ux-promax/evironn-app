import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma-client';

export function isValidRating(r: number): boolean {
  return Number.isInteger(r) && r >= 1 && r <= 5;
}

export type ReviewEligibility = 'eligible' | 'not-purchased' | 'already-reviewed';

// Единственный серверный предикат qualifying purchase для owner/product. Линия заказа
// может быть канонической SKU или legacy ProductVariant; COD считается покупкой только
// после доставки, online — только при успешной оплате, и отменённые заказы исключаются.
export function purchasedOrderWhere(userId: string, productId: string): Prisma.OrderWhereInput {
  return {
    userId,
    status: { not: 'CANCELLED' },
    items: {
      some: {
        OR: [{ canonicalSku: { productId } }, { productVariant: { colorway: { productId } } }],
      },
    },
    OR: [
      { paymentMethod: 'cod', status: 'DELIVERED' },
      { paymentMethod: 'online', payment: { is: { status: 'succeeded' } } },
    ],
  };
}

export async function hasQualifyingPurchase(userId: string, productId: string): Promise<boolean> {
  const order = await prisma.order.findFirst({ where: purchasedOrderWhere(userId, productId), select: { id: true } });
  return Boolean(order);
}

// Состояние права на отзыв: есть ли покупка и не оставлял ли уже отзыв.
// Разводит «не покупал» и «уже оставил» — UI показывает разные сообщения.
export async function getReviewEligibility(userId: string, productId: string): Promise<ReviewEligibility> {
  if (!(await hasQualifyingPurchase(userId, productId))) return 'not-purchased';
  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
    select: { id: true },
  });
  return existing ? 'already-reviewed' : 'eligible';
}

// Серверный гейт submitReview: право оставить отзыв = eligible (есть покупка И ещё не оставлял).
export async function canReview(userId: string, productId: string): Promise<boolean> {
  return (await getReviewEligibility(userId, productId)) === 'eligible';
}

// При отмене заказа: снять отзывы пользователя на товары, по которым не осталось ни одной
// покупки (иначе осиротевший отзыв остаётся виден на PDP). Если есть другой квалифицирующий
// заказ на тот же товар — отзыв сохраняется.
export async function pruneReviewsAfterCancel(userId: string, productIds: string[]): Promise<void> {
  for (const productId of productIds) {
    if (!(await hasQualifyingPurchase(userId, productId))) {
      await prisma.review.deleteMany({ where: { userId, productId } });
    }
  }
}

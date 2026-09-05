import { randomUUID } from 'node:crypto';
import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma-client';
import {
  buildFurnitureProductCardData,
  furnitureProductCardInclude,
  type FurnitureProductCardData,
} from '@/lib/furniture-product-summary';
import { NEW_PRODUCT_WINDOW_DAYS, LOW_STOCK_THRESHOLD } from '@/constants/config';

const WISHLIST_TAKE = 100;

type OwnerWishlist = { id: string; userId: string | null; token: string };

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}

async function recoverUserWishlistAfterTokenConflict(userId: string, token: string): Promise<OwnerWishlist | null> {
  const userWishlist = await prisma.wishlist.findFirst({ where: { userId } });
  if (userWishlist) return userWishlist;

  const guestWishlist = await prisma.wishlist.findFirst({ where: { token } });
  if (!guestWishlist || guestWishlist.userId) return null;

  try {
    return await prisma.wishlist.update({ where: { id: guestWishlist.id }, data: { userId } });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    return prisma.wishlist.findFirst({ where: { userId } });
  }
}

async function createUserWishlistWithFreshToken(userId: string): Promise<OwnerWishlist> {
  return prisma.wishlist.create({ data: { token: randomUUID(), userId } });
}

export async function resolveOwnerWishlist(
  session: Session | null,
  token: string | undefined,
  { create }: { create: boolean },
): Promise<OwnerWishlist | null> {
  const userId = session?.user?.id ?? null;
  if (userId) {
    const existing = await prisma.wishlist.findFirst({ where: { userId } });
    if (existing) return existing;
    if (!create) return null;
    if (!token) return null;
    try {
      return await prisma.wishlist.create({ data: { token, userId } });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      return (await recoverUserWishlistAfterTokenConflict(userId, token)) ?? createUserWishlistWithFreshToken(userId);
    }
  }
  if (!token) return null;
  const existing = await prisma.wishlist.findFirst({ where: { token } });
  if (existing) return existing;
  if (!create) return null;
  try {
    return await prisma.wishlist.upsert({
      where: { token },
      create: { token, userId: undefined },
      update: {},
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    return prisma.wishlist.findFirst({ where: { token } });
  }
}

export async function getWishlistProductIds(session: Session | null, token: string | undefined): Promise<Set<string>> {
  const owner = await resolveOwnerWishlist(session, token, { create: false });
  if (!owner) return new Set();
  const rows = await prisma.wishlistItem.findMany({
    where: { wishlistId: owner.id, product: { active: true } },
    select: { productId: true },
  });
  return new Set(rows.map((r) => r.productId));
}

export async function getWishlistCount(session: Session | null, token: string | undefined): Promise<number> {
  const owner = await resolveOwnerWishlist(session, token, { create: false });
  if (!owner) return 0;
  return prisma.wishlistItem.count({ where: { wishlistId: owner.id, product: { active: true } } });
}

export async function getWishlistItems(
  session: Session | null,
  token: string | undefined,
): Promise<FurnitureProductCardData[]> {
  const owner = await resolveOwnerWishlist(session, token, { create: false });
  if (!owner) return [];
  const rows = await prisma.wishlistItem.findMany({
    where: { wishlistId: owner.id, product: { active: true } },
    orderBy: { createdAt: 'desc' },
    take: WISHLIST_TAKE,
    include: { product: { include: furnitureProductCardInclude } },
  });
  const now = new Date();
  const cfg = { newWindowDays: NEW_PRODUCT_WINDOW_DAYS, lowStock: LOW_STOCK_THRESHOLD };
  return rows.map((r) => buildFurnitureProductCardData(r.product, now, cfg));
}

'use server';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { resolveOwnerWishlist } from '@/lib/wishlist';
import { wishlistCookieName, wishlistCookieOptions } from '@/lib/wishlist-cookie';
import { wishlistToggleSchema, type WishlistMutationResult } from '@/services/dto/wishlist.dto';

export type ToggleResult = WishlistMutationResult;

async function activeProductExists(productId: string): Promise<boolean> {
  return Boolean(await prisma.product.findFirst({ where: { id: productId, active: true }, select: { id: true } }));
}

async function ensureOwner(session: Session | null, store: Awaited<ReturnType<typeof cookies>>) {
  let token = store.get(wishlistCookieName)?.value;
  if (!token) {
    token = randomUUID();
    store.set(wishlistCookieName, token, wishlistCookieOptions);
  }
  return resolveOwnerWishlist(session, token, { create: true });
}

function revalidateWishlistPaths(): void {
  revalidatePath('/catalog');
  revalidatePath('/profile');
}

export async function toggleWishlist(raw: unknown): Promise<ToggleResult> {
  const parsed = wishlistToggleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Некорректный товар' };
  const { productId } = parsed.data;

  const session = await auth();
  const store = await cookies();
  if (!(await activeProductExists(productId))) return { ok: false, error: 'Товар не найден' };
  const owner = await ensureOwner(session, store);
  if (!owner) return { ok: false, error: 'Не удалось открыть избранное' };

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: owner.id, productId } },
    select: { id: true },
  });

  try {
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      revalidateWishlistPaths();
      return { ok: true, active: false };
    }
    await prisma.wishlistItem.create({ data: { wishlistId: owner.id, productId } });
  } catch (e) {
    // P2002: гонка дубля на @@unique → товар уже в избранном.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      revalidateWishlistPaths();
      return { ok: true, active: true };
    }
    // P2003: несуществующий productId (FK) → ошибка клиенту.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
      return { ok: false, error: 'Товар не найден' };
    }
    throw e;
  }

  revalidateWishlistPaths();
  return { ok: true, active: true };
}

export async function addToWishlist(raw: unknown): Promise<WishlistMutationResult> {
  const parsed = wishlistToggleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Некорректный товар' };
  const { productId } = parsed.data;

  const session = await auth();
  const store = await cookies();
  if (!(await activeProductExists(productId))) return { ok: false, error: 'Товар не найден' };
  const owner = await ensureOwner(session, store);
  if (!owner) return { ok: false, error: 'Не удалось открыть избранное' };

  try {
    await prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: owner.id, productId } },
      create: { wishlistId: owner.id, productId },
      update: {},
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2002' || error.code === 'P2003')) {
      if (error.code === 'P2003') return { ok: false, error: 'Товар не найден' };
      revalidateWishlistPaths();
      return { ok: true, active: true };
    }
    throw error;
  }

  revalidateWishlistPaths();
  return { ok: true, active: true };
}

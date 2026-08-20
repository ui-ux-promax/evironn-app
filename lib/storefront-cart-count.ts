import { auth } from '@/auth';
import { cartCookieName } from '@/lib/cart-cookie';
import { resolveOwnerCart } from '@/lib/cart';
import { prisma } from '@/lib/prisma-client';
import { cookies } from 'next/headers';

export async function getInitialCartCount(): Promise<number> {
  const session = await auth();
  const cookieStore = await cookies();
  const token = cookieStore.get(cartCookieName)?.value;
  const owner = await resolveOwnerCart(session?.user?.id ?? null, token, { create: false });

  if (!owner) return 0;
  return prisma.cartItem.count({ where: { cartId: owner.id } });
}

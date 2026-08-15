'use server';

import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { resolveOwnerCart } from '@/lib/cart';
import { cartCookieName } from '@/lib/cart-cookie';
import { buildCartDto, cartPresentationInclude } from '@/lib/cart-presentation';
import { calcCouponDiscount, checkCoupon } from '@/lib/coupon';
import type { CartTotalsDto } from '@/services/dto/commerce-cart.dto';

export type ValidateCouponResult =
  { ok: true; code: string; percent: number; discount: number; totals: CartTotalsDto } | { ok: false; error: string };

// Preview-скидка для текущей корзины. Ничего не сохраняет — источник истины расчёта в placeOrder.
export async function validateCoupon(rawCode: string): Promise<ValidateCouponResult> {
  const check = await checkCoupon(rawCode);
  if (!check.ok) return check;

  const session = await auth();
  const store = await cookies();
  const token = store.get(cartCookieName)?.value;
  // Корзина залогиненного резолвится по userId (не по cookie); гость — по token.
  const owner = await resolveOwnerCart(session?.user?.id ?? null, token, { create: false });
  const cart = owner
    ? await prisma.cart.findFirst({ where: { id: owner.id }, include: cartPresentationInclude })
    : null;
  if (!cart || cart.items.length === 0) return { ok: false, error: 'Корзина пуста' };

  const serverCart = buildCartDto(cart);
  const discount = calcCouponDiscount(serverCart.totals.subtotal, check.percent);
  const totals = {
    ...serverCart.totals,
    couponDiscount: discount,
    total: serverCart.totals.subtotal - discount,
  };
  return {
    ok: true,
    code: check.code,
    percent: check.percent,
    discount,
    totals,
  };
}

'use server';

import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { cartCookieName } from '@/lib/cart-cookie';
import { buildCheckoutQuote } from '@/lib/checkout-page';
import { checkoutQuoteInputSchema } from '@/services/dto/checkout.dto';
import type { CheckoutQuoteResult } from '@/services/dto/checkout-page.dto';

export async function getCheckoutQuote(raw: unknown): Promise<CheckoutQuoteResult> {
  const parsed = checkoutQuoteInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Некорректные данные оформления' };
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, code: 'UNAUTHENTICATED', message: 'Требуется вход' };

  const store = await cookies();
  return buildCheckoutQuote({
    userId,
    cookieToken: store.get(cartCookieName)?.value,
    raw: parsed.data,
    now: new Date(),
  });
}

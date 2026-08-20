import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { cartCookieName } from '@/lib/cart-cookie';
import { getCheckoutPageDto } from '@/lib/checkout-page';
import { CheckoutVariantA } from '@/components/evironn/checkout/checkout-variant-a';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Оформление заказа — Evironn', description: 'Доставка и оплата заказа Evironn' };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=%2Fcheckout');
  const store = await cookies();
  const checkout = await getCheckoutPageDto({
    userId: session.user.id,
    cookieToken: store.get(cartCookieName)?.value,
    now: new Date(),
  });
  if (checkout.status !== 'READY') redirect('/cart');
  return <CheckoutVariantA initialData={checkout} />;
}

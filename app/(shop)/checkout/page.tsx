import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { cartInclude, getCartDetails } from '@/lib/cart-details';
import { resolveOwnerCart } from '@/lib/cart';
import { cartCookieName } from '@/lib/cart-cookie';
import { buildCheckoutDefaults } from '@/lib/checkout-defaults';
import { CheckoutForm } from '@/components/shared/checkout/checkout-form';
import { Breadcrumbs } from '@/components/shared/product/breadcrumbs';
import type { CartDetails } from '@/services/dto/cart.dto';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Оформление заказа — Ritm' };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ buyNow?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { buyNow } = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      phone: true,
      email: true,
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        take: 1,
        select: { city: true, street: true, comment: true },
      },
    },
  });
  if (!user) redirect('/login');

  let details: CartDetails;
  if (buyNow) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: buyNow },
      include: {
        colorway: {
          include: {
            product: { select: { id: true, name: true, slug: true, active: true } },
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
    });
    if (!variant || !variant.active || variant.stock <= 0 || !variant.colorway.product.active) redirect('/catalog');
    details = {
      items: [
        {
          id: `buy-now-${variant.id}`,
          productId: variant.colorway.product.id,
          quantity: 1,
          name: variant.colorway.product.name,
          productSlug: variant.colorway.product.slug,
          colorwayName: variant.colorway.name,
          size: variant.size,
          imageUrl: variant.colorway.images[0]?.url ?? null,
          unitPrice: variant.price,
          lineTotal: variant.price,
          stock: variant.stock,
          available: true,
        },
      ],
      totalAmount: variant.price,
    };
  } else {
    const store = await cookies();
    const token = store.get(cartCookieName)?.value;
    const owner = await resolveOwnerCart(session.user.id, token, { create: false });
    const cart = owner ? await prisma.cart.findFirst({ where: { id: owner.id }, include: cartInclude }) : null;
    if (!cart || cart.items.length === 0) redirect('/cart');
    details = getCartDetails(cart);
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
      <Breadcrumbs
        items={[{ label: 'Главная', href: '/' }, { label: 'Корзина', href: '/cart' }, { label: 'Оформление заказа' }]}
      />

      <div className="flex items-end justify-between gap-4 mt-3 flex-wrap">
        <h1 className="font-display font-bold text-[30px] sm:text-[46px] leading-none tracking-tight">
          Оформление заказа
        </h1>
        <a
          href="/cart"
          className="inline-flex items-center gap-1.5 text-ink-muted text-[13.5px] font-semibold hover:text-ink transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Вернуться в корзину
        </a>
      </div>

      <CheckoutForm
        details={details}
        buyNowVariantId={buyNow}
        defaults={buildCheckoutDefaults({
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.addresses[0] ?? null,
        })}
      />
    </main>
  );
}

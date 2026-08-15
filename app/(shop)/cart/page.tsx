import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { buildFurnitureProductCardData, furnitureProductCardInclude } from '@/lib/furniture-product-summary';
import { NEW_PRODUCT_WINDOW_DAYS, LOW_STOCK_THRESHOLD } from '@/constants/config';
import { buildCatalogBCard, type CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import { getWishlistProductIds } from '@/lib/wishlist';
import { wishlistCookieName } from '@/lib/wishlist-cookie';
import { relatedProductHref } from '@/lib/cart-related-href';
import { SHOWCASE_PRODUCT_SLUG } from '@/lib/showcase-product';
import { CartView } from './cart-view';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const now = new Date();
  const [session, store] = await Promise.all([auth(), cookies()]);
  const [raw, wishlistedIds] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        slug: SHOWCASE_PRODUCT_SLUG,
        skus: { some: { active: true, stock: { gt: 0 } } },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: furnitureProductCardInclude,
    }),
    getWishlistProductIds(session, store.get(wishlistCookieName)?.value),
  ]);
  const related: CatalogBCard[] = raw.flatMap((product) => {
    const card = buildCatalogBCard(
      buildFurnitureProductCardData(product, now, {
        newWindowDays: NEW_PRODUCT_WINDOW_DAYS,
        lowStock: LOW_STOCK_THRESHOLD,
      }),
    );
    const href = relatedProductHref(card);
    return href ? [{ ...card, href }] : [];
  });

  return <CartView related={related} initialWishlistedIds={[...wishlistedIds]} />;
}

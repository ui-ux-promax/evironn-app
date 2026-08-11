import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { productCardInclude, buildProductCardData } from '@/lib/product-summary';
import { getWishlistProductIds } from '@/lib/wishlist';
import { wishlistCookieName } from '@/lib/wishlist-cookie';
import { NEW_PRODUCT_WINDOW_DAYS, LOW_STOCK_THRESHOLD } from '@/constants/config';
import { Hero } from '@/components/shared/home/hero';
import { IntroSection } from '@/components/shared/home/intro-section';
import { EditorialSection } from '@/components/shared/home/editorial-section';
import { BestsellersSection } from '@/components/shared/home/bestsellers-section';
import { SeasonSection } from '@/components/shared/home/season-section';
import { LandingMotion } from '@/components/shared/home/landing-motion';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const now = new Date();
  const cfg = { newWindowDays: NEW_PRODUCT_WINDOW_DAYS, lowStock: LOW_STOCK_THRESHOLD };

  const [bestRaw, session, store] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      take: 6,
      orderBy: [{ isBestseller: 'desc' }, { createdAt: 'desc' }],
      include: productCardInclude,
    }),
    auth(),
    cookies(),
  ]);

  const bestsellers = bestRaw.map((p) => buildProductCardData(p, now, cfg));
  const wishlistedIds = await getWishlistProductIds(session, store.get(wishlistCookieName)?.value);

  return (
    <LandingMotion>
      <Hero />
      <IntroSection />
      <EditorialSection />
      <BestsellersSection products={bestsellers} wishlistedIds={wishlistedIds} />
      <SeasonSection />
    </LandingMotion>
  );
}

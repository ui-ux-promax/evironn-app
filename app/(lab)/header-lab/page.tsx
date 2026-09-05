import type { Metadata } from 'next';

import { HeaderLabSwitcher } from '@/components/evironn/header-lab/header-lab-switcher';
import { HeaderVariantBottomSheet } from '@/components/evironn/header-lab/variant-bottom-sheet';
import { HeaderVariantCapsuleSheet } from '@/components/evironn/header-lab/variant-capsule-sheet';
import { HeaderVariantDarkCurtain } from '@/components/evironn/header-lab/variant-dark-curtain';
import { HeaderVariantEditorial } from '@/components/evironn/header-lab/variant-editorial';
import { HeaderVariantGlassRail } from '@/components/evironn/header-lab/variant-glass-rail';
import { HeaderVariantLiquidPill } from '@/components/evironn/header-lab/variant-liquid-pill';
import { FurnitureCategorySection, InteractiveFurnitureCards } from '@/components/evironn/home';
import { Hero } from '@/components/evironn/home/hero';
import { StorefrontFooter } from '@/components/evironn/storefront-footer';
import { getInitialCartCount } from '@/lib/storefront-cart-count';

export const metadata: Metadata = { title: 'Header lab', robots: { index: false, follow: false } };

const VARIANTS = {
  '1': HeaderVariantLiquidPill,
  '2': HeaderVariantEditorial,
  '3': HeaderVariantBottomSheet,
  '4': HeaderVariantDarkCurtain,
  '5': HeaderVariantGlassRail,
  '6': HeaderVariantCapsuleSheet,
} as const;

type VariantId = keyof typeof VARIANTS;

const isVariantId = (value: string): value is VariantId => value in VARIANTS;

export default async function HeaderLabPage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  const active: VariantId = v && isVariantId(v) ? v : '1';
  const HeaderVariant = VARIANTS[active];
  const cartCount = await getInitialCartCount();

  return (
    <>
      <HeaderVariant cartCount={cartCount} />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <FurnitureCategorySection />
        <InteractiveFurnitureCards />
      </main>
      <StorefrontFooter />
      <HeaderLabSwitcher active={active} />
    </>
  );
}

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MobileNav } from './mobile-nav';
import { CartBadge } from './cart-badge';
import { WishlistBadge } from './wishlist/wishlist-badge';
import { AuthNav } from './auth/auth-nav';
import { CatalogHeaderNav } from './catalog-header-nav';
import { HeaderTopLinks } from './header-top-links';

export function SiteHeader() {
  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto max-w-[1200px] px-3 sm:px-6">
        <div className="grid min-h-[56px] grid-cols-[1fr_auto_1fr] items-center gap-1 min-[421px]:gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Suspense fallback={<div className="h-[34px] w-[34px] md:hidden" aria-hidden />}>
              <MobileNav />
            </Suspense>
            <HeaderTopLinks />
          </div>

          <Link href="/" className="flex items-center justify-self-center" aria-label="Ritm">
            <Image
              src="/ritm-logo.svg"
              alt="Ritm"
              width={98}
              height={28}
              priority
              className="h-auto w-[74px] min-[421px]:w-[84px] sm:w-[98px]"
            />
          </Link>

          <div className="flex min-w-0 items-center justify-self-end gap-0 min-[421px]:gap-1 sm:gap-2 max-[420px]:[&_a]:h-8 max-[420px]:[&_a]:w-8 max-[420px]:[&_button]:h-8 max-[420px]:[&_button]:w-8">
            <WishlistBadge />
            <CartBadge />
            <Suspense fallback={<div className="h-[34px] w-[34px]" aria-hidden />}>
              <AuthNav />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<div className="hidden h-[56px] md:block" aria-hidden />}>
          <div className="hidden grid-cols-[182px_minmax(0,1fr)_auto] items-center gap-3.5 pb-3.5 md:grid">
            <CatalogHeaderNav />
          </div>
        </Suspense>
      </div>
    </header>
  );
}

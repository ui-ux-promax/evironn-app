import { VerificationGateHost } from '@/components/shared/auth/verification-gate-host';
import { StorefrontFooter } from '@/components/evironn/storefront-footer';
import { StorefrontHeader } from '@/components/evironn/storefront-header';
import { buildStorefrontJsonLd } from '@/lib/seo';

// Storefront chrome. Вынесено из root layout, чтобы admin route-group
// (app/(admin)) рендерился БЕЗ шапки/футера/promo. URL не меняются —
// (shop) и (admin) это route-groups (невидимы в пути).
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const storefrontJsonLd = buildStorefrontJsonLd();

  return (
    <>
      <StorefrontHeader cartCount={0} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storefrontJsonLd) }} />
      <div className="shop-content">{children}</div>
      <StorefrontFooter />
      <VerificationGateHost />
    </>
  );
}

import { StorefrontFooter } from '@/components/evironn/storefront-footer';
import { StorefrontHeader } from '@/components/evironn/storefront-header';
import { buildStorefrontJsonLd } from '@/lib/seo';
import { getInitialCartCount } from '@/lib/storefront-cart-count';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cartCount = await getInitialCartCount();
  const storefrontJsonLd = buildStorefrontJsonLd();
  return (
    <>
      <StorefrontHeader cartCount={cartCount} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storefrontJsonLd) }} />
      <div className="shop-content">{children}</div>
      <StorefrontFooter />
    </>
  );
}

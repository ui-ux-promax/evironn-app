import { NotFoundView } from '@/components/evironn/not-found-view';
import { StorefrontFooter } from '@/components/evironn/storefront-footer';
import { StorefrontHeader } from '@/components/evironn/storefront-header';
import { getInitialCartCount } from '@/lib/storefront-cart-count';

export default async function NotFound() {
  const cartCount = await getInitialCartCount();

  return (
    <>
      <StorefrontHeader cartCount={cartCount} />
      <NotFoundView />
      <StorefrontFooter />
    </>
  );
}

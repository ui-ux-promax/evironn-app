import { NotFoundView } from '@/components/evironn/not-found-view';
import { StorefrontFooter } from '@/components/evironn/storefront-footer';
import { StorefrontHeader } from '@/components/evironn/storefront-header';

export default function NotFound() {
  return (
    <>
      <StorefrontHeader cartCount={0} />
      <NotFoundView />
      <StorefrontFooter />
    </>
  );
}

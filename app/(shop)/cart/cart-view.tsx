'use client';
import type { CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import { CartVariantA } from '@/components/evironn/cart/cart-variant-a';

export function CartView({
  related,
  initialWishlistedIds,
}: {
  related: CatalogBCard[];
  initialWishlistedIds: string[];
}) {
  return <CartVariantA related={related} initialWishlistedIds={initialWishlistedIds} />;
}

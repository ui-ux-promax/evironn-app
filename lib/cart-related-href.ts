import { SHOWCASE_PRODUCT_SLUG } from '@/lib/showcase-product';

export function relatedProductHref(product: { slug: string; primaryOption?: string | null }): string | null {
  if (product.slug !== SHOWCASE_PRODUCT_SLUG) return null;

  const path = `/product/${encodeURIComponent(product.slug)}`;
  return product.primaryOption ? `${path}?option=${encodeURIComponent(product.primaryOption)}` : path;
}

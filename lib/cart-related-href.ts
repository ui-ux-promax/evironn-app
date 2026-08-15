export function relatedProductHref(product: { slug: string; primaryOption?: string | null }): string {
  const path = `/product/${encodeURIComponent(product.slug)}`;
  return product.primaryOption ? `${path}?option=${encodeURIComponent(product.primaryOption)}` : path;
}

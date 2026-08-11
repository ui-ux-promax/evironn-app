import { slugify } from './slugify';

export interface SuggestSkuInput {
  brand: string;
  productName: string;
  colorwaySlug: string;
  size: string;
}

export function suggestSku({ brand, productName, colorwaySlug, size }: SuggestSkuInput): string {
  const base = [slugify(brand), slugify(productName), slugify(colorwaySlug), size]
    .filter(Boolean)
    .join('-')
    .toUpperCase();
  return base.replace(/-+/g, '-').slice(0, 64);
}

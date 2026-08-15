import type { ProductCardData } from '@/lib/product-summary';
import type { FurnitureProductCardData } from '@/lib/furniture-product-summary';

export function toProfileProductCardData(product: FurnitureProductCardData): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categoryName: product.categoryName,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    minPrice: product.minPrice,
    minCompareAtPrice: product.minOldPrice,
    badges: product.badges,
    soldOut: product.soldOut,
    colorways: [],
    sizes: [],
    canonicalSkuId: product.primarySkuId,
  };
}

import type { Prisma } from '@prisma/client';
import { computeBadges, stockSummary, type ProductBadge } from '@/lib/product-badges';

export const productCardInclude = {
  category: { select: { name: true, slug: true } },
  colorways: {
    orderBy: [{ isDefault: 'desc' as const }, { sortOrder: 'asc' as const }],
    include: {
      images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
      variants: {
        select: { id: true, size: true, sizeOrder: true, price: true, compareAtPrice: true, stock: true, active: true },
      },
    },
  },
  skus: { where: { active: true }, orderBy: { price: 'asc' as const }, select: { id: true, stock: true }, take: 1 },
} satisfies Prisma.ProductInclude;

export type ProductForCard = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export interface CardColorway {
  id: string;
  name: string;
  swatchHex: string | null;
  imageUrl: string | null;
  variants: CardSize[];
}

export interface CardSize {
  size: string;
  sizeOrder: number;
  inStock: boolean;
  variantId: string;
}

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryName: string;
  imageUrl: string | null;
  imageAlt: string;
  minPrice: number;
  minCompareAtPrice: number | null;
  badges: ProductBadge[];
  soldOut: boolean;
  colorways: CardColorway[];
  sizes: CardSize[];
  canonicalSkuId?: string | null;
}

export function buildProductCardData(
  product: ProductForCard,
  now: Date,
  cfg: { newWindowDays: number; lowStock: number },
): ProductCardData {
  const cw = product.colorways[0]; // отсортировано: isDefault desc, sortOrder asc
  const activeVariants = (cw?.variants ?? []).filter((v) => v.active);
  const cheapest = activeVariants.reduce<(typeof activeVariants)[number] | null>(
    (min, v) => (min === null || v.price < min.price ? v : min),
    null,
  );
  const minPrice = cheapest?.price ?? 0;
  const minCompareAtPrice = cheapest?.compareAtPrice ?? null;
  const stock = stockSummary(cw?.variants ?? [], cfg.lowStock);

  const badges = computeBadges(
    {
      createdAt: product.createdAt,
      isBestseller: product.isBestseller,
      minPrice,
      minCompareAtPrice,
      stockTotal: stock.total,
    },
    now,
    cfg,
  );

  const colorways: CardColorway[] = product.colorways.map((cw) => ({
    id: cw.id,
    name: cw.name,
    swatchHex: cw.swatchHex,
    imageUrl: cw.images[0]?.url ?? null,
    variants: cw.variants
      .filter((v) => v.active)
      .map((v) => ({ size: v.size, sizeOrder: v.sizeOrder, inStock: v.stock > 0, variantId: v.id }))
      .sort((a, b) => a.sizeOrder - b.sizeOrder),
  }));

  // Collect unique sizes from all colorways, sorted by sizeOrder
  const sizeMap = new Map<string, CardSize>();
  for (const cw of product.colorways) {
    for (const v of cw.variants) {
      if (!v.active) continue;
      if (!sizeMap.has(v.size)) {
        sizeMap.set(v.size, { size: v.size, sizeOrder: v.sizeOrder, inStock: v.stock > 0, variantId: v.id });
      } else if (v.stock > 0) {
        sizeMap.get(v.size)!.inStock = true;
      }
    }
  }
  const sizes = Array.from(sizeMap.values()).sort((a, b) => a.sizeOrder - b.sizeOrder);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categoryName: product.category.name,
    imageUrl: cw?.images[0]?.url ?? null,
    imageAlt: cw?.images[0]?.alt ?? product.name,
    minPrice,
    minCompareAtPrice,
    badges,
    soldOut: stock.soldOut,
    colorways,
    sizes,
    canonicalSkuId: product.skus?.[0]?.id ?? null,
  };
}

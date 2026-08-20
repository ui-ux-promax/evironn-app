import type { Prisma } from '@prisma/client';
import { computeBadges, stockSummary, type ProductBadge } from '@/lib/product-badges';

export const furnitureProductCardInclude = {
  category: { select: { name: true, slug: true } },
  media: { where: { kind: 'IMAGE' }, orderBy: { sortOrder: 'asc' as const } },
  skus: {
    where: { active: true },
    orderBy: [{ price: 'asc' as const }, { id: 'asc' as const }],
    include: {
      media: { where: { kind: 'IMAGE' }, orderBy: { sortOrder: 'asc' as const } },
      selections: {
        include: { optionGroup: true, optionValue: true },
        orderBy: { optionGroup: { sortOrder: 'asc' as const } },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type FurnitureProductForCard = Prisma.ProductGetPayload<{ include: typeof furnitureProductCardInclude }>;

export interface FurnitureOptionSwatch {
  groupSlug: string;
  valueSlug: string;
  label: string;
  swatchHex: string | null;
}

export interface FurnitureProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryName: string;
  imageUrl: string | null;
  imageAlt: string;
  primarySkuId: string | null;
  primaryOption?: string | null;
  minPrice: number;
  minOldPrice: number | null;
  badges: ProductBadge[];
  soldOut: boolean;
  optionSwatches: FurnitureOptionSwatch[];
}

function compareSkuPrice(left: { price: number; id: string }, right: { price: number; id: string }): number {
  return left.price - right.price || left.id.localeCompare(right.id);
}

export function buildFurnitureProductCardData(
  product: FurnitureProductForCard,
  now: Date,
  cfg: { newWindowDays: number; lowStock: number },
): FurnitureProductCardData {
  const activeSkus = product.skus.filter((sku) => sku.active);
  const stock = stockSummary(activeSkus, cfg.lowStock);
  const candidates = activeSkus.filter((sku) => sku.stock > 0);
  const primarySku = [...(candidates.length > 0 ? candidates : activeSkus)].sort(compareSkuPrice)[0] ?? null;
  const minPrice = primarySku?.price ?? 0;
  const minOldPrice = primarySku?.oldPrice ?? null;
  const primaryMedia = primarySku?.media[0] ?? product.media[0];

  const swatches: FurnitureOptionSwatch[] = [];
  const seen = new Set<string>();
  for (const sku of activeSkus) {
    for (const selection of sku.selections) {
      const key = `${selection.optionGroup.slug}:${selection.optionValue.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      swatches.push({
        groupSlug: selection.optionGroup.slug,
        valueSlug: selection.optionValue.slug,
        label: selection.optionValue.name,
        swatchHex: selection.optionValue.swatchHex,
      });
    }
  }

  const badges = computeBadges(
    {
      createdAt: product.createdAt,
      isBestseller: product.isBestseller,
      minPrice,
      minCompareAtPrice: minOldPrice,
      stockTotal: stock.total,
    },
    now,
    cfg,
  );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categoryName: product.category.name,
    imageUrl: primaryMedia?.url ?? null,
    imageAlt: primaryMedia?.alt ?? product.name,
    primarySkuId: primarySku?.id ?? null,
    primaryOption:
      primarySku?.selections
        .map(({ optionGroup, optionValue }) => `${optionGroup.slug}:${optionValue.slug}`)
        .join(',') ?? null,
    minPrice,
    minOldPrice,
    badges,
    soldOut: stock.soldOut,
    optionSwatches: swatches,
  };
}

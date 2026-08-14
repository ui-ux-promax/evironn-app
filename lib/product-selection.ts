import type { Prisma } from '@prisma/client';
import { buildCombinationKey, type SkuOptionSelection } from '@/lib/furniture-sku';

export const productDetailInclude = {
  category: { select: { name: true, slug: true } },
  rooms: {
    orderBy: { room: { sortOrder: 'asc' as const } },
    include: { room: { select: { name: true, slug: true, sortOrder: true } } },
  },
  optionGroups: {
    orderBy: { optionGroup: { sortOrder: 'asc' as const } },
    include: {
      optionGroup: true,
      values: {
        orderBy: { optionValue: { sortOrder: 'asc' as const } },
        include: { optionValue: true },
      },
    },
  },
  skus: {
    where: { active: true },
    orderBy: [{ price: 'asc' as const }, { id: 'asc' as const }],
    include: {
      media: { orderBy: { sortOrder: 'asc' as const } },
      selections: {
        include: { optionGroup: true, optionValue: true },
        orderBy: { optionGroup: { sortOrder: 'asc' as const } },
      },
    },
  },
  media: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ProductInclude;

export type FurnitureProductDetail = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

type FurnitureMediaKind = 'IMAGE' | 'TURN_TABLE_VIDEO' | 'TURN_TABLE_POSTER' | 'TURN_TABLE_FALLBACK';

interface FurnitureSelectionGroup {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

interface FurnitureSelectionValue {
  id: string;
  optionGroupId: string;
  name: string;
  slug: string;
  swatchHex: string | null;
  sortOrder: number;
}

interface FurnitureProductOptionGroup {
  optionGroup: FurnitureSelectionGroup;
  values: Array<{ optionValue: FurnitureSelectionValue }>;
}

interface FurnitureSelectionMedia {
  id: string;
  kind: FurnitureMediaKind;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface FurnitureSelectionSku {
  id: string;
  productId: string;
  articleNumber: string;
  combinationKey: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  active: boolean;
  selections: Array<{ optionGroup: FurnitureSelectionGroup; optionValue: FurnitureSelectionValue }>;
  media: FurnitureSelectionMedia[];
}

export interface FurnitureProductForSelection {
  id: string;
  name: string;
  optionGroups: FurnitureProductOptionGroup[];
  skus: FurnitureSelectionSku[];
  media: FurnitureSelectionMedia[];
}

export interface ResolvedProductSelection {
  sku: {
    id: string;
    articleNumber: string;
    combinationKey: string;
    price: number;
    oldPrice: number | null;
    stock: number;
  };
  canonicalSelection: Record<string, string>;
  optionGroups: Array<{
    slug: string;
    name: string;
    values: Array<{ slug: string; name: string; swatchHex: string | null; available: boolean }>;
  }>;
  images: Array<{ url: string; alt: string }>;
  turntable: {
    videoUrl: string;
    posterUrl: string;
    fallbackUrl: string;
    alt: string;
  } | null;
}

const PROTECTED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export function parseOptionParam(raw: string | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw) return result;

  for (const token of raw.split(',')) {
    const parts = token.split(':');
    if (parts.length !== 2) continue;
    const group = parts[0].trim().toLowerCase();
    const value = parts[1].trim().toLowerCase();
    if (!group || !value || PROTECTED_KEYS.has(group) || PROTECTED_KEYS.has(value) || result[group]) continue;
    result[group] = value;
  }

  return result;
}

export function serializeOptionParam(selection: Record<string, string>): string {
  return Object.entries(selection)
    .filter(
      ([group, value]) =>
        Boolean(group.trim()) && Boolean(value.trim()) && !PROTECTED_KEYS.has(group) && !PROTECTED_KEYS.has(value),
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([group, value]) => `${group.trim().toLowerCase()}:${value.trim().toLowerCase()}`)
    .join(',');
}

interface CompleteSku {
  sku: FurnitureSelectionSku;
  selection: Record<string, string>;
  combinationKey: string;
}

function sortedOptionGroups(product: FurnitureProductForSelection): FurnitureProductOptionGroup[] {
  return [...product.optionGroups].sort((left, right) => left.optionGroup.sortOrder - right.optionGroup.sortOrder);
}

function toCompleteSku(
  product: FurnitureProductForSelection,
  optionGroups: FurnitureProductOptionGroup[],
  sku: FurnitureSelectionSku,
): CompleteSku | null {
  if (!sku.active || sku.productId !== product.id) return null;

  const groupBySlug = new Map(optionGroups.map((group) => [group.optionGroup.slug, group]));
  const selection: Record<string, string> = {};
  const pairs: SkuOptionSelection[] = [];

  for (const item of sku.selections) {
    const group = groupBySlug.get(item.optionGroup.slug);
    const value = group?.values.find((candidate) => candidate.optionValue.slug === item.optionValue.slug)?.optionValue;
    if (!group || !value || selection[group.optionGroup.slug]) return null;
    selection[group.optionGroup.slug] = value.slug;
    pairs.push({ groupSlug: group.optionGroup.slug, valueSlug: value.slug });
  }

  if (Object.keys(selection).length !== optionGroups.length) return null;

  let combinationKey: string;
  try {
    combinationKey = buildCombinationKey(pairs);
  } catch {
    return null;
  }
  if (combinationKey !== sku.combinationKey) return null;

  return { sku, selection, combinationKey };
}

function compareCompleteSku(left: CompleteSku, right: CompleteSku): number {
  return left.sku.price - right.sku.price || left.sku.id.localeCompare(right.sku.id);
}

function firstByStock(completeSkus: CompleteSku[]): CompleteSku {
  return [...completeSkus].sort((left, right) => {
    const leftOutOfStock = left.sku.stock > 0 ? 0 : 1;
    const rightOutOfStock = right.sku.stock > 0 ? 0 : 1;
    return leftOutOfStock - rightOutOfStock || compareCompleteSku(left, right);
  })[0];
}

function imageData(media: FurnitureSelectionMedia[], fallbackName: string): Array<{ url: string; alt: string }> {
  return media
    .filter((item) => item.kind === 'IMAGE')
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({ url: item.url, alt: item.alt ?? fallbackName }));
}

function turntableData(product: FurnitureProductForSelection): ResolvedProductSelection['turntable'] {
  const firstMedia = (kind: FurnitureMediaKind) =>
    product.media.filter((item) => item.kind === kind).sort((left, right) => left.sortOrder - right.sortOrder)[0];
  const video = firstMedia('TURN_TABLE_VIDEO');
  const poster = firstMedia('TURN_TABLE_POSTER');
  const fallback = firstMedia('TURN_TABLE_FALLBACK');
  if (!video || !poster || !fallback) return null;

  return {
    videoUrl: video.url,
    posterUrl: poster.url,
    fallbackUrl: fallback.url,
    alt: video.alt ?? poster.alt ?? fallback.alt ?? product.name,
  };
}

export function resolveSelectedSku(
  product: FurnitureProductForSelection,
  requested: Record<string, string>,
): ResolvedProductSelection {
  const optionGroups = sortedOptionGroups(product);
  const completeSkus = product.skus
    .map((sku) => toCompleteSku(product, optionGroups, sku))
    .filter((sku): sku is CompleteSku => sku !== null)
    .sort(compareCompleteSku);
  if (completeSkus.length === 0) throw new Error(`Product ${product.id} has no active complete SKU`);

  const normalizedRequested = parseOptionParam(serializeOptionParam(requested));
  const matchingSkus = completeSkus.filter((candidate) =>
    Object.entries(normalizedRequested).every(([group, value]) => candidate.selection[group] === value),
  );
  const selected = (matchingSkus.length > 0 ? firstByStock(matchingSkus) : firstByStock(completeSkus)) as CompleteSku;

  const resolvedOptionGroups = optionGroups.map((group) => ({
    slug: group.optionGroup.slug,
    name: group.optionGroup.name,
    values: group.values
      .slice()
      .sort((left, right) => left.optionValue.sortOrder - right.optionValue.sortOrder)
      .map(({ optionValue }) => ({
        slug: optionValue.slug,
        name: optionValue.name,
        swatchHex: optionValue.swatchHex,
        available: completeSkus.some(
          (candidate) =>
            candidate.selection[group.optionGroup.slug] === optionValue.slug &&
            optionGroups.every(
              (otherGroup) =>
                otherGroup.optionGroup.slug === group.optionGroup.slug ||
                candidate.selection[otherGroup.optionGroup.slug] === selected.selection[otherGroup.optionGroup.slug],
            ),
        ),
      })),
  }));

  const skuImages = imageData(selected.sku.media, product.name);
  const images = skuImages.length > 0 ? skuImages : imageData(product.media, product.name);

  return {
    sku: {
      id: selected.sku.id,
      articleNumber: selected.sku.articleNumber,
      combinationKey: selected.combinationKey,
      price: selected.sku.price,
      oldPrice: selected.sku.oldPrice,
      stock: selected.sku.stock,
    },
    canonicalSelection: Object.fromEntries(
      optionGroups.map((group) => [group.optionGroup.slug, selected.selection[group.optionGroup.slug]]),
    ),
    optionGroups: resolvedOptionGroups,
    images,
    turntable: turntableData(product),
  };
}

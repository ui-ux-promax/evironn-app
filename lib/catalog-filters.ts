import type { Prisma } from '@prisma/client';
import { CATALOG_PAGE_SIZE, DEFAULT_SORT, SORT_OPTIONS, type SortValue } from '@/constants/config';

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface CatalogParams {
  categories: string[];
  rooms: string[];
  options: Record<string, string[]>;
  priceFrom?: number;
  priceTo?: number;
  inStock: boolean;
  sort: SortValue;
  page: number;
  query?: string;
}

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

const normalizeSlug = (value: string): string => value.trim().toLowerCase();

const csv = (value: string | string[] | undefined): string[] => {
  const seen = new Set<string>();
  for (const item of (first(value) ?? '').split(',')) {
    const normalized = normalizeSlug(item);
    if (normalized && !seen.has(normalized)) seen.add(normalized);
  }
  return [...seen];
};

const SORT_VALUES = SORT_OPTIONS.map((option) => option.value) as readonly string[];
const INVALID_OPTION_GROUPS = new Set(['__proto__', 'constructor', 'prototype']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isInStockParam(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function parseOptions(value: string | string[] | undefined): Record<string, string[]> {
  const options: Record<string, string[]> = {};
  const seenByGroup = new Map<string, Set<string>>();

  for (const token of (first(value) ?? '').split(',')) {
    const separator = token.indexOf(':');
    if (separator <= 0 || separator !== token.lastIndexOf(':')) continue;

    const group = normalizeSlug(token.slice(0, separator));
    const option = normalizeSlug(token.slice(separator + 1));
    if (!SLUG_PATTERN.test(group) || !SLUG_PATTERN.test(option) || INVALID_OPTION_GROUPS.has(group)) continue;

    const seen = seenByGroup.get(group) ?? new Set<string>();
    if (seen.has(option)) continue;
    seen.add(option);
    seenByGroup.set(group, seen);
    (options[group] ??= []).push(option);
  }

  return options;
}

export function parseCatalogParams(sp: RawSearchParams): CatalogParams {
  const sortRaw = first(sp.sort);
  const sort: SortValue = (SORT_VALUES.includes(sortRaw ?? '') ? sortRaw : DEFAULT_SORT) as SortValue;
  const pageNumber = Number(first(sp.page));
  const priceFromNumber = Number(first(sp.priceFrom));
  const priceToNumber = Number(first(sp.priceTo));

  return {
    categories: csv(sp.category),
    rooms: csv(sp.room),
    options: parseOptions(sp.option),
    priceFrom: Number.isFinite(priceFromNumber) && priceFromNumber > 0 ? priceFromNumber : undefined,
    priceTo: Number.isFinite(priceToNumber) && priceToNumber > 0 ? priceToNumber : undefined,
    inStock: isInStockParam(first(sp.inStock)),
    sort,
    page: Number.isInteger(pageNumber) && pageNumber > 1 ? pageNumber : 1,
    query: first(sp.q)?.trim() || undefined,
  };
}

function buildSkuWhere(params: CatalogParams): Prisma.SkuWhereInput {
  const price: Prisma.IntFilter = {};
  if (params.priceFrom !== undefined) price.gte = params.priceFrom;
  if (params.priceTo !== undefined) price.lte = params.priceTo;

  const skuWhere: Prisma.SkuWhereInput = { active: true };
  if (Object.keys(price).length) skuWhere.price = price;
  if (params.inStock) skuWhere.stock = { gt: 0 };

  const optionPredicates = Object.keys(params.options)
    .sort((left, right) => left.localeCompare(right))
    .map((groupSlug) => ({
      selections: {
        some: {
          optionGroup: { slug: groupSlug },
          optionValue: { slug: { in: params.options[groupSlug] } },
        },
      },
    }));
  if (optionPredicates.length) skuWhere.AND = optionPredicates;

  return skuWhere;
}

export function buildProductWhere(params: CatalogParams): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { active: true };

  if (params.categories.length) where.category = { slug: { in: params.categories } };
  if (params.rooms.length) where.rooms = { some: { room: { slug: { in: params.rooms } } } };
  if (params.query) where.name = { contains: params.query, mode: 'insensitive' };

  const hasSkuFilter =
    Object.keys(params.options).length > 0 ||
    params.priceFrom !== undefined ||
    params.priceTo !== undefined ||
    params.inStock;
  if (hasSkuFilter) where.skus = { some: buildSkuWhere(params) };

  return where;
}

export function buildOrderBy(sort: SortValue): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'popular':
      return [{ salesCount: 'desc' }, { isBestseller: 'desc' }, { id: 'asc' }];
    case 'price-asc':
      return [{ minPrice: 'asc' }, { id: 'asc' }];
    case 'price-desc':
      return [{ minPrice: 'desc' }, { id: 'asc' }];
    case 'discount':
      return [{ discountPct: 'desc' }, { id: 'asc' }];
    case 'new':
    default:
      return [{ createdAt: 'desc' }, { id: 'asc' }];
  }
}

export const PAGE_SIZE = CATALOG_PAGE_SIZE;

export function buildPagination(page: number): { skip: number; take: number } {
  return { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

import { NEW_PRODUCT_WINDOW_DAYS, LOW_STOCK_THRESHOLD } from '@/constants/config';
import {
  buildOrderBy,
  buildPagination,
  buildProductWhere,
  PAGE_SIZE,
  parseCatalogParams,
  type CatalogParams,
  type RawSearchParams,
} from '@/lib/catalog-filters';
import {
  buildFurnitureProductCardData,
  furnitureProductCardInclude,
  type FurnitureProductCardData,
} from '@/lib/furniture-product-summary';
import { prisma } from '@/lib/prisma-client';

export interface Facet {
  value: string;
  label: string;
  count: number;
}

export interface OptionFacet {
  slug: string;
  name: string;
  values: Array<{ value: string; label: string; swatchHex: string | null; count: number }>;
}

export interface CatalogResult {
  products: FurnitureProductCardData[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    categories: Facet[];
    rooms: Facet[];
    options: OptionFacet[];
    price: { min: number; max: number };
  };
}

const withoutCategories = (params: CatalogParams, category: string): CatalogParams => ({
  ...params,
  categories: [category],
});

const withoutRooms = (params: CatalogParams, room: string): CatalogParams => ({
  ...params,
  rooms: [room],
});

const withOptionValue = (params: CatalogParams, group: string, value: string): CatalogParams => ({
  ...params,
  options: { ...params.options, [group]: [value] },
});

export async function findProducts(sp: RawSearchParams): Promise<CatalogResult> {
  const params = parseCatalogParams(sp);
  const where = buildProductWhere(params);
  const now = new Date();
  const cfg = { newWindowDays: NEW_PRODUCT_WINDOW_DAYS, lowStock: LOW_STOCK_THRESHOLD };

  const totalPromise = prisma.product.count({ where });
  const categoriesPromise = prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  const roomsPromise = prisma.room.findMany({ orderBy: { sortOrder: 'asc' } });
  const optionGroupsPromise = prisma.optionGroup.findMany({
    include: { values: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });
  const pricePromise = prisma.sku.aggregate({
    where: { active: true, product: { active: true } },
    _min: { price: true },
    _max: { price: true },
  });

  const [total, categories, rooms, optionGroups, priceBounds] = await Promise.all([
    totalPromise,
    categoriesPromise,
    roomsPromise,
    optionGroupsPromise,
    pricePromise,
  ]);

  const [categoryCounts, roomCounts, optionCounts] = await Promise.all([
    Promise.all(
      categories.map((category) =>
        prisma.product.count({ where: buildProductWhere(withoutCategories(params, category.slug)) }),
      ),
    ),
    Promise.all(
      rooms.map((room) => prisma.product.count({ where: buildProductWhere(withoutRooms(params, room.slug)) })),
    ),
    Promise.all(
      optionGroups.map((group) =>
        Promise.all(
          group.values.map((value) =>
            prisma.product.count({ where: buildProductWhere(withOptionValue(params, group.slug, value.slug)) }),
          ),
        ),
      ),
    ),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const raw = await prisma.product.findMany({
    where,
    include: furnitureProductCardInclude,
    orderBy: buildOrderBy(params.sort),
    ...buildPagination(page),
  });
  const products = raw.map((product) => buildFurnitureProductCardData(product, now, cfg));

  return {
    products,
    total,
    page,
    totalPages,
    facets: {
      categories: categories.map((category, index) => ({
        value: category.slug,
        label: category.name,
        count: categoryCounts[index] ?? 0,
      })),
      rooms: rooms.map((room, index) => ({
        value: room.slug,
        label: room.name,
        count: roomCounts[index] ?? 0,
      })),
      options: optionGroups.map((group, groupIndex) => ({
        slug: group.slug,
        name: group.name,
        values: group.values.map((value, valueIndex) => ({
          value: value.slug,
          label: value.name,
          swatchHex: value.swatchHex,
          count: optionCounts[groupIndex]?.[valueIndex] ?? 0,
        })),
      })),
      price: {
        min: priceBounds._min.price ?? 0,
        max: priceBounds._max.price ?? 0,
      },
    },
  };
}

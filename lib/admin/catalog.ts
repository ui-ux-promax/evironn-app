import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma-client';
import { buildPaginationMeta, parsePaginationParams } from '@/lib/admin/pagination';
import { furnitureProductSchema, type FurnitureProductValues } from '@/services/dto/product.dto';

export type AdminPagedResult<T> = { rows: T[]; total: number; page: number; limit: number; pageCount: number };

export type AdminCatalogProductFlag = 'incomplete-zero-sku' | 'no-media' | 'inactive' | 'turntable-bound';

export type AdminCatalogProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  roomNames: string[];
  active: boolean;
  isBestseller: boolean;
  sortOrder: number;
  skuCount: number;
  activeSkuCount: number;
  totalStock: number;
  minPrice: number | null;
  maxPrice: number | null;
  mediaCount: number;
  turntableReady: boolean;
  flags: AdminCatalogProductFlag[];
};

export type AdminCatalogProductListParams = {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  roomId?: string;
  status?: 'all' | 'active' | 'inactive' | 'incomplete';
  sort?: 'sortOrder' | 'name' | 'minPrice' | 'stock';
};

export type AdminOptionGroupRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
  values: { id: string; name: string; slug: string; swatchHex: string | null; sortOrder: number }[];
};

export type AdminRoomRow = { id: string; name: string; slug: string; sortOrder: number; productCount: number };

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
  turntableProductId: string | null;
  turntableProductName: string | null;
};

export type AdminSkuStockListParams = {
  page?: number;
  limit?: number;
  q?: string;
  productId?: string;
  status?: 'all' | 'active' | 'inactive';
  sort?: 'stock' | 'articleNumber' | 'productName';
};

export type AdminSkuStockRow = {
  skuId: string;
  productId: string;
  productName: string;
  articleNumber: string;
  combinationKey: string;
  optionLabels: string[];
  price: number;
  stock: number;
  active: boolean;
};

export type AdminProductDraft = {
  identity: { productId: string; slug: string; hasLegacyTree: boolean; canonicalSkuCount: number };
  values: FurnitureProductValues;
};

const productSelect = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  categoryId: true,
  category: { select: { name: true } },
  rooms: {
    orderBy: { room: { sortOrder: 'asc' } },
    select: { room: { select: { name: true } } },
  },
  active: true,
  isBestseller: true,
  sortOrder: true,
  skus: { select: { price: true, stock: true, active: true } },
  media: { select: { kind: true } },
  turntableForCategories: { select: { id: true } },
} satisfies Prisma.ProductSelect;

function contains(value: string) {
  return { contains: value, mode: 'insensitive' as const };
}

function getProductOrder(sort: AdminCatalogProductListParams['sort']): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'name':
      return [{ name: 'asc' }, { id: 'asc' }];
    case 'minPrice':
      return [{ minPrice: 'asc' }, { name: 'asc' }, { id: 'asc' }];
    case 'stock':
      return [{ skus: { _count: 'desc' } }, { name: 'asc' }, { id: 'asc' }];
    default:
      return [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }];
  }
}

export async function listAdminCatalogProducts(
  params: AdminCatalogProductListParams,
): Promise<AdminPagedResult<AdminCatalogProductRow>> {
  const { page, limit, skip } = parsePaginationParams(
    { page: params.page?.toString(), limit: params.limit?.toString() },
    { limit: 20 },
  );
  const q = params.q?.trim();
  const where: Prisma.ProductWhereInput = {
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.roomId ? { rooms: { some: { roomId: params.roomId } } } : {}),
    ...(params.status === 'active' ? { active: true } : {}),
    ...(params.status === 'inactive' ? { active: false } : {}),
    ...(params.status === 'incomplete' ? { skus: { none: {} } } : {}),
    ...(q
      ? {
          OR: [{ name: contains(q) }, { slug: contains(q) }, { skus: { some: { articleNumber: contains(q) } } }],
        }
      : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: getProductOrder(params.sort),
      skip,
      take: limit,
      select: productSelect,
    }),
  ]);

  const rows = products.map((product) => {
    const prices = product.skus.map((sku) => sku.price);
    const turntableKinds = ['TURN_TABLE_VIDEO', 'TURN_TABLE_POSTER', 'TURN_TABLE_FALLBACK'] as const;
    const turntableReady = turntableKinds.every(
      (kind) => product.media.filter((media) => media.kind === kind).length === 1,
    );
    const flags: AdminCatalogProductFlag[] = [];
    if (product.skus.length === 0) flags.push('incomplete-zero-sku');
    if (product.media.length === 0) flags.push('no-media');
    if (!product.active) flags.push('inactive');
    if (product.turntableForCategories.length > 0) flags.push('turntable-bound');

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      roomNames: product.rooms.map(({ room }) => room.name),
      active: product.active,
      isBestseller: product.isBestseller,
      sortOrder: product.sortOrder,
      skuCount: product.skus.length,
      activeSkuCount: product.skus.filter((sku) => sku.active).length,
      totalStock: product.skus.reduce((totalStock, sku) => totalStock + sku.stock, 0),
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      mediaCount: product.media.length,
      turntableReady,
      flags,
    } satisfies AdminCatalogProductRow;
  });

  const meta = buildPaginationMeta({ page, limit }, total);
  return { rows, total, page: meta.page, limit: meta.limit, pageCount: meta.totalPages };
}

const draftSelect = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  categoryId: true,
  description: true,
  specs: true,
  isBestseller: true,
  active: true,
  sortOrder: true,
  rooms: { select: { room: { select: { slug: true } } } },
  optionGroups: {
    orderBy: { optionGroup: { sortOrder: 'asc' } },
    select: {
      optionGroup: { select: { id: true, name: true, slug: true, sortOrder: true } },
      values: {
        orderBy: { optionValue: { sortOrder: 'asc' } },
        select: {
          optionValue: { select: { id: true, name: true, slug: true, swatchHex: true, sortOrder: true } },
        },
      },
    },
  },
  optionValues: { select: { optionValue: { select: { id: true } } } },
  skus: {
    orderBy: { articleNumber: 'asc' },
    select: {
      id: true,
      articleNumber: true,
      combinationKey: true,
      price: true,
      oldPrice: true,
      stock: true,
      active: true,
      selections: {
        orderBy: { optionGroup: { sortOrder: 'asc' } },
        select: {
          optionGroup: { select: { name: true, slug: true, sortOrder: true } },
          optionValue: { select: { name: true, slug: true } },
        },
      },
      media: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, kind: true, url: true, publicId: true, alt: true, sortOrder: true },
      },
    },
  },
  media: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, kind: true, url: true, publicId: true, alt: true, sortOrder: true },
  },
  turntableForCategories: { select: { id: true } },
  colorways: { select: { id: true } },
} satisfies Prisma.ProductSelect;

function optionalString(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

function readSpecs(value: Prisma.JsonValue | null): { key: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is { key: string; value: string } =>
      typeof entry === 'object' &&
      entry !== null &&
      'key' in entry &&
      'value' in entry &&
      typeof entry.key === 'string' &&
      typeof entry.value === 'string',
  );
}

export async function getAdminProductDraft(productId: string): Promise<AdminProductDraft | null> {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: draftSelect });
  if (!product) return null;

  const values = {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    categoryId: product.categoryId,
    roomIds: product.rooms.map(({ room }) => room.slug),
    description: optionalString(product.description),
    specs: readSpecs(product.specs),
    isBestseller: product.isBestseller,
    active: product.active,
    sortOrder: product.sortOrder,
    optionGroups: product.optionGroups.map(({ optionGroup, values: linkedValues }) => ({
      id: optionGroup.id,
      name: optionGroup.name,
      slug: optionGroup.slug,
      sortOrder: optionGroup.sortOrder,
      values: linkedValues.map(({ optionValue }) => ({
        id: optionValue.id,
        name: optionValue.name,
        slug: optionValue.slug,
        ...(optionValue.swatchHex ? { swatchHex: optionValue.swatchHex } : {}),
        sortOrder: optionValue.sortOrder,
      })),
    })),
    skus: product.skus.map((sku) => ({
      id: sku.id,
      articleNumber: sku.articleNumber,
      combinationKey: sku.combinationKey,
      selectedOptions: sku.selections.map(({ optionGroup, optionValue }) => ({
        groupSlug: optionGroup.slug,
        valueSlug: optionValue.slug,
      })),
      price: sku.price,
      oldPrice: sku.oldPrice,
      stock: sku.stock,
      active: sku.active,
      media: sku.media.map((media) => ({
        id: media.id,
        kind: media.kind,
        url: media.url,
        ...(media.publicId ? { publicId: media.publicId } : {}),
        ...(media.alt ? { alt: media.alt } : {}),
        sortOrder: media.sortOrder,
      })),
    })),
    media: product.media.map((media) => ({
      id: media.id,
      kind: media.kind,
      url: media.url,
      ...(media.publicId ? { publicId: media.publicId } : {}),
      ...(media.alt ? { alt: media.alt } : {}),
      sortOrder: media.sortOrder,
    })),
    turntable: product.media.some((media) => media.kind.startsWith('TURN_TABLE_')),
  };
  const parsed = furnitureProductSchema.safeParse(values);
  if (!parsed.success) throw new Error(`Canonical product draft is invalid: ${parsed.error.message}`);

  return {
    identity: {
      productId: product.id,
      slug: product.slug,
      hasLegacyTree: product.colorways.length > 0,
      canonicalSkuCount: product.skus.length,
    },
    values: parsed.data,
  };
}

export async function listAdminOptionGroupsForCatalog(): Promise<AdminOptionGroupRow[]> {
  const groups = await prisma.optionGroup.findMany({
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
      _count: { select: { products: true } },
      values: {
        orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
        select: { id: true, name: true, slug: true, swatchHex: true, sortOrder: true },
      },
    },
  });
  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    sortOrder: group.sortOrder,
    productCount: group._count.products,
    values: group.values,
  }));
}

export async function listAdminRoomsForCatalog(): Promise<AdminRoomRow[]> {
  const rooms = await prisma.room.findMany({
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    select: { id: true, name: true, slug: true, sortOrder: true, _count: { select: { products: true } } },
  });
  return rooms.map((room) => ({ ...room, productCount: room._count.products }));
}

export async function listAdminCategoriesForCatalog(): Promise<AdminCategoryRow[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
      _count: { select: { products: true } },
      turntableProduct: { select: { id: true, name: true } },
    },
  });
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
    productCount: category._count.products,
    turntableProductId: category.turntableProduct?.id ?? null,
    turntableProductName: category.turntableProduct?.name ?? null,
  }));
}

function getSkuOrder(sort: AdminSkuStockListParams['sort']): Prisma.SkuOrderByWithRelationInput[] {
  switch (sort) {
    case 'articleNumber':
      return [{ articleNumber: 'asc' }, { id: 'asc' }];
    case 'productName':
      return [{ product: { name: 'asc' } }, { articleNumber: 'asc' }, { id: 'asc' }];
    default:
      return [{ stock: 'asc' }, { articleNumber: 'asc' }, { id: 'asc' }];
  }
}

export async function listAdminSkuStock(params: AdminSkuStockListParams): Promise<AdminPagedResult<AdminSkuStockRow>> {
  const { page, limit, skip } = parsePaginationParams(
    { page: params.page?.toString(), limit: params.limit?.toString() },
    { limit: 20 },
  );
  const q = params.q?.trim();
  const where: Prisma.SkuWhereInput = {
    ...(params.productId ? { productId: params.productId } : {}),
    ...(params.status === 'active' ? { active: true } : {}),
    ...(params.status === 'inactive' ? { active: false } : {}),
    ...(q
      ? {
          OR: [{ articleNumber: contains(q) }, { combinationKey: contains(q) }, { product: { name: contains(q) } }],
        }
      : {}),
  };
  const [total, skus] = await Promise.all([
    prisma.sku.count({ where }),
    prisma.sku.findMany({
      where,
      orderBy: getSkuOrder(params.sort),
      skip,
      take: limit,
      select: {
        id: true,
        productId: true,
        articleNumber: true,
        combinationKey: true,
        price: true,
        stock: true,
        active: true,
        product: { select: { name: true } },
        selections: {
          orderBy: { optionGroup: { sortOrder: 'asc' } },
          select: { optionValue: { select: { name: true } } },
        },
      },
    }),
  ]);
  const meta = buildPaginationMeta({ page, limit }, total);
  return {
    rows: skus.map((sku) => ({
      skuId: sku.id,
      productId: sku.productId,
      productName: sku.product.name,
      articleNumber: sku.articleNumber,
      combinationKey: sku.combinationKey,
      optionLabels: sku.selections.map(({ optionValue }) => optionValue.name),
      price: sku.price,
      stock: sku.stock,
      active: sku.active,
    })),
    total,
    page: meta.page,
    limit: meta.limit,
    pageCount: meta.totalPages,
  };
}

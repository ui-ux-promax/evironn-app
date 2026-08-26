import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    product: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    sku: { count: vi.fn(), findMany: vi.fn() },
    optionGroup: { findMany: vi.fn() },
    room: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma-client';
import { getAdminProductDraft, listAdminCatalogProducts, listAdminSkuStock } from '@/lib/admin/catalog';
import { furnitureProductSchema } from '@/services/dto/product.dto';

const p = prisma as unknown as {
  product: Record<string, ReturnType<typeof vi.fn>>;
  sku: Record<string, ReturnType<typeof vi.fn>>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('canonical admin catalog reads', () => {
  it('clamps product pagination, uses deterministic ordering, and marks zero-SKU products incomplete', async () => {
    p.product.count.mockResolvedValue(2);
    p.product.findMany.mockResolvedValue([
      {
        id: 'product-2',
        name: 'Beta Chair',
        slug: 'beta-chair',
        brand: 'Evironn',
        categoryId: 'category-chair',
        category: { name: 'Стулья' },
        rooms: [{ room: { name: 'Гостиная' } }],
        active: true,
        isBestseller: false,
        sortOrder: 2,
        skus: [],
        media: [],
        turntableForCategories: [],
      },
      {
        id: 'product-1',
        name: 'Alpha Chair',
        slug: 'alpha-chair',
        brand: 'Evironn',
        categoryId: 'category-chair',
        category: { name: 'Стулья' },
        rooms: [{ room: { name: 'Гостиная' } }, { room: { name: 'Кабинет' } }],
        active: true,
        isBestseller: true,
        sortOrder: 1,
        skus: [
          { price: 120000, stock: 2, active: true },
          { price: 135000, stock: 4, active: false },
        ],
        media: [{ kind: 'IMAGE' }],
        turntableForCategories: [{ id: 'category-chair' }],
      },
    ]);

    const result = await listAdminCatalogProducts({
      page: 0,
      limit: 999,
      q: 'chair',
      categoryId: 'category-chair',
      roomId: 'room-living',
      status: 'incomplete',
      sort: 'name',
    });

    expect(result).toMatchObject({ page: 1, limit: 200, total: 2, pageCount: 1 });
    expect(result.rows[0]).toMatchObject({
      id: 'product-2',
      skuCount: 0,
      activeSkuCount: 0,
      totalStock: 0,
      minPrice: null,
      maxPrice: null,
      mediaCount: 0,
      turntableReady: false,
      flags: ['incomplete-zero-sku', 'no-media'],
    });
    expect(result.rows[1]).toMatchObject({
      id: 'product-1',
      skuCount: 2,
      activeSkuCount: 1,
      totalStock: 6,
      minPrice: 120000,
      maxPrice: 135000,
      mediaCount: 1,
      turntableReady: false,
      flags: ['turntable-bound'],
    });
    expect(p.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 200,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        where: expect.objectContaining({
          categoryId: 'category-chair',
          rooms: { some: { roomId: 'room-living' } },
          skus: { none: {} },
          OR: [
            { name: { contains: 'chair', mode: 'insensitive' } },
            { slug: { contains: 'chair', mode: 'insensitive' } },
            { skus: { some: { articleNumber: { contains: 'chair', mode: 'insensitive' } } } },
          ],
        }),
      }),
    );
  });

  it('clamps SKU stock pagination and orders low stock rows deterministically', async () => {
    p.sku.count.mockResolvedValue(201);
    p.sku.findMany.mockResolvedValue([
      {
        id: 'sku-1',
        productId: 'product-1',
        articleNumber: 'EV-ALPHA-OAK',
        combinationKey: 'finish=oak',
        price: 120000,
        stock: 2,
        active: true,
        product: { name: 'Alpha Chair' },
        selections: [{ optionValue: { name: 'Дуб' } }],
      },
    ]);

    const result = await listAdminSkuStock({ page: 2, limit: 500, q: 'alpha', status: 'active', sort: 'stock' });

    expect(result).toMatchObject({ page: 2, limit: 200, total: 201, pageCount: 2 });
    expect(result.rows).toEqual([
      {
        skuId: 'sku-1',
        productId: 'product-1',
        productName: 'Alpha Chair',
        articleNumber: 'EV-ALPHA-OAK',
        combinationKey: 'finish=oak',
        optionLabels: ['Дуб'],
        price: 120000,
        stock: 2,
        active: true,
      },
    ]);
    expect(p.sku.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 200,
        take: 200,
        orderBy: [{ stock: 'asc' }, { articleNumber: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('returns a schema-valid canonical draft with identity outside values', async () => {
    p.product.findUnique.mockResolvedValue({
      id: 'product-1',
      name: 'Alpha Chair',
      slug: 'alpha-chair',
      brand: 'Evironn',
      categoryId: 'category-chair',
      description: 'A comfortable chair',
      specs: [{ key: 'Материал', value: 'Дуб' }],
      isBestseller: true,
      active: true,
      sortOrder: 1,
      rooms: [{ room: { id: 'room-living', slug: 'living', name: 'Гостиная' } }],
      optionGroups: [
        {
          optionGroup: { id: 'group-finish', name: 'Отделка', slug: 'finish', sortOrder: 1 },
          values: [
            {
              optionValue: {
                id: 'value-oak',
                name: 'Дуб',
                slug: 'oak',
                swatchHex: '#AA7733',
                sortOrder: 0,
              },
            },
          ],
        },
      ],
      optionValues: [{ optionValue: { id: 'value-oak' } }],
      skus: [
        {
          id: 'sku-1',
          articleNumber: 'EV-ALPHA-OAK',
          combinationKey: 'finish=oak',
          price: 120000,
          oldPrice: null,
          stock: 2,
          active: true,
          selections: [
            {
              optionGroup: { name: 'Отделка', slug: 'finish', sortOrder: 1 },
              optionValue: { name: 'Дуб', slug: 'oak' },
            },
          ],
          media: [{ id: 'sku-media-1', kind: 'IMAGE', url: 'https://cdn.example.com/alpha.jpg', sortOrder: 0 }],
        },
      ],
      media: [{ id: 'media-1', kind: 'IMAGE', url: 'https://cdn.example.com/alpha.jpg', sortOrder: 0 }],
      turntableForCategories: [],
      colorways: [],
    });

    const draft = await getAdminProductDraft('product-1');

    expect(draft?.identity).toEqual({
      productId: 'product-1',
      slug: 'alpha-chair',
      hasLegacyTree: false,
      canonicalSkuCount: 1,
    });
    expect(draft?.values).not.toHaveProperty('id');
    expect(furnitureProductSchema.safeParse(draft?.values).success).toBe(true);
  });
});

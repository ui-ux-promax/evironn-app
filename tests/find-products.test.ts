import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  productCount: vi.fn(),
  productGroupBy: vi.fn(),
  productFindMany: vi.fn(),
  categoryFindMany: vi.fn(),
  roomFindMany: vi.fn(),
  optionGroupFindMany: vi.fn(),
  skuAggregate: vi.fn(),
  legacyColorwayFindMany: vi.fn(),
  legacyVariantAggregate: vi.fn(),
}));

vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    product: { count: mocks.productCount, groupBy: mocks.productGroupBy, findMany: mocks.productFindMany },
    category: { findMany: mocks.categoryFindMany },
    room: { findMany: mocks.roomFindMany },
    optionGroup: { findMany: mocks.optionGroupFindMany },
    sku: { aggregate: mocks.skuAggregate },
    productColorway: { findMany: mocks.legacyColorwayFindMany },
    productVariant: { aggregate: mocks.legacyVariantAggregate },
  },
}));

import { furnitureProductCardInclude } from '@/lib/furniture-product-summary';
import { findProducts } from '@/lib/find-products';

const categoryRows = [
  { id: 'category-sofas', slug: 'sofas', name: 'Sofas', sortOrder: 1 },
  { id: 'category-chairs', slug: 'chairs', name: 'Chairs', sortOrder: 2 },
];
const roomRows = [
  { id: 'room-living', slug: 'living', name: 'Living room', sortOrder: 1 },
  { id: 'room-dining', slug: 'dining', name: 'Dining room', sortOrder: 2 },
];
const optionRows = [
  {
    id: 'finish',
    slug: 'finish',
    name: 'Finish',
    sortOrder: 1,
    values: [
      { id: 'oak', slug: 'oak', name: 'Oak', swatchHex: '#c89b6d', sortOrder: 1 },
      { id: 'walnut', slug: 'walnut', name: 'Walnut', swatchHex: '#6b4226', sortOrder: 2 },
    ],
  },
];
const upholsteryGroup = {
  id: 'upholstery',
  slug: 'upholstery',
  name: 'Upholstery',
  sortOrder: 2,
  values: [
    { id: 'sage-linen', slug: 'sage-linen', name: 'Sage linen', swatchHex: '#7f8d79', sortOrder: 1 },
    { id: 'ivory-linen', slug: 'ivory-linen', name: 'Ivory linen', swatchHex: '#efe7d8', sortOrder: 2 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.productCount.mockResolvedValue(25);
  mocks.productGroupBy.mockResolvedValue([]);
  mocks.productFindMany.mockResolvedValue([]);
  mocks.categoryFindMany.mockResolvedValue(categoryRows);
  mocks.roomFindMany.mockResolvedValue(roomRows);
  mocks.optionGroupFindMany.mockResolvedValue(optionRows);
  mocks.skuAggregate.mockResolvedValue({ _min: { price: 50000 }, _max: { price: 180000 } });
  mocks.legacyColorwayFindMany.mockResolvedValue([]);
  mocks.legacyVariantAggregate.mockResolvedValue({ _min: { price: 50000 }, _max: { price: 180000 } });
});

describe('findProducts', () => {
  it('loads canonical facets and total before one server-paginated furniture page', async () => {
    const result = await findProducts({ page: '2', sort: 'new' });

    expect(mocks.productFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: furnitureProductCardInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: 12,
        take: 12,
      }),
    );
    expect(result).toMatchObject({ page: 2, total: 25, totalPages: 3 });
    expect(result.facets).toMatchObject({
      categories: [
        { value: 'sofas', label: 'Sofas' },
        { value: 'chairs', label: 'Chairs' },
      ],
      rooms: [
        { value: 'living', label: 'Living room' },
        { value: 'dining', label: 'Dining room' },
      ],
      options: [
        {
          slug: 'finish',
          name: 'Finish',
          values: [
            { value: 'oak', label: 'Oak', swatchHex: '#c89b6d' },
            { value: 'walnut', label: 'Walnut', swatchHex: '#6b4226' },
          ],
        },
      ],
      price: { min: 50000, max: 180000 },
    });
    expect(mocks.legacyColorwayFindMany).not.toHaveBeenCalled();
    expect(mocks.legacyVariantAggregate).not.toHaveBeenCalled();
    expect(mocks.productFindMany).toHaveBeenCalledTimes(1);
    expect(mocks.productCount.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.productFindMany.mock.invocationCallOrder[0],
    );
    expect(mocks.categoryFindMany.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.productFindMany.mock.invocationCallOrder[0],
    );
    expect(mocks.roomFindMany.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.productFindMany.mock.invocationCallOrder[0],
    );
    expect(mocks.optionGroupFindMany.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.productFindMany.mock.invocationCallOrder[0],
    );
    expect(mocks.skuAggregate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.productFindMany.mock.invocationCallOrder[0],
    );
  });

  it('clamps an out-of-range page before calculating the Prisma skip', async () => {
    const result = await findProducts({ page: '999' });

    expect(result.page).toBe(3);
    expect(mocks.productFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 24, take: 12 }));
  });

  it('builds facet counts from independent same-facet selections and waits for every count', async () => {
    mocks.optionGroupFindMany.mockResolvedValue([...optionRows, upholsteryGroup]);

    const countResolvers: Array<(value: number) => void> = [];
    let settledCount = 0;
    mocks.productCount.mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          countResolvers.push((value) => {
            settledCount += 1;
            resolve(value);
          });
        }),
    );
    mocks.productFindMany.mockImplementation(() => {
      expect(settledCount).toBe(9);
      return Promise.resolve([]);
    });

    const resultPromise = findProducts({
      category: 'sofas,chairs',
      room: 'living,dining',
      option: 'finish:oak,finish:walnut,upholstery:sage-linen',
    });

    await vi.waitFor(() => expect(countResolvers).toHaveLength(1));
    countResolvers[0](25);
    await vi.waitFor(() => expect(countResolvers).toHaveLength(9));
    expect(mocks.productFindMany).not.toHaveBeenCalled();

    const facetWheres = mocks.productCount.mock.calls.slice(1).map(([args]) => args.where);
    expect(facetWheres[0]).toMatchObject({
      category: { slug: { in: ['sofas'] } },
      rooms: { some: { room: { slug: { in: ['living', 'dining'] } } } },
    });
    expect(facetWheres[1]).toMatchObject({ category: { slug: { in: ['chairs'] } } });
    expect(facetWheres[2]).toMatchObject({
      category: { slug: { in: ['sofas', 'chairs'] } },
      rooms: { some: { room: { slug: { in: ['living'] } } } },
    });
    expect(facetWheres[3]).toMatchObject({ rooms: { some: { room: { slug: { in: ['dining'] } } } } });

    expect(facetWheres[4]).toMatchObject({
      skus: {
        some: {
          AND: expect.arrayContaining([
            { selections: { some: { optionGroup: { slug: 'finish' }, optionValue: { slug: { in: ['oak'] } } } } },
            {
              selections: {
                some: { optionGroup: { slug: 'upholstery' }, optionValue: { slug: { in: ['sage-linen'] } } },
              },
            },
          ]),
        },
      },
    });
    expect(facetWheres[6]).toMatchObject({
      skus: {
        some: {
          AND: expect.arrayContaining([
            {
              selections: {
                some: { optionGroup: { slug: 'finish' }, optionValue: { slug: { in: ['oak', 'walnut'] } } },
              },
            },
            {
              selections: {
                some: { optionGroup: { slug: 'upholstery' }, optionValue: { slug: { in: ['sage-linen'] } } },
              },
            },
          ]),
        },
      },
    });

    for (const resolve of countResolvers.slice(1)) resolve(25);
    await resultPromise;
    expect(settledCount).toBe(9);
    const pageOrder = mocks.productFindMany.mock.invocationCallOrder[0];
    expect(mocks.productCount.mock.invocationCallOrder.slice(1).every((order) => order < pageOrder)).toBe(true);
  });

  it('uses active canonical SKU prices for global bounds', async () => {
    await findProducts({ category: 'sofas', option: 'finish:oak' });

    expect(mocks.skuAggregate).toHaveBeenCalledWith({
      where: { active: true, product: { active: true } },
      _min: { price: true },
      _max: { price: true },
    });
    expect(mocks.productFindMany.mock.calls[0][0].where).toMatchObject({
      category: { slug: { in: ['sofas'] } },
      skus: { some: expect.any(Object) },
    });
  });
});

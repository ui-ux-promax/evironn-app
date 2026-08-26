import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => {
  const prisma = {
    category: { count: vi.fn() },
    product: { count: vi.fn() },
    room: { count: vi.fn() },
    sku: { count: vi.fn(), findMany: vi.fn() },
  };
  return { prisma };
});

import { prisma } from '@/lib/prisma-client';
import { getAdminCatalogKpis, getAdminLowStockSkus, type AdminCatalogKpis } from '@/lib/admin/analytics';
import {
  DASHBOARD_LOW_STOCK_DISPLAY_MAX,
  DASHBOARD_LOW_STOCK_LIMIT,
  DASHBOARD_RECENT_ORDERS_LIMIT,
} from '@/lib/admin/analytics-config';
import { LOW_STOCK_THRESHOLD } from '@/constants/config';

const p = prisma as unknown as {
  category: Record<string, ReturnType<typeof vi.fn>>;
  product: Record<string, ReturnType<typeof vi.fn>>;
  room: Record<string, ReturnType<typeof vi.fn>>;
  sku: Record<string, ReturnType<typeof vi.fn>>;
};

describe('admin dashboard furniture projections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the exact catalog KPI contract and applies stock boundaries', async () => {
    p.product.count.mockResolvedValue(4);
    p.room.count.mockResolvedValue(3);
    p.category.count.mockImplementation(async (args?: { where?: Record<string, unknown> }) => {
      const where = args?.where;
      return where?.turntableProductId ? 2 : 5;
    });
    p.sku.count.mockImplementation(async (args?: { where?: Record<string, unknown> }) => {
      const where = args?.where;
      if (!where) return 9;
      if (where.active === true) return 7;
      if (where.stock && JSON.stringify(where.stock) === JSON.stringify({ gt: 0, lte: LOW_STOCK_THRESHOLD })) return 2;
      if (where.stock && JSON.stringify(where.stock) === JSON.stringify({ equals: 0 })) return 1;
      throw new Error(`Unexpected SKU count filter: ${JSON.stringify(where)}`);
    });

    const result: AdminCatalogKpis = await getAdminCatalogKpis(prisma as never);

    expect(Object.keys(result).sort()).toEqual([
      'activeProducts',
      'activeSkus',
      'categories',
      'lowStockSkus',
      'outOfStockSkus',
      'rooms',
      'totalSkus',
      'turntableBoundCategories',
      'turntableCoverageRatio',
    ]);
    expect(result).toEqual({
      activeProducts: 4,
      totalSkus: 9,
      activeSkus: 7,
      lowStockSkus: 2,
      outOfStockSkus: 1,
      categories: 5,
      rooms: 3,
      turntableBoundCategories: 2,
      turntableCoverageRatio: 0.4,
    });
    expect(p.sku.count).toHaveBeenCalledWith({ where: { stock: { gt: 0, lte: 3 } } });
    expect(p.sku.count).toHaveBeenCalledWith({ where: { stock: { equals: 0 } } });
  });

  it('returns zero turntable coverage when catalog has no categories', async () => {
    p.product.count.mockResolvedValue(0);
    p.room.count.mockResolvedValue(0);
    p.category.count.mockResolvedValue(0);
    p.sku.count.mockResolvedValue(0);

    await expect(getAdminCatalogKpis(prisma as never)).resolves.toMatchObject({
      categories: 0,
      turntableBoundCategories: 0,
      turntableCoverageRatio: 0,
    });
  });

  it('queries canonical low-stock SKUs with bounded display window and caller cap', async () => {
    p.sku.findMany.mockResolvedValue([
      {
        id: 'sku-1',
        articleNumber: 'EV-NOMA-OAK',
        productId: 'product-1',
        stock: 3,
        product: { name: 'Noma' },
        selections: [
          { optionGroup: { name: 'Finish', sortOrder: 1 }, optionValue: { name: 'Oak' } },
          { optionGroup: { name: 'Fabric', sortOrder: 2 }, optionValue: { name: 'Ivory' } },
        ],
      },
    ]);

    await expect(getAdminLowStockSkus(99, prisma as never)).resolves.toEqual([
      {
        skuId: 'sku-1',
        articleNumber: 'EV-NOMA-OAK',
        productId: 'product-1',
        productName: 'Noma',
        combinationLabel: 'Finish: Oak · Fabric: Ivory',
        stock: 3,
      },
    ]);

    expect(p.sku.findMany).toHaveBeenCalledWith({
      where: { active: true, product: { active: true }, stock: { gt: 0, lte: DASHBOARD_LOW_STOCK_DISPLAY_MAX } },
      orderBy: [{ stock: 'asc' }, { articleNumber: 'asc' }],
      take: DASHBOARD_LOW_STOCK_LIMIT,
      select: {
        id: true,
        articleNumber: true,
        productId: true,
        stock: true,
        product: { select: { name: true } },
        selections: {
          orderBy: { optionGroup: { sortOrder: 'asc' } },
          select: { optionGroup: { select: { name: true } }, optionValue: { select: { name: true } } },
        },
      },
    });
    expect(p.sku.findMany.mock.calls[0][0].take).toBeLessThanOrEqual(DASHBOARD_LOW_STOCK_LIMIT);
  });

  it('caps an explicit low-stock limit without changing the display window', async () => {
    p.sku.findMany.mockResolvedValue([]);

    await getAdminLowStockSkus(4, prisma as never);

    expect(p.sku.findMany.mock.calls[0][0].take).toBe(4);
    expect(p.sku.findMany.mock.calls[0][0].where.stock).toEqual({
      gt: 0,
      lte: DASHBOARD_LOW_STOCK_DISPLAY_MAX,
    });
  });

  it('defines bounded dashboard limits in the shared analytics config', () => {
    expect(DASHBOARD_RECENT_ORDERS_LIMIT).toBe(12);
    expect(DASHBOARD_LOW_STOCK_LIMIT).toBe(12);
    expect(DASHBOARD_LOW_STOCK_DISPLAY_MAX).toBe(10);
    expect(LOW_STOCK_THRESHOLD).toBe(3);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => {
  const prisma = {
    cart: { count: vi.fn() },
    category: { count: vi.fn() },
    order: { count: vi.fn(), findMany: vi.fn() },
    product: { count: vi.fn(), findMany: vi.fn() },
    room: { count: vi.fn() },
    sku: { count: vi.fn(), findMany: vi.fn() },
    $queryRaw: vi.fn(),
  };
  return { prisma };
});

import { prisma } from '@/lib/prisma-client';
import {
  getAdminCatalogKpis,
  getAdminCategoryDistribution,
  getAdminLowStockSkus,
  getAdminFunnelProjection,
  type AdminCatalogKpis,
} from '@/lib/admin/analytics';
import {
  DASHBOARD_LOW_STOCK_DISPLAY_MAX,
  DASHBOARD_LOW_STOCK_LIMIT,
  DASHBOARD_RECENT_ORDERS_LIMIT,
} from '@/lib/admin/analytics-config';
import { LOW_STOCK_THRESHOLD } from '@/constants/config';

const p = prisma as unknown as {
  cart: Record<string, ReturnType<typeof vi.fn>>;
  category: Record<string, ReturnType<typeof vi.fn>>;
  order: Record<string, ReturnType<typeof vi.fn>>;
  product: Record<string, ReturnType<typeof vi.fn>>;
  room: Record<string, ReturnType<typeof vi.fn>>;
  sku: Record<string, ReturnType<typeof vi.fn>>;
  $queryRaw: ReturnType<typeof vi.fn>;
};

describe('admin dashboard furniture projections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('projects the real commerce funnel and its period-over-period conversion change', async () => {
    p.cart.count.mockImplementation(async (args: { where?: { createdAt?: { gte?: Date } } }) =>
      args.where?.createdAt?.gte?.toISOString() === '2026-07-01T00:00:00.000Z' ? 6 : 5,
    );
    p.order.count.mockImplementation(async (args: { where?: Record<string, unknown> }) => {
      const current =
        (args.where?.createdAt as { gte?: Date } | undefined)?.gte?.toISOString() === '2026-07-01T00:00:00.000Z';
      const status = args.where?.status;
      if (status && typeof status === 'object' && 'in' in status) return current ? 2 : 1;
      if (status === 'DELIVERED') return current ? 1 : 1;
      if (args.where?.payment) return current ? 2 : 1;
      return current ? 3 : 2;
    });

    const result = await getAdminFunnelProjection(prisma as never, {
      days: 30,
      current: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
      previous: { gte: new Date('2026-06-01'), lt: new Date('2026-07-01') },
    });

    expect(result).toEqual({
      carts: 6,
      orders: 3,
      paid: 2,
      shipped: 2,
      completed: 1,
      conversion: 50,
      conversionDelta: 10,
    });
    expect(p.cart.count).toHaveBeenCalledWith({
      where: { createdAt: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') } },
    });
    expect(p.order.count).toHaveBeenCalledWith({
      where: {
        createdAt: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
        status: { not: 'CANCELLED' },
      },
    });
    expect(p.order.count).toHaveBeenCalledWith({
      where: {
        createdAt: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
        payment: { is: { status: 'succeeded' } },
        status: { not: 'CANCELLED' },
      },
    });
    expect(p.order.count).toHaveBeenCalledWith({
      where: {
        createdAt: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
        status: { in: ['SHIPPED', 'DELIVERED'] },
      },
    });
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

  it('projects category revenue from canonical order snapshots and groups the remainder honestly', async () => {
    p.$queryRaw.mockResolvedValue([
      { category_id: 'c1', name: 'Диваны', value: 70000 },
      { category_id: 'c2', name: 'Столы', value: 15000 },
      { category_id: 'c3', name: 'Стулья', value: 10000 },
      { category_id: 'c4', name: 'Свет', value: 3000 },
      { category_id: 'c5', name: 'Другое сырьё', value: 2000 },
    ]);

    const result = await getAdminCategoryDistribution(prisma as never, {
      days: 30,
      current: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
      previous: { gte: new Date('2026-06-01'), lt: new Date('2026-07-01') },
    });

    expect(result).toEqual([
      { categoryId: 'c1', name: 'Диваны', value: 70000, sharePct: 70 },
      { categoryId: 'c2', name: 'Столы', value: 15000, sharePct: 15 },
      { categoryId: 'c3', name: 'Стулья', value: 10000, sharePct: 10 },
      { categoryId: 'c4', name: 'Свет', value: 3000, sharePct: 3 },
      { categoryId: 'other', name: 'Другое', value: 2000, sharePct: 2 },
    ]);
    expect(p.$queryRaw.mock.calls[0][0].sql).toContain('JOIN "Category"');
    expect(p.$queryRaw.mock.calls[0][0].sql).toContain('c.name');
    expect(p.$queryRaw.mock.calls[0][0].sql).toContain('oi."lineTotal"');
  });

  it('keeps recent order product name and image from one snapshot item', async () => {
    p.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        orderNumber: 101,
        status: 'PENDING',
        totalAmount: 1000,
        createdAt: new Date('2026-08-26T12:00:00Z'),
        contactName: 'Иван Петров',
        shippingMethod: 'courier',
        deliveryDate: null,
        payment: null,
        user: null,
        items: [
          { productName: 'Диван', imageUrl: null, quantity: 1 },
          { productName: 'Стол', imageUrl: 'table.jpg', quantity: 1 },
        ],
      },
    ]);

    const { getRecentOrders } = await import('@/lib/admin/analytics');
    await expect(getRecentOrders(prisma as never)).resolves.toMatchObject([
      { productName: 'Диван', imageUrl: null, itemCount: 2 },
    ]);
  });

  it('allocates category shares to a deterministic total of 100 percent', async () => {
    p.$queryRaw.mockResolvedValue([
      { category_id: 'c1', name: 'Диваны', value: 1 },
      { category_id: 'c2', name: 'Столы', value: 1 },
      { category_id: 'c3', name: 'Стулья', value: 1 },
    ]);

    const { getAdminCategoryDistribution } = await import('@/lib/admin/analytics');
    const result = await getAdminCategoryDistribution(prisma as never, {
      days: 30,
      current: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
      previous: { gte: new Date('2026-06-01'), lt: new Date('2026-07-01') },
    });

    expect(result.map((item) => item.sharePct)).toEqual([34, 33, 33]);
    expect(result.reduce((sum, item) => sum + item.sharePct, 0)).toBe(100);
  });

  it('returns an empty category projection when the period has no sales', async () => {
    p.$queryRaw.mockResolvedValue([
      { category_id: 'c1', name: 'Диваны', value: 0 },
      { category_id: 'c2', name: 'Столы', value: 0 },
    ]);

    const { getAdminCategoryDistribution } = await import('@/lib/admin/analytics');
    const result = await getAdminCategoryDistribution(prisma as never, {
      days: 30,
      current: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
      previous: { gte: new Date('2026-06-01'), lt: new Date('2026-07-01') },
    });

    expect(result).toEqual([]);
  });

  it('excludes zero-sales categories from a mixed category projection', async () => {
    p.$queryRaw.mockResolvedValue([
      { category_id: 'c1', name: 'Диваны', value: 80 },
      { category_id: 'c2', name: 'Столы', value: 20 },
      { category_id: 'c3', name: 'Стулья', value: 0 },
    ]);

    const { getAdminCategoryDistribution } = await import('@/lib/admin/analytics');
    const result = await getAdminCategoryDistribution(prisma as never, {
      days: 30,
      current: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
      previous: { gte: new Date('2026-06-01'), lt: new Date('2026-07-01') },
    });

    expect(result.map((item) => item.categoryId)).toEqual(['c1', 'c2']);
  });

  it('keeps unresolved snapshot revenue in the other bucket', async () => {
    p.$queryRaw.mockResolvedValue([
      { category_id: 'c1', name: 'Диваны', value: 80 },
      { category_id: null, name: null, value: 20 },
    ]);

    const { getAdminCategoryDistribution } = await import('@/lib/admin/analytics');
    const result = await getAdminCategoryDistribution(prisma as never, {
      days: 30,
      current: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
      previous: { gte: new Date('2026-06-01'), lt: new Date('2026-07-01') },
    });

    expect(result).toEqual([
      { categoryId: 'c1', name: 'Диваны', value: 80, sharePct: 80 },
      { categoryId: 'other', name: 'Другое', value: 20, sharePct: 20 },
    ]);
    expect(p.$queryRaw.mock.calls.at(-1)?.[0].sql).toContain('LEFT JOIN "Product"');
    expect(p.$queryRaw.mock.calls.at(-1)?.[0].sql).toContain('LEFT JOIN "Category"');
    expect(p.$queryRaw.mock.calls.at(-1)?.[0].sql).toContain('UNION ALL');
  });

  it('groups a positive category that rounds to zero into the other bucket', async () => {
    p.$queryRaw.mockResolvedValue([
      { category_id: 'c1', name: 'Диваны', value: 9999 },
      { category_id: 'c2', name: 'Столы', value: 1 },
    ]);

    const { getAdminCategoryDistribution } = await import('@/lib/admin/analytics');
    const result = await getAdminCategoryDistribution(prisma as never, {
      days: 30,
      current: { gte: new Date('2026-07-01'), lt: new Date('2026-08-01') },
      previous: { gte: new Date('2026-06-01'), lt: new Date('2026-07-01') },
    });

    expect(result.map(({ categoryId, sharePct }) => ({ categoryId, sharePct }))).toEqual([
      { categoryId: 'c1', sharePct: 99 },
      { categoryId: 'other', sharePct: 1 },
    ]);
  });

  it('defines bounded dashboard limits in the shared analytics config', () => {
    expect(DASHBOARD_RECENT_ORDERS_LIMIT).toBe(12);
    expect(DASHBOARD_LOW_STOCK_LIMIT).toBe(12);
    expect(DASHBOARD_LOW_STOCK_DISPLAY_MAX).toBe(10);
    expect(LOW_STOCK_THRESHOLD).toBe(3);
  });
});

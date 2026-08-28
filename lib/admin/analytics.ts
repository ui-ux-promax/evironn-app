import { LOW_STOCK_THRESHOLD } from '@/constants/config';
import { Prisma, type OrderStatus } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma-client';
import { ORDER_STATUS_META } from '@/lib/order';
import { ORDER_STATUS_VALUES } from '@/lib/order-admin';
import {
  DASHBOARD_LOW_STOCK_DISPLAY_MAX,
  DASHBOARD_LOW_STOCK_LIMIT,
  DASHBOARD_RECENT_ORDERS_LIMIT,
  PERIOD_VALUES,
  DEFAULT_PERIOD,
  type Period,
} from './analytics-config';

export {
  DASHBOARD_LOW_STOCK_DISPLAY_MAX,
  DASHBOARD_LOW_STOCK_LIMIT,
  DASHBOARD_RECENT_ORDERS_LIMIT,
  PERIOD_VALUES,
  DEFAULT_PERIOD,
  type Period,
} from './analytics-config';

// ─────────────────────────── Period ───────────────────────────

export type DateRange = { gte: Date; lt: Date };
export type ResolvedPeriod = { days: Period; current: DateRange; previous: DateRange };

const DAY_MS = 24 * 60 * 60 * 1000;

// Парс ?period= (валид → 7/30/90, иначе 30). current = [now−N, now); previous = [now−2N, now−N).
// now инъектируется параметром (чистая функция, тестируемость без Date.now()).
export function resolvePeriod(sp: Record<string, string | string[] | undefined>, now: Date): ResolvedPeriod {
  const rawValue = typeof sp.period === 'string' ? Number(sp.period) : NaN;
  const days = (PERIOD_VALUES as readonly number[]).includes(rawValue) ? (rawValue as Period) : DEFAULT_PERIOD;
  const ms = days * DAY_MS;
  const currentGte = new Date(now.getTime() - ms);
  const previousGte = new Date(now.getTime() - 2 * ms);
  return {
    days,
    current: { gte: currentGte, lt: now },
    previous: { gte: previousGte, lt: currentGte },
  };
}

// ─────────────────────────── Trend ───────────────────────────

export type Trend = { pct: number | null; dir: 'up' | 'down' | 'flat' };

// pct округлён до 1 знака. previous=0 && current>0 → {null,'up'} («новое», без деления на 0).
export function computeTrend(current: number, previous: number): Trend {
  if (previous === 0) {
    return current > 0 ? { pct: null, dir: 'up' } : { pct: 0, dir: 'flat' };
  }
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  if (pct > 0) return { pct, dir: 'up' };
  if (pct < 0) return { pct, dir: 'down' };
  return { pct: 0, dir: 'flat' };
}

// ─────────────────────────── Stock tier ───────────────────────────

export function classifyStockTier(stock: number): 'critical' | 'warning' {
  return stock <= LOW_STOCK_THRESHOLD ? 'critical' : 'warning';
}

// ─────────────────────────── Revenue series fill ───────────────────────────

// Полный дневной ряд: для каждого ожидаемого дня берём revenue из rows или 0. dayKeys
// предпосчитаны вызывающим (с tz-форматированием) — здесь чистое сопоставление по ключу дня.
export function fillRevenueSeries(
  dayKeys: { key: string; label: string }[],
  rows: { day: string; revenue: number }[],
): { label: string; revenue: number }[] {
  const byDay = new Map(rows.map((r) => [r.day, r.revenue]));
  return dayKeys.map(({ key, label }) => ({ label, revenue: byDay.get(key) ?? 0 }));
}

// ─────────────────────────── Data layer ───────────────────────────
//
// Каждая функция принимает PrismaClient (по умолчанию общий) + range. Денежные значения —
// целые рубли. CANCELLED исключён из выручки/заказов/units/best-sellers (как метрики 3.5).

type Db = typeof defaultPrisma;

export type Kpi = { value: number; trend: Trend };
export type DashboardKpis = {
  revenue: Kpi;
  orders: Kpi;
  avgOrder: Kpi;
  newCustomers: Kpi;
  unitsSold: Kpi;
};

export type AdminFunnelProjection = {
  carts: number;
  orders: number;
  paid: number;
  shipped: number;
  completed: number;
  conversion: number | null;
  conversionDelta: number | null;
};

export type AdminCatalogKpis = {
  activeProducts: number;
  totalSkus: number;
  activeSkus: number;
  lowStockSkus: number;
  outOfStockSkus: number;
  categories: number;
  rooms: number;
  turntableBoundCategories: number;
  turntableCoverageRatio: number;
};

export type AdminLowStockSku = {
  skuId: string;
  articleNumber: string;
  productId: string;
  productName: string;
  combinationLabel: string;
  stock: number;
};

export async function getAdminCatalogKpis(db: Db = defaultPrisma): Promise<AdminCatalogKpis> {
  const [activeProducts, totalSkus, activeSkus, lowStockSkus, outOfStockSkus, categories, rooms, turntableBoundCategories] =
    await Promise.all([
      db.product.count({ where: { active: true } }),
      db.sku.count(),
      db.sku.count({ where: { active: true } }),
      db.sku.count({ where: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
      db.sku.count({ where: { stock: { equals: 0 } } }),
      db.category.count(),
      db.room.count(),
      db.category.count({ where: { turntableProductId: { not: null } } }),
    ]);

  return {
    activeProducts,
    totalSkus,
    activeSkus,
    lowStockSkus,
    outOfStockSkus,
    categories,
    rooms,
    turntableBoundCategories,
    turntableCoverageRatio: categories === 0 ? 0 : turntableBoundCategories / categories,
  };
}

export function getAdminLowStockSkus(db?: Db, limit?: number): Promise<AdminLowStockSku[]>;
export function getAdminLowStockSkus(limit?: number, db?: Db): Promise<AdminLowStockSku[]>;
export async function getAdminLowStockSkus(
  dbOrLimit: Db | number = defaultPrisma,
  limitOrDb: number | Db = DASHBOARD_LOW_STOCK_LIMIT,
): Promise<AdminLowStockSku[]> {
  const db = typeof dbOrLimit === 'number' ? (typeof limitOrDb === 'number' ? defaultPrisma : limitOrDb) : dbOrLimit;
  const limit = typeof dbOrLimit === 'number' ? dbOrLimit : typeof limitOrDb === 'number' ? limitOrDb : undefined;
  const requestedLimit = typeof limit === 'number' && Number.isFinite(limit) ? Math.trunc(limit) : DASHBOARD_LOW_STOCK_LIMIT;
  const boundedLimit = Math.min(Math.max(requestedLimit, 0), DASHBOARD_LOW_STOCK_LIMIT);
  if (boundedLimit === 0) return [];

  const skus = await db.sku.findMany({
    where: {
      active: true,
      product: { active: true },
      stock: { gt: 0, lte: DASHBOARD_LOW_STOCK_DISPLAY_MAX },
    },
    orderBy: [{ stock: 'asc' }, { articleNumber: 'asc' }],
    take: boundedLimit,
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

  return skus.map((sku) => ({
    skuId: sku.id,
    articleNumber: sku.articleNumber,
    productId: sku.productId,
    productName: sku.product.name,
    combinationLabel:
      sku.selections.map((selection) => `${selection.optionGroup.name}: ${selection.optionValue.name}`).join(' · ') ||
      'Configuration',
    stock: sku.stock,
  }));
}

const notCancelled = { not: 'CANCELLED' as OrderStatus };

async function sumRevenue(db: Db, r: DateRange): Promise<number> {
  const agg = await db.order.aggregate({
    _sum: { totalAmount: true },
    where: { status: notCancelled, createdAt: { gte: r.gte, lt: r.lt } },
  });
  return agg._sum.totalAmount ?? 0;
}

async function countOrders(db: Db, r: DateRange): Promise<number> {
  return db.order.count({
    where: { status: notCancelled, createdAt: { gte: r.gte, lt: r.lt } },
  });
}

async function countNewCustomers(db: Db, r: DateRange): Promise<number> {
  return db.user.count({
    where: { role: 'CUSTOMER', createdAt: { gte: r.gte, lt: r.lt } },
  });
}

async function sumUnits(db: Db, r: DateRange): Promise<number> {
  const rows = await db.$queryRaw<{ units: number }[]>(Prisma.sql`
    SELECT COALESCE(SUM(oi.quantity), 0)::int AS units
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    WHERE o.status::text <> 'CANCELLED'
      AND o."createdAt" >= ${r.gte} AND o."createdAt" < ${r.lt}
  `);
  return rows[0]?.units ?? 0;
}

export async function getKpis(db: Db = defaultPrisma, range: ResolvedPeriod): Promise<DashboardKpis> {
  const [revCur, revPrev, ordCur, ordPrev, custCur, custPrev, unitsCur, unitsPrev] = await Promise.all([
    sumRevenue(db, range.current),
    sumRevenue(db, range.previous),
    countOrders(db, range.current),
    countOrders(db, range.previous),
    countNewCustomers(db, range.current),
    countNewCustomers(db, range.previous),
    sumUnits(db, range.current),
    sumUnits(db, range.previous),
  ]);

  const avgCur = ordCur > 0 ? Math.round(revCur / ordCur) : 0;
  const avgPrev = ordPrev > 0 ? Math.round(revPrev / ordPrev) : 0;

  return {
    revenue: { value: revCur, trend: computeTrend(revCur, revPrev) },
    orders: { value: ordCur, trend: computeTrend(ordCur, ordPrev) },
    avgOrder: { value: avgCur, trend: computeTrend(avgCur, avgPrev) },
    newCustomers: { value: custCur, trend: computeTrend(custCur, custPrev) },
    unitsSold: { value: unitsCur, trend: computeTrend(unitsCur, unitsPrev) },
  };
}

// ── Status donut (all-time) ──

export type StatusSegment = { status: OrderStatus; label: string; count: number };
export type StatusDistribution = { segments: StatusSegment[]; total: number };

export async function getStatusDistribution(db: Db = defaultPrisma): Promise<StatusDistribution> {
  const groups = await db.order.groupBy({ by: ['status'], _count: { _all: true } });
  const counts = new Map<OrderStatus, number>();
  for (const g of groups) counts.set(g.status, g._count._all);
  const segments: StatusSegment[] = ORDER_STATUS_VALUES.map((status) => ({
    status,
    label: ORDER_STATUS_META[status].label,
    count: counts.get(status) ?? 0,
  })).filter((s) => s.count > 0);
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  return { segments, total };
}

// ── Revenue series (period, daily buckets in MSK) ──

const MSK_DAY_KEY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}); // YYYY-MM-DD
const MSK_DAY_LABEL = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow',
  day: '2-digit',
  month: '2-digit',
}); // dd.mm

export type KpiSeriesPoint = {
  label: string;
  revenue: number;
  orders: number;
  avgOrder: number;
};

export async function getKpiSeries(db: Db = defaultPrisma, range: ResolvedPeriod): Promise<KpiSeriesPoint[]> {
  const rows = await db.$queryRaw<{ day: string; revenue: number; orders: number }[]>(Prisma.sql`
    SELECT
      to_char(
        date_trunc('day', o."createdAt" AT TIME ZONE 'Europe/Moscow'),
        'YYYY-MM-DD'
      ) AS day,
      COALESCE(SUM(o."totalAmount"), 0)::int AS revenue,
      COUNT(*)::int AS orders
    FROM "Order" o
    WHERE o.status::text <> 'CANCELLED'
      AND o."createdAt" >= ${range.current.gte}
      AND o."createdAt" < ${range.current.lt}
    GROUP BY day
    ORDER BY day ASC
  `);

  const rowsByDay = new Map(rows.map((row) => [row.day, row]));
  const points: KpiSeriesPoint[] = [];
  const includedDays = new Set<string>();

  for (let timestamp = range.current.gte.getTime(); timestamp < range.current.lt.getTime(); timestamp += DAY_MS) {
    const date = new Date(timestamp);
    const day = MSK_DAY_KEY.format(date);

    if (includedDays.has(day)) continue;

    includedDays.add(day);
    const row = rowsByDay.get(day);
    const revenue = row?.revenue ?? 0;
    const orders = row?.orders ?? 0;

    points.push({
      label: MSK_DAY_LABEL.format(date),
      revenue,
      orders,
      avgOrder: orders > 0 ? Math.round(revenue / orders) : 0,
    });
  }

  return points;
}

export async function getRevenueSeries(
  db: Db = defaultPrisma,
  range: ResolvedPeriod,
): Promise<{ label: string; revenue: number }[]> {
  const rows = await db.$queryRaw<{ day: string; revenue: number }[]>(Prisma.sql`
    SELECT to_char(date_trunc('day', o."createdAt" AT TIME ZONE 'Europe/Moscow'), 'YYYY-MM-DD') AS day,
           SUM(o."totalAmount")::int AS revenue
    FROM "Order" o
    WHERE o.status::text <> 'CANCELLED'
      AND o."createdAt" >= ${range.current.gte} AND o."createdAt" < ${range.current.lt}
    GROUP BY day
  `);

  // Полный ряд дней current-окна (по МСК-суткам), пустые → 0.
  const dayKeys: { key: string; label: string }[] = [];
  for (let t = range.current.gte.getTime(); t < range.current.lt.getTime(); t += DAY_MS) {
    const d = new Date(t);
    dayKeys.push({ key: MSK_DAY_KEY.format(d), label: MSK_DAY_LABEL.format(d) });
  }
  // Окно [gte, lt) не выравнено по MSK-полуночи → MSK-день самого lt (текущий частичный день)
  // не попадает в цикл. Добавляем его, иначе сегодняшняя выручка молча теряется на графике.
  const ltKey = MSK_DAY_KEY.format(range.current.lt);
  if (!dayKeys.some((d) => d.key === ltKey)) {
    dayKeys.push({ key: ltKey, label: MSK_DAY_LABEL.format(range.current.lt) });
  }
  return fillRevenueSeries(dayKeys, rows);
}

// ── Best sellers by revenue (period) ──

export type BestSeller = {
  productId: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  units: number;
  revenue: number;
  availableStock: number;
};

export type AdminCategorySummary = {
  categoryId: string;
  name: string;
  value: number;
  sharePct: number;
};

export async function getAdminCategoryDistribution(
  db: Db = defaultPrisma,
  range: ResolvedPeriod,
): Promise<AdminCategorySummary[]> {
  const rows = await db.$queryRaw<{ category_id: string | null; name: string | null; value: number }[]>(Prisma.sql`
    WITH category_sales AS (
      SELECT c.id AS category_id,
             c.name,
             SUM(oi."lineTotal")::int AS value
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      LEFT JOIN "Sku" s ON s.id = oi."skuId"
      LEFT JOIN "ProductVariant" pv ON pv.id = oi."productVariantId"
      LEFT JOIN "ProductColorway" pc ON pc.id = pv."colorwayId"
      LEFT JOIN "Product" p ON p.id = COALESCE(s."productId", pc."productId")
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE o.status::text <> 'CANCELLED'
        AND o."createdAt" >= ${range.current.gte} AND o."createdAt" < ${range.current.lt}
      GROUP BY c.id, c.name
    )
    SELECT c.id AS category_id,
           c.name,
           COALESCE(cs.value, 0)::int AS value,
           c."sortOrder" AS sort_order
    FROM "Category" c
    LEFT JOIN category_sales cs ON cs.category_id = c.id
    UNION ALL
    SELECT cs.category_id,
           cs.name,
           cs.value,
           2147483647 AS sort_order
    FROM category_sales cs
    WHERE cs.category_id IS NULL
    ORDER BY value DESC, sort_order ASC, name ASC
  `);

  const normalized = rows.map((row) => ({
    categoryId: row.category_id ?? '__unresolved__',
    name: row.name ?? 'Нераспределено',
    value: Number(row.value) || 0,
  }));
  const total = normalized.reduce((sum, row) => sum + row.value, 0);
  if (total === 0) {
    return [];
  }

  const positive = normalized.filter((row) => row.value > 0);
  let top = positive.filter((row) => row.categoryId !== '__unresolved__').slice(0, 4);
  const visibleIds = new Set(top.map((row) => row.categoryId));
  const remainder = positive
    .filter((row) => row.categoryId === '__unresolved__' || !visibleIds.has(row.categoryId))
    .reduce((sum, row) => sum + row.value, 0);
  if (remainder > 0) top.push({ categoryId: 'other', name: 'Другое', value: remainder });

  const allocateShares = (items: typeof top) => {
    const rawShares = items.map((row) => (row.value / total) * 100);
    const shares = rawShares.map((share) => Math.floor(share));
    let allocatedRemainder = 100 - shares.reduce((sum, share) => sum + share, 0);
    const byLargestRemainder = rawShares
      .map((share, index) => ({ index, fraction: share - Math.floor(share) }))
      .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
    for (const { index } of byLargestRemainder) {
      if (allocatedRemainder <= 0) break;
      shares[index] += 1;
      allocatedRemainder -= 1;
    }
    return shares;
  };

  let shares = allocateShares(top);
  const zeroShareValue = top.reduce(
    (sum, row, index) => sum + (shares[index] === 0 && row.categoryId !== 'other' ? row.value : 0),
    0,
  );
  if (zeroShareValue > 0) {
    const visible = top.filter((row, index) => shares[index] > 0 || row.categoryId === 'other');
    const other = visible.find((row) => row.categoryId === 'other');
    if (other) {
      other.value += zeroShareValue;
    } else {
      visible.push({ categoryId: 'other', name: 'Другое', value: zeroShareValue });
    }
    top = visible;
    shares = allocateShares(top);

    const otherIndex = top.findIndex((row) => row.categoryId === 'other');
    const donorIndex = shares.findIndex((share, index) => index !== otherIndex && share > 1);
    if (otherIndex >= 0 && shares[otherIndex] === 0 && donorIndex >= 0) {
      shares[otherIndex] = 1;
      shares[donorIndex] -= 1;
    }
  }

  return top.map((row, index) => ({ ...row, sharePct: shares[index] }));
}

export async function getAdminFunnelProjection(
  db: Db = defaultPrisma,
  range: ResolvedPeriod,
): Promise<AdminFunnelProjection> {
  const currentCreatedAt = { gte: range.current.gte, lt: range.current.lt };
  const previousCreatedAt = { gte: range.previous.gte, lt: range.previous.lt };
  const nonCancelled = { not: 'CANCELLED' as OrderStatus };
  const [carts, previousCarts, orders, previousOrders, paid, shipped, completed] = await Promise.all([
    db.cart.count({ where: { createdAt: currentCreatedAt } }),
    db.cart.count({ where: { createdAt: previousCreatedAt } }),
    db.order.count({ where: { createdAt: currentCreatedAt, status: nonCancelled } }),
    db.order.count({ where: { createdAt: previousCreatedAt, status: nonCancelled } }),
    db.order.count({
      where: { createdAt: currentCreatedAt, status: nonCancelled, payment: { is: { status: 'succeeded' } } },
    }),
    db.order.count({ where: { createdAt: currentCreatedAt, status: { in: ['SHIPPED', 'DELIVERED'] } } }),
    db.order.count({ where: { createdAt: currentCreatedAt, status: 'DELIVERED' } }),
  ]);

  const conversion = carts === 0 ? null : Math.round((orders / carts) * 1000) / 10;
  const previousConversion = previousCarts === 0 ? null : Math.round((previousOrders / previousCarts) * 1000) / 10;
  const conversionDelta =
    conversion === null || previousConversion === null ? null : Math.round((conversion - previousConversion) * 10) / 10;

  return { carts, orders, paid, shipped, completed, conversion, conversionDelta };
}

export async function getBestSellers(db: Db = defaultPrisma, range: ResolvedPeriod): Promise<BestSeller[]> {
  const rows = await db.$queryRaw<
    { product_id: string; name: string; brand: string; units: number; revenue: number }[]
  >(Prisma.sql`
    SELECT p.id AS product_id, p.name, p.brand,
           SUM(oi.quantity)::int AS units,
           SUM(oi."lineTotal")::int AS revenue
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    LEFT JOIN "Sku" s ON s.id = oi."skuId"
    LEFT JOIN "ProductVariant" pv ON pv.id = oi."productVariantId"
    LEFT JOIN "ProductColorway" pc ON pc.id = pv."colorwayId"
    JOIN "Product" p ON p.id = COALESCE(s."productId", pc."productId")
    WHERE o.status::text <> 'CANCELLED'
      AND o."createdAt" >= ${range.current.gte} AND o."createdAt" < ${range.current.lt}
    GROUP BY p.id, p.name, p.brand
    ORDER BY revenue DESC
    LIMIT 5
  `);

  if (rows.length === 0) return [];

  // Фото — добивка через default-colorway первой картинкой.
  const products = await db.product.findMany({
    where: { id: { in: rows.map((r) => r.product_id) } },
    select: {
      id: true,
      media: {
        where: { kind: 'IMAGE' },
        take: 1,
        orderBy: { sortOrder: 'asc' },
        select: { url: true },
      },
      colorways: {
        where: { isDefault: true },
        take: 1,
        select: { images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } },
      },
      skus: { where: { active: true }, select: { stock: true } },
    },
  });
  const imageByProduct = new Map<string, string | null>();
  const stockByProduct = new Map<string, number>();
  for (const prod of products) {
    imageByProduct.set(prod.id, prod.media[0]?.url ?? prod.colorways[0]?.images[0]?.url ?? null);
    stockByProduct.set(prod.id, prod.skus.reduce((sum, sku) => sum + sku.stock, 0));
  }

  return rows.map((r) => ({
    productId: r.product_id,
    name: r.name,
    brand: r.brand,
    imageUrl: imageByProduct.get(r.product_id) ?? null,
    units: r.units,
    revenue: r.revenue,
    availableStock: stockByProduct.get(r.product_id) ?? 0,
  }));
}

// ── Low stock (current state) ──

export type LowStockRow = {
  id: string;
  productName: string;
  colorwayName: string;
  size: string;
  sku: string;
  stock: number;
  tier: 'critical' | 'warning';
};

export async function getLowStock(db: Db = defaultPrisma): Promise<LowStockRow[]> {
  const rows = await getAdminLowStockSkus(db, DASHBOARD_LOW_STOCK_LIMIT);
  return rows.map((row) => {
    const labels = row.combinationLabel === 'Configuration' ? [] : row.combinationLabel.split(' · ');
    return {
      id: row.skuId,
      productName: row.productName,
      colorwayName: labels[0] ?? 'Configuration',
      size: labels.slice(1).join(' · ') || '—',
      sku: row.articleNumber,
      stock: row.stock,
      tier: classifyStockTier(row.stock),
    } satisfies LowStockRow;
  });
}

// ── Recent orders (current state) ──

export type RecentOrderRow = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: string | null;
  totalAmount: number;
  createdAt: Date;
  contactName: string;
  email: string | null;
  itemCount: number;
  productName: string | null;
  imageUrl: string | null;
  shippingMethod?: string | null;
  deliveryDate?: Date | null;
};

export async function getRecentOrders(db: Db = defaultPrisma): Promise<RecentOrderRow[]> {
  const orders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: DASHBOARD_RECENT_ORDERS_LIMIT,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      contactName: true,
      shippingMethod: true,
      deliveryDate: true,
      payment: { select: { status: true } },
      user: { select: { email: true } },
      items: {
        orderBy: { id: 'asc' },
        select: { productName: true, imageUrl: true, quantity: true },
      },
    },
  });
  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.payment?.status ?? null,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt,
    contactName: o.contactName,
    email: o.user?.email ?? null,
    itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
    productName: o.items[0]?.productName ?? null,
    imageUrl: o.items[0]?.imageUrl ?? null,
    shippingMethod: o.shippingMethod,
    deliveryDate: o.deliveryDate,
  }));
}

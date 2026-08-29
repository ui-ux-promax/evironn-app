import type {
  AdminCategorySummary,
  AdminFunnelProjection,
  BestSeller,
  DashboardKpis,
  KpiSeriesPoint,
  RecentOrderRow,
  Trend,
} from '@/lib/admin/analytics';
import { formatDate, formatPrice } from '@/lib/format';
import { ORDER_STATUS_META, orderStatusView } from '@/lib/order';
import { paymentStatusView } from '@/lib/order-admin';
import type {
  DashboardReferenceModel,
  DashboardReferenceStatus,
  DashboardReferenceTone,
} from './dashboard-reference-model';

type DashboardReferenceAdapterInput = {
  period: 7 | 30 | 90;
  kpis: DashboardKpis;
  kpiSeries: KpiSeriesPoint[];
  funnel: AdminFunnelProjection | null;
  bestSellers: BestSeller[];
  categoryDistribution: AdminCategorySummary[] | null;
  recentOrders: RecentOrderRow[];
};

const COUNT = new Intl.NumberFormat('ru-RU', { useGrouping: true });

function formatCount(value: number): string {
  return COUNT.format(value).replace(/[\u202f\u00a0]/g, ' ');
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
}

function formatTrend(trend: Trend): string | null {
  if (trend.pct === null || trend.pct === 0) return null;
  return `${trend.pct > 0 ? '+' : ''}${formatPercent(trend.pct)}`;
}

function toneFromBadge(badge: string): DashboardReferenceTone {
  if (badge.includes('success')) return 'success';
  if (badge.includes('warning')) return 'warning';
  if (badge.includes('danger')) return 'danger';
  return 'info';
}

function categoryIcon(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes('диван')) return 'weekend';
  if (normalized.includes('стол')) return 'table_restaurant';
  if (normalized.includes('свет') || normalized.includes('ламп')) return 'light';
  return 'chair';
}

function fulfillmentStatus(row: RecentOrderRow): DashboardReferenceStatus {
  if (row.status === 'CANCELLED') return { label: ORDER_STATUS_META.CANCELLED.label, tone: 'danger' };
  if (row.status === 'DELIVERED') return { label: ORDER_STATUS_META.DELIVERED.label, tone: 'success' };
  if (row.status === 'SHIPPED') return { label: ORDER_STATUS_META.SHIPPED.label, tone: 'info' };
  return { label: '—', tone: 'neutral' };
}

function mapOrder(row: RecentOrderRow): DashboardReferenceModel['orders'][number] {
  const order = orderStatusView(row.status, row.paymentStatus);
  const payment = paymentStatusView(row.paymentStatus);
  return {
    id: row.id,
    href: `/admin/orders/${row.id}`,
    number: `№${row.orderNumber}`,
    date: formatDate(row.createdAt),
    customer: row.contactName,
    email: row.email,
    products: [{ name: row.productName ?? '—', imageUrl: row.imageUrl }],
    overflowCount: Math.max(0, row.itemCount - 1),
    itemCount: row.itemCount,
    total: formatPrice(row.totalAmount),
    orderStatus: { label: order.label, tone: toneFromBadge(order.badge) },
    paymentStatus: { label: payment.label, tone: toneFromBadge(payment.badge) },
    fulfillmentStatus: fulfillmentStatus(row),
  };
}

function mapFunnel(funnel: AdminFunnelProjection | null): DashboardReferenceModel['funnel'] {
  if (!funnel) {
    return {
      stages: [
        ['carts', 'shopping_cart', 'Добавлено в корзину'],
        ['checkout', 'credit_card', 'Оформлено'],
        ['paid', 'payments', 'Оплачено'],
        ['shipped', 'local_shipping', 'В пути'],
        ['completed', 'check_circle', 'Выполненные'],
      ].map(([id, icon, label]) => ({ id, icon, label, value: '—' })),
      footerLabel: 'Конверсия в заказ',
      footerValue: '—',
      footerTrend: null,
    };
  }

  return {
    stages: [
      { id: 'carts', icon: 'shopping_cart', label: 'Добавлено в корзину', value: formatCount(funnel.carts) },
      { id: 'checkout', icon: 'credit_card', label: 'Оформлено', value: formatCount(funnel.orders) },
      { id: 'paid', icon: 'payments', label: 'Оплачено', value: formatCount(funnel.paid) },
      { id: 'shipped', icon: 'local_shipping', label: 'В пути', value: formatCount(funnel.shipped) },
      { id: 'completed', icon: 'check_circle', label: 'Выполненные', value: formatCount(funnel.completed) },
    ],
    footerLabel: 'Конверсия в заказ',
    footerValue: funnel.conversion === null ? '—' : formatPercent(funnel.conversion),
    footerTrend: funnel.conversionDelta === null ? null : formatTrend({ pct: funnel.conversionDelta, dir: 'flat' }),
  };
}

export function createDashboardReferenceModel(input: DashboardReferenceAdapterInput): DashboardReferenceModel {
  const categories = (input.categoryDistribution ?? []).filter((category) => category.categoryId !== 'other');
  const other = (input.categoryDistribution ?? []).find((category) => category.categoryId === 'other') ?? null;
  const funnel = mapFunnel(input.funnel);

  return {
    period: input.period,
    revenue: {
      label: 'Выручка',
      value: formatPrice(input.kpis.revenue.value),
      trend: formatTrend(input.kpis.revenue.trend),
    },
    kpis: [
      {
        id: 'orders',
        icon: 'shopping_cart',
        label: 'Заказы',
        value: formatCount(input.kpis.orders.value),
        trend: formatTrend(input.kpis.orders.trend),
      },
      {
        id: 'average',
        icon: 'sell',
        label: 'Средний чек',
        value: formatPrice(input.kpis.avgOrder.value),
        trend: formatTrend(input.kpis.avgOrder.trend),
      },
      {
        id: 'conversion',
        icon: 'trending_up',
        label: 'Конверсия',
        value: input.funnel?.conversion === null || !input.funnel ? '—' : formatPercent(input.funnel.conversion),
        trend:
          input.funnel?.conversionDelta === null || !input.funnel
            ? null
            : formatTrend({ pct: input.funnel.conversionDelta, dir: 'flat' }),
      },
    ],
    revenueSeries: input.kpiSeries.map((point) => ({ label: point.label, value: point.revenue })),
    funnel,
    inventory: input.bestSellers.slice(0, 4).map((product) => ({
      id: product.productId,
      name: product.name,
      imageUrl: product.imageUrl,
      availability: product.availableStock > 0 ? 'В наличии' : 'Нет в наличии',
      stock: formatCount(product.availableStock),
      href: `/admin/catalog/products/${product.productId}`,
    })),
    categories: categories.slice(0, 4).map((category) => ({
      id: category.categoryId,
      name: category.name,
      icon: categoryIcon(category.name),
      share: category.sharePct,
    })),
    categoryOther: other ? { label: other.name, share: other.sharePct } : null,
    orders: input.recentOrders.slice(0, 4).map(mapOrder),
  };
}

import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { formatPrice } from '@/lib/format';
import type {
  AdminCatalogKpis,
  AdminLowStockSku,
  BestSeller,
  DashboardKpis,
  KpiSeriesPoint,
  RecentOrderRow,
  StatusDistribution,
} from '@/lib/admin/analytics';
import { BestSellers } from './best-sellers';
import { KpiCard } from './kpi-card';
import { LowStock } from './low-stock';
import { PeriodToggle } from './period-toggle';
import { RecentOrders } from './recent-orders';
import { RevenueChart } from './revenue-chart';
import { StatusDonut } from './status-donut';

export type AdminDashboardViewProps = {
  user: { name?: string | null; email?: string | null; image?: string | null };
  periodLabel: string;
  kpis: DashboardKpis;
  kpiSeries: KpiSeriesPoint[];
  statusDist: StatusDistribution;
  bestSellers: BestSeller[];
  lowStock: AdminLowStockSku[];
  recentOrders: RecentOrderRow[];
  catalog: AdminCatalogKpis;
  pendingPayments: number;
};

export function DashboardView({
  user,
  periodLabel,
  kpis,
  kpiSeries,
  statusDist,
  bestSellers,
  lowStock,
  recentOrders,
  catalog,
  pendingPayments,
}: AdminDashboardViewProps) {
  const processingOrders = statusDist.segments.find((segment) => segment.status === 'PROCESSING')?.count ?? 0;
  const cancelledOrders = statusDist.segments.find((segment) => segment.status === 'CANCELLED')?.count ?? 0;
  const hasRevenue = kpiSeries.some((point) => point.revenue > 0);
  const chartPeak = kpiSeries.reduce((peak, point) => (point.revenue > peak.revenue ? point : peak), {
    label: '',
    revenue: 0,
  });

  return (
    <div data-testid="admin-dashboard" className="space-y-[24px]">
      <AdminPageHeader
        kicker="Главная страница"
        title="Дашборд магазина"
        subtitle="Операционный обзор Evironn: продажи, заказы, остатки и мебель, которая требует внимания сегодня."
        searchPlaceholder="Поиск заказов, клиентов, товаров"
        afterSearch={<DashboardUser user={user} />}
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          tone="revenue"
          label="Выручка за период"
          value={formatPrice(kpis.revenue.value)}
          trend={kpis.revenue.trend}
          series={kpiSeries.map(({ revenue }) => revenue)}
        />
        <KpiCard
          tone="orders"
          label="Заказы"
          value={String(kpis.orders.value)}
          trend={kpis.orders.trend}
          series={kpiSeries.map(({ orders }) => orders)}
        />
        <KpiCard
          tone="average"
          label="Средний чек"
          value={formatPrice(kpis.avgOrder.value)}
          trend={kpis.avgOrder.trend}
          series={kpiSeries.map(({ avgOrder }) => avgOrder)}
        />
        <KpiCard
          tone="orders"
          label="Активные товары"
          value={String(catalog.activeProducts)}
          trend={{ pct: null, dir: 'up' }}
          series={[catalog.activeProducts]}
        />
        <KpiCard
          tone="average"
          label="Всего SKU"
          value={String(catalog.totalSkus)}
          trend={{ pct: null, dir: 'up' }}
          series={[catalog.totalSkus]}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[24px] xl:grid-cols-[minmax(0,1.62fr)_minmax(330px,.96fr)]">
        <AdminPanel
          title="Продажи по дням"
          note={periodLabel}
          actions={<PeriodToggle />}
          className="min-h-[346px] rounded-[28px] p-6"
        >
          {hasRevenue ? (
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-[13px]">
                <div className="font-admin-head text-[clamp(36px,3vw,50px)] font-extrabold leading-none tracking-[-.06em] text-admin-on-surface tabular-nums">
                  {formatPrice(kpis.revenue.value)}
                </div>
                <span className="inline-flex min-h-8 items-center rounded-full bg-[#15d3a2]/15 px-[11px] text-[13px] font-extrabold text-[#138663]">
                  {kpis.revenue.trend.pct === null
                    ? 'новое'
                    : `${kpis.revenue.trend.pct > 0 ? '+' : ''}${kpis.revenue.trend.pct}%`}
                </span>
              </div>
              <RevenueChart data={kpiSeries.map(({ label, revenue }) => ({ label, revenue }))} />
              {chartPeak.revenue > 0 && (
                <div className="absolute left-[44%] top-[24%] inline-flex min-h-8 items-center rounded-full bg-[#15d3a2] px-3 text-[12px] font-extrabold text-[#10211c] shadow-[0_14px_30px_rgb(21_211_162_/_0.22)] tabular-nums">
                  {chartPeak.label} · {formatPrice(chartPeak.revenue)}
                </div>
              )}
            </div>
          ) : (
            <EmptyState>Продаж за период нет.</EmptyState>
          )}
        </AdminPanel>

        <div className="grid min-w-0 gap-[24px]">
          <AdminPanel title="Статусы заказов" note="Доля заказов по статусам" className="rounded-[32px] p-6">
            <StatusDonut segments={statusDist.segments} total={statusDist.total} />
          </AdminPanel>
          <AdminPanel title="Операции" note="Что нужно закрыть до конца дня" className="rounded-[32px] p-6">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="К сборке" value={processingOrders} />
              <Metric label="Отменены" value={cancelledOrders} />
              <Metric label="Мало остатков" value={catalog.lowStockSkus} />
              <Metric label="Ожидают оплаты" value={pendingPayments} />
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[24px] xl:grid-cols-2">
        <AdminPanel
          title="Каталог и остатки"
          note="Состояние мебели, SKU и складских запасов"
          className="rounded-[32px] p-6"
        >
          {catalog.activeProducts === 0 && catalog.totalSkus === 0 ? (
            <EmptyState>Каталог пока пуст.</EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Активные SKU" value={catalog.activeSkus} />
              <Metric label="Низкие остатки" value={catalog.lowStockSkus} />
              <Metric label="Нет в наличии" value={catalog.outOfStockSkus} />
              <Metric label="Комнаты" value={catalog.rooms} />
            </div>
          )}
        </AdminPanel>
        <AdminPanel
          title="Категории и 360°"
          note="Покрытие категорий интерактивным обзором"
          className="rounded-[32px] p-6"
        >
          {catalog.categories === 0 && catalog.rooms === 0 ? (
            <EmptyState>Категории и комнаты пока не настроены.</EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="Категории" value={catalog.categories} />
              <Metric label="С 360°" value={catalog.turntableBoundCategories} />
              <Metric label="Покрытие" value={`${Math.round(catalog.turntableCoverageRatio * 100)}%`} />
            </div>
          )}
        </AdminPanel>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-[24px] xl:grid-cols-[minmax(300px,.82fr)_minmax(0,1.38fr)]">
        <LowStock rows={lowStock} />
        <BestSellers items={bestSellers} />
        <RecentOrders rows={recentOrders} />
      </div>
    </div>
  );
}

function DashboardUser({ user }: { user: AdminDashboardViewProps['user'] }) {
  const displayName = user.name ?? user.email ?? 'Admin';
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="hidden min-w-[174px] items-center gap-[10px] lg:flex">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="" className="h-[46px] w-[46px] rounded-[15px] object-cover" />
      ) : (
        <div className="grid h-[46px] w-[46px] place-items-center rounded-[15px] bg-admin-surface-low font-extrabold text-admin-on-surface">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <strong className="block truncate leading-[1.1] text-admin-on-surface">{displayName}</strong>
        {user.email && (
          <span className="mt-0.5 block truncate text-[12px] text-admin-on-surface-variant">{user.email}</span>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[18px] border border-admin-outline-variant bg-admin-surface p-4 shadow-[var(--admin-shadow-tight)]">
      <span className="text-[12px] font-bold text-admin-on-surface-variant">{label}</span>
      <strong className="mt-2 block font-admin-head text-[25px] font-extrabold leading-none tracking-[-.045em] text-admin-on-surface tabular-nums">
        {value}
      </strong>
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <p className="rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-8 text-center text-sm font-bold text-admin-on-surface-variant">
      {children}
    </p>
  );
}

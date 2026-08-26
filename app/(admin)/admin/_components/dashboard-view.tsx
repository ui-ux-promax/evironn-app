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
import { DashboardKpiCard } from './dashboard-kpi-card';
import { PeriodToggle } from './period-toggle';
import { RecentOrders } from './recent-orders';
import { RevenueChart } from './revenue-chart';
import { StatusDonut } from './status-donut';
import styles from './dashboard-view.module.css';

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
  periodLabel,
  kpis,
  kpiSeries,
  statusDist,
  bestSellers,
  recentOrders,
}: AdminDashboardViewProps) {
  const cancelledOrders = statusDist.segments.find((segment) => segment.status === 'CANCELLED')?.count ?? 0;
  const hasRevenue = kpiSeries.some((point) => point.revenue > 0);
  const chartPeak = kpiSeries.reduce((peak, point) => (point.revenue > peak.revenue ? point : peak), {
    label: '',
    revenue: 0,
  });

  return (
    <div data-testid="admin-dashboard" className={styles.dashboard}>
      <header className={styles.head}>
        <div className={styles.headBody}>
          <p className={styles.eyebrow}>Обзор</p>
          <h1 className={styles.title}>Сводка смены</h1>
          <p className={styles.lede}>Всё, что нужно держать в поле зрения: деньги, очередь заказов и остатки.</p>
        </div>
        <PeriodToggle />
      </header>

      <div className={styles.kpis}>
        <DashboardKpiCard
          id="revenue"
          label="Выручка"
          value={formatPrice(kpis.revenue.value)}
          trend={kpis.revenue.trend}
          note={periodLabel}
        />
        <DashboardKpiCard
          id="orders"
          label="Заказы"
          value={String(kpis.orders.value)}
          trend={kpis.orders.trend}
          note="без отменённых"
        />
        <DashboardKpiCard
          id="average"
          label="Средний чек"
          value={formatPrice(kpis.avgOrder.value)}
          trend={kpis.avgOrder.trend}
          note="без отменённых"
        />
        <DashboardKpiCard
          id="cancellations"
          label="Отмены"
          value={String(cancelledOrders)}
          note="по статусам заказов"
        />
      </div>

      <div className={styles.bento}>
        <AdminPanel
          title="Выручка по дням"
          note={periodLabel}
          className={`${styles.panel} ${styles.wide} ${styles.chartPanel}`}
        >
          {hasRevenue ? (
            <div className="relative">
              <div className="mb-4 flex flex-wrap items-center gap-[13px]">
                <strong className="font-admin-head text-[clamp(36px,3vw,50px)] font-extrabold leading-none tracking-[-.06em] text-admin-on-surface tabular-nums">
                  {formatPrice(kpis.revenue.value)}
                </strong>
                <span className="inline-flex min-h-8 items-center rounded-full bg-[color-mix(in_srgb,var(--admin-money)_12%,transparent)] px-[11px] text-[13px] font-extrabold text-[var(--admin-money)]">
                  {kpis.revenue.trend.pct === null
                    ? 'новое'
                    : `${kpis.revenue.trend.pct > 0 ? '+' : ''}${kpis.revenue.trend.pct}%`}
                </span>
              </div>
              <RevenueChart data={kpiSeries.map(({ label, revenue }) => ({ label, revenue }))} />
              {chartPeak.revenue > 0 && (
                <div className="absolute left-[44%] top-[24%] inline-flex min-h-8 items-center rounded-full bg-[var(--admin-money)] px-3 text-[12px] font-extrabold text-white shadow-[var(--admin-shadow-tight)] tabular-nums">
                  {chartPeak.label} · {formatPrice(chartPeak.revenue)}
                </div>
              )}
            </div>
          ) : (
            <EmptyState>Продаж за период нет.</EmptyState>
          )}
        </AdminPanel>

        <AdminPanel title="Статусы" note="Разбивка очереди" className={styles.panel}>
          <StatusDonut segments={statusDist.segments} total={statusDist.total} />
        </AdminPanel>

        <BestSellers items={bestSellers} className={styles.panel} />
        <RecentOrders rows={recentOrders} className={`${styles.panel} ${styles.wide}`} />
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className={styles.empty}>{children}</p>;
}

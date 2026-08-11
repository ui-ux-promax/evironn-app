import { KpiCard } from '@/app/(admin)/admin/_components/kpi-card';
import { formatPrice } from '@/lib/format';

export function DemoKpiGrid({
  kpis,
}: {
  kpis: { revenue: number; orders: number; averageOrder: number; conversion: number };
}) {
  return (
    <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3">
      <KpiCard
        tone="revenue"
        label="Выручка за период"
        value={formatPrice(kpis.revenue)}
        trend={{ dir: 'up', pct: 12 }}
        series={[48200, 63100, 57400, 79900, 88620, 91200, 57800]}
      />
      <KpiCard
        tone="orders"
        label="Заказы"
        value={String(kpis.orders)}
        trend={{ dir: 'up', pct: 8 }}
        series={[7, 9, 8, 11, 13, 10, 6]}
      />
      <KpiCard
        tone="average"
        label="Средний чек"
        value={formatPrice(kpis.averageOrder)}
        trend={{ dir: 'flat', pct: 0 }}
        series={[7200, 7600, 7310, 8020, 7880, 7990, 7599]}
      />
    </div>
  );
}

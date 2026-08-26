import type { DemoKpi } from '@/lib/demo-admin/types';

type LegacyKpis = { revenue: number; orders: number; averageOrder: number; conversion: number };

function normalizeKpis(kpis: readonly DemoKpi[] | LegacyKpis): readonly DemoKpi[] {
  if (Array.isArray(kpis)) return kpis;
  const legacyKpis = kpis as LegacyKpis;
  return [
    { id: 'revenue', label: 'Выручка за период', value: String(legacyKpis.revenue), detail: 'Синтетический срез' },
    { id: 'orders', label: 'Заказы', value: String(legacyKpis.orders), detail: 'Синтетический срез' },
    { id: 'average-order', label: 'Средний чек', value: String(legacyKpis.averageOrder), detail: 'Синтетический срез' },
  ];
}

export function DemoKpiGrid({ kpis }: { kpis: readonly DemoKpi[] | LegacyKpis }) {
  return (
    <div className="demo-admin-kpi-grid">
      {normalizeKpis(kpis).map((kpi) => (
        <article className="demo-admin-kpi" key={kpi.id}>
          <span className="demo-admin-kpi-label">{kpi.label}</span>
          <strong className="demo-admin-kpi-value">{kpi.value}</strong>
          <span className="demo-admin-kpi-detail">{kpi.detail}</span>
        </article>
      ))}
    </div>
  );
}

import type { Trend } from '@/lib/admin/analytics';
import styles from './dashboard-view.module.css';

export function DashboardKpiCard({
  label,
  value,
  trend,
  note,
  id,
}: {
  label: string;
  value: string;
  trend?: Trend;
  note: string;
  id: string;
}) {
  return (
    <article data-testid="admin-kpi" data-kpi={id} className={styles.kpi}>
      <p className={styles.kpiLabel}>{label}</p>
      <strong className={styles.kpiValue}>{value}</strong>
      <div className={styles.kpiFoot}>
        {trend ? <TrendBadge trend={trend} /> : <span className={styles.trend}>По статусам</span>}
        <span className={styles.kpiNote}>{note}</span>
      </div>
    </article>
  );
}

function TrendBadge({ trend }: { trend: Trend }) {
  const label =
    trend.pct === null
      ? 'новое'
      : trend.dir === 'flat'
        ? 'без изменений'
        : `${trend.dir === 'up' ? '+' : '−'}${trend.pct}%`;

  return <span className={`${styles.trend} ${trend.dir === 'down' ? styles.trendDown : ''}`}>{label}</span>;
}

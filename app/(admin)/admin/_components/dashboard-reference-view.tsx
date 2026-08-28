import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Icon } from '@/components/admin/icon';
import type {
  DashboardReferenceCategory,
  DashboardReferenceModel,
  DashboardReferenceOrder,
  DashboardReferenceStatus,
} from './dashboard-reference-model';
import styles from './dashboard-reference-view.module.css';

export function DashboardReferenceView({ model }: { model: DashboardReferenceModel }) {
  return (
    <main data-testid="admin-dashboard-reference" data-period={model.period} className={styles.dashboard}>
      <div className={styles.grid}>
        <section data-testid="reference-sales-panel" className={`${styles.panel} ${styles.salesPanel}`}>
          <PanelHeader title="Показатели продаж" action={<PeriodControl period={model.period} />} />
          <div className={styles.salesSummary}>
            <div className={styles.revenue}>
              <span>{model.revenue.label}</span>
              <strong>{model.revenue.value}</strong>
              {model.revenue.trend ? <small>{model.revenue.trend}</small> : null}
            </div>
            <div className={styles.kpis}>
              {model.kpis.slice(0, 3).map((kpi) => (
                <article key={kpi.id} data-testid="reference-kpi" className={styles.kpi}>
                  <Icon name={kpi.icon} aria-hidden="true" />
                  <div>
                    <span>{kpi.label}</span>
                    <p>
                      <strong>{kpi.value}</strong>
                      {kpi.trend ? <small>{kpi.trend}</small> : null}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <RevenueChart data={model.revenueSeries} />
        </section>

        <section className={`${styles.panel} ${styles.funnelPanel}`}>
          <PanelHeader title="Заказы (воронка)" />
          <ol data-testid="reference-funnel-animation" className={styles.funnel}>
            {model.funnel.stages.slice(0, 5).map((stage, index) => (
              <li key={stage.id} className={styles.funnelRow}>
                <div
                  data-testid="reference-funnel-stage"
                  className={`${styles.funnelStage} ${styles.funnelStageAnimated}`}
                  data-stage={stage.id}
                  style={{ '--stage-inset': `${index * 4}%` } as CSSProperties}
                >
                  <Icon name={stage.icon} aria-hidden="true" />
                  <span>{stage.label}</span>
                  <strong>{stage.value}</strong>
                </div>
                {index < 4 ? (
                  <i className={`${styles.funnelArrow} ${styles.funnelArrowAnimated}`} aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>
          <div className={`${styles.funnelFooter} ${styles.funnelFooterAnimated}`}>
            <span>{model.funnel.footerLabel}</span>
            <p>
              <strong>{model.funnel.footerValue}</strong>
              {model.funnel.footerTrend ? <small>{model.funnel.footerTrend}</small> : null}
            </p>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.inventoryPanel}`}>
          <PanelHeader title="Товары на складе" action={<PanelLink href="/admin/catalog/products" />} />
          <div className={styles.inventoryGrid}>
            {model.inventory.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                data-testid="reference-inventory-card"
                className={styles.inventoryCard}
              >
                <span className={styles.inventoryImage}>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Icon name="chair" aria-hidden="true" />}
                </span>
                <strong>{item.name}</strong>
                <span className={styles.stockLine}>
                  <small>{item.availability}</small>
                  <b>{item.stock}</b>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.categoriesPanel}`}>
          <PanelHeader title="Популярные категории" action={<PanelLink href="/admin/catalog/categories" />} />
          <div className={styles.categoryGrid}>
            {model.categories.slice(0, 4).map((category) => (
              <CategoryRing key={category.id} category={category} />
            ))}
          </div>
          {model.categoryOther ? (
            <div className={styles.categoryOther}>
              <span>
                <i /> {model.categoryOther.label}
              </span>
              <strong>{model.categoryOther.share}%</strong>
            </div>
          ) : null}
        </section>

        <section className={`${styles.panel} ${styles.ordersPanel}`}>
          <PanelHeader title="Последние заказы" action={<PanelLink href="/admin/orders" />} />
          <OrdersTable rows={model.orders.slice(0, 4)} />
        </section>
      </div>
    </main>
  );
}

function PanelHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className={styles.panelHeader}>
      <h2>{title}</h2>
      {action}
    </header>
  );
}

function PanelLink({ href }: { href: string }) {
  return (
    <Link href={href} className={styles.panelLink}>
      Смотреть все
    </Link>
  );
}

function PeriodControl({ period }: { period: 7 | 30 | 90 }) {
  const labels = { 7: '7 дней', 30: 'Этот месяц', 90: '90 дней' } as const;
  return (
    <span className={styles.periodControl} aria-label={`Период: ${labels[period]}`}>
      {labels[period]}
      <Icon name="expand_more" aria-hidden="true" />
    </span>
  );
}

function RevenueChart({ data }: { data: DashboardReferenceModel['revenueSeries'] }) {
  const width = 760;
  const height = 196;
  const top = 18;
  const bottom = 28;
  const left = 56;
  const right = 8;
  const values = data.map((point) => point.value);
  const max = Math.max(1, ...values);
  const points = data.map((point, index) => ({
    ...point,
    x: left + (index / Math.max(1, data.length - 1)) * (width - left - right),
    y: top + (1 - point.value / max) * (height - top - bottom),
  }));
  const line = smoothPath(points);
  const area = points.length ? `${line} L ${points.at(-1)?.x} ${height - bottom} L ${left} ${height - bottom} Z` : '';

  return (
    <div data-testid="reference-revenue-chart" className={`${styles.chart} ${styles.chartAnimated}`}>
      <svg
        data-testid="reference-chart-animation"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Выручка по дням"
      >
        <defs>
          <linearGradient id="referenceRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--admin-money)" stopOpacity=".22" />
            <stop offset="100%" stopColor="var(--admin-money)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((row) => {
          const y = top + (row / 4) * (height - top - bottom);
          return <line key={row} x1={left} x2={width - right} y1={y} y2={y} className={styles.gridLine} />;
        })}
        {area ? <path d={area} className={styles.chartAreaAnimated} fill="url(#referenceRevenueFill)" /> : null}
        {line ? (
          <path
            d={line}
            className={`${styles.chartLine} ${styles.chartLineAnimated}`}
            data-testid="reference-revenue-curve"
          />
        ) : null}
        {points.map((point, index) =>
          visibleChartLabelIndexes(points.length).has(index) ? (
            <text
              key={point.label}
              data-testid="reference-chart-label"
              x={point.x}
              y={height - 7}
              textAnchor="middle"
              className={styles.axisText}
            >
              {point.label}
            </text>
          ) : null,
        )}
        {[60, 45, 30, 15, 0].map((value, row) => {
          const y = top + (row / 4) * (height - top - bottom) + 4;
          return (
            <text key={value} x={left - 12} y={y} textAnchor="end" className={styles.axisText}>
              {value === 0 ? '0 ₽' : `${value} тыс. ₽`}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function visibleChartLabelIndexes(length: number): Set<number> {
  if (length <= 7) return new Set(Array.from({ length }, (_, index) => index));

  const last = length - 1;
  const step = Math.ceil(last / 6);
  return new Set([...Array.from({ length: 6 }, (_, index) => index * step), last]);
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    const firstControl = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };
    const secondControl = {
      x: next.x - (after.x - current.x) / 6,
      y: next.y - (after.y - current.y) / 6,
    };
    path += ` C ${firstControl.x} ${firstControl.y}, ${secondControl.x} ${secondControl.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function CategoryRing({ category }: { category: DashboardReferenceCategory }) {
  return (
    <article className={styles.categoryItem}>
      <span
        data-testid="reference-category-ring"
        className={styles.categoryRing}
        style={{ '--share': `${Math.min(100, Math.max(0, category.share)) * 3.6}deg` } as CSSProperties}
      >
        <span>
          <Icon name={category.icon} aria-hidden="true" />
          <strong>{category.share}%</strong>
        </span>
      </span>
      <p>{category.name}</p>
    </article>
  );
}

function OrdersTable({ rows }: { rows: DashboardReferenceOrder[] }) {
  return (
    <div className={styles.tableScroll}>
      <table data-testid="reference-orders-table" className={styles.ordersTable}>
        <thead>
          <tr>
            <th>№ заказа</th>
            <th>Дата</th>
            <th>Клиент</th>
            <th>Товары</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Оплата</th>
            <th>Доставка</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <Link href={row.href}>{row.number}</Link>
              </td>
              <td>{row.date}</td>
              <td>{row.customer}</td>
              <td>
                <span className={styles.productStack}>
                  {row.products.slice(0, 3).map((product, index) => (
                    <span key={`${product.name}-${index}`} className={styles.productThumb}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" />
                      ) : (
                        <Icon name="chair" aria-hidden="true" />
                      )}
                    </span>
                  ))}
                  {row.overflowCount > 0 ? <b>+{row.overflowCount}</b> : null}
                </span>
              </td>
              <td className={styles.total}>{row.total}</td>
              <td>
                <StatusPill status={row.orderStatus} />
              </td>
              <td>
                <StatusPill status={row.paymentStatus} />
              </td>
              <td>
                <StatusPill status={row.fulfillmentStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }: { status: DashboardReferenceStatus }) {
  return (
    <span className={styles.status} data-tone={status.tone}>
      <i /> {status.label}
    </span>
  );
}

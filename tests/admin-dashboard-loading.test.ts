import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import DashboardLoading from '@/app/(admin)/admin/loading';

describe('admin dashboard loading state', () => {
  it('mirrors the live dashboard panel silhouettes', () => {
    const markup = renderToStaticMarkup(createElement(DashboardLoading));

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Загрузка…"');
    expect(markup).toContain('data-skeleton="dashboard-sales"');
    expect(markup).toContain('data-skeleton="dashboard-funnel"');
    expect(markup).toContain('data-skeleton="dashboard-inventory"');
    expect(markup).toContain('data-skeleton="dashboard-categories"');
    expect(markup).toContain('data-skeleton="dashboard-orders"');
    expect(markup.match(/data-skeleton="dashboard-kpi"/g)).toHaveLength(3);
    expect(markup.match(/data-skeleton="dashboard-funnel-stage"/g)).toHaveLength(5);
    expect(markup.match(/data-skeleton="dashboard-inventory-card"/g)).toHaveLength(4);
    expect(markup.match(/data-skeleton="dashboard-category"/g)).toHaveLength(4);
    expect(markup.match(/data-skeleton="dashboard-order-row"/g)).toHaveLength(4);
  });

  it('does not carry the retired dashboard layout contract', () => {
    const markup = renderToStaticMarkup(createElement(DashboardLoading));

    expect(markup).not.toContain('5 KPI');
    expect(markup).not.toContain('Топ продаж');
    expect(markup).not.toContain('Низкий сток');
    expect(markup).not.toContain('Покрытие 360°');
  });
});

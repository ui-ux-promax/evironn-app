import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { DashboardView, type AdminDashboardViewProps } from '@/app/(admin)/admin/_components/dashboard-view';

const emptyProjection: AdminDashboardViewProps = {
  user: { name: 'Admin', email: 'admin@example.com', image: null },
  periodLabel: 'Последние 30 дней, все каналы продаж',
  kpis: {
    revenue: { value: 0, trend: { pct: 0, dir: 'flat' } },
    orders: { value: 0, trend: { pct: 0, dir: 'flat' } },
    avgOrder: { value: 0, trend: { pct: 0, dir: 'flat' } },
    newCustomers: { value: 0, trend: { pct: 0, dir: 'flat' } },
    unitsSold: { value: 0, trend: { pct: 0, dir: 'flat' } },
  },
  kpiSeries: [],
  statusDist: { segments: [], total: 0 },
  bestSellers: [],
  lowStock: [],
  recentOrders: [],
  catalog: {
    activeProducts: 0,
    totalSkus: 0,
    activeSkus: 0,
    lowStockSkus: 0,
    outOfStockSkus: 0,
    categories: 0,
    rooms: 0,
    turntableBoundCategories: 0,
    turntableCoverageRatio: 0,
  },
  pendingPayments: 0,
};

describe('admin dashboard composition', () => {
  it('renders every furniture and operations panel with explicit empty states', () => {
    const markup = renderToStaticMarkup(createElement(DashboardView, emptyProjection));

    expect(markup).toContain('data-testid="admin-dashboard"');
    for (const heading of [
      'Выручка за период',
      'Заказы',
      'Средний чек',
      'Активные товары',
      'Всего SKU',
      'Продажи по дням',
      'Статусы заказов',
      'Каталог и остатки',
      'Категории и 360°',
      'Операции',
      'Низкие остатки',
      'Лучшие продажи',
      'Последние заказы',
    ]) {
      expect(markup).toContain(heading);
    }

    for (const emptyState of [
      'Продаж за период нет.',
      'Заказов пока нет.',
      'Низких остатков нет.',
      'Каталог пока пуст.',
      'Категории и комнаты пока не настроены.',
    ]) {
      expect(markup).toContain(emptyState);
    }

    expect(markup).not.toContain('Ritm');
  });

  it('links canonical low-stock rows to stock administration', () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardView, {
        ...emptyProjection,
        lowStock: [
          {
            skuId: 'sku-1',
            articleNumber: 'EV-NOMA-OAK',
            productId: 'product-1',
            productName: 'Noma',
            combinationLabel: 'Finish: Oak',
            stock: 2,
          },
        ],
      }),
    );

    expect(markup).toContain('href="/admin/catalog/stock"');
    expect(markup).toContain('EV-NOMA-OAK');
  });

  it('keeps page and layout authorization source contracts before reads and shell output', () => {
    const layout = readFileSync('app/(admin)/layout.tsx', 'utf8');
    const page = readFileSync('app/(admin)/admin/page.tsx', 'utf8');

    expect(layout.indexOf('requireAdminPage()')).toBeGreaterThanOrEqual(0);
    expect(layout.indexOf('requireAdminPage()')).toBeLessThan(layout.indexOf('<AdminShell'));
    expect(page).toMatch(/async function DashboardPage[\s\S]*?\{\s*const session = await requireAdminPage\(\);/);
    expect(page).not.toContain('Ritm');
  });

  it('keeps the dashboard period selector interactive and URL-driven', () => {
    const dashboard = readFileSync('app/(admin)/admin/_components/dashboard-view.tsx', 'utf8');

    expect(dashboard).toContain('actions={<PeriodToggle />}');
    expect(dashboard).not.toContain('actions={<PeriodToggle staticView />}');
  });

  it('exposes dashboard loading semantics', () => {
    const loading = readFileSync('app/(admin)/admin/loading.tsx', 'utf8');
    const skeleton = readFileSync('components/admin/skeleton/dashboard-skeleton.tsx', 'utf8');

    expect(loading).toContain('DashboardSkeleton');
    expect(skeleton).toContain('role="status"');
    expect(skeleton).toContain('aria-busy="true"');
  });
});

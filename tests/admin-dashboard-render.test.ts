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
  it('renders the clone dashboard landmarks and exactly four KPI cards', () => {
    const markup = renderToStaticMarkup(createElement(DashboardView, emptyProjection));

    expect(markup).toContain('data-testid="admin-dashboard"');
    for (const heading of [
      'Обзор',
      'Сводка смены',
      'Выручка по дням',
      'Статусы',
      'Часто покупают',
      'Последние заказы',
    ]) {
      expect(markup).toContain(heading);
    }

    for (const label of ['Выручка', 'Заказы', 'Средний чек', 'Отмены']) {
      expect(markup).toContain(label);
    }
    expect(markup.match(/data-testid="admin-kpi"/g)).toHaveLength(4);

    expect(markup).toContain('Всё, что нужно держать в поле зрения: деньги, очередь заказов и остатки.');
    expect(markup).not.toContain('Ritm');
  });

  it('uses the Evironn display face for the top KPI values', () => {
    const styles = readFileSync('app/(admin)/admin/_components/dashboard-view.module.css', 'utf8');
    const kpiValue = styles.match(/\.kpiValue\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

    expect(kpiValue).toContain('font-family: var(--ev-font-display);');
    expect(kpiValue).not.toContain('Fraunces');
  });

  it('keeps visible dashboard typography in the Golos admin system', () => {
    const styles = readFileSync('app/(admin)/admin/_components/dashboard-view.module.css', 'utf8');
    const title = styles.match(/\.title\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

    expect(title).toContain('font-family: var(--ev-font-body);');
    expect(title).not.toMatch(/Fraunces|Georgia|serif/i);
  });

  it('uses real status distribution data for the cancellations KPI', () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardView, {
        ...emptyProjection,
        statusDist: { segments: [{ status: 'CANCELLED', label: 'Отменён', count: 3 }], total: 3 },
      }),
    );

    expect(markup).toContain('data-kpi="cancellations"');
    expect(markup).toContain('>3</strong>');
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

    expect(dashboard).toContain('<PeriodToggle />');
    expect(dashboard).not.toContain('<PeriodToggle staticView />');
    expect(readFileSync('app/(admin)/admin/_components/period-toggle.tsx', 'utf8')).toContain('7 дней');
  });

  it('removes the old dashboard composition and search/profile header', () => {
    const dashboard = readFileSync('app/(admin)/admin/_components/dashboard-view.tsx', 'utf8');
    const shell = readFileSync('components/admin/admin-shell.tsx', 'utf8');

    for (const oldCopy of [
      'Главная страница',
      'Дашборд магазина',
      'Продажи по дням',
      'Статусы заказов',
      'Каталог и остатки',
      'Категории и 360°',
      'Операции',
      'Низкие остатки',
    ]) {
      expect(dashboard).not.toContain(oldCopy);
    }
    expect(dashboard).not.toContain('searchPlaceholder');
    expect(dashboard).not.toContain('DashboardUser');
    expect(shell).not.toContain('w-[286px]');
    expect(shell).toContain('className={styles.sidebar}');
  });

  it('uses a labelled responsive shell with mobile navigation', () => {
    const shellStyles = readFileSync('components/admin/admin-shell.module.css', 'utf8');

    expect(shellStyles).toContain('.sidebar');
    expect(shellStyles).toContain('.mobileNavigation');
    expect(shellStyles).toContain('--admin-sidebar-width: clamp(210px, 15vw, 220px);');
    expect(shellStyles).toContain('grid-template-columns: var(--admin-sidebar-width) minmax(0, 1fr);');
    expect(shellStyles).toContain('@media (max-width: 820px)');
  });

  it('exposes dashboard loading semantics', () => {
    const loading = readFileSync('app/(admin)/admin/loading.tsx', 'utf8');
    const skeleton = readFileSync('components/admin/skeleton/dashboard-skeleton.tsx', 'utf8');

    expect(loading).toContain('DashboardSkeleton');
    expect(skeleton).toContain('role="status"');
    expect(skeleton).toContain('aria-busy="true"');
  });
});

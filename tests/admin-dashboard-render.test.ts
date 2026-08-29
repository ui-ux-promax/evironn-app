import { existsSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { DashboardReferenceView } from '@/app/(admin)/admin/_components/dashboard-reference-view';
import type { DashboardReferenceModel } from '@/app/(admin)/admin/_components/dashboard-reference-model';

describe('admin dashboard composition', () => {
  it('owns the screenshot-first dashboard behind an isolated presentation boundary', () => {
    const model = readFileSync('app/(admin)/admin/_components/dashboard-reference-model.ts', 'utf8');
    const view = readFileSync('app/(admin)/admin/_components/dashboard-reference-view.tsx', 'utf8');

    expect(model).toContain('export type DashboardReferenceModel');
    expect(view).toContain('export function DashboardReferenceView');
    expect(view).toContain('DashboardReferenceModel');
    expect(view).not.toContain('@/lib/prisma-client');
    expect(view).not.toContain('@prisma/client');
  });

  it('keeps the visual fixture out of the protected production page', () => {
    const page = readFileSync('app/(admin)/admin/page.tsx', 'utf8');

    expect(page).toContain('createDashboardReferenceModel');
    expect(page).not.toContain('DASHBOARD_REFERENCE_FIXTURE');
    expect(page).not.toContain('screenshotFirstFixture');
  });

  it('renders every approved screenshot region from one presentation model', () => {
    const model = {
      period: 30,
      revenue: { label: 'Выручка', value: '485 420 ₽', trend: '+12,6% к прошлому месяцу' },
      kpis: [
        { id: 'orders', icon: 'shopping_cart', label: 'Заказы', value: '1 248', trend: '+8,4%' },
        { id: 'average', icon: 'sell', label: 'Средний чек', value: '388 ₽', trend: '+5,2%' },
        { id: 'conversion', icon: 'trending_up', label: 'Конверсия', value: '3,2%', trend: '+0,6%' },
      ],
      revenueSeries: Array.from({ length: 30 }, (_, index) => ({
        label: `День ${String(index + 1).padStart(2, '0')}`,
        value: 12000 + index * 1000,
      })),
      funnel: {
        stages: [
          { id: 'views', icon: 'visibility', label: 'Просмотры', value: '18 742' },
          { id: 'carts', icon: 'shopping_cart', label: 'Корзина', value: '3 896' },
          { id: 'checkout', icon: 'credit_card', label: 'Оформление', value: '1 745' },
          { id: 'orders', icon: 'payments', label: 'Заказы', value: '1 248' },
          { id: 'completed', icon: 'check_circle', label: 'Выполненные', value: '1 156' },
        ],
        footerLabel: 'Конверсия в заказ',
        footerValue: '6,2%',
        footerTrend: '+0,8%',
      },
      inventory: Array.from({ length: 4 }, (_, index) => ({
        id: `product-${index}`,
        name: `Товар ${index + 1}`,
        imageUrl: null,
        availability: 'В наличии',
        stock: String(42 - index),
        href: '/admin/catalog/products',
      })),
      categories: Array.from({ length: 4 }, (_, index) => ({
        id: `category-${index}`,
        name: `Категория ${index + 1}`,
        icon: 'chair',
        share: 32 - index * 6,
      })),
      categoryOther: { label: 'Другое', share: 14 },
      orders: Array.from({ length: 4 }, (_, index) => ({
        id: `order-${index}`,
        href: `/admin/orders/order-${index}`,
        number: `№1254${8 - index}`,
        date: '31 мая 2024',
        customer: 'Иван Петров',
        email: 'ivan@example.ru',
        products: [{ name: 'Диван', imageUrl: null }],
        overflowCount: index,
        itemCount: index + 1,
        total: '142 900 ₽',
        orderStatus: { label: 'Выполнен', tone: 'success' },
        paymentStatus: { label: 'Оплачено', tone: 'success' },
        fulfillmentStatus: { label: 'Отправлен', tone: 'success' },
      })),
    } satisfies DashboardReferenceModel;

    const markup = renderToStaticMarkup(createElement(DashboardReferenceView, { model }));
    const css = readFileSync('app/(admin)/admin/_components/dashboard-reference-view.module.css', 'utf8');

    expect(markup).toContain('data-testid="reference-sales-panel"');
    expect(markup.match(/data-testid="reference-kpi"/g)).toHaveLength(3);
    expect(markup).toContain('data-testid="reference-revenue-chart"');
    expect(markup).toContain('data-testid="reference-chart-animation"');
    expect(markup).toContain('data-testid="reference-revenue-curve"');
    expect(markup.match(/data-testid="reference-chart-point"/g)).toHaveLength(30);
    expect(markup.match(/data-testid="reference-chart-tooltip"/g)).toHaveLength(30);
    expect(markup).toMatch(/14\s000\s₽/);
    expect(markup.match(/data-testid="reference-chart-label"/g)).toHaveLength(7);
    expect(markup).toContain('День 01');
    expect(markup).toContain('День 30');
    expect(markup.match(/data-testid="reference-funnel-stage"/g)).toHaveLength(5);
    expect(markup).toContain('data-testid="reference-funnel-animation"');
    expect(markup).not.toContain('data-testid="reference-funnel-shape"');
    expect(markup.match(/data-testid="reference-inventory-card"/g)).toHaveLength(4);
    expect(markup.match(/data-testid="reference-category-ring"/g)).toHaveLength(4);
    expect(markup).toContain('data-testid="reference-orders-table"');
    expect(markup.match(/data-testid="reference-order-email"/g)).toHaveLength(4);
    expect(markup.match(/data-testid="reference-order-composition"/g)).toHaveLength(4);
    expect(markup).toContain('1 позиция');
    expect(markup).not.toContain('Действия');
    expect(markup).toContain('Показатели продаж');
    expect(markup).toContain('Товары на складе');
    expect(markup).toContain('Популярные категории');
    expect(markup).toContain('Последние заказы');
    expect(css).toContain('@keyframes dashboardFunnelReveal');
    expect(css).toContain('@keyframes dashboardChartDraw');
    expect(css).toContain('dashboardChartDraw 1800ms');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('.funnelStageAnimated');
    expect(css).toContain('.chartLineAnimated');
    expect(css).toContain('.chartPoint:hover .chartTooltip');
  });

  it('keeps page and layout authorization source contracts before reads and shell output', () => {
    const layout = readFileSync('app/(admin)/layout.tsx', 'utf8');
    const page = readFileSync('app/(admin)/admin/page.tsx', 'utf8');

    expect(layout.indexOf('requireAdminPage()')).toBeGreaterThanOrEqual(0);
    expect(layout.indexOf('requireAdminPage()')).toBeLessThan(layout.indexOf('<AdminShell'));
    expect(page).toMatch(/async function DashboardPage[\s\S]*?\{\s*await requireAdminPage\(\);/);
    expect(page).not.toContain('Ritm');
  });

  it('does not retain superseded dashboard presentation modules', () => {
    for (const file of [
      'app/(admin)/admin/_components/dashboard-view.tsx',
      'app/(admin)/admin/_components/dashboard-view.module.css',
      'app/(admin)/admin/_components/dashboard-kpi-card.tsx',
      'app/(admin)/admin/_components/best-sellers.tsx',
      'app/(admin)/admin/_components/recent-orders.tsx',
      'app/(admin)/admin/_components/revenue-chart.tsx',
      'app/(admin)/admin/_components/period-toggle.tsx',
    ]) {
      expect(existsSync(file)).toBe(false);
    }
  });

  it('uses a labelled responsive shell with mobile navigation', () => {
    const shell = readFileSync('components/admin/admin-shell.tsx', 'utf8');
    const mobileMenu = readFileSync('components/admin/admin-mobile-menu.tsx', 'utf8');

    expect(shell).toContain('className={styles.sidebar}');
    expect(shell).toContain('<AdminMobileMenu');
    expect(mobileMenu).toContain('mobileNavigation');
    expect(mobileMenu).toContain('Открыть магазин');
  });

  it('exposes dashboard loading semantics', () => {
    const loading = readFileSync('app/(admin)/admin/loading.tsx', 'utf8');
    const skeleton = readFileSync('components/admin/skeleton/dashboard-skeleton.tsx', 'utf8');

    expect(loading).toContain('DashboardSkeleton');
    expect(skeleton).toContain('role="status"');
    expect(skeleton).toContain('aria-busy="true"');
  });
});

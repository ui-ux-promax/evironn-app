/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_NAV } from '@/lib/admin/nav';
import { ADMIN_PRIMARY_ROUTE_ORDER, ADMIN_ROUTE_SMOKE_TARGETS } from '@/lib/admin/prototype-contract';
import { OrderFilters } from '@/app/(admin)/admin/orders/_components/order-filters';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push, refresh: vi.fn() }),
  useSearchParams: () => navigation.searchParams,
}));

const root = process.cwd();

describe('admin prototype contract', () => {
  afterEach(() => cleanup());

  it('does not require ignored visual source files at test time', () => {
    for (const target of ADMIN_ROUTE_SMOKE_TARGETS) {
      expect(target).not.toHaveProperty('prototype');
    }
  });

  it('keeps every primary admin route backed by a page file', () => {
    for (const target of ADMIN_ROUTE_SMOKE_TARGETS) {
      expect(existsSync(join(root, target.pageFile))).toBe(true);
    }
  });

  it('keeps sidebar routes in prototype order', () => {
    expect(ADMIN_NAV.map((item) => item.href)).toEqual(ADMIN_PRIMARY_ROUTE_ORDER);
  });

  it('keeps approved list route presentation markers on every primary register', () => {
    const sources = [
      readFileSync('app/(admin)/admin/catalog/products/page.tsx', 'utf8'),
      readFileSync('app/(admin)/admin/orders/page.tsx', 'utf8'),
      readFileSync('app/(admin)/admin/customers/page.tsx', 'utf8'),
      readFileSync('app/(admin)/admin/marketing/page.tsx', 'utf8'),
    ];

    for (const source of sources.slice(1)) expect(source).toContain('AdminPageHeader');
    expect(sources[0]).toContain('Каталог товаров');
    expect(sources[0]).toContain('href="/admin/catalog/products/new"');
    expect(sources[1]).toContain('title="Заказы"');
    expect(sources[2]).toContain('title="Клиенты"');
    expect(sources[3]).toContain('href="/admin/marketing/new"');
  });

  it('keeps catalog subroutes inside the approved five-tab hero and registry composition', () => {
    const pages = [
      readFileSync('app/(admin)/admin/catalog/categories/page.tsx', 'utf8'),
      readFileSync('app/(admin)/admin/catalog/options/page.tsx', 'utf8'),
      readFileSync('app/(admin)/admin/catalog/rooms/page.tsx', 'utf8'),
      readFileSync('app/(admin)/admin/catalog/stock/page.tsx', 'utf8'),
    ];

    for (const source of pages) {
      expect(source).toContain('<CatalogTabs embedded />');
      expect(source).toContain('registry-heading');
      expect(source).not.toContain('AdminKpiCard');
    }
  });

  it('does not add a second catalog tab row outside the route hero', () => {
    const layout = readFileSync('app/(admin)/admin/catalog/layout.tsx', 'utf8');

    expect(layout).not.toContain('<CatalogTabs />');
  });

  it('keeps order filter controls responsive and resets pagination on search', () => {
    const filters = readFileSync('app/(admin)/admin/orders/_components/order-filters.tsx', 'utf8');
    expect(filters).toContain('grid-cols-1 gap-3 lg:grid-cols-');

    navigation.searchParams = new URLSearchParams('payment=pending&page=3');
    render(createElement(OrderFilters));
    const search = screen.getByPlaceholderText('Номер заказа или клиент');
    fireEvent.change(search, { target: { value: '1001' } });
    fireEvent.keyDown(search, { key: 'Enter' });

    expect(navigation.push).toHaveBeenCalledWith('/admin/orders?payment=pending&q=1001');
  });

  it('keeps coupon filter controls in a responsive inner layout', () => {
    const filters = readFileSync('app/(admin)/admin/marketing/_components/coupon-filters.tsx', 'utf8');
    expect(filters).toContain('grid-cols-1 gap-3 lg:grid-cols-');
  });
});

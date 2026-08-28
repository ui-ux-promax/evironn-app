/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push, refresh: vi.fn() }),
  useSearchParams: () => navigation.searchParams,
}));

import { OrderFilters } from '@/app/(admin)/admin/orders/_components/order-filters';
import { OrderTable, type OrderRow } from '@/app/(admin)/admin/orders/_components/order-table';
import OrdersLoading from '@/app/(admin)/admin/orders/loading';

const row: OrderRow = {
  id: 'order-1',
  orderNumber: 1001,
  status: 'PROCESSING',
  paymentStatus: 'succeeded',
  paymentMethod: 'online',
  contactName: 'Alice Example',
  contactEmail: 'alice@example.com',
  itemCount: 3,
  totalAmount: 125000,
  coverImage: null,
  createdAt: new Date('2026-08-25T12:00:00.000Z'),
};

describe('approved admin order register', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
  });

  afterEach(() => cleanup());

  it('renders approved register columns and preserves real order detail destination', () => {
    const markup = renderToStaticMarkup(
      createElement(OrderTable, { rows: [row], page: 1, totalPages: 1, total: 1, limit: 10 }),
    );

    expect(markup).toContain('aria-label="Реестр заказов"');
    for (const heading of ['Заказ', 'Дата', 'Клиент', 'Состав', 'Сумма', 'Статус', 'Оплата', 'Доставка', 'Действия']) {
      expect(markup).toContain(heading);
    }
    expect(markup).toContain('#1001');
    expect(markup).toContain('Alice Example');
    expect(markup).toContain('125 000');
    expect(markup).toContain('href="/admin/orders/order-1"');
    expect(markup).toContain('Предыдущая страница');
    expect(markup).toContain('Следующая страница');
  });

  it('keeps the orders table header square inside the rounded registry shell', () => {
    const table = readFileSync('app/(admin)/admin/orders/_components/order-table.tsx', 'utf8');
    const skeleton = readFileSync('app/(admin)/admin/orders/_components/order-register-skeleton.tsx', 'utf8');

    expect(table).not.toContain('overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface');
    expect(skeleton).toMatch(
      /data-skeleton="orders-table"[\s\S]*?className="overflow-hidden border border-admin-outline-variant bg-admin-surface"/,
    );
  });

  it('uses the catalog-style visible register skeleton for the orders loading boundary', () => {
    const markup = renderToStaticMarkup(createElement(OrdersLoading));
    const gate = readFileSync('components/admin/content-ready-gate.tsx', 'utf8');

    expect(markup).toContain('aria-label="Загрузка заказов"');
    for (const block of ['hero', 'kpis', 'filters', 'registry', 'table']) {
      expect(markup).toContain(`data-skeleton="orders-${block}"`);
    }
    expect(markup).toContain('background-color:var(--admin-surface-low)');
    expect(markup).not.toContain('aria-label="Загрузка…"');
    expect(gate).toContain('OrderRegisterSkeleton');
  });

  it('renders the approved route composition without fixture-only title or actions', () => {
    const page = readFileSync('app/(admin)/admin/orders/page.tsx', 'utf8');

    expect(page).toContain('Операции магазина');
    expect(page).toContain('<AdminPageHeader');
    expect(page).toContain('title="Заказы"');
    expect(page).toContain('Экспорт');
    expect(page).toContain('Создать заказ');
    expect(page).toContain('Ключевые показатели заказов');
    expect(page).not.toContain('title={`Заказы (${total})`}');
    expect(page).not.toContain('href="#create-order"');
  });

  it('keeps order filters and registry as separate approved sections', () => {
    const page = readFileSync('app/(admin)/admin/orders/page.tsx', 'utf8');

    expect(page).toContain('<OrderFilters />');
    expect(page).toContain('aria-labelledby="orders-table-title"');
    expect(page).toContain('<OrderTable');
    expect(readFileSync('app/(admin)/admin/orders/_components/order-table.tsx', 'utf8')).toContain(
      'aria-label="Реестр заказов"',
    );
  });

  it('uses real status quick filters while preserving query filters and resetting page', () => {
    navigation.searchParams = new URLSearchParams('q=anna&payment=succeeded&page=3');
    render(createElement(OrderFilters));

    fireEvent.click(screen.getByRole('button', { name: 'Обрабатывается' }));

    expect(navigation.push).toHaveBeenCalledWith('/admin/orders?q=anna&payment=succeeded&status=PROCESSING');
  });

  it('toggles the existing quick-filter row from the additional-filters control', () => {
    render(createElement(OrderFilters));

    const toggle = screen.getByRole('button', { name: 'Дополнительные фильтры' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Быстрый фильтр:')).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Быстрый фильтр:')).not.toBeInTheDocument();
  });

  it('opens an honest period-availability popover without changing server filters', () => {
    render(createElement(OrderFilters));

    const period = screen.getByRole('button', { name: /Период/ });
    expect(period).not.toBeDisabled();

    fireEvent.click(period);

    expect(screen.getByRole('dialog', { name: 'Период' })).toBeInTheDocument();
    expect(screen.getByText(/фильтр по периоду .* недоступен/i)).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });
});

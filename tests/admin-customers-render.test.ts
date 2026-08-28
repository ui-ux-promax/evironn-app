/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push, refresh: vi.fn() }),
  useSearchParams: () => navigation.searchParams,
}));

vi.mock('@/app/actions/admin/customers', () => ({
  changeUserRoleFromForm: vi.fn(),
}));

import { CustomerDetail } from '@/app/(admin)/admin/customers/_components/customer-detail';
import { CustomerFilters } from '@/app/(admin)/admin/customers/_components/customer-filters';
import { CustomerTable } from '@/app/(admin)/admin/customers/_components/customer-table';
import type { AdminCustomerDetail } from '@/lib/admin/customers';

const customer: AdminCustomerDetail = {
  id: 'u1',
  name: 'Alice Example',
  email: 'alice@example.com',
  phone: '+7 900 000-00-00',
  role: 'ADMIN',
  orderCount: 1,
  totalSpent: 126900,
  createdAt: new Date('2026-08-25T12:00:00.000Z'),
  emailVerified: new Date('2026-08-25T12:00:00.000Z'),
  image: null,
  birthdate: null,
  reviewSummary: { count: 2, averageRating: 4.5 },
  wishlistCount: 3,
  cartCount: 1,
  newsletterActive: true,
  roleControl: { isSelf: true, isLastAdmin: true },
  orders: [
    {
      id: 'order-1',
      orderNumber: 1001,
      status: 'PENDING',
      createdAt: new Date('2026-08-25T12:00:00.000Z'),
      totalAmount: 126900,
      paymentStatus: 'pending',
      items: [
        {
          id: 'item-1',
          articleNumber: 'EV-NOMA-OAK',
          combinationLabel: 'Материал: Дуб',
          productName: 'Noma Lounge Chair',
          imageUrl: '/snapshot/noma.webp',
          unitPrice: 125000,
          quantity: 1,
          lineTotal: 125000,
        },
      ],
    },
  ],
};

describe('admin customer detail composition', () => {
  afterEach(() => cleanup());

  it('renders identity, profile totals, stored history, payment context, and blocked role form', () => {
    const markup = renderToStaticMarkup(createElement(CustomerDetail, { customer }));

    expect(markup).toContain('Alice Example');
    expect(markup).toContain('+7 900 000-00-00');
    expect(markup).toContain('126 900');
    expect(markup).toContain('Ожидает оплаты');
    expect(markup).toContain('Noma Lounge Chair');
    expect(markup).toContain('EV-NOMA-OAK');
    expect(markup).toContain('Материал: Дуб');
    expect(markup).toContain('<form');
    expect(markup).toContain('name="userId"');
    expect(markup).toContain('name="role"');
    expect(markup).toContain('disabled');
    expect(markup).toMatch(/самого себя|последнего администратора/i);
  });

  it('renders empty history state and preserves server action/error contracts', () => {
    const markup = renderToStaticMarkup(
      createElement(CustomerDetail, {
        customer: { ...customer, orders: [], roleControl: { isSelf: false, isLastAdmin: false } },
      }),
    );
    expect(markup).toMatch(/заказов нет/i);

    const roleToggle = readFileSync('app/(admin)/admin/customers/_components/role-toggle.tsx', 'utf8');
    expect(roleToggle).not.toContain('action={changeUserRoleFromForm}');
    expect(roleToggle.match(/action=\{submitRoleChange\}/g)).toHaveLength(2);
    expect(roleToggle).toContain('changeUserRoleFromForm({ ok: true }, formData)');
    expect(roleToggle).toContain('res.error');
    expect(roleToggle).toContain('aria-live');
  });

  it('keeps page guards before both privileged customer reads', () => {
    const listPage = readFileSync('app/(admin)/admin/customers/page.tsx', 'utf8');
    const detailPage = readFileSync('app/(admin)/admin/customers/[id]/page.tsx', 'utf8');

    expect(listPage.indexOf('requireAdminPage()')).toBeLessThan(listPage.indexOf('listAdminCustomers('));
    expect(detailPage.indexOf('requireAdminPage()')).toBeLessThan(detailPage.indexOf('getAdminCustomerDetail('));
    expect(detailPage).toContain('session.user.id');
  });

  it('uses the approved customer register heading, filter region, table, and detail route', () => {
    const page = readFileSync('app/(admin)/admin/customers/page.tsx', 'utf8');
    const filters = readFileSync('app/(admin)/admin/customers/_components/customer-filters.tsx', 'utf8');
    const table = readFileSync('app/(admin)/admin/customers/_components/customer-table.tsx', 'utf8');

    expect(page).toContain('<AdminPageHeader');
    expect(page).toContain('kicker="Клиентская база"');
    expect(page).toContain('title="Клиенты"');
    expect(page).toContain('Добавить клиента');
    expect(page).toContain('disabled');
    expect(filters).toContain('aria-label="Поиск и фильтры клиентов"');
    expect(filters).toContain('Быстрый фильтр:');
    expect(table).toContain('aria-label="Реестр клиентов"');
    expect(table).toContain('Регистрация');
    expect(table).toContain('href={`/admin/customers/${row.id}`}');
  });

  it('renders one real paginator even when current customer result has one page', () => {
    const table = readFileSync('app/(admin)/admin/customers/_components/customer-table.tsx', 'utf8');

    expect(table).toContain('Показано');
    expect(table).toContain('disabled={page <= 1}');
    expect(table).toContain('disabled={page >= totalPages}');
    expect(table).not.toContain('{totalPages > 1 &&');
  });

  it('preserves customer filters and resets pagination on search', () => {
    navigation.searchParams = new URLSearchParams('role=ADMIN&page=3');
    render(createElement(CustomerFilters));

    const search = screen.getByPlaceholderText('Имя, телефон или email');
    fireEvent.change(search, { target: { value: 'anna' } });
    fireEvent.keyDown(search, { key: 'Enter' });

    expect(navigation.push).toHaveBeenCalledWith('/admin/customers?role=ADMIN&q=anna');
  });

  it('renders semantic customer pagination, status, and detail destination', () => {
    navigation.searchParams = new URLSearchParams('role=ADMIN');
    render(
      createElement(CustomerTable, {
        rows: [{ ...customer, emailVerified: undefined } as never],
        page: 1,
        totalPages: 2,
        total: 21,
        limit: 20,
      }),
    );

    expect(screen.getByRole('table', { name: 'Реестр клиентов' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Alice Example' })[0]).toHaveAttribute('href', '/admin/customers/u1');
    expect(screen.getAllByText('Администратор')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(navigation.push).toHaveBeenCalledWith('/admin/customers?role=ADMIN&page=2');
  });
});

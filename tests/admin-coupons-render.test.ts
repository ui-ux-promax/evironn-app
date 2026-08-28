/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push, refresh: vi.fn() }),
  useSearchParams: () => navigation.searchParams,
}));

vi.mock('@/app/actions/admin/coupons', () => ({
  createCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  toggleCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
}));

import { CouponForm, type CouponFormProps } from '@/app/(admin)/admin/marketing/_components/coupon-form';
import { CouponFilters } from '@/app/(admin)/admin/marketing/_components/coupon-filters';
import { CouponTable, type CouponRow } from '@/app/(admin)/admin/marketing/_components/coupon-table';
import { couponStatus } from '@/lib/coupon-status';

const now = new Date('2026-08-25T12:00:00.000Z');

const rows: CouponRow[] = [
  {
    id: 'active-1',
    code: 'EVIRONN15',
    percent: 15,
    active: true,
    status: couponStatus({ active: true, expiresAt: new Date('2026-09-01T00:00:00.000Z') }, now),
    expiresLabel: '01.09.2026',
    createdLabel: '25.08.2026',
  },
  {
    id: 'inactive-1',
    code: 'WELCOME10',
    percent: 10,
    active: false,
    status: couponStatus({ active: false, expiresAt: null }, now),
    expiresLabel: 'Бессрочный',
    createdLabel: '24.08.2026',
  },
  {
    id: 'expired-1',
    code: 'SUMMER20',
    percent: 20,
    active: false,
    status: couponStatus({ active: false, expiresAt: new Date('2026-08-24T23:59:59.999Z') }, now),
    expiresLabel: '24.08.2026',
    createdLabel: '20.08.2026',
  },
];

describe('admin coupon composition', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => cleanup());

  it('renders list rows with expired status taking precedence over inactive', () => {
    const markup = renderToStaticMarkup(createElement(CouponTable, { rows }));

    expect(markup).toContain('EVIRONN15');
    expect(markup).toContain('15%');
    expect(markup).toContain('Активен');
    expect(markup).toContain('WELCOME10');
    expect(markup).toContain('Выключен');
    expect(markup).toContain('SUMMER20');
    expect(markup).toContain('Истёк');
    expect(markup).not.toMatch(/usage|used|использован|orderCount|usageCount/i);
  });

  it('maps create and edit modes to the existing coupon fields', () => {
    const createProps: CouponFormProps = { mode: 'create' };
    const editProps: CouponFormProps = {
      mode: 'edit',
      coupon: { id: 'active-1', code: 'EVIRONN15', percent: 15, active: true, expiresAt: '2026-09-01' },
    };

    const createMarkup = renderToStaticMarkup(createElement(CouponForm, createProps));
    const editMarkup = renderToStaticMarkup(createElement(CouponForm, editProps));

    for (const markup of [createMarkup, editMarkup]) {
      expect(markup).toContain('name="code"');
      expect(markup).toContain('name="percent"');
      expect(markup).toContain('name="expiresAt"');
      expect(markup).toContain('Промокод активен');
      expect(markup).not.toMatch(/usage|used|использован|orderCount|usageCount/i);
    }
    expect(createMarkup).toContain('Создать');
    expect(editMarkup).toContain('EVIRONN15');
    expect(editMarkup).toContain('Сохранить');
  });

  it('keeps validation, loading, empty-state, and guarded page contracts explicit', () => {
    const form = readFileSync('app/(admin)/admin/marketing/_components/coupon-form.tsx', 'utf8');
    const table = readFileSync('app/(admin)/admin/marketing/_components/coupon-table.tsx', 'utf8');
    const listPage = readFileSync('app/(admin)/admin/marketing/page.tsx', 'utf8');
    const newPage = readFileSync('app/(admin)/admin/marketing/new/page.tsx', 'utf8');
    const editPage = readFileSync('app/(admin)/admin/marketing/[id]/edit/page.tsx', 'utf8');
    const loading = readFileSync('app/(admin)/admin/marketing/loading.tsx', 'utf8');

    expect(form).toContain('couponSchema');
    expect(form).toContain('errors.code');
    expect(form).toContain('errors.percent');
    expect(form).toContain('errors.expiresAt');
    expect(form).toContain('serverError');
    expect(form).toContain('isSubmitting');
    expect(table).toContain('pending === row.id');
    expect(listPage).toContain('Промокоды не найдены');
    expect(listPage).toContain('averagePercent');
    expect(listPage).toContain('couponStatus');
    expect(listPage).toContain('normalizeCouponCode');
    expect(listPage.indexOf('requireAdminPage()')).toBeLessThan(listPage.indexOf('prisma.coupon.findMany'));
    expect(newPage).toContain('mode="create"');
    expect(editPage).toContain('mode="edit"');
    expect(editPage.indexOf('requireAdminPage()')).toBeLessThan(editPage.indexOf('prisma.coupon.findUnique'));
    expect(loading).toContain('ListPageSkeleton');
    expect([form, table, listPage, newPage, editPage].join('\n')).not.toMatch(
      /usage|used|использован|orderCount|usageCount/i,
    );
  });

  it('uses the approved coupon register heading, filter region, and semantic table', () => {
    const listPage = readFileSync('app/(admin)/admin/marketing/page.tsx', 'utf8');
    const filters = readFileSync('app/(admin)/admin/marketing/_components/coupon-filters.tsx', 'utf8');
    const table = readFileSync('app/(admin)/admin/marketing/_components/coupon-table.tsx', 'utf8');

    expect(listPage).toContain('kicker="Маркетинговые правила"');
    expect(listPage).toContain('title="Промокоды"');
    expect(listPage).toContain('href="/admin/marketing/new"');
    expect(filters).toContain('aria-label="Поиск и фильтры промокодов"');
    expect(filters).toContain('Тип скидки');
    expect(filters).toContain('Сортировка');
    expect(filters).toContain('Быстрый фильтр:');
    expect(table).toContain('aria-label="Реестр промокодов"');
    expect(table).toContain('href={`/admin/marketing/${row.id}/edit`}');
  });

  it('keeps real coupon pagination visible for a one-page result', () => {
    const table = readFileSync('app/(admin)/admin/marketing/_components/coupon-table.tsx', 'utf8');

    expect(table).toContain('Показано');
    expect(table).toContain('disabled={page <= 1}');
    expect(table).toContain('disabled={page >= totalPages}');
  });

  it('preserves coupon status and resets pagination for Enter and select controls', async () => {
    navigation.searchParams = new URLSearchParams('status=active&page=4');
    render(createElement(CouponFilters));

    const search = screen.getByPlaceholderText('Название или код');
    fireEvent.change(search, { target: { value: 'welcome' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(navigation.push).toHaveBeenCalledWith('/admin/marketing?status=active&q=welcome');

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Истёкшие' }));
    expect(navigation.push).toHaveBeenLastCalledWith('/admin/marketing?status=expired');
  });
});

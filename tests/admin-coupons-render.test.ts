import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/app/actions/admin/coupons', () => ({
  createCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  toggleCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
}));

import { CouponForm, type CouponFormProps } from '@/app/(admin)/admin/marketing/_components/coupon-form';
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
});

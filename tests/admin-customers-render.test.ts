import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/app/actions/admin/customers', () => ({
  changeUserRoleFromForm: vi.fn(),
}));

import { CustomerDetail } from '@/app/(admin)/admin/customers/_components/customer-detail';
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
    expect(roleToggle).toContain('action={changeUserRoleFromForm}');
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
});

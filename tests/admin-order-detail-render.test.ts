import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/app/actions/admin/orders', () => ({
  advanceOrderStatus: vi.fn(),
  cancelOrderByAdmin: vi.fn(),
}));

import { OrderDetail, type AdminOrderDetail } from '@/app/(admin)/admin/orders/_components/order-detail';

const order: AdminOrderDetail = {
  id: 'order-1',
  orderNumber: 1001,
  status: 'PENDING',
  createdAt: new Date('2026-08-25T12:00:00.000Z'),
  contact: { name: 'Alice Example', email: 'alice@example.com', phone: '+7 900 000-00-00' },
  delivery: {
    method: 'Курьер',
    address: 'Москва, ул. Лесная, 10',
    date: new Date('2026-09-01T12:00:00.000Z'),
    window: '10:00–14:00',
  },
  totals: { items: 125000, discount: 0, shipping: 1900, services: 0, total: 126900 },
  items: [
    {
      id: 'item-1',
      articleNumber: 'EV-NOMA-OAK',
      combinationLabel: 'Материал: Дуб',
      productName: 'Noma Lounge Chair',
      imageUrl: '/snapshot/noma-oak.webp',
      unitPrice: 125000,
      quantity: 1,
      lineTotal: 125000,
    },
  ],
  payment: {
    method: 'Онлайн',
    status: 'pending',
    initializationState: 'READY',
    claimEvidencePresent: false,
    dispatchEvidencePresent: true,
  },
  nextStatus: 'PROCESSING',
  cancelDecision: { ok: false, reason: 'PAYMENT_DISPATCH_EVIDENCE_PRESENT' },
};

describe('admin order detail composition', () => {
  it('renders immutable snapshot lines, safe payment evidence, blocked cancellation, and expected-status controls', () => {
    const markup = renderToStaticMarkup(createElement(OrderDetail, { order }));

    expect(markup).toContain('Noma Lounge Chair');
    expect(markup).toContain('EV-NOMA-OAK');
    expect(markup).toContain('Материал: Дуб');
    expect(markup).toContain('Есть подтверждение отправки платежа');
    expect(markup).toContain('data-testid="admin-order-transition"');
    expect(markup).toContain('data-testid="admin-order-cancel"');
    expect(markup).toContain('data-testid="admin-conflict-alert"');
    expect(markup).toContain('data-testid="admin-blocked-reason"');
    expect(markup).toContain('data-expected-status="PENDING"');
    expect(markup).not.toContain('confirmationUrl');
    expect(markup).not.toContain('provider');
  });

  it('keeps the privileged read behind the page guard and projects only stored snapshot/payment evidence', () => {
    const page = readFileSync('app/(admin)/admin/orders/[id]/page.tsx', 'utf8');
    const orders = readFileSync('lib/admin/orders.ts', 'utf8');

    expect(page.indexOf('requireAdminPage()')).toBeGreaterThanOrEqual(0);
    expect(page.indexOf('requireAdminPage()')).toBeLessThan(page.indexOf('getAdminOrderDetail('));
    expect(orders).toContain('export async function getAdminOrderDetail');
    expect(orders).not.toContain('canonicalSku:');
    expect(orders).not.toContain('product:');
    expect(orders).not.toContain('confirmationUrl');
    expect(orders).not.toContain('providerId');
    expect(orders).not.toContain('rawPayload');
  });
});

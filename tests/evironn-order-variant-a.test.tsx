/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import type { OrderPageDto } from '@/services/dto/order-page.dto';

const mocks = vi.hoisted(() => ({
  resyncOrderPayment: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/app/actions/order', () => ({ resyncOrderPayment: mocks.resyncOrderPayment }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/components/shared/product/review-form', () => ({ ReviewForm: () => null }));
vi.mock('@/components/loading-ui/fade-arc', () => ({
  FadeArc: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="fade-arc" {...props} />,
}));

import { OrderVariantA } from '@/components/evironn/order/order-variant-a';

const pendingOrder: OrderPageDto = {
  id: 'order-1',
  orderNumber: 42,
  status: 'PAYMENT_PENDING',
  stage: 'placed',
  statusLabel: 'Ожидает оплаты',
  createdAt: '2026-09-05T00:00:00.000Z',
  createdAtLabel: '5 сентября 2026',
  contact: { name: 'Anna', phone: '+79991234567', email: 'anna@example.com' },
  delivery: {
    method: 'courier',
    address: 'Tverskaya, 10',
    date: null,
    dateLabel: null,
    window: '10:00–14:00',
    comment: null,
    city: 'Moscow',
    pickupPoint: null,
    floor: 2,
    liftType: 'passenger',
  },
  items: [],
  totals: {
    itemsSubtotal: 100000,
    discount: 0,
    delivery: 1900,
    services: 0,
    total: 101900,
    couponCode: null,
    serviceLines: [],
  },
  payment: {
    kind: 'online',
    status: 'pending',
    label: 'Ожидает оплаты',
    confirmationUrl: null,
    initialization: {
      status: 'PAYMENT_INITIALIZATION_PENDING',
      continuePaymentUrl: null,
      canRetryCreate: false,
      allowedActions: ['RESYNC_PAYMENT'],
    },
  },
  reviewTargets: [],
  canCancel: false,
};

beforeEach(() => {
  mocks.resyncOrderPayment.mockReset();
  mocks.refresh.mockReset();
});

afterEach(cleanup);

describe('OrderVariantA', () => {
  it('shows payment resync progress and rejects duplicate activation', async () => {
    let resolveResync!: (value: { ok: true }) => void;
    mocks.resyncOrderPayment.mockReturnValue(new Promise((resolve) => (resolveResync = resolve)));
    render(<OrderVariantA order={pendingOrder} />);

    const resync = screen.getByRole('button', { name: 'Проверить статус платежа' });
    fireEvent.click(resync);
    fireEvent.click(resync);

    await waitFor(() => expect(mocks.resyncOrderPayment).toHaveBeenCalledWith(42));
    expect(mocks.resyncOrderPayment).toHaveBeenCalledTimes(1);
    expect(resync).toBeDisabled();
    expect(resync).toHaveAttribute('aria-busy', 'true');
    expect(resync).toHaveTextContent('Проверить статус платежа');
    expect(resync.querySelector('[data-testid="fade-arc"]')).toHaveAttribute('aria-hidden', 'true');

    resolveResync({ ok: true });
    await waitFor(() => expect(resync).toBeEnabled());
  });

  it('exports production order shell', () =>
    expect(fs.readFileSync('components/evironn/order/order-variant-a.tsx', 'utf8')).toContain(
      'export function OrderVariantA',
    ));

  it('preserves supported clone hierarchy and accessible tracking state', () => {
    const variant = fs.readFileSync('components/evironn/order/order-variant-a.tsx', 'utf8');
    const primitives = fs.readFileSync('components/evironn/order/order-primitives.tsx', 'utf8');
    const styles = fs.readFileSync('styles/evironn/OrderEnhancements.css', 'utf8');
    expect(variant).toContain('<OrderMeta');
    expect(variant).toContain('<PlacedBanner');
    expect(variant).toContain('<strong>{formatPrice(order.totals.total)}</strong>');
    expect(primitives).toContain('ord-placed__mark');
    expect(primitives).toContain('ord-placed__lede');
    expect(primitives).toContain('ord-placed__next');
    expect(primitives).toContain("aria-current={index === current ? 'step' : undefined}");
    expect(primitives).toMatch(/<header>\s*<h2>\{title\}<\/h2>\s*\{note && <p>\{note\}<\/p>\}\s*<\/header>/);
    expect(primitives).not.toContain('ord-panel__head');
    expect(primitives).toContain('aria-label={`Открыть ${line.name}`}');
    expect(primitives).toContain('is-payment-pending');
    expect(primitives).toContain('{order.payment.label}');
    expect(styles).toContain('.ord-chip.is-payment-pending');
    expect(styles).toContain('.ord-review > form');
    expect(primitives).not.toContain('new Date(order.createdAt)');
    expect(variant).toContain('<CancelOrderButton');
  });

  it('links each review target to its canonical product page', () => {
    const variant = fs.readFileSync('components/evironn/order/order-variant-a.tsx', 'utf8');

    expect(variant).toContain('<Link className="ord-review__product-link" href={target.href}>');
    expect(variant).toContain('{target.name}');
  });

  it('keeps the placed banner inside the order content container', () => {
    const styles = fs.readFileSync('styles/evironn/OrderVariantA.css', 'utf8');

    expect(styles).toMatch(
      /\.ord-a\s*>\s*\.ord-placed\s*\{[\s\S]*width:\s*min\(100%,\s*var\(--ev-container-width\)\);/,
    );
  });
});

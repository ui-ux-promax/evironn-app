import { describe, expect, it } from 'vitest';
import { getOrderDetailHref, getProfileOrderPaymentHref } from '@/lib/order-links';

describe('order links', () => {
  it('builds canonical customer order detail href', () => {
    expect(getOrderDetailHref(3)).toBe('/orders/3');
  });

  it('keeps profile payment continuation on canonical order page', () => {
    expect(
      getProfileOrderPaymentHref({
        orderNumber: 3,
        status: 'PENDING',
        paymentMethod: 'online',
        paymentStatus: 'pending',
      }),
    ).toBe('/orders/3');
  });

  it('does not expose payment continuation for non-pending profile orders', () => {
    expect(
      getProfileOrderPaymentHref({
        orderNumber: 3,
        status: 'PROCESSING',
        paymentMethod: 'online',
        paymentStatus: 'succeeded',
      }),
    ).toBeNull();
  });
});

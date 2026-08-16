import { describe, expect, it, vi } from 'vitest';

const placeOrder = vi.hoisted(() =>
  vi.fn(async (_input: unknown) => ({ ok: true, code: 'ORDER_READY', orderNumber: 1042 })),
);
vi.mock('@/app/actions/order', () => ({ placeOrder }));

import { submitCheckoutValues } from '@/components/shared/checkout/checkout-submit';

describe('inherited checkout form submission', () => {
  it('passes only form values and never forwards a buy-now field', async () => {
    const values = {
      contactName: 'Ivan Petrov',
      contactPhone: '+79990000000',
      contactEmail: 'ivan@example.test',
      shippingMethod: 'courier' as const,
      city: 'Moscow',
      addressLine: 'Tverskaya 1',
      paymentMethod: 'cod' as const,
    };
    await submitCheckoutValues(values);
    expect(placeOrder).toHaveBeenCalledWith(values);
    expect(placeOrder.mock.calls[0][0]).not.toHaveProperty('buyNowVariantId');
  });
});

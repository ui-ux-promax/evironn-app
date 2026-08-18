import { describe, expect, it } from 'vitest';
import { buildBlockedOrderPaymentInitialization } from '@/services/dto/order-page.dto';

describe('order payment actions', () => {
  it('blocks retry-create and continue while exposing lookup-only resync', () => {
    expect(buildBlockedOrderPaymentInitialization(42, false)).toEqual(
      expect.objectContaining({
        status: 'PAYMENT_INITIALIZATION_BLOCKED',
        orderNumber: 42,
        continuePaymentUrl: null,
        canRetryCreate: false,
        allowedActions: ['RESYNC_PAYMENT'],
      }),
    );
  });
});

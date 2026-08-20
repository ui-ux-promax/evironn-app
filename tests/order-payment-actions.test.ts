import { describe, expect, it } from 'vitest';
import { buildBlockedOrderPaymentInitialization } from '@/services/dto/order-page.dto';
import { PAYMENT_INITIALIZATION_STATUSES } from '@/services/dto/payment-initialization.dto';

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

  it('uses the shared payment vocabulary with order-only action tuples', () => {
    expect(PAYMENT_INITIALIZATION_STATUSES).toEqual([
      'PAYMENT_INITIALIZATION_READY',
      'PAYMENT_INITIALIZATION_PENDING',
      'PAYMENT_INITIALIZATION_BLOCKED',
    ]);
    expect(buildBlockedOrderPaymentInitialization(42, true)?.allowedActions).toEqual([
      'RESYNC_PAYMENT',
      'CANCEL_ORDER',
    ]);
  });
});

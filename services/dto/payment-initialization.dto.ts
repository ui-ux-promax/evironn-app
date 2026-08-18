export const PAYMENT_INITIALIZATION_STATUSES = [
  'PAYMENT_INITIALIZATION_READY',
  'PAYMENT_INITIALIZATION_PENDING',
  'PAYMENT_INITIALIZATION_BLOCKED',
] as const;

export type PaymentInitializationStatus = (typeof PAYMENT_INITIALIZATION_STATUSES)[number];

export interface BlockedPaymentInitializationBaseDto {
  status: 'PAYMENT_INITIALIZATION_BLOCKED';
  orderNumber: number;
  heading: 'Платёж требует проверки';
  message: string;
  continuePaymentUrl: null;
  canRetryCreate: false;
}

export type CheckoutPaymentInitializationAction = 'OPEN_ORDER';
export type OrderPaymentInitializationAction = 'RESYNC_PAYMENT' | 'CANCEL_ORDER';
export type OrderPaymentInitializationActionTuple =
  readonly ['RESYNC_PAYMENT'] | readonly ['RESYNC_PAYMENT', 'CANCEL_ORDER'];

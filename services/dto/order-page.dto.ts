import type {
  BlockedPaymentInitializationBaseDto,
  OrderPaymentInitializationAction,
  OrderPaymentInitializationActionTuple,
} from '@/services/dto/payment-initialization.dto';

export type OrderPageAction = OrderPaymentInitializationAction;
export type OrderStage = 'placed' | 'collecting' | 'on-way' | 'delivered' | 'cancelled';
export type OrderPayment =
  | { kind: 'cod'; label: string; initialization: null }
  | {
      kind: 'online';
      status: 'pending' | 'succeeded' | 'canceled';
      label: string;
      confirmationUrl: string | null;
      initialization: OrderPaymentInitialization;
    };
export type OrderPaymentInitialization =
  | { status: 'READY'; continuePaymentUrl: string; canRetryCreate: false; allowedActions: readonly [] }
  | { status: 'PENDING'; continuePaymentUrl: null; canRetryCreate: false; allowedActions: readonly ['RESYNC_PAYMENT'] }
  | (BlockedPaymentInitializationBaseDto & {
      allowedActions: OrderPaymentInitializationActionTuple;
    })
  | null;

export interface OrderPageDto {
  id: string;
  orderNumber: number;
  status: string;
  stage: OrderStage;
  statusLabel: string;
  createdAt: string;
  createdAtLabel: string;
  contact: { name: string; phone: string; email: string };
  delivery: {
    method: string;
    address: string;
    date: string | null;
    dateLabel: string | null;
    window: string;
    comment: string | null;
    city: string;
    pickupPoint: string | null;
    floor: number | null;
    liftType: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    href: string;
    imageUrl: string | null;
    configuration: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  totals: {
    itemsSubtotal: number;
    discount: number;
    delivery: number;
    services: number;
    total: number;
    couponCode: string | null;
    serviceLines: Array<{ id: string; label: string; amount: number }>;
  };
  payment: OrderPayment;
  reviewTargets: Array<{ productId: string; name: string; href: string; eligible: boolean; reviewed: boolean }>;
  canCancel: boolean;
}

export function buildBlockedOrderPaymentInitialization(
  orderNumber: number,
  canCancel: boolean,
): OrderPaymentInitialization {
  return {
    status: 'PAYMENT_INITIALIZATION_BLOCKED',
    orderNumber,
    heading: 'Платёж требует проверки',
    message: `Заказ №${orderNumber} сохранён. Повторное создание платежа отключено; статус проверяется.`,
    continuePaymentUrl: null,
    canRetryCreate: false,
    allowedActions: canCancel ? ['RESYNC_PAYMENT', 'CANCEL_ORDER'] : ['RESYNC_PAYMENT'],
  };
}

import type { OrderStatus, PaymentInitializationState } from '@prisma/client';

// Управляемый пайплайн: следующий статус «вперёд». Терминальные → null.
const ORDER_FLOW: Record<OrderStatus, OrderStatus | null> = {
  PENDING: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
};

export function nextOrderStatus(s: OrderStatus): OrderStatus | null {
  return ORDER_FLOW[s];
}

// Отмена с возвратом стока разрешена только до отгрузки (сток списан при оформлении).
const CANCELLABLE: ReadonlySet<OrderStatus> = new Set<OrderStatus>(['PENDING', 'PROCESSING']);

export function canCancelOrder(s: OrderStatus): boolean {
  return CANCELLABLE.has(s);
}

export type AdminPaymentSettlement = 'NONE' | 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';

export type AdminCancelBlockReason =
  | 'STATUS_NOT_CANCELLABLE'
  | 'PAYMENT_DISPATCH_EVIDENCE_PRESENT'
  | 'PAYMENT_SUCCEEDED_REFUND_REQUIRED'
  | 'PAYMENT_CLAIM_IN_FLIGHT'
  | 'PAYMENT_STATE_UNSAFE';

export const ADMIN_CANCEL_POLICY: Record<PaymentInitializationState, AdminCancelBlockReason | 'ALLOWED_IF_UNSETTLED'> =
  {
    READY: 'ALLOWED_IF_UNSETTLED',
    CLAIMED: 'PAYMENT_CLAIM_IN_FLIGHT',
    DISPATCHED: 'PAYMENT_STATE_UNSAFE',
    CORRELATED: 'PAYMENT_STATE_UNSAFE',
    NOT_CREATED: 'ALLOWED_IF_UNSETTLED',
  };

export function classifyAdminPaymentSettlement(payment: { status: string } | null): AdminPaymentSettlement {
  if (!payment) return 'NONE';

  switch (payment.status) {
    case 'pending':
    case 'waiting_for_capture':
      return 'PENDING';
    case 'succeeded':
      return 'SUCCEEDED';
    case 'canceled':
      return 'FAILED';
    default:
      return 'UNKNOWN';
  }
}

export function canAdminCancel(order: {
  status: OrderStatus;
  paymentInitializationState: PaymentInitializationState | null;
  paymentInitializationClaimedAt: Date | null;
  paymentEverDispatchedAt: Date | null;
  payment: { status: string } | null;
}): { ok: true } | { ok: false; reason: AdminCancelBlockReason } {
  if (!canCancelOrder(order.status)) {
    return { ok: false, reason: 'STATUS_NOT_CANCELLABLE' };
  }

  if (order.paymentEverDispatchedAt !== null) {
    return { ok: false, reason: 'PAYMENT_DISPATCH_EVIDENCE_PRESENT' };
  }

  const settlement = classifyAdminPaymentSettlement(order.payment);
  if (settlement === 'SUCCEEDED') {
    return { ok: false, reason: 'PAYMENT_SUCCEEDED_REFUND_REQUIRED' };
  }

  if (order.paymentInitializationState === 'CLAIMED' || order.paymentInitializationClaimedAt !== null) {
    return { ok: false, reason: 'PAYMENT_CLAIM_IN_FLIGHT' };
  }

  if (order.paymentInitializationState === 'DISPATCHED' || order.paymentInitializationState === 'CORRELATED') {
    return { ok: false, reason: 'PAYMENT_STATE_UNSAFE' };
  }

  if (settlement === 'PENDING' || settlement === 'UNKNOWN') {
    return { ok: false, reason: 'PAYMENT_STATE_UNSAFE' };
  }

  const initializationPolicy =
    order.paymentInitializationState === null
      ? 'ALLOWED_IF_UNSETTLED'
      : ADMIN_CANCEL_POLICY[order.paymentInitializationState];

  if (initializationPolicy !== 'ALLOWED_IF_UNSETTLED') {
    return {
      ok: false,
      reason: initializationPolicy ?? 'PAYMENT_STATE_UNSAFE',
    };
  }

  return { ok: true };
}

// Текст кнопки «вперёд»; ключ — ТЕКУЩИЙ статус заказа.
export const FORWARD_ACTION_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Взять в обработку',
  PROCESSING: 'Отметить отгруженным',
  SHIPPED: 'Отметить доставленным',
  DELIVERED: '',
  CANCELLED: '',
};

// Бейдж/лейбл статуса платежа. Payment.status — сырая строка ('pending'|'succeeded'|'canceled').
export const PAYMENT_STATUS_META: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Ожидает оплаты', badge: 'badge badge-warning' },
  succeeded: { label: 'Оплачен', badge: 'badge badge-success' },
  canceled: { label: 'Отменён', badge: 'badge badge-danger' },
};

// Безопасный вид статуса платежа: null/COD → «Без оплаты», неизвестное значение → как есть.
export function paymentStatusView(status?: string | null): { label: string; badge: string } {
  if (!status) return { label: 'Без оплаты', badge: 'badge badge-info' };
  return PAYMENT_STATUS_META[status] ?? { label: status, badge: 'badge badge-info' };
}

// Кортежи для readEnumParam (валидация значений URL-фильтров).
export const ORDER_STATUS_VALUES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const satisfies readonly OrderStatus[];

export const PAYMENT_STATUS_VALUES = ['pending', 'succeeded', 'canceled'] as const;

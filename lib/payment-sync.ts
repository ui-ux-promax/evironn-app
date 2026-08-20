import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma-client';
import { logger } from '@/lib/logger';
import { adjustSalesCount } from '@/lib/sales-count';

export type YooKassaPaymentStatus = 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
export type PaymentSyncSource = 'webhook' | 'order-page' | 'admin';

export type PaymentReconciliationResult =
  | { kind: 'applied'; transition: 'succeeded' | 'canceled' }
  | { kind: 'repaired'; transition: 'succeeded' | 'canceled' }
  | {
      kind: 'ignored';
      reason:
        | 'already-succeeded'
        | 'already-canceled'
        | 'final-state-conflict'
        | 'remote-not-final'
        | 'unknown-remote-status'
        | 'unknown-local-status'
        | 'payment-state-changed'
        | 'order-not-pending';
    }
  | { kind: 'missing' };

type IgnoredReason = Extract<PaymentReconciliationResult, { kind: 'ignored' }>['reason'];

export interface ReconcilePaymentStatusInput {
  paymentId: string;
  remoteStatus: string;
  source: PaymentSyncSource;
  now?: () => Date;
}

const FINAL_PAYMENT_STATUSES = ['succeeded', 'canceled'] as const;
const paymentWithOrderInclude = {
  order: {
    include: {
      items: {
        include: {
          productVariant: { select: { colorway: { select: { productId: true } } } },
        },
      },
    },
  },
} satisfies Prisma.PaymentInclude;

type PaymentWithOrder = Prisma.PaymentGetPayload<{ include: typeof paymentWithOrderInclude }>;

function normalizeRemoteStatus(status: string): YooKassaPaymentStatus | null {
  if (status === 'pending' || status === 'waiting_for_capture' || status === 'succeeded' || status === 'canceled') {
    return status;
  }
  return null;
}

function logIgnoredPayment(
  reason: IgnoredReason,
  input: ReconcilePaymentStatusInput,
  payment?: Pick<PaymentWithOrder, 'status' | 'orderId'> | null,
) {
  logger.warn('payment_reconciliation_ignored', {
    reason,
    paymentId: input.paymentId,
    remoteStatus: input.remoteStatus,
    localStatus: payment?.status ?? null,
    orderId: payment?.orderId ?? null,
    source: input.source,
  });
}

async function movePendingOrderToProcessing(orderId: string): Promise<boolean> {
  const result = await prisma.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: { status: 'PROCESSING' },
  });
  return result.count > 0;
}

async function cancelPendingOrder(orderId: string): Promise<boolean> {
  const result = await prisma.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
  return result.count > 0;
}

async function restoreCanceledOrderSideEffects(payment: PaymentWithOrder): Promise<void> {
  for (const item of payment.order.items) {
    try {
      await prisma.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { increment: item.quantity } },
      });
    } catch (e) {
      logger.error('payment_canceled_stock_restore_failed', e, { variantId: item.productVariantId });
    }
  }

  await adjustSalesCount(
    payment.order.items.map((i) => ({ productId: i.productVariant.colorway.productId, quantity: i.quantity })),
    -1,
  );
}

async function applySucceeded(
  payment: PaymentWithOrder,
  input: ReconcilePaymentStatusInput,
): Promise<PaymentReconciliationResult> {
  const result = await prisma.payment.updateMany({
    where: { id: payment.id, status: { notIn: [...FINAL_PAYMENT_STATUSES] } },
    data: { status: 'succeeded', paidAt: payment.paidAt ?? (input.now ?? (() => new Date()))() },
  });
  if (result.count === 0) {
    logIgnoredPayment('payment-state-changed', input, payment);
    return { kind: 'ignored', reason: 'payment-state-changed' };
  }

  await movePendingOrderToProcessing(payment.orderId);
  return { kind: 'applied', transition: 'succeeded' };
}

async function repairSucceeded(payment: PaymentWithOrder): Promise<PaymentReconciliationResult> {
  if (payment.order.status !== 'PENDING') return { kind: 'ignored', reason: 'already-succeeded' };

  const repaired = await movePendingOrderToProcessing(payment.orderId);
  return repaired ? { kind: 'repaired', transition: 'succeeded' } : { kind: 'ignored', reason: 'already-succeeded' };
}

async function applyCanceled(
  payment: PaymentWithOrder,
  input: ReconcilePaymentStatusInput,
): Promise<PaymentReconciliationResult> {
  const result = await prisma.payment.updateMany({
    where: { id: payment.id, status: { notIn: [...FINAL_PAYMENT_STATUSES] } },
    data: { status: 'canceled' },
  });
  if (result.count === 0) {
    logIgnoredPayment('payment-state-changed', input, payment);
    return { kind: 'ignored', reason: 'payment-state-changed' };
  }

  const orderCanceled = await cancelPendingOrder(payment.orderId);
  if (!orderCanceled) return { kind: 'ignored', reason: 'order-not-pending' };

  await restoreCanceledOrderSideEffects(payment);
  return { kind: 'applied', transition: 'canceled' };
}

async function repairCanceled(payment: PaymentWithOrder): Promise<PaymentReconciliationResult> {
  if (payment.order.status !== 'PENDING') return { kind: 'ignored', reason: 'already-canceled' };

  const orderCanceled = await cancelPendingOrder(payment.orderId);
  if (!orderCanceled) return { kind: 'ignored', reason: 'order-not-pending' };

  await restoreCanceledOrderSideEffects(payment);
  return { kind: 'repaired', transition: 'canceled' };
}

export async function reconcilePaymentStatus(input: ReconcilePaymentStatusInput): Promise<PaymentReconciliationResult> {
  const remoteStatus = normalizeRemoteStatus(input.remoteStatus);
  if (!remoteStatus) {
    logIgnoredPayment('unknown-remote-status', input);
    return { kind: 'ignored', reason: 'unknown-remote-status' };
  }

  if (remoteStatus === 'pending' || remoteStatus === 'waiting_for_capture') {
    logIgnoredPayment('remote-not-final', input);
    return { kind: 'ignored', reason: 'remote-not-final' };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: paymentWithOrderInclude,
  });
  if (!payment) {
    logger.warn('payment_reconciliation_missing_payment', {
      paymentId: input.paymentId,
      remoteStatus: input.remoteStatus,
      source: input.source,
    });
    return { kind: 'missing' };
  }

  if (payment.status === 'succeeded') {
    if (remoteStatus === 'canceled') {
      logIgnoredPayment('final-state-conflict', input, payment);
      return { kind: 'ignored', reason: 'final-state-conflict' };
    }
    return repairSucceeded(payment);
  }

  if (payment.status === 'canceled') {
    if (remoteStatus === 'succeeded') {
      logIgnoredPayment('final-state-conflict', input, payment);
      return { kind: 'ignored', reason: 'final-state-conflict' };
    }
    return repairCanceled(payment);
  }

  if (payment.status !== 'pending') {
    logIgnoredPayment('unknown-local-status', input, payment);
    return { kind: 'ignored', reason: 'unknown-local-status' };
  }

  if (remoteStatus === 'succeeded') return applySucceeded(payment, input);
  return applyCanceled(payment, input);
}

export async function applyPaymentSucceeded(paymentId: string): Promise<void> {
  await reconcilePaymentStatus({ paymentId, remoteStatus: 'succeeded', source: 'webhook' });
}

export async function applyPaymentCanceled(paymentId: string): Promise<void> {
  await reconcilePaymentStatus({ paymentId, remoteStatus: 'canceled', source: 'webhook' });
}

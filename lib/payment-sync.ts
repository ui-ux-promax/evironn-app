import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma-client';
import { logger } from '@/lib/logger';
import { adjustSalesCount } from '@/lib/sales-count';
import { getPaymentDetails, isPaymentProviderStatus, refundPayment } from '@/lib/yookassa';
import { pruneReviewsAfterCancel } from '@/lib/review';

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

export type PaymentCorrelationRecoveryResult =
  | { kind: 'recovered'; paymentId: string }
  | {
      kind: 'ignored';
      reason: 'provider-payment-missing' | 'invalid-provider-correlation' | 'order-correlation-conflict' | 'local-correlation-conflict';
    }
  | { kind: 'error'; reason: 'provider-lookup-failed' | 'correlation-persist-failed' };

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
          canonicalSku: { select: { productId: true } },
          productVariant: { select: { colorway: { select: { productId: true } } } },
        },
      },
    },
  },
} satisfies Prisma.PaymentInclude;

type PaymentWithOrder = Prisma.PaymentGetPayload<{ include: typeof paymentWithOrderInclude }>;
type ProductQuantity = { productId: string; quantity: number };
type TransitionCommit = {
  result: PaymentReconciliationResult;
  salesItems: ProductQuantity[];
  pruneItems?: ProductQuantity[];
  userId?: string;
  refund?: { paymentId: string; amountRub: number };
};

function normalizeRemoteStatus(status: string): YooKassaPaymentStatus | null {
  return status === 'pending' || status === 'waiting_for_capture' || status === 'succeeded' || status === 'canceled'
    ? status
    : null;
}

function salesItems(payment: PaymentWithOrder): ProductQuantity[] {
  return payment.order.items.flatMap((item) =>
    item.canonicalSku
      ? [{ productId: item.canonicalSku.productId, quantity: item.quantity }]
      : item.productVariant
        ? [{ productId: item.productVariant.colorway.productId, quantity: item.quantity }]
        : [],
  );
}

async function restoreStock(tx: typeof prisma, payment: PaymentWithOrder): Promise<void> {
  for (const item of payment.order.items) {
    if (item.skuId) {
      await tx.sku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } });
    } else if (item.productVariantId) {
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }
}

function ignored(reason: Extract<PaymentReconciliationResult, { kind: 'ignored' }>['reason']): TransitionCommit {
  return { result: { kind: 'ignored', reason }, salesItems: [] };
}

export async function reconcilePaymentStatus(input: ReconcilePaymentStatusInput): Promise<PaymentReconciliationResult> {
  const remoteStatus = normalizeRemoteStatus(input.remoteStatus);
  if (!remoteStatus) return { kind: 'ignored', reason: 'unknown-remote-status' };
  if (remoteStatus === 'pending' || remoteStatus === 'waiting_for_capture') {
    return { kind: 'ignored', reason: 'remote-not-final' };
  }

  const committed = await prisma.$transaction<TransitionCommit>(
    async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: input.paymentId }, include: paymentWithOrderInclude });
      if (!payment) return { result: { kind: 'missing' }, salesItems: [] } satisfies TransitionCommit;

      if (payment.status === 'succeeded' && remoteStatus === 'canceled') return ignored('final-state-conflict');
      if (payment.status === 'canceled' && remoteStatus === 'succeeded') return ignored('final-state-conflict');
      if (
        payment.status !== 'pending' &&
        payment.status !== 'waiting_for_capture' &&
        payment.status !== 'succeeded' &&
        payment.status !== 'canceled'
      ) {
        return ignored('unknown-local-status');
      }

      if (remoteStatus === 'succeeded') {
        if (payment.order.status === 'CANCELLED') {
          if (payment.status === 'canceled') return ignored('final-state-conflict');
          if (payment.status !== 'succeeded') {
            const paymentWrite = await tx.payment.updateMany({
              where: { id: payment.id, status: { notIn: [...FINAL_PAYMENT_STATUSES] } },
              data: { status: 'succeeded', paidAt: payment.paidAt ?? (input.now ?? (() => new Date()))() },
            });
            if (!paymentWrite.count) return ignored('payment-state-changed');
          }
          return {
            result: { kind: 'ignored', reason: 'already-canceled' },
            salesItems: [],
            refund: { paymentId: payment.id, amountRub: payment.order.totalAmount },
          } satisfies TransitionCommit;
        }
        if (payment.status === 'succeeded') {
          if (payment.order.status !== 'PENDING') return ignored('already-succeeded');
          const order = await tx.order.updateMany({
            where: { id: payment.orderId, status: 'PENDING' },
            data: { status: 'PROCESSING' },
          });
          return order.count
            ? { result: { kind: 'repaired', transition: 'succeeded' }, salesItems: [] }
            : ignored('already-succeeded');
        }
        const paymentWrite = await tx.payment.updateMany({
          where: { id: payment.id, status: { notIn: [...FINAL_PAYMENT_STATUSES] } },
          data: { status: 'succeeded', paidAt: payment.paidAt ?? (input.now ?? (() => new Date()))() },
        });
        if (!paymentWrite.count) return ignored('payment-state-changed');
        const orderWrite = await tx.order.updateMany({
          where: { id: payment.orderId, status: 'PENDING' },
          data: { status: 'PROCESSING' },
        });
        if (!orderWrite.count) throw new Error('PAYMENT_ORDER_TRANSITION_LOST');
        return { result: { kind: 'applied', transition: 'succeeded' }, salesItems: [] } satisfies TransitionCommit;
      }

      if (payment.order.status === 'CANCELLED') {
        if (payment.status !== 'canceled') {
          const paymentWrite = await tx.payment.updateMany({
            where: { id: payment.id, status: { notIn: [...FINAL_PAYMENT_STATUSES] } },
            data: { status: 'canceled' },
          });
          if (!paymentWrite.count) return ignored('payment-state-changed');
        }
        return {
          result: { kind: 'ignored', reason: 'already-canceled' },
          salesItems: [],
          pruneItems: salesItems(payment),
          userId: payment.order.userId,
        } satisfies TransitionCommit;
      }

      const repairing = payment.status === 'canceled';
      if (repairing && payment.order.status !== 'PENDING') {
        return ignored('already-canceled');
      }
      if (!repairing) {
        const paymentWrite = await tx.payment.updateMany({
          where: { id: payment.id, status: { notIn: [...FINAL_PAYMENT_STATUSES] } },
          data: { status: 'canceled' },
        });
        if (!paymentWrite.count) return ignored('payment-state-changed');
      }
      const orderWrite = await tx.order.updateMany({
        where: { id: payment.orderId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
      if (!orderWrite.count) {
        if (!repairing) throw new Error('PAYMENT_ORDER_TRANSITION_LOST');
        return ignored('order-not-pending');
      }
      await restoreStock(tx as typeof prisma, payment);
      const result: PaymentReconciliationResult = repairing
        ? { kind: 'repaired', transition: 'canceled' }
        : { kind: 'applied', transition: 'canceled' };
      return {
        result,
        salesItems: salesItems(payment),
        pruneItems: salesItems(payment),
        userId: payment.order.userId,
      } satisfies TransitionCommit;
    },
    { isolationLevel: 'Serializable' },
  ).catch((error) => {
    if (error instanceof Error && error.message === 'PAYMENT_ORDER_TRANSITION_LOST') return ignored('order-not-pending');
    throw error;
  });

  if ((committed.result.kind === 'applied' || committed.result.kind === 'repaired') && committed.result.transition === 'canceled') {
    await adjustSalesCount(committed.salesItems, -1);
  }
  if (committed.refund) {
    try {
      await refundPayment(committed.refund.paymentId, committed.refund.amountRub);
    } catch (error) {
      logger.error('late_payment_refund_failed', error, {
        paymentId: committed.refund.paymentId,
        amountRub: committed.refund.amountRub,
      });
      throw error;
    }
  }
  if (committed.userId && committed.pruneItems) {
    await pruneReviewsAfterCancel(committed.userId, [...new Set(committed.pruneItems.map((item) => item.productId))]);
  }
  return committed.result;
}

export async function recoverPaymentCorrelation(
  providerId: string,
  now: () => Date = () => new Date(),
  dependencies: { providerLookup?: typeof getPaymentDetails; client?: typeof prisma } = {},
): Promise<PaymentCorrelationRecoveryResult> {
  const providerLookup = dependencies.providerLookup ?? getPaymentDetails;
  const client = dependencies.client ?? prisma;
  let details;
  try {
    details = await providerLookup(providerId);
  } catch (error) {
    logger.error('payment_recovery_lookup_failed', error, { providerId });
    return { kind: 'error', reason: 'provider-lookup-failed' };
  }
  if (!details) return { kind: 'ignored', reason: 'provider-payment-missing' };
  if (!isPaymentProviderStatus(details.status)) {
    logger.error('payment_recovery_invalid_provider_status', new Error('Malformed YooKassa payment response'), {
      providerId,
    });
    return { kind: 'error', reason: 'provider-lookup-failed' };
  }
  if (details.id !== providerId) return { kind: 'ignored', reason: 'invalid-provider-correlation' };
  const paidAt = details.status === 'succeeded' ? now() : null;
  const orderNumber = Number(details.orderNumber);
  if (!Number.isSafeInteger(orderNumber) || orderNumber <= 0 || String(orderNumber) !== details.orderNumber) {
    return { kind: 'ignored', reason: 'invalid-provider-correlation' };
  }
  const candidates = await client.order.findMany({
    where: { orderNumber, paymentMethod: 'online', status: 'PENDING', totalAmount: details.amountRub },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      paymentInitializationState: true,
      paymentEverDispatchedAt: true,
      payment: { select: { id: true, amount: true } },
    },
  });
  if (candidates.length !== 1) return { kind: 'ignored', reason: 'order-correlation-conflict' };
  const candidate = candidates[0];
  if (candidate.payment && (candidate.payment.id !== providerId || candidate.payment.amount !== details.amountRub)) {
    return { kind: 'ignored', reason: 'local-correlation-conflict' };
  }

  try {
    const saved = await client.$transaction(
      async (tx) => {
        const current = await tx.order.findUnique({
          where: { id: candidate.id, orderNumber },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentMethod: true,
            totalAmount: true,
            paymentEverDispatchedAt: true,
            payment: { select: { id: true, amount: true } },
          },
        });
        if (
          !current ||
          current.status !== 'PENDING' ||
          current.paymentMethod !== 'online' ||
          current.totalAmount !== details.amountRub ||
          (current.payment && (current.payment.id !== providerId || current.payment.amount !== details.amountRub))
        ) {
          return false;
        }
        const guard = await tx.order.updateMany({
          where: {
            id: current.id,
            orderNumber,
            status: 'PENDING',
            paymentMethod: 'online',
            totalAmount: details.amountRub,
            ...(current.payment
              ? { payment: { is: { id: providerId, amount: details.amountRub } } }
              : { payment: { is: null } }),
          },
          data: {
            paymentInitializationState: 'CORRELATED',
            paymentInitializationClaimedAt: null,
            paymentEverDispatchedAt: current.paymentEverDispatchedAt ?? now(),
          },
        });
        if (!guard.count) return false;
        if (!current.payment) {
          await tx.payment.create({
            data: {
              id: providerId,
              orderId: current.id,
              amount: details.amountRub,
              status: details.status,
              paidAt,
              confirmationUrl: details.confirmationUrl,
            },
          });
        }
        return true;
      },
      { isolationLevel: 'Serializable' },
    );
    return saved
      ? { kind: 'recovered', paymentId: providerId }
      : { kind: 'ignored', reason: 'local-correlation-conflict' };
  } catch (error) {
    logger.error('payment_recovery_persist_failed', error, { providerId, orderId: candidate.id });
    return { kind: 'error', reason: 'correlation-persist-failed' };
  }
}

export async function applyPaymentSucceeded(paymentId: string): Promise<void> {
  await reconcilePaymentStatus({ paymentId, remoteStatus: 'succeeded', source: 'webhook' });
}

export async function applyPaymentCanceled(paymentId: string): Promise<void> {
  await reconcilePaymentStatus({ paymentId, remoteStatus: 'canceled', source: 'webhook' });
}

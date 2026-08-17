import { prisma } from '@/lib/prisma-client';
import { logger } from '@/lib/logger';
import {
  createPaymentAttempt,
  getPaymentDetails,
  type PaymentProviderAttempt,
  type PaymentProviderDetails,
} from '@/lib/yookassa';

export const PAYMENT_CREATE_RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;

export interface DurablePaymentRequest {
  amountRub: number;
  capture: true;
  description: string;
  idempotencyKey: string;
  locale: 'ru_RU';
  metadata: { orderNumber: string };
  returnUrl: string;
}
export interface PaymentProviderAdapter {
  createPayment(input: DurablePaymentRequest): Promise<PaymentProviderAttempt>;
  getPaymentDetails(paymentId: string): Promise<PaymentProviderDetails | null>;
}
interface InitializationOrder {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  paymentReturnUrl: string | null;
  createdAt: Date;
  paymentInitializationState: 'READY' | 'CLAIMED' | 'DISPATCHED' | 'CORRELATED' | 'NOT_CREATED' | null;
  paymentInitializationClaimedAt: Date | null;
  paymentEverDispatchedAt: Date | null;
  payment: { id: string; amount: number; status: string; confirmationUrl: string | null } | null;
  items: Array<{ skuId: string | null; quantity: number }>;
}
interface Tx {
  order: {
    updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
  };
  payment: {
    findUnique(args: { where: { orderId: string }; select: { id: true } }): Promise<{ id: string } | null>;
    upsert(args: {
      where: { orderId: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<unknown>;
  };
  sku: { update(args: { where: { id: string }; data: { stock: { increment: number } } }): Promise<unknown> };
}
export interface PaymentInitializationClient {
  order: {
    findUnique(args: { where: { id: string }; include: Record<string, unknown> }): Promise<InitializationOrder | null>;
  };
  $transaction<T>(operation: (tx: Tx) => Promise<T>, options?: { isolationLevel: 'Serializable' }): Promise<T>;
}
export type PaymentInitializationResult =
  | { outcome: 'NOT_CREATED' }
  | { outcome: 'CREATED'; confirmationUrl: string | null }
  | { outcome: 'INDETERMINATE' }
  | { outcome: 'BLOCKED_AFTER_RETRY_WINDOW' };

const defaultClient = prisma as unknown as PaymentInitializationClient;
const defaultProvider: PaymentProviderAdapter = { createPayment: createPaymentAttempt, getPaymentDetails };
const include = { payment: true, items: { select: { skuId: true, quantity: true } } };
const indeterminate = (event: string, error?: unknown) => {
  if (error) logger.error(event, error);
  return { outcome: 'INDETERMINATE' } as const;
};

function request(order: InitializationOrder): DurablePaymentRequest {
  if (!order.paymentReturnUrl) throw new Error('Online order is missing payment return URL');
  return {
    amountRub: order.totalAmount,
    capture: true,
    description: `Заказ #${order.orderNumber}`,
    idempotencyKey: `payment-${order.id}`,
    locale: 'ru_RU',
    metadata: { orderNumber: String(order.orderNumber) },
    returnUrl: order.paymentReturnUrl,
  };
}
function verify(order: InitializationOrder, payment: PaymentProviderDetails) {
  if (
    payment.amountRub !== order.totalAmount ||
    payment.orderNumber !== String(order.orderNumber) ||
    (order.payment && order.payment.id !== payment.id)
  )
    throw new Error('Provider payment correlation conflict');
}

export async function ensureOnlinePayment({
  orderId,
  now,
  client = defaultClient,
  provider = defaultProvider,
  clock = () => new Date(),
}: {
  orderId: string;
  now: Date;
  client?: PaymentInitializationClient;
  provider?: PaymentProviderAdapter;
  clock?: () => Date;
}): Promise<PaymentInitializationResult> {
  try {
    let order = await client.order.findUnique({ where: { id: orderId }, include });
    if (!order || order.paymentMethod !== 'online' || order.status !== 'PENDING')
      return indeterminate('payment_initialization_invalid_order');
    if (order.payment) {
      let details: PaymentProviderDetails | null;
      try {
        details = await provider.getPaymentDetails(order.payment.id);
      } catch (error) {
        return indeterminate('payment_lookup_failed', error);
      }
      if (!details) return indeterminate('payment_lookup_missing');
      verify(order, details);
      try {
        const saved = await client.$transaction(
          async (tx) => {
            const current = await tx.payment.findUnique({ where: { orderId }, select: { id: true } });
            if (current && current.id !== details!.id) throw new Error('Provider payment correlation conflict');
            const guard = await tx.order.updateMany({
              where: {
                id: orderId,
                status: 'PENDING',
                paymentMethod: 'online',
                payment: { isNot: null },
                paymentInitializationState: { in: ['CLAIMED', 'DISPATCHED', 'CORRELATED'] },
                paymentEverDispatchedAt: order.paymentEverDispatchedAt,
              },
              data: {
                paymentInitializationState: 'CORRELATED',
                paymentInitializationClaimedAt: null,
                paymentEverDispatchedAt: order.paymentEverDispatchedAt ?? clock(),
              },
            });
            if (!guard.count) return false;
            await tx.payment.upsert({
              where: { orderId },
              create: {
                id: details!.id,
                orderId,
                amount: order!.totalAmount,
                status: details!.status,
                confirmationUrl: details!.confirmationUrl,
              },
              update: {
                amount: order!.totalAmount,
                status: details!.status,
                confirmationUrl: details!.confirmationUrl,
              },
            });
            return true;
          },
          { isolationLevel: 'Serializable' },
        );
        return saved
          ? { outcome: 'CREATED', confirmationUrl: details.confirmationUrl }
          : indeterminate('payment_correlation_guard_lost');
      } catch (error) {
        return indeterminate('payment_correlation_persist_failed', error);
      }
    }
    const origin =
      order.paymentInitializationState === 'DISPATCHED'
        ? 'DISPATCHED'
        : order.paymentInitializationState === 'READY' || !('paymentInitializationState' in order)
          ? 'READY'
          : null;
    if (!origin) return indeterminate('payment_initialization_state_not_claimable');
    const claimStartedAt = clock();
    if (claimStartedAt.getTime() >= order.createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS)
      return { outcome: 'BLOCKED_AFTER_RETRY_WINDOW' };
    const originEvidence = order.paymentEverDispatchedAt;
    const claim = await client.$transaction(
      async (tx) =>
        tx.order.updateMany({
          where: {
            id: orderId,
            status: 'PENDING',
            paymentMethod: 'online',
            payment: { is: null },
            paymentInitializationState: origin,
            paymentInitializationClaimedAt: null,
            paymentEverDispatchedAt: originEvidence,
            createdAt: { gt: new Date(claimStartedAt.getTime() - PAYMENT_CREATE_RETRY_WINDOW_MS) },
          },
          data: { paymentInitializationState: 'CLAIMED', paymentInitializationClaimedAt: claimStartedAt },
        }),
      { isolationLevel: 'Serializable' },
    );
    if (!claim.count) return indeterminate('payment_claim_lost');
    const dispatchNow = clock();
    if (dispatchNow.getTime() >= order.createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS) {
      const released = await client.$transaction(
        async (tx) =>
          tx.order.updateMany({
            where: {
              id: orderId,
              status: 'PENDING',
              paymentMethod: 'online',
              payment: { is: null },
              paymentInitializationState: 'CLAIMED',
              paymentInitializationClaimedAt: claimStartedAt,
              paymentEverDispatchedAt: originEvidence,
            },
            data: { paymentInitializationState: origin, paymentInitializationClaimedAt: null },
          }),
        { isolationLevel: 'Serializable' },
      );
      return released.count ? { outcome: 'BLOCKED_AFTER_RETRY_WINDOW' } : indeterminate('payment_claim_release_failed');
    }
    let attempt: PaymentProviderAttempt;
    let durableRequest: DurablePaymentRequest;
    try {
      durableRequest = request(order);
    } catch (error) {
      try {
        const released = await client.$transaction(
          async (tx) =>
            tx.order.updateMany({
              where: {
                id: orderId,
                status: 'PENDING',
                paymentMethod: 'online',
                payment: { is: null },
                paymentInitializationState: 'CLAIMED',
                paymentInitializationClaimedAt: claimStartedAt,
                paymentEverDispatchedAt: originEvidence,
              },
              data: { paymentInitializationState: origin, paymentInitializationClaimedAt: null },
            }),
          { isolationLevel: 'Serializable' },
        );
        if (!released.count) logger.error('payment_request_release_guard_lost', error, { orderId });
      } catch (releaseError) {
        logger.error('payment_request_release_failed', releaseError, { orderId });
      }
      return indeterminate('payment_request_failed', error);
    }
    try {
      attempt = await provider.createPayment(durableRequest);
    } catch (error) {
      try {
        await client.$transaction(
          async (tx) =>
            tx.order.updateMany({
              where: {
                id: orderId,
                status: 'PENDING',
                paymentMethod: 'online',
                payment: { is: null },
                paymentInitializationState: 'CLAIMED',
                paymentInitializationClaimedAt: claimStartedAt,
                paymentEverDispatchedAt: originEvidence,
              },
              data: {
                paymentInitializationState: 'DISPATCHED',
                paymentInitializationClaimedAt: null,
                paymentEverDispatchedAt: originEvidence ?? dispatchNow,
              },
            }),
          { isolationLevel: 'Serializable' },
        );
      } catch (releaseError) {
        logger.error('payment_provider_failure_release_failed', releaseError, { orderId });
      }
      return indeterminate('payment_provider_failed', error);
    }
    if (attempt.outcome === 'CREATED') {
      try {
        verify(order, attempt.payment);
        const saved = await client.$transaction(
          async (tx) => {
            const guard = await tx.order.updateMany({
              where: {
                id: orderId,
                status: 'PENDING',
                paymentMethod: 'online',
                payment: { is: null },
                paymentInitializationState: 'CLAIMED',
                paymentInitializationClaimedAt: claimStartedAt,
                paymentEverDispatchedAt: originEvidence,
              },
              data: {
                paymentInitializationState: 'CORRELATED',
                paymentInitializationClaimedAt: null,
                paymentEverDispatchedAt: originEvidence ?? dispatchNow,
              },
            });
            if (!guard.count) return false;
            await tx.payment.upsert({
              where: { orderId },
              create: {
                id: attempt.payment.id,
                orderId,
                amount: order.totalAmount,
                status: attempt.payment.status,
                confirmationUrl: attempt.payment.confirmationUrl,
              },
              update: {
                amount: order.totalAmount,
                status: attempt.payment.status,
                confirmationUrl: attempt.payment.confirmationUrl,
              },
            });
            return true;
          },
          { isolationLevel: 'Serializable' },
        );
        return saved
          ? { outcome: 'CREATED', confirmationUrl: attempt.payment.confirmationUrl }
          : indeterminate('payment_create_guard_lost');
      } catch (error) {
        return indeterminate('payment_create_persist_failed', error);
      }
    }
    if (attempt.outcome === 'INDETERMINATE' && attempt.dispatched) {
      try {
        const saved = await client.$transaction(
          async (tx) =>
            tx.order.updateMany({
              where: {
                id: orderId,
                status: 'PENDING',
                paymentMethod: 'online',
                payment: { is: null },
                paymentInitializationState: 'CLAIMED',
                paymentInitializationClaimedAt: claimStartedAt,
                paymentEverDispatchedAt: originEvidence,
              },
              data: {
                paymentInitializationState: 'DISPATCHED',
                paymentInitializationClaimedAt: null,
                paymentEverDispatchedAt: originEvidence ?? dispatchNow,
              },
            }),
          { isolationLevel: 'Serializable' },
        );
        return saved.count ? { outcome: 'INDETERMINATE' } : indeterminate('payment_dispatch_guard_lost');
      } catch (error) {
        return indeterminate('payment_dispatch_persist_failed', error);
      }
    }
    if (origin === 'DISPATCHED') {
      try {
        const released = await client.$transaction(
          async (tx) =>
            tx.order.updateMany({
              where: {
                id: orderId,
                status: 'PENDING',
                paymentMethod: 'online',
                payment: { is: null },
                paymentInitializationState: 'CLAIMED',
                paymentInitializationClaimedAt: claimStartedAt,
                paymentEverDispatchedAt: originEvidence,
              },
              data: { paymentInitializationState: 'DISPATCHED', paymentInitializationClaimedAt: null },
            }),
          { isolationLevel: 'Serializable' },
        );
        return released.count
          ? { outcome: 'INDETERMINATE' }
          : indeterminate('payment_prior_dispatch_release_guard_lost');
      } catch (error) {
        return indeterminate('payment_prior_dispatch_release_failed', error);
      }
    }
    try {
      const cancelled = await client.$transaction(
        async (tx) => {
          const guard = await tx.order.updateMany({
            where: {
              id: orderId,
              status: 'PENDING',
              paymentMethod: 'online',
              payment: { is: null },
              paymentInitializationState: 'CLAIMED',
              paymentInitializationClaimedAt: claimStartedAt,
              paymentEverDispatchedAt: null,
            },
            data: {
              status: 'CANCELLED',
              paymentInitializationState: 'NOT_CREATED',
              paymentInitializationClaimedAt: null,
            },
          });
          if (!guard.count) return false;
          for (const item of order!.items) {
            if (!item.skuId) throw new Error('Canonical order item required');
            await tx.sku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } });
          }
          return true;
        },
        { isolationLevel: 'Serializable' },
      );
      return cancelled ? { outcome: 'NOT_CREATED' } : indeterminate('payment_cancel_guard_lost');
    } catch (error) {
      return indeterminate('payment_cancel_failed', error);
    }
  } catch (error) {
    return indeterminate('payment_initialization_failed', error);
  }
}

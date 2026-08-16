import { prisma } from '@/lib/prisma-client';
import {
  createPaymentAttempt,
  getPaymentDetails,
  type PaymentProviderAttempt,
  type PaymentProviderDetails,
} from '@/lib/yookassa';

export const PAYMENT_PROVIDER_RETENTION_MS = 24 * 60 * 60 * 1000;
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
  payment: { id: string; amount: number; status: string; confirmationUrl: string | null } | null;
  items: Array<{ skuId: string | null; quantity: number }>;
}

interface CancellationTransaction {
  order: {
    updateMany(args: {
      where: { id: string; status: 'PENDING' };
      data: { status: 'CANCELLED' };
    }): Promise<{ count: number }>;
  };
  sku: {
    update(args: { where: { id: string }; data: { stock: { increment: number } } }): Promise<unknown>;
  };
}

export interface PaymentInitializationClient {
  order: {
    findUnique(args: {
      where: { id: string };
      include: { payment: true; items: { select: { skuId: true; quantity: true } } };
    }): Promise<InitializationOrder | null>;
  };
  payment: {
    upsert(args: {
      where: { orderId: string };
      create: { id: string; orderId: string; amount: number; status: string; confirmationUrl: string | null };
      update: { amount: number; status: string; confirmationUrl: string | null };
    }): Promise<unknown>;
  };
  $transaction<T>(operation: (transaction: CancellationTransaction) => Promise<T>): Promise<T>;
}

export type PaymentInitializationResult =
  | { outcome: 'NOT_CREATED' }
  | { outcome: 'CREATED'; confirmationUrl: string | null }
  | { outcome: 'INDETERMINATE' }
  | { outcome: 'BLOCKED_AFTER_RETRY_WINDOW' };

const defaultClient = prisma as unknown as PaymentInitializationClient;
const defaultProvider: PaymentProviderAdapter = {
  createPayment: createPaymentAttempt,
  getPaymentDetails,
};

function durableRequest(order: InitializationOrder): DurablePaymentRequest {
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

function verifyPayment(order: InitializationOrder, payment: PaymentProviderDetails): void {
  if (payment.amountRub !== order.totalAmount || payment.orderNumber !== String(order.orderNumber)) {
    throw new Error('Provider payment correlation conflict');
  }
  if (order.payment && order.payment.id !== payment.id) throw new Error('Provider payment correlation conflict');
}

async function persistPayment(
  client: PaymentInitializationClient,
  order: InitializationOrder,
  payment: PaymentProviderDetails,
): Promise<boolean> {
  verifyPayment(order, payment);
  try {
    await client.payment.upsert({
      where: { orderId: order.id },
      create: {
        id: payment.id,
        orderId: order.id,
        amount: order.totalAmount,
        status: payment.status,
        confirmationUrl: payment.confirmationUrl,
      },
      update: {
        amount: order.totalAmount,
        status: payment.status,
        confirmationUrl: payment.confirmationUrl,
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function cancelUncreatedPayment(client: PaymentInitializationClient, order: InitializationOrder): Promise<void> {
  await client.$transaction(async (transaction) => {
    const cancelled = await transaction.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    if (cancelled.count === 0) return;
    for (const item of order.items) {
      if (!item.skuId) throw new Error('Canonical order item required for stock restoration');
      await transaction.sku.update({
        where: { id: item.skuId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}

export async function ensureOnlinePayment({
  orderId,
  now,
  client = defaultClient,
  provider = defaultProvider,
}: {
  orderId: string;
  now: Date;
  client?: PaymentInitializationClient;
  provider?: PaymentProviderAdapter;
}): Promise<PaymentInitializationResult> {
  const order = await client.order.findUnique({
    where: { id: orderId },
    include: { payment: true, items: { select: { skuId: true, quantity: true } } },
  });
  if (!order || order.paymentMethod !== 'online' || order.status !== 'PENDING') return { outcome: 'INDETERMINATE' };

  if (order.payment) {
    const details = await provider.getPaymentDetails(order.payment.id);
    if (!details) return { outcome: 'INDETERMINATE' };
    const persisted = await persistPayment(client, order, details);
    return persisted ? { outcome: 'CREATED', confirmationUrl: details.confirmationUrl } : { outcome: 'INDETERMINATE' };
  }

  if (now.getTime() >= order.createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS) {
    return { outcome: 'BLOCKED_AFTER_RETRY_WINDOW' };
  }

  let attempt: PaymentProviderAttempt;
  try {
    attempt = await provider.createPayment(durableRequest(order));
  } catch {
    return { outcome: 'INDETERMINATE' };
  }
  if (attempt.outcome === 'NOT_CREATED' && attempt.dispatched === false) {
    await cancelUncreatedPayment(client, order);
    return { outcome: 'NOT_CREATED' };
  }
  if (attempt.outcome !== 'CREATED') return { outcome: 'INDETERMINATE' };

  const persisted = await persistPayment(client, order, attempt.payment);
  return persisted
    ? { outcome: 'CREATED', confirmationUrl: attempt.payment.confirmationUrl }
    : { outcome: 'INDETERMINATE' };
}

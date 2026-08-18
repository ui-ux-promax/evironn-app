'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma-client';
import { cartCookieName } from '@/lib/cart-cookie';
import { resolveOwnerCart } from '@/lib/cart';
import { isCanonicalCartQuantity } from '@/lib/cart-quantity';
import { buildCheckoutOrderData } from '@/lib/checkout-page';
import {
  OrderTransactionConflictError,
  resolveDeliverySnapshot,
  runSerializableOrderTransaction,
  serializeServiceDetails,
} from '@/lib/order';
import { logger } from '@/lib/logger';
import { cancelPayment, getPaymentDetails, siteUrl, toOrigin, validateYooKassaConfiguration } from '@/lib/yookassa';
import { pruneReviewsAfterCancel } from '@/lib/review';
import { adjustSalesCount } from '@/lib/sales-count';
import { ensureOnlinePayment } from '@/lib/payment-initialization';
import { reconcilePaymentStatus } from '@/lib/payment-sync';
import { assertPortfolioPaymentMode } from '@/lib/payment-environment';
import { buildBlockedPaymentInitializationDto } from '@/services/dto/checkout-page.dto';
import {
  placeOrderSchema,
  type PlaceOrderFailureCode,
  type PlaceOrderInput,
  type PlaceOrderResult,
} from '@/services/dto/order.dto';
import { getOrderPageDto } from '@/lib/order-page';

export async function resyncOrderPayment(orderNumber: number): Promise<
  | { ok: true; order: Awaited<ReturnType<typeof getOrderPageDto>> }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };
  const order = await prisma.order.findFirst({ where: { userId: session.user.id, orderNumber }, include: { payment: true } });
  if (!order) return { ok: false, error: 'Заказ не найден' };
  if (order.status !== 'PENDING' || order.paymentMethod !== 'online') {
    return { ok: false, error: 'Статус платежа этого заказа нельзя обновить' };
  }
  if (order.payment?.id) {
    try {
      const details = await getPaymentDetails(order.payment.id);
      if (
        details &&
        details.id === order.payment.id &&
        details.amountRub === order.totalAmount &&
        details.orderNumber === String(order.orderNumber)
      ) {
        await reconcilePaymentStatus({ paymentId: order.payment.id, remoteStatus: details.status, source: 'order-page' });
      }
    } catch (error) { logger.error('order_payment_resync_failed', error, { orderNumber }); }
  }
  const refreshed = await getOrderPageDto({ userId: session.user.id, orderNumber });
  if (!refreshed) return { ok: false, error: 'Заказ не найден' };
  revalidatePath(`/orders/${orderNumber}`);
  return { ok: true, order: refreshed };
}

type OrderTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const DOMAIN_PLACEMENT_ERROR_CODES = new Set<PlaceOrderFailureCode>([
  'INVALID_INPUT',
  'EMPTY_CART',
  'SKU_UNAVAILABLE',
  'QUANTITY_EXCEEDS_STOCK',
  'INVALID_COUPON',
  'STALE_DELIVERY_SLOT',
  'CART_CONFLICT',
]);

function isDomainPlacementError(error: unknown): error is Error & { code: PlaceOrderFailureCode } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    DOMAIN_PLACEMENT_ERROR_CODES.has(error.code as PlaceOrderFailureCode)
  );
}

function placementError(error: unknown): PlaceOrderResult {
  if (error instanceof OrderTransactionConflictError) return { ok: false, code: error.code, error: error.message };
  if (isDomainPlacementError(error)) {
    return { ok: false, code: error.code, error: error.message };
  }
  logger.error('place_order_failed', error);
  return { ok: false, code: 'ORDER_FAILED', error: 'Не удалось оформить заказ. Попробуйте позже.' };
}

async function recordOrderSideEffects(
  form: PlaceOrderInput,
  orderNumber: number,
  salesItems: Array<{ productId: string; quantity: number }>,
): Promise<void> {
  try {
    await adjustSalesCount(salesItems, 1);
  } catch (error) {
    logger.error('order_sales_count_failed', error, { orderNumber });
  }
  if (!form.address) return;
  try {
    const { saveAddressFromOrder } = await import('@/app/actions/address');
    await saveAddressFromOrder({
      city: form.address.city,
      street: form.address.addressLine,
      comment: form.address.addressComment ?? null,
    });
  } catch (error) {
    logger.error('order_address_save_failed', error, { orderNumber });
  }
}

export async function placeOrder(raw: unknown): Promise<PlaceOrderResult> {
  let session: { user?: { id?: string } } | null;
  try {
    session = (await auth()) as { user?: { id?: string } } | null;
  } catch (error) {
    return placementError(error);
  }
  if (!session?.user?.id) return { ok: false, code: 'UNAUTHENTICATED', error: 'Не авторизован' };
  const userId = session.user.id;

  const parsed = placeOrderSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: 'INVALID_INPUT', error: 'Проверьте поля формы' };
  const form = parsed.data;
  const now = new Date();

  if (form.paymentMethod === 'online') {
    try {
      if (process.env.YOOKASSA_MODE !== 'sandbox') throw new Error('Phase 4 requires YooKassa sandbox mode');
      assertPortfolioPaymentMode(process.env);
      validateYooKassaConfiguration();
    } catch (error) {
      logger.error('place_order_payment_configuration_failed', error);
      return { ok: false, code: 'PAYMENT_NOT_CONFIGURED', error: 'Онлайн-оплата временно недоступна.' };
    }
  }

  let owner: Awaited<ReturnType<typeof resolveOwnerCart>>;
  try {
    const store = await cookies();
    owner = await resolveOwnerCart(userId, store.get(cartCookieName)?.value, { create: false });
  } catch (error) {
    return placementError(error);
  }
  if (!owner) return { ok: false, code: 'EMPTY_CART', error: 'Корзина пуста' };

  let committed: {
    id: string;
    orderNumber: number;
    totalAmount: number;
    salesItems: Array<{ productId: string; quantity: number }>;
    paymentReturnUrl: string | null;
  };
  try {
    committed = await runSerializableOrderTransaction(prisma, async (transaction: OrderTransaction) => {
      const orderData = await buildCheckoutOrderData({
        userId,
        cartId: owner.id,
        raw: form,
        now,
        client: transaction,
      });

      for (const item of orderData.snapshot.items) {
        if (!isCanonicalCartQuantity(item.quantity)) {
          throw Object.assign(new Error('Количество товара в одной позиции не может превышать 99.'), {
            code: 'QUANTITY_EXCEEDS_STOCK',
          });
        }
        if (!item.skuId) throw Object.assign(new Error('Корзина содержит устаревший товар'), { code: 'SKU_UNAVAILABLE' });
        const reserved = await transaction.sku.updateMany({
          where: { id: item.skuId, active: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count === 0) {
          throw Object.assign(new Error(`Товар «${item.productName}» закончился, обновите корзину`), {
            code: 'QUANTITY_EXCEEDS_STOCK',
          });
        }
      }

      const delivery = resolveDeliverySnapshot(orderData.quote.delivery);
      const address = form.address;
      const point = orderData.quote.delivery.pickupPoint;
      const order = await transaction.order.create({
        data: {
          userId,
          status: 'PENDING',
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          city: address?.city ?? 'Москва',
          addressLine: address?.addressLine ?? point?.address ?? '',
          addressComment: address?.addressComment ?? null,
          itemsTotal: orderData.quote.totals.itemsSubtotal,
          discountAmount: orderData.quote.totals.couponDiscount,
          shippingAmount: orderData.quote.totals.deliveryAmount,
          serviceAmount: orderData.quote.totals.serviceAmount,
          totalAmount: orderData.quote.totals.total,
          couponCode: orderData.quote.coupon?.code ?? null,
          paymentMethod: form.paymentMethod,
          paymentReturnUrl: null,
          paymentInitializationState: form.paymentMethod === 'online' ? 'READY' : null,
          ...delivery,
          floor: address?.floor ?? null,
          liftType: address?.liftType ?? null,
          intercom: address?.intercom ?? null,
          serviceDetails: serializeServiceDetails(orderData.quote.serviceLines),
          items: {
            create: orderData.snapshot.items.map((item) => ({
              ...item,
              productVariantId: undefined,
            })),
          },
        },
        select: { id: true, orderNumber: true, createdAt: true, totalAmount: true },
      });

      let paymentReturnUrl: string | null = null;
      if (form.paymentMethod === 'online') {
        paymentReturnUrl = `${toOrigin(siteUrl())}/orders/${order.orderNumber}`;
        await transaction.order.update({ where: { id: order.id }, data: { paymentReturnUrl } });
      }

      const deleted = await transaction.cartItem.deleteMany({
        where: { cartId: orderData.cartId, id: { in: orderData.cartItemIds } },
      });
      if (deleted.count !== orderData.cartItemIds.length) {
        throw Object.assign(new Error('Корзина изменилась во время оформления. Повторите попытку.'), { code: 'CART_CONFLICT' });
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        salesItems: orderData.salesItems,
        paymentReturnUrl,
      };
    });
  } catch (error) {
    return placementError(error);
  }

  if (form.paymentMethod === 'online') {
    let initialization;
    try {
      initialization = await ensureOnlinePayment({
        orderId: committed.id,
        now,
        client: prisma as unknown as import('@/lib/payment-initialization').PaymentInitializationClient,
      });
    } catch (error) {
      logger.error('payment_initialization_unexpected_failure', error, { orderId: committed.id });
      initialization = { outcome: 'INDETERMINATE' } as const;
    }
    if (initialization.outcome === 'CREATED' && initialization.confirmationUrl) {
      await recordOrderSideEffects(form, committed.orderNumber, committed.salesItems);
      return {
        ok: true,
        code: 'PAYMENT_REDIRECT_READY',
        orderNumber: committed.orderNumber,
        paymentUrl: initialization.confirmationUrl,
      };
    }
    if (initialization.outcome === 'NOT_CREATED') {
      return {
        ok: false,
        code: 'PAYMENT_NOT_CREATED',
        orderNumber: committed.orderNumber,
        error: 'Не удалось создать платёж. Попробуйте оформить заказ снова.',
      };
    }
    await recordOrderSideEffects(form, committed.orderNumber, committed.salesItems);
    if (initialization.outcome === 'BLOCKED_AFTER_RETRY_WINDOW') {
      return {
        ok: false,
        code: 'PAYMENT_INITIALIZATION_BLOCKED',
        paymentInitialization: buildBlockedPaymentInitializationDto(committed.orderNumber),
      };
    }
    return {
      ok: false,
      code: 'PAYMENT_INITIALIZATION_PENDING',
      orderNumber: committed.orderNumber,
      error: 'Заказ сохранён. Статус платежа проверяется.',
    };
  }

  await recordOrderSideEffects(form, committed.orderNumber, committed.salesItems);
  return { ok: true, code: 'ORDER_READY', orderNumber: committed.orderNumber };
}

export type CancelOrderResult =
  | { ok: true }
  | { ok: false; code?: 'CANCELLATION_PENDING_SYNC'; error: string };

const cancellationPendingSync = (): CancelOrderResult => ({
  ok: false,
  code: 'CANCELLATION_PENDING_SYNC',
  error: 'Статус отмены платежа проверяется. Обновите заказ и повторите попытку позже.',
});

const canceledOrderProducts = (order: {
  items: Array<{
    quantity: number;
    canonicalSku: { productId: string } | null;
    productVariant: { colorway: { productId: string } } | null;
  }>;
}) =>
  order.items.flatMap((item) =>
    item.canonicalSku
      ? [{ productId: item.canonicalSku.productId, quantity: item.quantity }]
      : item.productVariant
        ? [{ productId: item.productVariant.colorway.productId, quantity: item.quantity }]
        : [],
  );

export async function cancelOrder(orderId: string): Promise<CancelOrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };
  const userId = session.user.id;
  const include = {
    items: {
      include: {
        canonicalSku: { select: { productId: true } },
        productVariant: { select: { colorway: { select: { productId: true } } } },
      },
    },
    payment: true,
  } as const;
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId },
    include,
  });
  if (!order || order.userId !== userId) {
    return { ok: false, error: 'Этот заказ нельзя отменить' };
  }
  const productIds = [...new Set(canceledOrderProducts(order).map((item) => item.productId))];
  if (order.status === 'CANCELLED') {
    await pruneReviewsAfterCancel(userId, productIds);
    revalidatePath('/profile');
    revalidatePath(`/orders/${order.orderNumber}`);
    return { ok: true };
  }
  if (order.status !== 'PENDING') return { ok: false, error: 'Этот заказ нельзя отменить' };

  let pruneAfterCancel = order.paymentMethod !== 'online';
  if (order.paymentMethod === 'online') {
    let locallyCanceled = false;
    if (!order.payment) {
      const initialization = await ensureOnlinePayment({
        orderId,
        now: new Date(),
        client: prisma as unknown as import('@/lib/payment-initialization').PaymentInitializationClient,
      });
      if (initialization.outcome === 'NOT_CREATED') {
        await adjustSalesCount(canceledOrderProducts(order), -1);
        locallyCanceled = true;
        pruneAfterCancel = true;
      } else if (initialization.outcome !== 'CREATED') {
        return cancellationPendingSync();
      }
    }

    if (!locallyCanceled) {
      const correlated = await prisma.order.findUnique({
        where: { id: orderId, userId, status: 'PENDING', paymentMethod: 'online' },
        include,
      });
      if (
        !correlated ||
        correlated.paymentInitializationState !== 'CORRELATED' ||
        !correlated.payment ||
        correlated.payment.status !== 'pending' ||
        correlated.payment.amount !== correlated.totalAmount
      ) {
        return cancellationPendingSync();
      }

      const paymentId = correlated.payment.id;
      try {
        await cancelPayment(paymentId);
      } catch (error) {
        logger.error('cancel_payment_failed', error, { orderId, paymentId });
      }
      let details;
      try {
        details = await getPaymentDetails(paymentId);
      } catch (error) {
        logger.error('cancel_payment_reload_failed', error, { orderId, paymentId });
        return cancellationPendingSync();
      }
      if (
        !details ||
        details.id !== paymentId ||
        details.status !== 'canceled' ||
        details.amountRub !== correlated.totalAmount ||
        details.orderNumber !== String(correlated.orderNumber)
      ) {
        return cancellationPendingSync();
      }
      try {
        const result = await reconcilePaymentStatus({ paymentId, remoteStatus: 'canceled', source: 'order-page' });
        if ((result.kind !== 'applied' && result.kind !== 'repaired') || result.transition !== 'canceled') {
          return cancellationPendingSync();
        }
      } catch (error) {
        logger.error('cancel_payment_reconciliation_failed', error, { orderId, paymentId });
        return cancellationPendingSync();
      }
    }
  } else {
    const cancelled = await prisma.$transaction(
      async (transaction) => {
        const result = await transaction.order.updateMany({
          where: { id: orderId, userId, status: 'PENDING', paymentMethod: 'cod' },
          data: { status: 'CANCELLED' },
        });
        if (!result.count) return false;
        for (const item of order.items) {
          if (item.skuId) {
            await transaction.sku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } });
          } else if (item.productVariantId) {
            await transaction.productVariant.update({
              where: { id: item.productVariantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        return true;
      },
      { isolationLevel: 'Serializable' },
    );
    if (!cancelled) return { ok: false, error: 'Этот заказ нельзя отменить' };
    await adjustSalesCount(canceledOrderProducts(order), -1);
  }

  if (pruneAfterCancel) await pruneReviewsAfterCancel(userId, productIds);
  revalidatePath('/profile');
  revalidatePath(`/orders/${order.orderNumber}`);
  return { ok: true };
}

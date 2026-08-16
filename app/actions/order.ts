'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma-client';
import { cartCookieName } from '@/lib/cart-cookie';
import { resolveOwnerCart } from '@/lib/cart';
import { buildCheckoutOrderData } from '@/lib/checkout-page';
import {
  OrderTransactionConflictError,
  resolveDeliverySnapshot,
  runSerializableOrderTransaction,
  serializeServiceDetails,
} from '@/lib/order';
import { logger } from '@/lib/logger';
import { cancelPayment, siteUrl, toOrigin, validateYooKassaConfiguration } from '@/lib/yookassa';
import { pruneReviewsAfterCancel } from '@/lib/review';
import { adjustSalesCount } from '@/lib/sales-count';
import { ensureOnlinePayment } from '@/lib/payment-initialization';
import { assertPortfolioPaymentMode } from '@/lib/payment-environment';
import { buildBlockedPaymentInitializationDto } from '@/services/dto/checkout-page.dto';
import { placeOrderSchema, type PlaceOrderInput, type PlaceOrderResult } from '@/services/dto/order.dto';

type OrderTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function placementError(error: unknown): PlaceOrderResult {
  if (error instanceof OrderTransactionConflictError) return { ok: false, code: error.code, error: error.message };
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error instanceof Error) {
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
  await adjustSalesCount(salesItems, 1);
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
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: 'UNAUTHENTICATED', error: 'Не авторизован' };

  const parsed = placeOrderSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: 'INVALID_INPUT', error: 'Проверьте поля формы' };
  const form = parsed.data;
  const now = new Date();

  if (form.paymentMethod === 'online') {
    try {
      assertPortfolioPaymentMode(process.env);
      validateYooKassaConfiguration();
    } catch (error) {
      logger.error('place_order_payment_configuration_failed', error);
      return { ok: false, code: 'PAYMENT_NOT_CONFIGURED', error: 'Онлайн-оплата временно недоступна.' };
    }
  }

  const store = await cookies();
  const owner = await resolveOwnerCart(session.user.id, store.get(cartCookieName)?.value, { create: false });
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
        userId: session.user.id,
        cartId: owner.id,
        raw: form,
        now,
        client: transaction,
      });

      for (const item of orderData.snapshot.items) {
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
          userId: session.user.id,
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
    const initialization = await ensureOnlinePayment({ orderId: committed.id, now, client: prisma });
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

export type CancelOrderResult = { ok: true } | { ok: false; error: string };

export async function cancelOrder(orderId: string): Promise<CancelOrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };
  const userId = session.user.id;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          canonicalSku: { select: { productId: true } },
          productVariant: { select: { colorway: { select: { productId: true } } } },
        },
      },
      payment: true,
    },
  });
  if (!order || order.userId !== userId || order.status !== 'PENDING') {
    return { ok: false, error: 'Этот заказ нельзя отменить' };
  }

  const cancelled = await prisma.$transaction(async (transaction) => {
    const result = await transaction.order.updateMany({
      where: { id: orderId, userId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    if (result.count === 0) return false;
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
  });
  if (!cancelled) return { ok: false, error: 'Этот заказ нельзя отменить' };

  if (order.payment?.status === 'pending') {
    try {
      await cancelPayment(order.payment.id);
    } catch (error) {
      logger.error('cancel_payment_failed', error, { orderId, paymentId: order.payment.id });
    }
  }

  await adjustSalesCount(
    order.items.flatMap((item) =>
      item.canonicalSku
        ? [{ productId: item.canonicalSku.productId, quantity: item.quantity }]
        : item.productVariant
          ? [{ productId: item.productVariant.colorway.productId, quantity: item.quantity }]
          : [],
    ),
    -1,
  );
  const productIds = [
    ...new Set(
      order.items.flatMap((item) =>
        item.canonicalSku
          ? [item.canonicalSku.productId]
          : item.productVariant
            ? [item.productVariant.colorway.productId]
            : [],
      ),
    ),
  ];
  await pruneReviewsAfterCancel(userId, productIds);
  revalidatePath('/profile');
  revalidatePath(`/orders/${order.orderNumber}`);
  return { ok: true };
}

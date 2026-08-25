'use server';

import type { OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { orderStatusUpdateSchema } from '@/services/dto/order-admin.dto';
import { nextOrderStatus } from '@/lib/order-admin';
import { adminError, adminOk, type AdminActionResult } from '@/lib/admin/action-result';
import { adjustSalesCount } from '@/lib/sales-count';
import { cancelPayment, getPaymentDetails } from '@/lib/yookassa';
import { pruneReviewsAfterCancel } from '@/lib/review';
import { logger } from '@/lib/logger';

export type OrderActionResult = { ok: true } | { ok: false; error: string };

const LIST_PATH = '/admin/orders';

// Forward-переход по пайплайну. Чистая прогрессия — сток/платёж/salesCount НЕ трогаем.
export async function advanceOrderStatus(input: unknown): Promise<AdminActionResult<{ status: OrderStatus }>> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const parsed = orderStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', 'Некорректный статус');
  const { orderId, expectedStatus, nextStatus } = parsed.data;

  if (nextOrderStatus(expectedStatus) !== nextStatus) return adminError('VALIDATION_ERROR', 'Недопустимый переход статуса');

  const res = await prisma.order.updateMany({
    where: { id: orderId, status: expectedStatus },
    data: { status: nextStatus },
  });
  if (res.count === 0) return adminError('STALE_VALUE', 'Статус заказа изменился, обновите страницу');

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${orderId}`);
  return adminOk({ status: nextStatus });
}

// Отмена до отгрузки: PENDING/PROCESSING → CANCELLED. Возврат стока (списан при оформлении)
// + salesCount −1 (+ отмена pending-платежа). Guarded updateMany гарантирует ровно один реальный
// переход даже в гонке с вебхуком ЮKassa (тот правит только PENDING) — побочки применяются один раз.
export async function cancelOrderByAdmin(orderId: string): Promise<OrderActionResult> {
  const gate = await requireAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

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
  if (!order) return { ok: false, error: 'Заказ не найден' };

  const res = await prisma.order.updateMany({
    where: { id: orderId, status: { in: ['PENDING', 'PROCESSING'] } },
    data: { status: 'CANCELLED' },
  });
  if (res.count === 0) return { ok: false, error: 'Этот заказ нельзя отменить' };

  // Pending-платёж можно отменить локально, но YooKassa /cancel для pending запрещён.
  // Если провайдер уже ждёт capture, сначала отменяем его и только после подтверждения
  // отражаем canceled локально. Поздний succeeded обрабатывается payment-sync через refund.
  if (order.payment && order.payment.status === 'pending') {
    let providerCanceled = false;
    try {
      let details = await getPaymentDetails(order.payment.id);
      if (
        details &&
        details.id === order.payment.id &&
        details.amountRub === order.totalAmount &&
        details.orderNumber === String(order.orderNumber)
      ) {
        if (details.status === 'waiting_for_capture') {
          await cancelPayment(order.payment.id);
          details = await getPaymentDetails(order.payment.id);
        }
        providerCanceled = details?.status === 'canceled';
      }
    } catch (e) {
      logger.error('admin_cancel_payment_failed', e, { orderId, paymentId: order.payment.id });
    }
    if (providerCanceled) {
      try {
        await prisma.payment.update({ where: { id: order.payment.id }, data: { status: 'canceled' } });
      } catch (e) {
        logger.error('admin_cancel_payment_status_failed', e, { orderId });
      }
    }
  }

  // Возврат стока — релятивен, применяется один раз (guard выше). Best-effort по позициям.
  for (const item of order.items) {
    try {
      if (item.skuId) {
        await prisma.sku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } });
      } else if (item.productVariantId) {
        await prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    } catch (e) {
      logger.error('admin_cancel_stock_restore_failed', e, {
        orderId,
        skuId: item.skuId,
        variantId: item.productVariantId,
      });
    }
  }

  // Популярность: −продажи по товарам отменённого заказа (симметрично возврату стока).
  await adjustSalesCount(
    order.items.flatMap((i) =>
      i.canonicalSku
        ? [{ productId: i.canonicalSku.productId, quantity: i.quantity }]
        : i.productVariant
          ? [{ productId: i.productVariant.colorway.productId, quantity: i.quantity }]
          : [],
    ),
    -1,
  );

  // Отмена аннулирует «покупку» → снять осиротевшие отзывы (как клиентский cancelOrder).
  const productIds = [
    ...new Set(
      order.items.flatMap((i) =>
        i.canonicalSku ? [i.canonicalSku.productId] : i.productVariant ? [i.productVariant.colorway.productId] : [],
      ),
    ),
  ];
  await pruneReviewsAfterCancel(order.userId, productIds);

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${orderId}`);
  revalidatePath('/profile');
  revalidatePath(`/orders/${order.orderNumber}`);
  return { ok: true };
}

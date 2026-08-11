'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma-client';
import { cartInclude } from '@/lib/cart-details';
import { cartCookieName } from '@/lib/cart-cookie';
import { recalcCartTotalByToken, resolveOwnerCart } from '@/lib/cart';
import { checkoutSchema } from '@/services/dto/order.dto';
import { buildOrderSnapshot, calcShipping, type OrderSnapshot } from '@/lib/order';
import { checkCoupon, calcCouponDiscount } from '@/lib/coupon';
import { logger } from '@/lib/logger';
import { createPayment, cancelPayment } from '@/lib/yookassa';
import { pruneReviewsAfterCancel } from '@/lib/review';
import { adjustSalesCount } from '@/lib/sales-count';

export type PlaceOrderResult = { ok: true; orderNumber: number; paymentUrl?: string } | { ok: false; error: string };

async function restoreStock(items: { id: string; qty: number }[]): Promise<void> {
  for (const it of items) {
    try {
      await prisma.productVariant.update({ where: { id: it.id }, data: { stock: { increment: it.qty } } });
    } catch (e) {
      logger.error('place_order_stock_restore_failed', e, { variantId: it.id });
    }
  }
}

export async function placeOrder(raw: unknown): Promise<PlaceOrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };
  const userId = session.user.id;

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Проверьте поля формы' };
  const form = parsed.data;

  let snapshot: OrderSnapshot;
  let cartId: string | null = null;
  let cartToken: string | null = null;
  let salesItems: { productId: string; quantity: number }[];

  if (form.buyNowVariantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: form.buyNowVariantId },
      include: {
        colorway: {
          include: {
            product: { select: { id: true, name: true, slug: true, active: true } },
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
    });
    if (!variant || !variant.active || variant.stock <= 0 || !variant.colorway.product.active) {
      return {
        ok: false,
        error:
          '\u0422\u043e\u0432\u0430\u0440 \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d',
      };
    }
    snapshot = {
      items: [
        {
          productVariantId: variant.id,
          sku: variant.sku,
          productName: variant.colorway.product.name,
          colorwayName: variant.colorway.name,
          size: variant.size,
          imageUrl: variant.colorway.images[0]?.url ?? null,
          unitPrice: variant.price,
          quantity: 1,
          lineTotal: variant.price,
        },
      ],
      itemsTotal: variant.price,
    };
    salesItems = [{ productId: variant.colorway.product.id, quantity: 1 }];
  } else {
    const store = await cookies();
    const token = store.get(cartCookieName)?.value;
    // Корзина залогиненного резолвится по userId (не по cookie) — заказ всегда из своей корзины.
    const owner = await resolveOwnerCart(userId, token, { create: false });
    if (!owner) return { ok: false, error: 'Корзина пуста' };
    const cart = await prisma.cart.findFirst({ where: { id: owner.id }, include: cartInclude });
    if (!cart || cart.items.length === 0) return { ok: false, error: 'Корзина пуста' };

    const inactive = cart.items.find(
      (i) => !i.productVariant || !i.productVariant.active || !i.productVariant.colorway.product.active,
    );
    if (inactive) {
      return {
        ok: false,
        error: `Товар «${inactive.productVariant?.colorway.product.name ?? 'Товар'}» больше недоступен, удалите его из корзины`,
      };
    }

    snapshot = buildOrderSnapshot(cart);
    cartId = cart.id;
    cartToken = cart.token;
    salesItems = cart.items.flatMap((i) =>
      i.productVariant ? [{ productId: i.productVariant.colorway.product.id, quantity: i.quantity }] : [],
    );
    if (salesItems.length !== cart.items.length) {
      return { ok: false, error: 'Корзина требует обновления' };
    }
  }

  // Купон — повторная валидация на сервере (источник истины; клиентскому couponCode не доверяем).
  // До декремента стока → при отказе откатывать нечего.
  let discountAmount = 0;
  let couponCode: string | null = null;
  if (form.couponCode && form.couponCode.trim()) {
    const check = await checkCoupon(form.couponCode);
    if (!check.ok) return { ok: false, error: check.error };
    discountAmount = calcCouponDiscount(snapshot.itemsTotal, check.percent);
    couponCode = check.code;
  }

  const shippingAmount = calcShipping(snapshot.itemsTotal, form.shippingMethod);
  const totalAmount = snapshot.itemsTotal - discountAmount + shippingAmount;

  const decremented: { id: string; qty: number }[] = [];
  for (const it of snapshot.items) {
    const variantId = it.productVariantId;
    if (!variantId) {
      return { ok: false, error: 'Состав корзины требует обновления' };
    }
    // A conditional update reserves stock without a read-then-write race.
    const updated = await prisma.productVariant.updateMany({
      where: { id: variantId, stock: { gte: it.quantity } },
      data: { stock: { decrement: it.quantity } },
    });
    if (updated.count === 0) {
      await restoreStock(decremented);
      return { ok: false, error: `Товар «${it.productName}» закончился, обновите корзину` };
    }
    decremented.push({ id: variantId, qty: it.quantity });
  }

  let orderId: string;
  let orderNumber: number;
  try {
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        shippingMethod: form.shippingMethod,
        city: form.city ?? '',
        addressLine: form.addressLine,
        addressComment: form.addressComment || null,
        itemsTotal: snapshot.itemsTotal,
        discountAmount,
        shippingAmount,
        totalAmount,
        couponCode,
        paymentMethod: form.paymentMethod,
      },
      select: { id: true, orderNumber: true },
    });
    orderId = order.id;
    orderNumber = order.orderNumber;
  } catch (e) {
    await restoreStock(decremented);
    logger.error('place_order_create_failed', e);
    return { ok: false, error: 'Не удалось оформить заказ. Попробуйте позже' };
  }

  // Позиции — ПО ОДНОЙ (одиночные INSERT). И вложенный `items: { create }`, и
  // `createMany` Prisma исполняет в НЕЯВНОЙ транзакции, которую Neon HTTP не поддерживает
  // (проверено против адаптера; TROUBLESHOOTING P5/P7). Сбой → откат: удалить заказ
  // (каскад onDelete уберёт уже созданные позиции — одиночный DELETE, без транзакции) + вернуть сток.
  try {
    for (const it of snapshot.items) {
      await prisma.orderItem.create({ data: { ...it, orderId } });
    }
  } catch (e) {
    try {
      await prisma.order.delete({ where: { id: orderId } });
    } catch (delErr) {
      logger.error('place_order_order_rollback_failed', delErr, { orderId });
    }
    await restoreStock(decremented);
    logger.error('place_order_items_failed', e, { orderId });
    return { ok: false, error: 'Не удалось оформить заказ. Попробуйте позже' };
  }

  let paymentUrl: string | undefined;
  if (form.paymentMethod === 'online') {
    try {
      // return_url ДОЛЖЕН вести на тот же деплой, где оформлен заказ: там сессия, кука и
      // нужная ветка Neon (БД заводит ветку на каждое окружение, P7). Поэтому приоритет —
      // host текущего запроса; NEXT_PUBLIC_SITE_URL — только фолбэк для localhost.
      const pay = await createPayment({ orderId, orderNumber, amountRub: totalAmount });
      await prisma.payment.create({
        data: { id: pay.id, orderId, amount: totalAmount, confirmationUrl: pay.confirmationUrl, status: 'pending' },
      });
      paymentUrl = pay.confirmationUrl;
    } catch (e) {
      try {
        await prisma.order.delete({ where: { id: orderId } });
      } catch (delErr) {
        logger.error('place_order_payment_rollback_failed', delErr, { orderId });
      }
      await restoreStock(decremented);
      logger.error('place_order_payment_failed', e, { orderId });
      return { ok: false, error: 'Не удалось создать платёж. Попробуйте позже' };
    }
  }

  // Популярность: +продажи по товарам заказа (как списанный сток). После всех точек отката —
  // если дошли сюда, заказ создан и сток списан, инкремент симметричен. Best-effort внутри.
  await adjustSalesCount(salesItems, 1);

  if (cartId && cartToken) {
    try {
      await prisma.cartItem.deleteMany({ where: { cartId } });
      await recalcCartTotalByToken(cartToken);
    } catch (e) {
      logger.error('order_cart_cleanup_failed', e, { orderNumber });
    }
  }

  // Save address to user's address book (dedup by city+street)
  try {
    const { saveAddressFromOrder } = await import('@/app/actions/address');
    await saveAddressFromOrder({
      city: form.city ?? '',
      street: form.addressLine,
      comment: form.addressComment ?? null,
    });
  } catch {
    // non-critical
  }

  return { ok: true, orderNumber, paymentUrl };
}

export type CancelOrderResult = { ok: true } | { ok: false; error: string };

export async function cancelOrder(orderId: string): Promise<CancelOrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };
  const userId = session.user.id;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { productVariant: { select: { colorway: { select: { productId: true } } } } } },
      payment: true,
    },
  });
  if (!order || order.userId !== userId || order.status !== 'PENDING') {
    return { ok: false, error: 'Этот заказ нельзя отменить' };
  }

  // The status transition and stock restoration must commit together. Otherwise a
  // transient database failure can leave a CANCELLED order with stock still reserved.
  const cancelled = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, userId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    if (result.count === 0) return false;

    for (const item of order.items) {
      if (!item.productVariantId) continue;
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { increment: item.quantity } },
      });
    }
    return true;
  });
  if (!cancelled) return { ok: false, error: 'Этот заказ нельзя отменить' };

  if (order.payment && order.payment.status === 'pending') {
    try {
      await cancelPayment(order.payment.id);
    } catch (e) {
      logger.error('cancel_payment_failed', e, { orderId, paymentId: order.payment.id });
    }
  }

  // Популярность: −продажи по товарам отменённого заказа (симметрично возврату стока).
  await adjustSalesCount(
    order.items.flatMap((i) =>
      i.productVariant ? [{ productId: i.productVariant.colorway.productId, quantity: i.quantity }] : [],
    ),
    -1,
  );

  // Отмена аннулирует «покупку»: снять осиротевшие отзывы по товарам этого заказа
  // (если по товару не осталось другого квалифицирующего заказа). PDP — force-dynamic,
  // перечитает список при следующем рендере, так что отдельная ревалидация не нужна.
  const productIds = [
    ...new Set(order.items.flatMap((i) => (i.productVariant ? [i.productVariant.colorway.productId] : []))),
  ];
  await pruneReviewsAfterCancel(userId, productIds);

  revalidatePath('/profile');
  revalidatePath(`/orders/${order.orderNumber}`);
  return { ok: true };
}

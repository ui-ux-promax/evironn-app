import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Prisma, type OrderStatus } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getPaymentStatus } from '@/lib/yookassa';
import { reconcilePaymentStatus } from '@/lib/payment-sync';
import { logger } from '@/lib/logger';
import { OrderStatusBadge } from '@/components/shared/orders/order-status-badge';
import { CancelOrderButton } from '@/components/shared/orders/cancel-order-button';
import { ReviewForm } from '@/components/shared/product/review-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Заказ' };

const fmtDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtDateTime = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const orderInclude = {
  items: {
    include: {
      productVariant: {
        select: {
          colorway: {
            select: {
              productId: true,
              product: { select: { slug: true, name: true } },
            },
          },
        },
      },
    },
  },
  payment: true,
} satisfies Prisma.OrderInclude;

type OrderDetail = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type ProductInOrder = { id: string; slug: string; name: string };

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { number } = await params;
  const orderNumber = Number(number);
  if (!Number.isInteger(orderNumber)) notFound();

  let order = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
  if (!order || order.userId !== session.user.id) notFound();

  if (order.status === 'PENDING' && order.payment && order.payment.status === 'pending') {
    try {
      const remote = await getPaymentStatus(order.payment.id);
      const sync = await reconcilePaymentStatus({
        paymentId: order.payment.id,
        remoteStatus: remote,
        source: 'order-page',
      });
      if (sync.kind === 'applied' || sync.kind === 'repaired') {
        const syncedOrder = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
        if (syncedOrder) order = syncedOrder;
      }
    } catch (e) {
      logger.error('order_payment_sync_failed', e, { orderNumber });
    }
  }

  const productsInOrder = collectProductsInOrder(order);
  const orderIsPurchase =
    order.status !== 'CANCELLED' && (order.paymentMethod === 'cod' || order.payment?.status === 'succeeded');
  const canLeaveReviews = orderIsPurchase && productsInOrder.length > 0;
  const reviewedProductIds = canLeaveReviews
    ? new Set(
        (
          await prisma.review.findMany({
            where: { userId: session.user.id, productId: { in: productsInOrder.map((p) => p.id) } },
            select: { productId: true },
          })
        ).map((r) => r.productId),
      )
    : new Set<string>();

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const canContinuePayment =
    order.status === 'PENDING' && order.payment?.status === 'pending' && order.payment.confirmationUrl;
  const canCancel = order.status === 'PENDING';

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-8 md:px-6 md:py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/profile#orders" className="text-sm font-bold text-ink-muted hover:text-ink">
          ← К заказам
        </Link>
        <OrderStatusBadge status={order.status} paymentStatus={order.payment?.status} />
      </div>

      <section className="overflow-hidden rounded-[24px] border border-line bg-surface">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-line p-5 max-[640px]:grid-cols-1">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[28px] font-extrabold tracking-tight">RITM-{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} paymentStatus={order.payment?.status} />
            </div>
            <p className="text-sm text-ink-muted">
              {fmtDate.format(order.createdAt)} · <b className="text-ink">{itemCount} поз.</b>
            </p>
          </div>
          <div className="text-right max-[640px]:text-left">
            <div className="text-[11px] text-ink-muted">Итого</div>
            <div className="tnum font-display text-[30px] font-extrabold tracking-tight">
              {formatPrice(order.totalAmount)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(340px,420px)] gap-[28px] p-5 max-[900px]:grid-cols-1">
          <div className="grid gap-[18px]">
            <PaymentNotice order={order} />
            <Timeline status={order.status} date={order.createdAt} />
            <DeliveryCard order={order} />
            {canLeaveReviews && <ReviewCard products={productsInOrder} reviewedProductIds={reviewedProductIds} />}
          </div>

          <aside className="grid gap-[18px]">
            <section>
              <h2 className="mb-3.5 text-xs font-extrabold uppercase tracking-[.06em] text-ink-muted">Состав заказа</h2>
              <div className="rounded-[18px] border border-line bg-surface">
                {order.items.map((item) => (
                  <OrderLine key={item.id} item={item} />
                ))}
              </div>
            </section>

            <section className="rounded-[18px] border border-line bg-surface p-4">
              <h2 className="mb-3 text-xs font-extrabold uppercase tracking-[.06em] text-ink-muted">Итоги</h2>
              <TotalRow label="Подытог" value={order.itemsTotal} />
              {order.discountAmount > 0 && (
                <TotalRow
                  label={order.couponCode ? `Скидка (${order.couponCode})` : 'Скидка'}
                  value={-order.discountAmount}
                />
              )}
              <TotalRow label="Доставка" value={order.shippingAmount} freeText="Бесплатно" />
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-4">
                <span className="font-display text-[17px] font-extrabold">Итого</span>
                <span className="tnum font-display text-[26px] font-extrabold tracking-tight">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </section>

            {(canContinuePayment || canCancel) && (
              <section className="flex flex-wrap gap-2.5">
                {canContinuePayment && (
                  <a
                    href={order.payment!.confirmationUrl!}
                    className="inline-flex h-[46px] items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-footer"
                  >
                    Продолжить оплату
                  </a>
                )}
                {canCancel && <CancelOrderButton orderId={order.id} />}
              </section>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function collectProductsInOrder(order: OrderDetail): ProductInOrder[] {
  const products: ProductInOrder[] = [];
  const seen = new Set<string>();
  for (const item of order.items) {
    const product = item.productVariant?.colorway.product;
    const productId = product?.slug ?? item.productSlug ?? item.productName;
    if (seen.has(productId)) continue;
    seen.add(productId);
    products.push({
      id: productId,
      slug: product?.slug ?? item.productSlug ?? '#',
      name: product?.name ?? item.productName,
    });
  }
  return products;
}

function PaymentNotice({ order }: { order: OrderDetail }) {
  const copy = order.payment
    ? order.payment.status === 'succeeded'
      ? 'Оплата прошла. Заказ передан в обработку.'
      : order.payment.status === 'canceled'
        ? 'Оплата отменена. Если заказ не нужен, его можно отменить.'
        : 'Ожидаем оплату. Можно продолжить оплату с этой страницы.'
    : 'Оплата при получении. Заказ будет обработан после подтверждения.';

  return (
    <div className="rounded-[18px] border border-line bg-surface-soft p-4 text-sm font-semibold text-ink">
      {copy}
      {order.payment?.paidAt && (
        <span className="mt-1 block text-xs font-medium text-ink-muted">
          Оплачен: {fmtDateTime.format(order.payment.paidAt)}
        </span>
      )}
    </div>
  );
}

function Timeline({ status, date }: { status: OrderStatus; date: Date }) {
  const steps = status === 'CANCELLED' ? ['Оформлен', 'Отменён'] : ['Оформлен', 'Собирается', 'В пути', 'Доставлен'];
  const currentIndex =
    status === 'PENDING' ? 0 : status === 'PROCESSING' ? 1 : status === 'SHIPPED' ? 2 : status === 'DELIVERED' ? 3 : 1;

  return (
    <section className="rounded-[18px] border border-line bg-surface p-4">
      <h2 className="mb-3.5 text-xs font-extrabold uppercase tracking-[.06em] text-ink-muted">Трекинг</h2>
      {steps.map((step, index) => {
        const done = status === 'DELIVERED' || index < currentIndex;
        const current = index === currentIndex && !done;
        const cancelled = status === 'CANCELLED' && index === 1;
        return (
          <div key={step} className="grid grid-cols-[22px_1fr] gap-3">
            <div className="grid justify-items-center">
              <span
                className={cn(
                  'z-[1] mt-px h-[18px] w-[18px] rounded-full border-2 border-line bg-surface',
                  done && 'border-accent bg-accent',
                  current && 'border-accent shadow-[0_0_0_4px_hsl(var(--color-accent)/.16)]',
                  cancelled && 'border-danger bg-danger',
                )}
              />
              {index < steps.length - 1 && (
                <span className={cn('min-h-[28px] w-0.5 flex-1 bg-line', done && 'bg-accent')} />
              )}
            </div>
            <div className="pb-[18px]">
              <div className={cn('text-[13.5px] font-bold', !done && !current && !cancelled && 'text-ink-muted')}>
                {step}
              </div>
              <div className="text-xs text-ink-muted">
                {index === 0 ? fmtDate.format(date) : !done && !current && !cancelled ? 'Ожидается' : 'Обновлено'}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function DeliveryCard({ order }: { order: OrderDetail }) {
  return (
    <section className="rounded-[18px] border border-line bg-surface p-4 text-sm">
      <h2 className="mb-3 text-xs font-extrabold uppercase tracking-[.06em] text-ink-muted">Доставка</h2>
      <div className="grid gap-2">
        <Row label="Способ" value={order.shippingMethod === 'pickup' ? 'Самовывоз' : 'Курьер'} />
        <Row label="Адрес" value={[order.city, order.addressLine].filter(Boolean).join(', ')} />
        {order.addressComment && <Row label="Комментарий" value={order.addressComment} />}
        <Row label="Получатель" value={`${order.contactName} · ${order.contactPhone}`} />
        <Row label="E-mail" value={order.contactEmail} />
      </div>
    </section>
  );
}

function ReviewCard({ products, reviewedProductIds }: { products: ProductInOrder[]; reviewedProductIds: Set<string> }) {
  return (
    <section className="rounded-[18px] border border-line bg-surface p-4">
      <h2 className="mb-3 text-xs font-extrabold uppercase tracking-[.06em] text-ink-muted">Оцените покупку</h2>
      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="grid gap-2 border-t border-line pt-4 first:border-t-0 first:pt-0">
            <Link href={`/product/${product.slug}`} className="text-sm font-bold underline-offset-2 hover:underline">
              {product.name}
            </Link>
            {reviewedProductIds.has(product.id) ? (
              <p className="text-sm text-ink-muted">Вы уже оставили отзыв на этот товар. Спасибо!</p>
            ) : (
              <ReviewForm productId={product.id} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function OrderLine({ item }: { item: OrderDetail['items'][number] }) {
  const productSlug = item.productVariant?.colorway.product.slug ?? item.productSlug ?? '';
  return (
    <div className="grid grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-3 border-t border-line p-3 first:border-t-0">
      <Link
        href={`/product/${productSlug}`}
        className="relative h-[60px] w-[54px] overflow-hidden rounded-[12px] border border-line bg-surface-soft"
      >
        {item.imageUrl && (
          <Image src={item.imageUrl} alt={item.productName} fill sizes="54px" className="object-cover" />
        )}
      </Link>
      <div className="min-w-0">
        <Link href={`/product/${productSlug}`} className="block truncate text-[13.5px] font-bold hover:underline">
          {item.productName}
        </Link>
        <div className="mt-0.5 text-xs text-ink-muted">
          {item.colorwayName ?? item.skuCombinationKey ?? 'Конфигурация'} · {item.size ?? ''}
        </div>
      </div>
      <div className="text-right">
        <div className="tnum text-sm font-extrabold">{formatPrice(item.lineTotal)}</div>
        <div className="text-xs text-ink-muted">x{item.quantity}</div>
      </div>
    </div>
  );
}

function TotalRow({ label, value, freeText }: { label: string; value: number; freeText?: string }) {
  return (
    <div className="flex justify-between py-1 text-[13px] text-ink-muted">
      <span>{label}</span>
      <span className="tnum text-ink">
        {freeText && value === 0 ? freeText : value < 0 ? `-${formatPrice(Math.abs(value))}` : formatPrice(value)}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-line py-2 first:border-t-0">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

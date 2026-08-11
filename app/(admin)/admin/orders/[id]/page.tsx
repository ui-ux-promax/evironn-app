import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { prisma } from '@/lib/prisma-client';
import { Icon } from '@/components/admin/icon';
import { formatPrice, formatDateTime } from '@/lib/format';
import { formatOrderItemConfiguration, orderStatusView } from '@/lib/order';
import { paymentStatusView } from '@/lib/order-admin';
import { OrderStatusActions } from '../_components/order-status-actions';

export const metadata = { title: 'Заказ' };
export const dynamic = 'force-dynamic';

const SHIPPING_LABEL: Record<string, string> = { courier: 'Курьер', pickup: 'Самовывоз' };
const PAYMENT_METHOD_LABEL: Record<string, string> = { online: 'Онлайн', cod: 'При получении' };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payment: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!order) notFound();

  const sv = orderStatusView(order.status, order.payment?.status);
  const pv = paymentStatusView(order.payment?.status);

  return (
    <div className="space-y-[24px]">
      {/* Назад */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm font-bold text-admin-on-surface-variant hover:text-admin-on-surface"
      >
        <Icon name="arrow_back" className="text-[18px]" /> К заказам
      </Link>

      {/* Шапка */}
      <AdminPageHeader
        kicker="Заказ"
        title={`#${order.orderNumber}`}
        subtitle={`Оформлен ${formatDateTime(order.createdAt)}`}
        action={
          <div className="grid gap-3 justify-items-end max-[760px]:justify-items-start">
            <div className="flex flex-wrap items-center justify-end gap-2 max-[760px]:justify-start">
              <span className={sv.badge}>{sv.label}</span>
              <span className={pv.badge}>{pv.label}</span>
            </div>
            <OrderStatusActions orderId={order.id} status={order.status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-3">
        {/* Позиции */}
        <div className="space-y-[22px] lg:col-span-2">
          <Section title="Позиции">
            <div className="divide-y divide-admin-outline-variant">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-admin-outline-variant bg-admin-surface-low p-1">
                    {it.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- admin thumb */
                      <img src={it.imageUrl} alt="" className="object-contain w-full h-full" />
                    ) : (
                      <Icon name="image" className="text-admin-on-surface-variant" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-admin-on-surface truncate">{it.productName}</div>
                    <div className="text-xs text-admin-on-surface-variant">
                      {formatOrderItemConfiguration(it)} · {it.skuArticleNumber ?? it.sku ?? '—'}
                    </div>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <div className="text-admin-on-surface-variant">
                      {formatPrice(it.unitPrice)} × {it.quantity}
                    </div>
                    <div className="font-bold text-admin-on-surface">{formatPrice(it.lineTotal)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Итоги */}
          <Section title="Итоги">
            <dl className="space-y-2 text-sm">
              <Row label="Товары" value={formatPrice(order.itemsTotal)} />
              {order.discountAmount > 0 && (
                <Row
                  label={`Скидка${order.couponCode ? ` (${order.couponCode})` : ''}`}
                  value={`−${formatPrice(order.discountAmount)}`}
                />
              )}
              <Row
                label="Доставка"
                value={order.shippingAmount === 0 ? 'Бесплатно' : formatPrice(order.shippingAmount)}
              />
              <div className="flex justify-between pt-2 border-t border-admin-outline-variant">
                <dt className="font-bold text-admin-on-surface">Итого</dt>
                <dd className="font-bold text-admin-on-surface tabular-nums">{formatPrice(order.totalAmount)}</dd>
              </div>
            </dl>
          </Section>
        </div>

        {/* Боковая колонка */}
        <div className="space-y-[22px]">
          <Section title="Покупатель">
            <dl className="space-y-2 text-sm">
              <Row label="Имя" value={order.contactName} />
              <Row label="Телефон" value={order.contactPhone} />
              <Row label="Email" value={order.contactEmail} />
              {order.user?.email && order.user.email !== order.contactEmail && (
                <Row label="Аккаунт" value={order.user.email} />
              )}
            </dl>
          </Section>

          <Section title="Доставка">
            <dl className="space-y-2 text-sm">
              <Row label="Способ" value={SHIPPING_LABEL[order.shippingMethod] ?? order.shippingMethod} />
              {order.city && <Row label="Город" value={order.city} />}
              <Row label="Адрес" value={order.addressLine} />
              {order.addressComment && <Row label="Комментарий" value={order.addressComment} />}
            </dl>
          </Section>

          <Section title="Оплата">
            <dl className="space-y-2 text-sm">
              <Row label="Способ" value={PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod} />
              <div className="flex justify-between">
                <dt className="text-admin-on-surface-variant">Статус</dt>
                <dd>
                  <span className={pv.badge}>{pv.label}</span>
                </dd>
              </div>
              {order.payment && <Row label="Сумма" value={formatPrice(order.payment.amount)} />}
              {order.payment?.paidAt && <Row label="Оплачен" value={formatDateTime(order.payment.paidAt)} />}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AdminPanel className="p-[22px]">
      <h3 className="mb-4 font-admin-head text-[22px] font-extrabold leading-none tracking-[-.035em] text-admin-on-surface">
        {title}
      </h3>
      {children}
    </AdminPanel>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-admin-on-surface-variant shrink-0">{label}</dt>
      <dd className="text-admin-on-surface text-right break-words">{value}</dd>
    </div>
  );
}

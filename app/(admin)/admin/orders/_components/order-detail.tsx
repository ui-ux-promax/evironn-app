import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { Icon } from '@/components/admin/icon';
import { formatDateTime, formatPrice } from '@/lib/format';
import { orderStatusView } from '@/lib/order';
import { paymentStatusView, type AdminCancelBlockReason } from '@/lib/order-admin';
import type { AdminOrderDetail as AdminOrderDetailDto } from '@/lib/admin/orders';
import { OrderStatusActions } from './order-status-actions';

export type { AdminOrderDetailDto as AdminOrderDetail };

export type OrderDetailProps = {
  order: AdminOrderDetailDto | null;
  loading?: boolean;
  error?: string | null;
};

const CANCEL_REASON_LABEL: Record<AdminCancelBlockReason, string> = {
  STATUS_NOT_CANCELLABLE: 'Заказ уже нельзя отменить на этом этапе.',
  PAYMENT_DISPATCH_EVIDENCE_PRESENT: 'Есть подтверждение отправки платежа — требуется проверка возврата.',
  PAYMENT_SUCCEEDED_REFUND_REQUIRED: 'Платёж успешно проведён — для отмены требуется возврат.',
  PAYMENT_CLAIM_IN_FLIGHT: 'Инициализация платежа выполняется — повторите после сверки.',
  PAYMENT_STATE_UNSAFE: 'Состояние платежа требует ручной проверки перед отменой.',
};

export function OrderDetail({ order, loading = false, error = null }: OrderDetailProps) {
  if (loading) {
    return <StatePanel title="Загрузка заказа…" message="Получаем сохранённый снимок заказа." busy />;
  }
  if (error) {
    return <StatePanel title="Не удалось загрузить заказ" message={error} alert />;
  }
  if (!order) {
    return <StatePanel title="Заказ не найден" message="Проверьте ссылку или вернитесь к списку заказов." />;
  }

  const status = orderStatusView(order.status, order.payment.status);
  const payment = paymentStatusView(order.payment.status);
  const cancelReason = order.cancelDecision.ok ? null : CANCEL_REASON_LABEL[order.cancelDecision.reason];

  return (
    <div className="space-y-[24px]">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm font-bold text-admin-on-surface-variant hover:text-admin-on-surface"
      >
        <Icon name="arrow_back" className="text-[18px]" /> К заказам
      </Link>

      <AdminPageHeader
        kicker="Заказ"
        title={`#${order.orderNumber}`}
        subtitle={`Оформлен ${formatDateTime(order.createdAt)}`}
        action={
          <div className="grid gap-3 justify-items-end max-[760px]:justify-items-start">
            <div className="flex flex-wrap items-center justify-end gap-2 max-[760px]:justify-start">
              <span className={status.badge}>{status.label}</span>
              <span className={payment.badge}>{payment.label}</span>
            </div>
            <OrderStatusActions
              orderId={order.id}
              status={order.status}
              nextStatus={order.nextStatus}
              cancelDecision={order.cancelDecision}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-3">
        <div className="space-y-[22px] lg:col-span-2">
          <Section title="Позиции">
            <div className="divide-y divide-admin-outline-variant">
              {order.items.length === 0 ? (
                <p className="text-sm text-admin-on-surface-variant">В заказе нет сохранённых позиций.</p>
              ) : (
                order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-admin-outline-variant bg-admin-surface-low p-1">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- stored order snapshot image */
                        <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <Icon name="image" className="text-admin-on-surface-variant" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-admin-on-surface">{item.productName}</div>
                      <div className="text-xs text-admin-on-surface-variant">
                        {item.combinationLabel} · {item.articleNumber ?? 'Артикул не сохранён'}
                      </div>
                    </div>
                    <div className="text-right text-sm tabular-nums">
                      <div className="text-admin-on-surface-variant">
                        {formatPrice(item.unitPrice)} × {item.quantity}
                      </div>
                      <div className="font-bold text-admin-on-surface">{formatPrice(item.lineTotal)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>

          <Section title="Итоги">
            <dl className="space-y-2 text-sm">
              <Row label="Товары" value={formatPrice(order.totals.items)} />
              {order.totals.discount > 0 && <Row label="Скидка" value={`−${formatPrice(order.totals.discount)}`} />}
              <Row
                label="Доставка"
                value={order.totals.shipping === 0 ? 'Бесплатно' : formatPrice(order.totals.shipping)}
              />
              {order.totals.services > 0 && <Row label="Услуги" value={formatPrice(order.totals.services)} />}
              <div className="flex justify-between border-t border-admin-outline-variant pt-2">
                <dt className="font-bold text-admin-on-surface">Итого</dt>
                <dd className="font-bold tabular-nums text-admin-on-surface">{formatPrice(order.totals.total)}</dd>
              </div>
            </dl>
          </Section>
        </div>

        <div className="space-y-[22px]">
          <Section title="Покупатель">
            <dl className="space-y-2 text-sm">
              <Row label="Имя" value={order.contact.name} />
              <Row label="Телефон" value={order.contact.phone} />
              <Row label="Email" value={order.contact.email} />
            </dl>
          </Section>

          <Section title="Доставка">
            <dl className="space-y-2 text-sm">
              <Row label="Способ" value={order.delivery.method} />
              <Row label="Адрес" value={order.delivery.address || 'Адрес не сохранён'} />
              {order.delivery.date && <Row label="Дата" value={formatDateTime(order.delivery.date)} />}
              {order.delivery.window && <Row label="Окно" value={order.delivery.window} />}
            </dl>
          </Section>

          <Section title="Оплата">
            <dl className="space-y-2 text-sm">
              <Row label="Способ" value={order.payment.method} />
              <Row label="Статус" value={payment.label} />
              <Row label="Признак заявки" value={order.payment.claimEvidencePresent ? 'Обнаружен' : 'Не обнаружен'} />
              <Row
                label="Признак отправки"
                value={order.payment.dispatchEvidencePresent ? 'Обнаружен' : 'Не обнаружен'}
              />
              {order.payment.initializationState && (
                <Row label="Состояние инициализации" value={order.payment.initializationState} />
              )}
            </dl>
          </Section>

          {cancelReason && (
            <div
              data-testid="admin-blocked-reason"
              role="note"
              className="rounded-2xl border border-admin-error/30 bg-admin-error/10 p-4 text-sm text-admin-on-surface"
            >
              <div className="font-bold">Отмена заблокирована</div>
              <p className="mt-1 text-admin-on-surface-variant">{cancelReason}</p>
            </div>
          )}
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
      <dt className="shrink-0 text-admin-on-surface-variant">{label}</dt>
      <dd className="break-words text-right text-admin-on-surface">{value}</dd>
    </div>
  );
}

function StatePanel({
  title,
  message,
  busy = false,
  alert = false,
}: {
  title: string;
  message: string;
  busy?: boolean;
  alert?: boolean;
}) {
  return (
    <AdminPanel>
      <div role={alert ? 'alert' : 'status'} aria-busy={busy}>
        <h1 className="font-admin-head text-2xl font-extrabold text-admin-on-surface">{title}</h1>
        <p className="mt-2 text-sm text-admin-on-surface-variant">{message}</p>
      </div>
    </AdminPanel>
  );
}

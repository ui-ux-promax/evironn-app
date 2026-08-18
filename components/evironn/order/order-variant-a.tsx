'use client';
import Link from 'next/link';
import { RefreshCw, XCircle } from 'lucide-react';
import { ReviewForm } from '@/components/shared/product/review-form';
import type { OrderPageDto } from '@/services/dto/order-page.dto';
import { Crumbs, DeliveryFacts, Lines, MoneyRows, Panel, StatusChip, Tracking } from './order-primitives';
import { useProductionOrderController } from './use-order-variant-a';

export function OrderVariantA({ order, placed = false }: { order: OrderPageDto; placed?: boolean }) {
  const controller = useProductionOrderController(order);
  const initialization = order.payment.kind === 'online' ? order.payment.initialization : null;
  const blocked = initialization?.status === 'PAYMENT_INITIALIZATION_BLOCKED' ? initialization : null;
  return (
    <main className="ord-a" id="main-content">
      <header className="ord-a__head">
        <Crumbs number={order.orderNumber} />
        <div className="ord-a__title">
          <div>
            <p className="ord-eyebrow">Заказ</p>
            <h1>EV-{order.orderNumber}</h1>
            <p>
              {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date(order.createdAt))} ·{' '}
              {order.items.reduce((n, item) => n + item.quantity, 0)} поз.
            </p>
          </div>
          <StatusChip order={order} />
        </div>
      </header>
      {placed && (
        <section className="ord-placed ord-placed--light">
          <div>
            <p className="ord-eyebrow">Заказ принят</p>
            <h2>
              {order.payment.kind === 'online' && order.payment.status === 'succeeded'
                ? 'Спасибо, оплата прошла'
                : 'Заказ сохранён'}
            </h2>
          </div>
        </section>
      )}
      {blocked && (
        <section className="ord-cancel ord-cancel--light">
          <p className="ord-cancel__head">{blocked.heading}</p>
          <p className="ord-cancel__reason">{blocked.message}</p>
        </section>
      )}
      <div className="ord-a__grid">
        <div className="ord-a__main">
          <Panel title="Доставка" note={`${order.delivery.method} · ${order.delivery.address}`}>
            <Tracking order={order} />
          </Panel>
          <Panel title="Состав заказа" note="Цены зафиксированы в момент оформления">
            <Lines order={order} />
          </Panel>
          <Panel title="Получение" note="Адрес и получатель">
            <DeliveryFacts order={order} />
          </Panel>
          {order.reviewTargets.map((target) => (
            <section className="ord-rate ord-rate--light" key={target.productId}>
              <p>
                <b>{target.name}</b>
                {target.reviewed
                  ? 'Вы уже оставили отзыв.'
                  : target.eligible
                    ? 'Поделитесь впечатлением о покупке.'
                    : 'Отзыв доступен после подтверждённой покупки.'}
              </p>
              {target.eligible && !target.reviewed && <ReviewForm productId={target.productId} />}
            </section>
          ))}
        </div>
        <aside className="ord-a__side" aria-label="Сумма заказа">
          <div className="ord-a__summary">
            <h2>{order.payment.kind === 'online' && order.payment.status === 'succeeded' ? 'Оплачено' : 'Итого'}</h2>
            <MoneyRows order={order} />
            <div className="ord-actions ord-actions--light">
              <Link className="ord-btn ord-btn--primary" href="/catalog">
                Вернуться в магазин
              </Link>
              {initialization?.status === 'READY' && (
                <a className="ord-btn ord-btn--primary" href={initialization.continuePaymentUrl}>
                  Продолжить оплату
                </a>
              )}
              {(initialization?.status === 'PENDING' || blocked) && (
                <button className="ord-btn" type="button" onClick={controller.resync} disabled={controller.busy}>
                  <RefreshCw />
                  Проверить статус платежа
                </button>
              )}
              {order.canCancel && (!blocked || blocked.allowedActions.includes('CANCEL_ORDER')) && (
                <button
                  className="ord-btn ord-btn--danger"
                  type="button"
                  onClick={controller.cancel}
                  disabled={controller.busy}
                >
                  <XCircle />
                  Отменить заказ
                </button>
              )}
            </div>
            {controller.notice && <p role="status">{controller.notice}</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}

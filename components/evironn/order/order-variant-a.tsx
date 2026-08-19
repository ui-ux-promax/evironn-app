'use client';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { ReviewForm } from '@/components/shared/product/review-form';
import { CancelOrderButton } from '@/components/shared/orders/cancel-order-button';
import type { OrderPageDto } from '@/services/dto/order-page.dto';
import {
  AddressLine,
  Crumbs,
  DeliveryFacts,
  Lines,
  MoneyRows,
  OrderMeta,
  orderCountLabel,
  Panel,
  PlacedBanner,
  StatusChip,
  Tracking,
} from './order-primitives';
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
            <OrderMeta order={order} />
          </div>
          <StatusChip order={order} />
        </div>
      </header>
      {placed && <PlacedBanner order={order} />}
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
          <Panel
            title="Состав заказа"
            note={`${orderCountLabel(order.items.reduce((sum, item) => sum + item.quantity, 0))}, цены на день оформления`}
          >
            <Lines order={order} />
          </Panel>
          <Panel title="Получение" note="Адрес и получатель">
            <DeliveryFacts order={order} />
          </Panel>
          {order.reviewTargets.map((target) => (
            <section className="ord-review" key={target.productId}>
              <div className="ord-rate ord-rate--light">
                <p>
                  <b>{target.name}</b>
                  {target.reviewed
                    ? 'Вы уже оставили отзыв.'
                    : target.eligible
                      ? 'Поделитесь впечатлением о покупке.'
                      : 'Отзыв доступен после подтверждённой покупки.'}
                </p>
              </div>
              {target.eligible && !target.reviewed && <ReviewForm productId={target.productId} />}
            </section>
          ))}
        </div>
        <aside className="ord-a__side" aria-label="Сумма заказа">
          <div className="ord-a__summary">
            <h2>{order.payment.kind === 'online' && order.payment.status === 'succeeded' ? 'Оплачено' : 'Итого'}</h2>
            <strong>{formatPrice(order.totals.total)}</strong>
            <MoneyRows order={order} />
            <AddressLine order={order} />
            <div className="ord-actions ord-actions--light">
              <Link className="ord-btn ord-btn--primary" href="/catalog">
                Вернуться в магазин
              </Link>
              {initialization?.status === 'PAYMENT_INITIALIZATION_READY' && (
                <a className="ord-btn ord-btn--primary" href={initialization.continuePaymentUrl}>
                  Продолжить оплату
                </a>
              )}
              {(initialization?.status === 'PAYMENT_INITIALIZATION_PENDING' || blocked) && (
                <button className="ord-btn" type="button" onClick={controller.resync} disabled={controller.busy}>
                  <RefreshCw />
                  Проверить статус платежа
                </button>
              )}
              {order.canCancel && (!blocked || blocked.allowedActions.length === 2) && (
                <CancelOrderButton orderId={order.id} className="ord-btn ord-btn--danger">
                  Отменить заказ
                </CancelOrderButton>
              )}
            </div>
            {controller.notice && <p role="status">{controller.notice}</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { Check, Package, Truck } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { OrderPageDto } from '@/services/dto/order-page.dto';

export function Crumbs({ number }: { number: number }) {
  return (
    <nav className="ord-crumbs ord-crumbs--light" aria-label="Хлебные крошки">
      <span>
        <Link href="/profile#orders">Заказы</Link>
      </span>
      <span>
        <i>/</i>
        <b aria-current="page">EV-{number}</b>
      </span>
    </nav>
  );
}
export function StatusChip({ order }: { order: OrderPageDto }) {
  return <span className={`ord-chip ord-chip--light is-${order.stage}`}>{order.statusLabel}</span>;
}
export function Tracking({ order }: { order: OrderPageDto }) {
  const steps = ['Оформлен', 'Собирается', 'В пути', 'Доставлен'];
  const current = ['placed', 'collecting', 'on-way', 'delivered'].indexOf(order.stage);
  if (order.stage === 'cancelled')
    return (
      <section className="ord-cancel ord-cancel--light">
        <p className="ord-cancel__head">Заказ EV-{order.orderNumber} отменён</p>
      </section>
    );
  return (
    <ol className="ord-track ord-track--light ord-track--row" aria-label="Статус заказа">
      {steps.map((label, index) => (
        <li key={label} className={index < current ? 'is-done' : index === current ? 'is-current' : ''}>
          <span className="ord-track__dot">{index < current ? <Check /> : index + 1}</span>
          <b>{label}</b>
          <span className="ord-track__note">{index <= current ? 'Статус подтверждён' : 'Ожидается'}</span>
        </li>
      ))}
      <li className="ord-track__eta">
        <span className="ord-track__dot">
          <Truck />
        </span>
        <b>{order.delivery.dateLabel ?? order.delivery.window}</b>
        <span className="ord-track__note">{order.delivery.window}</span>
      </li>
    </ol>
  );
}
export function Lines({ order }: { order: OrderPageDto }) {
  return (
    <ul className="ord-lines ord-lines--light ord-lines--list">
      {order.items.map((line) => (
        <li key={line.id}>
          <Link className="ord-lines__thumb" href={line.href}>
            {line.imageUrl ? <Image src={line.imageUrl} alt="" width={96} height={96} /> : <Package />}
          </Link>
          <div className="ord-lines__body">
            <Link href={line.href}>{line.name}</Link>
            <em>{line.configuration}</em>
            <span>
              {line.quantity} × {formatPrice(line.unitPrice)}
            </span>
          </div>
          <strong>{formatPrice(line.lineTotal)}</strong>
        </li>
      ))}
    </ul>
  );
}
export function MoneyRows({ order }: { order: OrderPageDto }) {
  const t = order.totals;
  return (
    <dl className="ord-sum ord-sum--light">
      <div>
        <dt>Товары</dt>
        <dd>{formatPrice(t.itemsSubtotal)}</dd>
      </div>
      {t.discount > 0 && (
        <div className="is-save">
          <dt>Скидка</dt>
          <dd>−{formatPrice(t.discount)}</dd>
        </div>
      )}
      <div>
        <dt>Доставка</dt>
        <dd>{t.delivery ? formatPrice(t.delivery) : 'бесплатно'}</dd>
      </div>
      {t.serviceLines.map((line) => (
        <div key={line.id}>
          <dt>{line.label}</dt>
          <dd>{formatPrice(line.amount)}</dd>
        </div>
      ))}
      <div className="is-total">
        <dt>Итого</dt>
        <dd>{formatPrice(t.total)}</dd>
      </div>
    </dl>
  );
}
export function DeliveryFacts({ order }: { order: OrderPageDto }) {
  return (
    <div className="ord-facts ord-facts--light">
      <dl className="ord-rows">
        <div>
          <dt>Способ</dt>
          <dd>{order.delivery.method}</dd>
        </div>
        <div>
          <dt>Адрес</dt>
          <dd>{order.delivery.address}</dd>
        </div>
        <div>
          <dt>Окно</dt>
          <dd>
            {order.delivery.dateLabel ? `${order.delivery.dateLabel}, ${order.delivery.window}` : order.delivery.window}
          </dd>
        </div>
        <div>
          <dt>Получатель</dt>
          <dd>
            {order.contact.name}, {order.contact.phone}
          </dd>
        </div>
        {order.delivery.comment && (
          <div>
            <dt>Комментарий</dt>
            <dd>{order.delivery.comment}</dd>
          </div>
        )}
        <div>
          <dt>Оплата</dt>
          <dd>{order.payment.label}</dd>
        </div>
      </dl>
    </div>
  );
}
export function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="ord-panel ord-a__panel">
      <div className="ord-panel__head">
        <div>
          <h2>{title}</h2>
          {note && <p>{note}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

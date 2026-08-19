'use client';

import { useId, type ReactNode } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiChevronUp,
  FiEdit3,
  FiHome,
  FiMapPin,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiX,
} from 'react-icons/fi';
import type { CheckoutQuoteDto, DeliveryMethod } from '@/services/dto/checkout-page.dto';
import type { CheckoutVariantAController } from './use-checkout-variant-a';
import { countLabel, QtyStepper } from '@/components/evironn/cart/cart-primitives';
import { formatPrice } from '@/lib/format';
import '../../../styles/evironn/CheckoutPrimitives.css';

type Controller = CheckoutVariantAController;
const icons: Record<DeliveryMethod, ReactNode> = {
  courier: <FiTruck aria-hidden="true" />,
  showroom: <FiShoppingBag aria-hidden="true" />,
  'pickup-point': <FiPackage aria-hidden="true" />,
};

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  wide = false,
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  wide?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <p className={`chk-field chk-field--light${wide ? ' is-wide' : ''}${error ? ' is-bad' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <span className="chk-field__control">
        <input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? noteId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      {error && (
        <span className="chk-field__note" id={noteId} role="alert">
          <FiAlertCircle aria-hidden="true" />
          {error}
        </span>
      )}
    </p>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? (
    <span className="chk-field__note" role="alert">
      <FiAlertCircle aria-hidden="true" />
      {error}
    </span>
  ) : null;
}

export function ContactFields({ controller }: { controller: Controller }) {
  const { form, actions, fieldErrors } = controller;
  return (
    <div className="chk-grid">
      <Field
        label="Имя и фамилия"
        value={form.contactName}
        onChange={actions.setContactName}
        disabled={controller.interactionsLocked}
        error={fieldErrors.contactName}
      />
      <Field
        label="Телефон"
        value={form.contactPhone}
        onChange={actions.setContactPhone}
        type="tel"
        disabled={controller.interactionsLocked}
        error={fieldErrors.contactPhone}
      />
      <Field
        label="E-mail"
        value={form.contactEmail}
        onChange={actions.setContactEmail}
        type="email"
        wide
        disabled={controller.interactionsLocked}
        error={fieldErrors.contactEmail}
      />
    </div>
  );
}

export function ReceivePicker({ controller }: { controller: Controller }) {
  const { form, options, actions } = controller;
  return (
    <div className="chk-receive chk-receive--light" role="radiogroup" aria-label="Способ получения">
      {options.delivery.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.id === form.deliveryMethod}
          className={option.id === form.deliveryMethod ? 'is-on' : ''}
          disabled={controller.interactionsLocked}
          onClick={() => actions.setDeliveryMethod(option.id)}
        >
          <span className="chk-receive__mark" aria-hidden="true" />
          <span className="chk-receive__body">
            <span className="chk-receive__top">
              {icons[option.id]}
              {option.label}
            </span>
            <span className="chk-receive__note">Детали и срок подтвердит сервер</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function AddressBook({ controller }: { controller: Controller }) {
  const { form, options, actions } = controller;
  return (
    <div className="chk-book chk-book--light" role="radiogroup" aria-label="Сохраненные адреса">
      {options.savedAddresses.map((address) => (
        <button
          key={address.id}
          type="button"
          role="radio"
          aria-checked={form.selectedAddressId === address.id}
          className={form.selectedAddressId === address.id ? 'is-on' : ''}
          disabled={controller.interactionsLocked}
          onClick={() => actions.pickAddress(address.id)}
        >
          <FiHome aria-hidden="true" />
          <span>
            <b>{address.label}</b>
            {address.street}
          </span>
        </button>
      ))}
      <button
        type="button"
        role="radio"
        aria-checked={form.selectedAddressId === 'new'}
        className={form.selectedAddressId === 'new' ? 'is-on' : ''}
        disabled={controller.interactionsLocked}
        onClick={() => actions.pickAddress('new')}
      >
        <FiEdit3 aria-hidden="true" />
        <span>
          <b>Новый адрес</b>заполнить вручную
        </span>
      </button>
    </div>
  );
}

export function AddressFields({ controller }: { controller: Controller }) {
  const { form, actions, fieldErrors } = controller;
  return (
    <div className="chk-grid chk-grid--address">
      <Field
        label="Адрес"
        value={form.address.addressLine}
        onChange={(value) => actions.setAddress({ ...form.address, addressLine: value })}
        wide
        disabled={controller.interactionsLocked}
        error={fieldErrors.addressLine}
      />
      <Field
        label="Город"
        value={form.address.city}
        onChange={(value) => actions.setAddress({ ...form.address, city: value })}
        disabled={controller.interactionsLocked}
        error={fieldErrors.city}
      />
      <Field
        label="Этаж"
        value={form.address.floor?.toString() ?? ''}
        onChange={(value) => actions.setAddress({ ...form.address, floor: value ? Number(value) : undefined })}
        type="number"
        disabled={controller.interactionsLocked}
        error={fieldErrors.floor}
      />
      <Field
        label="Домофон"
        value={form.address.intercom ?? ''}
        onChange={(value) => actions.setAddress({ ...form.address, intercom: value })}
        disabled={controller.interactionsLocked}
      />
      <Field
        label="Комментарий курьеру"
        value={form.address.addressComment ?? ''}
        onChange={(value) => actions.setAddress({ ...form.address, addressComment: value })}
        wide
        disabled={controller.interactionsLocked}
      />
      <p className="chk-lift chk-lift--light">
        <span className="chk-label">Лифт</span>
        <span role="radiogroup" aria-label="Лифт">
          {(
            [
              { id: 'passenger', label: 'Пассажирский', note: 'Подъём входит в доставку' },
              { id: 'freight', label: 'Грузовой', note: 'Подъём входит в доставку' },
              { id: 'none', label: 'Лифта нет', note: 'Подъём на руках, оплачивается по этажам' },
            ] as const
          ).map((lift) => (
            <button
              key={lift.id}
              type="button"
              role="radio"
              aria-checked={form.address.liftType === lift.id}
              className={form.address.liftType === lift.id ? 'is-on' : ''}
              title={lift.note}
              disabled={controller.interactionsLocked}
              onClick={() => actions.setAddress({ ...form.address, liftType: lift.id })}
            >
              {lift.label}
            </button>
          ))}
        </span>
        <FieldError error={fieldErrors.liftType} />
      </p>
    </div>
  );
}

export function PointPicker({ controller }: { controller: Controller }) {
  const { form, options, actions, fieldErrors } = controller;
  const points = options.pickupPoints.filter((point) => point.kind === form.deliveryMethod);
  return (
    <div className="chk-points chk-points--light">
      <p className="chk-label">Пункт получения</p>
      <div role="radiogroup" aria-label="Пункт получения">
        {points.map((point) => (
          <button
            key={point.id}
            type="button"
            role="radio"
            aria-checked={point.id === form.pickupPointId}
            className={point.id === form.pickupPointId ? 'is-on' : ''}
            disabled={controller.interactionsLocked}
            onClick={() => actions.setPickupPointId(point.id)}
          >
            <FiMapPin aria-hidden="true" />
            <span>
              <b>{point.name}</b>
              {point.address}
              <em>{point.hours}</em>
            </span>
          </button>
        ))}
      </div>
      <FieldError error={fieldErrors.pickupPointId} />
    </div>
  );
}

export function SlotPicker({ controller }: { controller: Controller }) {
  const { form, options, actions, fieldErrors } = controller;
  return (
    <div className="chk-slots chk-slots--light">
      <p className="chk-label">Дата и окно</p>
      <div role="radiogroup" aria-label="Дата получения">
        {options.slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            role="radio"
            aria-checked={slot.id === form.deliverySlotId}
            className={slot.id === form.deliverySlotId ? 'is-on' : ''}
            disabled={controller.interactionsLocked}
            onClick={() => actions.setDeliverySlotId(slot.id)}
          >
            <b>{slot.date}</b>
            <span>{slot.windowLabel}</span>
          </button>
        ))}
      </div>
      <FieldError error={fieldErrors.deliverySlotId} />
    </div>
  );
}

export function ServiceOptions({ controller }: { controller: Controller }) {
  const { form, actions, quote } = controller;
  const rows: Array<{ id: keyof typeof form.services; label: string; note?: string; amount: number | null }> = [
    {
      id: 'carrying',
      label: 'Подъём на этаж',
      note:
        form.address.liftType === 'none'
          ? 'Без лифта — 350 ₽ за этаж выше первого'
          : form.address.liftType === 'freight'
            ? 'Грузовой лифт — подъём уже включён в доставку'
            : 'Пассажирский лифт — подъём уже включён в доставку',
      amount: quote?.serviceLines.find((line) => line.id === 'carrying')?.amount ?? null,
    },
    {
      id: 'assembly',
      label: 'Сборка на месте',
      amount: quote?.serviceLines.find((line) => line.id === 'assembly')?.amount ?? null,
    },
    {
      id: 'removal',
      label: 'Вывоз старой мебели',
      amount: quote?.serviceLines.find((line) => line.id === 'removal')?.amount ?? null,
    },
  ];
  return (
    <ul className="chk-services chk-services--light">
      {rows.map((row) => (
        <li key={row.id}>
          <label>
            <input
              type="checkbox"
              checked={form.services[row.id]}
              disabled={controller.interactionsLocked}
              onChange={(event) => actions.setServices({ ...form.services, [row.id]: event.target.checked })}
            />
            <span className="chk-check" aria-hidden="true">
              <FiCheck />
            </span>
            <span className="chk-services__body">
              <b>{row.label}</b>
              {row.id === 'carrying' ? row.note : 'Цена рассчитана сервером'}
            </span>
            <em>
              {row.amount === null
                ? 'Рассчитывается после выбора'
                : row.amount === 0
                  ? 'бесплатно'
                  : `+ ${formatPrice(row.amount)}`}
            </em>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function PaymentPicker({ controller }: { controller: Controller }) {
  const { form, actions } = controller;
  return (
    <div className="chk-pay chk-pay--light" role="radiogroup" aria-label="Способ оплаты">
      {[
        ['online', 'Картой онлайн'],
        ['cod', 'При получении'],
      ].map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={form.paymentMethod === id}
          className={form.paymentMethod === id ? 'is-on' : ''}
          disabled={controller.interactionsLocked}
          onClick={() => actions.setPaymentMethod(id as 'online' | 'cod')}
        >
          <span className="chk-receive__mark" aria-hidden="true" />
          <span className="chk-pay__body">
            <span className="chk-pay__top">{label}</span>
            <span className="chk-pay__note">
              {id === 'cod'
                ? 'Оплата наличными при получении.'
                : process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
                  ? 'Тестовая оплата. Деньги не списываются.'
                  : 'Данные карты вводятся на странице YooKassa.'}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function OrderLines({ controller }: { controller: Controller }) {
  const { cart, quote, interactionsLocked, actions } = controller;
  const lines = quote?.cart.items ?? cart.items;
  return (
    <ul className="chk-lines chk-lines--light">
      {lines.map((line) => (
        <li key={line.id}>
          <div className="chk-lines__thumb">{line.imageUrl && <img src={line.imageUrl} alt="" />}</div>
          <div className="chk-lines__body">
            <b>{line.name}</b>
            <em>{line.configuration.map((option) => option.valueLabel).join(' · ')}</em>
            <QtyStepper
              qty={line.quantity}
              name={line.name}
              max={Math.min(line.stock, 99)}
              disabled={interactionsLocked || !line.available}
              onStep={(delta) => void actions.step(line.id, line.quantity + delta).catch(() => undefined)}
              onSet={(quantity) => void actions.step(line.id, quantity).catch(() => undefined)}
            />
          </div>
          <div className="chk-lines__money">
            {formatPrice(line.lineTotal)}
            <button
              type="button"
              disabled={interactionsLocked}
              onClick={() => void actions.remove(line.id)}
              aria-label={`Удалить ${line.name}`}
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SummaryRows({ quote }: { quote: CheckoutQuoteDto | null }) {
  if (!quote) return <p role="status">Рассчитываем стоимость…</p>;
  return (
    <dl className="crt-sum crt-sum--light">
      <div className="crt-sum__row">
        <dt>{countLabel(quote.totals.itemCount)}</dt>
        <dd>{formatPrice(quote.totals.compareAtSubtotal)}</dd>
      </div>
      {quote.totals.saleDiscount > 0 && (
        <div className="crt-sum__row is-save">
          <dt>Выгода по акции</dt>
          <dd>−{formatPrice(quote.totals.saleDiscount)}</dd>
        </div>
      )}
      {quote.totals.couponDiscount > 0 && (
        <div className="crt-sum__row is-save">
          <dt>{quote.coupon ? `Промокод −${quote.coupon.percent}%` : 'Промокод'}</dt>
          <dd>−{formatPrice(quote.totals.couponDiscount)}</dd>
        </div>
      )}
      <div className="crt-sum__row">
        <dt>Доставка</dt>
        <dd>{quote.totals.deliveryAmount === 0 ? 'бесплатно' : formatPrice(quote.totals.deliveryAmount)}</dd>
      </div>
      {quote.serviceLines.map((line) => (
        <div className="crt-sum__row" key={line.id}>
          <dt>{line.label}</dt>
          <dd>{line.amount === 0 ? 'бесплатно' : formatPrice(line.amount)}</dd>
        </div>
      ))}
      <div className="crt-sum__row is-total">
        <dt>Итого</dt>
        <dd>{formatPrice(quote.totals.total)}</dd>
      </div>
    </dl>
  );
}

export function SubmitButton({ controller }: { controller: Controller }) {
  const { quote, quotePending, mutationPending, submitPending, submitLocked, actions } = controller;
  const unavailableTotal = quotePending || mutationPending ? 'Рассчитываем…' : 'Стоимость недоступна';
  return (
    <button
      className="chk-submit chk-submit--light"
      type="button"
      disabled={!quote || quotePending || mutationPending || submitPending || submitLocked}
      aria-busy={submitPending}
      onClick={() => void actions.submit()}
    >
      {submitPending
        ? 'Оформляем…'
        : quote
          ? `Оформить заказ · ${formatPrice(quote.totals.total)}`
          : `Оформить заказ · ${unavailableTotal}`}
    </button>
  );
}

export function MobileBar({ controller, summary }: { controller: Controller; summary: ReactNode }) {
  const total = controller.quote
    ? formatPrice(controller.quote.totals.total)
    : controller.quotePending || controller.mutationPending
      ? 'Рассчитываем…'
      : 'Стоимость недоступна';
  const count = controller.quote?.totals.itemCount ?? controller.cart.totals.itemCount;
  return (
    <div className="chk-bar chk-bar--light">
      <details className="chk-bar__details">
        <summary>
          <span>
            <b>{total}</b>
            {countLabel(count)}
          </span>
          <em>
            Состав заказа
            <FiChevronUp aria-hidden="true" />
          </em>
        </summary>
        <div className="chk-bar__sheet">{summary}</div>
      </details>
      <SubmitButton controller={controller} />
    </div>
  );
}

export function BlockedCard({ blocked }: { blocked: NonNullable<Controller['blocked']> }) {
  return (
    <section
      className="chk-done chk-done--light"
      aria-label="Платеж требует проверки"
      data-continue-payment-url={blocked.continuePaymentUrl ?? undefined}
    >
      <span className="chk-done__mark" aria-hidden="true">
        <FiAlertCircle />
      </span>
      <h1>{blocked.heading}</h1>
      <p className="chk-done__lede">{blocked.message}</p>
      {blocked.allowedActions.includes('OPEN_ORDER') && (
        <span className="chk-done__actions">
          <a className="chk-done__primary" href={`/orders/${blocked.orderNumber}?placed=1`}>
            Открыть заказ №{blocked.orderNumber}
          </a>
        </span>
      )}
    </section>
  );
}

export function CompletedOrderCard({ completion }: { completion: NonNullable<Controller['completedOrder']> }) {
  return (
    <section className="chk-done chk-done--light" aria-label={completion.heading}>
      <span className="chk-done__mark" aria-hidden="true">
        <FiCheck />
      </span>
      <h1>{completion.heading}</h1>
      <p className="chk-done__lede">{completion.message}</p>
      <span className="chk-done__actions">
        {completion.paymentUrl && (
          <a className="chk-done__primary" href={completion.paymentUrl}>
            Перейти к оплате
          </a>
        )}
        <a
          className={completion.paymentUrl ? 'chk-done__ghost' : 'chk-done__primary'}
          href={`/orders/${completion.orderNumber}?placed=1`}
        >
          Открыть заказ №{completion.orderNumber}
        </a>
      </span>
    </section>
  );
}

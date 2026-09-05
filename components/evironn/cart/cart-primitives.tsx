'use client';

import { useEffect, useId, useState } from 'react';
import { FiCheck, FiHeadphones, FiMinus, FiPlus, FiRotateCcw, FiShoppingBag, FiTag, FiX } from 'react-icons/fi';
import type { CartTotalsDto } from '@/services/dto/commerce-cart.dto';
import { FadeArc } from '@/components/loading-ui/fade-arc';
import { formatPrice } from '@/lib/format';
import '../../../styles/evironn/CartPrimitives.css';

const CHECKOUT_STEPS = [
  { id: 'cart', label: 'Корзина' },
  { id: 'checkout', label: 'Оформление' },
  { id: 'payment', label: 'Оплата' },
];
const MAX_QTY = 99;

type PromoStatus = 'idle' | 'applied' | 'invalid' | 'expired';
export type PromoState = { input: string; code: string; status: PromoStatus; percent: number; message?: string };

function promoMessage(promo: PromoState): string {
  if (promo.status === 'applied') return `Промокод ${promo.code} принят — −${promo.percent}%`;
  if (promo.status === 'expired') return `Промокод ${promo.code} истёк`;
  if (promo.status === 'invalid') return 'Такого промокода нет';
  return '';
}

export function countLabel(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  const word =
    mod100 >= 11 && mod100 <= 14 ? 'товаров' : mod10 === 1 ? 'товар' : mod10 >= 2 && mod10 <= 4 ? 'товара' : 'товаров';
  return `${count} ${word}`;
}

type Tone = 'light' | 'dark';

/* ---------- Checkout progress ---------- */

export function Steps({ current = 'cart', tone = 'light' }: { current?: string; tone?: Tone }) {
  const index = CHECKOUT_STEPS.findIndex((step) => step.id === current);
  return (
    <nav className={`crt-steps crt-steps--${tone}`} aria-label="Шаги оформления">
      <ol>
        {CHECKOUT_STEPS.map((step, position) => (
          <li
            key={step.id}
            className={position === index ? 'is-current' : position < index ? 'is-done' : ''}
            aria-current={position === index ? 'step' : undefined}
          >
            <span className="crt-steps__dot" aria-hidden="true">
              {position < index ? <FiCheck /> : position + 1}
            </span>
            <span className="crt-steps__label">{step.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------- Quantity stepper ---------- */

export function QtyStepper({
  qty,
  onStep,
  onSet,
  size = 'md',
  tone = 'light',
  name,
  maxQty = MAX_QTY,
  max,
  disabled = false,
  pending = null,
}: {
  qty: number;
  onStep: (delta: number) => void;
  onSet?: (qty: number) => void;
  size?: 'md' | 'lg';
  tone?: Tone;
  name: string;
  maxQty?: number;
  max?: number;
  disabled?: boolean;
  pending?: 'decrement' | 'increment' | 'input' | null;
}) {
  const maximum = max ?? maxQty;
  return (
    <div className={`crt-qty crt-qty--${size} crt-qty--${tone}`}>
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={disabled || qty <= 1 || pending === 'decrement'}
        aria-busy={pending === 'decrement' || undefined}
        aria-label={`Убрать одну штуку ${name}`}
      >
        {pending === 'decrement' ? <FadeArc aria-hidden="true" /> : <FiMinus aria-hidden="true" />}
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={qty}
        aria-label={`Количество ${name}`}
        disabled={disabled || pending !== null}
        aria-busy={pending === 'input' || undefined}
        onChange={(event) => onSet?.(Math.min(maximum, Number(event.target.value.replace(/\D/g, '')) || 1))}
      />
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={disabled || qty >= maximum || pending === 'increment'}
        aria-busy={pending === 'increment' || undefined}
        aria-label={`Добавить одну штуку ${name}`}
      >
        {pending === 'increment' ? <FadeArc aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
      </button>
    </div>
  );
}

/* ---------- Promo code ---------- */

export function PromoField({
  promo,
  onType,
  onApply,
  onClear,
  pending = false,
  tone = 'light',
}: {
  promo: PromoState;
  onType: (input: string) => void;
  onApply: () => void;
  onClear: () => void;
  pending?: boolean;
  tone?: Tone;
}) {
  const id = useId();
  const message = promo.message ?? promoMessage(promo);
  return (
    <div className={`crt-promo crt-promo--${tone} is-${promo.status}`}>
      <label className="crt-promo__label" htmlFor={id}>
        Промокод
      </label>
      <form
        className="crt-promo__row"
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending) onApply();
        }}
      >
        <span className="crt-promo__field">
          <FiTag aria-hidden="true" />
          <input
            id={id}
            type="text"
            value={promo.input}
            placeholder="EVIRONN10"
            autoComplete="off"
            spellCheck={false}
            disabled={pending}
            aria-describedby={message ? `${id}-status` : undefined}
            aria-invalid={promo.status === 'invalid' || promo.status === 'expired'}
            onChange={(event) => onType(event.target.value)}
          />
          {promo.status === 'applied' && (
            <button className="crt-promo__drop" type="button" onClick={onClear} aria-label="Убрать промокод">
              <FiX aria-hidden="true" />
            </button>
          )}
        </span>
        <button
          className="crt-promo__apply"
          type="submit"
          disabled={pending || !promo.input.trim()}
          aria-busy={pending || undefined}
        >
          {pending && <FadeArc aria-hidden="true" />}
          {pending ? 'Проверка' : 'Применить'}
        </button>
      </form>
      {message && (
        <p className="crt-promo__status" id={`${id}-status`} role="status">
          {promo.status === 'applied' && <FiCheck aria-hidden="true" />}
          {message}
        </p>
      )}
    </div>
  );
}
/* ---------- Order summary rows ---------- */

/** Extra paid lines a page can slot in before the total — checkout uses it for its services. */
export type SummaryExtra = { id: string; label: string; price: number };

export function SummaryRows({
  totals,
  percent,
  extra = [],
  tone = 'light',
}: {
  totals: CartTotalsDto;
  percent: number;
  extra?: SummaryExtra[];
  tone?: Tone;
}) {
  return (
    <dl className={`crt-sum crt-sum--${tone}`}>
      <div className="crt-sum__row">
        <dt>{countLabel(totals.itemCount)}</dt>
        <dd>{formatPrice(totals.compareAtSubtotal)}</dd>
      </div>
      {totals.saleDiscount > 0 && (
        <div className="crt-sum__row is-save">
          <dt>Выгода по акции</dt>
          <dd>−{formatPrice(totals.saleDiscount)}</dd>
        </div>
      )}
      {totals.couponDiscount > 0 && (
        <div className="crt-sum__row is-save">
          <dt>Промокод −{percent}%</dt>
          <dd>−{formatPrice(totals.couponDiscount)}</dd>
        </div>
      )}
      {extra.map((row) => (
        <div className="crt-sum__row" key={row.id}>
          <dt>{row.label}</dt>
          <dd>{row.price === 0 ? 'бесплатно' : formatPrice(row.price)}</dd>
        </div>
      ))}
      <div className="crt-sum__row is-total">
        <dt>Итого</dt>
        <dd>{formatPrice(totals.total)}</dd>
      </div>
    </dl>
  );
}
/* ---------- Undo after removal ---------- */

export function UndoBar({
  label,
  onUndo,
  onDismiss,
  pending = false,
}: {
  label: string | null;
  onUndo: () => void;
  onDismiss: () => void;
  pending?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  /** Keep the bar mounted so it can slide out — only the flag follows the removal. */
  useEffect(() => {
    setVisible(Boolean(label));
  }, [label]);

  return (
    <div className={`crt-undo${visible ? ' is-open' : ''}`} role="status" aria-live="polite">
      <p>{label ? `«${label}» убрали из корзины` : ''}</p>
      <button
        className="crt-undo__undo"
        type="button"
        onClick={onUndo}
        disabled={pending}
        aria-busy={pending || undefined}
      >
        {pending ? <FadeArc aria-hidden="true" /> : <FiRotateCcw aria-hidden="true" />} Вернуть
      </button>
      <button className="crt-undo__close" type="button" onClick={onDismiss} aria-label="Закрыть уведомление">
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
}

/* ---------- Empty cart ---------- */

export function EmptyCart({ tone = 'light' }: { tone?: Tone }) {
  return (
    <div className={`crt-empty crt-empty--${tone}`}>
      <span className="crt-empty__mark" aria-hidden="true">
        <FiShoppingBag />
      </span>
      <p className="crt-empty__title">В корзине пока пусто</p>
      <p className="crt-empty__copy">
        Загляните в каталог — соберём кресло, диван или барный стул под вашу комнату и посчитаем доставку.
      </p>
      <span className="crt-empty__actions">
        <a className="crt-empty__primary" href="/catalog">
          В каталог
        </a>
      </span>
    </div>
  );
}

export function SupportLink({ tone = 'light' }: { tone?: Tone }) {
  return (
    <a className={`crt-support crt-support--${tone}`} href="/catalog">
      <FiHeadphones aria-hidden="true" />
      <span>
        <b>Нужен совет по составу заказа?</b>
        Консультант подберёт ткань и проверит сроки — ответим в течение часа.
      </span>
    </a>
  );
}

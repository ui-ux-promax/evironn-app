'use client';

import { FiEdit2, FiShield } from 'react-icons/fi';
import { EmptyCart, PromoField, Steps, SupportLink } from '@/components/evironn/cart/cart-primitives';
import type { CheckoutPageDto } from '@/services/dto/checkout-page.dto';
import {
  AddressBook,
  AddressFields,
  BlockedCard,
  ContactFields,
  MobileBar,
  OrderLines,
  PaymentPicker,
  PointPicker,
  ReceivePicker,
  ServiceOptions,
  SlotPicker,
  SubmitButton,
  SummaryRows,
} from './checkout-primitives';
import { useCheckoutVariantA } from './use-checkout-variant-a';
import '../../../styles/evironn/CheckoutVariantA.css';

export function CheckoutVariantA({ initialData }: { initialData: CheckoutPageDto }) {
  const controller = useCheckoutVariantA(initialData);
  const { cart, form, quote, quotePending, quoteError, submitError, blocked, actions } = controller;

  if (blocked) {
    return (
      <main className="chk-a chk-a--done" id="main-content">
        <Steps current="payment" />
        <BlockedCard blocked={blocked} />
      </main>
    );
  }

  if (cart.items.length === 0 && !cart.loading) {
    return (
      <main className="chk-a" id="main-content">
        <header className="chk-a__head">
          <Steps current="checkout" />
          <h1>Оформление</h1>
        </header>
        <EmptyCart />
      </main>
    );
  }

  const summary = (
    <>
      <OrderLines controller={controller} />
      <PromoField
        promo={{
          input: form.couponCode,
          code: quote?.coupon?.code ?? '',
          status: quote?.coupon ? 'applied' : 'idle',
          percent: quote?.coupon?.percent ?? 0,
        }}
        pending={quotePending}
        onType={actions.setCouponCode}
        onApply={() => actions.setCouponCode(form.couponCode.trim())}
        onClear={() => actions.setCouponCode('')}
      />
      <SummaryRows quote={quote} />
    </>
  );

  return (
    <main className="chk-a" id="main-content">
      <header className="chk-a__head">
        <Steps current="checkout" />
        <h1>Оформление</h1>
        <p className="chk-a__lede">
          Состав заказа, доставка и услуги пересчитываются сервером после каждого изменения.
        </p>
      </header>
      {(quoteError || submitError) && (
        <p className="chk-alert chk-alert--light" role="alert">
          {quoteError ?? submitError}
        </p>
      )}
      <div className="chk-a__grid">
        <div className="chk-a__form">
          <section className="chk-a__card" aria-labelledby="chk-a-contact">
            <header className="chk-a__card-head">
              <h2 id="chk-a-contact">Контакты</h2>
              <p>Пришлем чек и статус заказа</p>
            </header>
            <ContactFields controller={controller} />
          </section>
          <section className="chk-a__card" aria-labelledby="chk-a-receive">
            <header className="chk-a__card-head">
              <h2 id="chk-a-receive">Получение</h2>
              <p>Курьер, шоурум или пункт выдачи</p>
            </header>
            <ReceivePicker controller={controller} />
            {form.deliveryMethod === 'courier' ? (
              <div className="chk-a__block">
                <p className="chk-a__block-head">
                  Адрес доставки{' '}
                  <span>
                    <FiEdit2 aria-hidden="true" /> можно выбрать сохраненный
                  </span>
                </p>
                <AddressBook controller={controller} />
                <AddressFields controller={controller} />
                <p className="chk-label">Зона доставки</p>
                <div className="chk-receive chk-receive--light" role="radiogroup" aria-label="Зона доставки">
                  {[
                    ['moscow', 'Москва'],
                    ['moscow-region', 'Московская область'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={form.deliveryZone === id}
                      className={form.deliveryZone === id ? 'is-on' : ''}
                      onClick={() => actions.setDeliveryZone(id as 'moscow' | 'moscow-region')}
                    >
                      <span className="chk-receive__mark" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chk-a__block">
                <PointPicker controller={controller} />
              </div>
            )}
            <div className="chk-a__block">
              <SlotPicker controller={controller} />
            </div>
            {form.deliveryMethod === 'courier' && (
              <div className="chk-a__block">
                <p className="chk-a__block-head">Дополнительные услуги</p>
                <ServiceOptions controller={controller} />
              </div>
            )}
          </section>
          <section className="chk-a__card" aria-labelledby="chk-a-payment">
            <header className="chk-a__card-head">
              <h2 id="chk-a-payment">Оплата</h2>
              <p>Онлайн через YooKassa или наличными при получении</p>
            </header>
            <PaymentPicker controller={controller} />
            <div className="chk-a__submit">
              <SubmitButton controller={controller} />
              <p className={quote ? 'chk-a__note is-ready' : 'chk-a__note'}>
                <FiShield aria-hidden="true" />
                {quote ? 'Сервер подтвердил итоговую стоимость' : 'Дождитесь расчета стоимости'}
              </p>
            </div>
          </section>
          <SupportLink />
        </div>
        <aside className="chk-a__side" aria-label="Сводка заказа">
          <div className="chk-a__summary">
            <h2>Ваш заказ</h2>
            {summary}
            <SubmitButton controller={controller} />
          </div>
        </aside>
      </div>
      <MobileBar controller={controller} />
    </main>
  );
}

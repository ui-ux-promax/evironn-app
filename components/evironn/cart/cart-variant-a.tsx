'use client';

import { Loader2 } from 'lucide-react';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import { CatalogCard } from '@/components/evironn/catalog/catalog-card';
import type { CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import { EmptyCart, PromoField, QtyStepper, Steps, SummaryRows, SupportLink, UndoBar } from './cart-primitives';
import { useCartVariantA } from './use-cart-variant-a';
import '../../../styles/evironn/CartVariantA.css';

export interface CartVariantAProps {
  related: CatalogBCard[];
  initialWishlistedIds: string[];
}

const CHECKOUT_DISABLED_LABELS = {
  loading: 'Дождитесь загрузки корзины.',
  error: 'Не удалось загрузить корзину. Обновите страницу.',
  unavailable: 'В корзине есть товары, которых нет в наличии.',
  legacy: 'В корзине есть устаревшие позиции. Добавьте их заново.',
  stock: 'Количество некоторых товаров превышает доступный остаток.',
  limit: 'Количество товара в одной позиции не может превышать 99.',
} as const;

export function CartVariantA({ related, initialWishlistedIds }: CartVariantAProps) {
  const { items, totals, loading, error, removed, savedMessage, promo, promoPending, wishlistedIds, actions } =
    useCartVariantA(initialWishlistedIds);
  const removedName = removed?.item.name ?? null;
  const canCheckout =
    !loading &&
    !error &&
    items.length > 0 &&
    items.every((item) => item.available && !item.isLegacy && item.quantity <= item.stock && item.quantity <= 99);
  const checkoutDisabledLabel = loading
    ? CHECKOUT_DISABLED_LABELS.loading
    : error
      ? CHECKOUT_DISABLED_LABELS.error
      : items.some((item) => !item.available)
        ? CHECKOUT_DISABLED_LABELS.unavailable
        : items.some((item) => item.isLegacy)
          ? CHECKOUT_DISABLED_LABELS.legacy
          : items.some((item) => item.quantity > 99)
            ? CHECKOUT_DISABLED_LABELS.limit
            : CHECKOUT_DISABLED_LABELS.stock;

  return (
    <main className="cart-a" id="main-content">
      <header className="cart-a__head">
        <Steps current="cart" />
        <h1>Корзина</h1>
        <p className="cart-a__lede">
          {items.length > 0
            ? `${totals.itemCount} товаров на ${totals.total.toLocaleString('ru-RU')} ₽ — количество и состав меняются здесь, без перехода к оплате.`
            : 'Соберите заказ в каталоге — доставку посчитаем на следующем этапе.'}
        </p>
      </header>

      {error && (
        <p className="cart-a__lede" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      {items.length === 0 && !loading ? (
        <EmptyCart />
      ) : (
        <div className="cart-a__grid">
          <section className="cart-a__list" aria-label="Позиции заказа">
            <div className="cart-a__list-head">
              <p>{totals.itemCount} товаров</p>
              <button type="button" onClick={() => void actions.clear().catch(() => undefined)}>
                Очистить корзину
              </button>
            </div>

            <div className="cart-a__columns" aria-hidden="true">
              <span>Товар</span>
              <span>Количество</span>
              <span>Стоимость</span>
            </div>

            <ul className="cart-a__lines">
              {items.map((item) => {
                const configurationLabel = item.configuration
                  .map((option) => `${option.groupLabel}: ${option.valueLabel}`)
                  .join(' · ');
                return (
                  <li className="cart-a__line" key={item.id}>
                    <a className="cart-a__thumb" href={`/product/${item.productSlug}`} aria-label={item.name}>
                      {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />}
                    </a>

                    <div className="cart-a__info">
                      <a className="cart-a__name" href={`/product/${item.productSlug}`}>
                        {item.name}
                      </a>
                      <p className="cart-a__meta">
                        {configurationLabel || 'Конфигурация'}
                        {!item.available && <em className="cart-a__order">Нет в наличии</em>}
                      </p>
                      {item.configuration.some((option) => option.swatchHex) && (
                        <div className="cart-a__swatches" aria-label={`Конфигурация ${item.name}`}>
                          {item.configuration
                            .filter((option) => option.swatchHex)
                            .map((option) => (
                              <button
                                type="button"
                                key={`${option.groupSlug}:${option.valueSlug}`}
                                role="radio"
                                aria-checked="true"
                                aria-label={`${option.groupLabel}: ${option.valueLabel}`}
                                title={`${option.groupLabel}: ${option.valueLabel}`}
                                disabled
                                className="is-on"
                                style={{ background: option.swatchHex ?? undefined }}
                              />
                            ))}
                        </div>
                      )}
                      <p className="cart-a__unit">{item.unitPrice.toLocaleString('ru-RU')} ₽ за штуку</p>
                    </div>

                    <div className="cart-a__qty">
                      <QtyStepper
                        qty={item.quantity}
                        max={Math.min(item.stock, 99)}
                        name={item.name}
                        disabled={!item.available}
                        onStep={(delta) => void actions.step(item.id, item.quantity + delta).catch(() => undefined)}
                        onSet={(quantity) => void actions.step(item.id, quantity).catch(() => undefined)}
                      />
                    </div>

                    <div className="cart-a__money">
                      <p className="cart-a__sum">{item.lineTotal.toLocaleString('ru-RU')} ₽</p>
                      {item.oldLineTotal !== null && <s>{item.oldLineTotal.toLocaleString('ru-RU')} ₽</s>}
                    </div>

                    <div className="cart-a__line-actions">
                      <button
                        type="button"
                        onClick={() => void actions.saveToWishlist(item).catch(() => undefined)}
                        aria-label={`Отложить ${item.name}`}
                      >
                        <FiHeart aria-hidden="true" /> В избранное
                      </button>
                      <button
                        type="button"
                        onClick={() => void actions.remove(item.id).catch(() => undefined)}
                        aria-label={`Удалить ${item.name}`}
                      >
                        <FiTrash2 aria-hidden="true" /> Удалить
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <SupportLink />
          </section>

          <aside className="cart-a__side" aria-label="Сводка заказа">
            <div className="cart-a__card">
              <h2>Заказ</h2>
              <PromoField
                promo={promo}
                pending={promoPending}
                onType={actions.typePromo}
                onApply={() => void actions.applyCoupon(promo.input)}
                onClear={actions.clearCoupon}
              />
              <SummaryRows totals={totals} percent={promo.percent} />
              {canCheckout ? (
                <a className="cart-a__checkout" href="/checkout">
                  Оформить заказ
                </a>
              ) : (
                <button
                  className="cart-a__checkout"
                  type="button"
                  disabled
                  aria-disabled="true"
                  aria-busy={loading}
                  title={checkoutDisabledLabel}
                >
                  {loading && <Loader2 className="cart-a__checkout-spinner" aria-hidden="true" />}
                  {checkoutDisabledLabel}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {related.length > 0 && (
        <section className="cart-a__also" aria-label="С этим товаром покупают">
          <header>
            <h2>С этим товаром покупают</h2>
            <a href="/catalog">Весь каталог ↗</a>
          </header>
          <div className="cart-a__also-grid">
            {related.map((product) => (
              <div className="cart-a__also-cell" key={product.id}>
                <CatalogCard
                  product={product}
                  wishlisted={wishlistedIds.has(product.id)}
                  onWishlistToggle={actions.toggleWishlist}
                />
                <button
                  type="button"
                  disabled={!product.primarySkuId || product.soldOut}
                  aria-label={`Добавить ${product.name} в корзину`}
                  onClick={() =>
                    product.primarySkuId && void actions.addRelated(product.primarySkuId).catch(() => undefined)
                  }
                >
                  Добавить в корзину
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <UndoBar
        label={removedName}
        onUndo={() => void actions.undo().catch(() => undefined)}
        onDismiss={actions.dismissUndo}
      />

      {items.length > 0 && (
        <div className="cart-a__mobile-bar">
          <span>
            <b>{totals.total.toLocaleString('ru-RU')} ₽</b>
            {totals.itemCount} товаров
          </span>
          {canCheckout ? (
            <a href="/checkout">Оформить заказ</a>
          ) : (
            <a
              role="button"
              aria-disabled="true"
              tabIndex={-1}
              title={checkoutDisabledLabel}
              aria-label={checkoutDisabledLabel}
              onClick={(event) => event.preventDefault()}
            >
              Недоступно
            </a>
          )}
        </div>
      )}

      {savedMessage && (
        <section className="cart-a__saved" aria-label="Отложенные товары">
          <p role="status">{savedMessage}</p>
        </section>
      )}
    </main>
  );
}

'use client';
import { useCart } from '@/hooks/use-cart';
import { CartLineItem } from '@/components/shared/cart/cart-line-item';
import { OrderSummary } from '@/components/shared/cart/order-summary';
import { EmptyCart } from '@/components/shared/cart/empty-cart';
import { Skeleton } from '@/components/ui';
import { Breadcrumbs } from '@/components/shared/product/breadcrumbs';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD } from '@/constants/config';
import type { ProductCardData } from '@/lib/product-summary';
import { CartRelatedGrid } from '@/components/shared/cart/cart-related-grid';

export function CartView({ related, wishlistedIds }: { related: ProductCardData[]; wishlistedIds: Set<string> }) {
  const { items, totalAmount, loading } = useCart();
  const count = items.reduce((a, i) => a + i.quantity, 0);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
      <Breadcrumbs
        items={[{ label: 'Главная', href: '/' }, { label: 'Каталог', href: '/catalog' }, { label: 'Корзина' }]}
      />

      {/* Cart head */}
      <div className="flex items-end justify-between gap-4 mt-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-[30px] sm:text-[46px] leading-none tracking-tight">Корзина</h1>
          {items.length > 0 && (
            <p className="text-ink-muted text-sm mt-2">
              <b className="text-ink">{items.length}</b> товара на сумму{' '}
              <b className="text-ink">{formatPrice(totalAmount)}</b>
            </p>
          )}
        </div>
        <a
          href="/catalog"
          className="text-ink-muted text-[13.5px] font-semibold inline-flex items-center gap-1.5 hover:text-ink transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Продолжить покупки
        </a>
      </div>

      {/* Free shipping progress bar */}
      {items.length > 0 && (
        <div className="mt-5 border border-line rounded-[18px] bg-surface p-3.5 grid gap-2.5">
          <div className="flex items-center gap-2 text-[13.5px]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="text-accent shrink-0"
            >
              <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
              <circle cx="7" cy="18" r="1.6" />
              <circle cx="17.5" cy="18" r="1.6" />
            </svg>
            {totalAmount >= FREE_SHIPPING_THRESHOLD ? (
              <span>
                Доставка <b>бесплатна</b> — порог достигнут
              </span>
            ) : (
              <span>
                Добавьте товаров на <b>{formatPrice(FREE_SHIPPING_THRESHOLD - totalAmount)}</b> до бесплатной доставки
              </span>
            )}
          </div>
          <div className="h-[7px] rounded-full bg-surface-soft overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent transition-all duration-400"
              style={{ width: `${Math.min(100, (totalAmount / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main grid: items + summary */}
      {loading && items.length === 0 ? (
        <div className="mt-6 grid gap-3.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[24px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyCart />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 mt-6 items-start">
          {/* Line items */}
          <div className="grid gap-3.5">
            {items.map((it) => (
              <CartLineItem key={it.id} item={it} wishlisted={wishlistedIds.has(it.productId)} />
            ))}
          </div>
          {/* Summary */}
          <div className="self-stretch">
            <OrderSummary totalAmount={totalAmount} count={count} />
          </div>
        </div>
      )}

      {/* Related — "Добавить к заказу" */}
      <CartRelatedGrid items={related} />
    </div>
  );
}

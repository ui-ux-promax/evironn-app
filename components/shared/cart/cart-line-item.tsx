'use client';
import { useState } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store';
import { WishlistHeart } from '@/components/shared/wishlist/wishlist-heart';
import type { CartStateItem } from '@/services/dto/cart.dto';

export function CartLineItem({ item, wishlisted = false }: { item: CartStateItem; wishlisted?: boolean }) {
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const removeCartItem = useCartStore((s) => s.removeCartItem);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);

  const updateQuantity = async (quantity: number) => {
    if (isUpdatingQuantity) return;
    setIsUpdatingQuantity(true);
    try {
      await updateItemQuantity(item.id, quantity);
    } finally {
      setIsUpdatingQuantity(false);
    }
  };
  const maximumQuantity = Math.min(item.stock, 99);
  const dec = () => item.quantity > 1 && void updateQuantity(item.quantity - 1);
  const inc = () => item.quantity < maximumQuantity && void updateQuantity(item.quantity + 1);

  return (
    <article
      className={cn(
        'relative grid grid-cols-[80px_minmax(0,1fr)] gap-3 rounded-[20px] border border-line bg-surface p-3 transition-opacity duration-250 hover:border-ink/16 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:gap-4 sm:rounded-[24px] sm:p-3.5',
        (item.disabled || !item.available) && 'opacity-60',
      )}
    >
      {/* Media */}
      <div className="h-[96px] w-20 overflow-hidden rounded-[12px] border border-line bg-surface-soft sm:h-[116px] sm:w-[104px] sm:rounded-[14px]">
        {item.imageUrl && (
          <Image src={item.imageUrl} alt={item.name} width={104} height={116} className="h-full w-full object-cover" />
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex flex-col gap-2">
        {/* Title + brand */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-[68px] sm:pr-0">
            <div className="font-display text-[16px] font-bold leading-tight tracking-tight sm:text-[18px]">
              {item.name}
            </div>
            <div className="text-ink-muted text-xs mt-0.5">
              {item.colorwayName} · Размер: {item.size}
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-soft/70 border border-line text-xs">
            {item.colorwayName}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-soft/70 border border-line text-xs">
            Размер: {item.size}
          </span>
        </div>

        {/* Stepper + price */}
        <div className="mt-auto flex flex-col items-start justify-between gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3">
          {/* Stepper */}
          <div className="inline-flex items-center border border-line rounded-full bg-surface h-10">
            <button
              type="button"
              onClick={dec}
              disabled={item.quantity <= 1 || item.disabled || isUpdatingQuantity}
              aria-label="Меньше"
              className="w-[38px] h-full grid place-items-center rounded-full hover:bg-surface-soft disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14" />
              </svg>
            </button>
            {isUpdatingQuantity ? (
              <span aria-label="Обновляем количество" className="min-w-[30px] grid place-items-center">
                <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            ) : (
              <span className="min-w-[30px] text-center font-bold tnum text-sm">{item.quantity}</span>
            )}
            <button
              type="button"
              onClick={inc}
              disabled={item.quantity >= maximumQuantity || item.disabled || isUpdatingQuantity}
              aria-label="Больше"
              className="w-[38px] h-full grid place-items-center rounded-full hover:bg-surface-soft disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {/* Price */}
          <div className="text-left min-[420px]:text-right">
            <div className="font-display font-bold text-[17px] text-accent tnum tracking-tight">
              {formatPrice(item.lineTotal)}
            </div>
            <div className="text-ink-muted text-[11.5px] tnum mt-0.5">{formatPrice(item.unitPrice)} / шт</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute right-3 top-3 flex items-center gap-0 sm:static sm:gap-1">
        <WishlistHeart productId={item.productId} initialActive={wishlisted} variant="card" />
        <button
          type="button"
          aria-label="Удалить"
          onClick={() => removeCartItem(item.id)}
          className="w-[34px] h-[34px] grid place-items-center rounded-full border border-transparent text-ink-muted hover:text-danger hover:border-danger/40 transition-colors"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
          </svg>
        </button>
      </div>
    </article>
  );
}

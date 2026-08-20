'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Badge } from '@/components/ui';
import { PriceTag } from '@/components/shared/price-tag';
import { SizeGuideDialog } from '@/components/shared/product/size-guide-dialog';
import { useCartStore } from '@/store';
import { WishlistHeart } from '@/components/shared/wishlist/wishlist-heart';
import type { ProductCardData } from '@/lib/product-summary';

const BEIGE_BLUR =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='8'%20height='8'%3E%3Crect%20width='8'%20height='8'%20fill='%23f1ece1'/%3E%3C/svg%3E";

// Color name → HSL for swatch background
const COLOR_MAP: Record<string, string> = {
  Черный: 'hsl(220 9% 7%)',
  Молочный: 'hsl(42 18% 88%)',
  Шалфей: 'hsl(151 28% 30%)',
  Хаки: 'hsl(55 15% 56%)',
  Розовый: 'hsl(345 42% 82%)',
  'Светло-серый': 'hsl(0 0% 72%)',
  Серый: 'hsl(220 6% 62%)',
};

function colorToHsl(name: string): string {
  return COLOR_MAP[name] ?? 'hsl(0 0% 50%)';
}

export function CatalogProductCard({ data, wishlisted = false }: { data: ProductCardData; wishlisted?: boolean }) {
  const href = `/product/${data.slug}`;
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const addCartItem = useCartStore((s) => s.addCartItem);
  const selectedColorway = data.colorways[selectedColor];
  const selectedImageUrl = selectedColorway?.imageUrl ?? data.imageUrl;
  const selectedSizeOption = selectedSize === null ? null : data.sizes[selectedSize];
  const selectedVariant = selectedSizeOption
    ? selectedColorway?.variants.find((v) => v.size === selectedSizeOption.size)
    : null;

  const handleAddToCart = async () => {
    if (!selectedVariant?.inStock || isAdding) return;
    setIsAdding(true);
    try {
      await addCartItem({ productVariantId: selectedVariant.variantId });
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    } catch {
      /* store sets error */
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article className="[container-type:inline-size] flex flex-col border border-line bg-surface rounded-[24px] p-[18px] shadow-[0_18px_44px_hsl(220_12%_10%_/_0.04)] transition-transform duration-200 hover:-translate-y-[3px] hover:border-ink/22 hover:shadow-[0_18px_40px_hsl(220_12%_10%_/_0.07)]">
      {/* Media */}
      <div className="relative aspect-[1.08/1] overflow-hidden rounded-[18px] border border-line bg-surface-soft">
        {data.badges[0] && (
          <span className="absolute left-3 top-3 z-10">
            <Badge tone={data.badges[0].tone}>{data.badges[0].label}</Badge>
          </span>
        )}
        <Link href={href} aria-label={data.name} className="absolute inset-0">
          {selectedImageUrl ? (
            <Image
              src={selectedImageUrl}
              alt={data.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              placeholder="blur"
              blurDataURL={BEIGE_BLUR}
              className={`object-cover transition-transform duration-500 group-hover:scale-[1.045] ${data.soldOut ? 'opacity-50 grayscale' : ''}`}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-ink-muted text-xs">нет фото</div>
          )}
        </Link>
      </div>

      {/* Head: title + price */}
      <div className="grid gap-1.5 pt-3.5">
        <h3 className="min-w-0 break-words font-display font-bold text-[clamp(21px,8cqw,26px)] leading-[0.96] tracking-tight">
          <Link href={href} className="hover:underline underline-offset-2">
            {data.name}
          </Link>
        </h3>
        <PriceTag
          price={data.minPrice}
          compareAtPrice={data.minCompareAtPrice}
          className="justify-self-end whitespace-nowrap text-[15px] text-accent"
        />
      </div>

      {/* Color selection */}
      {data.colorways.length > 0 && (
        <div className="mt-auto pt-3.5 grid gap-2.5">
          <div className="flex items-center justify-between">
            <strong className="text-xs font-bold uppercase tracking-tight">Цвет</strong>
          </div>
          <div className="grid grid-cols-4 gap-3 items-end">
            {data.colorways.map((cw, i) => (
              <button
                key={cw.id}
                type="button"
                aria-label={cw.name}
                aria-pressed={selectedColor === i}
                onClick={() => setSelectedColor(i)}
                className={`relative h-6 border rounded-[5px] transition-colors ${selectedColor === i ? 'border-ink' : 'border-line hover:border-ink/30'}`}
                style={{ background: cw.swatchHex ?? 'hsl(0 0% 50%)' }}
              >
                {selectedColor === i && (
                  <span className="absolute left-0 right-0 -bottom-[7px] h-[3px] rounded-full bg-ink" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size selection */}
      {data.sizes.length > 0 && (
        <div className="pt-3.5 grid gap-2.5">
          <div className="flex items-center justify-between">
            <strong className="text-xs font-bold uppercase tracking-tight">Размер</strong>
            <SizeGuideDialog />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {data.sizes.map((s, i) =>
              (() => {
                const variant = selectedColorway?.variants.find((v) => v.size === s.size);
                const disabled = !variant?.inStock;
                return (
                  <button
                    key={s.size}
                    type="button"
                    aria-pressed={selectedSize === i}
                    onClick={() => setSelectedSize(i)}
                    disabled={disabled}
                    className={`h-11 rounded-[13px] text-sm font-semibold transition-colors ${
                      selectedSize === i
                        ? 'bg-primary text-primary-foreground border border-primary'
                        : 'bg-surface-soft/60 border border-transparent hover:border-ink/18'
                    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {s.size}
                  </button>
                );
              })(),
            )}
          </div>
        </div>
      )}

      {/* Actions: add to cart + heart */}
      <div className="grid grid-cols-[1fr_46px] gap-2.5 pt-3.5">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant?.inStock || isAdding}
          aria-busy={isAdding}
          className={`min-h-[46px] rounded-full inline-flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            added
              ? 'bg-accent text-accent-foreground'
              : !selectedVariant?.inStock || isAdding
                ? 'bg-ink/20 text-surface cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-footer'
          }`}
        >
          {isAdding ? (
            <>
              <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Добавляем
            </>
          ) : added ? (
            'Добавлено ✓'
          ) : (
            'Добавить в корзину'
          )}
        </button>
        <WishlistHeart productId={data.id} initialActive={wishlisted} variant="catalog" />
      </div>
    </article>
  );
}

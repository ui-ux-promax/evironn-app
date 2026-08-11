'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCartStore } from '@/store';
import { useCountdown } from '@/hooks/use-countdown';
import { RatingStars } from './rating-stars';
import { ProductAccordions } from './product-accordions';
import { SizeGuideDialog } from './size-guide-dialog';
import { cn } from '@/lib/utils';

export interface PanelColorway {
  slug: string;
  name: string;
  swatchHex: string | null;
  thumbUrl: string | null;
}
export interface PanelVariant {
  id: string;
  size: string;
  stock: number;
  active: boolean;
  price: number;
  compareAtPrice: number | null;
}

interface Props {
  productName: string;
  colorways: PanelColorway[];
  activeColorwaySlug: string;
  activeColorwayName: string;
  variants: PanelVariant[];
  fitNote: string | null;
  productSlug: string;
  description: string | null;
  specs: Record<string, string> | null;
  ratingAvg: number | null;
  ratingCount: number;
  onSelectedVariantChange?: (variantId: string | null) => void;
  onColorChange: (slug: string) => void;
}

const COLOR_HSL: Record<string, string> = {
  Черный: 'hsl(220 9% 7%)',
  Молочный: 'hsl(42 18% 88%)',
  Шалфей: 'hsl(151 18% 56%)',
  Хаки: 'hsl(55 15% 56%)',
  Розовый: 'hsl(345 42% 82%)',
  'Светло-серый': 'hsl(0 0% 72%)',
  Серый: 'hsl(220 6% 62%)',
};

export function PurchasePanel({
  productName,
  colorways,
  activeColorwaySlug,
  activeColorwayName,
  variants,
  fitNote,
  productSlug,
  description,
  specs,
  ratingAvg,
  ratingCount,
  onSelectedVariantChange,
  onColorChange,
}: Props) {
  const [sizeId, setSizeId] = useState<string | null>(null);
  const addCartItem = useCartStore((s) => s.addCartItem);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { seconds: cooldown, start: startCooldown } = useCountdown();

  const selected = variants.find((v) => v.id === sizeId) ?? null;
  const available = variants.filter((v) => v.active && v.stock > 0);
  const minPrice = available.length ? Math.min(...available.map((v) => v.price)) : (variants[0]?.price ?? 0);
  const shownPrice = selected?.price ?? minPrice;
  const shownCompare = selected?.compareAtPrice ?? null;
  const soldOut = available.length === 0;

  const onAdd = async () => {
    if (!selected || cooldown > 0) return;
    setAdding(true);
    try {
      await addCartItem({ productVariantId: selected.id });
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 429) {
        startCooldown(Number(e.response.data?.retryAfterSec) || 0);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div id="buy" className="border border-line rounded-[24px] bg-surface p-[22px] grid gap-2">
      {/* Title */}
      <h1 className="font-display font-bold text-[28px] sm:text-[38px] leading-none tracking-[-0.04em]">
        {productName}
      </h1>

      {/* Rating */}
      {ratingAvg !== null && ratingCount > 0 && (
        <div className="flex items-center gap-3 mt-1">
          <RatingStars value={ratingAvg} size={17} />
          <span className="font-bold tnum">{ratingAvg.toFixed(1)}</span>
          <span className="text-ink-muted text-[13px]">{ratingCount} отзывов</span>
        </div>
      )}

      {/* Color */}
      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wider mb-2.5">
          Цвет <span className="text-ink-muted font-normal normal-case ml-2">{activeColorwayName}</span>
        </p>
        <div className="flex flex-wrap gap-3.5" role="radiogroup" aria-label="Выбор цвета">
          {colorways.map((cw) => {
            const isActive = cw.slug === activeColorwaySlug;
            return (
              <button
                key={cw.slug}
                type="button"
                onClick={() => onColorChange(cw.slug)}
                aria-label={cw.name}
                aria-pressed={isActive}
                className={cn(
                  'w-10 h-10 rounded-full border border-line transition-transform hover:scale-110 shrink-0',
                  isActive && 'outline outline-2 outline-ink outline-offset-3',
                )}
                style={{
                  backgroundColor: cw.swatchHex ?? 'hsl(0 0% 50%)',
                  boxShadow: 'inset 0 0 0 4px hsl(var(--color-surface))',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Size */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-bold uppercase tracking-wider">
            Размер {selected && <span className="text-ink-muted font-normal normal-case ml-2">{selected.size}</span>}
          </p>
          <SizeGuideDialog className="text-[13px]" />
        </div>
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Выбор размера">
          {variants.map((v) => {
            const disabled = !v.active || v.stock <= 0;
            return (
              <button
                key={v.id}
                type="button"
                className={cn(
                  'min-w-[52px] h-12 px-3.5 rounded-[14px] border text-[15px] font-bold transition-colors tnum',
                  v.id === sizeId
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-line bg-surface-soft/55 hover:border-ink/25',
                  disabled && 'line-through opacity-50 cursor-not-allowed',
                )}
                disabled={disabled}
                aria-pressed={v.id === sizeId}
                onClick={() => {
                  setSizeId(v.id);
                  onSelectedVariantChange?.(v.id);
                }}
              >
                {v.size}
              </button>
            );
          })}
        </div>
        {fitNote && <p className="text-xs text-ink-muted mt-2">{fitNote}</p>}
      </div>

      {/* Add to cart */}
      <div className="mt-4">
        <button
          type="button"
          onClick={onAdd}
          disabled={!selected || soldOut || cooldown > 0 || adding}
          aria-busy={adding}
          className={cn(
            'w-full min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 font-bold text-sm transition-colors',
            adding
              ? 'bg-ink/20 text-surface cursor-not-allowed'
              : added
                ? 'bg-accent text-accent-foreground'
                : 'bg-primary text-primary-foreground hover:bg-footer',
            (!selected || soldOut) && 'opacity-50 cursor-not-allowed',
          )}
        >
          {adding ? (
            <>
              <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Добавляем
            </>
          ) : added ? (
            'Добавлено ✓'
          ) : cooldown > 0 ? (
            `Подождите ${cooldown} сек`
          ) : (
            'Добавить в корзину'
          )}
        </button>
      </div>

      {/* Accordions */}
      <ProductAccordions description={description} specs={specs} />
    </div>
  );
}

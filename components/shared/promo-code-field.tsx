'use client';

import React, { useState } from 'react';
import { validateCoupon } from '@/app/actions/coupon';
import { useCouponStore } from '@/store/coupon';

export function PromoCodeField() {
  const coupon = useCouponStore((state) => state.coupon);
  const setCoupon = useCouponStore((state) => state.setCoupon);
  const clearCoupon = useCouponStore((state) => state.clearCoupon);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyCoupon = async () => {
    setError(null);
    setPending(true);
    try {
      const result = await validateCoupon(input.trim());
      if (!result.ok) {
        clearCoupon();
        setError(result.error);
        return;
      }
      setCoupon({ code: result.code, percent: result.percent, discount: result.discount, totals: result.totals });
    } finally {
      setPending(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[13px] border border-accent/30 bg-accent/5 px-3.5 py-3 text-sm">
        <span className="font-semibold text-accent">
          Промокод {coupon.code} ({coupon.percent}%)
        </span>
        <button
          type="button"
          onClick={clearCoupon}
          className="text-ink-muted hover:text-ink"
          aria-label="Убрать промокод"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={pending}
          placeholder="Промокод"
          aria-label="Промокод"
          className="flex-1 min-w-0 h-[46px] px-3.5 border border-line rounded-[13px] bg-surface text-sm outline-none uppercase placeholder:normal-case placeholder:text-ink-muted/80 hover:border-ink/24 transition-colors disabled:cursor-wait disabled:opacity-60"
        />
        <button
          type="button"
          onClick={applyCoupon}
          disabled={pending || !input.trim()}
          aria-label={pending ? 'Проверка промокода' : 'Применить'}
          className="h-[46px] min-w-[46px] px-5 border border-line rounded-[13px] bg-surface-soft font-bold text-[13.5px] whitespace-nowrap hover:border-ink/30 transition-colors disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? (
            <span
              role="status"
              aria-label="Проверка промокода"
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-muted/30 border-t-ink"
            />
          ) : (
            'Применить'
          )}
        </button>
      </div>
      {error && (
        <p className="text-danger text-xs font-semibold" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

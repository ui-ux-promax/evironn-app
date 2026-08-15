'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store';
import { cn } from '@/lib/utils';

export function CartBadge({ initialCount = 0 }: { initialCount?: number }) {
  const pathname = usePathname();
  const totals = useCartStore((s) => s.totals);
  const loading = useCartStore((s) => s.loading);
  const error = useCartStore((s) => s.error);
  const fetchCartItems = useCartStore((s) => s.fetchCartItems);
  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);
  const count = loading || error ? initialCount : totals.itemCount;
  const active = pathname === '/cart';

  return (
    <Link
      href="/cart"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative h-[34px] w-[34px] grid place-items-center rounded-full border bg-surface shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out',
        active
          ? 'header-active-in border-primary bg-primary text-primary-foreground shadow-[0_5px_14px_hsl(var(--color-text)/.13)]'
          : 'border-line/72 hover:border-ink/35',
      )}
      aria-label={count ? `Корзина, ${count} товара` : 'Корзина пуста'}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3.8 5.2h2.35l1.55 9.45a2 2 0 0 0 1.98 1.68h7.7a2 2 0 0 0 1.93-1.47l1.2-4.45H7.15" />
        <circle cx="9.45" cy="19.25" r="1.05" />
        <circle cx="17.25" cy="19.25" r="1.05" />
      </svg>
      {count > 0 && (
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold tnum',
            active ? 'bg-surface text-primary' : 'bg-primary text-primary-foreground',
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

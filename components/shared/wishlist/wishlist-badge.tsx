'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWishlistStore } from '@/store';
import { cn } from '@/lib/utils';

export function WishlistBadge() {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const count = useWishlistStore((s) => s.count);
  const fetchCount = useWishlistStore((s) => s.fetchCount);

  useEffect(() => {
    fetchCount();
  }, [pathname, fetchCount]);
  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [pathname]);

  const active = pathname === '/profile' && hash === '#favorites';
  return (
    <Link
      href="/profile#favorites"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative h-[34px] w-[34px] grid place-items-center rounded-full border bg-surface shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out',
        active
          ? 'header-active-in border-primary bg-primary text-primary-foreground shadow-[0_5px_14px_hsl(var(--color-text)/.13)]'
          : 'border-line/72 hover:border-ink/35',
      )}
      aria-label={count ? `Избранное, ${count}` : 'Избранное пусто'}
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
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
      {count > 0 && (
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground tnum',
            active && 'bg-white text-ink',
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

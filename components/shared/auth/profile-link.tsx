'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ProfileLink() {
  const active = usePathname() === '/profile';
  return (
    <Link
      href="/profile"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'grid h-[34px] w-[34px] place-items-center rounded-full border bg-surface shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out',
        active
          ? 'header-active-in border-primary bg-primary text-primary-foreground shadow-[0_5px_14px_hsl(var(--color-text)/.13)]'
          : 'border-line/72 hover:border-ink/35',
      )}
      aria-label="Профиль"
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
        <circle cx="12" cy="12" r="8.25" />
        <circle cx="12" cy="10.35" r="2.35" />
        <path d="M7.95 16.35a5 5 0 0 1 8.1 0" />
      </svg>
    </Link>
  );
}

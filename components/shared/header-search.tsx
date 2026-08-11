'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/catalog?q=${encodeURIComponent(q.trim())}` : '/catalog');
      }}
      className="hidden lg:flex items-center h-[42px] rounded-full border border-line bg-surface px-4 gap-3 min-w-0 flex-1 max-w-[470px]"
      role="search"
    >
      <label className="sr-only" htmlFor="hsearch">
        Поиск товаров
      </label>
      <input
        id="hsearch"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск..."
        className="min-w-0 flex-1 border-0 outline-none bg-transparent text-[13px] text-ink placeholder:text-ink-muted/80"
      />
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m16.5 16.5 4 4" />
      </svg>
    </form>
  );
}

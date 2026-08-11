'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleWishlist } from '@/app/actions/wishlist';
import { useWishlistStore } from '@/store';
import { cn } from '@/lib/utils';

type Props = {
  productId: string;
  initialActive: boolean;
  variant?: 'card' | 'pdp' | 'catalog';
  landingMotion?: boolean;
};

export function WishlistHeart({ productId, initialActive, variant = 'card', landingMotion = false }: Props) {
  const router = useRouter();
  const increment = useWishlistStore((s) => s.increment);
  const decrement = useWishlistStore((s) => s.decrement);
  const fetchCount = useWishlistStore((s) => s.fetchCount);
  const [active, setActive] = useState(initialActive);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (pending) return;
    const next = !active;
    setActive(next); // оптимистично
    if (next) increment();
    else decrement(); // бейдж обновляем мгновенно
    setError(null);
    startTransition(async () => {
      try {
        const res = await toggleWishlist({ productId });
        if (!res.ok) {
          setActive(!next); // откат
          if (next) decrement();
          else increment(); // откат бейджа
          setError('Не удалось обновить избранное');
          return;
        }
        setActive(res.active);
        fetchCount(); // сверяем с авторитетным счётчиком сервера
        router.refresh(); // обновить список на /profile#favorites
      } catch {
        setActive(!next); // откат при сбое экшена (сеть/сервер)
        if (next) decrement();
        else increment(); // откат бейджа
        setError('Не удалось обновить избранное');
      }
    });
  };

  const label = active ? 'Убрать из избранного' : 'В избранное';

  if (variant === 'catalog') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        className={cn(
          'w-[46px] h-[46px] grid place-items-center rounded-full border transition-colors',
          active ? 'border-danger text-danger' : 'border-line text-ink hover:border-danger/50 hover:text-danger',
        )}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.9"
          aria-hidden="true"
        >
          <path d="M12 20.5s-7.25-4.45-7.25-10.2A4.35 4.35 0 0 1 12 7.25a4.35 4.35 0 0 1 7.25 3.05C19.25 16.05 12 20.5 12 20.5Z" />
        </svg>
        <span className="sr-only" role="status" aria-live="polite">
          {error ?? ''}
        </span>
      </button>
    );
  }

  if (variant === 'pdp') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        className={cn(
          'w-[42px] h-[42px] rounded-full bg-surface/90 backdrop-blur grid place-items-center border transition-colors',
          active ? 'border-danger text-danger' : 'border-line hover:border-danger/50 hover:text-danger',
        )}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
          className={active ? 'text-[#e23b4e]' : ''}
        >
          <path d="M12 20.5s-7.25-4.45-7.25-10.2A4.35 4.35 0 0 1 12 7.25a4.35 4.35 0 0 1 7.25 3.05C19.25 16.05 12 20.5 12 20.5Z" />
        </svg>
        <span className="sr-only" role="status" aria-live="polite">
          {error ?? ''}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        'w-[34px] h-[34px] rounded-full border border-line bg-surface text-ink grid place-items-center hover:border-ink transition-[transform,border-color,color] duration-200',
        landingMotion && 'active:scale-90 motion-reduce:transform-none',
      )}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.9"
        aria-hidden="true"
        className={cn(active && 'text-[#e23b4e]', landingMotion && active && 'landing-heart-pop')}
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
      <span className="sr-only" role="status" aria-live="polite">
        {error ?? ''}
      </span>
    </button>
  );
}

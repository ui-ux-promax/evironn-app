import { Skeleton } from './skeleton';

/**
 * Ряд чипов-счётчиков по статусам (заказы): `flex flex-wrap gap-3`, каждый чип —
 * `bg-admin-surface border rounded-full px-4 py-2` с бейджем-пилюлей + числом.
 * Совпадает с блоком чипов в `orders/page.tsx` (5 статусов заказа).
 */
export interface StatusChipsSkeletonProps {
  /** Число чипов. По умолчанию 5 (статусы заказа). */
  count?: number;
}

export function StatusChipsSkeleton({ count = 5 }: StatusChipsSkeletonProps) {
  return (
    <div aria-hidden className="flex flex-wrap gap-1.5">
      {Array.from({ length: Math.max(1, count) }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[34px] items-center gap-2 rounded-full border border-admin-outline-variant bg-admin-surface px-3 py-1.5"
        >
          <Skeleton rounded="pill" delay={((i % 5) + 1) as 1 | 2 | 3 | 4 | 5} className="h-5 w-20" />
          <Skeleton rounded="line" delay={((i % 5) + 1) as 1 | 2 | 3 | 4 | 5} className="h-3 w-6" />
        </div>
      ))}
    </div>
  );
}

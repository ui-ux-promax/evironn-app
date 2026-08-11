import { Armchair } from 'lucide-react';
import { Skeleton } from '@/components/ui';

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-2xl bg-surface border border-line overflow-hidden">
          <Skeleton className="aspect-square rounded-none" />
          <div className="p-3.5 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyCatalog() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-10 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-soft grid place-items-center mx-auto text-ink-muted">
        <Armchair className="w-6 h-6" aria-hidden="true" />
      </div>
      <p className="font-semibold mt-3">Ничего не найдено</p>
      <p className="text-sm text-ink-muted mt-1 max-w-xs mx-auto">
        По выбранным параметрам нет подходящей мебели. Сбросьте часть фильтров или попробуйте другой вариант.
      </p>
    </div>
  );
}

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCatalogUrl } from '@/hooks/use-catalog-url';

export type PaginationItem = number | 'gap';

export function getPaginationItems(totalPages: number, page: number): PaginationItem[] {
  if (totalPages <= 1) return [];
  const visible = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...visible].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);
  const items: PaginationItem[] = [];
  pages.forEach((item, index) => {
    if (index > 0 && item - pages[index - 1] > 1) items.push('gap');
    items.push(item);
  });
  return items;
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { setPage } = useCatalogUrl();
  if (totalPages <= 1) return null;
  const cell = 'w-9 h-9 grid place-items-center rounded-lg border border-line bg-surface hover:border-ink tnum';

  return (
    <nav className="flex justify-center mt-10" aria-label="Пагинация">
      <div className="flex items-center gap-1.5 text-sm">
        <button className={cell} disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Назад">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPaginationItems(totalPages, page).map((item, index) =>
          item === 'gap' ? (
            <span
              key={`gap-${index}`}
              aria-label="Пропуск страниц"
              aria-disabled="true"
              className="w-9 h-9 grid place-items-center text-ink-muted"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => setPage(item)}
              aria-current={item === page ? 'page' : undefined}
              className={
                item === page ? 'w-9 h-9 grid place-items-center rounded-lg bg-ink text-white font-semibold tnum' : cell
              }
            >
              {item}
            </button>
          ),
        )}
        <button className={cell} disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="Вперёд">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}

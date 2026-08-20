'use client';

import { X } from 'lucide-react';
import { useCatalogUrl } from '@/hooks/use-catalog-url';
import { isInStockParam } from '@/lib/catalog-filters';
import type { CatalogResult } from '@/lib/find-products';

export function ResetButton({ className }: { className?: string }) {
  const { reset } = useCatalogUrl();
  return (
    <button type="button" onClick={reset} className={className}>
      Сбросить
    </button>
  );
}

export function ActiveFilterChips({ facets }: { facets: CatalogResult['facets'] }) {
  const { getList, toggleInList, get, setParam, reset } = useCatalogUrl();
  const chips: { key: string; value: string; label: string }[] = [];
  const labelFor = (key: string, value: string) => {
    if (key === 'category') return facets.categories.find((facet) => facet.value === value)?.label ?? value;
    if (key === 'room') return facets.rooms.find((facet) => facet.value === value)?.label ?? value;
    if (key === 'option') {
      const [groupSlug, valueSlug] = value.split(':');
      return (
        facets.options.find((group) => group.slug === groupSlug)?.values.find((option) => option.value === valueSlug)
          ?.label ?? value
      );
    }
    return value;
  };

  ['category', 'room', 'option'].forEach((key) =>
    getList(key).forEach((value) => chips.push({ key, value, label: labelFor(key, value) })),
  );
  if (isInStockParam(get('inStock'))) chips.push({ key: 'inStock', value: '1', label: 'Только в наличии' });
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {chips.map((chip) => (
        <span
          key={`${chip.key}:${chip.value}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-surface-soft border border-line"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Убрать фильтр ${chip.label}`}
            className="text-ink-muted hover:text-danger"
            onClick={() => (chip.key === 'inStock' ? setParam('inStock', null) : toggleInList(chip.key, chip.value))}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={reset}
        className="text-sm font-semibold text-ink-muted underline underline-offset-2 hover:text-ink ml-1"
      >
        Сбросить всё
      </button>
    </div>
  );
}

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/admin/icon';
import { Input } from '@/components/admin/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';

export interface ProductFilterOptions {
  categories: { id: string; name: string }[];
  rooms: { id: string; name: string }[];
}

const SORTS = [
  { value: 'sortOrder', label: 'По порядку' },
  { value: 'name', label: 'По названию' },
  { value: 'minPrice', label: 'По цене' },
  { value: 'stock', label: 'По остатку' },
];
const STATUSES = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Черновики' },
  { value: 'incomplete', label: 'Без SKU' },
];
const ALL = '__all__';

const TRIGGER =
  'h-12 rounded-[14px] border-admin-outline-variant bg-admin-surface px-4 text-[14px] font-medium [&>span]:line-clamp-none [&>span]:overflow-visible [&>svg]:hidden';

export function ProductFilters({ options }: { options: ProductFilterOptions }) {
  const router = useRouter();
  const params = useSearchParams();
  const [advancedOpen, setAdvancedOpen] = React.useState(true);

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    router.push(`/admin/catalog/products?${next.toString()}`);
  }

  return (
    <section
      aria-label="Поиск и фильтры"
      className="rounded-[20px] border border-admin-outline-variant bg-admin-surface p-4 shadow-[var(--admin-shadow-tight)] sm:p-5"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,1fr)_190px_180px_180px_auto]">
        <div className="relative min-w-0">
          <label htmlFor="catalog-search" className="sr-only">
            Поиск товаров
          </label>
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-admin-on-surface-variant"
          />
          <Input
            id="catalog-search"
            type="search"
            className="h-12 rounded-[14px] border-admin-outline-variant bg-admin-bg pl-11 pr-4"
            placeholder="Название, артикул или SKU"
            defaultValue={params.get('q') ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value.trim() || undefined);
            }}
          />
        </div>

        <FilterSelect
          label="Категория"
          value={params.get('categoryId') ?? ALL}
          placeholder="Все категории"
          icon="expand_more"
          onValueChange={(value) => setParam('categoryId', value)}
        >
          <SelectItem value={ALL}>Все категории</SelectItem>
          {options.categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Комната"
          value={params.get('roomId') ?? ALL}
          placeholder="Все комнаты"
          icon="expand_more"
          onValueChange={(value) => setParam('roomId', value)}
        >
          <SelectItem value={ALL}>Все комнаты</SelectItem>
          {options.rooms.map((room) => (
            <SelectItem key={room.id} value={room.id}>
              {room.name}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Сортировка"
          value={params.get('sort') ?? 'sortOrder'}
          placeholder="Сортировка"
          icon="swap_vert"
          onValueChange={(value) => setParam('sort', value)}
        >
          {SORTS.map((sort) => (
            <SelectItem key={sort.value} value={sort.value}>
              {sort.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <button
          type="button"
          aria-label="Дополнительные фильтры"
          aria-expanded={advancedOpen}
          aria-pressed={advancedOpen}
          title="Дополнительные фильтры"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="grid h-12 w-full place-items-center rounded-[14px] border border-admin-outline-variant bg-admin-surface text-admin-on-surface-variant transition-colors hover:bg-admin-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2 lg:w-12"
        >
          <Icon name="tune" className="text-[20px]" />
        </button>
      </div>

      {advancedOpen && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-admin-outline-variant pt-4">
          <span className="mr-1 shrink-0 text-xs font-medium text-admin-on-surface-variant">Состояние:</span>
          {STATUSES.map((status) => {
            const active = (params.get('status') ?? 'all') === status.value;
            return (
              <button
                key={status.value}
                type="button"
                onClick={() => setParam('status', status.value)}
                className={
                  'min-h-9 shrink-0 rounded-full border px-4 text-xs font-bold transition-colors ' +
                  (active
                    ? 'border-admin-primary bg-admin-primary text-white'
                    : 'border-admin-outline-variant bg-admin-surface text-admin-on-surface hover:bg-admin-surface-low')
                }
              >
                {status.label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  placeholder,
  icon,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  placeholder: string;
  icon: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={TRIGGER}>
        <span className="min-w-0 text-left">
          <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-admin-on-surface-variant">
            {label}
          </span>
          <SelectValue placeholder={placeholder} />
        </span>
        <Icon name={icon} className="text-[18px] text-admin-on-surface-variant" aria-hidden="true" />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

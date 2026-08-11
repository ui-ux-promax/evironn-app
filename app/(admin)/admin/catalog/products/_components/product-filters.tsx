'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/admin/ui/input';
import { Icon } from '@/components/admin/icon';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/admin/ui/select';

export interface ProductFilterOptions {
  brands: string[];
  categories: { id: string; name: string }[];
}

const GENDERS = [
  { value: 'MEN', label: 'Мужские' },
  { value: 'WOMEN', label: 'Женские' },
  { value: 'UNISEX', label: 'Унисекс' },
  { value: 'KIDS', label: 'Детские' },
];
const STATUSES = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Черновики' },
];
const ALL = '__all__';

// Триггер селекта в стиле прототипа: пилюля (rounded-full), увеличенный паддинг.
const TRIGGER = 'h-12 rounded-full px-4 text-[14px] font-bold';

export function ProductFilters({ options }: { options: ProductFilterOptions }) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    next.delete('page'); // сбрасываем пагинацию при смене фильтра
    router.push(`/admin/catalog/products?${next.toString()}`);
  }

  return (
    <div className="mb-[18px] space-y-4">
      <div className="flex flex-wrap items-center gap-3 max-[640px]:grid">
        <div className="relative min-w-[240px] flex-1">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-on-surface-variant text-[20px] pointer-events-none"
          />
          <Input
            className="h-12 rounded-full pl-10 pr-4"
            placeholder="Поиск товаров…"
            defaultValue={params.get('q') ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value.trim() || undefined);
            }}
          />
        </div>

        <Select value={params.get('category') ?? ALL} onValueChange={(v) => setParam('category', v)}>
          <SelectTrigger className={TRIGGER}>
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все категории</SelectItem>
            {options.categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={params.get('brand') ?? ALL} onValueChange={(v) => setParam('brand', v)}>
          <SelectTrigger className={TRIGGER}>
            <SelectValue placeholder="Все бренды" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все бренды</SelectItem>
            {options.brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={params.get('gender') ?? ALL} onValueChange={(v) => setParam('gender', v)}>
          <SelectTrigger className={TRIGGER}>
            <SelectValue placeholder="Любой пол" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Любой пол</SelectItem>
            {GENDERS.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-[7px] max-[640px]:flex-nowrap max-[640px]:overflow-x-auto max-[640px]:pb-1">
        {STATUSES.map((status) => {
          const active = (params.get('status') ?? 'all') === status.value;
          return (
            <button
              key={status.value}
              type="button"
              onClick={() => setParam('status', status.value)}
              className={
                'min-h-[35px] shrink-0 rounded-full border px-[13px] text-[13px] font-bold transition-colors ' +
                (active
                  ? 'border-[var(--admin-sidebar)] bg-[var(--admin-sidebar)] text-white'
                  : 'border-admin-outline-variant bg-admin-surface text-admin-on-surface hover:bg-admin-surface-low')
              }
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

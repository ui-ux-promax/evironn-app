'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/admin/ui/input';
import { Icon } from '@/components/admin/icon';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/admin/ui/select';

const ROLES = [
  { value: '__all__', label: 'Все роли' },
  { value: 'ADMIN', label: 'Администраторы' },
  { value: 'CUSTOMER', label: 'Клиенты' },
];
const SORTS = [
  { value: 'registered', label: 'По дате регистрации' },
  { value: 'orders', label: 'По числу заказов' },
  { value: 'spent', label: 'По сумме трат' },
];
const ALL = '__all__';

const TRIGGER = 'h-12 rounded-[14px] border-admin-outline-variant bg-admin-bg px-4 text-[14px] font-medium';

export function CustomerFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    next.delete('page'); // сбрасываем пагинацию при смене фильтра
    router.push(`/admin/customers?${next.toString()}`);
  }

  return (
    <section
      aria-label="Поиск и фильтры клиентов"
      className="rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto]">
        <div className="relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-on-surface-variant text-[20px] pointer-events-none"
          />
          <Input
            className="h-12 rounded-[14px] border-admin-outline-variant bg-admin-surface pl-10 pr-4"
            placeholder="Имя, телефон или email"
            defaultValue={params.get('q') ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value.trim() || undefined);
            }}
          />
        </div>

        <Select value={params.get('role') ?? ALL} onValueChange={(v) => setParam('role', v)}>
          <SelectTrigger className={TRIGGER}>
            <span className="min-w-0 text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[.08em] text-admin-on-surface-variant">
                Сегмент
              </span>
              <SelectValue placeholder="Все клиенты" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get('sort') ?? 'registered'}
          onValueChange={(v) => setParam('sort', v === 'registered' ? undefined : v)}
        >
          <SelectTrigger className={TRIGGER}>
            <span className="min-w-0 text-left">
              <span className="block text-[10px] font-bold uppercase tracking-[.08em] text-admin-on-surface-variant">
                Сортировка
              </span>
              <SelectValue placeholder="По активности" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex h-12 items-center justify-between rounded-[14px] border border-admin-outline-variant bg-admin-bg px-4 text-left text-sm text-admin-on-surface-variant opacity-60"
        >
          <span>
            <small className="block text-[10px] font-bold uppercase tracking-[.08em]">Покупки</small>Любая активность
          </span>
          <Icon name="expand_more" className="text-[18px]" />
        </button>

        <button
          type="button"
          disabled
          aria-label="Дополнительные фильтры"
          aria-disabled="true"
          title="Дополнительные фильтры"
          className="grid h-12 w-full place-items-center rounded-[14px] border border-admin-outline-variant bg-admin-bg text-admin-on-surface-variant opacity-60 lg:w-12"
        >
          <Icon name="tune" className="text-[20px]" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-admin-outline-variant pt-4">
        <span className="mr-1 shrink-0 text-xs font-medium text-admin-on-surface-variant">Быстрый фильтр:</span>
        <button
          type="button"
          onClick={() => setParam('role', undefined)}
          className={quickFilterClass(!params.get('role'))}
        >
          Все
        </button>
        {['Новые', 'Постоянные', 'VIP', 'Без заказов'].map((label) => (
          <button
            key={label}
            type="button"
            disabled
            aria-disabled="true"
            className={`${quickFilterClass(false)} opacity-60`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function quickFilterClass(active: boolean) {
  return active
    ? 'min-h-9 shrink-0 rounded-full border border-admin-primary bg-admin-primary px-4 text-xs font-bold text-white'
    : 'min-h-9 shrink-0 rounded-full border border-admin-outline-variant bg-admin-surface px-4 text-xs font-bold text-admin-on-surface';
}

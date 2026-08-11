'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/admin/ui/input';
import { Icon } from '@/components/admin/icon';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/admin/ui/select';

const STATUSES = [
  { value: '__all__', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Выключенные' },
  { value: 'expired', label: 'Истёкшие' },
];
const ALL = '__all__';
const TRIGGER = 'h-12 rounded-full px-4 text-[14px] font-bold';

export function CouponFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    router.push(`/admin/marketing?${next.toString()}`);
  }

  return (
    <div className="mb-[18px] flex flex-wrap items-center gap-3 max-[640px]:grid">
      <div className="relative min-w-[260px] flex-1">
        <Icon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-on-surface-variant text-[20px] pointer-events-none"
        />
        <Input
          className="h-12 rounded-full pl-10 pr-4"
          placeholder="Поиск по коду…"
          defaultValue={params.get('q') ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value.trim() || undefined);
          }}
        />
      </div>

      <Select value={params.get('status') ?? ALL} onValueChange={(v) => setParam('status', v)}>
        <SelectTrigger className={TRIGGER}>
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

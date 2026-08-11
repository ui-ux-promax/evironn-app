'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PERIOD_VALUES, DEFAULT_PERIOD } from '@/lib/admin/analytics-config';

const LABELS: Record<number, string> = { 7: 'Неделя', 30: 'Месяц', 90: 'Сезон' };

export function PeriodToggle() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = Number(params.get('period'));
  const active = (PERIOD_VALUES as readonly number[]).includes(raw) ? raw : DEFAULT_PERIOD;

  function setPeriod(value: number) {
    const next = new URLSearchParams(params.toString());
    if (value === DEFAULT_PERIOD) next.delete('period');
    else next.set('period', String(value));
    router.push(`/admin?${next.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-full border border-admin-outline-variant bg-admin-surface-low p-[5px]">
      {PERIOD_VALUES.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setPeriod(value)}
          className={cn(
            'min-h-[31px] rounded-full px-[11px] text-[12px] font-extrabold transition-colors',
            value === active
              ? 'bg-admin-surface text-admin-on-surface shadow-[0_8px_18px_hsl(var(--color-text)/.06)]'
              : 'text-admin-on-surface-variant hover:text-admin-on-surface',
          )}
        >
          {LABELS[value]}
        </button>
      ))}
    </div>
  );
}

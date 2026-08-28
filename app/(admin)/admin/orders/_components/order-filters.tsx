'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/admin/icon';
import { Input } from '@/components/admin/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/admin/ui/select';
import { ORDER_STATUS_META } from '@/lib/order';
import { ORDER_STATUS_VALUES } from '@/lib/order-admin';

const PAYMENTS = [
  { value: '__all__', label: 'Любая оплата' },
  { value: 'none', label: 'Без оплаты (COD)' },
  { value: 'pending', label: 'Ожидает оплаты' },
  { value: 'waiting_for_capture', label: 'Ожидает подтверждения' },
  { value: 'succeeded', label: 'Оплачен' },
  { value: 'canceled', label: 'Платёж отменён' },
];
const QUICK_STATUS_VALUES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;
const ALL = '__all__';

const TRIGGER =
  'h-12 rounded-[14px] border-admin-outline-variant bg-admin-bg px-4 text-[14px] font-medium [&>span]:line-clamp-none [&>span]:overflow-visible [&>svg]:hidden';

export function OrderFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [advancedOpen, setAdvancedOpen] = React.useState(true);
  const [periodOpen, setPeriodOpen] = React.useState(false);

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    router.push(`/admin/orders?${next.toString()}`);
  }

  return (
    <section
      aria-label="Поиск и фильтры заказов"
      className="rounded-[20px] border border-admin-outline-variant bg-admin-surface p-4 shadow-[var(--admin-shadow-tight)] sm:p-5"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_auto]">
        <div className="relative min-w-0">
          <label htmlFor="orders-search" className="sr-only">
            Поиск заказов
          </label>
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-admin-on-surface-variant"
          />
          <Input
            id="orders-search"
            type="search"
            className="h-12 rounded-[14px] border-admin-outline-variant bg-admin-bg pl-11 pr-4"
            placeholder="Номер заказа или клиент"
            defaultValue={params.get('q') ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value.trim() || undefined);
            }}
          />
        </div>

        <FilterSelect
          label="Статус"
          value={params.get('status') ?? ALL}
          placeholder="Все статусы"
          icon="expand_more"
          onValueChange={(value) => setParam('status', value)}
        >
          <SelectItem value={ALL}>Все статусы</SelectItem>
          {ORDER_STATUS_VALUES.map((status) => (
            <SelectItem key={status} value={status}>
              {ORDER_STATUS_META[status].label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Оплата"
          value={params.get('payment') ?? ALL}
          placeholder="Любая оплата"
          icon="expand_more"
          onValueChange={(value) => setParam('payment', value)}
        >
          {PAYMENTS.map((payment) => (
            <SelectItem key={payment.value} value={payment.value}>
              {payment.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <button
          type="button"
          aria-expanded={periodOpen}
          aria-haspopup="dialog"
          aria-controls="orders-period-availability"
          onClick={() => setPeriodOpen((open) => !open)}
          className="flex h-12 items-center justify-between rounded-[14px] border border-admin-outline-variant bg-admin-bg px-4 text-left text-sm text-admin-on-surface-variant"
        >
          <span>
            <small className="block text-[10px] font-bold uppercase tracking-[.08em]">Период</small>
            Все даты
          </span>
          <Icon name="calendar_month" className="text-admin-on-surface-variant" />
        </button>

        <button
          type="button"
          aria-label="Дополнительные фильтры"
          aria-expanded={advancedOpen}
          aria-pressed={advancedOpen}
          aria-controls="orders-quick-filters"
          title="Дополнительные фильтры"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="grid h-12 w-full place-items-center rounded-[14px] border border-admin-outline-variant bg-admin-bg text-admin-on-surface-variant transition-colors hover:bg-admin-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2 lg:w-12"
        >
          <Icon name="tune" className="text-[20px]" />
        </button>
      </div>

      {advancedOpen && (
        <div
          id="orders-quick-filters"
          className="mt-4 flex flex-wrap items-center gap-2 border-t border-admin-outline-variant pt-4"
        >
          <span className="mr-1 shrink-0 text-xs font-medium text-admin-on-surface-variant">Быстрый фильтр:</span>
          <button
            type="button"
            onClick={() => setParam('status', undefined)}
            className={quickFilterClass(!params.get('status'))}
          >
            Все
          </button>
          {QUICK_STATUS_VALUES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setParam('status', status)}
              className={quickFilterClass(params.get('status') === status)}
            >
              {ORDER_STATUS_META[status].label}
            </button>
          ))}
        </div>
      )}

      {periodOpen && (
        <div
          id="orders-period-availability"
          role="dialog"
          aria-label="Период"
          className="mt-3 rounded-[14px] border border-admin-outline-variant bg-admin-bg p-4 text-sm text-admin-on-surface-variant"
        >
          <p>Фильтр по периоду пока недоступен для этого реестра.</p>
          <button
            type="button"
            onClick={() => setPeriodOpen(false)}
            className="mt-3 rounded-[10px] border border-admin-outline-variant bg-admin-surface px-3 py-2 text-xs font-bold text-admin-on-surface transition-colors hover:bg-admin-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2"
          >
            Закрыть
          </button>
        </div>
      )}
    </section>
  );
}

function quickFilterClass(active: boolean) {
  return active
    ? 'min-h-9 shrink-0 rounded-full border border-admin-primary bg-admin-primary px-4 text-xs font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2'
    : 'min-h-9 shrink-0 rounded-full border border-admin-outline-variant bg-admin-surface px-4 text-xs font-bold text-admin-on-surface transition-colors hover:bg-admin-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2';
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
          <span className="block text-[10px] font-bold uppercase tracking-[.08em] text-admin-on-surface-variant">
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

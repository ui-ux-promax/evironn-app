'use client';

import * as React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/admin/icon';
import { formatPrice, formatDate } from '@/lib/format';
import type { RecentOrderRow } from '@/lib/admin/analytics';

const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'paid', label: 'Оплачен' },
  { value: 'ready', label: 'В сборке' },
  { value: 'return', label: 'Отменен' },
] as const;

type Filter = (typeof FILTERS)[number]['value'];

export function RecentOrders({ rows }: { rows: RecentOrderRow[] }) {
  const [filter, setFilter] = React.useState<Filter>('all');
  const filtered = rows.filter((row) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return row.paymentStatus === 'succeeded';
    if (filter === 'ready') return row.status === 'PROCESSING';
    return row.status === 'CANCELLED';
  });

  return (
    <article className="min-w-0 rounded-[32px] border border-admin-outline-variant bg-admin-surface p-6 shadow-[var(--admin-shadow-tight)]">
      <div className="mb-[22px] flex items-start justify-between gap-[18px] max-[760px]:grid">
        <div>
          <h2 className="font-admin-head text-[clamp(22px,1.7vw,30px)] font-extrabold leading-[1.05] tracking-[-.035em] text-admin-on-surface">
            Последние заказы
          </h2>
          <p className="mt-1.5 text-[13px] text-admin-on-surface-variant">Свежие операции магазина</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-admin-outline-variant bg-admin-surface px-4 text-[13px] font-bold text-admin-on-surface hover:bg-admin-surface-low"
        >
          <Icon name="filter_list" className="text-[18px]" /> Открыть все
        </Link>
      </div>

      <div className="mb-[14px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-[7px] max-[640px]:flex-nowrap max-[640px]:overflow-x-auto max-[640px]:pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={
                'min-h-[35px] shrink-0 rounded-full border px-[13px] text-[13px] font-bold transition-colors ' +
                (filter === item.value
                  ? 'border-[var(--admin-sidebar)] bg-[var(--admin-sidebar)] text-white'
                  : 'border-admin-outline-variant bg-admin-surface text-admin-on-surface hover:bg-admin-surface-low')
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="text-[13px] font-bold text-admin-on-surface-variant">Показано {filtered.length} заказов</div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-8 text-center text-sm font-bold text-admin-on-surface-variant">
          Заказов пока нет.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[20px] border border-admin-outline-variant md:block">
            <table className="w-full min-w-[900px] border-collapse text-left text-[14px]">
              <thead className="bg-admin-surface-low">
                <tr>
                  {['Заказ', 'Товар', 'Дата', 'Статус', 'Сумма', 'Клиент'].map((head) => (
                    <th
                      key={head}
                      className="border-b border-admin-outline-variant px-4 py-[15px] text-[11px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const status = dashboardStatus(row);
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-admin-surface-low">
                      <td className="border-b border-admin-outline-variant px-4 py-[15px] font-mono font-extrabold tabular-nums">
                        <Link href={`/admin/orders/${row.id}`} className="hover:underline">
                          ORD-{row.orderNumber}
                        </Link>
                      </td>
                      <td className="border-b border-admin-outline-variant px-4 py-[15px]">
                        <div className="flex min-w-[200px] items-center gap-[10px]">
                          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-admin-surface-low">
                            {row.imageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element -- admin thumb */
                              <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Icon name="image" className="text-admin-on-surface-variant" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <strong className="block truncate font-extrabold text-admin-on-surface">
                              {row.productName ?? 'Заказ'}
                            </strong>
                            <span className="mt-0.5 block text-[12px] text-admin-on-surface-variant">
                              {row.itemCount} поз.
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-admin-outline-variant px-4 py-[15px] text-admin-on-surface-variant">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="border-b border-admin-outline-variant px-4 py-[15px]">
                        <span
                          className={`inline-flex min-h-[29px] items-center rounded-full border px-[10px] text-[12px] font-extrabold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="border-b border-admin-outline-variant px-4 py-[15px] text-right font-mono font-extrabold tabular-nums text-admin-on-surface">
                        {formatPrice(row.totalAmount)}
                      </td>
                      <td className="border-b border-admin-outline-variant px-4 py-[15px]">{row.contactName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-admin-outline-variant overflow-hidden rounded-[20px] border border-admin-outline-variant md:hidden">
            {filtered.map((row) => {
              const status = dashboardStatus(row);
              return (
                <Link
                  key={row.id}
                  href={`/admin/orders/${row.id}`}
                  className="grid gap-3 bg-admin-surface p-4 transition-colors hover:bg-admin-surface-low"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block font-mono text-[15px] font-extrabold text-admin-on-surface tabular-nums">
                        ORD-{row.orderNumber}
                      </strong>
                      <span className="mt-1 block truncate text-[13px] text-admin-on-surface-variant">
                        {row.contactName}
                      </span>
                    </div>
                    <strong className="shrink-0 font-mono text-[14px] font-extrabold text-admin-on-surface tabular-nums">
                      {formatPrice(row.totalAmount)}
                    </strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex min-h-[29px] items-center rounded-full border px-[10px] text-[12px] font-extrabold ${status.className}`}
                    >
                      {status.label}
                    </span>
                    <span className="text-[12px] text-admin-on-surface-variant">
                      {formatDate(row.createdAt)} · {row.itemCount} поз.
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </article>
  );
}

function dashboardStatus(row: RecentOrderRow): { label: string; className: string } {
  if (row.status === 'CANCELLED') {
    return {
      label: 'Возврат',
      className: 'border-[hsl(var(--color-danger)/.18)] bg-[hsl(var(--color-danger)/.1)] text-admin-error',
    };
  }
  if (row.status === 'PROCESSING') {
    return {
      label: 'В сборке',
      className: 'border-[hsl(var(--color-info)/.2)] bg-[hsl(var(--color-info)/.11)] text-[hsl(var(--color-info))]',
    };
  }
  if (row.paymentStatus === 'succeeded' || row.status === 'DELIVERED') {
    return {
      label: 'Оплачен',
      className: 'border-[hsl(var(--color-success)/.22)] bg-[hsl(var(--color-success)/.12)] text-[var(--admin-money)]',
    };
  }
  return {
    label: 'Ожидает',
    className: 'border-[hsl(var(--color-warning)/.38)] bg-[hsl(var(--color-warning)/.18)] text-[hsl(42_78%_28%)]',
  };
}

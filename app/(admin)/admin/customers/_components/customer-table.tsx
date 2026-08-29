'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/admin/icon';
import { formatPrice, formatDateTime } from '@/lib/format';
import { roleView } from '@/lib/customer-admin';
import type { AdminCustomerRow } from '@/lib/admin/customers';

export type CustomerRow = AdminCustomerRow;

export interface CustomerTableProps {
  rows: CustomerRow[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export function CustomerTable({ rows, page, totalPages, total, limit }: CustomerTableProps) {
  const router = useRouter();
  const params = useSearchParams();

  function goPage(n: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(n));
    router.push(`/admin/customers?${next.toString()}`);
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]">
      <div className="flex flex-col gap-3 border-b border-admin-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-admin-on-surface">Реестр клиентов</h2>
          <p className="mt-1 text-xs text-admin-on-surface-variant">
            {total.toLocaleString('ru-RU')} клиента · данные обновлены недавно
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-9 w-fit items-center rounded-[10px] border border-admin-outline-variant px-3.5 text-xs font-bold text-admin-on-surface-variant"
        >
          Экспорт
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table aria-label="Реестр клиентов" className="w-full min-w-[880px] border-collapse text-left text-[13px]">
          <thead className="bg-admin-surface-high">
            <tr>
              {['Клиент', 'Роль', 'Заказов', 'Потрачено', 'Регистрация'].map((h) => (
                <th
                  key={h}
                  className="border-b border-admin-outline-variant bg-admin-surface-low px-3 py-3.5 text-[10px] font-bold uppercase tracking-[.08em] text-admin-on-surface-variant first:px-5"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-outline-variant">
            {rows.map((row) => {
              const rv = roleView(row.role);
              return (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/admin/customers/${row.id}`)}
                  className="group hover:bg-admin-surface-high transition-colors cursor-pointer"
                >
                  {/* Клиент */}
                  <td className="px-6 py-4">
                    <a
                      href={`/admin/customers/${row.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-admin-on-surface hover:underline"
                    >
                      {row.name?.trim() || 'Без имени'}
                    </a>
                    <div className="text-xs text-admin-on-surface-variant truncate max-w-[240px]">{row.email}</div>
                    {row.phone && <div className="text-xs text-admin-on-surface-variant truncate">{row.phone}</div>}
                  </td>
                  {/* Роль */}
                  <td className="px-6 py-4">
                    <span className={rv.badge}>{rv.label}</span>
                  </td>
                  {/* Заказов */}
                  <td className="px-6 py-4 text-admin-on-surface tabular-nums">{row.orderCount}</td>
                  {/* Потрачено */}
                  <td className="px-6 py-4 font-bold text-admin-on-surface tabular-nums">
                    {formatPrice(row.totalSpent)}
                  </td>
                  {/* Регистрация */}
                  <td className="px-6 py-4 text-admin-on-surface-variant text-sm tabular-nums">
                    {formatDateTime(row.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Мобильная раскладка: карточки вместо таблицы (<md) */}
      <div className="md:hidden divide-y divide-admin-outline-variant">
        {rows.map((row) => {
          const rv = roleView(row.role);
          return (
            <div
              key={row.id}
              onClick={() => router.push(`/admin/customers/${row.id}`)}
              className="p-4 cursor-pointer hover:bg-admin-surface-high transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={`/admin/customers/${row.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-admin-on-surface hover:underline block truncate"
                  >
                    {row.name?.trim() || 'Без имени'}
                  </a>
                  <div className="text-xs text-admin-on-surface-variant truncate">{row.email}</div>
                  {row.phone && <div className="text-xs text-admin-on-surface-variant truncate">{row.phone}</div>}
                </div>
                <span className={cn('shrink-0', rv.badge)}>{rv.label}</span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm">
                  <span className="text-admin-on-surface-variant">Заказов: </span>
                  <span className="font-bold text-admin-on-surface tabular-nums">{row.orderCount}</span>
                </span>
                <span className="text-sm">
                  <span className="text-admin-on-surface-variant">Потрачено: </span>
                  <span className="font-bold text-admin-on-surface tabular-nums">{formatPrice(row.totalSpent)}</span>
                </span>
                <span className="text-xs text-admin-on-surface-variant tabular-nums">
                  {formatDateTime(row.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Пагинация */}
      <div className="px-6 py-4 border-t border-admin-outline-variant flex items-center justify-between">
        <p className="text-xs text-admin-on-surface-variant">
          Показано {from}–{to} из {total}
        </p>
        <div className="flex items-center gap-2">
          <PagerBtn disabled={page <= 1} onClick={() => goPage(page - 1)} icon="chevron_left" />
          {pageItems(page, totalPages).map((it, i) =>
            it === '…' ? (
              <span key={`e${i}`} className="text-admin-on-surface-variant mx-1">
                …
              </span>
            ) : (
              <button
                key={it}
                type="button"
                onClick={() => goPage(it)}
                aria-current={it === page ? 'page' : undefined}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-colors',
                  it === page
                    ? 'bg-admin-primary text-admin-on-primary'
                    : 'text-admin-on-surface-variant hover:bg-admin-surface-high',
                )}
              >
                {it}
              </button>
            ),
          )}
          <PagerBtn disabled={page >= totalPages} onClick={() => goPage(page + 1)} icon="chevron_right" />
        </div>
      </div>
    </div>
  );
}

function PagerBtn({ disabled, onClick, icon }: { disabled: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={icon === 'chevron_left' ? 'Предыдущая страница' : 'Следующая страница'}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-admin-outline-variant text-admin-on-surface-variant hover:bg-admin-surface-high transition-colors disabled:opacity-30"
    >
      <Icon name={icon} />
    </button>
  );
}

// 1 … c-1 c c+1 … last
function pageItems(current: number, totalPages: number): (number | '…')[] {
  const set = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) out.push('…');
    out.push(n);
    prev = n;
  }
  return out;
}

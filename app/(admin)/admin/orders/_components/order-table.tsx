'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/admin/icon';
import { formatDateTime, formatPrice } from '@/lib/format';
import type { AdminOrderRow } from '@/lib/admin/orders';
import { orderStatusView } from '@/lib/order';
import { paymentStatusView } from '@/lib/order-admin';

export type OrderRow = AdminOrderRow;

export interface OrderTableProps {
  rows: OrderRow[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export function OrderTable({ rows, page, totalPages, total, limit }: OrderTableProps) {
  const router = useRouter();
  const params = useSearchParams();

  function goPage(nextPage: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(nextPage));
    router.push(`/admin/orders?${next.toString()}`);
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="overflow-hidden border border-admin-outline-variant bg-admin-surface">
      <div className="overflow-x-auto">
        <table aria-label="Реестр заказов" className="w-full min-w-[1180px] border-collapse text-left text-[13px]">
          <thead className="bg-admin-surface-low text-[10px] uppercase tracking-[.08em] text-admin-on-surface-variant">
            <tr>
              <th className="border-b border-admin-outline-variant px-5 py-3.5">Заказ</th>
              <th className="border-b border-admin-outline-variant px-3 py-3.5">Дата</th>
              <th className="border-b border-admin-outline-variant px-3 py-3.5">Клиент</th>
              <th className="border-b border-admin-outline-variant px-3 py-3.5">Состав</th>
              <th className="border-b border-admin-outline-variant px-3 py-3.5">Сумма</th>
              <th className="border-b border-admin-outline-variant px-3 py-3.5">Статус</th>
              <th className="border-b border-admin-outline-variant px-3 py-3.5">Оплата</th>
              <th className="border-b border-admin-outline-variant px-3 py-3.5">Доставка</th>
              <th className="border-b border-admin-outline-variant px-5 py-3.5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = orderStatusView(row.status, row.paymentStatus);
              const payment = paymentStatusView(row.paymentStatus);

              return (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/admin/orders/${row.id}`)}
                  className="group cursor-pointer transition-colors hover:bg-admin-bg"
                >
                  <td className="border-b border-admin-outline-variant px-5 py-4 font-bold tabular-nums text-admin-on-surface">
                    <Link
                      href={`/admin/orders/${row.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="hover:underline"
                    >
                      #{row.orderNumber}
                    </Link>
                  </td>
                  <td className="border-b border-admin-outline-variant px-3 py-4 text-admin-on-surface-variant tabular-nums">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="border-b border-admin-outline-variant px-3 py-4">
                    <b className="block max-w-[190px] truncate text-admin-on-surface">{row.contactName}</b>
                    <small className="mt-1 block max-w-[190px] truncate text-admin-on-surface-variant">
                      {row.contactEmail}
                    </small>
                  </td>
                  <td className="border-b border-admin-outline-variant px-3 py-4">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-admin-surface-low">
                        {row.coverImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */
                          <img src={row.coverImage} alt="" className="h-full w-full rounded-[10px] object-contain" />
                        ) : (
                          <Icon name="inventory_2" className="text-[18px] text-admin-on-surface-variant" />
                        )}
                      </span>
                      <span className="whitespace-nowrap text-admin-on-surface-variant">
                        {row.itemCount} {pluralize(row.itemCount, 'позиция', 'позиции', 'позиций')}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-admin-outline-variant px-3 py-4 font-bold tabular-nums text-admin-on-surface">
                    {formatPrice(row.totalAmount)}
                  </td>
                  <td className="border-b border-admin-outline-variant px-3 py-4">
                    <span className={status.badge}>{status.label}</span>
                  </td>
                  <td className="border-b border-admin-outline-variant px-3 py-4">
                    <span className={payment.badge}>{payment.label}</span>
                  </td>
                  <td className="border-b border-admin-outline-variant px-3 py-4">
                    <span
                      className="inline-flex rounded-full bg-admin-surface-low px-3 py-1.5 text-xs font-bold text-admin-on-surface-variant"
                      title="Способ доставки отсутствует в списочной проекции"
                    >
                      —
                    </span>
                  </td>
                  <td className="border-b border-admin-outline-variant px-5 py-4 text-right">
                    <Link
                      href={`/admin/orders/${row.id}`}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Открыть заказ №${row.orderNumber}`}
                      className="inline-grid h-9 w-9 place-items-center rounded-[10px] text-admin-on-surface-variant transition-colors hover:bg-admin-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2"
                    >
                      <Icon name="more_vert" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-outline-variant px-5 py-4">
        <p className="text-xs text-admin-on-surface-variant">
          Показано {from}–{to} из {total} заказов
        </p>
        <div className="flex gap-2">
          <PagerButton disabled={page <= 1} onClick={() => goPage(page - 1)} icon="chevron_left" />
          {pageItems(page, totalPages).map((item, index) =>
            item === '…' ? (
              <span
                key={`ellipsis-${index}`}
                className="grid h-10 w-5 place-items-center text-admin-on-surface-variant"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goPage(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-[12px] text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2',
                  item === page
                    ? 'bg-admin-primary text-white'
                    : 'border border-admin-outline-variant text-admin-on-surface-variant hover:bg-admin-surface-low',
                )}
              >
                {item}
              </button>
            ),
          )}
          <PagerButton disabled={page >= totalPages} onClick={() => goPage(page + 1)} icon="chevron_right" />
        </div>
      </footer>
    </div>
  );
}

function PagerButton({ disabled, onClick, icon }: { disabled: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={icon === 'chevron_left' ? 'Предыдущая страница' : 'Следующая страница'}
      className="grid h-10 w-10 place-items-center rounded-[12px] border border-admin-outline-variant text-admin-on-surface-variant transition-colors hover:bg-admin-surface-low disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon name={icon} />
    </button>
  );
}

function pluralize(value: number, one: string, few: string, many: string) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 14) return many;
  switch (value % 10) {
    case 1:
      return one;
    case 2:
    case 3:
    case 4:
      return few;
    default:
      return many;
  }
}

function pageItems(current: number, totalPages: number): (number | '…')[] {
  const set = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...set].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  let previous = 0;
  for (const item of sorted) {
    if (item - previous > 1) result.push('…');
    result.push(item);
    previous = item;
  }
  return result;
}

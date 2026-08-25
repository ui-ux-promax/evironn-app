'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/admin/icon';
import { Input } from '@/components/admin/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { formatPrice } from '@/lib/format';
import type { AdminSkuStockRow } from '@/lib/admin/catalog';
import { cn } from '@/lib/utils';
import { StockCell } from './stock-cell';

const ALL = '__all__';

type StockTableProps = {
  rows: AdminSkuStockRow[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

export function StockTable({ rows, page, totalPages, total, limit }: StockTableProps) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    router.push(`/admin/catalog/stock?${next.toString()}`);
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  function goPage(nextPage: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(nextPage));
    router.push(`/admin/catalog/stock?${next.toString()}`);
  }

  return (
    <div>
      <div className="mb-[18px] flex flex-wrap items-center gap-3 max-[640px]:grid">
        <div className="relative min-w-[240px] flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-admin-on-surface-variant"
          />
          <Input
            className="h-12 rounded-full pl-10 pr-4"
            placeholder="Поиск SKU, артикула или товара…"
            defaultValue={params.get('q') ?? ''}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setParam('q', event.currentTarget.value.trim() || undefined);
            }}
          />
        </div>
        <Select value={params.get('status') ?? ALL} onValueChange={(value) => setParam('status', value)}>
          <SelectTrigger className="h-12 rounded-full px-4 text-[14px] font-bold">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все SKU</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="inactive">Неактивные</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.get('sort') ?? 'stock'} onValueChange={(value) => setParam('sort', value)}>
          <SelectTrigger className="h-12 rounded-full px-4 text-[14px] font-bold">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stock">По остатку</SelectItem>
            <SelectItem value="articleNumber">По артикулу</SelectItem>
            <SelectItem value="productName">По товару</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-[20px] border border-admin-outline-variant bg-admin-surface">
        <table className="w-full min-w-[980px] border-collapse text-left text-[14px]">
          <thead className="bg-admin-surface-low">
            <tr>
              {['Товар', 'Артикул', 'Конфигурация', 'Цена', 'Остаток', 'Статус'].map((heading) => (
                <th
                  key={heading}
                  className="border-b border-admin-outline-variant px-4 py-[14px] text-[11px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.skuId}
                data-testid={`admin-stock-row-${row.skuId}`}
                className="transition-colors hover:bg-admin-surface-low"
              >
                <td className="border-b border-admin-outline-variant px-4 py-[14px]">
                  <Link
                    href={`/admin/catalog/products/${row.productId}/edit`}
                    className="font-bold text-admin-on-surface hover:underline"
                  >
                    {row.productName}
                  </Link>
                </td>
                <td className="border-b border-admin-outline-variant px-4 py-[14px] font-mono text-xs text-admin-on-surface-variant">
                  {row.articleNumber}
                </td>
                <td className="border-b border-admin-outline-variant px-4 py-[14px]">
                  <div className="font-medium text-admin-on-surface">
                    {row.optionLabels.length > 0 ? row.optionLabels.join(' · ') : 'Базовая конфигурация'}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-admin-on-surface-variant">{row.combinationKey}</div>
                </td>
                <td className="whitespace-nowrap border-b border-admin-outline-variant px-4 py-[14px] font-bold tabular-nums text-admin-on-surface">
                  {formatPrice(row.price)}
                </td>
                <td className="border-b border-admin-outline-variant px-4 py-[14px]">
                  <StockCell row={row} />
                </td>
                <td className="border-b border-admin-outline-variant px-4 py-[14px]">
                  <StatusPill active={row.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 px-1 py-4 max-[640px]:justify-center">
        <p className="text-xs text-admin-on-surface-variant">
          Показано {from}–{to} из {total}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <PagerButton disabled={page <= 1} onClick={() => goPage(page - 1)} icon="chevron_left" />
            {pageItems(page, totalPages).map((item, index) =>
              item === '…' ? (
                <span key={`ellipsis-${index}`} className="mx-1 text-admin-on-surface-variant">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goPage(item)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-[12px] font-bold transition-colors',
                    item === page
                      ? 'bg-[var(--admin-sidebar)] text-white'
                      : 'border border-admin-outline-variant text-admin-on-surface-variant hover:bg-admin-surface-low',
                  )}
                >
                  {item}
                </button>
              ),
            )}
            <PagerButton disabled={page >= totalPages} onClick={() => goPage(page + 1)} icon="chevron_right" />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'flex min-h-[29px] w-fit items-center gap-1 rounded-full border px-[10px] text-xs font-extrabold',
        active
          ? 'border-[hsl(var(--color-success)/.22)] bg-[hsl(var(--color-success)/.12)] text-[var(--admin-money)]'
          : 'border-admin-outline-variant bg-admin-surface-low text-admin-on-surface-variant',
      )}
    >
      <span className="h-[7px] w-[7px] rounded-full bg-current" /> {active ? 'Активен' : 'Черновик'}
    </span>
  );
}

function PagerButton({ disabled, onClick, icon }: { disabled: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-admin-outline-variant text-admin-on-surface-variant transition-colors hover:bg-admin-surface-low disabled:opacity-30"
      aria-label={icon === 'chevron_left' ? 'Предыдущая страница' : 'Следующая страница'}
    >
      <Icon name={icon} />
    </button>
  );
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

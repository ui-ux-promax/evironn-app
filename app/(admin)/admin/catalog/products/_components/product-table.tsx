'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/admin/icon';
import { Button } from '@/components/admin/ui/button';
import { AlertModal } from '@/components/admin/ui/alert-modal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/admin/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/admin/ui/dialog';
import { formatPrice } from '@/lib/format';
import { deleteProduct } from '@/app/actions/admin/products';
import type { AdminCatalogProductRow } from '@/lib/admin/catalog';

export type ProductRow = AdminCatalogProductRow;

const LOW_STOCK = 20;

export interface ProductTableProps {
  rows: ProductRow[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export function ProductTable({ rows, page, totalPages, total, limit }: ProductTableProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [toDelete, setToDelete] = React.useState<ProductRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [blockMsg, setBlockMsg] = React.useState<string | null>(null);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await deleteProduct(toDelete.id);
    setDeleting(false);
    setToDelete(null);
    if (!res.ok) setBlockMsg(res.error);
    else router.refresh();
  }

  function goPage(n: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(n));
    router.push(`/admin/catalog/products?${next.toString()}`);
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-[18px] overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] border-collapse text-left text-[14px]">
          <thead className="bg-admin-surface-low">
            <tr>
              {['Товар', 'Бренд', 'Категория', 'Остаток', 'Цена', 'Статус'].map((h) => (
                <th
                  key={h}
                  className="border-b border-admin-outline-variant px-4 py-[14px] text-[11px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant"
                >
                  {h}
                </th>
              ))}
              <th className="border-b border-admin-outline-variant px-4 py-[14px] text-right text-[11px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-admin-surface-low">
                {/* Товар */}
                <td className="border-b border-admin-outline-variant px-4 py-[14px]">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-admin-outline-variant bg-admin-surface-low p-1">
                      <Icon name="image" className="text-admin-on-surface-variant" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/catalog/products/${row.id}/edit`}
                        className="font-bold text-admin-on-surface hover:underline block truncate"
                      >
                        {row.name}
                      </Link>
                      <div className="text-xs text-admin-on-surface-variant">{row.slug}</div>
                    </div>
                  </div>
                </td>
                {/* Бренд */}
                <td className="border-b border-admin-outline-variant px-4 py-[14px] text-admin-on-surface-variant">
                  {row.brand}
                </td>
                {/* Категория */}
                <td className="border-b border-admin-outline-variant px-4 py-[14px]">
                  <span className="rounded-full bg-admin-surface-low px-3 py-1 text-xs font-bold text-admin-on-surface">
                    {row.categoryName}
                  </span>
                </td>
                {/* Остаток */}
                <td className="border-b border-admin-outline-variant px-4 py-[14px]">
                  {row.totalStock === 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-admin-error" />
                      <span className="font-bold text-admin-error">Нет в наличии</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          row.totalStock <= LOW_STOCK ? 'bg-admin-on-secondary-container' : 'bg-admin-primary',
                        )}
                      />
                      <span className="font-bold text-admin-on-surface tabular-nums">{row.totalStock}</span>
                    </div>
                  )}
                </td>
                {/* Цена */}
                <td className="whitespace-nowrap border-b border-admin-outline-variant px-4 py-[14px] font-bold tabular-nums text-admin-on-surface">
                  {row.minPrice == null ? '—' : formatPrice(row.minPrice)}
                </td>
                {/* Статус */}
                <td className="border-b border-admin-outline-variant px-4 py-[14px]">
                  <StatusPill active={row.active} />
                </td>
                {/* Действия */}
                <td className="border-b border-admin-outline-variant px-4 py-[14px] text-right">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Действия"
                        className="p-2 rounded-full text-admin-on-surface-variant hover:bg-admin-surface-container transition-colors"
                      >
                        <Icon name="more_vert" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/catalog/products/${row.id}/edit`)}>
                        <Icon name="edit" className="text-[18px] mr-2" /> Изменить
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setToDelete(row)}
                        className="text-admin-error focus:text-admin-error"
                      >
                        <Icon name="delete" className="text-[18px] mr-2" /> Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобильная раскладка: карточки вместо таблицы (<md) */}
      <div className="divide-y divide-admin-outline-variant md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-admin-surface-high border border-admin-outline-variant p-1 overflow-hidden flex items-center justify-center shrink-0">
                <Icon name="image" className="text-admin-on-surface-variant" />
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/catalog/products/${row.id}/edit`}
                  className="font-bold text-admin-on-surface hover:underline block truncate"
                >
                  {row.name}
                </Link>
                <div className="text-xs text-admin-on-surface-variant truncate">
                  {row.brand} · {row.categoryName}
                </div>
              </div>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Действия"
                    className="shrink-0 p-2 -mr-1 rounded-full text-admin-on-surface-variant hover:bg-admin-surface-container transition-colors"
                  >
                    <Icon name="more_vert" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/admin/catalog/products/${row.id}/edit`)}>
                    <Icon name="edit" className="text-[18px] mr-2" /> Изменить
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setToDelete(row)}
                    className="text-admin-error focus:text-admin-error"
                  >
                    <Icon name="delete" className="text-[18px] mr-2" /> Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              {/* Остаток */}
              {row.totalStock === 0 ? (
                <span className="flex items-center gap-1.5 text-sm font-bold text-admin-error">
                  <span className="w-1.5 h-1.5 rounded-full bg-admin-error" /> Нет в наличии
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      row.totalStock <= LOW_STOCK ? 'bg-admin-on-secondary-container' : 'bg-admin-primary',
                    )}
                  />
                  <span className="font-bold text-admin-on-surface tabular-nums">{row.totalStock}</span>
                  <span className="text-admin-on-surface-variant">в наличии</span>
                </span>
              )}

              {/* Цена */}
              <span className="font-bold text-admin-on-surface tabular-nums whitespace-nowrap">
                {row.minPrice == null ? '—' : formatPrice(row.minPrice)}
              </span>
            </div>

            <div className="mt-2">
              <StatusPill active={row.active} />
            </div>
          </div>
        ))}
      </div>

      {/* Пагинация (в подвале карточки, как в прототипе) */}
      <div className="flex items-center justify-between gap-4 border-t border-admin-outline-variant px-6 py-4 max-[640px]:justify-center">
        <p className="text-xs text-admin-on-surface-variant">
          Показано {from}–{to} из {total}
        </p>
        {totalPages > 1 && (
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
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-[12px] font-bold transition-colors',
                    it === page
                      ? 'bg-[var(--admin-sidebar)] text-white'
                      : 'border border-admin-outline-variant text-admin-on-surface-variant hover:bg-admin-surface-low',
                  )}
                >
                  {it}
                </button>
              ),
            )}
            <PagerBtn disabled={page >= totalPages} onClick={() => goPage(page + 1)} icon="chevron_right" />
          </div>
        )}
      </div>

      <AlertModal
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Удалить товар?"
        description={toDelete ? `«${toDelete.name}» будет удалён безвозвратно.` : undefined}
      />

      <Dialog open={blockMsg !== null} onOpenChange={(open) => !open && setBlockMsg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нельзя удалить товар</DialogTitle>
            <DialogDescription>{blockMsg}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setBlockMsg(null)}>
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="flex min-h-[29px] w-fit items-center gap-1 rounded-full border border-[hsl(var(--color-success)/.22)] bg-[hsl(var(--color-success)/.12)] px-[10px] text-xs font-extrabold text-[var(--admin-money)]">
        <span className="h-[7px] w-[7px] rounded-full bg-current" /> Активен
      </span>
    );
  }
  return (
    <span className="flex min-h-[29px] w-fit items-center gap-1 rounded-full border border-admin-outline-variant bg-admin-surface-low px-[10px] text-xs font-extrabold text-admin-on-surface-variant">
      <span className="h-[7px] w-[7px] rounded-full bg-current" /> Черновик
    </span>
  );
}

function PagerBtn({ disabled, onClick, icon }: { disabled: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-admin-outline-variant text-admin-on-surface-variant transition-colors hover:bg-admin-surface-low disabled:opacity-30"
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

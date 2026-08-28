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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { deleteFurnitureProduct } from '@/app/actions/admin/products';
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
    const res = await deleteFurnitureProduct({ productId: toDelete.id });
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
    <>
      <div className="overflow-x-auto">
        <table aria-label="Товарный реестр" className="w-full min-w-[1110px] border-collapse text-left text-[13px]">
          <thead className="bg-admin-surface-low">
            <tr>
              <th className="w-12 border-b border-admin-outline-variant px-4 py-3.5">
                <input
                  type="checkbox"
                  aria-label="Выбрать все товары"
                  className="h-[18px] w-[18px] rounded-md border-admin-outline-variant accent-admin-primary"
                />
              </th>
              {['Товар', 'Категория', 'Варианты / SKU', 'Артикул', 'Цена', 'Остаток', 'Статус'].map((heading) => (
                <th
                  key={heading}
                  className="border-b border-admin-outline-variant px-3 py-3.5 text-[10px] font-bold uppercase tracking-[.08em] text-admin-on-surface-variant"
                >
                  {heading}
                </th>
              ))}
              <th className="w-16 border-b border-admin-outline-variant px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-[.08em] text-admin-on-surface-variant">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-admin-surface-low">
                <td className="border-b border-admin-outline-variant px-4 py-3 align-middle">
                  <input
                    type="checkbox"
                    aria-label={`Выбрать товар ${row.name}`}
                    className="h-[18px] w-[18px] rounded-md border-admin-outline-variant accent-admin-primary"
                  />
                </td>
                <td className="min-w-[300px] border-b border-admin-outline-variant px-3 py-3 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="grid h-14 w-[72px] shrink-0 place-items-center overflow-hidden rounded-[14px] border border-admin-outline-variant bg-admin-surface-low text-admin-on-surface-variant">
                      <Icon name={productIcon(row.categoryName)} className="text-[28px]" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/catalog/products/${row.id}/edit`}
                        className="block truncate text-sm font-bold text-admin-on-surface hover:underline"
                      >
                        {row.name}
                      </Link>
                      <div className="mt-1 truncate text-xs text-admin-on-surface-variant">
                        {row.roomNames.join(' · ') || row.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="border-b border-admin-outline-variant px-3 py-3 align-middle">
                  <span className="whitespace-nowrap rounded-full bg-admin-surface-low px-3 py-1.5 text-xs font-medium text-admin-on-surface">
                    {row.categoryName}
                  </span>
                </td>
                <td className="border-b border-admin-outline-variant px-3 py-3 align-middle">
                  <b className="tabular-nums">{row.skuCount}</b>
                  <span className="ml-1 text-admin-on-surface-variant">SKU</span>
                </td>
                <td className="border-b border-admin-outline-variant px-3 py-3 align-middle text-admin-on-surface-variant">
                  {row.slug}
                </td>
                <td className="whitespace-nowrap border-b border-admin-outline-variant px-3 py-3 align-middle font-bold tabular-nums text-admin-on-surface">
                  {row.minPrice == null ? '—' : formatPrice(row.minPrice)}
                </td>
                <td className="border-b border-admin-outline-variant px-3 py-3 align-middle">
                  {row.totalStock === 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-admin-error" />
                      <span className="font-bold text-admin-error">Нет в наличии</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          row.totalStock <= LOW_STOCK ? 'bg-admin-on-secondary-container' : 'bg-admin-primary',
                        )}
                      />
                      <span className="font-bold tabular-nums text-admin-on-surface">{row.totalStock}</span>
                    </div>
                  )}
                </td>
                <td className="border-b border-admin-outline-variant px-3 py-3 align-middle">
                  <StatusPill active={row.active} />
                </td>
                <td className="border-b border-admin-outline-variant px-4 py-3 text-right align-middle">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Действия для ${row.name}`}
                        className="rounded-full p-2 text-admin-on-surface-variant transition-colors hover:bg-admin-surface-container"
                      >
                        <Icon name="more_vert" className="text-[20px]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/catalog/products/${row.id}/edit`)}>
                        <Icon name="edit" className="mr-2 text-[18px]" /> Изменить
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setToDelete(row)}
                        className="text-admin-error focus:text-admin-error"
                      >
                        <Icon name="delete" className="mr-2 text-[18px]" /> Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-admin-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-admin-on-surface-variant">
          Показано {from}–{to} из {total}
        </p>
        <div className="flex items-center gap-2 max-[640px]:self-center">
          <PagerBtn disabled={page <= 1} onClick={() => goPage(page - 1)} icon="chevron_left" />
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
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-[12px] font-bold transition-colors',
                  item === page
                    ? 'bg-admin-primary text-white'
                    : 'border border-admin-outline-variant text-admin-on-surface-variant hover:bg-admin-surface-low',
                )}
              >
                {item}
              </button>
            ),
          )}
          <PagerBtn disabled={page >= totalPages} onClick={() => goPage(page + 1)} icon="chevron_right" />
        </div>
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
    </>
  );
}

function productIcon(categoryName: string) {
  const category = categoryName.toLocaleLowerCase('ru-RU');
  if (category.includes('свет') || category.includes('ламп')) return 'lightbulb';
  if (category.includes('декор') || category.includes('аксесс')) return 'potted_plant';
  if (category.includes('стол')) return 'table_restaurant';
  if (category.includes('крес') || category.includes('диван')) return 'weekend';
  return 'chair';
}

function StatusPill({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex min-h-[29px] items-center gap-1.5 rounded-full border border-green-700/20 bg-green-700/10 px-3 text-xs font-bold text-[var(--admin-money)]">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        Активен
      </span>
    );
  }
  return (
    <span className="inline-flex min-h-[29px] items-center gap-1.5 rounded-full border border-admin-outline-variant bg-admin-surface-low px-3 text-xs font-bold text-admin-on-surface-variant">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Черновик
    </span>
  );
}

function PagerBtn({ disabled, onClick, icon }: { disabled: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={icon === 'chevron_left' ? 'Предыдущая страница' : 'Следующая страница'}
      className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-admin-outline-variant text-admin-on-surface-variant transition-colors hover:bg-admin-surface-low disabled:opacity-30"
    >
      <Icon name={icon} />
    </button>
  );
}

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

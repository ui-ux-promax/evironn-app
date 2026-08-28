'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/admin/ui/table';
import { Button } from '@/components/admin/ui/button';
import { Switch } from '@/components/admin/ui/switch';
import { AlertModal } from '@/components/admin/ui/alert-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/admin/ui/dialog';
import { deleteCoupon, toggleCoupon } from '@/app/actions/admin/coupons';

export type CouponRow = {
  id: string;
  code: string;
  percent: number;
  active: boolean;
  status: 'active' | 'inactive' | 'expired';
  expiresLabel: string;
  createdLabel: string;
};

type CouponStatus = CouponRow['status'];

const STATUS_META: Record<CouponStatus, { label: string; cls: string }> = {
  active: {
    label: 'Активен',
    cls: 'border-[hsl(var(--color-success)/.22)] bg-[hsl(var(--color-success)/.12)] text-[var(--admin-money)]',
  },
  inactive: {
    label: 'Выключен',
    cls: 'border-admin-outline-variant bg-admin-surface-low text-admin-on-surface-variant',
  },
  expired: {
    label: 'Истёк',
    cls: 'border-[hsl(var(--color-danger)/.18)] bg-[hsl(var(--color-danger)/.1)] text-admin-error',
  },
};

export function CouponTable({
  rows,
  page = 1,
  totalPages = 1,
  total = rows.length,
  limit = Math.max(rows.length, 1),
}: {
  rows: CouponRow[];
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<CouponRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [blockMsg, setBlockMsg] = React.useState<string | null>(null);

  async function handleToggle(row: CouponRow, next: boolean) {
    setPending(row.id);
    const res = await toggleCoupon(row.id, next);
    if (!res.ok) setBlockMsg(res.error);
    else router.refresh();
    setPending(null);
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await deleteCoupon(toDelete.id);
    setDeleting(false);
    setToDelete(null);
    if (!res.ok) setBlockMsg(res.error);
    else router.refresh();
  }

  function goPage(nextPage: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(nextPage));
    router.push(`/admin/marketing?${next.toString()}`);
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface">
        <div className="hidden md:block">
          <Table aria-label="Реестр промокодов">
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>Скидка</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead>Действует до</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono font-extrabold tracking-[-.02em]">{row.code}</TableCell>
                  <TableCell className="font-bold tabular-nums">{row.percent}%</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex min-h-[29px] w-fit items-center gap-1 rounded-full border px-[10px] text-xs font-extrabold ${STATUS_META[row.status].cls}`}
                    >
                      <span className="h-[7px] w-[7px] rounded-full bg-current" />
                      {STATUS_META[row.status].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.active}
                      disabled={pending === row.id}
                      onCheckedChange={(v) => handleToggle(row, v)}
                    />
                  </TableCell>
                  <TableCell className="text-admin-on-surface-variant">{row.expiresLabel}</TableCell>
                  <TableCell className="text-admin-on-surface-variant">{row.createdLabel}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/marketing/${row.id}/edit`}>Изменить</Link>
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setToDelete(row)}>
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden divide-y divide-admin-outline-variant">
          {rows.map((row) => (
            <div key={row.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono font-extrabold tracking-[-.02em] text-admin-on-surface">{row.code}</span>
                  <div className="text-sm tabular-nums text-admin-on-surface-variant">{row.percent}% скидка</div>
                </div>
                <span
                  className={`inline-flex min-h-[29px] w-fit shrink-0 items-center gap-1 rounded-full border px-[10px] text-xs font-extrabold ${STATUS_META[row.status].cls}`}
                >
                  <span className="h-[7px] w-[7px] rounded-full bg-current" />
                  {STATUS_META[row.status].label}
                </span>
              </div>

              <div className="text-xs text-admin-on-surface-variant tabular-nums space-y-0.5">
                <div>Действует до: {row.expiresLabel}</div>
                <div>Создан: {row.createdLabel}</div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-2 text-sm text-admin-on-surface-variant">
                  <Switch
                    checked={row.active}
                    disabled={pending === row.id}
                    onCheckedChange={(v) => handleToggle(row, v)}
                  />
                  Активен
                </label>
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/marketing/${row.id}/edit`}>Изменить</Link>
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setToDelete(row)}>
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-outline-variant px-1 pt-1 sm:px-2">
        <p className="text-xs text-admin-on-surface-variant">
          Показано {from}–{to} из {total} промокодов
        </p>
        <div className="flex items-center gap-2">
          <PagerButton disabled={page <= 1} onClick={() => goPage(page - 1)} icon="chevron_left" />
          <button
            type="button"
            aria-current={page === 1 ? 'page' : undefined}
            onClick={() => goPage(1)}
            className={
              page === 1
                ? 'grid h-10 w-10 place-items-center rounded-[12px] bg-admin-primary text-sm font-bold text-white'
                : 'grid h-10 w-10 place-items-center rounded-[12px] border border-admin-outline-variant text-sm font-bold text-admin-on-surface-variant'
            }
          >
            1
          </button>
          <PagerButton disabled={page >= totalPages} onClick={() => goPage(page + 1)} icon="chevron_right" />
        </div>
      </footer>

      <AlertModal
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Удалить купон?"
        description={toDelete ? `«${toDelete.code}» будет удалён безвозвратно.` : undefined}
      />

      <Dialog open={blockMsg !== null} onOpenChange={(open) => !open && setBlockMsg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Не удалось</DialogTitle>
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

function PagerButton({ disabled, onClick, icon }: { disabled: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={icon === 'chevron_left' ? 'Предыдущая страница' : 'Следующая страница'}
      className="grid h-10 w-10 place-items-center rounded-[12px] border border-admin-outline-variant text-admin-on-surface-variant transition-colors hover:bg-admin-surface-low disabled:cursor-not-allowed disabled:opacity-30"
    >
      <span aria-hidden="true">{icon === 'chevron_left' ? '‹' : '›'}</span>
    </button>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/admin/ui/button';
import { AlertModal } from '@/components/admin/ui/alert-modal';
import { Icon } from '@/components/admin/icon';
import { deleteOptionGroup, reorderOptionGroups } from '@/app/actions/admin/option-groups';
import type { AdminOptionGroupRow } from '@/lib/admin/catalog';

export function OptionGroupTable({ rows }: { rows: AdminOptionGroupRow[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<AdminOptionGroupRow | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setPending(rows[index].id);
    const result = await reorderOptionGroups({ ids });
    setPending(null);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setPending(toDelete.id);
    const result = await deleteOptionGroup({ id: toDelete.id });
    setPending(null);
    setToDelete(null);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <section
      aria-label="Реестр групп опций"
      className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface"
    >
      <div role="list" className="divide-y divide-admin-outline-variant">
        {rows.map((row, index) => (
          <div
            key={row.id}
            role="listitem"
            className="flex flex-col gap-4 p-5 transition-colors hover:bg-admin-surface-low md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <div className="font-bold text-admin-on-surface">{row.name}</div>
              <div className="text-xs text-admin-on-surface-variant">
                {row.slug} · {row.values.length} значений · {row.productCount} товаров
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Значения опции">
                {row.values.map((value) => (
                  <span
                    key={value.id}
                    className="rounded-full bg-admin-surface-low px-2 py-1 text-xs text-admin-on-surface-variant"
                  >
                    {value.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === 0 || pending !== null}
                onClick={() => move(index, -1)}
              >
                <Icon name="arrow_upward" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === rows.length - 1 || pending !== null}
                onClick={() => move(index, 1)}
              >
                <Icon name="arrow_downward" />
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/catalog/options/${row.id}/edit`}>Изменить</Link>
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={pending !== null}
                onClick={() => setToDelete(row)}
              >
                Удалить
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="border-t border-admin-outline-variant px-4 py-3 text-sm text-admin-error">{error}</p>}
      <AlertModal
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={pending !== null}
        title="Удалить группу опций?"
        description={toDelete ? `«${toDelete.name}» будет удалена безвозвратно.` : undefined}
      />
    </section>
  );
}

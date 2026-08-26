'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteRoom, reorderRooms } from '@/app/actions/admin/rooms';
import { Icon } from '@/components/admin/icon';
import { Button } from '@/components/admin/ui/button';
import { AlertModal } from '@/components/admin/ui/alert-modal';
import type { AdminRoomRow } from '@/lib/admin/catalog';

export function RoomTable({ rows }: { rows: AdminRoomRow[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<AdminRoomRow | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setPending(rows[index].id);
    const result = await reorderRooms({ ids });
    setPending(null);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setPending(toDelete.id);
    const result = await deleteRoom({ id: toDelete.id });
    setPending(null);
    setToDelete(null);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface">
      <div className="divide-y divide-admin-outline-variant">
        {rows.map((row, index) => (
          <div key={row.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="font-bold text-admin-on-surface">{row.name}</div>
              <div className="text-xs text-admin-on-surface-variant">
                {row.slug} · {row.productCount} товаров
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === 0 || pending !== null}
                onClick={() => move(index, -1)}
                aria-label={`Поднять ${row.name}`}
              >
                <Icon name="arrow_upward" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === rows.length - 1 || pending !== null}
                onClick={() => move(index, 1)}
                aria-label={`Опустить ${row.name}`}
              >
                <Icon name="arrow_downward" />
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/catalog/rooms/${row.id}/edit`}>Изменить</Link>
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
        title="Удалить комнату?"
        description={toDelete ? `«${toDelete.name}» будет удалена безвозвратно.` : undefined}
      />
    </div>
  );
}

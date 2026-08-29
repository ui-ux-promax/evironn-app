import Link from 'next/link';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminRoomsForCatalog } from '@/lib/admin/catalog';
import { RoomTable } from './_components/room-table';
import { CatalogTabs } from '../_components/catalog-tabs';
import { CatalogStaticPager } from '../_components/catalog-static-pager';

export const metadata = { title: 'Комнаты' };
export const dynamic = 'force-dynamic';

export default async function RoomsPage() {
  await requireAdminPage();
  const rooms = await listAdminRoomsForCatalog();

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-5 rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-admin-on-surface-variant">
              Управление ассортиментом
            </p>
            <h1 className="mt-2 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-none tracking-tight text-admin-on-surface">
              Комнаты
            </h1>
            <p className="mt-3 max-w-[62ch] text-[13.5px] leading-6 text-admin-on-surface-variant">
              Комнаты для фильтрации и назначения товарам.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/catalog/rooms/new">
              <Icon name="add" className="text-[18px]" /> Добавить комнату
            </Link>
          </Button>
        </div>
        <CatalogTabs embedded />
      </header>

      <section
        aria-labelledby="room-registry-heading"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="border-b border-admin-outline-variant px-5 py-4">
          <h2 id="room-registry-heading" className="text-base font-medium text-admin-on-surface">
            Список комнат
          </h2>
          <p className="mt-1 text-xs text-admin-on-surface-variant">
            Порядок определяет порядок комнат в фильтрах витрины.
          </p>
        </div>
        {rooms.length > 0 ? (
          <RoomTable rows={rooms} />
        ) : (
          <div className="p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Комнат пока нет. Нажмите «Добавить комнату».
          </div>
        )}
        <CatalogStaticPager total={rooms.length} label="комнат" />
      </section>
    </div>
  );
}

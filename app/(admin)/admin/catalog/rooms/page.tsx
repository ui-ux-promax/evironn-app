import Link from 'next/link';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminRoomsForCatalog } from '@/lib/admin/catalog';
import { RoomTable } from './_components/room-table';

export const metadata = { title: 'Комнаты' };
export const dynamic = 'force-dynamic';

export default async function RoomsPage() {
  await requireAdminPage();
  const rooms = await listAdminRoomsForCatalog();
  const assignedProducts = rooms.reduce((total, room) => total + room.productCount, 0);

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title="Комнаты"
        subtitle="Управление комнатами, доступными для фильтрации и назначения товарам."
        action={
          <Button asChild>
            <Link href="/admin/catalog/rooms/new">
              <Icon name="add" className="text-[18px]" /> Добавить комнату
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
        <AdminKpiCard icon="meeting_room" label="Комнат" value={rooms.length.toLocaleString('ru-RU')} tone="primary" />
        <AdminKpiCard icon="inventory_2" label="Назначений товаров" value={assignedProducts.toLocaleString('ru-RU')} />
      </div>

      <AdminPanel title="Список комнат" note="Порядок определяет порядок комнат в фильтрах витрины.">
        {rooms.length > 0 ? (
          <RoomTable rows={rooms} />
        ) : (
          <div className="rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Комнат пока нет. Нажмите «Добавить комнату».
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

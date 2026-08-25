import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminRoomsForCatalog } from '@/lib/admin/catalog';
import { RoomForm } from '../../_components/room-form';

export const metadata = { title: 'Редактирование комнаты' };
export const dynamic = 'force-dynamic';

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const room = (await listAdminRoomsForCatalog()).find((item) => item.id === id);
  if (!room) notFound();

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader kicker="Каталог" title="Редактирование комнаты" subtitle={room.name} />
      <AdminPanel title="Данные комнаты">
        <RoomForm initial={room} />
      </AdminPanel>
    </div>
  );
}

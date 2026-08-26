import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { RoomForm } from '../_components/room-form';

export const metadata = { title: 'Новая комната' };

export default async function NewRoomPage() {
  await requireAdminPage();

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader kicker="Каталог" title="Новая комната" subtitle="Создание комнаты для каталога мебели." />
      <AdminPanel title="Данные комнаты">
        <RoomForm />
      </AdminPanel>
    </div>
  );
}

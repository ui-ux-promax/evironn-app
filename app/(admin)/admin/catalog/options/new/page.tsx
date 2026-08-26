import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { OptionGroupForm } from '../_components/option-group-form';

export const metadata = { title: 'Новая группа опций' };

export default async function NewOptionGroupPage() {
  await requireAdminPage();
  return (
    <div className="space-y-[24px]">
      <AdminPageHeader kicker="Каталог" title="Новая группа опций" subtitle="Создание оси вариантов для мебели." />
      <AdminPanel title="Данные группы">
        <OptionGroupForm />
      </AdminPanel>
    </div>
  );
}

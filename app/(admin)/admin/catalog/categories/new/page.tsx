import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { CategoryForm } from '../_components/category-form';

export const metadata = { title: 'Новая категория' };

export default function NewCategoryPage() {
  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title="Новая категория"
        subtitle="Создание категории каталога и обложки для витрины."
      />
      <AdminPanel title="Данные категории">
        <CategoryForm />
      </AdminPanel>
    </div>
  );
}

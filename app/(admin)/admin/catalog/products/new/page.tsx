import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { prisma } from '@/lib/prisma-client';
import { ProductForm } from '../_components/product-form';

export const metadata = { title: 'Новый товар' };
export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const [categories, brandRows] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.product.findMany({ distinct: ['brand'], orderBy: { brand: 'asc' }, select: { brand: true } }),
  ]);
  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title="Новый товар"
        subtitle="Создание карточки товара, расцветок и размерной сетки."
      />
      <AdminPanel title="Данные товара" note="Заполните базовые поля, добавьте изображения и варианты по размерам.">
        <ProductForm categories={categories} brands={brandRows.map((b) => b.brand)} />
      </AdminPanel>
    </div>
  );
}

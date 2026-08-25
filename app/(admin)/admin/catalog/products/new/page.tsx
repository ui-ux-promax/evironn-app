import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { listAdminOptionGroupsForCatalog, listAdminRoomsForCatalog } from '@/lib/admin/catalog';
import type { FurnitureProductValues } from '@/services/dto/product.dto';
import { ProductForm } from '../_components/product-form';

export const metadata = { title: 'Новый товар' };
export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireAdminPage();
  const [categories, brandRows, optionGroups, rooms] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.product.findMany({ distinct: ['brand'], orderBy: { brand: 'asc' }, select: { brand: true } }),
    listAdminOptionGroupsForCatalog(),
    listAdminRoomsForCatalog(),
  ]);
  const initialValues: FurnitureProductValues = {
    name: '',
    slug: '',
    brand: 'Evironn',
    categoryId: '',
    roomIds: [],
    description: '',
    specs: [],
    isBestseller: false,
    active: false,
    sortOrder: 0,
    optionGroups: optionGroups.map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      sortOrder: group.sortOrder,
      values: group.values.map((value) => ({
        id: value.id,
        name: value.name,
        slug: value.slug,
        ...(value.swatchHex ? { swatchHex: value.swatchHex } : {}),
        sortOrder: value.sortOrder,
      })),
    })),
    skus: [],
    media: [],
    turntable: false,
  };
  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title="Новый товар"
        subtitle="Создание карточки товара, расцветок и размерной сетки."
      />
      <AdminPanel title="Данные товара" note="Заполните базовые поля и настройте каноническую матрицу SKU.">
        <ProductForm
          initialValues={initialValues}
          categories={categories}
          brands={brandRows.map((b) => b.brand)}
          availableRooms={rooms}
        />
      </AdminPanel>
    </div>
  );
}

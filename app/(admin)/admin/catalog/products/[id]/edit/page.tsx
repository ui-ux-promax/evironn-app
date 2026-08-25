import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { getAdminProductDraft, listAdminRoomsForCatalog } from '@/lib/admin/catalog';
import { ProductForm, type ProductFormInitial } from '../../_components/product-form';

export const metadata = { title: 'Редактирование товара' };
export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [draft, categories, brandRows, rooms] = await Promise.all([
    getAdminProductDraft(id),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.product.findMany({ distinct: ['brand'], orderBy: { brand: 'asc' }, select: { brand: true } }),
    listAdminRoomsForCatalog(),
  ]);
  if (!draft) notFound();

  const selectedRoomIds = rooms.filter((room) => draft.values.roomIds.includes(room.slug)).map((room) => room.slug);
  const initial: ProductFormInitial = { id, ...draft.values };

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader kicker="Каталог" title="Редактирование товара" subtitle={draft.values.name} />
      <AdminPanel
        title="Данные товара"
        note="Изменения применятся после сохранения. Существующие SKU сохраняют свои immutable selections."
      >
        <ProductForm
          initial={initial}
          categories={categories}
          brands={brandRows.map((b) => b.brand)}
          availableRooms={rooms}
          selectedRoomIds={selectedRoomIds}
        />
      </AdminPanel>
    </div>
  );
}

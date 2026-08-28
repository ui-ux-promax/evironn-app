import { notFound } from 'next/navigation';
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

  const initial: ProductFormInitial = { id, ...draft.values };

  return (
    <ProductForm
      initial={initial}
      categories={categories}
      brands={brandRows.map((b) => b.brand)}
      availableRooms={rooms}
    />
  );
}

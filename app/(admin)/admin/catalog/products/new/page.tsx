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
    <ProductForm
      initialValues={initialValues}
      categories={categories}
      brands={brandRows.map((b) => b.brand)}
      availableRooms={rooms}
    />
  );
}

import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { prisma } from '@/lib/prisma-client';
import { ProductForm, type ProductFormInitial } from '../../_components/product-form';
import type { ProductValues } from '@/services/dto/product.dto';
import { CLOTHING_SIZES, type ClothingSize } from '@/constants/config';

export const metadata = { title: 'Редактирование товара' };
export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, brandRows] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        colorways: {
          orderBy: { sortOrder: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            variants: {
              orderBy: [{ sizeOrder: 'asc' }, { size: 'asc' }],
              include: { _count: { select: { orderItems: true } } },
            },
          },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.product.findMany({ distinct: ['brand'], orderBy: { brand: 'asc' }, select: { brand: true } }),
  ]);
  if (!product) notFound();

  const specsObj = (product.specs ?? {}) as Record<string, string>;
  const referencedVariantIds: string[] = [];
  const clothingSizeSet = new Set<string>(CLOTHING_SIZES);

  const initial: ProductFormInitial = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    gender: product.gender,
    categoryId: product.categoryId,
    description: product.description ?? '',
    fitNote: product.fitNote ?? '',
    specs: Object.entries(specsObj).map(([key, value]) => ({ key, value: String(value) })),
    isBestseller: product.isBestseller,
    active: product.active,
    sortOrder: product.sortOrder,
    colorways: product.colorways.map((c): ProductValues['colorways'][number] => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      swatchHex: c.swatchHex ?? undefined,
      isDefault: c.isDefault,
      images: c.images.map((im) => ({
        url: im.url,
        publicId: im.publicId ?? undefined,
        alt: im.alt ?? undefined,
        width: 0,
        height: 0,
        format: '',
        bytes: 0,
        persisted: true,
      })),
      variants: c.variants.map((v) => {
        if (v._count.orderItems > 0) referencedVariantIds.push(v.id);
        if (!clothingSizeSet.has(v.size)) {
          throw new Error(`Unexpected product variant size: ${v.size}`);
        }
        return {
          id: v.id,
          size: v.size as ClothingSize,
          sizeOrder: v.sizeOrder,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          active: v.active,
        };
      }),
    })),
  };

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader kicker="Каталог" title="Редактирование товара" subtitle={product.name} />
      <AdminPanel
        title="Данные товара"
        note="Изменения применятся после сохранения. Варианты из заказов нельзя удалить, только деактивировать."
      >
        <ProductForm
          initial={initial}
          categories={categories}
          brands={brandRows.map((b) => b.brand)}
          referencedVariantIds={referencedVariantIds}
        />
      </AdminPanel>
    </div>
  );
}

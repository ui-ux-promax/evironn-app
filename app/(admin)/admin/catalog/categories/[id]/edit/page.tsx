import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { prisma } from '@/lib/prisma-client';
import { CategoryForm } from '../../_components/category-form';

export const metadata = { title: 'Редактирование категории' };
export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, tagline: true, coverImage: true, coverImagePublicId: true },
  });
  if (!category) notFound();

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader kicker="Каталог" title="Редактирование категории" subtitle={category.name} />
      <AdminPanel title="Данные категории">
        <CategoryForm initial={category} />
      </AdminPanel>
    </div>
  );
}

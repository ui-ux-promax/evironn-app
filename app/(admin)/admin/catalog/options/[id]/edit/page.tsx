import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { OptionGroupForm } from '../../_components/option-group-form';

export const metadata = { title: 'Редактирование группы опций' };
export const dynamic = 'force-dynamic';

export default async function EditOptionGroupPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const group = await prisma.optionGroup.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
      values: {
        orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
        select: { id: true, name: true, slug: true, swatchHex: true, sortOrder: true },
      },
    },
  });
  if (!group) notFound();

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title="Редактирование группы опций"
        subtitle="Обновление значений и порядка оси."
      />
      <AdminPanel title="Данные группы">
        <OptionGroupForm initial={group} />
      </AdminPanel>
    </div>
  );
}

import Link from 'next/link';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminOptionGroupsForCatalog } from '@/lib/admin/catalog';
import { OptionGroupTable } from './_components/option-group-table';

export const metadata = { title: 'Опции' };
export const dynamic = 'force-dynamic';

export default async function OptionsPage() {
  await requireAdminPage();
  const groups = await listAdminOptionGroupsForCatalog();
  const valueCount = groups.reduce((total, group) => total + group.values.length, 0);

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title="Опции"
        subtitle="Группы характеристик и значения, доступные в матрице мебели."
        action={
          <Button asChild>
            <Link href="/admin/catalog/options/new">
              <Icon name="add" className="text-[18px]" /> Добавить группу
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
        <AdminKpiCard icon="tune" label="Групп опций" value={groups.length.toLocaleString('ru-RU')} tone="primary" />
        <AdminKpiCard icon="list" label="Значений" value={valueCount.toLocaleString('ru-RU')} />
      </div>

      <AdminPanel title="Группы опций" note="Порядок групп определяет порядок осей в матрице вариантов товара.">
        {groups.length > 0 ? (
          <OptionGroupTable rows={groups} />
        ) : (
          <div className="rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Групп опций пока нет. Нажмите «Добавить группу».
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

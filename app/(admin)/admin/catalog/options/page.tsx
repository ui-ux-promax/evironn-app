import Link from 'next/link';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminOptionGroupsForCatalog } from '@/lib/admin/catalog';
import { OptionGroupTable } from './_components/option-group-table';
import { CatalogTabs } from '../_components/catalog-tabs';
import { CatalogStaticPager } from '../_components/catalog-static-pager';

export const metadata = { title: 'Опции' };
export const dynamic = 'force-dynamic';

export default async function OptionsPage() {
  await requireAdminPage();
  const groups = await listAdminOptionGroupsForCatalog();

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-5 rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-admin-on-surface-variant">
              Управление ассортиментом
            </p>
            <h1 className="mt-2 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-none tracking-tight text-admin-on-surface">
              Опции
            </h1>
            <p className="mt-3 max-w-[62ch] text-[13.5px] leading-6 text-admin-on-surface-variant">
              Группы характеристик и значения в матрице мебели.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/catalog/options/new">
              <Icon name="add" className="text-[18px]" /> Добавить группу
            </Link>
          </Button>
        </div>
        <CatalogTabs embedded />
      </header>

      <section
        aria-labelledby="option-registry-heading"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="border-b border-admin-outline-variant px-5 py-4">
          <h2 id="option-registry-heading" className="text-base font-medium text-admin-on-surface">
            Группы опций
          </h2>
          <p className="mt-1 text-xs text-admin-on-surface-variant">
            Порядок групп определяет порядок осей в матрице вариантов товара.
          </p>
        </div>
        {groups.length > 0 ? (
          <OptionGroupTable rows={groups} />
        ) : (
          <div className="p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Групп опций пока нет. Нажмите «Добавить группу».
          </div>
        )}
        <CatalogStaticPager total={groups.length} label="групп опций" />
      </section>
    </div>
  );
}

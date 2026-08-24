/**
 * /admin/catalog — Категории каталога (Phase 3.2).
 * Список + reorder + ссылки на создание/редактирование. Товары (Product CRUD) — Phase 3.3.
 */

import Link from 'next/link';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { CategoryTable, type CategoryRow } from './_components/category-table';

export const metadata = { title: 'Категории' };
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  await requireAdminPage();
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      coverImage: true,
      _count: { select: { products: true } },
    },
  });

  const rows: CategoryRow[] = categories.map(({ _count, ...c }) => ({
    ...c,
    productCount: _count.products,
  }));
  const linkedProducts = rows.reduce((sum, row) => sum + row.productCount, 0);
  const categoriesWithCovers = rows.filter((row) => row.coverImage).length;

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title="Категории"
        subtitle="Управление навигацией витрины, обложками и порядком вывода."
        action={
          <Button asChild>
            <Link href="/admin/catalog/categories/new">
              <Icon name="add" className="text-[18px]" /> Добавить категорию
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
        <AdminKpiCard icon="category" label="Категорий" value={rows.length.toLocaleString('ru-RU')} tone="primary" />
        <AdminKpiCard icon="inventory_2" label="Товаров в категориях" value={linkedProducts.toLocaleString('ru-RU')} />
        <AdminKpiCard icon="image" label="С обложками" value={categoriesWithCovers.toLocaleString('ru-RU')} />
      </div>

      <AdminPanel
        title="Список категорий"
        note="Стрелки меняют порядок категорий на витрине. Удаление заблокировано, если внутри есть товары."
      >
        {rows.length > 0 ? (
          <CategoryTable rows={rows} />
        ) : (
          <div className="rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Категорий пока нет. Нажмите «Добавить категорию».
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

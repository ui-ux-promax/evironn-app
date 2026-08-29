/**
 * /admin/catalog — Категории каталога (Phase 3.2).
 * Список + reorder + ссылки на создание/редактирование. Товары (Product CRUD) — Phase 3.3.
 */

import Link from 'next/link';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { listAdminCatalogProducts, listAdminCategoriesForCatalog } from '@/lib/admin/catalog';
import { CategoryTurntableBinding } from './_components/category-form';
import { CategoryTable, type CategoryRow } from './_components/category-table';
import { CatalogTabs } from '../_components/catalog-tabs';
import { CatalogStaticPager } from '../_components/catalog-static-pager';

export const metadata = { title: 'Категории' };
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  await requireAdminPage();
  const [categories, canonicalCategories, catalogProducts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        coverImage: true,
        _count: { select: { products: true } },
      },
    }),
    listAdminCategoriesForCatalog(),
    listAdminCatalogProducts({ page: 1, limit: 200, sort: 'name' }),
  ]);

  const rows: CategoryRow[] = categories.map(({ _count, ...c }) => ({
    ...c,
    productCount: _count.products,
  }));
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-5 rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-admin-on-surface-variant">
              Управление ассортиментом
            </p>
            <h1 className="mt-2 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-none tracking-tight text-admin-on-surface">
              Категории
            </h1>
            <p className="mt-3 max-w-[62ch] text-[13.5px] leading-6 text-admin-on-surface-variant">
              Навигация витрины, обложки и порядок вывода категорий.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/catalog/categories/new">
              <Icon name="add" className="text-[18px]" /> Добавить категорию
            </Link>
          </Button>
        </div>
        <CatalogTabs embedded />
      </header>

      <section
        className="rounded-[20px] border border-admin-outline-variant bg-admin-surface p-5 shadow-[var(--admin-shadow-tight)]"
        aria-label="360-карусель"
      >
        <div className="mb-[18px]">
          <h2 className="text-base font-medium text-admin-on-surface">360-карусель</h2>
          <p className="mt-1 text-xs text-admin-on-surface-variant">
            Одна категория может иметь один товар с полным комплектом 360-медиа.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {canonicalCategories.map((category) => (
            <CategoryTurntableBinding key={category.id} category={category} products={catalogProducts.rows} />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="category-registry-heading"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="border-b border-admin-outline-variant px-5 py-4">
          <h2 id="category-registry-heading" className="text-base font-medium text-admin-on-surface">
            Список категорий
          </h2>
          <p className="mt-1 text-xs text-admin-on-surface-variant">
            Стрелки меняют порядок категорий на витрине. Удаление заблокировано, если внутри есть товары.
          </p>
        </div>
        {rows.length > 0 ? (
          <CategoryTable rows={rows} />
        ) : (
          <div className="p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Категорий пока нет. Нажмите «Добавить категорию».
          </div>
        )}
        <CatalogStaticPager total={rows.length} label="категорий" />
      </section>
    </div>
  );
}

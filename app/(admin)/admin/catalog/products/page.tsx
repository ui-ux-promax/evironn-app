import Link from 'next/link';
import { Icon } from '@/components/admin/icon';
import { parsePaginationParams, readEnumParam, readSearchQuery } from '@/lib/admin/pagination';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminCatalogProducts, listAdminCategoriesForCatalog, listAdminRoomsForCatalog } from '@/lib/admin/catalog';
import { CatalogTabs } from '../_components/catalog-tabs';
import { ProductFilters } from './_components/product-filters';
import { ProductTable, type ProductRow } from './_components/product-table';

export const metadata = { title: 'Товары' };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const { page, limit } = parsePaginationParams(sp, { limit: 20 });
  const q = readSearchQuery(sp);
  const categoryId = typeof sp.categoryId === 'string' ? sp.categoryId : undefined;
  const roomId = typeof sp.roomId === 'string' ? sp.roomId : undefined;
  const status = readEnumParam(sp, 'status', ['all', 'active', 'inactive', 'incomplete'] as const) ?? 'all';
  const sort = readEnumParam(sp, 'sort', ['sortOrder', 'name', 'minPrice', 'stock'] as const) ?? 'sortOrder';

  const [catalog, categories, rooms] = await Promise.all([
    listAdminCatalogProducts({ page, limit, q, categoryId, roomId, status, sort }),
    listAdminCategoriesForCatalog(),
    listAdminRoomsForCatalog(),
  ]);

  const total = catalog.total;
  const rows: ProductRow[] = catalog.rows;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-5 rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-admin-on-surface-variant">
              Управление ассортиментом
            </p>
            <h1 className="mt-2 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-none tracking-tight text-admin-on-surface">
              Каталог товаров
            </h1>
            <p className="mt-3 max-w-[62ch] text-[13.5px] leading-6 text-admin-on-surface-variant">
              Карточки, варианты, цены и доступность товаров в одном рабочем списке.
            </p>
          </div>

          <Link
            href="/admin/catalog/products/new"
            className="inline-flex min-h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-[14px] bg-admin-primary px-5 text-sm font-bold text-white transition-colors hover:bg-admin-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2"
          >
            <Icon name="add" className="text-[18px]" />
            Добавить товар
          </Link>
        </div>

        <CatalogTabs embedded productCount={total} />
      </header>

      <ProductFilters options={{ categories, rooms }} />

      <section
        aria-labelledby="product-registry-heading"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="flex flex-col gap-3 border-b border-admin-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="product-registry-heading" className="text-base font-medium text-admin-on-surface">
              Товарный реестр
            </h2>
            <p className="mt-1 text-[13px] text-admin-on-surface-variant">
              {total} товаров · сведения об остатках и ценах обновлены
            </p>
          </div>
          <button
            type="button"
            aria-label="Экспортировать каталог"
            className="inline-flex min-h-9 w-fit items-center justify-center gap-2 rounded-[10px] border border-admin-outline-variant px-3.5 text-xs font-bold text-admin-on-surface-variant transition-colors hover:bg-admin-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary focus-visible:ring-offset-2"
          >
            <Icon name="download" className="text-[18px]" />
            Экспорт
          </button>
        </div>

        {rows.length > 0 ? (
          <ProductTable
            rows={rows}
            page={catalog.page}
            totalPages={catalog.pageCount}
            total={total}
            limit={catalog.limit}
          />
        ) : (
          <div className="p-10 text-center text-sm font-bold text-admin-on-surface-variant">Товары не найдены.</div>
        )}
      </section>
    </div>
  );
}

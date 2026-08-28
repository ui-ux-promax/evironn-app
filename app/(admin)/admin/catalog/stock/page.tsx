import { CatalogTabs } from '../_components/catalog-tabs';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminSkuStock } from '@/lib/admin/catalog';
import { parsePaginationParams, readEnumParam, readSearchQuery } from '@/lib/admin/pagination';
import { StockTable } from './_components/stock-table';

export const metadata = { title: 'Остатки' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function StockPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdminPage();
  const params = await searchParams;
  const { page, limit } = parsePaginationParams(params, { limit: 20 });
  const q = readSearchQuery(params);
  const status = readEnumParam(params, 'status', ['all', 'active', 'inactive'] as const) ?? 'all';
  const sort = readEnumParam(params, 'sort', ['stock', 'articleNumber', 'productName'] as const) ?? 'stock';
  const stock = await listAdminSkuStock({ page, limit, q, status, sort });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-5 rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-admin-on-surface-variant">
            Управление ассортиментом
          </p>
          <h1 className="mt-2 text-[clamp(2rem,3.2vw,2.75rem)] font-medium leading-none tracking-tight text-admin-on-surface">
            Остатки
          </h1>
          <p className="mt-3 max-w-[62ch] text-[13.5px] leading-6 text-admin-on-surface-variant">
            Остатки SKU и доступность товаров в рабочем списке.
          </p>
        </div>
        <CatalogTabs embedded />
      </header>

      <section
        aria-labelledby="stock-registry-heading"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="border-b border-admin-outline-variant px-5 py-4">
          <h2 id="stock-registry-heading" className="text-base font-medium text-admin-on-surface">
            SKU и остатки
          </h2>
          <p className="mt-1 text-xs text-admin-on-surface-variant">
            Сохранение возможно только при совпадении прочитанного остатка.
          </p>
        </div>
        {stock.rows.length > 0 ? (
          <StockTable
            rows={stock.rows}
            page={stock.page}
            totalPages={stock.pageCount}
            total={stock.total}
            limit={stock.limit}
          />
        ) : (
          <div className="p-10 text-center text-sm font-bold text-admin-on-surface-variant">SKU не найдены.</div>
        )}
      </section>
    </div>
  );
}

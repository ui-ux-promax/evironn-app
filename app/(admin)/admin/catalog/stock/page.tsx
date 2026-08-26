import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
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
  const zeroStock = stock.rows.filter((row) => row.stock === 0).length;

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title={`Остатки (${stock.total})`}
        subtitle="Изменение остатков SKU с защитой от перезаписи параллельными операциями."
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
        <AdminKpiCard icon="inventory_2" label="Всего SKU" value={stock.total.toLocaleString('ru-RU')} tone="primary" />
        <AdminKpiCard icon="edit_note" label="На странице" value={stock.rows.length.toLocaleString('ru-RU')} />
        <AdminKpiCard icon="warning" label="Нулевой остаток" value={zeroStock.toLocaleString('ru-RU')} tone="danger" />
      </div>

      <AdminPanel
        title="SKU и остатки"
        note="Сохранение возможно только при совпадении остатка, который был прочитан оператором."
      >
        {stock.rows.length > 0 ? (
          <StockTable
            rows={stock.rows}
            page={stock.page}
            totalPages={stock.pageCount}
            total={stock.total}
            limit={stock.limit}
          />
        ) : (
          <div className="rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            SKU не найдены.
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

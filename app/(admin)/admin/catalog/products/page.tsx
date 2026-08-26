import Link from 'next/link';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { prisma } from '@/lib/prisma-client';
import { parsePaginationParams, readSearchQuery, readEnumParam } from '@/lib/admin/pagination';
import { formatPrice } from '@/lib/format';
import { ProductFilters } from './_components/product-filters';
import { ProductTable, type ProductRow } from './_components/product-table';
import { ViewToggle } from './_components/view-toggle';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminCatalogProducts, listAdminCategoriesForCatalog, listAdminRoomsForCatalog } from '@/lib/admin/catalog';

export const metadata = { title: 'Товары' };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

const LOW_STOCK_TOTAL = 200; // порог для подписи «Здоровый/Низкий» на карточке остатка

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const { page, limit } = parsePaginationParams(sp, { limit: 20 });
  const q = readSearchQuery(sp);
  const categoryId = typeof sp.categoryId === 'string' ? sp.categoryId : undefined;
  const roomId = typeof sp.roomId === 'string' ? sp.roomId : undefined;
  const status = readEnumParam(sp, 'status', ['all', 'active', 'inactive', 'incomplete'] as const) ?? 'all';
  const sort = readEnumParam(sp, 'sort', ['sortOrder', 'name', 'minPrice', 'stock'] as const) ?? 'sortOrder';

  const [catalog, categories, rooms, stockAgg, topBrandRows, salesAgg] = await Promise.all([
    listAdminCatalogProducts({ page, limit, q, categoryId, roomId, status, sort }),
    listAdminCategoriesForCatalog(),
    listAdminRoomsForCatalog(),
    prisma.sku.aggregate({ _sum: { stock: true }, where: { product: { active: true } } }),
    prisma.product.groupBy({
      by: ['brand'],
      _sum: { salesCount: true },
      orderBy: { _sum: { salesCount: 'desc' } },
      take: 1,
    }),
    prisma.orderItem.aggregate({ _sum: { lineTotal: true } }),
  ]);

  const total = catalog.total;
  const rows: ProductRow[] = catalog.rows;

  const stockTotal = stockAgg._sum.stock ?? 0;
  const topBrand = topBrandRows[0]?.brand ?? '—';
  const salesValue = salesAgg._sum.lineTotal ?? 0;

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title={`Товары (${total})`}
        subtitle="Управление карточками, остатками, ценами и статусами витрины."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <ViewToggle />
            <Button asChild>
              <Link href="/admin/catalog/products/new">
                <Icon name="add" className="text-[18px]" /> Добавить товар
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
        <AdminKpiCard icon="trending_up" label="Объем продаж" value={formatPrice(salesValue)} tone="primary" />
        <AdminKpiCard
          icon="inventory_2"
          label="Текущий остаток"
          value={stockTotal.toLocaleString('ru-RU')}
          delta={stockTotal >= LOW_STOCK_TOTAL ? 'Здоровый' : 'Низкий'}
          tone={stockTotal >= LOW_STOCK_TOTAL ? 'default' : 'danger'}
        />
        <AdminKpiCard icon="workspace_premium" label="Лидер продаж" value={topBrand} delta="Топ-бренд" />
      </div>

      <AdminPanel
        title="Каталог товаров"
        note="Поиск работает по названию, slug и SKU. Фильтры сбрасывают пагинацию."
        actions={
          <div className="text-[13px] font-bold text-admin-on-surface-variant">
            Показано <b className="font-mono text-admin-on-surface">{total}</b> товаров
          </div>
        }
      >
        <ProductFilters options={{ categories, rooms }} />

        {rows.length > 0 ? (
          <ProductTable
            rows={rows}
            page={catalog.page}
            totalPages={catalog.pageCount}
            total={total}
            limit={catalog.limit}
          />
        ) : (
          <div className="mt-[18px] rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Товары не найдены.
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

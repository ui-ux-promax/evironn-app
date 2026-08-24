import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { prisma } from '@/lib/prisma-client';
import { parsePaginationParams, buildPaginationMeta, readSearchQuery, readEnumParam } from '@/lib/admin/pagination';
import { GENDER_VALUES } from '@/services/dto/product.dto';
import { formatPrice } from '@/lib/format';
import { formatAddedAgo } from '@/lib/relative-time';
import { ProductFilters } from './_components/product-filters';
import { ProductTable, type ProductRow } from './_components/product-table';
import { ViewToggle } from './_components/view-toggle';
import { requireAdminPage } from '@/lib/admin/require-admin';

export const metadata = { title: 'Товары' };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

const LOW_STOCK_TOTAL = 200; // порог для подписи «Здоровый/Низкий» на карточке остатка

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const { page, limit, skip } = parsePaginationParams(sp, { limit: 20 });
  const q = readSearchQuery(sp);
  const brand = readEnumParam(sp, 'brand', await brandValues());
  const gender = readEnumParam(sp, 'gender', GENDER_VALUES);
  const categoryId = typeof sp.category === 'string' ? sp.category : undefined;
  const status = readEnumParam(sp, 'status', ['active', 'inactive'] as const);
  const view = sp.view === 'recent' ? 'recent' : 'all';

  const where: Prisma.ProductWhereInput = {
    ...(status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {}),
    ...(brand ? { brand } : {}),
    ...(gender ? { gender } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
            { colorways: { some: { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    view === 'recent' ? [{ createdAt: 'desc' }] : [{ sortOrder: 'asc' }, { createdAt: 'desc' }];

  const [total, products, categories, brandList, stockAgg, topBrandRows, salesAgg] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        brand: true,
        minPrice: true,
        discountPct: true,
        active: true,
        createdAt: true,
        category: { select: { name: true } },
        colorways: {
          orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
          select: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
            variants: { select: { stock: true } },
          },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.product.findMany({ distinct: ['brand'], orderBy: { brand: 'asc' }, select: { brand: true } }),
    // Bento: суммарный сток активных товаров
    prisma.productVariant.aggregate({ _sum: { stock: true }, where: { colorway: { product: { active: true } } } }),
    // Bento: бренд-лидер по salesCount
    prisma.product.groupBy({
      by: ['brand'],
      _sum: { salesCount: true },
      orderBy: { _sum: { salesCount: 'desc' } },
      take: 1,
    }),
    // Bento: объём продаж = сумма позиций всех заказов
    prisma.orderItem.aggregate({ _sum: { lineTotal: true } }),
  ]);

  const meta = buildPaginationMeta({ page, limit }, total);
  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    categoryName: p.category.name,
    coverImage: p.colorways[0]?.images[0]?.url ?? null,
    minPrice: p.minPrice,
    discountPct: p.discountPct,
    totalStock: p.colorways.reduce((s, c) => s + c.variants.reduce((a, v) => a + v.stock, 0), 0),
    active: p.active,
    addedAgo: formatAddedAgo(p.createdAt),
  }));

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
        <ProductFilters options={{ brands: brandList.map((b) => b.brand), categories }} />

        {rows.length > 0 ? (
          <ProductTable rows={rows} page={meta.page} totalPages={meta.totalPages} total={total} limit={limit} />
        ) : (
          <div className="mt-[18px] rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Товары не найдены.
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

// distinct-бренды как readonly-кортеж для readEnumParam (валидация значения фильтра).
async function brandValues(): Promise<readonly string[]> {
  const rows = await prisma.product.findMany({ distinct: ['brand'], select: { brand: true } });
  return rows.map((r) => r.brand);
}

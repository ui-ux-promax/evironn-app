import { prisma } from '@/lib/prisma-client';
import { requireAdminPage } from '@/lib/admin/require-admin';
import {
  getAdminCatalogKpis,
  getAdminLowStockSkus,
  getBestSellers,
  getKpiSeries,
  getKpis,
  getRecentOrders,
  getStatusDistribution,
  resolvePeriod,
} from '@/lib/admin/analytics';
import { DashboardView } from './_components/dashboard-view';

export const metadata = { title: 'Дашборд' };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requireAdminPage();
  const sp = await searchParams;
  const range = resolvePeriod(sp, new Date());

  const [kpis, kpiSeries, statusDist, bestSellers, lowStock, recentOrders, catalog, pendingPayments] =
    await Promise.all([
      getKpis(prisma, range),
      getKpiSeries(prisma, range),
      getStatusDistribution(prisma),
      getBestSellers(prisma, range),
      getAdminLowStockSkus(prisma),
      getRecentOrders(prisma),
      getAdminCatalogKpis(prisma),
      prisma.order.count({ where: { payment: { is: { status: 'pending' } }, status: 'PENDING' } }),
    ]);

  return (
    <DashboardView
      user={session.user}
      periodLabel={`${range.days === 7 ? 'Последние 7 дней' : range.days === 30 ? 'Последние 30 дней' : 'Последние 90 дней'}, все каналы продаж`}
      kpis={kpis}
      kpiSeries={kpiSeries}
      statusDist={statusDist}
      bestSellers={bestSellers}
      lowStock={lowStock}
      recentOrders={recentOrders}
      catalog={catalog}
      pendingPayments={pendingPayments}
    />
  );
}

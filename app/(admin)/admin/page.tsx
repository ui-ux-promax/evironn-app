import { prisma } from '@/lib/prisma-client';
import { requireAdminPage } from '@/lib/admin/require-admin';
import {
  getAdminCategoryDistribution,
  getAdminFunnelProjection,
  getBestSellers,
  getKpiSeries,
  getKpis,
  getRecentOrders,
  resolvePeriod,
} from '@/lib/admin/analytics';
import { createDashboardReferenceModel } from './_components/create-dashboard-reference-model';
import { DashboardReferenceView } from './_components/dashboard-reference-view';

export const metadata = { title: 'Дашборд' };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();

  const sp = await searchParams;
  const range = resolvePeriod(sp, new Date());

  const [kpis, kpiSeries, bestSellers, recentOrders, categoryDistribution, funnel] = await Promise.all([
    getKpis(prisma, range),
    getKpiSeries(prisma, range),
    getBestSellers(prisma, range),
    getRecentOrders(prisma),
    getAdminCategoryDistribution(prisma, range),
    getAdminFunnelProjection(prisma, range),
  ]);

  const model = createDashboardReferenceModel({
    period: range.days,
    kpis,
    kpiSeries,
    bestSellers,
    recentOrders,
    categoryDistribution,
    funnel,
  });

  return <DashboardReferenceView model={model} />;
}

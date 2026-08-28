import type { Prisma } from '@prisma/client';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { readSearchQuery, readEnumParam } from '@/lib/admin/pagination';
import { normalizeCouponCode } from '@/lib/coupon';
import { couponStatus } from '@/lib/coupon-status';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { CouponFilters } from './_components/coupon-filters';
import { CouponTable, type CouponRow } from './_components/coupon-table';

export const metadata = { title: 'Промокоды' };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;
const STATUS_VALUES = ['active', 'inactive', 'expired'] as const;

export default async function MarketingPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = readSearchQuery(sp);
  const status = readEnumParam(sp, 'status', STATUS_VALUES);
  const now = new Date();

  const where: Prisma.CouponWhereInput = {
    ...(q ? { code: { contains: normalizeCouponCode(q) } } : {}),
    ...(status === 'active'
      ? { active: true, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }
      : status === 'inactive'
        ? { active: false, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }
        : status === 'expired'
          ? { expiresAt: { lt: now } }
          : {}),
  };

  const coupons = await prisma.coupon.findMany({ where, orderBy: { createdAt: 'desc' } });

  const rows: CouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    percent: c.percent,
    active: c.active,
    status: couponStatus(c, now),
    expiresLabel: c.expiresAt ? formatDate(c.expiresAt) : 'Бессрочный',
    createdLabel: formatDate(c.createdAt),
  }));
  const activeCount = rows.filter((row) => row.status === 'active').length;
  const inactiveCount = rows.filter((row) => row.status === 'inactive').length;
  const expiredCount = rows.filter((row) => row.status === 'expired').length;
  const averagePercent = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length) : 0;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        className="rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7"
        kicker="Маркетинговые правила"
        title="Промокоды"
        subtitle="Скидки, условия активации и эффективность предложений."
        action={
          <Button asChild>
            <Link href="/admin/marketing/new">
              <Icon name="add" className="text-[18px]" /> Добавить промокод
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели промокодов">
        <CouponKpi label="Активные" value={activeCount.toLocaleString('ru-RU')} detail="В действии" />
        <CouponKpi label="Всего правил" value={rows.length.toLocaleString('ru-RU')} detail="Текущий результат" />
        <CouponKpi label="Средняя скидка" value={`${averagePercent}%`} detail="По текущей выборке" />
        <CouponKpi label="Истекли" value={expiredCount.toLocaleString('ru-RU')} detail="Остаются в истории" />
      </div>

      <CouponFilters />

      <section
        aria-labelledby="coupon-registry-heading"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="flex flex-col gap-3 border-b border-admin-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="coupon-registry-heading" className="text-base font-medium text-admin-on-surface">
              Реестр промокодов
            </h2>
            <p className="mt-1 text-xs text-admin-on-surface-variant">
              {rows.length} правил · данные обновлены недавно
            </p>
          </div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-9 w-fit items-center rounded-[10px] border border-admin-outline-variant px-3.5 text-xs font-bold text-admin-on-surface-variant"
          >
            Экспорт
          </button>
        </div>

        {rows.length > 0 ? (
          <CouponTable rows={rows} page={1} totalPages={1} total={rows.length} limit={Math.max(rows.length, 1)} />
        ) : (
          <div className="p-10 text-center text-sm font-bold text-admin-on-surface-variant">Промокоды не найдены.</div>
        )}
      </section>
    </div>
  );
}

function CouponKpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[20px] border border-admin-outline-variant bg-admin-surface p-5 shadow-[var(--admin-shadow-tight)]">
      <p className="text-xs font-semibold text-admin-on-surface-variant">{label}</p>
      <p className="mt-2 font-admin-head text-3xl font-medium tracking-tight text-admin-on-surface tabular-nums">
        {value}
      </p>
      <span className="mt-3 inline-flex rounded-full bg-admin-surface-low px-2.5 py-1 text-[11px] font-bold text-admin-on-surface-variant">
        {detail}
      </span>
    </article>
  );
}

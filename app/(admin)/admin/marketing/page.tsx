import type { Prisma } from '@prisma/client';
import Link from 'next/link';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
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

export const metadata = { title: 'Купоны' };
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
        ? { active: false }
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
  const avgPercent = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length) : 0;

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Маркетинг"
        title={`Промокоды (${rows.length})`}
        subtitle="Процентные промокоды на сумму товаров, статусы и сроки действия."
        action={
          <Button asChild>
            <Link href="/admin/marketing/new">
              <Icon name="add" className="text-[18px]" /> Добавить промокод
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard
          icon="confirmation_number"
          label="Активных кодов"
          value={activeCount.toLocaleString('ru-RU')}
          tone="primary"
        />
        <AdminKpiCard icon="pause_circle" label="Выключены" value={inactiveCount.toLocaleString('ru-RU')} />
        <AdminKpiCard
          icon="event_busy"
          label="Истекли"
          value={expiredCount.toLocaleString('ru-RU')}
          tone={expiredCount > 0 ? 'danger' : 'default'}
        />
        <AdminKpiCard icon="percent" label="Средняя скидка" value={`${avgPercent}%`} />
      </div>

      <AdminPanel
        title="Управление промокодами"
        note="Коды нормализуются в верхний регистр. Истекшие промокоды остаются в истории."
        actions={
          <div className="text-[13px] font-bold text-admin-on-surface-variant">
            Показано <b className="font-mono text-admin-on-surface">{rows.length}</b> кодов
          </div>
        }
      >
        <div className="mb-[18px] flex flex-wrap gap-[10px]">
          <CouponStatusPill label="Активные" value={activeCount} className="bg-[#dff1e8] text-[#20724f]" />
          <CouponStatusPill
            label="Выключены"
            value={inactiveCount}
            className="bg-admin-surface-low text-admin-on-surface-variant"
          />
          <CouponStatusPill label="Истекли" value={expiredCount} className="bg-[#fee6e5] text-[#c64238]" />
        </div>

        <CouponFilters />

        {rows.length > 0 ? (
          <CouponTable rows={rows} />
        ) : (
          <div className="mt-[18px] rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Промокоды не найдены.
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function CouponStatusPill({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-admin-outline-variant bg-admin-surface px-[10px] py-1.5 shadow-[var(--admin-shadow-tight)]">
      <span className={`inline-flex min-h-[32px] items-center rounded-full px-3 text-[13px] font-bold ${className}`}>
        {label}
      </span>
      <b className="pr-1 font-admin-head text-[18px] font-extrabold leading-none tracking-[-.04em] text-admin-on-surface tabular-nums">
        {value}
      </b>
    </div>
  );
}

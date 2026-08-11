import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { getDemoAdminSnapshot } from '@/lib/demo-admin/fixtures';

export default function DemoMarketingPage() {
  const { coupons } = getDemoAdminSnapshot();
  const activeCount = coupons.filter((coupon) => coupon.active).length;
  const maxPercent = Math.max(...coupons.map((coupon) => coupon.percent));

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Маркетинг"
        title="Промокоды"
        subtitle="Демо-копия маркетингового раздела: коды, скидки, статусы, сроки без создания и редактирования."
        searchPlaceholder="Поиск промокодов отключён"
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
        <AdminKpiCard icon="confirmation_number" label="Промокодов" value={String(coupons.length)} tone="primary" />
        <AdminKpiCard icon="check_circle" label="Активные" value={String(activeCount)} />
        <AdminKpiCard icon="percent" label="Макс. скидка" value={`${maxPercent}%`} />
      </div>

      <DemoDataTable
        title="Промокоды"
        note="Read-only режим: создание и изменение отключены"
        headings={['Код', 'Скидка', 'Статус', 'Действует до']}
        rows={coupons.map((coupon) => [
          coupon.code,
          `${coupon.percent}%`,
          coupon.active ? 'Активен' : 'Отключён',
          coupon.expiresLabel,
        ])}
      />
    </div>
  );
}

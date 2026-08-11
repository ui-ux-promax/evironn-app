import { RevenueChart } from '@/app/(admin)/admin/_components/revenue-chart';
import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { DemoKpiGrid } from '@/components/demo-admin/demo-kpi-grid';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Icon } from '@/components/admin/icon';
import { getDemoAdminSnapshot } from '@/lib/demo-admin/fixtures';
import { formatPrice } from '@/lib/format';

export default function DemoDashboardPage() {
  const snapshot = getDemoAdminSnapshot();
  const chartPeak = snapshot.revenueSeries.reduce((peak, point) => (point.revenue > peak.revenue ? point : peak), {
    label: '',
    revenue: 0,
  });

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Демо-админка"
        title="Дашборд магазина"
        subtitle="Публичный read-only срез Ritm: продажи, заказы, остатки и маркетинг на синтетических данных."
        searchPlaceholder="Поиск в демо отключён"
        afterSearch={
          <span className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-admin-outline-variant bg-admin-surface px-4 text-[13px] font-bold text-admin-on-surface">
            <Icon name="visibility" className="text-[18px]" />
            Только просмотр
          </span>
        }
      />

      <DemoKpiGrid kpis={snapshot.kpis} />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[24px] xl:grid-cols-[minmax(0,1.62fr)_minmax(330px,.96fr)]">
        <article className="grid min-h-[346px] min-w-0 grid-rows-[auto_1fr] rounded-[28px] border border-admin-outline-variant bg-admin-surface p-6 shadow-[var(--admin-shadow-tight)]">
          <div className="mb-[22px] flex items-start justify-between gap-[18px] max-[760px]:grid">
            <div>
              <h2 className="font-admin-head text-[clamp(22px,1.7vw,30px)] font-extrabold leading-[1.05] tracking-[-.035em] text-admin-on-surface">
                Продажи по дням
              </h2>
              <p className="mt-1.5 text-[13px] text-admin-on-surface-variant">{snapshot.generatedLabel}</p>
            </div>
            <span className="inline-flex min-h-[38px] items-center rounded-full border border-admin-outline-variant bg-admin-surface-low px-[13px] text-[13px] font-bold text-admin-on-surface">
              7 дней
            </span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-[13px]">
            <div className="font-admin-head text-[clamp(36px,3vw,50px)] font-extrabold leading-none tracking-[-.06em] text-admin-on-surface tabular-nums">
              {formatPrice(snapshot.kpis.revenue)}
            </div>
            <span className="inline-flex min-h-8 items-center rounded-full bg-[#15d3a2]/15 px-[11px] text-[13px] font-extrabold text-[#138663]">
              +12%
            </span>
          </div>
          <div className="relative">
            <RevenueChart data={[...snapshot.revenueSeries]} />
            {chartPeak.revenue > 0 && (
              <div className="absolute left-[44%] top-[24%] inline-flex min-h-8 items-center rounded-full bg-[#15d3a2] px-3 text-[12px] font-extrabold text-[#10211c] shadow-[0_14px_30px_rgb(21_211_162_/_0.22)] tabular-nums">
                {chartPeak.label} · {formatPrice(chartPeak.revenue)}
              </div>
            )}
          </div>
        </article>

        <div className="grid min-w-0 gap-[24px]">
          <article className="rounded-[32px] border border-admin-outline-variant bg-admin-surface p-6 shadow-[var(--admin-shadow-tight)]">
            <div className="mb-[22px]">
              <h2 className="font-admin-head text-[clamp(22px,1.7vw,30px)] font-extrabold leading-[1.05] tracking-[-.035em] text-admin-on-surface">
                Операции
              </h2>
              <p className="mt-1.5 text-[13px] text-admin-on-surface-variant">Синтетическая сводка для портфолио</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <QuickCard label="К сборке" value={3} />
              <QuickCard label="Доставлено" value={2} />
              <QuickCard label="Мало остатков" value={2} />
              <QuickCard label="Промокодов" value={snapshot.coupons.length} />
            </div>
          </article>

          <article className="rounded-[32px] border border-admin-outline-variant bg-admin-surface p-6 shadow-[var(--admin-shadow-tight)]">
            <div className="mb-[22px]">
              <h2 className="font-admin-head text-[clamp(22px,1.7vw,30px)] font-extrabold leading-[1.05] tracking-[-.035em] text-admin-on-surface">
                Демо-ограничения
              </h2>
              <p className="mt-1.5 text-[13px] text-admin-on-surface-variant">
                Настоящая админка закрыта, здесь только витрина возможностей
              </p>
            </div>
            <div className="grid gap-3">
              {['Нет live data imports', 'Нет server actions', 'Нет изменения данных'].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-[18px] border border-admin-outline-variant bg-admin-surface-low p-4 text-sm font-bold text-admin-on-surface"
                >
                  <Icon name="check_circle" className="text-[20px] text-[var(--admin-money)]" />
                  {label}
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <DemoDataTable
        title="Последние заказы"
        note="Та же операционная таблица, но без переходов и действий"
        headings={['Заказ', 'Клиент', 'Статус', 'Сумма']}
        rows={snapshot.orders.map((order) => [
          order.number,
          order.customerName,
          order.status,
          formatPrice(order.totalAmount),
        ])}
      />
    </div>
  );
}

function QuickCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-admin-outline-variant bg-admin-surface p-4 shadow-[var(--admin-shadow-tight)]">
      <span className="text-[12px] font-bold text-admin-on-surface-variant">{label}</span>
      <strong className="mt-2 block font-admin-head text-[25px] font-extrabold leading-none tracking-[-.045em] text-admin-on-surface tabular-nums">
        {value}
      </strong>
    </div>
  );
}

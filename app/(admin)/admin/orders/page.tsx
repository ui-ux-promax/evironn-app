import { Icon } from '@/components/admin/icon';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { parsePaginationParams, readSearchQuery, readEnumParam } from '@/lib/admin/pagination';
import { listAdminOrders } from '@/lib/admin/orders';
import { ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES } from '@/lib/order-admin';
import { formatPrice } from '@/lib/format';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { OrderFilters } from './_components/order-filters';
import { OrderTable } from './_components/order-table';

export const metadata = { title: 'Заказы' };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

const PAYMENT_FILTER_VALUES = [...PAYMENT_STATUS_VALUES, 'waiting_for_capture', 'none'] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const { page, limit } = parsePaginationParams(sp, { limit: 10 });
  const q = readSearchQuery(sp);
  const status = readEnumParam(sp, 'status', ORDER_STATUS_VALUES);
  const payment = readEnumParam(sp, 'payment', PAYMENT_FILTER_VALUES);
  const result = await listAdminOrders({ page, limit, query: q, status, payment });
  const { rows, total, pagination, statusCounts } = result;
  const awaitingPayment = rows.filter(
    (row) => row.paymentStatus === 'pending' || row.paymentStatus === 'waiting_for_capture',
  ).length;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        className="rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7"
        kicker="Операции магазина"
        title="Заказы"
        subtitle="Статусы, оплата и доставка — в одном рабочем реестре."
        action={
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-admin-outline-variant px-4 text-sm font-bold text-admin-on-surface-variant"
            >
              <Icon name="download" className="text-[19px]" />
              Экспорт
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-admin-primary px-5 text-sm font-bold text-white"
            >
              <Icon name="add" className="text-[19px]" />
              Создать заказ
            </button>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели заказов">
        <KpiCard label="Новые заказы" value={statusCounts.PENDING.toLocaleString('ru-RU')} detail="Текущий статус" />
        <KpiCard label="В обработке" value={statusCounts.PROCESSING.toLocaleString('ru-RU')} detail="Текущий статус" />
        <KpiCard label="В пути" value={statusCounts.SHIPPED.toLocaleString('ru-RU')} detail="Текущий статус" />
        <KpiCard label="Ожидает оплаты" value={awaitingPayment.toLocaleString('ru-RU')} detail="На текущей странице" />
      </section>

      <OrderFilters />

      <section
        aria-labelledby="orders-table-title"
        className="overflow-hidden rounded-[20px] border border-admin-outline-variant bg-admin-surface shadow-[var(--admin-shadow-tight)]"
      >
        <div className="flex flex-col gap-3 border-b border-admin-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="orders-table-title" className="text-base font-medium text-admin-on-surface">
              Реестр заказов
            </h2>
            <p className="mt-1 text-xs text-admin-on-surface-variant">
              {total.toLocaleString('ru-RU')} заказов · данные по текущей выборке
            </p>
          </div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-9 w-fit items-center rounded-[10px] border border-admin-outline-variant px-3.5 text-xs font-bold text-admin-on-surface-variant"
          >
            Настроить колонки
          </button>
        </div>

        {rows.length > 0 ? (
          <OrderTable
            rows={rows}
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={total}
            limit={pagination.limit}
          />
        ) : (
          <div className="p-10 text-center text-sm font-bold text-admin-on-surface-variant">Заказы не найдены.</div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
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

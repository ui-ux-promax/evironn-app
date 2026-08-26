import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { parsePaginationParams, readSearchQuery, readEnumParam } from '@/lib/admin/pagination';
import { listAdminOrders } from '@/lib/admin/orders';
import { ORDER_STATUS_META } from '@/lib/order';
import { ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES } from '@/lib/order-admin';
import { formatPrice } from '@/lib/format';
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
  const { rows, total, pagination, statusCounts, filteredRevenue } = result;
  const processingCount = statusCounts.PROCESSING;
  const shippedCount = statusCounts.SHIPPED;
  const deliveredCount = statusCounts.DELIVERED;

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Операции"
        title={`Заказы (${total})`}
        subtitle="Просмотр заказов, платежей, состава и операционных статусов."
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard
          icon="shopping_bag"
          label="Заказов в выборке"
          value={total.toLocaleString('ru-RU')}
          tone="primary"
        />
        <AdminKpiCard icon="sync" label="В обработке" value={processingCount.toLocaleString('ru-RU')} />
        <AdminKpiCard icon="local_shipping" label="В пути" value={shippedCount.toLocaleString('ru-RU')} />
        <AdminKpiCard
          icon="payments"
          label="Оборот выборки"
          value={formatPrice(filteredRevenue)}
          delta={`${deliveredCount} доставлено`}
        />
      </div>

      <AdminPanel
        title="Журнал заказов"
        note="Числовой поиск ищет точный номер заказа. Текстовый поиск ищет по имени, телефону и email."
        actions={
          <div className="text-[13px] font-bold text-admin-on-surface-variant">
            Показано <b className="font-mono text-admin-on-surface">{total}</b> заказов
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3">
          {ORDER_STATUS_VALUES.map((s) => (
            <div
              key={s}
              className="flex items-center gap-2 rounded-full border border-admin-outline-variant bg-admin-surface px-4 py-2"
            >
              <span className={ORDER_STATUS_META[s].badge}>{ORDER_STATUS_META[s].label}</span>
              <span className="font-bold tabular-nums text-admin-on-surface">{statusCounts[s]}</span>
            </div>
          ))}
        </div>

        <OrderFilters />

        {rows.length > 0 ? (
          <OrderTable
            rows={rows}
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={total}
            limit={pagination.limit}
          />
        ) : (
          <div className="mt-[18px] rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-10 text-center text-sm font-bold text-admin-on-surface-variant">
            Заказы не найдены.
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

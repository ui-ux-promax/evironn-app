import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { getDemoAdminSnapshot } from '@/lib/demo-admin/fixtures';
import { formatPrice } from '@/lib/format';

export default function DemoOrdersPage() {
  const { orders } = getDemoAdminSnapshot();
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const processing = orders.filter((order) => order.status === 'PROCESSING' || order.status === 'PENDING').length;

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Заказы"
        title="Операции заказов"
        subtitle="Демо-копия списка заказов: статусы, суммы и клиенты без переходов в реальные карточки."
        searchPlaceholder="Поиск заказов отключён"
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
        <AdminKpiCard icon="receipt_long" label="Заказов" value={String(orders.length)} tone="primary" />
        <AdminKpiCard icon="pending_actions" label="В работе" value={String(processing)} />
        <AdminKpiCard icon="account_balance_wallet" label="Оборот" value={formatPrice(revenue)} />
      </div>

      <DemoDataTable
        title="Последние заказы"
        note="Данные синтетические, статусы не изменяются"
        headings={['Заказ', 'Клиент', 'Статус', 'Сумма', 'Создан']}
        rows={orders.map((order) => [
          order.number,
          order.customerName,
          order.status,
          formatPrice(order.totalAmount),
          order.createdLabel,
        ])}
      />
    </div>
  );
}

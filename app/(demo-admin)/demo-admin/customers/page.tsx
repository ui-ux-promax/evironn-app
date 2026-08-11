import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { getDemoAdminSnapshot } from '@/lib/demo-admin/fixtures';
import { formatPrice } from '@/lib/format';

export default function DemoCustomersPage() {
  const { customers } = getDemoAdminSnapshot();
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const orderCount = customers.reduce((sum, customer) => sum + customer.orderCount, 0);

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Клиенты"
        title="Клиентская база"
        subtitle="Публичная демо-таблица с reserved `.invalid` email и без персональных данных."
        searchPlaceholder="Поиск клиентов отключён"
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
        <AdminKpiCard icon="group" label="Клиентов" value={String(customers.length)} tone="primary" />
        <AdminKpiCard icon="shopping_bag" label="Заказов" value={String(orderCount)} />
        <AdminKpiCard icon="account_balance_wallet" label="Потрачено" value={formatPrice(totalSpent)} />
      </div>

      <DemoDataTable
        title="Клиенты"
        note="В демо нет реальных email, телефонов и адресов"
        headings={['Клиент', 'Email', 'Заказов', 'Потрачено', 'Регистрация']}
        rows={customers.map((customer) => [
          customer.name,
          customer.email,
          customer.orderCount,
          formatPrice(customer.totalSpent),
          customer.registeredLabel,
        ])}
      />
    </div>
  );
}

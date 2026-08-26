import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { DemoPageHeader } from '@/components/demo-admin/demo-page-header';
import { DemoPanel } from '@/components/demo-admin/demo-panel';
import { demoAdminFixtures } from '@/lib/demo-admin/fixtures';
import { formatDemoPrice } from '@/lib/demo-admin/format-price';

export default function DemoCustomersPage() {
  return (
    <div className="space-y-6">
      <DemoPageHeader
        kicker="Клиенты"
        title="Клиентская база"
        subtitle="Роли, история заказов и траты на синтетических данных без реальных контактов."
      />

      <DemoPanel title="Клиенты" note="Все адреса электронной почты используют reserved домен .invalid">
        <DemoDataTable
          columns={[
            { key: 'name', label: 'Клиент' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Роль' },
            { key: 'orders', label: 'Заказы' },
            { key: 'spent', label: 'Потрачено' },
            { key: 'registered', label: 'Регистрация' },
          ]}
          rows={demoAdminFixtures.customers.map((customer) => ({
            name: customer.name,
            email: customer.email,
            role: customer.role === 'ADMIN' ? 'Администратор' : 'Клиент',
            orders: customer.orderCount,
            spent: formatDemoPrice(customer.totalSpent),
            registered: customer.registeredLabel,
          }))}
        />
      </DemoPanel>
    </div>
  );
}

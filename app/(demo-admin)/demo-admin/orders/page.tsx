import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { DemoPageHeader } from '@/components/demo-admin/demo-page-header';
import { DemoPanel } from '@/components/demo-admin/demo-panel';
import { DemoStatus } from '@/components/demo-admin/demo-status';
import { demoAdminFixtures } from '@/lib/demo-admin/fixtures';
import { formatDemoPrice } from '@/lib/demo-admin/format-price';

export default function DemoOrdersPage() {
  return (
    <div className="space-y-6">
      <DemoPageHeader
        kicker="Заказы"
        title="Снимок операций"
        subtitle="Статусы, оплата и неизменяемые товарные snapshots из синтетической истории заказов."
      />

      <DemoPanel title="Заказы" note="Публичная таблица без карточек, переходов и действий">
        <DemoDataTable
          columns={[
            { key: 'number', label: 'Заказ' },
            { key: 'customer', label: 'Клиент' },
            { key: 'status', label: 'Статус' },
            { key: 'payment', label: 'Оплата' },
            { key: 'total', label: 'Сумма' },
            { key: 'created', label: 'Создан' },
          ]}
          rows={demoAdminFixtures.orders.map((order) => ({
            number: order.number,
            customer: order.customerName,
            status: <DemoStatus status={order.status} />,
            payment: order.paymentLabel,
            total: formatDemoPrice(order.totalAmount),
            created: order.createdLabel,
          }))}
        />
      </DemoPanel>

      <DemoPanel title="Статусы" note="Синтетическая классификация без действий">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {demoAdminFixtures.orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] px-3 py-2"
            >
              <span className="text-sm">{order.number}</span>
              <DemoStatus status={order.status} />
            </div>
          ))}
        </div>
      </DemoPanel>

      <DemoPanel title="Состав заказов" note="Товарные snapshots сохраняют мебельную конфигурацию и цену">
        <DemoDataTable
          columns={[
            { key: 'order', label: 'Заказ' },
            { key: 'product', label: 'Товар' },
            { key: 'article', label: 'Артикул' },
            { key: 'quantity', label: 'Кол-во' },
            { key: 'lineTotal', label: 'Итого' },
          ]}
          rows={demoAdminFixtures.orders.flatMap((order) =>
            order.lines.map((line) => ({
              order: order.number,
              product: line.productName,
              article: line.articleNumber,
              quantity: line.quantity,
              lineTotal: formatDemoPrice(line.lineTotal),
            })),
          )}
        />
      </DemoPanel>
    </div>
  );
}

import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { DemoPageHeader } from '@/components/demo-admin/demo-page-header';
import { DemoPanel } from '@/components/demo-admin/demo-panel';
import { demoAdminFixtures } from '@/lib/demo-admin/fixtures';
import { formatPrice } from '@/lib/format';

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
            status: order.status,
            payment: order.paymentLabel,
            total: formatPrice(order.totalAmount),
            created: order.createdLabel,
          }))}
        />
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
              lineTotal: formatPrice(line.lineTotal),
            })),
          )}
        />
      </DemoPanel>
    </div>
  );
}

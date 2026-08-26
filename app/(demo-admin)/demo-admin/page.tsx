import { DemoChart } from '@/components/demo-admin/demo-chart';
import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { DemoDonut } from '@/components/demo-admin/demo-donut';
import { DemoIcon } from '@/components/demo-admin/demo-icon';
import { DemoKpiGrid } from '@/components/demo-admin/demo-kpi-grid';
import { DemoPageHeader } from '@/components/demo-admin/demo-page-header';
import { DemoPanel } from '@/components/demo-admin/demo-panel';
import { DemoStatus } from '@/components/demo-admin/demo-status';
import { demoAdminFixtures } from '@/lib/demo-admin/fixtures';
import { formatDemoPrice } from '@/lib/demo-admin/format-price';

export default function DemoDashboardPage() {
  const lowStock = demoAdminFixtures.catalog.skus.filter((sku) => sku.stock <= 3);

  return (
    <div className="space-y-6">
      <DemoPageHeader
        kicker="Демо-админка"
        title="Обзор магазина"
        subtitle="Публичный read-only срез Evironn: продажи, заказы, остатки и мебельный каталог на синтетических данных."
        aside={
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-admin-outline-variant bg-admin-surface px-4 text-[13px] font-bold text-admin-on-surface">
            <DemoIcon name="visibility" />
            Только просмотр
          </span>
        }
      />

      <DemoKpiGrid kpis={demoAdminFixtures.dashboard.kpis} />

      <div className="grid gap-6 xl:grid-cols-2">
        <DemoPanel title="Продажи по дням" note="Фиксированный демонстрационный период">
          <DemoChart points={demoAdminFixtures.dashboard.revenue} />
        </DemoPanel>
        <DemoPanel title="Статусы заказов" note="Синтетическая операционная сводка">
          <DemoDonut slices={demoAdminFixtures.dashboard.statuses} />
        </DemoPanel>
      </div>

      <DemoPanel title="Мало остатков" note="SKU с остатком до 3 единиц">
        <DemoDataTable
          columns={[
            { key: 'article', label: 'Артикул' },
            { key: 'product', label: 'Товар' },
            { key: 'combination', label: 'Комбинация' },
            { key: 'stock', label: 'Остаток' },
          ]}
          rows={lowStock.map((sku) => ({
            article: sku.articleNumber,
            product: demoAdminFixtures.catalog.products.find((product) => product.id === sku.productId)?.name ?? '—',
            combination: sku.combinationLabel,
            stock: sku.stock,
          }))}
        />
      </DemoPanel>

      <DemoPanel title="Последние заказы" note="Снимок заказов без переходов и действий">
        <DemoDataTable
          columns={[
            { key: 'number', label: 'Заказ' },
            { key: 'customer', label: 'Клиент' },
            { key: 'status', label: 'Статус' },
            { key: 'total', label: 'Сумма' },
          ]}
          rows={demoAdminFixtures.orders.slice(0, 5).map((order) => ({
            number: order.number,
            customer: order.customerName,
            status: <DemoStatus status={order.status} />,
            total: formatDemoPrice(order.totalAmount),
          }))}
        />
      </DemoPanel>
    </div>
  );
}

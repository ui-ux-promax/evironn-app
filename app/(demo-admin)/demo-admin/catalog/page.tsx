import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { AdminKpiCard } from '@/components/admin/admin-kpi-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { getDemoAdminSnapshot } from '@/lib/demo-admin/fixtures';
import { formatPrice } from '@/lib/format';

export default function DemoCatalogPage() {
  const { products } = getDemoAdminSnapshot();
  const activeCount = products.filter((product) => product.active).length;
  const stockValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader
        kicker="Каталог"
        title="Товары"
        subtitle="Демо-копия каталога: карточки, SKU, цены, остатки и публикация без действий изменения."
        searchPlaceholder="Поиск товаров отключён"
      />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
        <AdminKpiCard icon="inventory_2" label="Товаров" value={String(products.length)} tone="primary" />
        <AdminKpiCard icon="visibility" label="Активные" value={String(activeCount)} />
        <AdminKpiCard icon="account_balance_wallet" label="Остатки" value={formatPrice(stockValue)} />
      </div>

      <DemoDataTable
        title="Список товаров"
        note="Read-only таблица повторяет операционный вид каталога"
        headings={['Товар', 'SKU', 'Категория', 'Цена', 'Остаток', 'Статус']}
        rows={products.map((product) => [
          product.name,
          product.sku,
          product.category,
          formatPrice(product.price),
          product.stock,
          product.active ? 'Активен' : 'Скрыт',
        ])}
      />
    </div>
  );
}

import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { DemoPageHeader } from '@/components/demo-admin/demo-page-header';
import { DemoPanel } from '@/components/demo-admin/demo-panel';
import { demoAdminFixtures } from '@/lib/demo-admin/fixtures';
import { formatDemoPrice } from '@/lib/demo-admin/format-price';

const turntableLabels = { ready: 'Готов', partial: 'Частично', none: 'Нет' } as const;

export default function DemoCatalogPage() {
  return (
    <div className="space-y-6">
      <DemoPageHeader
        kicker="Каталог"
        title="Мебельный каталог"
        subtitle="Товары, опции, SKU, остатки и медиа в одном детерминированном read-only срезе."
      />

      <DemoPanel title="Товары" note="Канонические мебельные карточки">
        <DemoDataTable
          columns={[
            { key: 'product', label: 'Товар' },
            { key: 'category', label: 'Категория' },
            { key: 'rooms', label: 'Комнаты' },
            { key: 'skus', label: 'SKU' },
            { key: 'price', label: 'Цена от' },
            { key: 'stock', label: 'Остаток' },
          ]}
          rows={demoAdminFixtures.catalog.products.map((product) => ({
            product: product.name,
            category: product.category,
            rooms: product.rooms.join(', '),
            skus: product.skuCount,
            price: formatDemoPrice(product.priceFrom),
            stock: product.totalStock,
          }))}
        />
      </DemoPanel>

      <DemoPanel title="Опции" note="Группы вариантов, доступные мебельным товарам">
        <DemoDataTable
          columns={[
            { key: 'name', label: 'Группа' },
            { key: 'values', label: 'Значения' },
            { key: 'products', label: 'Товаров' },
          ]}
          rows={demoAdminFixtures.catalog.options.map((option) => ({
            name: option.name,
            values: option.values.map((value) => value.label).join(', '),
            products: option.usedByProducts,
          }))}
        />
      </DemoPanel>

      <DemoPanel title="SKU и остатки" note="Конфигурации, цены и доступность">
        <DemoDataTable
          columns={[
            { key: 'article', label: 'Артикул' },
            { key: 'combination', label: 'Комбинация' },
            { key: 'price', label: 'Цена' },
            { key: 'stock', label: 'Остаток' },
            { key: 'status', label: 'Статус' },
          ]}
          rows={demoAdminFixtures.catalog.skus.map((sku) => ({
            article: sku.articleNumber,
            combination: sku.combinationLabel,
            price: formatDemoPrice(sku.price),
            stock: sku.stock,
            status: sku.active ? 'Активен' : 'Скрыт',
          }))}
        />
      </DemoPanel>

      <DemoPanel title="Медиа и 360°" note="Состояние изображений и поворотного обзора">
        <DemoDataTable
          columns={[
            { key: 'product', label: 'Товар' },
            { key: 'media', label: 'Медиа' },
            { key: 'turntable', label: '360° обзор' },
          ]}
          rows={demoAdminFixtures.catalog.products.map((product) => ({
            product: product.name,
            media: product.mediaCount,
            turntable: turntableLabels[product.turntable],
          }))}
        />
      </DemoPanel>
    </div>
  );
}

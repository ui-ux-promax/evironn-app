import { DemoDataTable } from '@/components/demo-admin/demo-data-table';
import { DemoPageHeader } from '@/components/demo-admin/demo-page-header';
import { DemoPanel } from '@/components/demo-admin/demo-panel';
import { demoAdminFixtures } from '@/lib/demo-admin/fixtures';

const couponTypeLabels = { PERCENT: 'Процент' } as const;

export default function DemoMarketingPage() {
  return (
    <div className="space-y-6">
      <DemoPageHeader
        kicker="Маркетинг"
        title="Промокоды"
        subtitle="Тип, значение, окно действия и статус синтетических предложений без создания и редактирования."
      />

      <DemoPanel title="Промокоды" note="Read-only список маркетинговых условий">
        <DemoDataTable
          columns={[
            { key: 'code', label: 'Код' },
            { key: 'type', label: 'Тип' },
            { key: 'value', label: 'Значение' },
            { key: 'window', label: 'Окно действия' },
            { key: 'status', label: 'Статус' },
          ]}
          rows={demoAdminFixtures.coupons.map((coupon) => ({
            code: coupon.code,
            type: couponTypeLabels[coupon.type],
            value: `${coupon.value}%`,
            window: coupon.windowLabel,
            status: coupon.active ? 'Активен' : 'Отключён',
          }))}
        />
      </DemoPanel>
    </div>
  );
}

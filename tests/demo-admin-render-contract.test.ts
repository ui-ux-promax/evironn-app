import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const files = ['page.tsx', 'catalog/page.tsx', 'orders/page.tsx', 'customers/page.tsx', 'marketing/page.tsx'];

describe('demo admin render boundary', () => {
  it('reads only deterministic demo fixtures through local presentation primitives', () => {
    for (const file of files) {
      const source = readFileSync(join(root, 'app/(demo-admin)/demo-admin', file), 'utf8');
      expect(source).toContain('demoAdminFixtures');
      expect(source).toContain('DemoPageHeader');
      expect(source).toMatch(/DemoDataTable|DemoPanel/);
      expect(source).not.toContain('getDemoAdminSnapshot');
      expect(source).not.toMatch(
        /@\/components\/admin|@\/app\/\(admin\)|prisma|app\/actions\/admin|\/api\/|fetch\(|<form|onSubmit|onClick|use(State|Effect|Id|Pathname|Router|SearchParams)|action\s*=|redirect\(|revalidatePath|cookies\(|headers\(/i,
      );
    }
  });

  it('composes dashboard sections from furniture fixture collections', () => {
    const source = readFileSync(join(root, 'app/(demo-admin)/demo-admin/page.tsx'), 'utf8');

    expect(source).toContain('DemoChart');
    expect(source).toContain('DemoDonut');
    expect(source).toMatch(/low stock|Мало остатков/i);
    expect(source).toMatch(/recent orders|Последние заказы/i);
    expect(source).toContain('demoAdminFixtures.catalog.skus');
    expect(source).toContain('demoAdminFixtures.orders');
  });

  it('composes catalog product, option, SKU, media, and 360 sections', () => {
    const source = readFileSync(join(root, 'app/(demo-admin)/demo-admin/catalog/page.tsx'), 'utf8');

    expect(source).toContain('demoAdminFixtures.catalog.products');
    expect(source).toContain('demoAdminFixtures.catalog.options');
    expect(source).toContain('demoAdminFixtures.catalog.skus');
    expect(source).toContain('mediaCount');
    expect(source).toContain('turntable');
  });

  it('composes order snapshots, customer roles, and coupon detail rows', () => {
    const orders = readFileSync(join(root, 'app/(demo-admin)/demo-admin/orders/page.tsx'), 'utf8');
    const dashboard = readFileSync(join(root, 'app/(demo-admin)/demo-admin/page.tsx'), 'utf8');
    const customers = readFileSync(join(root, 'app/(demo-admin)/demo-admin/customers/page.tsx'), 'utf8');
    const coupons = readFileSync(join(root, 'app/(demo-admin)/demo-admin/marketing/page.tsx'), 'utf8');

    expect(dashboard).toContain("import { DemoStatus } from '@/components/demo-admin/demo-status';");
    expect(dashboard).toContain('status: <DemoStatus status={order.status} />');
    expect(orders).toContain('status: <DemoStatus status={order.status} />');
    expect(orders).toContain('paymentLabel');
    expect(orders).toContain('lines');
    expect(customers).toContain('role');
    expect(customers).toContain('orderCount');
    expect(customers).toContain('totalSpent');
    expect(coupons).toContain('type');
    expect(coupons).toContain('value');
    expect(coupons).toContain('windowLabel');
    expect(coupons).toContain('active');
  });
});

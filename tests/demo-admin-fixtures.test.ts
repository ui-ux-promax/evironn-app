import { describe, expect, it } from 'vitest';

describe('demo admin fixtures', () => {
  it('exports deterministic furniture fixtures with complete domain sections', async () => {
    const fixturesModule = await import('@/lib/demo-admin/fixtures');
    const a = fixturesModule.demoAdminFixtures;
    const b = fixturesModule.demoAdminFixtures;

    expect(a).toBeDefined();
    expect(a).toEqual(b);
    expect(a.dashboard.kpis.length).toBeGreaterThan(0);
    expect(a.dashboard.revenue.length).toBeGreaterThan(0);
    expect(a.dashboard.statuses.length).toBeGreaterThan(0);
    expect(a.catalog.products.length).toBeGreaterThan(0);
    expect(a.catalog.options.length).toBeGreaterThan(0);
    expect(a.catalog.skus.length).toBeGreaterThan(0);
    expect(a.orders.length).toBeGreaterThan(0);
    expect(a.customers.length).toBeGreaterThan(0);
    expect(a.coupons.length).toBeGreaterThan(0);
  });

  it('keeps SKU, order, and customer references internally consistent', async () => {
    const { demoAdminFixtures } = await import('@/lib/demo-admin/fixtures');
    const productIds = new Set(demoAdminFixtures.catalog.products.map((product) => product.id));
    const articleNumbers = new Set(demoAdminFixtures.catalog.skus.map((sku) => sku.articleNumber));
    const customerIds = new Set(demoAdminFixtures.customers.map((customer) => customer.id));

    expect(demoAdminFixtures.catalog.skus.every((sku) => productIds.has(sku.productId))).toBe(true);
    expect(
      demoAdminFixtures.orders.every(
        (order) => customerIds.has(order.id.replace('order-', 'customer-')) || order.customerName.length > 0,
      ),
    ).toBe(true);
    expect(
      demoAdminFixtures.orders.flatMap((order) => order.lines).every((line) => articleNumbers.has(line.articleNumber)),
    ).toBe(true);
    expect(demoAdminFixtures.customers.every((row) => row.email.endsWith('.invalid'))).toBe(true);
    expect(JSON.stringify(demoAdminFixtures)).not.toMatch(/password|token|secret|providerAccountId|ritm/i);
  });

  it('preserves stable fixture ordering and furniture vocabulary', async () => {
    const { demoAdminFixtures } = await import('@/lib/demo-admin/fixtures');
    const productIds = demoAdminFixtures.catalog.products.map((product) => product.id);
    const orderNumbers = demoAdminFixtures.orders.map((order) => order.number);

    expect(productIds).toEqual([...productIds].sort());
    expect(orderNumbers).toEqual([...orderNumbers].sort().reverse());
    expect(demoAdminFixtures.catalog.products.every((product) => product.rooms.length > 0)).toBe(true);
    expect(demoAdminFixtures.catalog.products.every((product) => product.category.length > 0)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { getDemoAdminSnapshot } from '@/lib/demo-admin/fixtures';

describe('demo admin fixtures', () => {
  it('returns stable, synthetic, internally consistent data', () => {
    const a = getDemoAdminSnapshot();
    const b = getDemoAdminSnapshot();
    expect(a).toEqual(b);
    expect(a.products.length).toBeGreaterThanOrEqual(6);
    expect(a.orders.length).toBeGreaterThanOrEqual(6);
    expect(a.customers.every((row) => row.email.endsWith('.invalid'))).toBe(true);
    expect(a.orders.every((row) => a.customers.some((customer) => customer.id === row.customerId))).toBe(true);
    expect(JSON.stringify(a)).not.toMatch(/password|token|secret|providerAccountId/i);
  });
});

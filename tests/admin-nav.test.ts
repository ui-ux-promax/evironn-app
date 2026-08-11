import { describe, it, expect } from 'vitest';
import { ADMIN_NAV, resolveActiveIndex } from '@/lib/admin/nav';
import { ADMIN_PRIMARY_ROUTE_ORDER } from '@/lib/admin/prototype-contract';

describe('ADMIN_NAV', () => {
  it('has the 5 primary sections in order', () => {
    expect(ADMIN_NAV.map((n) => n.href)).toEqual([...ADMIN_PRIMARY_ROUTE_ORDER]);
  });
});

describe('resolveActiveIndex', () => {
  it('matches the dashboard only on exact path', () => {
    expect(resolveActiveIndex('/admin')).toBe(0);
  });
  it('does not match dashboard for deeper paths', () => {
    expect(resolveActiveIndex('/admin/catalog')).toBe(2);
    expect(resolveActiveIndex('/admin/catalog/products')).toBe(2);
    expect(resolveActiveIndex('/admin/catalog/products/abc/edit')).toBe(2);
  });
  it('matches orders / customers / marketing by prefix', () => {
    expect(resolveActiveIndex('/admin/orders/123')).toBe(1);
    expect(resolveActiveIndex('/admin/customers')).toBe(3);
    expect(resolveActiveIndex('/admin/marketing/new')).toBe(4);
  });
  it('returns -1 when nothing matches', () => {
    expect(resolveActiveIndex('/login')).toBe(-1);
  });
});

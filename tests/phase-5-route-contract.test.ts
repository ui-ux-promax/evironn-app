import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_CATALOG_TABS, ADMIN_NAV, isActiveAdminHref } from '@/lib/admin/nav';
import { DEMO_ADMIN_NAV, isDemoNavActive } from '@/lib/demo-admin/nav';

const root = process.cwd();

const protectedRoutes = [
  ['/admin', 'app/(admin)/admin/page.tsx'],
  ['/admin/catalog', 'app/(admin)/admin/catalog/page.tsx'],
  ['/admin/catalog/products', 'app/(admin)/admin/catalog/products/page.tsx'],
  ['/admin/catalog/products/new', 'app/(admin)/admin/catalog/products/new/page.tsx'],
  ['/admin/catalog/products/:id/edit', 'app/(admin)/admin/catalog/products/[id]/edit/page.tsx'],
  ['/admin/catalog/categories', 'app/(admin)/admin/catalog/categories/page.tsx'],
  ['/admin/catalog/categories/new', 'app/(admin)/admin/catalog/categories/new/page.tsx'],
  ['/admin/catalog/categories/:id/edit', 'app/(admin)/admin/catalog/categories/[id]/edit/page.tsx'],
  ['/admin/catalog/options', 'app/(admin)/admin/catalog/options/page.tsx'],
  ['/admin/catalog/options/new', 'app/(admin)/admin/catalog/options/new/page.tsx'],
  ['/admin/catalog/options/:id/edit', 'app/(admin)/admin/catalog/options/[id]/edit/page.tsx'],
  ['/admin/catalog/rooms', 'app/(admin)/admin/catalog/rooms/page.tsx'],
  ['/admin/catalog/rooms/new', 'app/(admin)/admin/catalog/rooms/new/page.tsx'],
  ['/admin/catalog/rooms/:id/edit', 'app/(admin)/admin/catalog/rooms/[id]/edit/page.tsx'],
  ['/admin/catalog/stock', 'app/(admin)/admin/catalog/stock/page.tsx'],
  ['/admin/orders', 'app/(admin)/admin/orders/page.tsx'],
  ['/admin/orders/:id', 'app/(admin)/admin/orders/[id]/page.tsx'],
  ['/admin/customers', 'app/(admin)/admin/customers/page.tsx'],
  ['/admin/customers/:id', 'app/(admin)/admin/customers/[id]/page.tsx'],
  ['/admin/marketing', 'app/(admin)/admin/marketing/page.tsx'],
  ['/admin/marketing/new', 'app/(admin)/admin/marketing/new/page.tsx'],
  ['/admin/marketing/:id/edit', 'app/(admin)/admin/marketing/[id]/edit/page.tsx'],
] as const;

const demoRoutes = [
  ['/demo-admin', 'app/(demo-admin)/demo-admin/page.tsx'],
  ['/demo-admin/catalog', 'app/(demo-admin)/demo-admin/catalog/page.tsx'],
  ['/demo-admin/orders', 'app/(demo-admin)/demo-admin/orders/page.tsx'],
  ['/demo-admin/customers', 'app/(demo-admin)/demo-admin/customers/page.tsx'],
  ['/demo-admin/marketing', 'app/(demo-admin)/demo-admin/marketing/page.tsx'],
] as const;

describe('Phase 5 route contract', () => {
  it('locks the exact 22 protected and five public demo route files', () => {
    expect(protectedRoutes).toHaveLength(22);
    expect(demoRoutes).toHaveLength(5);
    for (const [, file] of [...protectedRoutes, ...demoRoutes])
      expect(existsSync(resolve(root, file)), file).toBe(true);
  });

  it('locks active nav and tab semantics against the route contract', () => {
    expect(ADMIN_NAV.map(({ href }) => href)).toEqual([
      '/admin',
      '/admin/catalog',
      '/admin/orders',
      '/admin/customers',
      '/admin/marketing',
    ]);
    expect(ADMIN_CATALOG_TABS?.map(({ href }) => href)).toEqual([
      '/admin/catalog/products',
      '/admin/catalog/categories',
      '/admin/catalog/options',
      '/admin/catalog/rooms',
      '/admin/catalog/stock',
    ]);
    expect(isActiveAdminHref(ADMIN_NAV[0], '/admin')).toBe(true);
    expect(isActiveAdminHref(ADMIN_NAV[0], '/admin/catalog')).toBe(false);
    expect(isActiveAdminHref(ADMIN_NAV[1], '/admin/catalog/products/sku/edit')).toBe(true);
    expect(isActiveAdminHref(ADMIN_NAV[1], '/admin/catalogue')).toBe(false);
    expect(isDemoNavActive(DEMO_ADMIN_NAV[0], '/demo-admin')).toBe(true);
    expect(isDemoNavActive(DEMO_ADMIN_NAV[0], '/demo-admin/catalog')).toBe(false);
    expect(isDemoNavActive(DEMO_ADMIN_NAV[1], '/demo-admin/catalog')).toBe(true);
  });

  it('keeps protected and demo route source boundaries separate', () => {
    for (const [, file] of protectedRoutes) {
      expect(readFileSync(join(root, file), 'utf8')).not.toMatch(/['"]\/demo-admin(?:['"/?]|$)/);
    }
    for (const [, file] of demoRoutes) {
      expect(readFileSync(join(root, file), 'utf8')).not.toMatch(/['"]\/admin(?:['"/?]|$)/);
    }
  });
});

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_CATALOG_TABS, ADMIN_NAV, isActiveAdminHref } from '@/lib/admin/nav';
import { DEMO_ADMIN_NAV, isDemoNavActive } from '@/lib/demo-admin/nav';

const root = process.cwd();

type RouteRow = Readonly<{
  route: string;
  file: string;
  primary: string | null;
  tab: string | null;
  redirect: string | null;
}>;

function pageFiles(directory: string): string[] {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(file);
    return entry.isFile() && entry.name === 'page.tsx' ? [file.replaceAll('\\', '/')] : [];
  });
}

function routeForPageFile(file: string, rootDirectory: string, prefix: string): string {
  const routeSegments = relative(rootDirectory, dirname(resolve(root, file)))
    .split(/[\\/]/)
    .filter(Boolean)
    .map((segment) => segment.replace(/^\[(.+)\]$/, ':$1'));
  return [prefix, ...routeSegments].join('/').replace(/\/+/g, '/') || prefix;
}

const expectedProtectedRows: readonly RouteRow[] = [
  ['/admin', 'app/(admin)/admin/page.tsx', '/admin', null, null],
  ['/admin/catalog', 'app/(admin)/admin/catalog/page.tsx', '/admin/catalog', null, '/admin/catalog/products'],
  [
    '/admin/catalog/products',
    'app/(admin)/admin/catalog/products/page.tsx',
    '/admin/catalog',
    '/admin/catalog/products',
    null,
  ],
  [
    '/admin/catalog/products/new',
    'app/(admin)/admin/catalog/products/new/page.tsx',
    '/admin/catalog',
    '/admin/catalog/products',
    null,
  ],
  [
    '/admin/catalog/products/:id/edit',
    'app/(admin)/admin/catalog/products/[id]/edit/page.tsx',
    '/admin/catalog',
    '/admin/catalog/products',
    null,
  ],
  [
    '/admin/catalog/categories',
    'app/(admin)/admin/catalog/categories/page.tsx',
    '/admin/catalog',
    '/admin/catalog/categories',
    null,
  ],
  [
    '/admin/catalog/categories/new',
    'app/(admin)/admin/catalog/categories/new/page.tsx',
    '/admin/catalog',
    '/admin/catalog/categories',
    null,
  ],
  [
    '/admin/catalog/categories/:id/edit',
    'app/(admin)/admin/catalog/categories/[id]/edit/page.tsx',
    '/admin/catalog',
    '/admin/catalog/categories',
    null,
  ],
  [
    '/admin/catalog/options',
    'app/(admin)/admin/catalog/options/page.tsx',
    '/admin/catalog',
    '/admin/catalog/options',
    null,
  ],
  [
    '/admin/catalog/options/new',
    'app/(admin)/admin/catalog/options/new/page.tsx',
    '/admin/catalog',
    '/admin/catalog/options',
    null,
  ],
  [
    '/admin/catalog/options/:id/edit',
    'app/(admin)/admin/catalog/options/[id]/edit/page.tsx',
    '/admin/catalog',
    '/admin/catalog/options',
    null,
  ],
  ['/admin/catalog/rooms', 'app/(admin)/admin/catalog/rooms/page.tsx', '/admin/catalog', '/admin/catalog/rooms', null],
  [
    '/admin/catalog/rooms/new',
    'app/(admin)/admin/catalog/rooms/new/page.tsx',
    '/admin/catalog',
    '/admin/catalog/rooms',
    null,
  ],
  [
    '/admin/catalog/rooms/:id/edit',
    'app/(admin)/admin/catalog/rooms/[id]/edit/page.tsx',
    '/admin/catalog',
    '/admin/catalog/rooms',
    null,
  ],
  ['/admin/catalog/stock', 'app/(admin)/admin/catalog/stock/page.tsx', '/admin/catalog', '/admin/catalog/stock', null],
  ['/admin/orders', 'app/(admin)/admin/orders/page.tsx', '/admin/orders', null, null],
  ['/admin/orders/:id', 'app/(admin)/admin/orders/[id]/page.tsx', '/admin/orders', null, null],
  ['/admin/customers', 'app/(admin)/admin/customers/page.tsx', '/admin/customers', null, null],
  ['/admin/customers/:id', 'app/(admin)/admin/customers/[id]/page.tsx', '/admin/customers', null, null],
  ['/admin/marketing', 'app/(admin)/admin/marketing/page.tsx', '/admin/marketing', null, null],
  ['/admin/marketing/new', 'app/(admin)/admin/marketing/new/page.tsx', '/admin/marketing', null, null],
  ['/admin/marketing/:id/edit', 'app/(admin)/admin/marketing/[id]/edit/page.tsx', '/admin/marketing', null, null],
].map(([route, file, primary, tab, redirect]) => ({ route, file, primary, tab, redirect }));

const expectedDemoRoutes = [
  ['/demo-admin', 'app/(demo-admin)/demo-admin/page.tsx'],
  ['/demo-admin/catalog', 'app/(demo-admin)/demo-admin/catalog/page.tsx'],
  ['/demo-admin/orders', 'app/(demo-admin)/demo-admin/orders/page.tsx'],
  ['/demo-admin/customers', 'app/(demo-admin)/demo-admin/customers/page.tsx'],
  ['/demo-admin/marketing', 'app/(demo-admin)/demo-admin/marketing/page.tsx'],
] as const;

const protectedRoutes = expectedProtectedRows.map(({ route, file }) => [route, file] as const);
const demoRoutes = expectedDemoRoutes;

describe('Phase 5 route contract', () => {
  it('locks the exact 22 protected and five public demo route files', () => {
    const actualProtected = pageFiles('app/(admin)/admin').map(
      (file) => [routeForPageFile(file, resolve(root, 'app/(admin)/admin'), '/admin'), file] as const,
    );
    const actualDemo = pageFiles('app/(demo-admin)/demo-admin').map(
      (file) => [routeForPageFile(file, resolve(root, 'app/(demo-admin)/demo-admin'), '/demo-admin'), file] as const,
    );
    expect(actualProtected.sort()).toEqual([...protectedRoutes].sort());
    expect(actualDemo.sort()).toEqual([...demoRoutes].sort());
    expect(actualProtected).toHaveLength(22);
    expect(actualDemo).toHaveLength(5);
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

  it('locks every protected primary, catalog tab, and redirect row', () => {
    for (const row of expectedProtectedRows) {
      const actualRoute = row.route.replaceAll(':id', 'fixture-id');
      const primary = ADMIN_NAV.find((item) => item.href === row.primary);
      expect(primary?.href ?? null, row.route).toBe(row.primary);
      if (primary) expect(isActiveAdminHref(primary, actualRoute), row.route).toBe(true);
      if (row.tab) {
        const tab = ADMIN_CATALOG_TABS.find((item) => item.href === row.tab);
        expect(tab?.href ?? null, row.route).toBe(row.tab);
        if (tab) expect(isActiveAdminHref(tab, actualRoute), row.route).toBe(true);
      }
      if (row.redirect) {
        const source = readFileSync(resolve(root, row.file), 'utf8');
        expect(source, row.route).toMatch(new RegExp(`redirect\\(['"]${row.redirect.replaceAll('/', '\\/')}['"]\\)`));
      }
    }
    expect(expectedProtectedRows.filter((row) => row.redirect)).toHaveLength(1);
  });

  it('keeps demo navigation labels and order equal to protected navigation after prefix normalization', () => {
    expect(DEMO_ADMIN_NAV.map(({ href, label }) => ({ href: href.replace('/demo-admin', '/admin'), label }))).toEqual(
      ADMIN_NAV.map(({ href, label }) => ({ href, label })),
    );
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

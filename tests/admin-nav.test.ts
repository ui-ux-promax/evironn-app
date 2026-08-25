import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_CATALOG_TABS, ADMIN_NAV, isActiveAdminHref } from '@/lib/admin/nav';

const catalogRoot = resolve('app/(admin)/admin/catalog');
const shellSources = [
  'lib/admin/nav.ts',
  'components/admin/admin-shell.tsx',
  'components/admin/admin-mobile-menu.tsx',
  'components/admin/admin-tab-bar.tsx',
  'app/(admin)/admin/catalog/layout.tsx',
];

function existingCatalogRouteHrefs(): string[] {
  return readdirSync(catalogRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(catalogRoot, entry.name, 'page.tsx')))
    .map((entry) => `/admin/catalog/${entry.name}`)
    .sort();
}

describe('admin navigation contract', () => {
  it('exposes only current primary admin routes in data order', () => {
    expect(ADMIN_NAV.map((item) => item.href)).toEqual([
      '/admin',
      '/admin/catalog',
      '/admin/orders',
      '/admin/customers',
      '/admin/marketing',
    ]);
    expect(ADMIN_NAV.every((item) => Object.keys(item).sort().join(',') === 'href,label,match')).toBe(true);
  });

  it('exposes only existing product, category, option, and room catalog tabs', () => {
    expect(ADMIN_CATALOG_TABS).toBeDefined();
    if (!ADMIN_CATALOG_TABS) return;

    expect(ADMIN_CATALOG_TABS.map((item) => item.href).sort()).toEqual(existingCatalogRouteHrefs());
    expect(ADMIN_CATALOG_TABS.map((item) => item.href)).toEqual([
      '/admin/catalog/products',
      '/admin/catalog/categories',
      '/admin/catalog/options',
      '/admin/catalog/rooms',
    ]);
  });
});

describe('isActiveAdminHref', () => {
  it('matches exact dashboard path without matching nested routes', () => {
    const dashboard = ADMIN_NAV[0];

    expect(typeof isActiveAdminHref).toBe('function');
    if (typeof isActiveAdminHref !== 'function') return;

    expect(isActiveAdminHref(dashboard, '/admin')).toBe(true);
    expect(isActiveAdminHref(dashboard, '/admin/catalog')).toBe(false);
  });

  it('matches prefix routes and nested catalog tab paths on segment boundaries', () => {
    const catalog = ADMIN_NAV[1];
    expect(typeof isActiveAdminHref).toBe('function');
    expect(ADMIN_CATALOG_TABS).toBeDefined();
    if (typeof isActiveAdminHref !== 'function' || !ADMIN_CATALOG_TABS) return;

    const products = ADMIN_CATALOG_TABS[0];

    expect(isActiveAdminHref(catalog, '/admin/catalog/products/abc/edit')).toBe(true);
    expect(isActiveAdminHref(catalog, '/admin/catalogue')).toBe(false);
    expect(isActiveAdminHref(products, '/admin/catalog/products/abc/edit')).toBe(true);
    expect(isActiveAdminHref(products, '/admin/catalog/categories')).toBe(false);
  });
});

describe('Evironn admin branding', () => {
  it('contains no Ritm references in navigation or shell sources', () => {
    for (const sourcePath of shellSources) {
      expect(readFileSync(resolve(sourcePath), 'utf8').toLowerCase()).not.toContain('ritm');
    }
  });
});

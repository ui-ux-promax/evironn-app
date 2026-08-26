import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEMO_ADMIN_NAV, isDemoNavActive } from '@/lib/demo-admin/nav';

const root = process.cwd();
const routes = ['page.tsx', 'catalog/page.tsx', 'orders/page.tsx', 'customers/page.tsx', 'marketing/page.tsx'];

describe('demo admin route contract', () => {
  it('contains every public demo route', () => {
    for (const route of routes) expect(existsSync(join(root, 'app/(demo-admin)/demo-admin', route))).toBe(true);
  });

  it('keeps route entrypoints server-rendered and fixture-backed', () => {
    for (const route of routes) {
      const source = readFileSync(join(root, 'app/(demo-admin)/demo-admin', route), 'utf8');
      expect(source).toContain('demoAdminFixtures');
      expect(source).toContain('DemoPageHeader');
      expect(source).not.toMatch(/'use client'|"use client"|hydration|localStorage|sessionStorage/i);
    }
  });

  it('keeps the layout independent from Auth.js and the real admin shell', () => {
    const source = readFileSync(join(root, 'app/(demo-admin)/demo-admin/layout.tsx'), 'utf8');
    expect(source).not.toMatch(/requireAdmin|@\/auth|components\/admin\/admin-shell/);
  });

  it('marks every public demo-admin route as non-indexable', () => {
    const source = readFileSync(join(root, 'app/(demo-admin)/demo-admin/layout.tsx'), 'utf8');
    expect(source).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  });

  it('uses the real admin shell geometry instead of a simplified demo layout', () => {
    const source = readFileSync(join(root, 'components/demo-admin/demo-admin-shell.tsx'), 'utf8');
    const styles = readFileSync(join(root, 'app/globals.css'), 'utf8');
    expect(source).toContain('demo-admin-sidebar');
    expect(source).toContain('demo-admin-main');
    expect(source).toContain('demo-admin-tabbar');
    expect(styles).toContain('width: 286px');
    expect(styles).toContain('margin-left: 286px');
    expect(styles).toContain('inset: auto 12px 12px');
    expect(styles).not.toContain('lg:grid-cols-[230px_minmax(0,1fr)]');
  });

  it('keeps the dashboard nav item exact while nested items use prefix matching', () => {
    const [dashboard, catalog] = DEMO_ADMIN_NAV;

    expect(isDemoNavActive(dashboard, '/demo-admin')).toBe(true);
    expect(isDemoNavActive(dashboard, '/demo-admin/catalog')).toBe(false);
    expect(isDemoNavActive(catalog, '/demo-admin/catalog/products')).toBe(true);
  });
});

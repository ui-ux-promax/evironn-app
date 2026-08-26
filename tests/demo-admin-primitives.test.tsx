import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const primitiveFiles = [
  'demo-page-header.tsx',
  'demo-panel.tsx',
  'demo-chart.tsx',
  'demo-donut.tsx',
  'demo-status.tsx',
  'demo-icon.tsx',
];

function readPrimitive(file: string): string {
  return readFileSync(join(root, 'components/demo-admin', file), 'utf8');
}

describe('demo-admin presentation boundary', () => {
  it('provides every demo-local primitive', () => {
    for (const file of primitiveFiles) {
      expect(existsSync(join(root, 'components/demo-admin', file)), file).toBe(true);
    }
  });

  it('keeps the shell and primitives independent from protected admin code', () => {
    const files = [
      'demo-admin-shell.tsx',
      'demo-kpi-grid.tsx',
      'demo-data-table.tsx',
      'demo-readonly-banner.tsx',
      ...primitiveFiles,
    ];
    const source = files.map((file) => readPrimitive(file)).join('\n');

    expect(source).not.toMatch(/@\/components\/admin|@\/app\/\(admin\)/);
    expect(source).not.toMatch(/@\/lib\/(auth|db|prisma|cloudinary)/);
    expect(source).not.toMatch(/use server|<form|action=\{/);
    expect(source).not.toMatch(/Ritm|ritm/i);
  });

  it('keeps the table read-only and action-free', () => {
    const source = readPrimitive('demo-data-table.tsx');

    expect(source).toContain('DemoDataTableColumn');
    expect(source).toContain('readonly');
    expect(source).not.toMatch(/action|onClick|onSubmit|button/i);
  });

  it('gives the shell the Evironn frame and shared read-only affordance', () => {
    const source = readPrimitive('demo-admin-shell.tsx');

    expect(source).toContain('Evironn');
    expect(source).toContain('DemoReadonlyBanner');
    expect(source).toContain('DEMO_ADMIN_NAV');
    expect(source).toContain('DemoIcon');
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const files = ['page.tsx', 'catalog/page.tsx', 'orders/page.tsx', 'customers/page.tsx', 'marketing/page.tsx'];

describe('demo admin render boundary', () => {
  it('reads only the demo snapshot and exposes no mutation controls', () => {
    for (const file of files) {
      const source = readFileSync(join(root, 'app/(demo-admin)/demo-admin', file), 'utf8');
      expect(source).toContain('getDemoAdminSnapshot');
      expect(source).not.toMatch(/prisma|app\/actions\/admin|delete|toggle|onSubmit/i);
    }
  });
});

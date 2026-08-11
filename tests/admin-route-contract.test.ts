import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_NAV } from '@/lib/admin/nav';
import { ADMIN_PRIMARY_ROUTE_ORDER, ADMIN_ROUTE_SMOKE_TARGETS } from '@/lib/admin/prototype-contract';

const root = process.cwd();

describe('admin prototype contract', () => {
  it('does not require ignored visual source files at test time', () => {
    for (const target of ADMIN_ROUTE_SMOKE_TARGETS) {
      expect(target).not.toHaveProperty('prototype');
    }
  });

  it('keeps every primary admin route backed by a page file', () => {
    for (const target of ADMIN_ROUTE_SMOKE_TARGETS) {
      expect(existsSync(join(root, target.pageFile))).toBe(true);
    }
  });

  it('keeps sidebar routes in prototype order', () => {
    expect(ADMIN_NAV.map((item) => item.href)).toEqual(ADMIN_PRIMARY_ROUTE_ORDER);
  });
});

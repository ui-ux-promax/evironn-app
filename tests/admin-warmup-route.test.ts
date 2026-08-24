import { existsSync, readdirSync, readFileSync, type Dirent } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const publicRoute = resolve('app/api/health/warmup/route.ts');
const adminRoute = resolve('app/api/admin/health/warmup/route.ts');

function adminRoutes(directory: string): string[] {
  return (readdirSync(resolve(directory), { recursive: true, withFileTypes: true }) as Dirent[])
    .filter((entry) => entry.isFile() && entry.name === 'route.ts')
    .map((entry) => join((entry as Dirent & { parentPath?: string }).parentPath ?? resolve(directory), entry.name));
}

describe('warmup route boundary contract', () => {
  it('keeps anonymous database warmup outside the admin namespace', () => {
    expect(existsSync(publicRoute)).toBe(true);
    expect(readFileSync(publicRoute, 'utf8')).toContain('export async function GET');
    expect(readFileSync(publicRoute, 'utf8')).toContain('prisma.$queryRaw');
    expect(readFileSync(publicRoute, 'utf8')).not.toContain('requireAdminApi');
    expect(existsSync(adminRoute)).toBe(false);
  });

  it('keeps every admin API route protected', () => {
    const routes = adminRoutes('app/api/admin');

    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      expect(readFileSync(resolve(route), 'utf8'), `${route} must require ADMIN access`).toContain('requireAdminApi');
    }
  });
});

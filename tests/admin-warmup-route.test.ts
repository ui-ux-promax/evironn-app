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

function repositoryWarmupCallers(): string[] {
  const roots = ['app', 'components', 'lib', 'services', 'scripts', 'e2e'];
  return roots.flatMap((directory) =>
    (readdirSync(resolve(directory), { recursive: true, withFileTypes: true }) as Dirent[])
      .filter((entry) => entry.isFile() && /\.(?:ts|tsx|js|mjs)$/.test(entry.name))
      .map((entry) => join((entry as Dirent & { parentPath?: string }).parentPath ?? resolve(directory), entry.name))
      .filter((file) => readFileSync(file, 'utf8').includes('/api/health/warmup')),
  );
}

describe('warmup route boundary contract', () => {
  it('retires the uncalled anonymous database warmup route outside the admin namespace', () => {
    expect(existsSync(publicRoute)).toBe(false);
    expect(existsSync(adminRoute)).toBe(false);
  });

  it('retires the public warmup route only after proving it has no repository callers', () => {
    expect(repositoryWarmupCallers()).toEqual([]);
    expect(existsSync(publicRoute)).toBe(false);
  });

  it('keeps every admin API route protected', () => {
    const routes = adminRoutes('app/api/admin');

    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      expect(readFileSync(resolve(route), 'utf8'), `${route} must require ADMIN access`).toContain('requireAdminApi');
    }
  });
});

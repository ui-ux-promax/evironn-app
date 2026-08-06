import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(__dirname, '..');

const requiredScripts = {
  format: 'prettier --write .',
  'format:check': 'prettier --check .',
  lint: 'eslint .',
  typecheck: 'tsc --noEmit',
  test: 'vitest run',
  'test:e2e': 'playwright test',
  build: 'vite build',
  'check:repository': 'node scripts/check-repository.mjs',
  gate: 'npm run format:check && npm run check:repository && npm run lint && npm run typecheck && npm run test',
  'gate:full': 'npm run gate && npm run build && npm run test:e2e',
};

describe('repository contract', () => {
  it('declares neutral package metadata and the required quality scripts', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'),
    );

    expect(packageJson).toMatchObject({
      name: 'evironn-storefront',
      private: true,
      version: '0.0.0',
      description: 'Evironn storefront baseline',
      scripts: requiredScripts,
    });
    expect(packageJson.repository).toBeUndefined();
    expect(packageJson.author).toBeUndefined();
  });

  it('limits the public route contract to home and product', async () => {
    const contracts = await import('../scripts/check-repository.mjs');

    expect(contracts.permittedRoutes).toEqual(['/', '/product']);
  });

  it('defines markers that prevent provenance and local-path leakage', async () => {
    const contracts = await import('../scripts/check-repository.mjs');

    expect(contracts.forbiddenMarkers).toEqual(
      expect.arrayContaining(['gr' + 'aft', 'file' + '://']),
    );
    expect(
      contracts.forbiddenMarkers.some(
        (marker: unknown) =>
          marker instanceof RegExp &&
          marker.test(String.fromCharCode(67, 58, 92) + 'workspace'),
      ),
    ).toBe(true);
  });

  it('ignores generated build artifacts', async () => {
    const ignored = readFileSync(resolve(repositoryRoot, '.gitignore'), 'utf8');

    for (const artifact of [
      'node_modules/',
      'dist/',
      'coverage/',
      'playwright-report/',
      'test-results/',
    ]) {
      expect(ignored).toContain(artifact);
    }
  });

  it('passes the repository audit', () => {
    expect(
      existsSync(resolve(repositoryRoot, 'scripts/check-repository.mjs')),
    ).toBe(true);

    expect(() =>
      execFileSync('node', ['scripts/check-repository.mjs'], {
        cwd: repositoryRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });
});

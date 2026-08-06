import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

const repositoryRoot = resolve(__dirname, '..');
const fixtureRoots: string[] = [];

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'repository-contract-'));

  fixtureRoots.push(root);
  return root;
}

function writeFixtureFile(
  root: string,
  path: string,
  contents: string | Buffer,
) {
  const file = join(root, path);

  mkdirSync(resolve(file, '..'), { recursive: true });
  writeFileSync(file, contents);
}

function writeRouteManifest(root: string, routes = ['/', '/product']) {
  writeFixtureFile(
    root,
    'src/routes.ts',
    `export const publicRoutes = ${JSON.stringify(routes)} as const;\n`,
  );
}

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

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

  it('requires an application route manifest when App is present', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeFixtureFile(
      fixture,
      'src/App.tsx',
      'export function App() { return null; }\n',
    );

    expect(() => contracts.auditRepository(fixture)).toThrow('route manifest');
  });

  it('rejects routes outside the public route manifest', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeRouteManifest(fixture, ['/', '/product', '/catalog']);

    expect(() => contracts.auditRepository(fixture)).toThrow('/catalog');
  });

  it('allows an application that declares only the approved routes', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeFixtureFile(
      fixture,
      'src/App.tsx',
      "import { publicRoutes } from './routes';\nexport { publicRoutes };\n",
    );
    writeRouteManifest(fixture);

    expect(() => contracts.auditRepository(fixture)).not.toThrow();
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

  it('rejects capture, screenshot, log, and generator artifacts by filename', async () => {
    const contracts = await import('../scripts/check-repository.mjs');

    for (const artifact of [
      'captures/home.webp',
      'public/assets/home-screenshot.webp',
      'logs/runtime.txt',
      'build.log',
      'generators/assets.mjs',
      'browser.trace',
    ]) {
      const fixture = createFixture();

      writeFixtureFile(fixture, artifact, Buffer.from([0, 255, 0, 255]));
      expect(() => contracts.auditRepository(fixture)).toThrow(artifact);
    }
  });

  it('allows legitimate product image filenames without reading their binary contents', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeFixtureFile(
      fixture,
      'public/assets/evironn-lounge-chair.webp',
      Buffer.from([0, 255, 0, 255]),
    );

    expect(() => contracts.auditRepository(fixture)).not.toThrow();
  });

  it('rejects POSIX local absolute paths in scanned text', async () => {
    const contracts = await import('../scripts/check-repository.mjs');

    for (const localPath of [
      '/' + ['Us', 'ers'].join('') + '/name',
      '/' + ['ho', 'me'].join('') + '/name',
    ]) {
      const fixture = createFixture();

      writeFixtureFile(
        fixture,
        'src/notes.ts',
        `export const note = '${localPath}';\n`,
      );
      expect(() => contracts.auditRepository(fixture)).toThrow(
        'forbidden content marker',
      );
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

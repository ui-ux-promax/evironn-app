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

function writeApp(root: string, source: string) {
  writeFixtureFile(root, 'src/App.tsx', source);
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

    writeApp(fixture, 'export function App() { return null; }\n');

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

    writeApp(
      fixture,
      "import { publicRoutes } from './routes';\nexport const routes = publicRoutes;\n",
    );
    writeRouteManifest(fixture);

    expect(() => contracts.auditRepository(fixture)).not.toThrow();
  });

  it('requires App to import and use the public route manifest', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeApp(fixture, 'export function App() { return null; }\n');
    writeRouteManifest(fixture);

    expect(() => contracts.auditRepository(fixture)).toThrow(
      'consume publicRoutes',
    );
  });

  it('rejects pathname route comparisons that are absent from the manifest', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeApp(
      fixture,
      "import { publicRoutes } from './routes';\nconst routes = publicRoutes;\nconst extra = window.location.pathname === '/catalog';\nexport { routes, extra };\n",
    );
    writeRouteManifest(fixture);

    expect(() => contracts.auditRepository(fixture)).toThrow('/catalog');
  });

  it('allows web-root asset strings in App JSX without treating them as routes', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeApp(
      fixture,
      'import { publicRoutes } from \'./routes\';\nexport function App() {\n  const routes = publicRoutes;\n  return <img src="/assets/evironn-chair.webp" alt={routes[0]} />;\n}\n',
    );
    writeRouteManifest(fixture);

    expect(() => contracts.auditRepository(fixture)).not.toThrow();
  });

  it('rejects pathname comparisons with asset-looking undeclared routes', async () => {
    const contracts = await import('../scripts/check-repository.mjs');

    for (const appSource of [
      "import { publicRoutes } from './routes';\nconst routes = publicRoutes;\nconst catalog = window.location.pathname === '/catalog.svg';\nexport { catalog, routes };\n",
      "import { publicRoutes } from './routes';\nconst routes = publicRoutes;\nconst pathname = location.pathname;\nconst debug = pathname === '/assets/debug';\nexport { debug, routes };\n",
    ]) {
      const fixture = createFixture();

      writeApp(fixture, appSource);
      writeRouteManifest(fixture);
      expect(() => contracts.auditRepository(fixture)).toThrow(
        'direct route literal',
      );
    }
  });

  it('rejects undeclared routes in pathname switch branches', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeApp(
      fixture,
      "import { publicRoutes } from './routes';\nconst routes = publicRoutes;\nconst pathname = window.location.pathname;\nswitch (pathname) {\n  case '/catalog':\n    break;\n}\nexport { routes };\n",
    );
    writeRouteManifest(fixture);

    expect(() => contracts.auditRepository(fixture)).toThrow('/catalog');
  });

  it('defines markers that prevent provenance and local-path leakage', async () => {
    const contracts = await import('../scripts/check-repository.mjs');

    expect(contracts.forbiddenMarkers).toEqual(
      expect.arrayContaining(['file' + '://']),
    );
    for (const marker of [
      ['furni', '-hero'].join(''),
      ['gr', 'aft'].join(''),
      ['cl', 'one'].join(''),
      ['kan', 'va'].join(''),
      ['dit', 'to'].join(''),
      ['open', ' design'].join(''),
      ['.cap', 'tures'].join(''),
    ]) {
      expect(
        contracts.forbiddenMarkers.some((candidate: unknown) =>
          candidate instanceof RegExp
            ? candidate.test(marker)
            : candidate === marker,
        ),
        marker,
      ).toBe(true);
    }
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
      'scripts/generator.mjs',
      'browser.trace',
      'runtime-log.txt',
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

  it('allows legitimate generator and log words in text content', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeFixtureFile(
      fixture,
      'src/product-copy.ts',
      "export const copy = 'A generator and log are not repository artifacts.';\n",
    );

    expect(() => contracts.auditRepository(fixture)).not.toThrow();
  });

  it('rejects POSIX local absolute paths in scanned text', async () => {
    const contracts = await import('../scripts/check-repository.mjs');

    for (const localPath of [
      '/' + ['Us', 'ers'].join('') + '/name',
      '/' + ['ho', 'me'].join('') + '/name',
      '/' + ['tm', 'p'].join('') + '/name',
      '/' + ['op', 't'].join('') + '/name',
      '/' + ['pri', 'vate'].join('') + '/name',
      '/' + ['mn', 't'].join('') + '/name',
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

  it('allows web-root asset paths in scanned text', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();

    writeFixtureFile(
      fixture,
      'src/assets.ts',
      "export const heroImage = '/assets/evironn-chair.webp';\n",
    );

    expect(() => contracts.auditRepository(fixture)).not.toThrow();
  });

  it('scans SVG text for forbidden local paths', async () => {
    const contracts = await import('../scripts/check-repository.mjs');
    const fixture = createFixture();
    const localPath = '/' + ['Us', 'ers'].join('') + '/name';

    writeFixtureFile(
      fixture,
      'public/icons/evironn-mark.svg',
      `<svg data-source="${localPath}"></svg>`,
    );

    expect(() => contracts.auditRepository(fixture)).toThrow(
      'forbidden content marker',
    );
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

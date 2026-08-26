import { readdirSync, readFileSync, type Dirent } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const sourceExtensions = /\.(?:ts|tsx|js|mjs)$/;
const privilegedRead =
  /\b(?:prisma|provider|cloudinary|listAdminProducts|listAdminOrders|getAdmin|getKpis|getKpiSeries|getStatusDistribution|getBestSellers|getLowStock|getRecentOrders|analytics|catalog|orderAdmin|customerAdmin)\b/i;

type RecursiveDirent = Dirent & { parentPath?: string };

function normalize(filePath: string): string {
  return filePath.split(sep).join('/');
}

function enumerateFiles(directory: string, predicate: (filePath: string) => boolean): string[] {
  const absoluteDirectory = join(root, directory);
  const entries = readdirSync(absoluteDirectory, { recursive: true, withFileTypes: true }) as RecursiveDirent[];

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath ?? absoluteDirectory, entry.name))
    .filter(predicate);
}

function relativePath(filePath: string): string {
  return normalize(relative(root, filePath));
}

function source(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

function codeOnly(text: string): string {
  let result = '';
  let index = 0;
  let mode: 'code' | 'line-comment' | 'block-comment' | 'single-quote' | 'double-quote' | 'template' = 'code';

  while (index < text.length) {
    const current = text[index];
    const next = text[index + 1];

    if (mode === 'line-comment') {
      result += current === '\n' ? '\n' : ' ';
      if (current === '\n') mode = 'code';
      index += 1;
      continue;
    }

    if (mode === 'block-comment') {
      result += current === '\n' ? '\n' : ' ';
      if (current === '*' && next === '/') {
        result += ' ';
        index += 2;
        mode = 'code';
      } else {
        index += 1;
      }
      continue;
    }

    if (mode === 'single-quote' || mode === 'double-quote' || mode === 'template') {
      result += current === '\n' ? '\n' : ' ';
      if (current === '\\') {
        result += ' ';
        index += 2;
      } else if (
        (mode === 'single-quote' && current === "'") ||
        (mode === 'double-quote' && current === '"') ||
        (mode === 'template' && current === '`')
      ) {
        mode = 'code';
        index += 1;
      } else {
        index += 1;
      }
      continue;
    }

    if (current === '/' && next === '/') {
      result += '  ';
      index += 2;
      mode = 'line-comment';
      continue;
    }

    if (current === '/' && next === '*') {
      result += '  ';
      index += 2;
      mode = 'block-comment';
      continue;
    }

    if (current === "'") {
      result += ' ';
      index += 1;
      mode = 'single-quote';
      continue;
    }

    if (current === '"') {
      result += ' ';
      index += 1;
      mode = 'double-quote';
      continue;
    }

    if (current === '`') {
      result += ' ';
      index += 1;
      mode = 'template';
      continue;
    }

    result += current;
    index += 1;
  }

  return result;
}

function matchingBrace(text: string, openingIndex: number): number {
  let depth = 0;
  let index = openingIndex;
  let mode: 'code' | 'line-comment' | 'block-comment' | 'single-quote' | 'double-quote' | 'template' = 'code';

  while (index < text.length) {
    const current = text[index];
    const next = text[index + 1];

    if (mode === 'line-comment') {
      if (current === '\n') mode = 'code';
      index += 1;
      continue;
    }

    if (mode === 'block-comment') {
      if (current === '*' && next === '/') {
        index += 2;
        mode = 'code';
      } else {
        index += 1;
      }
      continue;
    }

    if (mode === 'single-quote' || mode === 'double-quote' || mode === 'template') {
      if (current === '\\') {
        index += 2;
      } else if (
        (mode === 'single-quote' && current === "'") ||
        (mode === 'double-quote' && current === '"') ||
        (mode === 'template' && current === '`')
      ) {
        mode = 'code';
        index += 1;
      } else {
        index += 1;
      }
      continue;
    }

    if (current === '/' && next === '/') {
      index += 2;
      mode = 'line-comment';
      continue;
    }

    if (current === '/' && next === '*') {
      index += 2;
      mode = 'block-comment';
      continue;
    }

    if (current === "'") {
      mode = 'single-quote';
      index += 1;
      continue;
    }

    if (current === '"') {
      mode = 'double-quote';
      index += 1;
      continue;
    }

    if (current === '`') {
      mode = 'template';
      index += 1;
      continue;
    }

    if (current === '{') depth += 1;
    if (current === '}' && --depth === 0) return index;
    index += 1;
  }

  return -1;
}

type FunctionBody = { name: string; body: string };

function exportedFunctionBodies(text: string, asyncOnly: boolean): FunctionBody[] {
  const functions: FunctionBody[] = [];
  const functionPattern = new RegExp(
    `export\\s+(?:default\\s+)?${asyncOnly ? 'async\\s+' : '(?:async\\s+)?'}function\\s+([A-Za-z0-9_$]+)[\\s\\S]*?\\)\\s*(?:\\:[^{};=]+)?\\{`,
    'g',
  );

  for (const match of text.matchAll(functionPattern)) {
    const matchText = match[0];
    const openingIndex = (match.index ?? 0) + matchText.lastIndexOf('{');
    const closingIndex = matchingBrace(text, openingIndex);
    if (closingIndex === -1) continue;
    functions.push({ name: match[1], body: text.slice(openingIndex + 1, closingIndex) });
  }

  const asyncArrowPattern =
    /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*async\s*(?:<[^>]+>\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>\s*\{/g;
  for (const match of text.matchAll(asyncArrowPattern)) {
    const matchText = match[0];
    const openingIndex = (match.index ?? 0) + matchText.lastIndexOf('{');
    const closingIndex = matchingBrace(text, openingIndex);
    if (closingIndex === -1) continue;
    functions.push({ name: match[1], body: text.slice(openingIndex + 1, closingIndex) });
  }

  return functions;
}

function firstPrivilegedRead(body: string): number {
  const match = codeOnly(body).match(privilegedRead);
  return match?.index ?? -1;
}

function assertGuardBeforeRead(filePath: string, guardName: string): void {
  const functions = exportedFunctionBodies(source(filePath), true);
  expect(functions, `${relativePath(filePath)} must expose an exported async function`).not.toHaveLength(0);

  for (const fn of functions) {
    const body = codeOnly(fn.body);
    const guardIndex = body.indexOf(`${guardName}()`);
    const readIndex = firstPrivilegedRead(body);
    expect(guardIndex, `${relativePath(filePath)}:${fn.name} must call ${guardName}()`).toBeGreaterThanOrEqual(0);
    if (readIndex >= 0) {
      expect(guardIndex, `${relativePath(filePath)}:${fn.name} must guard before privileged reads`).toBeLessThan(
        readIndex,
      );
    }
  }
}

const adminRouteFiles = enumerateFiles('app/(admin)', (filePath) => {
  const route = relativePath(filePath);
  return sourceExtensions.test(filePath) && (route.endsWith('/page.tsx') || route.endsWith('/layout.tsx'));
});
const adminPageFiles = adminRouteFiles.filter((filePath) => relativePath(filePath).endsWith('/page.tsx'));
const adminActionFiles = enumerateFiles('app/actions/admin', (filePath) => sourceExtensions.test(filePath));
const adminApiFiles = enumerateFiles('app/api/admin', (filePath) => relativePath(filePath).endsWith('/route.ts'));
const adminClientFiles = [
  ...enumerateFiles('app/(admin)', (filePath) => sourceExtensions.test(filePath)),
  ...enumerateFiles('components/admin', (filePath) => sourceExtensions.test(filePath)),
].filter((filePath) => /^\s*["']use client["']/m.test(source(filePath)));
const scannedSourceFiles = ['app', 'components', 'lib', 'services', 'scripts', 'prisma', 'tests'].flatMap((directory) =>
  enumerateFiles(directory, (filePath) => sourceExtensions.test(filePath)),
);

const negativePageFixture = `
  export default async function MissingPageGuard() {
    return prisma.product.findMany();
  }
`;
const negativeAsyncArrowActionFixture = `
  export const asyncArrowAction = async () => {
    await prisma.product.findMany();
    return await requireAdminAction();
  };
`;
const negativeProviderBeforeGuardFixture = `
  export async function providerBeforeGuard() {
    const result = await provider.getDetails();
    const gate = await requireAdminAction();
    return { result, gate };
  }
`;

function guardViolations(text: string, guardName: string): string[] {
  return exportedFunctionBodies(text, true).flatMap((fn) => {
    const body = codeOnly(fn.body);
    const readIndex = firstPrivilegedRead(body);
    if (readIndex < 0) return [];

    const guardIndex = body.indexOf(`${guardName}()`);
    if (guardIndex < 0) return [`${fn.name} missing ${guardName}()`];
    if (guardIndex >= readIndex) return [`${fn.name} calls ${guardName}() after privileged access`];
    return [];
  });
}

describe('server-side ADMIN boundary contract', () => {
  it('discovers the staged protected pages and layouts', () => {
    expect(adminRouteFiles.length).toBeGreaterThan(0);
    expect(adminPageFiles.length).toBeGreaterThan(0);

    const discovered = new Set(adminRouteFiles.map(relativePath));
    expect([...discovered]).toEqual(
      expect.arrayContaining([
        'app/(admin)/layout.tsx',
        'app/(admin)/admin/page.tsx',
        'app/(admin)/admin/catalog/products/page.tsx',
        'app/(admin)/admin/catalog/categories/page.tsx',
        'app/(admin)/admin/catalog/page.tsx',
        'app/(admin)/admin/catalog/layout.tsx',
      ]),
    );
  });

  it('keeps the route-group guard ahead of every nested admin read', () => {
    const rootLayout = adminRouteFiles.find((filePath) => relativePath(filePath) === 'app/(admin)/layout.tsx');
    expect(rootLayout).toBeDefined();
    assertGuardBeforeRead(rootLayout!, 'requireAdminPage');

    const redirectPage = adminPageFiles.find(
      (filePath) => relativePath(filePath) === 'app/(admin)/admin/catalog/page.tsx',
    );
    expect(redirectPage).toBeDefined();
    const redirectCode = codeOnly(source(redirectPage!));
    expect(redirectCode).toMatch(/\bredirect\s*\(/);
    expect(firstPrivilegedRead(redirectCode)).toBe(-1);

    const catalogLayout = adminRouteFiles.find(
      (filePath) => relativePath(filePath) === 'app/(admin)/admin/catalog/layout.tsx',
    );
    expect(catalogLayout).toBeDefined();
    const catalogLayoutCode = codeOnly(source(catalogLayout!));
    expect(catalogLayoutCode).toContain('CatalogTabs');
    expect(firstPrivilegedRead(catalogLayoutCode)).toBe(-1);

    for (const pageFile of adminPageFiles.filter((filePath) => filePath !== redirectPage)) {
      const functions = exportedFunctionBodies(source(pageFile), false);
      expect(functions, `${relativePath(pageFile)} must resolve an exported page`).not.toHaveLength(0);
      for (const fn of functions) {
        const body = codeOnly(fn.body);
        const readIndex = firstPrivilegedRead(body);
        if (readIndex < 0) continue;

        const localGuardIndex = body.indexOf('requireAdminPage()');
        expect(
          localGuardIndex,
          `${relativePath(pageFile)}:${fn.name} must call requireAdminPage()`,
        ).toBeGreaterThanOrEqual(0);
        expect(localGuardIndex, `${relativePath(pageFile)}:${fn.name} must guard before reads`).toBeLessThan(readIndex);
      }
    }
  });

  it('protects the new marketing page locally before rendering', () => {
    const pageFile = adminPageFiles.find(
      (filePath) => relativePath(filePath) === 'app/(admin)/admin/marketing/new/page.tsx',
    );
    expect(pageFile).toBeDefined();

    const pageFunctions = exportedFunctionBodies(source(pageFile!), true);
    const page = pageFunctions.find((fn) => fn.name === 'NewCouponPage');
    expect(page, 'new marketing page must be an exported async server page').toBeDefined();

    const body = codeOnly(page!.body);
    const guardIndex = body.indexOf('requireAdminPage()');
    const renderIndex = body.indexOf('return');
    expect(guardIndex, 'new marketing page must call requireAdminPage()').toBeGreaterThanOrEqual(0);
    expect(guardIndex, 'new marketing page must guard before rendering').toBeLessThan(renderIndex);
  });

  it('guards every exported async admin action before Prisma', () => {
    expect(adminActionFiles.length).toBeGreaterThan(0);

    for (const filePath of adminActionFiles) {
      const functions = exportedFunctionBodies(source(filePath), true);
      expect(functions, `${relativePath(filePath)} must resolve exported async actions`).not.toHaveLength(0);
      for (const fn of functions) {
        const body = codeOnly(fn.body);
        const guardIndex = body.indexOf('requireAdminAction()');
        const privilegedIndex = firstPrivilegedRead(body);
        expect(
          guardIndex,
          `${relativePath(filePath)}:${fn.name} must call requireAdminAction()`,
        ).toBeGreaterThanOrEqual(0);
        if (privilegedIndex >= 0) {
          expect(guardIndex, `${relativePath(filePath)}:${fn.name} must guard before Prisma or providers`).toBeLessThan(
            privilegedIndex,
          );
        }
      }
    }
  });

  it('guards every admin API handler before Prisma, Cloudinary, or providers', () => {
    expect(adminApiFiles.length).toBeGreaterThan(0);

    for (const filePath of adminApiFiles) {
      const functions = exportedFunctionBodies(source(filePath), false);
      expect(functions, `${relativePath(filePath)} must resolve exported API handlers`).not.toHaveLength(0);
      for (const fn of functions) {
        const body = codeOnly(fn.body);
        const guardIndex = body.indexOf('requireAdminApi()');
        const providerIndex = firstPrivilegedRead(body);
        expect(guardIndex, `${relativePath(filePath)}:${fn.name} must call requireAdminApi()`).toBeGreaterThanOrEqual(
          0,
        );
        if (providerIndex >= 0) {
          expect(guardIndex, `${relativePath(filePath)}:${fn.name} must guard before providers`).toBeLessThan(
            providerIndex,
          );
        }
      }
    }
  });

  it('detects missing page guards in negative fixtures', () => {
    expect(guardViolations(negativePageFixture, 'requireAdminPage')).toEqual([
      'MissingPageGuard missing requireAdminPage()',
    ]);
  });

  it('detects exported async-arrow actions in negative fixtures', () => {
    const functions = exportedFunctionBodies(negativeAsyncArrowActionFixture, true);

    expect(functions.map((fn) => fn.name)).toContain('asyncArrowAction');
    expect(guardViolations(negativeAsyncArrowActionFixture, 'requireAdminAction')).toEqual([
      'asyncArrowAction calls requireAdminAction() after privileged access',
    ]);
  });

  it('detects provider access before action guards in negative fixtures', () => {
    expect(guardViolations(negativeProviderBeforeGuardFixture, 'requireAdminAction')).toEqual([
      'providerBeforeGuard calls requireAdminAction() after privileged access',
    ]);
  });

  it('keeps role decisions on the server side', () => {
    expect(adminClientFiles.length).toBeGreaterThan(0);
    const roleComparison =
      /(?:\brole\b|\buser\.role\b)\s*(?:===|!==|==|!=)|(?:===|!==|==|!=)\s*(?:\brole\b|\buser\.role\b)|switch\s*\(\s*(?:\brole\b|\buser\.role\b)/;

    for (const filePath of adminClientFiles) {
      expect(codeOnly(source(filePath)), `${relativePath(filePath)} must not compare role`).not.toMatch(roleComparison);
    }
  });

  it('keeps admin analytics and catalog imports inside allowed boundaries', () => {
    expect(scannedSourceFiles.length).toBeGreaterThan(0);
    const allowedPrefixes = ['app/(admin)/', 'app/actions/admin/', 'app/api/admin/', 'tests/'];
    const forbiddenImport = /\/lib\/admin\/(?:catalog|analytics)(?:['"/])/;
    const violations = scannedSourceFiles
      .filter((filePath) => !allowedPrefixes.some((prefix) => relativePath(filePath).startsWith(prefix)))
      .filter((filePath) => forbiddenImport.test(source(filePath)))
      .map(relativePath);

    expect(violations).toEqual([]);
  });
});

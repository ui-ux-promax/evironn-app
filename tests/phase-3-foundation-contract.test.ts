import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import * as ts from 'typescript';

import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');
const forbiddenImportPaths = ['d:/projects/fashion-shop', 'd:/новая папка (2)/evironn-clone'];

function collectFiles(relativeDirectory: string): string[] {
  return readdirSync(resolve(root, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = join(relativeDirectory, entry.name);
    return entry.isDirectory() ? collectFiles(relativePath) : [relativePath.replaceAll('\\', '/')];
  });
}

type SourceEntry = { file: string; source: string };
type ImportViolation = { file: string; specifier: string };

function collectImportSpecifiers(source: string): string[] {
  const sourceFile = ts.createSourceFile('phase-3-import-fixture.ts', source, ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      specifiers.push(node.moduleReference.expression.text);
    }

    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      if (isDynamicImport || isRequire) specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
}

function findForbiddenProductionImports(entries: SourceEntry[]): ImportViolation[] {
  return entries
    .slice()
    .sort((left, right) => left.file.localeCompare(right.file))
    .flatMap(({ file, source }) =>
      collectImportSpecifiers(source)
        .filter((specifier) => {
          const normalized = specifier.replaceAll('\\', '/').toLowerCase();
          return forbiddenImportPaths.some((path) => normalized.includes(path));
        })
        .map((specifier) => ({ file, specifier })),
    );
}

describe('Phase 3 foundation boundary', () => {
  it('keeps canonical SKU, cart, and order relations in the Prisma schema', () => {
    const schema = read('prisma/schema.prisma');

    expect(schema).toMatch(/model Sku\s*\{[\s\S]*?cartItems\s+CartItem\[\][\s\S]*?orderItems\s+OrderItem\[\]/);
    expect(schema).toMatch(/model CartItem\s*\{[\s\S]*?skuId\s+String\?[\s\S]*?sku\s+Sku\?/);
    expect(schema).toMatch(/model OrderItem\s*\{[\s\S]*?skuId\s+String\?[\s\S]*?canonicalSku\s+Sku\?/);
    expect(schema).toContain('@@unique([cartId, skuId])');
    expect(schema).toContain('skuArticleNumber  String?');
    expect(schema).toContain('skuCombinationKey String?');
  });

  it('keeps Auth.js role propagation and safe callback boundaries', () => {
    const authConfig = read('auth.config.ts');
    const auth = read('auth.ts');
    const safeRedirect = read('lib/safe-redirect.ts');
    const authAction = read('app/actions/auth.ts');

    expect(authConfig).toContain("type Role = 'CUSTOMER' | 'ADMIN';");
    expect(authConfig).toContain('token.role');
    expect(authConfig).toContain('session.user.role');
    expect(auth).toContain("from 'next-auth'");
    expect(safeRedirect).toContain('export function safeCallbackUrl');
    expect(authAction).toContain("import('@/lib/safe-redirect')");
    expect(authAction).toContain('safeCallbackUrl(callbackUrl)');
  });

  it('merges guest cart and wishlist during the Auth.js sign-in event', () => {
    const auth = read('auth.ts');

    expect(auth).toContain("import('@/lib/cart-merge')");
    expect(auth).toContain('safeMergeGuestCart(guestToken, user.id)');
    expect(auth).toContain("import('@/lib/wishlist-merge')");
    expect(auth).toContain('safeMergeGuestWishlist(guestWishlistToken, user.id)');
  });

  it('contains no clone or technical-source absolute imports in production code', () => {
    const productionFiles = [
      ...['app', 'components', 'lib', 'services'].flatMap(collectFiles),
      'auth.ts',
      'auth.config.ts',
      'middleware.ts',
    ].sort();

    expect(findForbiddenProductionImports(productionFiles.map((file) => ({ file, source: read(file) })))).toEqual([]);
  });

  it('keeps production import scanning independent from external search binaries', () => {
    const externalScanCall = ['execFileSync', 'rg'].join("('");
    expect(read('tests/phase-3-foundation-contract.test.ts')).not.toContain(externalScanCall);
  });

  it('rejects clone and technical-source paths in side-effect, dynamic, and require imports', () => {
    const fixtures = [
      { syntax: 'side-effect', template: (path: string) => `import '${path}';` },
      { syntax: 'dynamic', template: (path: string) => `void import('${path}');` },
      { syntax: 'require', template: (path: string) => `require('${path}');` },
    ];

    for (const { syntax, template } of fixtures) {
      for (const path of ['D:/Projects/fashion-shop/src/legacy', 'D:/Новая папка (2)/evironn-clone/src/legacy']) {
        expect(findForbiddenProductionImports([{ file: `fixture-${syntax}.ts`, source: template(path) }])).toEqual([
          { file: `fixture-${syntax}.ts`, specifier: path },
        ]);
      }
    }
  });

  it('ignores clone and technical-source paths outside production import expressions', () => {
    const source = `const note = 'D:/Projects/fashion-shop'; // D:/Новая папка (2)/evironn-clone`;

    expect(findForbiddenProductionImports([{ file: 'fixture.ts', source }])).toEqual([]);
  });

  it('uses read-only HTTP keep-warm and disposable database environment keys', () => {
    const globalSetup = read('e2e/global-setup.ts');
    const envExample = read('.env.example');

    expect(globalSetup).not.toContain("from '@neondatabase/serverless'");
    expect(globalSetup).not.toMatch(/\bneon\s*\(/i);
    expect(globalSetup).not.toMatch(/\bctx\.post\b|\bctx\.put\b|\bctx\.patch\b|\bctx\.delete\b/);
    expect(globalSetup).toContain("'/api/cart'");
    expect(globalSetup).toContain("'/api/wishlist/count'");
    expect(globalSetup).toContain("'/product/noma-woven-lounge'");
    expect(globalSetup).toContain('setInterval');
    expect(globalSetup).toContain('15_000');
    expect(globalSetup).toContain('clearInterval');
    expect(globalSetup).toContain('ctx.dispose');
    expect(envExample).toMatch(/^E2E_DATABASE_URL=""$/m);
    expect(envExample).toMatch(/^E2E_DATABASE_URL_UNPOOLED=""$/m);
    expect(envExample).toMatch(/^E2E_DATABASE_ALLOW_WRITES=""$/m);
  });
});

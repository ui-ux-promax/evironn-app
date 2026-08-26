import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

export const DEMO_ENTRYPOINTS = [
  'app/(demo-admin)/demo-admin/page.tsx',
  'app/(demo-admin)/demo-admin/catalog/page.tsx',
  'app/(demo-admin)/demo-admin/orders/page.tsx',
  'app/(demo-admin)/demo-admin/customers/page.tsx',
  'app/(demo-admin)/demo-admin/marketing/page.tsx',
  'app/(demo-admin)/demo-admin/layout.tsx',
] as const;

const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx'] as const;
const localImportPattern = /\b(?:import|export)\s+(?:[^'";\n]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const dynamicImportPattern = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const dynamicLocalImportPattern = /\bimport\s*\(\s*([^'"\s][^)]*)\)/g;

function sourceFiles(directory: string): string[] {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [path.replaceAll('\\', '/')] : [];
  });
}

function resolveLocalImport(importer: string, specifier: string): string | null {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return null;

  const base = specifier.startsWith('@/')
    ? join(root, specifier.slice(2))
    : resolve(dirname(resolve(root, importer)), specifier);
  const candidates = [
    base,
    ...sourceExtensions.map((extension) => `${base}${extension}`),
    ...sourceExtensions.map((extension) => join(base, `index${extension}`)),
  ];
  const match = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
  return match ? relative(root, match).replaceAll('\\', '/') : null;
}

function importedSpecifiers(source: string): { specifier: string; dynamic: boolean }[] {
  const imports = [...source.matchAll(localImportPattern)].map((match) => ({ specifier: match[1], dynamic: false }));
  const dynamicImports = [...source.matchAll(dynamicImportPattern)].map((match) => ({
    specifier: match[1],
    dynamic: true,
  }));
  return [...imports, ...dynamicImports];
}

export function scanDemoClosure(entrypoints: readonly string[] = DEMO_ENTRYPOINTS): ReadonlySet<string> {
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(file: string): void {
    const normalized = file.replaceAll('\\', '/');
    if (visited.has(normalized)) return;
    if (visiting.has(normalized)) return;

    visiting.add(normalized);
    const source = readFileSync(resolve(root, normalized), 'utf8');
    for (const { specifier } of importedSpecifiers(source)) {
      if (!specifier.startsWith('.') && !specifier.startsWith('@/')) continue;
      const local = resolveLocalImport(normalized, specifier);
      if (!local) throw new Error(`${normalized}: unresolved local import ${specifier}`);
      visit(local);
    }
    visiting.delete(normalized);
    visited.add(normalized);
  }

  for (const entrypoint of entrypoints) visit(entrypoint);
  return visited;
}

const forbiddenClosurePatterns: readonly RegExp[] = [
  /@prisma\/client|@\/lib\/prisma|@\/auth|auth\.js|next-auth/i,
  /cloudinary|@\/app\/actions|@\/app\/api|yookassa|stripe|resend/i,
  /components\/admin|evironn-clone/i,
  /['"]use server['"]|revalidate(?:Path|Tag)|cookies\s*\(|headers\s*\(|process\.env/i,
  /Date\.now\s*\(|Math\.random\s*\(|crypto\.randomUUID\s*\(|toLocale(?:String|DateString)\s*\(|\bIntl\./,
  /\b(?:create|update|delete|remove|save|mutate|submit|toggle|reset)\w*\s*\(/i,
  /\baction\s*=\s*(?:\{|['"])/i,
];

describe('demo admin recursive import closure', () => {
  it('walks all six entrypoints recursively with alias, export, dynamic, and cycle handling', () => {
    const closure = scanDemoClosure();

    expect(closure.size).toBeGreaterThanOrEqual(19);
    for (const entrypoint of DEMO_ENTRYPOINTS) expect(closure.has(entrypoint)).toBe(true);
    for (const file of [
      ...sourceFiles('app/(demo-admin)'),
      ...sourceFiles('components/demo-admin'),
      ...sourceFiles('lib/demo-admin'),
    ]) {
      expect(closure.has(file), `missing from closure: ${file}`).toBe(true);
    }
  });

  it('rejects unresolved local imports and non-demo server, provider, mutation, environment, and locale boundaries', () => {
    const closure = scanDemoClosure();
    const violations: string[] = [];

    for (const file of closure) {
      const source = readFileSync(resolve(root, file), 'utf8');
      for (const pattern of forbiddenClosurePatterns) if (pattern.test(source)) violations.push(`${file}: ${pattern}`);
      if (dynamicLocalImportPattern.test(source)) violations.push(`${file}: non-literal dynamic import`);
    }

    expect(violations).toEqual([]);
  });

  it('uses one closure scanner for every demo entrypoint and never crosses into protected admin links', () => {
    const allFiles = new Set<string>();
    for (const entrypoint of DEMO_ENTRYPOINTS) for (const file of scanDemoClosure([entrypoint])) allFiles.add(file);

    expect(allFiles).toEqual(scanDemoClosure());
    for (const file of allFiles) {
      const source = readFileSync(resolve(root, file), 'utf8');
      expect(source).not.toMatch(/['"]\/admin(?:['"/?]|$)/);
    }
  });
});

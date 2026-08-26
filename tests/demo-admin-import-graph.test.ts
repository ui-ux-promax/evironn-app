import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
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
const allowedBareImports = new Set(['next', 'next/link', 'next/navigation', 'react']);
const localImportPattern = /\b(?:import|export)\s+(?:[^'";\n]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const dynamicImportPattern = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const requireTokenPattern = /\brequire\b/g;

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

export function findDemoBoundaryViolations(file: string, source: string): string[] {
  const violations: string[] = [];
  const nodeBuiltins = new Set(builtinModules.map((specifier) => specifier.replace(/^node:/, '')));

  for (const { specifier } of importedSpecifiers(source)) {
    if (nodeBuiltins.has(specifier.replace(/^node:/, '')))
      violations.push(`${file}: forbidden Node built-in import ${specifier}`);
    else if (!specifier.startsWith('.') && !specifier.startsWith('@/') && !allowedBareImports.has(specifier))
      violations.push(`${file}: disallowed bare import ${specifier}`);
  }
  for (const match of source.matchAll(requireTokenPattern)) {
    const index = match.index ?? 0;
    const suffix = source.slice(index + match[0].length);
    const call = suffix.match(/^(?:(?:\s+|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*(?:\r\n?|\n|$)))*(?:\?\.\s*)?\(([\s\S]*?)\)/);
    const parenthesizedCall = suffix.match(/^\s*\)\s*(?:\?\.\s*)?\(([\s\S]*?)\)/);
    const argument = (call ?? parenthesizedCall)?.[1]?.trim();
    const literal = argument?.match(/^(['"])([\s\S]*)\1$/)?.[2];
    const detail = argument === undefined ? 'reference' : `(${(literal ?? argument) || 'non-literal'})`;
    violations.push(`${file}: require${detail}`);
  }
  if (/\bimport\s*\(\s*([^'"\s][^)]*)\)/.test(source)) violations.push(`${file}: non-literal dynamic import`);

  const forbiddenPatterns: readonly [RegExp, string][] = [
    [/\b(?:readFile|writeFile|appendFile|readdir|stat|unlink|mkdir|rm)(?:Sync)?\s*\(/i, 'filesystem API'],
    [/\b(?:fetch|XMLHttpRequest)\s*\(/i, 'network API'],
    [/\b(?:unstable_cache|cache)\s*\(/i, 'cache API'],
    [/\bprocess\.env\b/i, 'environment access'],
    [/cloudinary|yookassa|stripe|resend|@prisma\/client|next-auth|auth\.js/i, 'provider or auth boundary'],
    [/\b(?:create|update|delete|remove|save|mutate|submit|toggle|reset)\w*\s*\(/i, 'mutation boundary'],
  ];
  for (const [pattern, label] of forbiddenPatterns) if (pattern.test(source)) violations.push(`${file}: ${label}`);
  return violations;
}

export function scanDemoClosure(
  entrypoints: readonly string[] = DEMO_ENTRYPOINTS,
  readSource: (file: string) => string = (file) => readFileSync(resolve(root, file), 'utf8'),
): ReadonlySet<string> {
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(file: string): void {
    const normalized = file.replaceAll('\\', '/');
    if (visited.has(normalized)) return;
    if (visiting.has(normalized)) return;

    visiting.add(normalized);
    const source = readSource(normalized);
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
      violations.push(...findDemoBoundaryViolations(file, source));
    }

    expect(violations).toEqual([]);
  });

  it('rejects each promised forbidden boundary in focused negative fixtures', () => {
    const fixtures = [
      ["import fs from 'node:fs';", 'filesystem'],
      ["import { readFile } from 'node:fs/promises';", 'filesystem subpath'],
      ["import { createServer } from 'node:http2';", 'server builtin subpath'],
      ["fetch('https://example.invalid');", 'network'],
      ["import axios from 'axios';", 'alternate network client axios'],
      ["import { request } from 'undici';", 'alternate network client undici'],
      ["import got from 'got';", 'alternate network client got'],
      ["import { unstable_cache } from 'next/cache';", 'cache'],
      ['process.env.DEMO_SECRET;', 'environment'],
      ["import { v2 as cloudinary } from 'cloudinary';", 'provider'],
      ['deleteDemoRecord();', 'mutation'],
      ["require('node:fs');", 'require'],
      ['require(moduleName);', 'require identifier'],
      ['require(`node:${moduleName}`);', 'require template literal'],
      ["require /* comment */ ('node:fs');", 'require comment-separated call'],
      ["require?.('node:fs');", 'require optional call'],
      ["(require)('node:fs');", 'require parenthesized callee'],
      ['import(`./${name}`);', 'dynamic import'],
    ] as const;

    for (const [source, label] of fixtures) {
      expect(findDemoBoundaryViolations(`fixture-${label}.ts`, source), label).not.toEqual([]);
    }
  });

  it('rejects unresolved local imports in recursive closure fixtures', () => {
    expect(() => scanDemoClosure(['fixture-unresolved.ts'], () => "import './missing-local-fixture';")).toThrow(
      'fixture-unresolved.ts: unresolved local import ./missing-local-fixture',
    );
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

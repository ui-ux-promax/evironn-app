import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const demoRoots = ['app/(demo-admin)', 'components/demo-admin', 'lib/demo-admin'];
const forbiddenImports =
  /@\/lib\/prisma|@prisma\/client|@\/auth|@auth\/|auth\.js|next-auth|@\/app\/actions\/admin|@\/app\/api\/admin|payment|yookassa|stripe/i;

function collectSourceFiles(directory: string): string[] {
  const absoluteDirectory = join(root, directory);
  const files: string[] = [];

  for (const entry of readdirSync(absoluteDirectory)) {
    const absoluteEntry = join(absoluteDirectory, entry);
    const stats = statSync(absoluteEntry);

    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(join(directory, entry)));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry)) files.push(absoluteEntry);
  }

  return files;
}

describe('demo admin isolation', () => {
  it('has no live data, auth, or mutation imports', () => {
    const source = demoRoots
      .flatMap((directory) => collectSourceFiles(directory))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(source).not.toMatch(forbiddenImports);
  });
});

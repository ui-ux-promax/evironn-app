import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const root = resolve(import.meta.dirname, '..');

test('prototype workspace is source-only and documents public-entry boundary', () => {
  const readmePath = resolve(root, 'prototypes/README.md');
  expect(existsSync(readmePath)).toBe(true);
  const readme = readFileSync(readmePath, 'utf8');
  expect(readme).toContain('source-only');
  expect(readme).toContain('not a public route');
});

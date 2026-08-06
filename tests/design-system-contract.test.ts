import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { designSystemTokens } from '../src/design-system/tokens';

const root = resolve(import.meta.dirname, '..');

test('exports canonical semantic token groups', () => {
  expect(designSystemTokens.color).toContain('--ev-ds-color-text');
  expect(designSystemTokens.radius).toEqual([
    '--ev-ds-radius-sm',
    '--ev-ds-radius-md',
    '--ev-ds-radius-lg',
    '--ev-ds-radius-pill',
  ]);
  expect(designSystemTokens.motion).toContain('--ev-ds-motion-ease');
  expect(designSystemTokens.spacing).toContain('--ev-ds-space-8');
});

test('canonical CSS declares source design-system values', () => {
  const css = readFileSync(
    resolve(root, 'src/design-system/tokens.css'),
    'utf8',
  );
  expect(css).toContain('--ev-ds-color-bg: 40 20% 97%');
  expect(css).toContain('--ev-ds-radius-lg: 28px');
  expect(css).toContain('--ev-ds-motion-ease: cubic-bezier(0.32, 0.72, 0, 1)');
});

test('design-system audit passes P1-owned files', () => {
  expect(() =>
    execFileSync(process.execPath, ['scripts/check-design-system.mjs'], {
      cwd: root,
      stdio: 'pipe',
    }),
  ).not.toThrow();
});

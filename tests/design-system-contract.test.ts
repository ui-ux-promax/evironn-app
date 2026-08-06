import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { auditDesignSystem } from '../scripts/check-design-system.mjs';
import {
  designSystemTokenSource,
  designSystemTokenProvenance,
  designSystemTokens,
} from '../src/design-system/tokens';

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
  expect(designSystemTokenSource).toMatchObject({
    semantic: 'source token block',
    spacing: 'spacing specimen',
    controls: 'button specimen',
  });
  const css = readFileSync(
    resolve(root, 'src/design-system/tokens.css'),
    'utf8',
  );
  const tokenNames = Object.values(designSystemTokens).flat();
  expect(Object.keys(designSystemTokenProvenance).sort()).toEqual(
    [...tokenNames].sort(),
  );
  for (const tokenName of tokenNames) expect(css).toContain(`${tokenName}:`);
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

test('design-system audit rejects named colors and non-token motion durations', () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'evironn-design-system-'));
  const sourceRoot = resolve(fixture, 'src/prototypes');
  mkdirSync(sourceRoot, { recursive: true });
  const cssPath = resolve(sourceRoot, 'invalid.css');

  try {
    writeFileSync(
      cssPath,
      '.bad { color: red; transition: opacity 200ms var(--ev-ds-motion-ease); }',
    );
    expect(() => auditDesignSystem(fixture)).toThrow(/raw color literal/);
    writeFileSync(
      cssPath,
      '.bad { color: var(--ev-ds-color-text); transition: opacity 200ms var(--ev-ds-motion-ease); }',
    );
    expect(() => auditDesignSystem(fixture)).toThrow(
      /non-token transition value/,
    );
    writeFileSync(
      cssPath,
      '<div style={{ color: "red", transitionDuration: "200ms" }} />',
    );
    expect(() => auditDesignSystem(fixture)).toThrow(/raw inline visual value/);
    writeFileSync(cssPath, '<a href="/demo-admin">Admin</a>');
    expect(() => auditDesignSystem(fixture)).toThrow(/forbidden route marker/);
    writeFileSync(cssPath, '.bad { background: #fff; }');
    expect(() => auditDesignSystem(fixture)).toThrow(/raw color literal/);
    writeFileSync(
      cssPath,
      '.bad { font-size: 12px; font-weight: 400; line-height: 1.2; letter-spacing: 0.1em; }',
    );
    expect(() => auditDesignSystem(fixture)).toThrow(
      /non-token font-size value/,
    );
    expect(() => auditDesignSystem(fixture)).toThrow(
      /non-token font-weight value/,
    );
    expect(() => auditDesignSystem(fixture)).toThrow(
      /non-token line-height value/,
    );
    expect(() => auditDesignSystem(fixture)).toThrow(
      /non-token letter-spacing value/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

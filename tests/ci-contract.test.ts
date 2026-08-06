import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(__dirname, '..');

describe('quality workflow contract', () => {
  it('installs the Playwright Chromium dependency and runs the full quality gate', () => {
    const workflow = readFileSync(
      resolve(repositoryRoot, '.github/workflows/quality.yml'),
      'utf8',
    );

    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npx playwright install --with-deps chromium');
    expect(workflow).toContain('npm run gate:full');
    expect(workflow).toContain('push:');
    expect(workflow).not.toContain('branches: [main]');
    expect(workflow).not.toContain('npm run gate\n');
  });
});

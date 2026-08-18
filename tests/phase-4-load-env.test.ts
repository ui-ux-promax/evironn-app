import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadE2eEnvironment } from '@/e2e/load-env';

const testEnvKey = 'PHASE4_LOAD_ENV_TEST_KEY';
const cleanupPaths: string[] = [];

afterEach(() => {
  delete process.env[testEnvKey];
  for (const cleanupPath of cleanupPaths.splice(0)) rmSync(cleanupPath, { force: true, recursive: true });
});

describe('Phase 4 standalone environment loading', () => {
  it('loads a supplied env file into the current process', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'phase4-env-'));
    cleanupPaths.push(directory);
    const envPath = path.join(directory, '.env.local');
    writeFileSync(envPath, `${testEnvKey}=loaded\n`);

    loadE2eEnvironment(envPath);

    expect(process.env[testEnvKey]).toBe('loaded');
  });

  it('ignores a missing local env file', () => {
    expect(() => loadE2eEnvironment(path.join(tmpdir(), 'phase4-env-missing', '.env.local'))).not.toThrow();
  });
});

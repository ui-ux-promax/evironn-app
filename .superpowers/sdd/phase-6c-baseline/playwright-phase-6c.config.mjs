import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: resolve(dirname(fileURLToPath(import.meta.url)), '../../../e2e'),
  testMatch: '**/performance/furniture-editorial-lazy.spec.ts',
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3106',
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: {} }],
});

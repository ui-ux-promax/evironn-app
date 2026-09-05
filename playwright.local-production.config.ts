import { defineConfig, devices } from '@playwright/test';

const port = 3004;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 50_000 },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    actionTimeout: 50_000,
    navigationTimeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/local-production-e2e-server.mjs',
    url: `http://localhost:${port}/assets/products/01-bar-stool-idle.webp`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { LOCAL_PRODUCTION_E2E_PORT: String(port) },
  },
});

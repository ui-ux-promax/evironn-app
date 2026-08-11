import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('smoke script checks public and protected routes', () => {
  const source = readFileSync('scripts/smoke-production.mjs', 'utf8');
  for (const path of [
    '/',
    '/catalog',
    '/demo-admin',
    '/demo-admin/catalog',
    '/demo-admin/orders',
    '/demo-admin/customers',
    '/demo-admin/marketing',
    '/api/health',
    '/admin',
  ]) {
    expect(source).toContain(path);
  }
});

it('runs smoke after a successful deployment', () => {
  const yaml = readFileSync('.github/workflows/deployment-smoke.yml', 'utf8');
  expect(yaml).toContain('deployment_status:');
  expect(yaml).toContain('github.event.deployment_status.target_url');
  expect(yaml).toContain('npm run smoke:production');
});

it('runs production smoke only for production deployments', () => {
  const yaml = readFileSync('.github/workflows/deployment-smoke.yml', 'utf8');
  expect(yaml).toContain("github.event.deployment.environment == 'Production'");
});

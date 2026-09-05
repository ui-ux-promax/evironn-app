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
  expect(source).toContain('if (!response.ok)');
  expect(source).toContain('/admin: expected redirect');
  expect(source).toContain("redirect: 'manual'");
});

it('runs smoke after a successful deployment', () => {
  const yaml = readFileSync('.github/workflows/deployment-smoke.yml', 'utf8');
  expect(yaml).toContain('deployment_status:');
  expect(yaml).toContain('SMOKE_BASE_URL: https://evironn-app.vercel.app');
  expect(yaml).toContain('DEPLOYMENT_STATE: ${{ github.event.deployment_status.state }}');
  expect(yaml).toContain('Deployment status is');
  expect(yaml).toContain('npm run smoke:production');
  expect(yaml).not.toContain('continue-on-error');
});

it('does not allow a skipped required smoke job', () => {
  const yaml = readFileSync('.github/workflows/deployment-smoke.yml', 'utf8');
  expect(yaml).not.toContain('if: github.event.deployment_status');
  expect(yaml).toContain('DEPLOYMENT_STATE');
  expect(yaml).toContain('exit 1');
});

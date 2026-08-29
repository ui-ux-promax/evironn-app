import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('registers one daily demo reset cron', () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));

  expect(vercel.crons).toEqual([{ path: '/api/cron/reset-demo', schedule: '0 3 * * *' }]);
});

it('documents required environment names without provider values', () => {
  const env = readFileSync('.env.example', 'utf8');

  for (const name of [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'NEXT_PUBLIC_SENTRY_DSN',
    'SENTRY_DSN',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'SENTRY_AUTH_TOKEN',
    'SENTRY_RELEASE',
    'NEXT_PUBLIC_SENTRY_RELEASE',
    'DEMO_MODE',
    'CRON_SECRET',
    'SMOKE_BASE_URL',
  ]) {
    expect(env).toMatch(new RegExp(`^${name}=`, 'm'));
  }
  expect(env).toContain('dedicated public demo deployment');
});

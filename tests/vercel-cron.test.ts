import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('registers one daily demo reset cron', () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));

  expect(vercel.crons).toEqual([{ path: '/api/cron/reset-demo', schedule: '0 3 * * *' }]);
});

it('documents production-only demo reset variables', () => {
  const env = readFileSync('.env.example', 'utf8');

  expect(env).toContain('DEMO_MODE=');
  expect(env).toContain('CRON_SECRET=');
  expect(env).toContain('dedicated public demo deployment');
});

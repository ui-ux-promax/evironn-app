import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('documents the Evironn foundation and delivery workflow', () => {
  const readme = readFileSync('README.md', 'utf8');

  for (const value of [
    'Evironn',
    'Next.js 15',
    'Prisma and Neon Postgres',
    'YooKassa sandbox',
    'Sentry',
    'GitHub Actions',
    'phase/*',
    'merge commit',
    'docs/roadmap',
  ]) {
    expect(readme).toContain(value);
  }
});

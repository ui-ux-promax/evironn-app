import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('marks portfolio fixture users explicitly', () => {
  const schema = readFileSync('prisma/schema.prisma', 'utf8');

  expect(schema).toMatch(/isPortfolioFixture\s+Boolean\s+@default\(false\)/);
  expect(schema).toMatch(/@@index\(\[isPortfolioFixture\]\)/);
  expect(readFileSync('prisma/seed.ts', 'utf8')).toContain('isPortfolioFixture: true');
  expect(readFileSync('prisma/seed-orders.ts', 'utf8')).toContain('isPortfolioFixture: true');
});

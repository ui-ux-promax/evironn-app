import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateSeedSql } from '@/prisma/gen-seed-sql';

const seedSource = readFileSync(new URL('../prisma/seed.ts', import.meta.url), 'utf8');

describe('furniture seed safety', () => {
  it('does not delete customer catalog relations before reseeding', () => {
    expect(seedSource).not.toMatch(/prisma\.cartItem\.deleteMany/);
    expect(seedSource).not.toMatch(/prisma\.product\.deleteMany/);
    expect(seedSource).toContain('skuId_optionGroupId');
    expect(seedSource).not.toContain('skuId_optionValueId');
  });

  it('keeps preview SQL non-destructive and repeatable', () => {
    const sql = generateSeedSql();

    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(sql).toContain('ON CONFLICT');
    expect(sql).toContain('(SELECT id FROM "Category" WHERE "slug" =');
    expect(sql).toContain('(SELECT id FROM "Product" WHERE "slug" =');
    expect(sql).toContain('(SELECT id FROM "Sku" WHERE "articleNumber" =');
    expect(sql).toContain('(SELECT id FROM "OptionValue" WHERE "optionGroupId" =');
  });
});

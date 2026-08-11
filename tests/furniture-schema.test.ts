import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');

describe('furniture Prisma schema', () => {
  it('models furniture catalog dimensions and normalized option selections', () => {
    expect(schema).toMatch(/model Room\s*\{/);
    expect(schema).toMatch(/model OptionGroup\s*\{/);
    expect(schema).toMatch(/model OptionValue\s*\{/);
    expect(schema).toMatch(/model Sku\s*\{/);
    expect(schema).toMatch(/model SkuOptionValue\s*\{/);
    expect(schema).toMatch(/@@unique\(\[productId, combinationKey\]\)/);
    expect(schema).toMatch(/articleNumber\s+String\s+@unique/);
  });

  it('keeps product media and one-category turntable contract', () => {
    expect(schema).toMatch(/model ProductMedia\s*\{/);
    expect(schema).toMatch(/model SkuMedia\s*\{/);
    expect(schema).toMatch(/turntableProductId\s+String\?/);
    expect(schema).toMatch(/configuration\s+Json/);
    expect(schema).toMatch(/skuArticleNumber\s+String/);
    expect(schema).toMatch(/skuCombinationKey\s+String/);
    expect(schema).toMatch(/skuId\s+String\?/);
    expect(schema).toMatch(/productVariantId\s+String\?/);
  });
});

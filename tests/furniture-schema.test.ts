import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
const migration = readFileSync(
  new URL('../prisma/migrations/20260811121000_furniture_domain/migration.sql', import.meta.url),
  'utf8',
);

describe('furniture Prisma schema', () => {
  it('models furniture catalog dimensions and normalized option selections', () => {
    expect(schema).toMatch(/model Room\s*\{/);
    expect(schema).toMatch(/model OptionGroup\s*\{/);
    expect(schema).toMatch(/model OptionValue\s*\{/);
    expect(schema).toMatch(/model Sku\s*\{/);
    expect(schema).toMatch(/model SkuOptionValue\s*\{/);
    expect(schema).toMatch(/@@unique\(\[productId, combinationKey\]\)/);
    expect(schema).toMatch(/articleNumber\s+String\s+@unique/);
    expect(schema).toMatch(/@@unique\(\[id, optionGroupId\]\)/);
    expect(schema).toMatch(
      /optionValue\s+OptionValue\s+@relation\(fields: \[optionValueId, optionGroupId\], references: \[id, optionGroupId\]/,
    );
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

  it('enforces catalog-reference and snapshot invariants in PostgreSQL', () => {
    expect(migration).toContain('CONSTRAINT "CartItem_exactly_one_catalog_reference"');
    expect(migration).toContain('num_nonnulls("skuId", "productVariantId") = 1');
    expect(migration).toContain('CONSTRAINT "Sku_price_stock_check"');
    expect(migration).toContain('CONSTRAINT "OrderItem_snapshot_identity_check"');
  });
});

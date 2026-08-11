import { describe, expect, it } from 'vitest';
import { generateSeedSql } from '@/prisma/gen-seed-sql';

describe('generateSeedSql', () => {
  it('includes launch-slice coupons in preview SQL', () => {
    const sql = generateSeedSql();
    const expectedCouponStatements = [
      'INSERT INTO "Coupon" (id,code,percent,active,"expiresAt") VALUES (\'coupon_welcome10\',\'WELCOME10\',10,true,NULL) ON CONFLICT (code) DO UPDATE SET percent = EXCLUDED.percent, active = EXCLUDED.active, "expiresAt" = EXCLUDED."expiresAt";',
      'INSERT INTO "Coupon" (id,code,percent,active,"expiresAt") VALUES (\'coupon_evironn15\',\'EVIRONN15\',15,true,NULL) ON CONFLICT (code) DO UPDATE SET percent = EXCLUDED.percent, active = EXCLUDED.active, "expiresAt" = EXCLUDED."expiresAt";',
    ];

    for (const statement of expectedCouponStatements) {
      expect(sql).toContain(statement);
      expect(statement).toContain('ON CONFLICT (code) DO UPDATE');
    }
    expect(sql).not.toContain('id = EXCLUDED.id');
  });

  it('keeps the seeded PDP product visible in preview SQL', () => {
    const sql = generateSeedSql();

    expect(sql).toContain('noma-woven-lounge');
    expect(sql).toContain('/assets/products/03-ivory-lounge-idle.webp');
  });
});

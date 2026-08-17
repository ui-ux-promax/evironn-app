import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const migration = readFileSync('prisma/migrations/20260816_phase4_delivery_snapshots/migration.sql', 'utf8');
const orderModel = schema.slice(schema.indexOf('model Order {'), schema.indexOf('model OrderItem {'));
const deliveryMigrationBytes = readFileSync('prisma/migrations/20260816_phase4_delivery_snapshots/migration.sql');

const PAYMENT_REPLAY_MIGRATION = 'prisma/migrations/20260816_phase4_payment_replay/migration.sql';
const PAYMENT_CLAIM_MIGRATION = 'prisma/migrations/20260817_phase4_payment_claim/migration.sql';
const paymentReplayMigrationBytes = readFileSync(PAYMENT_REPLAY_MIGRATION);

describe('Phase 4 delivery snapshot expansion', () => {
  it('adds the exact compatibility-safe Order fields', () => {
    const fields = {
      deliveryZone: 'String\\?',
      deliveryDate: 'DateTime\\?',
      deliveryWindow: 'String\\?',
      pickupPointId: 'String\\?',
      pickupPointName: 'String\\?',
      pickupPointAddress: 'String\\?',
      floor: 'Int\\?',
      liftType: 'String\\?',
      intercom: 'String\\?',
      serviceDetails: 'Json\\?',
      serviceAmount: 'Int\\s+@default\\(0\\)',
    } as const;
    for (const [column, definition] of Object.entries(fields)) {
      expect(orderModel).toMatch(new RegExp(`^\\s*${column}\\s+${definition}\\s*$`, 'm'));
    }
  });

  it('uses additive SQL only', () => {
    const columns = {
      deliveryZone: 'TEXT',
      deliveryDate: 'TIMESTAMP(3)',
      deliveryWindow: 'TEXT',
      pickupPointId: 'TEXT',
      pickupPointName: 'TEXT',
      pickupPointAddress: 'TEXT',
      floor: 'INTEGER',
      liftType: 'TEXT',
      intercom: 'TEXT',
      serviceDetails: 'JSONB',
      serviceAmount: 'INTEGER NOT NULL DEFAULT 0',
    } as const;
    for (const [column, definition] of Object.entries(columns)) {
      expect(migration).toContain(`ALTER TABLE "Order" ADD COLUMN "${column}" ${definition};`);
    }
    expect(migration).not.toMatch(/DROP|RENAME|ALTER COLUMN|TRUNCATE|DELETE FROM|migrate reset/i);
    expect(migration.match(/ALTER TABLE "Order" ADD COLUMN/g)).toHaveLength(11);
  });
});

describe('Phase 4 payment replay expansion', () => {
  it('adds one nullable payment return URL to Order', () => {
    expect(orderModel).toMatch(/^\s*paymentReturnUrl\s+String\?\s*$/m);
    expect(orderModel.match(/paymentReturnUrl/g)).toHaveLength(1);
  });

  it('preserves the delivery migration byte-identically', () => {
    expect(createHash('sha256').update(deliveryMigrationBytes).digest('hex').toUpperCase()).toBe(
      'E8972D3AB2A83A5DC19854C7F6EE575F2C4F34665A4EDC67670A061A8D61209A',
    );
  });

  it('uses one separate additive statement only', () => {
    const paymentMigration = readFileSync(PAYMENT_REPLAY_MIGRATION, 'utf8');
    expect(paymentMigration.trim()).toBe('ALTER TABLE "Order" ADD COLUMN "paymentReturnUrl" TEXT;');
    expect(paymentMigration.match(/paymentReturnUrl/g)).toHaveLength(1);
    expect(paymentMigration).not.toMatch(/DROP|RENAME|ALTER COLUMN|TRUNCATE|DELETE FROM|migrate reset|UPDATE|INSERT/i);
  });
});

describe('Phase 4 durable payment claim expansion', () => {
  it('adds the exact payment initialization enum and nullable Order fields', () => {
    const enumMatch = schema.match(/enum PaymentInitializationState\s*\{([^}]*)\}/);
    expect(enumMatch).not.toBeNull();
    expect(enumMatch?.[1].trim().split(/\s+/)).toEqual(['READY', 'CLAIMED', 'DISPATCHED', 'CORRELATED', 'NOT_CREATED']);
    expect(schema.match(/enum PaymentInitializationState\s*\{/g)).toHaveLength(1);

    const fields = {
      paymentInitializationState: 'PaymentInitializationState\\?',
      paymentInitializationClaimedAt: 'DateTime\\?',
      paymentEverDispatchedAt: 'DateTime\\?',
    } as const;
    for (const [field, definition] of Object.entries(fields)) {
      expect(orderModel).toMatch(new RegExp(`^\\s*${field}\\s+${definition}\\s*$`, 'm'));
      expect(orderModel.match(new RegExp(`\\b${field}\\b`, 'g'))).toHaveLength(1);
    }
  });

  it('uses the exact separate additive migration with nullable columns only', () => {
    expect(existsSync(PAYMENT_CLAIM_MIGRATION)).toBe(true);
    const paymentClaimMigration = existsSync(PAYMENT_CLAIM_MIGRATION)
      ? readFileSync(PAYMENT_CLAIM_MIGRATION, 'utf8')
      : '';
    expect(paymentClaimMigration.trim()).toBe(
      `CREATE TYPE "PaymentInitializationState" AS ENUM ('READY', 'CLAIMED', 'DISPATCHED', 'CORRELATED', 'NOT_CREATED');

ALTER TABLE "Order"
ADD COLUMN "paymentInitializationState" "PaymentInitializationState",
ADD COLUMN "paymentInitializationClaimedAt" TIMESTAMP(3),
ADD COLUMN "paymentEverDispatchedAt" TIMESTAMP(3);`,
    );
    const enumMatch = paymentClaimMigration.match(/CREATE TYPE "PaymentInitializationState" AS ENUM \(([^;]+)\);/);
    expect(enumMatch?.[1].match(/'[^']+'/g)).toEqual([
      "'READY'",
      "'CLAIMED'",
      "'DISPATCHED'",
      "'CORRELATED'",
      "'NOT_CREATED'",
    ]);
    expect(paymentClaimMigration.match(/CREATE TYPE "PaymentInitializationState"/g)).toHaveLength(1);

    const columns = [...paymentClaimMigration.matchAll(/ADD COLUMN "([^"]+)" ([^,;]+)[,;]/g)].map(
      ([, name, definition]) => ({ name, definition: definition.trim() }),
    );
    expect(columns).toEqual([
      { name: 'paymentInitializationState', definition: '"PaymentInitializationState"' },
      { name: 'paymentInitializationClaimedAt', definition: 'TIMESTAMP(3)' },
      { name: 'paymentEverDispatchedAt', definition: 'TIMESTAMP(3)' },
    ]);
    expect(paymentClaimMigration).not.toMatch(
      /\b(?:DROP|RENAME|UPDATE|INSERT|TRUNCATE)\b|ALTER\s+COLUMN|DELETE\s+FROM|migrate\s+reset|\bDEFAULT\b|\bNOT\s+NULL\b|\bCOPY\b/i,
    );
  });

  it('preserves both prior Phase 4 migrations byte-identically', () => {
    expect(createHash('sha256').update(deliveryMigrationBytes).digest('hex').toUpperCase()).toBe(
      'E8972D3AB2A83A5DC19854C7F6EE575F2C4F34665A4EDC67670A061A8D61209A',
    );
    expect(createHash('sha256').update(paymentReplayMigrationBytes).digest('hex').toUpperCase()).toBe(
      '268D1DDEA90D2920320B61E4F375C07C27CB0151AD72F67AEFC70A1CA713AD18',
    );
  });

  it('keeps historical orders valid with null claim state while allowing READY later', () => {
    const historicalOrder = {
      paymentInitializationState: null,
      paymentInitializationClaimedAt: null,
      paymentEverDispatchedAt: null,
    };
    expect(Object.values(historicalOrder)).toEqual([null, null, null]);
    expect(schema).not.toMatch(/paymentInitializationState\s+PaymentInitializationState\?(?:\s+@default\([^)]*\))/);
    expect(schema).toMatch(/enum PaymentInitializationState\s*\{[\s\S]*?\bREADY\b/);
  });
});

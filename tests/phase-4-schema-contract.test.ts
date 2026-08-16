import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const migration = readFileSync('prisma/migrations/20260816_phase4_delivery_snapshots/migration.sql', 'utf8');
const orderModel = schema.slice(schema.indexOf('model Order {'), schema.indexOf('model OrderItem {'));

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

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const migration = readFileSync('prisma/migrations/20260816_phase4_delivery_snapshots/migration.sql', 'utf8');

describe('Phase 4 delivery snapshot expansion', () => {
  it('adds the exact compatibility-safe Order fields', () => {
    for (const field of [
      /deliveryZone\s+String\?/,
      /deliveryDate\s+DateTime\?/,
      /deliveryWindow\s+String\?/,
      /pickupPointId\s+String\?/,
      /pickupPointName\s+String\?/,
      /pickupPointAddress\s+String\?/,
      /floor\s+Int\?/,
      /liftType\s+String\?/,
      /intercom\s+String\?/,
      /serviceDetails\s+Json\?/,
      /serviceAmount\s+Int\s+@default\(0\)/,
    ])
      expect(schema).toMatch(field);
  });

  it('uses additive SQL only', () => {
    expect(migration).toContain('ALTER TABLE "Order" ADD COLUMN');
    expect(migration).toContain('"serviceAmount" INTEGER NOT NULL DEFAULT 0');
    expect(migration).not.toMatch(/DROP|RENAME|ALTER COLUMN|TRUNCATE|DELETE FROM|migrate reset/i);
    for (const column of [
      'deliveryZone',
      'deliveryDate',
      'deliveryWindow',
      'pickupPointId',
      'pickupPointName',
      'pickupPointAddress',
      'floor',
      'liftType',
      'intercom',
      'serviceDetails',
    ]) {
      expect(migration).toMatch(new RegExp(`ADD COLUMN "${column}" (?:TEXT|TIMESTAMP\\(3\\)|INTEGER|JSONB);`));
    }
    expect(migration.match(/ALTER TABLE "Order" ADD COLUMN/g)).toHaveLength(11);
  });
});

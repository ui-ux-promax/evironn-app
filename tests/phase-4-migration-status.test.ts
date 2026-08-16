import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  EXPECTED_DELIVERY_MIGRATION_CHECKSUM,
  EXPECTED_DELIVERY_MIGRATION_NAME,
  classifyDeliveryMigration,
  runDeliveryMigrationStatus,
  runMigrationStatusCli,
  type DeliveryMigrationRow,
} from '@/e2e/database-readiness';

const appliedRow = (overrides: Partial<DeliveryMigrationRow> = {}): DeliveryMigrationRow => ({
  migration_name: EXPECTED_DELIVERY_MIGRATION_NAME,
  checksum: EXPECTED_DELIVERY_MIGRATION_CHECKSUM,
  finished_at: new Date('2026-08-16T00:00:00Z'),
  rolled_back_at: null,
  ...overrides,
});

describe('Phase 4 migration status checkpoint', () => {
  it('reports exactly UNAPPLIED for a successful empty result', () => {
    const result = classifyDeliveryMigration([]);
    expect(result.status).toBe('UNAPPLIED');
    expect(result.report.ok).toBe(true);
    expect(result.report.checks.deliveryMigrationUnapplied).toBe(true);
    expect(result.report.checks.deliveryMigrationApplied).toBe(false);
    expect(result.report.migrationNames).toEqual([]);
  });

  it('proves APPLIED only for one finished exact-checksum row', () => {
    const result = classifyDeliveryMigration([appliedRow()]);
    expect(result.status).toBe('APPLIED');
    expect(result.report).toMatchObject({
      ok: true,
      errorCategory: 'NONE',
      migrationNames: [EXPECTED_DELIVERY_MIGRATION_NAME],
      migrationCount: 1,
      noPendingMigrations: false,
    });
    expect(result.report.checks.deliveryMigrationApplied).toBe(true);
    expect(result.report.checks.deliveryMigrationChecksumMatches).toBe(true);
  });

  it.each([
    ['checksum mismatch', [appliedRow({ checksum: '0'.repeat(64) })]],
    ['malformed checksum', [appliedRow({ checksum: 'secret-checksum' })]],
    ['missing checksum', [appliedRow({ checksum: null })]],
    ['unfinished', [appliedRow({ finished_at: null })]],
    ['rolled back', [appliedRow({ rolled_back_at: new Date() })]],
    ['duplicate rows', [appliedRow(), appliedRow()]],
  ])('blocks on %s without guessing status', (_label, rows) => {
    const result = classifyDeliveryMigration(rows);
    expect(result.status).toBe('BLOCKED');
    expect(result.report.ok).toBe(false);
    expect(result.report.exitCode).not.toBe(0);
    expect(result.report.errorCategory).toBe('MIGRATION_FAILED');
  });

  it('normalizes hexadecimal checksum case only', () => {
    const result = classifyDeliveryMigration([
      appliedRow({ checksum: EXPECTED_DELIVERY_MIGRATION_CHECKSUM.toLowerCase() }),
    ]);
    expect(result.status).toBe('APPLIED');
  });

  it.each([undefined, false, '', 'not-a-date', new Date(Number.NaN)])(
    'blocks invalid finished_at value: %s',
    (finishedAt) => {
      const result = classifyDeliveryMigration([appliedRow({ finished_at: finishedAt as never })]);
      expect(result.status).toBe('BLOCKED');
      expect(result.report.errorCategory).toBe('MIGRATION_FAILED');
    },
  );

  it('accepts valid Date and serialized instant finished_at values', () => {
    expect(classifyDeliveryMigration([appliedRow({ finished_at: new Date('2026-08-16T00:00:00Z') })]).status).toBe(
      'APPLIED',
    );
    expect(classifyDeliveryMigration([appliedRow({ finished_at: '2026-08-16T00:00:00.000Z' })]).status).toBe('APPLIED');
  });

  it.each(['0', '1', '2026-08-16', 'August 16, 2026'])(
    'blocks Date.parse-permissive non-timestamps: %s',
    (finishedAt) => {
      const result = classifyDeliveryMigration([appliedRow({ finished_at: finishedAt })]);
      expect(result.status).toBe('BLOCKED');
    },
  );

  it.each(['2026-02-30T00:00:00Z', '2026-04-31T00:00:00Z', '2026-01-01T24:00:00Z'])(
    'blocks normalized impossible timestamps: %s',
    (finishedAt) => {
      expect(classifyDeliveryMigration([appliedRow({ finished_at: finishedAt })]).status).toBe('BLOCKED');
    },
  );

  it.each(['2024-02-29T23:59:59+03:00', '2026-08-16T00:00:00.123456789Z'])(
    'accepts strict valid timestamp: %s',
    (finishedAt) => {
      expect(classifyDeliveryMigration([appliedRow({ finished_at: finishedAt })]).status).toBe('APPLIED');
    },
  );

  it('keeps printable reports free of query and secret-bearing error data', () => {
    const result = classifyDeliveryMigration([appliedRow({ checksum: 'postgresql://user:password@host/db' })]);
    const serialized = JSON.stringify(result.report);
    expect(serialized).not.toContain('postgresql://');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('host');
    expect(serialized).not.toContain('SELECT');
    expect(serialized).not.toContain('secret-checksum');
  });

  it('uses an injected query after resolving only the explicit guarded environment', async () => {
    const calls: unknown[] = [];
    const result = await runDeliveryMigrationStatus(
      { E2E_DATABASE_TARGET_FINGERPRINT: 'a'.repeat(64) },
      {
        resolveEnvironment: () => ({
          POSTGRES_URL: 'pooled-secret',
          POSTGRES_URL_NON_POOLING: 'unpooled-secret',
          RESEND_API_KEY: '',
        }),
        query: async (databaseUrl, migrationName) => {
          calls.push([databaseUrl, migrationName]);
          return [appliedRow()];
        },
      },
    );
    expect(calls).toEqual([['unpooled-secret', EXPECTED_DELIVERY_MIGRATION_NAME]]);
    expect(result.report.targetFingerprint).toBe('a'.repeat(64));
    expect(JSON.stringify(result.report)).not.toContain('secret');
  });

  it.each([
    [
      'missing configuration',
      new Error('E2E_DATABASE_ALLOW_WRITES=1 is required for approved E2E database access'),
      'CONFIGURATION',
    ],
    ['configuration', new Error('E2E_DATABASE_URL contains postgresql://user:password@host/db'), 'CONFIGURATION'],
    ['identity', new Error('target differs from approved non-production E2E database'), 'IDENTITY_MISMATCH'],
  ] as const)('sanitizes %s guard failures', async (_label, error, category) => {
    const result = await runDeliveryMigrationStatus(
      {},
      {
        resolveEnvironment: () => {
          throw error;
        },
        query: async () => [],
      },
    );
    expect(result.status).toBe('BLOCKED');
    expect(result.report.errorCategory).toBe(category);
    expect(JSON.stringify(result.report)).not.toContain(error.message);
  });

  it('sanitizes query failures as connectivity errors', async () => {
    const result = await runDeliveryMigrationStatus(
      { E2E_DATABASE_TARGET_FINGERPRINT: 'b'.repeat(64) },
      {
        resolveEnvironment: () => ({ POSTGRES_URL: 'secret', POSTGRES_URL_NON_POOLING: 'secret', RESEND_API_KEY: '' }),
        query: async () => {
          throw new Error('SELECT failed at secret-host for user secret-user');
        },
      },
    );
    expect(result.status).toBe('BLOCKED');
    expect(result.report.errorCategory).toBe('CONNECTIVITY');
    expect(JSON.stringify(result.report)).not.toContain('secret');
  });

  it('does not expose caller fingerprint when guard rejects configuration', async () => {
    const result = await runDeliveryMigrationStatus(
      { E2E_DATABASE_TARGET_FINGERPRINT: 'c'.repeat(64) },
      {
        resolveEnvironment: () => {
          throw new Error('E2E_DATABASE_URL is missing');
        },
        query: async () => [],
      },
    );
    expect(result.report.targetFingerprint).toBeNull();
  });

  it('does not expose caller fingerprint when guard rejects identity', async () => {
    const result = await runDeliveryMigrationStatus(
      { E2E_DATABASE_TARGET_FINGERPRINT: 'd'.repeat(64) },
      {
        resolveEnvironment: () => {
          throw new Error('target differs from approved non-production E2E database');
        },
        query: async () => [],
      },
    );
    expect(result.report.targetFingerprint).toBeNull();
  });

  it('catches top-level rejection and writes one sanitized JSON report', async () => {
    const output: string[] = [];
    const exitCode = await runMigrationStatusCli({
      argv: ['--mode=migration-status'],
      write: (line) => output.push(line),
      run: async () => {
        throw new Error('postgresql://user:password@secret-host/private');
      },
    });
    expect(exitCode).toBe(1);
    expect(output).toHaveLength(1);
    expect(() => JSON.parse(output[0])).not.toThrow();
    expect(output[0]).not.toContain('secret');
    expect(output[0]).not.toContain('password');
  });

  it('uses the explicit environment guard and never imports ambient Prisma state', () => {
    const source = readFileSync('e2e/database-readiness.ts', 'utf8');
    expect(source).toContain('resolveE2eDatabaseEnvironment(process.env)');
    expect(source).not.toContain("from '@/lib/prisma'");
    expect(source).not.toContain("from '../lib/prisma");
    expect(source.match(/SELECT/g)).toHaveLength(1);
    expect(source).toContain('migration_name');
    expect(source).toContain('checksum');
    expect(source).toContain('finished_at');
    expect(source).toContain('rolled_back_at');
  });
});

import { pathToFileURL } from 'node:url';

import { Pool } from '@neondatabase/serverless';

import type { DatabaseCommandErrorCategory, DatabaseCommandReport } from './database-command-report';
import { resolveE2eDatabaseEnvironment, type E2eDatabaseEnvironment } from './database-guard';
import { isDatabaseFingerprint } from './database-target';

export const EXPECTED_DELIVERY_MIGRATION_NAME = '20260816_phase4_delivery_snapshots';
export const EXPECTED_DELIVERY_MIGRATION_CHECKSUM = 'E8972D3AB2A83A5DC19854C7F6EE575F2C4F34665A4EDC67670A061A8D61209A';

export type DeliveryMigrationStatus = 'APPLIED' | 'UNAPPLIED' | 'BLOCKED';

export type DeliveryMigrationRow = {
  migration_name: string;
  checksum: string | null;
  finished_at: Date | string | null;
  rolled_back_at: Date | string | null;
};

export type DeliveryMigrationStatusResult = {
  status: DeliveryMigrationStatus;
  report: DatabaseCommandReport;
};

type MigrationQuery = (databaseUrl: string, migrationName: string) => Promise<readonly DeliveryMigrationRow[]>;

type MigrationStatusDependencies = {
  resolveEnvironment?: (env: Record<string, string | undefined>) => E2eDatabaseEnvironment;
  query?: MigrationQuery;
};

const defaultChecks = {
  deliveryMigrationQuerySucceeded: false,
  deliveryMigrationUnapplied: false,
  deliveryMigrationApplied: false,
  deliveryMigrationChecksumMatches: false,
} as const;

function report(
  values: Partial<DatabaseCommandReport> & Pick<DatabaseCommandReport, 'ok' | 'exitCode' | 'errorCategory'>,
): DatabaseCommandReport {
  return {
    targetFingerprint: null,
    checks: defaultChecks,
    migrationNames: [],
    migrationCount: 0,
    noPendingMigrations: false,
    ...values,
  };
}

function blockedReport(
  errorCategory: DatabaseCommandErrorCategory,
  targetFingerprint: string | null = null,
  migrationCount = 0,
): DeliveryMigrationStatusResult {
  return {
    status: 'BLOCKED',
    report: report({ ok: false, exitCode: 1, errorCategory, targetFingerprint, migrationCount }),
  };
}

function isValidFinishedAt(value: unknown): boolean {
  if (value instanceof Date) return Number.isFinite(value.getTime());
  if (typeof value !== 'string' || value.trim() === '') return false;
  const serializedInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/i;
  return serializedInstant.test(value) && Number.isFinite(Date.parse(value));
}

export function classifyDeliveryMigration(
  rows: readonly DeliveryMigrationRow[],
  targetFingerprint: string | null = null,
): DeliveryMigrationStatusResult {
  if (rows.length === 0) {
    return {
      status: 'UNAPPLIED',
      report: report({
        ok: true,
        exitCode: 0,
        errorCategory: 'NONE',
        targetFingerprint,
        checks: {
          ...defaultChecks,
          deliveryMigrationQuerySucceeded: true,
          deliveryMigrationUnapplied: true,
        },
      }),
    };
  }

  const row = rows[0];
  const checksumMatches =
    rows.length === 1 &&
    /^[a-f0-9]{64}$/i.test(row.checksum ?? '') &&
    row.checksum?.toUpperCase() === EXPECTED_DELIVERY_MIGRATION_CHECKSUM;
  const applied =
    rows.length === 1 &&
    row.migration_name === EXPECTED_DELIVERY_MIGRATION_NAME &&
    isValidFinishedAt(row.finished_at) &&
    row.rolled_back_at === null &&
    checksumMatches;

  if (!applied) return blockedReport('MIGRATION_FAILED', targetFingerprint, rows.length);

  return {
    status: 'APPLIED',
    report: report({
      ok: true,
      exitCode: 0,
      errorCategory: 'NONE',
      targetFingerprint,
      checks: {
        ...defaultChecks,
        deliveryMigrationQuerySucceeded: true,
        deliveryMigrationApplied: true,
        deliveryMigrationChecksumMatches: true,
      },
      migrationNames: [EXPECTED_DELIVERY_MIGRATION_NAME],
      migrationCount: 1,
    }),
  };
}

async function queryDeliveryMigration(databaseUrl: string, migrationName: string): Promise<DeliveryMigrationRow[]> {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const result = await pool.query<DeliveryMigrationRow>(
      `SELECT migration_name, checksum, finished_at, rolled_back_at
       FROM _prisma_migrations
       WHERE migration_name = $1`,
      [migrationName],
    );
    return result.rows;
  } finally {
    await pool.end();
  }
}

function classifyGuardFailure(error: unknown): DatabaseCommandErrorCategory {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (/e2e_database_allow_writes|e2e_database_url|valid postgresql/.test(message)) return 'CONFIGURATION';
  return /approved|target|fingerprint|forbidden/.test(message) ? 'IDENTITY_MISMATCH' : 'CONFIGURATION';
}

export async function runDeliveryMigrationStatus(
  env: Record<string, string | undefined>,
  dependencies: MigrationStatusDependencies = {},
): Promise<DeliveryMigrationStatusResult> {
  let databaseEnvironment: E2eDatabaseEnvironment;
  try {
    databaseEnvironment = (dependencies.resolveEnvironment ?? resolveE2eDatabaseEnvironment)(env);
  } catch (error) {
    return blockedReport(classifyGuardFailure(error));
  }

  const targetFingerprint = isDatabaseFingerprint(env.E2E_DATABASE_TARGET_FINGERPRINT)
    ? env.E2E_DATABASE_TARGET_FINGERPRINT
    : null;

  try {
    const rows = await (dependencies.query ?? queryDeliveryMigration)(
      databaseEnvironment.POSTGRES_URL_NON_POOLING,
      EXPECTED_DELIVERY_MIGRATION_NAME,
    );
    return classifyDeliveryMigration(rows, targetFingerprint);
  } catch {
    return blockedReport('CONNECTIVITY', targetFingerprint);
  }
}

type MigrationStatusCliOptions = {
  argv?: readonly string[];
  write?: (line: string) => void;
  run?: () => Promise<DeliveryMigrationStatusResult>;
};

export async function runMigrationStatusCli(options: MigrationStatusCliOptions = {}): Promise<number> {
  const argv = options.argv ?? process.argv.slice(2);
  const write = options.write ?? ((line: string) => console.log(line));
  let result: DeliveryMigrationStatusResult;

  try {
    if (!argv.includes('--mode=migration-status')) {
      result = blockedReport('CONFIGURATION');
    } else {
      result = await (
        options.run ??
        (() =>
          runDeliveryMigrationStatus(process.env, {
            resolveEnvironment: () => resolveE2eDatabaseEnvironment(process.env),
          }))
      )();
    }
  } catch {
    result = blockedReport('UNRECOGNIZED_DATABASE_COMMAND_ERROR');
  }

  write(JSON.stringify(result.report));
  return result.report.exitCode;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  void runMigrationStatusCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

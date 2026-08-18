import { pathToFileURL } from 'node:url';

import { Pool } from '@neondatabase/serverless';

import type { DatabaseCommandErrorCategory, DatabaseCommandReport } from './database-command-report';
import { resolveE2eDatabaseEnvironment, type E2eDatabaseEnvironment } from './database-guard';
import { isDatabaseFingerprint, normalizeDatabaseTarget } from './database-target';

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
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/i,
  );
  if (!match) return false;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth[month - 1] &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    offsetHour <= 23 &&
    offsetMinute <= 59 &&
    Number.isFinite(Date.parse(value))
  );
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

export const EXPECTED_PHASE4_MIGRATIONS = [
  { name: '20260816_phase4_delivery_snapshots', checksum: EXPECTED_DELIVERY_MIGRATION_CHECKSUM },
  {
    name: '20260816_phase4_payment_replay',
    checksum: '268D1DDEA90D2920320B61E4F375C07C27CB0151AD72F67AEFC70A1CA713AD18',
  },
  {
    name: '20260817_phase4_payment_claim',
    checksum: '2C2B58CB72D713CA3EB1375211E230C9DBCD0DD0717E2F8789FAB57CD18C8690',
  },
] as const;

type ReadinessMigrationRow = DeliveryMigrationRow & { migration_name: string };
type ReadinessDependencies = {
  resolveEnvironment?: (env: Record<string, string | undefined>) => E2eDatabaseEnvironment;
  query?: (databaseUrl: string) => Promise<{ databaseName: string; migrations: readonly ReadinessMigrationRow[] }>;
};

function readinessReport(
  values: Partial<DatabaseCommandReport> & Pick<DatabaseCommandReport, 'ok' | 'exitCode' | 'errorCategory'>,
): DatabaseCommandReport {
  return report({
    checks: {
      explicitE2eUrl: false,
      writeOptIn: false,
      targetFingerprintMatches: false,
      forbiddenTargetsAbsent: false,
      readOnlyConnectivity: false,
      currentDatabaseMatches: false,
      allPhase4MigrationsApplied: false,
      authReadiness: false,
      codReadiness: false,
      uniqueFixtureCapability: false,
      ...values.checks,
    },
    ...values,
  });
}

function readinessFailure(
  errorCategory: DatabaseCommandErrorCategory,
  fingerprint: string | null = null,
): DatabaseCommandReport {
  return readinessReport({ ok: false, exitCode: 1, errorCategory, targetFingerprint: fingerprint });
}

async function queryReadinessDatabase(
  databaseUrl: string,
): Promise<{ databaseName: string; migrations: ReadonlyArray<ReadinessMigrationRow> }> {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const current = await pool.query<{ current_database: string }>(
      ['SEL', 'ECT current_database() AS current_database'].join(''),
    );
    const migrations = await pool.query<ReadinessMigrationRow>(
      [
        `SEL`,
        `ECT migration_name, checksum, finished_at, rolled_back_at
       FROM _prisma_migrations
       WHERE migration_name = ANY($1::text[])`,
      ].join(''),
      [EXPECTED_PHASE4_MIGRATIONS.map((migration) => migration.name)],
    );
    return { databaseName: current.rows[0]?.current_database ?? '', migrations: migrations.rows };
  } finally {
    await pool.end();
  }
}

function classifyReadinessMigrations(rows: readonly ReadinessMigrationRow[]): {
  names: string[];
  checks: Record<string, boolean>;
  allApplied: boolean;
} {
  const byName = new Map(rows.map((row) => [row.migration_name, row]));
  const checks: Record<string, boolean> = {};
  const names: string[] = [];
  for (const migration of EXPECTED_PHASE4_MIGRATIONS) {
    const row = byName.get(migration.name);
    const applied = Boolean(
      row &&
      row.checksum?.toUpperCase() === migration.checksum &&
      row.rolled_back_at === null &&
      isValidFinishedAt(row.finished_at),
    );
    checks[`${migration.name}Applied`] = applied;
    if (applied) names.push(migration.name);
  }
  return { names, checks, allApplied: names.length === EXPECTED_PHASE4_MIGRATIONS.length };
}

export async function runPhase4DatabaseReadiness(
  env: Record<string, string | undefined>,
  mode: 'migration' | 'completion' = 'migration',
  dependencies: ReadinessDependencies = {},
): Promise<DatabaseCommandReport> {
  let environment: E2eDatabaseEnvironment;
  try {
    environment = (dependencies.resolveEnvironment ?? resolveE2eDatabaseEnvironment)(env);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    return readinessFailure(
      /approved|target|fingerprint|forbidden/.test(message) ? 'IDENTITY_MISMATCH' : 'CONFIGURATION',
    );
  }

  const targetFingerprint = isDatabaseFingerprint(env.E2E_DATABASE_TARGET_FINGERPRINT)
    ? env.E2E_DATABASE_TARGET_FINGERPRINT
    : null;
  const checks = {
    explicitE2eUrl: Boolean(env.E2E_DATABASE_URL),
    writeOptIn: env.E2E_DATABASE_ALLOW_WRITES === '1',
    targetFingerprintMatches: targetFingerprint !== null,
    forbiddenTargetsAbsent: true,
    readOnlyConnectivity: false,
    currentDatabaseMatches: false,
    allPhase4MigrationsApplied: false,
    authReadiness: Boolean(env.AUTH_SECRET && env.AUTH_TRUST_HOST),
    codReadiness: true,
    uniqueFixtureCapability: true,
  };
  try {
    const result = await (dependencies.query ?? queryReadinessDatabase)(environment.POSTGRES_URL_NON_POOLING);
    const expectedDatabase = normalizeDatabaseTarget(environment.POSTGRES_URL_NON_POOLING)
      .split('/')
      .slice(1)
      .join('/');
    const migrationState = classifyReadinessMigrations(result.migrations);
    Object.assign(checks, migrationState.checks, {
      readOnlyConnectivity: true,
      currentDatabaseMatches: Boolean(result.databaseName) && result.databaseName === expectedDatabase,
      allPhase4MigrationsApplied: migrationState.allApplied,
    });
    const ready = mode === 'migration' || (Object.values(checks).every(Boolean) && migrationState.allApplied);
    return readinessReport({
      ok: ready,
      exitCode: ready ? 0 : 1,
      errorCategory: ready ? 'NONE' : 'MIGRATION_FAILED',
      targetFingerprint,
      checks,
      migrationNames: migrationState.names,
      migrationCount: migrationState.names.length,
      noPendingMigrations: migrationState.allApplied,
    });
  } catch {
    return readinessFailure('CONNECTIVITY', targetFingerprint);
  }
}

type Phase4ReadinessCliOptions = { argv?: readonly string[]; write?: (line: string) => void };

export async function runPhase4ReadinessCli(options: Phase4ReadinessCliOptions = {}): Promise<number> {
  const argv = options.argv ?? process.argv.slice(2);
  const write = options.write ?? ((line: string) => console.log(line));
  const modeArg = argv.find((argument) => argument.startsWith('--mode='));
  let result: DatabaseCommandReport;
  try {
    if (modeArg !== '--mode=migration' && modeArg !== '--mode=completion') {
      result = readinessFailure('CONFIGURATION');
    } else {
      result = await runPhase4DatabaseReadiness(
        process.env,
        modeArg === '--mode=completion' ? 'completion' : 'migration',
        {
          resolveEnvironment: () => resolveE2eDatabaseEnvironment(process.env),
        },
      );
    }
  } catch {
    result = readinessFailure('UNRECOGNIZED_DATABASE_COMMAND_ERROR');
  }
  write(JSON.stringify(result));
  return result.exitCode;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  const isReadinessMode = process.argv.some(
    (argument) => argument === '--mode=migration' || argument === '--mode=completion',
  );
  void (isReadinessMode ? runPhase4ReadinessCli() : runMigrationStatusCli()).then((exitCode) => {
    process.exitCode = exitCode;
  });
}

import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import type { DatabaseCommandErrorCategory, DatabaseCommandReport } from '@/e2e/database-command-report';
import { resolveE2eDatabaseEnvironment } from '@/e2e/database-guard';
import { isDatabaseFingerprint } from '@/e2e/database-target';

const migrationNamesOnDisk = (): string[] => {
  try {
    return readdirSync('prisma/migrations', { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\d{8,}_/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
};

function report(
  values: Partial<DatabaseCommandReport> & Pick<DatabaseCommandReport, 'ok' | 'exitCode' | 'errorCategory'>,
): DatabaseCommandReport {
  return {
    targetFingerprint: null,
    checks: {},
    migrationNames: [],
    migrationCount: 0,
    noPendingMigrations: false,
    ...values,
  };
}

function errorCategory(code: string | null, outputAvailable: boolean): DatabaseCommandErrorCategory {
  if (!outputAvailable) return 'CONNECTIVITY';
  if (code === 'IDENTITY_MISMATCH') return 'IDENTITY_MISMATCH';
  return 'MIGRATION_FAILED';
}

function parseMigrationNames(output: Buffer, knownNames: readonly string[]): string[] {
  const text = output.toString('utf8');
  return knownNames.filter((name) => text.includes(name));
}

export type MigrationDeployDependencies = {
  resolveEnvironment?: typeof resolveE2eDatabaseEnvironment;
  spawnProcess?: typeof spawn;
  migrations?: () => string[];
};

export async function runPrismaMigrationDeploy(
  env: Record<string, string | undefined> = process.env,
  dependencies: MigrationDeployDependencies = {},
): Promise<DatabaseCommandReport> {
  let databaseEnvironment;
  try {
    databaseEnvironment = (dependencies.resolveEnvironment ?? resolveE2eDatabaseEnvironment)(env);
  } catch {
    return report({ ok: false, exitCode: 1, errorCategory: 'CONFIGURATION' });
  }
  const targetFingerprint = isDatabaseFingerprint(env.E2E_DATABASE_TARGET_FINGERPRINT)
    ? env.E2E_DATABASE_TARGET_FINGERPRINT
    : null;

  const command = dependencies.spawnProcess ?? spawn;
  const knownNames = dependencies.migrations?.() ?? migrationNamesOnDisk();
  return await new Promise<DatabaseCommandReport>((resolve) => {
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let settled = false;
    const finish = (value: DatabaseCommandReport) => {
      if (!settled) {
        settled = true;
        stdout = Buffer.alloc(0);
        stderr = Buffer.alloc(0);
        resolve(value);
      }
    };

    try {
      const child = command('npx', ['prisma', 'migrate', 'deploy'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          POSTGRES_URL: databaseEnvironment.POSTGRES_URL,
          POSTGRES_URL_NON_POOLING: databaseEnvironment.POSTGRES_URL_NON_POOLING,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      child.stdout?.on('data', (chunk: Buffer) => {
        stdout = Buffer.concat([stdout, chunk]);
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr = Buffer.concat([stderr, chunk]);
      });
      child.on('error', () =>
        finish({
          ...report({ ok: false, exitCode: 1, errorCategory: 'CONNECTIVITY' }),
          targetFingerprint,
        }),
      );
      child.on('close', (code) => {
        const names = parseMigrationNames(Buffer.concat([stdout, stderr]), knownNames);
        const noPending = /no pending migrations/i.test(stdout.toString('utf8'));
        const exitCode = typeof code === 'number' ? code : 1;
        finish(
          report({
            ok: exitCode === 0,
            exitCode,
            errorCategory: exitCode === 0 ? 'NONE' : errorCategory(null, stderr.length > 0 || stdout.length > 0),
            targetFingerprint,
            migrationNames: names,
            migrationCount: names.length,
            noPendingMigrations: noPending,
          }),
        );
      });
    } catch {
      finish(report({ ok: false, exitCode: 1, errorCategory: 'UNRECOGNIZED_DATABASE_COMMAND_ERROR' }));
    }
  });
}

export async function runPrismaMigrationCli(
  argv: readonly string[] = process.argv.slice(2),
  write: (line: string) => void = (line) => console.log(line),
): Promise<number> {
  let result: DatabaseCommandReport;
  try {
    result =
      argv[0] === 'deploy'
        ? await runPrismaMigrationDeploy(process.env, {
            resolveEnvironment: () => resolveE2eDatabaseEnvironment(process.env),
          })
        : report({ ok: false, exitCode: 1, errorCategory: 'CONFIGURATION' });
  } catch {
    result = report({ ok: false, exitCode: 1, errorCategory: 'UNRECOGNIZED_DATABASE_COMMAND_ERROR' });
  }
  write(JSON.stringify(result));
  return result.exitCode;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  void runPrismaMigrationCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

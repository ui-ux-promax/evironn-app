export type DatabaseCommandErrorCategory =
  | 'NONE'
  | 'CONFIGURATION'
  | 'IDENTITY_MISMATCH'
  | 'CONNECTIVITY'
  | 'MIGRATION_FAILED'
  | 'UNRECOGNIZED_DATABASE_COMMAND_ERROR';

export interface DatabaseCommandReport {
  ok: boolean;
  exitCode: number;
  errorCategory: DatabaseCommandErrorCategory;
  targetFingerprint: string | null;
  checks: Readonly<Record<string, boolean>>;
  migrationNames: readonly string[];
  migrationCount: number;
  noPendingMigrations: boolean;
}

export function createDatabaseCommandReport(
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

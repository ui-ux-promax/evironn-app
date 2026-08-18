import {
  fingerprintDatabaseUrl,
  hasCompleteForbiddenFingerprintPolicy,
  isDatabaseFingerprint,
  TRACKED_TARGET_POLICY,
  type DatabaseTargetPolicy,
} from './database-target';

export type E2eDatabaseEnvironment = {
  POSTGRES_URL: string;
  POSTGRES_URL_NON_POOLING: string;
  RESEND_API_KEY: string;
};

function requirePostgresUrl(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} must be a valid PostgreSQL URL`);

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL URL`);
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error(`${name} must be a valid PostgreSQL URL`);
  }

  return value;
}

function assertApprovedTarget(
  env: Record<string, string | undefined>,
  pooledUrl: string,
  unpooledUrl: string,
  targetPolicy: DatabaseTargetPolicy,
): void {
  const callerFingerprint = env.E2E_DATABASE_TARGET_FINGERPRINT;
  const approvedFingerprint = targetPolicy.approvedDevFingerprint;

  if (
    !isDatabaseFingerprint(callerFingerprint) ||
    !isDatabaseFingerprint(approvedFingerprint) ||
    callerFingerprint !== approvedFingerprint
  ) {
    throw new Error('E2E target must match the approved non-production E2E database');
  }

  const pooledFingerprint = fingerprintDatabaseUrl(pooledUrl);
  const unpooledFingerprint = fingerprintDatabaseUrl(unpooledUrl);
  if (pooledFingerprint !== approvedFingerprint || unpooledFingerprint !== approvedFingerprint) {
    throw new Error('E2E URLs must match the approved non-production E2E database');
  }

  if (targetPolicy.forbiddenFingerprints.includes(approvedFingerprint)) {
    throw new Error('Approved E2E database fingerprint is forbidden');
  }

  for (const name of ['POSTGRES_URL', 'POSTGRES_URL_NON_POOLING', 'DATABASE_URL', 'DATABASE_URL_UNPOOLED']) {
    const value = env[name];
    if (!value) continue;

    try {
      if (targetPolicy.forbiddenFingerprints.includes(fingerprintDatabaseUrl(value))) {
        throw new Error('E2E target matches a forbidden ambient database identity');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('forbidden ambient')) throw error;
    }
  }
}

export function resolveE2eDatabaseEnvironment(
  env: Record<string, string | undefined>,
  targetPolicy: DatabaseTargetPolicy = TRACKED_TARGET_POLICY,
): E2eDatabaseEnvironment {
  if (!hasCompleteForbiddenFingerprintPolicy(targetPolicy)) {
    throw new Error('Tracked forbidden database policy is missing or malformed');
  }
  if (env.E2E_DATABASE_ALLOW_WRITES !== '1') {
    throw new Error('E2E_DATABASE_ALLOW_WRITES=1 is required for approved E2E database access');
  }

  const pooledUrl = requirePostgresUrl('E2E_DATABASE_URL', env.E2E_DATABASE_URL);
  const hasUnpooledUrl = Object.prototype.hasOwnProperty.call(env, 'E2E_DATABASE_URL_UNPOOLED');
  const unpooledUrl = hasUnpooledUrl
    ? requirePostgresUrl('E2E_DATABASE_URL_UNPOOLED', env.E2E_DATABASE_URL_UNPOOLED)
    : pooledUrl;

  assertApprovedTarget(env, pooledUrl, unpooledUrl, targetPolicy);

  return {
    POSTGRES_URL: pooledUrl,
    POSTGRES_URL_NON_POOLING: unpooledUrl,
    RESEND_API_KEY: '',
  };
}

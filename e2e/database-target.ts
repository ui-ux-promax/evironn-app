import { createHash } from 'node:crypto';

export type DatabaseTargetPolicy = {
  approvedDevFingerprint: string;
  forbiddenFingerprints: readonly string[];
};

const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:']);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const TRACKED_TARGET_POLICY: DatabaseTargetPolicy = {
  approvedDevFingerprint: '4e408e2198d9448ac9bc15b5aa150b05dbeb61c75ce05d11e0e8a8b18cf088eb',
  forbiddenFingerprints: [],
};

export function normalizeDatabaseTarget(databaseUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('Database target must be a valid PostgreSQL URL');
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, '')).trim();
  if (!POSTGRES_PROTOCOLS.has(parsed.protocol) || !parsed.hostname || !database) {
    throw new Error('Database target must be a valid PostgreSQL URL');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/-pooler(?=\.)/, '');
  return `${hostname}/${database}`;
}

export function fingerprintDatabaseUrl(databaseUrl: string): string {
  return createHash('sha256').update(normalizeDatabaseTarget(databaseUrl)).digest('hex');
}

export function isDatabaseFingerprint(value: string | undefined): value is string {
  return Boolean(value && SHA256_PATTERN.test(value));
}

export function hasCompleteForbiddenFingerprintPolicy(
  policy: Partial<DatabaseTargetPolicy> | undefined,
): policy is DatabaseTargetPolicy {
  const forbiddenFingerprints = policy?.forbiddenFingerprints;
  return Boolean(
    Array.isArray(forbiddenFingerprints) &&
    forbiddenFingerprints.length > 0 &&
    forbiddenFingerprints.every(
      (fingerprint): fingerprint is string => typeof fingerprint === 'string' && isDatabaseFingerprint(fingerprint),
    ) &&
    new Set(forbiddenFingerprints).size === forbiddenFingerprints.length,
  );
}

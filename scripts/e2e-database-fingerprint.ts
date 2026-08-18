import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fingerprintDatabaseUrl } from '../e2e/database-target';

const VARIABLE_NAME_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
export type DatabaseFingerprintAcquisition = {
  targets: Array<{ name: string; present: boolean; valid: boolean; fingerprint: string | null }>;
  allPresent: boolean;
  allValid: boolean;
  allEqual: boolean;
};

export function acquireDatabaseFingerprints(
  variableNames: readonly string[],
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseFingerprintAcquisition {
  if (variableNames.length === 0 || variableNames.some((name) => !VARIABLE_NAME_PATTERN.test(name))) {
    throw new Error('Environment variable names required');
  }
  const targets = variableNames.map((name) => {
    const value = environment[name];
    if (!value) return { name, present: false, valid: false, fingerprint: null };
    try {
      return { name, present: true, valid: true, fingerprint: fingerprintDatabaseUrl(value) };
    } catch {
      return { name, present: true, valid: false, fingerprint: null };
    }
  });
  const validFingerprints = targets.flatMap((result) => (result.fingerprint ? [result.fingerprint] : []));
  return {
    targets,
    allPresent: targets.every((result) => result.present),
    allValid: targets.every((result) => result.valid),
    allEqual: validFingerprints.length === targets.length && new Set(validFingerprints).size === 1,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = acquireDatabaseFingerprints(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch {
    process.stderr.write('Usage: tsx scripts/e2e-database-fingerprint.ts ENV_VARIABLE [...ENV_VARIABLE]\n');
    process.exitCode = 1;
  }
}

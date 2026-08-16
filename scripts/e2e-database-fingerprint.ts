import { fingerprintDatabaseUrl } from '../e2e/database-target';

const VARIABLE_NAME_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
const variableNames = process.argv.slice(2);

if (variableNames.length === 0 || variableNames.some((name) => !VARIABLE_NAME_PATTERN.test(name))) {
  process.stderr.write('Usage: tsx scripts/e2e-database-fingerprint.ts ENV_VARIABLE [...ENV_VARIABLE]\n');
  process.exitCode = 1;
} else {
  const results = variableNames.map((name) => {
    const value = process.env[name];
    if (!value) return { name, present: false, valid: false, fingerprint: null };

    try {
      return { name, present: true, valid: true, fingerprint: fingerprintDatabaseUrl(value) };
    } catch {
      return { name, present: true, valid: false, fingerprint: null };
    }
  });

  const validFingerprints = results.flatMap((result) => (result.fingerprint ? [result.fingerprint] : []));

  process.stdout.write(
    `${JSON.stringify({
      targets: results,
      allPresent: results.every((result) => result.present),
      allValid: results.every((result) => result.valid),
      allEqual: validFingerprints.length === results.length && new Set(validFingerprints).size === 1,
    })}\n`,
  );
}

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { resolveE2eDatabaseEnvironment } from '@/e2e/database-guard';
import { fingerprintDatabaseUrl } from '@/e2e/database-target';

const pooledUrl = 'postgresql://pooled.example.test/evironn?sslmode=require';
const testPolicy = {
  approvedDevFingerprint: fingerprintDatabaseUrl(pooledUrl),
  forbiddenFingerprints: [fingerprintDatabaseUrl('postgresql://production.example.test/evironn')],
} as const;

describe('fingerprintDatabaseUrl', () => {
  it('normalizes pooled identity, hostname case, credentials, and query parameters', () => {
    expect(fingerprintDatabaseUrl('postgresql://user:secret@PHASE4-pooler.example.test/evironn?sslmode=require')).toBe(
      fingerprintDatabaseUrl('postgres://other@phase4.example.test/evironn?connect_timeout=5'),
    );
  });

  it('rejects invalid targets without exposing their input', () => {
    const secretInput = 'not-a-url-with-secret';
    expect(() => fingerprintDatabaseUrl(secretInput)).toThrow('valid PostgreSQL URL');

    try {
      fingerprintDatabaseUrl(secretInput);
    } catch (error) {
      expect(String(error)).not.toContain(secretInput);
    }
  });
});

describe('resolveE2eDatabaseEnvironment', () => {
  it('contains no ambient database URL fallback expression', () => {
    const source = readFileSync('e2e/database-guard.ts', 'utf8');
    expect(source).not.toContain('env.POSTGRES_URL');
    expect(source).not.toContain('env.DATABASE_URL');
  });

  it('rejects a missing disposable database write opt-in', () => {
    expect(() => resolveE2eDatabaseEnvironment({ E2E_DATABASE_URL: pooledUrl }, testPolicy)).toThrow(
      'E2E_DATABASE_ALLOW_WRITES=1',
    );
  });

  it.each([undefined, '', 'https://example.test/db', 'not-a-url'])('rejects invalid pooled URL: %s', (url) => {
    expect(() =>
      resolveE2eDatabaseEnvironment({ E2E_DATABASE_ALLOW_WRITES: '1', E2E_DATABASE_URL: url }, testPolicy),
    ).toThrow('E2E_DATABASE_URL');
  });

  it('never falls back to ambient application database URLs', () => {
    expect(() =>
      resolveE2eDatabaseEnvironment(
        {
          POSTGRES_URL: 'postgresql://ambient.example/app',
          POSTGRES_URL_NON_POOLING: 'postgresql://ambient-direct.example/app',
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
        },
        testPolicy,
      ),
    ).toThrow('E2E_DATABASE_URL');
  });

  it('rejects an explicitly supplied empty optional unpooled URL', () => {
    expect(() =>
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: pooledUrl,
          E2E_DATABASE_URL_UNPOOLED: '',
          E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
        },
        testPolicy,
      ),
    ).toThrow('E2E_DATABASE_URL_UNPOOLED');
  });

  it('rejects an invalid optional unpooled URL', () => {
    expect(() =>
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: pooledUrl,
          E2E_DATABASE_URL_UNPOOLED: 'https://example.test/db',
          E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
        },
        testPolicy,
      ),
    ).toThrow('E2E_DATABASE_URL_UNPOOLED');
  });

  it('uses only explicit E2E values and blanks email credentials', () => {
    expect(
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: pooledUrl,
          E2E_DATABASE_URL_UNPOOLED: pooledUrl,
          E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
          POSTGRES_URL: 'postgresql://ambient-pool.example.test/unsafe',
        },
        testPolicy,
      ),
    ).toMatchObject({ POSTGRES_URL: pooledUrl, POSTGRES_URL_NON_POOLING: pooledUrl, RESEND_API_KEY: '' });
  });

  it('allows ambient values when they resolve to the same approved target', () => {
    expect(
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: pooledUrl,
          E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
          POSTGRES_URL: pooledUrl,
          POSTGRES_URL_NON_POOLING: pooledUrl,
        },
        testPolicy,
      ),
    ).toMatchObject({ POSTGRES_URL: pooledUrl, POSTGRES_URL_NON_POOLING: pooledUrl });
  });

  it('falls back to explicit pooled URL when unpooled is absent', () => {
    expect(
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: pooledUrl,
          E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
        },
        testPolicy,
      ),
    ).toMatchObject({ POSTGRES_URL: pooledUrl, POSTGRES_URL_NON_POOLING: pooledUrl, RESEND_API_KEY: '' });
  });

  it('accepts matching pooled and unpooled normalized identities', () => {
    const policy = { ...testPolicy, approvedDevFingerprint: fingerprintDatabaseUrl(pooledUrl) };
    expect(
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: pooledUrl,
          E2E_DATABASE_URL_UNPOOLED: pooledUrl.replace('pooled.example.test', 'POOLED.EXAMPLE.TEST'),
          E2E_DATABASE_TARGET_FINGERPRINT: policy.approvedDevFingerprint,
        },
        policy,
      ),
    ).toMatchObject({ POSTGRES_URL: pooledUrl, RESEND_API_KEY: '' });
  });

  it('allows an empty forbidden policy for an approved dev target', () => {
    const pooled = 'postgresql://user:secret@phase4-pooler.example.test/dev?sslmode=require';
    const direct = 'postgresql://other@phase4.example.test/dev?connect_timeout=5';
    const policy = { approvedDevFingerprint: fingerprintDatabaseUrl(pooled), forbiddenFingerprints: [] };

    expect(
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: pooled,
          E2E_DATABASE_URL_UNPOOLED: direct,
          E2E_DATABASE_TARGET_FINGERPRINT: policy.approvedDevFingerprint,
        },
        policy,
      ),
    ).toMatchObject({ POSTGRES_URL: pooled, POSTGRES_URL_NON_POOLING: direct });
  });

  it('rejects an unapproved caller fingerprint without exposing URL identity', () => {
    expect(() =>
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: pooledUrl,
          E2E_DATABASE_TARGET_FINGERPRINT: '0'.repeat(64),
        },
        testPolicy,
      ),
    ).toThrow('approved non-production E2E database');
  });

  it('rejects a URL identity that differs from the approved target', () => {
    const unapprovedUrl = 'postgresql://user:secret@other.example.test/evironn?token=private';
    const action = () =>
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: unapprovedUrl,
          E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
        },
        testPolicy,
      );
    expect(action).toThrow('approved non-production E2E database');
    try {
      action();
    } catch (error) {
      expect(String(error)).toContain('approved non-production E2E database');
      expect(String(error)).not.toContain('secret');
      expect(String(error)).not.toContain('token=private');
    }
  });

  it('rejects a forbidden target fingerprint', () => {
    const forbiddenUrl = 'postgresql://production.example.test/evironn';
    const policy = { ...testPolicy, approvedDevFingerprint: fingerprintDatabaseUrl(forbiddenUrl) };
    expect(() =>
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: forbiddenUrl,
          E2E_DATABASE_TARGET_FINGERPRINT: policy.approvedDevFingerprint,
        },
        policy,
      ),
    ).toThrow('forbidden');
  });

  it('rejects equality with a present forbidden ambient database identity', () => {
    expect(() =>
      resolveE2eDatabaseEnvironment(
        {
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: pooledUrl,
          E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
          POSTGRES_URL: 'postgresql://production.example.test/evironn',
        },
        testPolicy,
      ),
    ).toThrow('forbidden ambient');
  });
});

import { describe, expect, it } from 'vitest';

import { resolveE2eDatabaseEnvironment } from '@/e2e/database-guard';

const pooledUrl = 'postgresql://pooled.example.test/evironn?sslmode=require';
const unpooledUrl = 'postgresql://direct.example.test/evironn?sslmode=require';

describe('resolveE2eDatabaseEnvironment', () => {
  it('rejects a missing disposable database write opt-in', () => {
    expect(() => resolveE2eDatabaseEnvironment({ E2E_DATABASE_URL: pooledUrl })).toThrow('E2E_DATABASE_ALLOW_WRITES=1');
  });

  it.each([undefined, '', 'https://example.test/db', 'not-a-url'])(
    'rejects an invalid pooled E2E database URL: %s',
    (url) => {
      expect(() =>
        resolveE2eDatabaseEnvironment({
          E2E_DATABASE_ALLOW_WRITES: '1',
          E2E_DATABASE_URL: url,
        }),
      ).toThrow('E2E_DATABASE_URL');
    },
  );

  it('rejects an invalid optional unpooled E2E database URL', () => {
    expect(() =>
      resolveE2eDatabaseEnvironment({
        E2E_DATABASE_ALLOW_WRITES: '1',
        E2E_DATABASE_URL: pooledUrl,
        E2E_DATABASE_URL_UNPOOLED: 'https://example.test/db',
      }),
    ).toThrow('E2E_DATABASE_URL_UNPOOLED');
  });

  it('uses only explicit E2E database values instead of ambient application values', () => {
    expect(
      resolveE2eDatabaseEnvironment({
        E2E_DATABASE_ALLOW_WRITES: '1',
        E2E_DATABASE_URL: pooledUrl,
        E2E_DATABASE_URL_UNPOOLED: unpooledUrl,
        POSTGRES_URL: 'postgresql://ambient-pool.example.test/unsafe',
        DATABASE_URL: 'postgresql://ambient-database.example.test/unsafe',
      }),
    ).toEqual({
      POSTGRES_URL: pooledUrl,
      POSTGRES_URL_NON_POOLING: unpooledUrl,
      RESEND_API_KEY: '',
    });
  });

  it('falls back to the explicit pooled E2E URL when direct E2E URL is absent', () => {
    expect(
      resolveE2eDatabaseEnvironment({
        E2E_DATABASE_ALLOW_WRITES: '1',
        E2E_DATABASE_URL: pooledUrl,
      }),
    ).toEqual({
      POSTGRES_URL: pooledUrl,
      POSTGRES_URL_NON_POOLING: pooledUrl,
      RESEND_API_KEY: '',
    });
  });

  it('accepts explicit pooled and direct disposable E2E URLs', () => {
    expect(
      resolveE2eDatabaseEnvironment({
        E2E_DATABASE_ALLOW_WRITES: '1',
        E2E_DATABASE_URL: pooledUrl,
        E2E_DATABASE_URL_UNPOOLED: unpooledUrl,
      }),
    ).toEqual({
      POSTGRES_URL: pooledUrl,
      POSTGRES_URL_NON_POOLING: unpooledUrl,
      RESEND_API_KEY: '',
    });
  });
});

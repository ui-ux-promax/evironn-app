import { describe, expect, it } from 'vitest';

import { resolveE2eDatabaseEnvironment } from '@/e2e/database-guard';

describe('E2E database connection compatibility', () => {
  it('uses application-style Neon URLs without a target policy', () => {
    expect(
      resolveE2eDatabaseEnvironment({
        POSTGRES_URL: 'postgresql://pool.example/db',
        POSTGRES_URL_NON_POOLING: 'postgresql://direct.example/db',
      }),
    ).toEqual({
      POSTGRES_URL: 'postgresql://pool.example/db',
      POSTGRES_URL_NON_POOLING: 'postgresql://direct.example/db',
      RESEND_API_KEY: '',
    });
  });

  it('keeps legacy E2E URL names as optional compatibility inputs', () => {
    expect(
      resolveE2eDatabaseEnvironment({
        E2E_DATABASE_URL: 'postgresql://pool.example/db',
        E2E_DATABASE_URL_UNPOOLED: 'postgresql://direct.example/db',
      }),
    ).toMatchObject({
      POSTGRES_URL: 'postgresql://pool.example/db',
      POSTGRES_URL_NON_POOLING: 'postgresql://direct.example/db',
    });
  });
});

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

export function resolveE2eDatabaseEnvironment(env: Record<string, string | undefined>): E2eDatabaseEnvironment {
  if (env.E2E_DATABASE_ALLOW_WRITES !== '1') {
    throw new Error('E2E_DATABASE_ALLOW_WRITES=1 is required for disposable E2E database access');
  }

  const pooledUrl = requirePostgresUrl('E2E_DATABASE_URL', env.E2E_DATABASE_URL);
  const unpooledUrl = env.E2E_DATABASE_URL_UNPOOLED
    ? requirePostgresUrl('E2E_DATABASE_URL_UNPOOLED', env.E2E_DATABASE_URL_UNPOOLED)
    : pooledUrl;

  return {
    POSTGRES_URL: pooledUrl,
    POSTGRES_URL_NON_POOLING: unpooledUrl,
    RESEND_API_KEY: '',
  };
}

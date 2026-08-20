export type E2eDatabaseEnvironment = {
  POSTGRES_URL: string;
  POSTGRES_URL_NON_POOLING: string;
  RESEND_API_KEY: string;
};

export function resolveE2eDatabaseEnvironment(
  env: Record<string, string | undefined> = process.env,
): E2eDatabaseEnvironment {
  const pooledUrl = env.POSTGRES_URL ?? env.E2E_DATABASE_URL;
  const unpooledUrl = env.POSTGRES_URL_NON_POOLING ?? env.E2E_DATABASE_URL_UNPOOLED ?? pooledUrl;
  if (!pooledUrl || !unpooledUrl) {
    throw new Error('POSTGRES_URL or POSTGRES_URL_NON_POOLING is required for E2E');
  }
  return { POSTGRES_URL: pooledUrl, POSTGRES_URL_NON_POOLING: unpooledUrl, RESEND_API_KEY: '' };
}

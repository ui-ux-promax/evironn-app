import { describe, expect, it } from 'vitest';
import { getSentryRuntimeOptions } from '@/lib/observability/sentry-options';

describe('getSentryRuntimeOptions', () => {
  it('returns the configured errors-only Sentry runtime options', () => {
    expect(
      getSentryRuntimeOptions({
        dsn: 'https://dsn',
        environment: 'production',
        release: 'abc123',
      }),
    ).toEqual({
      dsn: 'https://dsn',
      enabled: true,
      environment: 'production',
      release: 'abc123',
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
  });
});

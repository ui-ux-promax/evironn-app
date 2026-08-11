type SentryRuntimeOptionsInput = {
  dsn?: string;
  environment?: string;
  release?: string;
};

export function getSentryRuntimeOptions({ dsn, environment, release }: SentryRuntimeOptionsInput) {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: environment ?? 'development',
    release,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  };
}

import * as Sentry from '@sentry/nextjs';
import { getSentryRuntimeOptions } from '@/lib/observability/sentry-options';

Sentry.init(
  getSentryRuntimeOptions({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
  }),
);

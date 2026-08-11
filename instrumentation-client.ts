import * as Sentry from '@sentry/nextjs';
import { getSentryRuntimeOptions } from '@/lib/observability/sentry-options';

Sentry.init(
  getSentryRuntimeOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  }),
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/require-admin';
import { logger } from '@/lib/logger';

export async function POST() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const eventId = crypto.randomUUID();
  logger.error('portfolio_sentry_test', new Error('Controlled portfolio Sentry verification'), { eventId });
  await Sentry.flush(2_000);
  return NextResponse.json({ ok: true, eventId });
}

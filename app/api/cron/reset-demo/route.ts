import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma-client';
import { resetDemoData, type DemoResetDb } from '@/lib/demo-data/reset';
import { withDemoResetLock } from '@/lib/demo-data/reset-lock';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const runId = crypto.randomUUID();
  try {
    const invariants = await withDemoResetLock(() =>
      resetDemoData({ db: prisma as unknown as DemoResetDb, env: process.env }),
    );
    logger.info('demo_reset_succeeded', { runId, invariants });
    return NextResponse.json({ ok: true, invariants });
  } catch (error) {
    logger.error('demo_reset_failed', error, { runId });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

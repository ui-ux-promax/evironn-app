import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma-client';

/**
 * Opportunistic anonymous database warm-up for the login readiness path.
 *
 * Intentionally fire-and-forget — errors here are not shown to users.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.warn('warmup_db_not_ready', { err });
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';

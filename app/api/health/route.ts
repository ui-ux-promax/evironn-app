import { NextResponse } from 'next/server';
import { checkReadiness } from '@/lib/observability/readiness';
import { prisma } from '@/lib/prisma-client';
import { isRateLimitConfigured } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await checkReadiness({
    queryDb: () => prisma.$queryRaw`SELECT 1`,
    rateLimitConfigured: isRateLimitConfigured(),
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-client';

const SEEDED_ORDER_EMAIL_SUFFIX = '@test.ritm.invalid';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.E2E_DATABASE_ALLOW_WRITES !== '1' ||
    request.headers.get('x-e2e-read-only') !== '1'
  ) {
    return NextResponse.json({ error: 'Phase 3 E2E probe is unavailable' }, { status: 404 });
  }

  const order = await prisma.order.findFirst({
    where: { contactEmail: { endsWith: SEEDED_ORDER_EMAIL_SUFFIX } },
    orderBy: { orderNumber: 'asc' },
    select: { orderNumber: true },
  });

  if (!order) {
    return NextResponse.json(
      { error: 'Disposable E2E seed must contain at least one foreign order from prisma:seed-orders' },
      { status: 503 },
    );
  }

  return NextResponse.json({ foreignOrderNumber: order.orderNumber });
}

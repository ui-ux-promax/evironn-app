import { NextResponse } from 'next/server';
import { parseNotification } from '@webzaytsev/yookassa-ts-sdk';
import { logger } from '@/lib/logger';
import { reconcilePaymentStatus, recoverPaymentCorrelation } from '@/lib/payment-sync';
import { getPaymentStatus } from '@/lib/yookassa';

export const runtime = 'nodejs';

const SUPPORTED_PAYMENT_EVENTS = new Set(['payment.succeeded', 'payment.canceled']);

export async function POST(req: Request) {
  let notification;
  try {
    const body = await req.json();
    notification = parseNotification(body);
  } catch (e) {
    logger.error('yookassa_webhook_parse_failed', e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!SUPPORTED_PAYMENT_EVENTS.has(notification.event)) {
    logger.warn('yookassa_webhook_ignored_event', { event: notification.event });
    return NextResponse.json({ ok: true });
  }

  try {
    const remoteStatus = await getPaymentStatus(notification.object.id);
    const result = await reconcilePaymentStatus({
      paymentId: notification.object.id,
      remoteStatus,
      source: 'webhook',
    });
    if (result.kind === 'missing') {
      const recovered = await recoverPaymentCorrelation(notification.object.id);
      if (recovered.kind === 'error') {
        throw new Error(`Payment correlation recovery failed: ${recovered.reason}`);
      }
      if (recovered.kind === 'recovered') {
        await reconcilePaymentStatus({ paymentId: recovered.paymentId, remoteStatus, source: 'webhook' });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error('yookassa_webhook_failed', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PAYMENT_AUTO_RETRY_SAFETY } from '@/constants/config';

describe('YooKassa provider safety audit', () => {
  const source = readFileSync('lib/yookassa.ts', 'utf8');
  const sdkDeclarations = readFileSync('node_modules/@webzaytsev/yookassa-ts-sdk/dist/index.d.mts', 'utf8');

  it('keeps durable deterministic correlation', () => {
    expect(source).toContain('`payment-${input.orderId}`');
    expect(source).toContain('metadata: { orderNumber: String(input.orderNumber) }');
    expect(source).toContain('id: payment.id');
  });

  it('records automatic retry as unsafe because installed SDK proves no bounded retention window or metadata lookup', () => {
    expect(PAYMENT_AUTO_RETRY_SAFETY).toBe('PAYMENT_AUTO_RETRY_UNSAFE');
    expect(sdkDeclarations).toContain('Same key = same result, no duplicate charge');
    expect(sdkDeclarations).toContain("await redis.set(`payment:${orderId}:key`, idempotencyKey, 'EX', 86400)");
    expect(sdkDeclarations).toContain('type GetPaymentListFilter = {');
    const paymentFilter = sdkDeclarations.slice(
      sdkDeclarations.indexOf('type GetPaymentListFilter = {'),
      sdkDeclarations.indexOf('type GetRefundListFilter'),
    );
    expect(paymentFilter).not.toContain('metadata');
    expect(sdkDeclarations).not.toMatch(
      /provider.{0,40}(retention|expire|ttl)|idempotenc\w*.{0,40}(retention|expire|ttl)/i,
    );
  });
});

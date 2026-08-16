import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('YooKassa provider safety audit', () => {
  const source = readFileSync('lib/yookassa.ts', 'utf8');
  const sdkPackage = readFileSync('node_modules/@webzaytsev/yookassa-ts-sdk/package.json', 'utf8');

  it('keeps durable deterministic correlation', () => {
    expect(source).toContain('`payment-${input.orderId}`');
    expect(source).toContain('metadata: { orderNumber: String(input.orderNumber) }');
    expect(source).toContain('id: payment.id');
  });

  it('records automatic retry as unsafe because installed SDK proves no bounded retention window or metadata lookup', () => {
    expect(sdkPackage).not.toMatch(/idempotency.*(hour|day|retention|expire)/i);
    expect('PAYMENT_AUTO_RETRY_UNSAFE').toBe('PAYMENT_AUTO_RETRY_UNSAFE');
  });
});

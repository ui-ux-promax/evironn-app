import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('order source contract', () => {
  it('does not use clone controller or fabricated support/recommendations', () => {
    const source = fs.readFileSync('components/evironn/order/order-variant-a.tsx', 'utf8');
    expect(source).not.toMatch(/useOrder|orderState|findOrder|SupportForm|AlsoBuy|reorder|download/);
  });

  it('keeps review form outside clone rating-button selector', () => {
    const source = fs.readFileSync('components/evironn/order/order-variant-a.tsx', 'utf8');
    expect(source).toContain('className="ord-review"');
    expect(source).toMatch(/className="ord-rate ord-rate--light"[\s\S]*?<\/div>\s*\{target\.eligible/);
  });

  it('keeps payment status vocabulary in the shared DTO module', () => {
    const shared = fs.readFileSync('services/dto/payment-initialization.dto.ts', 'utf8');
    const orderDto = fs.readFileSync('services/dto/order-page.dto.ts', 'utf8');
    expect(shared).toContain('BlockedPaymentInitializationBaseDto');
    expect(shared).toContain('PAYMENT_INITIALIZATION_STATUSES');
    expect(shared).not.toContain('checkout-page.dto');
    expect(orderDto).toContain('PAYMENT_INITIALIZATION_READY');
    expect(orderDto).toContain('PAYMENT_INITIALIZATION_PENDING');
    expect(orderDto).toContain('PAYMENT_INITIALIZATION_BLOCKED');
    expect(orderDto).not.toMatch(/status: '(?:READY|PENDING)'/);
  });
});

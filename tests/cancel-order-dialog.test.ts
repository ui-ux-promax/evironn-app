import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('customer order cancellation dialog', () => {
  it('replaces the browser confirmation with the Ritm dialog', () => {
    const source = readFileSync('components/shared/orders/cancel-order-button.tsx', 'utf8');

    expect(source).not.toContain('window.confirm');
    expect(source).toContain('<Dialog.Root');
    expect(source).toContain('Отменить заказ?');
    expect(source).toContain('Не отменять');
  });
});

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('order source contract', () => {
  it('does not use clone controller or fabricated support/recommendations', () => {
    const source = fs.readFileSync('components/evironn/order/order-variant-a.tsx', 'utf8');
    expect(source).not.toMatch(/useOrder|orderState|findOrder|SupportForm|AlsoBuy|reorder|download/);
  });
});

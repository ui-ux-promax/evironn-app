import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('OrderVariantA', () => {
  it('exports production order shell', () =>
    expect(fs.readFileSync('components/evironn/order/order-variant-a.tsx', 'utf8')).toContain(
      'export function OrderVariantA',
    ));
});

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('legacy checkout form boundary', () => {
  it('removes the fabricated partial placement form', () => {
    expect(fs.existsSync(path.join(root, 'components/shared/checkout/checkout-form.tsx'))).toBe(false);
    const source = fs.readFileSync(path.join(root, 'components/evironn/checkout/use-checkout-variant-a.ts'), 'utf8');
    expect(source).toContain('placeOrder(payload)');
    expect(source).toContain('PlaceOrderInput');
  });

  it('removes the legacy server-action wrapper', () => {
    expect(fs.existsSync(path.join(root, 'components/shared/checkout/checkout-submit.ts'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'tests/checkout-form-submit.test.ts'))).toBe(false);
  });
});

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Checkout A assets', () => {
  it.each([
    ['styles/evironn/CheckoutVariantA.css', '4ef7df1adabf1b2b0731f03c71a3e292f86e936ed5acadcc5cfa69fb2f3f0e31'],
    ['styles/evironn/CheckoutPrimitives.css', '378b8cf64cdf1b64410f5fcb4ae0417440529c639dcfe8b910015ad829491bd9'],
  ])('keeps %s byte-identical', (path, expected) => {
    expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(expected);
  });
});

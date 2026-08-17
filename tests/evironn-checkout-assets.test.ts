import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Checkout A assets', () => {
  it.each([
    ['styles/evironn/CheckoutVariantA.css', '4ef7df1adabf1b2b0731f03c71a3e292f86e936ed5acadcc5cfa69fb2f3f0e31'],
    ['styles/evironn/CheckoutPrimitives.css', 'a6862f4b6c18a5b2914823b70238832437167cdb55429c68ac06e76778e0d04b'],
  ])('keeps %s byte-identical', (path, expected) => {
    expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(expected);
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../lib/order-page.ts', import.meta.url), 'utf8');

describe('canonical furniture order page', () => {
  it('uses canonical product IDs for review queries and submissions', () => {
    expect(source).toContain('canonicalSku:');
    expect(source).toContain('item.canonicalSku?.product');
    expect(source).toContain('getReviewEligibility(userId, product.id)');
  });
});

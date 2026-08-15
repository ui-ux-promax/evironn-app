import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('profile wishlist DTO boundary', () => {
  it('adapts canonical wishlist data before passing it to legacy ProfileView', () => {
    const source = readFileSync('app/(shop)/profile/page.tsx', 'utf8');

    expect(source).toContain('toProfileProductCardData');
    expect(source).toContain('wishlist={wishlistProducts.map(toProfileProductCardData)}');
  });
});

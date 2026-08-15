import { describe, expect, it } from 'vitest';
import { relatedProductHref } from '@/lib/cart-related-href';

describe('cart related product URLs', () => {
  it('emits encoded product slug and canonical option query', () => {
    expect(
      relatedProductHref({
        slug: 'linen-side-table',
        primaryOption: 'finish:walnut,upholstery:ivory-boucle',
      }),
    ).toBe('/product/linen-side-table?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle');
  });

  it('omits option query when related product has no primary selection', () => {
    expect(relatedProductHref({ slug: 'plain-table', primaryOption: null })).toBe('/product/plain-table');
  });
});

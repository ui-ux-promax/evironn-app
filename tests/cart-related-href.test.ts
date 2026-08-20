import { describe, expect, it } from 'vitest';
import { relatedProductHref } from '@/lib/cart-related-href';
import { SHOWCASE_PRODUCT_SLUG } from '@/lib/showcase-product';

describe('cart related product URLs', () => {
  it('emits encoded product slug and canonical option query', () => {
    expect(
      relatedProductHref({
        slug: SHOWCASE_PRODUCT_SLUG,
        primaryOption: 'finish:walnut,upholstery:ivory-boucle',
      }),
    ).toBe('/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle');
  });

  it('omits option query when related product has no primary selection', () => {
    expect(relatedProductHref({ slug: SHOWCASE_PRODUCT_SLUG, primaryOption: null })).toBe('/product/noma-woven-lounge');
  });

  it('does not emit a route for unsupported product slugs', () => {
    expect(relatedProductHref({ slug: 'linen-side-table', primaryOption: 'finish:walnut' })).toBeNull();
  });
});

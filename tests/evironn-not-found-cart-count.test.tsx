import { describe, expect, it, vi } from 'vitest';

const getInitialCartCount = vi.hoisted(() => vi.fn());

vi.mock('@/lib/storefront-cart-count', () => ({ getInitialCartCount }));
vi.mock('@/components/evironn/storefront-header', () => ({
  StorefrontHeader: ({ cartCount }: { cartCount: number }) => <div data-testid="header-count">{cartCount}</div>,
}));
vi.mock('@/components/evironn/not-found-view', () => ({ NotFoundView: () => <div data-testid="not-found-view" /> }));
vi.mock('@/components/evironn/storefront-footer', () => ({ StorefrontFooter: () => <div data-testid="footer" /> }));

describe('not-found storefront shell', () => {
  it('passes initial cart count into header', async () => {
    getInitialCartCount.mockResolvedValue(4);
    const { default: NotFound } = await import('@/app/not-found');

    const tree = await NotFound();

    expect(getInitialCartCount).toHaveBeenCalledOnce();
    expect(JSON.stringify(tree)).toContain('"cartCount":4');
  });
});

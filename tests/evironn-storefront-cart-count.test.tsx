import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cookies: vi.fn(),
  resolveOwnerCart: vi.fn(),
  cartItemCount: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/cart', () => ({ resolveOwnerCart: mocks.resolveOwnerCart }));
vi.mock('@/lib/prisma-client', () => ({ prisma: { cartItem: { count: mocks.cartItemCount } } }));
vi.mock('@/lib/seo', () => ({ buildStorefrontJsonLd: () => ({ '@type': 'Store' }) }));
vi.mock('@/components/shared/auth/verification-gate-host', () => ({ VerificationGateHost: () => null }));
vi.mock('@/components/evironn/storefront-footer', () => ({ StorefrontFooter: () => null }));
vi.mock('@/components/evironn/storefront-header', () => ({
  StorefrontHeader: ({ cartCount }: { cartCount: number }) => <div data-testid="header-count">{cartCount}</div>,
}));

describe('Evironn storefront cart count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => ({ value: 'cookie-token' })) });
    mocks.resolveOwnerCart.mockResolvedValue({ id: 'cart-1', token: 'owner-token' });
    mocks.cartItemCount.mockResolvedValue(3);
  });

  it('counts existing owner cart items without creating a cart', async () => {
    const { getInitialCartCount } = await import('@/lib/storefront-cart-count');

    await expect(getInitialCartCount()).resolves.toBe(3);

    expect(mocks.resolveOwnerCart).toHaveBeenCalledWith('user-1', 'cookie-token', { create: false });
    expect(mocks.cartItemCount).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
  });

  it('passes nonzero server cart count into the shop header', async () => {
    const { default: ShopLayout } = await import('@/app/(shop)/layout');

    const tree = await ShopLayout({ children: <main>content</main> });

    expect(JSON.stringify(tree)).toContain('"cartCount":3');
  });
});

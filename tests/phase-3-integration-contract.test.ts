import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

// Checked-in Phase 3 source manifest. Keep this independent from repository history so
// shallow CI can enforce the delivery boundary without needing an ancestor commit.
const phase3Files = [
  'app/(auth)/login/page.tsx',
  'app/(auth)/register/page.tsx',
  'app/(shop)/cart/page.tsx',
  'app/(shop)/profile/page.tsx',
  'app/actions/address.ts',
  'app/actions/auth.ts',
  'app/actions/coupon.ts',
  'app/actions/profile.ts',
  'app/actions/review.ts',
  'app/actions/wishlist.ts',
  'app/api/cart/route.ts',
  'components/evironn/auth/auth-variant-b-controller.tsx',
  'components/evironn/cart/cart-variant-a.tsx',
  'components/evironn/cart/use-cart-variant-a.ts',
  'components/evironn/profile/profile-variant-a.tsx',
  'components/evironn/profile/use-profile-variant-a.ts',
  'lib/profile-page.ts',
  'lib/review.ts',
  'lib/wishlist.ts',
  'services/dto/commerce-cart.dto.ts',
  'services/dto/profile-page.dto.ts',
  'services/dto/review.dto.ts',
];

const phase3DeliveryFiles = [
  ...phase3Files,
  'tests/phase-3-integration-contract.test.ts',
  'tests/review.test.ts',
  'tests/submit-review.test.ts',
  'e2e/helpers.ts',
  'e2e/review.spec.ts',
];

const forbiddenDeliveryPathPattern =
  /(^|\/)(?:app\/\(shop\)\/(?:checkout|orders?)|\((?:checkout|payments?|orders?|admins?|perf|performance)\)(?:[-/.\/]|$)|(?:[^/]*-)?(?:checkout|payments?|orders?|admins?|perf|performance)(?:[-/.\/]|$))/i;

const legacyReadCompatibilityPaths = new Set(['lib/cart-merge.ts', 'lib/order.ts', 'tests/cart-presentation.test.ts']);
const isForbiddenDeliveryPath = (file: string) =>
  !legacyReadCompatibilityPaths.has(file) && forbiddenDeliveryPathPattern.test(file);

describe('Phase 3 producer/consumer integration boundary', () => {
  it('names concrete Auth, cart, wishlist, profile, totals, and review boundaries', () => {
    for (const file of phase3Files) expect(existsSync(resolve(root, file)), file).toBe(true);

    expect(read('app/(auth)/login/page.tsx')).toContain('AuthVariantB');
    expect(read('app/(auth)/register/page.tsx')).toContain('AuthVariantB');
    expect(read('app/(shop)/cart/page.tsx')).toContain('CartView');
    expect(read('app/(shop)/profile/page.tsx')).toContain('getProfilePageDto');
    expect(read('app/actions/auth.ts')).toContain('safeCallbackUrl');
    expect(read('app/actions/address.ts')).toContain('withSerializableAddressRetry');
    expect(read('app/actions/coupon.ts')).toContain('buildCartDto');
    expect(read('app/actions/profile.ts')).toContain('auth()');
    expect(read('app/actions/wishlist.ts')).toContain('toggleWishlist');
    expect(read('app/api/cart/route.ts')).toContain('buildCartDto');
    expect(read('components/evironn/cart/use-cart-variant-a.ts')).toContain('validateCoupon');
    expect(read('components/evironn/profile/use-profile-variant-a.ts')).toContain('toggleWishlist');
    expect(read('services/dto/commerce-cart.dto.ts')).toContain('CartTotalsDto');
    expect(read('services/dto/profile-page.dto.ts')).toContain('ProfilePageDto');
  });

  it('keeps canonical skuId as the only new cart write identity', () => {
    const cartRoute = read('app/api/cart/route.ts');
    expect(cartRoute).toContain('create: { cartId: owner.id, skuId, quantity: nextQuantity }');
    expect(cartRoute).not.toContain('productVariantId');

    const cartSources = [
      'app/api/cart/route.ts',
      'components/evironn/cart/cart-variant-a.tsx',
      'components/evironn/profile/profile-variant-a.tsx',
    ]
      .map(read)
      .join('\n');
    expect(cartSources).not.toContain('productVariantId');
    expect(read('lib/cart-merge.ts')).toContain('else if (item.productVariantId)');
  });

  it('keeps wishlist controlled, profile protected, and review eligibility server-owned', () => {
    expect(read('components/evironn/cart/cart-variant-a.tsx')).toContain('initialWishlistedIds: string[]');
    expect(read('components/evironn/profile/profile-variant-a.tsx')).toContain('readOnly');
    expect(read('app/(shop)/profile/page.tsx')).toContain("if (!session?.user?.id) redirect('/login')");
    const orderRoute = read('app/(shop)/orders/[number]/page.tsx');
    expect(orderRoute).toContain("if (!session?.user?.id) redirect('/login')");
    expect(orderRoute).toContain('order.userId !== session.user.id');
    expect(read('app/actions/review.ts')).toContain("import { canReview, isValidRating } from '@/lib/review'");
    expect(read('app/actions/review.ts')).toContain('canReview(userId, productId)');
    expect(read('lib/review.ts')).toContain('purchasedOrderWhere');
    expect(read('lib/review.ts')).toContain('hasQualifyingPurchase');
    expect(read('lib/review.ts')).toContain("paymentMethod: 'cod', status: 'DELIVERED'");
    expect(read('lib/review.ts')).toContain("paymentMethod: 'online'");
    expect(read('app/actions/review.ts')).not.toMatch(/eligible\s*:/);
  });

  it('has no clone mock controllers, forbidden delivery paths, or schema change', () => {
    const production = phase3Files.map(read).join('\n');
    expect(production).not.toMatch(/CATALOG_PRODUCTS|PROMO_CODES|mockController|useAuth\(/);

    const schema = read('prisma/schema.prisma');
    expect(schema).toContain('canonicalSku      Sku?');
    expect(schema).toContain('@@unique([productId, userId])');

    expect(phase3Files).not.toContain('prisma/schema.prisma');
    expect(phase3DeliveryFiles.filter(isForbiddenDeliveryPath)).toEqual([]);
    expect(read('lib/cart-merge.ts')).toContain('else if (item.productVariantId)');
  });

  it('recognizes checkout, payment, order, admin, and performance path variants', () => {
    const forbidden = [
      'app/(shop)/checkout/page.tsx',
      'app/(shop)/orders/[number]/page.tsx',
      'lib/payment-sync.ts',
      'lib/order-links.ts',
      'lib/image-performance.ts',
      'components/shared/admin-panel.tsx',
      'app/(admin)/admin/page.tsx',
    ];
    for (const file of forbidden) expect(isForbiddenDeliveryPath(file), file).toBe(true);

    for (const file of legacyReadCompatibilityPaths) expect(isForbiddenDeliveryPath(file), file).toBe(false);
  });
});

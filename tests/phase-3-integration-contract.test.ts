import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

type DeliveryManifestEntry = { path: string; status: 'A' | 'M' | 'D' };
type DeliveryManifest = { fileCount: number; filesSha256: string; files: DeliveryManifestEntry[] };

const EXPECTED_PHASE3_FILE_COUNT = 115;
const EXPECTED_PHASE3_FILES_SHA256 = '1d8873aefb74327e13bb6104e882ae88c11fdb855d87928cb8fa659d2105512d';

const phase3DeliveryManifest = JSON.parse(
  read('docs/superpowers/manifests/phase-3-delivery-manifest.json'),
) as DeliveryManifest;

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

const phase3DeliveryFiles = phase3DeliveryManifest.files.map(({ path }) => path);

const forbiddenDeliveryPathPattern =
  /(?:^|\/)(?:\((?:checkout|payment|payments|order|orders|admin|admins|perf|performance)\)|(?:checkout|payment|payments|order|orders|admin|admins|perf|performance)(?:[-._/]|$)|[^/]*(?:checkout|payment|payments|order|orders|admin|admins|perf|performance)(?:[-._/]|$))/i;

const legacyReadCompatibilityPaths = new Set(['lib/cart-merge.ts', 'lib/order.ts', 'tests/cart-presentation.test.ts']);
const normalizePath = (file: string) => file.replaceAll('\\', '/');
const isForbiddenDeliveryPath = (file: string) => {
  const normalized = normalizePath(file);
  return !legacyReadCompatibilityPaths.has(normalized) && forbiddenDeliveryPathPattern.test(normalized);
};

const manifestFingerprint = (files: DeliveryManifestEntry[]) =>
  createHash('sha256')
    .update(
      `${files
        .map(({ path, status }) => `${status}\t${normalizePath(path)}`)
        .sort()
        .join('\n')}\n`,
    )
    .digest('hex');

function validateDeliveryManifest(files: DeliveryManifestEntry[]): string[] {
  const errors: string[] = [];
  const paths = files.map(({ path }) => normalizePath(path));
  const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);

  if (files.length !== phase3DeliveryManifest.fileCount) errors.push('file count mismatch');
  if (manifestFingerprint(files) !== phase3DeliveryManifest.filesSha256) errors.push('file fingerprint mismatch');
  if (duplicates.length > 0) errors.push(`duplicate path: ${duplicates[0]}`);

  for (const { path, status } of files) {
    const normalized = normalizePath(path);
    if (normalized !== path) errors.push(`non-canonical path: ${path}`);
    if (status === 'D' ? existsSync(resolve(root, normalized)) : !existsSync(resolve(root, normalized))) {
      errors.push(`status/existence mismatch: ${status} ${normalized}`);
    }
    if (status !== 'D' && isForbiddenDeliveryPath(normalized)) errors.push(`forbidden delivery path: ${normalized}`);
  }

  return errors;
}

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
    expect(orderRoute).toContain('userId: session.user.id');
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

  it('uses a complete checked-in manifest for the delivery and rejects forbidden additions', () => {
    expect(phase3DeliveryManifest.fileCount).toBe(EXPECTED_PHASE3_FILE_COUNT);
    expect(phase3DeliveryManifest.filesSha256).toBe(EXPECTED_PHASE3_FILES_SHA256);
    expect(phase3DeliveryFiles).toContain('tests/purchase-panel-loading.test.ts');
    expect(validateDeliveryManifest(phase3DeliveryManifest.files)).toEqual([]);

    const omitted = phase3DeliveryManifest.files.slice(0, -1);
    expect(validateDeliveryManifest(omitted)).toEqual(
      expect.arrayContaining(['file count mismatch', 'file fingerprint mismatch']),
    );

    const withForbiddenPath = [
      ...phase3DeliveryManifest.files,
      { status: 'A' as const, path: 'app/(shop)/checkout/page.tsx' },
    ];
    expect(validateDeliveryManifest(withForbiddenPath)).toEqual(
      expect.arrayContaining([
        'file count mismatch',
        'file fingerprint mismatch',
        'forbidden delivery path: app/(shop)/checkout/page.tsx',
      ]),
    );
  });

  it('probes a seeded foreign order through a guarded read-only API', () => {
    const helper = read('e2e/helpers.ts');
    expect(helper).toContain("'/api/e2e/phase3-probe'");
    expect(helper).toContain('foreignOrderNumber');
    expect(helper).not.toContain("'/orders/1'");

    const probe = read('app/api/e2e/phase3-probe/route.ts');
    expect(probe).toContain("process.env.E2E_DATABASE_ALLOW_WRITES !== '1'");
    expect(probe).toContain("const SEEDED_ORDER_EMAIL_SUFFIX = '@test.ritm.invalid'");
    expect(probe).toContain('findFirst');
    expect(probe).not.toMatch(/\.(create|update|upsert|delete|deleteMany)\s*\(/);
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

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const manifestPath = 'docs/superpowers/manifests/phase-4-delivery-manifest.json';
const deliveryReportPath = '.superpowers/sdd/phase-4-delivery-report.md';

const read = (relativePath: string) => {
  const absolutePath = resolve(root, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

const sha256 = (relativePath: string) =>
  createHash('sha256')
    .update(readFileSync(resolve(root, relativePath)))
    .digest('hex');

const phase4Files = [
  '.env.example',
  '.superpowers/sdd/phase-4-plan-review.md',
  '.superpowers/sdd/phase-4-task-1-report.md',
  '.superpowers/sdd/phase-4-task-2-report.md',
  '.superpowers/sdd/phase-4-task-2a-report.md',
  '.superpowers/sdd/phase-4-task-3-report.md',
  '.superpowers/sdd/phase-4-task-3a-report.md',
  '.superpowers/sdd/phase-4-task-4-report.md',
  '.superpowers/sdd/phase-4-task-5-report.md',
  '.superpowers/sdd/phase-4-task-7-report.md',
  '.superpowers/sdd/progress.md',
  'app/(shop)/checkout/loading.tsx',
  'app/(shop)/checkout/page.tsx',
  'app/(shop)/layout.tsx',
  'app/(shop)/orders/[number]/loading.tsx',
  'app/(shop)/orders/[number]/page.tsx',
  'app/actions/checkout.ts',
  'app/actions/order.ts',
  'app/api/dadata/suggest/route.ts',
  'app/api/yookassa/webhook/route.ts',
  'components/evironn/cart/cart-variant-a.tsx',
  'components/evironn/checkout/checkout-primitives.tsx',
  'components/evironn/checkout/checkout-variant-a.tsx',
  'components/evironn/checkout/use-checkout-variant-a.ts',
  'components/evironn/order/order-primitives.tsx',
  'components/evironn/order/order-variant-a.tsx',
  'components/evironn/order/use-order-variant-a.ts',
  'components/shared/orders/cancel-order-button.tsx',
  'constants/config.ts',
  'docs/roadmap/DECISIONS.md',
  'docs/roadmap/STATUS.md',
  'docs/superpowers/plans/2026-08-16-phase-4-checkout-orders.md',
  'docs/superpowers/specs/2026-08-17-phase-4-durable-payment-claim-design.md',
  'e2e/checkout.spec.ts',
  'e2e/database-command-report.ts',
  'e2e/database-guard.ts',
  'e2e/database-readiness.ts',
  'e2e/database-target.ts',
  'e2e/helpers.ts',
  'e2e/order.spec.ts',
  'e2e/phase4-database.ts',
  'e2e/phase4-namespace.ts',
  'e2e/review.spec.ts',
  'e2e/yookassa.spec.ts',
  'lib/cart-quantity.ts',
  'lib/checkout-domain.ts',
  'lib/checkout-page.ts',
  'lib/coupon.ts',
  'lib/order-page.ts',
  'lib/order.ts',
  'lib/payment-initialization.ts',
  'lib/payment-sync.ts',
  'lib/yookassa.ts',
  'playwright.config.ts',
  'prisma/migrations/20260816_phase4_delivery_snapshots/migration.sql',
  'prisma/migrations/20260816_phase4_payment_replay/migration.sql',
  'prisma/migrations/20260817_phase4_payment_claim/migration.sql',
  'prisma/schema.prisma',
  'scripts/e2e-database-fingerprint.ts',
  'scripts/e2e-prisma-migrate.ts',
  'services/dto/checkout-page.dto.ts',
  'services/dto/checkout.dto.ts',
  'services/dto/order-page.dto.ts',
  'services/dto/order.dto.ts',
  'services/dto/payment-initialization.dto.ts',
  'styles/evironn/CheckoutPrimitives.css',
  'styles/evironn/CheckoutVariantA.css',
  'styles/evironn/OrderPrimitives.css',
  'styles/evironn/OrderVariantA.css',
  'tests/cancel-order.test.ts',
  'tests/checkout-domain.test.ts',
  'tests/checkout-dto.test.ts',
  'tests/checkout-form-boundary.test.ts',
  'tests/checkout-page.test.ts',
  'tests/checkout-quote.test.ts',
  'tests/checkout-route.test.tsx',
  'tests/checkout-sandbox-copy.test.ts',
  'tests/dadata-suggest-route.test.ts',
  'tests/e2e-database-guard.test.ts',
  'tests/evironn-cart-source-contract.test.ts',
  'tests/evironn-cart-variant-a.test.tsx',
  'tests/evironn-checkout-assets.test.ts',
  'tests/evironn-checkout-source-contract.test.ts',
  'tests/evironn-checkout-variant-a.test.tsx',
  'tests/evironn-order-assets.test.ts',
  'tests/evironn-order-source-contract.test.ts',
  'tests/evironn-order-variant-a.test.tsx',
  'tests/order-coupon.test.ts',
  'tests/order-page-canonical.test.ts',
  'tests/order-page-dto.test.ts',
  'tests/order-page-payment-recovery.test.ts',
  'tests/order-payment-actions.test.ts',
  'tests/order-snapshot.test.ts',
  'tests/order-transaction.test.ts',
  'tests/payment-initialization.test.ts',
  'tests/payment-sync.test.ts',
  'tests/phase-4-e2e-safety-contract.test.ts',
  'tests/phase-4-integration-contract.test.ts',
  'tests/phase-4-migration-status.test.ts',
  'tests/phase-4-schema-contract.test.ts',
  'tests/place-order-builder-integration.test.ts',
  'tests/place-order-online.test.ts',
  'tests/place-order.test.ts',
  'tests/yookassa-lib.test.ts',
  'tests/yookassa-provider-contract.test.ts',
  'tests/yookassa-webhook.test.ts',
].sort();

const manifest = JSON.parse(read(manifestPath) || '{}') as {
  schemaVersion?: number;
  baseSha?: string;
  fileCount?: number;
  totalBytes?: number;
  entries?: Array<{ path: string; sha256: string; bytes: number }>;
};
const entries = manifest.entries ?? [];

const source = (paths: string[]) => paths.map(read).join('\n');
const phase4Source = source(
  phase4Files.filter((path) => /^(app|components|constants|lib|prisma|services)\//.test(path)),
);

describe('Phase 4 integration and delivery boundary', () => {
  it('pins the exact base, file inventory, bytes, hashes, and manifest exclusion', () => {
    expect(manifest).not.toEqual({});
    expect(Object.keys(manifest).sort()).toEqual(['baseSha', 'entries', 'fileCount', 'schemaVersion', 'totalBytes']);
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.baseSha).toBe('868310f');
    expect(manifest.fileCount).toBe(106);
    expect(entries.map(({ path }) => path)).toEqual(phase4Files);
    expect(entries).not.toContainEqual(expect.objectContaining({ path: manifestPath }));
    expect(new Set(entries.map(({ path }) => path)).size).toBe(entries.length);
    expect(
      entries.every(({ path, sha256: digest, bytes }) => {
        const absolutePath = resolve(root, path);
        return existsSync(absolutePath) && statSync(absolutePath).size === bytes && sha256(path) === digest;
      }),
    ).toBe(true);
    expect(manifest.totalBytes).toBe(entries.reduce((total, entry) => total + entry.bytes, 0));
    expect(manifest.totalBytes).toBe(954689);
  });

  it('keeps the schema expansion additive and preserves prior migration bytes', () => {
    const schema = read('prisma/schema.prisma');
    const claimMigration = read('prisma/migrations/20260817_phase4_payment_claim/migration.sql');
    expect(schema).toMatch(
      /enum PaymentInitializationState\s*\{[\s\S]*READY[\s\S]*CLAIMED[\s\S]*DISPATCHED[\s\S]*CORRELATED[\s\S]*NOT_CREATED[\s\S]*\}/,
    );
    for (const field of ['paymentInitializationState', 'paymentInitializationClaimedAt', 'paymentEverDispatchedAt']) {
      expect(schema).toMatch(new RegExp(`^\\s*${field}\\s+`, 'm'));
    }
    expect(claimMigration).toContain('CREATE TYPE "PaymentInitializationState" AS ENUM');
    expect(claimMigration).toContain('ADD COLUMN "paymentInitializationState"');
    expect(claimMigration).toContain('ADD COLUMN "paymentInitializationClaimedAt"');
    expect(claimMigration).toContain('ADD COLUMN "paymentEverDispatchedAt"');
    expect(claimMigration).not.toMatch(/\b(?:DROP|RENAME|UPDATE|INSERT|TRUNCATE|DELETE|DEFAULT|NOT NULL)\b/i);
    expect(sha256('prisma/migrations/20260816_phase4_delivery_snapshots/migration.sql').toUpperCase()).toBe(
      'E8972D3AB2A83A5DC19854C7F6EE575F2C4F34665A4EDC67670A061A8D61209A',
    );
    expect(sha256('prisma/migrations/20260816_phase4_payment_replay/migration.sql').toUpperCase()).toBe(
      '268D1DDEA90D2920320B61E4F375C07C27CB0151AD72F67AEFC70A1CA713AD18',
    );
  });

  it('keeps canonical SKU cart writes, cart-only placement, and one quote authority', () => {
    const checkoutAction = read('app/actions/checkout.ts');
    const checkoutDomain = read('lib/checkout-domain.ts');
    const checkoutDto = read('services/dto/checkout.dto.ts');
    const checkoutPage = read('lib/checkout-page.ts');
    const cart = read('components/evironn/cart/cart-variant-a.tsx');
    expect(checkoutAction).toContain('buildCheckoutQuote');
    expect(checkoutAction).toContain('getCheckoutQuote');
    expect(checkoutPage).toContain('skuId');
    expect(`${checkoutDto}\n${checkoutDomain}`).not.toMatch(/buyNowSkuId|buyNowProductVariantId/);
    expect(checkoutDto).toContain('.strict()');
    expect(checkoutPage).toContain('productVariantId !== null');
    expect(checkoutPage).toContain("quoteError('SKU_UNAVAILABLE'");
    expect(checkoutAction).not.toContain('productVariantId:');
    expect(cart).toContain('href="/checkout"');
    expect(read('tests/checkout-form-boundary.test.ts')).toContain('placeOrder(payload)');
    expect(read('tests/checkout-form-boundary.test.ts')).toContain('PlaceOrderInput');
    expect(read('components/shared/checkout/checkout-form.tsx')).toBe('');
  });

  it('requires the complete transactional retry authority and immutable canonical snapshots', () => {
    const placement = source(['app/actions/checkout.ts', 'app/actions/order.ts', 'lib/order.ts']);
    expect(placement).toMatch(/quote|recalculate/i);
    expect(placement).toContain('runSerializableOrderTransaction');
    for (const token of ['coupon', 'sku', 'delivery', 'service', 'snapshot', 'cartItem'])
      expect(placement).toContain(token);
    expect(placement).toMatch(/isolationLevel:\s*['"]Serializable['"]/);
    expect(placement).toMatch(/retry|P2034|serialization/i);
    expect(read('lib/order.ts')).toContain('skuId');
    expect(read('lib/order.ts')).toContain('imageUrl');
    expect(read('tests/order-snapshot.test.ts')).toContain('canonical');
  });

  it('covers all payment initialization outcomes and exact blocked client contracts', () => {
    const payment = read('lib/payment-initialization.ts');
    const checkoutDto = read('services/dto/checkout-page.dto.ts');
    const orderDto = read('services/dto/order-page.dto.ts');
    const sharedDto = read('services/dto/payment-initialization.dto.ts');
    for (const outcome of ['NOT_CREATED', 'CREATED', 'INDETERMINATE', 'BLOCKED_AFTER_RETRY_WINDOW'])
      expect(payment).toContain(outcome);
    expect(read('app/actions/order.ts')).toContain('PAYMENT_INITIALIZATION_BLOCKED');
    expect(checkoutDto).toContain('BlockedPaymentInitializationDto');
    for (const text of [
      'Платёж требует проверки',
      'Повторное создание платежа отключено; статус проверяется.',
      'continuePaymentUrl: null',
      'canRetryCreate: false',
    ]) {
      expect(checkoutDto).toContain(text);
      expect(orderDto).toContain(text);
    }
    expect(checkoutDto).toContain("allowedActions: ['OPEN_ORDER']");
    expect(orderDto).toContain('allowedActions: canCancel');
    expect(orderDto).toContain("['RESYNC_PAYMENT']");
    expect(orderDto).toContain("'CANCEL_ORDER'");
    expect(read('app/actions/order.ts')).toContain('resyncOrderPayment');
    expect(read('app/actions/order.ts')).toContain('cancelOrder');
  });

  it('locks ADR-017 and ADR-018 replay, claim, race, and fail-closed safety', () => {
    const decisions = read('docs/roadmap/DECISIONS.md');
    const design = read('docs/superpowers/specs/2026-08-17-phase-4-durable-payment-claim-design.md');
    for (const token of [
      'ADR-015',
      'ADR-016',
      'ADR-017',
      'ADR-018',
      'T = 24 hours',
      'W = 23 hours',
      'READY',
      'CLAIMED',
      'DISPATCHED',
      'CORRELATED',
      'NOT_CREATED',
      'paymentEverDispatchedAt',
      'no timeout',
      'INDETERMINATE',
    ]) {
      expect(`${decisions}\n${design}`).toContain(token);
    }
    expect(design).toMatch(/freshNow < Order\.createdAt \+ 23 hours/);
    expect(read('lib/payment-initialization.ts')).toMatch(/claim|claimed/i);
    expect(read('tests/payment-initialization.test.ts')).toMatch(/interleav|concurr|race|serialization/i);
    expect(read('tests/payment-initialization.test.ts')).toContain('BLOCKED_AFTER_RETRY_WINDOW');
  });

  it('pins policy values, Moscow timezone sentinels, exact clone CSS, and source boundaries', () => {
    const decisions = read('docs/roadmap/DECISIONS.md');
    const policy = read('constants/config.ts');
    for (const token of ['1,900', '150,000', '350', '3,900', '2,400']) {
      expect(decisions).toContain(token);
    }
    for (const token of ['Europe/Moscow', 'moscow-region', 'showroom', 'pickup-point', '10:00', '14:00', '18:00']) {
      expect(policy).toContain(token);
    }
    expect(sha256('styles/evironn/CheckoutVariantA.css').toUpperCase()).toBe(
      '4EF7DF1ADABF1B2B0731F03C71A3E292F86E936ED5ACADCC5CFA69FB2F3F0E31',
    );
    expect(sha256('styles/evironn/CheckoutPrimitives.css').toUpperCase()).toBe(
      'A6862F4B6C18A5B2914823B70238832437167CDB55429C68AC06E76778E0D04B',
    );
    expect(sha256('styles/evironn/OrderVariantA.css').toUpperCase()).toBe(
      '86EC6B153D735D05C1AA9F6E89E56FD20E4179CFE6F8D445624B065E8933927D',
    );
    expect(sha256('styles/evironn/OrderPrimitives.css').toUpperCase()).toBe(
      '2B9B742C16BE4F51E57D823132AAC14D27E1FD2DCCDAED7D1586F4BC807209A1',
    );
    expect(read('components/evironn/checkout/checkout-variant-a.tsx')).toContain('CheckoutVariantA');
    expect(read('components/evironn/order/order-variant-a.tsx')).toContain('OrderVariantA');
    expect(read('app/(shop)/checkout/page.tsx')).toContain('CheckoutVariantA');
    expect(read('app/(shop)/orders/[number]/page.tsx')).toContain('OrderVariantA');
  });

  it('keeps ADR-013 showcase routing, namespace fixtures, and safe E2E wrappers', () => {
    const e2e = source(['e2e/checkout.spec.ts', 'e2e/order.spec.ts', 'e2e/review.spec.ts', 'e2e/yookassa.spec.ts']);
    const safety = source([
      'e2e/database-guard.ts',
      'e2e/database-readiness.ts',
      'e2e/database-target.ts',
      'e2e/database-command-report.ts',
      'scripts/e2e-prisma-migrate.ts',
    ]);
    expect(read('app/(shop)/product/[slug]/page.tsx')).toContain('SHOWCASE_PRODUCT_SLUG');
    expect(e2e).toContain('phase4Namespace');
    expect(e2e).not.toMatch(/\/product\/(?!noma-woven-lounge)/);
    expect(e2e).not.toContain('ProductVariant');
    expect(e2e).toContain('Платёж требует проверки');
    expect(e2e).toContain('Повторное создание платежа отключено; статус проверяется.');
    expect(safety).toContain('E2E_DATABASE_URL');
    expect(safety).toContain('E2E_DATABASE_ALLOW_WRITES');
    expect(safety).toContain('DatabaseCommandReport');
    expect(safety).toMatch(/stdio:\s*\[['"]pipe['"],\s*['"]pipe['"],\s*['"]pipe['"]\]/);
    expect(safety).not.toMatch(/TRUNCATE|migrate\s+reset|db\s+push|stdio:\s*['"]inherit['"]/i);
    expect(safety).not.toMatch(/process\.env\.(?:POSTGRES_URL|POSTGRES_URL_NON_POOLING|DATABASE_URL)/);
    expect(read('e2e/database-readiness.ts')).not.toMatch(/stdout|stderr|password|hostname|username|query\s*:/i);
  });

  it('excludes clone mocks, fake payment, forbidden scopes, and protected plan drift', () => {
    expect(phase4Source).not.toMatch(/CATALOG_PRODUCTS|PROMO_CODES|mockController|useCheckout\s*\(/);
    expect(phase4Source).not.toMatch(/ritm-white-tee|fashion-shop|demo-admin|Cloudinary|Sentry|performance/i);
    expect(phase4Source).not.toMatch(/fake|fabricat|test-only.*provider/i);
    expect(read('docs/roadmap/DECISIONS.md')).toMatch(/no separate Production database exists/i);
    expect(sha256('docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md').toUpperCase()).toBe(
      'FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9',
    );
    expect(sha256('docs/superpowers/plans/phase-2-task-3-execution.md').toUpperCase()).toBe(
      'F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2',
    );
  });

  it('records honest blocked completion readiness and presence-only environment state', () => {
    const closeout = `${read('docs/roadmap/STATUS.md')}\n${read('.superpowers/sdd/progress.md')}\n${read(deliveryReportPath)}`;
    expect(closeout).toContain('BLOCKED_COMPLETION_READINESS');
    expect(closeout).toContain('E2E_DATABASE_URL=false');
    expect(closeout).toContain('YOOKASSA_SHOP_ID=false');
    expect(closeout).toContain('DADATA_TOKEN=false');
    expect(closeout).toMatch(/full gate|completion gate/i);
    expect(closeout).toMatch(/not run|deferred|blocked/i);
    expect(closeout).not.toMatch(/postgres(?:ql)?:\/\/|password\s*[:=]|hostname\s*[:=]/i);
  });
});

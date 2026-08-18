import { EventEmitter } from 'node:events';
import { readFileSync, existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { runPrismaMigrationDeploy } from '@/scripts/e2e-prisma-migrate';

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, 'utf8');
const e2eFiles = [
  'e2e/helpers.ts',
  'e2e/checkout.spec.ts',
  'e2e/order.spec.ts',
  'e2e/review.spec.ts',
  'e2e/yookassa.spec.ts',
];

describe('Phase 4 E2E safety contract', () => {
  it('sanitizes representative Prisma success and error buffers', async () => {
    const rawIdentity = 'postgresql://username:password@host.example/database?query=secret';
    const env = {
      E2E_DATABASE_URL: rawIdentity,
      E2E_DATABASE_ALLOW_WRITES: '1',
      E2E_DATABASE_TARGET_FINGERPRINT: 'a'.repeat(64),
    };
    const guardedEnvironment = {
      POSTGRES_URL: rawIdentity,
      POSTGRES_URL_NON_POOLING: rawIdentity,
      RESEND_API_KEY: '',
    };
    const spawnFixture = (exitCode: number, output: string) => {
      const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter };
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      queueMicrotask(() => {
        child.stdout.emit('data', Buffer.from(output));
        child.stderr.emit('data', Buffer.from(output));
        child.emit('close', exitCode);
      });
      return child;
    };
    const baseDependencies = {
      resolveEnvironment: () => guardedEnvironment,
      migrations: () => ['20260817_phase4_payment_claim'],
    };
    const success = await runPrismaMigrationDeploy(env, {
      ...baseDependencies,
      spawnProcess: (() => spawnFixture(0, `${rawIdentity}\n20260817_phase4_payment_claim`)) as never,
    });
    const failure = await runPrismaMigrationDeploy(env, {
      ...baseDependencies,
      spawnProcess: (() => spawnFixture(1, `${rawIdentity}\nError: provider stack`)) as never,
    });
    expect(JSON.stringify(success)).not.toContain(rawIdentity);
    expect(JSON.stringify(failure)).not.toContain(rawIdentity);
    expect(failure.errorCategory).toBe('MIGRATION_FAILED');
  });

  it('maps an unrecognized deploy exception to the allowlisted category', async () => {
    const report = await runPrismaMigrationDeploy(
      {},
      {
        resolveEnvironment: () => ({
          POSTGRES_URL: 'postgresql://safe.example/db',
          POSTGRES_URL_NON_POOLING: 'postgresql://safe.example/db',
          RESEND_API_KEY: '',
        }),
        spawnProcess: (() => {
          throw new Error('raw URL and stack must not escape');
        }) as never,
      },
    );
    expect(report.errorCategory).toBe('UNRECOGNIZED_DATABASE_COMMAND_ERROR');
    expect(JSON.stringify(report)).not.toContain('raw URL');
  });

  it('ships guarded namespace fixture and migration wrapper files', () => {
    expect(existsSync(`${root}/e2e/phase4-database.ts`)).toBe(true);
    expect(existsSync(`${root}/scripts/e2e-prisma-migrate.ts`)).toBe(true);
    expect(read('e2e/phase4-database.ts')).toContain('resolveE2eDatabaseEnvironment(process.env)');
    expect(read('scripts/e2e-prisma-migrate.ts')).toContain("stdio: ['pipe', 'pipe', 'pipe']");
  });

  it('keeps every Phase 4 generated identity inside a unique namespace', () => {
    const source = e2eFiles.map(read).join('\n');
    expect(source).toContain('phase4Namespace');
    expect(source).not.toMatch(/e2e-\$\{Date\.now\(\)\}/);
    expect(source).not.toContain('ritm-white-tee-oversize');
    expect(source).not.toContain('ProductVariant');
    expect(source).not.toMatch(/\/product\/(?!noma-woven-lounge)/);
  });

  it('forbids unsafe database commands, ambient fallback, and raw report leakage', () => {
    const source = [
      read('e2e/phase4-database.ts'),
      read('e2e/database-readiness.ts'),
      read('e2e/database-command-report.ts'),
      read('scripts/e2e-prisma-migrate.ts'),
    ].join('\n');
    expect(source).not.toMatch(/deleteMany\(\s*\{\s*\}\s*\)/);
    expect(source).not.toMatch(/deleteMany\(\s*\)\s*[;)]/);
    expect(source).not.toMatch(/TRUNCATE|migrate\s+reset|db\s+push/i);
    expect(source).not.toContain("stdio: 'inherit'");
    expect(source).not.toMatch(/process\.env\.(?:POSTGRES_URL|POSTGRES_URL_NON_POOLING|DATABASE_URL)/);
    expect(read('e2e/database-command-report.ts')).not.toMatch(
      /(?:stdout|stderr|password|hostname|username|query)\s*:/i,
    );
  });

  it('uses exact namespace ownership, serializable targeted cleanup, and provider refusal', () => {
    const source = read('e2e/phase4-database.ts');
    for (const token of [
      'createPhase4CheckoutFixture',
      'seedOwnedCartLine',
      'markOwnedOrderDelivered',
      'markOwnedOrderAsLegacySnapshot',
      'createPhase4BlockedPaymentFixture',
      'cleanupPhase4Namespace',
      'disconnectPhase4Database',
      'PROVIDER_STATE_INDETERMINATE',
      "isolationLevel: 'Serializable'",
      'serviceAmount: 0',
      'paymentEverDispatchedAt',
      'NOT_CREATED_BY_CONSTRUCTION',
    ]) {
      expect(source).toContain(token);
    }
    expect(source).toMatch(/where:\s*\{[^}]*id:\s*\{\s*in:/s);
    expect(source).toMatch(/orderItem\.deleteMany\(\{\s*where:/s);
    expect(source).toMatch(/cartItem\.deleteMany\(\{\s*where:/s);
  });

  it('preserves ADR-013 showcase routing and canonical furniture ownership', () => {
    const route = read('app/(shop)/product/[slug]/page.tsx');
    const showcase = read('lib/showcase-product.ts');
    const catalogContract = read('tests/evironn-catalog-source-contract.test.ts');
    expect(route).toMatch(/slug\s*!==\s*SHOWCASE_PRODUCT_SLUG/);
    expect(route).toContain('SHOWCASE_PRODUCT_SLUG');
    expect(showcase).toContain('SHOWCASE_PRODUCT_SLUG');
    expect(catalogContract).toContain('showcase');
    expect(read('e2e/phase4-database.ts')).not.toMatch(/noma-woven-lounge|Noma/i);
  });

  it('keeps checkout, order, review, and payment scenarios canonical and truthful', () => {
    const checkout = read('e2e/checkout.spec.ts');
    const order = read('e2e/order.spec.ts');
    const review = read('e2e/review.spec.ts');
    const payment = read('e2e/yookassa.spec.ts');
    expect(checkout).toMatch(/showroom COD/i);
    expect(checkout).toMatch(/pickup-point COD/i);
    expect(checkout).toMatch(/moscow-region/);
    expect(order).toContain('width: 390');
    expect(order).toContain('width: 1440');
    expect(review).toContain('markOwnedOrderDelivered');
    expect(payment).toContain('YOOKASSA_MODE');
    expect(payment).toMatch(/COD/);
    expect(payment).not.toMatch(/test-only|fake|fabricat/i);
  });

  it('does not invent coupon usage storage or provider endpoints', () => {
    const schema = read('prisma/schema.prisma');
    const source = e2eFiles.map(read).join('\n');
    expect(schema).toMatch(/model Coupon[\s\S]*?createdAt\s+DateTime/);
    expect(schema).not.toMatch(/CouponUsage|couponUsage|usageCount|usedBy/);
    expect(source).not.toMatch(/app\/api\/e2e|test-only.*endpoint|route\.ts/);
  });
});

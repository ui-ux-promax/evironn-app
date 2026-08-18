import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const contractMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cookies: vi.fn(),
  resolveOwnerCart: vi.fn(),
  buildCheckoutOrderData: vi.fn(),
  ensureOnlinePayment: vi.fn(),
  assertPaymentMode: vi.fn(),
  validateYooKassaConfiguration: vi.fn(),
  transaction: vi.fn(),
  adjustSalesCount: vi.fn(),
  saveAddress: vi.fn(),
  revalidatePath: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: contractMocks.auth }));
vi.mock('next/headers', () => ({ cookies: contractMocks.cookies }));
vi.mock('next/cache', () => ({ revalidatePath: contractMocks.revalidatePath }));
vi.mock('@/lib/cart', () => ({ resolveOwnerCart: contractMocks.resolveOwnerCart }));
vi.mock('@/lib/checkout-page', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/checkout-page')>();
  return { ...actual, buildCheckoutOrderData: contractMocks.buildCheckoutOrderData };
});
vi.mock('@/lib/payment-initialization', () => ({ ensureOnlinePayment: contractMocks.ensureOnlinePayment }));
vi.mock('@/lib/payment-environment', () => ({ assertPortfolioPaymentMode: contractMocks.assertPaymentMode }));
vi.mock('@/lib/yookassa', () => ({
  cancelPayment: vi.fn(),
  createPaymentAttempt: vi.fn(),
  getPaymentDetails: vi.fn(),
  validateYooKassaConfiguration: contractMocks.validateYooKassaConfiguration,
  siteUrl: () => 'https://preview.test',
  toOrigin: (value: string) => value,
}));
vi.mock('@/lib/sales-count', () => ({ adjustSalesCount: contractMocks.adjustSalesCount }));
vi.mock('@/app/actions/address', () => ({ saveAddressFromOrder: contractMocks.saveAddress }));
vi.mock('@/lib/review', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/review')>();
  return { ...actual, pruneReviewsAfterCancel: vi.fn() };
});
vi.mock('@/lib/payment-sync', () => ({ reconcilePaymentStatus: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { error: contractMocks.loggerError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/prisma-client', () => ({ prisma: { $transaction: contractMocks.transaction } }));

import { placeOrder } from '@/app/actions/order';
import { CHECKOUT_POLICY } from '@/constants/config';
import {
  buildDeliverySlots,
  calculateServiceLines,
  fromDeliveryDateSentinel,
  moscowDateOnly,
  toDeliveryDateSentinel,
} from '@/lib/checkout-domain';
import { purchasedOrderWhere } from '@/lib/review';
import { runSerializableOrderTransaction } from '@/lib/order';
import { buildBlockedOrderPaymentInitialization } from '@/services/dto/order-page.dto';
import { buildBlockedPaymentInitializationDto } from '@/services/dto/checkout-page.dto';
import { fingerprintDatabaseUrl, hasCompleteForbiddenFingerprintPolicy } from '@/e2e/database-target';
import { resolveE2eDatabaseEnvironment } from '@/e2e/database-guard';
import { phase4Namespace } from '@/e2e/phase4-namespace';
import { validatePhase4NeverAttemptedProof } from '@/e2e/phase4-database';
import { EXPECTED_PHASE4_MIGRATIONS, runPhase4DatabaseReadiness } from '@/e2e/database-readiness';

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

type DiffRecord = { status: string; path: string; previousPath?: string };

function baseDiff(): DiffRecord[] {
  const output = execFileSync('git', ['diff', '--name-status', '868310f..HEAD'], { cwd: root, encoding: 'utf8' });
  return output
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [status, first, second] = line.split('\t');
      return status.startsWith('R') ? { status, path: second, previousPath: first } : { status, path: first };
    });
}

const phase4Files = baseDiff()
  .filter(({ status }) => status !== 'D')
  .map(({ path }) => path)
  .filter((path) => path !== manifestPath)
  .sort();

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

const placementNow = new Date('2026-08-16T09:00:00.000Z');
const placementSlot = buildDeliverySlots(placementNow, 'courier')[0];
const placementForm = {
  contactName: 'Иван Петров',
  contactPhone: '+79990000000',
  contactEmail: 'ivan@example.test',
  deliveryMethod: 'courier',
  deliveryZone: 'moscow',
  deliverySlotId: placementSlot.id,
  address: { city: 'Москва', addressLine: 'Тверская, 1', floor: 5, liftType: 'none', intercom: '12' },
  services: { carrying: true, assembly: true, removal: false },
  couponCode: 'EV10',
  paymentMethod: 'cod',
} as const;

function placementTransaction() {
  return {
    sku: { updateMany: vi.fn(async () => ({ count: 1 })) },
    order: {
      create: vi.fn(async () => ({ id: 'order-1', orderNumber: 1042, createdAt: placementNow, totalAmount: 185300 })),
      update: vi.fn(async () => ({})),
    },
    cartItem: { deleteMany: vi.fn(async () => ({ count: 1 })) },
  };
}

const firstPlacementData = {
  cartId: 'cart-1',
  cartItemIds: ['line-1'],
  salesItems: [{ productId: 'product-1', quantity: 2 }],
  snapshot: {
    items: [
      {
        skuId: 'sku-first',
        skuArticleNumber: 'EV-FIRST',
        skuCombinationKey: 'finish=oak',
        productName: 'Noma',
        productSlug: 'noma',
        configuration: [{ groupSlug: 'finish', groupName: 'Отделка', valueSlug: 'oak', valueName: 'Дуб' }],
        imageUrl: '/first.webp',
        unitPrice: 100000,
        oldUnitPrice: 120000,
        quantity: 2,
        lineTotal: 200000,
      },
    ],
    itemsTotal: 200000,
  },
  quote: {
    coupon: { code: 'EV10', percent: 10 },
    delivery: { method: 'courier', zone: 'moscow', slot: placementSlot, pickupPoint: null },
    serviceLines: [
      { id: 'carrying', label: 'Подъём без лифта', amount: 1400 },
      { id: 'assembly', label: 'Сборка', amount: 3900 },
    ],
    totals: { itemsSubtotal: 200000, couponDiscount: 20000, deliveryAmount: 0, serviceAmount: 5300, total: 185300 },
  },
};

const secondPlacementData = {
  ...firstPlacementData,
  cartItemIds: ['line-2'],
  salesItems: [{ productId: 'product-2', quantity: 3 }],
  snapshot: {
    items: [
      {
        ...firstPlacementData.snapshot.items[0],
        skuId: 'sku-second',
        skuArticleNumber: 'EV-SECOND',
        skuCombinationKey: 'finish=walnut',
        configuration: [{ groupSlug: 'finish', groupName: 'Отделка', valueSlug: 'walnut', valueName: 'Орех' }],
        imageUrl: '/second.webp',
        unitPrice: 105000,
        quantity: 3,
        lineTotal: 315000,
      },
    ],
    itemsTotal: 315000,
  },
  quote: {
    coupon: { code: 'EV20', percent: 20 },
    delivery: { method: 'courier', zone: 'moscow-region', slot: placementSlot, pickupPoint: null },
    serviceLines: [{ id: 'assembly', label: 'Сборка', amount: 3900 }],
    totals: { itemsSubtotal: 315000, couponDiscount: 63000, deliveryAmount: 0, serviceAmount: 3900, total: 255900 },
  },
};

type PaymentState = 'READY' | 'CLAIMED' | 'DISPATCHED' | 'CORRELATED' | 'NOT_CREATED' | null;

function paymentHarness(overrides: Record<string, unknown> = {}) {
  const state = {
    order: {
      id: 'order-1',
      orderNumber: 1042,
      status: 'PENDING',
      paymentMethod: 'online',
      totalAmount: 159900,
      paymentReturnUrl: 'https://preview.test/orders/1042',
      createdAt: new Date('2026-08-16T00:00:00.000Z'),
      paymentInitializationState: 'READY' as PaymentState,
      paymentInitializationClaimedAt: null as Date | null,
      paymentEverDispatchedAt: null as Date | null,
      payment: null as Record<string, unknown> | null,
      items: [{ skuId: 'sku-1', quantity: 2 }],
      ...overrides,
    },
    stock: 8,
  };
  const tx = {
    order: {
      updateMany: vi.fn(async ({ where, data }: { where: Record<string, any>; data: Record<string, any> }) => {
        if (state.order.status !== 'PENDING') return { count: 0 };
        if (where.paymentMethod && where.paymentMethod !== state.order.paymentMethod) return { count: 0 };
        if (where.payment?.is === null && state.order.payment !== null) return { count: 0 };
        if (where.payment?.isNot === null && state.order.payment === null) return { count: 0 };
        const expectedState = where.paymentInitializationState;
        if (typeof expectedState === 'string' && state.order.paymentInitializationState !== expectedState)
          return { count: 0 };
        if (expectedState?.in && !expectedState.in.includes(state.order.paymentInitializationState))
          return { count: 0 };
        if (
          'paymentInitializationClaimedAt' in where &&
          where.paymentInitializationClaimedAt?.getTime?.() !== state.order.paymentInitializationClaimedAt?.getTime?.()
        )
          return { count: 0 };
        if (
          'paymentEverDispatchedAt' in where &&
          where.paymentEverDispatchedAt?.getTime?.() !== state.order.paymentEverDispatchedAt?.getTime?.()
        )
          return { count: 0 };
        Object.assign(state.order, data);
        return { count: 1 };
      }),
    },
    payment: {
      findUnique: vi.fn(async () => (state.order.payment ? { id: String(state.order.payment.id) } : null)),
      upsert: vi.fn(
        async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
          state.order.payment = state.order.payment ? { ...state.order.payment, ...update } : create;
          return state.order.payment;
        },
      ),
    },
    sku: { update: vi.fn(async () => ((state.stock += 2), {})) },
  };
  const client = {
    order: { findUnique: vi.fn(async () => ({ ...state.order })) },
    $transaction: vi.fn(async (operation: (transaction: typeof tx) => unknown) => operation(tx)),
  };
  return { state, tx, client };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(placementNow);
  contractMocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
  contractMocks.cookies.mockResolvedValue({ get: () => ({ value: 'cart-token' }) });
  contractMocks.resolveOwnerCart.mockResolvedValue({ id: 'cart-1', token: 'cart-token' });
  contractMocks.buildCheckoutOrderData.mockResolvedValue(firstPlacementData);
  contractMocks.transaction.mockImplementation(
    async (operation: (transaction: ReturnType<typeof placementTransaction>) => unknown) =>
      operation(placementTransaction()),
  );
  process.env.YOOKASSA_MODE = 'sandbox';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Phase 4 integration and delivery boundary', () => {
  it('pins the exact base, file inventory, bytes, hashes, and manifest exclusion', () => {
    const diff = baseDiff();
    const expectedExisting = diff
      .filter(({ status }) => status !== 'D')
      .map(({ path }) => path)
      .filter((path) => path !== manifestPath)
      .sort();
    const deleted = diff
      .filter(({ status }) => status === 'D')
      .map(({ path }) => path)
      .sort();
    expect(manifest).not.toEqual({});
    expect(Object.keys(manifest).sort()).toEqual(['baseSha', 'entries', 'fileCount', 'schemaVersion', 'totalBytes']);
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.baseSha).toBe('868310f');
    expect(expectedExisting).toEqual(phase4Files);
    expect(entries.map(({ path }) => path)).toEqual(expectedExisting);
    expect(deleted).toEqual(['components/shared/checkout/checkout-form.tsx']);
    expect(entries.map(({ path }) => path)).toContain(deliveryReportPath);
    expect(entries).not.toContainEqual(expect.objectContaining({ path: manifestPath }));
    expect(new Set(entries.map(({ path }) => path)).size).toBe(entries.length);
    expect(
      entries.every(({ path, sha256: digest, bytes }) => {
        const absolutePath = resolve(root, path);
        return existsSync(absolutePath) && statSync(absolutePath).size === bytes && sha256(path) === digest;
      }),
    ).toBe(true);
    expect(manifest.totalBytes).toBe(entries.reduce((total, entry) => total + entry.bytes, 0));
    expect(manifest.fileCount).toBe(expectedExisting.length);
  });

  it('keeps the schema expansion additive and preserves prior migration bytes', () => {
    const schema = read('prisma/schema.prisma');
    const migrations = {
      'prisma/migrations/20260816_phase4_delivery_snapshots/migration.sql': `ALTER TABLE "Order" ADD COLUMN "deliveryZone" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryDate" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveryWindow" TEXT;
ALTER TABLE "Order" ADD COLUMN "pickupPointId" TEXT;
ALTER TABLE "Order" ADD COLUMN "pickupPointName" TEXT;
ALTER TABLE "Order" ADD COLUMN "pickupPointAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "floor" INTEGER;
ALTER TABLE "Order" ADD COLUMN "liftType" TEXT;
ALTER TABLE "Order" ADD COLUMN "intercom" TEXT;
ALTER TABLE "Order" ADD COLUMN "serviceDetails" JSONB;
ALTER TABLE "Order" ADD COLUMN "serviceAmount" INTEGER NOT NULL DEFAULT 0;`,
      'prisma/migrations/20260816_phase4_payment_replay/migration.sql':
        'ALTER TABLE "Order" ADD COLUMN "paymentReturnUrl" TEXT;',
      'prisma/migrations/20260817_phase4_payment_claim/migration.sql': `CREATE TYPE "PaymentInitializationState" AS ENUM ('READY', 'CLAIMED', 'DISPATCHED', 'CORRELATED', 'NOT_CREATED');

ALTER TABLE "Order"
ADD COLUMN "paymentInitializationState" "PaymentInitializationState",
ADD COLUMN "paymentInitializationClaimedAt" TIMESTAMP(3),
ADD COLUMN "paymentEverDispatchedAt" TIMESTAMP(3);`,
    } as const;
    for (const [path, expected] of Object.entries(migrations)) expect(read(path).trim()).toBe(expected);
    expect(
      schema
        .match(/enum PaymentInitializationState\s*\{([^}]*)\}/)?.[1]
        .trim()
        .split(/\s+/),
    ).toEqual(['READY', 'CLAIMED', 'DISPATCHED', 'CORRELATED', 'NOT_CREATED']);
    const orderModel = schema.match(/model Order\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    for (const [field, definition] of [
      ['deliveryZone', 'String?'],
      ['deliveryDate', 'DateTime?'],
      ['deliveryWindow', 'String?'],
      ['pickupPointId', 'String?'],
      ['pickupPointName', 'String?'],
      ['pickupPointAddress', 'String?'],
      ['floor', 'Int?'],
      ['liftType', 'String?'],
      ['intercom', 'String?'],
      ['serviceDetails', 'Json?'],
      ['serviceAmount', 'Int         @default(0)'],
      ['paymentReturnUrl', 'String?'],
      ['paymentInitializationState', 'PaymentInitializationState?'],
      ['paymentInitializationClaimedAt', 'DateTime?'],
      ['paymentEverDispatchedAt', 'DateTime?'],
    ]) {
      const definitionPattern = definition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      expect(orderModel).toMatch(new RegExp(`\\b${field}\\s+${definitionPattern}`));
    }
    for (const field of ['paymentInitializationState', 'paymentInitializationClaimedAt', 'paymentEverDispatchedAt']) {
      expect(orderModel).toMatch(new RegExp(`^\\s*${field}\\s+[^\\n]*$`, 'm'));
      expect(orderModel).not.toMatch(new RegExp(`^\\s*${field}.*@default`, 'm'));
    }
    expect(Object.values(migrations).join('\n')).not.toMatch(/\b(?:DROP|RENAME|UPDATE|INSERT|TRUNCATE|DELETE)\b/i);
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

  it('reruns authoritative quote/cart/coupon/SKU/delivery/service/snapshot and commits retry-only placement values', async () => {
    const conflict = Object.assign(new Error('serialization conflict'), { code: 'P2034' });
    const first = placementTransaction();
    const second = placementTransaction();
    let attempt = 0;
    let committed: ReturnType<typeof placementTransaction> | null = null;
    contractMocks.buildCheckoutOrderData
      .mockResolvedValueOnce(firstPlacementData)
      .mockResolvedValueOnce(secondPlacementData);
    contractMocks.transaction.mockImplementation(
      async (operation: (transaction: ReturnType<typeof placementTransaction>) => unknown) => {
        attempt += 1;
        const transaction = attempt === 1 ? first : second;
        const result = await operation(transaction);
        if (attempt === 1) throw conflict;
        committed = transaction;
        return result;
      },
    );

    await expect(placeOrder(placementForm)).resolves.toEqual({ ok: true, code: 'ORDER_READY', orderNumber: 1042 });
    expect(contractMocks.buildCheckoutOrderData).toHaveBeenCalledTimes(2);
    expect(contractMocks.buildCheckoutOrderData.mock.calls).toEqual([
      [{ userId: 'user-1', cartId: 'cart-1', raw: placementForm, now: placementNow, client: first }],
      [{ userId: 'user-1', cartId: 'cart-1', raw: placementForm, now: placementNow, client: second }],
    ]);
    expect(first.sku.updateMany).toHaveBeenCalledWith({
      where: { id: 'sku-first', active: true, stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(second.sku.updateMany).toHaveBeenCalledWith({
      where: { id: 'sku-second', active: true, stock: { gte: 3 } },
      data: { stock: { decrement: 3 } },
    });
    expect(second.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemsTotal: 315000,
        discountAmount: 63000,
        shippingAmount: 0,
        serviceAmount: 3900,
        totalAmount: 255900,
        couponCode: 'EV20',
        deliveryZone: 'moscow-region',
        deliveryWindow: placementSlot.windowLabel,
        serviceDetails: [{ id: 'assembly', label: 'Сборка', amount: 3900 }],
        items: {
          create: [
            expect.objectContaining({
              skuId: 'sku-second',
              skuArticleNumber: 'EV-SECOND',
              skuCombinationKey: 'finish=walnut',
              imageUrl: '/second.webp',
              unitPrice: 105000,
              quantity: 3,
              lineTotal: 315000,
            }),
          ],
        },
      }),
      select: { id: true, orderNumber: true, createdAt: true, totalAmount: true },
    });
    expect(second.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1', id: { in: ['line-2'] } } });
    expect(committed).toBe(second);
  });

  it('maps every payment initialization outcome through placeOrder and exact Checkout/Order action DTOs', async () => {
    const onlineForm = { ...placementForm, paymentMethod: 'online' as const };
    const outcomes = [
      {
        provider: { outcome: 'NOT_CREATED' as const },
        result: {
          ok: false,
          code: 'PAYMENT_NOT_CREATED',
          orderNumber: 1042,
          error: 'Не удалось создать платёж. Попробуйте оформить заказ снова.',
        },
      },
      {
        provider: { outcome: 'CREATED' as const, confirmationUrl: 'https://yookassa.test/confirm' },
        result: {
          ok: true,
          code: 'PAYMENT_REDIRECT_READY',
          orderNumber: 1042,
          paymentUrl: 'https://yookassa.test/confirm',
        },
      },
      {
        provider: { outcome: 'INDETERMINATE' as const },
        result: {
          ok: false,
          code: 'PAYMENT_INITIALIZATION_PENDING',
          orderNumber: 1042,
          error: 'Заказ сохранён. Статус платежа проверяется.',
        },
      },
      {
        provider: { outcome: 'BLOCKED_AFTER_RETRY_WINDOW' as const },
        result: {
          ok: false,
          code: 'PAYMENT_INITIALIZATION_BLOCKED',
          paymentInitialization: buildBlockedPaymentInitializationDto(1042),
        },
      },
    ] as const;
    for (const { provider, result } of outcomes) {
      vi.clearAllMocks();
      contractMocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
      contractMocks.cookies.mockResolvedValue({ get: () => ({ value: 'cart-token' }) });
      contractMocks.resolveOwnerCart.mockResolvedValue({ id: 'cart-1', token: 'cart-token' });
      contractMocks.buildCheckoutOrderData.mockResolvedValue(firstPlacementData);
      contractMocks.transaction.mockImplementation(
        async (operation: (transaction: ReturnType<typeof placementTransaction>) => unknown) =>
          operation(placementTransaction()),
      );
      contractMocks.ensureOnlinePayment.mockResolvedValue(provider);
      await expect(placeOrder(onlineForm)).resolves.toEqual(result);
    }

    expect(buildBlockedPaymentInitializationDto(1042)).toEqual({
      status: 'PAYMENT_INITIALIZATION_BLOCKED',
      orderNumber: 1042,
      heading: 'Платёж требует проверки',
      message: 'Заказ №1042 сохранён. Повторное создание платежа отключено; статус проверяется.',
      continuePaymentUrl: null,
      canRetryCreate: false,
      allowedActions: ['OPEN_ORDER'],
    });
    expect(buildBlockedOrderPaymentInitialization(1042, false)).toEqual({
      status: 'PAYMENT_INITIALIZATION_BLOCKED',
      orderNumber: 1042,
      heading: 'Платёж требует проверки',
      message: 'Заказ №1042 сохранён. Повторное создание платежа отключено; статус проверяется.',
      continuePaymentUrl: null,
      canRetryCreate: false,
      allowedActions: ['RESYNC_PAYMENT'],
    });
    expect(buildBlockedOrderPaymentInitialization(1042, true)).toEqual({
      status: 'PAYMENT_INITIALIZATION_BLOCKED',
      orderNumber: 1042,
      heading: 'Платёж требует проверки',
      message: 'Заказ №1042 сохранён. Повторное создание платежа отключено; статус проверяется.',
      continuePaymentUrl: null,
      canRetryCreate: false,
      allowedActions: ['RESYNC_PAYMENT', 'CANCEL_ORDER'],
    });
  });

  it('locks exact ADR-015/016/017/018 facts and citations', () => {
    const decisions = read('docs/roadmap/DECISIONS.md');
    const design = read('docs/superpowers/specs/2026-08-17-phase-4-durable-payment-claim-design.md');
    expect(decisions).toContain('## ADR-015 — Phase 4 shared non-production E2E database');
    expect(decisions).toContain('## ADR-013 — staged UI and data adaptation');
    expect(decisions).toContain(
      'Until product-specific media packs are validated, all catalog cards target one showcase slug and non-showcase PDP routes redirect there.',
    );
    expect(decisions).toContain(
      'Its normalized `hostname/database` SHA-256 fingerprint is `4e408e2198d9448ac9bc15b5aa150b05dbeb61c75ce05d11e0e8a8b18cf088eb`.',
    );
    expect(decisions).toContain('Ambient application URLs are equality probes only, never URL sources.');
    expect(decisions).toContain('## ADR-016 — Phase 4 delivery and service policy');
    expect(decisions).toContain(
      'Courier costs 1,900 RUB in Moscow and Moscow Region and is free from 150,000 RUB discounted goods total after coupon.',
    );
    expect(decisions).toContain(
      'No-lift carrying is 350 RUB per floor above the first, assembly is 3,900 RUB, and old-furniture removal costs 2,400 RUB.',
    );
    expect(decisions).toContain('evironn-clone/src/cart/cartState.ts:4,77-117,312-331');
    expect(decisions).toContain('evironn-clone/src/checkout/checkoutState.ts:25-86,144-166,465-499,536-586');
    expect(decisions).toContain('## ADR-017 — bounded YooKassa payment initialization recovery');
    expect(decisions).toContain('T = 24 hours');
    expect(decisions).toContain('W = 23 hours');
    expect(decisions).toContain('No provider create call is allowed at or after `createdAt + W`.');
    expect(decisions).toContain('## ADR-018 - durable YooKassa create claim');
    expect(decisions).toContain('A process crash while state is `CLAIMED` is deliberately fail-closed');
    expect(decisions).toContain('No timeout may infer that dispatch did not occur.');
    expect(design).toContain('freshNow < Order.createdAt + 23 hours');
    expect(design).toContain('paymentEverDispatchedAt');
    expect(design).toContain('INDETERMINATE');
  });

  it('executes the exported serializable placement boundary with a forced claim-safe retry', async () => {
    const conflict = Object.assign(new Error('serialization conflict'), { code: 'P2034' });
    const first = { id: 'first' };
    const second = { id: 'second' };
    let attempt = 0;
    const operation = vi.fn(async (transaction: { id: string }) => transaction.id);
    const client = {
      $transaction: vi.fn(async (callback: (transaction: { id: string }) => Promise<string>) => {
        attempt += 1;
        const value = await callback(attempt === 1 ? first : second);
        if (attempt === 1) throw conflict;
        return value;
      }),
    };
    await expect(runSerializableOrderTransaction(client, operation)).resolves.toBe('second');
    expect(operation).toHaveBeenNthCalledWith(1, first);
    expect(operation).toHaveBeenNthCalledWith(2, second);
    expect(client.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  });

  it('executes durable claim/correlation/no-dispatch interleavings with exact transitions and timestamps', async () => {
    const { ensureOnlinePayment } =
      await vi.importActual<typeof import('@/lib/payment-initialization')>('@/lib/payment-initialization');
    const claimAt = new Date('2026-08-16T01:00:00.000Z');
    const dispatchAt = new Date('2026-08-16T01:00:01.000Z');
    const h = paymentHarness();
    let resolveProvider!: (value: unknown) => void;
    const provider = {
      createPayment: vi.fn(() => new Promise((resolve) => (resolveProvider = resolve))),
      getPaymentDetails: vi.fn(async () => null),
    };
    const claimClock = [claimAt, dispatchAt];
    const first = ensureOnlinePayment({
      orderId: 'order-1',
      now: claimAt,
      client: h.client as never,
      provider: provider as never,
      clock: () => claimClock.shift() ?? dispatchAt,
    });
    await vi.waitFor(() => expect(provider.createPayment).toHaveBeenCalledOnce());
    const second = await ensureOnlinePayment({
      orderId: 'order-1',
      now: claimAt,
      client: h.client as never,
      provider: provider as never,
      clock: () => claimAt,
    });
    expect(second).toEqual({ outcome: 'INDETERMINATE' });
    resolveProvider({
      outcome: 'CREATED',
      payment: { id: 'pay-1', status: 'pending', amountRub: 159900, orderNumber: '1042', confirmationUrl: null },
    });
    await expect(first).resolves.toEqual({ outcome: 'CREATED', confirmationUrl: null });
    expect(h.state.order).toMatchObject({
      paymentInitializationState: 'CORRELATED',
      paymentInitializationClaimedAt: null,
      paymentEverDispatchedAt: dispatchAt,
    });
    expect(h.state.stock).toBe(8);

    const noDispatch = paymentHarness();
    let releaseNoDispatch!: (value: unknown) => void;
    const noDispatchProvider = {
      createPayment: vi.fn(() => new Promise((resolve) => (releaseNoDispatch = resolve))),
      getPaymentDetails: vi.fn(async () => null),
    };
    const cancellationWinner = ensureOnlinePayment({
      orderId: 'order-1',
      now: claimAt,
      client: noDispatch.client as never,
      provider: noDispatchProvider as never,
      clock: () => claimAt,
    });
    await vi.waitFor(() => expect(noDispatchProvider.createPayment).toHaveBeenCalledOnce());
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: claimAt,
        client: noDispatch.client as never,
        provider: noDispatchProvider as never,
        clock: () => claimAt,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
    releaseNoDispatch({ outcome: 'NOT_CREATED', dispatched: false });
    await expect(cancellationWinner).resolves.toEqual({ outcome: 'NOT_CREATED' });
    expect(noDispatch.state.order).toMatchObject({
      status: 'CANCELLED',
      paymentInitializationState: 'NOT_CREATED',
      paymentInitializationClaimedAt: null,
      paymentEverDispatchedAt: null,
    });
    expect(noDispatch.state.stock).toBe(10);

    const prior = paymentHarness({
      paymentInitializationState: 'DISPATCHED',
      paymentEverDispatchedAt: new Date('2026-08-16T00:30:00.000Z'),
    });
    const priorEvidence = prior.state.order.paymentEverDispatchedAt;
    const priorProvider = {
      createPayment: vi.fn(async () => ({ outcome: 'NOT_CREATED' as const, dispatched: false })),
      getPaymentDetails: vi.fn(async () => null),
    };
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: claimAt,
        client: prior.client as never,
        provider: priorProvider as never,
        clock: () => claimAt,
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(prior.state.order).toMatchObject({
      paymentInitializationState: 'DISPATCHED',
      paymentInitializationClaimedAt: null,
      paymentEverDispatchedAt: priorEvidence,
    });
    expect(priorProvider.createPayment).toHaveBeenCalledOnce();

    const stuck = paymentHarness({ paymentInitializationState: 'CLAIMED', paymentInitializationClaimedAt: claimAt });
    const stuckProvider = { createPayment: vi.fn(), getPaymentDetails: vi.fn() };
    await expect(
      ensureOnlinePayment({
        orderId: 'order-1',
        now: new Date('2026-08-17T00:00:00.000Z'),
        client: stuck.client as never,
        provider: stuckProvider as never,
        clock: () => new Date('2026-08-17T00:00:00.000Z'),
      }),
    ).resolves.toEqual({ outcome: 'INDETERMINATE' });
    expect(stuckProvider.createPayment).not.toHaveBeenCalled();
  });

  it('executes exact delivery methods, zones, services, and Europe/Moscow slot sentinels', () => {
    expect(CHECKOUT_POLICY).toMatchObject({
      timezone: 'Europe/Moscow',
      courier: { moscow: 1900, 'moscow-region': 1900, freeFrom: 150000, leadDays: 2 },
      services: { carryingPerFloor: 350, assembly: 3900, removal: 2400 },
      horizonDays: 4,
      windows: [
        { id: '10-14', label: '10:00 – 14:00' },
        { id: '14-18', label: '14:00 – 18:00' },
        { id: '18-22', label: '18:00 – 22:00' },
      ],
    });
    expect(CHECKOUT_POLICY.pickupPoints.map(({ id, kind, leadDays }) => ({ id, kind, leadDays }))).toEqual([
      { id: 'pt-dizavod', kind: 'showroom', leadDays: 1 },
      { id: 'pt-danilov', kind: 'pickup-point', leadDays: 2 },
      { id: 'pt-vdnh', kind: 'pickup-point', leadDays: 2 },
    ]);
    expect(
      calculateServiceLines({
        deliveryMethod: 'courier',
        address: { floor: 5, liftType: 'none' },
        services: { carrying: true, assembly: true, removal: true },
      }),
    ).toEqual([
      { id: 'carrying', amount: 1400 },
      { id: 'assembly', amount: 3900 },
      { id: 'removal', amount: 2400 },
    ]);
    expect(
      calculateServiceLines({
        deliveryMethod: 'showroom',
        address: null,
        services: { carrying: true, assembly: true, removal: true },
      }),
    ).toEqual([]);
    const beforeMoscowMidnight = new Date('2026-08-16T20:59:59.999Z');
    const afterMoscowMidnight = new Date('2026-08-16T21:00:00.000Z');
    expect(moscowDateOnly(beforeMoscowMidnight)).toBe('2026-08-16');
    expect(moscowDateOnly(afterMoscowMidnight)).toBe('2026-08-17');
    const beforeSlot = buildDeliverySlots(beforeMoscowMidnight, 'courier')[0];
    const afterSlot = buildDeliverySlots(afterMoscowMidnight, 'courier')[0];
    expect(beforeSlot.date).toBe('2026-08-18');
    expect(afterSlot.date).toBe('2026-08-19');
    expect(fromDeliveryDateSentinel(toDeliveryDateSentinel(afterSlot.date))).toBe(afterSlot.date);
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
    expect(read('app/(shop)/product/[slug]/page.tsx')).toContain('SHOWCASE_PRODUCT_SLUG');
    const namespace = phase4Namespace('integration contract');
    expect(namespace).toMatch(/^phase4-e2e-integration-contract-[a-f0-9]{20}$/);
    const proofOrder = {
      id: 'order-1',
      orderNumber: 1042,
      status: 'PENDING',
      paymentMethod: 'online',
      totalAmount: 100,
      paymentReturnUrl: `/orders/phase4-${namespace}`,
      paymentInitializationState: 'READY',
      paymentInitializationClaimedAt: null,
      paymentEverDispatchedAt: null,
      payment: null,
      items: [{ skuId: 'sku-1', quantity: 1, productSlug: `${namespace}-fixture-product` }],
    };
    expect(
      validatePhase4NeverAttemptedProof(proofOrder, namespace, [
        { orderId: 'order-1', kind: 'NOT_CREATED_BY_CONSTRUCTION', providerRequestIssued: false },
      ]),
    ).toBe(true);
    expect(
      validatePhase4NeverAttemptedProof(proofOrder, namespace, [
        { orderId: 'order-1', kind: 'NOT_CREATED_BY_CONSTRUCTION', providerRequestIssued: true as never },
      ]),
    ).toBe(false);
    const cleanup = read('e2e/phase4-database.ts');
    expect(cleanup).toMatch(/export async function cleanupPhase4Namespace\(\s*namespace: string/s);
    expect(cleanup).toContain("reason: 'PROVIDER_STATE_INDETERMINATE'");
    expect(cleanup).toContain('where: { id: { in: orderIds }, userId: { in: userIds } }');
    expect(cleanup).toContain('where: { id: { in: productIds }, slug: `${namespace}-fixture-product` }');
  });

  it('executes injectable target policy, forbidden identity refusal, namespace ownership, and sanitized readiness', async () => {
    const approvedUrl = 'postgresql://approved.example/phase4';
    const forbiddenUrl = 'postgresql://production.example/phase4';
    const approvedFingerprint = fingerprintDatabaseUrl(approvedUrl);
    const forbiddenFingerprint = fingerprintDatabaseUrl(forbiddenUrl);
    const policy = {
      approvedDevFingerprint: approvedFingerprint,
      forbiddenFingerprints: [forbiddenFingerprint],
    } as const;
    expect(hasCompleteForbiddenFingerprintPolicy(policy)).toBe(true);
    expect(
      hasCompleteForbiddenFingerprintPolicy({ approvedDevFingerprint: approvedFingerprint, forbiddenFingerprints: [] }),
    ).toBe(false);
    expect(
      hasCompleteForbiddenFingerprintPolicy({
        approvedDevFingerprint: approvedFingerprint,
        forbiddenFingerprints: [forbiddenFingerprint, forbiddenFingerprint],
      }),
    ).toBe(false);
    const env = {
      E2E_DATABASE_URL: approvedUrl,
      E2E_DATABASE_URL_UNPOOLED: approvedUrl,
      E2E_DATABASE_ALLOW_WRITES: '1',
      E2E_DATABASE_TARGET_FINGERPRINT: approvedFingerprint,
      AUTH_SECRET: 'set',
      AUTH_TRUST_HOST: '1',
    };
    expect(resolveE2eDatabaseEnvironment(env, policy)).toEqual({
      POSTGRES_URL: approvedUrl,
      POSTGRES_URL_NON_POOLING: approvedUrl,
      RESEND_API_KEY: '',
    });
    expect(() => resolveE2eDatabaseEnvironment({ ...env, DATABASE_URL: forbiddenUrl }, policy)).toThrow(
      'forbidden ambient',
    );
    const migrations = EXPECTED_PHASE4_MIGRATIONS.map(({ name, checksum }) => ({
      migration_name: name,
      checksum,
      finished_at: '2026-08-18T00:00:00.000Z',
      rolled_back_at: null,
    }));
    const report = await runPhase4DatabaseReadiness(env, 'completion', {
      targetPolicy: policy,
      resolveEnvironment: () => ({
        POSTGRES_URL: approvedUrl,
        POSTGRES_URL_NON_POOLING: approvedUrl,
        RESEND_API_KEY: '',
      }),
      query: async () => ({ databaseName: 'phase4', migrations }),
    });
    expect(report).toMatchObject({
      ok: true,
      exitCode: 0,
      errorCategory: 'NONE',
      targetFingerprint: approvedFingerprint,
      migrationCount: EXPECTED_PHASE4_MIGRATIONS.length,
      noPendingMigrations: true,
    });
    expect(Object.keys(report).sort()).toEqual([
      'checks',
      'errorCategory',
      'exitCode',
      'migrationCount',
      'migrationNames',
      'noPendingMigrations',
      'ok',
      'targetFingerprint',
    ]);
    expect(report.checks).toEqual(
      expect.objectContaining({
        explicitE2eUrl: true,
        writeOptIn: true,
        targetFingerprintMatches: true,
        forbiddenTargetsAbsent: true,
        readOnlyConnectivity: true,
        currentDatabaseMatches: true,
        allPhase4MigrationsApplied: true,
        authReadiness: true,
        codReadiness: true,
        uniqueFixtureCapability: true,
      }),
    );
    expect(JSON.stringify(report)).not.toContain(approvedUrl);
  });

  it('binds review eligibility to owner, product line, payment success, delivery, and duplicate exclusion', () => {
    expect(purchasedOrderWhere('user-1', 'product-1')).toEqual({
      userId: 'user-1',
      status: { not: 'CANCELLED' },
      items: {
        some: {
          OR: [
            { canonicalSku: { productId: 'product-1' } },
            { productVariant: { colorway: { productId: 'product-1' } } },
          ],
        },
      },
      OR: [
        { paymentMethod: 'cod', status: 'DELIVERED' },
        { paymentMethod: 'online', payment: { is: { status: 'succeeded' } } },
      ],
    });
    expect(read('app/actions/review.ts')).toContain('canReview');
    expect(read('app/actions/review.ts')).toContain('submitReview');
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

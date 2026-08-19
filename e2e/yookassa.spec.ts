import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { expect, test, type Page } from '@playwright/test';

import {
  ensureOnlinePayment,
  PAYMENT_CREATE_RETRY_WINDOW_MS,
  type PaymentInitializationClient,
} from '@/lib/payment-initialization';
import { cancelPayment, createPaymentAttempt, getPaymentDetails } from '@/lib/yookassa';
import { reconcilePaymentStatus } from '@/lib/payment-sync';

import {
  cleanupPhase4Namespace,
  createPhase4BlockedPaymentFixture,
  createPhase4ClaimablePaymentFixture,
  createPhase4CheckoutFixture,
  disconnectPhase4Database,
  getPhase4DatabaseForTests,
  phase4Namespace,
  readOwnedOrder,
  seedOwnedCartLine,
  validatePhase4ClaimablePaymentProbe,
} from './phase4-database';
import { registerAndVerify, signIn } from './helpers';

const hasExplicitDatabase = Boolean(
  process.env.E2E_DATABASE_URL &&
  process.env.E2E_DATABASE_ALLOW_WRITES === '1' &&
  process.env.E2E_DATABASE_TARGET_FINGERPRINT,
);
const hasSandboxCredentials = Boolean(
  process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY && process.env.YOOKASSA_MODE === 'sandbox',
);
const hasAuthPrerequisites = Boolean(process.env.AUTH_SECRET && process.env.AUTH_TRUST_HOST);
const hasSiteUrl = Boolean(process.env.NEXT_PUBLIC_SITE_URL);
const onlineGuarded =
  hasExplicitDatabase && hasSandboxCredentials && hasAuthPrerequisites && hasSiteUrl ? test : test.skip;
const dbGuarded = hasExplicitDatabase ? test : test.skip;
const execFileAsync = promisify(execFile);
const AMBIENT_DATABASE_VARIABLES = new Set([
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
]);

async function assertRealPaymentReadiness() {
  const readinessEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !AMBIENT_DATABASE_VARIABLES.has(name)),
  );
  let stdout = '';
  try {
    const result = await execFileAsync(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['tsx', 'e2e/database-readiness.ts', '--mode=completion'],
      {
        env: readinessEnvironment,
        windowsHide: true,
        shell: process.platform === 'win32',
        maxBuffer: 1024 * 1024,
      },
    );
    stdout = result.stdout;
  } catch (error) {
    if (error && typeof error === 'object' && 'stdout' in error && typeof error.stdout === 'string') {
      stdout = error.stdout;
    }
  }
  let readiness: { ok: boolean; checks: Record<string, boolean> };
  try {
    readiness = JSON.parse(stdout.trim()) as { ok: boolean; checks: Record<string, boolean> };
  } catch {
    throw new Error('Real YooKassa readiness wrapper returned no sanitized report');
  }
  expect(readiness.ok, 'Real YooKassa flow requires completion readiness').toBe(true);
  for (const migrationName of [
    '20260816_phase4_delivery_snapshots',
    '20260816_phase4_payment_replay',
    '20260817_phase4_payment_claim',
  ]) {
    expect(readiness.checks[`${migrationName}Applied`], `${migrationName} must be applied`).toBe(true);
  }
}

async function isSandboxProviderReachable(): Promise<boolean> {
  try {
    await getPaymentDetails('00000000-0000-0000-0000-000000000000');
    return true;
  } catch {
    return false;
  }
}

async function fillCheckout(page: Page) {
  await page.getByLabel('Имя и фамилия').fill('Phase 4 Payment Customer');
  await page.getByLabel('Телефон').fill('+79990000000');
  await page.getByRole('textbox', { name: 'Адрес', exact: true }).fill('Москва, улица Фазовая, 1');
  await page.getByRole('textbox', { name: 'Город', exact: true }).fill('Москва');
  await page.getByRole('radiogroup', { name: 'Дата получения' }).getByRole('radio').first().click();
}

async function waitForProviderCancellation(paymentId: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const details = await getPaymentDetails(paymentId);
    if (details?.status === 'canceled') return details;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('YooKassa sandbox cancellation did not reach terminal state');
}

dbGuarded('COD regression remains real production payment method', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  try {
    const fixture = await createPhase4CheckoutFixture(namespace);
    await registerAndVerify(page, fixture.email);
    await seedOwnedCartLine(fixture.email, fixture.skuId);
    await page.goto('/checkout');
    await fillCheckout(page);
    await page.getByRole('radio', { name: /При получении/ }).click();
    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.getByText('Оплата при получении')).toBeVisible();
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

onlineGuarded(
  'real YooKassa sandbox payment proves claim race, continuation, cancellation, and cleanup',
  async ({ page }, testInfo) => {
    const namespace = phase4Namespace(testInfo.title);
    let cleanupAsserted = false;
    let fixtureCreated = false;
    try {
      if (!(await isSandboxProviderReachable())) {
        test.skip(true, 'YooKassa sandbox credentials cannot access the provider');
        return;
      }
      await assertRealPaymentReadiness();
      const fixture = await createPhase4ClaimablePaymentFixture(namespace);
      fixtureCreated = true;
      const claimable = await readOwnedOrder(fixture.email, fixture.orderNumber);
      expect(claimable.id).toBe(fixture.orderId);
      expect(validatePhase4ClaimablePaymentProbe(claimable)).toBe(true);
      expect(claimable.paymentId).toBeNull();
      expect(claimable.paymentInitializationState).toBe('READY');
      expect(claimable.paymentInitializationClaimedAt).toBeNull();
      expect(claimable.paymentEverDispatchedAt).toBeNull();
      const initialStock = claimable.stock;
      const preWindowNow = new Date(Date.parse(claimable.createdAt) + PAYMENT_CREATE_RETRY_WINDOW_MS - 1_000);
      expect(preWindowNow.getTime()).toBeLessThan(Date.parse(claimable.createdAt) + PAYMENT_CREATE_RETRY_WINDOW_MS);
      const realProvider = { createPayment: createPaymentAttempt, getPaymentDetails };
      const realClient = getPhase4DatabaseForTests() as unknown as PaymentInitializationClient;
      const claimResults = await Promise.all([
        ensureOnlinePayment({ orderId: claimable.id, now: preWindowNow, client: realClient, provider: realProvider }),
        ensureOnlinePayment({ orderId: claimable.id, now: preWindowNow, client: realClient, provider: realProvider }),
      ]);
      expect(claimResults).toHaveLength(2);
      const winnerCount = claimResults.filter((result) => result.outcome === 'CREATED').length;
      expect(winnerCount).toBe(1);
      expect(claimResults.some((result) => result.outcome === 'INDETERMINATE')).toBe(true);

      const correlated = await readOwnedOrder(fixture.email, fixture.orderNumber);
      expect(correlated.paymentId).not.toBeNull();
      expect(correlated.paymentInitializationState).toBe('CORRELATED');
      expect(correlated.paymentInitializationClaimedAt).toBeNull();
      expect(correlated.paymentEverDispatchedAt).not.toBeNull();
      const providerBefore = await getPaymentDetails(correlated.paymentId!);
      expect(providerBefore).not.toBeNull();
      expect(providerBefore?.id).toBe(correlated.paymentId);
      expect(providerBefore?.amountRub).toBe(correlated.totalAmount);
      expect(providerBefore?.orderNumber).toBe(String(correlated.orderNumber));
      const recovery = await ensureOnlinePayment({
        orderId: correlated.id,
        now: preWindowNow,
        client: realClient,
        provider: realProvider,
      });
      expect(recovery).toMatchObject({ outcome: 'CREATED', confirmationUrl: providerBefore?.confirmationUrl });
      const recovered = await readOwnedOrder(fixture.email, fixture.orderNumber);
      expect(recovered).toMatchObject({
        paymentInitializationState: 'CORRELATED',
        paymentInitializationClaimedAt: null,
        paymentEverDispatchedAt: correlated.paymentEverDispatchedAt,
        paymentId: correlated.paymentId,
      });
      expect(recovered.paymentEverDispatchedAt).toBe(correlated.paymentEverDispatchedAt);
      expect(new Set([correlated.paymentId, recovered.paymentId])).toHaveSize(1);
      const providerAfter = await getPaymentDetails(recovered.paymentId!);
      expect(providerAfter?.id).toBe(providerBefore?.id);
      expect(providerAfter?.orderNumber).toBe(providerBefore?.orderNumber);

      await signIn(page, fixture.email, fixture.password);
      await page.goto(`/orders/${fixture.orderNumber}`);
      const continuation = page.getByRole('link', { name: 'Продолжить оплату' });
      await expect(continuation).toBeVisible();
      await continuation.click();
      await page.waitForURL(/yoo(money|kassa)\.ru|3ds|yookassa/i, { timeout: 30_000 });

      await cancelPayment(correlated.paymentId!);
      const canceled = await waitForProviderCancellation(correlated.paymentId!);
      expect(canceled.id).toBe(correlated.paymentId);
      expect(canceled.amountRub).toBe(correlated.totalAmount);
      expect(canceled.orderNumber).toBe(String(correlated.orderNumber));
      expect(canceled.status).toBe('canceled');
      const reconciliation = await reconcilePaymentStatus({
        paymentId: correlated.paymentId!,
        remoteStatus: canceled.status,
        source: 'webhook',
      });
      expect(reconciliation.transition).toBe('canceled');
      await page.goto(`/orders/${correlated.orderNumber}`);
      await expect(page.getByText('Отменён', { exact: true })).toBeVisible();
      const final = await readOwnedOrder(fixture.email, correlated.orderNumber);
      expect(final).toMatchObject({
        status: 'CANCELLED',
        paymentStatus: 'canceled',
        paymentId: correlated.paymentId,
        stock: initialStock,
      });
      const cleanupResult = await cleanupPhase4Namespace(namespace);
      expect(cleanupResult).toMatchObject({
        ok: true,
        namespace,
        deleted: true,
        orderNumbers: [correlated.orderNumber],
      });
      cleanupAsserted = true;
    } finally {
      if (!cleanupAsserted) {
        const cleanupResult = await cleanupPhase4Namespace(namespace);
        expect(cleanupResult).toMatchObject({ ok: true, namespace, deleted: fixtureCreated });
      }
    }
  },
);

dbGuarded('blocked payment shows lookup-only state without provider substitute', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  let proof;
  let blockedOrderNumber: number | undefined;
  try {
    const fixture = await createPhase4BlockedPaymentFixture(namespace);
    proof = fixture.neverAttemptedProof;
    blockedOrderNumber = fixture.orderNumber;
    await signIn(page, fixture.email, fixture.password);
    await page.goto(`/orders/${fixture.orderNumber}`);
    await expect(page.getByText('Платёж требует проверки')).toBeVisible();
    await expect(
      page.getByText(
        `Заказ №${fixture.orderNumber} сохранён. Повторное создание платежа отключено; статус проверяется.`,
        {
          exact: true,
        },
      ),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: `EV-${fixture.orderNumber}` })).toBeVisible();
    await expect(page.getByText('Продолжить оплату')).toHaveCount(0);
    await expect(page.getByText('Проверить статус платежа')).toBeVisible();
    await expect(page.getByText('Повторить создание платежа')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Отменить заказ' })).toHaveCount(0);
  } finally {
    const cleanupResult = await cleanupPhase4Namespace(namespace, proof ? [proof] : []);
    expect(cleanupResult).toMatchObject({
      ok: true,
      namespace,
      deleted: Boolean(blockedOrderNumber),
      orderNumbers: blockedOrderNumber ? [blockedOrderNumber] : [],
    });
  }
});

test.afterAll(async () => {
  if (hasExplicitDatabase) await disconnectPhase4Database();
});

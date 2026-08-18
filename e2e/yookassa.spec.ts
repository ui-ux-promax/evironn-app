import { expect, test, type Page } from '@playwright/test';

import { cancelPayment, getPaymentDetails } from '@/lib/yookassa';
import { reconcilePaymentStatus } from '@/lib/payment-sync';

import {
  cleanupPhase4Namespace,
  createPhase4BlockedPaymentFixture,
  createPhase4CheckoutFixture,
  disconnectPhase4Database,
  phase4Namespace,
  readLatestOwnedOrder,
  seedOwnedCartLine,
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
const onlineGuarded = hasExplicitDatabase && hasSandboxCredentials ? test : test.skip;
const dbGuarded = hasExplicitDatabase ? test : test.skip;

async function fillCheckout(page: Page) {
  await page.getByLabel('Имя и фамилия').fill('Phase 4 Payment Customer');
  await page.getByLabel('Телефон').fill('+79990000000');
  await page.getByLabel('Адрес').fill('Москва, улица Фазовая, 1');
  await page.getByLabel('Город').fill('Москва');
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
  'real YooKassa sandbox payment proves claim, continuation, cancellation, and cleanup',
  async ({ page }, testInfo) => {
    const namespace = phase4Namespace(testInfo.title);
    let cleanupAsserted = false;
    try {
      const fixture = await createPhase4CheckoutFixture(namespace);
      await registerAndVerify(page, fixture.email);
      await seedOwnedCartLine(fixture.email, fixture.skuId);
      await page.goto('/checkout');
      await fillCheckout(page);
      await page.getByRole('radio', { name: /Картой онлайн/ }).click();
      await page
        .getByRole('button', { name: /Оформить заказ/ })
        .last()
        .click();
      await page.waitForURL(/yoo(money|kassa)\.ru|3ds|yookassa/i, { timeout: 30_000 });
      await expect(page).not.toHaveURL(/\/checkout$/);
      const created = await readLatestOwnedOrder(fixture.email);
      expect(created.paymentInitializationState).toBe('CORRELATED');
      expect(created.paymentInitializationClaimedAt).toBeNull();
      expect(created.paymentEverDispatchedAt).not.toBeNull();
      expect(created.paymentId).not.toBeNull();
      expect(created.paymentStatus).toMatch(/pending|waiting_for_capture/);
      expect(Date.now() - Date.parse(created.createdAt)).toBeLessThan(23 * 60 * 60 * 1000);

      await page.goto(`/orders/${created.orderNumber}`);
      const continuation = page.getByRole('link', { name: 'Продолжить оплату' });
      await expect(continuation).toBeVisible();
      await continuation.click();
      await page.waitForURL(/yoo(money|kassa)\.ru|3ds|yookassa/i, { timeout: 30_000 });

      await cancelPayment(created.paymentId!);
      const canceled = await waitForProviderCancellation(created.paymentId!);
      expect(canceled.id).toBe(created.paymentId);
      expect(canceled.amountRub).toBe(created.totalAmount);
      expect(canceled.orderNumber).toBe(String(created.orderNumber));
      expect(canceled.status).toBe('canceled');
      const reconciliation = await reconcilePaymentStatus({
        paymentId: created.paymentId!,
        remoteStatus: canceled.status,
        source: 'webhook',
      });
      expect(reconciliation.transition).toBe('canceled');
      await page.goto(`/orders/${created.orderNumber}`);
      await expect(page.getByText('Отменён')).toBeVisible();
      const final = await readLatestOwnedOrder(fixture.email);
      expect(final).toMatchObject({ status: 'CANCELLED', paymentStatus: 'canceled', stock: 20 });
      const cleanupResult = await cleanupPhase4Namespace(namespace);
      expect(cleanupResult).toMatchObject({ ok: true, namespace });
      cleanupAsserted = true;
    } finally {
      if (!cleanupAsserted) {
        const cleanupResult = await cleanupPhase4Namespace(namespace);
        expect(cleanupResult).toMatchObject({ ok: true, namespace });
      }
    }
  },
);

dbGuarded('blocked payment shows lookup-only state without provider substitute', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  let proof;
  try {
    const fixture = await createPhase4BlockedPaymentFixture(namespace);
    proof = fixture.neverAttemptedProof;
    await signIn(page, fixture.email, fixture.password);
    await page.goto(`/orders/${fixture.orderNumber}`);
    await expect(page.getByText('Платёж требует проверки')).toBeVisible();
    await expect(page.getByText(String(fixture.orderNumber))).toBeVisible();
    await expect(page.getByText('Продолжить оплату')).toHaveCount(0);
    await expect(page.getByText('Проверить статус платежа')).toBeVisible();
    await expect(page.getByText('Повторить создание платежа')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Отменить заказ' })).toHaveCount(0);
  } finally {
    await cleanupPhase4Namespace(namespace, proof ? [proof] : []);
  }
});

test.afterAll(async () => {
  if (hasExplicitDatabase) await disconnectPhase4Database();
});

import { expect, test, type Page } from '@playwright/test';

import {
  cleanupPhase4Namespace,
  createPhase4BlockedPaymentFixture,
  createPhase4CheckoutFixture,
  disconnectPhase4Database,
  phase4Namespace,
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

onlineGuarded('real YooKassa sandbox payment uses external redirect only', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
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
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

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

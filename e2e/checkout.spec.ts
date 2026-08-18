import { expect, test, type Page } from '@playwright/test';

import {
  cleanupPhase4Namespace,
  createPhase4CheckoutFixture,
  disconnectPhase4Database,
  phase4Namespace,
  readOwnedOrder,
  seedOwnedCartLine,
} from './phase4-database';
import { registerAndVerify } from './helpers';

const hasExplicitDatabase = Boolean(
  process.env.E2E_DATABASE_URL &&
  process.env.E2E_DATABASE_ALLOW_WRITES === '1' &&
  process.env.E2E_DATABASE_TARGET_FINGERPRINT,
);
const guarded = hasExplicitDatabase ? test : test.skip;

async function fillContact(page: Page, name = 'Phase 4 Customer') {
  await page.getByLabel('Имя и фамилия').fill(name);
  await page.getByLabel('Телефон').fill('+79990000000');
}

async function openCheckout(page: Page, namespace: string, delivery = /Курьер/) {
  const fixture = await createPhase4CheckoutFixture(namespace);
  await registerAndVerify(page, fixture.email);
  await seedOwnedCartLine(fixture.email, fixture.skuId);
  await page.goto('/cart');
  await page.goto('/checkout');
  await fillContact(page);
  await page.getByRole('radio', { name: delivery }).click();
  return fixture;
}

async function chooseFirstSlot(page: Page) {
  await page.getByRole('radiogroup', { name: 'Дата получения' }).getByRole('radio').first().click();
}

async function chooseCod(page: Page) {
  await page.getByRole('radio', { name: /При получении/ }).click();
}

guarded('signed-out /checkout redirects to login with safe callback', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fcheckout$/);
});

guarded('courier COD in moscow-region persists server quote and empties cart', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  try {
    const fixture = await openCheckout(page, namespace);
    await page.getByRole('radio', { name: /Московская область/ }).click();
    await page.getByLabel('Адрес').fill('Московская область, улица Фазовая, 1');
    await page.getByLabel('Город').fill('Химки');
    await chooseFirstSlot(page);
    await chooseCod(page);
    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.getByText('Московская область')).toBeVisible();
    const orderNumber = Number(new URL(page.url()).pathname.split('/').pop());
    expect((await readOwnedOrder(fixture.email, orderNumber)).skuId).toBe(fixture.skuId);
    await page.goto('/cart');
    await expect(page.getByText(/Корзина пуста|Пусто/)).toBeVisible();
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

guarded('showroom COD persists approved showroom snapshot', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  try {
    const fixture = await openCheckout(page, namespace, /Шоурум/);
    await page.getByRole('radio', { name: /Шоурум Evironn/ }).click();
    await chooseFirstSlot(page);
    await chooseCod(page);
    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.getByText('Шоурум Evironn')).toBeVisible();
    const orderNumber = Number(new URL(page.url()).pathname.split('/').pop());
    expect((await readOwnedOrder(fixture.email, orderNumber)).paymentMethod).toBe('cod');
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

guarded('pickup-point COD uses server-owned pickup address', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  try {
    const fixture = await openCheckout(page, namespace, /Пункт выдачи/);
    await page.getByRole('radio', { name: /Даниловский/ }).click();
    await chooseFirstSlot(page);
    await chooseCod(page);
    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.getByText('Дубининская, 71')).toBeVisible();
    const orderNumber = Number(new URL(page.url()).pathname.split('/').pop());
    expect((await readOwnedOrder(fixture.email, orderNumber)).paymentMethod).toBe('cod');
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

guarded('COD cancellation restores owned stock exactly once', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  try {
    const fixture = await openCheckout(page, namespace);
    await page.getByLabel('Адрес').fill('Москва, улица Фазовая, 1');
    await page.getByLabel('Город').fill('Москва');
    await chooseFirstSlot(page);
    await chooseCod(page);
    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    const orderNumber = Number(new URL(page.url()).pathname.split('/').pop());
    const before = await readOwnedOrder(fixture.email, orderNumber);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Отменить заказ' }).click();
    await expect(page.getByText('Отменён')).toBeVisible();
    const after = await readOwnedOrder(fixture.email, orderNumber);
    expect(after.stock).toBe(before.stock + 1);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Отменить заказ' }).click();
    expect((await readOwnedOrder(fixture.email, orderNumber)).stock).toBe(after.stock);
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

test.afterAll(async () => {
  if (hasExplicitDatabase) await disconnectPhase4Database();
});

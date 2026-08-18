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

async function applyCoupon(page: Page, code: string) {
  await page.getByLabel('Промокод').fill(code);
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page.getByRole('status')).toContainText(`${code} принят`);
  await expect(page.getByText(/Сервер подтвердил итоговую стоимость/)).toBeVisible();
}

async function expectQuoteAmount(page: Page, amount: number) {
  const formatted = new Intl.NumberFormat('ru-RU').format(amount).replace(/\u00a0/g, '\\s*');
  await expect(page.getByRole('complementary', { name: 'Сводка заказа' })).toContainText(new RegExp(formatted));
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
    await applyCoupon(page, fixture.couponCode);
    await chooseCod(page);
    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.getByText('Московская область')).toBeVisible();
    const orderNumber = Number(new URL(page.url()).pathname.split('/').pop());
    const probe = await readOwnedOrder(fixture.email, orderNumber);
    const discount = Math.floor(fixture.unitPrice * 0.1);
    expect(probe).toMatchObject({
      skuId: fixture.skuId,
      itemsTotal: fixture.unitPrice,
      discountAmount: discount,
      shippingAmount: 1900,
      totalAmount: fixture.unitPrice - discount + 1900,
      couponCode: fixture.couponCode,
      shippingMethod: 'courier',
      deliveryZone: 'moscow-region',
      pickupPointId: null,
      pickupPointName: null,
      pickupPointAddress: null,
      serviceAmount: 0,
    });
    await expectQuoteAmount(page, fixture.unitPrice - discount + 1900);
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
    expect(await readOwnedOrder(fixture.email, orderNumber)).toMatchObject({
      paymentMethod: 'cod',
      shippingMethod: 'pickup',
      deliveryZone: null,
      pickupPointId: 'pt-dizavod',
      pickupPointName: 'Шоурум Evironn',
      pickupPointAddress: 'Большая Новодмитровская, 36',
      shippingAmount: 0,
      serviceAmount: 0,
      totalAmount: fixture.unitPrice,
    });
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
    expect(await readOwnedOrder(fixture.email, orderNumber)).toMatchObject({
      paymentMethod: 'cod',
      shippingMethod: 'pickup',
      deliveryZone: null,
      pickupPointId: 'pt-danilov',
      pickupPointName: 'Пункт «Даниловский»',
      pickupPointAddress: 'Дубининская, 71',
      shippingAmount: 0,
      serviceAmount: 0,
      totalAmount: fixture.unitPrice,
    });
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
    await page.getByRole('button', { name: 'Отменить заказ' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Отменить заказ?' })).toBeVisible();
    await expect(dialog).toContainText('товары вернутся в наличие');
    await dialog.getByRole('button', { name: 'Отменить заказ' }).click();
    await expect(page.getByText('Отменён')).toBeVisible();
    const after = await readOwnedOrder(fixture.email, orderNumber);
    expect(after.stock).toBe(before.stock + 1);
    await page.reload();
    await expect(page.getByText('Отменён')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Отменить заказ' })).toHaveCount(0);
    expect((await readOwnedOrder(fixture.email, orderNumber)).stock).toBe(after.stock);
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

test.afterAll(async () => {
  if (hasExplicitDatabase) await disconnectPhase4Database();
});

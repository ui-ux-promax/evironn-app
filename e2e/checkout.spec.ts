import { expect, test, type Page, type Request } from '@playwright/test';

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

function parseMoney(value: string): number {
  if (value.includes('бесплатно')) return 0;
  return Number(value.replace(/\D/g, ''));
}

async function summaryValue(page: Page, label: string, partial = false): Promise<number> {
  const summary = page.getByRole('complementary', { name: 'Сводка заказа' });
  const row = summary.locator('dt').filter({ hasText: label }).first().locator('..');
  if (!partial) await expect(row.locator('dt')).toHaveText(label);
  return parseMoney(await row.locator('dd').innerText());
}

async function captureBrowserQuote(page: Page, couponCode: string) {
  const summary = page.getByRole('complementary', { name: 'Сводка заказа' });
  await expect(summary).toContainText(couponCode);
  await expect(page.getByText(/Сервер подтвердил итоговую стоимость/)).toBeVisible();
  return {
    couponDiscount: await summaryValue(page, 'Промокод', true),
    shippingAmount: await summaryValue(page, 'Доставка'),
    serviceAmount: await summaryValue(page, 'Сборка'),
    totalAmount: await summaryValue(page, 'Итого'),
  };
}

async function captureSelectedSlot(page: Page) {
  const selected = page
    .getByRole('radiogroup', { name: 'Дата получения' })
    .locator('button[role="radio"][aria-checked="true"]');
  const [date, windowLabel] = (await selected.innerText()).split(/\r?\n/);
  const [from, to] = windowLabel.split(' – ');
  return { date, windowId: `${from.slice(0, 2)}-${to.slice(0, 2)}` };
}

async function replaySupportedServerAction(page: Page, request: Request) {
  const requestHeaders = request.headers();
  const headers = Object.fromEntries(
    Object.entries(requestHeaders).filter(([name]) =>
      ['accept', 'content-type', 'next-action', 'next-router-state-tree', 'next-url', 'rsc'].includes(name),
    ),
  );
  const response = await page.request.fetch(request.url(), {
    method: request.method(),
    headers,
    data: request.postDataBuffer() ?? undefined,
  });
  expect(response.status()).toBe(200);
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
    await page.getByLabel('Сборка на месте').check();
    await expect(page.getByLabel('Сборка на месте')).toBeChecked();
    await chooseCod(page);
    const selectedSlot = await captureSelectedSlot(page);
    const browserQuote = await captureBrowserQuote(page, fixture.couponCode);
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
      shippingAmount: browserQuote.shippingAmount,
      totalAmount: browserQuote.totalAmount,
      couponCode: fixture.couponCode,
      shippingMethod: 'courier',
      deliveryZone: 'moscow-region',
      pickupPointId: null,
      pickupPointName: null,
      pickupPointAddress: null,
      deliveryDate: selectedSlot.date,
      deliveryWindow: selectedSlot.windowId,
      serviceAmount: browserQuote.serviceAmount,
      serviceDetails: [{ id: 'assembly', label: 'Сборка', amount: 3900 }],
    });
    expect(browserQuote).toEqual({
      couponDiscount: discount,
      shippingAmount: 1900,
      serviceAmount: 3900,
      totalAmount: fixture.unitPrice - discount + 1900 + 3900,
    });
    expect({
      deliveryDate: probe.deliveryDate,
      deliveryWindow: probe.deliveryWindow,
      serviceDetails: probe.serviceDetails,
      discountAmount: probe.discountAmount,
      shippingAmount: probe.shippingAmount,
      serviceAmount: probe.serviceAmount,
      totalAmount: probe.totalAmount,
    }).toEqual({
      deliveryDate: selectedSlot.date,
      deliveryWindow: selectedSlot.windowId,
      serviceDetails: [{ id: 'assembly', label: 'Сборка', amount: 3900 }],
      discountAmount: browserQuote.couponDiscount,
      shippingAmount: browserQuote.shippingAmount,
      serviceAmount: browserQuote.serviceAmount,
      totalAmount: browserQuote.totalAmount,
    });
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
    const showroomSlot = await captureSelectedSlot(page);
    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.getByText('Шоурум Evironn')).toBeVisible();
    const orderNumber = Number(new URL(page.url()).pathname.split('/').pop());
    const showroomOrder = await readOwnedOrder(fixture.email, orderNumber);
    expect({
      paymentMethod: 'cod',
      shippingMethod: 'pickup',
      deliveryZone: null,
      deliveryDate: showroomOrder.deliveryDate,
      deliveryWindow: showroomOrder.deliveryWindow,
      pickupPointId: 'pt-dizavod',
      pickupPointName: 'Шоурум Evironn',
      pickupPointAddress: 'Большая Новодмитровская, 36',
      shippingAmount: 0,
      serviceDetails: showroomOrder.serviceDetails,
      serviceAmount: 0,
      totalAmount: fixture.unitPrice,
    }).toEqual({
      paymentMethod: 'cod',
      shippingMethod: 'pickup',
      deliveryZone: null,
      deliveryDate: showroomSlot.date,
      deliveryWindow: showroomSlot.windowId,
      pickupPointId: 'pt-dizavod',
      pickupPointName: 'Шоурум Evironn',
      pickupPointAddress: 'Большая Новодмитровская, 36',
      shippingAmount: 0,
      serviceDetails: [],
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
    const pickupSlot = await captureSelectedSlot(page);
    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.getByText('Дубининская, 71')).toBeVisible();
    const orderNumber = Number(new URL(page.url()).pathname.split('/').pop());
    const pickupOrder = await readOwnedOrder(fixture.email, orderNumber);
    expect({
      paymentMethod: 'cod',
      shippingMethod: 'pickup',
      deliveryZone: null,
      deliveryDate: pickupOrder.deliveryDate,
      deliveryWindow: pickupOrder.deliveryWindow,
      pickupPointId: 'pt-danilov',
      pickupPointName: 'Пункт «Даниловский»',
      pickupPointAddress: 'Дубининская, 71',
      shippingAmount: 0,
      serviceDetails: pickupOrder.serviceDetails,
      serviceAmount: 0,
      totalAmount: fixture.unitPrice,
    }).toEqual({
      paymentMethod: 'cod',
      shippingMethod: 'pickup',
      deliveryZone: null,
      deliveryDate: pickupSlot.date,
      deliveryWindow: pickupSlot.windowId,
      pickupPointId: 'pt-danilov',
      pickupPointName: 'Пункт «Даниловский»',
      pickupPointAddress: 'Дубининская, 71',
      shippingAmount: 0,
      serviceDetails: [],
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
    const cancellationRequestPromise = page.waitForRequest(
      (request) => request.method() === 'POST' && Boolean(request.headers()['next-action']),
    );
    await dialog.getByRole('button', { name: 'Отменить заказ' }).click();
    const cancellationRequest = await cancellationRequestPromise;
    await expect(page.getByText('Отменён')).toBeVisible();
    const after = await readOwnedOrder(fixture.email, orderNumber);
    expect(after.stock).toBe(before.stock + 1);
    await replaySupportedServerAction(page, cancellationRequest);
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

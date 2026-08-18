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
  return { date, windowLabel };
}

function normalizeVisibleDeliveryDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Unexpected visible delivery date');
  const normalized = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(normalized.getTime())) throw new Error('Unexpected visible delivery date');
  return normalized.toISOString();
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
    const courierOrder = await readOwnedOrder(fixture.email, orderNumber);
    const discount = Math.floor(fixture.unitPrice * 0.1);
    expect({
      paymentMethod: courierOrder.paymentMethod,
      skuId: courierOrder.skuId,
      itemsTotal: courierOrder.itemsTotal,
      discountAmount: courierOrder.discountAmount,
      shippingAmount: courierOrder.shippingAmount,
      totalAmount: courierOrder.totalAmount,
      couponCode: courierOrder.couponCode,
      shippingMethod: courierOrder.shippingMethod,
      deliveryZone: courierOrder.deliveryZone,
      pickupPointId: courierOrder.pickupPointId,
      pickupPointName: courierOrder.pickupPointName,
      pickupPointAddress: courierOrder.pickupPointAddress,
      deliveryDate: courierOrder.deliveryDate,
      deliveryWindow: courierOrder.deliveryWindow,
      serviceAmount: courierOrder.serviceAmount,
      serviceDetails: courierOrder.serviceDetails,
    }).toEqual({
      paymentMethod: 'cod',
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
      deliveryDate: normalizeVisibleDeliveryDate(selectedSlot.date),
      deliveryWindow: selectedSlot.windowLabel,
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
      deliveryDate: courierOrder.deliveryDate,
      deliveryWindow: courierOrder.deliveryWindow,
      serviceDetails: courierOrder.serviceDetails,
      discountAmount: courierOrder.discountAmount,
      shippingAmount: courierOrder.shippingAmount,
      serviceAmount: courierOrder.serviceAmount,
      totalAmount: courierOrder.totalAmount,
    }).toEqual({
      deliveryDate: normalizeVisibleDeliveryDate(selectedSlot.date),
      deliveryWindow: selectedSlot.windowLabel,
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
      paymentMethod: showroomOrder.paymentMethod,
      itemsTotal: showroomOrder.itemsTotal,
      shippingMethod: showroomOrder.shippingMethod,
      deliveryZone: showroomOrder.deliveryZone,
      deliveryDate: showroomOrder.deliveryDate,
      deliveryWindow: showroomOrder.deliveryWindow,
      pickupPointId: showroomOrder.pickupPointId,
      pickupPointName: showroomOrder.pickupPointName,
      pickupPointAddress: showroomOrder.pickupPointAddress,
      couponCode: showroomOrder.couponCode,
      discountAmount: showroomOrder.discountAmount,
      shippingAmount: showroomOrder.shippingAmount,
      serviceDetails: showroomOrder.serviceDetails,
      serviceAmount: showroomOrder.serviceAmount,
      totalAmount: showroomOrder.totalAmount,
    }).toEqual({
      paymentMethod: 'cod',
      itemsTotal: fixture.unitPrice,
      shippingMethod: 'pickup',
      deliveryZone: null,
      deliveryDate: normalizeVisibleDeliveryDate(showroomSlot.date),
      deliveryWindow: showroomSlot.windowLabel,
      pickupPointId: 'pt-dizavod',
      pickupPointName: 'Шоурум Evironn',
      pickupPointAddress: 'Большая Новодмитровская, 36',
      couponCode: null,
      discountAmount: 0,
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
      paymentMethod: pickupOrder.paymentMethod,
      itemsTotal: pickupOrder.itemsTotal,
      shippingMethod: pickupOrder.shippingMethod,
      deliveryZone: pickupOrder.deliveryZone,
      deliveryDate: pickupOrder.deliveryDate,
      deliveryWindow: pickupOrder.deliveryWindow,
      pickupPointId: pickupOrder.pickupPointId,
      pickupPointName: pickupOrder.pickupPointName,
      pickupPointAddress: pickupOrder.pickupPointAddress,
      couponCode: pickupOrder.couponCode,
      discountAmount: pickupOrder.discountAmount,
      shippingAmount: pickupOrder.shippingAmount,
      serviceDetails: pickupOrder.serviceDetails,
      serviceAmount: pickupOrder.serviceAmount,
      totalAmount: pickupOrder.totalAmount,
    }).toEqual({
      paymentMethod: 'cod',
      itemsTotal: fixture.unitPrice,
      shippingMethod: 'pickup',
      deliveryZone: null,
      deliveryDate: normalizeVisibleDeliveryDate(pickupSlot.date),
      deliveryWindow: pickupSlot.windowLabel,
      pickupPointId: 'pt-danilov',
      pickupPointName: 'Пункт «Даниловский»',
      pickupPointAddress: 'Дубининская, 71',
      couponCode: null,
      discountAmount: 0,
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

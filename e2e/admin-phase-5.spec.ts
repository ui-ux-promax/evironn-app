import { expect, test, type Page } from '@playwright/test';

import {
  cleanupPhase5Fixture,
  createPhase5Fixture,
  disconnectPhase5Database,
  phase5Namespace,
  readPhase5OrderProbe,
} from './phase5-database';
import { signIn } from './helpers';

async function cancelFromAdminPage(page: Page): Promise<void> {
  await page.getByTestId('admin-order-cancel').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Отменить заказ?');
  await dialog.getByRole('button', { name: 'Отменить заказ', exact: true }).click();
}

test('Phase 5D protected routes remain ADMIN only', async ({ page }, testInfo) => {
  const namespace = phase5Namespace(testInfo);
  const fixture = await createPhase5Fixture(namespace);
  try {
    await page.goto('/admin');
    const anonymousUrl = new URL(page.url());
    expect(anonymousUrl.pathname).toBe('/login');
    const callbackUrl = new URL(anonymousUrl.searchParams.get('callbackUrl') ?? '', anonymousUrl.origin);
    expect(callbackUrl.origin).toBe(anonymousUrl.origin);
    expect(callbackUrl.pathname).toBe('/admin');

    await signIn(page, fixture.customerEmail);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('admin-dashboard')).toHaveCount(0);

    await page.context().clearCookies();
    await signIn(page, fixture.adminEmail);
    await page.goto('/admin');
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
  } finally {
    const cleanup = await cleanupPhase5Fixture(fixture, []);
    expect(cleanup.allZero).toBe(true);
  }
});

test('Phase 5D owned COD order cancels once under stale tabs', async ({ page }, testInfo) => {
  const namespace = phase5Namespace(testInfo);
  const fixture = await createPhase5Fixture(namespace);
  let orderNumber: number | null = null;
  let orderId: string | null = null;
  let stalePage: Page | null = null;

  try {
    await signIn(page, fixture.customerEmail);
    await page.goto('/checkout');
    await page.getByLabel('Имя и фамилия').fill(`Phase 5 COD Customer ${namespace}`);
    await page.getByLabel('Телефон').fill('+79991234567');
    await page.getByLabel('E-mail').fill(fixture.customerEmail);

    await page.getByRole('radio', { name: /шоурум/i }).click();
    await page.getByRole('radio', { name: /Шоурум Evironn/ }).click();
    await page.getByRole('radiogroup', { name: 'Дата получения' }).getByRole('radio').first().click();
    await page.getByRole('radio', { name: /При получении/ }).click();

    await expect(page.getByLabel('Имя и фамилия')).toHaveValue(`Phase 5 COD Customer ${namespace}`);
    await expect(page.getByLabel('Телефон')).toHaveValue('+7 (999) 123-45-67');
    await expect(page.getByLabel('E-mail')).toHaveValue(fixture.customerEmail);

    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    orderNumber = Number(new URL(page.url()).pathname.split('/').pop());
    const before = await readPhase5OrderProbe(namespace, String(orderNumber));
    orderId = before.id;

    expect(before.status).toBe('PENDING');
    expect(before.stockBySkuId[fixture.skuIds[0]]).toBe(11);
    expect(before.stockBySkuId[fixture.skuIds[1]]).toBe(13);
    expect(before.paymentCount).toBe(0);
    expect(before.paymentInitializationState).toBeNull();
    expect(before.paymentInitializationClaimedAt).toBeNull();
    expect(before.paymentEverDispatchedAt).toBeNull();
    expect(before.snapshotLines).toEqual([
      {
        productName: `Phase 5D Product ${namespace}`,
        articleNumber: `${namespace}-sku-a`,
        quantity: 1,
        unitPrice: 45900,
      },
    ]);

    await page.context().clearCookies();
    await signIn(page, fixture.adminEmail);
    const adminPage = page;
    stalePage = await page.context().newPage();
    await adminPage.goto(`/admin/orders/${orderId}`);
    await stalePage.goto(`/admin/orders/${orderId}`);
    await expect(adminPage.locator('main')).toContainText(`Phase 5 COD Customer ${namespace}`);
    await expect(adminPage.locator('main')).toContainText(fixture.customerEmail);
    await expect(adminPage.locator('main')).toContainText(`${namespace}-sku-a`);

    await cancelFromAdminPage(adminPage);
    await expect(adminPage.getByText('Заказ отменён.', { exact: true })).toBeVisible();

    await cancelFromAdminPage(stalePage);
    await expect(stalePage.getByRole('dialog')).toContainText('Не удалось выполнить');
    await expect(stalePage.getByTestId('admin-conflict-alert')).toContainText(
      'Этот заказ нельзя отменить по текущему статусу или платёжным признакам',
    );

    await expect
      .poll(async () => (await readPhase5OrderProbe(namespace, orderId as string)).status, { timeout: 20_000 })
      .toBe('CANCELLED');
    const after = await readPhase5OrderProbe(namespace, orderId);
    expect(after.stockBySkuId).toEqual({
      [fixture.skuIds[0]]: 12,
      [fixture.skuIds[1]]: 13,
    });
    expect(after.snapshotLines).toEqual(before.snapshotLines);
    expect(after.paymentCount).toBe(0);
    expect(after.paymentInitializationState).toBe(before.paymentInitializationState);
    expect(after.paymentInitializationClaimedAt).toBe(before.paymentInitializationClaimedAt);
    expect(after.paymentEverDispatchedAt).toBe(before.paymentEverDispatchedAt);
  } finally {
    if (stalePage) await stalePage.close();
    const ownedOrderIds = orderId
      ? [orderId]
      : orderNumber === null
        ? []
        : [(await readPhase5OrderProbe(namespace, String(orderNumber))).id];
    const cleanup = await cleanupPhase5Fixture(fixture, ownedOrderIds);
    expect(cleanup.allZero).toBe(true);
  }
});

test('Phase 5D canonical catalog and coupon projections render', async ({ page }, testInfo) => {
  const namespace = phase5Namespace(testInfo);
  const fixture = await createPhase5Fixture(namespace);
  const couponCode = `PHASE5D-${namespace}`.toUpperCase();
  try {
    await signIn(page, fixture.adminEmail);
    await page.goto(`/admin/catalog/products?q=${encodeURIComponent(namespace)}`);
    await expect(page.locator('main')).toContainText(`Phase 5D Product ${namespace}`);
    await expect(page.locator('main')).toContainText(`${namespace}-product`);

    await page.goto(`/admin/marketing?q=${encodeURIComponent(couponCode)}`);
    await expect(page.locator('main')).toContainText(couponCode);
    await expect(page.locator('main')).toContainText('20%');
  } finally {
    const cleanup = await cleanupPhase5Fixture(fixture, []);
    expect(cleanup.allZero).toBe(true);
  }
});

test('Phase 5D browser role controls promote and restore an owned CUSTOMER', async ({ page }, testInfo) => {
  const namespace = phase5Namespace(testInfo);
  const fixture = await createPhase5Fixture(namespace);
  try {
    await signIn(page, fixture.adminEmail);
    await page.goto(`/admin/customers/${fixture.customerUserId}`);
    await expect(page.locator('main')).toContainText(fixture.customerEmail);

    await page.getByRole('button', { name: 'Назначить администратором', exact: true }).click();
    let dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Назначить администратором?');
    await dialog.getByRole('button', { name: 'Назначить', exact: true }).click();
    await expect(page.getByText('Администратор', { exact: true })).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: 'Снять роль администратора', exact: true }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Снять роль администратора?');
    await dialog.getByRole('button', { name: 'Снять роль', exact: true }).click();
    await expect(page.getByText('Клиент', { exact: true })).toBeVisible();
  } finally {
    const cleanup = await cleanupPhase5Fixture(fixture, []);
    expect(cleanup.allZero).toBe(true);
  }
});

test.afterAll(async () => {
  await disconnectPhase5Database();
});

import { expect, test, type BrowserContext, type Page } from '@playwright/test';

import {
  cleanupPhase4Namespace,
  createPhase4CheckoutFixture,
  disconnectPhase4Database,
  markOwnedOrderAsLegacySnapshot,
  phase4Namespace,
  readOwnedOrder,
  seedOwnedCartLine,
} from './phase4-database';
import { expectProtectedOrderBoundary, registerAndVerify } from './helpers';

const hasExplicitDatabase = Boolean(
  process.env.E2E_DATABASE_URL &&
  process.env.E2E_DATABASE_ALLOW_WRITES === '1' &&
  process.env.E2E_DATABASE_TARGET_FINGERPRINT,
);
const guarded = hasExplicitDatabase ? test : test.skip;

async function placeCodOrder(page: Page, namespace: string) {
  const fixture = await createPhase4CheckoutFixture(namespace);
  await registerAndVerify(page, fixture.email);
  await seedOwnedCartLine(fixture.email, fixture.skuId);
  await page.goto('/checkout');
  await page.getByLabel('Имя и фамилия').fill('Phase 4 Order Customer');
  await page.getByLabel('Телефон').fill('+79990000000');
  await page.getByLabel('Адрес').fill('Москва, улица Фазовая, 1');
  await page.getByLabel('Город').fill('Москва');
  await page.getByRole('radiogroup', { name: 'Дата получения' }).getByRole('radio').first().click();
  await page.getByRole('radio', { name: /При получении/ }).click();
  await page
    .getByRole('button', { name: /Оформить заказ/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/orders\/\d+/);
  return { fixture, orderNumber: Number(new URL(page.url()).pathname.split('/').pop()) };
}

guarded('foreign order returns 404 and signed-out order redirects safely', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  const foreignNamespace = phase4Namespace(`${testInfo.title}-foreign`);
  let foreignContext: BrowserContext | null = null;
  try {
    const fixture = await createPhase4CheckoutFixture(namespace);
    await registerAndVerify(page, fixture.email);
    const browser = page.context().browser();
    expect(browser).not.toBeNull();
    foreignContext = await browser!.newContext();
    const foreignPage = await foreignContext.newPage();
    const foreign = await placeCodOrder(foreignPage, foreignNamespace);
    await foreignContext.close();
    foreignContext = null;
    await expectProtectedOrderBoundary(page, foreign.orderNumber);
  } finally {
    if (foreignContext) await foreignContext.close();
    await cleanupPhase4Namespace(namespace);
    await cleanupPhase4Namespace(foreignNamespace);
  }
});

guarded('owned order renders new and legacy snapshots at desktop and mobile', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  try {
    const { fixture, orderNumber } = await placeCodOrder(page, namespace);
    await expect(page.getByText('Доставка')).toBeVisible();
    await expect(page.getByText('Москва')).toBeVisible();
    await markOwnedOrderAsLegacySnapshot(fixture.email, orderNumber);
    await page.reload();
    await expect(page.getByText('Самовывоз')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.locator('main.ord-a')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.reload();
    await expect(page.locator('main.ord-a')).toBeVisible();
    expect((await readOwnedOrder(fixture.email, orderNumber)).status).toBe('PENDING');
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

guarded('keyboard cancellation dialog and reduced motion remain accessible', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  try {
    const { fixture, orderNumber } = await placeCodOrder(page, namespace);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Отменить заказ' }).focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Отменить заказ?' })).toBeVisible();
    await expect(dialog).toContainText('Это действие нельзя отменить');
    await dialog.getByRole('button', { name: 'Отменить заказ' }).click();
    await expect(page.getByText('Отменён')).toBeVisible();
    expect((await readOwnedOrder(fixture.email, orderNumber)).status).toBe('CANCELLED');
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

test.afterAll(async () => {
  if (hasExplicitDatabase) await disconnectPhase4Database();
});

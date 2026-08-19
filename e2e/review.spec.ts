import { expect, test, type Page } from '@playwright/test';

import {
  cleanupPhase4Namespace,
  createPhase4CheckoutFixture,
  disconnectPhase4Database,
  markOwnedOrderDelivered,
  phase4Namespace,
  seedOwnedCartLine,
} from './phase4-database';
import { expectNoEnabledReviewSubmission, registerAndVerify } from './helpers';

const guarded = test;

async function placeReviewOrder(page: Page, namespace: string) {
  const fixture = await createPhase4CheckoutFixture(namespace);
  await registerAndVerify(page, fixture.email);
  await seedOwnedCartLine(fixture.email, fixture.skuId);
  await page.goto('/checkout');
  await page.getByLabel('Имя и фамилия').fill('Phase 4 Review Customer');
  await page.getByLabel('Телефон').fill('+79990000000');
  await page.getByRole('textbox', { name: 'Адрес', exact: true }).fill('Москва, улица Фазовая, 1');
  await page.getByRole('textbox', { name: 'Город', exact: true }).fill('Москва');
  await page.getByRole('radiogroup', { name: 'Дата получения' }).getByRole('radio').first().click();
  await page.getByRole('radio', { name: /При получении/ }).click();
  await page
    .getByRole('button', { name: /Оформить заказ/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/orders\/\d+/);
  return { fixture, orderNumber: Number(new URL(page.url()).pathname.split('/').pop()) };
}

guarded('verified purchase can submit and persist one product review', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  try {
    const { fixture, orderNumber } = await placeReviewOrder(page, namespace);
    await markOwnedOrderDelivered(fixture.email, orderNumber);
    await page.reload();
    await expect(page.getByRole('radio', { name: '5 из 5' })).toBeVisible();
    await page.getByRole('radio', { name: '5 из 5' }).click();
    await page.getByPlaceholder('Поделитесь впечатлением (необязательно)').fill('Хорошая мебель.');
    await page.getByRole('button', { name: 'Оставить отзыв' }).click();
    await expect(page.getByText('Вы уже оставили отзыв.')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Вы уже оставили отзыв.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Отменить заказ' })).toHaveCount(0);
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

guarded('verified user without qualifying purchase has no review submission path', async ({ page }, testInfo) => {
  const namespace = phase4Namespace(testInfo.title);
  try {
    const fixture = await createPhase4CheckoutFixture(namespace);
    await registerAndVerify(page, fixture.email);
    await page.goto('/profile');
    await expectNoEnabledReviewSubmission(page);
  } finally {
    await cleanupPhase4Namespace(namespace);
  }
});

test.afterAll(async () => {
  await disconnectPhase4Database();
});

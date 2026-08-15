import { expect, test, type Page } from '@playwright/test';

const nomaPath = '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle';

async function addNomaSku(page: Page) {
  await page.goto(nomaPath);
  await page.getByRole('button', { name: 'Добавить в корзину', exact: true }).click();
  await page.goto('/cart');
}

test.describe('cart-only coupons', () => {
  test('valid coupon renders server-returned totals without checkout or order navigation', async ({ page }) => {
    await addNomaSku(page);
    await page.getByRole('textbox', { name: 'Промокод' }).fill('RITM10');
    await page.getByRole('button', { name: 'Применить' }).click();
    await expect(page.getByText(/Промокод RITM10 принят/)).toBeVisible();
    await expect(page.getByText(/Промокод −10%/)).toBeVisible();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByRole('button', { name: 'Оформление заказа будет доступно на следующем этапе.' }),
    ).toBeDisabled();
  });

  test('invalid coupon shows server error and leaves cart total unchanged', async ({ page }) => {
    await addNomaSku(page);
    const before = await page.locator('.crt-sum__row.is-total dd').textContent();
    await page.getByRole('textbox', { name: 'Промокод' }).fill('NOPE123');
    await page.getByRole('button', { name: 'Применить' }).click();
    await expect(page.getByText('Промокод недействителен')).toBeVisible();
    await expect(page.locator('.crt-sum__row.is-total dd')).toHaveText(before ?? '');
    await expect(page).toHaveURL(/\/cart$/);
  });
});

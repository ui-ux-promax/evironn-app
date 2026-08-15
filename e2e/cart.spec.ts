import { expect, test, type Page } from '@playwright/test';
import { registerAndVerify } from './helpers';

const nomaPath = '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle';

async function addNomaSku(page: Page) {
  await page.goto(nomaPath);
  await page.getByRole('button', { name: 'Добавить в корзину', exact: true }).click();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Корзина' })).toBeVisible();
  await expect(page.getByText('Noma Woven Lounge')).toBeVisible();
}

test.describe('canonical cart', () => {
  test('adds selected Noma SKU, persists guest cart, validates stock response, removes, undoes, and clears', async ({
    page,
  }) => {
    await addNomaSku(page);
    await expect(page.getByText(/Отделка: Орех/)).toBeVisible();

    const increase = page.getByRole('button', { name: 'Добавить одну штуку Noma Woven Lounge' });
    const quantityResponse = page.waitForResponse(
      (response) => response.url().includes('/api/cart/') && response.request().method() === 'PATCH',
    );
    await increase.click();
    const response = await quantityResponse;
    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      items: Array<{ skuId: string; quantity: number; stock: number }>;
      totals: { itemCount: number; lineCount: number; subtotal: number; total: number };
    };
    expect(body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ skuId: expect.any(String), quantity: 2 })]),
    );
    expect(body.items[0].stock).toBeGreaterThanOrEqual(body.items[0].quantity);
    expect(body.totals).toMatchObject({
      itemCount: 2,
      lineCount: 1,
      subtotal: expect.any(Number),
      total: expect.any(Number),
    });
    await expect(increase).toBeDisabled();
    await page.reload();
    await expect(page.getByText(/2 товаров|Количество 2/)).toBeVisible();

    await page.getByRole('button', { name: 'Удалить Noma Woven Lounge' }).click();
    await expect(page.getByRole('button', { name: /Вернуть/ })).toBeVisible();
    await page.getByRole('button', { name: /Вернуть/ }).click();
    await expect(page.getByText('Noma Woven Lounge')).toBeVisible();

    await page.getByRole('button', { name: 'Очистить корзину' }).click();
    await expect(page.getByText('В корзине пока пусто')).toBeVisible();
  });

  test('guest cart survives navigation and merges after sign-in', async ({ page }) => {
    await addNomaSku(page);
    await page.goto('/');
    await page.goto('/cart');
    await expect(page.getByText('Noma Woven Lounge')).toBeVisible();

    await registerAndVerify(page);
    await page.goto('/cart');
    await expect(page.getByText('Noma Woven Lounge')).toBeVisible();
  });
});

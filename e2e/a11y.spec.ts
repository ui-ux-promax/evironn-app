import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SHOWCASE_PRODUCT_PATH } from '../components/evironn/public-routes';
import { registerAndVerify } from './helpers';

for (const path of ['/', '/catalog', SHOWCASE_PRODUCT_PATH, '/cart', '/wishlist', '/login', '/register']) {
  test(`a11y: РЅРµС‚ СЃРµСЂСЊС‘Р·РЅС‹С… РЅР°СЂСѓС€РµРЅРёР№ РЅР° ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
  });
}

test('a11y: РЅРµС‚ СЃРµСЂСЊС‘Р·РЅС‹С… РЅР°СЂСѓС€РµРЅРёР№ РЅР° /checkout', async ({ page }) => {
  await registerAndVerify(page);
  await page.goto(SHOWCASE_PRODUCT_PATH);
  await page.locator('.product-page__add-button').click();
  await expect(page.locator('a[href="/cart"]').first()).toContainText('(1)');

  await page.goto('/checkout');
  await expect(page.getByRole('button', { name: 'РћС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р· в†’' })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
});

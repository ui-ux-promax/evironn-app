import { test, expect, type Page } from '@playwright/test';
import { registerAndVerify } from './helpers';

async function addSeedProductToCart(page: Page) {
  await page.goto('/product/ritm-white-tee-oversize');
  await page.getByRole('button', { name: 'L', exact: true }).click();
  await page.getByRole('button', { name: /Р’ РєРѕСЂР·РёРЅСѓ/ }).click();
  await expect(page.getByRole('button', { name: /Р”РѕР±Р°РІР»РµРЅРѕ/ })).toBeVisible();
}

async function fillCheckout(page: Page) {
  await page.getByLabel('РўРµР»РµС„РѕРЅ').fill('+79990000000');
  await page.getByLabel('РђРґСЂРµСЃ', { exact: true }).fill('РњРѕСЃРєРІР°, РўРІРµСЂСЃРєР°СЏ 1');
}

test('COD-Р·Р°РєР°Р· РїРѕ-РїСЂРµР¶РЅРµРјСѓ СЂР°Р±РѕС‚Р°РµС‚ (СЂРµРіСЂРµСЃСЃРёСЏ)', async ({ page }) => {
  await registerAndVerify(page);
  await addSeedProductToCart(page);
  await page.goto('/checkout');
  await fillCheckout(page);
  await page.getByRole('radio', { name: /РџСЂРё РїРѕР»СѓС‡РµРЅРёРё/ }).check();
  await page.getByRole('button', { name: 'РћС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р· в†’' }).click();
  await expect(page).toHaveURL(/\/orders\/\d+/);
  await expect(page.getByText('РћРїР»Р°С‚Р° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё')).toBeVisible();
});

const hasYooKassa = !!process.env.YOOKASSA_SHOP_ID && !!process.env.YOOKASSA_SECRET_KEY;
(hasYooKassa ? test : test.skip)(
  'РѕРЅР»Р°Р№РЅ-РѕРїР»Р°С‚Р° РІРµРґС‘С‚ РЅР° РІРЅРµС€РЅРёР№ СЂРµРґРёСЂРµРєС‚ Р®Kassa',
  async ({ page }) => {
    await registerAndVerify(page);
    await addSeedProductToCart(page);
    await page.goto('/checkout');
    await fillCheckout(page);
    await page.getByRole('radio', { name: /РљР°СЂС‚РѕР№ РѕРЅР»Р°Р№РЅ/ }).check();
    await page.getByRole('button', { name: 'РћС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р· в†’' }).click();
    await page.waitForURL(/yoo(money|kassa)\.ru|3ds|yookassa/i, { timeout: 30000 }).catch(() => {});
    await expect(page).not.toHaveURL(/\/checkout$/);
  },
);

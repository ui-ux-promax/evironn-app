import { test, expect, type Page } from '@playwright/test';
import { registerAndVerify } from './helpers';

async function addSeedProductToCart(page: Page) {
  await page.goto('/product/ritm-white-tee-oversize');
  await page.getByRole('button', { name: 'L', exact: true }).click();
  await page.getByRole('button', { name: /Р’ РєРѕСЂР·РёРЅСѓ/ }).click();
  await expect(page.getByRole('button', { name: /Р”РѕР±Р°РІР»РµРЅРѕ/ })).toBeVisible();
}

test('РєСѓРїРѕРЅ RITM10 РґР°С‘С‚ СЃРєРёРґРєСѓ 10% Рё СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ РІ Р·Р°РєР°Р·Рµ', async ({ page }) => {
  await registerAndVerify(page);
  await addSeedProductToCart(page);

  await page.goto('/checkout');
  await page.getByLabel('РўРµР»РµС„РѕРЅ').fill('+79990000000');
  await page.getByLabel('РђРґСЂРµСЃ', { exact: true }).fill('РњРѕСЃРєРІР°, РўРІРµСЂСЃРєР°СЏ 1');

  // РџСЂРёРјРµРЅРёС‚СЊ РїСЂРѕРјРѕРєРѕРґ в†’ preview-СЃРєРёРґРєР°.
  await page.getByPlaceholder('РџСЂРѕРјРѕРєРѕРґ').fill('RITM10');
  await page.getByRole('button', { name: 'РџСЂРёРјРµРЅРёС‚СЊ' }).click();
  await expect(page.getByText('РџСЂРѕРјРѕРєРѕРґ RITM10 (10%)')).toBeVisible();
  await expect(page.getByText('РЎРєРёРґРєР°', { exact: true })).toBeVisible();

  // РћС„РѕСЂРјРёС‚СЊ COD-Р·Р°РєР°Р· (online СѓС€С‘Р» Р±С‹ РІ YooKassa, РєРѕС‚РѕСЂРѕРіРѕ РЅРµС‚ РІ CI).
  await page.getByRole('radio', { name: /РџСЂРё РїРѕР»СѓС‡РµРЅРёРё/ }).check();
  await page.getByRole('button', { name: 'РћС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р· в†’' }).click();

  // РќР° СЃС‚СЂР°РЅРёС†Рµ Р·Р°РєР°Р·Р° СЃРєРёРґРєР° СЃ РєРѕРґРѕРј СЃРѕС…СЂР°РЅРµРЅР°.
  await expect(page).toHaveURL(/\/orders\/\d+/);
  await expect(page.getByText(/РЎРєРёРґРєР° \(RITM10\)/)).toBeVisible();
});

test('РёСЃС‚С‘РєС€РёР№ РєСѓРїРѕРЅ EXPIRED в†’ РѕС€РёР±РєР°, Р±РµР· СЃРєРёРґРєРё', async ({ page }) => {
  await registerAndVerify(page);
  await addSeedProductToCart(page);

  await page.goto('/checkout');
  await page.getByPlaceholder('РџСЂРѕРјРѕРєРѕРґ').fill('EXPIRED');
  await page.getByRole('button', { name: 'РџСЂРёРјРµРЅРёС‚СЊ' }).click();

  // Р¦РµР»РёРјСЃСЏ РїРѕ С‚РµРєСЃС‚Сѓ РѕС€РёР±РєРё, Р° РЅРµ getByRole('alert') вЂ” РїРѕСЃР»РµРґРЅРёР№ РјР°С‚С‡РёС‚ РµС‰С‘ Рё
  // СЃР»СѓР¶РµР±РЅС‹Р№ Next.js route-announcer (<div role="alert" id="__next-route-announcer__">).
  await expect(page.getByText(/РЎСЂРѕРє РґРµР№СЃС‚РІРёСЏ РїСЂРѕРјРѕРєРѕРґР° РёСЃС‚С‘Рє/)).toBeVisible();
  await expect(page.getByText('РЎРєРёРґРєР°', { exact: true })).toHaveCount(0);
});

test('РЅРµСЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ РєСѓРїРѕРЅ в†’ РѕС€РёР±РєР°', async ({ page }) => {
  await registerAndVerify(page);
  await addSeedProductToCart(page);

  await page.goto('/checkout');
  await page.getByPlaceholder('РџСЂРѕРјРѕРєРѕРґ').fill('NOPE123');
  await page.getByRole('button', { name: 'РџСЂРёРјРµРЅРёС‚СЊ' }).click();

  await expect(page.getByText(/РџСЂРѕРјРѕРєРѕРґ РЅРµРґРµР№СЃС‚РІРёС‚РµР»РµРЅ/)).toBeVisible();
});

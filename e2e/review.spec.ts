import { test, expect, type Page } from '@playwright/test';
import { registerAndVerify } from './helpers';

async function buyWhiteTee(page: Page) {
  await page.goto('/product/ritm-white-tee-oversize');
  await page.getByRole('button', { name: 'L', exact: true }).click();
  await page.getByRole('button', { name: /Р’ РєРѕСЂР·РёРЅСѓ/ }).click();
  await expect(page.getByRole('button', { name: /Р”РѕР±Р°РІР»РµРЅРѕ/ })).toBeVisible();
  await page.goto('/checkout');
  await page.getByLabel('РўРµР»РµС„РѕРЅ').fill('+79990000000');
  await page.getByLabel('РђРґСЂРµСЃ', { exact: true }).fill('РњРѕСЃРєРІР°, РўРІРµСЂСЃРєР°СЏ 1');
  await page.getByRole('radio', { name: /РџСЂРё РїРѕР»СѓС‡РµРЅРёРё/ }).check();
  await page.getByRole('button', { name: 'РћС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р· в†’' }).click();
  await expect(page).toHaveURL(/\/orders\/\d+/);
}

test('РєСѓРїРёРІС€РёР№ РѕСЃС‚Р°РІР»СЏРµС‚ РѕС‚Р·С‹РІ СЃРѕ СЃС‚СЂР°РЅРёС†С‹ Р·Р°РєР°Р·Р° в†’ РІРёРґРµРЅ РЅР° PDP, РїРѕРІС‚РѕСЂ РЅРµРґРѕСЃС‚СѓРїРµРЅ', async ({
  page,
}) => {
  await registerAndVerify(page);
  await buyWhiteTee(page); // Р·Р°РєР°РЅС‡РёРІР°РµС‚СЃСЏ РЅР° /orders/N (COD, РЅРµ-CANCELLED) вЂ” РѕРґРёРЅ Р·Р°РєР°Р·, Р±РµР· РґРѕРї. СЃС‚РѕРєР°

  // Рї.3: С„РѕСЂРјР° РѕС‚Р·С‹РІР° РїСЂСЏРјРѕ РЅР° СЃС‚СЂР°РЅРёС†Рµ Р·Р°РєР°Р·Р° (С‚РѕС‚ Р¶Рµ ReviewForm, С‡С‚Рѕ Рё РЅР° PDP).
  await expect(page.getByRole('heading', { name: 'РћС†РµРЅРёС‚Рµ РїРѕРєСѓРїРєСѓ' })).toBeVisible();
  await page.getByRole('radio', { name: '5 РёР· 5' }).click();
  await page
    .getByPlaceholder(/РџРѕРґРµР»РёС‚РµСЃСЊ РІРїРµС‡Р°С‚Р»РµРЅРёРµРј/)
    .fill('РЎСѓРїРµСЂ РєСЂРѕСЃСЃРѕРІРєРё e2e');
  await page.getByRole('button', { name: 'РћСЃС‚Р°РІРёС‚СЊ РѕС‚Р·С‹РІ' }).click();
  // RSC РїРµСЂРµС‡РёС‚Р°РµС‚ СЃРѕСЃС‚РѕСЏРЅРёРµ: С„РѕСЂРјР° РЅР° СЃС‚СЂР°РЅРёС†Рµ Р·Р°РєР°Р·Р° СЃРјРµРЅСЏРµС‚СЃСЏ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµРј.
  await expect(
    page.getByText('Р’С‹ СѓР¶Рµ РѕСЃС‚Р°РІРёР»Рё РѕС‚Р·С‹РІ РЅР° СЌС‚РѕС‚ С‚РѕРІР°СЂ. РЎРїР°СЃРёР±Рѕ!'),
  ).toBeVisible();

  // Рї.1: РЅР° PDP РѕС‚Р·С‹РІ РІРёРґРµРЅ, С„РѕСЂРјС‹ РЅРµС‚, СЃРѕСЃС‚РѕСЏРЅРёРµ В«СѓР¶Рµ РѕСЃС‚Р°РІРёР»РёВ» (Р° РЅРµ В«РїРѕСЃР»Рµ РїРѕРєСѓРїРєРёВ»).
  await page.goto('/product/ritm-white-tee-oversize');
  await expect(page.getByText('РЎСѓРїРµСЂ РєСЂРѕСЃСЃРѕРІРєРё e2e')).toBeVisible();
  await expect(page.getByRole('button', { name: 'РћСЃС‚Р°РІРёС‚СЊ РѕС‚Р·С‹РІ' })).toHaveCount(0);
  await expect(
    page.getByText('Р’С‹ СѓР¶Рµ РѕСЃС‚Р°РІРёР»Рё РѕС‚Р·С‹РІ РЅР° СЌС‚РѕС‚ С‚РѕРІР°СЂ. РЎРїР°СЃРёР±Рѕ!'),
  ).toBeVisible();
});

test('РіРѕСЃС‚СЊ РЅР° PDP в†’ С„РѕСЂРјС‹ РЅРµС‚, РІРёРґРёС‚ В«Р’РѕР№РґРёС‚РµВ»', async ({ page }) => {
  await page.goto('/product/ritm-white-tee-oversize');
  await expect(page.getByText(/Р’РѕР№РґРёС‚Рµ/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'РћСЃС‚Р°РІРёС‚СЊ РѕС‚Р·С‹РІ' })).toHaveCount(0);
});

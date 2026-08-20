import { test, expect } from '@playwright/test';

test('PDP: РїРµСЂРµРєР»СЋС‡РµРЅРёРµ СЂР°СЃС†РІРµС‚РєРё, РІС‹Р±РѕСЂ СЂР°Р·РјРµСЂР°, РґРѕР±Р°РІР»РµРЅРёРµ РІ РєРѕСЂР·РёРЅСѓ', async ({
  page,
}) => {
  await page.goto('/product/ritm-white-tee-oversize');
  await expect(page.getByRole('heading', { name: /Белая футболка/ })).toBeVisible();

  // РїРµСЂРµРєР»СЋС‡РёС‚СЊ СЂР°СЃС†РІРµС‚РєСѓ в†’ РјРµРЅСЏРµС‚СЃСЏ ?color= (СЃРІРѕС‚С‡Рё вЂ” СЃСЃС‹Р»РєРё <Link>, role=link, РґР»СЏ С€Р°СЂСЏС‰РµРіРѕСЃСЏ URL/SEO)
  await page.getByRole('link', { name: /Р¦РІРµС‚ Черный/ }).click();
  await expect(page).toHaveURL(/color=black/);

  // РІРµСЂРЅСѓС‚СЊСЃСЏ РЅР° РґРµС„РѕР»С‚РЅСѓСЋ Рё РІС‹Р±СЂР°С‚СЊ РґРѕСЃС‚СѓРїРЅС‹Р№ СЂР°Р·РјРµСЂ 42
  await page.goto('/product/ritm-white-tee-oversize');
  await page.getByRole('button', { name: 'L', exact: true }).click();
  await page.getByRole('button', { name: /Р’ РєРѕСЂР·РёРЅСѓ/ }).click();

  // Р±РµР№РґР¶ РєРѕСЂР·РёРЅС‹ РїРѕРєР°Р·С‹РІР°РµС‚ 1
  await expect(page.getByRole('link', { name: /РљРѕСЂР·РёРЅР°, 1 С‚РѕРІР°СЂР°/ })).toBeVisible();
});

test('PDP: РЅРµРґРѕСЃС‚СѓРїРЅС‹Р№ СЂР°Р·РјРµСЂ (stock 0) вЂ” disabled', async ({ page }) => {
  await page.goto('/product/ritm-white-tee-oversize');
  await expect(page.getByRole('button', { name: 'XXL', exact: true })).toBeDisabled();
});

test('РљРѕСЂР·РёРЅР°: РїРѕРІС‚РѕСЂРЅРѕРµ РґРѕР±Р°РІР»РµРЅРёРµ С‚РѕРіРѕ Р¶Рµ РІР°СЂРёР°РЅС‚Р° СѓРІРµР»РёС‡РёРІР°РµС‚ РєРѕР»РёС‡РµСЃС‚РІРѕ (РґРµРґСѓРї)', async ({
  page,
}) => {
  await page.goto('/product/ritm-white-tee-oversize');
  await page.getByRole('button', { name: 'L', exact: true }).click();
  const addBtn = page.getByRole('button', { name: /Р’ РєРѕСЂР·РёРЅСѓ/ });
  await addBtn.click();
  // РґРѕР¶РґР°С‚СЊСЃСЏ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РїРµСЂРІРѕРіРѕ РґРѕР±Р°РІР»РµРЅРёСЏ, Р·Р°С‚РµРј РІРѕР·РІСЂР°С‚Р° РєРЅРѕРїРєРё Рє В«Р’ РєРѕСЂР·РёРЅСѓВ» вЂ” Рё РґРѕР±Р°РІРёС‚СЊ СЃРЅРѕРІР°
  await expect(page.getByRole('button', { name: /Р”РѕР±Р°РІР»РµРЅРѕ/ })).toBeVisible();
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  await page.goto('/cart');
  // РѕРґРЅР° РїРѕР·РёС†РёСЏ, РєРѕР»РёС‡РµСЃС‚РІРѕ 2
  await expect(page.locator('article').filter({ hasText: 'Белая футболка' })).toHaveCount(1);
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
});

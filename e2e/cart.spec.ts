import { test, expect } from '@playwright/test';

test('РєРѕСЂР·РёРЅР°: СЃС‚РµРїРїРµСЂ РјРµРЅСЏРµС‚ РїРѕРґС‹С‚РѕРі, СѓРґР°Р»РµРЅРёРµ РѕС‡РёС‰Р°РµС‚', async ({
  page,
}) => {
  // РґРѕР±Р°РІРёС‚СЊ С‚РѕРІР°СЂ
  await page.goto('/product/ritm-white-tee-oversize');
  await page.getByRole('button', { name: 'L', exact: true }).click();
  await page.getByRole('button', { name: /Р’ РєРѕСЂР·РёРЅСѓ/ }).click();
  // РґРѕР¶РґР°С‚СЊСЃСЏ Р·Р°РІРµСЂС€РµРЅРёСЏ РґРѕР±Р°РІР»РµРЅРёСЏ (POST + cookie) Р”Рћ РЅР°РІРёРіР°С†РёРё, РёРЅР°С‡Рµ РїРµСЂРµС…РѕРґ РїСЂРµСЂРІС‘С‚ Р·Р°РїСЂРѕСЃ
  await expect(page.getByRole('button', { name: /Р”РѕР±Р°РІР»РµРЅРѕ/ })).toBeVisible();
  await page.goto('/cart');

  await expect(page.getByRole('heading', { name: 'РљРѕСЂР·РёРЅР°' })).toBeVisible();
  // СѓРІРµР»РёС‡РёС‚СЊ РєРѕР»РёС‡РµСЃС‚РІРѕ
  await page.getByRole('button', { name: 'РЈРІРµР»РёС‡РёС‚СЊ РєРѕР»РёС‡РµСЃС‚РІРѕ' }).click();
  await expect(page.getByText('25 980 в‚Ѕ').first()).toBeVisible();
  // СѓРґР°Р»РёС‚СЊ
  await page.getByRole('button', { name: /РЈРґР°Р»РёС‚СЊ/ }).click();
  await expect(page.getByText('РљРѕСЂР·РёРЅР° РїСѓСЃС‚Р°СЏ')).toBeVisible();
});

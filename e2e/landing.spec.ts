import { test, expect } from '@playwright/test';

test('Р»РµРЅРґРёРЅРі СЂРµРЅРґРµСЂРёС‚ hero, РєР°С‚РµРіРѕСЂРёРё, Р±РµСЃС‚СЃРµР»Р»РµСЂС‹', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'РЎРјРѕС‚СЂРµС‚СЊ РєР°С‚Р°Р»РѕРі' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Р‘РµСЃС‚СЃРµР»Р»РµСЂС‹' })).toBeVisible();
  // С…РѕС‚СЏ Р±С‹ РѕРґРЅР° РєР°СЂС‚РѕС‡РєР° С‚РѕРІР°СЂР° РІРµРґС‘С‚ РЅР° /product/
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
});

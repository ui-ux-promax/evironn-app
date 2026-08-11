import { test, expect } from '@playwright/test';

test('РєР°С‚Р°Р»РѕРі: С„РёР»СЊС‚СЂ РїРѕ РєР°С‚РµРіРѕСЂРёРё РјРµРЅСЏРµС‚ URL Рё РІС‹РґР°С‡Сѓ', async ({ page }) => {
  await page.goto('/catalog');
  const allCount = await page.locator('article').count();
  expect(allCount).toBeGreaterThan(0);

  // РІС‹Р±СЂР°С‚СЊ РєР°С‚РµРіРѕСЂРёСЋ В«Р‘РµРіРѕРІС‹РµВ»
  // РєРѕРЅС‚СЂРѕР»РёСЂСѓРµРјС‹Р№ С‡РµРєР±РѕРєСЃ РёРЅРёС†РёРёСЂСѓРµС‚ РЅР°РІРёРіР°С†РёСЋ (URL-driven) в†’ РёСЃРїРѕР»СЊР·СѓРµРј click + РїСЂРѕРІРµСЂРєСѓ URL,
  // Р° РЅРµ check() (РѕРЅ Р¶РґС‘С‚ РјРіРЅРѕРІРµРЅРЅРѕР№ СЃРјРµРЅС‹ state РЅР° С‚РѕРј Р¶Рµ СЌР»РµРјРµРЅС‚Рµ РґРѕ СЂРµ-СЂРµРЅРґРµСЂР°).
  await page.getByRole('checkbox', { name: 'Р‘РµРіРѕРІС‹Рµ' }).click();
  await expect(page).toHaveURL(/category=tees/);
  // РґРѕР»Р¶РЅР° РѕСЃС‚Р°С‚СЊСЃСЏ С…РѕС‚СЏ Р±С‹ РѕРґРЅР° РєР°СЂС‚РѕС‡РєР° Рё РєРѕР»РёС‡РµСЃС‚РІРѕ РЅРµ Р±РѕР»СЊС€Рµ РёСЃС…РѕРґРЅРѕРіРѕ
  const filtered = await page.locator('article').count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThanOrEqual(allCount);
});

test('РєР°С‚Р°Р»РѕРі: РїСѓСЃС‚Р°СЏ РІС‹РґР°С‡Р° РїСЂРё РЅРµСЃРѕРІРјРµСЃС‚РёРјС‹С… С„РёР»СЊС‚СЂР°С…', async ({
  page,
}) => {
  await page.goto('/catalog?q=zzzРЅРµС‚С‚Р°РєРѕРіРѕ');
  await expect(page.getByText('РўР°РєРёС… РєСЂРѕСЃСЃРѕРІРѕРє РЅРµС‚')).toBeVisible();
});

test('РєР°С‚Р°Р»РѕРі: РїР°РіРёРЅР°С†РёСЏ РЅР° СѓСЂРѕРІРЅРµ Р‘Р” вЂ” РїРµСЂРµС…РѕРґ РЅР° СЃС‚СЂР°РЅРёС†Сѓ 2 РјРµРЅСЏРµС‚ URL Рё РІС‹РґР°С‡Сѓ', async ({
  page,
}) => {
  await page.goto('/catalog');
  // РЎРёРґ СЃРѕРґРµСЂР¶РёС‚ >12 С‚РѕРІР°СЂРѕРІ (PAGE_SIZE) в†’ РµСЃС‚СЊ РІС‚РѕСЂР°СЏ СЃС‚СЂР°РЅРёС†Р°.
  const pager = page.getByRole('navigation', { name: 'РџР°РіРёРЅР°С†РёСЏ' });
  await expect(pager).toBeVisible();

  const firstNameP1 = await page.locator('article h3').first().textContent();
  const countP1 = await page.locator('article').count();
  expect(countP1).toBe(12); // РїРµСЂРІР°СЏ СЃС‚СЂР°РЅРёС†Р° Р·Р°РїРѕР»РЅРµРЅР° СЂРѕРІРЅРѕ PAGE_SIZE

  await pager.getByRole('button', { name: '2', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);

  const countP2 = await page.locator('article').count();
  expect(countP2).toBeGreaterThan(0);
  const firstNameP2 = await page.locator('article h3').first().textContent();
  expect(firstNameP2).not.toBe(firstNameP1); // РґСЂСѓРіРѕР№ РЅР°Р±РѕСЂ С‚РѕРІР°СЂРѕРІ
});

test('РєР°С‚Р°Р»РѕРі: СЃРѕСЂС‚РёСЂРѕРІРєР° РїРѕ С†РµРЅРµ (asc) вЂ” РІРёРґРёРјС‹Рµ С†РµРЅС‹ РЅРµ СѓР±С‹РІР°СЋС‚', async ({
  page,
}) => {
  await page.goto('/catalog?sort=price-asc');
  // РђРєС‚РёРІРЅР°СЏ С†РµРЅР° вЂ” РїРµСЂРІС‹Р№ <span> РІ Р±Р»РѕРєРµ С†РµРЅС‹ РєР°СЂС‚РѕС‡РєРё; РїР°СЂСЃРёРј С†РёС„СЂС‹ РёР· "6 990 в‚Ѕ".
  const priceTexts = await page.locator('article .tnum.font-bold > span:first-child').allTextContents();
  const prices = priceTexts.map((t) => Number(t.replace(/[^\d]/g, ''))).filter((n) => n > 0);
  expect(prices.length).toBeGreaterThan(1);
  for (let i = 1; i < prices.length; i++) {
    expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
  }
});

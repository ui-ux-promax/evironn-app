import { test, expect, type Page } from '@playwright/test';
import { registerAndVerify } from './helpers';

// Р›Р°Р№РєРЅСѓС‚СЊ РїРµСЂРІС‹Р№ С‚РѕРІР°СЂ Рё Р”РћР–Р”РђРўР¬РЎРЇ СЃРµСЂРІРµСЂРЅРѕРіРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ (POST server-action),
// РїСЂРµР¶РґРµ С‡РµРј СѓС…РѕРґРёС‚СЊ СЃРѕ СЃС‚СЂР°РЅРёС†С‹. РћРїС‚РёРјРёСЃС‚РёС‡РЅС‹Р№ в™Ў С„Р»РёРїР°РµС‚СЃСЏ РјРіРЅРѕРІРµРЅРЅРѕ вЂ” РЅРµР»СЊР·СЏ
// РЅР°РІРёРіРёСЂРѕРІР°С‚СЊ СЃСЂР°Р·Сѓ, РёРЅР°С‡Рµ РЅР°РІРёРіР°С†РёСЏ РїСЂРµСЂРІС‘С‚ in-flight СЌРєС€РµРЅ (cookie/Р·Р°РїРёСЃСЊ РЅРµ СѓСЃРїРµСЋС‚).
async function likeFirstProduct(page: Page) {
  const actionDone = page.waitForResponse((r) => r.request().method() === 'POST', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Р’ РёР·Р±СЂР°РЅРЅРѕРµ' }).first().click();
  await actionDone;
  await expect(page.getByRole('button', { name: 'РЈР±СЂР°С‚СЊ РёР· РёР·Р±СЂР°РЅРЅРѕРіРѕ' }).first()).toBeVisible();
}

test('РіРѕСЃС‚СЊ Р»Р°Р№РєР°РµС‚ С‚РѕРІР°СЂ в†’ РІРёРґРµРЅ РІ /wishlist; СѓР±СЂР°С‚СЊ в†’ РїСѓСЃС‚РѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ', async ({
  page,
}) => {
  await page.goto('/catalog');
  await likeFirstProduct(page);

  await page.goto('/wishlist');
  await expect(page.locator('article').first()).toBeVisible();

  // РЈР±СЂР°С‚СЊ СЃ /wishlist вЂ” С‚РѕР¶Рµ РґРѕР¶РґР°С‚СЊСЃСЏ СЃРµСЂРІРµСЂРЅРѕРіРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РїРµСЂРµРґ РїСЂРѕРІРµСЂРєРѕР№ РїСѓСЃС‚РѕРіРѕ СЃРѕСЃС‚РѕСЏРЅРёСЏ.
  const removeDone = page.waitForResponse((r) => r.request().method() === 'POST', { timeout: 30_000 });
  await page.getByRole('button', { name: 'РЈР±СЂР°С‚СЊ РёР· РёР·Р±СЂР°РЅРЅРѕРіРѕ' }).first().click();
  await removeDone;
  await expect(page.getByText('Р’ РёР·Р±СЂР°РЅРЅРѕРј РїРѕРєР° РїСѓСЃС‚Рѕ')).toBeVisible();
});

test('merge: РіРѕСЃС‚СЊ Р»Р°Р№РєРЅСѓР» в†’ СЂРµРіРёСЃС‚СЂР°С†РёСЏ в†’ С‚РѕРІР°СЂ РІ /wishlist', async ({ page }) => {
  await page.goto('/catalog');
  await likeFirstProduct(page);

  await registerAndVerify(page);

  await page.goto('/wishlist');
  await expect(page.locator('article').first()).toBeVisible();
});

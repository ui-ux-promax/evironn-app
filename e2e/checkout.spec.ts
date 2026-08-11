import { test, expect, type Page } from '@playwright/test';
import { registerAndVerify } from './helpers';

// Р”РѕР±Р°РІР»РµРЅРёРµ СЃРёРґ-С‚РѕРІР°СЂР° РІ РєРѕСЂР·РёРЅСѓ (РєР°Рє cart.spec.ts/product.spec.ts): РёР·РІРµСЃС‚РЅС‹Р№ РїСЂРѕРґСѓРєС‚ + СЂР°Р·РјРµСЂ 42.
async function addSeedProductToCart(page: Page) {
  await page.goto('/product/ritm-white-tee-oversize');
  await page.getByRole('button', { name: 'L', exact: true }).click();
  await page.getByRole('button', { name: /Р’ РєРѕСЂР·РёРЅСѓ/ }).click();
  // РґРѕР¶РґР°С‚СЊСЃСЏ Р·Р°РІРµСЂС€РµРЅРёСЏ POST /api/cart (cookie cartToken) Р”Рћ РЅР°РІРёРіР°С†РёРё РЅР° /checkout
  await expect(page.getByRole('button', { name: /Р”РѕР±Р°РІР»РµРЅРѕ/ })).toBeVisible();
}

test('РіРѕСЃС‚СЊ в†’ /checkout СЂРµРґРёСЂРµРєС‚РёС‚ РЅР° /login', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page).toHaveURL(/\/login/);
});

test('СЃРєРІРѕР·РЅРѕР№ COD-Р·Р°РєР°Р·: cart в†’ checkout в†’ order в†’ РёСЃС‚РѕСЂРёСЏ', async ({ page }) => {
  await registerAndVerify(page);
  await addSeedProductToCart(page);

  await page.goto('/checkout');
  // РўРµР»РµС„РѕРЅ РѕР±СЏР·Р°С‚РµР»РµРЅ (checkoutSchema min 5) Рё РќР• РїСЂРµС„РёР»Р»РёС‚СЃСЏ Сѓ СЋР·РµСЂР° Р±РµР· С‚РµР»РµС„РѕРЅР° вЂ” Р·Р°РїРѕР»РЅСЏРµРј СЏРІРЅРѕ.
  await page.getByLabel('РўРµР»РµС„РѕРЅ').fill('+79990000000');
  await page.getByLabel('РђРґСЂРµСЃ', { exact: true }).fill('РњРѕСЃРєРІР°, РўРІРµСЂСЃРєР°СЏ 1');
  // РћРЅР»Р°Р№РЅ-РѕРїР»Р°С‚Р° С‚РµРїРµСЂСЊ РІС‹Р±СЂР°РЅР° РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ вЂ” РґР»СЏ COD-С‚РµСЃС‚Р° СЏРІРЅРѕ РїРµСЂРµРєР»СЋС‡Р°РµРј РЅР° В«РџСЂРё РїРѕР»СѓС‡РµРЅРёРёВ»
  // (РёРЅР°С‡Рµ placeOrder СѓР№РґС‘С‚ РІ online-РІРµС‚РєСѓ Рё СѓРїСЂС‘С‚СЃСЏ РІ РѕС‚СЃСѓС‚СЃС‚РІРёРµ YooKassa-РєР»СЋС‡РµР№ РІ CI).
  await page.getByRole('radio', { name: /РџСЂРё РїРѕР»СѓС‡РµРЅРёРё/ }).check();
  await page.getByRole('button', { name: 'РћС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р· в†’' }).click();

  // РЈСЃРїРµС€РЅРѕРµ РѕС„РѕСЂРјР»РµРЅРёРµ в†’ СЂРµРґРёСЂРµРєС‚ РЅР° СЃС‚СЂР°РЅРёС†Сѓ Р·Р°РєР°Р·Р°.
  await expect(page).toHaveURL(/\/orders\/\d+/);
  await expect(page.getByRole('heading', { name: /Р—Р°РєР°Р· #\d+/ })).toBeVisible();
  await expect(page.getByText('РћС„РѕСЂРјР»РµРЅ')).toBeVisible();

  // Р—Р°РєР°Р· РІРёРґРµРЅ РІ РёСЃС‚РѕСЂРёРё РїСЂРѕС„РёР»СЏ.
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'РњРѕРё Р·Р°РєР°Р·С‹' }).click();
  await expect(page.getByText(/Р—Р°РєР°Р· #\d+/).first()).toBeVisible();
});

test('РѕС‚РјРµРЅР° PENDING-Р·Р°РєР°Р·Р° РїРµСЂРµРІРѕРґРёС‚ РµРіРѕ РІ СЃС‚Р°С‚СѓСЃ РћС‚РјРµРЅС‘РЅ', async ({ page }) => {
  await registerAndVerify(page);
  await addSeedProductToCart(page);

  await page.goto('/checkout');
  // РўРµР»РµС„РѕРЅ РѕР±СЏР·Р°С‚РµР»РµРЅ (checkoutSchema min 5) Рё РќР• РїСЂРµС„РёР»Р»РёС‚СЃСЏ Сѓ СЋР·РµСЂР° Р±РµР· С‚РµР»РµС„РѕРЅР° вЂ” Р·Р°РїРѕР»РЅСЏРµРј СЏРІРЅРѕ.
  await page.getByLabel('РўРµР»РµС„РѕРЅ').fill('+79990000000');
  await page.getByLabel('РђРґСЂРµСЃ', { exact: true }).fill('РњРѕСЃРєРІР°, РўРІРµСЂСЃРєР°СЏ 1');
  // РћРЅР»Р°Р№РЅ-РѕРїР»Р°С‚Р° С‚РµРїРµСЂСЊ РІС‹Р±СЂР°РЅР° РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ вЂ” РґР»СЏ COD-С‚РµСЃС‚Р° СЏРІРЅРѕ РїРµСЂРµРєР»СЋС‡Р°РµРј РЅР° В«РџСЂРё РїРѕР»СѓС‡РµРЅРёРёВ»
  // (РёРЅР°С‡Рµ placeOrder СѓР№РґС‘С‚ РІ online-РІРµС‚РєСѓ Рё СѓРїСЂС‘С‚СЃСЏ РІ РѕС‚СЃСѓС‚СЃС‚РІРёРµ YooKassa-РєР»СЋС‡РµР№ РІ CI).
  await page.getByRole('radio', { name: /РџСЂРё РїРѕР»СѓС‡РµРЅРёРё/ }).check();
  await page.getByRole('button', { name: 'РћС„РѕСЂРјРёС‚СЊ Р·Р°РєР°Р· в†’' }).click();
  await expect(page).toHaveURL(/\/orders\/\d+/);

  // CancelOrderButton РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ РґРµР№СЃС‚РІРёРµ С‡РµСЂРµР· window.confirm вЂ” РїСЂРёРЅРёРјР°РµРј РґРёР°Р»РѕРі.
  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'РћС‚РјРµРЅРёС‚СЊ Р·Р°РєР°Р·' }).click();
  await expect(page.getByText('РћС‚РјРµРЅС‘РЅ')).toBeVisible();
});

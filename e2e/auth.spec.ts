import { test, expect, type Page } from '@playwright/test';
import { registerAndVerify, uniqueEmail, E2E_PASSWORD } from './helpers';

async function register(page: Page, email: string) {
  await registerAndVerify(page, email);
}

// РџРѕСЃР»Рµ СѓСЃРїРµС€РЅРѕРіРѕ РІС…РѕРґР°/СЂРµРіРёСЃС‚СЂР°С†РёРё РІ С…РµРґРµСЂРµ РїРѕСЏРІР»СЏРµС‚СЃСЏ РєРЅРѕРїРєР° РІС‹С…РѕРґР° (server-side AuthNav).
const expectSignedIn = (page: Page) => expect(page.getByRole('button', { name: 'Р’С‹Р№С‚Рё' })).toBeVisible();

test('СЂРµРіРёСЃС‚СЂР°С†РёСЏ в†’ Р°РІС‚РѕР»РѕРіРёРЅ в†’ РїСЂРѕС„РёР»СЊ СЃ РґР°РЅРЅС‹РјРё; РїРѕСЃР»Рµ РІС‹С…РѕРґР° /profile РїРѕРґ Р·Р°С‰РёС‚РѕР№', async ({
  page,
}) => {
  const email = uniqueEmail();
  await register(page, email);
  await expectSignedIn(page); // С„РѕСЂРјР° СЂРµРґРёСЂРµРєС‚РёС‚ РЅР° '/', СЃРµСЃСЃРёСЏ Р°РєС‚РёРІРЅР°

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'РџСЂРѕС„РёР»СЊ' })).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue(email); // email вЂ” value disabled-РёРЅРїСѓС‚Р°

  await Promise.all([
    page.waitForURL('/', { waitUntil: 'networkidle' }),
    page.getByRole('button', { name: 'Р’С‹Р№С‚Рё' }).click(),
  ]);
  // Р”РѕР¶РґР°С‚СЊСЃСЏ Р·Р°РІРµСЂС€РµРЅРёСЏ Р»РѕРіР°СѓС‚Р° РїРѕ redirect РЅР° '/', РёРЅР°С‡Рµ goto РЅРёР¶Рµ РјРѕР¶РµС‚ РіРѕРЅРєРѕР№ РѕРїРµСЂРµРґРёС‚СЊ Set-Cookie СѓРґР°Р»РµРЅРёСЏ СЃРµСЃСЃРёРё.
  await expect(page.getByRole('button', { name: 'Р’С‹Р№С‚Рё' })).toHaveCount(0);
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/); // middleware Р·Р°С‰РёС‰Р°РµС‚ /profile
});

test('Р·Р°С‰РёС‚Р° /profile Р±РµР· РІС…РѕРґР° в†’ СЂРµРґРёСЂРµРєС‚ РЅР° /login', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);
});

test('РІС…РѕРґ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїРѕ email/РїР°СЂРѕР»СЋ', async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  await expectSignedIn(page);
  await page.getByRole('button', { name: 'Р’С‹Р№С‚Рё' }).click();
  // Р”РѕР¶РґР°С‚СЊСЃСЏ РІС‹С…РѕРґР° РґРѕ РїРµСЂРµС…РѕРґР° РЅР° /login: Р·Р°Р»РѕРіРёРЅРµРЅРЅРѕРіРѕ middleware СЂРµРґРёСЂРµРєС‚РёС‚ /loginв†’/profile,
  // РїРѕСЌС‚РѕРјСѓ goto('/login') РґРѕ Р·Р°РІРµСЂС€РµРЅРёСЏ Р»РѕРіР°СѓС‚Р° РїРѕРїР°Р» Р±С‹ РЅР° /profile (disabled #p-email). (#leak-redirect)
  await expect(page.getByRole('button', { name: 'Р’С‹Р№С‚Рё' })).toHaveCount(0);

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('РџР°СЂРѕР»СЊ', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Р’РѕР№С‚Рё', exact: true }).click();
  await expectSignedIn(page);

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'РџСЂРѕС„РёР»СЊ' })).toBeVisible();
});

test('СЃР»РёСЏРЅРёРµ РіРѕСЃС‚РµРІРѕР№ РєРѕСЂР·РёРЅС‹: РіРѕСЃС‚СЊ РґРѕР±Р°РІРёР» С‚РѕРІР°СЂ в†’ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°Р»СЃСЏ в†’ С‚РѕРІР°СЂ РІ РєРѕСЂР·РёРЅРµ', async ({
  page,
}) => {
  await page.goto('/product/ritm-white-tee-oversize');
  await page.getByRole('button', { name: 'L', exact: true }).click();
  await page.getByRole('button', { name: /Р’ РєРѕСЂР·РёРЅСѓ/ }).click();
  await expect(page.getByRole('button', { name: /Р”РѕР±Р°РІР»РµРЅРѕ/ })).toBeVisible();

  await register(page, uniqueEmail());
  await expectSignedIn(page);

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'РљРѕСЂР·РёРЅР°' })).toBeVisible();
  // РљРѕСЂР·РёРЅР° РЅРµ РїСѓСЃС‚Р°СЏ в†’ РµСЃС‚СЊ СЃС‚РµРїРїРµСЂ РєРѕР»РёС‡РµСЃС‚РІР°; РіРѕСЃС‚РµРІР°СЏ РєРѕСЂР·РёРЅР° РїРµСЂРµР¶РёР»Р° РІС…РѕРґ.
  await expect(page.getByText('РљРѕСЂР·РёРЅР° РїСѓСЃС‚Р°СЏ')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'РЈРІРµР»РёС‡РёС‚СЊ РєРѕР»РёС‡РµСЃС‚РІРѕ' })).toBeVisible();
});

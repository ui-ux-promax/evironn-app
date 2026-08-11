import { expect, type Page } from '@playwright/test';

// Р¤РёРєСЃ-РєРѕРґ РґРѕР»Р¶РµРЅ СЃРѕРІРїР°РґР°С‚СЊ СЃ playwright.config.ts webServer.env.E2E_TEST_CODE.
export const E2E_CODE = '424242';
export const E2E_PASSWORD = 'Passw0rd!1';

export const uniqueEmail = () => `u${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test`;

// Р—Р°РїРѕР»РЅСЏРµС‚ РЅРµСѓР±РёСЂР°РµРјСѓСЋ РјРѕРґР°Р»РєСѓ РІРµСЂРёС„РёРєР°С†РёРё С„РёРєСЃ-РєРѕРґРѕРј Рё Р¶РґС‘С‚, РїРѕРєР° РѕРЅР° РёСЃС‡РµР·РЅРµС‚
// (СѓСЃРїРµС€РЅР°СЏ РІРµСЂРёС„РёРєР°С†РёСЏ в†’ auto-login в†’ РІ С…РµРґРµСЂРµ В«Р’С‹Р№С‚РёВ»).
export async function passVerificationGate(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // OTP: 6 СЂР°Р·РґРµР»СЊРЅС‹С… input вЂ” РІРІРѕРґРёРј РїРѕ С†РёС„СЂРµ, Р°РІС‚Рѕ-СЃР°Р±РјРёС‚ РЅР° 6-Р№.
  const cells = dialog.getByRole('textbox');
  await expect(cells).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    await cells.nth(i).fill(E2E_CODE[i]);
  }
  await expect(page.getByRole('button', { name: 'Р’С‹Р№С‚Рё' })).toBeVisible();
}

// РџРѕР»РЅС‹Р№ С„Р»РѕСѓ: СЂРµРіРёСЃС‚СЂР°С†РёСЏ в†’ gate-РјРѕРґР°Р»РєР° в†’ РІРµСЂРёС„РёРєР°С†РёСЏ в†’ Р·Р°Р»РѕРіРёРЅРµРЅ.
// Р—РµСЂРєР°Р»РёС‚ С„РѕСЂРјСѓ registerFormSchema; С‡РµРєР±РѕРєСЃ СЃРѕРіР»Р°СЃРёСЏ РЅРµ СЃРІСЏР·Р°РЅ label'РѕРј в†’ Р±РµСЂС‘Рј РїРѕ role.
export async function registerAndVerify(page: Page, email = uniqueEmail()): Promise<string> {
  await page.goto('/register');
  await page.getByLabel('РРјСЏ').fill('E2E User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('РџР°СЂРѕР»СЊ', { exact: true }).fill(E2E_PASSWORD);
  await page.getByLabel('РџРѕРІС‚РѕСЂРёС‚Рµ РїР°СЂРѕР»СЊ', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ' }).click();
  await passVerificationGate(page);
  return email;
}

import { test, expect, type Page } from '@playwright/test';
import { E2E_PASSWORD, registerAndVerify, uniqueEmail } from './helpers';

const expectSignedIn = (page: Page) => expect(page.getByRole('link', { name: 'Аккаунт' })).toBeVisible();

test('registration verifies inline and protects profile', async ({ page }) => {
  const email = await registerAndVerify(page);
  await expectSignedIn(page);
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue(email);
});

test('profile redirects unauthenticated visitor to login', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);
});

test('credentials login accepts verified account', async ({ page }) => {
  const email = await registerAndVerify(page, uniqueEmail());
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Пароль').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/\/profile/);
});

test('Google control exists and external callback is reduced to local path', async ({ page }) => {
  await page.goto('/login?callbackUrl=https%3A%2F%2Fevil.example%2Fphish');
  await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
  await expect(page.locator('main.auth-page--b')).toBeVisible();
});

import { expect, type Page } from '@playwright/test';

export const E2E_CODE = '424242';
export const E2E_PASSWORD = 'Passw0rd!1';

export const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@auth-e2e.invalid`;

export async function registerAndVerify(page: Page, email = uniqueEmail()): Promise<string> {
  await page.goto('/register?callbackUrl=%2Fprofile');
  await page.getByLabel('Имя').fill('E2E User');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Пароль').fill(E2E_PASSWORD);
  await page.getByLabel('Повторите пароль').fill(E2E_PASSWORD);
  await page.getByRole('checkbox', { name: /демонстрационного сервиса/i }).check();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page.getByRole('heading', { name: 'Подтвердите почту' })).toBeVisible();
  await page.getByLabel('Код из сообщения').fill(E2E_CODE);
  await page.getByRole('button', { name: 'Подтвердить' }).click();
  await expect(page).toHaveURL(/\/profile/);
  return email;
}

export async function expectNoEnabledReviewSubmission(page: Page): Promise<void> {
  const reviewButtons = page.getByRole('button', { name: /оставить отзыв/i });
  await expect(reviewButtons).toHaveCount(0);
}

export async function expectProtectedOrderBoundary(page: Page): Promise<void> {
  const probeResponse = await page.request.get('/api/e2e/phase3-probe', {
    headers: { 'x-e2e-read-only': '1' },
  });
  expect(probeResponse.ok(), 'Disposable E2E seed must expose a foreign order through the read-only probe API').toBe(
    true,
  );

  const probe = (await probeResponse.json()) as { foreignOrderNumber?: unknown; error?: unknown };
  expect(
    Number.isSafeInteger(probe.foreignOrderNumber),
    `Foreign order probe failed: ${String(probe.error ?? 'invalid response')}`,
  ).toBe(true);

  const foreignOrderPath = `/orders/${probe.foreignOrderNumber}`;
  const authenticatedResponse = await page.goto(foreignOrderPath);
  expect(authenticatedResponse?.status()).toBe(404);
  await expect(page.getByText(`EV-${probe.foreignOrderNumber}`, { exact: false })).toHaveCount(0);

  await page.context().clearCookies();
  await page.goto(foreignOrderPath);
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  expect(page.url()).not.toContain(foreignOrderPath);
}

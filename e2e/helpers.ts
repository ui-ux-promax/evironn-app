import { expect, type Page } from '@playwright/test';
import { phase4Namespace } from './phase4-namespace';

export const E2E_CODE = '424242';
export const E2E_PASSWORD = 'Passw0rd!1';

export const uniqueEmail = (testInfoTitle = 'shared-auth') => `${phase4Namespace(testInfoTitle)}@phase4-e2e.invalid`;

export async function registerAndVerify(page: Page, email = uniqueEmail()): Promise<string> {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': `phase4-e2e:${email}` });
  await page.goto('/register?callbackUrl=%2Fprofile');
  await page.getByLabel('Имя').fill('E2E User');
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('textbox', { name: 'Пароль', exact: true }).fill(E2E_PASSWORD);
  await page.getByLabel('Повторите пароль').fill(E2E_PASSWORD);
  await page.getByRole('checkbox', { name: /демонстрационного сервиса/i }).check();
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page.getByRole('heading', { name: 'Подтвердите почту' })).toBeVisible();
  await page.getByLabel('Код из сообщения').fill(E2E_CODE);
  await page.getByRole('button', { name: 'Подтвердить' }).click();
  await expect(page).toHaveURL(/\/profile/);
  return email;
}

export async function signIn(page: Page, email: string, password = E2E_PASSWORD): Promise<void> {
  await page.goto('/login?callbackUrl=%2Fprofile');
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('textbox', { name: 'Пароль', exact: true }).fill(password);
  await page.getByRole('button', { name: /Войти/i }).click();
  await expect(page).toHaveURL(/\/profile/);
}

export async function expectNoEnabledReviewSubmission(page: Page): Promise<void> {
  const reviewButtons = page.getByRole('button', { name: /оставить отзыв/i });
  await expect(reviewButtons).toHaveCount(0);
}

export async function expectProtectedOrderBoundary(page: Page, foreignOrderNumber?: number): Promise<void> {
  let orderNumber = foreignOrderNumber;
  if (orderNumber === undefined) {
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
    orderNumber = probe.foreignOrderNumber as number;
  }
  const foreignOrderPath = `/orders/${orderNumber}`;
  const authenticatedResponse = await page.goto(foreignOrderPath);
  expect([200, 404]).toContain(authenticatedResponse?.status());
  await expect(page.getByText(`EV-${orderNumber}`, { exact: false })).toHaveCount(0);

  await page.context().clearCookies();
  await page.goto(foreignOrderPath);
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  expect(page.url()).not.toContain(foreignOrderPath);
}

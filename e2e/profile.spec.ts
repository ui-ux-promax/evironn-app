import { expect, test, type Page } from '@playwright/test';
import { E2E_PASSWORD, registerAndVerify, uniqueEmail } from './helpers';

function parseServerActionResult(body: string): { ok: boolean; error?: string } {
  const candidates = body.match(/\{[^{}\r\n]*"ok"\s*:\s*(?:true|false)[^{}\r\n]*\}/g) ?? [];
  for (const candidate of candidates.reverse()) {
    try {
      const result = JSON.parse(candidate) as unknown;
      if (result && typeof result === 'object' && 'ok' in result && typeof result.ok === 'boolean') {
        return result as { ok: boolean; error?: string };
      }
    } catch {
      // Next Flight prefixes action JSON with a stream segment marker.
    }
  }
  throw new Error('Next server-action response did not contain an {ok: boolean} result');
}

async function expectServerActionSuccess(page: Page, action: () => Promise<void>) {
  const responsePromise = page.waitForResponse((response) => {
    const headers = response.request().headers();
    return response.request().method() === 'POST' && Boolean(headers['next-action']);
  });
  await action();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const result = parseServerActionResult(await response.text());
  expect(result).toEqual(expect.objectContaining({ ok: true }));
}

test('protects profile and renders verified account shell', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);

  await registerAndVerify(page);
  await expect(page.getByRole('main', { name: '' })).toHaveClass(/prf/);
  await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Разделы кабинета' })).toBeVisible();
});

test('edits profile, changes password, and signs in again', async ({ page }) => {
  const email = await registerAndVerify(page, uniqueEmail());

  await page.getByRole('button', { name: 'Профиль' }).click();
  await page.getByLabel('Имя и фамилия').fill('E2E Updated');
  await expectServerActionSuccess(page, () => page.getByRole('button', { name: 'Сохранить изменения' }).click());
  await expect(page.getByLabel('E-mail')).toHaveAttribute('readonly', '');

  await page.reload();
  await expect(page).toHaveURL(/\/profile/);
  await page.getByRole('button', { name: 'Профиль' }).click();
  await expect(page.getByLabel('Имя и фамилия')).toHaveValue('E2E Updated');
  await expect(page.locator('.prf__avatar')).toHaveText('EU');

  await page.getByLabel('Текущий пароль').fill(E2E_PASSWORD);
  await page.getByLabel('Новый пароль').fill('NewPassw0rd!2');
  await page.getByLabel('Повторите пароль').fill('NewPassw0rd!2');
  await expectServerActionSuccess(page, () => page.getByRole('button', { name: 'Изменить пароль' }).click());

  await page.getByRole('button', { name: 'Выйти' }).click();
  await page.getByRole('link', { name: 'Войти' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Пароль').fill('NewPassw0rd!2');
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/\/profile/);
});

test('adds, defaults, and deletes owner-scoped addresses', async ({ page }) => {
  await registerAndVerify(page);
  await page.getByRole('button', { name: 'Адреса' }).click();

  const addAddress = async (label: string, street: string) => {
    await page.getByRole('button', { name: 'Добавить' }).click();
    await page.getByLabel('Название').fill(label);
    await page.getByLabel('Город').fill('Москва');
    await page.getByLabel('Улица и дом').fill(street);
    await expectServerActionSuccess(page, () => page.getByRole('button', { name: 'Сохранить адрес' }).click());
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  };

  await addAddress('Дом', 'Ленина, 1');
  await addAddress('Студия', 'Тверская, 10');
  await expectServerActionSuccess(page, () =>
    page.getByRole('button', { name: 'Сделать адрес Студия основным' }).click(),
  );
  const studioCard = page.locator('.prf__address-list article').filter({ hasText: 'Студия' });
  await expect(studioCard.getByText('По умолчанию')).toBeVisible();
  await expectServerActionSuccess(page, () => page.getByRole('button', { name: 'Удалить Студия' }).click());
  await expect(page.getByText('Студия', { exact: true })).toHaveCount(0);
});

test('displays favorites, removes them, and adds canonical SKU to cart', async ({ page }) => {
  await registerAndVerify(page);
  await page.goto('/catalog');
  const firstCard = page.getByTestId('catalog-card').first();
  await expectServerActionSuccess(page, () =>
    firstCard.getByRole('button', { name: /Добавить .* в избранное/ }).click(),
  );

  await page.goto('/profile');
  await page.getByRole('button', { name: 'Избранное' }).click();
  await expect(page.getByRole('button', { name: 'В корзину' }).first()).toBeEnabled();
  const cartResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/api/cart') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'В корзину' }).first().click();
  const cartResponse = await cartResponsePromise;
  expect(cartResponse.status()).toBe(200);
  const cart = (await cartResponse.json()) as { items: unknown[]; totals: { itemCount: number } };
  expect(cart.items.length).toBeGreaterThan(0);
  expect(cart.totals.itemCount).toBeGreaterThan(0);
  await expect(page.getByRole('link', { name: `Корзина (${cart.totals.itemCount})` })).toBeVisible();

  await expectServerActionSuccess(page, () => page.getByRole('button', { name: /Убрать .* из избранного/ }).click());
  await page.reload();
  await page.getByRole('button', { name: 'Избранное' }).click();
  await expect(page.getByText('Избранное пока пусто')).toBeVisible();
});

test('keeps order presentation read-only', async ({ page }) => {
  await registerAndVerify(page);
  await page.getByRole('button', { name: 'Заказы' }).click();
  await expect(page.getByRole('heading', { name: 'Заказы' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Отменить|Повторить|Скачать чек|Оплатить/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Подробнее|К заказу/i })).toHaveCount(0);
});

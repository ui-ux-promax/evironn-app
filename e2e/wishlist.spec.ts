import { expect, test, type Page } from '@playwright/test';
import { registerAndVerify } from './helpers';

async function firstCardHeart(page: Page) {
  return page.getByTestId('catalog-card').first().getByRole('button');
}

test('guest catalog heart persists server state and can be removed', async ({ page }) => {
  await page.goto('/catalog');
  const heart = await firstCardHeart(page);

  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');

  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
});

test('guest wishlist merges through registration and remains persisted after sign-in', async ({ page }) => {
  await page.goto('/catalog');
  const guestHeart = await firstCardHeart(page);
  await guestHeart.click();
  await expect(guestHeart).toHaveAttribute('aria-pressed', 'true');

  await registerAndVerify(page);
  await page.goto('/catalog');

  const accountHeart = await firstCardHeart(page);
  await expect(accountHeart).toHaveAttribute('aria-pressed', 'true');
  await accountHeart.click();
  await expect(accountHeart).toHaveAttribute('aria-pressed', 'false');
});

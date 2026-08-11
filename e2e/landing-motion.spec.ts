import { test, expect } from '@playwright/test';

test('hero navigation resets autoplay timer', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');

  await expect(page.getByTestId('hero-dot-0')).toHaveAttribute('aria-current', 'true');
  await page.getByTestId('hero-next').click();
  await expect(page.getByTestId('hero-dot-1')).toHaveAttribute('aria-current', 'true');

  await page.clock.fastForward(5000);
  await expect(page.getByTestId('hero-dot-1')).toHaveAttribute('aria-current', 'true');
  await page.clock.fastForward(700);
  await expect(page.getByTestId('hero-dot-2')).toHaveAttribute('aria-current', 'true');
});

test('landing reveals content and counts discount once in view', async ({ page }) => {
  await page.goto('/');
  const banner = page.locator('[data-reveal]').last();
  await banner.scrollIntoViewIfNeeded();
  await expect(banner).toHaveClass(/is-visible/);
  await expect(page.getByTestId('discount-counter')).toHaveText('50%');
});

test('reduced motion disables hero and reveal animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const animationName = await page
    .locator('[data-slide-index="0"] img')
    .evaluate((element) => getComputedStyle(element).animationName);
  expect(animationName).toBe('none');
  await expect(page.locator('[data-reveal]').first()).toHaveClass(/is-visible/);
});

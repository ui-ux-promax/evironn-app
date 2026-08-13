import { expect, test } from '@playwright/test';

const showcasePath = '/product/noma-woven-lounge';

test('catalog default renders 12 seeded cards with showcase links', async ({ page }) => {
  await page.goto('/catalog');
  const cards = page.locator('.cat-card');
  await expect(cards).toHaveCount(12);
  await expect(page.locator('.cat-card__frame')).toHaveCount(12);
  await expect(page.locator('.cat-card__frame').first()).toHaveAttribute('href', showcasePath);
  await expect
    .poll(() => page.locator('.cat-card__frame').evaluateAll((links) => links.map((link) => link.getAttribute('href'))))
    .toEqual(Array.from({ length: 12 }, () => showcasePath));
});

test('category, room, and option controls update URL and delete page', async ({ page }) => {
  await page.goto('/catalog?page=2');
  await page
    .locator('.cat-b__desktop-facets')
    .getByRole('button', { name: /Кресла/i })
    .first()
    .click();
  await expect(page).toHaveURL(/category=/);
  await expect(page).not.toHaveURL(/page=/);
  await page.goto('/catalog?page=2');
  await page.getByRole('tab', { name: /Спальня/i }).click();
  await expect(page).toHaveURL(/room=bedroom/);
  await expect(page).not.toHaveURL(/page=/);
  await page.goto('/catalog?page=2');
  await page.locator('.cat-b__desktop-facets .cat-b__swatch-row button').first().click();
  await expect(page).toHaveURL(/option=/);
  await expect(page).not.toHaveURL(/page=/);
});

test('sort control is URL-authoritative and resets page', async ({ page }) => {
  await page.goto('/catalog?page=2');
  await page.getByRole('button', { name: /Цена: по возрастанию/i }).click();
  await expect(page).toHaveURL(/sort=price-asc/);
  await expect(page).not.toHaveURL(/page=/);
});

test('mobile drawer keeps draft local until apply and closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalog?page=2');
  const drawer = page.locator('.cat-b__drawer');
  await page.getByRole('button', { name: /^Фильтры/i }).click();
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');
  await drawer.locator('.cat-b__swatch-row button').first().click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page).not.toHaveURL(/option=/);
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  await page.getByRole('button', { name: /^Фильтры/i }).click();
  await drawer.locator('.cat-b__swatch-row button').first().click();
  await drawer.getByRole('button', { name: /^Показать \d+$/ }).click();
  await expect(page).toHaveURL(/option=/);
  await expect(page).not.toHaveURL(/page=/);
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
});

test('invalid filters render empty state without application error', async ({ page }) => {
  const response = await page.goto('/catalog?category=not-a-category&option=bad-token');
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('.cat-empty')).toBeVisible();
  await expect(page.locator('.cat-card')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Application error');
});

test('out-of-range page stays successful and server-clamped', async ({ page }) => {
  const response = await page.goto('/catalog?page=999');
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('.cat-card')).toHaveCount(12);
  await expect(page.locator('body')).not.toContainText('Application error');
});

test('normal first-page pagination stays successful', async ({ page }) => {
  const response = await page.goto('/catalog?page=1');
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('.cat-card')).toHaveCount(12);
  await expect(page.locator('.cat-pager')).toBeHidden();
});

test('catalog card hover and keyboard focus activate playback with idle fallback', async ({ page }) => {
  await page.goto('/catalog');
  const frame = page.locator('.cat-card__frame').first();
  const video = frame.locator('video');
  await frame.hover();
  await expect(video).toHaveAttribute('src', /forward/);
  await page.mouse.move(0, 0);
  await page.reload();
  await expect(page.locator('.cat-card').first()).toBeVisible();
  const focusedFrame = page.locator('.cat-card__frame').first();
  const focusedVideo = focusedFrame.locator('video');
  await expect(focusedFrame).toBeAttached();
  await expect(focusedFrame).toBeVisible();
  await page.mouse.move(0, 0);
  await expect
    .poll(
      async () => {
        try {
          await focusedFrame.focus();
          return await focusedFrame.evaluate((element) => document.activeElement === element);
        } catch {
          return false;
        }
      },
      { timeout: 5000, intervals: [100, 250, 500] },
    )
    .toBe(true);
  await expect(focusedFrame).toBeFocused();
  await expect(focusedVideo).toHaveAttribute('src', /forward/);
  await focusedVideo.evaluate((element) => {
    element.dispatchEvent(new Event('error'));
  });
  await expect
    .poll(() =>
      focusedFrame.locator('img, canvas, video').evaluateAll((elements) =>
        elements.map((element) => ({
          tag: element.tagName,
          opacity: getComputedStyle(element).opacity,
          active: element.classList.contains('is-visible') || element.classList.contains('is-frame-ready'),
        })),
      ),
    )
    .toEqual([
      { tag: 'IMG', opacity: '1', active: false },
      { tag: 'CANVAS', opacity: '0', active: false },
      { tag: 'VIDEO', opacity: '0', active: false },
    ]);
});

test('reduced motion disables catalog stage, drawer, and indicator transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalog');
  const transitionDurationsAreZero = async (selector: string) => {
    await expect
      .poll(() =>
        page
          .locator(selector)
          .first()
          .evaluate((element) =>
            getComputedStyle(element)
              .transitionDuration.split(',')
              .map((duration) => Number.parseFloat(duration.trim()))
              .every((duration) => Number.isFinite(duration) && duration <= 0.001),
          ),
      )
      .toBe(true);
  };
  await expect
    .poll(() => page.locator('.cat-b__stage-media').evaluate((element) => getComputedStyle(element).animationName))
    .toBe('none');
  await transitionDurationsAreZero('.cat-b__stage-media');
  await transitionDurationsAreZero('.cat-b__seg-indicator');
  await page.getByRole('button', { name: /^Фильтры/i }).click();
  await transitionDurationsAreZero('.cat-b__drawer');
});

import { expect, test } from '@playwright/test';

test('renders the seeded furniture cards with canonical product links', async ({ page }) => {
  await page.goto('/catalog');

  const cards = page.locator('[data-testid="catalog-product-card"]');
  await expect(cards).toHaveCount(12);
  await expect(cards.first().locator('a[href^="/product/"]').first()).toHaveAttribute('href', /\/product\/[a-z0-9-]+/);
});

test('category, room, and option controls update the URL and reset page', async ({ page }) => {
  await page.goto('/catalog?page=2');
  const filters = page.locator('input[type="checkbox"]');

  await filters.nth(0).click();
  await expect(page).toHaveURL(/category=/);
  await expect(page).not.toHaveURL(/page=/);

  await filters.nth(5).click();
  await expect(page).toHaveURL(/room=/);
  await expect(page).not.toHaveURL(/page=/);

  await filters.nth(10).click();
  await expect(page).toHaveURL(/option=/);
  await expect(page).not.toHaveURL(/page=/);
});

test('price and stock query controls narrow the catalog without an error state', async ({ page }) => {
  await page.goto('/catalog');
  const unfilteredCount = await page.locator('[data-testid="catalog-product-card"]').count();

  await page.goto('/catalog?priceFrom=50000&priceTo=180000&inStock=1');

  const filteredCount = await page.locator('[data-testid="catalog-product-card"]').count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(unfilteredCount);
  await expect(page).toHaveURL(/priceFrom=50000/);
  await expect(page).toHaveURL(/priceTo=180000/);
  await expect(page).toHaveURL(/inStock=1/);
});

test('out-of-range page clamps to the seeded first page without an error', async ({ page }) => {
  const response = await page.goto('/catalog?page=999');

  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('[data-testid="catalog-product-card"]')).toHaveCount(12);
  await expect(page.locator('body')).not.toContainText('Application error');
});

test('invalid filters stay non-error with an empty result state', async ({ page }) => {
  const response = await page.goto('/catalog?category=not-a-category&option=bad-token&page=999');

  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(page.locator('[data-testid="catalog-product-card"]')).toHaveCount(0);
});

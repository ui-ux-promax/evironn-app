import { expect, test } from '@playwright/test';

const demoAdminRoutes = [
  '/demo-admin',
  '/demo-admin/catalog',
  '/demo-admin/orders',
  '/demo-admin/customers',
  '/demo-admin/marketing',
];

for (const path of demoAdminRoutes) {
  test(`${path} is public and read-only`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByTestId('demo-readonly-banner')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main button')).toHaveCount(0);
  });
}

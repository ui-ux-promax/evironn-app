import { expect, test } from '@playwright/test';

const demoAdminRoutes = [
  '/demo-admin',
  '/demo-admin/catalog',
  '/demo-admin/orders',
  '/demo-admin/customers',
  '/demo-admin/marketing',
];

const demoRouteExpectations = [
  { path: '/demo-admin', heading: 'Обзор магазина', furnitureText: 'Кресло Forma' },
  { path: '/demo-admin/catalog', heading: 'Мебельный каталог', furnitureText: 'Кресло Forma' },
  { path: '/demo-admin/orders', heading: 'Снимок операций', furnitureText: 'Диван Tact' },
  { path: '/demo-admin/customers', heading: 'Клиентская база', furnitureText: 'Алина Морозова' },
  { path: '/demo-admin/marketing', heading: 'Промокоды', furnitureText: 'FORMA10' },
] as const;

test('Phase 5D demo routes are public read only', async ({ page }) => {
  for (const [index, route] of demoRouteExpectations.entries()) {
    await page.setViewportSize(index % 2 === 0 ? { width: 1440, height: 900 } : { width: 390, height: 844 });
    await page.goto(route.path);

    await expect(page.getByTestId('demo-readonly-banner')).toBeVisible();
    await expect(page.locator('main h1').filter({ hasText: route.heading })).toBeVisible();
    await expect(page.locator('main')).toContainText(route.furnitureText);
    await expect(page.locator('main button')).toHaveCount(0);
    await expect(page.locator('main form, main input, main select, main textarea')).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${route.path} overflows horizontally at ${index % 2 === 0 ? 'desktop' : 'mobile'}`,
    ).toBe(true);
  }
});

for (const path of demoAdminRoutes) {
  test(`${path} is public and read-only`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByTestId('demo-readonly-banner')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main button')).toHaveCount(0);
  });
}

import { expect, test } from '@playwright/test';

const viewports = [
  { name: '390x844', width: 390, height: 844 },
  { name: '820x1180', width: 820, height: 1180 },
  { name: '1440x900', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test.describe(`approved routes at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ['/', '/product']) {
      test(`${route} loads with landmarks and no browser errors`, async ({
        page,
      }) => {
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });
        page.on('pageerror', (error) => pageErrors.push(error.message));

        const response = await page.goto(route, { waitUntil: 'networkidle' });
        expect(response?.ok()).toBeTruthy();
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('h1').first()).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
        expect(consoleErrors).toEqual([]);
        expect(pageErrors).toEqual([]);
      });
    }
  });
}

test.describe('product 360 interaction', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens a modal and exposes an accessible close action', async ({
    page,
  }) => {
    await page.goto('/product', { waitUntil: 'networkidle' });
    const launch = page.getByRole('button', { name: /360/i });
    await expect(launch).toBeVisible();
    await launch.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const close = dialog.getByRole('button', { name: /закрыть|close/i });
    await expect(close).toBeVisible();
    await close.click();
    await expect(dialog).toBeHidden();
  });
});

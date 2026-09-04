import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`preparation keeps media hidden and the current scene stable at ${viewport.width}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
    );
    let releaseLiving!: () => void;
    let releaseKitchen!: () => void;
    const livingGate = new Promise<void>((resolve) => (releaseLiving = resolve));
    const kitchenGate = new Promise<void>((resolve) => (releaseKitchen = resolve));
    await page.route('**/assets/hero/sofa-reverse.*', async (route) => {
      await livingGate;
      await route.continue();
    });
    await page.route('**/assets/hero/kitchen-island-reverse.*', async (route) => {
      await kitchenGate;
      await route.continue();
    });
    const hero = page.locator('#evironn-hero');
    const media = hero.locator('.furni-hero-product-media');
    const assertHiddenMedia = async () => {
      const visible = await media.locator('img,video').evaluateAll((nodes) =>
        nodes
          .filter((node) => {
            const style = getComputedStyle(node);
            return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0;
          })
          .map((node) => node.tagName),
      );
      expect(visible).toEqual([]);
      await expect(hero.locator('.is-incoming, .is-outgoing')).toHaveCount(0);
    };
    try {
      await page.goto('/');
      await expect(media.locator('video')).toHaveCount(3);
      await expect(hero).toHaveAttribute('aria-busy', 'true');
      await assertHiddenMedia();
      await page.screenshot({ path: testInfo.outputPath('living-preparing.png') });
      releaseLiving();
      await expect(hero).toHaveAttribute('aria-busy', 'false');
      const livingPoster = await hero.locator('.is-stable').getAttribute('src');
      await hero.getByRole('button', { name: 'КУХНЯ', exact: true }).click();
      await expect(media.locator('video')).toHaveCount(7);
      await expect(hero).toHaveAttribute('aria-busy', 'true');
      await assertHiddenMedia();
      await expect(hero.locator('.is-stable')).toHaveAttribute('src', livingPoster!);
      const status = hero.getByRole('status', { name: 'Загрузка комнаты…' });
      await expect(status).toHaveText('');
      await expect(status.locator('svg')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('kitchen-preparing.png') });
      releaseKitchen();
      await expect(hero).toHaveAttribute('aria-busy', 'false');
      await expect(hero.locator('.is-incoming, .is-outgoing')).toHaveCount(0);
      await expect(hero.locator('.is-stable')).not.toHaveAttribute('src', livingPoster!);
      await page.screenshot({ path: testInfo.outputPath('kitchen-ready.png') });
    } finally {
      releaseLiving();
      releaseKitchen();
    }
  });
}

import { expect, test } from '@playwright/test';

test('kitchen product card leaves space below room controls', async ({ page }) => {
  await page.setViewportSize({ width: 1646, height: 920 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const kitchen = page.getByRole('button', { name: 'КУХНЯ', exact: true });
  await expect(kitchen).toBeEnabled();
  await kitchen.click();
  const hotspot = page.getByRole('button', { name: 'Смотреть Барный стул Aster', exact: true });
  await expect(hotspot).toBeEnabled();
  await hotspot.click();
  const card = page.getByRole('complementary', { name: 'Барный стул Aster', exact: true });
  await expect(card).toBeVisible();
  await expect
    .poll(async () => {
      const buttonBox = await page.getByRole('group', { name: 'Категория комнаты' }).boundingBox();
      const cardBox = await card.boundingBox();
      return cardBox!.y - buttonBox!.y - buttonBox!.height;
    })
    .toBeGreaterThanOrEqual(16);
});

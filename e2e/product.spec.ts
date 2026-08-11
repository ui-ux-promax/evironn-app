import { test, expect } from '@playwright/test';

const productPath = '/product/noma-woven-lounge';
const canonicalWalnutPath = '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle';

test('PDP: default Noma configuration renders canonical SKU facts and furniture media', async ({ page }) => {
  await page.goto(productPath);

  await expect(page.getByRole('heading', { name: 'Noma Woven Lounge' })).toBeVisible();
  await expect(page.getByText('EV-NWL-OAK')).toBeVisible();
  await expect(page.getByText('124 000 ₽')).toBeVisible();
  await expect(page.getByText('В наличии: 3')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Натуральный дуб' })).toHaveAttribute('aria-current', 'true');
  await expect(page.getByTestId('turntable-fallback')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Noma Woven Lounge' }).first()).toBeVisible();
});

test('PDP: selecting walnut reaches the exact canonical option query and updates the resolved SKU', async ({
  page,
}) => {
  await page.goto(productPath);
  await page.getByRole('link', { name: 'Орех' }).click();

  await expect(page).toHaveURL(new RegExp(`${canonicalWalnutPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await expect(page.getByText('EV-NWL-WAL')).toBeVisible();
  await expect(page.getByText('129 000 ₽')).toBeVisible();
  await expect(page.getByText('В наличии: 2')).toBeVisible();
});

test('PDP: invalid option input falls back to the default active canonical SKU', async ({ page }) => {
  const response = await page.goto(`${productPath}?option=finish:black`);

  expect(response?.status()).toBeLessThan(500);
  await expect(page.getByText('EV-NWL-OAK')).toBeVisible();
  await expect(page.getByText('EV-NWL-WAL')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Орех' })).toHaveAttribute('href', canonicalWalnutPath);
});

test('PDP: failed turntable keeps the static fallback and announces the media error', async ({ page }) => {
  await page.goto(productPath);

  const video = page.getByTestId('turntable-video');
  await expect(video).toHaveAttribute('poster', '/assets/products/03-ivory-lounge-turntable-alpha-poster.png');
  await expect(video).not.toHaveAttribute('autoplay');
  await expect(video).toHaveAttribute('loop', '');
  await expect(page.getByTestId('turntable-poster')).toBeVisible();
  await expect(page.getByTestId('turntable-fallback')).toBeVisible();

  await video.dispatchEvent('error');
  await expect(video).toHaveCount(0);
  await expect(page.getByTestId('turntable-fallback')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('360° недоступен, показано статичное изображение');
});

test('PDP: reduced motion disables looping and leaves the turntable static before opt-in', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(productPath);

  const video = page.getByTestId('turntable-video');
  await expect(video).not.toHaveAttribute('loop');
  await expect(page.getByTestId('turntable-poster')).toBeVisible();
  await expect(page.getByTestId('turntable-fallback')).toBeVisible();
  expect(await video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);

  await context.close();
});

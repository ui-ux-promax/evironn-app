import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Locator, type Page } from '@playwright/test';

const productPath = '/product/noma-woven-lounge';
const defaultCanonicalPath = '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle';
const sceneBackground = '/assets/products/05-graphite-walnut-room-background-fixed.png';
const turntableVideo = '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm';
const turntablePoster = '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png';
const turntableBytes = 28_717_710;
const price = '89 990 ₽';
const oldPrice = '109 990 ₽';
const fallbackStatus = '360° недоступен, показано статичное изображение';

const combinations = [
  ['ivory', 'pine', 'finish%3Aoak%2Cupholstery%3Aivory-boucle', '05-ivory-pine-chair-fixed-alpha.png'],
  ['ivory', 'walnut', 'finish%3Awalnut%2Cupholstery%3Aivory-boucle', '05-ivory-walnut-chair-fixed-alpha.png'],
  ['charcoal', 'pine', 'finish%3Aoak%2Cupholstery%3Agraphite', '05-graphite-pine-chair-fixed-alpha.png'],
  ['charcoal', 'walnut', 'finish%3Awalnut%2Cupholstery%3Agraphite', '05-graphite-walnut-chair-fixed-alpha.png'],
  ['terracotta', 'pine', 'finish%3Aoak%2Cupholstery%3Aterracotta', '05-terracotta-pine-chair-fixed-alpha.png'],
  ['terracotta', 'walnut', 'finish%3Awalnut%2Cupholstery%3Aterracotta', '05-terracotta-walnut-chair-fixed-alpha.png'],
] as const;

const upholsteryLabels = {
  ivory: 'Айвори',
  charcoal: 'Графит',
  terracotta: 'Терракота',
} as const;

const woodLabels = {
  pine: 'Сосна',
  walnut: 'Орех',
} as const;

function productUrl(path: string) {
  return new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

async function gotoProduct(page: Page, path = productPath) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await expect(page.locator('main.product-page')).toBeVisible();
}

async function readCartText(page: Page) {
  return (await page.locator('a[href="/cart"]').first().textContent())?.trim() ?? '';
}

async function waitForVideoOrFallback(page: Page) {
  const video = page.locator('video.product-page__product-media');
  const fallback = page.getByTestId('product-page-360-fallback');
  await expect.poll(async () => (await video.count()) + (await fallback.count()), { timeout: 10000 }).toBe(1);
  return { video, fallback, hasVideo: (await video.count()) === 1 };
}

async function tabUntilFocused(page: Page, target: Locator, label: string) {
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error(`Tab traversal did not reach ${label}`);
}

async function waitForRealVideoMetadata(video: Locator) {
  await video.evaluate((element) => {
    const media = element as HTMLVideoElement;
    return new Promise<void>((resolve, reject) => {
      if (media.readyState >= HTMLMediaElement.HAVE_METADATA && media.duration > 0) {
        resolve();
        return;
      }
      const cleanup = () => {
        media.removeEventListener('loadedmetadata', onMetadata);
        media.removeEventListener('error', onError);
      };
      const onMetadata = () => {
        cleanup();
        if (media.duration > 0) resolve();
        else reject(new Error(`WebM metadata duration invalid: ${media.duration}`));
      };
      const onError = () => {
        cleanup();
        reject(new Error('Browser emitted video error before loadedmetadata'));
      };
      media.addEventListener('loadedmetadata', onMetadata, { once: true });
      media.addEventListener('error', onError, { once: true });
    });
  });
}

test('showcase default redirects to exact canonical scene, panel, and recommendations', async ({ page }) => {
  await gotoProduct(page);

  await expect(page).toHaveURL(productUrl(defaultCanonicalPath));
  await expect(page.locator('.product-page__scene')).toBeVisible();
  await expect(page.locator('.product-page__scene')).toHaveCSS('background-image', new RegExp(sceneBackground));
  await expect(page.locator('.product-page__scene-chair')).toHaveAttribute(
    'src',
    '/assets/products/05-ivory-walnut-chair-fixed-alpha.png',
  );
  await expect(page.locator('.product-page__panel')).toBeVisible();
  await expect(page.locator('.product-page__panel h1')).toHaveText('Кресло Graphite');
  await expect(page.locator('.interactive-furniture')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Также смотрят' })).toBeVisible();
  await expect(page.locator('.interactive-furniture__card')).toHaveCount(5);
  await expect(page.locator('.interactive-furniture__button')).toHaveCount(5);
  await expect(page.locator('.interactive-furniture__button').first()).toHaveAttribute('href', productPath);
});

test('non-showcase product slug redirects to default showcase canonical URL', async ({ page }) => {
  await page.goto('/product/not-a-showcase-product', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(productUrl(defaultCanonicalPath));
  await expect(page.locator('main.product-page')).toBeVisible();
});

test('all six combinations expose server facts, canonical URLs, exact layers, and unchanged cart count', async ({
  page,
}) => {
  await gotoProduct(page);
  const initialCart = await readCartText(page);

  for (const [upholstery, wood, option, chairAsset] of combinations) {
    await gotoProduct(page, defaultCanonicalPath);

    await page.getByRole('button', { name: `Обивка: ${upholsteryLabels[upholstery]}` }).click();
    await page.getByRole('button', { name: `Дерево: ${woodLabels[wood]}` }).click();

    await expect(page).toHaveURL(productUrl(`${productPath}?option=${option}`));
    await expect(page.locator('.product-page__scene-chair')).toHaveAttribute('src', `/assets/products/${chairAsset}`);
    await expect(page.getByRole('button', { name: `Обивка: ${upholsteryLabels[upholstery]}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: `Дерево: ${woodLabels[wood]}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('.product-page__price')).toHaveText(price);
    await expect(page.locator('.product-page__old-price')).toHaveText(oldPrice);
    await expect(page.locator('.product-page__delivery')).toHaveText('В наличии: 3');
    expect(await readCartText(page)).toBe(initialCart);
  }
});

test('desktop 360 supports lock, focus, poster/WebM, drag, playback, Escape, backdrop, and restoration', async ({
  page,
}) => {
  await gotoProduct(page, defaultCanonicalPath);
  await page.evaluate(() => window.scrollTo(0, 240));
  const expectedScrollY = await page.evaluate(() => window.scrollY);

  const launch = page.locator('.product-page__360-launch');
  await launch.focus();
  const mediaResponsePromise = page.waitForResponse((response) => response.url().endsWith(turntableVideo));
  await launch.click();

  const dialog = page.getByRole('dialog');
  const close = page.locator('.product-page__360-close');
  const video = page.locator('video.product-page__product-media');
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await expect(video).toHaveAttribute('src', turntableVideo);
  await expect(video).toHaveAttribute('poster', turntablePoster);
  const mediaResponse = await mediaResponsePromise;
  const mediaStatus = mediaResponse.status();
  expect([200, 206]).toContain(mediaStatus);
  expect(mediaResponse.headers()['content-type']).toContain('video/webm');
  if (mediaStatus === 206) {
    expect(mediaResponse.headers()['content-range']).toMatch(new RegExp(`^bytes \\d+-\\d+/${turntableBytes}$`));
  } else {
    expect((await mediaResponse.body()).byteLength).toBe(turntableBytes);
  }
  await waitForRealVideoMetadata(video);
  await expect(page.locator('.product-page__video-controls button')).toBeEnabled();

  const box = await video.boundingBox();
  expect(box).not.toBeNull();
  const startX = box!.x + box!.width / 2;
  const startY = box!.y + box!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + box!.width / 3, startY);
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
  await expect(page.locator('.product-page__video-controls span').last()).not.toHaveText('0%');
  await page.mouse.up();

  const playback = page.locator('.product-page__video-controls button');
  await playback.click();
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(false);
  await playback.click();
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await page.locator('html').evaluate((element) => getComputedStyle(element).overflow)).not.toContain('hidden');
  expect(await page.locator('body').evaluate((element) => getComputedStyle(element).position)).not.toBe('fixed');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(expectedScrollY);
  await expect(launch).toBeFocused();

  await launch.press('Enter');
  await expect(dialog).toBeVisible();
  await page.locator('.product-page__360-modal-backdrop').click({ position: { x: 2, y: 2 } });
  await expect(dialog).toBeHidden();
  await expect(launch).toBeFocused();
});

test('360 video failure leaves exact static fallback and polite status', async ({ page }) => {
  await gotoProduct(page, defaultCanonicalPath);
  await page.locator('.product-page__360-launch').click();

  const { video, fallback, hasVideo } = await waitForVideoOrFallback(page);

  if (hasVideo) {
    await expect(video).toHaveAttribute('src', turntableVideo);
    await expect(video).toHaveAttribute('poster', turntablePoster);
    await video.dispatchEvent('error');
  }

  await expect(video).toHaveCount(0);
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveAttribute('src', turntablePoster);
  await expect(page.getByRole('status')).toHaveText(fallbackStatus);
});

test('390x844 keeps fixed scene positioning, stacked glass panel, selectors, and usable mobile dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoProduct(page, defaultCanonicalPath);

  await expect(page.locator('.product-page__scene')).toHaveCSS('background-position', '50% 50%');
  await expect(page.locator('.product-page__scene-chair')).toHaveCSS('object-position', '50% 50%');
  await expect(page.locator('.product-page__panel')).toHaveCSS('position', 'relative');
  await expect(page.locator('.product-page__panel')).toBeVisible();
  await expect(page.locator('.product-page__selectors fieldset')).toHaveCount(2);
  await expect(page.locator('.product-page__swatch')).toHaveCount(5);
  await expect(page.locator('.product-page__360-launch')).toBeVisible();

  await page.locator('.product-page__360-launch').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.product-page__360-close')).toBeVisible();
  const closeBox = await page.locator('.product-page__360-close').boundingBox();
  expect(closeBox).not.toBeNull();
  expect(closeBox!.x + closeBox!.width).toBeLessThanOrEqual(390);
  expect(closeBox!.y + closeBox!.height).toBeLessThanOrEqual(844);
});

test('412x844 applies wider-mobile 25% room and chair positioning', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 844 });
  await gotoProduct(page, defaultCanonicalPath);

  await expect(page.locator('.product-page__scene')).toHaveCSS('background-position', '25% 50%');
  await expect(page.locator('.product-page__scene-chair')).toHaveCSS('object-position', '25% 50%');
});

test('reduced motion removes meaningful motion and keeps static media before opt-in', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await gotoProduct(page, defaultCanonicalPath);

  await expect(page.locator('.product-page__scene-chair')).toBeVisible();
  const maxMotionMs = await page.locator('.product-page').evaluate((root) => {
    const parse = (value: string) =>
      value.split(',').map((part) => {
        const trimmed = part.trim();
        return trimmed.endsWith('ms') ? Number.parseFloat(trimmed) : Number.parseFloat(trimmed) * 1000;
      });
    return [...root.querySelectorAll<HTMLElement>('*')].reduce((max, element) => {
      const style = getComputedStyle(element);
      return Math.max(max, ...parse(style.transitionDuration), ...parse(style.animationDuration));
    }, 0);
  });
  expect(maxMotionMs).toBeLessThanOrEqual(1);

  await page.locator('.product-page__360-launch').click();
  const { video, fallback, hasVideo } = await waitForVideoOrFallback(page);
  if (hasVideo) {
    await expect(video).toHaveAttribute('poster', turntablePoster);
    await expect(video).not.toHaveAttribute('autoplay');
    await expect(video).not.toHaveAttribute('loop');
    expect(await video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
  } else {
    await expect(fallback).toHaveAttribute('src', turntablePoster);
    await expect(page.getByRole('status')).toHaveText(fallbackStatus);
  }
  await context.close();
});

test('keyboard reaches product controls and axe finds no critical or serious product violations', async ({ page }) => {
  await gotoProduct(page, defaultCanonicalPath);
  const product = page.locator('.product-page');
  const launch = product.locator('.product-page__360-launch');
  const upholstery = page.getByRole('button', { name: 'Обивка: Айвори' });
  const wood = page.getByRole('button', { name: 'Дерево: Сосна' });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await tabUntilFocused(page, upholstery, 'ivory upholstery selector');
  await tabUntilFocused(page, wood, 'pine wood selector');
  await tabUntilFocused(page, launch, '360 launch');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.product-page__360-close')).toBeFocused();
  const playback = page.locator('.product-page__video-controls button');
  await tabUntilFocused(page, playback, '360 playback');
  await page.keyboard.press('Escape');
  await expect(launch).toBeFocused();

  const accordions = product.locator('.product-page__accordion button');
  for (let index = 0; index < 4; index += 1) {
    await tabUntilFocused(page, accordions.nth(index), `accordion ${index + 1}`);
  }
  await tabUntilFocused(page, product.locator('.product-page__catalog-link'), 'catalog link');
  const recommendations = page.locator('.interactive-furniture__button');
  for (let index = 0; index < 5; index += 1) {
    await tabUntilFocused(page, recommendations.nth(index), `recommendation link ${index + 1}`);
  }

  const results = await new AxeBuilder({ page }).include('.product-page').analyze();
  const seriousOrCritical = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(seriousOrCritical).toEqual([]);
});

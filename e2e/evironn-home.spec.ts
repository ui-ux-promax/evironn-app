import { expect, test } from '@playwright/test';

const homeRoots = [
  'evironn-hero',
  'what-we-do',
  'interactive-furniture',
  'editorial-statement',
  'nature-section',
  'benefits-showcase',
  'our-works-header',
  'instagram-follow',
] as const;

const expectedFooterHrefs = [
  '/catalog',
  '/catalog?category=sofas',
  '/catalog',
  '/catalog',
  '/catalog?room=living',
  '/catalog?room=bedroom',
  '/catalog?room=terrace',
  '/catalog',
  '/catalog',
  '/catalog',
  '/catalog',
  '/catalog',
  '/catalog',
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
  );
});

function collectBrowserErrors(page: import('@playwright/test').Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  return { consoleErrors, pageErrors };
}

async function expectNoBrowserErrors(errors: ReturnType<typeof collectBrowserErrors>) {
  expect(errors.consoleErrors, `console errors: ${errors.consoleErrors.join('\n')}`).toEqual([]);
  expect(errors.pageErrors, `page errors: ${errors.pageErrors.join('\n')}`).toEqual([]);
}

async function finishHeroVideo(page: import('@playwright/test').Page, source: string) {
  const video = page.locator(`video[src="${source}"]`);
  await expect(video).toHaveCount(1);
  await page.evaluate((videoSource) => {
    const element = document.querySelector<HTMLVideoElement>(`video[src="${videoSource}"]`);
    if (!element) throw new Error(`Missing hero transition video: ${videoSource}`);
    setTimeout(() => element.dispatchEvent(new Event('loadeddata')), 0);
  }, source);
  await expect.poll(() => video.evaluate((element) => element.classList.contains('is-visible'))).toBe(true);
  await video.dispatchEvent('ended');
}

async function expectHomeRoots(page: import('@playwright/test').Page) {
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('main#main-content')).toHaveCount(1);
  const roots = page.locator('main#main-content > section');
  await expect(roots).toHaveCount(8);
  await expect
    .poll(() => roots.evaluateAll((sections) => sections.map((section) => section.id || section.className)))
    .toEqual([...homeRoots]);
}

async function tabUntilFocused(
  page: import('@playwright/test').Page,
  target: import('@playwright/test').Locator,
  maximumTabs = 32,
) {
  for (let index = 0; index < maximumTabs; index += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error(
    `Could not reach ${await target.first().evaluate((element) => element.outerHTML)} with Tab traversal`,
  );
}

test.describe('Evironn home desktop', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, isMobile: false, hasTouch: false });

  test('keeps the complete composition, public links, hero return, focus path, and overflow contract', async ({
    page,
  }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.locator('#evironn-header .od-logo')).toBeVisible();
    await expect(page.locator('#evironn-header .od-primary-nav')).toBeVisible();
    await expect(page.locator('#evironn-header')).toHaveCSS('font-family', /Golos Text/);
    await expect.poll(() => page.evaluate(() => document.fonts.check('400 16px "Golos Text"', 'Мебель'))).toBe(true);
    await expect(page.locator('#evironn-header .od-primary-nav a')).toHaveCount(5);
    await expectHomeRoots(page);
    await expect(page.getByRole('contentinfo')).toBeVisible();

    await expect(page.locator('#evironn-header .od-logo-link')).toHaveAttribute('href', '/');
    await expect(page.locator('#evironn-header .od-primary-nav a').first()).toHaveAttribute('href', '/catalog');
    await expect(page.locator('#evironn-hero a[href="/catalog?room=living"]')).toHaveCount(1);
    await expect(page.locator('.furniture-category-section a[href="/catalog?category=sofas"]')).toHaveCount(1);
    await expect(page.locator('.interactive-furniture__button[href="/product/noma-woven-lounge"]')).toHaveCount(5);
    await expect(page.locator('.instagram-follow a[href="/catalog"]')).toHaveCount(22);
    const footerLinks = page.getByRole('contentinfo').locator('a');
    await expect(footerLinks).toHaveCount(expectedFooterHrefs.length);
    await expect
      .poll(() => footerLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href'))))
      .toEqual(expectedFooterHrefs);

    const logoLink = page.locator('#evironn-header .od-logo-link');
    const primaryLink = page.locator('#evironn-header .od-primary-nav a').first();
    await page.keyboard.press('Tab');
    await expect(logoLink).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(primaryLink).toBeFocused();
    await expect.poll(() => primaryLink.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    await page.keyboard.press('Shift+Tab');
    await expect(logoLink).toBeFocused();

    const skipLink = page.locator('a[href="#main-content"]');
    await tabUntilFocused(page, skipLink);
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main-content')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#evironn-hero a[href="/catalog?room=living"]')).toBeFocused();

    await page.locator('#evironn-hero .furni-hero-hotspot-sofa').click();
    await finishHeroVideo(page, '/assets/hero/sofa-forward.mp4');
    await expect(page.locator('#evironn-hero .furni-hero-product__back')).toBeVisible();
    await expect(page.locator('.furni-hero-product__link[href="/product/noma-woven-lounge"]')).toBeVisible();

    await page.locator('#evironn-hero .furni-hero-product__back').click();
    await finishHeroVideo(page, '/assets/hero/sofa-reverse.mp4');
    await expect(page.locator('#evironn-hero .furni-hero-product__back')).toHaveCount(0);
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expectNoBrowserErrors(errors);
  });
});

test.describe('Evironn home mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('keeps the drawer, sections, touch card interaction, footer reachability, and overflow contract', async ({
    page,
  }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.locator('#evironn-header .od-logo')).toBeVisible();
    const menuButton = page.locator('#evironn-header .od-menu-toggle');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await menuButton.tap();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const drawer = page.locator('#evironn-mobile-menu');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer.locator('a')).toHaveCount(8);
    await expect
      .poll(() =>
        drawer
          .locator('a')
          .first()
          .evaluate((element) => element === document.activeElement),
      )
      .toBe(true);
    await expect(page.locator('#evironn-header > .od-header-inner')).toHaveAttribute('inert', '');
    await page.keyboard.press('Shift+Tab');
    await expect
      .poll(() =>
        drawer
          .locator('a')
          .last()
          .evaluate((element) => element === document.activeElement),
      )
      .toBe(true);
    await page.keyboard.press('Tab');
    await expect
      .poll(() =>
        drawer
          .locator('a')
          .first()
          .evaluate((element) => element === document.activeElement),
      )
      .toBe(true);
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(menuButton).toBeFocused();

    await expectHomeRoots(page);
    const firstCard = page.locator('.interactive-furniture__button').first();
    await firstCard.tap();
    await expect(firstCard.locator('..')).toHaveClass(/is-active/);

    const footer = page.getByRole('contentinfo');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expectNoBrowserErrors(errors);
  });
});

test.describe('Evironn home motion and media resilience', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, isMobile: false, hasTouch: false });

  test('keeps static media and usable controls when reduced motion is requested', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await expect
      .poll(() => page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches))
      .toBe(true);
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await page.locator('#evironn-hero .furni-hero-hotspot-sofa').click();
    await expect(page.locator('#evironn-hero .furni-hero-product__back')).toBeVisible();
    await expect(page.locator('#evironn-hero .furni-hero-product-media__asset.is-visible')).toHaveCount(1);
    await expectNoBrowserErrors(errors);
  });

  test('recovers the stable room when a hero transition video fails', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#evironn-hero .furni-hero-hotspot-sofa').click();

    await page.evaluate(() => {
      const video = document.querySelector<HTMLVideoElement>('video[src="/assets/hero/sofa-forward.mp4"]');
      if (!video) throw new Error('Missing hero transition video');
      setTimeout(() => video.dispatchEvent(new Event('error')), 0);
    });

    await expect(page.locator('#evironn-hero .furni-hero-product__back')).toHaveCount(0);
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expectNoBrowserErrors(errors);
  });
});

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
const KNOWN_REDUCED_MOTION_HYDRATION_DIAGNOSTIC =
  "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.";

declare global {
  interface Window {
    __evironnHeroEnded: string[];
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
  );
  await page.addInitScript(() => {
    window.__evironnHeroEnded = [];
    document.addEventListener(
      'ended',
      (event) => {
        if (!(event.target instanceof HTMLVideoElement) || !event.target.closest('#evironn-hero')) return;
        const product = [...event.target.classList]
          .find((name) => name.startsWith('is-product-'))
          ?.slice('is-product-'.length);
        const direction = event.target.dataset.heroDirection;
        if (product && direction && event.target.ended) window.__evironnHeroEnded.push(`${product}:${direction}`);
      },
      true,
    );
  });
});

function collectBrowserErrors(
  page: import('@playwright/test').Page,
  options: { allowReducedMotionHydrationMismatch?: boolean } = {},
) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    const knownDiagnostic =
      options.allowReducedMotionHydrationMismatch && text.includes(KNOWN_REDUCED_MOTION_HYDRATION_DIAGNOSTIC);
    if (!knownDiagnostic) consoleErrors.push(text);
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  return { consoleErrors, pageErrors };
}

async function expectNoBrowserErrors(errors: ReturnType<typeof collectBrowserErrors>) {
  expect(errors.consoleErrors, `console errors: ${errors.consoleErrors.join('\n')}`).toEqual([]);
  expect(errors.pageErrors, `page errors: ${errors.pageErrors.join('\n')}`).toEqual([]);
}

async function finishHeroVideo(
  page: import('@playwright/test').Page,
  product: string,
  direction: 'forward' | 'reverse',
  endedBefore: number,
) {
  const video = page.locator(`#evironn-hero video.is-product-${product}[data-hero-direction="${direction}"]`);
  await expect(video).toHaveCount(1);
  await expect
    .poll(
      () =>
        page.evaluate(({ key }) => window.__evironnHeroEnded.filter((entry) => entry === key).length, {
          key: `${product}:${direction}`,
        }),
      { timeout: 50_000 },
    )
    .toBeGreaterThan(endedBefore);
}

async function heroEndedCount(
  page: import('@playwright/test').Page,
  product: string,
  direction: 'forward' | 'reverse',
) {
  return page.evaluate(
    (key) => window.__evironnHeroEnded.filter((entry) => entry === key).length,
    `${product}:${direction}`,
  );
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
    await expect(page.locator('#evironn-hero')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#evironn-hero video')).toHaveCount(4);

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
    await expect(
      page.locator(
        '.interactive-furniture__button[href="/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle"]',
      ),
    ).toHaveCount(5);
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

    const sofaForwardEnded = await heroEndedCount(page, 'sofa', 'forward');
    await page.locator('#evironn-hero .furni-hero-hotspot-sofa').click();
    await finishHeroVideo(page, 'sofa', 'forward', sofaForwardEnded);
    await expect(page.locator('#evironn-hero .furni-hero-product__back')).toBeVisible();
    await expect(
      page.locator(
        '.furni-hero-product__link[href="/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle"]',
      ),
    ).toBeVisible();

    const sofaReverseEnded = await heroEndedCount(page, 'sofa', 'reverse');
    await page.locator('#evironn-hero .furni-hero-product__back').click();
    await finishHeroVideo(page, 'sofa', 'reverse', sofaReverseEnded);
    await expect(page.locator('#evironn-hero .furni-hero-product__back')).toHaveCount(0);
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expectNoBrowserErrors(errors);
  });

  test('keeps pilot hero room controls scoped once idle media is ready', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    const roomButtons = page.locator('#evironn-hero .seg-control .seg-item');
    await expect(roomButtons).toHaveCount(4);
    // Regression: SSR-loaded idle images finished before hydration, so their onLoad was
    // missed and the pilot living/kitchen pills were stuck disabled and unclickable.
    await expect(roomButtons.nth(0)).toBeEnabled();
    await expect(roomButtons.nth(1)).toBeEnabled();
    await expect(roomButtons.nth(2)).toBeDisabled();
    await expect(roomButtons.nth(3)).toBeDisabled();

    // Clicking a non-active, now-enabled pill must start a room transition.
    await roomButtons.nth(1).click();
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-incoming')).toHaveCount(1);
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
    const errors = collectBrowserErrors(page, { allowReducedMotionHydrationMismatch: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect
      .poll(() => page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches))
      .toBe(true);
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
    await expect(page.locator('#evironn-hero video')).toHaveCount(0);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('#evironn-hero')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#evironn-hero .furni-hero-hotspot-sofa')).toBeEnabled();
    await page.locator('#evironn-hero .furni-hero-hotspot-sofa').click();
    await expect(page.locator('#evironn-hero .furni-hero-product__back')).toBeVisible();
    await expect(page.locator('#evironn-hero .furni-hero-product-media__asset.is-visible')).toHaveCount(1);
    await expectNoBrowserErrors(errors);
  });

  test('recovers the stable room when a hero transition video fails', async ({ page }) => {
    await page.route('**/assets/hero/sofa-forward.webm', (route) => route.abort('failed'));
    await page.route('**/assets/hero/sofa-forward.mp4', (route) => route.abort('failed'));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#evironn-hero .furni-hero-recovery p')).toHaveText(
      'Не удалось загрузить комнату. Повторить загрузку?',
    );
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  });
});

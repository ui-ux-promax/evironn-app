import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  cleanupPhase5Fixture,
  createPhase5Fixture,
  disconnectPhase5Database,
  phase5Namespace,
  readPhase5OrderProbe,
} from './phase5-database';
import { signIn } from './helpers';

const evidenceRoot = '.superpowers/sdd/phase-5d-visual-evidence';
const evidenceDirectory = resolve(process.cwd(), evidenceRoot);
const matrixPath = resolve(process.cwd(), '.superpowers/sdd/phase-5d-visual-matrix.md');

type Sample = {
  key: string;
  routeTemplate: string;
  path: (ids: Record<string, string>) => string;
  fixtureKey?: string;
};

type Evidence = {
  routeTemplate: string;
  resolvedUrl: string;
  fixtureIds: Record<string, string>;
  desktopCapture: string;
  mobileCapture: string;
  overflow: { desktop: boolean; mobile: boolean };
  focusKeyboard: { desktop: string; mobile: string };
  navigation: { expected: string; actual: string };
  consoleErrors: string[];
  cleanup: { allZero: boolean; remainingOwnedRows: Record<string, number> };
};

const samples: readonly Sample[] = [
  { key: '01-admin-dashboard', routeTemplate: '/admin', path: () => '/admin' },
  { key: '02-admin-products', routeTemplate: '/admin/catalog/products', path: () => '/admin/catalog/products' },
  {
    key: '03-admin-product-new',
    routeTemplate: '/admin/catalog/products/new',
    path: () => '/admin/catalog/products/new',
  },
  {
    key: '04-admin-category-edit',
    routeTemplate: '/admin/catalog/categories/{ownedCategoryId}/edit',
    path: (ids) => `/admin/catalog/categories/${ids.categoryId}/edit`,
    fixtureKey: 'categoryId',
  },
  {
    key: '05-admin-option-edit',
    routeTemplate: '/admin/catalog/options/{ownedOptionGroupId}/edit',
    path: (ids) => `/admin/catalog/options/${ids.optionGroupId}/edit`,
    fixtureKey: 'optionGroupId',
  },
  { key: '06-admin-stock', routeTemplate: '/admin/catalog/stock', path: () => '/admin/catalog/stock' },
  {
    key: '07-admin-order-detail',
    routeTemplate: '/admin/orders/{ownedOrderId}',
    path: (ids) => `/admin/orders/${ids.orderId}`,
    fixtureKey: 'orderId',
  },
  {
    key: '08-admin-customer-detail',
    routeTemplate: '/admin/customers/{ownedCustomerId}',
    path: (ids) => `/admin/customers/${ids.customerId}`,
    fixtureKey: 'customerId',
  },
  {
    key: '09-admin-coupon-edit',
    routeTemplate: '/admin/marketing/{ownedCouponId}/edit',
    path: (ids) => `/admin/marketing/${ids.couponId}/edit`,
    fixtureKey: 'couponId',
  },
  { key: '10-demo-dashboard', routeTemplate: '/demo-admin', path: () => '/demo-admin' },
  { key: '11-demo-catalog', routeTemplate: '/demo-admin/catalog', path: () => '/demo-admin/catalog' },
  { key: '12-demo-orders', routeTemplate: '/demo-admin/orders', path: () => '/demo-admin/orders' },
];

async function captureViewport(
  page: Page,
  path: string,
  width: number,
  height: number,
  capturePath: string,
): Promise<{ resolvedUrl: string; overflow: boolean; focusKeyboard: string; consoleErrors: string[] }> {
  const consoleErrors: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => consoleErrors.push(error.message);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  try {
    await page.setViewportSize({ width, height });
    await page.goto(path);
    await expect(page.locator('body')).toBeVisible();
    await page.keyboard.press('Tab');
    const focusKeyboard = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active || active === document.body) return 'Tab did not move focus';
      return `Tab focused ${active.tagName.toLowerCase()}${active.id ? `#${active.id}` : ''}`;
    });
    expect(focusKeyboard).not.toBe('Tab did not move focus');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    await page.screenshot({ path: capturePath, fullPage: true });
    return {
      resolvedUrl: page.url(),
      overflow,
      focusKeyboard,
      consoleErrors: [...new Set(consoleErrors.map((error) => error.split('\n', 1)[0].slice(0, 500)))],
    };
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }
}

test.setTimeout(300_000);

test('Phase 5D captures the approved representative visual matrix', async ({ page }, testInfo) => {
  const namespace = phase5Namespace(testInfo);
  const fixture = await createPhase5Fixture(namespace);
  let orderId: string | null = null;
  let completed = false;
  const createdCaptures: string[] = [];
  const evidence: Evidence[] = [];

  await mkdir(evidenceDirectory, { recursive: true });
  expect(await readdir(evidenceDirectory)).toHaveLength(0);

  try {
    await signIn(page, fixture.customerEmail);
    await page.goto('/checkout');
    await page.getByLabel('Имя и фамилия').fill(`Phase 5 Visual Customer ${namespace}`);
    await page.getByLabel('Телефон').fill('+79991234567');
    await page.getByLabel('E-mail').fill(fixture.customerEmail);
    await page.getByRole('radio', { name: /шоурум/i }).click();
    await page.getByRole('radio', { name: /Шоурум Evironn/ }).click();
    await page.getByRole('radiogroup', { name: 'Дата получения' }).getByRole('radio').first().click();
    await page.getByRole('radio', { name: /При получении/ }).click();
    await page
      .getByRole('button', { name: /Оформить заказ/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/orders\/\d+/);
    const order = await readPhase5OrderProbe(namespace, new URL(page.url()).pathname.split('/').pop() ?? '');
    orderId = order.id;

    await page.context().clearCookies();
    await signIn(page, fixture.adminEmail);

    const ids = {
      categoryId: fixture.categoryId,
      optionGroupId: fixture.optionGroupId,
      orderId,
      customerId: fixture.customerUserId,
      couponId: fixture.couponId,
    };

    for (const sample of samples) {
      const routePath = sample.path(ids);
      const desktopCapture = `${evidenceRoot}/${sample.key}-desktop.png`;
      const mobileCapture = `${evidenceRoot}/${sample.key}-mobile.png`;
      const desktopAbsolute = resolve(process.cwd(), desktopCapture);
      const mobileAbsolute = resolve(process.cwd(), mobileCapture);
      const desktop = await captureViewport(page, routePath, 1440, 900, desktopAbsolute);
      createdCaptures.push(desktopAbsolute);
      const mobile = await captureViewport(page, routePath, 390, 844, mobileAbsolute);
      createdCaptures.push(mobileAbsolute);
      const expectedPath = new URL(routePath, page.url()).pathname;
      expect(new URL(desktop.resolvedUrl).pathname).toBe(expectedPath);
      expect(new URL(mobile.resolvedUrl).pathname).toBe(expectedPath);
      evidence.push({
        routeTemplate: sample.routeTemplate,
        resolvedUrl: desktop.resolvedUrl,
        fixtureIds: sample.fixtureKey ? { [sample.fixtureKey]: ids[sample.fixtureKey] } : {},
        desktopCapture,
        mobileCapture,
        overflow: { desktop: desktop.overflow, mobile: mobile.overflow },
        focusKeyboard: { desktop: desktop.focusKeyboard, mobile: mobile.focusKeyboard },
        navigation: { expected: expectedPath, actual: new URL(desktop.resolvedUrl).pathname },
        consoleErrors: [...desktop.consoleErrors, ...mobile.consoleErrors],
        cleanup: { allZero: false, remainingOwnedRows: {} },
      });
    }
    completed = true;
  } finally {
    const cleanup = await cleanupPhase5Fixture(fixture, orderId ? [orderId] : []);
    expect(cleanup.allZero).toBe(true);
    if (completed) {
      for (const item of evidence) item.cleanup = cleanup;
      await writeFile(
        matrixPath,
        `# Phase 5D representative visual matrix\n\nCaptured at 1440x900 and 390x844 with one owned namespace: \`${namespace}\`.\n\n` +
          '```json\n' +
          JSON.stringify(evidence, null, 2) +
          '\n```\n',
        'utf8',
      );
    } else {
      await Promise.all(createdCaptures.map((capturePath) => unlink(capturePath).catch(() => undefined)));
    }
  }
});

test.afterAll(async () => {
  await disconnectPhase5Database();
});

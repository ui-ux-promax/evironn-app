import { expect, test, type Page } from '@playwright/test';

const PRODUCTS = [
  { room: 'ГОСТИНАЯ', name: 'Диван Linden на два места', id: 'sofa' },
  { room: 'ГОСТИНАЯ', name: 'Плетёное кресло Noma', id: 'chair' },
  { room: 'КУХНЯ', name: 'Обеденный стул Arden', id: 'kitchen-dining' },
  { room: 'КУХНЯ', name: 'Барный стул Aster', id: 'kitchen-island' },
  { room: 'СПАЛЬНЯ', name: 'Кресло Elara Bouclé', id: 'bedroom-chair' },
  { room: 'СПАЛЬНЯ', name: 'Кровать Maren на платформе', id: 'bedroom-bed' },
  { room: 'ТЕРРАСА', name: 'Уличное кресло Sora', id: 'terrace-chair' },
  { room: 'ТЕРРАСА', name: 'Уличный диван Vale', id: 'terrace-sofa' },
] as const;

type LedgerEntry = Readonly<{ sequence: number; kind: 'request' | 'assigned' | 'event'; value: string }>;

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
  );
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.canPlayType;
    Object.defineProperty(window, '__heroVp9Capability', { configurable: true, writable: true, value: 'probably' });
    HTMLMediaElement.prototype.canPlayType = function (mime: string) {
      return mime === 'video/webm; codecs="vp9"'
        ? ((window as Window & { __heroVp9Capability: string }).__heroVp9Capability as CanPlayTypeResult)
        : original.call(this, mime);
    };
  });
});

async function completeRoomSelection(page: Page, room: (typeof PRODUCTS)[number]['room']) {
  const control = page.getByRole('group', { name: 'Категория комнаты' }).getByRole('button', { name: room });
  if ((await control.getAttribute('aria-pressed')) === 'true') return;
  await control.click();
  const incoming = page.locator('#evironn-hero .furni-hero-room-media__image.is-incoming');
  await expect(incoming).toHaveCount(1);
  await incoming.evaluate((element) =>
    element.dispatchEvent(new AnimationEvent('animationend', { animationName: 'hero-room-enter-e2e', bubbles: true })),
  );
  await expect(control).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
}

async function completeVideo(
  page: Page,
  expectedSource: string,
  ledger: LedgerEntry[],
  releaseHeldRequest?: () => void,
) {
  const video = page.locator(`#evironn-hero video[src="${expectedSource}"]`);
  await expect(video).toHaveCount(1);
  expect(await page.locator('#evironn-hero video').count()).toBe(1);
  ledger.push({ sequence: ledger.length + 1, kind: 'assigned', value: expectedSource });
  const eventsPromise = video.evaluate(async (element) => {
    const media = element as HTMLVideoElement;
    media.playbackRate = 16;
    return await new Promise<string[]>((resolve, reject) => {
      const events: string[] = [];
      for (const eventName of ['loadeddata', 'playing'])
        media.addEventListener(eventName, () => {
          media.playbackRate = 16;
          events.push(eventName);
        });
      media.addEventListener('error', () => reject(new Error(`media-error-${media.error?.code ?? 0}`)), { once: true });
      media.addEventListener(
        'ended',
        () => {
          events.push('ended');
          resolve(events);
        },
        { once: true },
      );
      if (media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) events.push('loadeddata');
      if (!media.paused) events.push('playing');
      if (media.ended) resolve([...events, 'ended']);
    });
  });
  releaseHeldRequest?.();
  const events = await eventsPromise;
  expect(events.at(-1)).toBe('ended');
  expect(events).toContain('loadeddata');
  expect(events).toContain('playing');
  for (const event of events)
    ledger.push({ sequence: ledger.length + 1, kind: 'event', value: `${expectedSource}:${event}` });
}

async function runViewport(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  const ledger: LedgerEntry[] = [];
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname;
    if (/^\/assets\/hero\/.+\.(mp4|webm)$/u.test(pathname)) {
      ledger.push({ sequence: ledger.length + 1, kind: 'request', value: pathname });
    }
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#evironn-hero video')).toHaveCount(0);

  let transitionAssertions = 0;
  for (const product of PRODUCTS) {
    await completeRoomSelection(page, product.room);
    await page.getByRole('button', { name: `Смотреть ${product.name}` }).click();
    await completeVideo(page, `/assets/hero/${product.id}-forward.webm`, ledger);
    transitionAssertions += 1;
    await expect(page.getByRole('complementary', { name: product.name })).toBeVisible();
    await page.getByRole('button', { name: 'Назад' }).click();
    await completeVideo(page, `/assets/hero/${product.id}-reverse.webm`, ledger);
    transitionAssertions += 1;
    await expect(page.getByRole('complementary', { name: product.name })).toHaveCount(0);
  }
  expect(transitionAssertions).toBe(16);
  const matrixAssignments = ledger.filter(({ kind }) => kind === 'assigned').map(({ value }) => value);
  for (const product of PRODUCTS) {
    expect(matrixAssignments).toContain(`/assets/hero/${product.id}-forward.webm`);
    expect(matrixAssignments).toContain(`/assets/hero/${product.id}-reverse.webm`);
    expect(matrixAssignments).not.toContain(`/assets/hero/${product.id}-forward.mp4`);
    expect(matrixAssignments).not.toContain(`/assets/hero/${product.id}-reverse.mp4`);
  }

  await completeRoomSelection(page, 'ГОСТИНАЯ');
  let releaseWebmAbort!: () => void;
  let markWebmHeld!: () => void;
  let releaseMp4Continue!: () => void;
  let markMp4ContinueHeld!: () => void;
  const webmAbortGate = new Promise<void>((resolve) => {
    releaseWebmAbort = resolve;
  });
  const webmHeld = new Promise<void>((resolve) => {
    markWebmHeld = resolve;
  });
  const mp4ContinueGate = new Promise<void>((resolve) => {
    releaseMp4Continue = resolve;
  });
  const mp4ContinueHeld = new Promise<void>((resolve) => {
    markMp4ContinueHeld = resolve;
  });
  await page.route('**/assets/hero/sofa-forward.webm', async (route) => {
    markWebmHeld();
    await webmAbortGate;
    await route.abort('failed');
  });
  await page.route('**/assets/hero/sofa-forward.mp4', async (route) => {
    markMp4ContinueHeld();
    await mp4ContinueGate;
    await route.continue();
  });
  await page.getByRole('button', { name: 'Смотреть Диван Linden на два места' }).click();
  await webmHeld;
  const webmSource = '/assets/hero/sofa-forward.webm';
  await expect(page.locator('#evironn-hero video')).toHaveAttribute('src', webmSource);
  ledger.push({ sequence: ledger.length + 1, kind: 'assigned', value: webmSource });
  releaseWebmAbort();
  const mp4Source = '/assets/hero/sofa-forward.mp4';
  await mp4ContinueHeld;
  await expect(page.locator('#evironn-hero video')).toHaveAttribute('src', mp4Source);
  await completeVideo(page, mp4Source, ledger, releaseMp4Continue);
  await expect(page.getByRole('complementary', { name: 'Диван Linden на два места' })).toBeVisible();
  await page.unroute('**/assets/hero/sofa-forward.webm');
  await page.unroute('**/assets/hero/sofa-forward.mp4');
  await page.getByRole('button', { name: 'Назад' }).click();
  await completeVideo(page, '/assets/hero/sofa-reverse.webm', ledger);
  await expect(page.getByRole('complementary', { name: 'Диван Linden на два места' })).toHaveCount(0);

  await page.evaluate(() => {
    (window as Window & { __heroVp9Capability: string }).__heroVp9Capability = '';
  });
  let markMp4Held!: () => void;
  let releaseMp4Abort!: () => void;
  const mp4Held = new Promise<void>((resolve) => {
    markMp4Held = resolve;
  });
  const mp4AbortGate = new Promise<void>((resolve) => {
    releaseMp4Abort = resolve;
  });
  await page.route('**/assets/hero/sofa-forward.mp4', async (route) => {
    markMp4Held();
    await mp4AbortGate;
    await route.abort('failed');
  });
  await page.getByRole('button', { name: 'Смотреть Диван Linden на два места' }).click();
  await mp4Held;
  await expect(page.locator('#evironn-hero video')).toHaveAttribute('src', mp4Source);
  ledger.push({ sequence: ledger.length + 1, kind: 'assigned', value: mp4Source });
  releaseMp4Abort();
  await expect(page.locator('#evironn-hero video')).toHaveCount(0);
  ledger.push({ sequence: ledger.length + 1, kind: 'event', value: `${mp4Source}:error` });
  await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
  await page.unroute('**/assets/hero/sofa-forward.mp4');

  const assigned = ledger.filter(({ kind }) => kind === 'assigned').map(({ value }) => value);
  expect(assigned).toHaveLength(20);
  expect(assigned.slice(0, 16).every((source) => source.endsWith('.webm'))).toBe(true);
  for (const product of PRODUCTS) {
    expect(assigned).toContain(`/assets/hero/${product.id}-forward.webm`);
    expect(assigned).toContain(`/assets/hero/${product.id}-reverse.webm`);
  }
  const expectedBrowserErrors = browserErrors.filter(
    (message) => message === 'Failed to load resource: net::ERR_FAILED',
  );
  expect(browserErrors).toEqual(expectedBrowserErrors);
  expect(expectedBrowserErrors).toHaveLength(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('completes all hero directions and codec fallbacks at desktop 1440x1000', async ({ page }) => {
  await runViewport(page, { width: 1440, height: 1000 });
});

test('completes all hero directions and codec fallbacks at mobile 390x844', async ({ page }) => {
  await runViewport(page, { width: 390, height: 844 });
});

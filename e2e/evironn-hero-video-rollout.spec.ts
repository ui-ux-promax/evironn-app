import { expect, test, type Page } from '@playwright/test';

const LIVING_PRODUCTS = [
  { room: 'ГОСТИНАЯ', name: 'Диван Linden на два места', id: 'sofa' },
  { room: 'ГОСТИНАЯ', name: 'Плетёное кресло Noma', id: 'chair' },
] as const;

const KITCHEN_PRODUCTS = [
  { room: 'КУХНЯ', name: 'Обеденный стул Arden', id: 'kitchen-dining' },
  { room: 'КУХНЯ', name: 'Барный стул Aster', id: 'kitchen-island' },
] as const;

const BEDROOM_PRODUCTS = [
  { room: 'СПАЛЬНЯ', name: 'Кресло Elara Bouclé', id: 'bedroom-chair' },
  { room: 'СПАЛЬНЯ', name: 'Кровать Maren на платформе', id: 'bedroom-bed' },
] as const;

const TERRACE_PRODUCTS = [
  { room: 'ТЕРРАСА', name: 'Уличное кресло Sora', id: 'terrace-chair' },
  { room: 'ТЕРРАСА', name: 'Уличный диван Vale', id: 'terrace-sofa' },
] as const;

const ROOM_GROUPS = [
  { id: 'living-room', label: 'ГОСТИНАЯ', products: LIVING_PRODUCTS },
  { id: 'kitchen', label: 'КУХНЯ', products: KITCHEN_PRODUCTS },
  { id: 'bedroom', label: 'СПАЛЬНЯ', products: BEDROOM_PRODUCTS },
  { id: 'terrace', label: 'ТЕРРАСА', products: TERRACE_PRODUCTS },
] as const;

const ALL_PRODUCTS = ROOM_GROUPS.flatMap(({ products }) => products);
const VIDEO_DIRECTIONS = ['forward', 'reverse'] as const;
const KNOWN_NON_BLOCKING_DIAGNOSTIC = 'Received the string `%s` for the boolean attribute `%s`.';
const browserNetworkByPage = new WeakMap<Page, BrowserNetworkRequest[]>();

type Product = (typeof ALL_PRODUCTS)[number];
type Direction = (typeof VIDEO_DIRECTIONS)[number];
type Viewport = { width: number; height: number; label: string };

type BrowserEvent = Readonly<{
  time: number;
  type: string;
  key: string;
  src: string;
  readyState: number;
  paused: boolean;
  ended: boolean;
}>;

type BrowserNetworkRequest = Readonly<{
  time: number;
  path: string;
  method: string;
  range: string;
  resourceType: string;
}>;

type BrowserInstrumentation = Readonly<{
  events: BrowserEvent[];
  playCalls: Array<{ time: number; key: string; outcome: string }>;
  requests: Array<{ time: number; path: string; method: string; range: string }>;
  responses: Array<{ time: number; path: string; status: number; contentRange: string }>;
  blobs: Array<{ time: number; path: string; size: number }>;
  objectUrls: Array<{ time: number; url: string }>;
  revokedUrls: Array<{ time: number; url: string }>;
  assignments: Array<{ time: number; key: string; src: string }>;
  decodes: Array<{ time: number; path: string }>;
  busy: Array<{ time: number; value: string | null }>;
}>;

type CapturedInstrumentation = BrowserInstrumentation & {
  networkRequests: BrowserNetworkRequest[];
};

declare global {
  interface Window {
    __heroPilot: BrowserInstrumentation & { nodeId: (element: Element) => string };
    __heroVp9Capability: string;
  }
}

test.beforeEach(async ({ page }) => {
  const networkRequests: BrowserNetworkRequest[] = [];
  browserNetworkByPage.set(page, networkRequests);
  page.on('request', (request) => {
    let decoded = request.url();
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // Keep the original URL when a browser request contains malformed escaping.
    }
    if (!/\/assets\/hero\/[^/?#]+\.(?:mp4|webm)(?:$|[?#])/u.test(decoded)) return;
    const headers = request.headers();
    networkRequests.push({
      time: Date.now(),
      path: new URL(request.url()).pathname,
      method: request.method(),
      range: headers.range ?? '',
      resourceType: request.resourceType(),
    });
  });
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
  );
  await page.addInitScript(() => {
    Object.defineProperty(window, '__heroPilot', {
      configurable: true,
      writable: true,
      value: {
        events: [],
        playCalls: [],
        requests: [],
        responses: [],
        blobs: [],
        objectUrls: [],
        revokedUrls: [],
        assignments: [],
        decodes: [],
        busy: [],
        nodeId: () => 'fallback',
      },
    });
  });
  await page.addInitScript(() => {
    const heroVideoAsset = (value: string) => {
      try {
        const path = new URL(value, location.href).pathname;
        return /^\/assets\/hero\/.+\.(?:mp4|webm)$/u.test(path) ? path : '';
      } catch {
        return '';
      }
    };
    const heroImageAsset = (value: string) => {
      try {
        const path = new URL(value, location.href).pathname;
        return /^\/assets\/hero\/.+\.(?:avif|gif|jpe?g|png|webp)$/u.test(path) ? path : '';
      } catch {
        return '';
      }
    };
    const state = {
      events: [] as BrowserEvent[],
      playCalls: [] as BrowserInstrumentation['playCalls'],
      requests: [] as BrowserInstrumentation['requests'],
      responses: [] as BrowserInstrumentation['responses'],
      blobs: [] as BrowserInstrumentation['blobs'],
      objectUrls: [] as BrowserInstrumentation['objectUrls'],
      revokedUrls: [] as BrowserInstrumentation['revokedUrls'],
      assignments: [] as BrowserInstrumentation['assignments'],
      decodes: [] as BrowserInstrumentation['decodes'],
      busy: [] as BrowserInstrumentation['busy'],
    };
    const nodeIds = new WeakMap<Element, string>();
    let nextNodeId = 0;
    const nodeId = (element: Element) => {
      const current = nodeIds.get(element);
      if (current) return current;
      const next = `hero-node-${++nextNodeId}`;
      nodeIds.set(element, next);
      return next;
    };
    const mediaKey = (element: Element) => {
      const product = [...element.classList]
        .find((name) => name.startsWith('is-product-'))
        ?.slice('is-product-'.length);
      return `${product ?? 'unknown'}:${(element as HTMLElement).dataset.heroDirection ?? 'image'}`;
    };
    const recordMediaEvent = (type: string, target: EventTarget | null) => {
      if (!(target instanceof HTMLMediaElement) || !target.closest('#evironn-hero')) return;
      const element = target as HTMLMediaElement;
      state.events.push({
        time: performance.now(),
        type,
        key: mediaKey(element),
        src: element.getAttribute('src') ?? '',
        readyState: element.readyState,
        paused: element.paused,
        ended: element.ended,
      });
    };
    for (const eventName of ['loadedmetadata', 'loadeddata', 'play', 'playing', 'ended', 'error'] as const) {
      document.addEventListener(eventName, (event) => recordMediaEvent(eventName, event.target), true);
    }
    const originalFetch = window.fetch.bind(window);
    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = heroVideoAsset(
        typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString(),
      );
      if (path) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        state.requests.push({
          time: performance.now(),
          path,
          method: init?.method ?? 'GET',
          range: headers.get('range') ?? '',
        });
      }
      const response = await originalFetch(input, init);
      if (path)
        state.responses.push({
          time: performance.now(),
          path,
          status: response.status,
          contentRange: response.headers.get('content-range') ?? '',
        });
      return response;
    }) as typeof window.fetch;
    const originalBlob = Response.prototype.blob;
    Response.prototype.blob = function () {
      const responseUrl = this.url;
      return originalBlob.call(this).then((blob) => {
        const path = heroVideoAsset(responseUrl);
        if (path) state.blobs.push({ time: performance.now(), path, size: blob.size });
        return blob;
      });
    };
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = ((blob: Blob | MediaSource) => {
      const url = originalCreateObjectURL(blob);
      state.objectUrls.push({ time: performance.now(), url });
      return url;
    }) as typeof URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = ((url: string) => {
      state.revokedUrls.push({ time: performance.now(), url });
      return originalRevokeObjectURL(url);
    }) as typeof URL.revokeObjectURL;
    const originalDecode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function () {
      const imageSrc = this.currentSrc || this.src;
      return originalDecode.call(this).then(() => {
        const path = heroImageAsset(imageSrc);
        if (path) state.decodes.push({ time: performance.now(), path });
      });
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (
          record.type === 'attributes' &&
          record.target instanceof HTMLVideoElement &&
          record.attributeName === 'src'
        ) {
          const video = record.target;
          state.assignments.push({
            time: performance.now(),
            key: mediaKey(video),
            src: video.getAttribute('src') ?? '',
          });
        }
        if (
          record.type === 'attributes' &&
          record.target instanceof HTMLElement &&
          record.attributeName === 'aria-busy'
        ) {
          state.busy.push({ time: performance.now(), value: record.target.getAttribute('aria-busy') });
        }
      }
    });
    observer.observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'aria-busy'],
    });
    Object.defineProperty(window, '__heroVp9Capability', { configurable: true, writable: true, value: 'probably' });
    const originalCanPlayType = HTMLMediaElement.prototype.canPlayType;
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const key = mediaKey(this);
      state.playCalls.push({ time: performance.now(), key, outcome: 'called' });
      try {
        const result = originalPlay.call(this);
        void result.then(
          () => state.playCalls.push({ time: performance.now(), key, outcome: 'resolved' }),
          () => state.playCalls.push({ time: performance.now(), key, outcome: 'rejected' }),
        );
        return result;
      } catch (error) {
        state.playCalls.push({ time: performance.now(), key, outcome: 'threw' });
        throw error;
      }
    };
    HTMLMediaElement.prototype.canPlayType = function (mime: string) {
      return mime === 'video/webm; codecs="vp9"' ? window.__heroVp9Capability : originalCanPlayType.call(this, mime);
    };
    Object.defineProperty(window, '__heroPilot', { configurable: true, value: { ...state, nodeId } });
  });
});

async function instrumentation(page: Page): Promise<CapturedInstrumentation> {
  const data = await page.evaluate(() => window.__heroPilot);
  return { ...data, networkRequests: [...(browserNetworkByPage.get(page) ?? [])] };
}

async function attachEvidence(page: Page, label: string) {
  const data = await instrumentation(page);
  await test.info().attach(`hero-${label}-ledger.json`, {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
  await test.info().attach(`hero-${label}.png`, {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
}

async function waitForHeroReady(page: Page, room: (typeof ROOM_GROUPS)[number]['id'] = 'living-room', videoCount = 4) {
  const roomGroup = ROOM_GROUPS.find((candidate) => candidate.id === room);
  if (!roomGroup) throw new Error(`Unknown hero room ${room}`);
  await expect(page.locator('#evironn-hero')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator(`#evironn-hero .furni-hero-hotspot-${roomGroup.products[0].id}`)).toBeEnabled();
  await expect(page.locator('#evironn-hero video')).toHaveCount(videoCount);
}

async function completeRoomSelection(page: Page, room: Product['room']) {
  const control = page.getByRole('group', { name: 'Категория комнаты' }).getByRole('button', { name: room });
  if ((await control.getAttribute('aria-pressed')) === 'true') return;
  await control.click();
  const incoming = page.locator('#evironn-hero .furni-hero-room-media__image.is-incoming');
  await expect(incoming).toHaveCount(1);
  await incoming.evaluate(
    (element) =>
      new Promise<void>((resolve) => {
        if (!element.classList.contains('is-incoming')) return resolve();
        const onEnd = (event: Event) => {
          const animation = event as AnimationEvent;
          if (animation.target === element && animation.animationName.startsWith('hero-room-enter')) resolve();
        };
        element.addEventListener('animationend', onEnd, { once: true });
      }),
  );
  await expect(control).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
}

function videoLocator(page: Page, product: Product['id'], direction: Direction) {
  return page.locator(`#evironn-hero video.is-product-${product}[data-hero-direction="${direction}"]`);
}

async function eventCount(page: Page, key: string, type: string) {
  return page.evaluate(
    ({ eventKey, eventType }) =>
      window.__heroPilot.events.filter((event) => event.key === eventKey && event.type === eventType).length,
    { eventKey: key, eventType: type },
  );
}

async function videoBaseline(page: Page, product: Product['id'], direction: Direction) {
  const key = `${product}:${direction}`;
  return {
    playing: await eventCount(page, key, 'playing'),
    ended: await eventCount(page, key, 'ended'),
  };
}

async function completeVideo(
  page: Page,
  product: Product['id'],
  direction: Direction,
  baseline = { playing: 0, ended: 0 },
) {
  const video = videoLocator(page, product, direction);
  await expect(video).toHaveCount(1);
  const key = `${product}:${direction}`;
  try {
    await expect.poll(() => eventCount(page, key, 'playing'), { timeout: 50_000 }).toBeGreaterThan(baseline.playing);
  } catch (error) {
    const diagnostics = await video.evaluate(
      (element, eventKey) => ({
        readyState: element.readyState,
        networkState: element.networkState,
        duration: element.duration,
        paused: element.paused,
        ended: element.ended,
        error: element.error?.code ?? null,
        src: element.getAttribute('src'),
        className: element.className,
        prototypePlayMatches: Object.getPrototypeOf(element).play === HTMLMediaElement.prototype.play,
        events: window.__heroPilot.events.filter((event) => event.key === eventKey),
        playCalls: window.__heroPilot.playCalls.filter((call) => call.key === eventKey),
        videos: [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].map((video) => ({
          key: `${[...video.classList].find((name) => name.startsWith('is-product-'))?.slice('is-product-'.length) ?? 'unknown'}:${video.dataset.heroDirection ?? 'image'}`,
          readyState: video.readyState,
          paused: video.paused,
          src: video.getAttribute('src'),
          visible: video.classList.contains('is-visible'),
        })),
      }),
      key,
    );
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nvideo=${JSON.stringify(diagnostics)}`);
  }
  await expect.poll(() => eventCount(page, key, 'ended'), { timeout: 50_000 }).toBeGreaterThan(baseline.ended);
  const events = await page.evaluate(
    (eventKey) => window.__heroPilot.events.filter((event) => event.key === eventKey),
    key,
  );
  expect(events.some((event) => event.type === 'playing' && !event.paused)).toBe(true);
  expect(events.some((event) => event.type === 'ended' && event.ended)).toBe(true);
}

async function activateAndComplete(page: Page, product: Product, direction: Direction) {
  const baseline = await videoBaseline(page, product.id, direction);
  await page.getByRole('button', { name: `Смотреть ${product.name}` }).click();
  await completeVideo(page, product.id, direction, baseline);
}

async function returnAndComplete(page: Page, product: Product) {
  const baseline = await videoBaseline(page, product.id, 'reverse');
  await page.getByRole('button', { name: 'Назад' }).click();
  await completeVideo(page, product.id, 'reverse', baseline);
}

async function nodeIdentity(page: Page, product: Product['id'], direction: Direction) {
  return page.evaluate(
    ({ productId, videoDirection }) => {
      const element = document.querySelector<HTMLVideoElement>(
        `#evironn-hero video.is-product-${productId}[data-hero-direction="${videoDirection}"]`,
      );
      if (!element) throw new Error(`Missing video node ${productId}:${videoDirection}`);
      return window.__heroPilot.nodeId(element);
    },
    { productId: product, videoDirection: direction },
  );
}

async function assertNoRoomRequests(page: Page, rooms: readonly string[]) {
  const data = await instrumentation(page);
  const heroPaths = [...data.requests, ...data.networkRequests].map(({ path }) => path);
  for (const room of rooms) expect(heroPaths.some((path) => path.includes(`/assets/hero/${room}-`))).toBe(false);
}

function isRetryRoomPath(path: string) {
  return path.includes('/assets/hero/kitchen-');
}

function assertRetainedResourceLedger(actual: CapturedInstrumentation, baseline: CapturedInstrumentation) {
  expect(actual.blobs.filter(({ path }) => !isRetryRoomPath(path))).toEqual(
    baseline.blobs.filter(({ path }) => !isRetryRoomPath(path)),
  );
  expect(actual.requests.filter(({ path }) => !isRetryRoomPath(path))).toEqual(
    baseline.requests.filter(({ path }) => !isRetryRoomPath(path)),
  );
  expect(actual.networkRequests.filter(({ path }) => !isRetryRoomPath(path))).toEqual(
    baseline.networkRequests.filter(({ path }) => !isRetryRoomPath(path)),
  );
  const retainedObjectUrls = new Set(baseline.objectUrls.map(({ url }) => url));
  expect(actual.revokedUrls.filter(({ url }) => retainedObjectUrls.has(url))).toEqual([]);
  expect(actual.assignments.filter(({ src }) => retainedObjectUrls.has(src))).toEqual(
    baseline.assignments.filter(({ src }) => retainedObjectUrls.has(src)),
  );
}

function assertDecodedImages(data: CapturedInstrumentation, paths: string[]) {
  expect(data.decodes.map(({ path }) => path)).toEqual(expect.arrayContaining(paths));
}

async function runNormalViewport(page: Page, viewport: Viewport) {
  await page.setViewportSize(viewport);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes(KNOWN_NON_BLOCKING_DIAGNOSTIC))
      errors.push(message.text());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForHeroReady(page);
  const beforeAdditionalRooms = await instrumentation(page);
  await assertNoRoomRequests(page, ['kitchen', 'bedroom', 'terrace']);
  expect(beforeAdditionalRooms.objectUrls).toHaveLength(4);
  assertDecodedImages(beforeAdditionalRooms, ['/assets/hero/sofa-focus.webp', '/assets/hero/chair-focus.webp']);

  for (const product of LIVING_PRODUCTS) {
    await activateAndComplete(page, product, 'forward');
    await expect(page.getByRole('complementary', { name: product.name })).toBeVisible();
    await returnAndComplete(page, product);
    await expect(page.getByRole('complementary', { name: product.name })).toHaveCount(0);
  }

  let releaseKitchen!: () => void;
  let kitchenRequest!: () => void;
  const kitchenGate = new Promise<void>((resolve) => (releaseKitchen = resolve));
  const kitchenStarted = new Promise<void>((resolve) => (kitchenRequest = resolve));
  await page.route('**/assets/hero/kitchen-island-reverse.webm', async (route) => {
    kitchenRequest();
    await kitchenGate;
    await route.continue();
  });
  try {
    await page.getByRole('button', { name: 'КУХНЯ' }).click();
    await kitchenStarted;
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-incoming')).toHaveCount(0);
    await expect(page.locator('#evironn-hero')).toHaveAttribute('aria-busy', 'true');
    releaseKitchen();
    await completeRoomSelection(page, 'КУХНЯ');
  } finally {
    releaseKitchen();
    await page.unroute('**/assets/hero/kitchen-island-reverse.webm');
  }
  await waitForHeroReady(page, 'kitchen', 8);
  const afterKitchen = await instrumentation(page);
  expect(afterKitchen.objectUrls).toHaveLength(8);
  expect(
    afterKitchen.requests.map(({ path }) => path).filter((path) => path.includes('/assets/hero/kitchen-')),
  ).toHaveLength(4);
  assertDecodedImages(afterKitchen, [
    '/assets/hero/kitchen-dining-focus.webp',
    '/assets/hero/kitchen-island-focus.webp',
  ]);

  for (const product of KITCHEN_PRODUCTS) {
    await activateAndComplete(page, product, 'forward');
    await expect(page.getByRole('complementary', { name: product.name })).toBeVisible();
    await returnAndComplete(page, product);
    await expect(page.getByRole('complementary', { name: product.name })).toHaveCount(0);
  }

  let releaseBedroom!: () => void;
  let bedroomRequest!: () => void;
  const bedroomGate = new Promise<void>((resolve) => (releaseBedroom = resolve));
  const bedroomStarted = new Promise<void>((resolve) => (bedroomRequest = resolve));
  await page.route('**/assets/hero/bedroom-bed-reverse.webm', async (route) => {
    bedroomRequest();
    await bedroomGate;
    await route.continue();
  });
  try {
    await page.getByRole('button', { name: 'СПАЛЬНЯ' }).click();
    await bedroomStarted;
    await expect(page.locator('#evironn-hero')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#evironn-hero .furni-hero-stack--kitchen')).toHaveCount(1);
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-incoming')).toHaveCount(0);
    releaseBedroom();
    await completeRoomSelection(page, 'СПАЛЬНЯ');
  } finally {
    releaseBedroom();
    await page.unroute('**/assets/hero/bedroom-bed-reverse.webm');
  }
  await waitForHeroReady(page, 'bedroom', 12);
  const afterBedroom = await instrumentation(page);
  expect(afterBedroom.objectUrls).toHaveLength(12);
  expect(
    afterBedroom.requests.map(({ path }) => path).filter((path) => path.includes('/assets/hero/bedroom-')),
  ).toHaveLength(4);
  assertDecodedImages(afterBedroom, ['/assets/hero/bedroom-chair-focus.webp', '/assets/hero/bedroom-bed-focus.webp']);

  for (const product of BEDROOM_PRODUCTS) {
    await activateAndComplete(page, product, 'forward');
    await expect(page.getByRole('complementary', { name: product.name })).toBeVisible();
    await returnAndComplete(page, product);
    await expect(page.getByRole('complementary', { name: product.name })).toHaveCount(0);
  }

  await completeRoomSelection(page, 'ТЕРРАСА');
  await waitForHeroReady(page, 'terrace', 16);
  const afterTerrace = await instrumentation(page);
  expect(afterTerrace.objectUrls).toHaveLength(16);
  expect(
    afterTerrace.requests.map(({ path }) => path).filter((path) => path.includes('/assets/hero/terrace-')),
  ).toHaveLength(4);
  assertDecodedImages(afterTerrace, ['/assets/hero/terrace-chair-focus.webp', '/assets/hero/terrace-sofa-focus.webp']);

  for (const product of TERRACE_PRODUCTS) {
    await activateAndComplete(page, product, 'forward');
    await expect(page.getByRole('complementary', { name: product.name })).toBeVisible();
    await returnAndComplete(page, product);
    await expect(page.getByRole('complementary', { name: product.name })).toHaveCount(0);
  }

  const identities = new Map<string, string>();
  for (const product of ALL_PRODUCTS) {
    for (const direction of VIDEO_DIRECTIONS)
      identities.set(`${product.id}:${direction}`, await nodeIdentity(page, product.id, direction));
  }
  const settled = await instrumentation(page);
  await completeRoomSelection(page, 'ГОСТИНАЯ');
  await activateAndComplete(page, LIVING_PRODUCTS[0], 'forward');
  await returnAndComplete(page, LIVING_PRODUCTS[0]);
  await completeRoomSelection(page, 'КУХНЯ');
  await completeRoomSelection(page, 'СПАЛЬНЯ');
  await completeRoomSelection(page, 'ТЕРРАСА');
  await completeRoomSelection(page, 'ГОСТИНАЯ');
  await expect(page.getByRole('button', { name: 'Смотреть Диван Linden на два места' })).toBeVisible();
  const finalData = await instrumentation(page);
  expect(finalData.requests).toEqual(settled.requests);
  expect(finalData.objectUrls).toEqual(settled.objectUrls);
  expect(finalData.assignments).toEqual(settled.assignments);
  for (const product of ALL_PRODUCTS) {
    for (const direction of VIDEO_DIRECTIONS) {
      expect(await nodeIdentity(page, product.id, direction)).toBe(identities.get(`${product.id}:${direction}`));
    }
  }
  expect(finalData.events.filter(({ type }) => type === 'ended').length).toBeGreaterThanOrEqual(18);
  await attachEvidence(page, `${viewport.label}-normal`);
  expect(errors).toEqual([]);
}

async function runCapabilityCase(page: Page, viewport: Viewport, capability: string) {
  await page.setViewportSize(viewport);
  await page.addInitScript((value) => {
    window.__heroVp9Capability = value;
  }, capability);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForHeroReady(page);
  await expect
    .poll(async () => (await instrumentation(page)).requests.some(({ path }) => path.endsWith('.mp4')))
    .toBe(capability === '');
  const livingPaths = (await instrumentation(page)).networkRequests
    .map(({ path }) => path)
    .filter((path) => path.includes('/assets/hero/'));
  expect(livingPaths.every((path) => path.endsWith(capability === '' ? '.mp4' : '.webm'))).toBe(true);
  for (const room of ROOM_GROUPS.slice(1)) {
    await completeRoomSelection(page, room.label);
    const roomPaths = (await instrumentation(page)).requests
      .map(({ path }) => path)
      .filter((path) => path.includes(`/assets/hero/${room.id}-`));
    expect(roomPaths).toHaveLength(4);
    expect(roomPaths.every((path) => path.endsWith(capability === '' ? '.mp4' : '.webm'))).toBe(true);
  }
  await attachEvidence(page, `${viewport.label}-${capability === '' ? 'mp4' : 'webm'}-capability`);
}

async function runInitialFailureRecovery(page: Page, viewport: Viewport) {
  await page.setViewportSize(viewport);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForHeroReady(page);
  const livingBeforeRetry = await instrumentation(page);
  const retainedEntries = [
    ['chair', 'forward'],
    ['chair', 'reverse'],
    ['sofa', 'forward'],
    ['sofa', 'reverse'],
  ] as const;
  const retainedIdentities = new Map(
    await Promise.all(
      retainedEntries.map(
        async ([product, direction]) =>
          [`${product}:${direction}`, await nodeIdentity(page, product, direction)] as const,
      ),
    ),
  );
  await page.route('**/assets/hero/kitchen-dining-forward.webm', (route) => route.abort('failed'));
  await page.route('**/assets/hero/kitchen-dining-forward.mp4', (route) => route.abort('failed'));
  await page.getByRole('button', { name: 'КУХНЯ' }).click();
  await expect(page.locator('#evironn-hero .furni-hero-recovery p')).toHaveText(
    'Не удалось загрузить комнату. Повторить загрузку?',
  );
  await expect(page.locator('#evironn-hero')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
  const failedBeforeDismissal = await instrumentation(page);
  expect(failedBeforeDismissal.objectUrls).toEqual(livingBeforeRetry.objectUrls);
  assertRetainedResourceLedger(failedBeforeDismissal, livingBeforeRetry);

  // Dismiss the first failure through the retained living room, then start a
  // fresh kitchen attempt before exercising the explicit retry action.
  await page.getByRole('button', { name: 'ГОСТИНАЯ' }).click();
  await expect(page.locator('#evironn-hero .furni-hero-recovery')).toHaveCount(0);
  await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
  const afterDismissal = await instrumentation(page);
  expect(afterDismissal.objectUrls).toEqual(livingBeforeRetry.objectUrls);
  assertRetainedResourceLedger(afterDismissal, livingBeforeRetry);
  await page.getByRole('button', { name: 'КУХНЯ' }).click();
  await expect(page.locator('#evironn-hero .furni-hero-recovery p')).toHaveText(
    'Не удалось загрузить комнату. Повторить загрузку?',
  );
  const failedBeforeRetry = await instrumentation(page);
  expect(failedBeforeRetry.objectUrls).toEqual(livingBeforeRetry.objectUrls);
  assertRetainedResourceLedger(failedBeforeRetry, livingBeforeRetry);
  await page.unroute('**/assets/hero/kitchen-dining-forward.webm');
  await page.unroute('**/assets/hero/kitchen-dining-forward.mp4');
  await page.getByRole('button', { name: 'Повторить' }).click();
  await waitForHeroReady(page, 'kitchen', 8);
  const afterRetry = await instrumentation(page);
  expect(afterRetry.objectUrls).toHaveLength(failedBeforeRetry.objectUrls.length + 4);
  expect(afterRetry.objectUrls.slice(0, failedBeforeRetry.objectUrls.length)).toEqual(failedBeforeRetry.objectUrls);
  assertRetainedResourceLedger(afterRetry, livingBeforeRetry);
  for (const [key, identity] of retainedIdentities) {
    const [product, direction] = key.split(':') as [Product['id'], Direction];
    expect(await nodeIdentity(page, product, direction)).toBe(identity);
  }
  await activateAndComplete(page, KITCHEN_PRODUCTS[0], 'forward');
  await assertNoRoomRequests(page, ['bedroom', 'terrace']);
  await attachEvidence(page, `${viewport.label}-failure-recovery`);
}

async function runNewRoomFailureRecovery(page: Page, viewport: Viewport) {
  await page.setViewportSize(viewport);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForHeroReady(page);
  const livingBeforeBedroom = await instrumentation(page);
  await page.route('**/assets/hero/bedroom-chair-forward.webm', (route) => route.abort('failed'));
  await page.route('**/assets/hero/bedroom-chair-forward.mp4', (route) => route.abort('failed'));
  try {
    await page.getByRole('button', { name: 'СПАЛЬНЯ' }).click();
    await expect(page.locator('#evironn-hero')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#evironn-hero .furni-hero-stack--living-room')).toHaveCount(1);
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-incoming')).toHaveCount(0);
    await expect(page.locator('#evironn-hero .furni-hero-recovery p')).toHaveText(
      'Не удалось загрузить комнату. Повторить загрузку?',
    );
    await expect(page.locator('#evironn-hero')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#evironn-hero .furni-hero-room-media__image.is-stable')).toHaveCount(1);
    const failed = await instrumentation(page);
    expect(failed.objectUrls).toEqual(livingBeforeBedroom.objectUrls);
  } finally {
    await page.unroute('**/assets/hero/bedroom-chair-forward.webm');
    await page.unroute('**/assets/hero/bedroom-chair-forward.mp4');
  }
  await page.getByRole('button', { name: 'Повторить' }).click();
  await waitForHeroReady(page, 'bedroom', 8);
  const afterRetry = await instrumentation(page);
  const bedroomRequests = afterRetry.requests.filter(({ path }) => path.includes('/assets/hero/bedroom-'));
  expect(bedroomRequests).toHaveLength(6);
  expect(bedroomRequests.slice(-4).every(({ path }) => path.endsWith('.webm'))).toBe(true);
  await completeRoomSelection(page, 'СПАЛЬНЯ');
  await activateAndComplete(page, BEDROOM_PRODUCTS[0], 'forward');
  await returnAndComplete(page, BEDROOM_PRODUCTS[0]);
  await assertNoRoomRequests(page, ['terrace']);
  await attachEvidence(page, `${viewport.label}-new-room-failure-recovery`);
}

test('real media rollout at desktop 1440x1000', async ({ page }) => {
  await runNormalViewport(page, { width: 1440, height: 1000, label: 'desktop' });
});

test('real media rollout at mobile 390x844', async ({ page }) => {
  await runNormalViewport(page, { width: 390, height: 844, label: 'mobile' });
});

test('uses MP4 only when VP9 is unsupported at desktop 1440x1000', async ({ page }) => {
  await runCapabilityCase(page, { width: 1440, height: 1000, label: 'desktop' }, '');
});

test('uses WebM when VP9 is supported at mobile 390x844', async ({ page }) => {
  await runCapabilityCase(page, { width: 390, height: 844, label: 'mobile' }, 'probably');
});

test('recovers an initial terminal video failure at desktop 1440x1000', async ({ page }) => {
  await runInitialFailureRecovery(page, { width: 1440, height: 1000, label: 'desktop' });
});

test('recovers a bedroom resource failure after explicit retry at desktop 1440x1000', async ({ page }) => {
  await runNewRoomFailureRecovery(page, { width: 1440, height: 1000, label: 'desktop' });
});

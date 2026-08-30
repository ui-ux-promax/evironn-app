import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const BASELINE_DIR = MODULE_DIR;
const RAW_DIR = join(BASELINE_DIR, 'raw');
const PUBLIC_ORIGIN = 'https://evironn-app.vercel.app';

export const CONDITIONS = Object.freeze({
  host: PUBLIC_ORIGIN,
  viewport: { width: 390, height: 844 },
  runsPerRoute: 3,
  cpuSlowdownMultiplier: 4,
  latencyMs: 150,
  downloadBytesPerSecond: 200000,
  uploadBytesPerSecond: 93750,
  serviceWorkers: 'block',
  waitUntil: 'domcontentloaded',
  observationWindowAfterDomContentLoadedMs: 2500,
  cacheDisabled: true,
  queryCacheBuster: null,
  queryCacheBusterReason: null,
  browser: 'chromium',
});

export const ROUTES = Object.freeze([
  { key: 'home', path: '/', marker: 'Мебель с душой, созданная поколениями' },
  { key: 'catalog', path: '/catalog', marker: 'Мебель под комнату, а не под категорию' },
  {
    key: 'pdp',
    path: '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    marker: 'Кресло Graphite',
  },
]);

export const SAFE_RESPONSE_HEADERS = new Set([
  'cache-control',
  'content-encoding',
  'content-length',
  'content-type',
  'date',
  'server',
  'transfer-encoding',
  'x-matched-path',
  'x-vercel-cache',
  'x-vercel-id',
]);

export const HERO_VIDEO_PATHS = new Set([
  '/assets/hero/sofa-forward.mp4',
  '/assets/hero/sofa-reverse.mp4',
  '/assets/hero/chair-forward.mp4',
  '/assets/hero/chair-reverse.mp4',
  '/assets/hero/kitchen-dining-forward.mp4',
  '/assets/hero/kitchen-dining-reverse.mp4',
  '/assets/hero/kitchen-island-forward.mp4',
  '/assets/hero/kitchen-island-reverse.mp4',
  '/assets/hero/bedroom-chair-forward.mp4',
  '/assets/hero/bedroom-chair-reverse.mp4',
  '/assets/hero/bedroom-bed-forward.mp4',
  '/assets/hero/bedroom-bed-reverse.mp4',
  '/assets/hero/terrace-chair-forward.mp4',
  '/assets/hero/terrace-chair-reverse.mp4',
  '/assets/hero/terrace-sofa-forward.mp4',
  '/assets/hero/terrace-sofa-reverse.mp4',
]);

const GROUP_NAMES = Object.freeze([
  'document',
  'script',
  'stylesheet',
  'font',
  'image',
  'heroProductVideo',
  'otherVideo',
  'other',
]);

const RAW_NAMES = Object.freeze([
  'cold-candidate',
  'home-run-1',
  'home-run-2',
  'home-run-3',
  'catalog-run-1',
  'catalog-run-2',
  'catalog-run-3',
  'pdp-run-1',
  'pdp-run-2',
  'pdp-run-3',
]);

const STATIC_PATHS = Object.freeze([
  'collect-phase-6c.test.mjs',
  'collect-phase-6c.mjs',
  'raw/cold-candidate.json',
  'raw/home-run-1.json',
  'raw/home-run-2.json',
  'raw/home-run-3.json',
  'raw/catalog-run-1.json',
  'raw/catalog-run-2.json',
  'raw/catalog-run-3.json',
  'raw/pdp-run-1.json',
  'raw/pdp-run-2.json',
  'raw/pdp-run-3.json',
  'summary.json',
  'summary.md',
  'decision.md',
]);

const OBSERVATION_REASON = 'observation-window LCP candidate';
const INP_UNAVAILABLE_REASON = 'no interaction is performed by the fixed anonymous navigation protocol';
const FINGERPRINT_INPUT = 'sorted unique same-origin Script/Stylesheet pathnames without query or fragment';

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function unavailable(reason) {
  return { available: false, reason };
}

function metric(value, reason = 'value unavailable from fixed observation') {
  return isFiniteNumber(value) ? { available: true, value } : unavailable(reason);
}

function urlPathname(value) {
  try {
    return new URL(value, PUBLIC_ORIGIN).pathname;
  } catch {
    return null;
  }
}

function isPublicUrl(value) {
  try {
    return new URL(value, PUBLIC_ORIGIN).origin === PUBLIC_ORIGIN;
  } catch {
    return false;
  }
}

export function sanitizePublicUrl(value) {
  if (typeof value !== 'string' || !isPublicUrl(value)) return null;
  const parsed = new URL(value, PUBLIC_ORIGIN);
  parsed.hash = '';
  parsed.searchParams.delete('phase6c_measure');
  return parsed.toString();
}

export function sanitizeHeaders(headers) {
  const safe = {};
  if (!headers || typeof headers !== 'object') return safe;
  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();
    if (SAFE_RESPONSE_HEADERS.has(normalizedKey) && typeof value === 'string') {
      safe[normalizedKey] = value;
    }
  }
  return safe;
}

export function buildNavigationUrl(path, cacheBuster = null) {
  const parsed = new URL(path, PUBLIC_ORIGIN);
  if (cacheBuster !== null) {
    if (
      !cacheBuster ||
      typeof cacheBuster.value !== 'string' ||
      cacheBuster.value.length === 0 ||
      typeof cacheBuster.reason !== 'string' ||
      cacheBuster.reason.trim().length === 0
    ) {
      throw new Error('cache-buster and cache-buster reason must be a non-empty pair');
    }
    parsed.searchParams.set('phase6c_measure', cacheBuster.value);
  }
  return parsed.toString();
}

export function planObservationWindow({ endpoint, now, markerMatchedAt = null }) {
  const expired = isFiniteNumber(endpoint) && isFiniteNumber(now) && now >= endpoint;
  return {
    expired,
    waitMs: expired || !isFiniteNumber(endpoint) || !isFiniteNumber(now) ? 0 : endpoint - now,
    markerMatchedBeforeEndpoint:
      isFiniteNumber(markerMatchedAt) && isFiniteNumber(endpoint) && markerMatchedAt <= endpoint,
  };
}

export function normalizeMarkerObservation(result) {
  return {
    markerMatched: result?.matched === true,
    markerMatchedAt: isFiniteNumber(result?.matchedAt) ? result.matchedAt : null,
  };
}

export function validateObservationContract(observation) {
  const comparable = observation?.comparability?.comparable === true;
  const unavailableSurface =
    observation?.errors?.includes('existing reproducible browser measurement surface unavailable') === true;
  const markerMatched = observation?.document?.markerMatched;
  if (typeof markerMatched !== 'boolean') throw new Error('markerMatched must be boolean');
  if (unavailableSurface) return true;
  const endpoint = observation?.observationEndpoint?.endpointFromNavigationStartMs;
  const markerAt = observation?.observationEndpoint?.markerMatchedAtFromNavigationStartMs;
  if (comparable && !markerMatched) throw new Error('markerMatched must be true for comparable evidence');
  if (comparable && !isFiniteNumber(endpoint)) throw new Error('fixed endpoint must be finite');
  if (comparable && !isFiniteNumber(markerAt)) throw new Error('marker timing must be finite for comparable evidence');
  if (isFiniteNumber(markerAt) && isFiniteNumber(endpoint) && markerAt > endpoint) {
    if (observation.observationEndpoint.markerMatchedBeforeEndpoint !== false || comparable) {
      throw new Error('marker timing is after fixed endpoint');
    }
  }
  if (
    isFiniteNumber(markerAt) &&
    isFiniteNumber(endpoint) &&
    markerAt <= endpoint &&
    observation.observationEndpoint.markerMatchedBeforeEndpoint !== true
  ) {
    throw new Error('marker-before-endpoint predicate disagrees with marker timing');
  }
  return true;
}

function normalizeCacheIdentity(identity) {
  if (identity === null) return { value: null, reason: null };
  if (!identity || typeof identity !== 'object') return { value: undefined, reason: undefined };
  if ('value' in identity || 'reason' in identity) {
    return { value: identity.value ?? null, reason: identity.reason ?? null };
  }
  return {
    value: identity.queryCacheBuster ?? null,
    reason: identity.queryCacheBusterReason ?? null,
  };
}

export function assertComparableCacheIdentity(identities) {
  if (!Array.isArray(identities) || identities.length === 0) {
    throw new Error('cache identity series is empty');
  }
  const normalized = identities.map(normalizeCacheIdentity);
  const first = normalized[0];
  if (typeof first.value === 'undefined' || typeof first.reason === 'undefined') {
    throw new Error('mixed cache identity');
  }
  for (const item of normalized.slice(1)) {
    if (item.value !== first.value || item.reason !== first.reason) {
      throw new Error('mixed cache identity');
    }
  }
  if ((first.value === null) !== (first.reason === null)) {
    throw new Error('mixed cache identity');
  }
  if (first.value !== null && (typeof first.value !== 'string' || typeof first.reason !== 'string')) {
    throw new Error('mixed cache identity');
  }
  return first;
}

export function medianComparable(values) {
  if (!Array.isArray(values) || values.length === 0 || !values.every(isFiniteNumber)) {
    return { available: false, reason: 'median input unavailable' };
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return { available: true, value };
}

export function summarizeSeries(samples) {
  const list = Array.isArray(samples) ? samples : [];
  const unavailableReasons = list
    .map((sample) => sample?.unavailableReason)
    .filter((reason) => typeof reason === 'string');
  if (
    list.length > 0 &&
    list.every(
      (sample) =>
        sample?.valid === false && sample?.comparable === false && sample?.unavailableReason === unavailableReasons[0],
    ) &&
    unavailableReasons.length === list.length
  ) {
    return {
      comparable: false,
      median: { available: false, reason: unavailableReasons[0] },
      values: [],
      reason: unavailableReasons[0],
    };
  }
  const comparableValues = list
    .filter((sample) => sample?.valid === true && sample?.comparable === true)
    .map((sample) => sample.value);
  const median =
    comparableValues.length === list.length
      ? medianComparable(comparableValues)
      : unavailable('incomplete or noisy comparable series');
  return {
    comparable: comparableValues.length === list.length && median.available,
    median,
    values: comparableValues,
    reason: comparableValues.length === list.length ? null : 'incomplete or noisy comparable series',
  };
}

function groupForRequest(url, resourceType, heroVideoPaths) {
  const pathname = urlPathname(url);
  if (pathname && heroVideoPaths.has(pathname)) return 'heroProductVideo';
  const type = typeof resourceType === 'string' ? resourceType.toLowerCase() : '';
  if (type === 'document') return 'document';
  if (type === 'script') return 'script';
  if (type === 'stylesheet') return 'stylesheet';
  if (type === 'font') return 'font';
  if (type === 'image') return 'image';
  if (type === 'media' || type === 'video' || /\.(?:mp4|webm|ogg)(?:$|\?)/i.test(pathname ?? '')) {
    return 'otherVideo';
  }
  return 'other';
}

function emptyGroup() {
  return {
    requestStarts: 0,
    observedBytes: 0,
    completedRequests: 0,
    failedRequests: 0,
    inFlightRequests: 0,
  };
}

export function summarizeRequestLedger(events, { heroVideoPaths = HERO_VIDEO_PATHS } = {}) {
  const requestMap = new Map();
  let requiredCdpFieldsAvailable = true;
  for (const event of Array.isArray(events) ? events : []) {
    const method = event?.method;
    const requestId = event?.requestId;
    if (typeof requestId !== 'string') {
      requiredCdpFieldsAvailable = false;
      continue;
    }
    if (method === 'Network.requestWillBeSent') {
      const url = event.url;
      const resourceType = event.resourceType;
      if (typeof url !== 'string' || typeof resourceType !== 'string') {
        requiredCdpFieldsAvailable = false;
        continue;
      }
      const occurrences = requestMap.get(requestId) ?? [];
      const item = {
        requestId,
        url,
        resourceType,
        group: groupForRequest(url, resourceType, heroVideoPaths),
        chunks: 0,
        hasChunk: false,
        finalBytes: null,
        byteState: 'unknown',
        completed: false,
        failed: false,
      };
      occurrences.push(item);
      requestMap.set(requestId, occurrences);
      continue;
    }
    const occurrences = requestMap.get(requestId);
    const item = occurrences?.[occurrences.length - 1];
    if (!item) {
      requiredCdpFieldsAvailable = false;
      continue;
    }
    if (method === 'Network.dataReceived') {
      if (!isFiniteNumber(event.encodedDataLength)) {
        requiredCdpFieldsAvailable = false;
        item.byteState = 'invalid';
      } else if (item.byteState !== 'invalid') {
        item.chunks += event.encodedDataLength;
        item.hasChunk = true;
        item.byteState = 'partial';
      }
    } else if (method === 'Network.loadingFinished') {
      item.completed = true;
      if (!isFiniteNumber(event.encodedDataLength)) {
        requiredCdpFieldsAvailable = false;
        item.byteState = 'invalid';
      } else {
        item.finalBytes = event.encodedDataLength;
        item.byteState = 'complete';
      }
    } else if (method === 'Network.loadingFailed') {
      item.failed = true;
      if (item.hasChunk && item.byteState !== 'invalid') item.byteState = 'partial';
    }
  }

  const groups = Object.fromEntries(GROUP_NAMES.map((name) => [name, emptyGroup()]));
  const resources = [];
  let byteAccountingComparable = true;
  for (const occurrences of requestMap.values()) {
    for (const item of occurrences) {
      const group = groups[item.group];
      group.requestStarts += 1;
      if (item.completed) group.completedRequests += 1;
      if (item.failed) group.failedRequests += 1;
      if (!item.completed && !item.failed) group.inFlightRequests += 1;
      const bytes = item.byteState === 'complete' ? item.finalBytes : item.byteState === 'partial' ? item.chunks : null;
      if (bytes === null) {
        group.observedBytes = null;
        byteAccountingComparable = false;
      } else if (group.observedBytes !== null) {
        group.observedBytes += bytes;
      }
      const publicUrl = sanitizePublicUrl(item.url);
      if (publicUrl) {
        resources.push({
          url: publicUrl,
          pathname: urlPathname(publicUrl),
          resourceType: item.resourceType,
          group: item.group,
        });
      }
    }
  }

  const initialHeroVideos = {
    requestStarts: groups.heroProductVideo.requestStarts,
    observedBytes: groups.heroProductVideo.observedBytes,
    completedRequests: groups.heroProductVideo.completedRequests,
    failedRequests: groups.heroProductVideo.failedRequests,
    inFlightRequests: groups.heroProductVideo.inFlightRequests,
    urls: [...requestMap.values()]
      .flat()
      .filter((item) => heroVideoPaths.has(urlPathname(item.url)))
      .map((item) => sanitizePublicUrl(item.url))
      .filter(Boolean),
  };

  return {
    requiredCdpFieldsAvailable,
    byteAccountingComparable: requiredCdpFieldsAvailable && byteAccountingComparable,
    groups,
    resources,
    initialHeroVideos,
  };
}

export function deriveDeploymentIdentity(resources, publicBuildId = null) {
  const pathnames = [
    ...new Set(
      (Array.isArray(resources) ? resources : [])
        .filter(
          (resource) =>
            resource?.type === 'Script' ||
            resource?.resourceType === 'Script' ||
            resource?.type === 'Stylesheet' ||
            resource?.resourceType === 'Stylesheet',
        )
        .map((resource) => resource.url)
        .filter((url) => typeof url === 'string' && isPublicUrl(url))
        .map(urlPathname)
        .filter(Boolean),
    ),
  ].sort();
  const value = createHash('sha256').update(pathnames.join('\n')).digest('hex');
  const platformBuildId =
    typeof publicBuildId === 'string' && publicBuildId.length > 0
      ? { available: true, value: publicBuildId }
      : { available: false, value: null, reason: 'public build identifier not exposed' };
  return {
    platformBuildId,
    resourceFingerprint: {
      available: true,
      algorithm: 'sha256',
      input: FINGERPRINT_INPUT,
      value,
    },
  };
}

function makeObserverInitScript() {
  return () => {
    const state = {
      fcp: null,
      lcp: [],
      layoutShifts: [],
      longTasks: [],
    };
    window.__phase6cPerformance = state;
    const observe = (type, callback) => {
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) callback(entry);
        }).observe({ type, buffered: true });
      } catch {
        // Browser support is represented by unavailable metrics at read time.
      }
    };
    observe('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') state.fcp = entry.startTime;
    });
    observe('largest-contentful-paint', (entry) => {
      state.lcp.push({
        startTime: entry.startTime,
        url: entry.url || null,
        tagName: entry.element?.tagName || null,
      });
    });
    observe('layout-shift', (entry) => {
      state.layoutShifts.push({ value: entry.value, hadRecentInput: entry.hadRecentInput });
    });
    observe('longtask', (entry) => {
      state.longTasks.push({ duration: entry.duration });
    });
  };
}

function extractPublicBuildId(resources) {
  const matches = (Array.isArray(resources) ? resources : [])
    .map((resource) => urlPathname(resource.url))
    .filter(Boolean)
    .map((pathname) => pathname.match(/^\/_next\/static\/([^/]+)\/(?:_buildManifest|_ssgManifest)\.js$/)?.[1])
    .filter(Boolean);
  return matches.length > 0 && new Set(matches).size === 1 ? matches[0] : null;
}

function createUnavailableObservation(name, route, reason, packageVersion = null, browserVersion = null) {
  const identity = { queryCacheBuster: null, queryCacheBusterReason: null };
  return {
    schemaVersion: 1,
    label: name,
    classification: name === 'cold-candidate' ? 'cold candidate' : 'repeat',
    capturedAtUtc: new Date().toISOString(),
    conditions: {
      ...CONDITIONS,
      playwrightPackageVersion: packageVersion,
      browserVersion,
      queryCacheBuster: identity.queryCacheBuster,
      queryCacheBusterReason: identity.queryCacheBusterReason,
    },
    deploymentIdentity: deriveDeploymentIdentity([], null),
    route: {
      key: route.key,
      requestedPath: route.path,
      finalPublicUrlWithoutCacheBuster: buildNavigationUrl(route.path),
    },
    document: {
      status: null,
      markerMatched: false,
      readyState: null,
      readyStateInformationalOnly: true,
      safeHeaders: {},
    },
    observationEndpoint: {
      basis: 'domContentLoadedEventEnd',
      windowMs: CONDITIONS.observationWindowAfterDomContentLoadedMs,
      endpointFromNavigationStartMs: null,
      actualReadFromNavigationStartMs: null,
      markerMatchedAtFromNavigationStartMs: null,
      markerMatchedBeforeEndpoint: false,
      fixedWindowCompleted: false,
    },
    comparability: {
      httpStatus200: false,
      markerMatchedBeforeEndpoint: false,
      fixedWindowCompleted: false,
      requiredTimingFieldsAvailable: false,
      requiredCdpFieldsAvailable: false,
      playwrightAndBrowserVersionsMatchSeries: false,
      comparable: false,
      reason,
    },
    metrics: {
      ttfbMs: unavailable(reason),
      fcpMs: unavailable(reason),
      lcpObservationWindowCandidateMs: unavailable(reason),
      cls: unavailable(reason),
      tbtMs: unavailable(reason),
      inpMs: unavailable(INP_UNAVAILABLE_REASON),
      observedBytes: unavailable(reason),
      requestStarts: unavailable(reason),
    },
    lcpOwner: unavailable(reason),
    dom: { images: 0, videos: 0, scripts: 0, stylesheets: 0, preloads: 0 },
    initialHeroVideos: {
      requestStarts: 0,
      observedBytes: null,
      completedRequests: 0,
      failedRequests: 0,
      inFlightRequests: 0,
      urls: [],
    },
    resourceGroups: Object.fromEntries(GROUP_NAMES.map((group) => [group, emptyGroup()])),
    resources: [],
    byteAccountingComparable: false,
    errors: [reason],
  };
}

async function loadPlaywright() {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const packageVersion = require('@playwright/test/package.json').version;
  const { chromium } = await import('@playwright/test');
  return { chromium, packageVersion };
}

async function captureObservation(name, route, cacheBuster) {
  const { chromium, packageVersion } = await loadPlaywright();
  let browser;
  let context;
  try {
    browser = await chromium.launch();
    const browserVersion = browser.version();
    context = await browser.newContext({
      viewport: CONDITIONS.viewport,
      serviceWorkers: CONDITIONS.serviceWorkers,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const events = [];
    cdp.on('Network.requestWillBeSent', (event) => {
      events.push({
        method: 'Network.requestWillBeSent',
        requestId: event.requestId,
        url: event.request?.url,
        resourceType: event.type,
      });
    });
    cdp.on('Network.dataReceived', (event) => {
      events.push({
        method: 'Network.dataReceived',
        requestId: event.requestId,
        encodedDataLength: event.encodedDataLength,
      });
    });
    cdp.on('Network.loadingFinished', (event) => {
      events.push({
        method: 'Network.loadingFinished',
        requestId: event.requestId,
        encodedDataLength: event.encodedDataLength,
      });
    });
    cdp.on('Network.loadingFailed', (event) => {
      events.push({ method: 'Network.loadingFailed', requestId: event.requestId });
    });
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: CONDITIONS.latencyMs,
      downloadThroughput: CONDITIONS.downloadBytesPerSecond,
      uploadThroughput: CONDITIONS.uploadBytesPerSecond,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CONDITIONS.cpuSlowdownMultiplier });
    await page.addInitScript(makeObserverInitScript());

    const navigationUrl = buildNavigationUrl(route.path, cacheBuster);
    let response = null;
    const errors = [];
    try {
      response = await page.goto(navigationUrl, {
        waitUntil: CONDITIONS.waitUntil,
        timeout: 30000,
      });
    } catch {
      errors.push('NAVIGATION_FAILED');
    }

    const dclTiming = await page
      .evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoadedEventEnd: navigation?.domContentLoadedEventEnd,
          now: performance.now(),
        };
      })
      .catch(() => ({ domContentLoadedEventEnd: null, now: null }));
    const endpoint = isFiniteNumber(dclTiming.domContentLoadedEventEnd)
      ? dclTiming.domContentLoadedEventEnd + CONDITIONS.observationWindowAfterDomContentLoadedMs
      : null;
    let markerMatched = false;
    let markerMatchedAt = null;
    let fixedWindowCompleted = false;
    if (endpoint !== null && isFiniteNumber(dclTiming.now)) {
      const initialWindow = planObservationWindow({ endpoint, now: dclTiming.now });
      if (initialWindow.expired) {
        const markerResult = await page
          .evaluate((expected) => {
            const matched = [...document.querySelectorAll('h1')].some((heading) =>
              heading.textContent?.includes(expected),
            );
            return { matched, matchedAt: matched ? performance.now() : null };
          }, route.marker)
          .catch(() => null);
        ({ markerMatched, markerMatchedAt } = normalizeMarkerObservation(markerResult));
      } else {
        try {
          const markerHandle = await page.waitForFunction(
            (expected) => {
              const matched = [...document.querySelectorAll('h1')].some((heading) =>
                heading.textContent?.includes(expected),
              );
              return { matched, matchedAt: matched ? performance.now() : null };
            },
            route.marker,
            { timeout: initialWindow.waitMs, polling: 50 },
          );
          const markerResult = await markerHandle.jsonValue();
          await markerHandle.dispose();
          ({ markerMatched, markerMatchedAt } = normalizeMarkerObservation(markerResult));
        } catch {
          markerMatched = false;
          markerMatchedAt = null;
        }
        const afterMarker = await page.evaluate(() => performance.now()).catch(() => endpoint);
        const remainingWindow = planObservationWindow({ endpoint, now: afterMarker });
        if (!remainingWindow.expired && remainingWindow.waitMs > 0) {
          await page.waitForTimeout(remainingWindow.waitMs);
        }
      }
      fixedWindowCompleted = true;
    }

    const pageState = await page
      .evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const state = window.__phase6cPerformance ?? {};
        const lcp = Array.isArray(state.lcp) && state.lcp.length > 0 ? state.lcp[state.lcp.length - 1] : null;
        return {
          actualRead: performance.now(),
          navigation: navigation
            ? {
                requestStart: navigation.requestStart,
                responseStart: navigation.responseStart,
                domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
              }
            : null,
          readyState: document.readyState,
          fcp: state.fcp,
          lcp,
          cls: Array.isArray(state.layoutShifts)
            ? state.layoutShifts.reduce((total, entry) => total + (entry.hadRecentInput === false ? entry.value : 0), 0)
            : null,
          tbtMs: Array.isArray(state.longTasks)
            ? state.longTasks.reduce((total, entry) => total + Math.max(0, entry.duration - 50), 0)
            : null,
          dom: {
            images: document.images.length,
            videos: document.querySelectorAll('video').length,
            scripts: document.scripts.length,
            stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
            preloads: document.querySelectorAll('link[rel="preload"]').length,
          },
        };
      })
      .catch(() => ({
        actualRead: null,
        navigation: null,
        readyState: null,
        fcp: null,
        lcp: null,
        cls: null,
        tbtMs: null,
        dom: null,
      }));

    const documentStatus = response?.status() ?? null;
    const safeHeaders = sanitizeHeaders(response ? await response.allHeaders() : {});
    const ledger = summarizeRequestLedger(events, { heroVideoPaths: HERO_VIDEO_PATHS });
    const publicBuildId = extractPublicBuildId(ledger.resources);
    const deploymentIdentity = deriveDeploymentIdentity(ledger.resources, publicBuildId);
    const requiredTimingFieldsAvailable =
      isFiniteNumber(pageState.navigation?.requestStart) &&
      isFiniteNumber(pageState.navigation?.responseStart) &&
      isFiniteNumber(pageState.navigation?.domContentLoadedEventEnd) &&
      endpoint !== null;
    const markerMatchedBeforeEndpoint =
      markerMatched &&
      planObservationWindow({ endpoint, now: pageState.actualRead, markerMatchedAt }).markerMatchedBeforeEndpoint;
    const lcpOwner = pageState.lcp
      ? {
          available: true,
          tagName: pageState.lcp.tagName,
          selector: pageState.lcp.tagName ? pageState.lcp.tagName.toLowerCase() : null,
          resourceUrl: sanitizePublicUrl(pageState.lcp.url),
        }
      : unavailable('no LCP entry observed before fixed endpoint');
    const comparable =
      documentStatus === 200 &&
      markerMatchedBeforeEndpoint &&
      fixedWindowCompleted &&
      requiredTimingFieldsAvailable &&
      ledger.requiredCdpFieldsAvailable;
    if (documentStatus !== 200) errors.push('HTTP_STATUS_NOT_200');
    if (!markerMatchedBeforeEndpoint) errors.push('ROUTE_MARKER_NOT_BEFORE_ENDPOINT');
    if (!fixedWindowCompleted) errors.push('FIXED_WINDOW_NOT_COMPLETED');
    if (!requiredTimingFieldsAvailable) errors.push('NAVIGATION_TIMING_UNAVAILABLE');
    if (!ledger.requiredCdpFieldsAvailable) errors.push('CDP_FIELDS_UNAVAILABLE');
    const totalObservedBytes = Object.values(ledger.groups).every((group) => isFiniteNumber(group.observedBytes))
      ? Object.values(ledger.groups).reduce((total, group) => total + group.observedBytes, 0)
      : null;
    const totalRequestStarts = Object.values(ledger.groups).reduce((total, group) => total + group.requestStarts, 0);
    return {
      schemaVersion: 1,
      label: name,
      classification: name === 'cold-candidate' ? 'cold candidate' : 'repeat',
      capturedAtUtc: new Date().toISOString(),
      conditions: {
        ...CONDITIONS,
        playwrightPackageVersion: packageVersion,
        browserVersion,
        queryCacheBuster: cacheBuster?.value ?? null,
        queryCacheBusterReason: cacheBuster?.reason ?? null,
      },
      deploymentIdentity,
      route: {
        key: route.key,
        requestedPath: route.path,
        finalPublicUrlWithoutCacheBuster: sanitizePublicUrl(navigationUrl),
      },
      document: {
        status: documentStatus,
        markerMatched,
        readyState: pageState.readyState,
        readyStateInformationalOnly: true,
        safeHeaders,
      },
      observationEndpoint: {
        basis: 'domContentLoadedEventEnd',
        windowMs: CONDITIONS.observationWindowAfterDomContentLoadedMs,
        endpointFromNavigationStartMs: endpoint,
        actualReadFromNavigationStartMs: pageState.actualRead,
        markerMatchedAtFromNavigationStartMs: markerMatchedAt,
        markerMatchedBeforeEndpoint,
        fixedWindowCompleted,
      },
      comparability: {
        httpStatus200: documentStatus === 200,
        markerMatchedBeforeEndpoint,
        fixedWindowCompleted,
        requiredTimingFieldsAvailable,
        requiredCdpFieldsAvailable: ledger.requiredCdpFieldsAvailable,
        playwrightAndBrowserVersionsMatchSeries: true,
        comparable,
        reason: comparable ? null : (errors[0] ?? 'observation not comparable'),
      },
      byteAccountingComparable: ledger.byteAccountingComparable,
      metrics: {
        ttfbMs: metric(
          pageState.navigation?.responseStart - pageState.navigation?.requestStart,
          'TTFB unavailable from Navigation Timing',
        ),
        fcpMs: metric(pageState.fcp, 'FCP unavailable from PerformanceObserver'),
        lcpObservationWindowCandidateMs: pageState.lcp
          ? {
              ...metric(pageState.lcp.startTime, 'LCP unavailable from PerformanceObserver'),
              windowBasis: 'domContentLoadedEventEnd',
              windowMs: CONDITIONS.observationWindowAfterDomContentLoadedMs,
              endpointFromNavigationStartMs: endpoint,
              label: OBSERVATION_REASON,
            }
          : unavailable('LCP unavailable from PerformanceObserver'),
        cls: metric(pageState.cls, 'CLS unavailable from PerformanceObserver'),
        tbtMs: metric(pageState.tbtMs, 'TBT unavailable from PerformanceObserver'),
        inpMs: unavailable(INP_UNAVAILABLE_REASON),
        observedBytes: metric(totalObservedBytes, 'encoded byte accounting unavailable or incomparable'),
        requestStarts: metric(totalRequestStarts),
      },
      lcpOwner,
      dom: pageState.dom ?? { images: 0, videos: 0, scripts: 0, stylesheets: 0, preloads: 0 },
      initialHeroVideos: ledger.initialHeroVideos,
      resourceGroups: ledger.groups,
      resources: ledger.resources,
      errors,
    };
  } finally {
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
  }
}

function writeAtomic(relativeName, value) {
  const target = resolve(BASELINE_DIR, relativeName);
  if (!target.startsWith(resolve(BASELINE_DIR))) throw new Error('output path outside baseline directory');
  const temp = `${target}.tmp`;
  writeFileSync(temp, value, 'utf8');
  renameSync(temp, target);
}

function writeJson(relativeName, value) {
  writeAtomic(relativeName, `${JSON.stringify(value, null, 2)}\n`);
}

function rawRelativeName(name) {
  if (!RAW_NAMES.includes(name)) throw new Error(`unknown raw observation: ${name}`);
  return `raw/${name}.json`;
}

function readRaw(name) {
  return JSON.parse(readFileSync(join(RAW_DIR, `${name}.json`), 'utf8'));
}

function allRaw() {
  return RAW_NAMES.map(readRaw);
}

function identityForObservation(observation) {
  return {
    value: observation.conditions?.queryCacheBuster ?? null,
    reason: observation.conditions?.queryCacheBusterReason ?? null,
  };
}

function versionForObservation(observation) {
  return `${observation.conditions?.playwrightPackageVersion ?? ''}\u0000${observation.conditions?.browserVersion ?? ''}`;
}

function fingerprintForObservation(observation) {
  return observation.deploymentIdentity?.resourceFingerprint?.available
    ? observation.deploymentIdentity.resourceFingerprint.value
    : null;
}

function fingerprintConsistency(observations) {
  const available = observations.map(fingerprintForObservation).filter(Boolean);
  if (available.length === 0) {
    return { available: false, consistent: false, reason: 'resource fingerprint unavailable' };
  }
  const consistent = new Set(available).size === 1;
  return {
    available: true,
    consistent,
    reason: consistent ? null : 'available resource fingerprints differ',
  };
}

function observationComparable(observation, { versionsMatch, cacheIdentityMatch, fingerprintMatch }) {
  const base = observation.comparability ?? {};
  const comparable =
    base.httpStatus200 &&
    base.markerMatchedBeforeEndpoint &&
    base.fixedWindowCompleted &&
    base.requiredTimingFieldsAvailable &&
    base.requiredCdpFieldsAvailable &&
    versionsMatch &&
    cacheIdentityMatch &&
    fingerprintMatch;
  const reasons = [];
  if (!base.httpStatus200) reasons.push('HTTP status was not 200');
  if (!base.markerMatchedBeforeEndpoint) reasons.push('route marker was not observed before endpoint');
  if (!base.fixedWindowCompleted) reasons.push('fixed observation window did not complete');
  if (!base.requiredTimingFieldsAvailable) reasons.push('required Navigation Timing fields unavailable');
  if (!base.requiredCdpFieldsAvailable) reasons.push('required CDP fields unavailable');
  if (!versionsMatch) reasons.push('Playwright/browser version mismatch across observations');
  if (!cacheIdentityMatch) reasons.push('mixed cache identity across observations');
  if (!fingerprintMatch) reasons.push('available resource fingerprints differ');
  return {
    ...base,
    playwrightAndBrowserVersionsMatchSeries: versionsMatch,
    comparable,
    reason: comparable ? null : reasons.join('; '),
  };
}

function getMetricValue(observation, key) {
  const item = observation.metrics?.[key];
  return item?.available === true && isFiniteNumber(item.value) ? item.value : null;
}

function routeSeriesSummary(observations, versionsMatch, cacheIdentityMatch) {
  const fingerprints = fingerprintConsistency(observations);
  const runs = observations.map((observation) => ({
    ...observation,
    comparability: observationComparable(observation, {
      versionsMatch,
      cacheIdentityMatch,
      fingerprintMatch: fingerprints.consistent,
    }),
  }));
  const metricKeys = [
    ['ttfbMs', 'ttfbMs'],
    ['fcpMs', 'fcpMs'],
    ['lcpObservationWindowCandidateMs', 'lcpObservationWindowCandidateMs'],
    ['cls', 'cls'],
    ['tbtMs', 'tbtMs'],
    ['observedBytes', 'observedBytes'],
    ['requestStarts', 'requestStarts'],
  ];
  const medians = Object.fromEntries(
    metricKeys.map(([output, key]) => [
      output,
      summarizeSeries(
        runs.map((run) => ({
          valid: true,
          comparable: run.comparability.comparable,
          value: getMetricValue(run, key),
        })),
      ),
    ]),
  );
  const identity = deriveDeploymentIdentity(
    runs.flatMap((run) => run.resources ?? []).map((resource) => ({ url: resource.url, type: resource.resourceType })),
    runs.find((run) => run.deploymentIdentity?.platformBuildId?.available)?.deploymentIdentity.platformBuildId.value ??
      null,
  );
  return {
    runs,
    medians,
    resourceFingerprintConsistency: fingerprints,
    deploymentIdentity: identity,
  };
}

function routeMap(raw) {
  return Object.fromEntries(ROUTES.map((route) => [route.key, raw.filter((item) => item.route?.key === route.key)]));
}

function summarizeOwnerEvidence(homeRepeats) {
  const perRun = homeRepeats.map((run) => {
    const groups = Object.fromEntries(
      GROUP_NAMES.map((group) => [
        group,
        {
          requestStarts: run.resourceGroups?.[group]?.requestStarts ?? null,
          observedBytes: run.resourceGroups?.[group]?.observedBytes ?? null,
        },
      ]),
    );
    const combinedNonOwner = {
      requestStarts: GROUP_NAMES.filter((group) => group !== 'heroProductVideo').reduce(
        (total, group) => total + (groups[group].requestStarts ?? 0),
        0,
      ),
      observedBytes: GROUP_NAMES.every(
        (group) => group === 'heroProductVideo' || isFiniteNumber(groups[group].observedBytes),
      )
        ? GROUP_NAMES.filter((group) => group !== 'heroProductVideo').reduce(
            (total, group) => total + groups[group].observedBytes,
            0,
          )
        : null,
    };
    return {
      label: run.label,
      comparable: run.comparability?.comparable === true,
      groups,
      exactOwner: groups.heroProductVideo,
      combinedNonOwner,
      total: {
        requestStarts: run.metrics?.requestStarts?.value ?? null,
        observedBytes: run.metrics?.observedBytes?.value ?? null,
      },
    };
  });
  const medianFor = (field, value) =>
    summarizeSeries(
      perRun.map((run) => ({
        valid: true,
        comparable: run.comparable,
        value: run[field]?.[value] ?? null,
      })),
    );
  const exactOwner = {
    requestStarts: medianFor('exactOwner', 'requestStarts'),
    observedBytes: medianFor('exactOwner', 'observedBytes'),
  };
  const combinedNonOwner = {
    requestStarts: medianFor('combinedNonOwner', 'requestStarts'),
    observedBytes: medianFor('combinedNonOwner', 'observedBytes'),
  };
  const evaluation = decideCandidate({
    homeRuns: homeRepeats.map((run) => ({
      byteAccountingComparable: run.byteAccountingComparable === true,
      groups: run.resourceGroups,
    })),
    activationLoadPreserved: true,
  });
  return {
    perRun,
    medians: { exactOwner, combinedNonOwner },
    evaluation,
  };
}

function buildSummary(raw, fallbackCode = null) {
  const identities = raw.map(identityForObservation);
  let cacheIdentity;
  try {
    cacheIdentity = { ...assertComparableCacheIdentity(identities), comparable: true, reason: null };
  } catch {
    cacheIdentity = { ...identities[0], comparable: false, reason: 'mixed cache identity' };
  }
  const versions = raw.map(versionForObservation);
  const versionsMatch = versions.length > 0 && new Set(versions).size === 1 && !versions[0].startsWith('\u0000');
  const routes = routeMap(raw);
  const homeRepeats = routes.home.filter((item) => item.label !== 'cold-candidate');
  const routeSummaries = {};
  for (const route of ROUTES) {
    const observations = route.key === 'home' ? homeRepeats : routes[route.key];
    routeSummaries[route.key] = routeSeriesSummary(observations, versionsMatch, cacheIdentity.comparable);
  }
  const homeFingerprints = fingerprintConsistency([
    routes.home.find((item) => item.label === 'cold-candidate'),
    ...homeRepeats,
  ]);
  const ownerEvidence = summarizeOwnerEvidence(homeRepeats);
  const allComparableHome = homeRepeats.length === 3 && homeRepeats.every((run) => run.comparability.comparable);
  const coldCandidate = routes.home.find((item) => item.label === 'cold-candidate') ?? null;
  const resourceIdentityUncertainty = raw.some((item) => item.deploymentIdentity?.platformBuildId?.available === false);
  return {
    schemaVersion: 1,
    generatedAtUtc: new Date().toISOString(),
    measurementSurface: {
      available: fallbackCode === null,
      reason: fallbackCode,
      packageAndBrowserVersionsMatchAcrossAllObservations: versionsMatch,
    },
    conditions: {
      ...CONDITIONS,
      playwrightPackageVersion: raw[0]?.conditions?.playwrightPackageVersion ?? null,
      browserVersion: raw[0]?.conditions?.browserVersion ?? null,
      queryCacheBuster: cacheIdentity.value,
      queryCacheBusterReason: cacheIdentity.reason,
      allTenObservationsCacheIdentityComparable: cacheIdentity.comparable,
    },
    deploymentIdentity: {
      platformBuildId: raw[0]?.deploymentIdentity?.platformBuildId ?? {
        available: false,
        value: null,
        reason: 'public build identifier not exposed',
      },
      platformBuildIdUncertainty: resourceIdentityUncertainty
        ? 'public build identifier not exposed; no deployed identity claim made'
        : null,
      coldCandidateVsHomeRepeatFingerprintConsistency: homeFingerprints,
    },
    cacheIdentity,
    routes: routeSummaries,
    homeOwnerEvidence: ownerEvidence,
    observations: raw,
    diagnosis: {
      serverVsBrowserResource:
        'Compare TTFB against FCP/LCP and per-group resource ledgers; evidence is observational and does not prove a deployed cause.',
      homeOwnerAttribution:
        'Only exact HERO_VIDEO_PATHS request pathnames are attributed to heroProductVideo; owner-local scheduling remains subject to the frozen component contract.',
      publicVariability: {
        homeRepeatTtfbMs: homeRepeats.map((run) => getMetricValue(run, 'ttfbMs')),
        homeRepeatObservedBytes: homeRepeats.map((run) => getMetricValue(run, 'observedBytes')),
      },
    },
    scope: {
      catalog: 'guardrail only',
      pdp: 'guardrail only',
      deployedAfterComparison: 'not available in Phase 6C; owned by Phase 6D',
      coldClassification: 'cold candidate; platform cold state unproven',
      applicationFiles:
        'No application production file or application test outside measurement evidence changes on NO_CHANGE.',
      task3: 'skipped because Candidate Decision Rule did not pass',
      task4: 'jump directly to Task 4 closeout on NO_CHANGE; no Task 3 implementation.',
    },
    fallbackCode,
    decision: 'NO_CHANGE',
    comparability: {
      allComparableHomeRepeats: allComparableHome,
      homeRepeatFingerprintConsistency: homeFingerprints,
      routeRepeatFingerprintConsistency: Object.fromEntries(
        ROUTES.map((route) => [route.key, routeSummaries[route.key].resourceFingerprintConsistency]),
      ),
    },
  };
}

function ownerActivationContract() {
  const ownerPath = resolve(MODULE_DIR, '../../../components/evironn/home/hero-product-media.tsx');
  try {
    const source = readFileSync(ownerPath, 'utf8');
    return {
      sourcePath: 'components/evironn/home/hero-product-media.tsx',
      activationLoadPreserved: /\.load\(\)/.test(source),
      proposedPreload: /preload\s*=\s*["']auto["']/.test(source) ? 'preload="auto" to preload="none"' : null,
    };
  } catch {
    return {
      sourcePath: 'components/evironn/home/hero-product-media.tsx',
      activationLoadPreserved: false,
      proposedPreload: null,
    };
  }
}

function calculateDecision(summary) {
  const homeRepeats = summary.observations.filter(
    (item) => item.route?.key === 'home' && item.label !== 'cold-candidate',
  );
  const contract = ownerActivationContract();
  const requestEvidence = homeRepeats.filter((run) => (run.initialHeroVideos?.requestStarts ?? 0) > 0).length >= 2;
  const comparableRuns = homeRepeats.filter((run) => run.comparability?.comparable).length === 3;
  let candidate = null;
  if (comparableRuns && requestEvidence && contract.activationLoadPreserved && contract.proposedPreload) {
    candidate = decideCandidate({
      homeRuns: homeRepeats.map((run) => ({
        byteAccountingComparable: run.byteAccountingComparable === true,
        groups: run.resourceGroups,
      })),
      activationLoadPreserved: contract.activationLoadPreserved,
    });
  }
  const result = candidate ?? {
    decision: 'NO_CHANGE',
    mode: null,
    reasons: [
      ...(!comparableRuns ? ['home repeat series incomplete, noisy, or incomparable'] : []),
      ...(!requestEvidence
        ? ['fewer than two comparable home runs contain exact allowlisted hero-video request starts']
        : []),
      ...(!contract.activationLoadPreserved ? ['activation-time video.load() contract unavailable'] : []),
      ...(!contract.proposedPreload ? ['owner preload="auto" contract unavailable'] : []),
    ],
  };
  const rawByLabel = Object.fromEntries(summary.observations.map((observation) => [observation.label, observation]));
  return { homeRepeats, contract, requestEvidence, comparableRuns, result, rawByLabel };
}

function buildDecision(summary) {
  const { homeRepeats, contract, requestEvidence, comparableRuns, result, rawByLabel } = calculateDecision(summary);
  const lines = [
    `Decision: ${result.decision}`,
    '',
    'Measurement decision record',
    '',
    `Mode: ${result.mode ?? 'unavailable'}`,
    `Reasons: ${result.reasons.join('; ') || 'all candidate conditions met'}`,
    '',
  ];
  lines.push('Candidate Decision Rule');
  lines.push(
    '1. Existing local Playwright and Chromium surface used; no installation, login, deployment, provider/database mutation, or secret access.',
  );
  lines.push(
    '2. Exact HERO_VIDEO_PATHS request starts are counted before the fixed endpoint; no interaction occurred.',
  );
  lines.push(
    '3. Owner ranking uses all three complete home ledgers, per-run combined non-owner values, then medians. Ties fail.',
  );
  lines.push('4. Catalog/PDP are guardrails; no catalog/PDP/shared-cache/auth/provider/security change is authorized.');
  lines.push(
    '5. Owner change, if authorized, is exactly preload="auto" to preload="none" with activation-time video.load() preserved.',
  );
  lines.push('');
  lines.push(`Home repeats comparable: ${comparableRuns}`);
  lines.push(`Exact hero request evidence in at least two home runs: ${requestEvidence}`);
  lines.push(`Activation-time load preserved: ${contract.activationLoadPreserved}`);
  lines.push(`Owner preload contract: ${contract.proposedPreload ?? 'unavailable'}`);
  lines.push(
    `Playwright/browser versions match all observations: ${summary.measurementSurface.packageAndBrowserVersionsMatchAcrossAllObservations}`,
  );
  lines.push(`Cache identity comparable across all ten observations: ${summary.cacheIdentity.comparable}`);
  lines.push(`Cold classification: ${summary.scope.coldClassification}`);
  lines.push('Neither load nor readyState === "complete" is a comparability requirement.');
  lines.push(
    `Exact-owner request-start median: ${summary.homeOwnerEvidence.medians.exactOwner.requestStarts.median.value ?? 'unavailable'}`,
  );
  lines.push(
    `Exact-owner observed-byte median: ${summary.homeOwnerEvidence.medians.exactOwner.observedBytes.median.value ?? 'unavailable'}`,
  );
  lines.push(
    `Per-run combined non-owner request starts: ${JSON.stringify(summary.homeOwnerEvidence.perRun.map((run) => run.combinedNonOwner.requestStarts))}`,
  );
  lines.push(
    `Per-run combined non-owner bytes: ${JSON.stringify(summary.homeOwnerEvidence.perRun.map((run) => run.combinedNonOwner.observedBytes))}`,
  );
  lines.push(
    `Combined non-owner request-start median: ${summary.homeOwnerEvidence.medians.combinedNonOwner.requestStarts.median.value ?? 'unavailable'}`,
  );
  lines.push(
    `Combined non-owner observed-byte median: ${summary.homeOwnerEvidence.medians.combinedNonOwner.observedBytes.median.value ?? 'unavailable'}`,
  );
  lines.push(
    `Owner/combined decision medians: request starts owner=${summary.homeOwnerEvidence.evaluation.ownerMedian ?? 'unavailable'}; combined non-owner=${summary.homeOwnerEvidence.evaluation.combinedNonOwnerMedian ?? 'unavailable'}; mode=${summary.homeOwnerEvidence.evaluation.mode ?? 'unavailable'}`,
  );
  lines.push('');
  lines.push('Home request/resource evidence');
  for (const run of homeRepeats) {
    lines.push(
      `- ${run.label}: comparable=${run.comparability.comparable}; owner starts=${run.initialHeroVideos.requestStarts}; owner bytes=${run.initialHeroVideos.observedBytes}; total starts=${run.metrics.requestStarts.value ?? 'unavailable'}; total bytes=${run.metrics.observedBytes.value ?? 'unavailable'}`,
    );
    lines.push(`  groups=${JSON.stringify(run.resourceGroups)}`);
    lines.push(`  owner URLs=${JSON.stringify(run.initialHeroVideos.urls)}`);
  }
  if (rawByLabel['cold-candidate']) {
    lines.push(
      `- cold-candidate: first observed request only; platform cold state unproven; fingerprint=${summary.deploymentIdentity.coldCandidateVsHomeRepeatFingerprintConsistency.reason ?? 'consistent'}`,
    );
  }
  lines.push('');
  lines.push(`Owner component: ${contract.sourcePath}`);
  lines.push(`Application-file preservation: ${summary.scope.applicationFiles}`);
  lines.push(`Task 3: ${summary.scope.task3}.`);
  lines.push(`Task 4: ${summary.scope.task4}`);
  lines.push(
    'No evidence supports broader change, media removal, image-quality reduction, dynamic-cache change, or catalog/PDP optimization.',
  );
  lines.push(
    `Decision rationale: ${result.reasons.join('; ') || 'strict owner-first ranking and median dominance passed.'}`,
  );
  writeAtomic('decision.md', `${lines.join('\n')}\n`);
  return result;
}

export function decideCandidate({ homeRuns, activationLoadPreserved }) {
  const reasons = [];
  if (!activationLoadPreserved) reasons.push('activation-time video.load() contract not preserved');
  if (!Array.isArray(homeRuns) || homeRuns.length !== 3) {
    reasons.push('exactly three complete home runs required');
    return { decision: 'NO_CHANGE', mode: null, reasons };
  }
  const modes = ['observedBytes', 'requestStarts'];
  let mode = null;
  for (const candidateMode of modes) {
    const valuesAvailable = homeRuns.every((run) => {
      if (candidateMode === 'observedBytes' && run.byteAccountingComparable !== true) return false;
      return Object.values(run.groups ?? {}).every((group) => isFiniteNumber(group[candidateMode]));
    });
    if (valuesAvailable) {
      mode = candidateMode;
      break;
    }
  }
  if (!mode) {
    reasons.push('no complete comparable byte or request-start ledger mode available');
    return { decision: 'NO_CHANGE', mode: null, reasons };
  }
  const perRunCombinedNonOwner = homeRuns.map((run) =>
    Object.entries(run.groups)
      .filter(([name]) => name !== 'heroProductVideo')
      .reduce((total, [, group]) => total + group[mode], 0),
  );
  const ownerValues = homeRuns.map((run) => run.groups.heroProductVideo?.[mode]);
  const ownerMedian = medianComparable(ownerValues).value;
  const combinedNonOwnerMedian = medianComparable(perRunCombinedNonOwner).value;
  for (let index = 0; index < homeRuns.length; index += 1) {
    const owner = ownerValues[index];
    const peers = Object.entries(homeRuns[index].groups)
      .filter(([name]) => name !== 'heroProductVideo')
      .map(([, group]) => group[mode]);
    if (!peers.every((peer) => owner > peer)) reasons.push(`run ${index + 1} owner fails strict rank`);
  }
  if (!(ownerMedian > combinedNonOwnerMedian)) reasons.push('owner median does not exceed combined non-owner median');
  if (reasons.length > 0) {
    return { decision: 'NO_CHANGE', mode, reasons, perRunCombinedNonOwner, ownerMedian, combinedNonOwnerMedian };
  }
  return {
    decision: 'CANDIDATE',
    mode,
    reasons,
    perRunCombinedNonOwner,
    ownerMedian,
    combinedNonOwnerMedian,
  };
}

function updateRawComparability(raw) {
  const identities = raw.map(identityForObservation);
  let cacheIdentityMatch = true;
  try {
    assertComparableCacheIdentity(identities);
  } catch {
    cacheIdentityMatch = false;
  }
  const versions = raw.map(versionForObservation);
  const versionsMatch = versions.length > 0 && new Set(versions).size === 1 && !versions[0].startsWith('\u0000');
  const byRoute = routeMap(raw);
  for (const route of ROUTES) {
    const routeRuns = byRoute[route.key];
    const consistency = fingerprintConsistency(routeRuns);
    for (const observation of routeRuns) {
      observation.comparability = observationComparable(observation, {
        versionsMatch,
        cacheIdentityMatch,
        fingerprintMatch: consistency.consistent,
      });
      observation.byteAccountingComparable = Object.values(observation.resourceGroups ?? {}).every((group) =>
        isFiniteNumber(group.observedBytes),
      );
      writeJson(rawRelativeName(observation.label), observation);
    }
  }
}

async function runCold(cacheBuster) {
  const route = ROUTES[0];
  const observation = await captureObservation('cold-candidate', route, cacheBuster);
  writeJson(rawRelativeName(observation.label), observation);
  console.log('wrote .superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json');
  console.log('classification=cold candidate; platform cold state unproven');
  if (observation.document.status !== 200 || !observation.document.markerMatched) {
    throw new Error('cold candidate failed public route safety predicates');
  }
}

async function runRepeatSeries(cacheBuster) {
  const outputs = [];
  for (const route of ROUTES) {
    for (let run = 1; run <= CONDITIONS.runsPerRoute; run += 1) {
      const name = `${route.key}-run-${run}`;
      const observation = await captureObservation(name, route, cacheBuster);
      writeJson(rawRelativeName(name), observation);
      outputs.push(name);
      console.log(`${name}.json`);
    }
  }
  console.log(`repeat-series=${outputs.length}/9 complete`);
}

function summarizeAndWrite(fallbackCode = null) {
  const raw = allRaw();
  updateRawComparability(raw);
  const summary = buildSummary(raw, fallbackCode);
  writeJson('summary.json', summary);
  const md = [
    '# Phase 6C performance baseline',
    '',
    `Decision: ${summary.decision}`,
    `Measurement surface available: ${summary.measurementSurface.available}`,
    `Measurement surface reason: ${summary.measurementSurface.reason ?? 'none'}`,
    `Playwright package: ${summary.measurementSurface.packageAndBrowserVersionsMatchAcrossAllObservations ? summary.conditions.playwrightPackageVersion : 'version mismatch or unavailable'}`,
    `Browser version: ${summary.conditions.browserVersion ?? 'unavailable'}`,
    `Cache identity: ${summary.cacheIdentity.comparable ? 'comparable across all ten observations' : summary.cacheIdentity.reason}`,
    `Cold classification: ${summary.scope.coldClassification}`,
    '',
    '## Conditions',
    '',
    'Anonymous Chromium, fresh context per navigation, 390x844 viewport, blocked service workers, disabled cache, 4x CPU slowdown, 150 ms latency, fixed 1.6 Mbps download, fixed 750 Kbps upload, DOMContentLoaded plus 2500 ms endpoint.',
    'No interaction occurred. `readyState` is informational. Neither `load` nor `readyState === "complete"` is required for comparability.',
    '',
    '## Route series',
    '',
    ...ROUTES.flatMap((route) => {
      const item = summary.routes[route.key];
      return [
        `### ${route.key}`,
        '',
        `Runs: ${item.runs.length}; fingerprint consistency: ${item.resourceFingerprintConsistency.consistent}`,
        `TTFB median: ${item.medians.ttfbMs.median.value ?? 'unavailable'}`,
        `FCP median: ${item.medians.fcpMs.median.value ?? 'unavailable'}`,
        `Observation-window LCP candidate median: ${item.medians.lcpObservationWindowCandidateMs.median.value ?? 'unavailable'}`,
        `CLS median: ${item.medians.cls.median.value ?? 'unavailable'}`,
        `TBT median: ${item.medians.tbtMs.median.value ?? 'unavailable'}`,
        `Observed bytes median: ${item.medians.observedBytes.median.value ?? 'unavailable'}`,
        `Request starts median: ${item.medians.requestStarts.median.value ?? 'unavailable'}`,
        '',
      ];
    }),
    '## Diagnosis and scope',
    '',
    summary.diagnosis.serverVsBrowserResource,
    summary.diagnosis.homeOwnerAttribution,
    `Exact owner request-start median: ${summary.homeOwnerEvidence.medians.exactOwner.requestStarts.median.value ?? 'unavailable'}`,
    `Exact owner observed-byte median: ${summary.homeOwnerEvidence.medians.exactOwner.observedBytes.median.value ?? 'unavailable'}`,
    `Per-run combined non-owner request starts: ${JSON.stringify(summary.homeOwnerEvidence.perRun.map((run) => run.combinedNonOwner.requestStarts))}`,
    `Per-run combined non-owner bytes: ${JSON.stringify(summary.homeOwnerEvidence.perRun.map((run) => run.combinedNonOwner.observedBytes))}`,
    `Combined non-owner request-start median: ${summary.homeOwnerEvidence.medians.combinedNonOwner.requestStarts.median.value ?? 'unavailable'}`,
    `Combined non-owner observed-byte median: ${summary.homeOwnerEvidence.medians.combinedNonOwner.observedBytes.median.value ?? 'unavailable'}`,
    `Owner decision evaluation: ${summary.homeOwnerEvidence.evaluation.decision}; mode: ${summary.homeOwnerEvidence.evaluation.mode ?? 'unavailable'}`,
    summary.diagnosis.applicationFiles,
    `Task 3: ${summary.scope.task3}.`,
    `Task 4: ${summary.scope.task4}`,
    'Catalog and PDP are regression guardrails only. No deployed after-comparison exists in Phase 6C; Phase 6D owns deployment and comparable public after-measurement.',
  ].join('\n');
  writeAtomic('summary.md', `${md}\n`);
  console.log('wrote .superpowers/sdd/phase-6c-baseline/summary.json');
  console.log('wrote .superpowers/sdd/phase-6c-baseline/summary.md');
}

function runDecision() {
  const summary = JSON.parse(readFileSync(join(BASELINE_DIR, 'summary.json'), 'utf8'));
  const result = buildDecision(summary);
  summary.decision = result.decision;
  writeJson('summary.json', summary);
  console.log(`decision=${result.decision}`);
}

function runUnavailable(reason) {
  for (const name of RAW_NAMES) {
    const route = name === 'cold-candidate' ? ROUTES[0] : ROUTES.find((item) => item.key === name.split('-run-')[0]);
    const observation = createUnavailableObservation(name, route, reason);
    writeJson(rawRelativeName(name), observation);
    console.log(`${name}.json`);
  }
  summarizeAndWrite(reason);
  const summary = JSON.parse(readFileSync(join(BASELINE_DIR, 'summary.json'), 'utf8'));
  buildDecision(summary);
  summary.decision = 'NO_CHANGE';
  writeJson('summary.json', summary);
  console.log('unavailable=10/10 recorded');
}

function runFallback(code) {
  const raw = allRaw();
  const summary = buildSummary(raw, code);
  summary.decision = 'NO_CHANGE';
  writeJson('summary.json', summary);
  writeAtomic(
    'summary.md',
    `# Phase 6C performance baseline\n\nDecision: NO_CHANGE\n\nFallback: ${code}\n\nRaw observations preserved unchanged. No application production file or application test outside measurement evidence changes.\n`,
  );
  writeAtomic(
    'decision.md',
    `Decision: NO_CHANGE\n\nFallback: ${code}\n\nRaw observations preserved unchanged. Measurement evidence does not authorize Task 3.\n`,
  );
}

function assertValidation(condition, message) {
  if (!condition) throw new Error(`existing evidence validation failed: ${message}`);
}

function validMetricShape(value) {
  if (!value || typeof value !== 'object' || typeof value.available !== 'boolean') return false;
  return value.available ? isFiniteNumber(value.value) : typeof value.reason === 'string' && value.reason.length > 0;
}

function validateExisting() {
  const expectedLabels = RAW_NAMES;
  const actualPaths = [
    ...new Set(requireFiles(BASELINE_DIR).map((path) => path.slice(BASELINE_DIR.length + 1).replaceAll('\\', '/'))),
  ].sort();
  assertValidation(JSON.stringify(actualPaths) === JSON.stringify([...STATIC_PATHS].sort()), 'static 15-path set');

  const raw = allRaw();
  assertValidation(raw.length === 10, 'ten raw observations');
  assertValidation(JSON.stringify(raw.map((item) => item.label)) === JSON.stringify(expectedLabels), 'raw labels');
  const expectedRoutes = {
    'cold-candidate': 'home',
    'home-run-1': 'home',
    'home-run-2': 'home',
    'home-run-3': 'home',
    'catalog-run-1': 'catalog',
    'catalog-run-2': 'catalog',
    'catalog-run-3': 'catalog',
    'pdp-run-1': 'pdp',
    'pdp-run-2': 'pdp',
    'pdp-run-3': 'pdp',
  };
  const expectedPaths = {
    home: '/',
    catalog: '/catalog',
    pdp: ROUTES.find((route) => route.key === 'pdp').path,
  };
  for (const observation of raw) {
    assertValidation(validateObservationContract(observation) === true, `${observation.label} observation contract`);
    assertValidation(observation.schemaVersion === 1, `${observation.label} schema`);
    assertValidation(
      observation.route?.key === expectedRoutes[observation.label],
      `${observation.label} route allocation`,
    );
    assertValidation(
      observation.route?.requestedPath === expectedPaths[observation.route.key],
      `${observation.label} route path`,
    );
    assertValidation(
      observation.route?.finalPublicUrlWithoutCacheBuster === buildNavigationUrl(observation.route.requestedPath),
      `${observation.label} public URL`,
    );
    assertValidation(
      observation.classification === (observation.label === 'cold-candidate' ? 'cold candidate' : 'repeat'),
      `${observation.label} classification`,
    );
    assertValidation(observation.conditions?.host === CONDITIONS.host, `${observation.label} host condition`);
    assertValidation(
      observation.conditions?.viewport?.width === CONDITIONS.viewport.width &&
        observation.conditions?.viewport?.height === CONDITIONS.viewport.height,
      `${observation.label} viewport condition`,
    );
    assertValidation(
      observation.conditions?.cacheDisabled === true && observation.conditions?.serviceWorkers === 'block',
      `${observation.label} cache/service-worker condition`,
    );
    assertValidation(
      observation.conditions?.observationWindowAfterDomContentLoadedMs === 2500,
      `${observation.label} fixed endpoint condition`,
    );
    assertValidation(
      observation.conditions?.queryCacheBuster === null && observation.conditions?.queryCacheBusterReason === null,
      `${observation.label} default cache identity`,
    );
    assertValidation(
      observation.document?.readyStateInformationalOnly === true,
      `${observation.label} readyState contract`,
    );
    assertValidation(
      observation.document?.safeHeaders &&
        Object.keys(observation.document.safeHeaders).every((key) => SAFE_RESPONSE_HEADERS.has(key)),
      `${observation.label} safe headers`,
    );
    assertValidation(
      observation.observationEndpoint?.basis === 'domContentLoadedEventEnd',
      `${observation.label} endpoint basis`,
    );
    assertValidation(observation.observationEndpoint?.windowMs === 2500, `${observation.label} endpoint window`);
    assertValidation(
      typeof observation.observationEndpoint?.markerMatchedBeforeEndpoint === 'boolean',
      `${observation.label} marker predicate`,
    );
    assertValidation(
      typeof observation.observationEndpoint?.fixedWindowCompleted === 'boolean',
      `${observation.label} fixed window predicate`,
    );
    for (const key of [
      'httpStatus200',
      'markerMatchedBeforeEndpoint',
      'fixedWindowCompleted',
      'requiredTimingFieldsAvailable',
      'requiredCdpFieldsAvailable',
      'playwrightAndBrowserVersionsMatchSeries',
      'comparable',
    ]) {
      assertValidation(
        typeof observation.comparability?.[key] === 'boolean',
        `${observation.label} comparability predicate ${key}`,
      );
    }
    for (const key of [
      'ttfbMs',
      'fcpMs',
      'lcpObservationWindowCandidateMs',
      'cls',
      'tbtMs',
      'inpMs',
      'observedBytes',
      'requestStarts',
    ]) {
      assertValidation(validMetricShape(observation.metrics?.[key]), `${observation.label} metric ${key}`);
    }
    assertValidation(
      observation.resourceGroups &&
        JSON.stringify(Object.keys(observation.resourceGroups).sort()) === JSON.stringify([...GROUP_NAMES].sort()),
      `${observation.label} resource groups`,
    );
    for (const group of Object.values(observation.resourceGroups)) {
      assertValidation(
        isFiniteNumber(group.requestStarts) && group.requestStarts >= 0,
        `${observation.label} request starts`,
      );
      assertValidation(
        group.observedBytes === null || (isFiniteNumber(group.observedBytes) && group.observedBytes >= 0),
        `${observation.label} observed bytes`,
      );
    }
    assertValidation(
      Array.isArray(observation.errors) &&
        observation.errors.every((error) => typeof error === 'string' && !error.includes('\n')),
      `${observation.label} safe errors`,
    );
    assertValidation(
      observation.deploymentIdentity?.resourceFingerprint?.algorithm === 'sha256',
      `${observation.label} fingerprint algorithm`,
    );
    assertValidation(
      /^[0-9a-f]{64}$/.test(observation.deploymentIdentity.resourceFingerprint.value),
      `${observation.label} fingerprint value`,
    );
    assertValidation(
      observation.conditions?.playwrightPackageVersion === raw[0].conditions.playwrightPackageVersion,
      `${observation.label} package identity`,
    );
    assertValidation(
      observation.conditions?.browserVersion === raw[0].conditions.browserVersion,
      `${observation.label} browser identity`,
    );
  }
  assertValidation(
    assertComparableCacheIdentity(raw.map(identityForObservation)).value === null,
    'all-ten cache identity',
  );
  assertValidation(new Set(raw.map(versionForObservation)).size === 1, 'all-ten browser/package identity');

  const byRoute = routeMap(raw);
  for (const route of ROUTES) {
    const routeRuns =
      route.key === 'home' ? byRoute.home.filter((item) => item.label !== 'cold-candidate') : byRoute[route.key];
    assertValidation(routeRuns.length === 3, `${route.key} repeat count`);
    const consistency = fingerprintConsistency(route.key === 'home' ? byRoute.home : routeRuns);
    assertValidation(consistency.consistent, `${route.key} fingerprint consistency`);
    for (const observation of route.key === 'home' ? byRoute.home : routeRuns) {
      const base = observation.comparability;
      const expectedComparable =
        base.httpStatus200 &&
        base.markerMatchedBeforeEndpoint &&
        base.fixedWindowCompleted &&
        base.requiredTimingFieldsAvailable &&
        base.requiredCdpFieldsAvailable &&
        base.playwrightAndBrowserVersionsMatchSeries &&
        consistency.consistent;
      assertValidation(base.comparable === expectedComparable, `${observation.label} comparability agreement`);
    }
  }

  const summary = JSON.parse(readFileSync(join(BASELINE_DIR, 'summary.json'), 'utf8'));
  assertValidation(
    summary.schemaVersion === 1 && ['CANDIDATE', 'NO_CHANGE'].includes(summary.decision),
    'summary schema/decision',
  );
  assertValidation(
    summary.conditions?.queryCacheBuster === null && summary.conditions?.queryCacheBusterReason === null,
    'summary cache identity',
  );
  assertValidation(summary.conditions?.allTenObservationsCacheIdentityComparable === true, 'summary cache agreement');
  assertValidation(
    summary.measurementSurface?.packageAndBrowserVersionsMatchAcrossAllObservations === true,
    'summary version agreement',
  );
  assertValidation(summary.observations?.length === raw.length, 'summary raw count');
  for (const observation of raw) {
    const summaryObservation = summary.observations.find((item) => item.label === observation.label);
    assertValidation(
      JSON.stringify(summaryObservation) === JSON.stringify(observation),
      `${observation.label} summary/raw agreement`,
    );
  }
  for (const route of ROUTES) {
    assertValidation(summary.routes?.[route.key]?.runs?.length === 3, `summary ${route.key} run count`);
    assertValidation(
      summary.routes[route.key].runs.every((run) => run.route.key === route.key),
      `summary ${route.key} route allocation`,
    );
  }
  const recomputedSummary = buildSummary(raw, summary.fallbackCode ?? null);
  const recomputedDecision = calculateDecision(recomputedSummary).result;
  recomputedSummary.decision = recomputedDecision.decision;
  for (const key of [
    'measurementSurface',
    'conditions',
    'deploymentIdentity',
    'cacheIdentity',
    'routes',
    'homeOwnerEvidence',
    'diagnosis',
    'scope',
    'fallbackCode',
    'comparability',
    'decision',
  ]) {
    assertValidation(
      JSON.stringify(summary[key]) === JSON.stringify(recomputedSummary[key]),
      `summary recomputation ${key}`,
    );
  }
  assertValidation(summary.homeOwnerEvidence?.perRun?.length === 3, 'summary owner per-run evidence');
  assertValidation(
    validMetricShape(summary.homeOwnerEvidence.medians.exactOwner.requestStarts.median),
    'summary exact-owner request median',
  );
  assertValidation(
    validMetricShape(summary.homeOwnerEvidence.medians.exactOwner.observedBytes.median),
    'summary exact-owner byte median',
  );
  assertValidation(
    Array.isArray(summary.homeOwnerEvidence.perRun.map((run) => run.combinedNonOwner.requestStarts)),
    'summary combined non-owner request values',
  );
  assertValidation(
    Array.isArray(summary.homeOwnerEvidence.perRun.map((run) => run.combinedNonOwner.observedBytes)),
    'summary combined non-owner byte values',
  );
  assertValidation(summary.decision === 'NO_CHANGE', 'NO_CHANGE evidence consistency');
  assertValidation(summary.homeOwnerEvidence.evaluation.decision === 'NO_CHANGE', 'NO_CHANGE candidate evaluation');
  assertValidation(
    typeof summary.scope?.applicationFiles === 'string' &&
      summary.scope.applicationFiles.includes('No application production file'),
    'application-file preservation statement',
  );
  assertValidation(
    typeof summary.scope?.task3 === 'string' && summary.scope.task3.includes('skipped'),
    'Task 3 skip statement',
  );
  assertValidation(
    typeof summary.scope?.task4 === 'string' && summary.scope.task4.includes('Task 4'),
    'Task 4 jump statement',
  );
  const decisionText = readFileSync(join(BASELINE_DIR, 'decision.md'), 'utf8');
  assertValidation(decisionText.split(/\r?\n/, 1)[0] === 'Decision: NO_CHANGE', 'decision token');
  assertValidation(decisionText.includes('Exact-owner request-start median'), 'decision owner request median');
  assertValidation(decisionText.includes('Exact-owner observed-byte median'), 'decision owner byte median');
  assertValidation(
    decisionText.includes('Per-run combined non-owner request starts'),
    'decision combined request values',
  );
  assertValidation(decisionText.includes('Per-run combined non-owner bytes'), 'decision combined byte values');
  assertValidation(decisionText.includes('Application-file preservation'), 'decision application preservation');
  assertValidation(decisionText.includes('Task 3:'), 'decision Task 3 skip');
  assertValidation(decisionText.includes('Task 4:'), 'decision Task 4 jump');
  console.log('existing-validation=valid; full-offline-contract=pass');
}

function requireFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...requireFiles(entryPath));
    else files.push(entryPath);
  }
  return files;
}

function parseArgs(args) {
  const cacheIndex = args.indexOf('--cache-buster');
  const reasonIndex = args.indexOf('--cache-buster-reason');
  const hasCache = cacheIndex >= 0 || reasonIndex >= 0;
  if (!hasCache) return null;
  if (
    cacheIndex < 0 ||
    reasonIndex < 0 ||
    typeof args[cacheIndex + 1] !== 'string' ||
    typeof args[reasonIndex + 1] !== 'string'
  ) {
    throw new Error('cache-buster and cache-buster-reason must be supplied as a pair');
  }
  const value = args[cacheIndex + 1];
  const reason = args[reasonIndex + 1];
  if (!value || !reason) throw new Error('cache-buster and cache-buster-reason must be non-empty');
  return { value, reason };
}

async function main(args) {
  const cacheBuster = parseArgs(args);
  if (args.includes('--cold-candidate')) return runCold(cacheBuster);
  if (args.includes('--repeat-series')) return runRepeatSeries(cacheBuster);
  if (args.includes('--summarize')) return summarizeAndWrite();
  if (args.includes('--decision')) return runDecision();
  if (args.includes('--unavailable')) {
    const reason = args[args.indexOf('--unavailable') + 1];
    if (!reason) throw new Error('unavailable reason required');
    return runUnavailable(reason);
  }
  if (args.includes('--record-no-change-fallback')) {
    const code = args[args.indexOf('--record-no-change-fallback') + 1];
    if (!code) throw new Error('fallback code required');
    return runFallback(code);
  }
  if (args.includes('--validate-existing')) return validateExisting();
  throw new Error('mode required');
}

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : 'collector failed');
    process.exitCode = 1;
  });
}

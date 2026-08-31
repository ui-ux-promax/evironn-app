import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertComparableCacheIdentity,
  buildNavigationUrl,
  decideCandidate,
  deriveDeploymentIdentity,
  medianComparable,
  normalizeMarkerObservation,
  planObservationWindow,
  sanitizeHeaders,
  sanitizePublicUrl,
  summarizeRequestLedger,
  summarizeSeries,
  validateObservationContract,
} from './collect-phase-6c.mjs';
import * as collectorModule from './collect-phase-6c.mjs';

const heroVideoPaths = new Set(['/assets/hero/sofa-forward.mp4']);

function homeRun({
  ownerBytes,
  imageBytes,
  scriptBytes,
  ownerStarts = 6,
  imageStarts = 2,
  scriptStarts = 1,
  byteAccountingComparable = true,
}) {
  return {
    byteAccountingComparable,
    groups: {
      heroProductVideo: { observedBytes: ownerBytes, requestStarts: ownerStarts },
      image: { observedBytes: imageBytes, requestStarts: imageStarts },
      script: { observedBytes: scriptBytes, requestStarts: scriptStarts },
    },
  };
}

test('medianComparable sorts a complete three-value series', () => {
  assert.deepEqual(medianComparable([900, 100, 500]), { available: true, value: 500 });
});

test('summarizeSeries rejects incomplete and noisy samples', () => {
  const summary = summarizeSeries([
    { valid: true, comparable: true, value: 100 },
    { valid: false, comparable: false, value: null },
    { valid: true, comparable: false, value: 120 },
  ]);
  assert.equal(summary.comparable, false);
  assert.equal(summary.median.available, false);
  assert.match(summary.reason, /incomplete|noisy/i);
});

test('summarizeSeries preserves unavailable mode', () => {
  const summary = summarizeSeries([
    { valid: false, comparable: false, unavailableReason: 'MEASUREMENT_SURFACE_UNAVAILABLE' },
    { valid: false, comparable: false, unavailableReason: 'MEASUREMENT_SURFACE_UNAVAILABLE' },
    { valid: false, comparable: false, unavailableReason: 'MEASUREMENT_SURFACE_UNAVAILABLE' },
  ]);
  assert.deepEqual(summary.median, {
    available: false,
    reason: 'MEASUREMENT_SURFACE_UNAVAILABLE',
  });
});

test('sanitizers retain only approved headers and public URL fields', () => {
  const blockedAuthorizationHeader = ['author', 'ization'].join('');
  const blockedCookieHeader = ['set', 'cookie'].join('-');
  assert.deepEqual(
    sanitizeHeaders({
      'content-type': 'video/mp4',
      [blockedAuthorizationHeader]: 'forbidden',
      [blockedCookieHeader]: 'forbidden',
    }),
    { 'content-type': 'video/mp4' },
  );
  assert.equal(
    sanitizePublicUrl(
      'https://evironn-app.vercel.app/product/noma-woven-lounge?option=finish%3Awalnut&phase6c_measure=phase6c-fixed-series#private',
    ),
    'https://evironn-app.vercel.app/product/noma-woven-lounge?option=finish%3Awalnut',
  );
});

test('navigation URL has no cache-buster by default and preserves the PDP option', () => {
  assert.equal(buildNavigationUrl('/'), 'https://evironn-app.vercel.app/');
  assert.equal(
    buildNavigationUrl('/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle'),
    'https://evironn-app.vercel.app/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
  );
});

test('one fixed operator cache-buster is reused and mixed series are rejected', () => {
  const fixed = {
    value: 'phase6c-fixed-series',
    reason: 'operator documented stable routing requirement',
  };
  assert.equal(
    buildNavigationUrl('/catalog', fixed),
    'https://evironn-app.vercel.app/catalog?phase6c_measure=phase6c-fixed-series',
  );
  assert.doesNotThrow(() => assertComparableCacheIdentity(Array(10).fill(null)));
  assert.doesNotThrow(() => assertComparableCacheIdentity(Array(10).fill(fixed)));
  assert.throws(
    () => assertComparableCacheIdentity([...Array(9).fill(fixed), { ...fixed, value: 'phase6c-other-series' }]),
    /mixed cache identity/i,
  );
});

test('request ledger counts starts and accumulates multiple encoded chunks', () => {
  const ledger = summarizeRequestLedger(
    [
      {
        method: 'Network.requestWillBeSent',
        requestId: 'owner-1',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4?cache=1',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'owner-1', encodedDataLength: 120 },
      { method: 'Network.dataReceived', requestId: 'owner-1', encodedDataLength: 80 },
    ],
    { heroVideoPaths },
  );
  assert.deepEqual(ledger.groups.heroProductVideo, {
    requestStarts: 1,
    observedBytes: 200,
    completedRequests: 0,
    failedRequests: 0,
    inFlightRequests: 1,
  });
});

test('loadingFinished encoded bytes replace accumulated chunks without double counting', () => {
  const ledger = summarizeRequestLedger(
    [
      {
        method: 'Network.requestWillBeSent',
        requestId: 'owner-1',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'owner-1', encodedDataLength: 120 },
      { method: 'Network.dataReceived', requestId: 'owner-1', encodedDataLength: 80 },
      { method: 'Network.loadingFinished', requestId: 'owner-1', encodedDataLength: 150 },
    ],
    { heroVideoPaths },
  );
  assert.equal(ledger.groups.heroProductVideo.observedBytes, 150);
  assert.equal(ledger.groups.heroProductVideo.completedRequests, 1);
  assert.equal(ledger.groups.heroProductVideo.inFlightRequests, 0);
});

test('failed and in-flight requests preserve partial encoded bytes', () => {
  const ledger = summarizeRequestLedger(
    [
      {
        method: 'Network.requestWillBeSent',
        requestId: 'failed',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'failed', encodedDataLength: 40 },
      { method: 'Network.loadingFailed', requestId: 'failed' },
      {
        method: 'Network.requestWillBeSent',
        requestId: 'in-flight',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'in-flight', encodedDataLength: 60 },
    ],
    { heroVideoPaths },
  );
  assert.equal(ledger.groups.heroProductVideo.requestStarts, 2);
  assert.equal(ledger.groups.heroProductVideo.observedBytes, 100);
  assert.equal(ledger.groups.heroProductVideo.failedRequests, 1);
  assert.equal(ledger.groups.heroProductVideo.inFlightRequests, 1);
});

test('decideCandidate accepts byte evidence only when owner ranks first in all three runs and dominates combined non-owner median', () => {
  const result = decideCandidate({
    homeRuns: [
      homeRun({ ownerBytes: 600, imageBytes: 250, scriptBytes: 100 }),
      homeRun({ ownerBytes: 700, imageBytes: 300, scriptBytes: 120 }),
      homeRun({ ownerBytes: 800, imageBytes: 350, scriptBytes: 140 }),
    ],
    activationLoadPreserved: true,
  });
  assert.equal(result.decision, 'CANDIDATE');
  assert.equal(result.mode, 'observedBytes');
  assert.deepEqual(result.perRunCombinedNonOwner, [350, 420, 490]);
  assert.equal(result.ownerMedian, 700);
  assert.equal(result.combinedNonOwnerMedian, 420);
});

test('decideCandidate uses request-start fallback when byte accounting is unavailable', () => {
  const result = decideCandidate({
    homeRuns: [
      homeRun({ ownerBytes: null, imageBytes: null, scriptBytes: null, byteAccountingComparable: false }),
      homeRun({ ownerBytes: null, imageBytes: null, scriptBytes: null, byteAccountingComparable: false }),
      homeRun({ ownerBytes: null, imageBytes: null, scriptBytes: null, byteAccountingComparable: false }),
    ],
    activationLoadPreserved: true,
  });
  assert.equal(result.decision, 'CANDIDATE');
  assert.equal(result.mode, 'requestStarts');
  assert.deepEqual(result.perRunCombinedNonOwner, [3, 3, 3]);
  assert.equal(result.ownerMedian, 6);
  assert.equal(result.combinedNonOwnerMedian, 3);
});

test('decideCandidate rejects when owner fails strict ranking in any run', () => {
  const result = decideCandidate({
    homeRuns: [
      homeRun({ ownerBytes: 600, imageBytes: 250, scriptBytes: 100 }),
      homeRun({ ownerBytes: 300, imageBytes: 350, scriptBytes: 100 }),
      homeRun({ ownerBytes: 800, imageBytes: 350, scriptBytes: 140 }),
    ],
    activationLoadPreserved: true,
  });
  assert.equal(result.decision, 'NO_CHANGE');
  assert.match(result.reasons.join(' '), /run 2.*rank/i);
});

test('decideCandidate rejects when median owner does not dominate per-run combined non-owner values', () => {
  const result = decideCandidate({
    homeRuns: [
      homeRun({ ownerBytes: 600, imageBytes: 400, scriptBytes: 300 }),
      homeRun({ ownerBytes: 610, imageBytes: 410, scriptBytes: 300 }),
      homeRun({ ownerBytes: 620, imageBytes: 420, scriptBytes: 300 }),
    ],
    activationLoadPreserved: true,
  });
  assert.equal(result.decision, 'NO_CHANGE');
  assert.match(result.reasons.join(' '), /combined non-owner median/i);
});

test('deriveDeploymentIdentity records unavailable build id and deterministic public resource fingerprint', () => {
  const resources = [
    { url: 'https://evironn-app.vercel.app/_next/static/chunks/a.js?x=1', type: 'Script' },
    { url: 'https://evironn-app.vercel.app/_next/static/css/b.css#fragment', type: 'Stylesheet' },
  ];
  const first = deriveDeploymentIdentity(resources, null);
  const reordered = deriveDeploymentIdentity([...resources].reverse(), null);
  const changed = deriveDeploymentIdentity(
    [{ url: 'https://evironn-app.vercel.app/_next/static/chunks/c.js', type: 'Script' }],
    null,
  );
  assert.deepEqual(first.platformBuildId, {
    available: false,
    value: null,
    reason: 'public build identifier not exposed',
  });
  assert.equal(first.resourceFingerprint.algorithm, 'sha256');
  assert.match(first.resourceFingerprint.value, /^[0-9a-f]{64}$/);
  assert.equal(first.resourceFingerprint.value, reordered.resourceFingerprint.value);
  assert.notEqual(first.resourceFingerprint.value, changed.resourceFingerprint.value);
});

test('planObservationWindow handles an expired endpoint without timeout zero and records marker timing', () => {
  assert.deepEqual(planObservationWindow({ endpoint: 2500, now: 2500, markerMatchedAt: 2499 }), {
    expired: true,
    waitMs: 0,
    markerMatchedBeforeEndpoint: true,
  });
  assert.deepEqual(planObservationWindow({ endpoint: 2500, now: 2600, markerMatchedAt: 2601 }), {
    expired: true,
    waitMs: 0,
    markerMatchedBeforeEndpoint: false,
  });
});

test('request ledger counts repeated request IDs as separate redirect occurrences', () => {
  const ledger = summarizeRequestLedger(
    [
      {
        method: 'Network.requestWillBeSent',
        requestId: 'redirected',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'redirected', encodedDataLength: 120 },
      { method: 'Network.loadingFinished', requestId: 'redirected', encodedDataLength: 100 },
      {
        method: 'Network.requestWillBeSent',
        requestId: 'redirected',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'redirected', encodedDataLength: 80 },
      { method: 'Network.loadingFinished', requestId: 'redirected', encodedDataLength: 70 },
    ],
    { heroVideoPaths },
  );
  assert.deepEqual(ledger.groups.heroProductVideo, {
    requestStarts: 2,
    observedBytes: 170,
    completedRequests: 2,
    failedRequests: 0,
    inFlightRequests: 0,
  });
});

test('normalizeMarkerObservation unwraps structured marker results and rejects handle-shaped values', () => {
  assert.deepEqual(normalizeMarkerObservation({ matched: true, matchedAt: 2499 }), {
    markerMatched: true,
    markerMatchedAt: 2499,
  });
  assert.deepEqual(normalizeMarkerObservation({}), {
    markerMatched: false,
    markerMatchedAt: null,
  });
});

test('offline observation validator rejects malformed marker evidence even when comparable is true', () => {
  assert.throws(
    () =>
      validateObservationContract({
        document: { markerMatched: {} },
        observationEndpoint: {
          endpointFromNavigationStartMs: 2500,
          markerMatchedAtFromNavigationStartMs: null,
          markerMatchedBeforeEndpoint: true,
          fixedWindowCompleted: true,
        },
        comparability: { comparable: true },
      }),
    /markerMatched/i,
  );
});

const primaryTargetPaths = [
  '/assets/editorial/images/category-sofa.png',
  '/assets/editorial/images/category-console.png',
  '/assets/editorial/images/category-reading-chair.png',
  '/assets/editorial/images/category-bedside.png',
  '/assets/editorial/images/71c2b8589fc6.png',
];

const visualTimes = [500, 1500, 2500, 5000, 10000, 20000, 30000];

function primaryVisual(overrides = {}) {
  const samples = visualTimes.map((timeMs) => ({
    timeMs,
    screenshotWidth: 390,
    screenshotHeight: 844,
    screenshotPath: `screenshots/home-${String(timeMs).padStart(5, '0')}ms.png`,
    screenshotSha256: 'a'.repeat(64),
    ...overrides.samples?.[timeMs],
  }));
  return {
    screenshotPaths: samples.map((sample) => sample.screenshotPath),
    samples,
    aboveFoldBoxes: visualTimes.flatMap((timeMs) =>
      ['header', '#evironn-hero', '#evironn-hero h1', '#evironn-hero img', '#evironn-hero video'].map((selector) => ({
        timeMs,
        selector,
        x: 0,
        y: 0,
        width: selector === 'header' ? 390 : 300,
        height: selector === '#evironn-hero' ? 500 : 100,
        visibility: 'visible',
        opacity: '1',
        backgroundColor: 'rgb(255, 255, 255)',
        ...overrides.boxes?.[`${timeMs}:${selector}`],
      })),
    ),
    heroReadiness: visualTimes.map((timeMs) => ({ timeMs, ready: true, ...overrides.readiness?.[timeMs] })),
  };
}

function primaryObservation({ requestStarts = 1, metrics = {}, visual = primaryVisual(), comparable = true } = {}) {
  return {
    comparability: {
      comparable,
      httpStatus200: comparable,
      localOrigin: comparable,
      reason: comparable ? null : 'observation failed local HTTP/origin comparability',
    },
    observationEndpoint: { endpointFromNavigationStartMs: 2500 },
    primaryImageRequests: primaryTargetPaths.flatMap((pathname, index) => [
      ...Array.from({ length: requestStarts }, (_, occurrence) => ({
        pathname,
        startTimeMs: 100 + index + occurrence,
        observedBytes: 100,
      })),
      ...(index === 0 ? [{ pathname, startTimeMs: 3000, observedBytes: 100 }] : []),
    ]),
    primaryImageDom: primaryTargetPaths.map((pathname) => ({
      pathname,
      loading: 'lazy',
      viewportClass: 'below-fold',
      complete: true,
      naturalWidth: 1200,
      naturalHeight: 800,
    })),
    metrics: {
      ttfbMs: 100,
      fcpMs: 1000,
      lcpMs: 1000,
      tbtMs: 1000,
      cls: 0,
      ...metrics,
    },
    visual,
  };
}

test('primary visual capture waits from navigation start before each fixed timestamp', async () => {
  let navigationStarted = false;
  let now = 0;
  const waits = [];
  const page = {
    waitForFunction: async () => {
      navigationStarted = true;
      return { dispose: async () => {} };
    },
    evaluate: async (callback, targetMs) => {
      if (typeof targetMs === 'number') return targetMs - now;
      return navigationStarted ? now : null;
    },
    waitForTimeout: async (duration) => {
      waits.push(duration);
      now += duration;
    },
  };

  await collectorModule.waitForNavigationRelativeTime(page, 500);

  assert.equal(navigationStarted, true);
  assert.deepEqual(waits, [500]);
  assert.equal(now, 500);
});

test('local origin guard rejects public navigation and subrequest URLs', () => {
  assert.doesNotThrow(() => collectorModule.assertLocalDiagnosticUrl('http://127.0.0.1:3106/catalog'));
  assert.throws(
    () => collectorModule.assertLocalDiagnosticUrl('https://evironn-app.vercel.app/catalog'),
    /http:\/\/127\.0\.0\.1:3106/i,
  );
  assert.deepEqual(
    [
      ...collectorModule.collectForeignOrigins([
        'http://127.0.0.1:3106/catalog',
        'https://evironn-app.vercel.app/assets/foreign.js',
      ]),
    ],
    ['https://evironn-app.vercel.app'],
  );
});

function guardrailRun(values = {}) {
  return {
    comparable: true,
    endpointMs: 2500,
    ttfbMs: 100,
    fcpMs: 100,
    lcpMs: 100,
    tbtMs: 100,
    cls: 0,
    requestStarts: 10,
    ...values,
  };
}

function comparedPrimaryRuns(overrides = {}) {
  const before = primaryObservation({ requestStarts: 2, metrics: { fcpMs: 1000, lcpMs: 1000, tbtMs: 1000 } });
  const after = primaryObservation({ requestStarts: 1, metrics: { fcpMs: 900, lcpMs: 900, tbtMs: 900 } });
  const homeBefore = Array.from({ length: 3 }, () => collectorModule.summarizePrimaryImageRun(before));
  const homeAfter = Array.from({ length: 3 }, () => collectorModule.summarizePrimaryImageRun(after));
  const catalogBefore = Array.from({ length: 3 }, () => guardrailRun());
  const catalogAfter = Array.from({ length: 3 }, () =>
    guardrailRun({ ttfbMs: 110, fcpMs: 110, lcpMs: 110, tbtMs: 110, cls: 0, requestStarts: 11 }),
  );
  const pdpBefore = Array.from({ length: 3 }, () => guardrailRun());
  const pdpAfter = Array.from({ length: 3 }, () =>
    guardrailRun({ ttfbMs: 110, fcpMs: 110, lcpMs: 110, tbtMs: 110, cls: 0, requestStarts: 11 }),
  );
  return {
    homeBefore,
    homeAfter,
    catalogBefore,
    catalogAfter,
    pdpBefore,
    pdpAfter,
    ...overrides,
  };
}

test('primary image accounting keeps exact five paths and excludes requests after endpoint', () => {
  const result = collectorModule.summarizePrimaryImageRun(primaryObservation({ requestStarts: 1 }));
  assert.equal(result.comparable, true);
  assert.equal(result.requestStarts, 5);
  assert.deepEqual(
    result.targets.map((target) => target.pathname),
    primaryTargetPaths,
  );
  assert.deepEqual(
    result.targets.map((target) => target.requestStarts),
    [1, 1, 1, 1, 1],
  );
  assert.ok(result.targets.every((target) => target.loading === 'lazy'));
  assert.ok(result.targets.every((target) => target.viewportClass === 'below-fold'));
  assert.ok(result.targets.every((target) => target.complete));
  assert.ok(result.targets.every((target) => target.naturalWidth === 1200 && target.naturalHeight === 800));
});

test('primary image accounting keeps not-yet-ready images comparable when readiness fields are recorded', () => {
  const observation = primaryObservation();
  observation.primaryImageDom = observation.primaryImageDom.map((entry) => ({
    ...entry,
    loading: null,
    complete: false,
    naturalWidth: 0,
    naturalHeight: 0,
  }));
  const result = collectorModule.summarizePrimaryImageRun(observation);
  assert.equal(result.comparable, true);
  assert.ok(result.targets.every((target) => target.loading === null && target.complete === false));
});

test('primary comparison computes concrete route guardrail medians', () => {
  const result = collectorModule.comparePrimaryImageRuns(comparedPrimaryRuns());
  assert.deepEqual(result.guardrails.catalog.before, {
    ttfbMs: 100,
    fcpMs: 100,
    lcpMs: 100,
    tbtMs: 100,
    cls: 0,
    requestStarts: 10,
  });
  assert.deepEqual(result.guardrails.pdp.after, {
    ttfbMs: 110,
    fcpMs: 110,
    lcpMs: 110,
    tbtMs: 110,
    cls: 0,
    requestStarts: 11,
  });
});

test('primary comparison accepts exact 50 percent request reduction and exact 10 percent improvement', () => {
  const result = collectorModule.comparePrimaryImageRuns(comparedPrimaryRuns());
  assert.equal(result.decision, 'RETAIN');
  assert.equal(result.requestReductionFraction, 0.5);
  assert.deepEqual(result.improvements, { fcp: 0.1, lcp: 0.1, tbt: 0.1 });
});

test('primary comparison accepts one fixed screenshot series with three-run metric evidence', () => {
  const compared = comparedPrimaryRuns();
  const withoutExtraVisuals = (runs) => runs.map((run, index) => (index === 0 ? run : { ...run, visual: undefined }));
  const result = collectorModule.comparePrimaryImageRuns({
    ...compared,
    homeBefore: withoutExtraVisuals(compared.homeBefore),
    homeAfter: withoutExtraVisuals(compared.homeAfter),
  });
  assert.equal(result.decision, 'RETAIN');
  assert.equal(result.visual.pass, true);
});

test('primary comparison does not reject exact 10 percent guardrail regression', () => {
  const result = collectorModule.comparePrimaryImageRuns(comparedPrimaryRuns());
  assert.equal(result.guardrails.catalog.passed, true);
  assert.equal(result.guardrails.pdp.passed, true);
  assert.deepEqual(result.guardrails.catalog.regressionFractions, {
    ttfb: 0.1,
    fcp: 0.1,
    lcp: 0.1,
    tbt: 0.1,
    cls: 0,
    requestStarts: 0.1,
  });
});

test('primary comparison treats zero-to-zero as neutral and zero-to-positive as regression', () => {
  const neutral = collectorModule.comparePrimaryImageRuns(
    comparedPrimaryRuns({
      catalogBefore: Array.from({ length: 3 }, () =>
        guardrailRun({ ttfbMs: 0, fcpMs: 0, lcpMs: 0, tbtMs: 0, cls: 0, requestStarts: 0 }),
      ),
      catalogAfter: Array.from({ length: 3 }, () =>
        guardrailRun({ ttfbMs: 0, fcpMs: 0, lcpMs: 0, tbtMs: 0, cls: 0, requestStarts: 0 }),
      ),
    }),
  );
  assert.equal(neutral.guardrails.catalog.passed, true);

  const regression = collectorModule.comparePrimaryImageRuns(
    comparedPrimaryRuns({
      catalogBefore: Array.from({ length: 3 }, () => guardrailRun({ ttfbMs: 0 })),
      catalogAfter: Array.from({ length: 3 }, () => guardrailRun({ ttfbMs: 1 })),
    }),
  );
  assert.equal(regression.guardrails.catalog.passed, false);
  assert.equal(regression.decision, 'PRIMARY_CANDIDATE_REJECTED');
});

test('primary comparison rejects zero home baselines instead of treating positive values as improvement', () => {
  const zeroBefore = primaryObservation({
    requestStarts: 2,
    metrics: { fcpMs: 0, lcpMs: 0, tbtMs: 0 },
  });
  const positiveAfter = primaryObservation({
    requestStarts: 1,
    metrics: { fcpMs: 100, lcpMs: 100, tbtMs: 100 },
  });
  const result = collectorModule.comparePrimaryImageRuns(
    comparedPrimaryRuns({
      homeBefore: Array.from({ length: 3 }, () => collectorModule.summarizePrimaryImageRun(zeroBefore)),
      homeAfter: Array.from({ length: 3 }, () => collectorModule.summarizePrimaryImageRun(positiveAfter)),
    }),
  );
  assert.equal(result.decision, 'PRIMARY_CANDIDATE_REJECTED');
  assert.equal(result.improvements.fcp, Number.NEGATIVE_INFINITY);
});

test('primary comparison rejects visual mismatch', () => {
  const after = primaryObservation({
    requestStarts: 1,
    metrics: { fcpMs: 900, lcpMs: 900, tbtMs: 900 },
    visual: primaryVisual({ samples: { 500: { screenshotSha256: 'b'.repeat(64) } } }),
  });
  const result = collectorModule.comparePrimaryImageRuns(comparedPrimaryRuns({ homeAfter: [after, after, after] }));
  assert.equal(result.decision, 'PRIMARY_CANDIDATE_REJECTED');
  assert.equal(result.visual.pass, false);
});

test('primary comparison rejects incomparable data with explicit decision', () => {
  const after = primaryObservation({
    requestStarts: 1,
    metrics: { fcpMs: 900, lcpMs: 900, tbtMs: 900 },
    comparable: false,
  });
  const result = collectorModule.comparePrimaryImageRuns(comparedPrimaryRuns({ homeAfter: [after, after, after] }));
  assert.equal(result.decision, 'PRIMARY_CANDIDATE_REJECTED');
  assert.match(result.reason, /incomparable|incomplete/i);
});

test('primary image accounting propagates real nested HTTP and origin incomparability', () => {
  for (const reason of ['NAVIGATION_FAILED', 'LOCAL_ORIGIN_ESCAPE', 'HTTP_STATUS_NOT_200']) {
    const observation = primaryObservation();
    observation.comparability = {
      comparable: false,
      httpStatus200: reason === 'HTTP_STATUS_NOT_200' ? false : true,
      localOrigin: reason !== 'LOCAL_ORIGIN_ESCAPE',
      reason,
    };
    const result = collectorModule.summarizePrimaryImageRun(observation);
    assert.equal(result.comparable, false, reason);
    assert.equal(result.reason, reason);
  }
});

test('primary visual comparison rejects incomplete exact selector/time and lookup evidence', () => {
  const visual = primaryVisual();
  visual.samples = visual.samples.map((sample) => ({ ...sample, screenshotPath: undefined }));
  visual.aboveFoldBoxes = visual.aboveFoldBoxes.filter((box) => box.selector !== '#evironn-hero video');
  visual.heroReadiness = [...visual.heroReadiness.slice(0, -1), { timeMs: 500, ready: true }];
  const broken = primaryObservation({ requestStarts: 1, visual });
  const result = collectorModule.comparePrimaryImageRuns(
    comparedPrimaryRuns({
      homeBefore: [broken, broken, broken],
      homeAfter: [broken, broken, broken],
    }),
  );
  assert.equal(result.decision, 'PRIMARY_CANDIDATE_REJECTED');
  assert.equal(result.visual.comparable, false);
  assert.equal(result.visual.pass, false);
});

test('primary compare CLI dispatches preserved local evidence into exact comparison output', () => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), 'phase-6c-primary-compare-'));
  const outputPath = resolve(temporaryRoot, 'primary-comparison.json');
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  const collectorPath = resolve(testDirectory, 'collect-phase-6c.mjs');
  const result = spawnSync(
    process.execPath,
    [
      collectorPath,
      '--primary-compare',
      '--before-root',
      '.superpowers/sdd/phase-6c-remediation/before',
      '--after-root',
      '.superpowers/sdd/phase-6c-remediation/after',
      '--output',
      outputPath,
    ],
    { cwd: resolve(testDirectory, '../../..'), encoding: 'utf8' },
  );

  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const comparison = JSON.parse(readFileSync(outputPath, 'utf8'));
    assert.deepEqual(Object.keys(comparison), [
      'decision',
      'reason',
      'requestReductionFraction',
      'improvements',
      'homeMedians',
      'guardrails',
      'visual',
      'evidence',
    ]);
    assert.ok(['RETAIN', 'PRIMARY_CANDIDATE_REJECTED'].includes(comparison.decision));
    assert.equal(comparison.evidence.localClassification, 'controlled-local-diagnostic-only');
    assert.equal(result.stdout.trim(), `wrote ${outputPath}`);
    assert.equal(result.stderr, '');
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

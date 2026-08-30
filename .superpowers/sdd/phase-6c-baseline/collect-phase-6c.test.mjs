import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertComparableCacheIdentity,
  buildNavigationUrl,
  decideCandidate,
  deriveDeploymentIdentity,
  medianComparable,
  sanitizeHeaders,
  sanitizePublicUrl,
  summarizeRequestLedger,
  summarizeSeries,
} from './collect-phase-6c.mjs';

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
    () => assertComparableCacheIdentity([
      ...Array(9).fill(fixed),
      { ...fixed, value: 'phase6c-other-series' },
    ]),
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

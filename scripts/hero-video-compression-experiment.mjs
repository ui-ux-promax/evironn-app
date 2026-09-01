import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const FULL_SHA = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;
const SAFE_RUN_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const DIRECTIONS = Object.freeze(['forward', 'reverse']);
const VIEWPORTS = Object.freeze(['desktop-1440x1000', 'mobile-390x844']);
const METRICS = Object.freeze(['vmaf', 'ssim', 'psnr']);
const OBJECTIVE_LIMIT = 9284196;
const ORIGINAL_BYTES = 18568392;
const TIMELINE_SECONDS = 6.041667;
const VISUAL_FOCUS_SECONDS = 1;

const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
};

export const ENCODE_SOURCE_CONTRACTS = freeze([
  {
    role: 'encode-source',
    direction: 'forward',
    relativePath: 'public/assets/hero/terrace-sofa-forward.mp4',
    bytes: 9941316,
    sha256: '68c5db691631c94f141a230fe5f37f9f74e7115302b57398b4dfb036065d4892',
  },
  {
    role: 'encode-source',
    direction: 'reverse',
    relativePath: 'public/assets/hero/terrace-sofa-reverse.mp4',
    bytes: 8627076,
    sha256: '1683f5051bcf4f91e946af436fcbd894ed3cd76d08d2446d8306e44a9494973c',
  },
]);

export const VISUAL_SUPPORT_CONTRACTS = freeze([
  {
    role: 'visual-focus',
    direction: null,
    relativePath: 'public/assets/hero/terrace-sofa-focus.webp',
    bytes: 222370,
    sha256: '1086c631df3b004810d9573121b4859724be5e61d402aa117226f9e492a5bfe2',
  },
]);

export const PAIR_CONTRACTS = freeze([
  { pairId: 'h264-crf18', codec: 'h264', quality: 18, extension: 'mp4', disposition: 'eligible' },
  { pairId: 'h264-crf20', codec: 'h264', quality: 20, extension: 'mp4', disposition: 'eligible' },
  { pairId: 'vp9-cq24', codec: 'vp9', quality: 24, extension: 'webm', disposition: 'eligible' },
  { pairId: 'vp9-cq28', codec: 'vp9', quality: 28, extension: 'webm', disposition: 'eligible' },
  { pairId: 'av1-cq24', codec: 'av1', quality: 24, extension: 'webm', disposition: 'measurement-only' },
  { pairId: 'av1-cq28', codec: 'av1', quality: 28, extension: 'webm', disposition: 'measurement-only' },
]);

export const STATUS = freeze({
  PENDING_OBJECTIVE_EVIDENCE: 'PENDING_OBJECTIVE_EVIDENCE',
  OBJECTIVE_REJECTED: 'OBJECTIVE_REJECTED',
  MEASUREMENT_ONLY: 'MEASUREMENT_ONLY',
  PENDING_VISUAL_REVIEW: 'PENDING_VISUAL_REVIEW',
  OBJECTIVE_EVIDENCE_READY: 'OBJECTIVE_EVIDENCE_READY',
  PENDING_USER_APPROVAL: 'PENDING_USER_APPROVAL',
  VISUALLY_APPROVED: 'VISUALLY_APPROVED',
  NO_CHANGE: 'NO_CHANGE',
  NOT_APPLICABLE_UNTIL_FUTURE_INTEGRATION: 'NOT_APPLICABLE_UNTIL_FUTURE_INTEGRATION',
});

function sourceFor(direction) {
  const source = ENCODE_SOURCE_CONTRACTS.find((entry) => entry.direction === direction);
  if (!source) throw new Error(`Unknown direction: ${direction}`);
  return source;
}

function pairFor(pairId) {
  const pair = PAIR_CONTRACTS.find((entry) => entry.pairId === pairId);
  if (!pair) throw new Error(`Unknown pair ID: ${pairId}`);
  return pair;
}

const allCandidateSpecs = () =>
  PAIR_CONTRACTS.flatMap((pair) =>
    DIRECTIONS.map((direction) => ({
      ...pair,
      direction,
      sourceRelativePath: sourceFor(direction).relativePath,
      candidateRelativePath: `candidates/${pair.pairId}-${direction}.${pair.extension}`,
    })),
  );

function assertCommit(value, label = 'Commit') {
  if (typeof value !== 'string' || !FULL_SHA.test(value))
    throw new Error(`${label} must be lowercase full commit SHA.`);
}

function assertSha(value, label = 'SHA-256') {
  if (typeof value !== 'string' || !HASH.test(value))
    throw new Error(`${label} must be lowercase 64-character SHA-256.`);
}

function assertCapturedToolVersions(toolVersions, scope = 'Objective') {
  if (!toolVersions || typeof toolVersions !== 'object') throw new Error(`${scope} tool versions are incomplete.`);
  for (const key of ['node', 'ffmpeg', 'ffprobe', 'playwright']) {
    const value = toolVersions[key];
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      /^(?:unknown|unknown version|n\/a|not available|unavailable)$/i.test(value.trim())
    )
      throw new Error(`${scope} tool version capture is missing or uses placeholder ${key}.`);
  }
  return toolVersions;
}

function posix(value) {
  return value.split(path.sep).join('/');
}

function contained(root, candidate, label = 'Path') {
  const relative = path.relative(root, candidate);
  if (relative === '' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
    throw new Error(`${label} escapes experiment root.`);
  return candidate;
}

function assertNoExistingLinksSync(target, requireDirectory = false) {
  const absolute = path.resolve(target);
  const parsed = path.parse(absolute);
  const pieces = absolute.slice(parsed.root.length).split(path.sep);
  let current = parsed.root;
  for (const piece of pieces) {
    if (!piece) continue;
    current = path.join(current, piece);
    if (!fs.existsSync(current)) continue;
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`Linked or reparse path is not allowed: ${current}`);
    if (current === absolute && requireDirectory && !stat.isDirectory())
      throw new Error(`Expected directory: ${current}`);
  }
}

function assertSafeRelative(relativePath, label = 'Relative path') {
  if (
    typeof relativePath !== 'string' ||
    !relativePath ||
    path.isAbsolute(relativePath) ||
    relativePath.includes('\\') ||
    relativePath.split('/').some((part) => !part || part === '..')
  )
    throw new Error(`${label} is unsafe.`);
  return relativePath;
}

export function resolveExperimentRoot(repositoryRoot) {
  if (typeof repositoryRoot !== 'string' || !path.isAbsolute(repositoryRoot))
    throw new Error('Repository root must be absolute.');
  const root = path.resolve(repositoryRoot);
  if (!fs.existsSync(root) || !fs.lstatSync(root).isDirectory())
    throw new Error('Repository root must be an existing directory.');
  assertNoExistingLinksSync(root, true);
  const experimentRoot = path.resolve(root, '.superpowers', 'sdd', 'phase-6c-hero-video-compression');
  contained(root, experimentRoot);
  assertNoExistingLinksSync(experimentRoot);
  return experimentRoot;
}

function freezePaths(value) {
  return freeze(value);
}

function errorNewRun(message) {
  const error = new Error(`NEW_RUN_ID_REQUIRED: ${message}`);
  error.code = 'NEW_RUN_ID_REQUIRED';
  return error;
}

export function resolveRunPaths(repositoryRoot, runId, mode) {
  if (typeof runId !== 'string' || !SAFE_RUN_ID.test(runId)) throw new Error('Run ID must be a safe run id.');
  if (!['create', 'open', 'overwrite'].includes(mode)) throw new Error('Unknown run mode.');
  const experimentRoot = resolveExperimentRoot(repositoryRoot);
  const runsRoot = path.resolve(experimentRoot, 'runs');
  const runRoot = path.resolve(runsRoot, runId);
  contained(experimentRoot, runsRoot, 'Runs root');
  contained(experimentRoot, runRoot, 'Run root');
  assertNoExistingLinksSync(runsRoot);
  assertNoExistingLinksSync(runRoot);
  const exists = fs.existsSync(runRoot);
  if (mode === 'create' && exists) throw new Error('Create-mode run must not exist.');
  if (mode !== 'create' && !exists) throw new Error(`${mode}-mode run must exist.`);
  if (exists && !fs.lstatSync(runRoot).isDirectory()) throw new Error('Run root must be a regular directory.');
  const paths = {
    repositoryRoot: path.resolve(repositoryRoot),
    experimentRoot,
    runsRoot,
    runRoot,
    runId,
    mode,
    deliveryReportPath: path.resolve(experimentRoot, 'delivery-report.md'),
    manifestPath: path.resolve(runRoot, 'manifest.json'),
    manifestPartialPath: path.resolve(runRoot, 'manifest.json.partial'),
    objectiveManifestPath: path.resolve(runRoot, 'objective-manifest.json'),
    objectiveEvidencePath: path.resolve(runRoot, 'objective-evidence.json'),
    visualObservationsPath: path.resolve(runRoot, 'visual-observations.json'),
    decisionPath: path.resolve(runRoot, 'decision.json'),
  };
  if (mode === 'open') validateManifestIdentity(runRoot, runId, 'identity');
  if (mode === 'overwrite') {
    const manifest = validateManifestIdentity(runRoot, runId, 'overwrite');
    assertOnlyInventory(runRoot, enumerateOwnedRunFiles(runId, 'objective', eligiblePairIds(manifest)), true);
  }
  return freezePaths(paths);
}

function validateEligibleIds(ids, requireNonEmpty = false) {
  const values = [...ids];
  if (requireNonEmpty && values.length === 0) throw new Error('Visual phase requires eligible pairs.');
  const valid = new Set(PAIR_CONTRACTS.filter((pair) => pair.disposition === 'eligible').map((pair) => pair.pairId));
  if (new Set(values).size !== values.length || values.some((id) => !valid.has(id)))
    throw new Error('Eligible pair IDs must be unique H.264/VP9 IDs.');
  return values;
}

export function enumerateOwnedRunFiles(runId, phase, eligiblePairIds) {
  if (typeof runId !== 'string' || !SAFE_RUN_ID.test(runId)) throw new Error('Run ID must be a safe run id.');
  if (!['objective', 'visual', 'decision'].includes(phase)) throw new Error('Unknown artifact phase.');
  const eligible = validateEligibleIds(eligiblePairIds, phase === 'visual');
  const files = new Set(['manifest.json', 'objective-manifest.json', 'objective-evidence.json']);
  for (const candidate of allCandidateSpecs()) {
    files.add(candidate.candidateRelativePath);
    files.add(`probes/${candidate.pairId}-${candidate.direction}-metadata.json`);
    files.add(`probes/${candidate.pairId}-${candidate.direction}-streams.json`);
    for (const metric of METRICS)
      files.add(`metrics/${candidate.pairId}-${candidate.direction}-${metric}.${metric === 'vmaf' ? 'json' : 'log'}`);
    if (candidate.codec === 'vp9') files.add(`passlogs/${candidate.pairId}-${candidate.direction}-0.log`);
  }
  if (phase !== 'objective' && eligible.length) {
    files.add('visuals/index.html');
    files.add('visual-observations.json');
    for (const pairId of eligible) {
      files.add(`visuals/${pairId}-forward-focus-reverse.mp4`);
      for (const direction of DIRECTIONS) {
        for (const frame of ['000', '072', '144'])
          files.add(`visuals/frames/${pairId}-${direction}-frame-${frame}.png`);
        for (const viewport of VIEWPORTS) {
          files.add(`browser-receipts/${pairId}-${direction}-${viewport}.json`);
          files.add(`browser-receipts/${pairId}-${direction}-${viewport}.png`);
        }
      }
    }
  }
  if (phase === 'decision') files.add('decision.json');
  return freeze(files);
}

function listFilesSync(root) {
  const result = new Set();
  if (!fs.existsSync(root)) return result;
  const visit = (current, relative) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`Linked run artifact is not allowed: ${child}`);
      if (entry.isDirectory()) visit(absolute, child);
      else if (entry.isFile()) result.add(posix(child));
      else throw new Error(`Unsupported run artifact: ${child}`);
    }
  };
  visit(root, '');
  return result;
}

function assertOnlyInventory(runRoot, expected, asNewRun = false) {
  const actual = listFilesSync(runRoot);
  const wanted = new Set(expected);
  const difference = [...actual]
    .filter((file) => !wanted.has(file))
    .concat([...wanted].filter((file) => !actual.has(file)));
  if (difference.length)
    throw asNewRun
      ? errorNewRun(`Run inventory mismatch: ${difference.join(', ')}`)
      : new Error(`Run inventory mismatch: ${difference.join(', ')}`);
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function assertExactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (!deepEqual(actual, wanted)) throw new Error(`${label} fields are incomplete or unknown.`);
}

function nullableBoolean(value) {
  return value === null || typeof value === 'boolean';
}

function readJsonSync(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertRegularFileIdentitySync(runRoot, relativePath, expectedBytes, expectedSha256) {
  assertSafeRelative(relativePath, 'Owned artifact');
  const absolute = path.resolve(runRoot, relativePath);
  contained(runRoot, absolute, 'Owned artifact');
  assertNoExistingLinksSync(absolute);
  const stat = fs.lstatSync(absolute);
  if (!stat.isFile()) throw new Error(`Owned artifact is not a regular file: ${relativePath}`);
  const bytes = fs.readFileSync(absolute);
  if (Number.isInteger(expectedBytes) && bytes.length !== expectedBytes)
    throw new Error(`Owned artifact byte mismatch: ${relativePath}`);
  if (expectedSha256 && bytesHash(bytes) !== expectedSha256)
    throw new Error(`Owned artifact hash mismatch: ${relativePath}`);
  return bytes;
}

function assertObjectiveCommandReceipts(manifest, runRoot) {
  const objectiveReceipts = manifest.commandReceipts.filter(
    (receipt) => !['visual-frame', 'visual-sequence'].includes(receipt.kind),
  );
  const expectedSequences = (pairId, direction, kind) =>
    objectiveReceipts
      .filter((receipt) => receipt.pairId === pairId && receipt.direction === direction && receipt.kind === kind)
      .map((receipt) => receipt.sequence);
  for (const pair of manifest.pairResults)
    for (const direction of DIRECTIONS) {
      const result = pair.directions[direction];
      const expectedEncode = objectiveReceipts
        .filter(
          (receipt) => receipt.pairId === pair.pairId && receipt.direction === direction && receipt.kind === 'encode',
        )
        .map((receipt) => receipt.sequence);
      const expectedProbe = ['probe-metadata', 'probe-streams'].flatMap((kind) =>
        expectedSequences(pair.pairId, direction, kind),
      );
      const expectedMetric = METRICS.flatMap((kind) => expectedSequences(pair.pairId, direction, kind));
      if (
        !Array.isArray(result.encodeReceiptSequences) ||
        !Array.isArray(result.probeReceiptSequences) ||
        !Array.isArray(result.metricReceiptSequences) ||
        !deepEqual(result.encodeReceiptSequences, expectedEncode) ||
        !deepEqual(result.probeReceiptSequences, expectedProbe) ||
        !deepEqual(result.metricReceiptSequences, expectedMetric)
      )
        throw new Error(`Direction receipt sequence linkage failed: ${pair.pairId}-${direction}.`);
    }
  const artifactPaths = new Set(objectiveReceipts.map((receipt) => receipt.artifactRelativePath).filter(Boolean));
  for (const receipt of objectiveReceipts) {
    if (!receipt.artifactRelativePath || !receipt.artifactRelativePath.startsWith('probes/')) continue;
    const bytes = assertRegularFileIdentitySync(runRoot, receipt.artifactRelativePath);
    if (!receipt.stdoutSha256 || bytesHash(bytes) !== receipt.stdoutSha256)
      throw new Error(`Probe receipt hash linkage failed: ${receipt.artifactRelativePath}`);
  }
  for (const pair of manifest.pairResults)
    for (const direction of DIRECTIONS) {
      const result = pair.directions[direction];
      const expected = [
        result.candidateRelativePath,
        result.probe.metadataRelativePath,
        result.probe.streamsRelativePath,
        ...METRICS.map((kind) => result.metrics[kind].relativePath),
      ];
      for (const relativePath of expected)
        if (!artifactPaths.has(relativePath)) throw new Error(`Objective receipt linkage missing: ${relativePath}`);
      const passlog = `passlogs/${pair.pairId}-${direction}-0.log`;
      if (pair.codec === 'vp9') {
        if (!objectiveReceipts.some((receipt) => receipt.displayArgs.includes(`passlogs/${pair.pairId}-${direction}`)))
          throw new Error(`VP9 passlog receipt linkage missing: ${passlog}`);
      }
    }
}

function validateObjectiveEvidence(runRoot, manifest) {
  const objectiveManifestPath = path.resolve(runRoot, 'objective-manifest.json');
  const objectiveEvidencePath = path.resolve(runRoot, 'objective-evidence.json');
  const objectiveBytes = assertRegularFileIdentitySync(runRoot, 'objective-manifest.json');
  const evidenceBytes = assertRegularFileIdentitySync(runRoot, 'objective-evidence.json');
  let snapshot;
  let evidence;
  try {
    snapshot = JSON.parse(objectiveBytes.toString('utf8'));
    evidence = JSON.parse(evidenceBytes.toString('utf8'));
  } catch {
    throw new Error('Objective evidence JSON is invalid.');
  }
  if (
    snapshot.schemaVersion !== 1 ||
    snapshot.runId !== manifest.runId ||
    snapshot.designCommit !== manifest.designCommit ||
    snapshot.implementationBaseline !== manifest.implementationBaseline ||
    snapshot.harnessCommit !== manifest.harnessCommit ||
    ![STATUS.OBJECTIVE_EVIDENCE_READY, STATUS.NO_CHANGE].includes(snapshot.status) ||
    !deepEqual(snapshot.immutableSources, manifest.immutableSources) ||
    !deepEqual(snapshot.candidates, manifest.candidates) ||
    !deepEqual(snapshot.pairResults, manifest.pairResults) ||
    !Array.isArray(snapshot.commandReceipts) ||
    !deepEqual(manifest.commandReceipts.slice(0, snapshot.commandReceipts.length), snapshot.commandReceipts) ||
    snapshot.visualReceipts?.length !== 0 ||
    snapshot.browserCommandReceipts?.length !== 0 ||
    snapshot.browserReceipts?.length !== 0
  )
    throw new Error('Objective manifest snapshot identity is invalid.');
  if (
    evidence.schemaVersion !== 1 ||
    evidence.runId !== manifest.runId ||
    evidence.implementationBaseline !== manifest.implementationBaseline ||
    evidence.harnessCommit !== manifest.harnessCommit ||
    evidence.objectiveManifestSha256 !== bytesHash(objectiveBytes) ||
    typeof evidence.createdAt !== 'string'
  )
    throw new Error('Objective evidence authentication failed.');
  for (const pair of manifest.pairResults)
    for (const direction of DIRECTIONS) {
      const result = pair.directions[direction];
      assertRegularFileIdentitySync(
        runRoot,
        result.candidateRelativePath,
        result.candidateBytes,
        result.candidateSha256,
      );
      assertRegularFileIdentitySync(runRoot, result.probe.metadataRelativePath);
      assertRegularFileIdentitySync(runRoot, result.probe.streamsRelativePath);
      for (const kind of METRICS) {
        const metric = result.metrics[kind];
        assertRegularFileIdentitySync(runRoot, metric.relativePath, undefined, metric.sha256);
      }
      if (pair.codec === 'vp9') assertRegularFileIdentitySync(runRoot, `passlogs/${pair.pairId}-${direction}-0.log`);
    }
  assertObjectiveCommandReceipts(manifest, runRoot);
  return { objectiveManifestPath, objectiveEvidencePath };
}

function candidateIds() {
  return new Set(PAIR_CONTRACTS.map((pair) => pair.pairId));
}
function eligiblePairIds(pairResults) {
  return pairResults.filter((pair) => pair.eligible && pair.disposition === 'eligible').map((pair) => pair.pairId);
}

function assertManifestSchema(manifest) {
  assertExactKeys(
    manifest,
    [
      'schemaVersion',
      'runId',
      'designCommit',
      'implementationBaseline',
      'harnessCommit',
      'status',
      'toolVersions',
      'immutableSources',
      'candidates',
      'commandReceipts',
      'pairResults',
      'visualReceipts',
      'browserCommandReceipts',
      'browserReceipts',
      'reducedMotion',
      'failedMediaFallback',
    ],
    'Manifest',
  );
  assertExactKeys(
    manifest.toolVersions,
    ['node', 'ffmpeg', 'ffprobe', 'playwright', 'chromium'],
    'Manifest tool versions',
  );
  for (const source of manifest.immutableSources)
    assertExactKeys(source, ['role', 'direction', 'relativePath', 'bytes', 'sha256'], 'Manifest source');
  for (const candidate of manifest.candidates)
    assertExactKeys(
      candidate,
      [
        'pairId',
        'codec',
        'quality',
        'extension',
        'disposition',
        'direction',
        'sourceRelativePath',
        'candidateRelativePath',
      ],
      'Manifest candidate',
    );
  for (const pair of manifest.pairResults) {
    assertExactKeys(
      pair,
      [
        'pairId',
        'codec',
        'quality',
        'extension',
        'disposition',
        'directions',
        'combinedBytes',
        'reductionBytes',
        'reductionPercent',
        'status',
        'eligible',
        'rejectionReasons',
      ],
      'Manifest pair',
    );
    assertExactKeys(pair.directions, DIRECTIONS, 'Manifest pair directions');
    for (const direction of DIRECTIONS) {
      const result = pair.directions[direction];
      assertExactKeys(
        result,
        [
          'direction',
          'candidateRelativePath',
          'candidateBytes',
          'candidateSha256',
          'probe',
          'metrics',
          'encodeReceiptSequences',
          'probeReceiptSequences',
          'metricReceiptSequences',
        ],
        'Manifest direction',
      );
      assertExactKeys(
        result.probe,
        [
          'metadataRelativePath',
          'streamsRelativePath',
          'codecName',
          'profile',
          'width',
          'height',
          'pixelFormat',
          'realFrameRate',
          'averageFrameRate',
          'packetCount',
          'durationSeconds',
          'bitRate',
          'bytes',
          'videoStreamCount',
          'audioStreamCount',
          'attachedPictureCount',
          'contractPass',
        ],
        'Manifest probe',
      );
      assertExactKeys(result.metrics, METRICS, 'Manifest metrics');
      for (const kind of METRICS) {
        const metric = result.metrics[kind];
        assertExactKeys(
          metric,
          ['kind', 'relativePath', 'value', 'sha256', 'distortedInput', 'referenceInput', 'filterPadOrder'],
          'Manifest metric',
        );
        assertExactKeys(metric.distortedInput, ['inputIndex', 'candidateRelativePath'], 'Metric distorted input');
        assertExactKeys(metric.referenceInput, ['inputIndex', 'sourceRelativePath'], 'Metric reference input');
      }
    }
  }
  for (const receipt of manifest.commandReceipts)
    assertExactKeys(
      receipt,
      [
        'sequence',
        'kind',
        'pairId',
        'direction',
        'executable',
        'displayArgs',
        'cwd',
        'exitCode',
        'startedAt',
        'finishedAt',
        'stdoutSha256',
        'stderrSha256',
        'artifactRelativePath',
        'immutableCheckBefore',
        'immutableCheckAfter',
      ],
      'Command receipt',
    );
  for (const receipt of manifest.browserCommandReceipts)
    assertExactKeys(
      receipt,
      [
        'sequence',
        'kind',
        'pairId',
        'direction',
        'viewport',
        'loopbackOrigin',
        'startedAt',
        'finishedAt',
        'immutableCheckBefore',
        'immutableCheckAfter',
        'outcome',
      ],
      'Browser command receipt',
    );
  for (const evidence of manifest.browserReceipts) {
    assertExactKeys(evidence, ['receipt', 'jsonBytes', 'jsonSha256'], 'Browser evidence record');
    assertExactKeys(
      evidence.receipt,
      [
        'pairId',
        'direction',
        'viewport',
        'jsonRelativePath',
        'screenshotRelativePath',
        'browserName',
        'browserVersion',
        'playbackRate',
        'loadeddata',
        'canplay',
        'ended',
        'error',
        'firstFrameReady',
        'transitionReady',
        'originalDurationSeconds',
        'candidateDurationSeconds',
        'maximumDriftSeconds',
        'screenshotSha256',
        'browserCommandSequence',
      ],
      'Browser receipt',
    );
  }
  for (const receipt of manifest.visualReceipts)
    assertExactKeys(
      receipt,
      ['kind', 'pairId', 'direction', 'frameIndex', 'timeSeconds', 'relativePath', 'bytes', 'sha256', 'authority'],
      'Visual receipt',
    );
}

function assertManifestBasics(manifest, runId, runRoot) {
  assertManifestSchema(manifest);
  if (!manifest || manifest.schemaVersion !== 1) throw new Error('Manifest schemaVersion must be 1.');
  if (manifest.runId !== runId) throw new Error('Manifest run ID mismatch.');
  assertCommit(manifest.designCommit, 'Manifest design commit');
  assertCommit(manifest.implementationBaseline, 'Manifest implementation baseline');
  assertCommit(manifest.harnessCommit, 'Manifest harness commit');
  if (!Object.values(STATUS).includes(manifest.status)) throw new Error('Manifest status is invalid.');
  if (manifest.status !== STATUS.PENDING_OBJECTIVE_EVIDENCE)
    assertCapturedToolVersions(manifest.toolVersions, 'Manifest');
  if (!deepEqual(manifest.immutableSources, [...ENCODE_SOURCE_CONTRACTS, ...VISUAL_SUPPORT_CONTRACTS]))
    throw new Error('Manifest immutable source identity mismatch.');
  if (!deepEqual(manifest.candidates, allCandidateSpecs())) throw new Error('Manifest candidate identity mismatch.');
  for (const field of ['commandReceipts', 'pairResults', 'visualReceipts', 'browserCommandReceipts', 'browserReceipts'])
    if (!Array.isArray(manifest[field])) throw new Error(`Manifest ${field} must be an array.`);
  const sequences = [...manifest.commandReceipts, ...manifest.browserCommandReceipts].map((entry) => entry.sequence);
  if (sequences.some((value) => !Number.isInteger(value) || value < 1) || new Set(sequences).size !== sequences.length)
    throw new Error('Receipt sequences must be unique positive integers.');
  for (const receipt of manifest.browserCommandReceipts) {
    assertExactKeys(
      receipt,
      [
        'sequence',
        'kind',
        'pairId',
        'direction',
        'viewport',
        'loopbackOrigin',
        'startedAt',
        'finishedAt',
        'immutableCheckBefore',
        'immutableCheckAfter',
        'outcome',
      ],
      'Browser command receipt',
    );
    if (
      receipt.kind !== 'browser-playback' ||
      !candidateIds().has(receipt.pairId) ||
      !DIRECTIONS.includes(receipt.direction) ||
      !VIEWPORTS.includes(receipt.viewport) ||
      !/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(receipt.loopbackOrigin) ||
      typeof receipt.startedAt !== 'string' ||
      typeof receipt.finishedAt !== 'string' ||
      !HASH.test(receipt.immutableCheckBefore) ||
      !HASH.test(receipt.immutableCheckAfter) ||
      receipt.outcome !== 'COMPLETED'
    )
      throw new Error('Browser command receipt shape is invalid.');
  }
  for (const receipt of manifest.commandReceipts) {
    if (
      !Number.isInteger(receipt.sequence) ||
      receipt.sequence < 1 ||
      !['encode', 'probe-metadata', 'probe-streams', ...METRICS, 'visual-frame', 'visual-sequence'].includes(
        receipt.kind,
      ) ||
      !['ffmpeg', 'ffprobe'].includes(receipt.executable) ||
      !Array.isArray(receipt.displayArgs) ||
      receipt.cwd !== '.' ||
      receipt.exitCode !== 0 ||
      typeof receipt.startedAt !== 'string' ||
      typeof receipt.finishedAt !== 'string' ||
      (receipt.stdoutSha256 !== null && !HASH.test(receipt.stdoutSha256)) ||
      (receipt.stderrSha256 !== null && !HASH.test(receipt.stderrSha256)) ||
      !HASH.test(receipt.immutableCheckBefore) ||
      !HASH.test(receipt.immutableCheckAfter)
    )
      throw new Error('Command receipt shape is invalid.');
    if (receipt.kind === 'visual-sequence') {
      if (receipt.direction !== null) throw new Error('Visual sequence direction must be null.');
    } else if (!DIRECTIONS.includes(receipt.direction)) {
      throw new Error('Non-sequence receipt direction is required.');
    }
    if (!candidateIds().has(receipt.pairId)) throw new Error('Command receipt pair identity is invalid.');
    const identity = processPairAndDirection(
      receipt.artifactRelativePath ?? receipt.displayArgs.find((argument) => argument.startsWith('passlogs/')),
    );
    if (identity.pairId !== receipt.pairId || identity.direction !== receipt.direction)
      throw new Error('Command receipt path identity mismatch.');
    if (receipt.artifactRelativePath) assertSafeRelative(receipt.artifactRelativePath, 'Command receipt artifact');
  }
  if (
    manifest.reducedMotion !== STATUS.NOT_APPLICABLE_UNTIL_FUTURE_INTEGRATION ||
    manifest.failedMediaFallback !== STATUS.NOT_APPLICABLE_UNTIL_FUTURE_INTEGRATION
  )
    throw new Error('Future-integration fields must remain not applicable.');
  const pairIds = manifest.pairResults.map((pair) => pair.pairId);
  if (new Set(pairIds).size !== pairIds.length || pairIds.some((id) => !candidateIds().has(id)))
    throw new Error('Manifest pair identities must be unique and known.');
  if (
    manifest.status !== STATUS.PENDING_OBJECTIVE_EVIDENCE &&
    (pairIds.length !== PAIR_CONTRACTS.length || PAIR_CONTRACTS.some((pair) => !pairIds.includes(pair.pairId)))
  )
    throw new Error('Manifest objective pair inventory is incomplete.');
  for (const pair of manifest.pairResults) {
    const contract = pairFor(pair.pairId);
    if (
      pair.codec !== contract.codec ||
      pair.quality !== contract.quality ||
      pair.extension !== contract.extension ||
      pair.disposition !== contract.disposition
    )
      throw new Error('Manifest pair identity mismatch.');
    if (
      !pair.directions?.forward ||
      !pair.directions?.reverse ||
      pair.directions.forward.direction !== 'forward' ||
      pair.directions.reverse.direction !== 'reverse'
    )
      throw new Error('Every pair requires forward and reverse results.');
    for (const direction of DIRECTIONS) {
      const result = pair.directions[direction];
      if (
        result.candidateRelativePath !== `candidates/${pair.pairId}-${direction}.${pair.extension}` ||
        !Number.isSafeInteger(result.candidateBytes) ||
        result.candidateBytes < 1
      )
        throw new Error('Manifest candidate artifact identity is invalid.');
      assertSha(result.candidateSha256, 'Candidate artifact hash');
      if (
        result.probe?.metadataRelativePath !== `probes/${pair.pairId}-${direction}-metadata.json` ||
        result.probe?.streamsRelativePath !== `probes/${pair.pairId}-${direction}-streams.json` ||
        result.probe?.bytes !== result.candidateBytes ||
        typeof result.probe?.contractPass !== 'boolean'
      )
        throw new Error('Manifest probe artifact identity is invalid.');
      for (const kind of METRICS) {
        const metric = result.metrics?.[kind];
        const extension = kind === 'vmaf' ? 'json' : 'log';
        if (
          !metric ||
          metric.kind !== kind ||
          metric.relativePath !== `metrics/${pair.pairId}-${direction}-${kind}.${extension}` ||
          !Number.isFinite(metric.value) ||
          metric.distortedInput?.inputIndex !== 0 ||
          metric.distortedInput?.candidateRelativePath !== result.candidateRelativePath ||
          metric.referenceInput?.inputIndex !== 1 ||
          metric.referenceInput?.sourceRelativePath !== sourceFor(direction).relativePath ||
          metric.filterPadOrder !== '[dist][ref]'
        )
          throw new Error('Manifest metric evidence is invalid.');
        assertSha(metric.sha256, 'Metric artifact hash');
      }
    }
    const assessed = assessPair(pair);
    if (
      assessed.eligible !== pair.eligible ||
      assessed.status !== pair.status ||
      assessed.combinedBytes !== pair.combinedBytes ||
      assessed.reductionBytes !== pair.reductionBytes ||
      Math.abs(assessed.reductionPercent - pair.reductionPercent) > Number.EPSILON ||
      !deepEqual(assessed.rejectionReasons, pair.rejectionReasons)
    )
      throw new Error('Manifest eligibility arithmetic is unauthenticated.');
  }
  if ([STATUS.PENDING_USER_APPROVAL, STATUS.VISUALLY_APPROVED].includes(manifest.status))
    assertVisualReceiptIdentity(manifest, runRoot);
  if (
    [STATUS.PENDING_USER_APPROVAL, STATUS.VISUALLY_APPROVED].includes(manifest.status) ||
    (manifest.status === STATUS.NO_CHANGE && eligiblePairIds(manifest.pairResults).length)
  )
    assertBrowserEvidence(
      { runRoot, manifestPath: path.resolve(runRoot, 'manifest.json') },
      manifest,
      eligiblePairIds(manifest.pairResults),
      { readJson: () => manifest },
    );
  const decisionPath = path.resolve(runRoot, 'decision.json');
  if (manifest.status === STATUS.NO_CHANGE && manifest.pairResults.some((pair) => pair.eligible)) {
    assertVisualReceiptIdentity(manifest, runRoot);
    if (!fs.existsSync(decisionPath)) throw new Error('Post-visual NO_CHANGE requires decision.json.');
  }
  if (
    manifest.status === STATUS.VISUALLY_APPROVED ||
    (manifest.status === STATUS.NO_CHANGE && fs.existsSync(decisionPath))
  )
    assertDecisionIdentity(runRoot, manifest);
  if (manifest.status !== STATUS.PENDING_OBJECTIVE_EVIDENCE) validateObjectiveEvidence(runRoot, manifest);
  return manifest;
}

function expectedInventoryForManifest(manifest, runRoot) {
  const ids = eligiblePairIds(manifest.pairResults);
  if (manifest.status === STATUS.PENDING_OBJECTIVE_EVIDENCE) return new Set(['manifest.json']);
  if (manifest.status === STATUS.OBJECTIVE_EVIDENCE_READY)
    return enumerateOwnedRunFiles(manifest.runId, 'objective', ids);
  if (manifest.status === STATUS.NO_CHANGE)
    return ids.length
      ? enumerateOwnedRunFiles(manifest.runId, 'decision', ids)
      : new Set([
          ...enumerateOwnedRunFiles(manifest.runId, 'objective', []),
          ...(fs.existsSync(path.resolve(runRoot, 'decision.json')) ? ['decision.json'] : []),
        ]);
  if (manifest.status === STATUS.PENDING_USER_APPROVAL) return enumerateOwnedRunFiles(manifest.runId, 'visual', ids);
  if (manifest.status === STATUS.VISUALLY_APPROVED) return enumerateOwnedRunFiles(manifest.runId, 'decision', ids);
  throw new Error('Manifest status has no valid steady inventory.');
}

function assertVisualReceiptIdentity(manifest, runRoot) {
  const ids = eligiblePairIds(manifest.pairResults);
  const expected = new Set(['visuals/index.html']);
  for (const pairId of ids) {
    expected.add(`visuals/${pairId}-forward-focus-reverse.mp4`);
    for (const direction of DIRECTIONS) {
      for (const frame of ['000', '072', '144'])
        expected.add(`visuals/frames/${pairId}-${direction}-frame-${frame}.png`);
    }
  }
  if (manifest.visualReceipts.length !== expected.size) throw new Error('Visual receipt coverage is incomplete.');
  const actual = new Set();
  for (const receipt of manifest.visualReceipts) {
    if (actual.has(receipt.relativePath) || !expected.has(receipt.relativePath))
      throw new Error('Visual receipt path identity is invalid.');
    actual.add(receipt.relativePath);
    if (!Number.isSafeInteger(receipt.bytes) || receipt.bytes < 1)
      throw new Error('Visual artifact byte count is invalid.');
    assertSha(receipt.sha256, 'Visual artifact hash');
    assertRegularFileIdentitySync(runRoot, receipt.relativePath, receipt.bytes, receipt.sha256);
    if (receipt.kind === 'direct-playback-index') {
      if (receipt.relativePath !== 'visuals/index.html' || receipt.pairId !== null || receipt.direction !== null)
        throw new Error('Direct playback index receipt identity is invalid.');
    } else if (receipt.kind === 'local-sequence') {
      if (
        receipt.pairId === null ||
        receipt.direction !== null ||
        receipt.frameIndex !== null ||
        receipt.timeSeconds !== null ||
        receipt.relativePath !== `visuals/${receipt.pairId}-forward-focus-reverse.mp4`
      )
        throw new Error('Local sequence receipt identity is invalid.');
    } else if (receipt.kind === 'lossless-frame') {
      if (
        !ids.includes(receipt.pairId) ||
        !DIRECTIONS.includes(receipt.direction) ||
        ![0, 72, 144].includes(receipt.frameIndex) ||
        receipt.timeSeconds !== { 0: 0, 72: 3, 144: 6 }[receipt.frameIndex]
      )
        throw new Error('Lossless frame receipt identity is invalid.');
    } else throw new Error('Unknown visual receipt kind.');
  }
  if (actual.size !== expected.size) throw new Error('Visual receipt inventory mismatch.');
}

function assertDecisionIdentity(runRoot, manifest) {
  const bytes = assertRegularFileIdentitySync(runRoot, 'decision.json');
  const objectiveBytes = assertRegularFileIdentitySync(runRoot, 'objective-manifest.json');
  const evidenceBytes = assertRegularFileIdentitySync(runRoot, 'objective-evidence.json');
  const ids = eligiblePairIds(manifest.pairResults);
  const observationPath = path.resolve(runRoot, 'visual-observations.json');
  let observations;
  let observationsSha256 = null;
  if (ids.length) {
    const observationBytes = assertRegularFileIdentitySync(runRoot, 'visual-observations.json');
    try {
      observations = validateObservationSet(JSON.parse(observationBytes.toString('utf8')), manifest.runId, ids);
    } catch (error) {
      throw new Error(`Final visual observations are invalid: ${error.message}`);
    }
    observationsSha256 = bytesHash(observationBytes);
  } else if (fs.existsSync(observationPath)) {
    throw new Error('Zero-eligible decision forbids visual observations.');
  } else {
    observations = { schemaVersion: 1, runId: manifest.runId, observations: [] };
  }
  let decision;
  let objectiveEvidence;
  try {
    decision = JSON.parse(bytes.toString('utf8'));
    objectiveEvidence = JSON.parse(evidenceBytes.toString('utf8'));
  } catch {
    throw new Error('Decision record JSON is invalid.');
  }
  const keys = [
    'schemaVersion',
    'runId',
    'implementationBaseline',
    'harnessCommit',
    'objectiveManifestSha256',
    'visualObservationsSha256',
    'outcome',
    'winningPairId',
    'approvalReference',
    'productionChanged',
    'integrationAuthorized',
  ];
  if (
    Object.keys(decision).sort().join('|') !== keys.sort().join('|') ||
    decision.schemaVersion !== 1 ||
    decision.runId !== manifest.runId ||
    decision.implementationBaseline !== manifest.implementationBaseline ||
    decision.harnessCommit !== manifest.harnessCommit ||
    objectiveEvidence.schemaVersion !== 1 ||
    objectiveEvidence.runId !== manifest.runId ||
    objectiveEvidence.implementationBaseline !== manifest.implementationBaseline ||
    objectiveEvidence.harnessCommit !== manifest.harnessCommit ||
    objectiveEvidence.objectiveManifestSha256 !== bytesHash(objectiveBytes) ||
    decision.objectiveManifestSha256 !== objectiveEvidence.objectiveManifestSha256 ||
    decision.visualObservationsSha256 !== observationsSha256 ||
    (manifest.status === STATUS.VISUALLY_APPROVED
      ? decision.outcome !== 'VISUALLY_APPROVED' ||
        !eligiblePairIds(manifest.pairResults).includes(decision.winningPairId)
      : manifest.status === STATUS.NO_CHANGE
        ? decision.outcome !== 'NO_CHANGE' || decision.winningPairId !== null
        : true) ||
    typeof decision.approvalReference !== 'string' ||
    !decision.approvalReference.trim() ||
    decision.productionChanged !== false ||
    decision.integrationAuthorized !== false
  )
    throw new Error('Decision record identity is invalid.');
  assertDecisionObservationOutcome(manifest, decision, observations);
}

export function validateManifestIdentity(runRoot, runId, command) {
  if (!fs.existsSync(runRoot) || !fs.lstatSync(runRoot).isDirectory())
    throw command === 'overwrite' ? errorNewRun('Run root must exist.') : new Error('Run root must exist.');
  const manifestPath = path.resolve(runRoot, 'manifest.json');
  const partialPath = path.resolve(runRoot, 'manifest.json.partial');
  if (!fs.existsSync(manifestPath) || !fs.lstatSync(manifestPath).isFile())
    throw command === 'overwrite'
      ? errorNewRun('Manifest must exist as a regular file.')
      : new Error('Manifest must exist as a regular file.');
  if (fs.existsSync(partialPath))
    throw command === 'overwrite'
      ? errorNewRun('Manifest partial file exists.')
      : new Error('Manifest partial file exists.');
  let manifest;
  try {
    manifest = readJsonSync(manifestPath);
  } catch {
    throw command === 'overwrite'
      ? errorNewRun('Manifest is not valid JSON.')
      : new Error('Manifest is not valid JSON.');
  }
  try {
    assertManifestBasics(manifest, runId, runRoot);
  } catch (error) {
    if (command === 'overwrite') throw errorNewRun(error.message);
    throw error;
  }
  const ids = eligiblePairIds(manifest.pairResults);
  let expected;
  if (command === 'overwrite') {
    if (
      ![STATUS.OBJECTIVE_EVIDENCE_READY, STATUS.NO_CHANGE].includes(manifest.status) ||
      (manifest.status === STATUS.NO_CHANGE && ids.length)
    )
      throw errorNewRun('Overwrite requires objective-complete status.');
    const report = path.resolve(runRoot, '..', '..', 'delivery-report.md');
    if (fs.existsSync(report)) throw errorNewRun('Delivery report permanently forbids overwrite.');
    expected = enumerateOwnedRunFiles(runId, 'objective', ids);
  } else if (command === 'identity') expected = expectedInventoryForManifest(manifest, runRoot);
  else if (command === 'visuals') {
    if (manifest.status !== STATUS.OBJECTIVE_EVIDENCE_READY || !ids.length)
      throw new Error('Visuals require objective-complete eligible evidence.');
    expected = enumerateOwnedRunFiles(runId, 'objective', ids);
  } else if (command === 'observations') {
    if (manifest.status !== STATUS.PENDING_USER_APPROVAL || !ids.length)
      throw new Error('Observations require pending user approval.');
    expected = enumerateOwnedRunFiles(runId, 'visual', ids);
  } else if (command === 'decision') {
    if (manifest.status === STATUS.NO_CHANGE) {
      expected = ids.length
        ? enumerateOwnedRunFiles(runId, 'decision', ids)
        : new Set([
            ...enumerateOwnedRunFiles(runId, 'objective', []),
            ...(fs.existsSync(path.resolve(runRoot, 'decision.json')) ? ['decision.json'] : []),
          ]);
      if (ids.length && !fs.existsSync(path.resolve(runRoot, 'decision.json')))
        throw new Error('Post-visual NO_CHANGE requires decision.json.');
    } else {
      if (manifest.status !== STATUS.PENDING_USER_APPROVAL || !ids.length)
        throw new Error('Decision requires pending visual review.');
      expected = enumerateOwnedRunFiles(runId, 'visual', ids);
    }
  } else throw new Error('Unknown manifest validation command.');
  try {
    assertOnlyInventory(runRoot, expected, command === 'overwrite');
  } catch (error) {
    if (command === 'overwrite') throw errorNewRun(error.message);
    throw error;
  }
  return freeze(JSON.parse(JSON.stringify(manifest)));
}

function candidateIdentity(candidate) {
  const pair = pairFor(candidate.pairId);
  if (
    !DIRECTIONS.includes(candidate.direction) ||
    candidate.codec !== pair.codec ||
    candidate.quality !== pair.quality ||
    candidate.extension !== pair.extension ||
    candidate.disposition !== pair.disposition
  )
    throw new Error('Candidate identity mismatch.');
  if (
    candidate.sourceRelativePath !== sourceFor(candidate.direction).relativePath ||
    candidate.candidateRelativePath !== `candidates/${candidate.pairId}-${candidate.direction}.${candidate.extension}`
  )
    throw new Error('Candidate path identity mismatch.');
  return pair;
}

function invocation(sequence, executable, args, cwd, scope, artifactRelativePath) {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error('Invocation sequence must be positive.');
  if (executable !== 'ffmpeg' && executable !== 'ffprobe') throw new Error('Unsupported executable.');
  if (path.resolve(cwd) !== cwd) throw new Error('Invocation cwd must be absolute run root.');
  if (artifactRelativePath) assertSafeRelative(artifactRelativePath, 'Artifact path');
  return freeze({
    sequence,
    executable,
    args: [...args],
    cwd,
    shell: false,
    immutableScope: scope,
    artifactRelativePath,
  });
}

function outputMode(paths) {
  return paths.mode === 'overwrite' ? '-y' : '-n';
}

export function buildEncodeInvocations(candidate, paths, startingSequence) {
  const pair = candidateIdentity(candidate);
  const sourcePath = path.resolve(paths.repositoryRoot, candidate.sourceRelativePath);
  const outputPath = path.resolve(paths.runRoot, candidate.candidateRelativePath);
  const common = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-nostdin',
    '-i',
    sourcePath,
    '-map',
    '0:v:0',
    '-an',
    '-map_metadata',
    '-1',
    '-vf',
    'fps=24,format=yuv420p',
  ];
  const tail = ['-fps_mode', 'cfr', '-t', String(TIMELINE_SECONDS)];
  if (pair.codec === 'h264')
    return [
      invocation(
        startingSequence,
        'ffmpeg',
        [
          ...common,
          '-c:v',
          'libx264',
          '-crf',
          String(pair.quality),
          '-preset',
          'slow',
          '-threads',
          '1',
          '-movflags',
          '+faststart',
          ...tail,
          '-f',
          'mp4',
          outputMode(paths),
          outputPath,
        ],
        paths.runRoot,
        'source',
        candidate.candidateRelativePath,
      ),
    ];
  const codecArgs =
    pair.codec === 'vp9'
      ? [
          '-c:v',
          'libvpx-vp9',
          '-crf',
          String(pair.quality),
          '-b:v',
          '0',
          '-deadline',
          'good',
          '-cpu-used',
          '1',
          '-threads',
          '1',
          '-row-mt',
          '0',
          '-tile-columns',
          '0',
          '-frame-parallel',
          '0',
        ]
      : [
          '-c:v',
          'libaom-av1',
          '-crf',
          String(pair.quality),
          '-b:v',
          '0',
          '-cpu-used',
          '4',
          '-threads',
          '1',
          '-row-mt',
          '0',
          '-tiles',
          '1x1',
        ];
  if (pair.codec === 'av1')
    return [
      invocation(
        startingSequence,
        'ffmpeg',
        [...common, ...codecArgs, ...tail, '-f', 'webm', outputMode(paths), outputPath],
        paths.runRoot,
        'source',
        candidate.candidateRelativePath,
      ),
    ];
  const passlog = `passlogs/${candidate.pairId}-${candidate.direction}`;
  return [
    invocation(
      startingSequence,
      'ffmpeg',
      [...common, ...codecArgs, '-pass', '1', '-passlogfile', passlog, ...tail, '-f', 'webm', '-y', 'NUL'],
      paths.runRoot,
      'source',
      null,
    ),
    invocation(
      startingSequence + 1,
      'ffmpeg',
      [
        ...common,
        ...codecArgs,
        '-pass',
        '2',
        '-passlogfile',
        passlog,
        ...tail,
        '-f',
        'webm',
        outputMode(paths),
        outputPath,
      ],
      paths.runRoot,
      'source',
      candidate.candidateRelativePath,
    ),
  ];
}

export function buildProbeInvocations(candidate, paths, startingSequence) {
  candidateIdentity(candidate);
  const input = path.resolve(paths.runRoot, candidate.candidateRelativePath);
  const base = ['-v', 'error'];
  return [
    invocation(
      startingSequence,
      'ffprobe',
      [
        ...base,
        '-select_streams',
        'v:0',
        '-count_packets',
        '-show_entries',
        'stream=index,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_packets,bit_rate:format=duration,bit_rate,size',
        '-of',
        'json',
        input,
      ],
      paths.runRoot,
      'source',
      `probes/${candidate.pairId}-${candidate.direction}-metadata.json`,
    ),
    invocation(
      startingSequence + 1,
      'ffprobe',
      [...base, '-show_entries', 'stream=index,codec_type', '-of', 'json', input],
      paths.runRoot,
      'source',
      `probes/${candidate.pairId}-${candidate.direction}-streams.json`,
    ),
  ];
}

export function buildMetricInvocations(candidate, paths, startingSequence) {
  candidateIdentity(candidate);
  const candidatePath = path.resolve(paths.runRoot, candidate.candidateRelativePath);
  const originalPath = path.resolve(paths.repositoryRoot, candidate.sourceRelativePath);
  const prefix = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-nostdin',
    '-i',
    candidatePath,
    '-i',
    originalPath,
    '-filter_complex',
  ];
  const align =
    '[0:v:0]setpts=PTS-STARTPTS,fps=24,format=yuv420p[dist];[1:v:0]setpts=PTS-STARTPTS,fps=24,format=yuv420p[ref];';
  return METRICS.map((kind, index) => {
    const extension = kind === 'vmaf' ? 'json' : 'log';
    const relativeMetric = `metrics/${candidate.pairId}-${candidate.direction}-${kind}.${extension}`;
    const graph =
      kind === 'vmaf'
        ? `${align}[dist][ref]libvmaf=log_fmt=json:log_path=${relativeMetric}`
        : `${align}[dist][ref]${kind}=stats_file=${relativeMetric}`;
    return invocation(
      startingSequence + index,
      'ffmpeg',
      [...prefix, graph, '-an', '-f', 'null', 'NUL'],
      paths.runRoot,
      'source',
      relativeMetric,
    );
  });
}

function canonicalSourceDigest(contracts) {
  const normalized = [...contracts]
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
    .map(({ role, direction, relativePath, bytes, sha256 }) => ({
      role,
      direction,
      relativePath,
      bytes,
      sha256: sha256.toLowerCase(),
    }));
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

function bytesHash(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function toDisplayArgs(args, repositoryRoot, runRoot) {
  return args.map((argument) => {
    if (typeof argument !== 'string') return argument;
    if (!path.isAbsolute(argument)) return argument;
    const absolute = path.resolve(argument);
    const fromRun = path.relative(path.resolve(runRoot), absolute);
    if (fromRun && !fromRun.startsWith('..' + path.sep) && !path.isAbsolute(fromRun)) return posix(fromRun);
    const fromRepository = path.relative(path.resolve(repositoryRoot), absolute);
    if (fromRepository && !fromRepository.startsWith('..' + path.sep) && !path.isAbsolute(fromRepository))
      return posix(fromRepository);
    return argument;
  });
}

function assertInvocationInsideRun(paths, item) {
  if (item.cwd !== paths.runRoot || item.shell !== false || !['source', 'visual'].includes(item.immutableScope))
    throw new Error('Invocation boundary is invalid.');
  if (item.artifactRelativePath) {
    assertSafeRelative(item.artifactRelativePath, 'Invocation artifact');
    contained(paths.runRoot, path.resolve(paths.runRoot, item.artifactRelativePath), 'Invocation artifact');
  }
}

function processKind(item) {
  if (
    item.immutableScope === 'visual' &&
    item.artifactRelativePath?.startsWith('visuals/') &&
    !item.artifactRelativePath.includes('/frames/')
  )
    return 'visual-sequence';
  if (item.immutableScope === 'visual' && item.artifactRelativePath?.includes('/frames/')) return 'visual-frame';
  if (item.executable === 'ffprobe')
    return item.artifactRelativePath?.endsWith('-metadata.json') ? 'probe-metadata' : 'probe-streams';
  if (item.artifactRelativePath?.includes('-vmaf.')) return 'vmaf';
  if (item.artifactRelativePath?.includes('-ssim.')) return 'ssim';
  if (item.artifactRelativePath?.includes('-psnr.')) return 'psnr';
  return 'encode';
}

function processPairAndDirection(relativePath) {
  const match = relativePath?.match(
    /(?:candidates|probes|metrics|passlogs)\/(h264-crf18|h264-crf20|vp9-cq24|vp9-cq28|av1-cq24|av1-cq28)-(forward|reverse)(?:-|\.|$)/,
  );
  if (match) return { pairId: match[1], direction: match[2] };
  const frame = relativePath?.match(
    /visuals\/frames\/(h264-crf18|h264-crf20|vp9-cq24|vp9-cq28)-(forward|reverse)-frame-(?:000|072|144)\.png$/,
  );
  if (frame) return { pairId: frame[1], direction: frame[2] };
  const sequence = relativePath?.match(
    /visuals\/(h264-crf18|h264-crf20|vp9-cq24|vp9-cq28)-forward-focus-reverse\.mp4$/,
  );
  return { pairId: sequence?.[1] ?? null, direction: sequence ? null : null };
}

export async function runGuardedProcess(paths, scope, item, dependencies) {
  if (!Number.isInteger(item.sequence) || item.sequence < 1) throw new Error('Invocation sequence must be positive.');
  if (item.immutableScope !== scope) throw new Error('Invocation scope does not match guarded scope.');
  assertInvocationInsideRun(paths, item);
  const before = await dependencies.verifyInputs(paths.repositoryRoot, scope);
  const beforeDigest = canonicalSourceDigest(before);
  const startedAt = dependencies.nowIso();
  let result;
  let processError;
  let verificationError;
  let afterDigest;
  try {
    result = await dependencies.spawnProcess(item);
  } catch (error) {
    processError = error;
  } finally {
    try {
      const after = await dependencies.verifyInputs(paths.repositoryRoot, scope);
      afterDigest = canonicalSourceDigest(after);
    } catch (error) {
      verificationError = error;
    }
  }
  const finishedAt = dependencies.nowIso();
  if (verificationError) throw verificationError;
  if (processError) throw processError;
  if (!result || result.exitCode !== 0) {
    const error = new Error(`FFmpeg process failed with exit code ${result?.exitCode ?? -1}.`);
    error.code = 'PROCESS_FAILED';
    throw error;
  }
  const identity = processPairAndDirection(
    item.artifactRelativePath ?? item.args.find((argument) => argument.startsWith('passlogs/')),
  );
  const kind = processKind(item);
  if (!identity.pairId || (kind !== 'visual-sequence' && !identity.direction))
    throw new Error('Command receipt identity cannot be derived from owned artifact.');
  if (kind === 'visual-sequence' && identity.direction !== null)
    throw new Error('Visual sequence direction must be null.');
  return freeze({
    sequence: item.sequence,
    kind,
    pairId: identity.pairId,
    direction: kind === 'visual-sequence' ? null : identity.direction,
    executable: item.executable,
    displayArgs: toDisplayArgs(item.args, paths.repositoryRoot, paths.runRoot),
    cwd: '.',
    exitCode: result.exitCode,
    startedAt,
    finishedAt,
    stdoutSha256: result.stdout?.length ? bytesHash(result.stdout) : null,
    stderrSha256: result.stderr?.length ? bytesHash(result.stderr) : null,
    artifactRelativePath: item.artifactRelativePath,
    immutableCheckBefore: beforeDigest,
    immutableCheckAfter: afterDigest,
  });
}

async function hashFile(filePath) {
  const hash = crypto.createHash('sha256');
  let bytes = 0;
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => {
      bytes += chunk.length;
      hash.update(chunk);
    });
    stream.on('end', resolve);
    stream.on('error', reject);
  });
  return { bytes, sha256: hash.digest('hex') };
}

async function assertNoExistingLinks(filePath) {
  const absolute = path.resolve(filePath);
  let parent = path.dirname(absolute);
  while (parent !== path.parse(parent).root) {
    const parentStat = await fsp.lstat(parent);
    if (parentStat.isSymbolicLink() || !parentStat.isDirectory())
      throw new Error(`Linked or invalid immutable parent: ${parent}`);
    parent = path.dirname(parent);
  }
  const stat = await fsp.lstat(absolute);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`Immutable input is not a regular file: ${absolute}`);
}

export async function verifyImmutableInputs(repositoryRoot, scope) {
  if (!['source', 'visual'].includes(scope)) throw new Error('Unknown immutable scope.');
  if (typeof repositoryRoot !== 'string' || !path.isAbsolute(repositoryRoot))
    throw new Error('Repository root must be absolute.');
  const contracts =
    scope === 'source' ? ENCODE_SOURCE_CONTRACTS : [...ENCODE_SOURCE_CONTRACTS, ...VISUAL_SUPPORT_CONTRACTS];
  const facts = [];
  for (const contract of contracts) {
    const absolute = path.resolve(repositoryRoot, contract.relativePath);
    contained(path.resolve(repositoryRoot), absolute, 'Immutable input');
    await assertNoExistingLinks(absolute);
    const actual = await hashFile(absolute);
    if (actual.bytes !== contract.bytes || actual.sha256 !== contract.sha256)
      throw new Error(`Immutable input mismatch: ${contract.relativePath}`);
    facts.push({ ...contract });
  }
  return freeze(facts);
}

async function writeExclusive(filePath, bytes) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const handle = await fsp.open(filePath, 'wx');
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function replaceOwned(filePath, bytes) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await writeExclusive(temporary, bytes);
  await fsp.rename(temporary, filePath);
}

function assertLoopbackRoute(route) {
  const allowedRoute =
    route.urlPath === '/index.html' ||
    /^\/original\/(forward|reverse)\.mp4$/.test(route.urlPath) ||
    /^\/candidate\/(?:h264-crf18|h264-crf20)\/(forward|reverse)\.mp4$/.test(route.urlPath) ||
    /^\/candidate\/(?:vp9-cq24|vp9-cq28)\/(forward|reverse)\.webm$/.test(route.urlPath);
  if (!allowedRoute || route.urlPath.includes('..') || /%2e|%2f|%5c/i.test(route.urlPath))
    throw new Error('Loopback route is not allowlisted.');
  if (!path.isAbsolute(route.absolutePath) || !Number.isSafeInteger(route.expectedBytes) || route.expectedBytes < 1)
    throw new Error('Loopback route identity is invalid.');
  const expectedMediaType =
    route.urlPath === '/index.html'
      ? 'text/html; charset=utf-8'
      : route.urlPath.endsWith('.webm')
        ? 'video/webm'
        : 'video/mp4';
  if (route.mediaType !== expectedMediaType) throw new Error('Loopback route media type is invalid.');
  assertSha(route.expectedSha256, 'Loopback route hash');
  const normalized = path.resolve(route.absolutePath);
  const experimentMarker = path.join('.superpowers', 'sdd', 'phase-6c-hero-video-compression');
  const marker = `${path.sep}${experimentMarker}${path.sep}`;
  const markerIndex = normalized.toLowerCase().indexOf(marker.toLowerCase());
  const experimentRoot = markerIndex < 0 ? null : path.resolve(normalized.slice(0, markerIndex + marker.length - 1));
  let isExperimentFile = false;
  if (experimentRoot) {
    try {
      contained(experimentRoot, normalized, 'Loopback experiment route');
      isExperimentFile = true;
    } catch {
      isExperimentFile = false;
    }
  }
  const sourceMatch = normalized.match(
    /^(.*?)[\\/]public[\\/]assets[\\/]hero[\\/]terrace-sofa-(forward|reverse)\.mp4$/i,
  );
  let isPilotSource = false;
  if (sourceMatch) {
    try {
      contained(path.resolve(sourceMatch[1]), normalized, 'Loopback source route');
      isPilotSource = true;
    } catch {
      isPilotSource = false;
    }
  }
  if (!isExperimentFile && !isPilotSource) throw new Error('Loopback route escapes owned roots.');
  if (route.urlPath === '/index.html' && !/[\\/]visuals[\\/]index\.html$/i.test(normalized))
    throw new Error('Loopback index route path is invalid.');
  const originalRoute = route.urlPath.match(/^\/original\/(forward|reverse)\.mp4$/);
  if (originalRoute && !normalized.endsWith(`terrace-sofa-${originalRoute[1]}.mp4`))
    throw new Error('Loopback original route path is invalid.');
  const candidateRoute = route.urlPath.match(
    /^\/candidate\/(h264-crf18|h264-crf20|vp9-cq24|vp9-cq28)\/(forward|reverse)\.(mp4|webm)$/,
  );
  if (candidateRoute && !normalized.endsWith(`${candidateRoute[1]}-${candidateRoute[2]}.${candidateRoute[3]}`))
    throw new Error('Loopback candidate route identity is invalid.');
  if (
    route.urlPath.startsWith('/candidate/') &&
    !/[\\/]runs[\\/][a-z0-9][a-z0-9-]{0,63}[\\/]candidates[\\/](h264-crf18|h264-crf20|vp9-cq24|vp9-cq28)-(forward|reverse)\.(mp4|webm)$/i.test(
      normalized,
    )
  )
    throw new Error('Loopback candidate route path is invalid.');
  assertNoExistingLinksSync(normalized);
  const stat = fs.lstatSync(normalized);
  if (!stat.isFile()) throw new Error('Loopback route must be a regular file.');
  if (stat.size !== route.expectedBytes || bytesHash(fs.readFileSync(normalized)) !== route.expectedSha256)
    throw new Error('Loopback route file identity does not match declared bytes/hash.');
}

function parseSingleByteRange(value, size) {
  if (typeof value !== 'string' || !value.startsWith('bytes=') || value.includes(',')) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  let start;
  let end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix < 1) return null;
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || end >= size)
    return null;
  return { start, end };
}

async function startLoopbackServer({ host, port, routes }) {
  if (host !== '127.0.0.1' || port !== 0) throw new Error('Loopback server requires host 127.0.0.1 and port 0.');
  if (!Array.isArray(routes) || !routes.length) throw new Error('Loopback routes are required.');
  for (const route of routes) assertLoopbackRoute(route);
  const experimentMarkers = routes
    .map((route) =>
      path
        .resolve(route.absolutePath)
        .toLowerCase()
        .indexOf(`${path.sep}.superpowers${path.sep}sdd${path.sep}phase-6c-hero-video-compression${path.sep}`),
    )
    .filter((index) => index >= 0);
  const experimentRoots = new Set(
    routes
      .map((route) => {
        const absolute = path.resolve(route.absolutePath);
        const marker = `${path.sep}.superpowers${path.sep}sdd${path.sep}phase-6c-hero-video-compression${path.sep}`;
        const index = absolute.toLowerCase().indexOf(marker.toLowerCase());
        return index < 0 ? null : absolute.slice(0, index + marker.length - 1);
      })
      .filter(Boolean)
      .map((root) => path.resolve(root)),
  );
  const sourceRoots = new Set(
    routes
      .map(
        (route) =>
          path
            .resolve(route.absolutePath)
            .match(/^(.*?)[\\/]public[\\/]assets[\\/]hero[\\/]terrace-sofa-(?:forward|reverse)\.mp4$/i)?.[1],
      )
      .filter(Boolean)
      .map((root) => path.resolve(root)),
  );
  if (!experimentMarkers.length || experimentRoots.size !== 1 || sourceRoots.size !== 1)
    throw new Error('Loopback routes must share one contained experiment root and repository source root.');
  const routeMap = new Map(routes.map((route) => [route.urlPath, route]));
  if (routeMap.size !== routes.length) throw new Error('Loopback routes must be unique.');
  let resolvedPort = 0;
  const server = http.createServer(async (request, response) => {
    try {
      if (!request.headers.host || !/^127\.0\.0\.1(?::\d+)?$/.test(request.headers.host))
        return response.writeHead(403).end();
      if (request.headers.host.includes(':') && request.headers.host !== `127.0.0.1:${resolvedPort}`)
        return response.writeHead(403).end();
      if (!['GET', 'HEAD'].includes(request.method)) return response.writeHead(405).end();
      const rawPath = String(request.url ?? '/').split('?')[0];
      if (/[%]2e|[%]2f|[%]5c/i.test(rawPath) || rawPath.includes('\\')) return response.writeHead(400).end();
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
      } catch {
        return response.writeHead(400).end();
      }
      if (pathname.includes('//') || pathname.split('/').some((part) => part === '..'))
        return response.writeHead(400).end();
      const route = routeMap.get(pathname);
      if (!route) return response.writeHead(404).end();
      assertLoopbackRoute(route);
      const identity = await hashFile(route.absolutePath);
      if (identity.bytes !== route.expectedBytes || identity.sha256 !== route.expectedSha256)
        return response.writeHead(409).end();
      const stat = await fsp.lstat(route.absolutePath);
      if (!stat.isFile()) return response.writeHead(409).end();
      const headers = {
        'Content-Type': route.mediaType,
        'Accept-Ranges': route.mediaType.startsWith('video/') ? 'bytes' : 'none',
        'Content-Length': stat.size,
      };
      if (request.headers.range) {
        if (!route.mediaType.startsWith('video/')) return response.writeHead(416).end();
        const range = parseSingleByteRange(request.headers.range, stat.size);
        if (!range) return response.writeHead(416).end();
        const { start, end } = range;
        headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
        headers['Content-Length'] = end - start + 1;
        response.writeHead(206, headers);
        if (request.method === 'GET') fs.createReadStream(route.absolutePath, { start, end }).pipe(response);
        else response.end();
        return;
      }
      response.writeHead(200, headers);
      if (request.method === 'GET') fs.createReadStream(route.absolutePath).pipe(response);
      else response.end();
    } catch {
      response.writeHead(500).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen({ host, port }, resolve);
  });
  const address = server.address();
  resolvedPort = typeof address === 'object' && address ? address.port : 0;
  let closed;
  return {
    host,
    requestedPort: 0,
    resolvedPort,
    origin: `http://127.0.0.1:${resolvedPort}`,
    close: () => {
      if (!closed)
        closed = new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      return closed;
    },
  };
}

function defaultSpawn(item) {
  return new Promise((resolve, reject) => {
    const child = spawn(item.executable, item.args, { cwd: item.cwd, shell: false, windowsHide: true });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (exitCode) =>
      resolve({ exitCode: exitCode ?? -1, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }),
    );
  });
}

function executableVersion(executable) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, ['-version'], { shell: false, windowsHide: true });
    const chunks = [];
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`${executable} version probe failed.`));
      const line = Buffer.concat(chunks).toString('utf8').split(/\r?\n/, 1)[0].trim();
      if (!line) return reject(new Error(`${executable} version probe returned no version.`));
      resolve(line);
    });
  });
}

function defaultDependencies() {
  const dependencies = {
    spawnProcess: defaultSpawn,
    verifyInputs: verifyImmutableInputs,
    nowIso: () => new Date().toISOString(),
    readStdin: () =>
      new Promise((resolve, reject) => {
        const chunks = [];
        process.stdin.on('data', (chunk) => chunks.push(chunk));
        process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        process.stdin.on('error', reject);
      }),
    readJson: (absolutePath) => readJsonSync(absolutePath),
    writeFileExclusive: writeExclusive,
    replaceOwnedFile: replaceOwned,
    startLoopbackServer,
    presentReviewPackage: async ({ origin, indexPath }) => {
      console.log(`Local review package: ${origin}/index.html (${indexPath})`);
      await new Promise((resolve) => {
        const finish = () => {
          process.stdin.removeListener('data', finish);
          process.stdin.removeListener('end', finish);
          resolve();
        };
        process.stdin.once('data', finish);
        process.stdin.once('end', finish);
      });
    },
    launchChromium: async () => (await import('@playwright/test')).chromium.launch({ headless: true }),
    getToolVersions: async () => ({
      node: process.version,
      ffmpeg: await executableVersion('ffmpeg'),
      ffprobe: await executableVersion('ffprobe'),
      playwright: '1.60.0',
      chromium: null,
    }),
  };
  dependencies.writeManifestAtomic = (paths, manifest) => writeManifestAtomic(paths, manifest, dependencies);
  return dependencies;
}

export async function writeManifestAtomic(paths, manifest, dependencies) {
  if (!paths?.manifestPartialPath || !paths?.manifestPath) throw new Error('Manifest paths are required.');
  if (path.dirname(paths.manifestPartialPath) !== path.dirname(paths.manifestPath))
    throw new Error('Manifest partial and final paths must share a directory.');
  assertNoExistingLinksSync(path.dirname(paths.manifestPath));
  if (fs.existsSync(paths.manifestPath)) assertNoExistingLinksSync(paths.manifestPath);
  const bytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  let operationError;
  let afterError;
  let before;
  try {
    before = await dependencies.verifyInputs(paths.repositoryRoot, 'visual');
    await dependencies.writeFileExclusive(paths.manifestPartialPath, bytes);
    const persisted = await fsp.readFile(paths.manifestPartialPath);
    if (bytesHash(persisted) !== bytesHash(bytes)) throw new Error('Manifest partial hash mismatch.');
  } catch (error) {
    operationError = error;
  } finally {
    try {
      const after = await dependencies.verifyInputs(paths.repositoryRoot, 'visual');
      if (before && canonicalSourceDigest(before) !== canonicalSourceDigest(after))
        throw new Error('Immutable inputs changed during manifest write.');
    } catch (error) {
      afterError = error;
    }
  }
  if (afterError) throw afterError;
  if (operationError) throw operationError;
  await fsp.rename(paths.manifestPartialPath, paths.manifestPath);
  let finalError;
  try {
    await dependencies.replaceOwnedFile(paths.manifestPath, bytes);
    const finalBytes = await fsp.readFile(paths.manifestPath);
    if (bytesHash(finalBytes) !== bytesHash(bytes)) throw new Error('Final manifest hash mismatch.');
  } catch (error) {
    finalError = error;
  }
  let finalVerificationError;
  try {
    const finalInputs = await dependencies.verifyInputs(paths.repositoryRoot, 'visual');
    if (before && canonicalSourceDigest(before) !== canonicalSourceDigest(finalInputs))
      throw new Error('Immutable inputs changed during final manifest replacement.');
  } catch (error) {
    finalVerificationError = error;
  }
  if (finalVerificationError) throw finalVerificationError;
  if (finalError) throw finalError;
  return bytesHash(bytes);
}

function assessDirection(direction) {
  if (!direction || !DIRECTIONS.includes(direction.direction)) throw new Error('Pair direction is invalid.');
  if (
    !Number.isSafeInteger(direction.candidateBytes) ||
    direction.candidateBytes < 1 ||
    !HASH.test(direction.candidateSha256)
  )
    throw new Error('Direction candidate identity is invalid.');
  if (!direction.probe || !direction.metrics?.vmaf || !direction.metrics?.ssim || !direction.metrics?.psnr)
    throw new Error('Direction evidence is incomplete.');
  if (
    !Number.isFinite(direction.probe.width) ||
    !Number.isFinite(direction.probe.height) ||
    !Number.isFinite(direction.probe.packetCount) ||
    !Number.isFinite(direction.probe.durationSeconds) ||
    !Number.isSafeInteger(direction.probe.bytes) ||
    direction.probe.bytes < 1 ||
    !Number.isFinite(direction.metrics.vmaf.value) ||
    !Number.isFinite(direction.metrics.ssim.value) ||
    !Number.isFinite(direction.metrics.psnr.value)
  )
    throw new Error('Objective evidence contains NaN or non-finite values.');
}

function parseProbe(metadata, streams, candidate, bytes) {
  const listedStreams = streams?.streams ?? [];
  const stream = metadata?.streams?.[0] ?? {};
  const format = metadata?.format ?? {};
  const durationSeconds = Number(format.duration);
  const videoStreamCount = listedStreams.filter((entry) => entry.codec_type === 'video').length;
  const audioStreamCount = listedStreams.filter((entry) => entry.codec_type === 'audio').length;
  const attachedPictureCount = listedStreams.filter((entry) => entry.disposition?.attached_pic === 1).length;
  const codecName = String(stream.codec_name ?? '');
  const expectedCodec = candidate.codec === 'h264' ? 'h264' : candidate.codec === 'vp9' ? 'vp9' : 'av1';
  return {
    metadataRelativePath: `probes/${candidate.pairId}-${candidate.direction}-metadata.json`,
    streamsRelativePath: `probes/${candidate.pairId}-${candidate.direction}-streams.json`,
    codecName,
    profile: stream.profile == null ? null : String(stream.profile),
    width: Number(stream.width),
    height: Number(stream.height),
    pixelFormat: String(stream.pix_fmt ?? ''),
    realFrameRate: String(stream.r_frame_rate ?? ''),
    averageFrameRate: String(stream.avg_frame_rate ?? ''),
    packetCount: Number(stream.nb_read_packets),
    durationSeconds,
    bitRate: format.bit_rate == null ? null : Number(format.bit_rate),
    bytes,
    videoStreamCount,
    audioStreamCount,
    attachedPictureCount,
    contractPass:
      videoStreamCount === 1 &&
      audioStreamCount === 0 &&
      attachedPictureCount === 0 &&
      codecName === expectedCodec &&
      Number(stream.width) === 1168 &&
      Number(stream.height) === 784 &&
      stream.pix_fmt === 'yuv420p' &&
      stream.r_frame_rate === '24/1' &&
      stream.avg_frame_rate === '24/1' &&
      Number(stream.nb_read_packets) === 145 &&
      Number.isFinite(durationSeconds) &&
      Math.abs(durationSeconds - TIMELINE_SECONDS) <= 0.001,
  };
}

function parseMetricValue(kind, output) {
  if (kind === 'vmaf') return Number(output?.pooled_metrics?.vmaf?.mean ?? NaN);
  const text = String(output ?? '');
  const pattern = kind === 'ssim' ? /All:([0-9.]+)/g : /psnr_avg:([0-9.]+)/g;
  const values = [...text.matchAll(pattern)].map((match) => Number(match[1]));
  return values.at(-1) ?? NaN;
}

export function assessPair(pair) {
  const contract = pairFor(pair.pairId);
  if (
    pair.codec !== contract.codec ||
    pair.quality !== contract.quality ||
    pair.extension !== contract.extension ||
    pair.disposition !== contract.disposition
  )
    throw new Error('Pair identity mismatch.');
  assessDirection(pair.directions.forward);
  assessDirection(pair.directions.reverse);
  const combinedBytes = pair.directions.forward.candidateBytes + pair.directions.reverse.candidateBytes;
  const reasons = [];
  const probePass = pair.directions.forward.probe.contractPass && pair.directions.reverse.probe.contractPass;
  const vmafPass = pair.directions.forward.metrics.vmaf.value >= 95 && pair.directions.reverse.metrics.vmaf.value >= 95;
  if (!probePass) reasons.push('probe-contract-failed');
  if (!vmafPass) reasons.push('vmaf-below-95');
  if (combinedBytes > OBJECTIVE_LIMIT) reasons.push('combined-bytes-over-limit');
  const eligible = contract.disposition === 'eligible' && probePass && vmafPass && combinedBytes <= OBJECTIVE_LIMIT;
  return freeze({
    ...pair,
    combinedBytes,
    reductionBytes: ORIGINAL_BYTES - combinedBytes,
    reductionPercent: ((ORIGINAL_BYTES - combinedBytes) / ORIGINAL_BYTES) * 100,
    status:
      contract.disposition === 'measurement-only'
        ? STATUS.MEASUREMENT_ONLY
        : eligible
          ? STATUS.PENDING_VISUAL_REVIEW
          : STATUS.OBJECTIVE_REJECTED,
    eligible,
    rejectionReasons: Object.freeze(reasons),
  });
}

export function nextReceiptSequence(manifest) {
  const sequences = [...(manifest.commandReceipts ?? []), ...(manifest.browserCommandReceipts ?? [])].map(
    (receipt) => receipt.sequence,
  );
  if (
    sequences.some((sequence) => !Number.isInteger(sequence) || sequence < 1) ||
    new Set(sequences).size !== sequences.length
  )
    throw new Error('Receipt sequences must be unique positive integers.');
  return sequences.length ? Math.max(...sequences) + 1 : 1;
}

export function buildVisualInvocations(pair, paths, startingSequence) {
  if (!pair?.eligible || pair.disposition !== 'eligible' || !['h264', 'vp9'].includes(pair.codec))
    throw new Error('Visuals require an eligible H.264/VP9 pair.');
  const result = [];
  let sequence = startingSequence;
  for (const direction of DIRECTIONS) {
    const candidatePath = path.resolve(paths.runRoot, `candidates/${pair.pairId}-${direction}.${pair.extension}`);
    const originalPath = path.resolve(paths.repositoryRoot, sourceFor(direction).relativePath);
    for (const [frame, label] of [
      [0, '000'],
      [72, '072'],
      [144, '144'],
    ]) {
      const graph = `[0:v:0]fps=24,select=eq(n\\,${frame})[candidate];[1:v:0]fps=24,select=eq(n\\,${frame})[original];[candidate][original]hstack=inputs=2`;
      const relative = `visuals/frames/${pair.pairId}-${direction}-frame-${label}.png`;
      result.push(
        invocation(
          sequence++,
          'ffmpeg',
          [
            '-hide_banner',
            '-loglevel',
            'error',
            '-nostdin',
            '-i',
            candidatePath,
            '-i',
            originalPath,
            '-map_metadata',
            '-1',
            '-filter_complex',
            graph,
            '-frames:v',
            '1',
            '-c:v',
            'png',
            '-compression_level',
            '0',
            '-n',
            path.resolve(paths.runRoot, relative),
          ],
          paths.runRoot,
          'visual',
          relative,
        ),
      );
    }
  }
  const focus = path.resolve(paths.repositoryRoot, VISUAL_SUPPORT_CONTRACTS[0].relativePath);
  const forwardOriginal = path.resolve(paths.repositoryRoot, sourceFor('forward').relativePath);
  const reverseOriginal = path.resolve(paths.repositoryRoot, sourceFor('reverse').relativePath);
  const forwardCandidate = path.resolve(paths.runRoot, `candidates/${pair.pairId}-forward.${pair.extension}`);
  const reverseCandidate = path.resolve(paths.runRoot, `candidates/${pair.pairId}-reverse.${pair.extension}`);
  const graph =
    '[0:v:0]fps=24[forward-original];[1:v:0]fps=24[forward-candidate];[forward-original][forward-candidate]hstack=inputs=2,scale=1168:784,setsar=1,settb=1/24,setpts=PTS-STARTPTS[forward];[2:v:0]format=yuv420p,scale=1168:784,setsar=1,fps=24,settb=1/24,setpts=PTS-STARTPTS,trim=duration=1[focus];[3:v:0]fps=24[reverse-candidate];[4:v:0]fps=24[reverse-original];[reverse-candidate][reverse-original]hstack=inputs=2,scale=1168:784,setsar=1,settb=1/24,setpts=PTS-STARTPTS[reverse];[forward][focus][reverse]concat=n=3:v=1:a=0,settb=1/24,setpts=PTS-STARTPTS[sequence]';
  const relative = `visuals/${pair.pairId}-forward-focus-reverse.mp4`;
  result.push(
    invocation(
      sequence,
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-nostdin',
        '-i',
        forwardOriginal,
        '-i',
        forwardCandidate,
        '-loop',
        '1',
        '-framerate',
        '24',
        '-t',
        String(VISUAL_FOCUS_SECONDS),
        '-i',
        focus,
        '-i',
        reverseCandidate,
        '-i',
        reverseOriginal,
        '-map_metadata',
        '-1',
        '-filter_complex',
        graph,
        '-map',
        '[sequence]',
        '-an',
        '-c:v',
        'libx264',
        '-crf',
        '18',
        '-preset',
        'ultrafast',
        '-r',
        '24',
        '-n',
        path.resolve(paths.runRoot, relative),
      ],
      paths.runRoot,
      'visual',
      relative,
    ),
  );
  return freeze(result);
}

export async function createRun(repositoryRoot, runId, implementationBaseline, harnessCommit) {
  assertCommit(implementationBaseline, 'Implementation baseline');
  assertCommit(harnessCommit, 'Harness commit');
  const paths = resolveRunPaths(repositoryRoot, runId, 'create');
  await fsp.mkdir(paths.runRoot, { recursive: true });
  const manifest = {
    schemaVersion: 1,
    runId,
    designCommit: 'c730d66889f00dc23972a7a3ee5f9f1459e29808',
    implementationBaseline,
    harnessCommit,
    status: STATUS.PENDING_OBJECTIVE_EVIDENCE,
    toolVersions: {
      node: process.version,
      ffmpeg: 'unknown',
      ffprobe: 'unknown',
      playwright: 'unknown',
      chromium: null,
    },
    immutableSources: [...ENCODE_SOURCE_CONTRACTS, ...VISUAL_SUPPORT_CONTRACTS],
    candidates: allCandidateSpecs(),
    commandReceipts: [],
    pairResults: [],
    visualReceipts: [],
    browserCommandReceipts: [],
    browserReceipts: [],
    reducedMotion: STATUS.NOT_APPLICABLE_UNTIL_FUTURE_INTEGRATION,
    failedMediaFallback: STATUS.NOT_APPLICABLE_UNTIL_FUTURE_INTEGRATION,
  };
  await writeExclusive(paths.manifestPath, Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));
  return freeze(manifest);
}

export function openRun(repositoryRoot, runId, command) {
  const paths = resolveRunPaths(repositoryRoot, runId, 'open');
  return validateManifestIdentity(paths.runRoot, runId, command);
}

export async function overwriteRun(repositoryRoot, runId, implementationBaseline, harnessCommit) {
  assertCommit(implementationBaseline, 'Implementation baseline');
  assertCommit(harnessCommit, 'Harness commit');
  const paths = resolveRunPaths(repositoryRoot, runId, 'overwrite');
  const manifest = validateManifestIdentity(paths.runRoot, runId, 'overwrite');
  if (manifest.implementationBaseline !== implementationBaseline || manifest.harnessCommit !== harnessCommit)
    throw errorNewRun('Baseline or harness commit mismatch.');
  return manifest;
}

function browserRequestCheck(paths, request) {
  if (!Number.isInteger(request.sequence) || request.sequence < 1)
    throw new Error('Browser sequence must be positive.');
  if (!PAIR_CONTRACTS.filter((pair) => pair.disposition === 'eligible').some((pair) => pair.pairId === request.pairId))
    throw new Error('Browser pair must be eligible H.264/VP9.');
  if (!DIRECTIONS.includes(request.direction) || !VIEWPORTS.includes(request.viewport))
    throw new Error('Browser direction or viewport is invalid.');
  const origin = /^http:\/\/127\.0\.0\.1:(\d{1,5})$/.exec(request.loopbackOrigin);
  if (!origin || Number(origin[1]) < 1 || Number(origin[1]) > 65535)
    throw new Error('Browser origin must be loopback HTTP.');
  const pair = pairFor(request.pairId);
  if (
    request.originalUrlPath !== `/original/${request.direction}.mp4` ||
    request.candidateUrlPath !== `/candidate/${request.pairId}/${request.direction}.${pair.extension}`
  )
    throw new Error('Browser media routes are not allowlisted.');
  for (const field of ['screenshotRelativePath', 'jsonRelativePath']) {
    assertSafeRelative(request[field], `Browser ${field}`);
    if (!request[field].startsWith('browser-receipts/')) throw new Error(`Browser ${field} is not owned.`);
    contained(paths.runRoot, path.resolve(paths.runRoot, request[field]), `Browser ${field}`);
  }
  if (
    request.screenshotRelativePath !==
      `browser-receipts/${request.pairId}-${request.direction}-${request.viewport}.png` ||
    request.jsonRelativePath !== `browser-receipts/${request.pairId}-${request.direction}-${request.viewport}.json`
  )
    throw new Error('Browser artifact paths are not allowlisted.');
}

async function pagePlayback(page, request) {
  if (!page?.evaluate) throw new Error('Chromium page evaluation unavailable.');
  return page.evaluate(
    async ({ pairId, direction, originalUrlPath, candidateUrlPath }) => {
      const section = document.querySelector(`section[data-pair="${pairId}"][data-direction="${direction}"]`);
      const original = section?.querySelector('[data-role="original"]');
      const candidate = section?.querySelector('[data-role="candidate"]');
      if (!(original instanceof HTMLVideoElement) || !(candidate instanceof HTMLVideoElement))
        throw new Error('Direct playback videos missing.');
      const state = {
        loadeddata: false,
        canplay: false,
        ended: false,
        error: false,
        firstFrameReady: false,
        transitionReady: false,
        originalDurationSeconds: 0,
        candidateDurationSeconds: 0,
        maximumDriftSeconds: 0,
      };
      original.src = originalUrlPath;
      candidate.src = candidateUrlPath;
      original.playbackRate = 1;
      candidate.playbackRate = 1;
      const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const event = (target, name) =>
        new Promise((resolve) => {
          if (name === 'loadeddata' && target.readyState >= 2) return resolve(true);
          if (name === 'canplay' && target.readyState >= 3) return resolve(true);
          const onEvent = () => {
            target.removeEventListener(name, onEvent);
            resolve(true);
          };
          const onError = () => {
            target.removeEventListener(name, onEvent);
            resolve(false);
          };
          target.addEventListener(name, onEvent, { once: true });
          target.addEventListener('error', onError, { once: true });
        });
      const loadResults = await Promise.race([
        Promise.all([event(original, 'loadeddata'), event(candidate, 'loadeddata')]),
        timeout(15000).then(() => [false, false]),
      ]);
      state.loadeddata = loadResults.every(Boolean);
      state.firstFrameReady = state.loadeddata;
      if (original.error || candidate.error) state.error = true;
      const readyResults = await Promise.race([
        Promise.all([event(original, 'canplay'), event(candidate, 'canplay')]),
        timeout(15000).then(() => [false, false]),
      ]);
      state.canplay = readyResults.every(Boolean) && original.readyState >= 3 && candidate.readyState >= 3;
      state.transitionReady = state.canplay;
      if (state.error || !state.loadeddata || !state.canplay) {
        state.originalDurationSeconds = Number.isFinite(Number(original.duration)) ? Number(original.duration) : 0;
        state.candidateDurationSeconds = Number.isFinite(Number(candidate.duration)) ? Number(candidate.duration) : 0;
        return state;
      }
      try {
        await Promise.all([original.play(), candidate.play()]);
      } catch {
        state.error = true;
        return state;
      }
      await Promise.race([
        new Promise((resolve) => {
          let ended = 0;
          const finish = () => {
            ended += 1;
            if (ended === 2) {
              state.ended = true;
              resolve();
            }
          };
          const fail = () => {
            state.error = true;
            resolve();
          };
          const correct = () => {
            const drift = Math.abs(original.currentTime - candidate.currentTime);
            state.maximumDriftSeconds = Math.max(state.maximumDriftSeconds, drift);
            if (drift > 0.04) candidate.currentTime = original.currentTime;
          };
          original.addEventListener('ended', finish, { once: true });
          candidate.addEventListener('ended', finish, { once: true });
          original.addEventListener('error', fail, { once: true });
          candidate.addEventListener('error', fail, { once: true });
          original.addEventListener('timeupdate', correct);
          candidate.addEventListener('timeupdate', correct);
        }),
        timeout(20000),
      ]);
      state.originalDurationSeconds = Number.isFinite(Number(original.duration)) ? Number(original.duration) : 0;
      state.candidateDurationSeconds = Number.isFinite(Number(candidate.duration)) ? Number(candidate.duration) : 0;
      return state;
    },
    {
      pairId: request.pairId,
      direction: request.direction,
      originalUrlPath: request.originalUrlPath,
      candidateUrlPath: request.candidateUrlPath,
    },
  );
}

export async function runGuardedBrowserPlayback(paths, request, dependencies) {
  browserRequestCheck(paths, request);
  const manifest = dependencies.readJson(paths.manifestPath);
  if (request.sequence !== nextReceiptSequence(manifest))
    throw new Error('Browser sequence is not next receipt sequence.');
  const before = await dependencies.verifyInputs(paths.repositoryRoot, 'visual');
  const beforeDigest = canonicalSourceDigest(before);
  const startedAt = dependencies.nowIso();
  let browser;
  let context;
  let page;
  let payload;
  let screenshotBytes;
  let browserVersion = 'unknown';
  let failure;
  let verificationError;
  let cleanupError;
  let afterDigest;
  let command;
  let evidence;
  try {
    browser = await dependencies.launchChromium();
    if (typeof browser?.version !== 'function') throw new Error('Chromium version unavailable.');
    browserVersion = await browser.version();
    context = await browser.newContext({
      viewport: request.viewport === 'desktop-1440x1000' ? { width: 1440, height: 1000 } : { width: 390, height: 844 },
    });
    page = await context.newPage();
    await page.goto(`${request.loopbackOrigin}/index.html`);
    payload = await pagePlayback(page, request);
    screenshotBytes = Buffer.from(await page.screenshot());
    const receipt = {
      pairId: request.pairId,
      direction: request.direction,
      viewport: request.viewport,
      jsonRelativePath: request.jsonRelativePath,
      screenshotRelativePath: request.screenshotRelativePath,
      browserName: 'chromium',
      browserVersion,
      playbackRate: 1,
      ...payload,
      screenshotSha256: bytesHash(screenshotBytes),
      browserCommandSequence: request.sequence,
    };
    const jsonBytes = Buffer.from(JSON.stringify(receipt, null, 2) + '\n');
    evidence = { receipt, jsonBytes: jsonBytes.length, jsonSha256: bytesHash(jsonBytes) };
    await dependencies.replaceOwnedFile(path.resolve(paths.runRoot, request.screenshotRelativePath), screenshotBytes);
    await dependencies.replaceOwnedFile(path.resolve(paths.runRoot, request.jsonRelativePath), jsonBytes);
  } catch (error) {
    failure = error;
  } finally {
    const cleanupErrors = [];
    for (const resource of [page, context, browser]) {
      try {
        if (resource?.close) await resource.close();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    cleanupError = cleanupErrors[0];
    try {
      const after = await dependencies.verifyInputs(paths.repositoryRoot, 'visual');
      afterDigest = canonicalSourceDigest(after);
      if (afterDigest !== beforeDigest)
        verificationError = new Error('Immutable visual inputs changed during browser playback.');
    } catch (error) {
      verificationError = error;
    }
  }
  const finishedAt = dependencies.nowIso();
  if (verificationError) throw verificationError;
  if (cleanupError) throw cleanupError;
  if (failure) throw failure;
  if (!payload || !evidence || !screenshotBytes) throw new Error('Browser playback returned no evidence.');
  command = {
    sequence: request.sequence,
    kind: 'browser-playback',
    pairId: request.pairId,
    direction: request.direction,
    viewport: request.viewport,
    loopbackOrigin: request.loopbackOrigin,
    startedAt,
    finishedAt,
    immutableCheckBefore: beforeDigest,
    immutableCheckAfter: afterDigest,
    outcome: 'COMPLETED',
  };
  return { command: freeze(command), evidence: freeze(evidence) };
}

function validateObservationSet(observations, runId, ids) {
  if (
    !observations ||
    observations.schemaVersion !== 1 ||
    observations.runId !== runId ||
    !Array.isArray(observations.observations)
  )
    throw new Error('Observation set identity is invalid.');
  assertExactKeys(observations, ['schemaVersion', 'runId', 'observations'], 'Observation set');
  const actual = observations.observations.map((entry) => entry.pairId);
  if (actual.length !== ids.length || new Set(actual).size !== actual.length || actual.some((id) => !ids.includes(id)))
    throw new Error('Observation coverage must exactly match eligible pairs.');
  for (const observation of observations.observations) {
    assertExactKeys(
      observation,
      [
        'pairId',
        'reviewedViewports',
        'reviewedDirections',
        'normalSpeedVisibleDifference',
        'playbackFailure',
        'firstFrameReady',
        'transitionReady',
        'defects',
        'verdict',
      ],
      'User observation',
    );
    assertExactKeys(observation.reviewedViewports, VIEWPORTS, 'Observation viewport review');
    assertExactKeys(observation.reviewedDirections, DIRECTIONS, 'Observation direction review');
    if (!VIEWPORTS.every((viewport) => typeof observation.reviewedViewports[viewport] === 'boolean'))
      throw new Error('Observation viewport review fields must be boolean.');
    if (!DIRECTIONS.every((direction) => typeof observation.reviewedDirections[direction] === 'boolean'))
      throw new Error('Observation direction review fields must be boolean.');
    if (
      !nullableBoolean(observation.normalSpeedVisibleDifference) ||
      !nullableBoolean(observation.playbackFailure) ||
      !nullableBoolean(observation.firstFrameReady) ||
      !nullableBoolean(observation.transitionReady)
    )
      throw new Error('Observation review fields must be boolean or null.');
    assertExactKeys(
      observation.defects,
      ['frameCorruption', 'colorShift', 'blocking', 'banding', 'droppedEnding', 'transitionSeam'],
      'Observation defects',
    );
    if (!Object.values(observation.defects).every(nullableBoolean))
      throw new Error('Observation defect fields must be boolean or null.');
    if (!['PENDING_USER_APPROVAL', 'VISUALLY_APPROVED', 'VISUALLY_REJECTED'].includes(observation.verdict))
      throw new Error('Observation verdict is invalid.');
  }
  return freeze(JSON.parse(JSON.stringify(observations)));
}

function readAuthenticatedObservations(paths, manifest, ids) {
  if (!ids.length) {
    if (fs.existsSync(paths.visualObservationsPath))
      throw new Error('Zero-eligible decision forbids visual observations.');
    return { observations: { schemaVersion: 1, runId: manifest.runId, observations: [] }, sha256: null };
  }
  const bytes = assertRegularFileIdentitySync(paths.runRoot, 'visual-observations.json');
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error('Visual observations JSON is invalid.');
  }
  return {
    observations: validateObservationSet(parsed, manifest.runId, ids),
    sha256: bytesHash(bytes),
  };
}

function assertDecisionObservationOutcome(manifest, decision, observations) {
  const ids = eligiblePairIds(manifest.pairResults);
  const entries = observations.observations;
  const approved = entries.filter((entry) => entry.verdict === 'VISUALLY_APPROVED');
  const rejected = entries.filter((entry) => entry.verdict === 'VISUALLY_REJECTED');
  if (decision.outcome === 'VISUALLY_APPROVED') {
    if (
      approved.length !== 1 ||
      !ids.includes(approved[0]?.pairId) ||
      decision.winningPairId !== approved[0]?.pairId ||
      rejected.length !== ids.length - 1 ||
      entries.some((entry) => entry.pairId !== approved[0]?.pairId && entry.verdict !== 'VISUALLY_REJECTED')
    )
      throw new Error('Approved decision observations do not identify exactly one winner.');
  } else if (decision.outcome === 'NO_CHANGE') {
    if (entries.length !== ids.length || entries.some((entry) => entry.verdict !== 'VISUALLY_REJECTED'))
      throw new Error('NO_CHANGE decision observations must reject every eligible pair.');
  } else throw new Error('Decision outcome is invalid.');
}

function completeObservation(observation) {
  return (
    observation.reviewedViewports?.['desktop-1440x1000'] === true &&
    observation.reviewedViewports?.['mobile-390x844'] === true &&
    observation.reviewedDirections?.forward === true &&
    observation.reviewedDirections?.reverse === true &&
    typeof observation.normalSpeedVisibleDifference === 'boolean' &&
    typeof observation.playbackFailure === 'boolean' &&
    typeof observation.firstFrameReady === 'boolean' &&
    typeof observation.transitionReady === 'boolean' &&
    Object.values(observation.defects ?? {}).length === 6 &&
    Object.values(observation.defects).every((value) => typeof value === 'boolean')
  );
}

export async function recordObservations(paths, manifest, observations, dependencies) {
  const ids = eligiblePairIds(manifest.pairResults);
  if (manifest.status !== STATUS.PENDING_USER_APPROVAL || !ids.length)
    throw new Error('Observations require pending visual review.');
  validateObjectiveEvidence(paths.runRoot, manifest);
  assertOnlyInventory(paths.runRoot, enumerateOwnedRunFiles(manifest.runId, 'visual', ids));
  const valid = validateObservationSet(observations, manifest.runId, ids);
  const before = await dependencies.verifyInputs(paths.repositoryRoot, 'visual');
  const bytes = Buffer.from(JSON.stringify(valid, null, 2) + '\n');
  let operationError;
  let afterError;
  try {
    await dependencies.replaceOwnedFile(paths.visualObservationsPath, bytes);
    const reread = await fsp.readFile(paths.visualObservationsPath);
    if (bytesHash(reread) !== bytesHash(bytes)) throw new Error('Observation artifact hash mismatch.');
    const rereadObservations = validateObservationSet(JSON.parse(reread.toString('utf8')), manifest.runId, ids);
    if (!deepEqual(rereadObservations, valid)) throw new Error('Observation artifact revalidation mismatch.');
  } catch (error) {
    operationError = error;
  } finally {
    try {
      const after = await dependencies.verifyInputs(paths.repositoryRoot, 'visual');
      if (canonicalSourceDigest(before) !== canonicalSourceDigest(after))
        throw new Error('Immutable visual inputs changed while recording observations.');
    } catch (error) {
      afterError = error;
    }
  }
  if (afterError) throw afterError;
  if (operationError) throw operationError;
  return valid;
}

function assertBrowserEvidence(paths, manifest, ids, dependencies) {
  const expected = ids.flatMap((pairId) =>
    DIRECTIONS.flatMap((direction) => VIEWPORTS.map((viewport) => `${pairId}:${direction}:${viewport}`)),
  );
  const actual = manifest.browserReceipts.map(
    (entry) => `${entry.receipt.pairId}:${entry.receipt.direction}:${entry.receipt.viewport}`,
  );
  if (
    actual.length !== expected.length ||
    new Set(actual).size !== actual.length ||
    expected.some((key) => !actual.includes(key))
  )
    throw new Error('Browser evidence coverage is incomplete.');
  const successfulByPair = new Map(ids.map((id) => [id, true]));
  for (const evidence of manifest.browserReceipts) {
    assertExactKeys(evidence, ['receipt', 'jsonBytes', 'jsonSha256'], 'Browser evidence record');
    const receipt = evidence.receipt;
    assertExactKeys(
      receipt,
      [
        'pairId',
        'direction',
        'viewport',
        'jsonRelativePath',
        'screenshotRelativePath',
        'browserName',
        'browserVersion',
        'playbackRate',
        'loadeddata',
        'canplay',
        'ended',
        'error',
        'firstFrameReady',
        'transitionReady',
        'originalDurationSeconds',
        'candidateDurationSeconds',
        'maximumDriftSeconds',
        'screenshotSha256',
        'browserCommandSequence',
      ],
      'Browser receipt',
    );
    if (
      !ids.includes(receipt.pairId) ||
      !DIRECTIONS.includes(receipt.direction) ||
      !VIEWPORTS.includes(receipt.viewport) ||
      receipt.jsonRelativePath !== `browser-receipts/${receipt.pairId}-${receipt.direction}-${receipt.viewport}.json` ||
      receipt.screenshotRelativePath !==
        `browser-receipts/${receipt.pairId}-${receipt.direction}-${receipt.viewport}.png`
    )
      throw new Error('Browser evidence route identity failed.');
    if (
      receipt.browserName !== 'chromium' ||
      receipt.playbackRate !== 1 ||
      typeof receipt.jsonRelativePath !== 'string' ||
      typeof receipt.screenshotRelativePath !== 'string' ||
      !Number.isFinite(receipt.originalDurationSeconds) ||
      !Number.isFinite(receipt.candidateDurationSeconds) ||
      typeof receipt.browserVersion !== 'string' ||
      !receipt.browserVersion.trim() ||
      /^(?:unknown|unknown version|n\/a|not available|unavailable)$/i.test(receipt.browserVersion.trim())
    )
      throw new Error('Browser evidence playback contract failed.');
    if (
      !['loadeddata', 'canplay', 'ended', 'error', 'firstFrameReady', 'transitionReady'].every(
        (field) => typeof receipt[field] === 'boolean',
      ) ||
      !Number.isSafeInteger(receipt.browserCommandSequence) ||
      receipt.browserCommandSequence < 1
    )
      throw new Error('Browser evidence media fields must be boolean and linked by sequence.');
    if (!Number.isSafeInteger(evidence.jsonBytes) || evidence.jsonBytes < 1)
      throw new Error('Browser evidence byte count is invalid.');
    assertSha(evidence.jsonSha256, 'Browser evidence JSON hash');
    assertSha(receipt.screenshotSha256, 'Browser screenshot hash');
    const jsonPath = path.resolve(paths.runRoot, receipt.jsonRelativePath);
    const screenshotPath = path.resolve(paths.runRoot, receipt.screenshotRelativePath);
    if (!fs.existsSync(jsonPath) || !fs.existsSync(screenshotPath))
      throw new Error('Browser evidence artifact is missing.');
    assertSafeRelative(receipt.jsonRelativePath, 'Browser JSON artifact');
    assertSafeRelative(receipt.screenshotRelativePath, 'Browser screenshot artifact');
    contained(paths.runRoot, jsonPath, 'Browser JSON artifact');
    contained(paths.runRoot, screenshotPath, 'Browser screenshot artifact');
    const jsonBytes = assertRegularFileIdentitySync(
      paths.runRoot,
      receipt.jsonRelativePath,
      evidence.jsonBytes,
      evidence.jsonSha256,
    );
    const screenshotBytes = assertRegularFileIdentitySync(paths.runRoot, receipt.screenshotRelativePath);
    let persistedReceipt;
    try {
      persistedReceipt = JSON.parse(jsonBytes.toString('utf8'));
    } catch {
      throw new Error('Browser evidence JSON is invalid.');
    }
    if (!deepEqual(persistedReceipt, receipt)) throw new Error('Browser evidence JSON content mismatch.');
    if (
      jsonBytes.length !== evidence.jsonBytes ||
      bytesHash(jsonBytes) !== evidence.jsonSha256 ||
      bytesHash(screenshotBytes) !== receipt.screenshotSha256
    )
      throw new Error('Browser evidence hash mismatch.');
    const command = dependencies
      .readJson(paths.manifestPath)
      .browserCommandReceipts.find((entry) => entry.sequence === receipt.browserCommandSequence);
    if (
      !command ||
      command.kind !== 'browser-playback' ||
      command.outcome !== 'COMPLETED' ||
      command.pairId !== receipt.pairId ||
      command.direction !== receipt.direction ||
      command.viewport !== receipt.viewport
    )
      throw new Error('Browser evidence command linkage failed.');
    const successful =
      receipt.loadeddata === true &&
      receipt.canplay === true &&
      receipt.ended === true &&
      receipt.error === false &&
      receipt.firstFrameReady === true &&
      receipt.transitionReady === true &&
      Number.isFinite(receipt.maximumDriftSeconds) &&
      receipt.maximumDriftSeconds >= 0 &&
      Math.abs(receipt.originalDurationSeconds - TIMELINE_SECONDS) <= 0.001 &&
      Math.abs(receipt.candidateDurationSeconds - TIMELINE_SECONDS) <= 0.001 &&
      receipt.maximumDriftSeconds <= 0.04;
    if (!successful) successfulByPair.set(receipt.pairId, false);
  }
  return successfulByPair;
}

const PROTECTED_PLAN_PATHS = Object.freeze([
  'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
  'docs/superpowers/plans/phase-2-task-3-execution.md',
]);

async function protectedPlanHashes(paths, dependencies) {
  if (dependencies.getProtectedPlanHashes) return dependencies.getProtectedPlanHashes(paths.repositoryRoot);
  return Promise.all(
    PROTECTED_PLAN_PATHS.map(async (relativePath) => {
      const identity = await hashFile(path.resolve(paths.repositoryRoot, relativePath));
      return { relativePath, bytes: identity.bytes, sha256: identity.sha256 };
    }),
  );
}

function reportText(inputs) {
  const { manifest, objectiveEvidence, decision, userObservations, sourceHashesAfter, protectedPlanHashesAfter } =
    inputs;
  const eligibleIds = manifest.pairResults
    .filter((pair) => pair.eligible && pair.disposition === 'eligible')
    .map((pair) => pair.pairId);
  const av1Ids = manifest.pairResults.filter((pair) => pair.codec === 'av1').map((pair) => pair.pairId);
  const report = {
    schemaVersion: 1,
    runId: manifest.runId,
    status: manifest.status,
    designCommit: manifest.designCommit,
    implementationBaseline: manifest.implementationBaseline,
    harnessCommit: manifest.harnessCommit,
    objectiveManifestSha256: objectiveEvidence.objectiveManifestSha256,
    toolVersions: manifest.toolVersions,
    visualBrowserEvidence: {
      eligiblePairIds: eligibleIds,
      visualReceiptCount: manifest.visualReceipts.length,
      browserCommandReceiptCount: manifest.browserCommandReceipts.length,
      browserReceiptCount: manifest.browserReceipts.length,
      browserJsonCount: manifest.browserReceipts.length,
      browserPngCount: manifest.browserReceipts.length,
      av1PairIds: av1Ids,
      av1Explanation: 'AV1 remains measurement-only and cannot become a visual winner in Task 1.',
    },
    settings: {
      objectiveLimitBytes: OBJECTIVE_LIMIT,
      originalCombinedBytes: ORIGINAL_BYTES,
      timelineSeconds: TIMELINE_SECONDS,
      sourceStreams: '0:v:0',
      audio: 'none',
      pixelFormat: 'yuv420p',
      dimensions: '1168x784',
      frameRate: '24/1',
      frameCount: 145,
      candidateContracts: manifest.candidates,
    },
    commands: manifest.commandReceipts.map(({ sequence, kind, pairId, direction, displayArgs, exitCode }) => ({
      sequence,
      kind: kind === 'probe-metadata' ? 'probe' : kind === 'probe-streams' ? 'stream-probe' : kind,
      pairId,
      direction,
      displayArgs,
      exitCode,
    })),
    probes: manifest.pairResults.map((pair) => ({
      pairId: pair.pairId,
      forward: Object.fromEntries(
        Object.entries(pair.directions.forward.probe).filter(
          ([key]) => !['metadataRelativePath', 'streamsRelativePath'].includes(key),
        ),
      ),
      reverse: Object.fromEntries(
        Object.entries(pair.directions.reverse.probe).filter(
          ([key]) => !['metadataRelativePath', 'streamsRelativePath'].includes(key),
        ),
      ),
    })),
    bytes: manifest.pairResults.map((pair) => ({
      pairId: pair.pairId,
      forward: pair.directions.forward.candidateBytes,
      reverse: pair.directions.reverse.candidateBytes,
      combined: pair.combinedBytes,
    })),
    metrics: manifest.pairResults.map((pair) => ({
      pairId: pair.pairId,
      forward: Object.fromEntries(METRICS.map((kind) => [kind, pair.directions.forward.metrics[kind].value])),
      reverse: Object.fromEntries(METRICS.map((kind) => [kind, pair.directions.reverse.metrics[kind].value])),
    })),
    arithmetic: manifest.pairResults.map((pair) => ({
      pairId: pair.pairId,
      reductionBytes: pair.reductionBytes,
      reductionPercent: pair.reductionPercent,
      combinedBytes: pair.combinedBytes,
      originalCombinedBytes: ORIGINAL_BYTES,
    })),
    eligibility: manifest.pairResults.map((pair) => ({
      pairId: pair.pairId,
      disposition: pair.disposition,
      eligible: pair.eligible,
      status: pair.status,
      rejectionReasons: pair.rejectionReasons,
    })),
    sourceHashesAfter,
    protectedPlanHashesAfter,
    observations: userObservations,
    decision,
  };
  return `# Phase 6C Hero Video Compression Experiment\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`;
}

export async function recordDecision(paths, manifest, observations, requested, dependencies) {
  const ids = eligiblePairIds(manifest.pairResults);
  if (manifest.status !== STATUS.PENDING_OBJECTIVE_EVIDENCE) validateObjectiveEvidence(paths.runRoot, manifest);
  const valid = validateObservationSet(observations, manifest.runId, ids);
  const persistedObservations = readAuthenticatedObservations(paths, manifest, ids);
  if (!deepEqual(persistedObservations.observations, valid))
    throw new Error('Submitted observations do not match persisted visual observations.');
  if (
    !requested ||
    !['approved', 'no-change'].includes(requested.outcome) ||
    typeof requested.approvalReference !== 'string' ||
    !requested.approvalReference.trim()
  )
    throw new Error('Decision request is invalid.');
  if (requested.outcome === 'no-change' && requested.candidate !== null)
    throw new Error('NO_CHANGE decision requires candidate null.');
  if (requested.outcome === 'approved' && typeof requested.candidate !== 'string')
    throw new Error('Approved decision requires an exact candidate.');
  if (!ids.length) {
    if (requested.outcome !== 'no-change' || valid.observations.length || manifest.status !== STATUS.NO_CHANGE)
      throw new Error('Zero-eligible decision requires NO_CHANGE and empty observations.');
    assertOnlyInventory(paths.runRoot, enumerateOwnedRunFiles(manifest.runId, 'objective', []));
  } else {
    if (manifest.status !== STATUS.PENDING_USER_APPROVAL) throw new Error('Decision requires pending user approval.');
    assertOnlyInventory(paths.runRoot, enumerateOwnedRunFiles(manifest.runId, 'visual', ids));
    assertVisualReceiptIdentity(manifest, paths.runRoot);
    const browserSuccess = assertBrowserEvidence(paths, manifest, ids, dependencies);
    if (valid.observations.some((entry) => !completeObservation(entry)))
      throw new Error('Every observation must be complete.');
    const winners = valid.observations.filter((entry) => entry.verdict === 'VISUALLY_APPROVED');
    if (requested.outcome === 'approved' && !ids.includes(requested.candidate))
      throw new Error('Approval candidate must be eligible.');
    if (
      requested.outcome === 'approved' &&
      (winners.length !== 1 ||
        winners[0].pairId !== requested.candidate ||
        browserSuccess.get(winners[0].pairId) !== true ||
        valid.observations.some(
          (entry) => entry.pairId !== winners[0].pairId && entry.verdict !== 'VISUALLY_REJECTED',
        ) ||
        winners.some(
          (entry) =>
            entry.normalSpeedVisibleDifference ||
            entry.playbackFailure ||
            !entry.firstFrameReady ||
            !entry.transitionReady ||
            Object.values(entry.defects).some((value) => value),
        ))
    )
      throw new Error('Approval requires exactly one defect-free observed pair.');
    if (requested.outcome === 'no-change' && valid.observations.some((entry) => entry.verdict !== 'VISUALLY_REJECTED'))
      throw new Error('NO_CHANGE requires all eligible pairs rejected.');
  }
  const objectiveEvidence = dependencies.readJson(paths.objectiveEvidencePath);
  assertSha(objectiveEvidence.objectiveManifestSha256, 'Objective manifest hash');
  const decision = freeze({
    schemaVersion: 1,
    runId: manifest.runId,
    implementationBaseline: manifest.implementationBaseline,
    harnessCommit: manifest.harnessCommit,
    objectiveManifestSha256: objectiveEvidence.objectiveManifestSha256,
    visualObservationsSha256: persistedObservations.sha256,
    outcome: requested.outcome === 'approved' ? 'VISUALLY_APPROVED' : 'NO_CHANGE',
    winningPairId: requested.outcome === 'approved' ? requested.candidate : null,
    approvalReference: requested.approvalReference,
    productionChanged: false,
    integrationAuthorized: false,
  });
  await dependencies.writeFileExclusive(paths.decisionPath, Buffer.from(JSON.stringify(decision, null, 2) + '\n'));
  const updated = {
    ...manifest,
    status: decision.outcome === 'VISUALLY_APPROVED' ? STATUS.VISUALLY_APPROVED : STATUS.NO_CHANGE,
  };
  await dependencies.writeManifestAtomic(paths, updated);
  const sourceHashesAfter = await dependencies.verifyInputs(paths.repositoryRoot, 'visual');
  const protectedHashesAfter = await protectedPlanHashes(paths, dependencies);
  await dependencies.replaceOwnedFile(
    paths.deliveryReportPath,
    reportText({
      manifest: updated,
      objectiveEvidence,
      decision,
      userObservations: valid,
      sourceHashesAfter,
      protectedPlanHashesAfter: protectedHashesAfter,
    }),
  );
  return freeze({ decision, manifest: updated });
}

function parseCli(argv) {
  if (argv.length === 1 && argv[0] === '--help') return { command: 'help' };
  const command = argv[0];
  if (!['run', 'visuals', 'observations', 'decision'].includes(command)) throw new Error('Unknown command.');
  const values = {};
  const allowedValues = {
    run: new Set(['run-id']),
    visuals: new Set(['run-id']),
    observations: new Set(['run-id']),
    decision: new Set(['run-id', 'outcome', 'candidate', 'approval-reference']),
  }[command];
  const allowedBooleans = {
    run: new Set(['overwrite-owned-run']),
    visuals: new Set(),
    observations: new Set(['stdin']),
    decision: new Set(),
  }[command];
  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    if (typeof flag !== 'string' || !flag.startsWith('--')) throw new Error('Unknown or incomplete flag.');
    const name = flag.slice(2);
    if (allowedBooleans.has(name)) {
      if (values[name]) throw new Error(`Duplicate flag: ${flag}`);
      values[name] = true;
      continue;
    }
    if (!allowedValues.has(name) || values[name] !== undefined || !argv[index + 1] || argv[index + 1].startsWith('--'))
      throw new Error('Unknown or incomplete flag.');
    values[name] = argv[++index];
  }
  if (!values['run-id']) throw new Error(`${command} requires --run-id.`);
  if (command === 'decision' && (!values.outcome || !['approved', 'no-change'].includes(values.outcome)))
    throw new Error('Decision requires --outcome and --approval-reference.');
  if (command === 'decision' && (!values['approval-reference'] || !values['approval-reference'].trim()))
    throw new Error('Decision requires --outcome and --approval-reference.');
  if (command === 'decision' && values.outcome === 'no-change' && values.candidate !== undefined)
    throw new Error('NO_CHANGE decision forbids --candidate.');
  if (command === 'decision' && values.outcome === 'approved' && values.candidate === undefined)
    throw new Error('Approved decision requires --candidate.');
  if (command === 'observations' && !values.stdin) throw new Error('Observations require --stdin.');
  return { command, ...values, overwrite: values['overwrite-owned-run'] === true };
}

function baselineReceipt(repositoryRoot, dependencies) {
  const receipt = dependencies.readJson(
    path.resolve(resolveExperimentRoot(repositoryRoot), 'implementation-baseline.json'),
  );
  assertCommit(receipt.implementationBaseline, 'Implementation baseline');
  assertCommit(receipt.designCommit, 'Design commit');
  assertCommit(receipt.harnessCommit, 'Harness commit');
  return receipt;
}

async function runObjective(paths, manifest, dependencies) {
  let current = { ...manifest, commandReceipts: [], pairResults: [] };
  if (dependencies.getToolVersions) current.toolVersions = await dependencies.getToolVersions();
  assertCapturedToolVersions(current.toolVersions);
  await Promise.all(
    ['candidates', 'probes', 'metrics', 'passlogs'].map((directory) =>
      fsp.mkdir(path.resolve(paths.runRoot, directory), { recursive: true }),
    ),
  );
  const directions = new Map();
  const outputs = new Map();
  const runnerDependencies = {
    ...dependencies,
    spawnProcess: async (item) => {
      const result = await dependencies.spawnProcess(item);
      outputs.set(item.sequence, result);
      return result;
    },
  };
  for (const candidate of allCandidateSpecs()) {
    const encodeSequences = [];
    const probeSequences = [];
    const metricSequences = [];
    for (const item of buildEncodeInvocations(candidate, paths, nextReceiptSequence(current))) {
      const receipt = await runGuardedProcess(paths, 'source', item, runnerDependencies);
      current.commandReceipts = [...current.commandReceipts, receipt];
      encodeSequences.push(receipt.sequence);
    }
    for (const item of buildProbeInvocations(candidate, paths, nextReceiptSequence(current))) {
      const receipt = await runGuardedProcess(paths, 'source', item, runnerDependencies);
      current.commandReceipts = [...current.commandReceipts, receipt];
      probeSequences.push(receipt.sequence);
      const output = outputs.get(item.sequence)?.stdout ?? Buffer.alloc(0);
      const outputPath = path.resolve(paths.runRoot, item.artifactRelativePath);
      if (fs.existsSync(outputPath)) await dependencies.replaceOwnedFile(outputPath, output);
      else await dependencies.writeFileExclusive(outputPath, output);
    }
    for (const item of buildMetricInvocations(candidate, paths, nextReceiptSequence(current))) {
      const receipt = await runGuardedProcess(paths, 'source', item, runnerDependencies);
      current.commandReceipts = [...current.commandReceipts, receipt];
      metricSequences.push(receipt.sequence);
    }
    const metadataPath = path.resolve(paths.runRoot, `probes/${candidate.pairId}-${candidate.direction}-metadata.json`);
    const streamsPath = path.resolve(paths.runRoot, `probes/${candidate.pairId}-${candidate.direction}-streams.json`);
    if (!fs.existsSync(metadataPath) || !fs.existsSync(streamsPath))
      throw new Error(`Missing objective probe artifact: ${candidate.pairId}-${candidate.direction}`);
    const metadata = readJsonSync(metadataPath);
    const streams = readJsonSync(streamsPath);
    const relative = candidate.candidateRelativePath;
    const candidatePath = path.resolve(paths.runRoot, relative);
    if (!fs.existsSync(candidatePath)) throw new Error(`Missing objective candidate artifact: ${relative}`);
    const file = await hashFile(candidatePath);
    const parsedProbe = parseProbe(metadata, streams, candidate, file.bytes);
    const direction = {
      direction: candidate.direction,
      candidateRelativePath: relative,
      candidateBytes: file.bytes,
      candidateSha256: file.sha256,
      probe: {
        ...parsedProbe,
      },
      metrics: Object.fromEntries(
        METRICS.map((kind) => [
          kind,
          {
            kind,
            relativePath: `metrics/${candidate.pairId}-${candidate.direction}-${kind}.${kind === 'vmaf' ? 'json' : 'log'}`,
            value: (() => {
              const metricPath = path.resolve(
                paths.runRoot,
                `metrics/${candidate.pairId}-${candidate.direction}-${kind}.${kind === 'vmaf' ? 'json' : 'log'}`,
              );
              if (!fs.existsSync(metricPath)) throw new Error(`Missing objective metric artifact: ${metricPath}`);
              const metricBytes = fs.readFileSync(metricPath);
              return parseMetricValue(
                kind,
                kind === 'vmaf' ? JSON.parse(metricBytes.toString('utf8')) : metricBytes.toString('utf8'),
              );
            })(),
            sha256: (() => {
              const metricPath = path.resolve(
                paths.runRoot,
                `metrics/${candidate.pairId}-${candidate.direction}-${kind}.${kind === 'vmaf' ? 'json' : 'log'}`,
              );
              if (!fs.existsSync(metricPath)) throw new Error(`Missing objective metric artifact: ${metricPath}`);
              return bytesHash(fs.readFileSync(metricPath));
            })(),
            distortedInput: { inputIndex: 0, candidateRelativePath: relative },
            referenceInput: { inputIndex: 1, sourceRelativePath: candidate.sourceRelativePath },
            filterPadOrder: '[dist][ref]',
          },
        ]),
      ),
      encodeReceiptSequences: encodeSequences,
      probeReceiptSequences: probeSequences,
      metricReceiptSequences: metricSequences,
    };
    directions.set(`${candidate.pairId}:${candidate.direction}`, direction);
  }
  current.pairResults = PAIR_CONTRACTS.map((pair) =>
    assessPair({
      ...pair,
      directions: {
        forward: directions.get(`${pair.pairId}:forward`),
        reverse: directions.get(`${pair.pairId}:reverse`),
      },
    }),
  );
  current.status = current.pairResults.some((pair) => pair.eligible)
    ? STATUS.OBJECTIVE_EVIDENCE_READY
    : STATUS.NO_CHANGE;
  const objectiveIds = eligiblePairIds(current.pairResults);
  const objectiveInventory = enumerateOwnedRunFiles(current.runId, 'objective', objectiveIds);
  const artifactsBeforeSnapshots = new Set(objectiveInventory);
  artifactsBeforeSnapshots.delete('manifest.json');
  artifactsBeforeSnapshots.delete('objective-manifest.json');
  artifactsBeforeSnapshots.delete('objective-evidence.json');
  assertOnlyInventory(paths.runRoot, new Set(['manifest.json', ...artifactsBeforeSnapshots]));
  const objectiveBytes = Buffer.from(JSON.stringify(current, null, 2) + '\n');
  const objectivePath = paths.objectiveManifestPath;
  if (fs.existsSync(objectivePath)) await dependencies.replaceOwnedFile(objectivePath, objectiveBytes);
  else await dependencies.writeFileExclusive(objectivePath, objectiveBytes);
  const objectiveEvidence = {
    schemaVersion: 1,
    runId: current.runId,
    implementationBaseline: current.implementationBaseline,
    harnessCommit: current.harnessCommit,
    objectiveManifestSha256: bytesHash(objectiveBytes),
    createdAt: dependencies.nowIso(),
  };
  if (fs.existsSync(paths.objectiveEvidencePath))
    await dependencies.replaceOwnedFile(
      paths.objectiveEvidencePath,
      Buffer.from(JSON.stringify(objectiveEvidence, null, 2) + '\n'),
    );
  else
    await dependencies.writeFileExclusive(
      paths.objectiveEvidencePath,
      Buffer.from(JSON.stringify(objectiveEvidence, null, 2) + '\n'),
    );
  assertOnlyInventory(paths.runRoot, objectiveInventory);
  await dependencies.writeManifestAtomic(paths, current);
  const sourceHashesAfter = await dependencies.verifyInputs(paths.repositoryRoot, 'visual');
  const protectedHashesAfter = await protectedPlanHashes(paths, dependencies);
  await dependencies.replaceOwnedFile(
    paths.deliveryReportPath,
    reportText({
      manifest: current,
      objectiveEvidence,
      decision: null,
      userObservations: { schemaVersion: 1, runId: current.runId, observations: [] },
      sourceHashesAfter,
      protectedPlanHashesAfter: protectedHashesAfter,
    }),
  );
  return freeze(current);
}

function buildIndex(ids) {
  const sections = ids
    .flatMap((pairId) => {
      const pair = pairFor(pairId);
      return DIRECTIONS.map(
        (direction) =>
          `<section data-pair="${pairId}" data-direction="${direction}"><h2>${pairId} ${direction}</h2><div class="videos"><video data-role="original" src="/original/${direction}.mp4" muted playsinline preload="auto"></video><video data-role="candidate" src="/candidate/${pairId}/${direction}.${pair.extension}" muted playsinline preload="auto"></video></div><div class="controls"><button data-action="play">Play</button><button data-action="pause">Pause</button><label>Seek <input data-action="seek" type="range" min="0" max="6.041667" step="0.001" value="0"></label></div></section>`,
      );
    })
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hero video direct playback</title><style>body{font:16px system-ui;margin:0;padding:16px}section{border:1px solid #ccc;margin:0 0 16px;padding:12px}.videos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}video{background:#111;width:100%}.controls{display:flex;gap:8px;align-items:center;margin-top:8px}@media(max-width:640px){.videos{grid-template-columns:1fr}.controls{flex-wrap:wrap}}</style></head><body><p>PRIMARY_DIRECT_PLAYBACK</p><p>LOCAL_REVIEW_SEQUENCE_NOT_RUNTIME_INTERACTION_PROOF</p>${sections}<script>document.querySelectorAll('section').forEach((section)=>{const original=section.querySelector('[data-role="original"]');const candidate=section.querySelector('[data-role="candidate"]');original.playbackRate=1;candidate.playbackRate=1;const sync=()=>{candidate.currentTime=original.currentTime};section.querySelector('[data-action="play"]').addEventListener('click',()=>Promise.all([original.play(),candidate.play()]));section.querySelector('[data-action="pause"]').addEventListener('click',()=>{original.pause();candidate.pause()});section.querySelector('[data-action="seek"]').addEventListener('input',(event)=>{original.currentTime=Number(event.target.value);candidate.currentTime=Number(event.target.value)});original.addEventListener('timeupdate',()=>{if(Math.abs(original.currentTime-candidate.currentTime)>0.04)sync()});[original,candidate].forEach((video)=>['loadeddata','canplay','ended','error'].forEach((event)=>video.addEventListener(event,()=>console.log(event)))})</script></body></html>`;
}

function buildVisualReceipts(paths, pairs, indexRelativePath = 'visuals/index.html', indexBytes = null) {
  const indexFile = indexBytes ?? fs.readFileSync(path.resolve(paths.runRoot, indexRelativePath));
  const receipts = [
    {
      kind: 'direct-playback-index',
      pairId: null,
      direction: null,
      frameIndex: null,
      timeSeconds: null,
      relativePath: indexRelativePath,
      bytes: indexFile.length,
      sha256: bytesHash(indexFile),
      authority: 'PRIMARY_DIRECT_PLAYBACK',
    },
  ];
  for (const pair of pairs) {
    for (const item of buildVisualInvocations(pair, paths, 1)) {
      if (!item.artifactRelativePath) continue;
      const bytes = fs.readFileSync(path.resolve(paths.runRoot, item.artifactRelativePath));
      const frame = item.artifactRelativePath.match(/-(forward|reverse)-frame-(000|072|144)\.png$/);
      const sequence = item.artifactRelativePath.endsWith('-forward-focus-reverse.mp4');
      receipts.push({
        kind: frame ? 'lossless-frame' : sequence ? 'local-sequence' : 'direct-playback-index',
        pairId: pair.pairId,
        direction: frame ? frame[1] : null,
        frameIndex: frame ? Number(frame[2]) : null,
        timeSeconds: frame ? { 0: 0, 72: 3, 144: 6 }[Number(frame[2])] : null,
        relativePath: item.artifactRelativePath,
        bytes: bytes.length,
        sha256: bytesHash(bytes),
        authority: frame ? 'LOSSLESS_FRAME_EVIDENCE' : 'NON_AUTHORITATIVE_CONVENIENCE_RENDER',
      });
    }
  }
  return freeze(receipts);
}

function loopbackRoutes(paths, manifest, indexBytes) {
  const ids = eligiblePairIds(manifest.pairResults);
  const routes = [
    {
      urlPath: '/index.html',
      absolutePath: path.resolve(paths.runRoot, 'visuals/index.html'),
      mediaType: 'text/html; charset=utf-8',
      expectedBytes: indexBytes.length,
      expectedSha256: bytesHash(indexBytes),
    },
  ];
  for (const direction of DIRECTIONS) {
    const source = manifest.immutableSources.find(
      (entry) => entry.role === 'encode-source' && entry.direction === direction,
    );
    if (!source || !deepEqual(source, sourceFor(direction)))
      throw new Error('Manifest source route identity mismatch.');
    routes.push({
      urlPath: `/original/${direction}.mp4`,
      absolutePath: path.resolve(paths.repositoryRoot, source.relativePath),
      mediaType: 'video/mp4',
      expectedBytes: source.bytes,
      expectedSha256: source.sha256,
    });
  }
  for (const pairId of ids) {
    const pair = pairFor(pairId);
    const manifestPair = manifest.pairResults.find((entry) => entry.pairId === pairId);
    if (!manifestPair || manifestPair.disposition !== 'eligible' || !manifestPair.eligible)
      throw new Error('Manifest candidate route eligibility mismatch.');
    for (const direction of DIRECTIONS) {
      const result = manifestPair.directions[direction];
      const relative = `candidates/${pairId}-${direction}.${pair.extension}`;
      if (
        result.candidateRelativePath !== relative ||
        !Number.isSafeInteger(result.candidateBytes) ||
        !HASH.test(result.candidateSha256)
      )
        throw new Error('Manifest candidate route identity mismatch.');
      const file = path.resolve(paths.runRoot, relative);
      if (!fs.existsSync(file)) throw new Error(`Missing candidate route: ${relative}`);
      const identity = fs.lstatSync(file);
      if (!identity.isFile()) throw new Error(`Candidate route is not a regular file: ${relative}`);
      if (identity.size !== result.candidateBytes || bytesHash(fs.readFileSync(file)) !== result.candidateSha256)
        throw new Error(`Manifest candidate route bytes/hash mismatch: ${relative}`);
      routes.push({
        urlPath: `/candidate/${pairId}/${direction}.${pair.extension}`,
        absolutePath: file,
        mediaType: pair.extension === 'mp4' ? 'video/mp4' : 'video/webm',
        expectedBytes: identity.size,
        expectedSha256: bytesHash(fs.readFileSync(file)),
      });
    }
  }
  return routes;
}

export async function main(argv, injectedDependencies) {
  const dependencies = { ...defaultDependencies(), ...(injectedDependencies ?? {}) };
  const parsed = parseCli([...argv]);
  if (parsed.command === 'help') {
    console.log(
      'Usage: node scripts/hero-video-compression-experiment.mjs <run|visuals|observations|decision> --run-id <safe-id>',
    );
    return 0;
  }
  const repositoryRoot = path.resolve(
    dependencies.repositoryRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  );
  const receipt = baselineReceipt(repositoryRoot, dependencies);
  if (parsed.command === 'run') {
    let paths;
    let manifest;
    if (parsed.overwrite) {
      manifest = await overwriteRun(
        repositoryRoot,
        parsed['run-id'],
        receipt.implementationBaseline,
        receipt.harnessCommit,
      );
      paths = resolveRunPaths(repositoryRoot, parsed['run-id'], 'overwrite');
    } else {
      manifest = await createRun(
        repositoryRoot,
        parsed['run-id'],
        receipt.implementationBaseline,
        receipt.harnessCommit,
      );
      paths = resolveRunPaths(repositoryRoot, parsed['run-id'], 'open');
    }
    await runObjective(paths, manifest, dependencies);
    return 0;
  }
  const paths = resolveRunPaths(repositoryRoot, parsed['run-id'], 'open');
  if (parsed.command === 'visuals') {
    const manifest = openRun(repositoryRoot, parsed['run-id'], 'visuals');
    const ids = eligiblePairIds(manifest.pairResults);
    const indexBytes = Buffer.from(buildIndex(ids));
    await dependencies.replaceOwnedFile(path.resolve(paths.runRoot, 'visuals/index.html'), indexBytes);
    const server = await dependencies.startLoopbackServer({
      host: '127.0.0.1',
      port: 0,
      routes: loopbackRoutes(paths, manifest, indexBytes),
    });
    if (
      server.requestedPort !== 0 ||
      !Number.isInteger(server.resolvedPort) ||
      server.resolvedPort < 1 ||
      server.resolvedPort > 65535 ||
      server.origin !== `http://127.0.0.1:${server.resolvedPort}`
    ) {
      await server.close();
      throw new Error('Loopback server handle is invalid.');
    }
    let current = { ...manifest };
    let serverClosed = false;
    const closeServer = async () => {
      if (serverClosed) return;
      serverClosed = true;
      await server.close();
    };
    try {
      await fsp.mkdir(path.resolve(paths.runRoot, 'visuals/frames'), { recursive: false });
      for (const pairId of ids) {
        const pair = current.pairResults.find((entry) => entry.pairId === pairId);
        for (const item of buildVisualInvocations(pair, paths, nextReceiptSequence(current))) {
          const receipt = await runGuardedProcess(paths, 'visual', item, dependencies);
          current.commandReceipts = [...current.commandReceipts, receipt];
          await dependencies.writeManifestAtomic(paths, current);
        }
        for (const direction of DIRECTIONS)
          for (const viewport of VIEWPORTS) {
            const pairContract = pairFor(pairId);
            const result = await runGuardedBrowserPlayback(
              paths,
              {
                sequence: nextReceiptSequence(current),
                pairId,
                direction,
                viewport,
                loopbackOrigin: server.origin,
                originalUrlPath: `/original/${direction}.mp4`,
                candidateUrlPath: `/candidate/${pairId}/${direction}.${pairContract.extension}`,
                screenshotRelativePath: `browser-receipts/${pairId}-${direction}-${viewport}.png`,
                jsonRelativePath: `browser-receipts/${pairId}-${direction}-${viewport}.json`,
              },
              dependencies,
            );
            current.browserCommandReceipts = [...current.browserCommandReceipts, result.command];
            current.browserReceipts = [...current.browserReceipts, result.evidence];
            current.toolVersions = { ...current.toolVersions, chromium: result.evidence.receipt.browserVersion };
            await dependencies.writeManifestAtomic(paths, current);
          }
      }
      current.visualReceipts = buildVisualReceipts(
        paths,
        ids.map((pairId) => current.pairResults.find((entry) => entry.pairId === pairId)),
        'visuals/index.html',
        indexBytes,
      );
      const pending = {
        schemaVersion: 1,
        runId: current.runId,
        observations: ids.map((pairId) => ({
          pairId,
          reviewedViewports: { 'desktop-1440x1000': false, 'mobile-390x844': false },
          reviewedDirections: { forward: false, reverse: false },
          normalSpeedVisibleDifference: null,
          playbackFailure: null,
          firstFrameReady: null,
          transitionReady: null,
          defects: {
            frameCorruption: null,
            colorShift: null,
            blocking: null,
            banding: null,
            droppedEnding: null,
            transitionSeam: null,
          },
          verdict: 'PENDING_USER_APPROVAL',
        })),
      };
      if (dependencies.presentReviewPackage)
        await dependencies.presentReviewPackage({
          origin: server.origin,
          indexPath: path.resolve(paths.runRoot, 'visuals/index.html'),
          eligiblePairIds: ids,
        });
      await closeServer();
      await dependencies.replaceOwnedFile(
        paths.visualObservationsPath,
        Buffer.from(JSON.stringify(pending, null, 2) + '\n'),
      );
      current.status = STATUS.PENDING_USER_APPROVAL;
      await dependencies.writeManifestAtomic(paths, current);
    } finally {
      await closeServer();
    }
    return 0;
  }
  if (parsed.command === 'observations') {
    const manifest = openRun(repositoryRoot, parsed['run-id'], 'observations');
    const raw = await dependencies.readStdin();
    let observations;
    try {
      observations = JSON.parse(raw);
    } catch {
      throw new Error('Stdin must contain exactly one JSON object.');
    }
    await recordObservations(paths, manifest, observations, dependencies);
    return 0;
  }
  const manifest = openRun(repositoryRoot, parsed['run-id'], 'decision');
  const observations =
    manifest.status === STATUS.NO_CHANGE
      ? { schemaVersion: 1, runId: manifest.runId, observations: [] }
      : dependencies.readJson(paths.visualObservationsPath);
  await recordDecision(
    paths,
    manifest,
    observations,
    { outcome: parsed.outcome, candidate: parsed.candidate ?? null, approvalReference: parsed['approval-reference'] },
    dependencies,
  );
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)))
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });

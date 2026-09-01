# Phase 6C Hero Video Compression Experiment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run a bounded local experiment that measures H.264, VP9, and AV1 encodes of only the Terrace sofa forward/reverse pair, produces objective and direct-playback evidence, and stops for the user's visual decision without changing production delivery.

**Architecture:** One tracked Node.js ESM harness owns fixed input allowlists, create/open/overwrite run lifecycles, deterministic FFmpeg/ffprobe argument arrays, guarded execution, manifests, visual evidence, and decision receipts. One focused Vitest file drives the harness through small RED/GREEN contract cycles; every candidate, metric, browser receipt, frame, and report stays in the ignored Phase 6C workspace.

**Tech Stack:** Node.js ESM, TypeScript, Vitest 4.1.10, FFmpeg/ffprobe 8.1.2, Playwright Chromium 1.60.0, Windows PowerShell.

## Global Constraints

- Repository: `D:\Projects\evironn`; branch: `phase/06-hardening-release`.
- Approved design remains commit `c730d66`. Resolve it to a full commit SHA before comparison; never compare a full SHA to the short literal.
- Implementation starts only from the future full SHA produced by the coordinator-owned planning closeout below. That SHA must contain the approved planning brief and this plan and must descend from the full design SHA. It is not `c730d66`.
- The planning-closeout SHA remains immutable as `implementationBaseline`. Task 1 records its separate full `harnessCommit`; Task 2 and Task 3 require `HEAD == harnessCommit`, `implementationBaseline` to be an ancestor of `harnessCommit`, and the full design SHA to be an ancestor of `implementationBaseline`.
- Tracked implementation ownership is exactly `scripts/hero-video-compression-experiment.mjs` and `tests/hero-video-compression-experiment.test.ts`.
- Ignored ownership is exactly `.superpowers/sdd/phase-6c-hero-video-compression/implementation-baseline.json`, `.superpowers/sdd/phase-6c-hero-video-compression/runs/**`, and `.superpowers/sdd/phase-6c-hero-video-compression/delivery-report.md`.
- Preserve exactly, never stage, and hash-check after every task: `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` and `docs/superpowers/plans/phase-2-task-3-execution.md`.
- Do not modify production code, production tests, production media, `package.json`, lockfiles, `STATUS.md`, `DECISIONS.md`, environment files, provider configuration, Prisma, workflows, or Git configuration.
- Do not overwrite/delete originals; edit hero source order, preload, or runtime behavior; convert the other 14 transition files; claim deployed performance; run a full gate/build/broad E2E/provider/DB/deployment operation; push; open a PR; merge; or deploy.
- Do not run encodes, tests, builds, commits, or Git mutations while planning. Commands below are for later approved implementation.
- Every FFmpeg media command uses `-hide_banner -loglevel error -nostdin`, `spawn` with `shell: false`, and argument arrays. Never print or persist source metadata. ffprobe requests only named fields; never request tags or unrestricted format output.
- Every encode, probe, metric, visual-render, or focused playback-browser boundary verifies its applicable immutable allowlist immediately before launch and again in `finally`, including process failure.
- Every candidate uses only primary video `0:v:0`, `-an`, `-map_metadata -1`, 1168 x 784, 24 FPS, 145 frames, 6.041667 seconds, and `yuv420p`.
- H.264 and VP9 alone may become objectively eligible and visually approved. AV1 is measurement-only in this pilot: record its probe/size/VMAF/SSIM/PSNR evidence, set `MEASUREMENT_ONLY`, exclude it from eligibility and winner selection, and defer any AV1 integration decision.
- H.264/VP9 pair eligibility requires unique forward/reverse results, both VMAF values at least 95, combined bytes at most 9,284,196, valid stream/timeline probes, no playback failure, and no visible defect. SSIM/PSNR remain diagnostics.
- VP9 approval does not select an H.264 fallback or prove Safari/Apple-device behavior. Fallback, browser matrix, source order, Preview measurements, and rollout require a separate approved integration plan.
- Primary visual evidence is synchronized direct original/candidate `<video>` playback. Encoded hstack video may exist only as a labeled non-authoritative convenience. Same-frame PNG pairs are lossless.
- Overwrite is allowed only for an exact, complete, pre-visual objective inventory with no partial, stale, missing, or unreferenced file. Any visual, browser, observation, decision, or matching delivery-report artifact/status makes overwrite fail with exact code `NEW_RUN_ID_REQUIRED`. No overwrite path deletes or cleans files; visual creation always uses `-n`.
- Final status is `NO_CHANGE` when no eligible H.264/VP9 pair passes or the user rejects all. Objective metrics never replace user visual approval.

## Coordinator-Owned Pre-Implementation Planning Closeout

This closeout occurs only after plan review reports READY and the user explicitly approves the plan. It is outside all three implementation tasks. Do not execute it during planning.

- [ ] **Closeout Step 1: Stage exactly the approved planning brief and plan**

```powershell
git add -- 'docs/superpowers/specs/2026-08-31-phase-6c-hero-video-compression-planning-brief.md' 'docs/superpowers/plans/2026-08-31-phase-6c-hero-video-compression-experiment.md'
$staged = @(git diff --cached --name-only)
$expected = @(
  'docs/superpowers/plans/2026-08-31-phase-6c-hero-video-compression-experiment.md',
  'docs/superpowers/specs/2026-08-31-phase-6c-hero-video-compression-planning-brief.md'
)
if (@(Compare-Object ($staged | Sort-Object) ($expected | Sort-Object)).Count -ne 0) {
  throw 'Planning closeout staged-path contract failed.'
}
```

Expected: exactly two staged paths. Protected Phase 2 plans remain untracked and unstaged.

- [ ] **Closeout Step 2: Commit approved planning artifacts and record the full implementation baseline**

After confirming user-owned Git identity:

```powershell
git commit -m "docs: approve hero video compression experiment plan"
$implementationBaseline = (git rev-parse HEAD).Trim()
$designCommit = (git rev-parse 'c730d66^{commit}').Trim()
if ($implementationBaseline -eq $designCommit) { throw 'Implementation baseline cannot equal design commit.' }
git merge-base --is-ancestor $designCommit $implementationBaseline
if ($LASTEXITCODE -ne 0) { throw 'Implementation baseline does not descend from approved design.' }
foreach ($treePath in @(
  'docs/superpowers/specs/2026-08-31-phase-6c-hero-video-compression-planning-brief.md',
  'docs/superpowers/plans/2026-08-31-phase-6c-hero-video-compression-experiment.md'
)) {
  git cat-file -e ($implementationBaseline + ':' + $treePath)
  if ($LASTEXITCODE -ne 0) { throw "Baseline lacks $treePath" }
}
```

Expected: full `implementationBaseline` SHA becomes Task 1 baseline; full `designCommit` resolves the immutable design; no push follows.

## File and Interface Map

- Create `scripts/hero-video-compression-experiment.mjs`: exports the contracts and state machine named in Task 1; implements CLI commands `run`, `visuals`, `observations`, and `decision`.
- Create `tests/hero-video-compression-experiment.test.ts`: pure/injected contract tests; no real encode or browser launch.
- Create later, ignored: one versioned run directory containing `manifest.json`, candidates, passlogs, probes, metrics, visuals, browser receipts, observations, and `decision.json`.
- Create later, ignored: `.superpowers/sdd/phase-6c-hero-video-compression/delivery-report.md`.

## Binding Types, Signatures, Records, and Artifact Paths

The `.mjs` implementation uses JSDoc equivalents of these TypeScript contracts. Tests import the runtime exports and validate every field. No task may invent an additional field, status, path pattern, or lifecycle mode without a new reviewed plan decision.

```ts
type Sha256 = string; // exactly /^[a-f0-9]{64}$/
type FullCommitSha = string; // exactly /^[a-f0-9]{40}$/
type Direction = 'forward' | 'reverse';
type RunMode = 'create' | 'open' | 'overwrite';
type Codec = 'h264' | 'vp9' | 'av1';
type Disposition = 'eligible' | 'measurement-only';
type ViewportId = 'desktop-1440x1000' | 'mobile-390x844';
type MetricKind = 'vmaf' | 'ssim' | 'psnr';

interface SourceContract {
  role: 'encode-source' | 'visual-focus';
  direction: Direction | null;
  relativePath: string;
  bytes: number;
  sha256: Sha256;
}

interface RunPaths {
  repositoryRoot: string;
  experimentRoot: string;
  runsRoot: string;
  runRoot: string;
  runId: string;
  mode: RunMode;
  deliveryReportPath: string;
  manifestPath: string;
  manifestPartialPath: string;
  objectiveManifestPath: string;
  objectiveEvidencePath: string;
  visualObservationsPath: string;
  decisionPath: string;
}

interface ImplementationBaselineReceipt {
  schemaVersion: 1;
  branch: 'phase/06-hardening-release';
  designCommit: FullCommitSha;
  implementationBaseline: FullCommitSha; // immutable planning-closeout commit
  harnessCommit: FullCommitSha | null; // null before Task 1 commit, then set once
  protectedPlans: readonly { relativePath: string; bytes: number; sha256: Sha256 }[];
}

interface CandidateSpec {
  pairId: 'h264-crf18' | 'h264-crf20' | 'vp9-cq24' | 'vp9-cq28' | 'av1-cq24' | 'av1-cq28';
  codec: Codec;
  quality: 18 | 20 | 24 | 28;
  extension: 'mp4' | 'webm';
  disposition: Disposition;
  direction: Direction;
  sourceRelativePath: string;
  candidateRelativePath: string;
}

interface ProcessInvocation {
  sequence: number;
  executable: 'ffmpeg' | 'ffprobe';
  args: readonly string[];
  cwd: string;
  shell: false;
  immutableScope: 'source' | 'visual';
  artifactRelativePath: string | null;
}

interface CommandReceipt {
  sequence: number;
  kind: 'encode' | 'probe-metadata' | 'probe-streams' | MetricKind | 'visual-frame' | 'visual-sequence';
  pairId: CandidateSpec['pairId'];
  direction: Direction | null; // null only for kind visual-sequence
  executable: 'ffmpeg' | 'ffprobe';
  displayArgs: readonly string[]; // repository-relative inputs and run-relative outputs only
  cwd: '.'; // means validated run root
  exitCode: number;
  startedAt: string;
  finishedAt: string;
  stdoutSha256: Sha256 | null;
  stderrSha256: Sha256 | null;
  artifactRelativePath: string | null;
  immutableCheckBefore: Sha256;
  immutableCheckAfter: Sha256;
}

interface FfprobeReceipt {
  metadataRelativePath: string;
  streamsRelativePath: string;
  codecName: string;
  profile: string | null;
  width: 1168;
  height: 784;
  pixelFormat: 'yuv420p';
  realFrameRate: '24/1';
  averageFrameRate: '24/1';
  packetCount: 145;
  durationSeconds: number;
  bitRate: number | null;
  bytes: number;
  videoStreamCount: 1;
  audioStreamCount: 0;
  attachedPictureCount: 0;
  contractPass: boolean;
}

interface MetricRecord {
  kind: MetricKind;
  relativePath: string;
  value: number;
  sha256: Sha256;
  distortedInput: { inputIndex: 0; candidateRelativePath: string };
  referenceInput: { inputIndex: 1; sourceRelativePath: string };
  filterPadOrder: '[dist][ref]';
}

interface DirectionResult {
  direction: Direction;
  candidateRelativePath: string;
  candidateBytes: number;
  candidateSha256: Sha256;
  probe: FfprobeReceipt;
  metrics: { vmaf: MetricRecord; ssim: MetricRecord; psnr: MetricRecord };
  encodeReceiptSequences: readonly number[];
  probeReceiptSequences: readonly number[];
  metricReceiptSequences: readonly number[];
}

interface PairResult {
  pairId: CandidateSpec['pairId'];
  codec: Codec;
  quality: CandidateSpec['quality'];
  extension: CandidateSpec['extension'];
  disposition: Disposition;
  directions: { forward: DirectionResult; reverse: DirectionResult };
  combinedBytes: number;
  reductionBytes: number;
  reductionPercent: number;
  status: 'OBJECTIVE_REJECTED' | 'MEASUREMENT_ONLY' | 'PENDING_VISUAL_REVIEW';
  eligible: boolean;
  rejectionReasons: readonly string[];
}

interface VisualReceipt {
  kind: 'lossless-frame' | 'local-sequence' | 'direct-playback-index';
  pairId: CandidateSpec['pairId'] | null;
  direction: Direction | null;
  frameIndex: 0 | 72 | 144 | null;
  timeSeconds: 0 | 3 | 6 | null;
  relativePath: string;
  bytes: number;
  sha256: Sha256;
  authority: 'PRIMARY_DIRECT_PLAYBACK' | 'LOSSLESS_FRAME_EVIDENCE' | 'NON_AUTHORITATIVE_CONVENIENCE_RENDER';
}

interface BrowserReceipt {
  pairId: Exclude<CandidateSpec['pairId'], 'av1-cq24' | 'av1-cq28'>;
  direction: Direction;
  viewport: ViewportId;
  jsonRelativePath: string;
  screenshotRelativePath: string;
  browserName: 'chromium';
  browserVersion: string;
  playbackRate: 1;
  loadeddata: boolean;
  canplay: boolean;
  ended: boolean;
  error: boolean;
  firstFrameReady: boolean;
  transitionReady: boolean;
  originalDurationSeconds: number;
  candidateDurationSeconds: number;
  maximumDriftSeconds: number;
  screenshotSha256: Sha256;
  browserCommandSequence: number;
}

interface BrowserEvidenceRecord {
  receipt: BrowserReceipt;
  jsonBytes: number;
  jsonSha256: Sha256;
}

interface BrowserPlaybackRequest {
  sequence: number;
  pairId: Exclude<CandidateSpec['pairId'], 'av1-cq24' | 'av1-cq28'>;
  direction: Direction;
  viewport: ViewportId;
  loopbackOrigin: `http://127.0.0.1:${number}`;
  originalUrlPath: string;
  candidateUrlPath: string;
  screenshotRelativePath: string;
  jsonRelativePath: string;
}

interface BrowserCommandReceipt {
  sequence: number;
  kind: 'browser-playback';
  pairId: BrowserPlaybackRequest['pairId'];
  direction: Direction;
  viewport: ViewportId;
  loopbackOrigin: `http://127.0.0.1:${number}`;
  startedAt: string;
  finishedAt: string;
  immutableCheckBefore: Sha256;
  immutableCheckAfter: Sha256;
  outcome: 'COMPLETED' | 'FAILED';
}

interface LoopbackServerHandle {
  host: '127.0.0.1';
  requestedPort: 0;
  resolvedPort: number;
  origin: `http://127.0.0.1:${number}`;
  close(): Promise<void>;
}

interface LoopbackRoute {
  urlPath: string;
  absolutePath: string;
  mediaType: 'text/html; charset=utf-8' | 'video/mp4' | 'video/webm';
  expectedBytes: number;
  expectedSha256: Sha256;
}

interface UserObservation {
  pairId: Exclude<CandidateSpec['pairId'], 'av1-cq24' | 'av1-cq28'>;
  reviewedViewports: { 'desktop-1440x1000': boolean; 'mobile-390x844': boolean };
  reviewedDirections: { forward: boolean; reverse: boolean };
  normalSpeedVisibleDifference: boolean | null;
  playbackFailure: boolean | null;
  firstFrameReady: boolean | null;
  transitionReady: boolean | null;
  defects: {
    frameCorruption: boolean | null;
    colorShift: boolean | null;
    blocking: boolean | null;
    banding: boolean | null;
    droppedEnding: boolean | null;
    transitionSeam: boolean | null;
  };
  verdict: 'PENDING_USER_APPROVAL' | 'VISUALLY_APPROVED' | 'VISUALLY_REJECTED';
}

interface UserObservationSet {
  schemaVersion: 1;
  runId: string;
  observations: readonly UserObservation[];
}

interface DecisionRecord {
  schemaVersion: 1;
  runId: string;
  implementationBaseline: FullCommitSha;
  harnessCommit: FullCommitSha;
  objectiveManifestSha256: Sha256;
  outcome: 'VISUALLY_APPROVED' | 'NO_CHANGE';
  winningPairId: Exclude<CandidateSpec['pairId'], 'av1-cq24' | 'av1-cq28'> | null;
  approvalReference: string;
  productionChanged: false;
  integrationAuthorized: false;
}

interface ObjectiveEvidenceReceipt {
  schemaVersion: 1;
  runId: string;
  implementationBaseline: FullCommitSha;
  harnessCommit: FullCommitSha;
  objectiveManifestSha256: Sha256;
  createdAt: string;
}

interface RunManifest {
  schemaVersion: 1;
  runId: string;
  designCommit: FullCommitSha;
  implementationBaseline: FullCommitSha;
  harnessCommit: FullCommitSha;
  status:
    | 'PENDING_OBJECTIVE_EVIDENCE'
    | 'OBJECTIVE_EVIDENCE_READY'
    | 'PENDING_USER_APPROVAL'
    | 'VISUALLY_APPROVED'
    | 'NO_CHANGE';
  toolVersions: { node: string; ffmpeg: string; ffprobe: string; playwright: string; chromium: string | null };
  immutableSources: readonly SourceContract[];
  candidates: readonly CandidateSpec[];
  commandReceipts: readonly CommandReceipt[];
  pairResults: readonly PairResult[];
  visualReceipts: readonly VisualReceipt[];
  browserCommandReceipts: readonly BrowserCommandReceipt[];
  browserReceipts: readonly BrowserEvidenceRecord[];
  reducedMotion: 'NOT_APPLICABLE_UNTIL_FUTURE_INTEGRATION';
  failedMediaFallback: 'NOT_APPLICABLE_UNTIL_FUTURE_INTEGRATION';
}

interface DeliveryReportInputs {
  manifest: RunManifest;
  objectiveEvidence: ObjectiveEvidenceReceipt;
  decision: DecisionRecord | null;
  userObservations: UserObservationSet;
  sourceHashesAfter: readonly SourceContract[];
  protectedPlanHashesAfter: readonly { relativePath: string; bytes: number; sha256: Sha256 }[];
}

interface RuntimeDependencies {
  spawnProcess(invocation: ProcessInvocation): Promise<{ exitCode: number; stdout: Uint8Array; stderr: Uint8Array }>;
  verifyInputs(repositoryRoot: string, scope: 'source' | 'visual'): Promise<readonly SourceContract[]>;
  nowIso(): string;
  readStdin(): Promise<string>;
  readJson(absolutePath: string): unknown;
  writeFileExclusive(absolutePath: string, bytes: Uint8Array | string): Promise<void>;
  replaceOwnedFile(absolutePath: string, bytes: Uint8Array | string): Promise<void>;
  writeManifestAtomic(paths: RunPaths, manifest: RunManifest): Promise<Sha256>;
  startLoopbackServer(input: {
    host: '127.0.0.1';
    port: 0;
    routes: readonly LoopbackRoute[];
  }): Promise<LoopbackServerHandle>;
  launchChromium(): Promise<unknown>; // adapter is used only by the real visuals command; tests inject a fake
}
```

Exact exported signatures:

```ts
export const ENCODE_SOURCE_CONTRACTS: readonly SourceContract[];
export const VISUAL_SUPPORT_CONTRACTS: readonly SourceContract[];
export const PAIR_CONTRACTS: readonly Omit<
  CandidateSpec,
  'direction' | 'sourceRelativePath' | 'candidateRelativePath'
>[];
export const STATUS: Readonly<Record<string, string>>;
export function resolveExperimentRoot(repositoryRoot: string): string;
export function resolveRunPaths(repositoryRoot: string, runId: string, mode: RunMode): RunPaths;
export function enumerateOwnedRunFiles(
  runId: string,
  phase: 'objective' | 'visual' | 'decision',
  eligiblePairIds: readonly PairResult['pairId'][],
): ReadonlySet<string>;
export function validateManifestIdentity(
  runRoot: string,
  runId: string,
  command: 'identity' | 'overwrite' | 'visuals' | 'observations' | 'decision',
): RunManifest;
export function buildEncodeInvocations(
  candidate: CandidateSpec,
  paths: RunPaths,
  startingSequence: number,
): readonly ProcessInvocation[];
export function buildProbeInvocations(
  candidate: CandidateSpec,
  paths: RunPaths,
  startingSequence: number,
): readonly ProcessInvocation[];
export function buildMetricInvocations(
  candidate: CandidateSpec,
  paths: RunPaths,
  startingSequence: number,
): readonly ProcessInvocation[];
export function assessPair(pair: PairResult): PairResult;
export function buildVisualInvocations(
  pair: PairResult,
  paths: RunPaths,
  startingSequence: number,
): readonly ProcessInvocation[];
export function verifyImmutableInputs(
  repositoryRoot: string,
  scope: 'source' | 'visual',
): Promise<readonly SourceContract[]>;
export function runGuardedProcess(
  paths: RunPaths,
  scope: 'source' | 'visual',
  invocation: ProcessInvocation,
  dependencies: RuntimeDependencies,
): Promise<CommandReceipt>;
export function runGuardedBrowserPlayback(
  paths: RunPaths,
  request: BrowserPlaybackRequest,
  dependencies: RuntimeDependencies,
): Promise<{ command: BrowserCommandReceipt; evidence: BrowserEvidenceRecord }>;
export function createRun(
  repositoryRoot: string,
  runId: string,
  implementationBaseline: FullCommitSha,
  harnessCommit: FullCommitSha,
): Promise<RunManifest>;
export function openRun(
  repositoryRoot: string,
  runId: string,
  command: 'visuals' | 'observations' | 'decision',
): RunManifest;
export function overwriteRun(
  repositoryRoot: string,
  runId: string,
  implementationBaseline: FullCommitSha,
  harnessCommit: FullCommitSha,
): Promise<RunManifest>;
export function writeManifestAtomic(
  paths: RunPaths,
  manifest: RunManifest,
  dependencies: Pick<RuntimeDependencies, 'verifyInputs' | 'writeFileExclusive' | 'replaceOwnedFile'>,
): Promise<Sha256>;
export function nextReceiptSequence(manifest: RunManifest): number;
export function recordObservations(
  paths: RunPaths,
  manifest: RunManifest,
  observations: UserObservationSet,
  dependencies: Pick<RuntimeDependencies, 'verifyInputs' | 'replaceOwnedFile'>,
): Promise<UserObservationSet>;
export function recordDecision(
  paths: RunPaths,
  manifest: RunManifest,
  observations: UserObservationSet,
  requested: { outcome: 'approved' | 'no-change'; candidate: string | null; approvalReference: string },
  dependencies: RuntimeDependencies,
): Promise<{ decision: DecisionRecord; manifest: RunManifest }>;
export function main(argv: readonly string[], dependencies: RuntimeDependencies): Promise<number>;
```

Exact normalized POSIX artifact formulas, all relative to `runRoot` unless stated otherwise:

```text
candidate: candidates/{pairId}-{direction}.{extension}
VP9 passlog: passlogs/{pairId}-{direction}-0.log
metadata probe: probes/{pairId}-{direction}-metadata.json
stream probe: probes/{pairId}-{direction}-streams.json
VMAF: metrics/{pairId}-{direction}-vmaf.json
SSIM: metrics/{pairId}-{direction}-ssim.log
PSNR: metrics/{pairId}-{direction}-psnr.log
lossless frame: visuals/frames/{pairId}-{direction}-frame-{000|072|144}.png
direct-playback index: visuals/index.html
local sequence: visuals/{pairId}-forward-focus-reverse.mp4
browser JSON: browser-receipts/{pairId}-{direction}-{desktop-1440x1000|mobile-390x844}.json
browser screenshot: browser-receipts/{pairId}-{direction}-{desktop-1440x1000|mobile-390x844}.png
user observation: visual-observations.json
decision: decision.json
objective evidence receipt: objective-evidence.json
objective manifest snapshot: objective-manifest.json
manifest: manifest.json
manifest temporary: manifest.json.partial
delivery report: .superpowers/sdd/phase-6c-hero-video-compression/delivery-report.md relative to repository root
```

`resolveRunPaths` materializes every `RunPaths` file field from these formulas: `manifestPath`, `manifestPartialPath`, `objectiveManifestPath`, `objectiveEvidencePath`, `visualObservationsPath`, and `decisionPath` resolve inside the validated run root; `deliveryReportPath` resolves to the single experiment-root report. No caller or later task may reconstruct these paths independently.

There is no aggregate browser receipt. Every eligible pair has exactly four JSON receipts and four PNG screenshots: two directions multiplied by two viewports. Direct playback uses explicit allowlisted routes served by the loopback review server; it does not create copied direct-playback media files. The route table maps `/index.html` to the run-owned playback index, `/original/forward.mp4` and `/original/reverse.mp4` to the two immutable repository sources, and `/candidate/{pairId}/{direction}.{extension}` to manifest-owned candidates. Route construction validates containment, regular-file identity, exact bytes, and SHA-256 before server start. The server accepts only `GET` and `HEAD`, supports byte ranges for video, returns the declared MIME type, and rejects traversal, encoded traversal, directory access, symlinks/reparse points, unknown routes, and every non-loopback host request.

---

### Task 1: Deterministic Harness and Focused Contract Tests

**Owner:** One Luna implementer owns only the two tracked files. A fresh Sol reviewer gates the exact Task 1 diff and focused evidence.

**Files:**

- Create: `scripts/hero-video-compression-experiment.mjs`
- Create: `tests/hero-video-compression-experiment.test.ts`
- Create ignored: `.superpowers/sdd/phase-6c-hero-video-compression/implementation-baseline.json`

**Interfaces:**

- Exports immutable data: `ENCODE_SOURCE_CONTRACTS`, `VISUAL_SUPPORT_CONTRACTS`, `PAIR_CONTRACTS`, `STATUS`.
- Exports pure/path functions: `resolveExperimentRoot`, `resolveRunPaths`, `enumerateOwnedRunFiles`, `validateManifestIdentity`, `buildEncodeInvocations`, `buildProbeInvocations`, `buildMetricInvocations`, `assessPair`, `buildVisualInvocations`.
- Exports boundary/state functions: `verifyImmutableInputs`, `runGuardedProcess`, `runGuardedBrowserPlayback`, `createRun`, `openRun`, `overwriteRun`, `writeManifestAtomic`, `nextReceiptSequence`, `recordObservations`, `recordDecision`, `main`.
- `resolveRunPaths(repositoryRoot, runId, mode)` accepts mode `create`, `open`, or `overwrite`. CLI `run` uses `create`; `run --overwrite-owned-run` uses `overwrite`; `visuals`, `observations`, and `decision` use `open` only.

Binding export/state contract:

```js
const STATUS = Object.freeze({
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

resolveExperimentRoot(repositoryRoot):
  resolve repositoryRoot and exact '.superpowers/sdd/phase-6c-hero-video-compression'
  reject non-absolute repository root, containment escape, linked/reparse existing component
  return frozen absolute root

enumerateOwnedRunFiles(runId, phase, eligiblePairIds):
  objective Set = manifest.json, objective-manifest.json, objective-evidence.json, every exact candidate, two probe receipts, three metric files, and VP9 passlog
  validate eligiblePairIds as exact unique eligible H.264/VP9 IDs from the validated manifest; AV1/rejected/unknown/duplicate IDs fail
  visual Set requires eligiblePairIds nonempty; it equals objective Set plus visuals/index.html, every named eligible-pair frame/sequence, exactly four browser JSON and four browser PNG files per eligible pair, visual-observations.json
  decision Set with eligiblePairIds nonempty = visual Set plus decision.json
  decision Set with eligiblePairIds empty = objective Set plus decision.json; visuals/**, browser-receipts/**, and visual-observations.json must be absent
  never include manifest.json.partial in a steady inventory
  return exact phase Set as frozen normalized relative POSIX paths; reject duplicate entry

validateManifestIdentity(runRoot, runId, command):
  require regular manifest.json and absence of manifest.json.partial
  parse JSON; require schemaVersion 1 and exact runId
  require exact full baseline/design SHA formats
  require exact immutable source identities
  require exact unique pair ID/codec/quality/extension/disposition tuples
  require exact unique forward/reverse direction keys per pair
  require objective-evidence.json identity fields and its objectiveManifestSha256 to equal immutable objective-manifest.json snapshot bytes
  require every referenced file contained in runRoot and present in owned-file Set
  derive eligiblePairIds from validated pairResults, pass them explicitly to enumerateOwnedRunFiles, require actual inventory to equal exact expected phase Set; reject missing, stale, or unreferenced files
  for overwrite derive eligiblePairIds from the validated manifest; require exact objective Set and either status OBJECTIVE_EVIDENCE_READY with nonempty eligiblePairIds or status NO_CHANGE with empty eligiblePairIds; require empty visual/browser arrays, absent observations/decision/partial, and absent repository delivery report
  if any downstream artifact/status exists throw error code NEW_RUN_ID_REQUIRED
  require objective-complete status for visuals
  require objective-complete plus visual-complete status for approved or user-rejected decision
  allow no-change decision without visuals only when eligible H.264/VP9 count is zero, manifest status is NO_CHANGE, and exact zero-eligible decision inventory is used; observation content is not this function's responsibility
  return deep-frozen validated manifest

createRun(repositoryRoot, runId, implementationBaseline, harnessCommit): resolve create mode, validate both full SHAs, mkdir exact run subdirectories, create initial manifest carrying both SHAs
openRun(repositoryRoot, runId, command): resolve open mode, then validate identity/status for exact command, never write during validation
overwriteRun(repositoryRoot, runId, implementationBaseline, harnessCommit): validate both SHAs against manifest, require explicit flag and exact objective inventory only; reject downstream/partial/stale/missing/link with NEW_RUN_ID_REQUIRED; replace enumerated objective files without deletion
writeManifestAtomic(paths, manifest, dependencies): use exact paths.manifestPartialPath and paths.manifestPath, dependencies.verifyInputs/writeFileExclusive/replaceOwnedFile, close/hash/source-recheck/same-directory replacement; never derive a path internally
assessPair(pair): validate identity/directions; return MEASUREMENT_ONLY for AV1; otherwise apply exact probe/VMAF/combined-byte predicate
nextReceiptSequence(manifest): scan commandReceipts and browserCommandReceipts together; require unique positive integer sequences; return 1 when both arrays are empty, otherwise maximum + 1
runGuardedBrowserPlayback(paths, request, dependencies): require request.sequence equals nextReceiptSequence(manifest), validate paths/run root and loopback origin as http://127.0.0.1:<1-65535>; verify visual inputs before launch and again in finally; use injected loopback Chromium only; close the launched browser/context/page inside finally before returning or throwing; a completed media playback gate failure persists a COMPLETED command and evidence with its false/error fields so it can be visually rejected, while infrastructure/write/cleanup/immutable-verification failure throws and requires a new run ID; record one BrowserCommandReceipt and one BrowserEvidenceRecord; post-verification failure takes precedence
recordObservations(paths, manifest, observations, dependencies): validate exact pending-user-approval inventory and complete unique eligible-pair coverage; verify visual inputs before and after; atomically replace only paths.visualObservationsPath; return deep-frozen validated observations
recordDecision(paths, manifest, observations, requested, dependencies): validate observations and exact inventory; use only paths decision/report fields plus dependencies.writeFileExclusive/writeManifestAtomic/replaceOwnedFile
main(argv, dependencies): parse only help/run/visuals/observations/decision grammar; choose create/overwrite/open exactly; reject before launch; observations reads exactly one JSON object from dependencies.readStdin and writes through recordObservations; real dependencies bind verifyInputs to verifyImmutableInputs and writeManifestAtomic to the exported implementation; all tests inject both
```

- [ ] **Step 1: Record baseline/protected hashes, then write RED lifecycle tests**

Record full immutable `implementationBaseline`, full design SHA, `harnessCommit: null`, branch, and protected-plan byte/hash values in the ignored baseline receipt. Tests assert safe-ID containment, `create` absent-only, `open` existing-only, and `overwrite` existing-only. All modes reject symlink/junction/reparse parents. `open` rejects missing, partial, foreign-run, mismatched-runId, or invalid manifests. Overwrite requires the explicit flag and exact objective-phase inventory equality. Tests add one file at a time for `visuals/index.html`, a browser receipt, a browser screenshot, `visual-observations.json`, `decision.json`, and the repository delivery report; every case must fail with `NEW_RUN_ID_REQUIRED`. Separate tests remove one expected objective file, add one stale/unreferenced owned-looking file, add `manifest.json.partial`, and set a visual/downstream status; every case must fail with `NEW_RUN_ID_REQUIRED`. No test permits cleanup or deletion.

```ts
expect(() => resolveRunPaths(root, '../escape', 'create')).toThrow(/safe run id/i);
expect(() => resolveRunPaths(root, 'pilot-01', 'create')).not.toThrow();
expect(() => resolveRunPaths(root, 'existing', 'create')).toThrow(/must not exist/i);
expect(() => resolveRunPaths(root, 'missing', 'open')).toThrow(/must exist/i);
expect(() => resolveRunPaths(root, 'existing', 'open')).not.toThrow();
expect(() => resolveRunPaths(root, 'exact-objective', 'overwrite')).not.toThrow();
expect(() => resolveRunPaths(root, 'has-visual', 'overwrite')).toThrowError('NEW_RUN_ID_REQUIRED');
```

- [ ] **Step 2: Run lifecycle RED, implement modes, rerun GREEN**

Run: `npx vitest run tests/hero-video-compression-experiment.test.ts -t "run lifecycle"`

Expected RED: lifecycle exports absent. Implement:

```js
function resolveRunPaths(repositoryRoot, runId, mode) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(runId)) throw new Error('Run ID must be a safe run id.');
  if (!['create', 'open', 'overwrite'].includes(mode)) throw new Error('Unknown run mode.');
  const experimentRoot = resolveExperimentRoot(repositoryRoot);
  const runRoot = path.resolve(experimentRoot, 'runs', runId);
  assertContained(experimentRoot, runRoot);
  assertExistingParentsAreRegularDirectoriesWithoutLinks(experimentRoot, runRoot);
  const exists = existsSync(runRoot);
  if (mode === 'create' && exists) throw new Error('Create-mode run must not exist.');
  if (mode !== 'create' && !exists) throw new Error(`${mode}-mode run must exist.`);
  if (mode === 'open') validateManifestIdentity(runRoot, runId, 'identity');
  if (mode === 'overwrite') {
    const manifest = validateManifestIdentity(runRoot, runId, 'overwrite');
    const eligiblePairIds = deriveEligiblePairIds(manifest.pairResults);
    assertOnlyEnumeratedOwnedFiles(runRoot, enumerateOwnedRunFiles(runId, 'objective', eligiblePairIds));
  }
  return freezeResolvedPaths(experimentRoot, runRoot, runId, mode);
}
```

`validateManifestIdentity` requires regular complete `manifest.json`, no partial, schema 1, exact run ID/source identities/six pair identities, and compatible status. Visual open requires exact objective inventory; observations open requires exact pending-user-approval visual inventory; decision open requires exact visual inventory when an eligible pair exists. Overwrite accepts either exact complete objective-only `OBJECTIVE_EVIDENCE_READY` inventory with derived nonempty eligible IDs or exact complete objective-only `NO_CHANGE` inventory with derived empty eligible IDs, always with no downstream artifact or delivery report. Every partial, missing, stale, unreferenced, visual, browser, observation, decision, report, or other downstream-status case throws an error carrying `code = 'NEW_RUN_ID_REQUIRED'`. Tests cover both allowed objective statuses and every forbidden case. Interrupted runs require a new run ID. Expected GREEN: lifecycle tests PASS.

- [ ] **Step 3: Write immutable-input RED, implement verifier, rerun GREEN**

Use exact frozen allowlists:

```js
ENCODE_SOURCE_CONTRACTS = [
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
];
VISUAL_SUPPORT_CONTRACTS = [
  {
    role: 'visual-focus',
    direction: null,
    relativePath: 'public/assets/hero/terrace-sofa-focus.webp',
    bytes: 222370,
    sha256: '1086c631df3b004810d9573121b4859724be5e61d402aa117226f9e492a5bfe2',
  },
];
```

Tests require regular files, exact bytes/hashes, no linked/reparse component, source-only versus visual scopes, focus rejection by encoder/metric builders, focus acceptance only by visual builder. Run `npx vitest run tests/hero-video-compression-experiment.test.ts -t "immutable input"`; expected RED. Implement `verifyImmutableInputs(repositoryRoot, scope)` with `lstat` on parents/file plus streaming SHA-256; return allowlisted relative facts only, never metadata. Rerun; expected GREEN.

- [ ] **Step 4: Write encoder RED, implement exact arrays, rerun GREEN**

Define six unique pairs, expanded to exact unique `forward`/`reverse` candidates:

```js
PAIR_CONTRACTS = [
  { pairId: 'h264-crf18', codec: 'h264', quality: 18, extension: 'mp4', disposition: 'eligible' },
  { pairId: 'h264-crf20', codec: 'h264', quality: 20, extension: 'mp4', disposition: 'eligible' },
  { pairId: 'vp9-cq24', codec: 'vp9', quality: 24, extension: 'webm', disposition: 'eligible' },
  { pairId: 'vp9-cq28', codec: 'vp9', quality: 28, extension: 'webm', disposition: 'eligible' },
  { pairId: 'av1-cq24', codec: 'av1', quality: 24, extension: 'webm', disposition: 'measurement-only' },
  { pairId: 'av1-cq28', codec: 'av1', quality: 28, extension: 'webm', disposition: 'measurement-only' },
];
```

Tests assert exact arrays, `shell:false`, fixed source/owned output, `-map 0:v:0 -an -map_metadata -1`, `fps=24,format=yuv420p`, `-fps_mode cfr -t 6.041667`; H.264 `libx264`, CRF 18/20, slow, threads 1, faststart; VP9 `libvpx-vp9`, CQ 24/28, zero bitrate, good, cpu-used 1, threads 1, row-mt/tile-columns/frame-parallel 0, passes 1/2, fixed passlog; AV1 `libaom-av1`, CQ 24/28, zero bitrate, good, cpu-used 4, threads 1, row-mt 0, tiles 1x1.

Run `npx vitest run tests/hero-video-compression-experiment.test.ts -t "candidate identity|encoder arrays"`; expected RED. Implement common prefix:

```js
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
const outputMode = lifecycleMode === 'overwrite' ? '-y' : '-n';
```

Append exact options above. VP9 pass 1 ends `-pass 1 -passlogfile passlogPrefix -f webm -y NUL`; pass 2 uses same prefix and owned output. `-y NUL` is sole unconditional overwrite. Expected GREEN.

- [ ] **Step 5: Write probe RED, implement explicit probes, rerun GREEN**

Tests require metadata probe `-v error -select_streams v:0 -count_packets -show_entries stream=index,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_packets,bit_rate:format=duration,bit_rate,size -of json`; stream-count probe `-v error -show_entries stream=index,codec_type -of json`; no tags/comment/unrestricted format.

Run `npx vitest run tests/hero-video-compression-experiment.test.ts -t "probe contract"`; expected RED. Implement parser requiring one video, zero audio/attached picture, expected codec, 1168 x 784, `yuv420p`, `24/1`, 145 packets, duration delta at most 0.001 from 6.041667. Expected GREEN.

- [ ] **Step 6: Write metric-order/Windows-path RED, implement, rerun GREEN**

With root `D:\Projects\evironn`, tests require candidate/distorted input #0, original/reference input #1, `[dist][ref]` for all metrics, exact run-root `cwd`, safe relative POSIX metric files, and no drive colon/backslash in filter graphs:

```ts
expect(invocation.args.slice(0, 9)).toEqual([
  '-hide_banner',
  '-loglevel',
  'error',
  '-nostdin',
  '-i',
  candidateAbsolutePath,
  '-i',
  originalAbsolutePath,
  '-filter_complex',
]);
expect(invocation.cwd).toBe(runRoot);
expect(filterGraph).toContain('[dist][ref]libvmaf');
expect(filterGraph).not.toMatch(/[A-Za-z]:|\\/);
```

Repeat pad-order assertions for `ssim` and `psnr`. Run `npx vitest run tests/hero-video-compression-experiment.test.ts -t "metric order|Windows metric paths"`; expected RED. Implement:

```js
const name = `${pairId}-${direction}-${metricKind}.${metricKind === 'vmaf' ? 'json' : 'log'}`;
if (!/^[a-z0-9-]+\.(json|log)$/.test(name)) throw new Error('Unsafe metric filename.');
const relativeMetric = `metrics/${name}`;
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
const graph = {
  vmaf: `${align}[dist][ref]libvmaf=log_fmt=json:log_path=${relativeMetric}`,
  ssim: `${align}[dist][ref]ssim=stats_file=${relativeMetric}`,
  psnr: `${align}[dist][ref]psnr=stats_file=${relativeMetric}`,
}[metricKind];
return { executable: 'ffmpeg', args: [...prefix, graph, '-an', '-f', 'null', 'NUL'], cwd: runRoot, shell: false };
```

Run root is validated fixed root; filenames are harness-owned. Parse VMAF pooled mean, SSIM All, PSNR average; store numbers and evidence hashes. Expected GREEN.

- [ ] **Step 7: Write guarded-runner RED, implement boundary, rerun GREEN**

Tests inject runner/verifier; require verify before/after success and failure, visual scope including focus, post-verification failure precedence, bounded diagnostics, no media banner/metadata persistence. Run `npx vitest run tests/hero-video-compression-experiment.test.ts -t "guarded process"`; expected RED. Implement:

```js
async function runGuardedProcess(paths, scope, invocation, dependencies) {
  assertPositiveInteger(invocation.sequence);
  assertInvocationInsideRun(paths, invocation);
  const before = await dependencies.verifyInputs(paths.repositoryRoot, scope);
  const immutableCheckBefore = digestCanonicalSourceContracts(before);
  const startedAt = dependencies.nowIso();
  let result;
  let processError;
  let verificationError;
  let immutableCheckAfter;
  try {
    result = await dependencies.spawnProcess(invocation);
  } catch (error) {
    processError = error;
  } finally {
    try {
      const after = await dependencies.verifyInputs(paths.repositoryRoot, scope);
      immutableCheckAfter = digestCanonicalSourceContracts(after);
    } catch (error) {
      verificationError = error;
    }
  }
  const finishedAt = dependencies.nowIso();
  if (verificationError) throw verificationError;
  if (processError) throw processError;
  if (result.exitCode !== 0) throw createBoundedProcessError(result);
  return buildCommandReceipt(invocation, result, {
    sequence: invocation.sequence,
    startedAt,
    finishedAt,
    immutableCheckBefore,
    immutableCheckAfter,
  });
}
```

`digestCanonicalSourceContracts` sorts the complete returned contracts by `relativePath`, serializes only role/direction/relativePath/bytes/lowercase SHA-256 with stable JSON ordering, then hashes those UTF-8 bytes with SHA-256. Tests use distinct clocks and before/after contracts, assert both timestamps/digests, and assert post-verification failure wins over process failure. Use source scope for encode/probe/metric; visual scope for visual renders. Chromium uses the separate guarded browser boundary below. Expected GREEN.

- [ ] **Step 8: Write manifest/eligibility RED, implement state machine, rerun GREEN**

Tests require schema 1, run ID, full baseline/design SHAs, tools, immutable checks, commands, exact unique six pair identities, and exact unique direction keys. Reject duplicate/missing direction/pair/codec/quality/extension/source/output. H.264/VP9 predicate:

```js
eligible =
  pair.disposition === 'eligible' &&
  forward.probe.contractPass &&
  reverse.probe.contractPass &&
  forward.metrics.vmaf.value >= 95 &&
  reverse.metrics.vmaf.value >= 95 &&
  forward.candidateBytes + reverse.candidateBytes <= 9284196;
```

Add boundary cases for VMAF `94.999` and `95` independently in forward and reverse; `95` passes, any `94.999` direction rejects.

AV1 always has pair status `MEASUREMENT_ONLY`. Only eligible H.264/VP9 has pair status `PENDING_VISUAL_REVIEW`; none eligible makes the run `NO_CHANGE`. Tests require exact phase-inventory equality at every completed transition. Run `npx vitest run tests/hero-video-compression-experiment.test.ts -t "manifest identity|eligibility"`; expected RED. Implement atomic partial-write/close/hash/source-recheck/same-directory rename and transitions:

```text
create: initial manifest, PENDING_OBJECTIVE_EVIDENCE; overwrite forbidden while inventory is partial
objective pair result: H.264/VP9 pass -> pair PENDING_VISUAL_REVIEW
objective pair result: H.264/VP9 fail -> pair OBJECTIVE_REJECTED
objective pair result: AV1 -> pair MEASUREMENT_ONLY
all objective files complete with eligible H.264/VP9 -> exact objective inventory, run OBJECTIVE_EVIDENCE_READY
all objective files complete without eligible H.264/VP9 -> exact objective inventory, run NO_CHANGE
objective delivery report written -> same run status, overwrite permanently forbidden for that run ID
visual/browser/observation complete -> exact visual inventory, run PENDING_USER_APPROVAL
approved eligible H.264/VP9 -> exact decision inventory, run VISUALLY_APPROVED
rejected/all failed -> exact decision inventory, run NO_CHANGE
```

Reject other transitions. Expected GREEN.

- [ ] **Step 9: Write CLI/run RED, implement orchestration, rerun GREEN**

Tests inject all boundaries. Require `run --run-id terrace-pilot-20260831-01` create mode; same with `--overwrite-owned-run` overwrite mode only for exact pre-visual objective inventory; `visuals`/`observations`/`decision` open mode; help launches nothing. Every invocation builder receives `nextReceiptSequence(manifest)` and emits consecutive unique sequences; after reopening an existing manifest, the next process/browser sequence must continue from the maximum across both receipt arrays. Unknown flags, unsafe IDs, implicit overwrite, incomplete/foreign manifest, missing/stale/unreferenced objective file, or any downstream artifact/status fails before launch. Assert `NEW_RUN_ID_REQUIRED` for every forbidden overwrite case and assert no unlink/remove/rmdir dependency call occurs.

Run `npx vitest run tests/hero-video-compression-experiment.test.ts -t "CLI lifecycle|run orchestration"`; expected RED. Implement `main`, `createRun`, `openRun`, `overwriteRun`; direct-module guard alone calls `main`. Capture tool versions; run exact 12 candidates, probes, and three metrics/direction. Expected GREEN.

- [ ] **Step 10: Write visual-package RED, implement direct comparison, rerun GREEN**

Tests require eligible H.264/VP9 only; direct original/candidate videos authoritative; shared playbackRate 1 controls, play/pause/seek synchronization, drift correction above 0.040 seconds, loadeddata/canplay/ended/error log, responsive layouts, no external URL; lossless PNG pairs frames 0/72/144; hstack label `NON_AUTHORITATIVE_CONVENIENCE_RENDER`; focus asset only in local forward/focus/reverse sequence. For each eligible pair, the visual enumerator must produce exactly four browser JSON paths and four browser PNG paths from two directions multiplied by two viewports; no aggregate browser receipt exists. `CommandReceipt.direction` is `null` only for `visual-sequence` and is required for every other kind. Contract tests reject every other null/non-null combination.

Run `npx vitest run tests/hero-video-compression-experiment.test.ts -t "visual package|guarded browser playback"`; expected RED. Implement `buildVisualInvocations`; PNG filter uses `fps=24,select=eq(n\,frameIndex)`, hstack, `-frames:v 1 -c:v png -compression_level 0`; all outputs use `-n`, metadata stripped. Sequence label: `LOCAL_REVIEW_SEQUENCE_NOT_RUNTIME_INTERACTION_PROOF`.

Implement `runGuardedBrowserPlayback` with the same before/finally verification precedence and canonical visual-scope digests as `runGuardedProcess`. It accepts one exact `BrowserPlaybackRequest`, rejects any non-loopback origin or mismatched pair/direction/viewport path, records distinct start/end times, launches only `dependencies.launchChromium()`, drives direct playback, writes the screenshot and JSON through injected writers, then returns one unique `BrowserCommandReceipt` plus one `BrowserEvidenceRecord`. The evidence's `browserCommandSequence` must equal the returned command sequence; JSON bytes/hash are computed from the final written JSON bytes, screenshot hash from final PNG bytes. Record separate finite `originalDurationSeconds` and `candidateDurationSeconds`; both must equal `6.041667 ± 0.001` for approval. A browser run that reaches the evidence boundary but reports media `error`, missing readiness/ended, excessive drift, or invalid duration is a completed negative media result: persist its `COMPLETED` command/evidence with the actual false/error values so observations can reject it and the run can close `NO_CHANGE`. Browser launch/navigation infrastructure failure, artifact-write failure, cleanup failure, or immutable-verification failure throws bounded diagnostics, produces no successful evidence, and requires a new run ID. The browser, context, and page handles are closed in `finally`; immutable post-verification failure takes precedence. Expected GREEN.

The `visuals` orchestration constructs an exact `LoopbackRoute[]` from the validated immutable source contracts, run manifest, and run-owned index/candidate files, then calls `dependencies.startLoopbackServer({ host: '127.0.0.1', port: 0, routes })` exactly once. Routes are only `/index.html`, the two fixed `/original/{direction}.mp4` paths, and exact eligible `/candidate/{pairId}/{direction}.{extension}` paths. The server verifies containment, regular-file/no-link identity, bytes, and SHA-256; supports `GET`/`HEAD` plus valid single byte ranges for video; emits exact MIME and range headers; rejects traversal/encoded traversal, directory/unknown routes, malformed/multiple ranges, non-loopback host, and every other method. The OS selects the free port. Reject the handle unless `requestedPort === 0`, `resolvedPort` is an integer from 1 through 65535, and `origin === http://127.0.0.1:${resolvedPort}`. Derive every `BrowserPlaybackRequest.loopbackOrigin` only from that validated handle; never accept a CLI or environment origin. If server start fails, launch no browser. Wrap all browser calls in `try/finally`: each playback closes its browser resources first, then the outer `finally` awaits `server.close()` exactly once. A browser infrastructure or server-close failure is bounded evidence failure requiring a new run ID; immutable-input post-verification still runs and takes precedence. Tests cover route allowlisting, hashes, HEAD/range behavior, traversal/unknown rejection, a port-collision-prone fake environment proving that OS port `0` avoids fixed-port collision, returned-port use in every request, no external URL, and server closure after browser cleanup on success and every failure path.

- [ ] **Step 11: Write decision RED, implement closeout guard, rerun GREEN**

Tests require user reference, complete desktop Chromium 1440x1000 and mobile Chromium 390x844 receipts, direct playback loadeddata/canplay/ended true, error false, readiness true, finite original/candidate durations each within `6.041667 ± 0.001`, normal-speed observation, both directions, all defects false, and exact observation coverage for every eligible H.264/VP9 pair. `UserObservationSet.observations` must contain each eligible pair ID exactly once and no ineligible/AV1/duplicate/unknown ID. Approval requires exactly one observed eligible pair with `VISUALLY_APPROVED`; every other eligible pair must be completely observed and `VISUALLY_REJECTED`. Completed negative media receipts with an error, false readiness/ended, excessive drift, or invalid duration may only be `VISUALLY_REJECTED`; they do not block a reject-all `NO_CHANGE` decision. Infrastructure/write/cleanup/immutable failures never become negative media evidence and require a new run ID. Reject-all requires every eligible pair completely observed and `VISUALLY_REJECTED`. Zero-eligible objective closeout requires an empty observation set and uses objective-plus-decision inventory without visual artifacts. Reject AV1, multiple winners, incomplete coverage, missing observations, Safari/fallback claims. Rejection writes `NO_CHANGE`. Add RED/GREEN tests for `observations --run-id <safe-id> --stdin`: exactly one JSON object from `dependencies.readStdin`, exact run ID/eligible coverage, pending-to-final transition, before/finally visual verification, atomic replacement of only `paths.visualObservationsPath`, malformed/trailing input rejection, and no decision write.

Run `npx vitest run tests/hero-video-compression-experiment.test.ts -t "observation recording|decision closeout"`; expected RED. Implement `recordObservations`, the CLI stdin boundary, and `recordDecision` using only their exact arguments:

```text
recordDecision(paths, manifest, observations, requested, dependencies):
  derive exact eligiblePairIds from manifest.pairResults
  validate observations.schemaVersion/runId and exact unique eligiblePairId coverage
  if eligiblePairIds is empty:
    require requested outcome no-change, candidate null, observations empty, manifest NO_CHANGE
    require actual files equal enumerateOwnedRunFiles(runId, decision, []) minus decision.json
  otherwise:
    require manifest PENDING_USER_APPROVAL and exact complete browser evidence
    require each BrowserEvidenceRecord JSON bytes/hash, screenshot hash, command linkage, direction and viewport
    require complete non-null review fields for every eligible pair
    approve only one exact eligible H.264/VP9 with VISUALLY_APPROVED and reject all others
    no-change requires every eligible pair VISUALLY_REJECTED
    require actual files equal enumerateOwnedRunFiles(runId, visual, eligiblePairIds)
  build DecisionRecord as pure data; productionChanged and integrationAuthorized remain false
  write exact paths.decisionPath with dependencies.writeFileExclusive
  update only manifest.status; RunManifest has no decision receipt field; call dependencies.writeManifestAtomic(paths, updatedManifest)
  rebuild delivery report from DeliveryReportInputs and replace only paths.deliveryReportPath
  return deep-frozen { decision, manifest }
```

Expected GREEN. Tests inject `writeFileExclusive` and `replaceOwnedFile`, assert exact paths/content/state, and prove the function neither accesses globals nor invents file paths.

- [ ] **Step 12: Focused verification, ownership commit, review gate**

```powershell
npx vitest run tests/hero-video-compression-experiment.test.ts
node scripts/hero-video-compression-experiment.mjs --help
npx prettier --check scripts/hero-video-compression-experiment.mjs tests/hero-video-compression-experiment.test.ts
git diff --check -- scripts/hero-video-compression-experiment.mjs tests/hero-video-compression-experiment.test.ts
```

Expected PASS; help creates nothing. Recheck MP4/focus/protected hashes. Require only two tracked implementation paths; stage exactly them; confirm user identity; commit `feat: add hero video compression experiment harness`. A fresh Sol reviewer checks the exact Task 1 diff/evidence. Resolve every Critical/Important finding, commit any bounded remediation, and rerun affected focused checks. Only after Task 1 review is READY, record final reviewed `HEAD` as the distinct full harness SHA without changing `implementationBaseline`:

```powershell
$receiptPath = '.superpowers/sdd/phase-6c-hero-video-compression/implementation-baseline.json'
$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
$harnessCommit = (git rev-parse HEAD).Trim()
if ($harnessCommit -eq $receipt.implementationBaseline) { throw 'Harness commit must differ from implementation baseline.' }
git merge-base --is-ancestor $receipt.implementationBaseline $harnessCommit
if ($LASTEXITCODE -ne 0) { throw 'Implementation baseline is not an ancestor of harness commit.' }
git merge-base --is-ancestor $receipt.designCommit $receipt.implementationBaseline
if ($LASTEXITCODE -ne 0) { throw 'Design commit is not an ancestor of implementation baseline.' }
$receipt.harnessCommit = $harnessCommit
$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding utf8
```

Coordinator confirms the receipt has separate full `implementationBaseline` and final reviewed `harnessCommit` values with correct ancestry. No Task 1 commit may follow that assignment; any later harness remediation requires re-review and an explicit receipt update to the new final reviewed SHA before Task 2. No push.

---

### Task 2: Candidate Encoding and Objective Evidence

**Owner:** One Luna implementer owns only ignored run/report output. No tracked changes or commit.

**Files:**

- Create ignored: `.superpowers/sdd/phase-6c-hero-video-compression/runs/terrace-pilot-20260831-01/**`
- Create ignored: `.superpowers/sdd/phase-6c-hero-video-compression/delivery-report.md`
- Modify tracked: none

**Interfaces:** Consumes reviewed Task 1 harness. Produces 12 candidates, probes, three metrics per direction, six pair decisions, receipts, and objective report. AV1 remains measurement-only.

- [ ] **Step 1: Revalidate immutable planning baseline, harness predecessor, tools, ownership, and hashes**

Read the baseline receipt and require both commit values to be full SHAs. Require `HEAD == harnessCommit`, `implementationBaseline != harnessCommit`, `implementationBaseline` to be an ancestor of `harnessCommit`, and resolved full `c730d66^{commit}` to equal `designCommit` and be an ancestor of `implementationBaseline`. The run manifest must copy both exact SHAs into their separate fields. Require run path absent; FFmpeg/ffprobe 8.1.2; exact MP4/focus/protected hashes. Stop on mismatch. Never clean an existing run; use a coordinator-approved new versioned ID.

```powershell
$receipt = Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-compression/implementation-baseline.json' -Raw | ConvertFrom-Json
$headCommit = (git rev-parse HEAD).Trim()
$designCommit = (git rev-parse 'c730d66^{commit}').Trim()
if ($headCommit -ne $receipt.harnessCommit) { throw 'HEAD does not equal harnessCommit.' }
if ($receipt.implementationBaseline -eq $receipt.harnessCommit) { throw 'Baseline and harness commit must differ.' }
if ($designCommit -ne $receipt.designCommit) { throw 'Design commit receipt mismatch.' }
git merge-base --is-ancestor $receipt.implementationBaseline $receipt.harnessCommit
if ($LASTEXITCODE -ne 0) { throw 'Implementation baseline is not an ancestor of harness commit.' }
git merge-base --is-ancestor $receipt.designCommit $receipt.implementationBaseline
if ($LASTEXITCODE -ne 0) { throw 'Design commit is not an ancestor of implementation baseline.' }
```

- [ ] **Step 2: Run one create-mode ladder**

```powershell
node scripts/hero-video-compression-experiment.mjs run --run-id terrace-pilot-20260831-01
```

Expected: create mode; four H.264 encodes, eight VP9 passes yielding four VP9 candidates, four AV1 encodes, 12 candidate probe sets, 36 metrics. Metrics use candidate/distorted input #0, original/reference input #1, `[dist][ref]`, safe relative metric paths, fixed run-root cwd. Every boundary verifies immutable sources before/after.

- [ ] **Step 3: Validate identity, probes, metrics, arithmetic**

Require exact unique pair/direction/codec/quality/extension/disposition; one video/zero audio; 1168 x 784; yuv420p; 24/1; 145 packets; 6.041667 ±0.001; exact bytes/hash/bitrate/profile; numeric VMAF/SSIM/PSNR and evidence hashes. Recompute:

```text
combinedOriginalBytes = 18568392
maximumPassingPairBytes = 9284196
reductionPercent = ((18568392 - combinedBytes) / 18568392) * 100
```

AV1 must be `MEASUREMENT_ONLY`; H.264/VP9 becomes pending visual only on both VMAF, byte, and probe gates. None eligible means `NO_CHANGE`.

- [ ] **Step 4: Validate report, focused checks, review gate**

After final objective manifest atomic write, copy its exact bytes atomically to immutable owned `objective-manifest.json`, hash that snapshot, and write `objective-evidence.json` with the defined schema; then write the delivery report from the snapshot plus that receipt. Later visual/decision steps may update `manifest.json` but never modify the objective snapshot or receipt. Report includes distinct full design, immutable `implementationBaseline`, and `harnessCommit` SHAs; exact `objectiveManifestSha256`; relative paths; versions; exact settings; probes/bytes/metrics/arithmetic/status; AV1 explanation; eligible H.264/VP9 list. It excludes absolute paths, metadata, banners, deployed-performance/Safari/fallback/rollout claims. Task 3 uses `harnessCommit` as its exact Git predecessor and the snapshot's `objectiveManifestSha256` as its ignored-evidence predecessor. Run focused Vitest, two-file Prettier, diff check, status, immutable/protected hashes. No tracked Task 2 change/commit/force-add. Fresh Sol reviewer checks all objective evidence; resolve Critical/Important findings before Task 3.

---

### Task 3: Direct Playback Evidence, Visual Package, and Decision Closeout

**Owner:** One Luna implementer owns ignored visual/browser/decision/report output. User owns binding verdict. No tracked change or commit.

**Files:**

- Create ignored: run `visuals/**`, `browser-receipts/**`, `visual-observations.json`, `decision.json`
- Modify ignored: run `manifest.json`, experiment `delivery-report.md`
- Modify tracked: none

**Interfaces:** Consumes eligible H.264/VP9 only. Produces synchronized direct playback, lossless frames, focused Chromium receipts, user observations, final `VISUALLY_APPROVED` or `NO_CHANGE`. No AV1 winner, Safari/fallback assertion, production integration, Preview claim, or rollout.

- [ ] **Step 1: Branch on objective status**

Before opening objective evidence, bind Task 3 to the exact predecessors. Require `HEAD == harnessCommit`, immutable `implementationBaseline` to be an ancestor of `harnessCommit`, full `designCommit` to be an ancestor of `implementationBaseline`, manifest copies of both SHAs to match the receipt, and immutable `objective-manifest.json` SHA-256 to equal `objective-evidence.json.objectiveManifestSha256`:

```powershell
$baselineReceipt = Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-compression/implementation-baseline.json' -Raw | ConvertFrom-Json
$runRoot = '.superpowers/sdd/phase-6c-hero-video-compression/runs/terrace-pilot-20260831-01'
$objectiveReceipt = Get-Content -LiteralPath (Join-Path $runRoot 'objective-evidence.json') -Raw | ConvertFrom-Json
$manifest = Get-Content -LiteralPath (Join-Path $runRoot 'manifest.json') -Raw | ConvertFrom-Json
$headCommit = (git rev-parse HEAD).Trim()
$designCommit = (git rev-parse 'c730d66^{commit}').Trim()
if ($headCommit -ne $baselineReceipt.harnessCommit) { throw 'Task 3 HEAD does not equal harnessCommit.' }
if ($designCommit -ne $baselineReceipt.designCommit) { throw 'Task 3 designCommit mismatch.' }
if ($manifest.harnessCommit -ne $baselineReceipt.harnessCommit) { throw 'Manifest harnessCommit mismatch.' }
if ($manifest.implementationBaseline -ne $baselineReceipt.implementationBaseline) { throw 'Manifest implementationBaseline mismatch.' }
git merge-base --is-ancestor $baselineReceipt.implementationBaseline $baselineReceipt.harnessCommit
if ($LASTEXITCODE -ne 0) { throw 'Implementation baseline is not an ancestor of harness commit.' }
git merge-base --is-ancestor $baselineReceipt.designCommit $baselineReceipt.implementationBaseline
if ($LASTEXITCODE -ne 0) { throw 'Design commit is not an ancestor of implementation baseline.' }
$manifestHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $runRoot 'objective-manifest.json')).Hash.ToLowerInvariant()
if ($manifestHash -ne $objectiveReceipt.objectiveManifestSha256) { throw 'Objective manifest predecessor hash mismatch.' }
```

If any check fails, stop. If no eligible H.264/VP9, bind an in-memory `UserObservationSet` with matching schema/run ID and `observations: []`, require exact objective inventory, then run open-mode decision:

```powershell
node scripts/hero-video-compression-experiment.mjs decision --run-id terrace-pilot-20260831-01 --outcome no-change --approval-reference "No eligible H.264 or VP9 pair passed objective gates"
```

Expected: `decision.json` is added directly to the objective inventory; no `visuals/**`, browser receipt, screenshot, or `visual-observations.json` is created; manifest remains `NO_CHANGE`; exact inventory equals `enumerateOwnedRunFiles(runId, 'decision', [])`. Skip to Step 7. AV1 never enters winner list.

- [ ] **Step 2: Generate primary direct-playback package**

```powershell
node scripts/hero-video-compression-experiment.mjs visuals --run-id terrace-pilot-20260831-01
```

Expected: open mode validates complete owned manifest, rejects partial/unknown files, verifies MP4s plus focus before/after visual commands, creates eligible H.264/VP9 artifacts only. `index.html` uses direct original/candidate `<video muted playsinline preload="auto">` as primary evidence with synchronized normal-speed controls and readiness/error log. Hstack, if present, is non-authoritative. Frame 0/72/144 PNG pairs are lossless. Local sequence is not runtime-interaction proof.

- [ ] **Step 3: Capture focused Chromium playback receipts**

Visuals command builds the exact allowlisted routes defined in Task 1, then calls `startLoopbackServer({ host: '127.0.0.1', port: 0, routes })` exactly once, validates the returned dynamic loopback origin, and calls `runGuardedBrowserPlayback` once for every eligible pair/direction/viewport using only that origin. That boundary verifies immutable visual inputs before launch and in `finally`, launches injected installed Playwright Chromium, visits exact viewports desktop 1440x1000 and mobile 390x844, and plays direct original/candidate elements at playbackRate 1 through completion. Each call creates one unique `BrowserCommandReceipt` and one linked `BrowserEvidenceRecord` containing viewport, browser/version, candidate/direction, loadeddata, canplay, ended, error, first-frame/transition readiness, separate original/candidate durations, maximum drift, JSON bytes/hash, screenshot hash, and exact browser command sequence. A completed negative media gate is persisted for rejection; an infrastructure/write/cleanup/immutable failure aborts and requires a new run ID. Each browser closes in its guarded `finally`; after all calls or any failure, the outer `finally` awaits `server.close()` exactly once. No external request is allowed. Exact browser inventory per eligible pair is four JSON receipts plus four PNG screenshots: forward/reverse multiplied by desktop/mobile. No aggregate receipt is generated.

Expected approval-capable success: loadeddata/canplay/ended true, error false, readiness true, both finite durations within `6.041667 ± 0.001`, and drift at most 0.040 seconds. A completed negative media gate rejects that pair; infrastructure failure aborts the run. Chromium evidence makes no Safari/fallback claim.

- [ ] **Step 4: Validate inventory and prepare observations**

Require per eligible pair direct entries for both directions, six lossless frame PNGs, exactly four browser JSON receipts, exactly four browser PNG screenshots, and optional labeled convenience renders. For every JSON receipt, compute and validate `jsonBytes` and `jsonSha256`; for every screenshot validate `screenshotSha256`; bind the receipt to exact command sequences. Manifest records these fields plus relative path/frame evidence, and report states both exact browser counts. Write one `UserObservationSet` to `visual-observations.json` with schema/run ID and exactly one pending `UserObservation` for every eligible pair ID—no duplicate, missing, unknown, rejected, or AV1 pair. Each observation contains both viewports, both directions, normal-speed difference, corruption, color shift, blocking, banding, dropped ending, seam, readiness, and playback failure fields. Reduced-motion/failed-media fallback remain `NOT_APPLICABLE_UNTIL_FUTURE_INTEGRATION`.

- [ ] **Step 5: STOP for user visual approval**

Present direct synchronized playback first, then lossless frames and optional convenience render. User reviews both viewport packages at normal speed, selects one exact eligible H.264/VP9 pair or rejects all. Do not decide, integrate, select fallback, claim Safari, convert more media, push, deploy, open PR, or merge while waiting.

- [ ] **Step 6: Record exact user decision**

Build one exact `UserObservationSet` from the user's stated verdict, containing every eligible pair exactly once. Pipe its JSON through the guarded atomic observations command before decision:

```powershell
$observationSet = [ordered]@{
  schemaVersion = 1
  runId = 'terrace-pilot-20260831-01'
  observations = @(
    # One fully populated UserObservation object for every exact eligible pair ID, derived from the user verdict.
  )
}
$observationJson = $observationSet | ConvertTo-Json -Depth 10 -Compress
$observationJson | node scripts/hero-video-compression-experiment.mjs observations --run-id terrace-pilot-20260831-01 --stdin
```

The comment marks a runtime-derived array, not omitted implementation: before execution the coordinator enumerates `manifest.pairResults` where `eligible=true`, materializes one object matching the complete `UserObservation` schema for each ID, shows that object set in the task evidence, and refuses to run while the array is empty or incomplete. `observations` reads exactly one JSON value from stdin, rejects trailing content, verifies immutable visual inputs before and in `finally`, atomically replaces only `paths.visualObservationsPath`, rereads and validates the bytes, then reports the resulting hash. It never writes `decision.json` or changes manifest status.

Approval requires complete Chromium receipts, both directions/viewports, normal-speed observation, no playback/readiness failure, all defects false for the chosen eligible H.264/VP9 ID, explicit `VISUALLY_REJECTED` complete observations for every other eligible pair, and user reference.

```powershell
node scripts/hero-video-compression-experiment.mjs decision --run-id terrace-pilot-20260831-01 --outcome approved --candidate vp9-cq24 --approval-reference "User visual approval on 2026-08-31"
```

Pair in approved command must equal user's exact eligible choice. Before running it, assert `UserObservationSet` covers every eligible pair exactly once. Rejected-all command requires every eligible pair observation to be complete and `VISUALLY_REJECTED`:

```powershell
node scripts/hero-video-compression-experiment.mjs decision --run-id terrace-pilot-20260831-01 --outcome no-change --approval-reference "User rejected all eligible candidates after direct visual review"
```

Approved means one experiment pair only, production unchanged, separate integration plan required. Rejected means `NO_CHANGE`.

- [ ] **Step 7: Final focused checks and review gate**

Run focused Vitest, two-file Prettier, diff check, status, all immutable/protected hashes. Require no tracked Task 2/3 change. Never force-add evidence. Fresh Sol reviewer checks lifecycle, direct-playback primacy, Chromium receipts, user evidence, AV1 exclusion, NO_CHANGE, integration-only NOT_APPLICABLE fields, non-disclosure, unchanged production, no performance/rollout claim. Resolve Critical/Important findings only with focused checks.

Final handoff states exactly one outcome:

- `NO_CHANGE`: no eligible H.264/VP9 survived all gates or user rejected all; production unchanged.
- `VISUALLY_APPROVED`: one named H.264/VP9 passed objective, Chromium, and user visual gates; production unchanged pending separate integration plan.

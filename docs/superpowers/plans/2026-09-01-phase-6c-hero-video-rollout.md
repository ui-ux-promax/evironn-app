# Phase 6C Hero Video Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encode and locally integrate exactly sixteen preferred VP9 WebM hero transitions plus sixteen compressed H.264 MP4 fallbacks, with immutable source gates, deterministic runtime selection, one bounded fallback, and automatic local acceptance evidence.

**Architecture:** A new focused Node rollout harness owns a literal source manifest, candidate generation, probe/VMAF/browser validation, atomic promotion, rollback receipts, and aggregate reporting without changing the completed pilot harness. Runtime product data carries one `{ webm, mp4 }` pair per direction; a pure capability resolver chooses one source before connection, while the existing media operation token permits one pre-playback WebM-to-MP4 fallback and retains all existing cleanup/state behavior.

**Tech Stack:** Node.js 24 ESM, FFmpeg/ffprobe 8.1.2 (`libvpx-vp9`, `libx264`, `libvmaf`), Playwright 1.60 Chromium, React 18, TypeScript 5.7, Vitest 4.1, Git LFS.

## Global Constraints

- Repository and branch are exactly `D:\Projects\evironn` and `phase/06-hardening-release`.
- Approved design baseline is `0034a019bf96dbb17918101312cd5ffe63562f0a`; it is authority evidence, not the implementation diff base.
- The immutable implementation baseline is the coordinator-created commit that contains both `docs/superpowers/specs/2026-09-01-phase-6c-hero-video-rollout-planning-brief.md` and this reviewed plan. At implementation start, derive it with `git rev-parse HEAD`, prove both paths exist in that commit, and record the full hash in the rollout receipt. Never substitute `0034a019bf96dbb17918101312cd5ffe63562f0a` or moving `HEAD` later.
- Preserve untracked `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` at SHA-256 `fd43e58af19e79f746c41126572072e38792052f202ae5c1c26e4efdb5f6e6e9` and `docs/superpowers/plans/phase-2-task-3-execution.md` at SHA-256 `f1be0e060eda06afa2afdff53d4dcecd338b3c67514e412e2add0605c503a7e2`; never stage either file.
- Preserve `.gitattributes`; both `*.mp4` and `*.webm` must remain Git LFS tracked. No package or lockfile change is allowed.
- Reuse the verified pilot semantics from session `01a05acb-c67b-7d22-826b-7822b2eaeb20`, run `terrace-pilot-20260901-04`, and harness commit `7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe`. Do not modify `scripts/hero-video-compression-experiment.mjs` or `tests/hero-video-compression-experiment.test.ts`; do not rerun the codec bakeoff or create a comparison page.
- Product-card media under `public/assets/products`, focus/idle assets, layout, copy, styling, timing, hotspots, room/product state machines, Prisma, environment, provider, workflow, DB, admin, catalog, PDP, deployment, GitHub, PR, merge, and branch operations are excluded.
- All thirty-two candidates must exist and pass before production promotion begins. Candidate generation, receipts, backups, and rollback evidence stay under ignored `.superpowers/sdd/phase-6c-hero-video-rollout/`.
- VP9 primary recipe is two-pass `libvpx-vp9`, `-crf 28 -b:v 0 -deadline good -cpu-used 1 -threads 1 -row-mt 0 -tile-columns 0 -frame-parallel 0`; only CQ24 is an allowed retry.
- Approved design retry policy is authoritative: CQ24 is permitted only when CQ28 fails quality or stream gates. A CQ28 size failure is immediate `NO_CHANGE`; CQ24 is never a size remediation. This resolves any contrary planning-brief interpretation without changing the approved artifacts.
- MP4 fallback recipe is `libx264 -crf 20 -preset slow -threads 1 -movflags +faststart`; only CRF18 is an allowed retry.
- Both recipes use `-map 0:v:0 -an -map_metadata -1 -vf fps=24,format=yuv420p -fps_mode cfr -t 6.041667`. VMAF input order is candidate input 0, immutable source input 1, `[dist][ref]`.
- Every candidate independently requires source dimensions, `yuv420p`, `24/1` FPS, 145 video packets, duration in `[6.040667, 6.042667]`, one playable video stream, zero audio streams, zero attached pictures, stripped metadata, VMAF `>= 95`, bytes below its own original, and real Chromium playback through `ended` without a media error.
- Preferred aggregate gate uses integer math: `reductionBytes = 103076167 - webmBytes`; pass only when `reductionBytes * 10000 >= 103076167 * 4000`, equivalently `webmBytes <= 61845700`. Report `reductionPercent = reductionBytes * 100 / 103076167` without rounding the pass/fail comparison.
- Runtime uses WebM only when its path is non-empty and `canPlayType('video/webm; codecs="vp9"')` returns a non-empty string. Otherwise it uses MP4. Only one `video.src` is connected; both formats are never rendered or preloaded together.
- WebM may fall back to matching MP4 exactly once, only before `loadeddata`/useful playback. MP4 error or any post-playback error uses the existing `onFailure(phase)` path. No loop is possible.
- Every task gets one fresh isolated `gpt-5.6-sol` reviewer at `medium` reasoning. Every dispatch must say: `Read caveman and use ultra intensity for all commentary and final messages.` Resolve all Critical/Important findings before advancing; record Minor disposition.
- Task checks are focused. Only Task 4 may run the completion gate, exactly once: `npm run format`, `npm run gate`, `npm run build`, then the single critical rollout E2E file.
- Valid terminal outcomes are `ROLLOUT_READY_LOCAL`, `NO_CHANGE`, or `BLOCKED`. Stop before push, Vercel Preview, provider/DB operation, PR, merge, or deployed-performance claim.
- `productionState` is exactly one of `UNCHANGED`, `VERIFIED`, `ROLLED_BACK`, or `UNKNOWN`: generation failure before production mutation is `NO_CHANGE`/`UNCHANGED`; successful promotion is `PROMOTED`/`VERIFIED`; a proved rollback is `NO_CHANGE`/`ROLLED_BACK`; a failed or unproved rollback is `BLOCKED`/`UNKNOWN`.

## Exact production promotion allowlist

The harness must encode these arrays literally and compare sorted production targets against them before every promotion or rollback. No directory glob may determine a mutation target.

```js
export const MP4_PROMOTION_ALLOWLIST = Object.freeze([
  'public/assets/hero/bedroom-bed-forward.mp4',
  'public/assets/hero/bedroom-bed-reverse.mp4',
  'public/assets/hero/bedroom-chair-forward.mp4',
  'public/assets/hero/bedroom-chair-reverse.mp4',
  'public/assets/hero/chair-forward.mp4',
  'public/assets/hero/chair-reverse.mp4',
  'public/assets/hero/kitchen-dining-forward.mp4',
  'public/assets/hero/kitchen-dining-reverse.mp4',
  'public/assets/hero/kitchen-island-forward.mp4',
  'public/assets/hero/kitchen-island-reverse.mp4',
  'public/assets/hero/sofa-forward.mp4',
  'public/assets/hero/sofa-reverse.mp4',
  'public/assets/hero/terrace-chair-forward.mp4',
  'public/assets/hero/terrace-chair-reverse.mp4',
  'public/assets/hero/terrace-sofa-forward.mp4',
  'public/assets/hero/terrace-sofa-reverse.mp4',
]);

export const WEBM_PROMOTION_ALLOWLIST = Object.freeze([
  'public/assets/hero/bedroom-bed-forward.webm',
  'public/assets/hero/bedroom-bed-reverse.webm',
  'public/assets/hero/bedroom-chair-forward.webm',
  'public/assets/hero/bedroom-chair-reverse.webm',
  'public/assets/hero/chair-forward.webm',
  'public/assets/hero/chair-reverse.webm',
  'public/assets/hero/kitchen-dining-forward.webm',
  'public/assets/hero/kitchen-dining-reverse.webm',
  'public/assets/hero/kitchen-island-forward.webm',
  'public/assets/hero/kitchen-island-reverse.webm',
  'public/assets/hero/sofa-forward.webm',
  'public/assets/hero/sofa-reverse.webm',
  'public/assets/hero/terrace-chair-forward.webm',
  'public/assets/hero/terrace-chair-reverse.webm',
  'public/assets/hero/terrace-sofa-forward.webm',
  'public/assets/hero/terrace-sofa-reverse.webm',
]);
```

---

### Task 1: Generalize the inventory-driven rollout harness without changing the pilot harness

**Files:**

- Create: `scripts/hero-video-rollout.mjs`
- Create: `tests/hero-video-rollout.test.ts`
- Read only: `scripts/hero-video-compression-experiment.mjs`
- Read only: `tests/hero-video-compression-experiment.test.ts`
- Evidence only, ignored: `.superpowers/sdd/phase-6c-hero-video-rollout/`

**Interfaces:**

- Consumes: implementation baseline full SHA derived from the coordinator planning commit; pilot recipe/guard semantics at `7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe`; the literal sixteen-row `HERO_VIDEO_SOURCES` definition in Task 1 Step 4.
- Produces: `HERO_VIDEO_SOURCES`, `MP4_PROMOTION_ALLOWLIST`, `WEBM_PROMOTION_ALLOWLIST`, `validateSourceInventory(sources: readonly HeroVideoSource[]): void`, `resolveRolloutPaths(repositoryRoot: string, runId: string): RolloutPaths`, `commandPreflightPolicy(command: string): CommandPreflightPolicy`, `buildWebmAbsenceGates(repositoryRoot: string, implementationBaseline: string): WebmAbsenceGates`, `buildCandidateInvocations(source: HeroVideoSource, format: 'webm' | 'mp4', quality: 28 | 24 | 20 | 18, paths: RolloutPaths): Invocation[]`, `timeoutForInvocation(invocation: Invocation): number`, `buildMetricInvocation(source: HeroVideoSource, candidate: CandidateEvidence, paths: RolloutPaths): Invocation`, `buildPromotedMetricInvocation(source: HeroVideoSource, production: ProductionEvidence, paths: RolloutPaths): Invocation`, `assessCandidate(source: HeroVideoSource, candidate: CandidateEvidence): CandidateAssessment`, `nextQuality(format: 'webm' | 'mp4', attemptedQuality: 28 | 24 | 20 | 18, assessment: CandidateAssessment): 24 | 18 | null`, `computeAggregateReduction(webmBytes: number): AggregateAssessment`, `verifyImmutableSources(repositoryRoot: string, dependencies?: RolloutDependencies): Promise<void>`, `assertFinalReceiptCoverage(manifest: RolloutManifest): RolloutReceipt[]`, `writeJsonAtomic(ownedRunRoot: string, target: string, value: RolloutManifest, dependencies: RolloutDependencies): Promise<void>`, `runCandidateBatch(context: RolloutContext): Promise<RolloutManifest>`, `promoteValidatedBatch(context: RolloutContext): Promise<RolloutManifest>`, `recoverInterruptedPromotion(context: RolloutContext): Promise<RolloutManifest>`, `verifyProduction(context: RolloutContext): Promise<RolloutManifest>`, `manifestResult(command: string, manifest: RolloutManifest): CliResult`, and `main(argv: string[], dependencies?: RolloutDependencies): Promise<number>`.
- CLI: `node scripts/hero-video-rollout.mjs characterize|run|recover|verify-production|report --run-id phase-6c-rollout-20260901-01 --implementation-baseline $phase6cBaseline`; the PowerShell variable is derived and validated in Step 1. Every invocation prints exactly one JSON object and sets `process.exitCode` (`0` success, `2` `NO_CHANGE`, `1` `BLOCKED`). `run` performs immutable verification, all inventory-driven encodes/retries/probes/VMAF/browser checks, aggregate gate, and exact atomic promotion. It never promotes an incomplete or invalid manifest.

- [ ] **Step 1: Capture immutable implementation and protected-file gates before RED**

Run from `D:\Projects\evironn`:

```powershell
$phase6cBaseline = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Implementation baseline capture failed.' }
if ($phase6cBaseline -notmatch '^[0-9a-f]{40}$') { throw 'Implementation baseline is not a full commit SHA.' }
git cat-file -e "$phase6cBaseline`:docs/superpowers/specs/2026-09-01-phase-6c-hero-video-rollout-planning-brief.md"
if ($LASTEXITCODE -ne 0) { throw 'Planning brief baseline check failed.' }
git cat-file -e "$phase6cBaseline`:docs/superpowers/plans/2026-09-01-phase-6c-hero-video-rollout.md"
if ($LASTEXITCODE -ne 0) { throw 'Plan baseline check failed.' }
$branch = git branch --show-current
if ($LASTEXITCODE -ne 0 -or $branch -ne 'phase/06-hardening-release') { throw 'Wrong branch or branch lookup failed.' }
$protectedA = (Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md').Hash.ToLowerInvariant()
$protectedB = (Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/superpowers/plans/phase-2-task-3-execution.md').Hash.ToLowerInvariant()
if ($protectedA -ne 'fd43e58af19e79f746c41126572072e38792052f202ae5c1c26e4efdb5f6e6e9') { throw 'Protected Phase 2A plan drift.' }
if ($protectedB -ne 'f1be0e060eda06afa2afdff53d4dcecd338b3c67514e412e2add0605c503a7e2') { throw 'Protected Phase 2 task plan drift.' }
$lfsProbePaths = @('public/assets/hero/sofa-forward.mp4','public/assets/hero/sofa-forward.webm')
$lfsActual = @(git check-attr filter -- $lfsProbePaths | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Git LFS attribute check failed.' }
$lfsExpected = @($lfsProbePaths | ForEach-Object { "$_`: filter: lfs" } | Sort-Object)
if ($lfsActual.Count -ne 2 -or (Compare-Object $lfsExpected $lfsActual)) { throw 'Git LFS attribute output must be exactly 2 filter: lfs lines.' }
$identityPath = '.superpowers/sdd/phase-6c-hero-video-rollout/git-identity.json'
$configuredName = [string](git config --get user.name)
if ($LASTEXITCODE -ne 0) { throw 'Git user.name lookup failed.' }
$configuredEmail = [string](git config --get user.email)
if ($LASTEXITCODE -ne 0) { throw 'Git user.email lookup failed.' }
if ([string]::IsNullOrWhiteSpace($configuredName) -or [string]::IsNullOrWhiteSpace($configuredEmail)) { throw 'Git identity is incomplete; user must fix it.' }
if (Test-Path -LiteralPath $identityPath) {
  $identity = Get-Content -LiteralPath $identityPath -Raw | ConvertFrom-Json
  if ($identity.userName -ne $configuredName -or $identity.userEmail -ne $configuredEmail -or -not $identity.userConfirmed) { throw 'Stored user-confirmed Git identity differs from current config.' }
} else {
  $typedIdentity = Read-Host "Confirm this is your Git identity by typing exactly: $configuredName <$configuredEmail>"
  if ($typedIdentity -cne "$configuredName <$configuredEmail>") { throw 'Git identity was not confirmed; do not commit.' }
  $identity = [ordered]@{ userName=$configuredName; userEmail=$configuredEmail; userConfirmed=$true }
  $identityTemp = "$identityPath.partial"
  $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(($identity | ConvertTo-Json) + "`n")
  $stream = [System.IO.File]::Open($identityTemp,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
  try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
  Move-Item -LiteralPath $identityTemp -Destination $identityPath
}
```

Expected: both `git cat-file` commands exit 0; branch matches; hashes match; both media paths report `filter: lfs`; the user explicitly confirms the configured Git name/email once and the ignored receipt preserves that exact identity. The plan never changes or impersonates identity. A missing, unconfirmed, or later mismatched identity is `BLOCKED`; ask the user to fix configuration and stop before commit, matching `D:\Projects\evironn\AGENTS.md`.

- [ ] **Step 2: Write the focused harness RED contracts**

Create `tests/hero-video-rollout.test.ts` with these fixtures and 20 complete named tests. `makeDependencies()` is a same-file in-memory fake: `realpath/lstat/stat/readFile/hashFile/readdir` return supplied maps; `encodeProbeMetricAndPlay/assessCandidate/playCandidate/copyFile/rename/unlink/writeFile/open` are `vi.fn()` calls that append exact paths to separate `workspaceMutations` and `productionMutations` ledgers; manifest and production renames have separate counters and independently injectable boundaries. No child process, browser, or disk mutation occurs in Task 1.

```ts
import { describe, expect, it, vi } from 'vitest';
import path from 'node:path';

import {
  HERO_VIDEO_SOURCES,
  MP4_PROMOTION_ALLOWLIST,
  WEBM_PROMOTION_ALLOWLIST,
  assessCandidate,
  assertFinalReceiptCoverage,
  buildCandidateInvocations,
  buildMetricInvocation,
  buildWebmAbsenceGates,
  classifyFailure,
  commandPreflightPolicy,
  computeAggregateReduction,
  nextQuality,
  parseProbe,
  promoteValidatedBatch,
  reportPromotedRollout,
  recoverInterruptedPromotion,
  resolveRolloutPaths,
  runCandidateBatch,
  manifestResult,
  main,
  timeoutForInvocation,
  validateSourceInventory,
  verifyProduction,
  writeJsonAtomic,
} from '../scripts/hero-video-rollout.mjs';

const EXPECTED_MP4 = [
  'public/assets/hero/bedroom-bed-forward.mp4',
  'public/assets/hero/bedroom-bed-reverse.mp4',
  'public/assets/hero/bedroom-chair-forward.mp4',
  'public/assets/hero/bedroom-chair-reverse.mp4',
  'public/assets/hero/chair-forward.mp4',
  'public/assets/hero/chair-reverse.mp4',
  'public/assets/hero/kitchen-dining-forward.mp4',
  'public/assets/hero/kitchen-dining-reverse.mp4',
  'public/assets/hero/kitchen-island-forward.mp4',
  'public/assets/hero/kitchen-island-reverse.mp4',
  'public/assets/hero/sofa-forward.mp4',
  'public/assets/hero/sofa-reverse.mp4',
  'public/assets/hero/terrace-chair-forward.mp4',
  'public/assets/hero/terrace-chair-reverse.mp4',
  'public/assets/hero/terrace-sofa-forward.mp4',
  'public/assets/hero/terrace-sofa-reverse.mp4',
] as const;
const EXPECTED_WEBM = EXPECTED_MP4.map((file) => file.replace(/\.mp4$/u, '.webm'));
const EXPECTED_HASHES = [
  '34c684217333b446253485a15659999d6e465d7ac52902f8a7f657cf35370ed1',
  '84b9481ca9ec1e6a049ba5955c902431c1876b37ed051b0a202bbc46e20ee8fa',
  '8f192f5a2e735116340391cda3db0f17caeb91102ec69c97b6d624d86b0dc0e7',
  'a48d8f03959196904a5eedd7241435c57b00740ad56cc1d416a98729b9a91cc4',
  '830bfcdf25fc3af7b137e4fdcace3775dafcf7f1b02a05aba340b0fc6ae0e3de',
  'a458d20808a0c843a1deb0afaf812613bb34303dfcc0f7fc4a99990a03ac1ed8',
  '1a2b06356edab8950d2c3ab6cc47fb8e96e13453e3dc3dceff38fda0ef88d5ac',
  '89e1aef8be033d717cd652a15a41669e6d5aeae63374aed6fee2075331fa6dc9',
  '8b0347469a1d3dafdbbd35c1da90ab6dbb2046163de5286a09cab9517c3de8c2',
  '7ebab953d4fa7abaca66a452ea2bcac00528d94be0cfe314c9ac9f75c9ee9c1f',
  '97928b8a8659750df9cd89fc2109f57a943413564b6d320214c8bc7c43de6655',
  'dd38f87e057a9a13176ff7a35bc624419c4102fd61aae6b4b19044fa4d4177f5',
  'e375a3c87f142df574abe4371967a4fcba99356067ff6c716292e746d615381f',
  '726404a4e234fad318b65609a9dfcb838e878cc7eb21f30743e49d2dca686c6d',
  '68c5db691631c94f141a230fe5f37f9f74e7115302b57398b4dfb036065d4892',
  '1683f5051bcf4f91e946af436fcbd894ed3cd76d08d2446d8306e44a9494973c',
] as const;
const EXPECTED_BYTES = [
  3979743, 3211117, 6476041, 5437362, 9022617, 7696268, 6138461, 5330779, 4664253, 4013620, 6918992, 5679663, 8556765,
  7382094, 9941316, 8627076,
] as const;
const source = HERO_VIDEO_SOURCES[0];
const paths = resolveRolloutPaths('D:/repo', 'phase-6c-rollout-20260901-01');
const passingCandidate = {
  sourceId: source.id,
  format: 'webm' as const,
  quality: 28 as const,
  attempt: 1,
  candidatePath: 'candidates/bedroom-bed-forward.webm',
  bytes: source.bytes - 1,
  sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  probe: {
    codecName: 'vp9',
    width: 1168,
    height: 768,
    pixelFormat: 'yuv420p',
    rFrameRate: '24/1',
    avgFrameRate: '24/1',
    packets: 145,
    durationSeconds: 6.041667,
    videoStreams: 1,
    audioStreams: 0,
    attachedPictures: 0,
    streamTags: { encoder: 'Lavc libvpx-vp9' },
    formatTags: Object.create(null),
  },
  vmaf: 95,
  playback: { loadeddata: true, playing: true, ended: true, error: null },
};

function makeAcceptedCandidates() {
  return HERO_VIDEO_SOURCES.flatMap((item) => [
    {
      ...passingCandidate,
      sourceId: item.id,
      format: 'webm' as const,
      quality: 28 as const,
      candidatePath: `candidates/${item.id}.webm`,
      bytes: Math.floor((item.bytes * 55) / 100),
      probe: { ...passingCandidate.probe, width: item.width, height: item.height },
    },
    {
      ...passingCandidate,
      sourceId: item.id,
      format: 'mp4' as const,
      quality: 20 as const,
      candidatePath: `candidates/${item.id}.mp4`,
      bytes: item.bytes - 1,
      probe: {
        ...passingCandidate.probe,
        codecName: 'h264',
        width: item.width,
        height: item.height,
        streamTags: { encoder: 'Lavc libx264' },
        formatTags: { major_brand: 'isom', minor_version: '512', compatible_brands: 'isomiso2avc1mp41' },
      },
    },
  ]);
}

function makeDependencies(
  options: {
    acceptedCandidates?: ReturnType<typeof makeAcceptedCandidates>;
    candidateAssessments?: Array<{ accepted: boolean; failedGates: string[] }>;
    failProductionRenameAt?: number;
    failFinalCompletionReceipt?: boolean;
    preflightFailure?: 'missing-ffmpeg' | 'baseline-drift' | 'protected-drift' | 'unsafe-target';
    promotedIdentityFailure?: string;
    failRollbackCopy?: boolean;
  } = Object.create(null),
) {
  const paths = resolveRolloutPaths('D:/repo', 'phase-6c-rollout-20260901-01');
  const acceptedCandidates = options.acceptedCandidates ?? [];
  const productionMutations: string[] = [];
  const workspaceMutations: string[] = [];
  const filesystemReceipts: Array<{
    operation: string;
    mode: 'OBSERVE' | 'MUTATE';
    path: string;
    secondaryPath: string | null;
  }> = [];
  const removedWorkspacePaths: string[] = [];
  const productionMp4 = new Map(EXPECTED_MP4.map((path, index) => [path, EXPECTED_HASHES[index]]));
  const productionWebm = new Set<string>();
  const temporaryIdentity = new Map<string, { bytes: number; sha256: string }>();
  let sequence = 0;
  let manifestRenameCalls = 0;
  let productionPromotionRenameCalls = 0;
  let productionRollbackRenameCalls = 0;
  let injectedRenameFailure = false;
  const calls = {
    verifyImmutableSources: 0,
    immutableVerificationSequence: 0,
    firstMutationSequence: Number.POSITIVE_INFINITY,
    preMutationSnapshotSequence: 0,
    firstProductionMutationSequence: Number.POSITIVE_INFINITY,
  };
  const markMutation = (operation: string, path: string, secondaryPath: string | null = null) => {
    sequence += 1;
    calls.firstMutationSequence = Math.min(calls.firstMutationSequence, sequence);
    if (path.includes('/.superpowers/sdd/phase-6c-hero-video-rollout/')) workspaceMutations.push(path);
    else {
      productionMutations.push(path);
      calls.firstProductionMutationSequence = Math.min(calls.firstProductionMutationSequence, sequence);
    }
    filesystemReceipts.push({ operation, mode: 'MUTATE', path, secondaryPath });
  };
  const markObservation = (operation: string, target: string) =>
    filesystemReceipts.push({ operation, mode: 'OBSERVE', path: target, secondaryPath: null });
  const identityFor = (target: string) => {
    const normalized = target.replaceAll('\\', '/');
    const temporary = temporaryIdentity.get(normalized);
    if (temporary) return temporary;
    const backupSource = HERO_VIDEO_SOURCES.find(({ sourcePath }) => normalized.endsWith(`/backups/${sourcePath}`));
    if (backupSource) return { bytes: backupSource.bytes, sha256: backupSource.sha256 };
    const originalSource = HERO_VIDEO_SOURCES.find(({ sourcePath }) => normalized.endsWith(`/${sourcePath}`));
    if (originalSource && !normalized.endsWith('.webm')) {
      const productionHash = productionMp4.get(originalSource.sourcePath) ?? originalSource.sha256;
      const candidate = acceptedCandidates.find(
        ({ sourceId, format }) => sourceId === originalSource.id && format === 'mp4',
      );
      return {
        bytes:
          productionHash === originalSource.sha256 ? originalSource.bytes : (candidate?.bytes ?? originalSource.bytes),
        sha256: productionHash,
      };
    }
    const productionWebmPath = WEBM_PROMOTION_ALLOWLIST.find((relative) => normalized.endsWith(`/${relative}`));
    if (productionWebmPath && productionWebm.has(productionWebmPath)) {
      const id = productionWebmPath.replace('public/assets/hero/', '').replace('.webm', '');
      const candidate = acceptedCandidates.find(({ sourceId, format }) => sourceId === id && format === 'webm');
      return { bytes: candidate?.bytes ?? 0, sha256: candidate?.sha256 ?? '0'.repeat(64) };
    }
    const candidate = acceptedCandidates.find(({ candidatePath }) =>
      normalized.endsWith(`/runs/phase-6c-rollout-20260901-01/${candidatePath}`),
    );
    return candidate ? { bytes: candidate.bytes, sha256: candidate.sha256 } : { bytes: 1, sha256: 'b'.repeat(64) };
  };
  const manifest = {
    schemaVersion: 1 as const,
    runId: 'phase-6c-rollout-20260901-01',
    implementationBaseline: '1111111111111111111111111111111111111111',
    pilotHarnessCommit: '7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe' as const,
    status: acceptedCandidates.length === 32 ? ('VALIDATED' as const) : ('VALIDATED' as const),
    productionState: 'UNCHANGED' as const,
    immutableSources: HERO_VIDEO_SOURCES,
    backupSources: HERO_VIDEO_SOURCES.map((item) => ({
      sourcePath: item.sourcePath,
      backupPath: `backups/${item.sourcePath}`,
      bytes: item.bytes,
      sha256: item.sha256,
    })),
    candidates: acceptedCandidates,
    aggregate:
      acceptedCandidates.length === 32
        ? computeAggregateReduction(
            acceptedCandidates.filter(({ format }) => format === 'webm').reduce((sum, item) => sum + item.bytes, 0),
          )
        : null,
    production: [],
    promotionAttempt: null,
    failure: null,
    receipts: acceptedCandidates.map((candidate, index) => ({
      sequence: index + 1,
      kind: 'browser-playback',
      sourceId: candidate.sourceId,
      format: candidate.format,
      quality: candidate.quality,
      attempt: candidate.attempt,
      candidateSha256: candidate.sha256,
      status: 'SUCCEEDED' as const,
      executable: null,
      args: [candidate.candidatePath],
      exitCode: 0,
      artifactPath: candidate.candidatePath,
      artifactSha256: candidate.sha256,
    })),
    filesystemReceipts: [],
  };
  const dependencies = {
    audit: filesystemReceipts,
    preflight: vi.fn(async () => options.preflightFailure ?? null),
    exists: vi.fn(async (target: string) => {
      markObservation('exists', target);
      const normalized = target.replace('D:/repo/', '').replaceAll('\\', '/');
      if (normalized.startsWith('public/assets/hero/') && normalized.endsWith('.webm'))
        return productionWebm.has(normalized);
      if (normalized.endsWith('.tmp')) return temporaryIdentity.has(target.replaceAll('\\', '/'));
      return true;
    }),
    realpath: vi.fn(async (target: string) => {
      markObservation('realpath', target);
      return target.replaceAll('\\', '/');
    }),
    lstat: vi.fn(async (target: string) => {
      markObservation('lstat', target);
      return {
        isFile: () => true,
        isDirectory: () => !path.extname(target),
        isSymbolicLink: () => false,
        size: identityFor(target).bytes,
      };
    }),
    stat: vi.fn(async (target: string) => {
      markObservation('stat', target);
      return {
        isFile: () => true,
        isSymbolicLink: () => false,
        size: identityFor(target).bytes,
      };
    }),
    readFile: vi.fn(async (target: string) => {
      markObservation('readFile', target);
      return Buffer.from('in-memory-fixture');
    }),
    hashFile: vi.fn(async (target: string) => identityFor(target).sha256),
    verifyImmutableSources: vi.fn(async () => {
      sequence += 1;
      calls.verifyImmutableSources += 1;
      calls.immutableVerificationSequence = sequence;
    }),
    verifyPromotedTrackedIdentity: vi.fn(async () => {
      if (options.promotedIdentityFailure) throw new Error(options.promotedIdentityFailure);
    }),
    assertPreMutationSnapshot: vi.fn(async () => {
      sequence += 1;
      calls.preMutationSnapshotSequence = sequence;
    }),
    encodeProbeMetricAndPlay: vi.fn(
      async (
        item: (typeof HERO_VIDEO_SOURCES)[number],
        format: 'webm' | 'mp4',
        quality: 28 | 24 | 20 | 18,
        attempt: number,
      ) => ({
        ...passingCandidate,
        sourceId: item.id,
        format,
        quality,
        attempt,
        candidatePath: `candidates/${item.id}.${format}`,
        bytes: Math.floor(item.bytes * 0.55),
        probe: {
          ...passingCandidate.probe,
          codecName: format === 'webm' ? 'vp9' : 'h264',
          width: item.width,
          height: item.height,
        },
      }),
    ),
    assessCandidate: vi.fn(async () => options.candidateAssessments?.shift() ?? { accepted: true, failedGates: [] }),
    playCandidate: vi.fn(async () => ({ loadeddata: true, playing: true, ended: true, error: null })),
    copyFile: vi.fn(async (from: string, to: string) => {
      if (options.failRollbackCopy && from.includes('/backups/')) throw new Error('Injected rollback copy failure.');
      markMutation('copyFile', to, from);
      temporaryIdentity.set(to.replaceAll('\\', '/'), identityFor(from));
    }),
    rename: vi.fn(async (from: string, to: string) => {
      markMutation('rename', to, from);
      const normalizedTo = to.replaceAll('\\', '/');
      if (normalizedTo === paths.manifest) {
        manifestRenameCalls += 1;
        if (!injectedRenameFailure && options.failFinalCompletionReceipt && productionPromotionRenameCalls === 32) {
          injectedRenameFailure = true;
          throw new Error('Injected final completion receipt failure.');
        }
      } else if (/^D:\/repo\/public\/assets\/hero\/.+\.(mp4|webm)$/u.test(normalizedTo)) {
        if (from.endsWith('.phase-6c-rollout.tmp')) productionPromotionRenameCalls += 1;
        if (from.endsWith('.phase-6c-rollback.tmp')) productionRollbackRenameCalls += 1;
      }
      const identity = identityFor(from);
      const relative = to.replace('D:/repo/', '').replaceAll('\\', '/');
      if (relative.endsWith('.webm')) productionWebm.add(relative);
      if (relative.endsWith('.mp4')) productionMp4.set(relative, identity.sha256);
      temporaryIdentity.delete(from.replaceAll('\\', '/'));
      if (!injectedRenameFailure && productionPromotionRenameCalls === options.failProductionRenameAt) {
        injectedRenameFailure = true;
        throw new Error(`Injected production rename failure ${productionPromotionRenameCalls}.`);
      }
    }),
    unlink: vi.fn(async (target: string) => {
      markMutation('unlink', target);
      if (target.includes('/.superpowers/sdd/phase-6c-hero-video-rollout/')) removedWorkspacePaths.push(target);
      productionWebm.delete(target.replace('D:/repo/', ''));
      temporaryIdentity.delete(target.replaceAll('\\', '/'));
    }),
    mkdir: vi.fn(async (target: string) => {
      markMutation('mkdir', target);
    }),
    readdir: vi.fn(async (target: string) => {
      markObservation('readdir', target);
      return [];
    }),
    writeFile: vi.fn(async (target: string) => {
      markMutation('writeFile', target);
    }),
    open: vi.fn(async (target: string) => {
      markObservation('open', target);
      return { sync: vi.fn(async () => undefined), close: vi.fn(async () => undefined) };
    }),
    spawn: vi.fn(),
  };
  return {
    context: {
      repositoryRoot: 'D:/repo',
      runId: 'phase-6c-rollout-20260901-01',
      implementationBaseline: '1111111111111111111111111111111111111111',
      paths,
      manifest,
      dependencies,
      filesystemReceipts,
    },
    calls,
    productionMutations,
    removedWorkspacePaths,
    workspaceMutations,
    filesystemReceipts,
    renameCounters: () => ({
      manifest: manifestRenameCalls,
      promotion: productionPromotionRenameCalls,
      rollback: productionRollbackRenameCalls,
    }),
    productionHashes: () => EXPECTED_MP4.map((path) => productionMp4.get(path)),
    corruptProduction: (relative: string) => productionMp4.set(relative, 'f'.repeat(64)),
    existingProductionWebm: () => [...productionWebm].sort(),
  };
}

describe('hero video rollout harness', () => {
  it('locks all sixteen immutable source paths, bytes, hashes, and dimensions', () => {
    expect(HERO_VIDEO_SOURCES.map(({ sourcePath }) => sourcePath)).toEqual(EXPECTED_MP4);
    expect(HERO_VIDEO_SOURCES.map(({ bytes }) => bytes)).toEqual(EXPECTED_BYTES);
    expect(HERO_VIDEO_SOURCES.map(({ sha256 }) => sha256)).toEqual(EXPECTED_HASHES);
    expect(HERO_VIDEO_SOURCES.map(({ width, height }) => `${width}x${height}`)).toEqual([
      '1168x768',
      '1168x768',
      '1168x768',
      '1168x768',
      '1168x768',
      '1168x768',
      '1168x784',
      '1168x784',
      '1168x784',
      '1168x784',
      '1168x768',
      '1168x768',
      '1168x784',
      '1168x784',
      '1168x784',
      '1168x784',
    ]);
    expect(EXPECTED_BYTES.reduce((sum, bytes) => sum + bytes, 0)).toBe(103076167);
  });

  it('exports exact sixteen MP4 and sixteen WebM promotion targets', () => {
    expect(MP4_PROMOTION_ALLOWLIST).toEqual(EXPECTED_MP4);
    expect(WEBM_PROMOTION_ALLOWLIST).toEqual(EXPECTED_MP4.map((file) => file.replace(/\.mp4$/, '.webm')));
    expect(new Set([...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST]).size).toBe(32);
    const absence = buildWebmAbsenceGates('D:/repo', '1'.repeat(40));
    expect(absence.gitChecks).toHaveLength(48);
    expect(absence.worktreeWebmTargets).toEqual(
      WEBM_PROMOTION_ALLOWLIST.map((relative) => path.resolve('D:/repo', relative)),
    );
    expect(absence.temporarySiblings).toHaveLength(64);
  });

  it('rejects missing, extra, duplicate, or reordered source identities', () => {
    expect(() => validateSourceInventory(HERO_VIDEO_SOURCES.slice(1))).toThrow('Source inventory identity mismatch.');
    expect(() => validateSourceInventory([...HERO_VIDEO_SOURCES, HERO_VIDEO_SOURCES[0]])).toThrow(
      'Source inventory identity mismatch.',
    );
    expect(() => validateSourceInventory([...HERO_VIDEO_SOURCES, HERO_VIDEO_SOURCES[0]].slice(1))).toThrow(
      'Source inventory identity mismatch.',
    );
    expect(() => validateSourceInventory([...HERO_VIDEO_SOURCES].reverse())).toThrow(
      'Source inventory identity mismatch.',
    );
  });

  it('builds deterministic VP9 CQ28 two-pass commands with isolated passlogs', () => {
    const invocations = buildCandidateInvocations(source, 'webm', 28, paths);
    expect(invocations).toHaveLength(2);
    expect(invocations.map(({ executable }) => executable)).toEqual(['ffmpeg', 'ffmpeg']);
    for (const invocation of invocations) {
      expect(invocation.args).toEqual(
        expect.arrayContaining([
          '-map',
          '0:v:0',
          '-an',
          '-map_metadata',
          '-1',
          '-vf',
          'fps=24,format=yuv420p',
          '-c:v',
          'libvpx-vp9',
          '-crf',
          '28',
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
          '-fps_mode',
          'cfr',
          '-t',
          '6.041667',
          '-f',
          'webm',
        ]),
      );
    }
    expect(invocations[0].args).toContain('1');
    expect(invocations[1].args).toContain('2');
    expect(invocations[0].passlogPath).toBe(invocations[1].passlogPath);
    expect(invocations[0].passlogPath).toContain('bedroom-bed-forward-webm');
    expect(buildCandidateInvocations(source, 'webm', 28, paths)).toEqual(invocations);
    expect(timeoutForInvocation({ kind: 'encode-pass-1' })).toBe(900000);
    expect(timeoutForInvocation({ kind: 'encode-pass-2' })).toBe(900000);
    expect(timeoutForInvocation({ kind: 'probe' })).toBe(120000);
    expect(timeoutForInvocation({ kind: 'vmaf' })).toBe(120000);
  });

  it('permits only a VP9 CQ24 retry after a failed CQ28 assessment', () => {
    for (const gate of [
      'codec',
      'dimensions',
      'pixelFormat',
      'rFrameRate',
      'avgFrameRate',
      'packets',
      'duration',
      'videoStreams',
      'audioStreams',
      'attachedPictures',
      'metadata',
      'vmaf',
    ]) {
      const failed = { accepted: false, failedGates: [gate], classification: 'RETRY' as const };
      expect(nextQuality('webm', 28, failed), gate).toBe(24);
      expect(classifyFailure('webm', 28, [gate]), gate).toBe('RETRY');
      expect(nextQuality('webm', 24, failed), gate).toBeNull();
      expect(classifyFailure('webm', 24, [gate]), gate).toBe('NO_CHANGE');
    }
    for (const gate of ['playback']) {
      const failed = { accepted: false, failedGates: [gate], classification: 'NO_CHANGE' as const };
      expect(nextQuality('webm', 28, failed), gate).toBeNull();
      expect(classifyFailure('webm', 28, [gate]), gate).toBe('NO_CHANGE');
    }
    for (const gate of [
      'immutableSource',
      'toolchain',
      'process',
      'containment',
      'receiptIdentity',
      'promotionBoundary',
    ]) {
      const failed = { accepted: false, failedGates: [gate], classification: 'BLOCKED' as const };
      expect(nextQuality('webm', 28, failed), gate).toBeNull();
      expect(classifyFailure('webm', 28, [gate]), gate).toBe('BLOCKED');
    }
    expect(() => buildCandidateInvocations(source, 'webm', 20, paths)).toThrow('Invalid WebM quality.');
    expect(classifyFailure('webm', 28, ['vmaf', 'size'])).toBe('NO_CHANGE');
    expect(classifyFailure('webm', 28, ['size'])).toBe('NO_CHANGE');
    expect(classifyFailure('webm', 28, ['vmaf', 'playback'])).toBe('NO_CHANGE');
  });

  it('builds deterministic H.264 CRF20 commands with faststart', () => {
    const [invocation] = buildCandidateInvocations(source, 'mp4', 20, paths);
    expect(invocation.args).toEqual(
      expect.arrayContaining([
        '-map',
        '0:v:0',
        '-an',
        '-map_metadata',
        '-1',
        '-vf',
        'fps=24,format=yuv420p',
        '-c:v',
        'libx264',
        '-crf',
        '20',
        '-preset',
        'slow',
        '-threads',
        '1',
        '-movflags',
        '+faststart',
        '-fps_mode',
        'cfr',
        '-t',
        '6.041667',
        '-f',
        'mp4',
      ]),
    );
    expect(buildCandidateInvocations(source, 'mp4', 20, paths)).toEqual([invocation]);
  });

  it('permits only an H.264 CRF18 retry after a failed CRF20 assessment', () => {
    for (const gate of [
      'codec',
      'dimensions',
      'pixelFormat',
      'rFrameRate',
      'avgFrameRate',
      'packets',
      'duration',
      'videoStreams',
      'audioStreams',
      'attachedPictures',
      'metadata',
      'vmaf',
      'size',
      'playback',
    ]) {
      const failed = { accepted: false, failedGates: [gate], classification: 'RETRY' as const };
      expect(nextQuality('mp4', 20, failed), gate).toBe(18);
      expect(classifyFailure('mp4', 20, [gate]), gate).toBe('RETRY');
      expect(nextQuality('mp4', 18, failed), gate).toBeNull();
      expect(classifyFailure('mp4', 18, [gate]), gate).toBe('NO_CHANGE');
    }
    for (const gate of [
      'immutableSource',
      'toolchain',
      'process',
      'containment',
      'receiptIdentity',
      'promotionBoundary',
    ]) {
      const failed = { accepted: false, failedGates: [gate], classification: 'BLOCKED' as const };
      expect(nextQuality('mp4', 20, failed), gate).toBeNull();
      expect(classifyFailure('mp4', 20, [gate]), gate).toBe('BLOCKED');
    }
    expect(() => buildCandidateInvocations(source, 'mp4', 24, paths)).toThrow('Invalid MP4 quality.');
  });

  it('maps primary stream, strips audio and metadata, and preserves CFR duration', () => {
    for (const format of ['webm', 'mp4'] as const) {
      const quality = format === 'webm' ? 28 : 20;
      for (const invocation of buildCandidateInvocations(source, format, quality, paths)) {
        expect(invocation.args).toEqual(
          expect.arrayContaining([
            '-map',
            '0:v:0',
            '-an',
            '-map_metadata',
            '-1',
            '-vf',
            'fps=24,format=yuv420p',
            '-fps_mode',
            'cfr',
            '-t',
            '6.041667',
          ]),
        );
      }
    }
    const vp9 = parseProbe(
      JSON.stringify({
        streams: [
          {
            index: 0,
            codec_type: 'video',
            codec_name: 'vp9',
            width: 1168,
            height: 768,
            pix_fmt: 'yuv420p',
            r_frame_rate: '24/1',
            avg_frame_rate: '24/1',
            nb_read_packets: '145',
            disposition: { attached_pic: 0 },
            tags: { ENCODER: 'Lavc libvpx-vp9' },
          },
        ],
        format: { duration: '6.041667', tags: {} },
      }),
      'webm',
    );
    const h264 = parseProbe(
      JSON.stringify({
        streams: [
          {
            index: 0,
            codec_type: 'video',
            codec_name: 'h264',
            width: 1168,
            height: 784,
            pix_fmt: 'yuv420p',
            r_frame_rate: '24/1',
            avg_frame_rate: '24/1',
            nb_read_packets: '145',
            disposition: { attached_pic: 0 },
            tags: { encoder: 'Lavc libx264' },
          },
        ],
        format: {
          duration: '6.041667',
          tags: { major_brand: 'isom', minor_version: '512', compatible_brands: 'isomiso2avc1mp41', encoder: 'Lavf' },
        },
      }),
      'mp4',
    );
    expect(vp9).toMatchObject({
      codecName: 'vp9',
      width: 1168,
      height: 768,
      rFrameRate: '24/1',
      avgFrameRate: '24/1',
      packets: 145,
      videoStreams: 1,
      audioStreams: 0,
      attachedPictures: 0,
    });
    expect(h264).toMatchObject({
      codecName: 'h264',
      width: 1168,
      height: 784,
      rFrameRate: '24/1',
      avgFrameRate: '24/1',
      packets: 145,
      videoStreams: 1,
      audioStreams: 0,
      attachedPictures: 0,
      streamTags: { encoder: 'Lavc libx264' },
      formatTags: { major_brand: 'isom', minor_version: '512', compatible_brands: 'isomiso2avc1mp41', encoder: 'Lavf' },
    });
    expect(() =>
      parseProbe(
        JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'vp9',
              width: 1168,
              height: 768,
              pix_fmt: 'yuv420p',
              r_frame_rate: '24/1',
              avg_frame_rate: '24/1',
              nb_read_packets: '145',
              disposition: { attached_pic: 0 },
              tags: { title: 'inherited' },
            },
          ],
          format: { duration: '6.041667', tags: {} },
        }),
        'webm',
      ),
    ).toThrow('Forbidden stream metadata tag: title');
    expect(() =>
      parseProbe(
        JSON.stringify({
          streams: [
            {
              ...JSON.parse(
                JSON.stringify({
                  codec_type: 'video',
                  codec_name: 'vp9',
                  width: 1168,
                  height: 768,
                  pix_fmt: 'yuv420p',
                  r_frame_rate: '24/1',
                  avg_frame_rate: '24/1',
                  nb_read_packets: '145',
                  disposition: { attached_pic: 0 },
                }),
              ),
            },
          ],
          format: { duration: '6.041667', tags: { comment: 'inherited' } },
        }),
        'webm',
      ),
    ).toThrow('Forbidden format metadata tag: comment');
  });

  it('places candidate at VMAF input 0 and immutable reference at input 1', () => {
    const metric = buildMetricInvocation(source, passingCandidate, paths);
    expect(metric.args.slice(0, 4)).toEqual(['-i', metric.candidatePath, '-i', metric.sourcePath]);
    expect(metric.args).toContain('[0:v][1:v]libvmaf');
    expect(metric.cwd).toBe(paths.metrics);
    expect(metric.reportPath).toBe(path.resolve(paths.metrics, `${source.id}-webm-28.json`));
    const filter = metric.args[metric.args.indexOf('-lavfi') + 1];
    expect(filter).toBe(`[0:v][1:v]libvmaf=log_fmt=json:log_path=${source.id}-webm-28.json`);
    expect(filter).not.toMatch(/[A-Z]:|\\\\/u);
    expect(metric.args.at(-1)).toBe('NUL');
  });

  it('rejects dimensions, pixel format, FPS, packet, duration, stream, audio, picture, or metadata drift', () => {
    const mutations = [
      { probe: { ...passingCandidate.probe, width: 1167 } },
      { probe: { ...passingCandidate.probe, pixelFormat: 'yuv444p' } },
      { probe: { ...passingCandidate.probe, rFrameRate: '25/1' } },
      { probe: { ...passingCandidate.probe, avgFrameRate: '25/1' } },
      { probe: { ...passingCandidate.probe, packets: 144 } },
      { probe: { ...passingCandidate.probe, durationSeconds: 6.042668 } },
      { probe: { ...passingCandidate.probe, videoStreams: 2 } },
      { probe: { ...passingCandidate.probe, audioStreams: 1 } },
      { probe: { ...passingCandidate.probe, attachedPictures: 1 } },
      { probe: { ...passingCandidate.probe, streamTags: { title: 'stale' } } },
    ];
    for (const mutation of mutations) {
      expect(assessCandidate(source, { ...passingCandidate, ...mutation }).accepted).toBe(false);
    }
  });

  it('requires VMAF at least 95 and candidate bytes below its own source', () => {
    expect(assessCandidate(source, passingCandidate).accepted).toBe(true);
    expect(assessCandidate(source, { ...passingCandidate, vmaf: 94.999999 }).failedGates).toContain('vmaf');
    expect(assessCandidate(source, { ...passingCandidate, bytes: source.bytes }).failedGates).toContain('size');
  });

  it('requires Chromium ended evidence without media error for every candidate', () => {
    expect(assessCandidate(source, passingCandidate).accepted).toBe(true);
    expect(
      assessCandidate(source, {
        ...passingCandidate,
        playback: { loadeddata: true, playing: true, ended: false, error: null },
      }).failedGates,
    ).toContain('playback');
    const candidates = makeAcceptedCandidates();
    const finalReceipts = candidates.map((candidate, index) => ({
      sequence: index + 1,
      kind: 'browser-playback',
      sourceId: candidate.sourceId,
      format: candidate.format,
      quality: candidate.quality,
      attempt: candidate.attempt,
      candidateSha256: candidate.sha256,
      status: 'SUCCEEDED' as const,
      executable: null,
      args: [candidate.candidatePath],
      exitCode: 0,
      artifactPath: candidate.candidatePath,
      artifactSha256: candidate.sha256,
    }));
    const stale = {
      ...finalReceipts[0],
      sequence: 1,
      attempt: finalReceipts[0].attempt + 1,
      status: 'SUCCEEDED' as const,
    };
    const manifest = {
      ...makeDependencies({ acceptedCandidates: candidates }).context.manifest,
      receipts: [stale, ...finalReceipts].map((receipt, index) => ({ ...receipt, sequence: index + 1 })),
    };
    expect(assertFinalReceiptCoverage(manifest)).toHaveLength(32);
    expect(() =>
      assertFinalReceiptCoverage({
        ...manifest,
        receipts: [...manifest.receipts, { ...finalReceipts[0], sequence: 34 }],
      }),
    ).toThrow('Final receipt mismatch');
    expect(
      assessCandidate(source, {
        ...passingCandidate,
        playback: { loadeddata: true, playing: false, ended: false, error: 'MEDIA_ERR_DECODE' },
      }).failedGates,
    ).toContain('playback');
  });

  it('uses exact integer aggregate reduction math against 103076167 bytes', () => {
    const fixtureWebmBytes = makeAcceptedCandidates()
      .filter(({ format }) => format === 'webm')
      .reduce((sum, candidate) => sum + candidate.bytes, 0);
    expect(fixtureWebmBytes).toBeLessThanOrEqual(61845700);
    expect(computeAggregateReduction(61845700)).toMatchObject({ passed: true, reductionBytes: 41230467 });
    expect(computeAggregateReduction(61845701).passed).toBe(false);
    expect(computeAggregateReduction(61845700).reductionPercent).toBeCloseTo((41230467 * 100) / 103076167, 12);
  });

  it('refuses promotion until all thirty-two final candidates pass', async () => {
    const fixture = makeDependencies({ acceptedCandidates: makeAcceptedCandidates().slice(0, 31) });
    const terminal = await promoteValidatedBatch(fixture.context);
    expect(terminal).toMatchObject({
      status: 'BLOCKED',
      productionState: 'UNCHANGED',
      failure: { reason: 'Validated candidate coverage must equal 32.' },
    });
    expect(fixture.productionMutations).toEqual([]);
    expect(fixture.context.manifest.promotionAttempt).toBeNull();
    expect(fixture.context.manifest.status).toBe('BLOCKED');
  });

  it('rehashes every original immediately before promotion', async () => {
    const fixture = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() });
    await promoteValidatedBatch(fixture.context);
    expect(fixture.calls.verifyImmutableSources).toBe(1);
    expect(fixture.calls.firstMutationSequence).toBeGreaterThan(fixture.calls.immutableVerificationSequence);
    expect(fixture.calls.firstProductionMutationSequence).toBeGreaterThan(fixture.calls.preMutationSnapshotSequence);
    expect(fixture.workspaceMutations).toContain(`${paths.manifest}.partial`);
    expect(fixture.workspaceMutations).toContain(paths.manifest);
    expect(fixture.context.dependencies.realpath).toHaveBeenCalledWith(paths.runRoot);
    expect(fixture.context.dependencies.realpath).toHaveBeenCalledWith(path.dirname(paths.manifest));
    expect(fixture.context.manifest.promotionAttempt?.entries).toHaveLength(32);
    expect(fixture.context.manifest.promotionAttempt?.entries.every(({ state }) => state === 'COMPLETED')).toBe(true);
    const firstProductionCopy = fixture.filesystemReceipts.findIndex(
      ({ operation, path }) => operation === 'copyFile' && path.startsWith('D:/repo/public/assets/hero/'),
    );
    expect(firstProductionCopy).toBeGreaterThan(0);
    expect(
      fixture.filesystemReceipts
        .slice(0, firstProductionCopy)
        .some(({ operation, path }) => operation === 'writeFile' && path === `${paths.manifest}.partial`),
    ).toBe(true);
    await expect(
      writeJsonAtomic(paths.runRoot, 'D:/repo/outside.json', {}, fixture.context.dependencies),
    ).rejects.toThrow('New path parent escapes owned root.');
  });

  it('rolls back exact production rename faults at counters 1, 17, and 32', async () => {
    for (const fault of [
      { failProductionRenameAt: 1, message: 'Injected production rename failure 1.' },
      { failProductionRenameAt: 17, message: 'Injected production rename failure 17.' },
      { failProductionRenameAt: 32, message: 'Injected production rename failure 32.' },
    ]) {
      const fixture = makeDependencies({ acceptedCandidates: makeAcceptedCandidates(), ...fault });
      const terminal = await promoteValidatedBatch(fixture.context);
      expect(terminal.failure?.reason).toContain(fault.message);
      expect(
        fixture.productionMutations.every((target) =>
          [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST].some(
            (allowed) =>
              target.endsWith(allowed) ||
              target.endsWith(`${allowed}.phase-6c-rollout.tmp`) ||
              target.endsWith(`${allowed}.phase-6c-rollback.tmp`),
          ),
        ),
      ).toBe(true);
      expect(fixture.productionHashes()).toEqual(EXPECTED_HASHES);
      expect(fixture.existingProductionWebm()).toEqual([]);
      expect(fixture.context.manifest).toMatchObject({ status: 'NO_CHANGE', productionState: 'ROLLED_BACK' });
      expect(fixture.renameCounters().manifest).toBeGreaterThan(0);
      expect(fixture.renameCounters().promotion).toBe(fault.failProductionRenameAt);
      expect(fixture.renameCounters().rollback).toBe(16);
    }
  });

  it('rolls back a separate final manifest completion-receipt failure', async () => {
    const fixture = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      failFinalCompletionReceipt: true,
    });
    const terminal = await promoteValidatedBatch(fixture.context);
    expect(terminal).toMatchObject({
      status: 'NO_CHANGE',
      productionState: 'ROLLED_BACK',
      failure: { reason: 'Injected final completion receipt failure.' },
    });
    expect(fixture.renameCounters()).toEqual({ manifest: expect.any(Number), promotion: 32, rollback: 16 });
    expect(fixture.productionHashes()).toEqual(EXPECTED_HASHES);
    expect(fixture.existingProductionWebm()).toEqual([]);
  });

  it('promotes and later rolls back only literal allowlisted paths', async () => {
    const postPromotion = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() });
    await promoteValidatedBatch(postPromotion.context);
    const cliResult = manifestResult('run', postPromotion.context.manifest);
    expect(cliResult).toMatchObject({ command: 'run', status: 'PROMOTED', exitCode: 0 });
    expect(cliResult.production).toHaveLength(32);
    expect(JSON.parse(JSON.stringify(cliResult))).toEqual(cliResult);
    postPromotion.corruptProduction(EXPECTED_MP4[0]);
    const recovered = await verifyProduction(postPromotion.context);
    expect(recovered.status).toBe('NO_CHANGE');
    expect(postPromotion.productionHashes()).toEqual(EXPECTED_HASHES);
    expect(postPromotion.existingProductionWebm()).toEqual([]);
    const identityMismatch = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      promotedIdentityFailure: 'index mismatch',
    });
    await promoteValidatedBatch(identityMismatch.context);
    const identityResult = await verifyProduction(identityMismatch.context);
    expect(manifestResult('verify-production', identityResult)).toMatchObject({
      status: 'NO_CHANGE',
      exitCode: 2,
      productionState: 'ROLLED_BACK',
      production: [],
    });
    const unknown = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      promotedIdentityFailure: 'index mismatch',
      failRollbackCopy: true,
    });
    await promoteValidatedBatch(unknown.context);
    const unknownResult = await verifyProduction(unknown.context);
    expect(manifestResult('verify-production', unknownResult)).toMatchObject({
      status: 'BLOCKED',
      exitCode: 1,
      productionState: 'UNKNOWN',
    });
    expect(manifestResult('verify-production', unknownResult).production).toHaveLength(32);
    const reportMismatch = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      promotedIdentityFailure: 'report index mismatch',
    });
    await promoteValidatedBatch(reportMismatch.context);
    const reportNoChange = await reportPromotedRollout(reportMismatch.context);
    expect(manifestResult('report', reportNoChange)).toMatchObject({
      command: 'report',
      status: 'NO_CHANGE',
      exitCode: 2,
      productionState: 'ROLLED_BACK',
      production: [],
    });
    const reportUnknown = makeDependencies({
      acceptedCandidates: makeAcceptedCandidates(),
      promotedIdentityFailure: 'report index mismatch',
      failRollbackCopy: true,
    });
    await promoteValidatedBatch(reportUnknown.context);
    const reportBlocked = await reportPromotedRollout(reportUnknown.context);
    expect(manifestResult('report', reportBlocked)).toMatchObject({
      command: 'report',
      status: 'BLOCKED',
      exitCode: 1,
      productionState: 'UNKNOWN',
    });
    expect(manifestResult('report', reportBlocked).production).toHaveLength(32);
    const rollbackUnlinks = postPromotion.filesystemReceipts
      .filter(
        ({ operation, path }) =>
          operation === 'unlink' && path.startsWith('D:/repo/public/assets/hero/') && path.endsWith('.webm'),
      )
      .map(({ path }) => path.replace('D:/repo/', ''))
      .sort();
    expect(rollbackUnlinks).toEqual([...WEBM_PROMOTION_ALLOWLIST].sort());
    const observedOperations = new Set(postPromotion.filesystemReceipts.map(({ operation }) => operation));
    expect(
      ['exists', 'realpath', 'lstat', 'stat', 'copyFile', 'rename', 'unlink', 'writeFile', 'open'].every((operation) =>
        observedOperations.has(operation),
      ),
    ).toBe(true);
    const crashed = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() });
    crashed.context.manifest.promotionAttempt = {
      id: 'phase-6c-rollout-20260901-01-promotion-1',
      mutationStarted: true,
      entries: [
        {
          targetRelative: EXPECTED_MP4[0],
          temporaryRelative: `${EXPECTED_MP4[0]}.phase-6c-rollout.tmp`,
          format: 'mp4',
          candidateSha256: 'a'.repeat(64),
          originalSha256: EXPECTED_HASHES[0],
          state: 'COMPLETED',
        },
      ],
    };
    crashed.corruptProduction(EXPECTED_MP4[0]);
    const crashResult = await recoverInterruptedPromotion(crashed.context);
    expect(crashResult.status).toBe('NO_CHANGE');
    expect(crashed.productionHashes()).toEqual(EXPECTED_HASHES);
  });

  it('returns NO_CHANGE after one failed higher-quality retry without production mutation', async () => {
    const fixture = makeDependencies({
      candidateAssessments: [
        { accepted: false, failedGates: ['vmaf'] },
        { accepted: false, failedGates: ['vmaf'] },
      ],
    });
    const manifest = await runCandidateBatch(fixture.context);
    expect(manifest).toMatchObject({
      status: 'NO_CHANGE',
      failure: { sourceId: source.id, format: 'webm', quality: 24, failedGates: ['vmaf'] },
    });
    expect(fixture.context.dependencies.encodeProbeMetricAndPlay).toHaveBeenNthCalledWith(
      1,
      source,
      'webm',
      28,
      1,
      fixture.context,
    );
    expect(fixture.context.dependencies.encodeProbeMetricAndPlay).toHaveBeenNthCalledWith(
      2,
      source,
      'webm',
      24,
      2,
      fixture.context,
    );
    expect(fixture.productionMutations).toEqual([]);
    expect(fixture.removedWorkspacePaths).toEqual([
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/candidates/bedroom-bed-forward.webm',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/passlogs/bedroom-bed-forward-webm-28-0.log',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/passlogs/bedroom-bed-forward-webm-28-0.log.mbtree',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/candidates/bedroom-bed-forward.webm',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/passlogs/bedroom-bed-forward-webm-24-0.log',
      'D:/repo/.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/passlogs/bedroom-bed-forward-webm-24-0.log.mbtree',
    ]);
  });

  it('returns BLOCKED for tool, baseline, protected-file, or promotion-boundary drift', async () => {
    for (const failure of ['missing-ffmpeg', 'baseline-drift', 'protected-drift', 'unsafe-target'] as const) {
      const fixture = makeDependencies({ preflightFailure: failure });
      const manifest = await runCandidateBatch(fixture.context);
      expect(manifest.status).toBe('BLOCKED');
      expect(manifest.failure?.reason).toContain(failure);
      expect(fixture.productionMutations).toEqual([]);
    }
    expect(commandPreflightPolicy('characterize')).toEqual({ requireGenerationBoundary: true });
    expect(commandPreflightPolicy('run')).toEqual({ requireGenerationBoundary: true });
    expect(commandPreflightPolicy('verify-production')).toEqual({ requireGenerationBoundary: false });
    expect(commandPreflightPolicy('report')).toEqual({ requireGenerationBoundary: false });
    expect(commandPreflightPolicy('recover')).toEqual({ requireGenerationBoundary: false });
    const terminal = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() }).context.manifest;
    terminal.status = 'NO_CHANGE';
    expect(manifestResult('run', terminal)).toMatchObject({
      command: 'run',
      status: 'NO_CHANGE',
      exitCode: 2,
      productionState: 'UNCHANGED',
      production: [],
    });

    const production = [...EXPECTED_MP4, ...EXPECTED_WEBM].map((productionPath, index) => ({
      path: productionPath,
      format: productionPath.endsWith('.webm') ? ('webm' as const) : ('mp4' as const),
      bytes: index + 1,
      sha256: index.toString(16).padStart(64, '0'),
    }));
    const aggregate = computeAggregateReduction(61_000_000);
    const refreshedVmaf = production.map(({ path: productionPath, format }) => ({
      sourceId: productionPath.replace('public/assets/hero/', '').replace(/\.(mp4|webm)$/u, ''),
      format,
      value: 96,
    }));
    const cases = [
      {
        command: 'characterize',
        result: {
          command: 'characterize',
          status: 'CHARACTERIZED',
          exitCode: 0,
          sources: 16,
          sourceBytes: 103_076_167,
          mp4Targets: 16,
          webmTargets: 16,
          productionState: 'UNCHANGED',
          production: [],
        },
      },
      {
        command: 'run',
        result: {
          command: 'run',
          status: 'PROMOTED',
          exitCode: 0,
          reason: null,
          productionState: 'VERIFIED',
          aggregate,
          production,
        },
      },
      {
        command: 'recover',
        result: {
          command: 'recover',
          status: 'NO_CHANGE',
          exitCode: 2,
          reason: 'recovered',
          productionState: 'ROLLED_BACK',
          aggregate,
          production: [],
        },
      },
      {
        command: 'verify-production',
        result: {
          command: 'verify-production',
          status: 'BLOCKED',
          exitCode: 1,
          productionState: 'UNKNOWN',
          aggregate,
          production,
          reason: 'unproven rollback',
        },
      },
      {
        command: 'report',
        result: {
          command: 'report',
          status: 'PROMOTED',
          exitCode: 0,
          productionState: 'VERIFIED',
          verdict: 'ROLLOUT_READY_LOCAL',
          aggregate,
          production,
          refreshedVmaf,
          playbackReceipts: 32,
          backups: 16,
        },
      },
    ] as const;
    const exactCliKeys = {
      characterize: [
        'command',
        'exitCode',
        'mp4Targets',
        'production',
        'productionState',
        'sourceBytes',
        'sources',
        'status',
        'webmTargets',
      ],
      run: ['aggregate', 'command', 'exitCode', 'production', 'productionState', 'reason', 'status'],
      recover: ['aggregate', 'command', 'exitCode', 'production', 'productionState', 'reason', 'status'],
      'verify-production': ['aggregate', 'command', 'exitCode', 'production', 'productionState', 'reason', 'status'],
      report: [
        'aggregate',
        'backups',
        'command',
        'exitCode',
        'playbackReceipts',
        'production',
        'productionState',
        'refreshedVmaf',
        'status',
        'verdict',
      ],
    } as const;
    const assertAggregateSchema = (value: unknown) => {
      expect(value).not.toBeNull();
      expect(typeof value).toBe('object');
      const item = value as Record<string, unknown>;
      expect(Object.keys(item).sort()).toEqual(
        ['originalBytes', 'passed', 'reductionBytes', 'reductionPercent', 'webmBytes'].sort(),
      );
      expect(typeof item.originalBytes).toBe('number');
      expect(typeof item.webmBytes).toBe('number');
      expect(typeof item.reductionBytes).toBe('number');
      expect(typeof item.reductionPercent).toBe('number');
      expect(typeof item.passed).toBe('boolean');
    };
    for (const item of cases) {
      const output: string[] = [];
      const previousExitCode = process.exitCode;
      const consoleLog = vi.spyOn(console, 'log').mockImplementation((line) => output.push(String(line)));
      try {
        const fixture = makeDependencies({ acceptedCandidates: makeAcceptedCandidates() });
        const cliManifest = structuredClone(fixture.context.manifest);
        cliManifest.implementationBaseline = '1'.repeat(40);
        cliManifest.aggregate = aggregate;
        cliManifest.production = production;
        cliManifest.status = item.command === 'characterize' ? 'CHARACTERIZED' : 'PROMOTED';
        cliManifest.failure = null;
        cliManifest.promotionAttempt = null;
        if (item.command === 'recover') {
          cliManifest.status = 'GENERATING';
          cliManifest.promotionAttempt = { id: 'attempt-cli-recover', mutationStarted: true, entries: [] };
        }
        const characterized = structuredClone(cliManifest);
        characterized.status = 'CHARACTERIZED';
        const promoted = structuredClone(cliManifest);
        promoted.status = 'PROMOTED';
        promoted.productionState = 'VERIFIED';
        promoted.failure = null;
        const recovered = structuredClone(cliManifest);
        recovered.status = 'NO_CHANGE';
        recovered.productionState = 'ROLLED_BACK';
        recovered.production = [];
        recovered.failure = {
          sourceId: null,
          format: null,
          quality: null,
          failedGates: ['promotionBoundary'],
          reason: 'recovered',
        };
        const blocked = structuredClone(promoted);
        blocked.status = 'BLOCKED';
        blocked.productionState = 'UNKNOWN';
        blocked.failure = {
          sourceId: null,
          format: null,
          quality: null,
          failedGates: ['promotionBoundary'],
          reason: 'unproven rollback',
        };
        const operations = {
          loadManifest: vi.fn(async () => cliManifest),
          characterizeRollout: vi.fn(async () => characterized),
          runCandidateBatch: vi.fn(async () => promoted),
          recoverInterruptedPromotion: vi.fn(async () => recovered),
          verifyProduction: vi.fn(async () => blocked),
          reportPromotedRollout: vi.fn(async () => ({
            status: 'ROLLOUT_READY_LOCAL',
            backups: 16,
            production,
            refreshedVmaf,
            playbackReceipts: 32,
            aggregate,
          })),
          assertGenerationBoundary: vi.fn(async () => undefined),
        };
        const exitCode = await main(
          [item.command, '--run-id', 'phase-6c-rollout-20260901-01', '--implementation-baseline', '1'.repeat(40)],
          { ...fixture.context.dependencies, ...operations },
        );
        expect(exitCode).toBe(item.result.exitCode);
        expect(process.exitCode).toBe(item.result.exitCode);
        expect(output).toHaveLength(1);
        const decoded = JSON.parse(output[0]);
        expect(Object.keys(decoded).sort()).toEqual([...exactCliKeys[item.command]].sort());
        expect(decoded.command).toBe(item.command);
        expect(decoded.status).toBe(item.result.status);
        expect(decoded.exitCode).toBe(item.result.exitCode);
        expect(decoded.productionState).toBe(item.result.productionState);
        expect(typeof decoded.command).toBe('string');
        expect(typeof decoded.status).toBe('string');
        expect(typeof decoded.exitCode).toBe('number');
        expect(typeof decoded.productionState).toBe('string');
        if ('reason' in decoded) {
          if (item.command === 'run') expect(decoded.reason).toBeNull();
          else expect(typeof decoded.reason).toBe('string');
        }
        if ('aggregate' in decoded) assertAggregateSchema(decoded.aggregate);
        expect(Array.isArray(decoded.production)).toBe(true);
        if (item.command === 'characterize') {
          expect(decoded).toMatchObject({ sources: 16, sourceBytes: 103_076_167, mp4Targets: 16, webmTargets: 16 });
          expect(decoded.production).toEqual([]);
        }
        if (item.command === 'characterize') expect(operations.characterizeRollout).toHaveBeenCalledOnce();
        if (item.command === 'run') expect(operations.runCandidateBatch).toHaveBeenCalledOnce();
        if (item.command === 'recover') expect(operations.recoverInterruptedPromotion).toHaveBeenCalledOnce();
        if (item.command === 'verify-production') expect(operations.verifyProduction).toHaveBeenCalledOnce();
        if (item.command === 'report') expect(operations.reportPromotedRollout).toHaveBeenCalledOnce();
        if (decoded.production.length === 32) {
          expect(decoded.production.map(({ path: productionPath }: { path: string }) => productionPath).sort()).toEqual(
            [...EXPECTED_MP4, ...EXPECTED_WEBM].sort(),
          );
          expect(
            decoded.production.every(
              ({
                path: productionPath,
                format,
                bytes,
                sha256,
              }: {
                path: string;
                format: string;
                bytes: number;
                sha256: string;
              }) =>
                Object.keys(decoded.production.find(({ path }: { path: string }) => path === productionPath))
                  .sort()
                  .join() === ['bytes', 'format', 'path', 'sha256'].sort().join() &&
                typeof productionPath === 'string' &&
                ['mp4', 'webm'].includes(format) &&
                Number.isInteger(bytes) &&
                bytes > 0 &&
                typeof sha256 === 'string' &&
                productionPath.endsWith(`.${format}`) &&
                /^[0-9a-f]{64}$/u.test(sha256),
            ),
          ).toBe(true);
        }
        if (item.command === 'report') {
          expect(decoded.backups).toBe(16);
          expect(decoded.playbackReceipts).toBe(32);
          expect(decoded.verdict).toBe('ROLLOUT_READY_LOCAL');
          expect(Array.isArray(decoded.refreshedVmaf)).toBe(true);
          expect(decoded.refreshedVmaf).toHaveLength(32);
          for (const receipt of decoded.refreshedVmaf) {
            expect(Object.keys(receipt).sort()).toEqual(['format', 'sourceId', 'value']);
            expect(typeof receipt.sourceId).toBe('string');
            expect(['mp4', 'webm']).toContain(receipt.format);
            expect(typeof receipt.value).toBe('number');
          }
        }
      } finally {
        consoleLog.mockRestore();
        process.exitCode = previousExitCode;
      }
    }
    expect(cases[2].result).toMatchObject({ status: 'NO_CHANGE', productionState: 'ROLLED_BACK', production: [] });
    expect(cases[3].result.production).toHaveLength(32);
    expect(cases[4].result.refreshedVmaf).toHaveLength(32);
    expect(cases[4].result.aggregate).toMatchObject({
      originalBytes: 103_076_167,
      webmBytes: 61_000_000,
      passed: true,
    });
  });
});
```

The fake methods never call Node filesystem/process/browser APIs. The promotion test simulates a mid-rename failure and proves all sixteen original MP4 hashes are restored and all sixteen new WebM targets are absent.

- [ ] **Step 3: Run RED and preserve the exact failure**

Run:

```powershell
$phase6cBaseline = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Harness RED baseline capture failed.' }
if ($phase6cBaseline -notmatch '^[0-9a-f]{40}$') { throw 'Implementation baseline is not a full SHA.' }
npx vitest run tests/hero-video-rollout.test.ts
$npxExit=$LASTEXITCODE; if ($npxExit -eq 0) { throw 'Harness RED unexpectedly passed.' }
```

Expected: FAIL because `scripts/hero-video-rollout.mjs` or its exports do not exist. No FFmpeg, browser, candidate, or production-media process may run in this task.

- [ ] **Step 4: Implement the literal source manifest and immutable checks**

Create `scripts/hero-video-rollout.mjs`. Use this shape and include all sixteen evidence rows exactly; do not derive expected hashes from current files:

```js
export const HERO_VIDEO_SOURCES = Object.freeze(
  [
    [
      'bedroom-bed-forward',
      'public/assets/hero/bedroom-bed-forward.mp4',
      3979743,
      '34c684217333b446253485a15659999d6e465d7ac52902f8a7f657cf35370ed1',
      1168,
      768,
    ],
    [
      'bedroom-bed-reverse',
      'public/assets/hero/bedroom-bed-reverse.mp4',
      3211117,
      '84b9481ca9ec1e6a049ba5955c902431c1876b37ed051b0a202bbc46e20ee8fa',
      1168,
      768,
    ],
    [
      'bedroom-chair-forward',
      'public/assets/hero/bedroom-chair-forward.mp4',
      6476041,
      '8f192f5a2e735116340391cda3db0f17caeb91102ec69c97b6d624d86b0dc0e7',
      1168,
      768,
    ],
    [
      'bedroom-chair-reverse',
      'public/assets/hero/bedroom-chair-reverse.mp4',
      5437362,
      'a48d8f03959196904a5eedd7241435c57b00740ad56cc1d416a98729b9a91cc4',
      1168,
      768,
    ],
    [
      'chair-forward',
      'public/assets/hero/chair-forward.mp4',
      9022617,
      '830bfcdf25fc3af7b137e4fdcace3775dafcf7f1b02a05aba340b0fc6ae0e3de',
      1168,
      768,
    ],
    [
      'chair-reverse',
      'public/assets/hero/chair-reverse.mp4',
      7696268,
      'a458d20808a0c843a1deb0afaf812613bb34303dfcc0f7fc4a99990a03ac1ed8',
      1168,
      768,
    ],
    [
      'kitchen-dining-forward',
      'public/assets/hero/kitchen-dining-forward.mp4',
      6138461,
      '1a2b06356edab8950d2c3ab6cc47fb8e96e13453e3dc3dceff38fda0ef88d5ac',
      1168,
      784,
    ],
    [
      'kitchen-dining-reverse',
      'public/assets/hero/kitchen-dining-reverse.mp4',
      5330779,
      '89e1aef8be033d717cd652a15a41669e6d5aeae63374aed6fee2075331fa6dc9',
      1168,
      784,
    ],
    [
      'kitchen-island-forward',
      'public/assets/hero/kitchen-island-forward.mp4',
      4664253,
      '8b0347469a1d3dafdbbd35c1da90ab6dbb2046163de5286a09cab9517c3de8c2',
      1168,
      784,
    ],
    [
      'kitchen-island-reverse',
      'public/assets/hero/kitchen-island-reverse.mp4',
      4013620,
      '7ebab953d4fa7abaca66a452ea2bcac00528d94be0cfe314c9ac9f75c9ee9c1f',
      1168,
      784,
    ],
    [
      'sofa-forward',
      'public/assets/hero/sofa-forward.mp4',
      6918992,
      '97928b8a8659750df9cd89fc2109f57a943413564b6d320214c8bc7c43de6655',
      1168,
      768,
    ],
    [
      'sofa-reverse',
      'public/assets/hero/sofa-reverse.mp4',
      5679663,
      'dd38f87e057a9a13176ff7a35bc624419c4102fd61aae6b4b19044fa4d4177f5',
      1168,
      768,
    ],
    [
      'terrace-chair-forward',
      'public/assets/hero/terrace-chair-forward.mp4',
      8556765,
      'e375a3c87f142df574abe4371967a4fcba99356067ff6c716292e746d615381f',
      1168,
      784,
    ],
    [
      'terrace-chair-reverse',
      'public/assets/hero/terrace-chair-reverse.mp4',
      7382094,
      '726404a4e234fad318b65609a9dfcb838e878cc7eb21f30743e49d2dca686c6d',
      1168,
      784,
    ],
    [
      'terrace-sofa-forward',
      'public/assets/hero/terrace-sofa-forward.mp4',
      9941316,
      '68c5db691631c94f141a230fe5f37f9f74e7115302b57398b4dfb036065d4892',
      1168,
      784,
    ],
    [
      'terrace-sofa-reverse',
      'public/assets/hero/terrace-sofa-reverse.mp4',
      8627076,
      '1683f5051bcf4f91e946af436fcbd894ed3cd76d08d2446d8306e44a9494973c',
      1168,
      784,
    ],
  ].map(([id, sourcePath, bytes, sha256, width, height]) =>
    Object.freeze({ id, sourcePath, bytes, sha256, width, height }),
  ),
);
```

`verifyImmutableSources` must reject symlinks/non-files, require exact byte count/hash, require the sum `103076167`, and run once before generation plus once immediately before promotion. `resolveRolloutPaths` must reject unsafe run IDs and resolve every owned path beneath the literal run root `.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/` for this delivery.

- [ ] **Step 5: Implement deterministic commands, gates, retries, playback, and atomic promotion**

Implement these exact function-level contracts in `scripts/hero-video-rollout.mjs`. No shell string is accepted; every process uses `spawn(executable, args, { shell: false })`. The manifest and receipt types are binding:

```js
import { createHash } from 'node:crypto';
import { spawn as spawnChild } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import * as fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

/** @typedef {'CHARACTERIZED'|'GENERATING'|'VALIDATED'|'PROMOTED'|'NO_CHANGE'|'BLOCKED'} RolloutStatus */
/** @typedef {'UNCHANGED'|'VERIFIED'|'ROLLED_BACK'|'UNKNOWN'} ProductionState */
/** @typedef {'webm'|'mp4'} VideoFormat */
/** @typedef {28|24|20|18} Quality */
/** @typedef {{id:string,sourcePath:string,bytes:number,sha256:string,width:number,height:number}} HeroVideoSource */
/** @typedef {{loadeddata:boolean,playing:boolean,ended:boolean,error:null|string,events:string[],url:string,browserVersion:string}} PlaybackEvidence */
/** @typedef {{codecName:string,width:number,height:number,pixelFormat:string,rFrameRate:string,avgFrameRate:string,packets:number,durationSeconds:number,videoStreams:number,audioStreams:number,attachedPictures:number,streamTags:Record<string,string>,formatTags:Record<string,string>}} ProbeEvidence */
/** @typedef {{sourceId:string,format:VideoFormat,quality:Quality,attempt:number,candidatePath:string,bytes:number,sha256:string,probe:ProbeEvidence,vmaf:number,playback:PlaybackEvidence}} CandidateEvidence */
/** @typedef {{path:string,bytes:number,sha256:string,format:VideoFormat}} ProductionEvidence */
/** @typedef {{accepted:boolean,failedGates:string[],classification:'PASS'|'RETRY'|'NO_CHANGE'|'BLOCKED'}} CandidateAssessment */
/** @typedef {{sequence:number,kind:string,sourceId:string|null,format:VideoFormat|null,quality:Quality|null,attempt:number|null,candidateSha256:string|null,status:'SUCCEEDED'|'FAILED',executable:string|null,args:string[],exitCode:number|null,artifactPath:string|null,artifactSha256:string|null}} RolloutReceipt */
/** @typedef {{sequence:number,operation:'exists'|'lstat'|'stat'|'realpath'|'readFile'|'readdir'|'mkdir'|'writeFile'|'open'|'copyFile'|'rename'|'unlink',mode:'OBSERVE'|'MUTATE',path:string,secondaryPath:string|null}} FilesystemReceipt */
/** @typedef {{targetRelative:string,temporaryRelative:string,format:VideoFormat,candidateSha256:string,originalSha256:string|null,state:'INTENT'|'COMPLETED'}} PromotionTargetIntent */
/** @typedef {{schemaVersion:1,runId:string,implementationBaseline:string,pilotHarnessCommit:'7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe',status:RolloutStatus,productionState:'UNCHANGED'|'VERIFIED'|'ROLLED_BACK'|'UNKNOWN',immutableSources:HeroVideoSource[],backupSources:Array<{sourcePath:string,backupPath:string,bytes:number,sha256:string}>,candidates:CandidateEvidence[],aggregate:null|{originalBytes:103076167,webmBytes:number,reductionBytes:number,reductionPercent:number,passed:boolean},production:Array<{path:string,bytes:number,sha256:string,format:VideoFormat}>,promotionAttempt:null|{id:string,mutationStarted:boolean,entries:PromotionTargetIntent[]},failure:null|{sourceId:string|null,format:VideoFormat|null,quality:Quality|null,failedGates:string[],reason:string},receipts:RolloutReceipt[],filesystemReceipts:FilesystemReceipt[]}} RolloutManifest */
/** @typedef {{spawn:(executable:string,args:string[],options:{cwd:string,shell:false,windowsHide:true})=>import('node:child_process').ChildProcessWithoutNullStreams,exists:(path:string)=>Promise<boolean>,lstat:(path:string)=>Promise<import('node:fs').Stats>,realpath:(path:string)=>Promise<string>,readFile:(path:string)=>Promise<Buffer>,writeFile:(path:string,data:Buffer,options:{flag:'wx'})=>Promise<void>,copyFile:(from:string,to:string,flags:number)=>Promise<void>,rename:(from:string,to:string)=>Promise<void>,unlink:(path:string)=>Promise<void>,mkdir:(path:string,options:{recursive:boolean})=>Promise<void>,open:(path:string,flags:string)=>Promise<{sync:()=>Promise<void>,close:()=>Promise<void>}>,readdir:(path:string)=>Promise<string[]>,stat:(path:string)=>Promise<import('node:fs').Stats>,playCandidate:(candidatePath:string,format:VideoFormat,timeoutMs:number)=>Promise<PlaybackEvidence>,hashFile?:(path:string)=>Promise<string>,verifyImmutableSources?:(repositoryRoot:string)=>Promise<void>,verifyPromotedTrackedIdentity?:(context:RolloutContext)=>Promise<void>,assertPreMutationSnapshot?:(context:RolloutContext)=>Promise<void>,assertGenerationBoundary?:(repositoryRoot:string,implementationBaseline:string)=>Promise<void>,loadManifest?:(paths:RolloutPaths)=>Promise<RolloutManifest>,characterizeRollout?:(repositoryRoot:string,paths:RolloutPaths,parsed:Record<string,string>,dependencies:RolloutDependencies)=>Promise<RolloutManifest>,runCandidateBatch?:(context:RolloutContext)=>Promise<RolloutManifest>,promoteValidatedBatch?:(context:RolloutContext)=>Promise<RolloutManifest>,recoverInterruptedPromotion?:(context:RolloutContext)=>Promise<RolloutManifest>,verifyProduction?:(context:RolloutContext)=>Promise<RolloutManifest>,reportPromotedRollout?:(context:RolloutContext)=>Promise<Record<string,unknown>>,encodeProbeMetricAndPlay?:(source:HeroVideoSource,format:VideoFormat,quality:Quality,attempt:number,context:RolloutContext)=>Promise<CandidateEvidence>,assessCandidate?:(source:HeroVideoSource,candidate:CandidateEvidence)=>Promise<CandidateAssessment>}} RolloutDependencies */
/** @typedef {{repositoryRoot:string,runId:'phase-6c-rollout-20260901-01',implementationBaseline:string,paths:RolloutPaths,manifest:RolloutManifest,dependencies:RolloutDependencies,filesystemReceipts:FilesystemReceipt[]}} RolloutContext */

export const ROLLOUT_STATUS = Object.freeze({
  CHARACTERIZED: 'CHARACTERIZED',
  GENERATING: 'GENERATING',
  VALIDATED: 'VALIDATED',
  PROMOTED: 'PROMOTED',
  NO_CHANGE: 'NO_CHANGE',
  BLOCKED: 'BLOCKED',
});
export const FORBIDDEN_INHERITED_TAGS = Object.freeze([
  'title',
  'comment',
  'description',
  'synopsis',
  'creation_time',
  'date',
  'location',
  'artist',
  'album',
  'album_artist',
  'copyright',
  'encoder_settings',
]);
export const PERMITTED_STREAM_TAGS = Object.freeze({
  webm: ['DURATION', 'ENCODER'],
  mp4: ['encoder', 'handler_name', 'language', 'vendor_id'],
});
export const PERMITTED_FORMAT_TAGS = Object.freeze({
  webm: ['encoder'],
  mp4: ['compatible_brands', 'encoder', 'major_brand', 'minor_version'],
});

const STATUS_TRANSITIONS = Object.freeze({
  CHARACTERIZED: ['GENERATING', 'BLOCKED'],
  GENERATING: ['VALIDATED', 'NO_CHANGE', 'BLOCKED'],
  VALIDATED: ['PROMOTED', 'NO_CHANGE', 'BLOCKED'],
  PROMOTED: ['NO_CHANGE', 'BLOCKED'],
  NO_CHANGE: [],
  BLOCKED: [],
});

export function resolveRolloutPaths(repositoryRoot, runId) {
  if (runId !== 'phase-6c-rollout-20260901-01') throw new Error('Run ID is not authorized.');
  const evidenceRoot = path.resolve(repositoryRoot, '.superpowers/sdd/phase-6c-hero-video-rollout');
  const runRoot = path.resolve(evidenceRoot, 'runs', runId);
  if (!isAtOrInside(evidenceRoot, runRoot) || evidenceRoot === runRoot)
    throw new Error('Run root escapes evidence root.');
  return Object.freeze({
    repositoryRoot: path.resolve(repositoryRoot),
    evidenceRoot,
    runRoot,
    candidates: path.resolve(runRoot, 'candidates'),
    passlogs: path.resolve(runRoot, 'passlogs'),
    probes: path.resolve(runRoot, 'probes'),
    metrics: path.resolve(runRoot, 'metrics'),
    browser: path.resolve(runRoot, 'browser'),
    backups: path.resolve(runRoot, 'backups'),
    manifest: path.resolve(runRoot, 'manifest.json'),
  });
}

function transitionStatus(manifest, next) {
  if (!STATUS_TRANSITIONS[manifest.status]?.includes(next))
    throw new Error(`Invalid manifest transition: ${manifest.status} to ${next}`);
  manifest.status = next;
}

function validateManifest(manifest) {
  const exactKeys = [
    'schemaVersion',
    'runId',
    'implementationBaseline',
    'pilotHarnessCommit',
    'status',
    'productionState',
    'immutableSources',
    'backupSources',
    'candidates',
    'aggregate',
    'production',
    'promotionAttempt',
    'failure',
    'receipts',
    'filesystemReceipts',
  ];
  if (Object.keys(manifest).sort().join('\n') !== exactKeys.sort().join('\n'))
    throw new Error('Manifest key set mismatch.');
  if (manifest.schemaVersion !== 1 || manifest.runId !== 'phase-6c-rollout-20260901-01')
    throw new Error('Manifest identity mismatch.');
  if (!/^[0-9a-f]{40}$/u.test(manifest.implementationBaseline)) throw new Error('Manifest baseline is invalid.');
  if (manifest.pilotHarnessCommit !== '7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe')
    throw new Error('Pilot harness identity mismatch.');
  validateSourceInventory(manifest.immutableSources);
  if (!Object.values(ROLLOUT_STATUS).includes(manifest.status)) throw new Error('Manifest status is invalid.');
  if (!['UNCHANGED', 'VERIFIED', 'ROLLED_BACK', 'UNKNOWN'].includes(manifest.productionState))
    throw new Error('Manifest production state is invalid.');
  const sequences = manifest.receipts.map(({ sequence }) => sequence);
  if (sequences.some((sequence, index) => sequence !== index + 1)) throw new Error('Receipt sequence is invalid.');
  return manifest;
}

function defaultDependencies() {
  const audit = [];
  const observe =
    (operation, implementation) =>
    async (...args) => {
      audit.push({
        sequence: audit.length + 1,
        operation,
        mode: 'OBSERVE',
        path: String(args[0]),
        secondaryPath: null,
      });
      return await implementation(...args);
    };
  const mutate =
    (operation, implementation) =>
    async (...args) => {
      audit.push({
        sequence: audit.length + 1,
        operation,
        mode: 'MUTATE',
        path: String(args[0]),
        secondaryPath: args[1] && typeof args[1] === 'string' ? args[1] : null,
      });
      return await implementation(...args);
    };
  return {
    audit,
    spawn: spawnChild,
    exists: observe(
      'exists',
      async (target) =>
        await fsp.access(target).then(
          () => true,
          (error) => (error.code === 'ENOENT' ? false : Promise.reject(error)),
        ),
    ),
    lstat: observe('lstat', fsp.lstat),
    realpath: observe('realpath', fsp.realpath),
    readFile: observe('readFile', fsp.readFile),
    writeFile: mutate('writeFile', fsp.writeFile),
    copyFile: mutate('copyFile', fsp.copyFile),
    rename: mutate('rename', fsp.rename),
    unlink: mutate('unlink', fsp.unlink),
    mkdir: mutate('mkdir', fsp.mkdir),
    open: async (...args) => {
      const recorder = args[1] === 'r' ? observe('open', fsp.open) : mutate('open', fsp.open);
      return await recorder(...args);
    },
    readdir: observe('readdir', fsp.readdir),
    stat: observe('stat', fsp.stat),
    playCandidate,
  };
}
```

Path containment, process execution, hashing, and atomic JSON writes use exact code:

```js
function isAtOrInside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function assertContainedRegularFile(root, target, dependencies) {
  const realRoot = await dependencies.realpath(root);
  const realTarget = await dependencies.realpath(target);
  if (realRoot === realTarget || !isAtOrInside(realRoot, realTarget)) throw new Error('Path escapes owned root.');
  const stat = await dependencies.lstat(realTarget);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Owned artifact must be a regular non-link file.');
  return realTarget;
}

async function assertContainedNewPath(root, target, dependencies) {
  const realRoot = await dependencies.realpath(root);
  const realParent = await dependencies.realpath(path.dirname(target));
  if (!isAtOrInside(realRoot, realParent)) throw new Error('New path parent escapes owned root.');
  try {
    const stat = await dependencies.lstat(target);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('Existing target is a link or non-file.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function spawnChecked(executable, args, cwd, dependencies, timeoutMs = 120000) {
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string' || /[\0\r\n]/u.test(arg))) {
    throw new Error('Process argument is invalid.');
  }
  return await new Promise((resolve, reject) => {
    const child = dependencies.spawn(executable, args, { cwd, shell: false, windowsHide: true });
    const stdout = [];
    const stderr = [];
    let settled = false;
    const finish = (callback) => (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(reject)(Object.assign(new Error(`${executable} timed out after ${timeoutMs}ms.`), { gate: 'process' }));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => stderr.push(Buffer.from(chunk)));
    child.once('error', finish(reject));
    child.once(
      'close',
      finish((exitCode) => {
        const result = {
          exitCode,
          stdout: Buffer.concat(stdout).toString('utf8'),
          stderr: Buffer.concat(stderr).toString('utf8'),
        };
        if (exitCode !== 0) reject(Object.assign(new Error(`${executable} exited ${exitCode}.`), { gate: 'process' }));
        else resolve(result);
      }),
    );
  });
}

const PROCESS_TIMEOUT_MS = Object.freeze({
  'encode-pass-1': 900000,
  'encode-pass-2': 900000,
  encode: 900000,
  probe: 120000,
  vmaf: 120000,
  'post-promotion-vmaf': 120000,
});

export function timeoutForInvocation(invocation) {
  const timeout = PROCESS_TIMEOUT_MS[invocation.kind];
  if (!Number.isSafeInteger(timeout)) throw new Error(`No timeout policy for invocation kind: ${invocation.kind}`);
  return timeout;
}

export function buildWebmAbsenceGates(repositoryRoot, implementationBaseline) {
  return {
    gitChecks: WEBM_PROMOTION_ALLOWLIST.flatMap((relative) => [
      ['cat-file', '-e', `${implementationBaseline}:${relative}`],
      ['cat-file', '-e', `HEAD:${relative}`],
      ['ls-files', '--error-unmatch', '--', relative],
    ]),
    worktreeWebmTargets: WEBM_PROMOTION_ALLOWLIST.map((relative) => path.resolve(repositoryRoot, relative)),
    temporarySiblings: [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST].flatMap((relative) =>
      ['.phase-6c-rollout.tmp', '.phase-6c-rollback.tmp'].map(
        (suffix) => `${path.resolve(repositoryRoot, relative)}${suffix}`,
      ),
    ),
  };
}

export function commandPreflightPolicy(command) {
  return {
    requireGenerationBoundary: command === 'characterize' || command === 'run',
  };
}

async function preflightRollout(command, repositoryRoot, implementationBaseline, dependencies) {
  const branch = await spawnChecked('git', ['branch', '--show-current'], repositoryRoot, dependencies);
  if (branch.stdout.trim() !== 'phase/06-hardening-release') throw new Error('BLOCKED: rollout branch mismatch.');
  await spawnChecked(
    'git',
    ['check-ignore', '-q', '--', '.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01'],
    repositoryRoot,
    dependencies,
  );
  const attributes = await spawnChecked(
    'git',
    ['check-attr', 'filter', '--', ...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST],
    repositoryRoot,
    dependencies,
  );
  const attributeLines = attributes.stdout.trim().split(/\r?\n/u);
  if (attributeLines.length !== 32 || attributeLines.some((line) => !line.endsWith(': filter: lfs')))
    throw new Error('BLOCKED: Git LFS attribute coverage mismatch.');
  if (!['characterize', 'run', 'report'].includes(command)) return;
  const ffmpegVersion = await spawnChecked('ffmpeg', ['-version'], repositoryRoot, dependencies);
  const encoders =
    command === 'report'
      ? null
      : await spawnChecked('ffmpeg', ['-hide_banner', '-encoders'], repositoryRoot, dependencies);
  const filters = await spawnChecked('ffmpeg', ['-hide_banner', '-filters'], repositoryRoot, dependencies);
  const ffprobeVersion =
    command === 'report' ? null : await spawnChecked('ffprobe', ['-version'], repositoryRoot, dependencies);
  if (
    !ffmpegVersion.stdout.includes('ffmpeg version 8.1.2') ||
    (ffprobeVersion && !ffprobeVersion.stdout.includes('ffprobe version 8.1.2'))
  )
    throw new Error('BLOCKED: FFmpeg tool version mismatch.');
  if (encoders)
    for (const encoder of ['libvpx-vp9', 'libx264'])
      if (!encoders.stdout.includes(encoder)) throw new Error(`BLOCKED: missing encoder ${encoder}.`);
  if (!filters.stdout.includes('libvmaf')) throw new Error('BLOCKED: missing libvmaf filter.');
  if (process.version !== 'v24.18.0') throw new Error('BLOCKED: Node version mismatch.');
  if (command === 'report') return;
  const browser = await chromium.launch({ timeout: 30000 });
  try {
    if (!browser.version().startsWith('148.0.7778.')) throw new Error('BLOCKED: Chromium version mismatch.');
  } finally {
    await browser.close();
  }
}

async function assertGenerationBoundary(repositoryRoot, implementationBaseline, dependencies) {
  for (const artifact of [
    'docs/superpowers/specs/2026-09-01-phase-6c-hero-video-rollout-planning-brief.md',
    'docs/superpowers/plans/2026-09-01-phase-6c-hero-video-rollout.md',
  ])
    await spawnChecked(
      'git',
      ['cat-file', '-e', `${implementationBaseline}:${artifact}`],
      repositoryRoot,
      dependencies,
    );
  try {
    await spawnChecked(
      'git',
      ['cat-file', '-e', `${implementationBaseline}:scripts/hero-video-rollout.mjs`],
      repositoryRoot,
      dependencies,
    );
    throw new Error('BLOCKED: implementation baseline already contains rollout code.');
  } catch (error) {
    if (error.message === 'BLOCKED: implementation baseline already contains rollout code.') throw error;
  }
  for (const [relative, expectedHash] of [
    [
      'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
      'fd43e58af19e79f746c41126572072e38792052f202ae5c1c26e4efdb5f6e6e9',
    ],
    [
      'docs/superpowers/plans/phase-2-task-3-execution.md',
      'f1be0e060eda06afa2afdff53d4dcecd338b3c67514e412e2add0605c503a7e2',
    ],
  ])
    if ((await sha256File(path.resolve(repositoryRoot, relative), dependencies)) !== expectedHash)
      throw new Error(`BLOCKED: protected file drift: ${relative}`);
  const expectGitMiss = async (args, label) => {
    try {
      await spawnChecked('git', args, repositoryRoot, dependencies, 30000);
    } catch (error) {
      if (/exited 1|exited 128/u.test(error.message)) return;
      throw error;
    }
    throw new Error(`BLOCKED: unexpected tracked WebM at ${label}.`);
  };
  const absence = buildWebmAbsenceGates(repositoryRoot, implementationBaseline);
  for (const args of absence.gitChecks) await expectGitMiss(args, args.join(' '));
  for (const target of absence.worktreeWebmTargets) {
    if (await dependencies.exists(target))
      throw new Error(`BLOCKED: WebM target exists in worktree: ${path.relative(repositoryRoot, target)}`);
  }
  for (const target of absence.temporarySiblings)
    if (await dependencies.exists(target)) throw new Error(`BLOCKED: stale promotion sibling: ${target}`);
}

async function sha256File(target, dependencies) {
  if (dependencies.hashFile) return await dependencies.hashFile(target);
  return createHash('sha256')
    .update(await dependencies.readFile(target))
    .digest('hex');
}

export function validateSourceInventory(sources) {
  if (JSON.stringify(sources) !== JSON.stringify(HERO_VIDEO_SOURCES))
    throw new Error('Source inventory identity mismatch.');
}

export async function verifyImmutableSources(repositoryRoot, dependencies = defaultDependencies()) {
  validateSourceInventory(HERO_VIDEO_SOURCES);
  if (HERO_VIDEO_SOURCES.reduce((sum, source) => sum + source.bytes, 0) !== 103076167)
    throw new Error('Immutable source byte total mismatch.');
  for (const source of HERO_VIDEO_SOURCES) {
    const target = path.resolve(repositoryRoot, source.sourcePath);
    await assertContainedRegularFile(path.resolve(repositoryRoot, 'public/assets/hero'), target, dependencies);
    const stat = await dependencies.stat(target);
    if (stat.size !== source.bytes || (await sha256File(target, dependencies)) !== source.sha256) {
      throw new Error(`Immutable source drift: ${source.sourcePath}`);
    }
  }
}

export function computeAggregateReduction(webmBytes) {
  if (!Number.isSafeInteger(webmBytes) || webmBytes < 1) throw new Error('Aggregate WebM bytes are invalid.');
  const originalBytes = 103076167;
  const reductionBytes = originalBytes - webmBytes;
  return {
    originalBytes,
    webmBytes,
    reductionBytes,
    reductionPercent: (reductionBytes * 100) / originalBytes,
    passed: reductionBytes * 10000 >= originalBytes * 4000,
  };
}

export async function writeJsonAtomic(ownedRunRoot, target, value, dependencies) {
  value.filesystemReceipts = [...(dependencies.audit ?? value.filesystemReceipts ?? [])];
  const temporary = `${target}.partial`;
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await assertContainedNewPath(ownedRunRoot, target, dependencies);
  await assertContainedNewPath(ownedRunRoot, temporary, dependencies);
  await dependencies.writeFile(temporary, bytes, { flag: 'wx' });
  const file = await dependencies.open(temporary, 'r');
  await file.sync();
  await file.close();
  await dependencies.rename(temporary, target);
  const directory = await dependencies.open(path.dirname(target), 'r');
  await directory.sync();
  await directory.close();
}

async function characterize(repositoryRoot, paths, parsed, dependencies) {
  const expectedDirectories = [
    paths.evidenceRoot,
    path.dirname(paths.runRoot),
    paths.runRoot,
    paths.candidates,
    paths.passlogs,
    paths.probes,
    paths.metrics,
    paths.browser,
    paths.backups,
  ];
  for (const directoryPath of expectedDirectories) {
    try {
      await dependencies.mkdir(directoryPath, { recursive: false });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    const stat = await dependencies.lstat(directoryPath);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error('Rollout directory must be a non-link directory.');
  }
  await verifyImmutableSources(repositoryRoot, dependencies);
  const manifest = {
    schemaVersion: 1,
    runId: parsed.runId,
    implementationBaseline: parsed.implementationBaseline,
    pilotHarnessCommit: '7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe',
    status: 'CHARACTERIZED',
    productionState: 'UNCHANGED',
    immutableSources: HERO_VIDEO_SOURCES,
    backupSources: [],
    candidates: [],
    aggregate: null,
    production: [],
    promotionAttempt: null,
    failure: null,
    receipts: [],
    filesystemReceipts: [],
  };
  for (const source of HERO_VIDEO_SOURCES) {
    const original = path.resolve(repositoryRoot, source.sourcePath);
    const backup = path.resolve(paths.backups, source.sourcePath);
    await dependencies.mkdir(path.dirname(backup), { recursive: true });
    await assertContainedNewPath(paths.runRoot, backup, dependencies);
    await dependencies.copyFile(original, backup, fsConstants.COPYFILE_EXCL);
    const stat = await dependencies.stat(backup);
    const sha256 = await sha256File(backup, dependencies);
    if (stat.size !== source.bytes || sha256 !== source.sha256)
      throw new Error(`Characterization backup mismatch: ${source.sourcePath}`);
    manifest.backupSources.push({
      sourcePath: source.sourcePath,
      backupPath: path.relative(paths.runRoot, backup),
      bytes: source.bytes,
      sha256,
    });
  }
  await writeJsonAtomic(paths.runRoot, paths.manifest, validateManifest(manifest), dependencies);
  return manifest;
}
```

Command builders emit these arrays; only resolved source/candidate/passlog/report paths vary:

```js
export function buildCandidateInvocations(source, format, quality, paths) {
  const input = path.resolve(paths.repositoryRoot, source.sourcePath);
  const output = path.resolve(paths.candidates, `${source.id}.${format}`);
  const common = ['-y', '-i', input, '-map', '0:v:0', '-an', '-map_metadata', '-1', '-vf', 'fps=24,format=yuv420p'];
  if (format === 'webm') {
    if (![28, 24].includes(quality)) throw new Error('Invalid WebM quality.');
    const passlog = path.resolve(paths.passlogs, `${source.id}-webm-${quality}`);
    const codec = [
      '-c:v',
      'libvpx-vp9',
      '-crf',
      String(quality),
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
    ];
    const tail = ['-fps_mode', 'cfr', '-t', '6.041667'];
    return [
      {
        kind: 'encode-pass-1',
        executable: 'ffmpeg',
        args: [
          ...common,
          ...codec,
          '-pass',
          '1',
          '-passlogfile',
          passlog,
          ...tail,
          '-f',
          'null',
          process.platform === 'win32' ? 'NUL' : '/dev/null',
        ],
        passlogPath: passlog,
        candidatePath: output,
        sourcePath: input,
      },
      {
        kind: 'encode-pass-2',
        executable: 'ffmpeg',
        args: [...common, ...codec, '-pass', '2', '-passlogfile', passlog, ...tail, '-f', 'webm', output],
        passlogPath: passlog,
        candidatePath: output,
        sourcePath: input,
      },
    ];
  }
  if (![20, 18].includes(quality)) throw new Error('Invalid MP4 quality.');
  return [
    {
      kind: 'encode',
      executable: 'ffmpeg',
      args: [
        ...common,
        '-c:v',
        'libx264',
        '-crf',
        String(quality),
        '-preset',
        'slow',
        '-threads',
        '1',
        '-movflags',
        '+faststart',
        '-fps_mode',
        'cfr',
        '-t',
        '6.041667',
        '-f',
        'mp4',
        output,
      ],
      candidatePath: output,
      sourcePath: input,
    },
  ];
}

export function buildProbeInvocation(candidatePath) {
  return {
    executable: 'ffprobe',
    args: [
      '-v',
      'error',
      '-count_packets',
      '-show_entries',
      'stream=index,codec_type,codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_packets:stream_disposition=attached_pic:stream_tags:format=duration:format_tags',
      '-of',
      'json',
      candidatePath,
    ],
  };
}

export function buildMetricInvocation(source, candidate, paths) {
  const candidatePath = path.resolve(paths.runRoot, candidate.candidatePath);
  const referencePath = path.resolve(paths.backups, source.sourcePath);
  const reportPath = path.resolve(paths.metrics, `${source.id}-${candidate.format}-${candidate.quality}.json`);
  const reportName = path.basename(reportPath);
  return {
    kind: 'vmaf',
    executable: 'ffmpeg',
    candidatePath,
    sourcePath: referencePath,
    reportPath,
    cwd: paths.metrics,
    args: [
      '-v',
      'error',
      '-i',
      candidatePath,
      '-i',
      referencePath,
      '-lavfi',
      `[0:v][1:v]libvmaf=log_fmt=json:log_path=${reportName}`,
      '-f',
      'null',
      process.platform === 'win32' ? 'NUL' : '/dev/null',
    ],
  };
}

export function buildPromotedMetricInvocation(source, production, paths) {
  const candidatePath = path.resolve(paths.repositoryRoot, production.path);
  const referencePath = path.resolve(paths.backups, source.sourcePath);
  const reportPath = path.resolve(paths.metrics, `${source.id}-${production.format}-post-promotion.json`);
  const reportName = path.basename(reportPath);
  return {
    kind: 'post-promotion-vmaf',
    executable: 'ffmpeg',
    candidatePath,
    sourcePath: referencePath,
    reportPath,
    cwd: paths.metrics,
    args: [
      '-v',
      'error',
      '-i',
      candidatePath,
      '-i',
      referencePath,
      '-lavfi',
      `[0:v][1:v]libvmaf=log_fmt=json:log_path=${reportName}`,
      '-f',
      'null',
      process.platform === 'win32' ? 'NUL' : '/dev/null',
    ],
  };
}
```

`parseProbe` and gate classification are exact. Both dimension families receive fixtures in the test: `bedroom-bed-forward` asserts `1168x768`, `kitchen-dining-forward` asserts `1168x784`; VP9 asserts `codecName === 'vp9'`, H.264 asserts `codecName === 'h264'`.

```js
export function parseProbe(raw, format) {
  const parsed = JSON.parse(raw);
  const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
  const videos = streams.filter((stream) => stream.codec_type === 'video');
  const audios = streams.filter((stream) => stream.codec_type === 'audio');
  if (videos.length !== 1) throw new Error('Candidate must contain exactly one video stream.');
  const video = videos[0];
  const streamTags = Object.fromEntries(
    Object.entries(video.tags ?? {}).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
  const formatTags = Object.fromEntries(
    Object.entries(parsed.format?.tags ?? {}).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
  const permittedStream = new Set(PERMITTED_STREAM_TAGS[format].map((tag) => tag.toLowerCase()));
  const permittedFormat = new Set(PERMITTED_FORMAT_TAGS[format].map((tag) => tag.toLowerCase()));
  for (const key of Object.keys(streamTags)) {
    if (FORBIDDEN_INHERITED_TAGS.includes(key) || !permittedStream.has(key))
      throw new Error(`Forbidden stream metadata tag: ${key}`);
  }
  for (const key of Object.keys(formatTags)) {
    if (FORBIDDEN_INHERITED_TAGS.includes(key) || !permittedFormat.has(key))
      throw new Error(`Forbidden format metadata tag: ${key}`);
  }
  return {
    codecName: String(video.codec_name),
    width: Number(video.width),
    height: Number(video.height),
    pixelFormat: String(video.pix_fmt),
    rFrameRate: String(video.r_frame_rate),
    avgFrameRate: String(video.avg_frame_rate),
    packets: Number(video.nb_read_packets),
    durationSeconds: Number(parsed.format?.duration),
    videoStreams: videos.length,
    audioStreams: audios.length,
    attachedPictures: videos.filter((stream) => Number(stream.disposition?.attached_pic) === 1).length,
    streamTags,
    formatTags,
  };
}

const VP9_RETRY_GATES = new Set([
  'codec',
  'dimensions',
  'pixelFormat',
  'rFrameRate',
  'avgFrameRate',
  'packets',
  'duration',
  'videoStreams',
  'audioStreams',
  'attachedPictures',
  'metadata',
  'vmaf',
]);
const H264_RETRY_GATES = new Set([...VP9_RETRY_GATES, 'size', 'playback']);
const BLOCKED_GATES = new Set([
  'immutableSource',
  'toolchain',
  'process',
  'containment',
  'receiptIdentity',
  'promotionBoundary',
]);

class AttemptFailure extends Error {
  constructor(gate, message, cause) {
    super(message, { cause });
    this.gate = gate;
  }
}

function classifyAttemptError(error, stage) {
  if (error instanceof AttemptFailure) return error.gate;
  if (stage === 'metadata') return 'metadata';
  if (stage === 'vmaf-report') return 'vmaf';
  if (stage === 'playback') return 'playback';
  return 'process';
}

export function nextQuality(format, attemptedQuality, assessment) {
  if (assessment.failedGates.some((gate) => BLOCKED_GATES.has(gate))) return null;
  if (format === 'webm' && attemptedQuality === 28 && assessment.failedGates.every((gate) => VP9_RETRY_GATES.has(gate)))
    return 24;
  if (format === 'mp4' && attemptedQuality === 20 && assessment.failedGates.every((gate) => H264_RETRY_GATES.has(gate)))
    return 18;
  return null;
}

export function classifyFailure(format, attemptedQuality, failedGates) {
  if (failedGates.some((gate) => BLOCKED_GATES.has(gate))) return 'BLOCKED';
  const retry = nextQuality(format, attemptedQuality, { accepted: false, failedGates, classification: 'NO_CHANGE' });
  return retry === null ? 'NO_CHANGE' : 'RETRY';
}

export function assessCandidate(source, candidate) {
  const probe = candidate.probe;
  const expectedCodec = candidate.format === 'webm' ? 'vp9' : 'h264';
  const failedGates = [];
  if (probe.codecName !== expectedCodec) failedGates.push('codec');
  if (probe.width !== source.width || probe.height !== source.height) failedGates.push('dimensions');
  if (probe.pixelFormat !== 'yuv420p') failedGates.push('pixelFormat');
  if (probe.rFrameRate !== '24/1') failedGates.push('rFrameRate');
  if (probe.avgFrameRate !== '24/1') failedGates.push('avgFrameRate');
  if (probe.packets !== 145) failedGates.push('packets');
  if (Math.abs(probe.durationSeconds - 6.041667) > 0.001) failedGates.push('duration');
  if (probe.videoStreams !== 1) failedGates.push('videoStreams');
  if (probe.audioStreams !== 0) failedGates.push('audioStreams');
  if (probe.attachedPictures !== 0) failedGates.push('attachedPictures');
  if (
    [...Object.keys(probe.streamTags), ...Object.keys(probe.formatTags)].some((key) =>
      FORBIDDEN_INHERITED_TAGS.includes(key.toLowerCase()),
    )
  )
    failedGates.push('metadata');
  if (candidate.vmaf < 95) failedGates.push('vmaf');
  if (candidate.bytes >= source.bytes) failedGates.push('size');
  if (
    !candidate.playback.loadeddata ||
    !candidate.playback.playing ||
    !candidate.playback.ended ||
    candidate.playback.error !== null
  )
    failedGates.push('playback');
  return {
    accepted: failedGates.length === 0,
    failedGates,
    classification:
      failedGates.length === 0 ? 'PASS' : classifyFailure(candidate.format, candidate.quality, failedGates),
  };
}
```

Default `playCandidate` uses a loopback-only HTTP server. It serves one exact candidate path, rejects every other URL, launches Chromium, attaches listeners before assigning `video.src`, and resolves only after ordered useful playback:

```js
async function playCandidate(candidatePath, format, timeoutMs = 30000) {
  const bytes = await fsp.readFile(candidatePath);
  const route = '/candidate';
  const server = http.createServer((request, response) => {
    if (request.method !== 'GET' || new URL(request.url, 'http://127.0.0.1').pathname !== route) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': format === 'webm' ? 'video/webm' : 'video/mp4',
      'Content-Length': String(bytes.length),
      'Cache-Control': 'no-store',
    });
    response.end(bytes);
  });
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const address = server.address();
  if (typeof address === 'string' || address === null) throw new Error('Loopback address is invalid.');
  const browser = await chromium.launch({ timeout: timeoutMs });
  const page = await browser.newPage();
  page.setDefaultTimeout(timeoutMs);
  const url = `http://127.0.0.1:${address.port}${route}`;
  try {
    const evidence = await page.evaluate(
      async ({ url }) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        const events = [];
        return await new Promise((resolve, reject) => {
          for (const name of ['loadeddata', 'playing', 'ended']) video.addEventListener(name, () => events.push(name));
          video.addEventListener('error', () => reject(new Error(`media-error-${video.error?.code ?? 0}`)), {
            once: true,
          });
          video.addEventListener(
            'ended',
            () =>
              resolve({
                loadeddata: events.includes('loadeddata'),
                playing: events.includes('playing'),
                ended: true,
                error: null,
                events,
                url,
              }),
            { once: true },
          );
          video.src = url;
          document.body.append(video);
          video.play().catch(reject);
          setTimeout(() => reject(Object.assign(new Error('browser playback timeout'), { gate: 'playback' })), 30000);
        });
      },
      { url },
    );
    return { ...evidence, browserVersion: browser.version() };
  } finally {
    await Promise.allSettled([page.close(), browser.close()]);
    await Promise.race([
      new Promise((resolve) => server.close(resolve)),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  }
}
```

Generation, cleanup, promotion, and rollback use these exact state rules:

```js
async function removeRetryArtifacts(source, format, quality, paths, dependencies) {
  const exact = [path.resolve(paths.candidates, `${source.id}.${format}`)];
  if (format === 'webm')
    exact.push(
      path.resolve(paths.passlogs, `${source.id}-webm-${quality}-0.log`),
      path.resolve(paths.passlogs, `${source.id}-webm-${quality}-0.log.mbtree`),
    );
  for (const target of exact) {
    await assertContainedNewPath(paths.runRoot, target, dependencies);
    try {
      await dependencies.unlink(target);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return exact;
}

export async function runCandidateBatch(context) {
  const { dependencies, manifest, paths } = context;
  const preflightFailure = dependencies.preflight ? await dependencies.preflight() : null;
  if (preflightFailure) {
    return await finishFailure(manifest, 'BLOCKED', null, null, null, [preflightFailure], paths, dependencies);
  }
  manifest.status = 'GENERATING';
  await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
  for (const source of HERO_VIDEO_SOURCES) {
    for (const format of ['webm', 'mp4']) {
      let quality = format === 'webm' ? 28 : 20;
      let attempt = 1;
      for (;;) {
        let candidate;
        let assessment;
        try {
          candidate = context.dependencies.encodeProbeMetricAndPlay
            ? await context.dependencies.encodeProbeMetricAndPlay(source, format, quality, attempt, context)
            : await encodeProbeMetricAndPlay(source, format, quality, attempt, context);
          assessment = context.dependencies.assessCandidate
            ? await context.dependencies.assessCandidate(source, candidate)
            : assessCandidate(source, candidate);
        } catch (error) {
          const gate = classifyAttemptError(error, error.stage ?? 'process');
          assessment = {
            accepted: false,
            failedGates: [gate],
            classification: classifyFailure(format, quality, [gate]),
          };
          context.manifest.receipts.push({
            sequence: context.manifest.receipts.length + 1,
            kind: 'attempt-failure',
            sourceId: source.id,
            format,
            quality,
            attempt,
            candidateSha256: null,
            status: 'FAILED',
            executable: null,
            args: [],
            exitCode: 1,
            artifactPath: null,
            artifactSha256: null,
          });
        }
        if (assessment.accepted) {
          manifest.candidates.push(candidate);
          break;
        }
        const classification = classifyFailure(format, quality, assessment.failedGates);
        if (classification === 'BLOCKED')
          return await finishFailure(
            manifest,
            'BLOCKED',
            source,
            format,
            quality,
            assessment.failedGates,
            paths,
            dependencies,
          );
        const retryQuality = nextQuality(format, quality, assessment);
        await removeRetryArtifacts(source, format, quality, paths, dependencies);
        if (classification === 'NO_CHANGE' || retryQuality === null)
          return await finishFailure(
            manifest,
            'NO_CHANGE',
            source,
            format,
            quality,
            assessment.failedGates,
            paths,
            dependencies,
          );
        quality = retryQuality;
        attempt += 1;
      }
    }
  }
  const webmBytes = manifest.candidates
    .filter((candidate) => candidate.format === 'webm')
    .reduce((sum, candidate) => sum + candidate.bytes, 0);
  manifest.aggregate = computeAggregateReduction(webmBytes);
  if (!manifest.aggregate.passed)
    return await finishFailure(manifest, 'NO_CHANGE', null, null, null, ['aggregate'], paths, dependencies);
  assertFinalReceiptCoverage(manifest);
  manifest.status = 'VALIDATED';
  await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
  return manifest;
}

export async function promoteValidatedBatch(context) {
  const { dependencies, manifest, paths, repositoryRoot } = context;
  try {
    if (manifest.status !== 'VALIDATED' || manifest.candidates.length !== 32)
      throw new Error('Validated candidate coverage must equal 32.');
    assertFinalReceiptCoverage(manifest);
    if (dependencies.verifyImmutableSources) await dependencies.verifyImmutableSources(repositoryRoot);
    else await verifyImmutableSources(repositoryRoot, dependencies);
    await assertProductionBoundaryVacant(context);
    await verifyBackupsAgainstOriginalLiterals(context);
    if (dependencies.assertPreMutationSnapshot) await dependencies.assertPreMutationSnapshot(context);
    else await assertPreMutationSnapshot(context);
    await stageAndRenameExactProductionAllowlist(context);
    await verifyPromotedProductionHashes(context);
    manifest.status = 'PROMOTED';
    manifest.productionState = 'VERIFIED';
    await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
    return manifest;
  } catch (error) {
    let rollbackReason = error.message;
    let rollbackVerified = false;
    if (manifest.promotionAttempt?.mutationStarted) {
      try {
        await rollbackFromImmutableBackups(context);
        await verifyBackupsAgainstOriginalLiterals(context);
        rollbackVerified = true;
      } catch (rollbackError) {
        rollbackReason = `${error.message}; rollback failed: ${rollbackError.message}`;
      }
    }
    if (rollbackVerified) {
      transitionStatus(manifest, 'NO_CHANGE');
      manifest.productionState = 'ROLLED_BACK';
      manifest.production = [];
    } else if (manifest.promotionAttempt?.mutationStarted) {
      if (manifest.status !== 'BLOCKED') transitionStatus(manifest, 'BLOCKED');
      manifest.productionState = 'UNKNOWN';
    } else {
      if (manifest.status !== 'BLOCKED') transitionStatus(manifest, 'BLOCKED');
      manifest.productionState = 'UNCHANGED';
    }
    manifest.failure = {
      sourceId: null,
      format: null,
      quality: null,
      failedGates: ['promotionBoundary'],
      reason: rollbackReason,
    };
    await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
    return manifest;
  }
}

async function assertProductionBoundaryVacant(context) {
  for (const relative of WEBM_PROMOTION_ALLOWLIST) {
    if (await context.dependencies.exists(path.resolve(context.repositoryRoot, relative)))
      throw new AttemptFailure('promotionBoundary', `WebM target already exists: ${relative}`);
  }
  for (const relative of [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST]) {
    for (const suffix of ['.phase-6c-rollout.tmp', '.phase-6c-rollback.tmp']) {
      if (await context.dependencies.exists(`${path.resolve(context.repositoryRoot, relative)}${suffix}`))
        throw new AttemptFailure('promotionBoundary', `Temporary sibling already exists: ${relative}${suffix}`);
    }
  }
}

async function assertPreMutationSnapshot(context) {
  const status = await spawnChecked(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all'],
    context.repositoryRoot,
    context.dependencies,
    30000,
  );
  const expectedStatus = [
    '?? docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
    '?? docs/superpowers/plans/phase-2-task-3-execution.md',
  ].sort();
  const actualStatus = status.stdout.trim().split(/\r?\n/u).filter(Boolean).sort();
  if (JSON.stringify(actualStatus) !== JSON.stringify(expectedStatus))
    throw new AttemptFailure('promotionBoundary', 'Pre-mutation workspace set mismatch.');
  for (const [relative, expectedHash] of [
    [
      'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
      'fd43e58af19e79f746c41126572072e38792052f202ae5c1c26e4efdb5f6e6e9',
    ],
    [
      'docs/superpowers/plans/phase-2-task-3-execution.md',
      'f1be0e060eda06afa2afdff53d4dcecd338b3c67514e412e2add0605c503a7e2',
    ],
  ])
    if ((await sha256File(path.resolve(context.repositoryRoot, relative), context.dependencies)) !== expectedHash)
      throw new AttemptFailure('promotionBoundary', `Pre-mutation protected hash mismatch: ${relative}`);
  const index = await spawnChecked(
    'git',
    ['diff', '--cached', '--name-only'],
    context.repositoryRoot,
    context.dependencies,
    30000,
  );
  if (index.stdout.trim() !== '') throw new AttemptFailure('promotionBoundary', 'Pre-mutation index is not empty.');
  const expectedCandidates = context.manifest.candidates
    .map(({ candidatePath }) => path.basename(candidatePath))
    .sort();
  const actualCandidates = (await context.dependencies.readdir(context.paths.candidates)).sort();
  if (expectedCandidates.length !== 32 || JSON.stringify(actualCandidates) !== JSON.stringify(expectedCandidates))
    throw new AttemptFailure('promotionBoundary', 'Candidate directory set mismatch.');
  for (const candidate of context.manifest.candidates) {
    const target = path.resolve(context.paths.runRoot, candidate.candidatePath);
    await assertContainedRegularFile(context.paths.runRoot, target, context.dependencies);
    const stat = await context.dependencies.stat(target);
    if (stat.size !== candidate.bytes || (await sha256File(target, context.dependencies)) !== candidate.sha256)
      throw new AttemptFailure('promotionBoundary', `Candidate snapshot identity mismatch: ${candidate.candidatePath}`);
  }
}
```

Complete the orchestration with these exact functions:

```js
async function recordInvocation(invocation, identity, context) {
  const result = await spawnChecked(
    invocation.executable,
    invocation.args,
    invocation.cwd ?? context.repositoryRoot,
    context.dependencies,
    timeoutForInvocation(invocation),
  );
  context.manifest.receipts.push({
    sequence: context.manifest.receipts.length + 1,
    kind: invocation.kind,
    sourceId: identity.sourceId,
    format: identity.format,
    quality: identity.quality,
    attempt: identity.attempt,
    candidateSha256: identity.candidateSha256,
    status: 'SUCCEEDED',
    executable: invocation.executable,
    args: invocation.args,
    exitCode: result.exitCode,
    artifactPath: invocation.candidatePath ? path.relative(context.paths.runRoot, invocation.candidatePath) : null,
    artifactSha256:
      invocation.candidatePath && (await context.dependencies.exists(invocation.candidatePath))
        ? await sha256File(invocation.candidatePath, context.dependencies)
        : null,
  });
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  return result;
}

async function encodeProbeMetricAndPlay(source, format, quality, attempt, context) {
  const identity = { sourceId: source.id, format, quality, attempt, candidateSha256: null };
  const encode = buildCandidateInvocations(source, format, quality, context.paths);
  try {
    for (const invocation of encode) await recordInvocation(invocation, identity, context);
  } catch (error) {
    throw new AttemptFailure('process', `encode failed: ${error.message}`, error);
  }
  const candidatePath = encode.at(-1).candidatePath;
  await assertContainedRegularFile(context.paths.runRoot, candidatePath, context.dependencies);
  const stat = await context.dependencies.stat(candidatePath);
  const probeInvocation = { kind: 'probe', ...buildProbeInvocation(candidatePath), candidatePath };
  let probeResult;
  try {
    probeResult = await recordInvocation(probeInvocation, identity, context);
  } catch (error) {
    throw new AttemptFailure('process', `probe failed: ${error.message}`, error);
  }
  let probe;
  try {
    probe = parseProbe(probeResult.stdout, format);
  } catch (error) {
    throw new AttemptFailure('metadata', `probe metadata invalid: ${error.message}`, error);
  }
  const preliminary = {
    sourceId: source.id,
    format,
    quality,
    attempt,
    candidatePath: path.relative(context.paths.runRoot, candidatePath),
    bytes: stat.size,
    sha256: await sha256File(candidatePath, context.dependencies),
    probe,
    vmaf: 0,
    playback: { loadeddata: false, playing: false, ended: false, error: null, events: [], url: '', browserVersion: '' },
  };
  const metric = buildMetricInvocation(source, preliminary, context.paths);
  try {
    await recordInvocation(metric, identity, context);
  } catch (error) {
    throw new AttemptFailure('process', `VMAF process failed: ${error.message}`, error);
  }
  let vmaf;
  try {
    const metricReport = JSON.parse((await context.dependencies.readFile(metric.reportPath)).toString('utf8'));
    vmaf = Number(metricReport.pooled_metrics?.vmaf?.mean);
    if (!Number.isFinite(vmaf)) throw new Error('VMAF mean is absent.');
  } catch (error) {
    throw new AttemptFailure('vmaf', `VMAF report invalid: ${error.message}`, error);
  }
  let playback;
  try {
    playback = await context.dependencies.playCandidate(candidatePath, format, 30000);
  } catch (error) {
    throw new AttemptFailure('playback', `playback failed: ${error.message}`, error);
  }
  const candidate = { ...preliminary, vmaf, playback };
  context.manifest.receipts.push({
    sequence: context.manifest.receipts.length + 1,
    kind: 'browser-playback',
    sourceId: source.id,
    format,
    quality,
    attempt,
    candidateSha256: candidate.sha256,
    status: 'SUCCEEDED',
    executable: null,
    args: [candidatePath],
    exitCode: playback.error === null ? 0 : 1,
    artifactPath: candidate.candidatePath,
    artifactSha256: candidate.sha256,
  });
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  return candidate;
}

export function assertFinalReceiptCoverage(manifest) {
  if (manifest.candidates.length !== 32)
    throw new AttemptFailure('receiptIdentity', 'Final candidate count is not 32.');
  const finalReceipts = [];
  for (const candidate of manifest.candidates) {
    const matches = manifest.receipts.filter(
      (receipt) =>
        receipt.kind === 'browser-playback' &&
        receipt.status === 'SUCCEEDED' &&
        receipt.sourceId === candidate.sourceId &&
        receipt.format === candidate.format &&
        receipt.quality === candidate.quality &&
        receipt.attempt === candidate.attempt &&
        receipt.candidateSha256 === candidate.sha256 &&
        receipt.artifactSha256 === candidate.sha256,
    );
    if (matches.length !== 1)
      throw new AttemptFailure('receiptIdentity', `Final receipt mismatch: ${candidate.sourceId}.${candidate.format}`);
    finalReceipts.push(matches[0]);
  }
  return finalReceipts;
}

async function finishFailure(manifest, status, source, format, quality, failedGates, paths, dependencies) {
  manifest.status = status;
  manifest.failure = {
    sourceId: source?.id ?? null,
    format,
    quality,
    failedGates,
    reason: `${status}:${source?.id ?? 'aggregate'}:${format ?? 'all'}:${failedGates.join(',')}`,
  };
  await writeJsonAtomic(paths.runRoot, paths.manifest, manifest, dependencies);
  return manifest;
}

async function stageAndRenameExactProductionAllowlist(context) {
  const byTarget = new Map();
  for (const candidate of context.manifest.candidates) {
    const extension = candidate.format === 'webm' ? '.webm' : '.mp4';
    const targetRelative = `public/assets/hero/${candidate.sourceId}${extension}`;
    byTarget.set(targetRelative, candidate);
  }
  const orderedTargets = [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST];
  if (orderedTargets.some((target) => !byTarget.has(target)) || byTarget.size !== 32) {
    throw new Error('Promotion candidate identity mismatch.');
  }
  const staged = [];
  context.manifest.promotionAttempt = {
    id: `${context.runId}-promotion-1`,
    mutationStarted: false,
    entries: [],
  };
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  for (const targetRelative of orderedTargets) {
    const candidate = byTarget.get(targetRelative);
    const source = path.resolve(context.paths.runRoot, candidate.candidatePath);
    const target = path.resolve(context.repositoryRoot, targetRelative);
    const temporary = `${target}.phase-6c-rollout.tmp`;
    const original = HERO_VIDEO_SOURCES.find(({ sourcePath }) => sourcePath === targetRelative);
    const intent = {
      targetRelative,
      temporaryRelative: `${targetRelative}.phase-6c-rollout.tmp`,
      format: candidate.format,
      candidateSha256: candidate.sha256,
      originalSha256: original?.sha256 ?? null,
      state: 'INTENT',
    };
    context.manifest.promotionAttempt.entries.push(intent);
    await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
    await assertContainedNewPath(
      path.resolve(context.repositoryRoot, 'public/assets/hero'),
      temporary,
      context.dependencies,
    );
    context.manifest.promotionAttempt.mutationStarted = true;
    await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
    await context.dependencies.copyFile(source, temporary, fsConstants.COPYFILE_EXCL);
    const file = await context.dependencies.open(temporary, 'r');
    await file.sync();
    await file.close();
    if ((await sha256File(temporary, context.dependencies)) !== candidate.sha256)
      throw new Error('Staged candidate hash mismatch.');
    staged.push({ targetRelative, target, temporary, candidate });
  }
  for (const item of staged) {
    await context.dependencies.rename(item.temporary, item.target);
    const intent = context.manifest.promotionAttempt.entries.find(
      ({ targetRelative }) => targetRelative === item.targetRelative,
    );
    intent.state = 'COMPLETED';
    await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  }
  const directory = await context.dependencies.open(path.resolve(context.repositoryRoot, 'public/assets/hero'), 'r');
  await directory.sync();
  await directory.close();
  context.manifest.production = staged.map(({ targetRelative, candidate }) => ({
    path: targetRelative,
    bytes: candidate.bytes,
    sha256: candidate.sha256,
    format: candidate.format,
  }));
}

async function verifyPromotedProductionHashes(context) {
  if (context.manifest.production.length !== 32) throw new Error('Production manifest coverage must equal 32.');
  for (const item of context.manifest.production) {
    const target = path.resolve(context.repositoryRoot, item.path);
    await assertContainedRegularFile(
      path.resolve(context.repositoryRoot, 'public/assets/hero'),
      target,
      context.dependencies,
    );
    const stat = await context.dependencies.stat(target);
    if (stat.size !== item.bytes || (await sha256File(target, context.dependencies)) !== item.sha256) {
      throw new Error(`Promoted production identity mismatch: ${item.path}`);
    }
  }
}

async function verifyBackupsAgainstOriginalLiterals(context) {
  if (context.manifest.backupSources.length !== 16) throw new Error('Backup coverage must equal 16.');
  for (const source of HERO_VIDEO_SOURCES) {
    const receipt = context.manifest.backupSources.find((item) => item.sourcePath === source.sourcePath);
    if (!receipt || receipt.bytes !== source.bytes || receipt.sha256 !== source.sha256)
      throw new Error('Backup receipt identity mismatch.');
    const backup = path.resolve(context.paths.runRoot, receipt.backupPath);
    await assertContainedRegularFile(context.paths.runRoot, backup, context.dependencies);
    const stat = await context.dependencies.stat(backup);
    if (stat.size !== source.bytes || (await sha256File(backup, context.dependencies)) !== source.sha256) {
      throw new Error(`Backup source drift: ${source.sourcePath}`);
    }
  }
}

async function rollbackFromImmutableBackups(context) {
  await verifyBackupsAgainstOriginalLiterals(context);
  for (const source of HERO_VIDEO_SOURCES) {
    const receipt = context.manifest.backupSources.find((item) => item.sourcePath === source.sourcePath);
    const backup = path.resolve(context.paths.runRoot, receipt.backupPath);
    const target = path.resolve(context.repositoryRoot, source.sourcePath);
    const temporary = `${target}.phase-6c-rollback.tmp`;
    await context.dependencies.copyFile(backup, temporary, fsConstants.COPYFILE_EXCL);
    if ((await sha256File(temporary, context.dependencies)) !== source.sha256)
      throw new Error('Rollback temporary hash mismatch.');
    await context.dependencies.rename(temporary, target);
  }
  const attemptedWebms = (context.manifest.promotionAttempt?.entries ?? []).filter(({ format }) => format === 'webm');
  if (attemptedWebms.some(({ targetRelative }) => !WEBM_PROMOTION_ALLOWLIST.includes(targetRelative)))
    throw new Error('Rollback WebM receipt escapes allowlist.');
  for (const entry of attemptedWebms) {
    const target = path.resolve(context.repositoryRoot, entry.targetRelative);
    if (!(await context.dependencies.exists(target))) continue;
    if ((await sha256File(target, context.dependencies)) !== entry.candidateSha256)
      throw new Error(`Rollback refuses unowned WebM identity: ${entry.targetRelative}`);
    await context.dependencies.unlink(target);
  }
  for (const entry of context.manifest.promotionAttempt?.entries ?? []) {
    for (const relative of [entry.temporaryRelative, `${entry.targetRelative}.phase-6c-rollback.tmp`]) {
      const target = path.resolve(context.repositoryRoot, relative);
      try {
        await context.dependencies.unlink(target);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  await verifyBackupsAgainstOriginalLiterals(context);
  for (const source of HERO_VIDEO_SOURCES) {
    const target = path.resolve(context.repositoryRoot, source.sourcePath);
    if ((await sha256File(target, context.dependencies)) !== source.sha256)
      throw new Error('Rollback production hash mismatch.');
  }
  for (const relative of WEBM_PROMOTION_ALLOWLIST) {
    if (await context.dependencies.exists(path.resolve(context.repositoryRoot, relative)))
      throw new Error(`Rollback WebM remains present: ${relative}`);
  }
}

export async function recoverInterruptedPromotion(context) {
  const attempt = context.manifest.promotionAttempt;
  if (!attempt?.mutationStarted || context.manifest.status === 'PROMOTED') return context.manifest;
  const allowed = new Set([...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST]);
  const targets = attempt.entries.map(({ targetRelative }) => targetRelative);
  const valid =
    attempt.entries.length >= 1 &&
    attempt.entries.length <= 32 &&
    new Set(targets).size === targets.length &&
    attempt.entries.every((entry) => {
      const source = HERO_VIDEO_SOURCES.find(
        ({ id }) => entry.targetRelative === `public/assets/hero/${id}.${entry.format}`,
      );
      const candidate = context.manifest.candidates.find(
        ({ sourceId, format, sha256 }) =>
          sourceId === source?.id && format === entry.format && sha256 === entry.candidateSha256,
      );
      return (
        allowed.has(entry.targetRelative) &&
        candidate &&
        entry.temporaryRelative === `${entry.targetRelative}.phase-6c-rollout.tmp` &&
        (entry.format === 'webm' ? entry.originalSha256 === null : entry.originalSha256 === source.sha256) &&
        ['INTENT', 'COMPLETED'].includes(entry.state)
      );
    });
  if (!valid) {
    context.manifest.status = 'BLOCKED';
    context.manifest.productionState = 'UNKNOWN';
    context.manifest.failure = {
      sourceId: null,
      format: null,
      quality: null,
      failedGates: ['receiptIdentity'],
      reason: 'BLOCKED: invalid crash-recovery intent ledger.',
    };
    await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
    return context.manifest;
  }
  try {
    await rollbackFromImmutableBackups(context);
    transitionStatus(context.manifest, 'NO_CHANGE');
    context.manifest.productionState = 'ROLLED_BACK';
    context.manifest.production = [];
    context.manifest.failure = {
      sourceId: null,
      format: null,
      quality: null,
      failedGates: ['promotionBoundary'],
      reason: `NO_CHANGE: recovered interrupted promotion ${attempt.id}.`,
    };
  } catch (error) {
    context.manifest.status = 'BLOCKED';
    context.manifest.productionState = 'UNKNOWN';
    context.manifest.failure = {
      sourceId: null,
      format: null,
      quality: null,
      failedGates: ['promotionBoundary'],
      reason: `BLOCKED: crash recovery failed: ${error.message}`,
    };
  }
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  return context.manifest;
}

async function verifyPromotedTrackedIdentity(context) {
  if (context.manifest.status !== 'PROMOTED')
    throw new AttemptFailure('promotionBoundary', 'Command requires PROMOTED manifest.');
  const expected = [...MP4_PROMOTION_ALLOWLIST, ...WEBM_PROMOTION_ALLOWLIST].sort();
  const actual = context.manifest.production.map(({ path: productionPath }) => productionPath).sort();
  if (context.manifest.production.length !== 32 || JSON.stringify(actual) !== JSON.stringify(expected))
    throw new AttemptFailure('promotionBoundary', 'Promoted manifest path identity mismatch.');
  for (const item of context.manifest.production) {
    await spawnChecked(
      'git',
      ['ls-files', '--error-unmatch', '--', item.path],
      context.repositoryRoot,
      context.dependencies,
      30000,
    );
    const pointer = await spawnChecked(
      'git',
      ['show', `:${item.path}`],
      context.repositoryRoot,
      context.dependencies,
      30000,
    );
    const expectedPointer = `version https://git-lfs.github.com/spec/v1\noid sha256:${item.sha256}\nsize ${item.bytes}`;
    if (pointer.stdout.trim() !== expectedPointer)
      throw new AttemptFailure('promotionBoundary', `Promoted index pointer mismatch: ${item.path}`);
    const target = path.resolve(context.repositoryRoot, item.path);
    const stat = await context.dependencies.stat(target);
    if (stat.size !== item.bytes || (await sha256File(target, context.dependencies)) !== item.sha256)
      throw new AttemptFailure('promotionBoundary', `Promoted worktree identity mismatch: ${item.path}`);
  }
}

export async function verifyProduction(context) {
  validateManifest(context.manifest);
  try {
    if (context.dependencies.verifyPromotedTrackedIdentity)
      await context.dependencies.verifyPromotedTrackedIdentity(context);
    else await verifyPromotedTrackedIdentity(context);
    await verifyPromotedProductionHashes(context);
    assertFinalReceiptCoverage(context.manifest);
    return context.manifest;
  } catch (error) {
    return await recoverPostPromotionFailure(context, 'NO_CHANGE', ['promotionBoundary'], error);
  }
}

export async function reportPromotedRollout(context) {
  validateManifest(context.manifest);
  try {
    if (context.dependencies.verifyPromotedTrackedIdentity)
      await context.dependencies.verifyPromotedTrackedIdentity(context);
    else await verifyPromotedTrackedIdentity(context);
    await verifyBackupsAgainstOriginalLiterals(context);
    await verifyPromotedProductionHashes(context);
    assertFinalReceiptCoverage(context.manifest);
    const refreshedVmaf = [];
    for (const candidate of context.manifest.candidates) {
      const source = HERO_VIDEO_SOURCES.find(({ id }) => id === candidate.sourceId);
      const production = context.manifest.production.find(
        ({ path: productionPath, format }) =>
          productionPath === `public/assets/hero/${candidate.sourceId}.${format}` && format === candidate.format,
      );
      if (!production)
        throw new Error(`Promoted candidate identity missing: ${candidate.sourceId}.${candidate.format}`);
      const invocation = buildPromotedMetricInvocation(source, production, context.paths);
      const result = await spawnChecked(
        invocation.executable,
        invocation.args,
        invocation.cwd,
        context.dependencies,
        120000,
      );
      if (result.exitCode !== 0) throw new Error('Post-promotion VMAF process failed.');
      const report = JSON.parse((await context.dependencies.readFile(invocation.reportPath)).toString('utf8'));
      const value = Number(report.pooled_metrics?.vmaf?.mean);
      if (!Number.isFinite(value) || value < 95)
        throw new Error(`Post-promotion VMAF failed: ${candidate.sourceId}.${candidate.format}`);
      refreshedVmaf.push({ sourceId: candidate.sourceId, format: candidate.format, value });
    }
    const playbackReceipts = assertFinalReceiptCoverage(context.manifest);
    if (playbackReceipts.length !== 32) throw new Error('Browser playback receipt coverage must equal 32.');
    const webmBytes = context.manifest.production
      .filter(({ format }) => format === 'webm')
      .reduce((sum, item) => sum + item.bytes, 0);
    const aggregate = computeAggregateReduction(webmBytes);
    if (!aggregate.passed) throw new Error('Post-promotion aggregate reduction failed.');
    return {
      status: 'ROLLOUT_READY_LOCAL',
      backups: 16,
      production: context.manifest.production.map(({ path: productionPath, bytes, sha256, format }) => ({
        path: productionPath,
        bytes,
        sha256,
        format,
      })),
      refreshedVmaf,
      playbackReceipts: 32,
      aggregate,
    };
  } catch (error) {
    return await recoverPostPromotionFailure(
      context,
      error.gate === 'process' ? 'BLOCKED' : 'NO_CHANGE',
      [error.gate ?? 'promotionBoundary'],
      error,
    );
  }
}

async function recoverPostPromotionFailure(context, _requestedStatus, failedGates, error) {
  let terminal = 'NO_CHANGE';
  let reason = `NO_CHANGE:post-promotion:${error.message}`;
  try {
    await rollbackFromImmutableBackups(context);
    await verifyBackupsAgainstOriginalLiterals(context);
    context.manifest.production = [];
    context.manifest.productionState = 'ROLLED_BACK';
  } catch (rollbackError) {
    terminal = 'BLOCKED';
    context.manifest.productionState = 'UNKNOWN';
    reason = `BLOCKED:post-promotion:${error.message}; rollback failed: ${rollbackError.message}`;
  }
  transitionStatus(context.manifest, terminal);
  context.manifest.failure = { sourceId: null, format: null, quality: null, failedGates, reason };
  await writeJsonAtomic(context.paths.runRoot, context.paths.manifest, context.manifest, context.dependencies);
  return context.manifest;
}

function parseCli(argv) {
  const command = argv[0];
  if (!['characterize', 'run', 'recover', 'verify-production', 'report'].includes(command))
    throw new Error('Unknown rollout command.');
  const values = Object.create(null);
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!['--run-id', '--implementation-baseline'].includes(flag) || typeof value !== 'string')
      throw new Error('Invalid rollout CLI arguments.');
    if (values[flag] !== undefined) throw new Error('Duplicate rollout CLI flag.');
    values[flag] = value;
  }
  if (
    values['--run-id'] !== 'phase-6c-rollout-20260901-01' ||
    !/^[0-9a-f]{40}$/u.test(values['--implementation-baseline'])
  )
    throw new Error('Rollout CLI identity is invalid.');
  return { command, runId: values['--run-id'], implementationBaseline: values['--implementation-baseline'] };
}

export async function main(argv, injectedDependencies) {
  let output;
  let observedManifest = null;
  try {
    const parsed = parseCli(argv);
    const dependencies = { ...defaultDependencies(), ...(injectedDependencies ?? Object.create(null)) };
    const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const paths = resolveRolloutPaths(repositoryRoot, parsed.runId);
    if (parsed.command === 'characterize') {
      if (dependencies.preflight) {
        const failure = await dependencies.preflight(parsed.command, null);
        if (failure) throw new Error(failure);
      } else await preflightRollout(parsed.command, repositoryRoot, parsed.implementationBaseline, dependencies);
      if (dependencies.assertGenerationBoundary)
        await dependencies.assertGenerationBoundary(repositoryRoot, parsed.implementationBaseline);
      else await assertGenerationBoundary(repositoryRoot, parsed.implementationBaseline, dependencies);
      const manifest = dependencies.characterizeRollout
        ? await dependencies.characterizeRollout(repositoryRoot, paths, parsed, dependencies)
        : await characterize(repositoryRoot, paths, parsed, dependencies);
      output = {
        command: parsed.command,
        status: manifest.status,
        exitCode: 0,
        sources: 16,
        sourceBytes: 103076167,
        mp4Targets: 16,
        webmTargets: 16,
        productionState: 'UNCHANGED',
        production: [],
      };
    } else {
      const loadedManifest = dependencies.loadManifest
        ? await dependencies.loadManifest(paths)
        : JSON.parse((await dependencies.readFile(paths.manifest)).toString('utf8'));
      observedManifest = {
        productionState: ['UNCHANGED', 'VERIFIED', 'ROLLED_BACK', 'UNKNOWN'].includes(loadedManifest?.productionState)
          ? loadedManifest.productionState
          : 'UNKNOWN',
        production: Array.isArray(loadedManifest?.production) ? loadedManifest.production : null,
      };
      const manifest = validateManifest(loadedManifest);
      observedManifest = manifest;
      if (manifest.implementationBaseline !== parsed.implementationBaseline)
        throw new Error('CLI baseline differs from manifest.');
      const context = {
        repositoryRoot,
        runId: parsed.runId,
        implementationBaseline: parsed.implementationBaseline,
        paths,
        manifest,
        dependencies,
        filesystemReceipts: dependencies.audit ?? manifest.filesystemReceipts,
      };
      if (
        ['run', 'recover'].includes(parsed.command) &&
        manifest.promotionAttempt?.mutationStarted &&
        manifest.status !== 'PROMOTED'
      ) {
        if (dependencies.preflight) {
          const failure = await dependencies.preflight('recover', manifest);
          if (failure) throw new Error(failure);
        } else await preflightRollout('recover', repositoryRoot, parsed.implementationBaseline, dependencies);
        const recovered = dependencies.recoverInterruptedPromotion
          ? await dependencies.recoverInterruptedPromotion(context)
          : await recoverInterruptedPromotion(context);
        output = manifestResult(parsed.command, recovered);
      } else {
        if (dependencies.preflight) {
          const failure = await dependencies.preflight(parsed.command, manifest);
          if (failure) throw new Error(failure);
        } else await preflightRollout(parsed.command, repositoryRoot, parsed.implementationBaseline, dependencies);
        if (parsed.command === 'run') {
          if (dependencies.assertGenerationBoundary)
            await dependencies.assertGenerationBoundary(repositoryRoot, parsed.implementationBaseline);
          else await assertGenerationBoundary(repositoryRoot, parsed.implementationBaseline, dependencies);
        }
        if (parsed.command === 'recover') {
          if (manifest.status !== 'PROMOTED') throw new Error('Recover found no valid interrupted intent ledger.');
          output = manifestResult(parsed.command, manifest);
        } else if (parsed.command === 'run') {
          const generated = dependencies.runCandidateBatch
            ? await dependencies.runCandidateBatch(context)
            : await runCandidateBatch(context);
          const terminal =
            generated.status === 'VALIDATED'
              ? dependencies.promoteValidatedBatch
                ? await dependencies.promoteValidatedBatch({ ...context, manifest: generated })
                : await promoteValidatedBatch({ ...context, manifest: generated })
              : generated;
          output = manifestResult(parsed.command, terminal);
        } else if (parsed.command === 'verify-production')
          output = manifestResult(
            parsed.command,
            dependencies.verifyProduction
              ? await dependencies.verifyProduction(context)
              : await verifyProduction(context),
          );
        else {
          const report = dependencies.reportPromotedRollout
            ? await dependencies.reportPromotedRollout(context)
            : await reportPromotedRollout(context);
          output =
            report.status === 'ROLLOUT_READY_LOCAL'
              ? {
                  ...report,
                  command: parsed.command,
                  status: 'PROMOTED',
                  productionState: 'VERIFIED',
                  verdict: 'ROLLOUT_READY_LOCAL',
                  exitCode: 0,
                }
              : manifestResult(parsed.command, report);
        }
      }
    }
  } catch (error) {
    const productionState = observedManifest?.productionState ?? 'UNCHANGED';
    output = {
      command: argv[0] ?? null,
      status: 'BLOCKED',
      exitCode: 1,
      reason: error.message,
      productionState,
      production:
        productionState === 'VERIFIED'
          ? observedManifest.production
          : productionState === 'UNKNOWN'
            ? (observedManifest?.production ?? null)
            : [],
    };
  }
  console.log(JSON.stringify(output));
  process.exitCode = output.exitCode;
  return output.exitCode;
}

export function manifestResult(command, manifest) {
  const exitCode = manifest.status === 'PROMOTED' ? 0 : manifest.status === 'NO_CHANGE' ? 2 : 1;
  return {
    command,
    status: manifest.status,
    exitCode,
    reason: manifest.failure?.reason ?? null,
    productionState: manifest.productionState,
    aggregate: manifest.aggregate,
    production: manifest.production.map(({ path: productionPath, bytes, sha256, format }) => ({
      path: productionPath,
      bytes,
      sha256,
      format,
    })),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  void main(process.argv.slice(2));
}
```

The immutable backup files remain after `PROMOTED`; they are the only VMAF references after promotion. `report` first validates every backup against the original literal byte/hash contract, recomputes VMAF with candidate input 0 and backup input 1, and rejects stale receipts. `verify-production` validates promoted production paths only against `manifest.production`; it must never call the pre-promotion production-path `verifyImmutableSources`. Candidate browser evidence records exact events `['loadeddata','playing','ended']`, `error === null`, candidate URL, and Chromium version for all 32 candidates. Do not import or edit the completed pilot harness.

- [ ] **Step 6: Run GREEN and focused static checks**

Run:

```powershell
$phase6cBaseline = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Harness GREEN baseline capture failed.' }
if ($phase6cBaseline -notmatch '^[0-9a-f]{40}$') { throw 'Implementation baseline is not a full SHA.' }
npx vitest run tests/hero-video-rollout.test.ts
if ($LASTEXITCODE -ne 0) { throw 'Harness focused tests failed.' }
npx prettier --check scripts/hero-video-rollout.mjs tests/hero-video-rollout.test.ts
if ($LASTEXITCODE -ne 0) { throw 'Harness Prettier check failed.' }
node --check scripts/hero-video-rollout.mjs
if ($LASTEXITCODE -ne 0) { throw 'Harness Node syntax check failed.' }
git diff --check -- scripts/hero-video-rollout.mjs tests/hero-video-rollout.test.ts
if ($LASTEXITCODE -ne 0) { throw 'Harness diff check failed.' }
```

Expected: Vitest `1 file / 20 tests passed`; Prettier, Node syntax, and diff checks exit 0. No FFmpeg encode or production media mutation occurs.

- [ ] **Step 7: Fresh Sol Medium Task 1 review**

Dispatch fresh isolated `gpt-5.6-sol` at `medium` reasoning with exact Task 1 diff, approved design/brief/evidence, pilot recipe excerpt, and four fresh command outputs. Require `READY` or `NOT READY`, Critical/Important/Minor counts, exact inventory/retry/VMAF/promotion/rollback review, no broad pilot-harness refactor, portfolio proportionality, and confirmation that no production media was touched. Resolve all Critical/Important findings, rerun only affected focused checks, and obtain `READY` before continuing.

- [ ] **Step 8: Stage exact Task 1 paths and commit locally**

Run:

```powershell
$phase6cBaseline = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Task 1 commit baseline capture failed.' }
if ($phase6cBaseline -notmatch '^[0-9a-f]{40}$') { throw 'Implementation baseline is not a full SHA.' }
$identity = Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-rollout/git-identity.json' -Raw | ConvertFrom-Json
function Assert-ConfirmedGitIdentity { param($Receipt); if (-not $Receipt.userConfirmed) { throw 'Git identity receipt is not user-confirmed.' }; foreach ($variable in @('GIT_AUTHOR_IDENT','GIT_COMMITTER_IDENT')) { $raw = & git var $variable; if ($LASTEXITCODE -ne 0 -or $raw -notmatch '^(?<name>.+) <(?<email>[^>]+)> \d+ [+-]\d{4}$' -or $Matches.name -cne [string]$Receipt.userName -or $Matches.email -cne [string]$Receipt.userEmail) { throw "$variable differs from user-confirmed Git identity." } } }
Assert-ConfirmedGitIdentity $identity
git add -- scripts/hero-video-rollout.mjs tests/hero-video-rollout.test.ts
if ($LASTEXITCODE -ne 0) { throw 'Task 1 exact staging failed.' }
$expectedTask1 = @('scripts/hero-video-rollout.mjs','tests/hero-video-rollout.test.ts') | Sort-Object
$staged = @(git diff --cached --name-only | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Task 1 staged-path lookup failed.' }
if (Compare-Object $expectedTask1 $staged) { throw 'Task 1 staged-path contract failed.' }
& git commit -m "test: add hero video rollout harness"
if ($LASTEXITCODE -ne 0) { throw 'Task 1 commit failed.' }
$task1Commit = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Task 1 commit SHA capture failed.' }
$task1Parent = git rev-parse HEAD^
if ($LASTEXITCODE -ne 0) { throw 'Task 1 parent capture failed.' }
if ($task1Commit -notmatch '^[0-9a-f]{40}$' -or $task1Parent -ne $phase6cBaseline) { throw 'Task 1 commit chain failed.' }
$task1Paths = @(git diff-tree --no-commit-id --name-only -r $task1Commit | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Task 1 commit path lookup failed.' }
if (Compare-Object $expectedTask1 $task1Paths) { throw 'Task 1 commit path set failed.' }
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = [ordered]@{ implementationBaseline = $phase6cBaseline; currentTip = $task1Commit; gitIdentity = [ordered]@{ userName=[string]$identity.userName; userEmail=[string]$identity.userEmail; userConfirmed=$true }; task1 = $task1Commit; task2 = $null; task3 = $null; remediation = @(); task4 = $null }
$ledgerTemp = "$ledgerPath.partial"
$bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(($ledger | ConvertTo-Json -Depth 8) + "`n")
$stream = [System.IO.File]::Open($ledgerTemp,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
Move-Item -LiteralPath $ledgerTemp -Destination $ledgerPath
```

Expected: one local commit containing exactly two paths. Stop as `BLOCKED` before commit if identity is not the user's configured identity, protected hashes drift, the reviewer is not `READY`, or any focused check fails.

---

### Task 2: Generate, validate, and atomically promote all thirty-two production candidates

**Files:**

- Modify: `tests/evironn-hero-assets.test.ts`
- Modify: the exact sixteen MP4 paths in `MP4_PROMOTION_ALLOWLIST`
- Create: the exact sixteen WebM paths in `WEBM_PROMOTION_ALLOWLIST`
- Read/execute only: `scripts/hero-video-rollout.mjs`
- Evidence only, ignored: `.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/`

**Interfaces:**

- Consumes: Task 1 CLI and manifest contracts; the immutable implementation baseline captured in Task 1; all literal allowlists.
- Produces: exactly 32 validated production media files, a `PROMOTED` ignored manifest with per-file original/candidate bytes, hashes, probe/VMAF/browser receipts, selected quality, aggregate bytes/math, and rollback backup identities; updated exact binary contract in `tests/evironn-hero-assets.test.ts`.

- [ ] **Step 1: Re-run preflight and characterization with a fixed run identity**

Run:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$phase6cBaseline = [string]$ledger.implementationBaseline
$task1Commit = [string]$ledger.task1
$task1Parent = git rev-parse "$task1Commit^"; if ($LASTEXITCODE -ne 0 -or $task1Parent -ne $phase6cBaseline) { throw 'Task 1 parent does not equal implementation baseline.' }
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne $task1Commit) { throw 'Unexpected commit exists after Task 1.' }
git cat-file -e "$phase6cBaseline`:docs/superpowers/specs/2026-09-01-phase-6c-hero-video-rollout-planning-brief.md"
if ($LASTEXITCODE -ne 0) { throw 'Task 2 planning brief baseline check failed.' }
git cat-file -e "$phase6cBaseline`:docs/superpowers/plans/2026-09-01-phase-6c-hero-video-rollout.md"
if ($LASTEXITCODE -ne 0) { throw 'Task 2 plan baseline check failed.' }
$raw = @(& node scripts/hero-video-rollout.mjs characterize --run-id phase-6c-rollout-20260901-01 --implementation-baseline $phase6cBaseline)
$exit = $LASTEXITCODE
if ($raw.Count -ne 1) { throw 'Characterize must emit exactly one JSON line.' }
$characterized = $raw[0] | ConvertFrom-Json
if (Compare-Object @('command','exitCode','mp4Targets','production','productionState','sourceBytes','sources','status','webmTargets') @($characterized.PSObject.Properties.Name | Sort-Object)) { throw 'Characterize JSON schema failed.' }
if ($exit -ne 0 -or $characterized.exitCode -ne 0 -or $characterized.command -ne 'characterize' -or $characterized.status -ne 'CHARACTERIZED' -or $characterized.productionState -ne 'UNCHANGED' -or $characterized.sources -ne 16 -or $characterized.sourceBytes -ne 103076167 -or $characterized.mp4Targets -ne 16 -or $characterized.webmTargets -ne 16 -or @($characterized.production).Count -ne 0) { throw "Characterize failed: $($raw[0])" }
if ($characterized.command -isnot [string] -or $characterized.status -isnot [string] -or $characterized.productionState -isnot [string] -or ($characterized.exitCode -isnot [long] -and $characterized.exitCode -isnot [int]) -or ($characterized.sources -isnot [long] -and $characterized.sources -isnot [int]) -or ($characterized.sourceBytes -isnot [long] -and $characterized.sourceBytes -isnot [int]) -or ($characterized.mp4Targets -isnot [long] -and $characterized.mp4Targets -isnot [int]) -or ($characterized.webmTargets -isnot [long] -and $characterized.webmTargets -isnot [int]) -or $null -eq $characterized.production) { throw 'Characterize JSON type or nullability failed.' }
```

The baseline lookup deliberately points to the parent of the Task 1 commit, which must be the coordinator planning commit. Expected one JSON line with `command="characterize"`, `status="CHARACTERIZED"`, `exitCode=0`, `sources=16`, `sourceBytes=103076167`, `mp4Targets=16`, `webmTargets=16`, and empty `production`; exact tool capabilities present; production unchanged. If commit ancestry differs, derive the coordinator planning commit by proving both documents exist and Task 1 paths do not, then pass its full SHA; never use an unproved hash.

- [ ] **Step 2: Run the binding inventory-driven candidate batch and promotion command**

Run exactly once:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$phase6cBaseline = [string]$ledger.implementationBaseline
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip) { throw 'Ledger tip differs from HEAD.' }
$raw = @(& node scripts/hero-video-rollout.mjs run --run-id phase-6c-rollout-20260901-01 --implementation-baseline $phase6cBaseline)
$exit = $LASTEXITCODE
if ($raw.Count -ne 1) { throw 'Run must emit exactly one JSON line.' }
$runResult = $raw[0] | ConvertFrom-Json
if (Compare-Object @('aggregate','command','exitCode','production','productionState','reason','status') @($runResult.PSObject.Properties.Name | Sort-Object)) { throw 'Run JSON schema failed.' }
if ($exit -ne 0 -or $runResult.exitCode -ne 0 -or $runResult.command -ne 'run' -or $runResult.status -ne 'PROMOTED' -or $runResult.productionState -ne 'VERIFIED') { throw "Run stopped with terminal status: $($raw[0])" }
if ($null -ne $runResult.reason) { throw 'Successful run reason must be null.' }
if (Compare-Object @('originalBytes','passed','reductionBytes','reductionPercent','webmBytes') @($runResult.aggregate.PSObject.Properties.Name | Sort-Object)) { throw 'Run aggregate schema failed.' }
if ($runResult.aggregate.originalBytes -isnot [long] -and $runResult.aggregate.originalBytes -isnot [int]) { throw 'Run aggregate originalBytes type failed.' }
if ($runResult.aggregate.webmBytes -isnot [long] -and $runResult.aggregate.webmBytes -isnot [int]) { throw 'Run aggregate webmBytes type failed.' }
if ($runResult.aggregate.reductionBytes -isnot [long] -and $runResult.aggregate.reductionBytes -isnot [int]) { throw 'Run aggregate reductionBytes type failed.' }
if ($runResult.aggregate.reductionPercent -isnot [double] -and $runResult.aggregate.reductionPercent -isnot [decimal] -and $runResult.aggregate.reductionPercent -isnot [long] -and $runResult.aggregate.reductionPercent -isnot [int]) { throw 'Run aggregate reductionPercent type failed.' }
if ($runResult.aggregate.passed -isnot [bool]) { throw 'Run aggregate passed type failed.' }
if (@($runResult.production).Count -ne 32 -or @($runResult.production | Where-Object format -eq 'webm').Count -ne 16 -or @($runResult.production | Where-Object format -eq 'mp4').Count -ne 16) { throw 'Run production identity count failed.' }
foreach ($item in @($runResult.production)) {
  if (Compare-Object @('bytes','format','path','sha256') @($item.PSObject.Properties.Name | Sort-Object)) { throw 'Run production item schema failed.' }
  if ($item.path -isnot [string] -or $item.format -notin @('mp4','webm') -or ($item.bytes -isnot [long] -and $item.bytes -isnot [int]) -or $item.sha256 -isnot [string]) { throw 'Run production item type failed.' }
}
if ($runResult.aggregate.originalBytes -ne 103076167 -or $runResult.aggregate.webmBytes -gt 61845700 -or -not $runResult.aggregate.passed -or $runResult.aggregate.reductionPercent -lt 40) { throw 'Run aggregate math failed.' }
```

Expected one JSON line with `command="run"`, `status="PROMOTED"`, `exitCode=0`, exactly 16 WebM plus 16 MP4 production identities, `aggregate.originalBytes=103076167`, integer `aggregate.webmBytes <= 61845700`, and `aggregate.reductionPercent >= 40`. The single command must iterate all 16 literal inventory entries and create/validate both formats; no hand-written per-file FFmpeg loop is allowed.

If any primary fails, the manifest must show exactly one allowed higher-quality retry for that source/format. If retry or aggregate gate fails, expected outcome is `NO_CHANGE`, all original MP4 hashes remain immutable, no production WebM exists, and this task stops without a commit. Missing tools, baseline/protected drift, unsafe workspace state, or promotion/rollback uncertainty yields `BLOCKED` and stops without a commit.

If the process is interrupted after a durable promotion intent, run the bounded recovery command once and stop:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$phase6cBaseline = [string]$ledger.implementationBaseline
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip) { throw 'Recovery ledger tip differs from HEAD.' }
$recoverRaw = @(& node scripts/hero-video-rollout.mjs recover --run-id phase-6c-rollout-20260901-01 --implementation-baseline $phase6cBaseline)
$recoverExit = $LASTEXITCODE
if ($recoverRaw.Count -ne 1) { throw 'Recover must emit exactly one JSON line.' }
$recovered = $recoverRaw[0] | ConvertFrom-Json
if (Compare-Object @('aggregate','command','exitCode','production','productionState','reason','status') @($recovered.PSObject.Properties.Name | Sort-Object)) { throw 'Recover JSON schema failed.' }
if ($recovered.command -ne 'recover') { throw 'Recover command identity failed.' }
if ($recovered.command -isnot [string] -or $recovered.status -isnot [string] -or $recovered.productionState -isnot [string] -or ($recovered.exitCode -isnot [long] -and $recovered.exitCode -isnot [int]) -or $recovered.reason -isnot [string] -or $null -eq $recovered.aggregate -or $null -eq $recovered.production) { throw 'Recover JSON type or nullability failed.' }
if ($recovered.status -eq 'NO_CHANGE' -and $recoverExit -eq 2 -and $recovered.exitCode -eq 2 -and $recovered.productionState -eq 'ROLLED_BACK' -and @($recovered.production).Count -eq 0) { Write-Output $recoverRaw[0]; throw 'NO_CHANGE: interrupted promotion rolled back and verified; stop.' }
if ($recovered.status -eq 'BLOCKED' -and $recoverExit -eq 1 -and $recovered.exitCode -eq 1 -and $recovered.productionState -eq 'UNKNOWN' -and $null -ne $recovered.production) { Write-Output $recoverRaw[0]; throw 'BLOCKED: recovery could not prove rollback; stop.' }
throw "Unexpected recover result: $($recoverRaw[0])"
```

- [ ] **Step 3: Verify production identity and all-or-nothing evidence**

Run:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$phase6cBaseline = [string]$ledger.implementationBaseline
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip) { throw 'Ledger tip differs from HEAD.' }
$manifest = Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/manifest.json' -Raw | ConvertFrom-Json
$expectedMp4 = @(
  'public/assets/hero/bedroom-bed-forward.mp4','public/assets/hero/bedroom-bed-reverse.mp4','public/assets/hero/bedroom-chair-forward.mp4','public/assets/hero/bedroom-chair-reverse.mp4',
  'public/assets/hero/chair-forward.mp4','public/assets/hero/chair-reverse.mp4','public/assets/hero/kitchen-dining-forward.mp4','public/assets/hero/kitchen-dining-reverse.mp4',
  'public/assets/hero/kitchen-island-forward.mp4','public/assets/hero/kitchen-island-reverse.mp4','public/assets/hero/sofa-forward.mp4','public/assets/hero/sofa-reverse.mp4',
  'public/assets/hero/terrace-chair-forward.mp4','public/assets/hero/terrace-chair-reverse.mp4','public/assets/hero/terrace-sofa-forward.mp4','public/assets/hero/terrace-sofa-reverse.mp4'
)
$expectedMedia = @(($expectedMp4 + @($expectedMp4 | ForEach-Object { $_ -replace '\.mp4$','.webm' })) | Sort-Object)
if (Compare-Object $expectedMedia @($manifest.production.path | Sort-Object)) { throw 'PROMOTED manifest does not equal exact 32-path allowlist.' }
function Restore-ExactMediaIndex {
  git restore --staged -- $expectedMedia
  if ($LASTEXITCODE -ne 0) { throw 'Exact media index restore failed.' }
  $remaining = @(git diff --cached --name-only | Sort-Object)
  if ($LASTEXITCODE -ne 0 -or $remaining.Count -ne 0) { throw 'Exact media index restore did not produce an empty index.' }
}
git add -- $expectedMedia
if ($LASTEXITCODE -ne 0) { Restore-ExactMediaIndex; throw 'Task 2 media staging failed.' }
$stagedMedia = @(git diff --cached --name-only | Sort-Object); if ($LASTEXITCODE -ne 0 -or (Compare-Object $expectedMedia $stagedMedia)) { Restore-ExactMediaIndex; throw 'Pre-verification staged media set failed.' }
$verifyRaw = @(& node scripts/hero-video-rollout.mjs verify-production --run-id phase-6c-rollout-20260901-01 --implementation-baseline $phase6cBaseline)
$verifyExit = $LASTEXITCODE
try {
  if ($verifyRaw.Count -ne 1) { throw 'Verify must emit exactly one JSON line.' }
  $verified = $verifyRaw[0] | ConvertFrom-Json -ErrorAction Stop
} catch { Restore-ExactMediaIndex; throw }
if (Compare-Object @('aggregate','command','exitCode','production','productionState','reason','status') @($verified.PSObject.Properties.Name | Sort-Object)) { Restore-ExactMediaIndex; throw 'Verify JSON schema failed.' }
if ($verifyExit -ne 0 -or $verified.exitCode -ne 0 -or $verified.command -ne 'verify-production' -or $verified.status -ne 'PROMOTED' -or $verified.productionState -ne 'VERIFIED' -or $null -ne $verified.reason -or @($verified.production).Count -ne 32) { Restore-ExactMediaIndex; throw "Verify stopped and exact media index was restored: $($verifyRaw[0])" }
$reportRaw = @(& node scripts/hero-video-rollout.mjs report --run-id phase-6c-rollout-20260901-01 --implementation-baseline $phase6cBaseline)
$reportExit = $LASTEXITCODE
try {
  if ($reportRaw.Count -ne 1) { throw 'Report must emit exactly one JSON line.' }
  $report = $reportRaw[0] | ConvertFrom-Json -ErrorAction Stop
} catch { Restore-ExactMediaIndex; throw }
if (Compare-Object @('aggregate','backups','command','exitCode','playbackReceipts','production','productionState','refreshedVmaf','status','verdict') @($report.PSObject.Properties.Name | Sort-Object)) { Restore-ExactMediaIndex; throw 'Report JSON schema failed.' }
if ($reportExit -ne 0 -or $report.exitCode -ne 0 -or $report.command -ne 'report' -or $report.status -ne 'PROMOTED' -or $report.productionState -ne 'VERIFIED' -or $report.verdict -ne 'ROLLOUT_READY_LOCAL' -or @($report.production).Count -ne 32 -or @($report.refreshedVmaf).Count -ne 32 -or $report.backups -ne 16 -or $report.playbackReceipts -ne 32 -or $report.aggregate.originalBytes -ne 103076167 -or $report.aggregate.webmBytes -gt 61845700 -or $report.aggregate.reductionPercent -lt 40 -or -not $report.aggregate.passed) { Restore-ExactMediaIndex; throw "Report stopped and exact media index was restored: $($reportRaw[0])" }
foreach ($aggregateValue in @($verified.aggregate,$report.aggregate)) {
  if (Compare-Object @('originalBytes','passed','reductionBytes','reductionPercent','webmBytes') @($aggregateValue.PSObject.Properties.Name | Sort-Object)) { Restore-ExactMediaIndex; throw 'CLI aggregate schema failed.' }
  if (($aggregateValue.originalBytes -isnot [long] -and $aggregateValue.originalBytes -isnot [int]) -or ($aggregateValue.webmBytes -isnot [long] -and $aggregateValue.webmBytes -isnot [int]) -or ($aggregateValue.reductionBytes -isnot [long] -and $aggregateValue.reductionBytes -isnot [int]) -or ($aggregateValue.reductionPercent -isnot [double] -and $aggregateValue.reductionPercent -isnot [decimal] -and $aggregateValue.reductionPercent -isnot [long] -and $aggregateValue.reductionPercent -isnot [int]) -or $aggregateValue.passed -isnot [bool]) { Restore-ExactMediaIndex; throw 'CLI aggregate type failed.' }
}
foreach ($result in @($verified,$report)) {
  if (Compare-Object $expectedMedia @($result.production.path | Sort-Object)) { Restore-ExactMediaIndex; throw 'CLI production path set failed.' }
  foreach ($item in @($result.production)) {
    $manifestItem = $manifest.production | Where-Object path -eq $item.path
    if (Compare-Object @('bytes','format','path','sha256') @($item.PSObject.Properties.Name | Sort-Object)) { Restore-ExactMediaIndex; throw 'CLI production item schema failed.' }
    if ($null -eq $manifestItem -or $item.path -isnot [string] -or $item.format -notin @('mp4','webm') -or ($item.bytes -isnot [long] -and $item.bytes -isnot [int]) -or $item.sha256 -isnot [string] -or $item.format -ne [IO.Path]::GetExtension($item.path).TrimStart('.') -or $item.bytes -ne $manifestItem.bytes -or $item.sha256 -cne $manifestItem.sha256 -or $item.bytes -lt 1 -or $item.sha256 -notmatch '^[0-9a-f]{64}$') { Restore-ExactMediaIndex; throw "CLI production identity failed: $($item.path)" }
  }
}
foreach ($item in @($report.refreshedVmaf)) {
  if ((Compare-Object @('format','sourceId','value') @($item.PSObject.Properties.Name | Sort-Object)) -or $item.sourceId -isnot [string] -or $item.format -notin @('mp4','webm') -or ($item.value -isnot [double] -and $item.value -isnot [decimal] -and $item.value -isnot [long] -and $item.value -isnot [int]) -or $item.value -lt 95) { Restore-ExactMediaIndex; throw 'Refreshed VMAF schema or identity failed.' }
}
```

Expected: the exact 32 media paths are staged first so both commands can prove their Git LFS index identities; each command then emits one JSON line with `status="PROMOTED"`, `exitCode=0`, and exactly 32 `{ path, bytes, sha256, format }` production identities. `verify-production` checks only the 32 promoted files against `manifest.production`. `report` rehashes 16 immutable backup files against the original literal 16-row byte/hash inventory, recomputes all 32 VMAF values with each promoted candidate as distorted input and its backup as reference, validates the unique 32 final-attempt successful `ended` receipts, exact source dimensions, and integer reduction PASS. The 16 backups and their manifest identities remain immutable after promotion. Any mismatch triggers exact allowlist rollback from those backups, removal only of WebMs recorded as created by the current promotion attempt, verification that all 16 WebM targets are absent, exact current-attempt temporary cleanup, and restoration of only those 32 index entries. A verified rollback returns `NO_CHANGE`/`ROLLED_BACK`; a failed rollback returns `BLOCKED`/`UNKNOWN`; both stop immediately.

- [ ] **Step 4: Update the exact hero binary contract with measured promoted values**

Run `report`; copy its exact production `bytes` and `sha256` values into the corresponding 16 existing MP4 rows and add the 16 matching WebM rows in `tests/evironn-hero-assets.test.ts`. Change the inventory count from 29 to 45 and recompute the total from the 45 literal row values. Do not loosen any equality assertion, derive expected values from live files, or alter focus/idle rows.

- [ ] **Step 5: Run focused production asset checks**

Run:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip) { throw 'Ledger tip differs from HEAD.' }
npx vitest run tests/evironn-hero-assets.test.ts tests/hero-video-rollout.test.ts
if ($LASTEXITCODE -ne 0) { throw 'Task 2 focused tests failed.' }
npx prettier --check tests/evironn-hero-assets.test.ts
if ($LASTEXITCODE -ne 0) { throw 'Task 2 Prettier check failed.' }
$lfsIds = @(
  'bedroom-bed-forward','bedroom-bed-reverse','bedroom-chair-forward','bedroom-chair-reverse',
  'chair-forward','chair-reverse','kitchen-dining-forward','kitchen-dining-reverse',
  'kitchen-island-forward','kitchen-island-reverse','sofa-forward','sofa-reverse',
  'terrace-chair-forward','terrace-chair-reverse','terrace-sofa-forward','terrace-sofa-reverse'
)
$lfsExpectedMedia = @($lfsIds | ForEach-Object { "public/assets/hero/$_.mp4"; "public/assets/hero/$_.webm" } | Sort-Object)
$lfsActual = @(git check-attr filter -- $lfsExpectedMedia | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Task 2 exact LFS attribute lookup failed.' }
$lfsExpectedLines = @($lfsExpectedMedia | ForEach-Object { "$_`: filter: lfs" } | Sort-Object)
if ($lfsActual.Count -ne 32 -or (Compare-Object $lfsExpectedLines $lfsActual)) { throw 'Task 2 LFS output must be exactly 32 filter: lfs lines.' }
git diff --check -- tests/evironn-hero-assets.test.ts
if ($LASTEXITCODE -ne 0) { throw 'Task 2 diff check failed.' }
```

Expected: Vitest `2 files / 22 tests passed`; Prettier/diff exit 0; exactly 32 expected paths report `filter: lfs`. If the existing two binary tests remain two plus Task 1's 20, total is exactly 22; any added named assertion must be reflected in the task receipt rather than hidden.

- [ ] **Step 6: Fresh Sol Medium Task 2 review**

Dispatch fresh isolated `gpt-5.6-sol` at `medium` reasoning with exact Task 2 media path list, `PROMOTED` report summary, source and production hashes/bytes, gate math, focused output, and no raw media bytes. Require `READY` or `NOT READY`, Critical/Important/Minor counts, source immutability, retry bounds, all-or-nothing promotion/rollback, per-file VMAF/stream/browser gates, aggregate math, LFS, changed-path boundary, and portfolio proportionality. Resolve Critical/Important findings before proceeding; remediation may touch only Task 2 paths and reruns only affected focused checks.

- [ ] **Step 7: Stage exactly 33 Task 2 tracked paths and commit locally**

Run explicit staging only:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$phase6cBaseline = [string]$ledger.implementationBaseline
$task1Commit = [string]$ledger.task1
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip -or [string]$ledger.currentTip -ne $task1Commit) { throw 'Task 2 commit precondition failed.' }
git add -- tests/evironn-hero-assets.test.ts public/assets/hero/bedroom-bed-forward.mp4 public/assets/hero/bedroom-bed-forward.webm public/assets/hero/bedroom-bed-reverse.mp4 public/assets/hero/bedroom-bed-reverse.webm public/assets/hero/bedroom-chair-forward.mp4 public/assets/hero/bedroom-chair-forward.webm public/assets/hero/bedroom-chair-reverse.mp4 public/assets/hero/bedroom-chair-reverse.webm public/assets/hero/chair-forward.mp4 public/assets/hero/chair-forward.webm public/assets/hero/chair-reverse.mp4 public/assets/hero/chair-reverse.webm public/assets/hero/kitchen-dining-forward.mp4 public/assets/hero/kitchen-dining-forward.webm public/assets/hero/kitchen-dining-reverse.mp4 public/assets/hero/kitchen-dining-reverse.webm public/assets/hero/kitchen-island-forward.mp4 public/assets/hero/kitchen-island-forward.webm public/assets/hero/kitchen-island-reverse.mp4 public/assets/hero/kitchen-island-reverse.webm public/assets/hero/sofa-forward.mp4 public/assets/hero/sofa-forward.webm public/assets/hero/sofa-reverse.mp4 public/assets/hero/sofa-reverse.webm public/assets/hero/terrace-chair-forward.mp4 public/assets/hero/terrace-chair-forward.webm public/assets/hero/terrace-chair-reverse.mp4 public/assets/hero/terrace-chair-reverse.webm public/assets/hero/terrace-sofa-forward.mp4 public/assets/hero/terrace-sofa-forward.webm public/assets/hero/terrace-sofa-reverse.mp4 public/assets/hero/terrace-sofa-reverse.webm
if ($LASTEXITCODE -ne 0) { throw 'Task 2 exact staging failed.' }
$manifest = Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/manifest.json' -Raw | ConvertFrom-Json
$expectedMedia = @($manifest.production.path | Sort-Object)
$literalMedia = @(
  'public/assets/hero/bedroom-bed-forward.mp4','public/assets/hero/bedroom-bed-forward.webm','public/assets/hero/bedroom-bed-reverse.mp4','public/assets/hero/bedroom-bed-reverse.webm',
  'public/assets/hero/bedroom-chair-forward.mp4','public/assets/hero/bedroom-chair-forward.webm','public/assets/hero/bedroom-chair-reverse.mp4','public/assets/hero/bedroom-chair-reverse.webm',
  'public/assets/hero/chair-forward.mp4','public/assets/hero/chair-forward.webm','public/assets/hero/chair-reverse.mp4','public/assets/hero/chair-reverse.webm',
  'public/assets/hero/kitchen-dining-forward.mp4','public/assets/hero/kitchen-dining-forward.webm','public/assets/hero/kitchen-dining-reverse.mp4','public/assets/hero/kitchen-dining-reverse.webm',
  'public/assets/hero/kitchen-island-forward.mp4','public/assets/hero/kitchen-island-forward.webm','public/assets/hero/kitchen-island-reverse.mp4','public/assets/hero/kitchen-island-reverse.webm',
  'public/assets/hero/sofa-forward.mp4','public/assets/hero/sofa-forward.webm','public/assets/hero/sofa-reverse.mp4','public/assets/hero/sofa-reverse.webm',
  'public/assets/hero/terrace-chair-forward.mp4','public/assets/hero/terrace-chair-forward.webm','public/assets/hero/terrace-chair-reverse.mp4','public/assets/hero/terrace-chair-reverse.webm',
  'public/assets/hero/terrace-sofa-forward.mp4','public/assets/hero/terrace-sofa-forward.webm','public/assets/hero/terrace-sofa-reverse.mp4','public/assets/hero/terrace-sofa-reverse.webm'
) | Sort-Object
if (Compare-Object $literalMedia $expectedMedia) { throw 'Manifest production media set failed.' }
$expectedTask2 = @('tests/evironn-hero-assets.test.ts') + $literalMedia | Sort-Object
$staged = @(git diff --cached --name-only | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Task 2 staged-path lookup failed.' }
if (Compare-Object $expectedTask2 $staged) { throw 'Task 2 staged-path set failed.' }
foreach ($mediaPath in $literalMedia) {
  $record = $manifest.production | Where-Object path -eq $mediaPath
  $pointer = @(git show ":$mediaPath")
  if ($LASTEXITCODE -ne 0) { throw "Task 2 staged LFS pointer lookup failed: $mediaPath" }
  if ($pointer.Count -ne 3 -or $pointer[0] -ne 'version https://git-lfs.github.com/spec/v1' -or $pointer[1] -ne "oid sha256:$($record.sha256)" -or $pointer[2] -ne "size $($record.bytes)") {
    throw "Invalid staged LFS pointer: $mediaPath"
  }
}
function Assert-ConfirmedGitIdentity { param($Receipt); if (-not $Receipt.userConfirmed) { throw 'Git identity receipt is not user-confirmed.' }; foreach ($variable in @('GIT_AUTHOR_IDENT','GIT_COMMITTER_IDENT')) { $raw = & git var $variable; if ($LASTEXITCODE -ne 0 -or $raw -notmatch '^(?<name>.+) <(?<email>[^>]+)> \d+ [+-]\d{4}$' -or $Matches.name -cne [string]$Receipt.userName -or $Matches.email -cne [string]$Receipt.userEmail) { throw "$variable differs from user-confirmed Git identity." } } }
Assert-ConfirmedGitIdentity $ledger.gitIdentity
& git commit -m "feat: promote compressed hero video assets"
if ($LASTEXITCODE -ne 0) { throw 'Task 2 commit failed.' }
$task2Commit = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Task 2 commit SHA capture failed.' }
$task2Parent = git rev-parse "$task2Commit^"; if ($LASTEXITCODE -ne 0 -or $task2Parent -ne $task1Commit) { throw 'Task 2 parent chain failed.' }
$task2Paths = @(git diff-tree --no-commit-id --name-only -r $task2Commit | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Task 2 commit path lookup failed.' }
if (Compare-Object $expectedTask2 $task2Paths) { throw 'Task 2 commit path set failed.' }
$freshLedger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
if ([string]$freshLedger.currentTip -ne $task1Commit) { throw 'Stale ledger update refused.' }
$freshLedger.task2 = $task2Commit; $freshLedger.currentTip = $task2Commit
$ledgerTemp = "$ledgerPath.partial"; $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(($freshLedger | ConvertTo-Json -Depth 8) + "`n")
$stream = [System.IO.File]::Open($ledgerTemp,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
Move-Item -LiteralPath $ledgerTemp -Destination $ledgerPath -Force
```

Expected: one local commit with exactly 33 tracked paths and LFS pointers for all media. Never stage ignored receipts or protected plans. Stop on any non-`READY` review or verification mismatch.

---

### Task 3: Integrate deterministic dual-source selection and one-time WebM fallback

**Files:**

- Modify: `components/evironn/home/hero-products.ts`
- Modify: `components/evironn/home/hero-product-media.tsx`
- Modify: `tests/evironn-hero-state.test.ts`
- Modify: `tests/evironn-hero-shell.test.tsx`

**Interfaces:**

- Consumes: all 16 WebM/MP4 runtime paths promoted by Task 2; existing `HeroPhase`, operation-token cleanup, callbacks, reduced-motion behavior, playback rate, focus-image state, and interaction-only video rendering.
- Produces: `export type HeroVideoSources = Readonly<{ webm: string; mp4: string }>`; `HeroProduct.forward: HeroVideoSources`; `HeroProduct.reverse: HeroVideoSources`; `export type HeroVideoFormat = 'webm' | 'mp4'`; `export type SelectedHeroVideoSource = Readonly<{ format: HeroVideoFormat; src: string }>`; `export function selectHeroVideoSource(sources: HeroVideoSources, canPlayType: (mime: string) => string): SelectedHeroVideoSource`.

- [ ] **Step 1: Write RED product-data and resolver contracts**

In `tests/evironn-hero-state.test.ts`, add two named tests: one exact inventory test and one resolver test. Assert that every `HERO_PRODUCTS` entry has `forward.webm`, `forward.mp4`, `reverse.webm`, and `reverse.mp4`; that the 32 values equal the literal promotion allowlist paths after replacing the `public` prefix with the public URL prefix; and that no product-card path appears. Add resolver cases:

```ts
expect(selectHeroVideoSource(sources, () => 'probably')).toEqual({ format: 'webm', src: sources.webm });
expect(selectHeroVideoSource(sources, () => 'maybe')).toEqual({ format: 'webm', src: sources.webm });
expect(selectHeroVideoSource(sources, () => '')).toEqual({ format: 'mp4', src: sources.mp4 });
expect(selectHeroVideoSource({ webm: '', mp4: sources.mp4 }, () => 'probably')).toEqual({
  format: 'mp4',
  src: sources.mp4,
});
```

The capability spy must assert the exact MIME string `video/webm; codecs="vp9"`.

- [ ] **Step 2: Write RED shell lifecycle and fallback contracts**

In `tests/evironn-hero-shell.test.tsx`, keep every current state/cleanup test and add named tests proving:

```text
poster-first render contains no hero transition video and no source
supported VP9 connects only the selected WebM forward or reverse source
unsupported/empty capability connects only the matching MP4 source
pre-loadeddata WebM error changes the same operation to matching MP4 once
late WebM error after MP4 assignment is ignored by operation, attempt, and assigned-source identity
late WebM loadeddata after MP4 assignment cannot reveal or play the MP4 attempt
MP4 error after fallback calls existing onFailure and releases source
WebM error after loadeddata/useful playback calls onFailure without fallback
stale WebM error from a cancelled operation cannot attach MP4
reduced motion never connects either format
```

Stub `HTMLMediaElement.prototype.canPlayType` per test and restore it in `afterEach`. Assert exact `src` attributes and absence of every unselected counterpart. Do not assert two `<source>` children because implementation must use one selected `video.src`.

- [ ] **Step 3: Run RED and capture contract failures**

Run:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip) { throw 'Ledger tip differs from HEAD.' }
npx vitest run tests/evironn-hero-state.test.ts tests/evironn-hero-shell.test.tsx
$task3RedExit = $LASTEXITCODE; if ($task3RedExit -eq 0) { throw 'Task 3 RED unexpectedly passed.' }
```

Expected: FAIL on missing `forward`/`reverse` source pairs and missing `selectHeroVideoSource`; existing tests remain diagnostically intact.

- [ ] **Step 4: Replace product direction strings with exact source pairs**

In `components/evironn/home/hero-products.ts`, use this exact type shape and apply it to all eight products:

```ts
export type HeroVideoSources = Readonly<{ webm: string; mp4: string }>;

export type HeroProduct = {
  id: HeroProductId;
  roomId: AvailableHeroRoomId;
  name: string;
  category: string;
  price: string;
  forward: HeroVideoSources;
  reverse: HeroVideoSources;
  focusSrc: string;
  playbackRate: number;
  mediaClassName: string;
  hotspotClassName: string;
  href: string | null;
};
```

Use these literal direction fields in the corresponding eight existing product objects:

```ts
const heroVideoSources = {
  sofa: {
    forward: { webm: '/assets/hero/sofa-forward.webm', mp4: '/assets/hero/sofa-forward.mp4' },
    reverse: { webm: '/assets/hero/sofa-reverse.webm', mp4: '/assets/hero/sofa-reverse.mp4' },
  },
  chair: {
    forward: { webm: '/assets/hero/chair-forward.webm', mp4: '/assets/hero/chair-forward.mp4' },
    reverse: { webm: '/assets/hero/chair-reverse.webm', mp4: '/assets/hero/chair-reverse.mp4' },
  },
  'kitchen-dining': {
    forward: { webm: '/assets/hero/kitchen-dining-forward.webm', mp4: '/assets/hero/kitchen-dining-forward.mp4' },
    reverse: { webm: '/assets/hero/kitchen-dining-reverse.webm', mp4: '/assets/hero/kitchen-dining-reverse.mp4' },
  },
  'kitchen-island': {
    forward: { webm: '/assets/hero/kitchen-island-forward.webm', mp4: '/assets/hero/kitchen-island-forward.mp4' },
    reverse: { webm: '/assets/hero/kitchen-island-reverse.webm', mp4: '/assets/hero/kitchen-island-reverse.mp4' },
  },
  'bedroom-chair': {
    forward: { webm: '/assets/hero/bedroom-chair-forward.webm', mp4: '/assets/hero/bedroom-chair-forward.mp4' },
    reverse: { webm: '/assets/hero/bedroom-chair-reverse.webm', mp4: '/assets/hero/bedroom-chair-reverse.mp4' },
  },
  'bedroom-bed': {
    forward: { webm: '/assets/hero/bedroom-bed-forward.webm', mp4: '/assets/hero/bedroom-bed-forward.mp4' },
    reverse: { webm: '/assets/hero/bedroom-bed-reverse.webm', mp4: '/assets/hero/bedroom-bed-reverse.mp4' },
  },
  'terrace-chair': {
    forward: { webm: '/assets/hero/terrace-chair-forward.webm', mp4: '/assets/hero/terrace-chair-forward.mp4' },
    reverse: { webm: '/assets/hero/terrace-chair-reverse.webm', mp4: '/assets/hero/terrace-chair-reverse.mp4' },
  },
  'terrace-sofa': {
    forward: { webm: '/assets/hero/terrace-sofa-forward.webm', mp4: '/assets/hero/terrace-sofa-forward.mp4' },
    reverse: { webm: '/assets/hero/terrace-sofa-reverse.webm', mp4: '/assets/hero/terrace-sofa-reverse.mp4' },
  },
} satisfies Record<HeroProductId, Pick<HeroProduct, 'forward' | 'reverse'>>;
```

Copy each literal pair into its matching existing `HERO_PRODUCTS` object. Remove `forwardSrc` and `reverseSrc`; no compatibility alias remains.

- [ ] **Step 5: Add pure selection and preserve the existing operation lifecycle**

In `components/evironn/home/hero-product-media.tsx`, implement:

```ts
export type HeroVideoFormat = 'webm' | 'mp4';
export type SelectedHeroVideoSource = Readonly<{ format: HeroVideoFormat; src: string }>;

export function selectHeroVideoSource(
  sources: HeroVideoSources,
  canPlayType: (mime: string) => string,
): SelectedHeroVideoSource {
  return sources.webm && canPlayType('video/webm; codecs="vp9"') !== ''
    ? { format: 'webm', src: sources.webm }
    : { format: 'mp4', src: sources.mp4 };
}
```

Change `HeroProductTransition` to retain `sources` rather than a single path. When an interaction phase creates the video, call the resolver once using this guarded browser capability callback; assign only the returned path:

```ts
function browserCanPlayType(mime: string): string {
  if (typeof document === 'undefined') return '';
  try {
    return document.createElement('video').canPlayType(mime);
  } catch {
    return '';
  }
}
```

Add `const attempt = useRef(0)` beside the existing operation ref. Every source assignment receives a new attempt generation and assigned-source identity. Replace the single fixed listener set inside the active-transition effect with this binding shape:

```ts
type AttemptHandlers = Readonly<{
  loadeddata: () => void;
  timeupdate: () => void;
  ended: () => void;
  error: () => void;
}>;

let activeHandlers: AttemptHandlers | null = null;
let fallbackAttempted = false;

const removeAttemptHandlers = () => {
  if (!activeHandlers) return;
  video.removeEventListener('loadeddata', activeHandlers.loadeddata);
  video.removeEventListener('timeupdate', activeHandlers.timeupdate);
  video.removeEventListener('ended', activeHandlers.ended);
  video.removeEventListener('error', activeHandlers.error);
  activeHandlers = null;
};

const bindAttempt = (selected: SelectedHeroVideoSource) => {
  removeAttemptHandlers();
  attempt.current += 1;
  const currentAttempt = attempt.current;
  const assignedSource = selected.src;
  let playbackStarted = false;
  const isCurrentAttempt = () =>
    operation.current === currentOperation &&
    attempt.current === currentAttempt &&
    video.getAttribute('src') === assignedSource;

  const fail = () => {
    if (!isCurrentAttempt()) return;
    removeAttemptHandlers();
    operation.current += 1;
    attempt.current += 1;
    setVisibleVideoKey(null);
    releaseVideo(video);
    onFailure(phase);
  };
  const loadeddata = () => {
    if (!isCurrentAttempt() || playbackStarted) return;
    playbackStarted = true;
    setVisibleVideoKey(`${activeTransition.productId}-${activeTransition.direction}`);
    video.playbackRate = product.playbackRate;
    void video.play().catch(fail);
  };
  const timeupdate = () => {
    if (isCurrentAttempt() && activeTransition.direction === 'forward') onProgress(video.currentTime, video.duration);
  };
  const ended = () => {
    if (!isCurrentAttempt()) return;
    removeAttemptHandlers();
    operation.current += 1;
    attempt.current += 1;
    setVisibleVideoKey(null);
    releaseVideo(video);
    if (activeTransition.direction === 'forward') onForwardComplete();
    else onReverseComplete();
  };
  const error = () => {
    if (!isCurrentAttempt()) return;
    if (selected.format === 'webm' && !playbackStarted && !fallbackAttempted) {
      fallbackAttempted = true;
      setVisibleVideoKey(null);
      video.pause();
      video.currentTime = 0;
      bindAttempt({ format: 'mp4', src: activeTransition.sources.mp4 });
      return;
    }
    fail();
  };
  activeHandlers = { loadeddata, timeupdate, ended, error };
  video.addEventListener('loadeddata', loadeddata);
  video.addEventListener('timeupdate', timeupdate);
  video.addEventListener('ended', ended);
  video.addEventListener('error', error);
  video.setAttribute('src', assignedSource);
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) loadeddata();
  else video.load();
};
```

The effect cleanup must call `removeAttemptHandlers()`, then increment both `operation.current` and `attempt.current` before `releaseVideo(video)`. The initial call is `bindAttempt(selectHeroVideoSource(activeTransition.sources, browserCanPlayType))`. Tests capture the old WebM handler references before fallback, invoke them after MP4 assignment, and assert zero reveal/play/failure calls. Then the real current MP4 `error` handler must call `onFailure(phase)` exactly once and release the source.

Set `playbackStarted = true` only in the existing reveal-on-`loadeddata` path immediately before `play()`. Preserve `preload="auto"`, interaction-only conditional render, cleanup listeners, stale-event checks, forward progress, completion callbacks, playback rate, focus image, cancellation, and reduced motion. Do not add `<source>` elements, preload links, timers, new state-machine phases, or layout/style changes.

- [ ] **Step 6: Run GREEN, typecheck, and touched-file formatting**

Run:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip) { throw 'Ledger tip differs from HEAD.' }
npx vitest run tests/evironn-hero-state.test.ts tests/evironn-hero-shell.test.tsx
if ($LASTEXITCODE -ne 0) { throw 'Task 3 focused tests failed.' }
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw 'Task 3 typecheck failed.' }
npx prettier --check components/evironn/home/hero-products.ts components/evironn/home/hero-product-media.tsx tests/evironn-hero-state.test.ts tests/evironn-hero-shell.test.tsx
if ($LASTEXITCODE -ne 0) { throw 'Task 3 Prettier check failed.' }
git diff --check -- components/evironn/home/hero-products.ts components/evironn/home/hero-product-media.tsx tests/evironn-hero-state.test.ts tests/evironn-hero-shell.test.tsx
if ($LASTEXITCODE -ne 0) { throw 'Task 3 diff check failed.' }
```

Expected: Vitest `2 files / 31 tests passed` (19 existing plus 2 state and 10 shell cases); typecheck and formatting/diff checks exit 0.

- [ ] **Step 7: Fresh Sol Medium Task 3 review and NO_CHANGE recovery boundary**

Dispatch fresh isolated `gpt-5.6-sol` at `medium` reasoning with exact four-path diff, interface signatures, focused outputs, and Task 2 media contract. Require `READY` or `NOT READY`, Critical/Important/Minor counts, SSR/client capability safety, exactly-one-source behavior, one-time pre-playback fallback, no loop, MP4/post-playback failure, stale operation/cancellation, poster-first, reduced motion, timing/state/layout preservation, and portfolio proportionality.

If runtime checks or review remain invalid after bounded remediation, do not commit the runtime diff. Restore only the four Task 3 paths from the Task 2 commit, then run the following exact rollback commands:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$task2Commit = [string]$ledger.task2
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip -or [string]$ledger.currentTip -ne $task2Commit) { throw 'Task 3 recovery tip mismatch.' }
git restore --source=HEAD -- components/evironn/home/hero-products.ts components/evironn/home/hero-product-media.tsx tests/evironn-hero-state.test.ts tests/evironn-hero-shell.test.tsx
if ($LASTEXITCODE -ne 0) { throw 'Task 3 owned-path recovery failed.' }
function Assert-ConfirmedGitIdentity { param($Receipt); if (-not $Receipt.userConfirmed) { throw 'Git identity receipt is not user-confirmed.' }; foreach ($variable in @('GIT_AUTHOR_IDENT','GIT_COMMITTER_IDENT')) { $raw = & git var $variable; if ($LASTEXITCODE -ne 0 -or $raw -notmatch '^(?<name>.+) <(?<email>[^>]+)> \d+ [+-]\d{4}$' -or $Matches.name -cne [string]$Receipt.userName -or $Matches.email -cne [string]$Receipt.userEmail) { throw "$variable differs from user-confirmed Git identity." } } }
Assert-ConfirmedGitIdentity $ledger.gitIdentity
& git revert --no-edit $task2Commit
if ($LASTEXITCODE -ne 0) { throw 'Task 3 committing revert failed.' }
```

Verify the 16 original hashes, absence of all 16 WebM targets, and protected hashes; record `NO_CHANGE` in the ignored manifest and stop. Never reset, clean, stash, or delete by glob.

- [ ] **Step 8: Stage exact Task 3 paths and commit locally**

After `READY`, run:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$task2Commit = [string]$ledger.task2
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip -or [string]$ledger.currentTip -ne $task2Commit) { throw 'Task 3 commit precondition failed.' }
git add -- components/evironn/home/hero-products.ts components/evironn/home/hero-product-media.tsx tests/evironn-hero-state.test.ts tests/evironn-hero-shell.test.tsx
if ($LASTEXITCODE -ne 0) { throw 'Task 3 exact staging failed.' }
$expectedTask3 = @(
  'components/evironn/home/hero-product-media.tsx',
  'components/evironn/home/hero-products.ts',
  'tests/evironn-hero-shell.test.tsx',
  'tests/evironn-hero-state.test.ts'
) | Sort-Object
$staged = @(git diff --cached --name-only | Sort-Object)
if (Compare-Object $expectedTask3 $staged) { throw 'Task 3 staged-path set failed.' }
function Assert-ConfirmedGitIdentity { param($Receipt); if (-not $Receipt.userConfirmed) { throw 'Git identity receipt is not user-confirmed.' }; foreach ($variable in @('GIT_AUTHOR_IDENT','GIT_COMMITTER_IDENT')) { $raw = & git var $variable; if ($LASTEXITCODE -ne 0 -or $raw -notmatch '^(?<name>.+) <(?<email>[^>]+)> \d+ [+-]\d{4}$' -or $Matches.name -cne [string]$Receipt.userName -or $Matches.email -cne [string]$Receipt.userEmail) { throw "$variable differs from user-confirmed Git identity." } } }
Assert-ConfirmedGitIdentity $ledger.gitIdentity
& git commit -m "feat: add dual-source hero video playback"
if ($LASTEXITCODE -ne 0) { throw 'Task 3 commit failed.' }
$task3Commit = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Task 3 commit SHA capture failed.' }
$task3Parent = git rev-parse "$task3Commit^"; if ($LASTEXITCODE -ne 0 -or $task3Parent -ne $task2Commit) { throw 'Task 3 parent chain failed.' }
$task3Paths = @(git diff-tree --no-commit-id --name-only -r $task3Commit | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Task 3 commit path lookup failed.' }
if (Compare-Object $expectedTask3 $task3Paths) { throw 'Task 3 commit path set failed.' }
$freshLedger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
if ([string]$freshLedger.currentTip -ne $task2Commit) { throw 'Stale ledger update refused.' }
$freshLedger.task3 = $task3Commit; $freshLedger.currentTip = $task3Commit
$ledgerTemp = "$ledgerPath.partial"; $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(($freshLedger | ConvertTo-Json -Depth 8) + "`n")
$stream = [System.IO.File]::Open($ledgerTemp,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
Move-Item -LiteralPath $ledgerTemp -Destination $ledgerPath -Force
```

Expected: one local commit containing exactly four paths. No media, E2E, status, progress, package, or pilot-harness path is staged.

---

### Task 4: Run the bounded browser matrix, one completion gate, final review, and local closeout

**Files:**

- Create: `e2e/evironn-hero-video-rollout.spec.ts`
- Modify: `.superpowers/sdd/progress.md`
- Modify: `docs/roadmap/STATUS.md`
- Read/execute only: `scripts/hero-video-rollout.mjs`
- Evidence only, ignored: `.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/`

**Interfaces:**

- Consumes: Tasks 1–3 local commits; `HERO_PRODUCTS` source pairs; rollout `PROMOTED` manifest; deterministic runtime resolver and fallback contract.
- Produces: one focused Playwright matrix for eight products × two directions × two viewports, final aggregate report, exactly one repository completion gate, fresh final Sol review, durable local status/progress closeout, and terminal verdict `ROLLOUT_READY_LOCAL` without publication.

- [ ] **Step 1: Capture the missing-spec RED, then write the focused browser characterization matrix**

Before creating the file, prove the RED boundary once:

```powershell
$ledger = Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json' -Raw | ConvertFrom-Json
$head = & git rev-parse HEAD
if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip) { throw 'Task 4 RED ledger tip differs from HEAD.' }
if (Test-Path -LiteralPath 'e2e/evironn-hero-video-rollout.spec.ts') { throw 'Task 4 RED requires the E2E file to be absent.' }
& npm run e2e -- e2e/evironn-hero-video-rollout.spec.ts --project=chromium
$redExit = $LASTEXITCODE
if ($redExit -eq 0) { throw 'Task 4 missing-spec RED unexpectedly passed.' }
Write-Output "task4MissingSpecRedExit=$redExit"
```

Expected: nonzero Playwright missing-spec result. Then create the file below without changing selectors or production code.

Create `e2e/evironn-hero-video-rollout.spec.ts` with this complete code. It uses current accessible room/product/back names, exact transition paths, two named viewport tests, deterministic capability control, an ordered request/source ledger, 32 real transition completions, unsupported capability, WebM fallback, and MP4 terminal failure:

```ts
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
    const video = element as HTMLVideoElement;
    video.playbackRate = 16;
    return await new Promise<string[]>((resolve, reject) => {
      const events: string[] = [];
      for (const eventName of ['loadeddata', 'playing'])
        video.addEventListener(eventName, () => events.push(eventName));
      video.addEventListener('error', () => reject(new Error(`media-error-${video.error?.code ?? 0}`)), { once: true });
      video.addEventListener(
        'ended',
        () => {
          events.push('ended');
          resolve(events);
        },
        { once: true },
      );
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) events.push('loadeddata');
      if (!video.paused) events.push('playing');
      if (video.ended) resolve([...events, 'ended']);
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
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
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
    const forward = `/assets/hero/${product.id}-forward.webm`;
    await completeVideo(page, forward, ledger);
    transitionAssertions += 1;
    await expect(page.getByRole('complementary', { name: product.name })).toBeVisible();
    await page.getByRole('button', { name: 'Назад' }).click();
    const reverse = `/assets/hero/${product.id}-reverse.webm`;
    await completeVideo(page, reverse, ledger);
    transitionAssertions += 1;
    await expect(page.getByRole('complementary', { name: product.name })).toHaveCount(0);
  }
  expect(transitionAssertions).toBe(16);
  const matrixRequests = ledger
    .filter(({ kind, value }) => kind === 'request' && /\/(forward|reverse)\.(mp4|webm)$/u.test(value))
    .map(({ value }) => value);
  for (const product of PRODUCTS) {
    expect(matrixRequests).toContain(`/assets/hero/${product.id}-forward.webm`);
    expect(matrixRequests).toContain(`/assets/hero/${product.id}-reverse.webm`);
    expect(matrixRequests).not.toContain(`/assets/hero/${product.id}-forward.mp4`);
    expect(matrixRequests).not.toContain(`/assets/hero/${product.id}-reverse.mp4`);
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
  await expect.poll(() => ledger.some(({ kind, value }) => kind === 'request' && value === mp4Source)).toBe(true);
  expect(ledger.findIndex(({ kind, value }) => kind === 'request' && value === webmSource)).toBeLessThan(
    ledger.findIndex(({ kind, value }) => kind === 'request' && value === mp4Source),
  );
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
  const expectedAbortedRequests = [webmSource, mp4Source];
  const unexpectedBrowserErrors = browserErrors.filter(
    (message) =>
      !(
        message.includes('net::ERR_FAILED') &&
        expectedAbortedRequests.some((requestPath) => message.includes(requestPath))
      ),
  );
  expect(unexpectedBrowserErrors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('completes all hero directions and codec fallbacks at desktop 1440x1000', async ({ page }) => {
  await runViewport(page, { width: 1440, height: 1000 });
});

test('completes all hero directions and codec fallbacks at mobile 390x844', async ({ page }) => {
  await runViewport(page, { width: 390, height: 844 });
});
```

- [ ] **Step 2: Run the focused E2E GREEN/characterization check**

Run:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip) { throw 'Ledger tip differs from HEAD.' }
npm run e2e -- e2e/evironn-hero-video-rollout.spec.ts --project=chromium
if ($LASTEXITCODE -ne 0) { throw 'Task 4 focused E2E failed.' }
```

Expected: `2 passed`, 32 real forward/reverse viewport completions, two unsupported-capability MP4 selections, two successful one-time WebM-to-MP4 fallbacks with real MP4 and reverse completion, and two separate MP4 terminal failures. No selector discovery or production adjustment is authorized in this task.

- [ ] **Step 3: Reconfirm aggregate and production receipts before the completion gate**

Run:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$phase6cBaseline = [string]$ledger.implementationBaseline
$task1Commit = [string]$ledger.task1
$task2Commit = [string]$ledger.task2
$task3Commit = [string]$ledger.task3
$task1Parent = git rev-parse "$task1Commit^"; if ($LASTEXITCODE -ne 0 -or $task1Parent -ne $phase6cBaseline) { throw 'Task 1 parent chain failed.' }
$task2Parent = git rev-parse "$task2Commit^"; if ($LASTEXITCODE -ne 0 -or $task2Parent -ne $task1Commit) { throw 'Task 2 parent chain failed.' }
$task3Parent = git rev-parse "$task3Commit^"; if ($LASTEXITCODE -ne 0 -or $task3Parent -ne $task2Commit) { throw 'Task 3 parent chain failed.' }
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne $task3Commit) { throw 'Unexpected commit exists after Task 3.' }
$verifyRaw = @(& node scripts/hero-video-rollout.mjs verify-production --run-id phase-6c-rollout-20260901-01 --implementation-baseline $phase6cBaseline)
$verifyExit = $LASTEXITCODE; if ($verifyRaw.Count -ne 1) { throw 'Verify must emit exactly one JSON line.' }
$verified = $verifyRaw[0] | ConvertFrom-Json
if (Compare-Object @('aggregate','command','exitCode','production','productionState','reason','status') @($verified.PSObject.Properties.Name | Sort-Object)) { throw 'Task 4 verify JSON schema failed.' }
if ($verifyExit -ne 0 -or $verified.exitCode -ne 0 -or $verified.command -ne 'verify-production' -or $verified.status -ne 'PROMOTED' -or $verified.productionState -ne 'VERIFIED' -or $null -ne $verified.reason -or @($verified.production).Count -ne 32) { throw "Verify stopped: $($verifyRaw[0])" }
$reportRaw = @(& node scripts/hero-video-rollout.mjs report --run-id phase-6c-rollout-20260901-01 --implementation-baseline $phase6cBaseline)
$reportExit = $LASTEXITCODE; if ($reportRaw.Count -ne 1) { throw 'Report must emit exactly one JSON line.' }
$report = $reportRaw[0] | ConvertFrom-Json
if (Compare-Object @('aggregate','backups','command','exitCode','playbackReceipts','production','productionState','refreshedVmaf','status','verdict') @($report.PSObject.Properties.Name | Sort-Object)) { throw 'Task 4 report JSON schema failed.' }
if ($reportExit -ne 0 -or $report.exitCode -ne 0 -or $report.command -ne 'report' -or $report.status -ne 'PROMOTED' -or $report.productionState -ne 'VERIFIED' -or $report.verdict -ne 'ROLLOUT_READY_LOCAL' -or @($report.production).Count -ne 32 -or @($report.refreshedVmaf).Count -ne 32 -or $report.backups -ne 16 -or $report.playbackReceipts -ne 32 -or $report.aggregate.originalBytes -ne 103076167 -or $report.aggregate.webmBytes -gt 61845700 -or $report.aggregate.reductionPercent -lt 40 -or -not $report.aggregate.passed) { throw "Report stopped: $($reportRaw[0])" }
foreach ($aggregateValue in @($verified.aggregate,$report.aggregate)) {
  if (Compare-Object @('originalBytes','passed','reductionBytes','reductionPercent','webmBytes') @($aggregateValue.PSObject.Properties.Name | Sort-Object)) { throw 'Task 4 aggregate schema failed.' }
  if (($aggregateValue.originalBytes -isnot [long] -and $aggregateValue.originalBytes -isnot [int]) -or ($aggregateValue.webmBytes -isnot [long] -and $aggregateValue.webmBytes -isnot [int]) -or ($aggregateValue.reductionBytes -isnot [long] -and $aggregateValue.reductionBytes -isnot [int]) -or ($aggregateValue.reductionPercent -isnot [double] -and $aggregateValue.reductionPercent -isnot [decimal] -and $aggregateValue.reductionPercent -isnot [long] -and $aggregateValue.reductionPercent -isnot [int]) -or $aggregateValue.passed -isnot [bool]) { throw 'Task 4 aggregate type failed.' }
}
$manifest = Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/manifest.json' -Raw | ConvertFrom-Json
$expectedMedia = @($manifest.production.path | Sort-Object)
foreach ($result in @($verified,$report)) {
  if ($expectedMedia.Count -ne 32 -or (Compare-Object $expectedMedia @($result.production.path | Sort-Object))) { throw 'Task 4 CLI production path set failed.' }
  foreach ($item in @($result.production)) {
    $manifestItem = $manifest.production | Where-Object path -eq $item.path
    if (Compare-Object @('bytes','format','path','sha256') @($item.PSObject.Properties.Name | Sort-Object)) { throw 'Task 4 production item schema failed.' }
    if ($null -eq $manifestItem -or $item.path -isnot [string] -or $item.format -notin @('mp4','webm') -or ($item.bytes -isnot [long] -and $item.bytes -isnot [int]) -or $item.sha256 -isnot [string] -or $item.format -ne [IO.Path]::GetExtension($item.path).TrimStart('.') -or $item.bytes -ne $manifestItem.bytes -or $item.sha256 -cne $manifestItem.sha256 -or $item.bytes -lt 1 -or $item.sha256 -notmatch '^[0-9a-f]{64}$') { throw "Task 4 CLI production identity failed: $($item.path)" }
  }
}
foreach ($item in @($report.refreshedVmaf)) {
  if ((Compare-Object @('format','sourceId','value') @($item.PSObject.Properties.Name | Sort-Object)) -or $item.sourceId -isnot [string] -or $item.format -notin @('mp4','webm') -or ($item.value -isnot [double] -and $item.value -isnot [decimal] -and $item.value -isnot [long] -and $item.value -isnot [int]) -or $item.value -lt 95) { throw 'Task 4 refreshed VMAF schema or identity failed.' }
}
```

Expected: `verify-production` validates the 32 promoted hashes from `manifest.production`; `report` first rehashes all 16 immutable backup references against the original literal bytes/hashes, recomputes 32 VMAF results against those backups, then validates 32 playback receipts and aggregate `webmBytes <= 61845700`, reduction `>=40%`. Neither command calls the pre-promotion production-source verifier. Any mismatch is `NO_CHANGE`. Restore the Task 2 baseline with one explicit rollback commit:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$task3Commit = [string]$ledger.task3; $task2Commit = [string]$ledger.task2
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip -or [string]$ledger.currentTip -ne $task3Commit) { throw 'Task 4 recovery tip mismatch.' }
function Assert-ConfirmedGitIdentity { param($Receipt); if (-not $Receipt.userConfirmed) { throw 'Git identity receipt is not user-confirmed.' }; foreach ($variable in @('GIT_AUTHOR_IDENT','GIT_COMMITTER_IDENT')) { $raw = & git var $variable; if ($LASTEXITCODE -ne 0 -or $raw -notmatch '^(?<name>.+) <(?<email>[^>]+)> \d+ [+-]\d{4}$' -or $Matches.name -cne [string]$Receipt.userName -or $Matches.email -cne [string]$Receipt.userEmail) { throw "$variable differs from user-confirmed Git identity." } } }
Assert-ConfirmedGitIdentity $ledger.gitIdentity
& git revert --no-commit $task3Commit $task2Commit
if ($LASTEXITCODE -ne 0) { throw 'Task 4 non-committing revert preparation failed.' }
Assert-ConfirmedGitIdentity $ledger.gitIdentity
& git commit -m "revert: restore rejected hero video rollout"
if ($LASTEXITCODE -ne 0) { throw 'Task 4 rollback commit failed.' }
```

Then verify immutable source hashes and absent WebMs, record the exact ignored outcome, and stop before the completion gate.

- [ ] **Step 4: Run the repository completion gate exactly once**

Run once, in order:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$phase6cBaseline = [string]$ledger.implementationBaseline
$task1Commit = [string]$ledger.task1; $task2Commit = [string]$ledger.task2; $task3Commit = [string]$ledger.task3
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne [string]$ledger.currentTip -or [string]$ledger.currentTip -ne $task3Commit) { throw 'Completion-gate ledger tip mismatch.' }
$expectedPreFormatStatus = @(
  '?? docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
  '?? docs/superpowers/plans/phase-2-task-3-execution.md',
  '?? e2e/evironn-hero-video-rollout.spec.ts'
) | Sort-Object
$preFormatStatus = @(git status --porcelain=v1 --untracked-files=all | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Pre-format status lookup failed.' }
if (Compare-Object $expectedPreFormatStatus $preFormatStatus) { throw 'BLOCKED: pre-format workspace is not exact clean/owned allowlist.' }
$formatBackupRoot = '.superpowers/sdd/phase-6c-hero-video-rollout/format-protected-backup'
git check-ignore -q -- $formatBackupRoot
if ($LASTEXITCODE -ne 0) { throw 'BLOCKED: protected format backup root is not ignored.' }
if (Test-Path -LiteralPath $formatBackupRoot) { throw 'BLOCKED: format backup root already exists.' }
New-Item -ItemType Directory -Path $formatBackupRoot | Out-Null
$protectedAPath = 'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md'
$protectedBPath = 'docs/superpowers/plans/phase-2-task-3-execution.md'
$protectedABackup = Join-Path $formatBackupRoot '2026-08-12-phase-2a-executable-storefront-home.md.bin'
$protectedBBackup = Join-Path $formatBackupRoot 'phase-2-task-3-execution.md.bin'
Copy-Item -LiteralPath $protectedAPath -Destination $protectedABackup
Copy-Item -LiteralPath $protectedBPath -Destination $protectedBBackup
$protectedAHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedAPath).Hash.ToLowerInvariant()
$protectedBHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedBPath).Hash.ToLowerInvariant()
if ($protectedAHash -ne 'fd43e58af19e79f746c41126572072e38792052f202ae5c1c26e4efdb5f6e6e9' -or $protectedBHash -ne 'f1be0e060eda06afa2afdff53d4dcecd338b3c67514e412e2add0605c503a7e2') { throw 'BLOCKED: protected pre-format hash drift.' }
$formatReceipt = [ordered]@{
  status = 'BACKED_UP'
  protected = @(
    [ordered]@{ path = $protectedAPath; backup = $protectedABackup; sha256 = $protectedAHash },
    [ordered]@{ path = $protectedBPath; backup = $protectedBBackup; sha256 = $protectedBHash }
  )
  expectedStatus = $expectedPreFormatStatus
}
[System.IO.File]::WriteAllText((Join-Path (Get-Location) (Join-Path $formatBackupRoot 'receipt.json')), (($formatReceipt | ConvertTo-Json -Depth 5) + "`n"), [System.Text.UTF8Encoding]::new($false))
$prettierWouldChange = @(npx prettier --list-different . | Sort-Object)
$prettierListExit = $LASTEXITCODE
if ($prettierListExit -notin @(0, 1)) { throw "BLOCKED: Prettier prospective scan failed with exit $prettierListExit." }
$allowedPrettierChange = @('e2e/evironn-hero-video-rollout.spec.ts')
$unexpectedPrettierChange = @($prettierWouldChange | Where-Object { $_ -notin $allowedPrettierChange })
if ($unexpectedPrettierChange.Count -ne 0) { throw 'BLOCKED: npm run format would change a non-owned or protected path.' }
npm run format
$formatExit = $LASTEXITCODE; if ($formatExit -ne 0) { throw "BLOCKED: repository format failed with exit $formatExit." }
$postFormatStatus = @(git status --porcelain=v1 --untracked-files=all | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Post-format status lookup failed.' }
$postAHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedAPath).Hash.ToLowerInvariant()
$postBHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedBPath).Hash.ToLowerInvariant()
if ($postAHash -ne $protectedAHash -or $postBHash -ne $protectedBHash) {
  [System.IO.File]::WriteAllBytes((Join-Path (Get-Location) $protectedAPath), [System.IO.File]::ReadAllBytes((Join-Path (Get-Location) $protectedABackup)))
  [System.IO.File]::WriteAllBytes((Join-Path (Get-Location) $protectedBPath), [System.IO.File]::ReadAllBytes((Join-Path (Get-Location) $protectedBBackup)))
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $protectedAPath).Hash.ToLowerInvariant() -ne $protectedAHash -or (Get-FileHash -Algorithm SHA256 -LiteralPath $protectedBPath).Hash.ToLowerInvariant() -ne $protectedBHash) { throw 'BLOCKED: protected rollback verification failed.' }
  $formatReceipt.status = 'BLOCKED_PROTECTED_DRIFT_RESTORED'
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) (Join-Path $formatBackupRoot 'receipt.json')), (($formatReceipt | ConvertTo-Json -Depth 5) + "`n"), [System.Text.UTF8Encoding]::new($false))
  throw 'BLOCKED: npm run format changed protected files; byte-for-byte backups restored.'
}
if (Compare-Object $expectedPreFormatStatus $postFormatStatus) {
  $formatReceipt.status = 'BLOCKED_CHANGED_PATH_DRIFT'
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) (Join-Path $formatBackupRoot 'receipt.json')), (($formatReceipt | ConvertTo-Json -Depth 5) + "`n"), [System.Text.UTF8Encoding]::new($false))
  throw 'BLOCKED: npm run format changed complete workspace path set. Do not use git restore; route exact paths to their owner.'
}
$formatReceipt.status = 'FORMAT_PATHS_AND_PROTECTED_HASHES_VALID'
[System.IO.File]::WriteAllText((Join-Path (Get-Location) (Join-Path $formatBackupRoot 'receipt.json')), (($formatReceipt | ConvertTo-Json -Depth 5) + "`n"), [System.Text.UTF8Encoding]::new($false))
npm run gate
if ($LASTEXITCODE -ne 0) { throw 'Repository gate failed.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Repository build failed.' }
npm run e2e -- e2e/evironn-hero-video-rollout.spec.ts --project=chromium
if ($LASTEXITCODE -ne 0) { throw 'Completion-gate rollout E2E failed.' }
```

Expected: exact preflight status, prospective Prettier path set, post-format complete status, and protected hashes pass; all four gate commands exit 0; final E2E reports `2 passed`. The two byte backups and `receipt.json` remain in ignored evidence through local acceptance and future authorized Preview work; this plan never deletes them. No glob, directory cleanup, `git restore`, reset, stash, or unrelated-file rewrite is allowed. Do not rerun the complete gate after documentation-only closeout. If remediation changes production/runtime behavior, the prior completion gate is invalid and Task 4 stops for coordinator decision before any second full gate.

- [ ] **Step 5: Run changed-path, protected-file, LFS, and value-free secret checks**

Derive and prove the immutable coordinator planning commit again, then run:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$phase6cBaseline = [string]$ledger.implementationBaseline
$task1Commit = [string]$ledger.task1
$task2Commit = [string]$ledger.task2
$task3Commit = [string]$ledger.task3
if ($phase6cBaseline -notmatch '^[0-9a-f]{40}$') { throw 'Implementation baseline is not a full commit SHA.' }
$task1Parent = git rev-parse "$task1Commit^"; if ($LASTEXITCODE -ne 0) { throw 'Task 1 parent lookup failed.' }
$task2Parent = git rev-parse "$task2Commit^"; if ($LASTEXITCODE -ne 0) { throw 'Task 2 parent lookup failed.' }
$task3Parent = git rev-parse "$task3Commit^"; if ($LASTEXITCODE -ne 0) { throw 'Task 3 parent lookup failed.' }
if ($task1Parent -ne $phase6cBaseline -or $task2Parent -ne $task1Commit -or $task3Parent -ne $task2Commit) { throw 'Task commit chain failed.' }
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne $task3Commit) { throw 'Unexpected commit exists after Task 3.' }
git cat-file -e "$phase6cBaseline`:docs/superpowers/specs/2026-09-01-phase-6c-hero-video-rollout-planning-brief.md"
if ($LASTEXITCODE -ne 0) { throw 'Planning brief is absent from implementation baseline.' }
git cat-file -e "$phase6cBaseline`:docs/superpowers/plans/2026-09-01-phase-6c-hero-video-rollout.md"
if ($LASTEXITCODE -ne 0) { throw 'Reviewed plan is absent from implementation baseline.' }
git cat-file -e "$phase6cBaseline`:scripts/hero-video-rollout.mjs" 2>$null
if ($LASTEXITCODE -eq 0) { throw 'Implementation baseline already contains Task 1 code.' }
$manifest = Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/manifest.json' -Raw | ConvertFrom-Json
$expectedMedia = @($manifest.production.path | Sort-Object)
if ($expectedMedia.Count -ne 32) { throw 'Production manifest path count failed.' }
$expectedBeforeCloseout = @(
  'scripts/hero-video-rollout.mjs',
  'tests/hero-video-rollout.test.ts',
  'tests/evironn-hero-assets.test.ts',
  'components/evironn/home/hero-product-media.tsx',
  'components/evironn/home/hero-products.ts',
  'tests/evironn-hero-shell.test.tsx',
  'tests/evironn-hero-state.test.ts',
  'e2e/evironn-hero-video-rollout.spec.ts'
) + $expectedMedia | Sort-Object -Unique
$trackedChanged = @(git diff --name-only $phase6cBaseline)
if ($LASTEXITCODE -ne 0) { throw 'Precloseout tracked-path lookup failed.' }
$untrackedE2e = @(git ls-files --others --exclude-standard -- e2e/evironn-hero-video-rollout.spec.ts)
if ($LASTEXITCODE -ne 0) { throw 'Precloseout E2E path lookup failed.' }
$changed = @(($trackedChanged + $untrackedE2e) | Sort-Object -Unique)
if ($expectedBeforeCloseout.Count -ne 40 -or $changed.Count -ne 40) { throw 'Precloseout changed-path count is not exactly 40.' }
if (Compare-Object $expectedBeforeCloseout $changed) { throw 'Delivery changed-path contract failed.' }
Write-Output 'precloseoutChanged=40'
$protectedA = (Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md').Hash.ToLowerInvariant()
$protectedB = (Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/superpowers/plans/phase-2-task-3-execution.md').Hash.ToLowerInvariant()
if ($protectedA -ne 'fd43e58af19e79f746c41126572072e38792052f202ae5c1c26e4efdb5f6e6e9') { throw 'Protected Phase 2A plan drift.' }
if ($protectedB -ne 'f1be0e060eda06afa2afdff53d4dcecd338b3c67514e412e2add0605c503a7e2') { throw 'Protected Phase 2 task plan drift.' }
foreach ($mediaPath in $expectedMedia) {
  $record = $manifest.production | Where-Object path -eq $mediaPath
  $pointer = @(git show "HEAD:$mediaPath")
  if ($LASTEXITCODE -ne 0) { throw "Committed LFS pointer lookup failed: $mediaPath" }
  if ($pointer.Count -ne 3 -or $pointer[0] -ne 'version https://git-lfs.github.com/spec/v1' -or $pointer[1] -ne "oid sha256:$($record.sha256)" -or $pointer[2] -ne "size $($record.bytes)") { throw "Invalid committed LFS pointer: $mediaPath" }
}
$changedText = @($changed | Where-Object { $_ -match '\.(mjs|ts|tsx|md)$' })
$secretNamePattern = '(?i)(secret|token|password|passwd|api[_-]?key|private[_-]?key|client[_-]?secret|dsn|cookie|authorization|card[_-]?number)'
$secretPathLines = @()
foreach ($textPath in $changedText) {
  $lineNumber = 0
  foreach ($line in Get-Content -LiteralPath $textPath) {
    $lineNumber += 1
    if ($line -match $secretNamePattern) { $secretPathLines += "$textPath`:$lineNumber" }
  }
}
$allowedSecretReferences = @(
  'scripts/hero-video-rollout.mjs:',
  'tests/hero-video-rollout.test.ts:',
  '.superpowers/sdd/progress.md:',
  'docs/roadmap/STATUS.md:'
)
$unexplainedSecretPaths = @($secretPathLines | Where-Object { $entry = $_; -not ($allowedSecretReferences | Where-Object { $entry.StartsWith($_) }) })
if ($unexplainedSecretPaths.Count -ne 0) { $unexplainedSecretPaths; throw 'Changed-text secret-name path scan requires review.' }
Write-Output "secret-scan-path-lines=$($secretPathLines.Count); values-suppressed=true"
git diff --check "$phase6cBaseline..HEAD"
if ($LASTEXITCODE -ne 0) { throw 'Baseline-to-HEAD diff check failed.' }
```

Expected changed tracked paths before closeout: Task 1's two files, Task 2's 33 files, Task 3's four files, and this task's one E2E file: 40 unique paths. Exact manifest-derived set comparison passes. Path-and-line-only secret-name scan prints no matched values or media contents and finds no unexplained credential/DSN/token/cookie/payment/personal-data path. Any extra path, LFS mismatch, or protected drift is `BLOCKED`.

- [ ] **Step 6: Fresh final Sol Medium functional/security/performance-contract review**

Dispatch fresh isolated `gpt-5.6-sol` at `medium` reasoning with the captured `$phase6cBaseline`, exact dynamic commit ledger, baseline-to-current-HEAD 40-path union, compact rollout report, completion-gate outputs, and no raw media. Require `READY` or `NOT READY`, Critical/Important/Minor counts, functional dual-source/fallback/state review, harness command-injection/path-containment/rollback review, immutable backup and promoted-hash/LFS review, aggregate-math/performance-claim review, E2E coverage, excluded-scope check, and portfolio proportionality.

If review returns Critical/Important findings, route each finding by exact owned path and use only its focused checks:

```text
scripts/hero-video-rollout.mjs or tests/hero-video-rollout.test.ts:
  Task 1 Luna owner; run the 20-test harness file, Node syntax, touched Prettier, diff check;
  commit subject "fix: remediate hero rollout harness review"

the 32 allowlisted media paths or tests/evironn-hero-assets.test.ts:
  Task 2 Luna owner; rerun verify-production, report with immutable backups, the two focused asset/harness files, LFS pointer/index checks;
  commit subject "fix: remediate hero media review"

components/evironn/home/hero-products.ts, components/evironn/home/hero-product-media.tsx,
tests/evironn-hero-state.test.ts, or tests/evironn-hero-shell.test.tsx:
  Task 3 Luna owner; run the 31 focused tests, typecheck, touched Prettier, diff check;
  commit subject "fix: remediate hero playback review"

e2e/evironn-hero-video-rollout.spec.ts:
  Task 4 Luna owner; run only the two-test Chromium file, touched Prettier, diff check;
  commit subject "test: remediate hero rollout browser review"
```

Use this executable ledger transaction for every remediation. The caller passes the exact review finding IDs and exact changed paths; the function refuses cross-owner paths, stale `HEAD`, stale ledger writes, or a commit containing any path outside that finding-specific set:

```powershell
function Commit-Phase6cRemediation {
  param(
    [Parameter(Mandatory)][ValidateSet(1,2,3,4)][int]$OwnerTask,
    [Parameter(Mandatory)][ValidateNotNullOrEmpty()][string[]]$FindingIds,
    [Parameter(Mandatory)][ValidateNotNullOrEmpty()][string[]]$FindingPaths,
    [Parameter(Mandatory)][ValidateNotNullOrEmpty()][string[]]$FocusedChecks
  )
  $ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
  $ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
  $currentTip = [string]$ledger.currentTip
  $phase6cBaseline = [string]$ledger.implementationBaseline
  if ($phase6cBaseline -notmatch '^[0-9a-f]{40}$' -or $currentTip -notmatch '^[0-9a-f]{40}$') { throw 'Ledger contains a non-full SHA.' }
  $head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne $currentTip) { throw 'Remediation HEAD differs from ledger currentTip.' }
  $media = @((Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/manifest.json' -Raw | ConvertFrom-Json).production.path)
  $ownerAllowlists = @{
    1 = @('scripts/hero-video-rollout.mjs','tests/hero-video-rollout.test.ts')
    2 = @('tests/evironn-hero-assets.test.ts') + $media
    3 = @('components/evironn/home/hero-product-media.tsx','components/evironn/home/hero-products.ts','tests/evironn-hero-shell.test.tsx','tests/evironn-hero-state.test.ts')
    4 = @('e2e/evironn-hero-video-rollout.spec.ts')
  }
  $findingSet = @($FindingPaths | Sort-Object -Unique)
  $ownerSet = @($ownerAllowlists[$OwnerTask] | Sort-Object -Unique)
  if ($findingSet.Count -ne $FindingPaths.Count -or @($findingSet | Where-Object { $_ -notin $ownerSet }).Count -ne 0) { throw 'Finding paths violate one owner allowlist.' }
  git add -- $findingSet
  if ($LASTEXITCODE -ne 0) { throw 'Finding-specific staging failed.' }
  $staged = @(git diff --cached --name-only | Sort-Object -Unique)
  if ($LASTEXITCODE -ne 0) { throw 'Remediation staged-path lookup failed.' }
  if (Compare-Object $findingSet $staged) { throw 'Finding-specific staged path set mismatch.' }
  $subjects = @{ 1='fix: remediate hero rollout harness review'; 2='fix: remediate hero media review'; 3='fix: remediate hero playback review'; 4='test: remediate hero rollout browser review' }
  function Assert-ConfirmedGitIdentity { param($Receipt); if (-not $Receipt.userConfirmed) { throw 'Git identity receipt is not user-confirmed.' }; foreach ($variable in @('GIT_AUTHOR_IDENT','GIT_COMMITTER_IDENT')) { $raw = & git var $variable; if ($LASTEXITCODE -ne 0 -or $raw -notmatch '^(?<name>.+) <(?<email>[^>]+)> \d+ [+-]\d{4}$' -or $Matches.name -cne [string]$Receipt.userName -or $Matches.email -cne [string]$Receipt.userEmail) { throw "$variable differs from user-confirmed Git identity." } } }
  Assert-ConfirmedGitIdentity $ledger.gitIdentity
  & git commit -m $subjects[$OwnerTask]
  if ($LASTEXITCODE -ne 0) { throw 'Finding-specific remediation commit failed.' }
  $commit = git rev-parse HEAD
  if ($LASTEXITCODE -ne 0) { throw 'Remediation commit SHA capture failed.' }
  $commitParent = git rev-parse "$commit^"; if ($LASTEXITCODE -ne 0 -or $commitParent -ne $currentTip) { throw 'Remediation parent chain mismatch.' }
  $commitPaths = @(git diff-tree --no-commit-id --name-only -r $commit | Sort-Object -Unique)
  if ($LASTEXITCODE -ne 0) { throw 'Remediation commit path lookup failed.' }
  if (Compare-Object $findingSet $commitPaths) { throw 'Remediation commit path set mismatch.' }
  $fresh = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
  if ([string]$fresh.currentTip -ne $currentTip) { throw 'Stale remediation ledger overwrite refused.' }
  $entry = [ordered]@{ findingIds=@($FindingIds); ownerTask=$OwnerTask; commit=$commit; paths=$findingSet; focusedChecks=@($FocusedChecks) }
  $fresh.remediation = @($fresh.remediation) + $entry
  $fresh.currentTip = $commit
  $ledgerTemp = "$ledgerPath.partial"
  $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(($fresh | ConvertTo-Json -Depth 10) + "`n")
  $stream = [System.IO.File]::Open($ledgerTemp,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
  try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
  Move-Item -LiteralPath $ledgerTemp -Destination $ledgerPath -Force
  return $commit
}
```

After any material remediation, dispatch a different fresh isolated Sol Medium reviewer against `$phase6cBaseline..$currentTip`, the updated remediation ledger, and the exact focused check outputs. Do not proceed until the fresh re-review returns `READY` with Critical 0 / Important 0. Minor findings receive explicit durable dispositions.

If a finding requires an excluded path, another task's paths in one commit, a new architecture choice, or a production/runtime change that invalidates the single completion gate, stop `BLOCKED` and route it to the coordinator; do not silently broaden ownership or run a second full gate. Status/progress files are not remediation paths before final `READY`.

- [ ] **Step 7: Write durable closeout only after final `READY`**

Append complete factual entries to `.superpowers/sdd/progress.md` and `docs/roadmap/STATUS.md` recording:

```text
implementation baseline full SHA
Task 1, Task 2, Task 3 local commit SHAs
exact 16+16 media result and selected retry qualities
original bytes 103076167, WebM bytes, reduction bytes and exact percentage
per-file gate summary and 32/32 candidate playback receipts
focused test/typecheck/E2E and one completion-gate command results
final review verdict and Critical/Important/Minor counts, plus Minor dispositions
changed-path count and protected-hash/LFS/secret-scan results
precloseoutChanged=40 and finalChanged=42
verdict ROLLOUT_READY_LOCAL
exclusions and stop before push/Preview/deployed-performance claim
```

Do not claim Vercel or Production improvement. State that comparable Preview measurement requires separate explicit authorization.

- [ ] **Step 8: Format/check closeout, stage exact Task 4 paths, and commit locally**

Run focused post-gate checks only:

```powershell
$ledgerPath = '.superpowers/sdd/phase-6c-hero-video-rollout/commit-ledger.json'
$ledger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
$task4Parent = [string]$ledger.currentTip
$head = git rev-parse HEAD; if ($LASTEXITCODE -ne 0 -or $head -ne $task4Parent) { throw 'Task 4 ledger tip differs from HEAD.' }
npx prettier --check e2e/evironn-hero-video-rollout.spec.ts .superpowers/sdd/progress.md docs/roadmap/STATUS.md
if ($LASTEXITCODE -ne 0) { throw 'Task 4 closeout Prettier check failed.' }
git diff --check -- e2e/evironn-hero-video-rollout.spec.ts .superpowers/sdd/progress.md docs/roadmap/STATUS.md
if ($LASTEXITCODE -ne 0) { throw 'Task 4 closeout diff check failed.' }
git add -- e2e/evironn-hero-video-rollout.spec.ts .superpowers/sdd/progress.md docs/roadmap/STATUS.md
if ($LASTEXITCODE -ne 0) { throw 'Task 4 closeout staging failed.' }
git cat-file -e 'HEAD:e2e/evironn-hero-video-rollout.spec.ts' 2>$null
$expectedTask4 = if ($LASTEXITCODE -eq 0) {
  @('.superpowers/sdd/progress.md','docs/roadmap/STATUS.md') | Sort-Object
} else {
  @('.superpowers/sdd/progress.md','docs/roadmap/STATUS.md','e2e/evironn-hero-video-rollout.spec.ts') | Sort-Object
}
$staged = @(git diff --cached --name-only | Sort-Object)
if (Compare-Object $expectedTask4 $staged) { throw 'Task 4 staged-path set failed.' }
function Assert-ConfirmedGitIdentity { param($Receipt); if (-not $Receipt.userConfirmed) { throw 'Git identity receipt is not user-confirmed.' }; foreach ($variable in @('GIT_AUTHOR_IDENT','GIT_COMMITTER_IDENT')) { $raw = & git var $variable; if ($LASTEXITCODE -ne 0 -or $raw -notmatch '^(?<name>.+) <(?<email>[^>]+)> \d+ [+-]\d{4}$' -or $Matches.name -cne [string]$Receipt.userName -or $Matches.email -cne [string]$Receipt.userEmail) { throw "$variable differs from user-confirmed Git identity." } } }
Assert-ConfirmedGitIdentity $ledger.gitIdentity
& git commit -m "docs: close phase 6c hero video rollout"
if ($LASTEXITCODE -ne 0) { throw 'Task 4 closeout commit failed.' }
$task4Commit = git rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Task 4 commit SHA capture failed.' }
$task4CommitParent = git rev-parse "$task4Commit^"; if ($LASTEXITCODE -ne 0 -or $task4CommitParent -ne $task4Parent) { throw 'Task 4 parent chain failed.' }
$task4Paths = @(git diff-tree --no-commit-id --name-only -r $task4Commit | Sort-Object)
if ($LASTEXITCODE -ne 0) { throw 'Task 4 commit path lookup failed.' }
if (Compare-Object $expectedTask4 $task4Paths) { throw 'Task 4 commit path set failed.' }
$freshLedger = Get-Content -LiteralPath $ledgerPath -Raw | ConvertFrom-Json
if ([string]$freshLedger.currentTip -ne $task4Parent) { throw 'Stale Task 4 ledger update refused.' }
$freshLedger.task4 = $task4Commit; $freshLedger.currentTip = $task4Commit
$ledgerTemp = "$ledgerPath.partial"; $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(($freshLedger | ConvertTo-Json -Depth 8) + "`n")
$stream = [System.IO.File]::Open($ledgerTemp,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
Move-Item -LiteralPath $ledgerTemp -Destination $ledgerPath -Force
$manifest = Get-Content -LiteralPath '.superpowers/sdd/phase-6c-hero-video-rollout/runs/phase-6c-rollout-20260901-01/manifest.json' -Raw | ConvertFrom-Json
$baseFinal = @(
  'scripts/hero-video-rollout.mjs','tests/hero-video-rollout.test.ts','tests/evironn-hero-assets.test.ts',
  'components/evironn/home/hero-product-media.tsx','components/evironn/home/hero-products.ts',
  'tests/evironn-hero-shell.test.tsx','tests/evironn-hero-state.test.ts','e2e/evironn-hero-video-rollout.spec.ts',
  '.superpowers/sdd/progress.md','docs/roadmap/STATUS.md'
)
$expectedFinal = @(($baseFinal + @($manifest.production.path)) | Sort-Object -Unique)
if ($expectedFinal.Count -ne 42) { throw 'Expected final path set is not 42.' }
$finalChangedPaths = @(git diff --name-only "$([string]$freshLedger.implementationBaseline)..HEAD" | Sort-Object -Unique)
if ($LASTEXITCODE -ne 0) { throw 'Final changed-path lookup failed.' }
if (Compare-Object $expectedFinal $finalChangedPaths) { throw 'Final 42-path changed set failed.' }
Write-Output 'precloseoutChanged=40 finalChanged=42'
```

Expected: focused formatting/diff checks exit 0; one local closeout commit contains exactly three paths when the E2E file is still uncommitted, or exactly two paths when a reviewed Task 4 remediation commit already contains the E2E file. In both cases the baseline-to-HEAD union is exactly `42` paths and prints `precloseoutChanged=40 finalChanged=42`. Re-run `git status --short --branch`, verify only the two protected untracked plans remain, and report `ROLLOUT_READY_LOCAL`. Stop. Do not push, deploy/create Vercel Preview, measure deployed performance, open PR, merge, mutate provider/DB state, or start Phase 6D.

The command-specific preflight, machine-readable CLI, explicit four-value `productionState`, approved CQ24 boundary, exact rename/receipt fault matrix, crash-recovery journal, promotion boundary, timeout, deterministic E2E, full CLI schema assertions, checked index/LFS assertions, changed set, and twice-verified rollback Git identity are material plan changes. Before user approval or implementation, dispatch a fresh isolated Sol Medium plan re-review with this entire refreshed plan, the planning brief, approved design, planner evidence, and exact repository-state summary; require `READY` with Critical 0 / Important 0.

# Phase 6C Hero Video Rollout Design

**Date:** 2026-09-01

**Status:** User-approved design; planning required before implementation

**Branch:** `phase/06-hardening-release`

## Goal

Roll out the already approved Terrace sofa compression result to all sixteen hero transition videos, make VP9 WebM the preferred runtime source, retain a compressed H.264 MP4 fallback, and then measure the real loading improvement without adding another manual original-versus-candidate review page.

## Approved Evidence

The design reuses the completed experiment in Codex session `01a05acb-c67b-7d22-826b-7822b2eaeb20` and run `terrace-pilot-20260901-04`.

- Approved winner: `vp9-cq28`.
- Terrace sofa forward VMAF: `98.530034`.
- Terrace sofa reverse VMAF: `98.609025`.
- Original Terrace pair: `18,568,392` bytes.
- Approved VP9 pair: `8,337,625` bytes.
- Reduction: `55.09775429127088%`.
- User verdict: no visible quality difference.
- The pilot ended `VISUALLY_APPROVED`; production media was not changed.
- The approved experiment harness and its focused tests remain the source of encoding, probing, metric-ordering, immutable-input, and bounded-process lessons.

This rollout does not repeat the H.264/VP9/AV1 bake-off. AV1 is excluded. It does not create another manual comparison page.

## Scope

The owned media surface is exactly the eight forward/reverse pairs under `public/assets/hero`:

1. `sofa`
2. `chair`
3. `kitchen-dining`
4. `kitchen-island`
5. `bedroom-chair`
6. `bedroom-bed`
7. `terrace-chair`
8. `terrace-sofa`

The sixteen current MP4 files total `103,076,167` bytes. They all contain one primary H.264 video stream, no required audio, 24 FPS, 145 packets, and a duration of `6.041667` seconds. Their source dimensions are either `1168x768` or `1168x784` and must be preserved per file.

Excluded:

- `/assets/products/*` card and catalog transition videos;
- the existing product turntable WebM;
- focus and idle images;
- hero layout, copy, styling, timing, hotspot behavior, room state, and product state;
- a new visual comparison page;
- AV1, CDN migration, provider changes, database changes, or unrelated performance work.

## Delivery Choice

Each transition receives two production encodes:

1. Preferred source: VP9 WebM using the exact approved pilot recipe at CQ 28.
2. Compatibility fallback: H.264 MP4 using the exact pilot recipe at CRF 20 with `+faststart`.

The browser selects VP9 only when `canPlayType('video/webm; codecs="vp9"')` reports support. Otherwise it uses MP4. This keeps one selected `video.src` at a time and preserves the existing poster-first, interaction-gated loading model; it does not render or preload both formats.

## Encoding Contract

The rollout copies the approved pilot settings rather than inventing new ones.

### VP9 primary

- `libvpx-vp9`
- two-pass encode
- `-crf 28 -b:v 0`
- `-deadline good -cpu-used 1`
- `-threads 1 -row-mt 0 -tile-columns 0 -frame-parallel 0`
- `fps=24,format=yuv420p`
- primary stream `0:v:0`
- no audio
- metadata stripped
- CFR and source duration preserved

### H.264 fallback

- `libx264`
- `-crf 20 -preset slow -threads 1`
- `-movflags +faststart`
- `fps=24,format=yuv420p`
- primary stream `0:v:0`
- no audio
- metadata stripped
- CFR and source duration preserved

All candidates are written first to a new ignored rollout workspace. No production media is replaced while generation or validation is incomplete.

## Automatic Acceptance Gates

Every WebM and fallback MP4 must independently pass:

- exact source width and height;
- `yuv420p`;
- 24 FPS;
- 145 video packets;
- duration `6.041667 ± 0.001` seconds;
- exactly one playable video stream;
- zero audio streams and zero attached pictures;
- VMAF at least 95 using candidate as distorted input and immutable original as reference;
- candidate bytes less than its original source bytes;
- successful browser playback through `ended` with no media error.

The aggregate preferred WebM payload must be at least 40% smaller than the current aggregate MP4 payload. This is a rollout guard, not a promise that every pair will repeat the Terrace pair's exact 55.1% reduction.

If VP9 CQ28 fails only quality or stream gates for one file, retry that file with the already tested higher-quality VP9 CQ24 recipe. If H.264 CRF20 fails, retry with the already tested H.264 CRF18 recipe. If the higher-quality retry still fails or is not smaller than the original, stop the rollout before promotion and report the exact file. Never silently ship a failed candidate or weaken VMAF below 95.

## Promotion and Runtime Integration

After all thirty-two candidates pass:

- add sixteen `.webm` files alongside the hero assets;
- replace the sixteen current `.mp4` blobs with their validated compressed fallback candidates while keeping their existing filenames;
- preserve Git LFS handling for `.webm` and `.mp4`;
- extend each `HeroProduct` direction to carry preferred WebM and fallback MP4 paths;
- add one small capability resolver that selects WebM or MP4 before assigning the active transition source;
- keep the current lazy source lifecycle, cancellation cleanup, reduced-motion behavior, forward/reverse state, focus-image transition, and preload timing unchanged;
- update exact asset hashes and source-path tests.

The resolver must be deterministic and unit-testable. Unsupported, empty, or unavailable WebM capability selects MP4. A WebM playback error before useful playback may perform one bounded fallback to the matching MP4 without looping; the current focus/idle visual state remains the safe presentation while media is unavailable.

## Verification

The rollout uses automatic evidence and functional playback, not a new side-by-side visual review.

- Focused encoding/probe/VMAF tests validate every production candidate.
- Asset-contract tests validate all thirty-two production video files and hashes.
- Hero state and shell tests validate preferred/fallback paths, poster-first behavior, one selected source, forward/reverse transitions, cancellation, reduced motion, and one-time media-error fallback.
- Focused Chromium E2E exercises every one of the eight products in forward and reverse directions at desktop and mobile viewports.
- Completion verification follows repository policy once after all rollout tasks.

## Performance Measurement

Local verification proves correctness but does not claim deployed speed. After the implementation is locally accepted and the user separately authorizes push/deployment:

1. create or use the Phase 6 Vercel Preview;
2. run the same comparable anonymous mobile protocol used by Phase 6C evidence;
3. record selected codec, transferred hero-video bytes, request starts, FCP/LCP candidate, TBT, and playback readiness;
4. compare against the existing Phase 6C public baseline and record cache/build identity;
5. report the result without claiming Production improvement from Preview alone.

No push, Preview deployment, provider mutation, PR, or merge is authorized by this design approval alone.

## Failure and Recovery

- Originals remain recoverable from the immutable pre-rollout Git baseline and are not replaced until all candidate gates pass.
- Candidate generation failure leaves production files untouched.
- Promotion uses an exact allowlist and fails on missing, extra, stale, or mismatched media.
- Runtime source selection never loops between formats.
- A failed WebM load falls back once to MP4; a failed MP4 load returns to the existing safe focus/idle presentation.
- Any regression in interaction state, reduced motion, cancellation, or transition completion blocks delivery.

## Success

The rollout is complete locally when all sixteen WebM primaries and sixteen compressed MP4 fallbacks pass the gates, the hero uses VP9 when supported and MP4 otherwise, all eight products complete both transition directions on desktop and mobile, the preferred aggregate payload falls by at least 40%, and the repository completion gate is green. Deployed speed is evaluated only after a separately authorized Preview operation.

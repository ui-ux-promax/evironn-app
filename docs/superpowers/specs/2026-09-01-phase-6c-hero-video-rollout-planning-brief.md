# Phase 6C Hero Video Rollout Planning Brief

**Planning baseline:** `0034a019bf96dbb17918101312cd5ffe63562f0a`

**Approved design:** `docs/superpowers/specs/2026-09-01-phase-6c-hero-video-rollout-design.md`

**Output plan:** `docs/superpowers/plans/2026-09-01-phase-6c-hero-video-rollout.md`

## Objective

Produce one executable, review-gated plan that reuses the verified Terrace sofa VP9 CQ28/H.264 CRF20 experiment to encode and integrate all sixteen hero transition videos, preserves automatic quality and stream gates, adds deterministic WebM-to-MP4 runtime selection and one-time media-error fallback, runs bounded local functional/performance verification, and stops before any push or Vercel Preview operation.

## Required Task Shape

Use four sequential implementation tasks:

1. Generalize the rollout manifest/harness with focused contract tests while preserving the completed pilot harness.
2. Generate, validate, and promote exactly sixteen WebM primaries plus sixteen compressed MP4 fallbacks under an all-or-nothing gate.
3. Integrate dual-source runtime selection and one-time fallback without changing hero state, layout, timing, or poster-first loading.
4. Run the focused browser matrix, aggregate payload report, one repository completion gate, final review, status/progress closeout, and stop for user authorization before push/Preview.

Each task needs exact owned paths, exported interfaces, RED/GREEN or explicit characterization semantics, focused commands, expected output, one fresh Sol Medium review boundary, exact staging, a permitted local commit, and a stop condition. No task may hide encoding work behind “repeat for all files” without a binding inventory-driven command.

## Binding Decisions

- Reuse exact pilot recipes and validation semantics from session `01a05acb-c67b-7d22-826b-7822b2eaeb20`, run `terrace-pilot-20260901-04`, and harness commit `7dc7fb6e636bd36d59cb4e00b152cc9e0abbb4fe`.
- Preferred: VP9 CQ28 two-pass WebM. Retry only VP9 CQ24 when CQ28 fails quality or stream gates. An oversize CQ28 candidate is an immediate `NO_CHANGE`, because the higher-quality CQ24 recipe is not a size remediation.
- Fallback: H.264 CRF20 MP4. Retry only H.264 CRF18 when CRF20 fails.
- Candidate/reference VMAF order is `[dist][ref]`; threshold is at least 95 per file.
- Preserve each source's own dimensions: six living/bedroom files use `1168x768`; kitchen/terrace files use `1168x784`.
- Preserve 24 FPS, 145 packets, `6.041667 ± 0.001` seconds, `yuv420p`, one video stream, no audio, no attached picture, stripped metadata.
- Every candidate must be smaller than its original. Aggregate WebM bytes must be at least 40% below current `103,076,167` bytes.
- Generate and validate all thirty-two candidates in an ignored workspace before any production promotion.
- Runtime selects WebM only when `canPlayType('video/webm; codecs="vp9"')` is non-empty; otherwise MP4.
- Poster-first and interaction-only source connection remain binding. Do not preload both formats.
- WebM playback error may try matching MP4 exactly once. MP4 failure returns to existing `onFailure` behavior. No retry loop.
- No manual original/candidate page or visual approval gate.
- Product-card video files under `public/assets/products` remain excluded.
- Preview deployment/public after-measurement requires separate explicit user authorization.

## Scope and Ownership

Planning may authorize:

- one new focused bulk-rollout script and its focused test;
- the sixteen existing hero MP4 files;
- sixteen new matching hero WebM files;
- `components/evironn/home/hero-products.ts`;
- `components/evironn/home/hero-product-media.tsx`;
- focused hero asset/state/shell tests;
- one focused hero-transition Playwright scenario or an exact existing scenario when sufficient;
- ignored rollout evidence under one new `.superpowers/sdd/phase-6c-hero-video-rollout/` root;
- `.superpowers/sdd/progress.md` and `docs/roadmap/STATUS.md` only at Task 4 closeout.

Do not authorize package/lockfile, Prisma, environment, provider, workflow, DB, admin, catalog, PDP, product-card video, unrelated performance, deployment, GitHub, PR, merge, or branch operations.

## Repository Controls

- Repository: `D:\Projects\evironn`.
- Branch: `phase/06-hardening-release`.
- Approved design baseline: `0034a019bf96dbb17918101312cd5ffe63562f0a`.
- Preserve and never stage:
  - `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`
  - `docs/superpowers/plans/phase-2-task-3-execution.md`
- Never reset, clean, stash, rewrite, or delete unrelated work.
- Planning performs no encode, test, build, E2E, media promotion, deployment, push, PR, or merge.
- The future implementation baseline must be the commit containing this brief and the reviewed plan, not the earlier design baseline.

## Verification Economy

- Task checks stay focused.
- Task 2 owns real FFmpeg/ffprobe/VMAF execution and exact candidate evidence.
- Task 3 owns focused Vitest/typecheck only if the changed exported types require it.
- Task 4 owns one completion gate: `npm run format`, `npm run gate`, `npm run build`, and only the critical current-delivery E2E scenario.
- Final review is a fresh isolated Sol Medium functional/security/performance-contract review.
- No Preview or deployed-performance claim occurs locally.

## Valid Outcomes

- `ROLLOUT_READY_LOCAL`: all media/runtime/functional/aggregate gates pass; local commits exist; stop before push/Preview.
- `NO_CHANGE`: any candidate remains invalid after its one allowed higher-quality retry, aggregate WebM reduction misses 40%, or runtime/functional gate fails. Production media/runtime must remain or be restored to the immutable baseline; record exact cause and stop.
- `BLOCKED`: missing tool/dependency, protected-file drift, unexpected workspace state, or unsafe promotion boundary. Stop without partial production promotion.

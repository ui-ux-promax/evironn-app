# Phase 6C Hero Video Compression Planning Brief

## Objective

Write one executable, bounded experiment plan for the approved design in `docs/superpowers/specs/2026-08-31-phase-6c-hero-video-compression-experiment-design.md` at immutable design commit `c730d66`.

The plan must generate and compare H.264, VP9, and AV1 candidates for only the `terrace-sofa` forward/reverse pair. It must not replace production media, change runtime source selection, convert other videos, deploy, push, open a pull request, merge, or claim a deployed performance improvement.

## Required outcomes

1. A deterministic, reusable local experiment harness with focused tests.
2. Immutable-source verification before and after every encoding/measurement boundary.
3. Exact H.264 CRF 18/20, VP9 CQ 24/28 two-pass, and AV1 CQ 24/28 commands using only primary stream `0:v:0`, preserving 1168 x 784, 24 FPS, 6.041667-second timeline, `yuv420p`, and no audio.
4. A manifest containing commands, tool versions, hashes, probe metadata, exact bytes, pair reduction, VMAF, SSIM, PSNR, and eligibility for both directions.
5. Automatic rejection unless both directions reach VMAF >= 95 and the combined pair reduction is >= 50%.
6. Matched visual artifacts for eligible strategies: normal-speed side-by-side playback plus beginning, high-motion middle, and end same-timestamp frames.
7. User visual-approval stop before any production integration or rollout.
8. Explicit `NO_CHANGE` outcome when no strategy passes.

## Scope and ownership

Prefer three meaningful tasks: harness/tests, candidate generation/objective evidence, visual package/decision closeout. Keep task verification focused. Do not run the repository-wide gate, build, broad E2E, provider checks, DB work, or deployment.

One tracked script and one focused test file are acceptable because the harness will be reused if the remaining hero videos are later approved. All encoded candidates, raw metrics, frames, comparison videos, and experiment receipts belong under ignored `.superpowers/sdd/phase-6c-hero-video-compression/`. A concise ignored delivery report may summarize the experiment. `STATUS.md` must not claim rollout or completion before user visual approval.

## Safety

- Preserve the two protected untracked Phase 2 plans exactly.
- Preserve both original pilot blobs and their hashes.
- Never print or copy the source MP4 metadata comment into durable evidence.
- Strip source metadata from candidates.
- Refuse existing candidate output unless an explicit experiment-owned overwrite flag is supplied and the resolved output remains inside the exact ignored experiment root.
- Avoid shell interpolation of user-controlled paths; the harness owns the fixed source and output allowlists.
- No destructive cleanup command. Regeneration writes versioned run directories.

## Planning quality

Follow `writing-plans`: required header, exact paths, complete snippets or precise pseudocode, checkbox steps, RED/GREEN semantics, expected output, one owner per task, explicit commits, changed-path contract, review gates, and no placeholders. Use verification economy. The implementation baseline must be the future commit containing the approved plan and planning artifacts, not `c730d66`.

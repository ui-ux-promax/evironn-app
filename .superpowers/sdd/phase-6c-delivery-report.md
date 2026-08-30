# Phase 6C Performance and Resilience Delivery Report

## Immutable baseline

- Approved planning-artifact commit: `a662808d11f7083bbf2ce08573c09b1547498174`.
- Original measurement-evidence commit: `34b8938574fa4ea5de30a97342f284b1b5029ac9`.
- Measurement receipt recording commit: `d0fba2d82023300abfae42f62e20f4260bc6ef88`.
- Candidate commit: `Not created.`
- Candidate fallback-restoration commit: `Not created.`
- Fallback evidence commit: `Not created.`
- Pre-review closeout checkpoint commit: `137899f691c2ae6361741c49874b8b79ede1abbd`.
- Review remediation commits: Task 2 — `0e19079dad05ccca1287d232d644219a9cc0d378`, `640e0e131203438462b259336d1bdfa8fee70e43`; Task 3 — none; Task 4 — `8ac25e40b308e4b250fc40708d2de38e37db5fc5`.

The approved planning baseline is a future commit relative to the pre-plan design commit. The original measurement receipt remains the first measurement commit, even though later Task 2 remediation commits touched mutable evidence summaries.

## Measurement conditions and availability

The anonymous public measurement surface was available. Ten observations used fresh Chromium contexts: one cold candidate plus three repeats each for `/`, `/catalog`, and `/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle`. The protocol used a `390x844` viewport, blocked service workers, disabled browser cache, 4x CPU slowdown, 150 ms latency, fixed 1.6 Mbps download, fixed 750 Kbps upload, DOMContentLoaded plus a fixed 2500 ms observation window, and no interaction or credentials.

The installed `@playwright/test` version was `1.60.0`; launched Chromium reported `148.0.7778.96`. All ten observations used the same versions and null cache identity. No query cache-buster was used. HTTP status was `200`, route markers arrived before the fixed endpoint, the fixed window completed, and required timing/CDP fields were present for all three repeat runs on each route. The first observation is only a cold candidate; platform cold-start state was not proven.

The platform build identifier was unavailable. Public same-origin Script/Stylesheet resource fingerprints were recorded and consistent within each route series and with the cold candidate where applicable. This is resource identity evidence, not proof of a deployment build identity.

## Individual observations and medians

All repeat observations were comparable. `Observed bytes` means encoded-byte accounting; it remained unavailable for the route medians because required byte fields were incomplete or incomparable. `LCP` means the observation-window LCP candidate, not final LCP.

| Observation    | TTFB ms | FCP ms | LCP candidate ms |       CLS | TBT ms | Request starts | Hero starts | Hero bytes                |
| -------------- | ------: | -----: | ---------------: | --------: | -----: | -------------: | ----------: | ------------------------- |
| cold-candidate |    88.3 |   8984 |             8984 |         0 |   1761 |             83 |          16 | unavailable               |
| home-run-1     |    87.4 |   6272 |             6272 |         0 |   1164 |             83 |          16 | unavailable               |
| home-run-2     |    93.6 |   5420 |             5420 |         0 |   1033 |             83 |          16 | 295074 in one observation |
| home-run-3     |    91.5 |   6356 |             6356 |         0 |   1278 |             83 |          16 | unavailable               |
| catalog-run-1  |    85.0 |   2392 |             5348 |         0 |   1949 |             38 |           0 | 0                         |
| catalog-run-2  |    84.0 |   2264 |             3308 | 0.0003145 |   1243 |             35 |           0 | 0                         |
| catalog-run-3  |    83.9 |   2428 |             3608 | 0.0004007 |   1477 |             35 |           0 | 0                         |
| pdp-run-1      |    91.3 |   2316 |             2316 |         0 |    314 |             43 |           0 | 0                         |
| pdp-run-2      |    94.1 |   2352 |             2352 |         0 |    384 |             43 |           0 | 0                         |
| pdp-run-3      |    84.8 |   2308 |             2308 |         0 |    388 |             43 |           0 | 0                         |

| Route repeat median | TTFB ms | FCP ms | LCP candidate ms |       CLS | TBT ms | Request starts |
| ------------------- | ------: | -----: | ---------------: | --------: | -----: | -------------: |
| home                |    91.5 |   6272 |             6272 |         0 |   1164 |             83 |
| catalog             |    84.0 |   2392 |             3608 | 0.0003145 |   1477 |             35 |
| PDP                 |    91.3 |   2316 |             2316 |         0 |    384 |             43 |

INP is unavailable by protocol design because no interaction occurs. Catalog and PDP are regression guardrails only; no comparable after-surface exists in Phase 6C.

## Server-versus-browser/resource diagnosis

Home repeat TTFB median was 91.5 ms while FCP and the observation-window LCP candidate median were 6272 ms. Catalog and PDP show the same separation at lower paint values. The evidence therefore localizes substantial observed delay to browser/resource/render work, but does not prove a deployed root cause or authorize a broader optimization.

The exact 16 hero-video pathnames were attributed to the owner-local `HeroProductMedia` contract. Home request-start ledgers were comparable at 16 hero starts and 83 total starts in every repeat. The three per-run combined non-owner request-start values were `[67,67,67]`, giving owner median 16 versus combined non-owner median 67. Script also had 16 starts in each run, so the required strict owner-first ranking failed in every run. Encoded-byte accounting was unavailable as a comparable three-run series; the single observed owner-byte value does not establish a byte decision.

## Decision

`Decision: NO_CHANGE`.

The measurement surface, exact-path attribution, marker/timing comparability, version identity, and cache identity conditions passed. The candidate gate failed because encoded-byte evidence was unavailable and the permitted request-start fallback failed strict owner-first ranking and median dominance in all three home runs. The owner median was 16 starts, below the combined non-owner median of 67. Task 3 was skipped; no application production file or application test outside the measurement-evidence directory changed. This is a valid executable no-change result because the approved rule requires every candidate condition to pass before changing scheduling.

No evidence authorizes catalog/PDP optimization, shared-cache or dynamic-rendering changes, font changes, image-quality changes, media removal, or provider/auth/security changes. The hypothetical owner-local candidate remains exactly `preload="auto"` to `preload="none"` with activation-time `video.load()` preserved, but was not executed.

## Changed files and ownership

- Task 1 paths: `.superpowers/sdd/phase-6c-implementation-baseline.txt` and `.superpowers/sdd/phase-6c-planning-artifact-manifest.json`.
- Task 2 paths: `.superpowers/sdd/phase-6c-measurement-commit.txt` plus the static 15-path measurement-evidence set under `.superpowers/sdd/phase-6c-baseline/`.
- Task 3 paths: none; `components/evironn/home/hero-product-media.tsx` and `tests/performance/hero-product-media-scheduling.test.ts` are absent from the no-change delivery set.
- Task 4 paths: `.superpowers/sdd/phase-6c-delivery-report.md`, `.superpowers/sdd/phase-6c-changed-paths.txt`, `.superpowers/sdd/progress.md`, and `docs/roadmap/STATUS.md`.

The final path ledger is generated against the immutable baseline and must contain exactly the Task 1 paths, Task 2 receipt and 15 evidence paths, and these four Task 4 paths, plus no application component or scheduling-test path. The two protected untracked Phase 2 plan files remain unchanged and unstaged.

## Focused validation

The ordered Task 4 validation set is limited to collector syntax, the current 18-test dependency-free collector suite, existing-evidence validation, touched-document Prettier checks, the exact no-change changed-path collector, protected hashes, and the value-free secret scan. The touched-document Prettier write/check passed. The final collector passed with 15 baseline files and 22 owned paths in the NO_CHANGE allowlist; the ledger was included before its own path was staged. Protected hashes passed for both files, and the value-free secret scan reported `secret-scan=0 paths`. Step 6 collector syntax, all 18 collector tests, existing-evidence validation, final documentation Prettier checks, and application-path absence checks passed. No full gate, build, E2E, deployment, push, pull request, merge, or Phase 6D action is in scope.

## Task reviews

Task 2 fresh final review: PASS, Critical 0 / Important 0 / Minor 0, after root checks. Task 2 review remediation history is preserved in the immutable measurement receipt chain. Task 3 was skipped and has no implementation or review. Latest pre-finalization exact-state Sol Medium review: PASS, Critical 0 / Important 0 / Minor 0. Task 4 finalization records all known checkpoint and remediation receipts; finalization commit SHA is intentionally not recorded in its own receipt files.

## Security and protected-file checks

The measurement evidence uses anonymous public navigation and safe response-header/resource fields only. No credentials, cookies, authorization data, request or response bodies, environment values, or personal data are part of this delivery. Protected Phase 2 plan hashes passed and remain `c9ac4d833e4f0aea2a474115f3aef58ffd04ef0c` and `acbeaf76e79ad2ae6dcb3541a306e6af7c80055e`. The final ordered Task 4 value-free secret scan passed with zero violating paths and emitted no secret values.

## Limitations and uncertainty

- Build ID was unavailable; resource fingerprints provide deterministic public-resource identity only.
- Encoded-byte accounting was unavailable or incomparable for the home decision series, so request-start fallback controlled the decision.
- LCP values are observation-window candidates, not final LCP.
- A first request is only a cold candidate; Vercel cold-start state was not proven.
- Catalog and PDP are guardrails without a Phase 6C after-comparison.
- No deployed improvement claim is made.

## Phase 6D handoff

Phase 6D owns production build, complete gate, broad E2E, deployment, comparable public after-measurement, release closeout, push, PR, merge, and any deployed-performance claim. Phase 6C makes no deployed improvement percentage claim.

## Approval stop

Approval stop is authorized after the fresh exact-state Sol Medium review passed with Critical 0 / Important 0 / Minor 0 and final receipt validation leaves the bounded state clean. Explicit user approval remains required before Phase 6D. No Phase 6D action is authorized.

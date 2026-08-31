# Phase 6C Primary Image Remediation Delivery Report

## Verdict

`PRIMARY_CANDIDATE_REJECTED`

The candidate failed the exact five-image request reduction gate: request-start median moved from 5 to 4, a `0.2` (20%) reduction, below the required `0.5` (50%) reduction. The candidate was restored from the immutable implementation baseline. No fallback candidate was selected.

Local classification: `controlled-local-diagnostic-only`. No deployed or production-bundle performance claim is made.

## Baseline and commits

- Immutable implementation baseline: `ef6adf4ead33f7ec5df4ad4acd50bbb369b4ff46`.
- Task 1 amended measurement commit: `9b389efcfff56cfb9ab36d107a68c036de8e635a6`.
- Task 3 rejection commit: `179b8b5ba26ac4b8dcde00c1ac6952eb020c3950`.
- Restored production blob: `d9a77661b1ccd7c5071b935a8f23c7fb7b551df8`.

## Home medians

| Metric | Before | After | Lower-is-better change |
| --- | ---: | ---: | ---: |
| Request starts | 5 | 4 | 20.0000% |
| FCP | 2648 ms | 2668 ms | -0.755287% |
| Observed LCP candidate | 2648 ms | 2668 ms | -0.755287% |
| TBT | 483 ms | 492 ms | -1.863354% |

All six home runs were comparable. Request reduction failed before performance retention could pass.

## Guardrails

| Route | Metric | Before | After | Regression | Gate |
| --- | --- | ---: | ---: | ---: | --- |
| `/catalog` | TTFB | 102.40000000596046 ms | 101.69999998807907 ms | 0% | pass |
| `/catalog` | FCP | 1932 ms | 1912 ms | 0% | pass |
| `/catalog` | Observed LCP candidate | 2540 ms | 2504 ms | 0% | pass |
| `/catalog` | TBT | 424 ms | 439 ms | 3.537736% | pass |
| `/catalog` | CLS | 0.00031452583741812417 | 0.00031452583741812417 | 0% | pass |
| `/catalog` | Request starts | 18 | 18 | 0% | pass |
| Selected PDP | TTFB | 116.80000001192093 ms | 116.80000001192093 ms | 0% | pass |
| Selected PDP | FCP | 1892 ms | 1940 ms | 2.536998% | pass |
| Selected PDP | Observed LCP candidate | 1892 ms | 1940 ms | 2.536998% | pass |
| Selected PDP | TBT | 126 ms | 131 ms | 3.968254% | pass |
| Selected PDP | CLS | 0 | 0 | 0% | pass |
| Selected PDP | Request starts | 25 | 25 | 0% | pass |

Both guardrail routes were comparable and had no median regression greater than 10%.

## Visual gate

Pass. Seven fixed screenshot pairs passed deterministic content-hash, 390x844 dimension, above-fold geometry, computed-style, and hero-readiness checks. Above-fold boxes and hero readiness were unchanged.

## Restore proof

- Working baseline text matched the committed `implementation-baseline.txt` value exactly: `ef6adf4ead33f7ec5df4ad4acd50bbb369b4ff46`.
- Baseline commit object resolved successfully.
- `components/evironn/home/furniture-editorial-sections.tsx` baseline blob matched current blob exactly after restore: `d9a77661b1ccd7c5071b935a8f23c7fb7b551df8`.
- `e2e/performance/furniture-editorial-lazy.spec.ts` was absent from the immutable baseline and removed after exact path validation.
- Complete before/after evidence and `primary-comparison.json` were preserved.

## Reviews

- Task 1 fresh remediation review: PASS; Critical 0 / Important 0 / Minor 0.
- Task 2 fresh review: Spec PASS; Code Quality PASS; Critical 0 / Important 0 / Minor 0.
- Task 3 fresh review: Spec PASS; Code Quality PASS; Critical 0 / Important 0 / Minor 2. Minor dispositions: defer aggregate style diagnostic precision cleanup; defer stronger current-decision assertion in CLI test. Both are non-blocking and current evidence is exact.
- Task 4 final functional/security review: PASS; Critical 0 / Important 0 / Minor 0.

## Focused validation

- `node --test .superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs`: 33 tests passed.
- `npx --no-install vitest run tests/evironn-home-shell.test.tsx tests/evironn-phase-2a-source-contract.test.ts`: 2 files / 10 tests passed.
- Prettier check on collector modules and dedicated config: passed.
- PowerShell parser check on `run-controlled-primary.ps1`: passed.
- `git diff --check`: passed.
- Value-free secret scan: provisional and final closeout scans passed with `0` violating paths over the exact outcome allowlist.

## Protected files

- `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`: `c9ac4d833e4f0aea2a474115f3aef58ffd04ef0c`.
- `docs/superpowers/plans/phase-2-task-3-execution.md`: `acbeaf76e79ad2ae6dcb3541a306e6af7c80055e`.

## Provisional observed path sets

Captured before final review and checkpoint commit using the Task 4 exact collection command:

- Tracked baseline-to-HEAD set: 43 paths; exactly the committed Task 1/Task 3 evidence and collector set listed in `changed-paths.txt`.
- Staged set: `.superpowers/sdd/phase-6c-remediation/changed-paths.txt`, `.superpowers/sdd/phase-6c-remediation/delivery-report.md`, `.superpowers/sdd/progress.md`, `docs/roadmap/STATUS.md`.
- Working-tree unstaged set: 0 paths.
- Non-ignored untracked set: the two protected Phase 2 plan paths above.
- Ignored files in the two owned remediation scopes: 0 paths.
- Union before final commit: 49 paths = 47 allowed outcome paths + 2 protected paths.

## Scope and stop

No build, `npm run gate`, complete Vitest, broad E2E, public/Vercel after-measurement, deployment, provider or database mutation, push, PR, merge, release closeout, fallback ladder, next candidate, or Phase 6D action occurred. Phase 6C stops for user acceptance after final review and checkpoint commit. Rejected candidate requires a separate evidence/plan cycle before any later performance candidate.

reviewStatus: PASS
reviewFindings: Critical 0 / Important 0 / Minor 0

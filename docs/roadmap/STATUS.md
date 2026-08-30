# Migration status

## Current state

- Bootstrap and Phases 1–5 are complete and merged into `dev`.
- Phase 5 merged through PR #10 at merge commit `b40b125` on 2026-08-26.
- The accepted Evironn admin redesign follow-up merged through PR #11 at merge commit `e06ae9c` on 2026-08-29.
- Current integration branch: `origin/dev` at exact commit `e06ae9c`.
- Current local delivery branch: `phase/06-hardening-release`, created from exact `origin/dev` commit `e06ae9c`.
- Phase 6A and 6B are user-accepted on the local branch. Phase 6C implementation/checkpoint is complete and pending final review and user approval. Phase 6D has not started.
- Current release branch: `origin/main` at `162a35e`. The final `dev` to `main` release remains pending.

## Completed merges

- Phase 1: PR #1, merge commit `3e4e2a0`.
- Phase 2: PR #2, merge commit `b31194a`.
- Phase 3: PR #3, merge commit `868310f`.
- Phase 4: PR #4, merge commit `9bbb70f`.
- Phase 4 deployment-smoke follow-up: PR #5, merge commit `f10ceb9`.
- Phase 4 durable closeout: PR #9, merge commit `da5e87e`.
- Phase 5 admin/demo-admin: PR #10, merge commit `b40b125`.
- Evironn admin redesign: PR #11, merge commit `e06ae9c`.
- The accidental earlier `dev` to `main` merge was reverted through PR #8; `main` remains at `162a35e` until the final release.

Historical delivery details for Phases 1–4 are summarized in `docs/roadmap/archive/PHASES-1-4.md`. Phase 5 evidence remains in the tracked `.superpowers/sdd/phase-5*` reports, the approved Phase 5 plans, and Git history.

## Accepted Phase 5 state

- `/admin` is protected by server-enforced ADMIN authorization across layouts, reads, actions, and mutation/API boundaries.
- The protected admin includes dashboard, categories, rooms, products, option groups and values, SKU matrix, stock, media/360, orders, customers, roles, and coupons.
- Cloudinary signing and deletion remain ADMIN-only and restricted to the Evironn folder boundary.
- `/demo-admin` is public, synthetic, read-only, independent from Prisma, and exposes no mutation path.
- Phase 5 functional/security debt was closed or explicitly dispositioned in 5D before merge.
- Phase 5 closeout passed `npm run format`, `npm run gate` (223 files / 1360 tests), `npm run build`, and the critical Phase 5 Playwright set (10/10).
- The user accepted protected `/admin` and public `/demo-admin` desktop/mobile behavior before the Phase 5 merge.

## Accepted admin redesign state

- The post-Phase-5 redesign replaces the inherited presentation with the approved Evironn admin shell and screen system while preserving the completed server contracts and business logic.
- Dashboard, Catalog, Orders, Customers, Promotions, product management, shared navigation, responsive layouts, loading states, and dashboard interactions were visually reviewed by the user.
- The final redesign closeout passed `npm run gate` (229 files / 1412 tests) and `npm run build` before push. No database migration or environment-contract change was introduced.
- Existing non-blocking lint warnings remain tracked baseline debt; the final gate reported zero lint errors.

## Phase 6 retained scope and debt

- Measure and improve the previously accepted slow initial Vercel page load; do not optimize speculatively without production or Preview evidence.
- Inventory the current Evironn implementation before changing it. Reuse working hardening and operations code inherited from `fashion-shop`; implement only demonstrated gaps.
- Finish or verify Upstash rate limiting, Sentry reporting, security headers, CSRF boundaries, health endpoints, and idempotent demo reset behavior.
- Verify Vercel and Neon environment separation plus Cloudinary, Resend, DaData, YooKassa sandbox, and other external-service fallbacks without printing secrets.
- Verify responsive behavior, loading/error fallbacks, secret hygiene, production smoke paths, and deployment/runbook documentation.
- Real YooKassa sandbox creation/cancellation remains an optional manual smoke under ADR-020 unless the user explicitly promotes it to a release blocker.
- Use the shared non-production Neon `dev` target for portfolio E2E under ADR-020. Fixtures must remain uniquely owned and use targeted cleanup only.

## Phase 6 delivery boundary

- Branch: `phase/06-hardening-release`.
- One Phase 6 branch and one pull request into `dev`; bounded sessions may be used to protect context quality.
- Recommended internal sequence: 6A audit/infrastructure, 6B hardening/integrations, 6C performance/resilience, 6D release closeout.
- Use focused verification during implementation. Run the complete gate once at Phase 6 closeout unless cross-cutting remediation invalidates it.
- Do not open the Phase 6 pull request, merge it, or open the final `dev` to `main` release pull request without explicit user authorization.

## Phase 6A focused checkpoint — 2026-08-29

- Approved plan: `docs/superpowers/plans/2026-08-29-phase-6a-hardening-foundation.md`; implementation baseline `4f4503c`.
- Task 1 commit: `4c3c6d3` (`fix: clean stale hardening identifiers`). Updated active rate-limit/logger/reset-lock/CI identifiers and authorized `e2e/a11y.spec.ts` showcase route references. Task review approved after one E2E-flow remediation; the focused checkout E2E attempt stalled and was interrupted without green evidence.
- Task 2 commit: `2e83b0f` (`fix: close critical hardening defects`). Added compact Redis, CSRF, middleware, CSP, logger/Sentry, health, and DaData boundary coverage; fixed mixed Redis alias handling. Task review approved after deterministic environment stubbing and spy cleanup.
- Task 3 commit: `f0867df` (`fix: close demo operations defects`). Added reset-lock, reset-guard, environment, CI, cron, smoke, and operations-document coverage; fixed mixed Redis alias handling and strengthened canonical SKU/global temporary cleanup assertions. Task review approved after remediation.
- Task 4 checkpoint passed: 8 files / 24 tests; manual changed-file Prettier check passed; `git diff --check` passed. Typecheck was not run because no shared TypeScript contract changed. Path-only secret scan listed only known dummy fixture/config paths: `.github/workflows/ci.yml`, `tests/phase-5-active-brand.test.ts`, and `vitest.config.ts`; no unexplained secret-bearing path and no matched values were printed.
- Final Sol functional/security review passed with Critical 0, Important 0, Minor 0; no remediation required. The review confirmed Redis fail-open/fail-closed behavior, CSRF/CSP, Sentry/PII/ADMIN controls, reset guards/lock/idempotency, CI/cron/smoke contracts, scope exclusions, and preservation of Phase 4/5 boundaries.
- Full Phase 6 gate, build, broad E2E, deployed smoke, provider checks/mutations, database commands/mutations, Vercel/GitHub changes, push, pull request, merge, performance work, and Phase 6C/6D remain unexecuted and require later authorized scope. Phase 6B is recorded below.

## Next action

1. Complete final exact-state Sol review and receipt finalization for Phase 6C.
2. Wait for explicit user approval before beginning Phase 6D.

## Phase 6B focused checkpoint — 2026-08-30

- Approved-plan baseline: `568c49ac843b23256622041923a80d7824accc6a`; branch remains `phase/06-hardening-release`.
- Task 1: environment reader characterization found no runtime-name drift; added presence-only Local/Preview/Production/Build/Optional smoke guidance. Commit `a750e57`; Sol review Critical 0 / Important 0 / Minor 0.
- Task 2: Cloudinary/Resend suites passed 17 files / 126 tests. Fixed only demonstrated category post-database cleanup ordering and Resend provider-error message exposure; added focused assertions. Commit `8c25b9d`; Sol review Critical 0 / Important 0 / Minor 0.
- Task 3: deterministic DaData timeout RED passed at the missing signal assertion; added route-local 5-second abort and cleanup. DaData passed 1 file / 6 tests; YooKassa/payment characterization passed 10 files / 145 tests. Commit `5f1874d`; Sol review Critical 0 / Important 0 / Minor 0.
- Task 4 compact checkpoint passed 9 files / 93 tests with mocks. Fresh final Sol Medium functional/security review: PASS, Critical 0 / Important 0 / Minor 0; no remediation required. No real provider/database/deployment operation, full gate, build, E2E, push, PR, merge, or release occurred.
- Path-and-line-only secret scan returned `tests/dadata-suggest-route.test.ts:81`; redacted inspection classified it as a known test-fixture `secret` placeholder. No values printed; no credential, DSN, token, cookie, payment, or personal-data hit.
- Retained: ADR-009 newsletter deferral; ADR-017/018 payment correlation, durable claim, write-once dispatch, guarded release, and fail-closed rules; ADR-020 mocked providers and optional non-blocking YooKassa smoke. Phase 6C performance and Phase 6D release closeout excluded.
- Residual risks: no external provider/Vercel environment presence was verified; real YooKassa sandbox smoke remains optional/non-blocking; initial Vercel load remains Phase 6C debt.
- User accepted Phase 6B on 2026-08-30 and authorized Phase 6C design/planning. Public read-only Vercel measurement is allowed; deployment and the comparable public after-measurement remain Phase 6D scope.

## Phase 6C focused checkpoint — 2026-08-30

- Approved design remains `docs/superpowers/specs/2026-08-30-phase-6c-performance-design.md`; immutable implementation baseline is `a662808d11f7083bbf2ce08573c09b1547498174`.
- Task 1 and Task 2 are complete. Original measurement-evidence commit remains `34b8938574fa4ea5de30a97342f284b1b5029ac9`; receipt commit is `d0fba2d82023300abfae42f62e20f4260bc6ef88`; Task 2 remediation commits are `0e19079dad05ccca1287d232d644219a9cc0d378` and `640e0e131203438462b259336d1bdfa8fee70e43`.
- Fresh raw evidence is 10/10: one cold candidate plus three comparable home, catalog, and PDP repeats under the fixed anonymous mobile protocol. Null cache identity is comparable across all observations; marker timing is before the fixed endpoint; all route series are 3/3 comparable. Build ID is unavailable; resource fingerprints remain explicit identity evidence only.
- Decision is `NO_CHANGE`. Home medians: TTFB 91.5 ms, FCP/LCP observation-window candidate 6272 ms, CLS 0, TBT 1164 ms, total starts 83. Catalog medians: TTFB 84 ms, FCP 2392 ms, LCP candidate 3608 ms, CLS 0.0003145, TBT 1477 ms, starts 35. PDP medians: TTFB 91.3 ms, FCP/LCP candidate 2316 ms, CLS 0, TBT 384 ms, starts 43. Owner starts median 16 versus combined non-owner median 67; owner bytes unavailable; strict fallback gate failed in all three home runs.
- Task 3 is skipped and created no application production file or application test. Task 4 is underway and owns only its report, changed-path ledger, progress entry, and this status section. No catalog/PDP/shared-cache/auth/provider/security change is authorized.
- Task 2 fresh final Sol Medium review passed after root checks: Critical 0 / Important 0 / Minor 0. Task 4 proceeds only through the clean pre-review checkpoint; no final review or finalization is performed here.
- Task 4 focused Steps 3–6 passed: touched-document Prettier, exact static 15-file baseline and 22-path NO_CHANGE collector, both protected hashes, value-free secret scan with zero violating paths, current 18-test dependency-free collector suite, existing-evidence validation, final documentation Prettier, and absence of both Task 3 application paths.
- Phase 6C makes no deployed improvement claim. Phase 6D owns production build, complete gate, broad E2E, deployment, comparable public after-measurement, release closeout, push, PR, merge, and any deployed-performance claim.

## Protected local files

Preserve these pre-existing untracked Phase 2 plans without modification, staging, cleanup, or deletion:

- `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`
- `docs/superpowers/plans/phase-2-task-3-execution.md`

## Environment note

- `.env.local` contains the expected application database variable names. Never print their values.
- Vercel environment values and external-provider credentials must be checked by presence and target/environment only unless the user explicitly requests a provider operation.
- Vercel builds must never run `prisma db push`; schema changes use reviewed Prisma migrations outside the build command.

# Migration status

## Current state

- Bootstrap and Phases 1–5 are complete and merged into `dev`.
- Phase 5 merged through PR #10 at merge commit `b40b125` on 2026-08-26.
- The accepted Evironn admin redesign follow-up merged through PR #11 at merge commit `e06ae9c` on 2026-08-29.
- Current integration branch: `origin/dev` at exact commit `e06ae9c`.
- Current local delivery branch: `phase/06-hardening-release`, created from exact `origin/dev` commit `e06ae9c`.
- Phase 6A and 6B are user-accepted on the local branch. Phase 6C implementation/checkpoint and final review are complete. Phase 6D closeout/remediation is locally verified but remains uncommitted and unpushed, pending a new Preview cycle.
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

1. Complete Phase 6D only through the authorized local closeout; request explicit user authorization before commit/push for a new Preview.

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
- Task 3 is skipped and created no application production file or application test. Task 4 finalization is complete and owns only its report, changed-path ledger, progress entry, and this status section. No catalog/PDP/shared-cache/auth/provider/security change is authorized.
- Task 2 fresh final Sol Medium review passed after root checks: Critical 0 / Important 0 / Minor 0. Latest exact-state Sol Medium review passed: Critical 0 / Important 0 / Minor 0. Finalization receipt records known checkpoint/remediation SHAs and intentionally omits its own SHA.
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

## Phase 6C primary image remediation — 2026-08-31

- Immutable implementation baseline: `ef6adf4ead33f7ec5df4ad4acd50bbb369b4ff46`.
- Task 1 measurement commit: `9b389efcfff56cfb9ab36d107a68c036de8e635a6`; fresh Sol review PASS, Critical 0 / Important 0 / Minor 0. Controlled local BEFORE evidence contains 3 home, 3 catalog, and 3 selected-PDP runs plus seven fixed screenshots.
- Task 2 used genuine RED/GREEN. The production candidate added exactly three `loading="lazy"` attributes in `components/evironn/home/furniture-editorial-sections.tsx` and one focused test was created. Fresh Sol review PASS, Critical 0 / Important 0 / Minor 0.
- Task 3 after evidence completed one controlled local comparison. Request-start median improved from 5 to 4 (20%), below the required 50% reduction. Home FCP/LCP candidate changed 2648 ms to 2668 ms; TBT changed 483 ms to 492 ms. Visual gate passed 7/7 pairs; catalog and selected-PDP guardrails passed with no regression over 10%.
- Verdict: `PRIMARY_CANDIDATE_REJECTED`. Task 3 rejection commit: `179b8b5ba26ac4b8dcde00c1ac6952eb020c3950`. Production blob was restored exactly to `d9a77661b1ccd7c5071b935a8f23c7fb7b551df8`; focused candidate test was removed. No fallback candidate or new `NO_CHANGE` artifact was created.
- Task 3 review: Spec PASS / Code Quality PASS; Critical 0 / Important 0 / Minor 2. Minor dispositions: defer aggregate style diagnostic precision and stronger current-decision CLI assertion.
- Task 4 closeout PASS: fresh Sol Medium functional/security review found Critical 0 / Important 0 / Minor 0. Checkpoint commit is the final Phase 6C local state; Phase 6C remains local diagnostic only. Phase 6D retains production build, full gate, deployment, comparable public after-measurement, push, PR, merge, and release work.

## Phase 6C WebM hero rollout remediation — 2026-09-02

- Scope: complete the approved 16-transition WebM hero rollout using supplied ready WebM files. No video re-encode, quality change, push, PR, merge, deployment, provider operation, or database operation occurred.
- Immutable implementation baseline: `6d3b436ed6c6fc0d4a88762c57dd03c2a33ccac9`.
- Task 2 asset commit: `ccc58dc72ce04e61da1890487dcd910fd87d5172`; Task 3 runtime commit: `9cdc3c9226fb39869fb7528ae609280ab363e0e7`; type remediation commit: `456999a74f84d27e666ea3ff9aa7be479e912be4`; browser matrix commit: `04dbf173fd59d20a33da52e916b1100054ce49dd`.
- Added exactly 16 WebM assets alongside unchanged 16 MP4 fallbacks. Final WebM total is 58,525,367 bytes versus 103,076,167 original MP4 bytes: 44,550,800 bytes / 43.221% reduction. All 16 passed structural ffprobe gates: VP9, source dimensions, `yuv420p`, 24 fps, 145 packets, approximately 6.042 seconds, one video stream, zero audio streams, and no forbidden metadata. Fourteen files received lossless metadata-only remux; no decoded video content changed.
- Runtime uses WebM only when the VP9 capability check succeeds, connects one source at a time, falls back once to matching MP4 before useful playback, ignores stale events, preserves reduced-motion behavior, and retains existing failure handling.
- Focused Phase 6C Vitest passed 5 files / 126 tests. Scoped Prettier passed. Scoped ESLint passed with 0 errors and 10 existing warnings. `git diff --check` passed. `npm run build` passed. Hero rollout E2E passed 2/2: desktop `1440x1000` and mobile `390x844`; all 16 directions were exercised per viewport, including WebM playback, fallback, unsupported-capability MP4 selection, console-error guard, and overflow guard.
- Type remediation used local explicit types only in `tests/hero-video-rollout.test.ts` and `tests/hero-video-compression-experiment.test.ts`. No assertion weakening, `@ts-ignore`, `@ts-expect-error`, or test exclusion was added. A follow-up corrected the test-local DaData signal type to match the platform's `AbortSignal | null | undefined` contract. DaData passed 1 file / 6 tests and the full TypeScript check now passes.
- Full `npm run lint` remains blocked by the repository's unrelated Prettier baseline (242 files); no broad formatting was applied. Build's non-blocking warnings are existing image-quality, Tailwind ambiguity, and Sentry-auth warnings.
- Task 2 and Task 3 Sol reviews returned Critical 0 / Important 0 / Minor 0. Two fresh final-review attempts were technically unavailable: first remained running for approximately four minutes; second remained running through a 60-second wait and was stopped. No review finding was returned. This infrastructure failure is recorded separately and does not invalidate the focused tests, build, or browser evidence.
- Verdict: `READY WITH BASELINE DEBT` for local WebM rollout. Remaining debt: repository-wide Prettier baseline, unavailable final reviewer result, no Preview/production performance measurement. Protected untracked Phase 2 plan files remain preserved.

## Phase 6C hero room media preload pilot — Task 4 closeout — 2026-09-04

- Task 3 acceptance is complete locally: fresh Sol Medium review 5 returned READY with Critical 0 / Important 0 / Minor 0 after retained-resource, stale-callback, dismissal/retry, StrictMode, reduced-motion, focus, poster, card-reveal, timeout, and fourth-resource evidence was closed. No browser claim is derived from jsdom.
- Task 4 completed the approved browser proof using only `playwright.hero.config.ts`, `e2e/evironn-hero-video-rollout.spec.ts`, and hero-related `e2e/evironn-home.spec.ts` assertions/helpers. Exact bounded command returned `10 passed (3.4m)` against local HTTP 200 Chromium at desktop `1440x1000` and mobile `390x844`. Focused recovery returned `1 passed (13.5s)`; the affected home subset after diagnostic-filter remediation returned `5 passed (30.3s)`.
- Browser proof covers four living/kitchen video resources, deferred fourth kitchen resource, all four products forward/reverse, native playing/ended and real animation completion, request/Blob/object-URL/source/node reuse, MP4/WebM capability, kitchen failure→dismissal→fresh attempt→retry→ready, reduced motion, focus/card/overflow, and zero bedroom/terrace video requests. JSON ledgers and screenshots are attached by Playwright under `test-results`.
- A reproducible retained-bundle/native-readiness race was fixed in `components/evironn/home/hero-product-media.tsx`; no public API, asset, registry, CSP, database, env, provider, or deployment change was introduced. Focused shell `49/49`, Prettier, ESLint, `tsc --noEmit`, and `git diff --check` passed.
- Final Sol Medium re-review: `PASS/READY`, Critical 0 / Important 0 / Minor 1. The only minor (generic hydration-warning filtering) was narrowed to the reduced-motion test; the affected browser subset passed. This is local evidence only, not a production or visual-acceptance claim.
- No full Phase 6 gate/build, push, PR, deploy, merge, database/provider operation, or release action occurred. Protected Phase 2 plan files remain untracked and unchanged. Next gate: user desktop/mobile visual acceptance.

## Hero inert warning correction — 2026-09-04

- Corrected the final `inert` representation to `inert={preparing}` in `components/evironn/home/hero.tsx`. The earlier empty-string workaround was rejected by Next's bundled React DOM as false; the real Chromium console guard now runs without suppressing inert diagnostics.
- Verification: local home Chromium `5/5`; shell `49/49`; Prettier, ESLint, `tsc --noEmit`, and `git diff --check` passed. React 18 jsdom still reports its separate non-boolean inert warning because its runtime metadata differs from Next's bundled client; no browser claim is based on that warning-bearing environment.
- Follow-up is local-only and does not change deployment, database, environment, provider, asset, release, or visual-acceptance state.

## Hero preparation visual correction — 2026-09-04

- User recording exposed unstyled native media during bootstrap and kitchen preparation. The cache appended focus images and videos before the ready-bundle React effect assigned their hidden asset class. A real Chromium regression reproduced two visible images and three visible videos while the fourth video was held.
- The cache now assigns the existing hidden base asset class before DOM insertion. Retained node identity, Blob ownership, fetching, readiness gates, and transition behavior remain unchanged. Desktop and mobile tests hold the fourth resource and verify hidden product media, unchanged current-room poster, and no room transition until readiness.
- Replaced the preparation panel and visible loading text with the official Loading UI Fade Arc geometry, manually installed from its registry with its MIT notice. Animation uses a CSS module rather than an inline style block; CSP and package configuration are unchanged. The 40px spinner is centered in hero; the accessible nonvisual loading label and error/retry UI remain.
- Verification: both new focused tests failed before correction; the affected Vitest suites then passed 74/74. Local Chromium passed 3/3: desktop/mobile held-resource visual checks and the existing desktop real-media rollout. Inspected the preparation screenshots. Scoped ESLint, Prettier, and `git diff --check` passed. No full gate/build or deployed-performance claim.
- Changes remain uncommitted for user visual acceptance at localhost:3000. No push, PR, deployment, merge, database/provider operation, asset replacement, or protected-plan modification.

## Hero product end-frame handoff — 2026-09-04

- Removed completion/effect-cleanup rewinds from retained product videos. Playback now rewinds only before the next hidden start. Forward completion reveals the already-decoded focus image before hiding the finished video; reverse completion exposes the existing room poster without seeking back to the close-up frame.
- Eight regression cases (all four pilot products, both directions) failed against the previous handoff, then passed after correction. Focused Vitest suites passed 82/82; scoped ESLint, Prettier and diff checks passed. Desktop Chromium real-media rollout passed 1/1, covering all four products, forward/reverse playback and repeat navigation with retained media.
- The automated evidence verifies lifecycle behavior, not a frame-perfect visual acceptance claim. User confirmation of the reported sub-second flicker remains pending on localhost. No assets, providers, database, deployment or Git history changed.

## Hero bedroom and terrace expansion — 2026-09-04

- Extended the existing hero room availability contract from the two-room pilot to all four manifested rooms. Bedroom and terrace keep demand-only poster/video mounting; initial render still requests only the living bundle. The existing Blob cache, selected WebM/MP4 source policy, readiness gates, serial preparation queue, stale-operation guards, recovery/retry flow, reduced-motion path, Fade Arc overlay, hidden native-media class, end-frame handoff, and retained node/object-URL lifecycle were reused without a parallel mechanism.
- Added explicit bedroom/terrace catalog-room mappings and removed the kitchen-only enablement flag. Accepted room/product manifests and assets were not replaced or recoded; product copy, composition, card positioning, hotspot rules, and existing animation behavior remain unchanged.
- Updated pilot assertions to require all four controls after living readiness while retaining no-request coverage before bedroom/terrace selection. Added focused coverage for complete bedroom/terrace four-video bundles and retained-media revisits.
- Focused Vitest passed 4 files / 100 tests. Scoped ESLint passed with zero errors. TypeScript `tsc --noEmit` passed. Scoped Prettier write/check and `git diff --check` passed.
- Local Chromium browser coverage passed 11 scenarios across desktop `1440x1000` and mobile `390x844`: all four rooms, both products and forward/reverse transitions, sequential traversal, repeated visits without new Blob/object-URL/source work, codec selection, held slow bedroom preparation, initial kitchen recovery, and bedroom resource failure with explicit retry. The first full run was 10/11 because the new retry assertion counted two intentionally failed WebM/MP4 requests; the corrected focused retry scenario passed 1/1. This is automated local evidence, not user visual acceptance.
- No commit, push, PR, deploy, merge, database/provider/environment change, asset replacement, or protected-plan modification was made. User should review the result locally at `http://localhost:3000/` on desktop and mobile, especially preparation blur/Fade Arc, room switching, hotspot/card layering, and bedroom/terrace retries.

## Four-room hero visual acceptance — 2026-09-04

- User confirmed local visual acceptance of all four rooms and authorized pushing the existing phase branch. This supersedes the pending visual-acceptance notes above, including preparation artifacts, Fade Arc, end-frame flicker and Aster card spacing.
- Delivery includes the accepted pilot implementation and follow-up fixes plus bedroom/terrace expansion. Temporary local Playwright configuration and both protected Phase 2 plans are excluded from the commit. No PR or merge is authorized; this is a preview push, not full Phase 6 release acceptance.

## Phase 6D release closeout — 2026-09-04

- Closeout report: `.superpowers/sdd/phase-6d-closeout-report.md`. Branch `phase/06-hardening-release` and `origin/phase/06-hardening-release` both point to `4d9e8e6421b792a16eb4d2e12c42301b3321c201`; `origin/dev` remains `e06ae9c6e91190ddb98569305c36411104a047d8`.
- Verdict: `NOT READY FOR PR`. No commit, push, PR, merge, deploy, database/provider operation, seed/reset/migration, or branch cleanup occurred. The two protected Phase 2 plans and temporary hero Playwright config remain preserved and untracked.
- Fresh Vitest passed 235 files / 1,612 tests after two verification-only test fixes; `npm run typecheck` passed; clean production `npm run build` passed. `npm run gate` remains blocked at the known repository-wide Prettier baseline (257 files), so it did not reach later gate stages.
- Read-only Preview HTTP smoke, representative WebM/WebP asset/type checks, sampled local/Preview WebM byte/SHA equality, six security-header presence checks, stale raster-reference scan, and path-only secret scan passed. No values or credentials were printed.
- Exact Preview hero desktop E2E reproduced a retained-resource replay failure after deferred room traversal: sofa forward had previously played successfully, then its retained video node later had `src=null` and timed out on replay. A smaller one-off initial sofa forward/reverse probe passed; this does not clear the full matrix. Local production browser run was 6/11 because `.env.local` `AUTH_TRUST_HOST=true` redirected anonymous HTTP `/profile` prefetch to HTTPS localhost, producing `ERR_SSL_PROTOCOL_ERROR`; this is recorded as an environment boundary.
- Final Sol Medium review: `REMEDIATE`, Critical 0 / Important 2 / Minor 3. Reviewer confirmed the Preview retained-video replay as a Phase 6 regression and identified the suspect path: transient native readiness loss makes the cache reject the retained record, activation invalidates/detaches its source, and replay sees `src=null`; existing rehydration coverage mocks cache readiness. PR remains blocked on this fix, inclusion of the uncommitted test corrections, and completion-gate formatting state. Accepted four-room visual review remains valid but is not treated as automated production-readiness evidence.

## Phase 6D remediation continuation — 2026-09-04

- The retained hero replay blocker is fixed locally. Root cause was a real cache-boundary race: temporary native readiness loss rejected a retained Blob/object URL, activation invalidated it, and the retained video later had `src=null`. The cache now preserves an owned source across transient readiness loss while still rejecting native media errors, stale source/element state, explicit invalidation, cancellation, retry failures, and disposal paths.
- TDD evidence: real cache-boundary readiness regression RED at 25/26, then GREEN; native-error regression RED, then GREEN. Final focused hero/security suites passed 5 files / 171 tests. Fresh bounded Sol re-review passed Critical 0 / Important 0 / Minor 0.
- Local production E2E now uses `playwright.local-production.config.ts` and `scripts/local-production-e2e-server.mjs`. The dedicated process sets `AUTH_TRUST_HOST=true`, `NEXTAUTH_URL=http://localhost:<port>`, and `E2E_HTTP_LOCAL=true` without editing `.env.local`. The explicit flag removes only HTTP-incompatible CSP `upgrade-insecure-requests`; production/Preview auth, cookies, middleware, CSP defaults, and redirect policy remain unchanged.
- Exact local production browser matrix passed `11/11` in 6.8 minutes: desktop/mobile, all four rooms, both products and directions, repeat traversal, source/Blob/object-URL reuse without refetch, codec selection, fallback, retry, and resilience.
- Final local evidence: full Vitest 235 files / 1,615 tests, `npm run typecheck`, ordinary `npm run build`, bounded ESLint, targeted Prettier, and `git diff --check` passed. Exact `npm run gate` was rerun but remains blocked at Prettier by 157 ignored `.superpowers` artifacts; they and the protected Phase 2 plans were not formatted, added, or deleted. This is baseline debt, not a functional failure.
- Formatting changes are recorded separately from functional changes. Two previously authorized test-only fixes remain uncommitted and preserved. No commit, push, deploy, PR, merge, database/provider/payment/email operation, seed/reset, or migration occurred.
- Preview status: old Preview SHA `4d9e8e6421b792a16eb4d2e12c42301b3321c201` remains stale historical evidence. No new Preview was created, so Preview blocker is not cleared. Unverified items: new exact-SHA Preview matrix, user visual acceptance of that deployment, and comparable public after-performance measurement.
- Next action: request user authorization to commit and push the current phase branch for a new Preview. Do not claim READY FOR PR or merge before that deployment passes the critical matrix and receives user acceptance.

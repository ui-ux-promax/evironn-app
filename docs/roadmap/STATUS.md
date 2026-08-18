# Migration status

## Current state

- Bootstrap: complete in the repository root commit `init`.
- Active phase: Phase 4 — checkout, payments, and orders.
- Integration branch: `dev`.
- Current branch: `phase/04-checkout-orders` from `origin/dev` merge `868310f`.
- Phase state: Phase 1, Phase 2, and Phase 3 accepted and merged; Phase 4 authorized; Tasks 1–8 are implemented and focused-reviewed locally; Task 9 is at provisional contract/closeout stage.
- Current delivery: Phase 4 checkout, payment, order, review, guarded E2E safety, and migration-readiness contracts are implemented. Completion readiness is blocked by absent explicit E2E database identity/write variables and absent external credentials; no full Phase 4 gate is claimed.
- Previous delivery: Phase 3 — commerce and authentication, visually accepted and merged.

Phase 3 pull request #3 merged with merge commit `868310f`; final Phase 3 branch commit is `f3d8a93`. Auth Variant B, Cart Variant A, and Profile Variant A desktop/mobile visual acceptance is complete. Phase 3 completion evidence remains `format`, `gate` (170 files / 930 tests), and `build` passed. Phase 3 E2E was invoked but stopped before Playwright because explicit E2E database variables were absent; no ambient database was used. Google OAuth and other external smoke not proved by that local gate remain unproved.

## Phase 4 Task 9 provisional closeout

Tasks 7 and 8 remain accepted on their focused evidence: Task 7 review `6373dac..f303387` approved with Critical 0 / Important 0 / Minor 0; its focused Vitest evidence was 9 files / 115 tests plus typecheck, Prettier, and diff-check. Task 8 review `f303387..015018e` approved with Critical 0 / Important 0 / Minor 0; its focused safety/migration/guard evidence was 3 files / 77 tests plus typecheck, Prettier, and diff-check. Task 8 browser collection stopped at the explicit guard; no database or provider call occurred and no E2E pass is claimed.

Task 9 RED was observed: the initial contract run failed 9 expected assertions before the manifest and closeout records existed. Acceptance-review remediation added a fresh RED run of 1 file / 14 tests / 6 expected failures before exact closeout regeneration. The current manifest is exact for `868310f..HEAD` but is not completion-gate evidence. `BLOCKED_COMPLETION_READINESS` is the current delivery state. Presence-only environment state is recorded as: `E2E_DATABASE_URL=false`, `E2E_DATABASE_URL_UNPOOLED=false`, `E2E_DATABASE_ALLOW_WRITES=false`, `E2E_DATABASE_TARGET_FINGERPRINT=false`, `AUTH_SECRET=false`, `AUTH_TRUST_HOST=false`, `RESEND_API_KEY=false`, `EMAIL_FROM_TRANSACTIONAL=false`, `YOOKASSA_SHOP_ID=false`, `YOOKASSA_SECRET_KEY=false`, `YOOKASSA_MODE=false`, `DADATA_TOKEN=false`, `NEXT_PUBLIC_SITE_URL=false`. No raw identity, URL, secret, or provider value was inspected or recorded.

Task 9 focused GREEN is corrected to the reproducible commands at current HEAD: `npx vitest run tests/phase-4-integration-contract.test.ts` passed 1 test file / 14 tests; the documented combined command passed 3 test files / 41 tests. This is task-level evidence only, not completion-gate evidence.

### Task 9 acceptance-review remediation

Acceptance re-review 2 found three Important contract gaps. Remediation is limited to Task 9 evidence plus testability boundaries in `lib/payment-sync.ts`, `e2e/phase4-database.ts`, and `scripts/e2e-database-fingerprint.ts`; accepted Task 7/8 source, reports, progress history, and protected untracked Phase 2 plans remain preserved. Fresh RED after adding independent assertions was 1 file / 14 tests collected / 4 expected failures before boundary implementation and closeout inventory regeneration. The remediation commit subject is `test: complete phase 4 delivery contracts`; the authoritative reviewed range is `868310f..HEAD`.

The final contract derives its manifest boundary from the actual base-to-HEAD name-status diff, force-tracks `.superpowers/sdd/phase-4-delivery-report.md`, and asserts exact deletion of `components/shared/checkout/checkout-form.tsx`. It retains `BLOCKED_COMPLETION_READINESS`; no database, migration deploy, provider, full gate, build, or full Phase 4 E2E claim is introduced by this remediation.

The Phase 4 completion gate (`npm run format`, `npm run gate`, `npm run build`, and critical Phase 4 E2E) has not run in Task 9. Readiness, real migration deployment, shared non-production database writes, checkout/order/review browser flows, and YooKassa sandbox smoke remain deferred or blocked until the approved explicit environment is supplied. No push, Preview, pull request, merge, branch deletion, or Phase 5 work is authorized.

## Bootstrap contents

- Clean `fashion-shop` foundation copied without source Git history, dependencies, build output, secrets, logs, worktrees, portfolio captures, or source-project planning artifacts.
- Package identity, metadata, environment contract, README, scripts, and repository workflow adapted for Evironn.
- Deferred blog, newsletter, FAQ, legal, and unsubscribe routes removed from the MVP foundation.
- Roadmap, decision log, status file, pull request template, and local excluded instructions added.

## Completed phase pull requests

Phase 1 was merged into `dev` by pull request #1 with merge commit `3e4e2a02fb6367bbbec9af794044da1ecf47a973`.

## Database migrations

Migration `prisma/migrations/20260811121000_furniture_domain/migration.sql` creates the furniture catalog, normalized option/SKU tables, media, turntable relation, immutable snapshot fields, composite option/value integrity, positive quantity, non-negative stock/price, and exact cart-reference constraints. Legacy compatibility tables remain until Phase 2 rewires inherited reads and writes.

The independent review removed destructive seed teardown and `TRUNCATE ... CASCADE`, made preview SQL resolve foreign keys by natural keys, fixed repeat seeding when an option value changes, and added the missing local furniture/360 assets. It also completed canonical SKU handling in cart merge/recalculation/update, checkout, cancellation, payment reconciliation, reviews, order views, and admin analytics.

## Validation

Latest local Phase 1 validation before the final documentation-only rerun:

- `npm run format` — pass.
- `npm run gate` — pass; 118 test files, 620 tests, 0 errors.
- `npm run build` — pass; Next.js production build exit 0.
- `npx prisma validate` with temporary local URLs — pass.
- `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` — pass; expected furniture tables and composite foreign keys generated.
- `npm run e2e -- e2e/furniture-domain.spec.ts` — pass; 4/4 media-contract scenarios.
- Dedicated Neon database migration — applied successfully with `prisma migrate reset` after removing an invalid UTF-8 BOM from the initial migration; one migration is registered and current.
- Furniture seed — executed twice successfully and remained idempotent: 5 categories, 5 rooms, 12 products, 17 SKUs, and 15 media records.
- Turntable contract — one category has a configured turntable product and one turntable video; the separate `neon_auth` schema remained intact.

## Phase 2 recovery

- The prior catalog pilot is closed as an implementation experiment. Its historical workflow remains in `docs/superpowers/phase-2-catalog-pilot-workflow.md`.
- Approved corrected design: `docs/superpowers/specs/2026-08-12-full-frontend-migration-design.md`, committed as `8044c06`.
- Authoritative workflow: `docs/superpowers/full-frontend-migration-workflow.md`.
- Durable Phase 2 progress is recorded in `.superpowers/sdd/progress.md`.
- Task 1 canonical storefront projections are complete and independently approved in commits `03e94bb` and `1b9fc3d`.
- Database-safe Vercel bootstrap is committed as `0c14739`; deployment builds no longer run `prisma db push`.
- Preview branch deployment is ready at `https://evironn-app-git-phase-02-storefront-s1aw3ns-projects.vercel.app`.
- Task 2 URL-driven furniture catalog with server pagination is implemented in commit `3045183`, independently checked, and verified: focused Vitest 22/22, typecheck pass, catalog E2E 5/5. Local E2E emitted Auth.js `UntrustedHost` and Tailwind ambiguous-class warnings without test failures.
- Task 3 canonical furniture PDP and resilient 360 media are implemented in commits `2afad2b` and `1299585`, independently checked and verified. Product E2E remains blocked by a 60-second no-output local runtime timeout; build passes with pre-existing warnings.
- Task 2/3 server logic remains accepted for reuse. Their temporary inherited presentation is not accepted and cannot satisfy the Phase 2 visual gate.
- Phase 2 cannot merge until Phase 2A, 2B, and 2C are complete and visually accepted.

## Phase 2A delivery

- Scope delivered: source-faithful Evironn storefront foundation and complete eight-section home ported from the read-only clone, on `phase/02-storefront`, executed against `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`. Next.js App Router, metadata, storefront JSON-LD, `VerificationGateHost`, and all existing canonical catalog/PDP/server logic were preserved.
- Tasks 1–5 complete, each with a fresh implementer and fresh independent reviewer and remediation to zero Critical/Important findings:
  - Task 1 — dependencies, public route constants, source contracts: `159d81c`, `1d9e406`.
  - Task 2 — tokens, fonts, shared header/footer, not-found view: `696e1f0`, `20dc7f2`, `93b6fd3`, `3827619`.
  - Task 3 — interactive hero and exact hero media: `d15e1c2`, `b1b6964`, `4018b49`, `a396a5a`, `6c25279`, `26e9d6c`.
  - Task 4 — remaining seven home sections: `7e7a2a8`, `e0567c5`, `a74be86`.
  - Task 5 — static home composition, retirement of inherited presentation, E2E, delivery records: `5e69f9d`, `d2e519f`, `ac749df`, `9810c25`.
- Delivery-review remediation commits: `40fdae6`, `4b14ba4`, `03808a4`, `02c3ca3`, `2f83c26`, `174ed1b`, `4158259`, `96a9d0d`, `048de3f`, `703e143`, `558b0e3`, `54893f4`, `0d09fce`, `e50921c`.
- Final quality gate, fresh at HEAD `e50921c`:
  - `npm run gate` — pass; 137 test files, 701 tests, 0 failures; `prettier --check .` and ESLint clean; `tsc --noEmit` clean.
  - `npm run build` — pass; Next.js production build exit 0 with only pre-existing warnings (Sentry no auth token, Tailwind ambiguous utilities, ESLint image/unused-variable, Framer Motion `motion()` deprecation).
  - `npm run e2e -- e2e/evironn-home.spec.ts` — pass; 4/4 scenarios (desktop `1440x1000`, mobile/touch `390x844`, reduced motion, hero media-failure recovery); zero `UntrustedHost` and zero console/page errors.
  - Secret scan of tracked additions — clean; largest tracked object is `public/assets/hero/terrace-sofa-forward.mp4` at 9,941,316 bytes, well below the 100 MB limit; Phase 2A hero/editorial/furniture assets total 39 files / 128,740,028 bytes.
  - Protected Task 3 plan hash `f1be0e06…c503a7e2` unchanged; both executable plan files remain untracked and unmodified.
- All Phase 2A commits carry identity `ui-ux-promax <gojjoy22@gmail.com>` with English conventional subjects and no AI/bot/co-author trailers.
- Final finding closed: `playwright.config.ts` was excluded from the quality gate by `.prettierignore` and unformatted; `e50921c` returns it to gate scope and it is now Prettier-clean, and no Phase 2A-owned source or test file remains ignored. The completion pass ran in a fresh coordinator session after the prior session reached its model usage limit; the independent reviewer subagent could not run because of a temporary inference-gateway outage (HTTP 503), so the final delta sign-off was verified directly by the coordinator and recorded in `.superpowers/sdd/phase-2a-delivery-report.md`.
- Stop gate: Phase 2A halts here for user desktop/mobile visual acceptance. No Vercel Preview push, pull request, or merge is performed without explicit user authorization; Phase 2B and 2C remain unauthorized.
- Next action: user desktop/mobile visual acceptance of the Phase 2A storefront (header/drawer, eight home sections, footer, reduced motion, media fallback), then explicit authorization to push the Preview and proceed to Phase 2B.

## Phase 2A acceptance fixes

During user visual acceptance, three deviations from the clone were addressed on `phase/02-storefront` (still unpushed; stop gate intact):

- `6937824` — the footer wordmark declared Fraunces but no Fraunces face was shipped, so it fell back to Georgia. The Fraunces latin and latin-ext WOFF2 subsets are now bundled locally under `public/assets/fonts` and registered as `@font-face` in `styles/evironn/tokens.css`, with no runtime remote font import.
- `920105f` — the three `motion(Link)` call sites now use `motion.create(Link)`, clearing the Framer Motion 11 deprecation console warning; no runtime or visual change.
- `AUTH_TRUST_HOST=true` was added to the untracked local `.env.local` so `npm run dev` stops emitting Auth.js `UntrustedHost` errors on `/api/auth/session`; production and E2E are unaffected.
- `113019a` — the kitchen, bedroom, and terrace room pills were stuck disabled and unclickable. Under SSR the idle room images could finish loading before React hydration attached their `onLoad` handler, so `onRoomReady` never fired for the non-seeded rooms and each pill stayed locked forever. Readiness is now also signalled from a ref callback for any hero image already `complete` at mount, and a desktop E2E regression asserts all four room controls are enabled and that clicking a non-active pill starts a room transition. This supersedes the earlier "no fix required" note, which was incorrect.

Fresh checks at the acceptance-fix checkpoint `113019a`: `npm run gate` pass (137 files / 701 tests; Prettier, ESLint, and `tsc --noEmit` clean); `npm run build` exit 0; `npm run e2e -- e2e/evironn-home.spec.ts` 5/5 with zero `UntrustedHost` and zero console/page errors. Protected Task 3 plan hash `f1be0e06…c503a7e2` unchanged; both executable plan files remain untracked and unmodified.

The branch history was subsequently migrated to Git LFS and pushed at rewritten HEAD `53f901b`. The user manually verified the Vercel Preview and accepted the rendered Phase 2A result. Phase 2B is now the next delivery; Phase 2 still cannot merge until Phase 2B and Phase 2C are complete and visually accepted.

## Verification policy and performance follow-up

- Future tasks use proportional verification: focused changed-module checks during implementation and one complete quality gate after all tasks in the current delivery are complete. Phase 2B and Phase 2C are separate completion boundaries.
- The full completion gate remains `npm run format`, `npm run gate`, `npm run build`, and E2E for critical current-delivery scenarios.
- The user observed slow initial loading on Vercel Preview. Phase 2A acceptance is not blocked, but the issue is retained as performance debt. After the storefront port is complete, measure asset/video delivery, image optimization, JavaScript bundle cost, lazy loading, Vercel cold-start behavior, and Core Web Vitals before selecting optimizations.

## Phase 2B Task 5 checkpoint — 2026-08-13

- Owned changes: `e2e/catalog.spec.ts`, `tests/evironn-catalog-source-contract.test.ts`, this record, `.superpowers/sdd/progress.md`. Existing Task 1–4 work and plans preserved.
- Source contract: canonical `findProducts`/Variant B boundary; forbids mock data, legacy presentation, `/catalog-a|b|c`, non-showcase card destinations.
- E2E: 12 cards/showcase links; category/room/option/sort URL authority + page reset; mobile drawer draft/apply/Escape; invalid empty; out-of-range; reduced motion.
- RED: `npx vitest run tests/evironn-catalog-source-contract.test.ts` — `1 passed`, `3 tests passed`; current source already satisfied contract.
- GREEN: `npx vitest run tests/evironn-catalog-source-contract.test.ts tests/catalog-filters.test.ts tests/catalog-pagination.test.ts tests/catalog-option-facet.test.tsx tests/catalog-product-card.test.ts` — `5 passed`, `21 tests passed`; exit 0.
- Prettier: initial check failed on 2 new files; write + check passed: `All matched files use Prettier code style!`
- E2E first attempt failed: stale `node.exe` PID `13116` owned port 3000. Exact PID stopped.
- E2E rerun: `npm run e2e -- e2e/catalog.spec.ts` — `7 passed (42.7s)`; exit 0. Node `NO_COLOR`/`FORCE_COLOR` warnings only. No timeout.
- Full gate/build/full Vitest/commit/push/PR not run.

## Phase 2B Task 5 remediation — 2026-08-13

- Important 1 fixed: reduced-motion E2E now checks every comma-separated computed `transitionDuration` for stage media, drawer, and indicator; animation name remains checked too.
- Important 2 fixed: source contract checks exact canonical import modules and recursively scans production `app/` for forbidden catalog variant route files. Read-only archive is outside scan.
- Important 3 fixed: owned changed-file count is 4: modified `e2e/catalog.spec.ts` and `docs/roadmap/STATUS.md`; created `tests/evironn-catalog-source-contract.test.ts` and `.superpowers/sdd/progress.md` (ignored local file). Task 5 added 0 assets.
- Protected old plan hashes, verified now: baseline/current `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` = `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9` / `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9`; baseline/current `docs/superpowers/plans/phase-2-task-3-execution.md` = `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2` / `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`. Current Phase 2B plan hash is `BC301FE3`; no protected plan edited.
- RED: `npx vitest run tests/evironn-catalog-source-contract.test.ts` — `1 passed`, `3 tests passed`; source already met strengthened contract.
- GREEN: `npx vitest run tests/evironn-catalog-source-contract.test.ts tests/catalog-filters.test.ts tests/catalog-pagination.test.ts tests/catalog-option-facet.test.tsx tests/catalog-product-card.test.ts` — `5 passed`, `21 tests passed`; exit 0.
- Regression: wrong-source symbol case throws under strict same-import binding.
- E2E remediation: `npm run e2e -- e2e/catalog.spec.ts` — `7 passed (40.6s)`; exit 0. No timeout. Node `NO_COLOR`/`FORCE_COLOR` warnings only.
- Prettier: `All matched files use Prettier code style!`; exit 0.
- Remaining risk: Vercel Preview initial loading slow; retained as performance debt. No optimization mixed into Task 5.

## Phase 2B Task 5 remediation 2 — 2026-08-13

- Strict source parser fixed: each required named import must occur inside same import statement as its exact canonical module path. Regression covers symbol present elsewhere but imported from wrong module; it throws.
- Protected plans untouched. Current SHA-256 verification: first protected old plan `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9`; second protected old plan `phase-2-task-3-execution.md` `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`.

## Phase 2B final review remediation — 2026-08-13

- Drawer CTA semantics are explicit and honest: `Показать N` uses `model.total` only when staged filters equal the authoritative URL state (page excluded); any staged delta renders `Показать 0` with an accessible explanation that exact count is calculated after apply. No client-side intersection guess or preview route was added.
- Playback E2E resets/unhovers before independently focusing the card, then separately asserts video playback and idle/canvas/video exclusivity after a reliable video error event.
- Pager behavior is covered by the focused shell test with a two-page serializable model; the live seeded catalog has 12 products and server page size 12, so its normal E2E correctly has no actual page button to click.
- Protected old plan hashes remain baseline/current `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9` and `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`. Current Phase 2B plan hash is `BC301FE3`; plans untouched.
- Source Vitest: `npx vitest run tests/evironn-catalog-source-contract.test.ts` — `1 passed`, `4 tests passed`; exit 0.
- Catalog E2E: `npm run e2e -- e2e/catalog.spec.ts` — `7 passed (40.1s)`; exit 0. No timeout.
- Prettier: initial check flagged source test; write rerun passed: `All matched files use Prettier code style!`; exit 0.
- Full gate/build/full Vitest not run.

## Phase 2B completion — 2026-08-13

- Selected Evironn CatalogVariantB delivered on `phase/02-storefront`; report: `.superpowers/sdd/phase-2b-delivery-report.md`.
- All five task reviewers and final delivery reviewer approved with Critical 0 / Important 0 / Minor 0.
- Completion gate passed: `npm run format`; `npm run gate` (143 files / 750 tests, typecheck pass, 0 lint errors); `npm run build` (exit 0); `npm run e2e -- e2e/catalog.spec.ts` (9/9, exit 0).
- Final UI uses canonical server catalog data and URL authority, showcase-only card destinations, exact catalog shell/primitives/card CSS and interactions, mobile drawer accessibility, reduced-motion behavior, and playback fallback.
- Compatibility-only test correction: Phase 2A source-contract forbidden-route regex now uses route boundaries so legitimate `catalog-card` imports are not mistaken for forbidden `catalog-c` routes. No Phase 2A production UI changed.
- Preservation: protected plan hashes baseline=current — Phase 2A `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9`; Task 3 `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`. Current Phase 2B plan hash `BC301FE367E1FD40FE486244F250498B7F38197F120C3617733AF13081BFD1E1`.
- No Phase 2B assets added; Preview initial loading remains performance debt. No PR, merge, or Phase 2C start performed.

## Phase 2C Task 5 implementation — 2026-08-14

- Scope done: critical product E2E and durable delivery records. Production Task 1–4 files, schema, seed, dependencies, and protected old plans untouched. Corrected Phase 2C plan is included in this Task 5 commit.
- Task 1–4 base evidence: Task 1 `62a2eb5`; Task 2 `a6da7a9`, `4751505`; Task 3 `9b6ac32`, `2a0f4f4`; Task 4 `0e784f2`, `1c0cd00`.
- Server state: six active Noma SKU combinations; each has price `89 990 ₽`, old price `109 990 ₽`, stock `3`; repeat seed evidence remains idempotent.
- Asset state: nine exact showcase assets, total `49,189,609` bytes; WebM is `28,717,710` bytes and ffprobe-valid, with exact poster and source paths. No Task 5 assets added.
- E2E coverage: default and non-showcase redirects; six canonical option pairs with server facts, exact layer source, canonical URL, and unchanged cart; desktop 360 lock/focus/poster/WebM/drag/play/pause/Escape/backdrop/restore; explicit fallback/status; 390x844 clone `50%`; 412x844 wider-mobile `25%`; reduced motion; keyboard; axe serious/critical scan.
- Focused evidence: `npm run e2e -- e2e/product.spec.ts --grep "390x844" --retries=0` — 1 passed; `npm run e2e -- e2e/product.spec.ts --retries=0` — 9 passed; standard `npm run e2e -- e2e/product.spec.ts` — 9 passed, exit 0. Full gate and build not run by Task 5 request.
- Root causes recorded: browser clamps requested scroll to actual `window.scrollY`; test now uses actual value. SSR button can appear before client hydration; `gotoProduct` waits for `networkidle`. Final E2E uses real WebM HTTP delivery, real `loadedmetadata`/duration, and real controls with no masking harness or synthetic media state; fallback test alone dispatches explicit error when video exists. Desktop interaction contract stays strict video-only.
- Normative CSS preserved: `styles/evironn/ProductPage.css` expected hash `735C66AA3C4579847FBFF64950C808B85D1CF5B55BE10D1E722AB677F9294270`.
- Remaining debt: slow initial Preview loading. Measure asset/video delivery, image loading, bundle cost, cold start, and Core Web Vitals after storefront completion; no optimization rewrite mixed into Task 5.
- Local acceptance stop gate: coordinator starts local server after review. User must inspect desktop, 390x844, 412x844, all six options, 360 controls/fallback, reduced motion, keyboard, recommendations, header, and footer. No push, PR, merge, branch deletion, or Phase 3.

## Phase 2C final review remediation — 2026-08-14

- Final review findings: closed. Critical `0`; Important `0`.
- DTO copy fixed: exact clone description now constant, independent seed description; showcase UI, metadata, and Product JSON-LD use same copy.
- Duplicate `option` query values now redirect default canonical path, even when first value is canonical. Single canonical array value remains valid.
- `generateMetadata` now reads `params.slug`; non-showcase slug always resolves default showcase DTO/path, regardless requested option. Canonical, Open Graph, Twitter, and copy align with route behavior.
- TDD RED: focused Vitest 2 files, 4 expected failures.
- TDD GREEN: focused Vitest 2 files, 23/23 passed; broader route/showcase Vitest 5 files, 57/57 passed.
- Typecheck: `npm run typecheck` passed. Prettier check passed. `git diff --check` passed.
- No full gate/build/push. Local visual acceptance remains required. Preview loading debt unchanged.

## Phase 2C completion — 2026-08-14

- User visual acceptance is complete for the exact showcase PDP, six option combinations, 360 controls/fallback, responsive layouts, reduced motion, keyboard interaction, recommendations, header, and footer.
- Completion verification: `npm run format` passed; `npm run gate` passed with 151 test files / 789 tests and zero errors; `npm run build` completed successfully with existing warnings only.
- PDP E2E passed 9/9 after aligning two stale assertions with the accepted canonical-option links and the loading-to-ready handoff; Prettier and `git diff --check` passed.
- Phase 2C is closed on `phase/02-storefront` at the current delivery state. Preview loading remains recorded performance debt. No merge, pull request, or Phase 3 work starts here.

## Phase 3 commerce and authentication — delivery close (2026-08-15)

- Phase 3 implementation is complete on `phase/03-commerce-auth` from `origin/dev` base `b31194ab07de4ed396d9bfcc5c9d16734d113f95d`; current implementation head is `4ff8070`.
- Task approvals: Task 1 `ef9b2db..85da104`; Task 2 `2e5167c..f0dc6fa`; Task 3 `671f80a..d6dab3b`; Task 4 `c816cef..014109d`; Task 5 `ae04de0..4a04579`; Task 6 `93bea3b`; Task 7 `da49ee2..912e49d`; Task 8 `9862c59..6b65f48`. Final remediation: `c596187`, `91dc837`, `1bef496`, `f2f8d7b`, `078e592`, `4ff8070`.
- Final validation: `npm run format` passed; final `npm run gate` passed with 170 test files / 930 tests and 0 ESLint errors (59 warnings); `npm run build` passed with existing Sentry, webpack-cache, Tailwind, and Edge Runtime warnings.
- Critical Phase 3 E2E command was invoked and stopped at the disposable-database guard: `E2E_DATABASE_ALLOW_WRITES=1` and disposable E2E URLs are absent. No ambient application database was used. `RESEND_API_KEY` remains blank under the guard; no verification email was sent.
- `prisma/schema.prisma` and `prisma/migrations` are unchanged. No new architecture decision was found; ADR-001/007/010/012/013/014 and the canonical SKU schema remain governing decisions. Secret scan found only the intentionally empty `.env.example` `RESEND_API_KEY` entry.
- Real Google OAuth Preview smoke is `pending Preview acceptance`; no push or Preview was authorized. Initial Preview loading remains performance debt. Checkout, payment, order mutation, admin, and Phase 4 work remain excluded.
- Phase 3 is awaiting desktop/mobile visual acceptance for Auth Variant B, Cart Variant A, and Profile Variant A. No push, pull request, merge, branch deletion, or Phase 4 start performed.

## Phase 3 visual acceptance fixes — 2026-08-15

- `82c8bf8` reserves the full viewport for the cart route loading skeleton so the shared footer stays below the initial viewport; focused cart source-contract tests pass.
- `fe16df8` adds a scoped 16px top margin above the profile password submit button; focused profile source-contract and component tests pass 17/17.
- No schema, migration, environment, server-action, or dependency changes were made.
- The phase branch is authorized for push and pull-request creation. Merge and final Phase 3 visual acceptance remain separate gates.

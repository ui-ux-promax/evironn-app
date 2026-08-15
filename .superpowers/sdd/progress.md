# Phase 2 catalog pilot progress

## Phase 2C exact showcase PDP

- Task 1: complete; amended commit `62a2eb5` preserves exact nine assets/helpers, corrected plan, WebM LFS pointer/rule, and focused review approved Critical 0 / Important 0 / Minor 0.
- Task 2: complete; commits `a6da7a9`, `4751505`; six-SKU DTO/seed contracts, explicit two-run seed evidence, and focused review approved Critical 0 / Important 0 / Minor 0.
- Task 3: complete; commits `9b6ac32`, `2a0f4f4`; exact scene/panel/360 port, CSS hash preserved, media-layer remediation, and focused review approved Critical 0 / Important 0 / Minor 1.
- Task 4: complete; commits `0e784f2`, `1c0cd00`; canonical redirects, server metadata/JSON-LD, temporary shell retirement, remediation review approved Critical 0 / Important 0 / Minor 1.
- Task 5: implementation complete; E2E and durable records ready for coordinator review. Commit subject: `test: cover showcase product acceptance`.
- Task 5 E2E: 9 scenarios cover canonical redirects, six server-backed combinations, cart immutability, strict desktop 360 media controls, explicit fallback/status, 390 `50%`, 412 `25%`, reduced motion, keyboard, and axe.
- Final delivery review remediation: complete; three findings closed. Showcase DTO now emits exact clone description independent seed copy; duplicate option arrays redirect default canonical while single canonical array stays valid; non-showcase metadata uses default showcase DTO/path regardless requested option. Focused RED: 4 expected failures. GREEN: route/showcase Vitest 5 files, 57/57 passed; typecheck, Prettier, diff-check passed. Full gate/build/push not run. Local visual acceptance pending.
- Task 5 evidence: 390 retries=0 passed; `npm run e2e -- e2e/product.spec.ts --retries=0` passed 9/9; standard `npm run e2e -- e2e/product.spec.ts` passed 9/9 in 1.1m, exit 0. Full gate/build intentionally not run.
- Task 5 root causes: actual browser-clamped scroll used for restore; `networkidle` prevents SSR-before-hydration click loss; final E2E proves real WebM HTTP delivery, real metadata/duration, and real controls with no masking harness or synthetic media state. Fallback remains explicit and desktop video contract remains strict.
- Task 5 preservation: corrected Phase 2C plan included; protected untracked old plans remain unstaged; no production Task 1–4 files changed. Remaining debt is slow initial Preview loading. Stop at local acceptance after coordinator review; no push/PR/merge.
- Task 5 review remediation: complete; Critical 0, Important 4 closed by same owner. Fixes: each SKU case starts at default canonical and clicks hydrated upholstery and wood controls; desktop removes media harness and synthetic media overrides, proves browser WebM response 200 or valid range 206 with `video/webm` and exact total `28,717,710` in `Content-Range`, waits real `loadedmetadata` and positive duration, then uses real drag/play/pause; fallback and reduced motion accept one natural video/fallback state without masking errors; keyboard uses real Tab traversal for selectors, launch, modal playback, accordions, catalog, and recommendations; exact computed positions are `50% 50%` at 390 and `25% 50%` at 412.

## Phase 2B selected catalog UI

- Planner complete: `docs/superpowers/plans/2026-08-13-phase-2b-selected-catalog-ui.md`.
- Task 1: complete; adapter and URL model implemented, focused Vitest 11/11, Prettier clean, reviewer approved Critical 0 / Important 0 / Minor 0.
- Task 2: complete; catalog card/playback implemented, focused Vitest 16/16, Prettier clean, reviewer approved Critical 0 / Important 0 / Minor 0 after overlap remediation.
- Task 3: complete; catalog primitives/CSS implemented, focused Vitest 11/11, Prettier clean, reviewer approved Critical 0 / Important 0 / Minor 0 after range/accessibility remediation.
- Task 4: complete; Variant B shell/route/CSS integrated, focused Vitest 40/40, typecheck and Prettier pass, focused ESLint clean, reviewer approved Critical 0 / Important 0 / Minor 0 after interaction/warning remediation.

- Task 5: complete; source contracts and catalog E2E delivered, final catalog E2E 9/9, reviewer approved Critical 0 / Important 0 / Minor 0 after evidence, import-binding, fallback, pagination, and keyboard-focus remediation.
- Phase 2B delivery review: complete; final review approved Critical 0 / Important 0 / Minor 0.
- Phase 2B completion gate: `npm run format` pass; `npm run gate` pass (143 files / 750 tests, typecheck pass); `npm run build` pass; `npm run e2e -- e2e/catalog.spec.ts` pass (9/9).
- Phase 2B report: `.superpowers/sdd/phase-2b-delivery-report.md`. Protected plan hashes preserved; no Phase 2B assets added; Preview loading remains performance debt. Awaiting Preview push and user desktop/mobile visual acceptance. No PR, merge, or Phase 2C.
- Task 5: owned scope complete. Source contract 3/3. Focused Vitest 5 files/21 tests pass. E2E first blocked by stale port PID 13116; exact PID stopped; rerun `npm run e2e -- e2e/catalog.spec.ts` passed 7/7 in 42.7s. No timeout. Full gate/build/full Vitest intentionally not run.
- Task 5 remediation: 3 Important findings fixed. Reduced-motion E2E checks all computed comma-separated transition durations for stage/drawer/indicator. Source contract checks exact canonical imports and scans only production `app/` for forbidden variant route files. Evidence records 4 owned files, 0 added assets, protected-plan baseline/current hashes, and Preview slowness debt. RED source 3/3 pass; GREEN Vitest 5 files/21 tests pass; final catalog E2E 7/7 in 40.6s; Prettier pass. No timeout. Full gate/build/full Vitest not run.
- Task 5 remediation 2: strict import parser binds each required named symbol to its exact canonical module in the same import statement; wrong-source symbol regression added and passes. SHA-256 verified now: `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` baseline/current `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9` / `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9`; `docs/superpowers/plans/phase-2-task-3-execution.md` baseline/current `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2` / `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`. Current Phase 2B plan hash `BC301FE3`; plans untouched.
- Exact final remediation evidence before the current review wave: source Vitest `1 file/4 tests passed`; catalog E2E `7 passed (40.1s)`; final Prettier check `All matched files use Prettier code style!`; no full checks.

## Phase 2B final review remediation — 2026-08-13

- Drawer CTA decision: `Показать N` uses `model.total` only when draft filters equal authoritative URL state (page excluded). A staged delta renders `Показать 0` plus an accessible explanation that exact count is calculated after apply; no client-side intersection guess or preview route.
- Playback E2E reset/unhover is followed by independent keyboard-focus playback assertion; fallback assertion verifies idle image visible and canvas/video hidden.
- Pager click contract is covered by focused shell test with a two-page model. Live seeded data is exactly 12 products and server page size is 12, so normal catalog E2E has no actual page button.
- Protected hashes for this remediation: Phase 2A `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9`; phase-2-task-3 `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`; current Phase 2B plan hash `BC301FE3`; plans untouched.

- Session start: Phase 1 merge confirmed at `3e4e2a02fb6367bbbec9af794044da1ecf47a973`; branch `phase/02-storefront` created from updated `dev`.
- Planner: DONE, Sol Medium, 4 tasks; plan at `docs/superpowers/plans/phase-2-catalog-pilot.md`.
- Task 1: complete (commits `03e94bb`..`1b9fc3d`, focused re-review approved; no Critical/Important/Minor findings).
- Infrastructure checkpoint: complete. Dedicated Neon migration applied, seed verified idempotent, Vercel linked to `evironn-app`, and the phase branch preview is ready.
- Task 2: complete; reviewed and verified.
- Task 3: complete in commits `2afad2b` and `1299585`; fresh Luna High implementation, focused verification, and Sol Medium review approved after one remediation iteration.
- Task 4: deferred; not authorized.
- Stop after Task 3 review, verification, and Preview for user evaluation.
- Model-limit readings: before/after values not supplied in thread; record exact user-provided values in final report if available.

- Task 2: complete (commit `3045183`, task review approved after one Important-fix iteration; focused verification clean).
- Task 2 review: initial Sol Medium review found 2 Important and 2 Minor findings; Important findings fixed and re-reviewed approved. Minor report inventory omission fixed; positional E2E locator retained.
- Task 2 verification: focused Vitest 22/22, typecheck pass, catalog E2E 5/5. E2E emitted local Auth.js `UntrustedHost` and Tailwind ambiguous-class warnings; no scenario failed.
- Task 3 review: initial Sol Medium review found 3 Important findings (unsafe legacy panel overload/test, 360 fallback occlusion/control state, CSS Module scope); same Luna High implementer fixed all in `1299585`; re-review approved with Critical 0, Important 0, Minor 1 runtime-verification risk.
- Task 3 verification: coordinator rerun passed 5 focused Vitest files/21 tests, typecheck, Prettier, diff/scope/forbidden scans, and `npm run build` (pre-existing lint/Sentry/Tailwind warnings). Product E2E hit a fresh 60-second no-output timeout; no E2E pass claimed.
- Task 3 Preview: local product PDP inspected at `http://127.0.0.1:3000/product/noma-woven-lounge` in desktop/default and 390x844 mobile view; canonical SKU, option links, media, 360 control, disabled pilot CTA, and responsive layout visible. Preview tab left open for user review.
- Agent invocations: Sol Medium planner `019ff17a`; Luna High implementer `019ff17f`; Sol Medium reviewer `019ff190` with one re-review. Model-limit readings were not supplied.
- Task 4: deferred; not authorized.
- Stop after Task 3 verification and Preview for user evaluation; do not run final pilot review or start Task 4 in this session.

## Phase 2A planning

- Fresh Sol Medium planning pass completed against the approved design, workflow, roadmap, current production shell/home, read-only clone implementation/assets/tests, and read-only technical source.
- Executable Tasks 1–5 plan: `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`.
- Planning inventory found 56 Phase 2A candidate binaries totaling 136,706,340 bytes; largest is 9,941,316 bytes. Seven product idle/cutout targets already in production are byte-identical to the clone and must be reused after execution-time hash verification.
- Phase 2B remains blocked on Phase 2A automated checks, delivery review, Vercel Preview, and explicit desktop/mobile visual acceptance.

## Phase 2A planning

- Fresh Sol Medium planning pass completed against the approved design, workflow, roadmap, current production shell/home, read-only clone implementation/assets/tests, and read-only technical source.
- Executable Tasks 1–5 plan: `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`.
- Planning inventory found 56 Phase 2A candidate binaries totaling 136,706,340 bytes; largest is 9,941,316 bytes. Seven product idle/cutout targets already in production are byte-identical to the clone and must be reused after execution-time hash verification.
- Phase 2B remains blocked on Phase 2A automated checks, delivery review, Vercel Preview, and explicit desktop/mobile visual acceptance.

- Task 1 Phase 2A: complete (commits 159d81c..1d9e406, Sol Medium review approved after one Important fix; coordinator rerun route 3/3, typecheck, Prettier, diff-check clean).

- Task 2 Phase 2A: complete (commits 696e1f0..3827619, 3 remediation iterations; Sol Medium reviews approved after 5 Important findings fixed; coordinator rerun shell 4 files/15 tests, typecheck, Prettier, diff-check clean).

- Task 3 Phase 2A: complete (commits d15e1c2..26e9d6c; 3 review remediation waves plus report/portability evidence; Sol Medium final review approved; coordinator rerun hero 4 files/18 tests, typecheck, Prettier, diff-check clean; assets 28/28 exact, 107,355,374 bytes).

- Task 4 Phase 2A: complete (commits 7e7a2a8..a74be86; one review remediation plus report evidence; Sol Medium final approved; coordinator rerun home 4 files/13 tests, typecheck, Prettier, diff-check clean; assets 31 files, 30,151,483 bytes).

- Task 5 Phase 2A: complete (commits 5e69f9d..9810c25; source contract strengthened, static App Router home composed in the normative eight-section order inside one `main#main-content`, inherited RITM home/shell removed after zero-reference proof, `e2e/evironn-home.spec.ts` added; task review approved after remediation; coordinator rerun 10 focused files/37 tests, typecheck, Prettier, diff-check clean; home E2E 4/4).

## Phase 2A delivery

- Delivery review ran as full base-to-HEAD passes across multiple waves; all findings remediated to zero Critical/Important. Remediation commits: 40fdae6, 4b14ba4, 03808a4, 02c3ca3, 96a9d0d, 048de3f, 703e143 (Task 3 ProductAccordions contract restored), 558b0e3 (cart preserves server count on client fetch failure + quality-gate scope), 54893f4 (trusted-host E2E environment), 0d09fce (protected-plan hash audit reconciled), e50921c (playwright.config.ts returned to gate scope, Prettier-clean). Evidence attribution neutralized in 2f83c26, 174ed1b, 4158259, 9810c25.
- Final gate at HEAD e50921c: `npm run gate` pass (137 files / 701 tests; `prettier --check .` + ESLint clean; `tsc --noEmit` clean); `npm run build` exit 0 with pre-existing warnings only; `npm run e2e -- e2e/evironn-home.spec.ts` 4/4 with zero UntrustedHost/console errors; secret scan clean; largest tracked object 9,941,316 bytes; Phase 2A hero/editorial/furniture assets 39 files / 128,740,028 bytes; protected Task 3 plan hash f1be0e06…c503a7e2 unchanged; both plan files remain untracked/unmodified; every Phase 2A commit uses identity ui-ux-promax <gojjoy22@gmail.com> with no AI/bot/co-author trailers.
- Completion context: Phase 2A was finished in a fresh coordinator session after the prior session reached its model usage limit mid-remediation. The independent reviewer subagent for the final one-line delta could not run because of a temporary inference-gateway outage (HTTP 503 on the haiku and sonnet channels); the coordinator verified the delta directly with independent commands (see `.superpowers/sdd/phase-2a-delivery-report.md`).
- Stop after the Phase 2A gate for user desktop/mobile visual acceptance. Vercel Preview push, pull request, merge, and Phase 2B/2C remain unauthorized pending explicit user approval.

## Phase 2A acceptance fixes

- User visual acceptance surfaced three deviations from the clone; addressed on `phase/02-storefront` (unpushed, stop gate intact):
  - `6937824` `fix`: footer wordmark fell back to Georgia because no Fraunces face shipped; bundled Fraunces latin + latin-ext WOFF2 locally under `public/assets/fonts` and registered `@font-face` in `styles/evironn/tokens.css` (no runtime remote font import).
  - `920105f` `refactor`: `motion(Link)` -> `motion.create(Link)` in the three call sites (footer, furniture editorial, hero product caption) to clear the Framer Motion 11 deprecation console warning; no runtime/visual change.
  - `AUTH_TRUST_HOST=true` appended to untracked local `.env.local` so `npm run dev` stops emitting Auth.js `UntrustedHost` on `/api/auth/session`; production and E2E unaffected.
  - `a0d92ef` `docs`: STATUS updated with the acceptance-fix record.
  - `113019a` `fix`: hero room pills (kitchen/bedroom/terrace) were stuck disabled/unclickable — SSR idle images could finish loading before hydration attached the React `onLoad`, so `onRoomReady` never fired for non-seeded rooms. Now also signalled from a ref callback for any hero image already `complete` at mount; added a desktop E2E regression (all four pills enabled + clicking a non-active pill starts a transition). Supersedes the earlier incorrect "no fix required" room note.
- Room switching (living/kitchen/bedroom/terrace) is in scope (Task 3 interactive hero); the earlier "working, no fix required" reading was WRONG — user reported the non-active pills were literally unclickable, root-caused to the SSR/hydration `onLoad` race and fixed in `113019a`.
- Fresh checks at HEAD `113019a`: gate pass (137 files / 701 tests; Prettier/ESLint/tsc clean); build exit 0; home E2E 5/5, zero UntrustedHost/console errors. Protected Task 3 plan hash `f1be0e06…c503a7e2` unchanged; both plan files untracked/unmodified; identity `ui-ux-promax <gojjoy22@gmail.com>`, no AI/bot/co-author trailers.
- Environment cleanup (not repo scope): the local `impeccable` Claude Code plugin was uninstalled at the user's request (removed from settings.json `enabledPlugins`/`extraKnownMarketplaces`, `installed_plugins.json`, `known_marketplaces.json`, and its cache/marketplace/data dirs; project `.impeccable/` cache deleted). Full effect after a Claude Code restart.

## Phase 3 foundation — Task 1

- Task 1 complete in the focused working tree: `e2e/database-guard.ts` now requires `E2E_DATABASE_ALLOW_WRITES=1`, validates explicit PostgreSQL E2E URLs, ignores ambient application URLs, falls back only from the explicit pooled E2E URL, and forces blank `RESEND_API_KEY`.
- Playwright now injects only the guarded disposable database environment. Global setup uses one Playwright request context, GET-only warmup routes, a read-only `/catalog` interval every 15 seconds, and teardown cleanup/disposal. No direct Neon SQL or write warmup remains.
- Source contracts cover canonical SKU/cart/order relations, Auth.js role and safe callback boundaries, guest cart/wishlist sign-in merges, production import isolation, the GET-only warmup contract, and all three blank E2E environment keys.
- Foundation audit conclusion: No new architecture decision; ADR-001/007/010/012/013/014 and the canonical SKU schema govern implementation. Local audit: `.superpowers/sdd/phase-3-foundation-audit.md` (ignored). Task report: `.superpowers/sdd/phase-3-task-1-report.md` (ignored).
- Focused validation: the seven-file Vitest command passed 46/46 tests; the required Prettier check passed with all matched files using Prettier code style. Playwright was not run because the disposable E2E environment keys are absent.

## Phase 3 foundation — Task 1 review remediation

- Important 1 fixed: `E2E_DATABASE_URL_UNPOOLED` now falls back only when the key is absent. An explicitly supplied empty value, as well as a non-PostgreSQL value, is rejected. Regression coverage is in `tests/e2e-database-guard.test.ts`.
- Important 2 fixed: the production import boundary now parses TypeScript imports deterministically and rejects forbidden clone/source paths in static, side-effect, dynamic, `require`, import-equals, and export-from module references. Focused fixtures verify side-effect, dynamic, and `require` forms while ignoring non-import strings.
- Minor wording fixed: `.env.example` now states that the pooled URL and write opt-in are required while the direct/unpooled URL is optional.
- Review-remediation RED: the new empty-unpooled regression failed because the old guard treated present empty as absent. GREEN: the focused pair passed 17/17 tests.
- Task 1: complete (commits ef9b2db..85da104, review clean; Critical 0 / Important 0 / Minor 0).

## Phase 3 commerce and authentication — Task 2

- Task 2 implementation complete in the focused working tree. Auth Variant B uses the accepted clone presentation with production Auth.js credentials/Google sign-in, registration, inline verification, safe callbacks, server retry feedback, and the single demonstration-service consent.
- Auth route group now renders the accepted storefront header/footer and initial cart count without `VerificationGateHost`; the shop route retains the host.
- Exact clone assets verified: graphite room `77AD8149…80D7`, ivory chair `75106ABA…66F1`, terracotta chair `19F47174…385D`.
- RED: required new-auth Vitest command failed while components, styles, and assets were absent. GREEN: focused Vitest command passed 14 files / 69 tests; `npm run typecheck` passed; required focused Prettier check passed.
- Playwright skipped because disposable E2E database keys or explicit write opt-in are absent. No ambient database used. Full gate, build, and all E2E were intentionally not run.
- Report: `.superpowers/sdd/phase-3-task-2-report.md`.

### Task 2 review remediation

- Important findings fixed: local Google sign-in boundary is intercepted in E2E with sanitized `/` callback proof and no Google navigation; auth tabs use roving `tabIndex`, ArrowLeft/Right/Home/End, `aria-controls`, and `role="tabpanel"`; verification/resend action exceptions show visible alerts; resend blocks concurrent clicks; forbidden `useAuth`/mock scanning covers the controller and auth pages.
- Review-remediation RED showed the new assertions failing on the old implementation. GREEN focused component/source check: 2 files / 15 tests passed.
- Final focused check: requested six-file Vitest command passed 6 files / 40 tests; `npm run typecheck` passed; Prettier check passed for all five touched source/test files.
- Playwright skipped because all disposable E2E URL/write-opt-in keys were absent. No ambient application database used.

### Task 2 review Important follow-up — 2026-08-14

- `e2e/auth.spec.ts` now intercepts `**/api/auth/signin/google**`, covering Auth.js `callbackUrl` query strings. Callback assertion reads query with POST fallback.
- E2E contract now verifies local origin/path, sanitized `/` callback, no external Google request, no `/phish`, and no Google page URL; fulfilled callback remains local `/login?callbackUrl=%2F`.
- `npx vitest run tests/evironn-auth-source-contract.test.ts` — 1 file / 3 tests passed.
- `npx prettier --check e2e/auth.spec.ts` — pass.
- Playwright skipped: missing `E2E_DATABASE_URL`, `E2E_DATABASE_URL_UNPOOLED`, `E2E_DATABASE_ALLOW_WRITES`; no ambient database used.
- Task 2: complete (commits 2e5167c..96dbd52, review clean; Critical 0 / Important 0 / Minor 0).

## Phase 3 commerce and authentication — Task 3

- Task 3 complete in the focused working tree. Canonical SKU cart DTOs, projection, serializable POST retry boundary, owner-scoped PATCH/DELETE, root clear, complete Zustand snapshots, totals/counts, logout reset, and both accepted ProductPage add controls are implemented.
- RED: the required four-file Vitest command failed on the absent projection, canonical POST, clear route, store snapshot, and active PDP behavior.
- GREEN: the required focused regression command passed 11 files / 53 tests; `npm run typecheck` passed; the required focused Prettier check passed.
- Playwright skipped because `E2E_DATABASE_URL`, `E2E_DATABASE_URL_UNPOOLED`, and `E2E_DATABASE_ALLOW_WRITES` are absent. Full gate/build/all-E2E were not run.
- Report: `.superpowers/sdd/phase-3-task-3-report.md`.

### Task 3 review remediation — 2026-08-14

- Exact approved commerce CartDto restored: canonical required fields only, ordered option labels/swatches, `oldLineTotal`, exact six error codes, nested `CartApiError`, and no client `productVariantId`/legacy fields.
- Legacy ProductVariant support remains server projection compatibility only. Related-cart client writes now require canonical SKU identity.
- Route mapping now distinguishes `OUT_OF_STOCK` from `QUANTITY_EXCEEDS_STOCK`, includes current stock, uses exact nested envelopes/statuses, and preserves P2034 retry handling.
- Added focused P2002 race cases: retry rereads quantity/stock and preserves valid increment; reread quantity above stock returns `QUANTITY_EXCEEDS_STOCK`; retry exhaustion returns `CART_CONFLICT`, never generic 500.
- RED: focused projection/route/store run failed 8 expected contract assertions. GREEN: focused 14-file command passed 67/67. Typecheck passed. Touched-file Prettier check passed. Full gate/build/E2E not run.

### Phase 3 checkpoint — 2026-08-14

- Stop point: Task 3 implementation and first review-remediation wave are committed through `8ebbf54` (`feat: add canonical sku cart contracts`, `fix: remediate canonical sku cart review findings`).
- Task 3 re-review is blocked with Critical 0 / Important 4 / Minor 0. Required next remediation: map malformed JSON to nested `INVALID_INPUT` HTTP 400; make every cart store action return `Promise<CartDto>` after replacing the server snapshot; select only in-stock related-cart SKUs and disable missing/unavailable buttons; catch quantity/remove failures in cart-line consumers.
- Focused evidence remains green: 14 Vitest files / 67 tests, typecheck, and Prettier. No E2E, full gate, build, push, PR, merge, or Task 4 work started. Disposable E2E keys remain absent.
- Resume from Task 3 remediation. Do not mark Task 3 complete or start Task 4 until affected focused checks pass and fresh Task 3 review is clean.

### Phase 3 Task 3 review remediation — 2026-08-15

- Four requested findings addressed only: malformed POST/PATCH JSON now returns nested `INVALID_INPUT` HTTP 400; all cart-store actions return `Promise<CartDto>` and replace/return successful snapshots while mutations retain prior state and rethrow; related-cart canonical SKU projection/CTA rejects stock-zero or unavailable products; cart-line quantity/remove rejections are caught with loading cleanup preserved.
- RED: new regression set failed 6 expected contract assertions and emitted one unhandled rejection from the old line consumer. Test isolation correction rerun retained expected production failures.
- GREEN: focused regression command passed 5 files / 28 tests; affected cart/presentation/store, related cart, product summary, cart line, storefront shell, and PDP command passed 15 files / 77 tests.
- `npm run typecheck` passed. Touched source/test Prettier check passed. `git diff --check` passed.
- Fresh Task 3 review approved: Critical 0 / Important 0 / Minor 0. Review range `2e3ec75..d6dab3b`; exact DTO/error contract, server authority, retries, owner scope, and Phase 2 preservation confirmed.
- Task 3: complete (commits `671f80a..d6dab3b`, review clean; Critical 0 / Important 0 / Minor 0). No full gate, build, E2E, push, PR, or merge.

## Phase 3 commerce and authentication — Task 4

- Task 4 implementation connects canonical guest/account wishlist state to Catalog Variant B. `getWishlistItems` now uses the active furniture projection; `addToWishlist` is idempotent and server-authoritative; `toggleWishlist` preserves toggle/merge foundations while rejecting inactive products; catalog hearts use server-provided IDs and controlled successful mutation results; count reads remain no-create and active-product scoped.
- TDD RED: the required five-file Vitest command failed with the expected missing canonical projection, mutation action, controlled catalog props/controller, and source-contract assertions.
- TDD GREEN: `npx vitest run tests/wishlist.test.ts tests/toggle-wishlist.test.ts tests/wishlist-count-route.test.ts tests/evironn-catalog-wishlist.test.tsx tests/evironn-catalog-source-contract.test.ts` passed 5 files / 34 tests.
- Required touched-file Prettier check passed. `git diff --check` passed.
- `npm run typecheck` reports the unowned legacy profile consumer mismatch: `app/(shop)/profile/page.tsx` still expects `ProductCardData[]` while canonical wishlist reads return `FurnitureProductCardData[]`. The preserved legacy catalog-card test also expects retired local favorite behavior; neither file was changed because both are outside exact Task 4 ownership.
- Playwright skipped because disposable E2E keys are absent. No ambient database used. Full gate, build, and all E2E intentionally not run.
- Report: `.superpowers/sdd/phase-3-task-4-report.md`.

### Phase 3 Task 4 review remediation — 2026-08-15

- Exact findings fixed: profile canonical wishlist now crosses explicit `toProfileProductCardData` DTO boundary; CatalogCard legacy overload/no-op fallback removed; controlled card tests updated; rollback test awaits rejection and verifies prior `true` restored.
- RED: baseline focused catalog/profile run failed 2 stale card assertions; `npm run typecheck` failed canonical wishlist to legacy profile prop assignment.
- GREEN: focused Vitest passed 7 files / 48 tests; typecheck passed; Prettier passed; `git diff --check` passed.
- Broader `tests/evironn-catalog-variant-b.test.tsx` is blocked before tests by the local `next-auth` `next\\server` module-resolution error. No full gate/build/E2E run.

### Phase 3 Task 4 legacy suite mock remediation — 2026-08-15

- Added a hoisted `@/app/actions/wishlist` mock to `tests/evironn-catalog-variant-b.test.tsx`; production Catalog Variant B controlled wishlist behavior and assertions remain unchanged.
- Legacy suite initially exposed a test-fixture loop after collection unblocked: omitted `initialWishlistedIds` recreated the default array on every render. The test now passes one stable empty array; production code unchanged.
- GREEN: `npx vitest run tests/evironn-catalog-variant-b.test.tsx` passed 1 file / 11 tests.
- Prettier check for touched test passed. `git diff --check` passed. Typecheck skipped because change is test-only.
- No full gate, build, E2E, or broader focused suite rerun per stop instruction. Report: `.superpowers/sdd/phase-3-task-4-report.md`.

### Phase 3 Task 4 Important review remediation — 2026-08-15

- Made `CatalogVariantB.initialWishlistedIds` required as `string[]`; removed the default empty-array allocation.
- Root cause: omitted prop recreated `[]` on every render, while the synchronization effect created a fresh `Set` and scheduled an unbounded rerender.
- Verified production route and all test renders pass explicit arrays; accepted Catalog Variant B markup and controlled wishlist behavior preserved.
- RED: source-contract test failed on optional/default prop contract.
- GREEN: focused Catalog Variant B/wishlist/source suites passed 3 files / 17 tests; `npm run typecheck` passed.
- Full gate, build, E2E, and unrelated suites not run per Task 4 scope. Report: `.superpowers/sdd/phase-3-task-4-report.md`.
- Fresh Task 4 review approved: Critical 0 / Important 0 / Minor 0. Fresh evidence: 17/17 focused tests, legacy Catalog Variant B 11/11, typecheck, Prettier, and `git diff --check` pass.
- Task 4: complete (commits `c816cef..72b60a5`, review clean; Critical 0 / Important 0 / Minor 0). No full gate, build, E2E, push, PR, or merge.

## Phase 3 commerce and authentication — Task 5

- Task 5 ports the accepted clone Cart Variant A and Cart Primitives JSX/classes/CSS without redesign. The production adapter uses canonical furniture SKU cart DTOs, production cart state, Auth.js-backed server actions, and the existing wishlist foundation.
- Server authority is preserved for prices, totals, coupon validation, stock, quantity limits, and cart/wishlist mutations. Checkout controls are visibly disabled with honest next-stage copy. Save-to-wishlist deletes only after a successful save; undo re-adds the original canonical `skuId` and quantity while leaving the wishlist entry intact. Related products use canonical `primarySkuId` values and disable unavailable products.
- The now-unreferenced legacy related grid and focused test were removed. Its old server entry remains a no-op compatibility boundary because it has no consumers after Cart Variant A became the sole related renderer.
- TDD RED showed the expected missing Cart Variant A/source files and legacy coupon action failure. GREEN passed the required four-file command at 33/33 and the broader focused regression command at 72/72.
- `npm run typecheck`, the required touched-file Prettier check, and `git diff --check` passed. Playwright was skipped because disposable E2E keys are absent; no ambient database was used. Full gate, build, and all E2E were not run per Task 5 scope.
- Report: `.superpowers/sdd/phase-3-task-5-report.md`.

### Phase 3 Task 5 final Important review remediation — 2026-08-15

- Related cart links now derive canonical primary SKU option selections and emit encoded product slug plus supported `?option=` query; unsupported `?sku=` query removed. Added focused route regression.
- Display-only configuration swatches retain noninteractive `span` semantics with clone-compatible geometry/state CSS. Disabled mobile checkout button now receives clone CTA geometry and responsive padding without enabling checkout.
- RED: route/CSS contract assertions failed before fixes. GREEN: focused cart/catalog/product command passed 12 files / 82 tests; typecheck, Prettier, and `git diff --check` passed.
- Full gate, build, and all E2E not run per remediation scope. Report: `.superpowers/sdd/phase-3-task-5-report.md`.

### Phase 3 Task 5 final approval — 2026-08-15

- Closed review findings across six remediation commits: controlled wishlist/count refresh and rollback; canonical related route boundary; complete coupon snapshots with external cart-mutation invalidation; honest E2E stock/coupon assertions; clone-compatible swatch/mobile CTA styling; and rejection handlers for clear/related-add/undo mutations.
- Related product query is constrained to the supported PDP slug; unsupported related products have no navigable URL and cannot route to the wrong product.
- Fresh focused evidence across remediation passed, including 43/43 and 23/23 targeted checks, typecheck, Prettier, and `git diff --check`. Playwright remains blocked by absent disposable database write keys; no ambient DB used.
- Final Sol review approved the full Task 5 delivery diff `d65edec..4a04579`: Critical 0 / Important 0. No full gate, build, push, PR, merge, or Task 6 work started.
- Task 5: complete (commits `ae04de0..4a04579`, review clean). Resume from Task 6 implementation.

## Phase 3 Task 6 — profile, password, and address boundaries

- Task 6 adds bounded `ProfilePageDto` serialization and authenticated profile reads, immutable order-item snapshots, canonical furniture-card adaptation, password current-secret/hash enforcement, and owner-scoped address actions with exactly-one-default invariants and bounded transaction retries.
- GREEN: focused profile/password/address/update-profile command passed 6 files / 38 tests; typecheck, touched-file Prettier, and `git diff --check` passed. Playwright/full gate/build not run per task scope.
- Fresh Sol review approved `f218448..93bea3b`: Critical 0 / Important 0 / Minor 0. No schema, auth-model, UI, order-mutation, or Phase 4 scope entered.
- Task 6: complete (commit `93bea3b`, review clean). Resume from Task 7 implementation.

## Phase 3 commerce and authentication — Task 6

- Task 6 implementation is complete in the focused working tree. `ProfilePageDto` and `getProfilePageDto` use bounded, owner-scoped Prisma selections, ISO dates, initials, counts, active canonical furniture favorites, deterministic default-first addresses, and immutable order-item snapshot lines formatted through `formatOrderItemConfiguration`.
- Profile updates never forward email. Password updates require current-password verification, validate replacement input, and write only the replacement hash. Address mutations enforce owner scope, exactly one default address, first-address defaulting, oldest-address promotion after default deletion, serializable transactions, and three bounded P2034 retries with fresh owned-address rereads.
- TDD RED was observed for the missing DTO, incomplete address invariants, and malformed password input. GREEN focused Vitest passed 6 files / 38 tests; `npm run typecheck` passed; touched-file Prettier check passed.
- Report: `.superpowers/sdd/phase-3-task-6-report.md`. Full gate, build, and all E2E were not run by Task 6 scope. Existing untracked plans remain preserved and unmodified.
- Task 6: complete in the working tree; commit subject is reserved as `feat: harden profile data boundaries`.

## Phase 3 commerce and authentication — Task 7

- Task 7 ports production Profile Variant A with clone shell/classes, exact CSS, Auth.js logout, DTO-backed overview/orders/favorites/profile/addresses, canonical `primarySkuId` cart adds, sold-out disabling, read-only order snapshots, and owner-scoped mutations.
- TDD RED: focused UI/source tests caught CSS fingerprint drift and uncaught address-action rejection. GREEN: full focused profile command passed 10 files / 60 tests.
- `npm run typecheck`, focused Prettier, and `git diff --check` passed. Clone CSS fingerprint matches source. Profile E2E was added but skipped because all disposable E2E keys are absent; no ambient database used.
- Full gate/build intentionally not run. Existing untracked plans preserved. Commit subject reserved: `feat: port production profile variant a`.

### Task 7 review remediation — 2026-08-15

- Reconciled profile wishlist state against `toggleWishlist` result `active`, preserving controlled favorites and exact counts on stale/multi-tab responses while refreshing after success.
- Recomputed initials from saved profile name and DTO email after successful profile update.
- Strengthened only `e2e/profile.spec.ts`: password success before logout/re-login; successful non-default set-default state before delete; successful favorites cart mutation with response items/count and header count before removal.
- RED: new stale-wishlist and initials assertions failed on `da49ee2`. GREEN: focused Task 7 command passed 10 files / 61 tests; typecheck, Prettier, and diff-check passed.
- Profile E2E invocation stopped at disposable-DB guard because `E2E_DATABASE_ALLOW_WRITES=1` and disposable URLs are absent. No ambient database used. Full gate/build/all E2E not run.
- CSS unchanged; clone fingerprint remains `e55a53ded3f4fd65dfc341470a0f686e8b3b9a4402d26a21ba9ae298a713ea10`. Commit subject reserved: `fix: remediate profile variant review findings`.

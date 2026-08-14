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

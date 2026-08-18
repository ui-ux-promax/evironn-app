# Phase 4 checkout, payments, and orders

## Coordinator state

- Delivery base: `868310f`; branch: `phase/04-checkout-orders`; plan: `docs/superpowers/plans/2026-08-16-phase-4-checkout-orders.md`.
- Current ADR-018-amended plan hash: `BF366163020AC32A057CC0E74FFD6D15216CD8A15506EF8005F71B06111590DA`; plan/design remediation commits: `39fb2a1`, `91c3915`, `d2d23bd`. Fresh independent plan review approved Critical 0 / Important 0 / Minor 0.
- ADR-018 planning is approved. Implementation is proceeding sequentially under the approved Phase 4 plan.
- Phase 3 merge: PR #3, merge `868310f`; final Phase 3 commit `f3d8a93`.
- Protected plan hashes: `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9` and `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`.
- ADR-015 approved shared non-production Neon E2E fingerprint confirmed; user confirmed no separate Production database exists. ADR-016 delivery/service policy approved 2026-08-16.
- Task 1 committed as `53b729f` (`chore: initialize phase 4 delivery`). Final plan review: APPROVED, Critical 0 / Important 0 / Minor 2, plan hash `4D5AE7BF7F9400A212BF10CD3902ACA61CE7227CF777FA2F46556E5899CAB8B2`.
- Task 1 complete: commits `53b729f..a721d4a`; focused Vitest 20/20, touched-file Prettier, and diff checks pass. Fresh re-review approved Critical 0 / Important 0 / Minor 0.
- Task 2 complete: commits `7a01515..cd3741e`; focused Vitest 6 files / 34 tests, Prisma validate/generate, typecheck, Prettier, and diff checks pass. Fresh final review approved Critical 0 / Important 0 / Minor 0. No database connection or migration application occurred.
- Task 2A complete: commits `ca26715..e15dbd6`; the explicit guarded read-only migration checkpoint reported `UNAPPLIED` with `ok: true`, then added only nullable `Order.paymentReturnUrl` and the separate one-line additive migration. Focused Vitest 61/61, Prisma validate/generate, typecheck, Prettier, and diff checks pass. Fresh xhigh review approved Critical 0 / Important 0 / Minor 0. No migration deploy or application-data write occurred.
- Task 3 complete: commit `52ba731`; authenticated owner-scoped checkout read model, server-owned quote, coupon reader/clock injection, bounded DaData projection, and payment-initialization DTO vocabulary implemented. Focused Vitest 41/41, typecheck, Prettier, and diff checks pass. Fresh xhigh review approved Critical 0 / Important 0 / Minor 0. External-service smoke remains deferred because presence-only preflight found all requested keys absent.
- Task 4 implementation and remediation are committed through `3892e1a` (`8115efd`, `dc01f19`, `3892e1a`). Fresh focused evidence: 11 files / 99 tests, typecheck, touched-file Prettier, diff check, and secret scan pass. Fresh xhigh review approved Critical 0 / Important 0 / Minor 0. Residual risk is accurately limited to deterministic-mock concurrency proof; no live DB/provider call occurred.
- ADR-018 durable YooKassa create claim was approved by the user on 2026-08-17. Design: `docs/superpowers/specs/2026-08-17-phase-4-durable-payment-claim-design.md`. The approved executable plan adds a separate additive Task 3A schema checkpoint and a bounded Task 4 remediation sequence.
- Task 3A complete: commit `4340dc7`; exact enum, three nullable `Order` fields, separate additive migration, and schema-preservation tests. Focused Vitest passed 3 files / 45 tests; Prisma validate/generate, typecheck, and diff checks passed. Fresh xhigh review approved Critical 0 / Important 0 / Minor 0. No database or provider call occurred.
- Task 4 complete after ADR-018 remediation review.
- Task 5 complete through `fd00a5c`: transactional payment reconciliation, exact provider recovery, verified customer cancellation, retry-safe review pruning, and provider-status validation are implemented. Final focused evidence passed 8 files / 145 tests, typecheck, touched-file Prettier, and diff check. Fresh xhigh review approved Critical 0 / Important 0 / Minor 0. Live YooKassa/database smoke remains deferred because external credentials are absent.
- Task 6 complete through `6373dac`: production Checkout Variant A, exact clone CSS, canonical cart entry, server-owned quote recovery, terminal placement locking, quantity limits, preserved service choices, and truthful lift/service copy are implemented. Final focused evidence passed 12 files / 104 tests; typecheck, touched-file Prettier, exact CSS hashes, and diff check passed. Fresh xhigh review approved Critical 0 / Important 0 / Minor 0. No live database/provider call occurred.
- Task 7 complete: commits `22d2509..f303387`; focused Vitest 9 files / 115 tests, typecheck, targeted Prettier, and diff-check passed. Fresh Sol Medium re-review approved `6373dac..f303387`: Critical 0 / Important 0 / Minor 0. No live database/provider call; Tasks 8-9 remain incomplete. No push, Preview, PR, merge, branch deletion, or next phase.
- Task 8 complete: commits `5cb599b..015018e`; focused safety/migration/guard Vitest 3 files / 77 tests, typecheck, focused Prettier, and diff-check passed. Guarded checkout/YooKassa collection skipped honestly because explicit E2E database/Auth/provider variables and required forbidden fingerprints are absent; no database/provider call. Fresh Sol Medium review `f303387..015018e` approved Critical 0 / Important 0 / Minor 0. Task 9 remains incomplete; no push, Preview, PR, merge, branch deletion, or next phase.
- Task 9 Steps 1–2: RED contract intentionally failed 9 assertions before manifest/closeout records. STATUS/progress now record Task 7/8 focused evidence and sanitized blocked state. Presence-only booleans are all false for the explicit E2E database, Auth.js, transactional email, YooKassa, DaData, and site URL names. Provisional manifest excludes itself and is not final HEAD evidence; completion readiness is `BLOCKED_COMPLETION_READINESS`. No full gate, build, full E2E, migration deploy, database write, provider call, push, Preview, PR, merge, branch deletion, or Phase 5 work.
- Task 9 Steps 3–4 prior evidence: integration/schema/E2E-safety contracts passed 3 files / 37 tests; listed files passed Prettier; `git diff --check` exited 0 with existing line-ending warnings only. This prior provisional evidence remains historical.
- Task 9 acceptance-review-2 remediation: exactly three Important findings are closed in Task 9 only. Fresh RED after adding independent assertions was 1 file / 14 tests collected / 4 expected failures. Fresh integration GREEN is 1 file / 14 tests; documented combined GREEN is 3 files / 41 tests. Listed evidence files passed Prettier; `git diff --check` exited 0. The remediation adds forced production payment correlation/cancellation interleavings, exact closed-window/release/failure/missing-payment cases, full ADR-016 pickup facts, executable cleanup policy, imported name-only fingerprint acquisition, and exact current manifest/report counts. `BLOCKED_COMPLETION_READINESS` remains. Commit subject: `test: complete phase 4 delivery contracts`; authoritative range: `868310f..HEAD`. No full format, gate, build, full Vitest, full E2E, database, provider, migration, push, Preview, PR, merge, branch deletion, or Phase 5 work.

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

### Phase 3 Task 7 final review remediation — 2026-08-15

- Replaced raw DTO equality retention with normalized server-refresh reconciliation in `useProfileVariantA`. Incoming profile dates normalize to ISO, server address order/defaults and non-favorite stats apply directly, and only active per-product optimistic favorite state overlays the refreshed favorite slice.
- Per-request optimistic favorite tokens clear in `finally`; later refreshes accept authoritative server state. Added regressions for normalized profile/birthdate, server-sorted addresses/defaults, updated stats, in-flight preservation, and stale-state release.
- Wishlist-removal E2E now parses Next Flight `{ok:boolean}` action results, requires success, reloads `/profile`, and asserts durable server-backed empty favorites. Disposable DB guard remains unchanged.
- RED: 2 expected failures before implementation. GREEN: focused Task 7 command passed 10 files / 64 tests. Typecheck, touched-file Prettier, and `git diff --check` passed.
- Profile E2E stopped at disposable guard because `E2E_DATABASE_ALLOW_WRITES=1` and disposable URLs are absent. No ambient DB. Full gate/build/all E2E not run. Commit subject: `fix: harden profile DTO reconciliation`.

### Phase 3 Task 7 final approval — 2026-08-15

- Closed final review findings: wishlist rollback is target-only and preserves concurrent DTO refreshes; profile E2E scopes the removal control uniquely and verifies successful server action plus durable post-reload absence.
- Root-cause CSS line-ending drift was diagnosed and corrected against the read-only clone; exact `ProfilePage.css` SHA is restored. Full focused profile command passes 10 files / 65 tests; typecheck, Prettier, and `git diff --check` pass.
- Final Sol review approved full Task 7 delivery diff `0bce983..912e49d`: Critical 0 / Important 0. Profile E2E remains guarded by absent disposable database keys; no ambient DB used.
- Task 7: complete (commits `da49ee2..912e49d`, review clean). Resume from Task 8 implementation.

## Phase 3 Task 8 — purchase-gated review readiness

- Task 8 consolidates the server-owned purchase predicate across eligibility, canReview, submit, and pruning. Canonical SKU and legacy ProductVariant fallback are supported; online payment/cancellation and delivered-COD gates are enforced; pending/processing COD cannot qualify; duplicate submit races remain safe.
- Added Phase 3 integration contract with a complete 115-file delivery manifest, independent pinned count/SHA checks, forbidden-path coverage, canonical cart/wishlist/profile boundaries, unchanged schema contract, and no Phase 4 UI/checkout/payment/order/admin/performance scope. Review readiness uses a guarded deterministic seeded-order ownership probe and creates no fixtures.
- GREEN: focused review/integration command passed 9 files / 74 tests; typecheck, Prettier, and `git diff --check` passed. E2E remains blocked by absent disposable database keys; no ambient DB used.
- Final Sol review approved `b521a00..6b65f48`: Critical 0 / Important 0. Task 8 complete (commits `9862c59..6b65f48`, review clean). Resume from Task 9 completion gate.

## Phase 3 commerce and authentication — Task 8

- Centralized the owner/product qualifying-purchase predicate in `lib/review.ts`. Canonical SKU and legacy ProductVariant order lines remain read-compatible; online orders require successful payment and non-cancelled status; COD requires `DELIVERED`.
- `getReviewEligibility`, `canReview`, `submitReview`, and `pruneReviewsAfterCancel` remain server-owned. `reviewSchema` is strict, Auth.js supplies `userId`, and duplicate review creation retains the P2002 race-safe response.
- Replaced the old review E2E order/payment fixture with a guarded readiness check for a newly verified user without a qualifying purchase. Added the Phase 3 source integration contract; no review UI, order/payment fixture, API route, or schema change.
- TDD RED: `npx vitest run tests/review.test.ts tests/submit-review.test.ts tests/phase-3-integration-contract.test.ts` failed on the missing delivered-COD/online predicate and shared integration boundary.
- GREEN: focused core command passed 3 files / 32 tests. Required focused regression passed 9 files / 71 tests. Touched-file Prettier passed.
- Review E2E stopped at the disposable database guard because `E2E_DATABASE_ALLOW_WRITES=1` and disposable URLs are absent; no ambient database used. Full gate, build, typecheck, and all E2E not run.
- Report: `.superpowers/sdd/phase-3-task-8-report.md`. Commit subject: `test: enforce purchase-gated reviews`.

## Phase 3 Task 9 — completion gate and delivery close (2026-08-15)

- Base `origin/dev`: `b31194ab07de4ed396d9bfcc5c9d16734d113f95d`. Current code head before durable docs close: `4ff8070`.
- Final remediation aligned stale regression contracts, pinned the 115-file delivery manifest and exact Cart A CSS, prevented legacy IDs entering canonical undo writes, surfaced PDP and 360-modal add failures, and kept disabled cart controls route-safe (`c596187`, `91dc837`, `1bef496`, `f2f8d7b`, `078e592`, `4ff8070`).
- Completion evidence: `npm run format` passed; final `npm run gate` passed — 170 test files / 930 tests, 0 ESLint errors and 59 warnings; `npm run build` passed with expected existing warnings.
- Required Phase 3 E2E command was invoked but the disposable database guard stopped it before Playwright because `E2E_DATABASE_ALLOW_WRITES=1` and disposable E2E URLs are absent. No ambient database was used; email sending remains suppressed with blank `RESEND_API_KEY`.
- Schema/migrations unchanged; no new architecture decision; secret scan found no credential value. Google OAuth external smoke is `pending Preview acceptance` because push/Preview authorization is not granted.
- Delivery report: `.superpowers/sdd/phase-3-delivery-report.md` (ignored local artifact). Phase 3 now awaits desktop/mobile visual acceptance. Stop here: no push, PR, merge, branch deletion, or Phase 4.

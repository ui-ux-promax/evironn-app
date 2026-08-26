# Migration status

## Current state

- Bootstrap and Phases 1–4 are complete and merged into `dev`.
- Active delivery: Phase 5. Streams 5A, 5B, and 5C are complete and user-closed. The user accepted 5C on 2026-08-26 after the approved final review. Stream 5D planning is authorized on `phase/05-admin-demo`.
- Integration branch: `dev` at merge commit `da5e87e` (Phase 4 closeout PR #9).
- Current delivery branch: `phase/05-admin-demo`, created from exact `origin/dev` commit `da5e87e`.
- Phase 5 scope: protected production admin, furniture catalog/SKU/media administration, orders, customers, roles, coupons, dashboard, and public synthetic read-only demo admin.
- Phase 6 is not authorized.

## Completed phase merges

- Phase 1: PR #1, merge commit `3e4e2a0`.
- Phase 2: PR #2, merge commit `b31194a`.
- Phase 3: PR #3, merge commit `868310f`.
- Phase 4: PR #4, merge commit `9bbb70f`.
- Phase 4 deployment-smoke follow-up: PR #5, merge commit `f10ceb9`.
- Phase 4 durable closeout: PR #9, merge commit `da5e87e`.
- The accidental `dev`-to-`main` merge was safely reverted through PR #8; current `main` is `162a35e`.

Historical delivery details are summarized in `docs/roadmap/archive/PHASES-1-4.md`. Exact technical evidence remains in the tracked `.superpowers/sdd/phase-*-report.md` files, Git history, and the ADRs in `DECISIONS.md`.

## Phase 4 accepted state and retained debt

- Checkout, Moscow/Moscow Region delivery and services, COD, YooKassa initialization/recovery, payment reconciliation, cancellation/stock restoration, order pages, DaData suggestions, and purchase-gated reviews are merged.
- Phase 4 functional browser evidence covered checkout, order, review, COD, and blocked-payment lookup paths against the selected non-production Neon target.
- Real YooKassa sandbox creation/cancellation remains optional manual smoke under ADR-020 and is not a Phase 5 blocker.
- Initial Vercel loading performance remains deferred to Phase 6 measurement and hardening.
- Vercel builds must never run `prisma db push`; schema changes use reviewed Prisma migrations outside the build command.

## Phase 5 planning boundary

- Production repository: `D:\Projects\evironn`.
- Read-only technical source: `D:\Projects\fashion-shop`.
- Read-only visual source: `D:\Новая папка (2)\evironn-clone`.
- Existing Evironn admin/demo-admin code is a reusable inherited foundation, not disposable scaffolding.
- The planner must first create a source-parity matrix: reuse unchanged, adapt to canonical furniture domain, port from clone, or retire with evidence.
- `/admin` requires server-enforced `ADMIN` authorization on layouts, reads, actions, and API routes.
- `/demo-admin` remains public, synthetic, read-only, independent from Prisma and mutation endpoints.
- Cloudinary signing/deletion must be ADMIN-only and restricted to an Evironn-owned folder boundary.
- Admin visual acceptance on desktop and mobile is required before Phase 5 merge.
- The user accepted the current 5A dashboard on 2026-08-25. Exact cross-route Evironn admin visual parity is intentionally deferred until all protected admin and demo-admin functionality is complete; 5B and 5C must preserve the accepted shell and use reusable data/form boundaries rather than perform route-by-route redesigns.

## Session and verification policy

- ADR-021 permits Phase 5 to span bounded sessions 5A–5D on the same branch to protect context quality. There is still one Phase 5 branch and one final PR into `dev`.
- Implementation tasks use focused checks only. The full format/gate/build/critical-E2E completion gate runs once after all Phase 5 tasks and final review.
- Required checks must actually run; `skipped` is not accepted as successful evidence.
- Before any PR or merge, show and verify exact base `dev`, compare branch, required-check status, and destination branch.

## Protected local files

Preserve these pre-existing untracked Phase 2 plans without modification or cleanup:

- `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`
- `docs/superpowers/plans/phase-2-task-3-execution.md`

## Current 5C closeout state

- Final reviewed code/docs candidate: `c14fd8d`; final-review range: `5f31f2d..c14fd8d`. Review closeout documentation: `9c0c3b0`. Remediation commits: `92d1695`, `c14fd8d`.
- Focused typechecks passed at the 5C.3 shared-contract checkpoint and the role-form remediation checkpoint. No full suite, gate, build, E2E, database CLI, or provider run occurred.
- Fresh final Sol review `Avicenna` on 2026-08-26 covered exact range `5f31f2d..c14fd8d` and returned `APPROVE` with Critical 0, Important 0, Minor 0. The bounded remediation is complete. Nash's earlier `REQUEST CHANGES` result remains historical prior review evidence.
- High-risk 5C.3 Sol review `Mill` returned `APPROVE` with Critical 0, Important 0, Minor 0 for the 5C.0 policy plus the exact 5C.3 range.
- COD disposable-order and stale-tab conflict evidence remain unavailable because checkout contact-input values did not persist. The user accepted the visible 5C delivery on 2026-08-26; this defect and its dependent evidence are mandatory 5D debt, not silently waived.

## Phase 5D.5 closeout

- Task 5D.5 implementation commit: `ecb349a` (`fix(admin): close functional and media security debt`). Verification/report commit contains the checkout regression and full Task 5D.5 report.
- Four bounded focused areas pass: checkout 3 files/58 tests; media 7 files/45 tests; canonical catalog 7 files/55 tests; access/dashboard/history 6 files/39 tests. Touched-file Prettier and `git diff --check` pass.
- Confirmed defects fixed: unsafe media-path characters, detached canonical-link recreation and contradictory detach handling, turntable thrown-action pending state, and uncalled anonymous warmup route retirement. Checkout production defect was not reproduced.
- `npm run typecheck` remains blocked only by the out-of-scope nullable route/file contract error at `tests/phase-5-route-contract.test.ts:33`; no broad gate/build/E2E/Neon/provider operation ran.
- Full evidence and G2/G4 dispositions: `.superpowers/sdd/phase-5d-task-5-report.md`. Delegated Boundary B review was unavailable in this session and is not claimed.

## Phase 5D debt ledger

- Fix or conclusively diagnose checkout contact-input persistence, then recover the disposable COD cancellation and stale-tab conflict evidence through the application/E2E path.
- Reconfirm the non-self last-admin safeguard with an isolated fixture; automated coverage is not a substitute for claiming unavailable manual evidence.
- Complete exact cross-route Evironn visual parity for protected `/admin` and public synthetic `/demo-admin`, followed by desktop/mobile user acceptance.
- Complete the demo isolation, route/navigation parity, legacy Ritm cleanup, critical Phase 5 E2E, final functional/security review, and the single Phase 5 completion gate.
- Initial Vercel loading performance remains an explicitly approved Phase 6 hardening item. Optional real YooKassa sandbox smoke remains governed by ADR-020 and does not block Phase 5.
- Any newly discovered debt must be added here or to the 5D handoff with an owner and disposition. Phase 5 functional/security debt must be fixed in 5D; moving it to Phase 6 requires explicit user approval and a recorded reason.

## Phase 5D.8 local closeout

- Tasks 5D.1–5D.7 and Boundaries A–C are complete. Boundary C exact range `2c5c982..188fb35` was accepted by fresh functional and security re-reviews at Critical 0 / Important 0 / Minor 0.
- Task 5D.6 evidence: five namespaced serial browser journeys passed with retries disabled; owned COD cancellation/stale-tab invariants and cleanup probes passed.
- Task 5D.7 evidence: 12 representative templates captured at `1440x900` and `390x844` (24 PNGs); all overflow probes were false, all cleanup probes were zero, and the focused visual/render contract passed 31/31. Six known hydration summaries are constrained by a narrow route/viewport allowlist; all other console-error observations are required to be empty.
- Presence-only Cloudinary preflight found `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` absent. `npx prisma validate` passed after loading only the existing local database variable names into the process; no values were printed and no Prisma mutation ran.
- Closeout sequence passed locally: `npm run format`; `npm run gate` (223 files / 1360 tests, 0 lint errors and 56 baseline warnings); `npm run build`; and `npm run e2e -- e2e/admin-phase-5.spec.ts e2e/demo-admin.spec.ts --workers=1 --retries=0` (10/10).
- The first gate attempt exposed pre-existing contract drift in the rebranded Phase 3 probe and Phase 4 migration bytes. The closeout restores the exact additive migration bytes and updates the Phase 3 contract assertion to the current `@test.evironn.invalid` seed domain; focused contract evidence is 16/16.
- Local state is ready for user desktop/mobile visual acceptance. Push, Vercel Preview, pull request, merge, branch deletion, and Phase 6 work remain unauthorized and are not performed.

## Next action

1. User reviews the local protected `/admin` and public `/demo-admin` desktop/mobile visual acceptance evidence.
2. After explicit user acceptance, authorize the separate push/Preview/PR workflow; do not merge without explicit authorization.

Database note: `.env.local` contains the expected application database variable names. The earlier 5B inventory gap came from a standalone process that did not load `.env.local`; it was not evidence that Vercel or the project lacked database variables. Never print their values.

## Preparation validation

- Remote refs were fetched without merging unrelated work.
- Local `dev` was fast-forwarded to exact `origin/dev` commit `da5e87e`.
- `phase/05-admin-demo` was created from that exact commit.
- Git identity remains `ui-ux-promax <gojjoy22@gmail.com>`.
- No application tests, build, database command, provider call, push, PR, merge, or Phase 5 implementation ran during preparation.

## Phase 5C checkpoint — bounded commerce admin acceptance

- Pre-checkpoint candidate: `652cf16`; task commits: `265011c`, `b5b9f46`, `131de2e`, `687a419`, `4d4aeae`, `2cc8b46`, `6830cb9` plus `652cf16` remediation.
- RED search found no prior checkpoint. Changed-file Prettier and `git diff --check` passed. Presence-only checks reported `POSTGRES_URL=present` and `POSTGRES_URL_NON_POOLING=present`; values were not printed.
- `npm run dev` served `http://localhost:3000`. Acceptance used the signed-in ADMIN application UI only; dev process stopped after evidence capture. Focused typechecks passed at 5C.3 and role-form remediation; no full suite/gate/build/E2E, database CLI, provider call, push, PR, merge, or 5D work ran.
- Disposable COD fixture unavailable because checkout phone/email inputs did not retain synthetic values; no order was submitted. Unsafe online order `#52` was used only for blocked cancellation-reason display. Safe COD cancel and stale two-tab conflict are unavailable, not passed. Historical cancelled COD `#53` was not mutated.
- Customer `cmt06hqpk0000tsq44ckx8z6a` was promoted from `CUSTOMER` and restored. Self/only-admin refusal rendered without a write; independent non-self last-admin refusal was not isolated.
- Coupon `PHASE5C_20260826` create/edit/toggle/delete passed through UI. Auxiliary visual fixtures were deleted; list returned to six.
- Orders/list and detail, customers/list and detail, marketing/list, new coupon, and edit coupon were inspected at `1440x900` and `390x844`; mobile overflow was false. No browser errors; existing smooth-scroll warning only.
- Unresolved defect: checkout contact-input persistence blocked disposable COD creation and dependent order mutation/conflict checks. Remaining 5D debt: exact clone visual parity plus consolidated protected-admin/demo-admin visual acceptance.
- High-risk 5C.3 Sol review `Mill` (5C.0 policy plus exact 5C.3 range) returned `APPROVE`, Critical 0 / Important 0 / Minor 0. Final-review remediation commits `92d1695` and `c14fd8d` completed the prior Nash findings. Fresh final Sol review `Avicenna` on 2026-08-26 covered exact range `5f31f2d..c14fd8d` and returned `APPROVE`, Critical 0 / Important 0 / Minor 0. Nash remains historical prior review evidence. Do not push, open a PR, merge, or start 5D.

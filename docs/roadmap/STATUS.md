# Migration status

## Current state

- Bootstrap and Phases 1–4 are complete and merged into `dev`.
- Active delivery: Phase 5. Streams 5A and 5B are complete and user-closed. Stream 5C implementation is checkpointed at `72227e8` on `phase/05-admin-demo`; bounded final-review remediation is in progress. 5D remains pending user acceptance and authorization.
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

- Checkpoint HEAD: `72227e8` (`docs(phase-5c): record commerce admin checkpoint`).
- Focused typechecks passed at the 5C.3 shared-contract checkpoint and the role-form remediation checkpoint. No full suite, gate, build, E2E, database CLI, or provider run occurred.
- Fresh final Sol review `Nash` on 2026-08-26 returned `REQUEST CHANGES` with Critical 0, Important 2, Minor 1. Targets: add page-local `requireAdminPage()` to `/admin/marketing/new` with a focused boundary assertion, and reconcile the current-state durable documents. Final approval has not been granted.
- High-risk 5C.3 Sol review `Mill` returned `APPROVE` with Critical 0, Important 0, Minor 0 for the 5C.0 policy plus the exact 5C.3 range.
- COD disposable-order and stale-tab conflict evidence remain unavailable because checkout contact-input values did not persist. No push, PR, merge, or 5D work occurred.

## Next action

1. Continue on `phase/05-admin-demo`; do not create or switch branches.
2. Treat `5be199a` as the closed 5B checkpoint. Preserve its approved focused evidence: 39 Vitest files / 298 tests, typecheck, changed-file Prettier, and `git diff --check`; no full Phase 5 gate/build/E2E is claimed yet.
3. Complete only the bounded final-review remediation from Nash, rerun affected focused checks, and keep the final status as not approved until review evidence changes.
4. Keep the current accepted admin presentation stable. Complete exact cross-route Evironn visual parity once in 5D after all admin functionality exists.
5. Do not push, open a PR, merge, or start 5D; the consolidated gate remains a later closeout action.

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
- High-risk 5C.3 Sol review `Mill` (5C.0 policy plus exact 5C.3 range) returned `APPROVE`, Critical 0 / Important 0 / Minor 0. Fresh final Sol review `Nash` on 2026-08-26 returned `REQUEST CHANGES`, Critical 0 / Important 2 / Minor 1; the page-local new-marketing guard/test and durable current-state docs are the remediation targets. Final approval is not claimed. Do not push, open a PR, merge, or start 5D.

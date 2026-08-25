# Migration status

## Current state

- Bootstrap and Phases 1–4 are complete and merged into `dev`.
- Active delivery: Phase 5. Stream 5A is functionally complete and user-accepted; its final accepted visual adjustment is present in the local worktree above `0f2a739` and must be checkpointed before 5B starts.
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

## Next action

1. Continue on `phase/05-admin-demo`; do not create or switch branches.
2. Inspect and checkpoint the user-accepted 5A worktree plus this durable handoff update. Reuse fresh focused evidence where valid; do not run a post-visual 5A Opus re-review.
3. Before 5B implementation, have Luna prepare a compact current-state evidence bundle, run one fresh bounded Claude Opus XHigh 5B Planner, then one fresh isolated Claude Opus XHigh Plan Reviewer. Resolve all Critical/Important plan findings and stop for user approval.
4. After approval, execute 5B sequentially with Luna High implementers, focused verification, and bounded Claude Opus XHigh reviews only at meaningful task/risk boundaries.
5. Keep the current accepted admin presentation stable during 5B and 5C. Complete exact cross-route Evironn visual parity once in 5D after all admin functionality exists.
6. Do not push, open a PR, merge, or run the full Phase 5 completion gate during 5B.

## Preparation validation

- Remote refs were fetched without merging unrelated work.
- Local `dev` was fast-forwarded to exact `origin/dev` commit `da5e87e`.
- `phase/05-admin-demo` was created from that exact commit.
- Git identity remains `ui-ux-promax <gojjoy22@gmail.com>`.
- No application tests, build, database command, provider call, push, PR, merge, or Phase 5 implementation ran during preparation.

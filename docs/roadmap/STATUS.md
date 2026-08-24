# Migration status

## Current state

- Bootstrap and Phases 1–4 are complete and merged into `dev`.
- Active delivery: Phase 5 preparation; implementation has not started.
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

1. Start a fresh Phase 5 planning session on Luna High.
2. Invoke one isolated read-only Claude Opus XHigh planner through the local CLI bridge using `.superpowers/sdd/phase-5-handoff.md` and `docs/superpowers/specs/2026-08-20-phase-5-planning-brief.md`.
3. Review and approve the executable plan before any implementation.
4. Execute sequentially with Luna High implementers and fresh Claude Opus XHigh task reviewers.
5. Use fresh Claude Opus XHigh runs for high-risk, final functional, and ADMIN/role/Cloudinary security review. Sol Medium is fallback only when Claude is unavailable and the reason is recorded.

## Preparation validation

- Remote refs were fetched without merging unrelated work.
- Local `dev` was fast-forwarded to exact `origin/dev` commit `da5e87e`.
- `phase/05-admin-demo` was created from that exact commit.
- Git identity remains `ui-ux-promax <gojjoy22@gmail.com>`.
- No application tests, build, database command, provider call, push, PR, merge, or Phase 5 implementation ran during preparation.

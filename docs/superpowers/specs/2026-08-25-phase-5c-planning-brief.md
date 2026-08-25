# Phase 5C planning brief — commerce administration

## Objective

Produce a current-state executable plan for Phase 5C on `phase/05-admin-demo`. Phase 5C completes protected administration for orders, customers, roles, and coupons while preserving Phase 4 payment, inventory, snapshot, and review invariants. This is planning only: no 5C implementation begins until the reviewed plan is approved by the user.

## Repository state

- Production repository: `D:\Projects\evironn`.
- Branch: `phase/05-admin-demo`.
- Delivery base and current `origin/dev`: `da5e87e`.
- Closed 5B implementation checkpoint: `f95f599`.
- Closed 5B documentation checkpoint before this preparation: `5be199a`.
- Phase 5A and 5B are complete and user-closed. Phase 5C and 5D are not implemented.
- Preserve the two protected untracked Phase 2 plan files recorded in `docs/roadmap/STATUS.md`.
- Do not fetch, switch, reset, rebase, clean, push, open a PR, merge, mutate the database, call providers, or start Phase 6 during planning.

## Read-only sources

- Technical source: `D:\Projects\fashion-shop`.
- Visual source: `D:\Новая папка (2)\evironn-clone`.
- The current Evironn implementation is the primary source of truth. Reuse proven fashion-shop code where compatible; use the clone only for approved presentation and interaction references.

## Binding scope

The reviewed plan must cover the master-plan tasks 5C.0–5C.7 without expanding the stream:

1. Lock the exhaustive, fail-closed admin order mutation policy.
2. Adapt order list reads, filters, labels, and bounded pagination.
3. Implement guarded forward status transitions using expected-status conditional writes.
4. Make admin cancellation transactional and idempotent, with exactly-once canonical and legacy inventory restoration plus sales-count adjustment.
5. Compose order detail from immutable snapshots and safe payment-state evidence.
6. Compose customer list/detail and reuse the existing role safeguards unchanged.
7. Compose coupon administration around the existing action and validation contract without inventing usage counters or relations.
8. Record the bounded 5C checkpoint and desktop/mobile acceptance state; exact cross-route clone parity remains deferred to 5D under ADR-022.

## Required source-parity matrix

Before task decomposition, classify each relevant surface as `reuse unchanged`, `adapt`, `port presentation`, or `retire with evidence`:

- order list/detail reads and pages;
- order transition/cancellation policy and actions;
- shared cancellation, stock restoration, sales-count, and review contracts;
- customer list/detail reads and pages;
- role action and safeguards;
- coupon actions, validation, status helpers, and pages;
- relevant admin shell/primitives and clone visual references.

The plan must prefer copying or adapting proven code from Evironn/fashion-shop over speculative rewrites.

## Non-negotiable contracts

- Every layout, read, action, and API boundary remains server-side ADMIN protected.
- Forward transitions are payment-agnostic and may not skip the legal pipeline.
- Admin cancellation is provider-free and fail-closed. It must not write payment fields, dispatch evidence, order-item snapshots, or reviews.
- Stock restoration and `Product.salesCount` adjustment occur exactly once in the same successful serializable transaction as the conditional cancellation update.
- Canonical `skuId` and legacy `productVariantId` order lines remain supported. The temporary legacy-write exemption moves to the single named restoration helper in 5C.3 and nowhere else.
- Order/customer history renders stored snapshots rather than live mutable product data.
- Existing role whitelist, self-demotion refusal, last-admin refusal, and guarded update remain intact.
- Coupon behavior remains backed by existing `Coupon`, `lib/coupon.ts`, and `lib/coupon-status.ts`; no usage model exists and none may be invented.
- The accepted Phase 5A shell remains stable through 5C. Exact Evironn visual parity is one consolidated 5D pass.
- No schema, provider, environment-contract, demo-admin, broad performance, or Phase 6 scope unless current repository evidence proves a blocking requirement and the user approves an architecture change.

## Planning and review workflow

- Root/coordinator: Luna High.
- Planner: one fresh isolated Sol Medium agent.
- Plan reviewer: one fresh isolated Sol Medium agent with the planning brief, proposed plan, compact evidence, and exact constraints.
- Use the normal/default service tier only; never fast, priority, accelerated, or high-speed.
- All visible agent messages use `caveman ultra`; the plan and durable reports use normal technical English.
- Claude Opus is not used unless the user explicitly invokes `$using-claude-opus-agent-workflow`.
- Resolve every Critical or Important plan finding, self-review task boundaries and executable commands, then stop for user approval. Do not start implementation in the planning session.

## Verification economy

- Planning performs read-only inspection only; no application test, full gate, build, E2E, database, or provider call.
- The implementation plan assigns focused RED/GREEN checks to each task and uses `npm run typecheck` only for shared type/server-contract changes.
- Review occurs only at meaningful task or risk boundaries. Task reviewers reuse fresh focused evidence and do not repeat the full project gate.
- The complete Phase 5 format/gate/build/critical-E2E gate remains a single 5D closeout action.
- The 5C plan must be proportional to a portfolio project and must not add redundant test layers beyond the master-plan invariants.

## Required output

Write the reviewed executable plan to:

`docs/superpowers/plans/2026-08-25-phase-5c-commerce-admin.md`

The plan must contain exact task boundaries, owned files, interfaces, RED/GREEN commands, commit messages, review ranges, checkpoints, source-parity decisions, and explicit non-goals. It must contain no placeholders. After root review, stop and report the plan path, task count, review verdict, main risks, and any decisions requiring user approval.

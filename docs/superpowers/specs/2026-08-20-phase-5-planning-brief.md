# Phase 5 admin and demo-admin planning brief

## Goal

Prepare one executable Phase 5 plan that adapts the existing production admin foundation to the canonical Evironn furniture domain, ports the Evironn admin visual language, and delivers a public synthetic read-only demo admin without rewriting proven platform code.

## Existing-state rule

Phase 5 is not a greenfield admin build.

- `D:\Projects\evironn` already contains inherited admin routes, actions, DTOs, analytics, UI primitives, skeletons, media helpers, Cloudinary routes, demo fixtures, and focused tests.
- `D:\Projects\fashion-shop` is the read-only technical reference for proven ADMIN authorization, CRUD, pagination, analytics, Cloudinary, order/customer/coupon, and demo-isolation behavior.
- `D:\Новая папка (2)\evironn-clone\src\admin` is the read-only visual reference. Its `AdminShell`, `AdminPrimitives`, CSS, state, and sample data define presentation and interaction language, not production data access.

The planner must inspect actual code before proposing work. Copy or retain proven code where compatible. Reimplement only a demonstrated incompatibility with the furniture schema, Evironn UI, security boundary, or read-only demo contract.

## Required parity matrix

Before task decomposition, list every Phase 5 route/module under one of four dispositions:

1. Reuse unchanged from current Evironn.
2. Adapt from existing Evironn/fashion-shop to canonical furniture data.
3. Port presentation from the clone while retaining production DTO/action boundaries.
4. Retire only with explicit evidence that the route/module is obsolete.

The matrix must cover dashboard, categories, products, option groups/values, SKU matrix, stock, media/360, orders, customers, roles, coupons, Cloudinary routes, shared admin shell, and every demo-admin route.

## Binding functional scope

### 5A — access and shell

- Enforce ADMIN authorization in the admin layout and every admin read/action/API boundary.
- Preserve Auth.js ownership and role semantics from the current application.
- Port/adapt the clone admin shell and primitives into the Next.js App Router without mock runtime state.
- Establish dashboard DTOs and furniture/order KPIs using bounded server queries.

### 5B — furniture catalog operations

- Categories and rooms.
- Products and their canonical furniture fields.
- Option groups and values.
- Deterministic option matrix and sellable SKU combinations.
- Article number, price, old price, active state, and stock.
- Product/SKU media and the one-turntable-product-per-category contract.
- Safe create/edit behavior that preserves immutable order snapshots and does not corrupt existing cart/wishlist/order references.

### 5C — commerce operations

- Orders and allowed status transitions without bypassing Phase 4 payment/stock invariants.
- Customer views and ADMIN/CUSTOMER role management with self-demotion/last-admin safeguards where applicable.
- Coupon CRUD using existing server-owned validation and totals semantics.
- Dashboard, filters, pagination, loading, empty, and error states.

### 5D — demo admin and closeout

- `/demo-admin` is public and read-only.
- Demo data is synthetic and deterministic.
- Demo routes never import Prisma, call production actions, expose mutation forms, or use ADMIN-only APIs.
- Demonstrate representative dashboard, catalog, orders, customers, and marketing views.
- Finish responsive desktop/mobile visual acceptance and Phase 5 integration evidence.

## Security boundaries

- Never rely on hidden navigation as authorization.
- Server actions and admin API routes independently enforce ADMIN.
- Validate all mutation input server-side.
- Preserve transactional behavior and Phase 4 payment/stock invariants.
- Cloudinary signing/deletion requires ADMIN and an Evironn-owned folder allowlist; reject foreign public IDs/folders.
- Do not print or persist environment values. Check only presence of `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` before media smoke.
- Never add Prisma access or mutation endpoints to demo-admin.

## Planning and session boundaries

Produce one master implementation plan for branch `phase/05-admin-demo`, organized into deliveries 5A–5D. Each delivery may run in a separate Codex session and must leave an exact handoff. There is one final PR into `dev`; internal deliveries do not merge separately.

Each task must own a bounded set of files and produce an independently reviewable result. Avoid tasks that mix unrelated catalog, order, customer, and demo behavior.

The plan must include an explicit manual/Preview acceptance checklist before completion, not only unit/source-contract tests. At minimum cover:

- ADMIN allowed and CUSTOMER/anonymous denied;
- category/product/options/SKU/stock CRUD;
- 360/media allowlist and failure fallback;
- order status mutation preserving payment/stock rules;
- customer role safeguards;
- coupon CRUD;
- demo-admin public access and absence of mutations/Prisma;
- desktop/mobile navigation, loading, empty, validation, and error states.

## Verification economy

- During tasks run only focused changed-module tests, touched-file formatting/lint, and typecheck when shared types/schema/server contracts change.
- Reviewers reuse fresh focused evidence and do not run the full project gate.
- After all tasks and final remediation, run exactly one completion gate: format, gate, build, and critical Phase 5 E2E.
- A required GitHub check marked `skipped` is not acceptable evidence.

## Git and delivery constraints

- Exact base: `da5e87e`.
- Branch: `phase/05-admin-demo`.
- Preserve the two protected untracked Phase 2 plan files listed in `STATUS.md`.
- English conventional commits with the configured user identity and no AI/bot/co-author trailers.
- No push until explicitly authorized for Preview.
- Before PR/merge, verify and show `base: dev`, `compare: phase/05-admin-demo`, required checks, and the target branch.
- No Phase 6 work.

## Planner output

Save the executable plan as:

`docs/superpowers/plans/2026-08-20-phase-5-admin-demo.md`

The plan must include exact files, interfaces between tasks, focused RED/GREEN commands, task commit subjects, review ranges, handoff updates, visual checkpoints, environment presence checks, and the final completion commands. It must contain no placeholders or speculative rewrites of existing production modules.

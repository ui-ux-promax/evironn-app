# Phase 5 Admin Demo Plan

## Parity matrix

| Area                                                                                      | Current Evironn                                                                                                                                                                                                                                                           | Technical source                                                                                                                                                             | Visual source                                                                                                                                      | Disposition       | Evidence                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin route protection (layout and page boundaries)                                       | `app/(admin)/layout.tsx` and every protected page call `requireAdminPage()` before privileged reads; `lib/admin/require-admin.ts` exposes `requireAdminPage`/`requireAdminAction`/`requireAdminApi`.                                                                      | fashion-shop admin layout and admin guard module (same three-boundary model; authorization reference only).                                                                  | None. Clone `src/admin` has no auth boundary.                                                                                                      | reuse             | `requireAdminPage()` redirects anonymous to `/login?callbackUrl=/admin` and non-admin to `/`; actions/API handlers retain independent guards. A static contract scans every discovered admin page/layout, action and API boundary, including guard-before-Prisma ordering.                                                                                  |
| Shared admin shell layout and navigation                                                  | `components/admin/admin-shell.tsx`, `components/admin/admin-mobile-menu.tsx`, `components/admin/admin-tab-bar.tsx`, `lib/admin/nav.ts`.                                                                                                                                   | fashion-shop admin shell/nav modules (Next/Auth.js session wiring, sign-out, responsive menu).                                                                               | clone `src/admin/AdminShell.tsx` + `src/admin/AdminShell.css` (rail, bento grid, breakpoints, density).                                            | adapt             | Bundle: current shell is Next/Auth.js-aware with mobile menu, tab bar and loading gates, but nav has no option-group/stock entries and branding is Ritm. Adapt structure and nav data while retaining session and guard boundaries.                                                                                                                         |
| Admin visual system (panels, headers, KPI/chart/table/pager/status primitives, skeletons) | `components/admin/admin-page-header.tsx`, `components/admin/admin-panel.tsx`, `components/admin/ui/*`, `components/admin/skeleton/*`, `components/admin/media/*`.                                                                                                         | fashion-shop admin UI/skeleton modules (component API shape and loading-state coverage).                                                                                     | clone `src/admin/AdminPrimitives.tsx` + `src/admin/AdminPrimitives.css` (head/panel/KPI/chart/donut/status/filter/table/button/pager/toast/error). | port-presentation | Bundle: existing primitives already cover the required component set; only the visual language (spacing, density, focus states, status colour vocabulary) differs from the clone. Behaviour and props stay; presentation is ported.                                                                                                                         |
| Ritm brand assets and copy inside the protected shell                                     | `/ritm-logo.svg`, `/ritm-logo-light.svg` references in `components/admin/admin-shell.tsx`; inherited Ritm dashboard copy.                                                                                                                                                 | None. Fashion-shop is the origin of the Ritm-shaped branding and must not be re-copied.                                                                                      | reuse existing `/assets/evironn-logo.svg`; clone shell typography is transcribed into existing admin styling.                                      | retire            | Presentation-only Ritm references are removed from owned admin/demo consumers. Production mark already exists at `public/assets/evironn-logo.svg`; no clone asset port is needed.                                                                                                                                                                           |
| Dashboard analytics queries and projections                                               | `lib/admin/analytics.ts`, `lib/admin/analytics-config.ts`, `app/(admin)/admin/page.tsx`, `app/(admin)/admin/_components/*`.                                                                                                                                               | fashion-shop dashboard analytics module (bounded query patterns, KPI series shape, low-stock and recent-order projections).                                                  | clone `src/admin/AdminShell.tsx` dashboard composition plus KPI/chart/donut primitives in `AdminPrimitives.tsx`.                                   | adapt             | Bundle: analytics already provides bounded Prisma KPI series, status split, best sellers, low stock, recent orders and pending-payment count, but low stock is computed from legacy `ProductVariant.stock` and there are no furniture KPIs (SKU, category/room, 360 coverage). Query authority stays in `lib/admin/analytics.ts`; projections are extended. |
| Categories administration                                                                 | `app/(admin)/admin/catalog/categories` list/new/[id]/edit; `app/actions/admin/categories.ts`.                                                                                                                                                                             | fashion-shop category action (CRUD, sort movement transaction, occupied-category delete guard, Cloudinary cleanup).                                                          | clone `AdminPrimitives.tsx` table/filter/panel primitives; clone has no catalog screen, so only primitives are authoritative.                      | adapt             | Bundle: current pages/action already use canonical `Category` fields (`name`, `slug`, `tagline`, cover, `sortOrder`, product count) with reorder transaction and delete guard. Adaptation is limited to Evironn copy, presentation and the new turntable binding control.                                                                                   |
| Rooms and product-room assignment                                                         | `Room` and `ProductRoom` exist in `prisma/schema.prisma`; read-side usage in `lib/find-products.ts` and catalog adapters; no write path.                                                                                                                                  | None. Fashion-shop has no room concept; only multi-select form patterns are reusable.                                                                                        | clone `AdminPrimitives.tsx` filter/table primitives.                                                                                               | adapt             | Phase 5 adds full Room CRUD (`name`, unique `slug`, `sortOrder`, reorder and `ROOM_HAS_PRODUCTS` delete refusal) plus `(productId, roomId)` assignment in the canonical product form.                                                                                                                                                                       |
| Products list and read layer                                                              | `app/(admin)/admin/catalog/products/page.tsx` list query, filters, stock aggregate; edit loader in `[id]/edit`.                                                                                                                                                           | fashion-shop product list page (pagination, filter parsing, aggregate columns).                                                                                              | clone `AdminPrimitives.tsx` table/filter/pager primitives.                                                                                         | adapt             | Bundle gap 1: the list query, filters, stock aggregate and edit loader read `ProductColorway`/`ProductImage`/`ProductVariant`. Canonical reads must come from `Product.skus`/`ProductMedia`; the page shape, pagination and filter contract are retained.                                                                                                   |
| Product create/update/delete action                                                       | `app/actions/admin/products.ts` (nested legacy colorway/image/variant CRUD, order-reference guard, best-effort Cloudinary deletion).                                                                                                                                      | fashion-shop product action (guard-first ordering, transaction structure, reference guard, Cloudinary cleanup sequencing) — technical shape only, its domain is also legacy. | None (server module).                                                                                                                              | adapt             | Bundle gap 2: `furnitureProductSchema`/`FurnitureProductValues` exist and are unit-tested but unused by admin, which still imports `productSchema`. The proven action boundary (guard, parse, transaction, revalidate, reference guard) is adapted onto the canonical furniture DTO.                                                                        |
| Legacy colorway/image/variant admin write path                                            | Nested `ProductColorway`/`ProductImage`/`ProductVariant` create/update/delete branches in `app/actions/admin/products.ts` and the legacy nested media UI.                                                                                                                 | fashion-shop product action (the origin of this shape; explicitly not the canonical target).                                                                                 | None.                                                                                                                                              | retire            | Bundle: schema documents these three models as a legacy clothing-shaped compatibility adapter and states they are not the Phase 5 canonical target. Admin writes are retired; read compatibility for historical rows is preserved and proven by a focused test before removal.                                                                              |
| Legacy variant matrix generator and legacy admin DTO usage                                | legacy `variant-matrix.tsx` size/colour SKU generation and `productSchema`/`ProductValues` imports in `services/dto/product.dto.ts` consumers.                                                                                                                            | fashion-shop variant matrix and product DTO (fashion colourway semantics; explicitly not to be carried into furniture).                                                      | clone `AdminPrimitives.tsx` table primitives for replacement matrix presentation.                                                                  | retire            | Canonical contract is `furnitureProductSchema`, `Sku.combinationKey`, unique `articleNumber`, one selection per option group and exact `buildCombinationKey`; legacy generator is retired in favour of canonical matrix.                                                                                                                                    |
| Option groups and option values administration                                            | No admin route or action. `OptionGroup`, `OptionValue`, `ProductOptionGroup`, `ProductOptionValue` exist in schema; validation rules exist in `services/dto/product.dto.ts` and `lib/furniture-sku.ts`.                                                                   | fashion-shop category/product action patterns (slug uniqueness handling, sort ordering, reference-guarded delete) — pattern reuse only, no fashion colourway semantics.      | clone `AdminPrimitives.tsx` panel/table/filter/button primitives; clone has no catalog implementation.                                             | adapt             | Bundle gap 3: no option-group/value administration exists. Phase 5 adds routes and an action bound to canonical models and reuses unique-slug and selection-completeness rules.                                                                                                                                                                             |
| SKU matrix (combination, article number, price, old price, active)                        | Legacy `variant-matrix.tsx` plus legacy DTO path; no canonical SKU matrix UI.                                                                                                                                                                                             | fashion-shop variant matrix interaction model (bulk row editing, generation from selected axes, per-row validation surfacing).                                               | clone `AdminPrimitives.tsx` compact dense table, status chips and inline field styling.                                                            | adapt             | Bundle: `Sku` has unique `articleNumber`, unique `(productId, combinationKey)`, `price`, nullable `oldPrice`, `stock`, active state and `SkuOptionValue` selections; `furnitureProductSchema` rejects duplicate articles/combinations and incomplete selections. The interaction shape is adapted onto these canonical invariants.                          |
| Stock administration                                                                      | Products page aggregates `ProductVariant.stock`; no canonical stock write path. Canonical stock lives on `Sku.stock`.                                                                                                                                                     | fashion-shop stock column and variant stock editing; `changeUserRole` guarded one-shot update pattern in this repository is the closer precedent.                            | clone `AdminPrimitives.tsx` table, status and filter primitives.                                                                                   | adapt             | Bundle: stock edits must preserve order reservations, cart references, cancellation/restoration and immutable historical order snapshots. Phase 5 adapts stock administration to a guarded conditional update on `Sku.stock` instead of a blind write.                                                                                                      |
| Product and SKU media management                                                          | `components/admin/media/*` uploader, `lib/cloudinary/admin-media.ts`, nested legacy colorway image UI.                                                                                                                                                                    | fashion-shop media uploader and Cloudinary helper wiring (signed upload flow, fresh-versus-persisted asset diffing, removal bookkeeping).                                    | clone `AdminPrimitives.tsx` panel/button/toast/error primitives.                                                                                   | adapt             | Bundle: the uploader and signed routes are reusable infrastructure, but persistence must move to `ProductMedia`/`SkuMedia` with kind, public ID, order and alt text plus exact ownership checks. Infrastructure is retained; persistence and ownership are adapted.                                                                                         |
| 360 turntable media and category binding                                                  | No admin exposure. `Category.turntableProductId` is unique; `ProductMediaKind` has `TURN_TABLE_VIDEO`, `TURN_TABLE_POSTER`, `TURN_TABLE_FALLBACK`; `furnitureProductSchema` already validates cardinality.                                                                | None. Fashion-shop has no turntable concept; only its Cloudinary upload/validation flow applies.                                                                             | clone `AdminPrimitives.tsx` panel/status primitives for coverage state display.                                                                    | adapt             | Bundle gap 3: category turntable binding is not exposed although schema and DTO already encode the rules (one of each kind when enabled, rejection otherwise, unique binding per category). Phase 5 adapts admin surfaces to those existing constraints.                                                                                                    |
| Cloudinary signing API route                                                              | `app/api/admin/media/sign/route.ts` with `requireAdminApi()` and folder validation limited to `ritm/uploads`, `ritm/categories`, `ritm/products`.                                                                                                                         | fashion-shop signing route (guard-first ordering, signature payload construction, error envelope).                                                                           | None.                                                                                                                                              | adapt             | Bundle gap 5: the route already requires ADMIN and validates input, but its allowlist is not Evironn-owned. Phase 5 adapts the allowlist source to a shared Evironn folder constant while keeping guard and signing behaviour.                                                                                                                              |
| Cloudinary delete API route                                                               | `app/api/admin/media/delete/route.ts` validates only a non-empty `publicId`.                                                                                                                                                                                              | fashion-shop delete route and idempotent delete semantics.                                                                                                                   | None.                                                                                                                                              | adapt             | Bundle gap 5: the delete route accepts any non-empty public ID, so a foreign asset can be deleted by an ADMIN request. Phase 5 adapts it to require an Evironn-owned public ID or a database-referenced asset.                                                                                                                                              |
| `ritm/*` folder allowlist and tests asserting `ritm/products/*`                           | Folder constants in the sign route and expectations inside existing Cloudinary tests.                                                                                                                                                                                     | fashion-shop folder naming (origin of `ritm/*`).                                                                                                                             | None.                                                                                                                                              | retire            | Bundle gap 5: `ritm/*` is inherited naming that does not prove Evironn ownership, and existing tests hard-code `ritm/products/*`. The prefix and its assertions are retired together with a documented migration decision for already-persisted assets.                                                                                                     |
| Cloudinary helper libraries                                                               | `lib/cloudinary/{config,server,sign,url,validate,admin-media}.ts` with presence-only env checks at call time and idempotent delete handling.                                                                                                                              | fashion-shop Cloudinary helpers (same module set).                                                                                                                           | None.                                                                                                                                              | reuse             | Bundle: config checks presence of the three env names at call time, server treats `ok`/`not found` as idempotent success, and signing/URL/validation are already covered by focused tests. No behavioural gap was found, so helpers are reused and only the new folder module is added beside them.                                                         |
| Orders list and detail read layer                                                         | `app/(admin)/admin/orders/page.tsx`, `[id]/page.tsx`, `lib/order-admin.ts`, `lib/admin/pagination.ts`.                                                                                                                                                                    | fashion-shop order pages (filter/pagination/detail composition, status labelling).                                                                                           | clone `src/admin/AdminShell.tsx` orders composition and `adminState.ts` status/payment label vocabulary (presentation only).                       | adapt             | Bundle: pages, DTO and filtering are reusable, but detail must render canonical `Sku` snapshot fields and Phase 4 payment state, and copy/presentation must match Evironn. Reads are adapted, not rewritten.                                                                                                                                                |
| Order status transition and admin cancellation actions                                    | `app/actions/admin/orders.ts` with forward transition guarded by current status, then best-effort provider/stock/sales/review side effects; `lib/order-admin.ts` pipeline `PENDING -> PROCESSING -> SHIPPED -> DELIVERED`, cancellation only from `PENDING`/`PROCESSING`. | fashion-shop order action (transition guard and side-effect ordering) — reference only; it does not carry Phase 4 payment-claim semantics.                                   | clone `useAdmin.ts` mock transitions (interaction affordances only; must not be imported).                                                         | adapt             | Bundle gap 4: status is updated first and stock/provider work runs best-effort, supporting both `skuId` and legacy `productVariantId`. Phase 5 adapts the mutation to ADR-017/018 payment states and exactly-once transactional stock restoration without redesigning the provider.                                                                         |
| Customers list and detail                                                                 | `app/(admin)/admin/customers/page.tsx`, `[id]/page.tsx`, `lib/customer-admin.ts`.                                                                                                                                                                                         | fashion-shop customer pages and helper (aggregation, order history panel, pagination).                                                                                       | clone `AdminPrimitives.tsx` table/panel/status primitives; clone has no customer screen.                                                           | adapt             | Bundle: `lib/customer-admin.ts` already provides the read contract and existing pages work; adaptation is limited to Evironn presentation, empty/error states and canonical order-line labels.                                                                                                                                                              |
| Roles (ADMIN/CUSTOMER)                                                                    | Prisma `UserRole` with JWT/session backing; `changeUserRole` in `app/actions/admin/customers.ts` enforcing role whitelist, self-demotion block, last-admin block and guarded one-shot update.                                                                             | fashion-shop role action (same safeguards).                                                                                                                                  | None; clone has no role surface.                                                                                                                   | reuse             | Bundle: the role contract and all three safeguards already exist and are session-backed, and no separate role route exists. Behaviour is reused unchanged; only the calling control in the customer detail page is re-presented.                                                                                                                            |
| Coupon server action and validation                                                       | `app/actions/admin/coupons.ts` (CRUD/toggle/delete), `lib/coupon.ts`, `lib/coupon-status.ts`.                                                                                                                                                                             | fashion-shop coupon action — byte-identical to current Evironn action per bundle.                                                                                            | clone `adminState.ts` promocode vocabulary is reference-only.                                                                                      | reuse             | Bundle: action is byte-identical to proven fashion reference, `Coupon` is stateless with no usage relation, and server validation/status are covered by focused tests. No usage relation is invented.                                                                                                                                                       |
| Coupon pages and copy                                                                     | `app/(admin)/admin/marketing` list/new/[id]/edit.                                                                                                                                                                                                                         | fashion-shop marketing pages (form layout, toggle affordance, list columns).                                                                                                 | clone `AdminPrimitives.tsx` panel/table/status/button primitives.                                                                                  | adapt             | Bundle: coupon behaviour is reused unchanged, so only presentation, Evironn copy and loading/empty/error/validation states are adapted at the page level.                                                                                                                                                                                                   |
| Shared admin support helpers (pagination, API error envelope, readiness gates)            | `lib/admin/pagination.ts`, `lib/admin/api-error.ts`, `components/admin/admin-ready.ts`, `components/admin/content-ready-gate.tsx`.                                                                                                                                        | fashion-shop equivalents (same helper set).                                                                                                                                  | clone loading/error primitives inform only the visual treatment of gated content.                                                                  | reuse             | Bundle: these helpers are already used consistently by existing admin routes and APIs, and no defect or missing capability was recorded. They are reused as-is by every new route to avoid parallel implementations.                                                                                                                                        |
| Demo-admin shell and layout                                                               | `app/(demo-admin)/demo-admin/layout.tsx`, `components/demo-admin/demo-admin-shell.tsx`, `demo-readonly-banner.tsx`, `lib/demo-admin/nav.ts`.                                                                                                                              | fashion-shop demo shell (read-only banner, nav shape, isolation posture).                                                                                                    | clone `src/admin/AdminShell.tsx`/`AdminShell.css` rail and bento layout.                                                                           | port-presentation | Bundle: the demo shell already satisfies the read-only, Prisma-free and Auth-free contract enforced by `tests/demo-admin-isolation.test.ts`; only the visual language needs to match the ported protected shell.                                                                                                                                            |
| `/demo-admin` (synthetic dashboard route)                                                 | `app/(demo-admin)/demo-admin/page.tsx` with `demo-kpi-grid.tsx` and demo-local chart/donut/status replacements.                                                                                                                                                           | fashion-shop demo dashboard composition.                                                                                                                                     | clone `src/admin/AdminShell.tsx` dashboard bento and `adminData.ts` deterministic synthetic series (structure only).                               | adapt             | Bundle gap 9: fixtures are deterministic and isolated, but the current dashboard imports admin chart primitives. 5D.2–5D.3 transcribe every required visual import into demo-local chart/donut/status files; KPIs adapt to furniture terms (SKU, category/room, 360 coverage) with the isolation scan kept green.                                           |
| `/demo-admin/catalog`                                                                     | `app/(demo-admin)/demo-admin/catalog/page.tsx` with `demo-data-table.tsx` and generic product rows.                                                                                                                                                                       | fashion-shop demo catalog page.                                                                                                                                              | clone `AdminPrimitives.tsx` table/filter/status primitives.                                                                                        | adapt             | Bundle: the route and render contract already exist; Phase 5 adapts rows to furniture product/option/SKU/article/media/360 vocabulary as static fixtures, with no Prisma, action, API or mutation form.                                                                                                                                                     |
| `/demo-admin/orders`                                                                      | `app/(demo-admin)/demo-admin/orders/page.tsx` over `lib/demo-admin/fixtures.ts`.                                                                                                                                                                                          | fashion-shop demo orders page.                                                                                                                                               | clone `src/admin/AdminShell.tsx` orders composition and `adminState.ts` status/payment label vocabulary.                                           | adapt             | Bundle: existing route/render/fixture contracts hold; adaptation adds canonical SKU/article order lines and Evironn status labels while remaining read-only and provider-free.                                                                                                                                                                              |
| `/demo-admin/customers`                                                                   | `app/(demo-admin)/demo-admin/customers/page.tsx` over deterministic fixtures.                                                                                                                                                                                             | fashion-shop demo customers page.                                                                                                                                            | clone `AdminPrimitives.tsx` table/panel primitives (clone has no customer screen).                                                                 | adapt             | Bundle: route exists with deterministic fixtures and no Auth.js usage; only furniture-flavoured synthetic content and ported visual language change.                                                                                                                                                                                                        |
| `/demo-admin/marketing`                                                                   | `app/(demo-admin)/demo-admin/marketing/page.tsx` over coupon-shaped fixtures.                                                                                                                                                                                             | fashion-shop demo marketing page.                                                                                                                                            | clone `AdminPrimitives.tsx` status/table primitives (clone has no promocode screen).                                                               | adapt             | Bundle: coupon fixture shape matches stateless `Coupon` with no usage relation; adaptation is copy/presentation only, and no synthetic usage counters are invented.                                                                                                                                                                                         |
| Demo fixtures, types and nav data                                                         | `lib/demo-admin/fixtures.ts`, `lib/demo-admin/types.ts`, `lib/demo-admin/nav.ts`; contract test `tests/demo-admin-fixtures.test.ts`.                                                                                                                                      | fashion-shop demo fixtures/types (deterministic dataset shape).                                                                                                              | clone `src/admin/adminData.ts` deterministic synthetic orders/customers/catalog lines (structure as reference, not imported).                      | adapt             | Bundle: fixtures are already deterministic and covered by a contract test, but types are generic. Phase 5 extends types and datasets with furniture entities while keeping determinism (no clock or randomness).                                                                                                                                            |
| Demo isolation, route-contract and render-contract tests                                  | `tests/demo-admin-isolation.test.ts`, `tests/demo-admin-route-contract.test.ts`, `tests/demo-admin-render-contract.test.ts`, `tests/demo-admin-fixtures.test.ts`.                                                                                                         | fashion-shop demo isolation test (scan strategy for forbidden imports).                                                                                                      | None.                                                                                                                                              | adapt             | Bundle: the scan already rejects Prisma, Auth.js, admin action/API, payment and provider imports and route existence/non-indexability is covered. Phase 5 extends the scan to the new demo files, forbids `use server` and form actions, and keeps every assertion non-skipped.                                                                             |
| Clone prototype state modules as production code                                          | Not present in the production repository.                                                                                                                                                                                                                                 | None.                                                                                                                                                                        | clone `src/admin/useAdmin.ts`, `src/admin/adminState.ts`, `src/admin/adminData.ts`.                                                                | retire            | Bundle gap 7: `useAdmin.ts` mutates in-memory synthetic orders and clone implements only `/admin` and `/admin/orders`; catalog/customers/promocodes are visual references only. These modules are excluded from production and demo bundles; only CSS, structure and label vocabulary are ported.                                                           |

## Plan

# Phase 5 — Admin and synthetic demo-admin (executable plan)

- Repository: `D:\Projects\evironn`
- Branch: `phase/05-admin-demo` (single branch for the whole phase)
- Exact delivery base: `da5e87e`
- Preparation HEAD at plan time: `0b9d4c8`
- Pull request: exactly one PR, `phase/05-admin-demo` → `dev`, opened only after the closeout gate in §7 passes
- Evidence basis: `.superpowers/sdd/phase-5-planner-evidence.md`, `docs/superpowers/specs/2026-08-20-phase-5-planning-brief.md`, `.superpowers/sdd/phase-5-handoff.md`, `docs/roadmap/{ROADMAP,STATUS,DECISIONS}.md`
- Sources: production foundation in this repository is authoritative; `D:\Projects\fashion-shop` is a read-only technical reference; `D:\Новая папка (2)\evironn-clone\src\admin` is a read-only visual reference

> **2026-08-25 sequencing amendment (ADR-022):** the user accepted the current 5A dashboard and deferred further cross-route visual work until the admin is functionally complete. Streams 5B and 5C keep the accepted shell stable and prioritize reusable server/data/form boundaries. Stream 5D performs one consolidated exact Evironn visual-parity pass across the completed protected and demo routes before final desktop/mobile acceptance. This amendment supersedes intermediate route-by-route visual-polish requirements but does not relax functionality, authorization, validation, isolation, accessibility, responsive usability, or the final visual acceptance gate.

> **Bounded stream planning:** before implementation of each remaining stream, the coordinator converts this approved master plan into a current-state executable stream plan using one fresh isolated Sol Medium planner and one fresh isolated Sol Medium plan reviewer. The stream plan may refine task boundaries and exact files from current repository evidence but may not expand Phase 5 scope or contradict the master contracts. Implementation waits for user approval of the reviewed stream plan. Claude Opus replaces these roles only when the user explicitly invokes `$using-claude-opus-agent-workflow`.

## 0. Delivery frame

### 0.1 Scope

In scope: protected ADMIN shell, navigation, dashboard, canonical furniture catalog administration (categories, rooms assignment, products, option groups/values, SKU matrix, stock, product/SKU media, 360 turntable), commerce operations (orders, customers, roles, coupons), Cloudinary admin routes with an Evironn folder allowlist, the public synthetic read-only demo-admin, and phase closeout.

Out of scope (no Phase 6 work): refunds, payment provider redesign, outbox/retry infrastructure, webhook reprocessing tooling, bulk import/export, role model beyond `ADMIN`/`CUSTOMER`, analytics warehousing, notification systems, storefront redesign, schema migrations that are not required by a task in this plan.

### 0.2 Non-negotiable constraints

1. **Three server-side ADMIN boundaries.** Every protected surface enforces its own check: `requireAdminPage()` in `app/(admin)/layout.tsx` and as the first statement of every `app/(admin)/**/page.tsx`, `requireAdminAction()` as the first statement of every exported server action in `app/actions/admin/*`, and `requireAdminApi()` as the first statement of every handler in `app/api/admin/**/route.ts`. No guard may be replaced by client state, hidden navigation, or middleware alone. Guard calls precede any Prisma access in source order.
2. **Server-side validation.** Every write parses untrusted input with a zod schema in `services/dto/*` before Prisma access. `furnitureProductSchema` is the canonical product boundary. Client validation is additive only.
3. **Cloudinary ownership.** Signing and deletion require ADMIN plus an Evironn-owned folder/public-ID allowlist. Foreign public IDs and folders are rejected with a typed error. Env variables are checked for presence only; values never appear in logs, tests, reports, or agent messages.
4. **Phase 4 invariants.** Payment initialization state, claim timestamp, write-once dispatch evidence, return URL, payment relation, and immutable order-item SKU snapshot fields are governed by ADR-017/018. Admin mutations must not bypass `lib/order.ts`, `lib/order-admin.ts`, `lib/place-order.ts` and related checkout modules. Stock restoration is exactly once and transactional; order-item snapshots are never rewritten. A SKU referenced by any `OrderItem` or `CartItem` is deactivated, never deleted; cart rows and product-scoped wishlist rows remain intact. No admin action may call `cartItem.delete`, `cartItem.deleteMany`, or any wishlist delete delegate.
5. **Demo isolation.** Files under `app/(demo-admin)/**`, `components/demo-admin/**`, `lib/demo-admin/**` must not import Prisma, Auth.js, admin actions, admin APIs, payment/provider modules, or Cloudinary server modules; must not declare `use server`; must not render mutation forms or server actions. Data is deterministic (no `Date.now()`, no `Math.random()`, no locale-dependent formatting inputs).
6. **No speculative work.** No unfinished routes, dead exports, temporary markers, commented-out code, `any` escape hatches, or files unreachable from a route or test. Every new module has a consumer in the same commit.
7. **No parallel implementations.** Reuse existing helpers (`lib/admin/pagination.ts`, `lib/admin/api-error.ts`, `lib/admin/require-admin.ts`, `components/admin/ui/*`, `components/admin/skeleton/*`, `lib/cloudinary/*`). Reuse from fashion-shop is symbol/file level after contract inspection; no directory copying.
8. **Read-only references.** Never write to `D:\Projects\fashion-shop` or the clone directory. Never import from them at build time; port code by transcription into Evironn paths.
9. **Schema/config ownership.** Phase 5 makes no Prisma schema change; `prisma/schema.prisma` is read-only. If implementation proves a schema change necessary, stop and escalate to the coordinator with the affected task and invariant before editing. `constants/config.ts` is inventoried by 5A.4 and remains the single owner of `LOW_STOCK_THRESHOLD`.
10. **Visual sequencing.** During 5B and 5C, do not redesign the accepted shell or attempt isolated clone-parity rewrites for individual routes. New screens use the existing admin primitives and keep presentation separate from Prisma, actions, validation and DTOs. Exact protected/demo visual parity is a single 5D responsibility after all screens exist.

### 0.3 Ownership model

Streams run sequentially on the single branch because 5A, 5B, 5C and 5D all touch `lib/admin/*`, `components/admin/*` and the shared test directory: **5A → 5B → 5C → 5D**. One implementation agent owns one stream end to end; within a stream, tasks execute strictly in the order given by `Depends on`. The external review agent reviews each stream boundary using the stream review range. The coordinator owns handoff checkpoints and the closeout gate.

| Stream | Owner label | Boundary                                                                                  |
| ------ | ----------- | ----------------------------------------------------------------------------------------- |
| 5A     | `impl-5A`   | Guards, shared shell, navigation, visual system, dashboard                                |
| 5B     | `impl-5B`   | Categories, rooms, products, options, SKU matrix, stock, media, 360, Cloudinary allowlist |
| 5C     | `impl-5C`   | Orders, customers, roles, coupons                                                         |
| 5D     | `impl-5D`   | Demo-admin, consolidated protected/demo visual parity, final acceptance, closeout         |

Owned legacy-hit cleanup is staged by file so the final scan needs no cross-stream edits:

| File                                                                 | Owner task | Required disposition                                                   |
| -------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `components/admin/admin-shell.tsx`                                   | 5A.2       | Remove Ritm logo references and copy; use `/assets/evironn-logo.svg`.  |
| `app/(admin)/admin/page.tsx`                                         | 5A.5       | Remove Ritm dashboard copy.                                            |
| `components/admin/skeleton/index.ts`                                 | 5A.3       | Remove Ritm-only labels or fixture text.                               |
| `app/api/admin/media/sign/route.ts`                                  | 5B.2       | Replace literal folders with `EVIRONN_MEDIA_FOLDERS`.                  |
| `app/api/admin/media/delete/route.ts`                                | 5B.2       | Retain only documented database-referenced legacy-ID branch.           |
| `lib/cloudinary/folders.ts`                                          | 5B.2       | Retain the single `LEGACY_MEDIA_PREFIX = 'ritm/'` declaration.         |
| `components/admin/media/image-uploader.tsx`                          | 5B.2       | Replace legacy uploader defaults with shared Evironn folders.          |
| `components/admin/media/uploader-demo.tsx`                           | 5B.2       | Remove legacy demo defaults.                                           |
| `app/(admin)/admin/catalog/categories/_components/category-form.tsx` | 5B.2       | Use `EVIRONN_MEDIA_FOLDERS` value `evironn/categories`.                |
| `app/(admin)/admin/catalog/products/_components/colorway-card.tsx`   | 5B.10      | Retire legacy nested media UI after importer/read-compatibility audit. |
| `app/(admin)/admin/marketing/_components/coupon-form.tsx`            | 5C.6       | Remove inherited Ritm copy.                                            |
| `lib/demo-admin/fixtures.ts`                                         | 5D.1       | Replace inherited vocabulary with furniture fixtures.                  |
| `app/(demo-admin)/demo-admin/page.tsx`                               | 5D.3       | Replace inherited dashboard copy.                                      |
| `components/demo-admin/demo-admin-shell.tsx`                         | 5D.2       | Remove inherited branding/copy.                                        |
| `public/ritm-logo.svg`                                               | 5D.2       | Delete.                                                                |
| `public/ritm-logo-light.svg`                                         | 5D.2       | Delete.                                                                |

### 0.4 Command conventions

Package manager is npm; CI uses `npm ci` and `package-lock.json`. Exact scripts: `format` = `prettier --write .`, `lint` = `prettier --check . && eslint .`, `typecheck` = `tsc --noEmit`, `test` = `vitest run`, `gate` = `npm run lint && npm run typecheck && npm run test`, `build` = `next build`, `e2e` = `playwright test`.

- Focused unit test form: `npm test -- tests/example.test.ts` with the task's explicit filename substituted.
- Focused E2E form: `npm run e2e -- e2e/example.spec.ts --grep "scenario title"` with the task's explicit filename and title substituted.
- Schema check: `npx prisma validate`.
- Skip audit: `git grep -nE "\.(skip|only|todo)\(" -- tests e2e`.

Do not invent `format:check`, `gate:phase5`, `e2e:phase5` or any other script; `package.json` scripts and CI definitions are never modified in Phase 5. Required GitHub check contexts are exactly `Quality / quality` (workflow `Quality`, job `quality`, pull requests, main push; checkout with LFS, Node 22/npm cache, `npm ci`, Prisma generate, typecheck, test, build) and `Deployment Smoke / smoke` (workflow `Deployment Smoke`, job `smoke`, deployment-status trigger; checkout, Node 22/npm cache, `npm ci`, completed-deployment check, `npm run smoke:production`). Neither workflow has `continue-on-error` or a skipping `if:`. CI does not run `npm run format`, `npm run gate` or Playwright, so §7 supplies them; a `skipped` required check is never success evidence (`docs/roadmap/STATUS.md`).

### 0.5 Verification economy

- RED first: add or extend the focused test, run only that file, and confirm it fails on the intended assertion (not on an import or setup error). Record the failing assertion text in the commit body.
- GREEN: implement the minimum, rerun the same focused file, then `npm run typecheck`.
- Do not run the full suite, build, or lint per task. They run once at the closeout gate (§7) and once more if the gate fails and is repaired.
- No watch mode, no `--passWithNoTests`, no `.skip`/`.only`/`.todo`, no `continue-on-error` in CI configuration.
- If a task's GREEN command touches a module covered by other existing focused tests, rerun exactly those files named in the task, nothing more.

### 0.6 Commit, review and checkpoint conventions

- One commit per task, subject exactly as given in the task. Body lists files, the RED assertion, and the GREEN result. Preserve configured Git identity (`user.name`/`user.email`); use English Conventional Commit subjects; add no AI, bot, or co-author trailers, including `Co-authored-by`.
- All ranges are PowerShell-quoted: the revision range is quoted and every pathspec containing parentheses is single-quoted, for example `git diff '$C5A1..$C5A2' -- 'lib/admin' 'components/admin' 'app/(admin)' 'public' 'tests'`. Never write unquoted `app/(admin)` or `app/(demo-admin)`.
- Delivery ranges are exactly `git diff --stat 'da5e87e..HEAD' -- 'app/(admin)' 'app/(demo-admin)' 'components/admin' 'components/demo-admin' 'lib/admin' 'lib/cloudinary' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests' 'e2e'`, `git diff 'da5e87e..HEAD' -- 'app/(admin)' 'app/(demo-admin)' 'components/admin' 'components/demo-admin' 'lib/admin' 'lib/cloudinary' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests' 'e2e'`, `git diff --name-only 'da5e87e..HEAD' -- 'app/(admin)' 'app/(demo-admin)' 'components/admin' 'components/demo-admin' 'lib/admin' 'lib/cloudinary' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests' 'e2e'`, and `git log --oneline 'da5e87e..HEAD'`.
- Durable handoff checkpoint: append to `.superpowers/sdd/phase-5-handoff.md` and summarize in `.superpowers/sdd/progress.md`, using this template:

```md
## Phase 5 checkpoint — task identifier and title

- Commit: recorded SHA and subject
- Files: owned paths
- RED: exact command — failing assertion
- GREEN: exact command — pass
- Invariants confirmed: guard/validation/Phase 4/demo isolation statements
- Decisions recorded: ADR or plan section
- Open items for next task: list or "none"
```

### 0.7 Test harness conventions

Vitest uses `node` and includes `tests/**/*.test.{ts,tsx}`; it never connects to a database. Every Prisma-backed test mocks `@/lib/prisma-client` at module scope with `vi.mock(...)`, declares the mock before importing the SUT, returns used delegates as `vi.fn()`, casts delegates to `Record<string, ReturnType<typeof vi.fn>>` (or a narrow equivalent), calls `vi.clearAllMocks()` in `beforeEach`, and sets per-test `mockResolvedValue`/`mockRejectedValue`. Auth, Next cache/headers/navigation, logger, Cloudinary, payment, review and sales side effects are mocked at module scope. Query modules accepting a client (`lib/admin/analytics.ts`, `lib/admin/catalog.ts`) receive the mocked Prisma object by dependency injection. Transaction tests use `$transaction.mockImplementation(async callback => callback(prisma))` and assert exact `{ isolationLevel: 'Serializable' }` where required; denied/unsafe branches assert zero writes. Source-contract/isolation tests use `readFileSync`, require a non-empty discovered set with explicit minimum, and demonstrate violation failure, repaired pass, and clean `git status --short` after revert. A scan that finds no candidates is vacuous. Render-contract tests do not render async route pages: they use `renderToStaticMarkup` from the already-installed `react-dom/server` against synchronous presentational components in `_components/*`, with data and action callbacks injected as props; async page shells use `readFileSync` source-contract assertions only. These tests do not stub or invoke `requireAdminPage()`, do not add a DOM environment, and do not add dependencies.

## 1. Decisions locked by this plan

These decisions resolve planner-level unknowns so tasks are executable. Each is recorded in `docs/roadmap/DECISIONS.md` in 5D.8 with the fixed ADR ids below.

- **D1 — Cloudinary folder allowlist.** Approved new-upload folders are exactly `evironn/uploads`, `evironn/categories`, `evironn/products`, `evironn/skus`, `evironn/turntable`. Single source `lib/cloudinary/folders.ts` exports `EVIRONN_MEDIA_FOLDERS`, `EvironnMediaFolder`, `isEvironnMediaFolder`, `isEvironnPublicId`, and one `LEGACY_MEDIA_PREFIX = 'ritm/'`. Signing and all uploader defaults reject legacy folders. An identifier already persisted on the edited database row is accepted unchanged only after exact row verification; only new or changed identifiers must satisfy `isEvironnPublicId`, and legacy identifiers are never re-signed or re-uploaded. Delete accepts a legacy `ritm/*` ID only after exact lookup in `Category.coverImagePublicId`, legacy `ProductImage.publicId` through `ProductColorway`, `ProductMedia.publicId`, or `SkuMedia.publicId`; all other IDs reject before Cloudinary.
- **D2 — Canonical furniture admin replaces legacy admin writes.** Admin writes target `Product`, `OptionGroup`, `OptionValue`, `ProductOptionGroup`, `ProductOptionValue`, `Sku`, `SkuOptionValue`, `ProductMedia`, `SkuMedia`. `ProductColorway`, `ProductImage`, `ProductVariant` remain readable for historical order/legacy compatibility, and 5B.10 proves no admin action writes them.
- **D3 — Route granularity.** Complete route set is `/admin`, retained redirect boundary `/admin/catalog` (redirect-only, no privileged read), `/admin/catalog/products` (+`/new`, `/[id]/edit`), `/admin/catalog/categories` (+`/new`, `/[id]/edit`), `/admin/catalog/options` (+`/new`, `/[id]/edit`), `/admin/catalog/rooms` (+`/new`, `/[id]/edit`), `/admin/catalog/stock`, `/admin/orders` (+`/[id]`), `/admin/customers` (+`/[id]`), `/admin/marketing` (+`/new`, `/[id]/edit`); no other page routes.
- **D4 — Turntable ownership.** 360 media (`TURN_TABLE_VIDEO`, `TURN_TABLE_POSTER`, `TURN_TABLE_FALLBACK`) is uploaded and validated on the product media section; the category edit form owns the unique `Category.turntableProductId` binding and surfaces a conflict error when the product is already bound to another category. While bound, a product cannot delete/disable the bound product or remove any required 360 kind: return typed zero-write `TURNTABLE_BOUND_PRODUCT` or `TURNTABLE_BINDING_REQUIRES_MEDIA`; explicit category unbind must occur first.
- **D5 — Deterministic SKU identity.** `combinationKey` is produced only by `buildCombinationKey` from `lib/furniture-sku.ts`; the admin UI never constructs keys by string concatenation. `articleNumber` is admin-entered, trimmed, uppercased, and validated for global uniqueness at the DTO and database level.
- **D6 — Guarded stock writes.** Stock changes use a conditional update (`updateMany` with expected current value) inside a transaction, so a concurrent checkout decrement cannot be clobbered. A mismatch returns a typed conflict result and the UI reloads current values.
- **D7 — Admin order mutation policy.** Forward transitions use expected-status conditional updates. Cancellation is fail-closed and provider-free; dispatch evidence, claim timestamp, payment initialization state and correlated `Payment.status` are evaluated by the seven-rule table locked in 5C.0. No provider call, payment write, snapshot rewrite or dispatch-evidence rewrite occurs.
- **D8 — Styling system.** No new styling dependency or mechanism is introduced. 5A.0 records baseline mechanisms/imports under `components/admin/**`; `tests/admin-primitives-contract.test.ts` requires post-5A.3 styling to be a subset. Clone CSS is transcribed, never imported.
- **D9 — Demo route set is frozen.** The five existing demo routes stay; option/SKU/stock/360 vocabulary appears as sections inside `/demo-admin/catalog`. No new demo routes.
- **D10 — Room administration.** Full Room CRUD uses exactly `name`, unique `slug`, `sortOrder` (`@default(0)`); reorder is transactional; delete refuses with `ROOM_HAS_PRODUCTS` when `ProductRoom` exists; product form owns composite ProductRoom assignment.
- **D11 — Thresholds.** `LOW_STOCK_THRESHOLD = 3` is defined in `constants/config.ts` and imported by every admin surface. `classifyStockTier` remains authoritative; dashboard display window is `0 < stock <= 10`; limits are 12. 360 coverage is `turntableBoundCategories / categories`, or `0` when categories is zero. `lib/admin/analytics-config.ts` contains at least `DASHBOARD_RECENT_ORDERS_LIMIT = 12`, `DASHBOARD_LOW_STOCK_LIMIT = 12`, and `DASHBOARD_LOW_STOCK_DISPLAY_MAX = 10`; before removing any other existing export, inventory its importers and record proof of zero consumers in the 5A.4 checkpoint.
- **D12 — Evironn mark.** Existing `public/assets/evironn-logo.svg` is served as `/assets/evironn-logo.svg`; owned Ritm consumers/assets are removed; no compatibility logo is added.
- **D13 — Test harness.** §0.7 is mandatory for every Prisma-backed or static contract test.
- **D14 — Critical E2E.** 5D.6 authors required Playwright specs and test IDs.
- **D15 — ADR ids.** ADR-022 records the approved visual-sequencing amendment. 5D.8 writes exactly ADR-023 Cloudinary ownership, ADR-024 canonical furniture writes, ADR-025 route granularity including Room CRUD, and ADR-026 order transition/cancellation policy. ADR-019 through ADR-022 are never reused.

## 2. Stream 5A — ADMIN protection, shared shell, dashboard

Stream paths: `app/(admin)/layout.tsx`, `app/(admin)/admin/page.tsx`, `app/(admin)/admin/_components/**`, `components/admin/**`, `lib/admin/**`, `tests/**`, `public/**`.

### 5A.0 — Baseline record and plan commit

- Owner: `impl-5A`. Depends on: none.
- Files: `docs/superpowers/plans/2026-08-20-phase-5-admin-demo.md` (this plan), `.superpowers/sdd/progress.md`, `.superpowers/sdd/phase-5-handoff.md`.
- Work: record the confirmed head SHA, quote §0.4 verbatim in the checkpoint, and record the machine-generated baseline list of styling mechanisms/style imports under `components/admin/**` for D8. `docs/roadmap/STATUS.md` is authoritative: assert `git status --short` shows `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` and `docs/superpowers/plans/phase-2-task-3-execution.md` untracked and unmodified; preserve those protected paths at every checkpoint.
- RED/GREEN: none (documentation only). Verify no source file changed: `git status --short`.
- Commit: `chore(phase-5): record admin and demo-admin execution plan`
- Review range: `git diff '0b9d4c8..$C5A0' -- 'docs' '.superpowers'`
- Checkpoint: command conventions, CI check names, protected paths, styling baseline and decision list D1–D15 acknowledged.

#### 5A.0 recorded baseline

The pre-commit HEAD was confirmed as `0b9d4c8b15dbe72138180ec3cc6820f32958c1f7` on `phase/05-admin-demo`. The machine-generated baseline command below scanned all 38 files under `components/admin/**`:

```powershell
$files=@(rg --files components/admin | Sort-Object); Write-Output "files=$($files.Count)"; $rules=[ordered]@{ 'Tailwind utility classes via className'='className\s*='; 'Class composition via cn'='\bcn\s*\('; 'Variant composition via cva'='\bcva\s*\('; 'Inline style props'='\bstyle\s*='; 'CSS custom properties'='var\(--' }; foreach($entry in $rules.GetEnumerator()){ $hits=@(rg -n --glob '*.ts' --glob '*.tsx' $entry.Value components/admin 2>$null); Write-Output "$($entry.Key)=$($hits.Count)" }; $styleImports=@(rg -n -e 'from .*[.](css|scss|sass|less)' -e 'import .*[.](css|scss|sass|less)' components/admin 2>$null); Write-Output "Stylesheet imports=$($styleImports.Count)"; if($styleImports.Count -gt 0){$styleImports}
```

Machine output: `files=38`; Tailwind utility classes via `className=333`; class composition via `cn=49`; variant composition via `cva=1`; inline style props `=2`; CSS custom properties `=13`; stylesheet imports `=0`. Existing global stylesheet classes consumed by the subtree (`material-symbols-outlined`, `fill`, and `sk*`) remain outside `components/admin/**`; no local stylesheet import is present. This is the D8 baseline; later styling must remain a subset and clone CSS must be transcribed rather than imported.

### 5A.1 — Pin the server-side ADMIN boundary contract

- Owner: `impl-5A`. Depends on: 5A.0.
- Files: `tests/admin-access-boundary.test.ts` (new). Read-only: `lib/admin/require-admin.ts`.
- Interface (static scan contract):

```ts
// tests/admin-access-boundary.test.ts
// Scans source text, no Prisma and no runtime rendering.
// 1. Enumerate app/(admin) pages/layouts with readdirSync(dir, { recursive: true, withFileTypes: true });
//    At 5A.1 assert a non-empty staged set containing app/(admin)/layout.tsx,
//    app/(admin)/admin/page.tsx, the existing products and categories pages,
//    app/(admin)/admin/catalog/page.tsx (redirect boundary; assert redirect-only, no privileged read),
//    and app/(admin)/admin/catalog/layout.tsx (tabs-only layout; assert no privileged read; parent
//      app/(admin)/layout.tsx is its guard boundary). As routes are created, append these required
//    paths: products/new and products/[id]/edit; categories/new and categories/[id]/edit;
//    orders/page and orders/[id]; customers/page and customers/[id]; marketing/page, marketing/new
//    and marketing/[id]/edit.
//    Every discovered protected page and guard-bearing layout calls requireAdminPage() before
//    first Prisma, listAdminProducts, getAdmin, analytics/catalog, order-admin or customer-admin read.
//    The retained /admin/catalog redirect is the sole redirect-only page exemption and must have no
//    privileged read. The tabs-only catalog layout is separately classified: it has no privileged
//    read and relies on the parent app/(admin)/layout.tsx guard.
// 2. Every exported async function in app/actions/admin/*.ts calls
//    requireAdminAction() before the first "prisma" occurrence in the function body.
// 3. Every handler in app/api/admin/**/route.ts calls requireAdminApi()
//    before the first "prisma", Cloudinary or provider occurrence.
// 4. No "use client" file under app/(admin)/** or components/admin/** compares role.
// 5. No file outside admin pages/actions/APIs/tests imports lib/admin/catalog.ts or analytics.ts.
// 6. Every discovered file set is non-empty; unresolved scan candidates fail.
```

- Staged route rule: 5A.1 asserts the non-empty minimum present at this checkpoint: `app/(admin)/layout.tsx`, dashboard, existing products and categories pages, redirect-only `app/(admin)/admin/catalog/page.tsx`, and tabs-only `app/(admin)/admin/catalog/layout.tsx`. The tabs-only layout has no privileged read and relies on the parent guard; it is classified separately from page boundaries. 5B.3, 5B.4 and 5B.9 append newly created page routes and retain this test in each GREEN batch. Complete D3 reachability is asserted once in 5D.5.

- RED: `npm test -- tests/admin-access-boundary.test.ts` — assert the staged non-empty page set and all six rules. RED evidence is the documented mutation check: introduce one temporary local violation, record the failing assertion text, revert it, and confirm `git status --short` is clean before committing.
- GREEN: `npm test -- tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `test(admin): pin server-side ADMIN boundary contract`
- Review range: `git diff '$C5A0..$C5A1' -- 'tests'`
- Checkpoint: the scan is the gate every later 5B/5C route, action and API must satisfy.

### 5A.2 — Navigation, shell structure and Evironn branding

- Owner: `impl-5A`. Depends on: 5A.1.
- Files: `lib/admin/nav.ts`, `components/admin/admin-shell.tsx`, `components/admin/admin-mobile-menu.tsx`, `components/admin/admin-tab-bar.tsx`, `app/(admin)/admin/catalog/layout.tsx`, `public/assets/evironn-logo.svg` (existing read-only asset), `tests/admin-nav.test.ts` (new or extended).
- Interface:

```ts
// lib/admin/nav.ts
export type AdminNavItem = { href: string; label: string; match: 'exact' | 'prefix' };
export const ADMIN_NAV: readonly AdminNavItem[]; // dashboard, catalog, orders, customers, marketing
export const ADMIN_CATALOG_TABS: readonly AdminNavItem[]; // initially products/categories; route tasks append options/rooms/stock
export function isActiveAdminHref(item: AdminNavItem, pathname: string): boolean;
```

- Work: initially expose only products/categories; 5B.3 appends options, 5B.4 appends rooms and 5B.9 appends stock in each route-creating commit. Retire Ritm logo/copy, use `/assets/evironn-logo.svg`, keep Auth.js session, sign-out, mobile menu and readiness gates intact.
- RED: `npm test -- tests/admin-nav.test.ts` (assert initial products/categories set, route-task tab additions, active-state matching for nested routes, tab href set equals existing catalog route directories, and no `ritm` substring in nav or shell sources).
- GREEN: `npm test -- tests/admin-nav.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): align admin navigation and shell branding with Evironn`
- Review range: `git diff '$C5A1..$C5A2' -- 'lib/admin' 'components/admin' 'app/(admin)' 'public' 'tests'`
- Checkpoint: nav is data-driven, so 5B/5C add pages without editing shell internals. Required E2E IDs are owned by the task that creates each surface: 5A.5 adds `data-testid="admin-dashboard"`; 5B.6 adds `admin-product-form` and `admin-sku-matrix-row`; 5B.9 adds `admin-stock-input`; 5C.4 adds `admin-order-transition`, `admin-order-cancel`, `admin-conflict-alert` and `admin-blocked-reason`.

### 5A.3 — Port the clone admin visual system

- Owner: `impl-5A`. Depends on: 5A.2.
- Files: `components/admin/admin-page-header.tsx`, `components/admin/admin-panel.tsx`, `components/admin/ui/*`, `components/admin/skeleton/*`, shell styles in the existing styling system (D8), `tests/admin-primitives-contract.test.ts` (new).
- Visual source: `src/admin/AdminPrimitives.tsx`, `AdminPrimitives.css`, `AdminShell.css` — rail, bento grid, compact data density, status colour vocabulary, focus-visible treatment, breakpoints. Do not import `useAdmin.ts`, `adminState.ts`, `adminData.ts`.
- Interface: keep existing component props; extend only where the ported layout needs it (for example `AdminPanel` gaining `density?: 'default' | 'compact'` and `AdminPageHeader` gaining `actions?: ReactNode`). Every new prop is used by a real caller in this commit or the next task.
- RED: `npm test -- tests/admin-primitives-contract.test.ts` (assert exported primitive set, closed status/tone union, skeleton coverage and no clone import). RED evidence is the documented mutation check: introduce one temporary local violation, record the failing assertion text, revert it, and confirm `git status --short` is clean before committing.
- GREEN: `npm test -- tests/admin-primitives-contract.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): port clone admin visual system to production shell`
- Review range: `git diff '$C5A2..$C5A3' -- 'components/admin' 'tests'`
- Checkpoint: primitive inventory and tone/status vocabulary recorded for 5B/5C/5D reuse.

### 5A.4 — Dashboard projections for the furniture domain

- Owner: `impl-5A`. Depends on: 5A.3.
- Files: `lib/admin/analytics.ts`, `lib/admin/analytics-config.ts`, `constants/config.ts` (read-only inventory/consumer contract), `tests/admin-dashboard-analytics.test.ts` (new).
- Interface:

```ts
// lib/admin/analytics-config.ts
export const DASHBOARD_RECENT_ORDERS_LIMIT: number;
export const DASHBOARD_LOW_STOCK_LIMIT: number;
export const DASHBOARD_LOW_STOCK_DISPLAY_MAX: number;

// lib/admin/analytics.ts
export type AdminCatalogKpis = {
  activeProducts: number;
  totalSkus: number;
  activeSkus: number;
  lowStockSkus: number; // 0 < stock <= LOW_STOCK_THRESHOLD (3, imported from constants/config.ts)
  outOfStockSkus: number; // stock === 0
  categories: number;
  rooms: number;
  turntableBoundCategories: number;
  turntableCoverageRatio: number; // turntableBoundCategories / categories, 0 when categories === 0
};
export async function getAdminCatalogKpis(): Promise<AdminCatalogKpis>;
export type AdminLowStockSku = {
  skuId: string;
  articleNumber: string;
  productId: string;
  productName: string;
  combinationLabel: string;
  stock: number;
};
export async function getAdminLowStockSkus(limit?: number): Promise<AdminLowStockSku[]>;
```

- Work: first inventory every existing export from `lib/admin/analytics-config.ts` and its importers; remove an export only with recorded proof of zero consumers. Import `LOW_STOCK_THRESHOLD` from `constants/config.ts` (value 3) and use exported `DASHBOARD_LOW_STOCK_DISPLAY_MAX` (value 10) for the low-stock display window; replace legacy `ProductVariant` stock aggregation with bounded canonical `Sku` aggregation; keep every query bounded (`take`, `_count`, `groupBy`), no unbounded `findMany` over SKUs, and retain order-centric KPIs, status split, best sellers, recent orders and pending-payment count.
- RED: `npm test -- tests/admin-dashboard-analytics.test.ts` (assert KPI field set, threshold boundary behaviour at `stock = 0`, `= threshold`, `= threshold + 1`, coverage ratio with zero categories, and that low-stock queries use `DASHBOARD_LOW_STOCK_DISPLAY_MAX` with `LOW_STOCK_THRESHOLD` plus an explicit limit).
- GREEN: `npm test -- tests/admin-dashboard-analytics.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): add furniture catalog dashboard projections`
- Review range: `git diff '$C5A3..$C5A4' -- 'lib/admin' 'tests'`
- Checkpoint: `LOW_STOCK_THRESHOLD` is the shared constant 5B.9 must consume.

### 5A.5 — Dashboard composition and copy

- Owner: `impl-5A`. Depends on: 5A.4.
- Files: `app/(admin)/admin/page.tsx`, `app/(admin)/admin/_components/*`, dashboard skeletons, `tests/admin-dashboard-render.test.ts` (new).
- Work: call `requireAdminPage()` in `app/(admin)/layout.tsx` and again as the first statement of `app/(admin)/admin/page.tsx`; defence in depth at every page is mandatory. Compose ported KPI/chart/donut/table panels, replace Ritm copy, add catalog and 360 panels, wire low-stock rows to `/admin/catalog/stock`, provide loading skeletons plus explicit empty states, and add `data-testid="admin-dashboard"` to the rendered dashboard surface.
- RED: `npm test -- tests/admin-dashboard-render.test.ts` (render synchronous presentational dashboard components with `renderToStaticMarkup` and injected projection props; assert every panel heading, empty-state copy, and absence of the string `Ritm`; use `readFileSync` for async page-shell source contracts).
- GREEN: `npm test -- tests/admin-dashboard-render.test.ts tests/admin-dashboard-analytics.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): compose Evironn dashboard panels`
- Review range: `git diff '$C5A4..$C5A5' -- 'app/(admin)' 'tests'`
- Checkpoint: dashboard panel inventory and empty-state copy list, for the 5D demo dashboard parity.

### 5A.6 — 5A visual acceptance and stream checkpoint

- Owner: `impl-5A`. Depends on: 5A.5.
- Files: `.superpowers/sdd/phase-5-handoff.md`, `.superpowers/sdd/progress.md`.
- Work: run the §6 acceptance scenarios for `/admin` only (desktop 1440×900, mobile 390×844), plus access checks: anonymous → `/login?callbackUrl=/admin`, CUSTOMER → `/`, ADMIN → dashboard.
- RED/GREEN: none. Verification: the focused tests from 5A.1–5A.5 rerun once as a stream batch: `npm test -- tests/admin-access-boundary.test.ts tests/admin-nav.test.ts tests/admin-primitives-contract.test.ts tests/admin-dashboard-analytics.test.ts tests/admin-dashboard-render.test.ts`.
- Commit: `docs(phase-5): record 5A visual acceptance checkpoint`
- Stream review range: `git diff 'da5e87e..$C5A6' -- 'app/(admin)' 'components/admin' 'lib/admin' 'public' 'tests'`
- Checkpoint: 5A complete; 5B may start.

## 3. Stream 5B — Furniture catalog, options, SKU, stock, media, 360

Stream paths: `app/(admin)/admin/catalog/**`, `app/actions/admin/{categories,products,option-groups,rooms,stock}.ts`, `services/dto/{option-group,product,room}.dto.ts`, `lib/admin/catalog.ts`, `lib/cloudinary/**`, `app/api/admin/media/**`, `tests/**`.

### 5B.1 — Canonical admin catalog read layer

- Owner: `impl-5B`. Depends on: 5A.6
- Files: `lib/admin/catalog.ts` (new), `app/(admin)/admin/catalog/products/page.tsx`, `tests/admin-catalog-read.test.ts` (new).
- Interface:

```ts
// lib/admin/catalog.ts
export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  categoryId: string | null;
  categoryName: string | null;
  skuCount: number;
  activeSkuCount: number;
  canonicalState: 'complete' | 'incomplete-zero-sku';
  minPrice: number | null;
  maxPrice: number | null;
  totalStock: number;
  lowStockSkuCount: number;
  outOfStockSkuCount: number;
  coverUrl: string | null;
  hasTurntableMedia: boolean;
  updatedAt: Date;
};
export type AdminProductListParams = {
  page: number;
  perPage: number;
  query?: string;
  categoryId?: string;
  roomId?: string;
  active?: boolean;
  stock?: 'all' | 'low' | 'out';
};
export type AdminProductList = { rows: AdminProductRow[]; total: number; page: number; perPage: number };
export async function listAdminProducts(params: AdminProductListParams): Promise<AdminProductList>;
export async function getAdminProductDraft(
  productId: string,
): Promise<(FurnitureProductValues & { id: string; canonicalState: 'complete' | 'incomplete-zero-sku' }) | null>;
```

- Work: call `requireAdminPage()` before the first privileged read; read only canonical relations (`skus`, `media`, `optionGroups`, `optionValues`, rooms, category); reuse `lib/admin/pagination.ts` for page parsing and clamping; keep every query bounded and index-friendly. A product with zero canonical `Sku` rows is a safe list/edit case: return `skuCount: 0`, `activeSkuCount: 0`, null price bounds, zero stock counts, `hasTurntableMedia: false`, and `canonicalState: 'incomplete-zero-sku'`; do not throw or invent legacy aggregates. `getAdminProductDraft` returns a `furnitureProductSchema`-parseable draft plus this marker so the form can offer migration-on-save without a second mapping layer.
- RED: `npm test -- tests/admin-catalog-read.test.ts` (assert filter mapping including `stock=low` using `LOW_STOCK_THRESHOLD`, page clamping, aggregate derivation from SKUs, zero-SKU row values and incomplete marker, no throw, and that the returned draft parses with `furnitureProductSchema`).
- GREEN: `npm test -- tests/admin-catalog-read.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): add canonical furniture catalog read layer`
- Review range: `git diff '$C5A6..$C5B1' -- 'lib/admin' 'app/(admin)/admin/catalog' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`
- Checkpoint: canonical read contract available to product form, stock console and demo vocabulary.

### 5B.2 — Product/SKU media and Evironn Cloudinary allowlist

- Owner: `impl-5B`. Depends on: 5B.1
- Files: `lib/cloudinary/folders.ts` (new), `app/api/admin/media/sign/route.ts`, `app/api/admin/media/delete/route.ts`, `components/admin/media/*`, `app/(admin)/admin/catalog/categories/_components/category-form.tsx`, `lib/cloudinary/admin-media.ts`, `tests/cloudinary-folders.test.ts` (new), `tests/admin-media-routes.test.ts` (new or extended), `tests/admin-products-action.test.ts` (rerun bookkeeping). Canonical product-edit media/360 UI is owned solely by 5B.7.
- Interface:

```ts
// lib/cloudinary/folders.ts
export const EVIRONN_MEDIA_FOLDERS = [
  'evironn/uploads',
  'evironn/categories',
  'evironn/products',
  'evironn/skus',
  'evironn/turntable',
] as const;
export type EvironnMediaFolder = (typeof EVIRONN_MEDIA_FOLDERS)[number];
export const LEGACY_MEDIA_PREFIX = 'ritm/';
export function isEvironnMediaFolder(value: string): value is EvironnMediaFolder;
export function isEvironnPublicId(publicId: string): boolean; // prefix match; rejects "..", leading "/", empty segments
```

- Work: sign route accepts only five allowlisted folders; category form requests the shared `EVIRONN_MEDIA_FOLDERS` value `evironn/categories` rather than a literal legacy folder; delete route accepts an Evironn public ID or a legacy `ritm/*` ID only after exact lookup in Category cover, legacy ProductImage through ProductColorway, ProductMedia or SkuMedia; otherwise typed 400/403 before Cloudinary. An identifier already persisted on the edited database row is accepted unchanged only after exact row verification; only new or changed identifiers must satisfy `isEvironnPublicId`, and legacy identifiers are never re-signed or re-uploaded. Both keep `requireAdminApi()` first and idempotent delete semantics. Expose signed upload and ownership-validated delete only; all `ProductMedia`/`SkuMedia` row writes belong to canonical product action/form tasks 5B.6–5B.7. Before closeout, record counted legacy IDs in `Category.coverImagePublicId`, `ProductMedia`, `SkuMedia`, and `lib/demo-data/canonical.ts`, with row/file disposition. Retire legacy folder constants and update named tests.
- RED: `npm test -- tests/cloudinary-folders.test.ts` then `npm test -- tests/admin-media-routes.test.ts` (assert traversal rejection, foreign folder rejection, category uploader uses `evironn/categories`, foreign public-ID delete rejection, DB-referenced legacy delete acceptance, persisted legacy ID accepted unchanged only after exact row verification, changed/new legacy ID rejection, ADMIN guard before any Cloudinary call, counted legacy-ID inventory including demo canonical data, and no env value echoed in any response). RED evidence is the documented mutation check: introduce one temporary local violation, record the failing assertion text, revert it, and confirm `git status --short` is clean before committing.
- GREEN: `npm test -- tests/cloudinary-folders.test.ts tests/admin-media-routes.test.ts tests/media-sign-route.test.ts tests/media-delete-route.test.ts tests/admin-media.test.ts tests/cloudinary-sign.test.ts tests/cloudinary-url.test.ts tests/categories-action.test.ts tests/category-dto.test.ts tests/product-dto.test.ts tests/admin-products-action.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): manage product and SKU media under Evironn folders`
- Review range: `git diff '$C5B1..$C5B2' -- 'lib/cloudinary' 'app/api/admin' 'app/actions' 'components/admin/media' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'app/(admin)/admin/catalog/categories/_components/category-form.tsx' 'tests'`
- Checkpoint: allowlist decision and legacy-asset handling recorded verbatim for ADR draft; the repository-wide `ritm` scan is intentionally authored and gated by final cleanup owner 5D.2.

### 5B.3 — Option group and option value administration

- Owner: `impl-5B`. Depends on: 5B.2
- Files: `lib/admin/action-result.ts` (new shared result contract), `services/dto/option-group.dto.ts` (new), `app/actions/admin/option-groups.ts` (new), `app/(admin)/admin/catalog/options/page.tsx`, `app/(admin)/admin/catalog/options/new/page.tsx`, `app/(admin)/admin/catalog/options/[id]/edit/page.tsx`, `app/(admin)/admin/catalog/options/_components/option-group-form.tsx`, `lib/admin/nav.ts`, `tests/admin-option-groups.test.ts` (new), `tests/option-group-dto.test.ts` (new), `tests/admin-nav.test.ts`, `tests/admin-access-boundary.test.ts`.
- Interface (schema-locked fields):

```ts
// services/dto/option-group.dto.ts
export const optionGroupSchema: ZodType<OptionGroupValues>;
export type OptionGroupValues = {
  name: string;
  slug: string;
  sortOrder: number;
  values: Array<{ id?: string; name: string; slug: string; swatchHex?: string; sortOrder: number }>;
};

// app/actions/admin/option-groups.ts
// lib/admin/action-result.ts
export type AdminActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; code?: string; details?: unknown };

export async function createOptionGroup(input: unknown): Promise<AdminActionResult<{ id: string }>>;
export async function updateOptionGroup(id: string, input: unknown): Promise<AdminActionResult<{ id: string }>>;
export async function deleteOptionGroup(id: string): Promise<AdminActionResult>;
export async function deleteOptionValue(id: string): Promise<AdminActionResult>;
```

- Work: define and export shared `AdminActionResult` in `lib/admin/action-result.ts`; stock conflicts use an explicit union `{ ok: false; error: string; conflict: StockConflict }` alongside the success result, preserving typed conflict details. Reuse this action result envelope; guard first, parse second, transaction third, revalidate fourth. Enforce unique group slug and unique value slug within a group, reusing the rules already validated in `tests/product-dto.test.ts`. Deletion is refused with a typed reason when ProductOptionGroup, ProductOptionValue or SkuOptionValue references exist; no cart/wishlist delete is permitted. Append the three option route paths to `tests/admin-access-boundary.test.ts` in this route-creating commit. No fashion colourway semantics.
- RED: `npm test -- tests/option-group-dto.test.ts` then `npm test -- tests/admin-option-groups.test.ts` (assert guard-before-Prisma, duplicate-slug rejection, refusal for ProductOptionGroup/ProductOptionValue/SkuOptionValue references, no cartItem.delete/deleteMany or wishlist delete, and revalidation paths).
- GREEN: `npm test -- tests/option-group-dto.test.ts tests/admin-option-groups.test.ts tests/admin-nav.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): administer option groups and values`
- Review range: `git diff '$C5B2..$C5B3' -- 'services/dto' 'app/actions' 'app/api/admin' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'app/(admin)/admin/catalog/options' 'lib/admin/nav.ts' 'tests'`
- Checkpoint: option library slugs/ids available to the product form and SKU matrix.

### 5B.4 — Room administration

- Owner: impl-5B. Depends on: 5B.3
- Files: services/dto/room.dto.ts, app/actions/admin/rooms.ts, app/(admin)/admin/catalog/rooms/page.tsx, app/(admin)/admin/catalog/rooms/new/page.tsx, app/(admin)/admin/catalog/rooms/[id]/edit/page.tsx, app/(admin)/admin/catalog/rooms/_components/room-form.tsx, lib/admin/nav.ts, tests/room-dto.test.ts, tests/admin-rooms-action.test.ts, tests/admin-nav.test.ts, tests/admin-access-boundary.test.ts.
- Interface: roomSchema: ZodType<RoomValues>; RoomValues = { name: string; slug: string; sortOrder: number }; createRoom, updateRoom, reorderRooms({ ids }), deleteRoom; refusal reason ROOM_HAS_PRODUCTS.
- Work: full Room CRUD, unique slug, reorder in one transaction, explicit refusal when ProductRoom rows exist; ProductRoom composite assignment remains in canonical product form. Append the three room route paths to `tests/admin-access-boundary.test.ts` and the rooms tab to `lib/admin/nav.ts` in this route-creating commit. Every page calls requireAdminPage() first.
- RED: npm test -- tests/room-dto.test.ts then npm test -- tests/admin-rooms-action.test.ts asserting guard-before-Prisma, duplicate slug, transactional sortOrder reorder, assigned-product refusal and revalidation.
- GREEN: named room tests plus `npm test -- tests/admin-nav.test.ts tests/admin-access-boundary.test.ts` and `npm run typecheck`.
- Commit: feat(admin): administer rooms.
- Review range: `git diff '$C5B3..$C5B4' -- 'services/dto' 'app/actions' 'app/api/admin' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'app/(admin)/admin/catalog/rooms' 'lib/admin/nav.ts' 'tests'`.

### 5B.5 — Deterministic SKU matrix component

- Owner: `impl-5B`. Depends on: 5B.4
- Files: `lib/admin/sku-matrix.ts` (new), `app/(admin)/admin/catalog/products/_components/sku-matrix.tsx` (new), `tests/admin-sku-matrix.test.ts` (new).
- Interface:

```ts
export type SkuMatrixRow = {
  key: string; // buildCombinationKey output, never hand-built
  selections: Array<{ groupId: string; valueId: string }>;
  articleNumber: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  active: boolean;
  existingSkuId?: string;
};
export function buildSkuMatrixRows(input: {
  groups: Array<{ id: string; values: Array<{ id: string }> }>;
  existing: SkuMatrixRow[];
}): SkuMatrixRow[];
```

- Work: generate exactly one row per full cross-product, preserve existing values by `combinationKey`, emit removed combinations as deactivation instructions rather than delete, and surface DTO errors inline. Use `buildCombinationKey` from `lib/furniture-sku.ts`; a SKU referenced by `OrderItem` or `CartItem` is never deleted and its stock is untouched. No cart/wishlist delete.
- RED: `npm test -- tests/admin-sku-matrix.test.ts` (assert row count for 2×3 and 3×2×2 axes, stable ordering, key equality, value preservation, duplicate-group rejection, and deactivation instruction for referenced existing SKU).
- GREEN: `npm test -- tests/admin-sku-matrix.test.ts tests/admin-products-action.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): generate deterministic SKU matrix`
- Review range: `git diff '$C5B4..$C5B5' -- 'lib/admin/sku-matrix.ts' 'app/(admin)/admin/catalog/products' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`
- Checkpoint: matrix contract recorded for demo catalog vocabulary in 5D.1.

### 5B.6 — Canonical product action, options, rooms and SKU matrix

- Owner: `impl-5B`. Depends on: 5B.5
- Files: `app/actions/admin/products.ts`, `app/(admin)/admin/catalog/products/_components/product-form.tsx`, `app/(admin)/admin/catalog/products/new/page.tsx`, `app/(admin)/admin/catalog/products/[id]/edit/page.tsx`, `tests/admin-products-action.test.ts` (new or replacing the legacy-focused test).
- Interface:

```ts
// app/actions/admin/products.ts
export async function createFurnitureProduct(input: unknown): Promise<AdminActionResult<{ id: string }>>;
export async function updateFurnitureProduct(id: string, input: unknown): Promise<AdminActionResult<{ id: string }>>;
export async function deleteProduct(id: string): Promise<AdminActionResult>;
```

- Work: execute ordered substeps: (1) guard/DTO contract and migration refusal; (2) one product form with option, room and SKU inputs; (3) one transaction for canonical writes and reference-safe deactivation; (4) exact revalidation assertions for `/admin/catalog/products`, `/catalog`, and `/product/[slug]`; (5) focused assertions and external review before 5B.7. Import `furnitureProductSchema`/`FurnitureProductValues`; introduce `product-form.tsx` exactly once with option assignment, room assignment and SKU matrix, and add `data-testid="admin-product-form"` plus `data-testid="admin-sku-matrix-row"`. One transaction writes `Product`, `ProductRoom`, `ProductOptionGroup`, `ProductOptionValue`, `Sku` and `SkuOptionValue` in that order. Product/SKU references from orders or carts deactivate, never delete; cart/wishlist rows and immutable snapshots stay intact; no cartItem or wishlist delete. Refuse product delete/disable with typed zero-write `TURNTABLE_BOUND_PRODUCT` until explicit category unbind when `Category.turntableProductId` points at the product. For `canonicalState: 'incomplete-zero-sku'`, migration-on-save requires complete submitted option selections and at least one sellable canonical SKU, creates canonical groups/values/SKUs in this transaction, leaves all legacy rows untouched, and returns typed `MIGRATION_REQUIRES_CANONICAL_SKU` with zero writes when incomplete.
- RED: `npm test -- tests/admin-products-action.test.ts` (assert guard/DTO, incomplete selections, duplicate combination/article, no sellable SKU, migration-on-save creates canonical groups/SKUs without legacy writes, migration-incomplete zero-write refusal, deactivation for order/cart references, zero cart/wishlist deletes, untouched snapshots and no legacy writes, and exact revalidation of `/admin/catalog/products`, `/catalog`, and `/product/[slug]`).
- GREEN: `npm test -- tests/admin-products-action.test.ts tests/product-dto.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): write furniture products through canonical DTO`
- Review range: `git diff '$C5B5..$C5B6' -- 'app/actions/admin/products.ts' 'app/api/admin' 'app/(admin)/admin/catalog/products' 'services/dto' 'constants' 'lib/admin' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`
- Checkpoint: canonical core write path live; media/360 persistence follows in 5B.7, legacy branches retire in 5B.10.

### 5B.7 — Canonical product media and 360 sections

- Owner: `impl-5B`. Depends on: 5B.6.
- Files: `app/actions/admin/products.ts`, `app/(admin)/admin/catalog/products/_components/product-form.tsx`, `tests/admin-product-media.test.ts` (new), `tests/admin-products-action.test.ts` (extend).
- Interface:

```ts
// FurnitureProductValues media fields
media: Array<{ kind: ProductMediaKind; publicId: string; url: string; alt: string; sortOrder: number }>;
sku.media: Array<{ publicId: string; url: string; alt: string; sortOrder: number }>;
// each literal satisfies Prisma.ProductMediaCreateManyProductInput or Prisma.SkuMediaCreateManySkuInput
```

- Work: extend the single 5B.6 product form with canonical product/SKU media and 360 sections; persist `ProductMedia`/`SkuMedia` in the same transaction after canonical product, room, option and SKU rows. Schema validates 360 cardinality before transaction; an identifier already persisted on the edited row is accepted unchanged only after exact database-row verification, while only new or changed identifiers must satisfy `isEvironnPublicId`; legacy identifiers are never re-signed or re-uploaded. If a product is bound by `Category.turntableProductId`, removing/disabling any required 360 kind returns typed zero-write `TURNTABLE_BINDING_REQUIRES_MEDIA`; explicit category unbind is required first. Removed Cloudinary assets are destroyed once after commit; foreign public IDs reject without writes. Revalidation tests assert exact admin `/admin/catalog/products`, storefront `/catalog`, and `/product/[slug]` targets. This task solely owns the canonical media/360 UI and assertions; no legacy media writes.
- RED: `npm test -- tests/admin-product-media.test.ts` (assert 360 disabled rejection, same-transaction media writes, `satisfies Prisma.*CreateManyInput`, persisted legacy ID accepted unchanged after exact row verification, changed/new legacy ID rejection, no Cloudinary before commit, foreign-ID refusal, bound-product required-media refusal with zero writes, one post-commit destroy per removed ID, and no legacy writes).
- GREEN: `npm test -- tests/admin-product-media.test.ts tests/admin-products-action.test.ts tests/product-dto.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): persist canonical product and SKU media`
- Review range: `git diff '$C5B6..$C5B7' -- 'app/actions/admin/products.ts' 'app/api/admin' 'app/(admin)/admin/catalog/products' 'services/dto' 'constants' 'lib/admin' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`.
- Checkpoint: media/360 form ownership and post-commit cleanup proven; category binding follows in 5B.8.

### 5B.8 — Category turntable binding and 360 media

- Owner: `impl-5B`. Depends on: 5B.7
- Files: `app/actions/admin/categories.ts`, `app/(admin)/admin/catalog/categories/_components/category-form.tsx` (turntable binding only; folder constant owned by 5B.2), `tests/admin-categories-turntable.test.ts` (new).
- Interface:

```ts
// app/actions/admin/categories.ts (additions)
export async function setCategoryTurntable(input: {
  categoryId: string;
  productId: string | null;
}): Promise<AdminActionResult<{ categoryId: string; productId: string | null }>>;
```

- Work: enforce the unique `Category.turntableProductId` with a typed conflict result naming the category that already holds the binding; require the bound product to have exactly one `TURN_TABLE_VIDEO`, one `TURN_TABLE_POSTER` and one `TURN_TABLE_FALLBACK` before binding, reusing the cardinality rules already in `furnitureProductSchema`; refuse deleting a bound turntable product with typed zero-write `TURNTABLE_BOUND_PRODUCT` until explicit unbind; keep category CRUD, reorder transaction and occupied-category delete guard unchanged. Cloudinary folder ownership and category-form folder selection are owned by 5B.2 and are not deferred here.
- RED: `npm test -- tests/admin-categories-turntable.test.ts` (assert conflict on double binding, refusal to bind a product with incomplete 360 media, successful unbind with `null`, rejection of 360 media when turntable is not enabled, bound-product delete refusal with zero writes, and success after explicit unbind).
- GREEN: `npm test -- tests/admin-categories-turntable.test.ts tests/admin-products-action.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): bind category turntable and 360 media`
- Review range: `git diff '$C5B7..$C5B8' -- 'app/actions/admin/categories.ts' 'app/api/admin' 'app/(admin)/admin/catalog/categories' 'services/dto' 'constants' 'lib/admin' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`
- Checkpoint: 360 coverage semantics aligned with the dashboard KPI from 5A.4.

### 5B.9 — Guarded SKU stock console

- Owner: `impl-5B`. Depends on: 5B.8
- Files: `app/(admin)/admin/catalog/stock/page.tsx` (new), `app/(admin)/admin/catalog/stock/_components/stock-table.tsx` (new), `app/actions/admin/stock.ts` (new), `lib/admin/nav.ts`, `tests/admin-stock-action.test.ts` (new), `tests/admin-nav.test.ts`, `tests/admin-access-boundary.test.ts`.
- Interface:

```ts
// app/actions/admin/stock.ts
export type StockConflict = { reason: 'STALE_VALUE'; currentStock: number };
export type StockConflictResult = { ok: false; error: string; conflict: StockConflict };
export async function setSkuStock(input: {
  skuId: string;
  expectedStock: number;
  nextStock: number;
}): Promise<AdminActionResult<{ skuId: string; stock: number }> | StockConflictResult>;
```

- Work: guard, validate (`nextStock` integer ≥ 0), then a transaction whose write is `updateMany({ where: { id, stock: expectedStock } })` with a count check (D6); on mismatch return current value so UI reloads. Add `data-testid="admin-stock-input"`. Append the stock route path to `tests/admin-access-boundary.test.ts` and the stock tab to `lib/admin/nav.ts` in this route-creating commit. Never touch order items, snapshots, payment fields or cart rows. Filters import `LOW_STOCK_THRESHOLD` from `constants/config.ts` and `lib/admin/pagination.ts`.
- RED: `npm test -- tests/admin-stock-action.test.ts` (assert guard before Prisma, negative/non-integer rejection, stale-expectation conflict without a write, exactly one update on success, and no write outside `Sku`).
- GREEN: `npm test -- tests/admin-stock-action.test.ts tests/admin-catalog-read.test.ts tests/admin-nav.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): add guarded SKU stock console`
- Review range: `git diff '$C5B8..$C5B9' -- 'app/(admin)/admin/catalog/stock' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'lib/admin/nav.ts' 'tests'`
- Checkpoint: stock write contract recorded for the 5C cancellation restoration review.

### 5B.10 — Retire legacy admin writes with compatibility evidence

- Owner: `impl-5B`. Depends on: 5B.9
- Files: `app/actions/admin/products.ts` (remove legacy branches), `app/actions/admin/orders.ts` (read-only scan target; one exact named restoration exemption only), legacy `variant-matrix.tsx` and legacy nested media UI (remove), `services/dto/product.dto.ts` (keep legacy exports only if a non-admin consumer exists; otherwise remove the admin-only legacy path), `tests/admin-legacy-write-retirement.test.ts` (new).
- Work: classify existing `productVariantId` stock restoration as a write, not a read. Before deletion, enumerate every remaining importer of `productSchema`/`ProductValues`/`variant-matrix` and every read path that still needs `ProductColorway`/`ProductImage`/`ProductVariant` (order history). Until 5C.3 moves restoration, allow exactly one named scan exemption: `app/actions/admin/orders.ts :: cancelOrderByAdmin :: productVariantId branch calling prisma.productVariant.update({ data: { stock: { increment: item.quantity } } })`; never allow the whole file or any other legacy write. Record the development-database count of products with zero canonical `Sku` rows plus disposition (`migrated`, `legacy-only retained`, or `blocked`) in the checkpoint. Remove only symbols with zero remaining consumers; keep legacy read compatibility (D2).
- RED evidence is the documented mutation check: introduce one temporary local violation, record the failing assertion text, revert it, and confirm `git status --short` is clean before committing.
- RED: `npm test -- tests/admin-legacy-write-retirement.test.ts` (static scan: no file under `app/actions/admin/**` or `app/(admin)/**` writes `productColorway`, `productImage` or `productVariant`, except the one exact named `cancelOrderByAdmin` `productVariantId` restoration site above; no whole-file exemption; all other legacy model occurrences are read-only).
- GREEN: `npm test -- tests/admin-legacy-write-retirement.test.ts tests/admin-products-action.test.ts tests/product-dto.test.ts tests/furniture-domain.test.ts` + `npm run typecheck`.
- Commit: `refactor(admin): retire legacy colorway and variant writes`
- Review range: `git diff '$C5B9..$C5B10' -- 'app' 'components' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`
- Checkpoint: retirement evidence table (symbol → remaining consumers → action taken), including the exact temporary restoration exemption and owner `5C.3` that removes it.

### 5B.11 — 5B functional UX acceptance and stream checkpoint

- Owner: `impl-5B`. Depends on: 5B.10
- Files: `.superpowers/sdd/phase-5-handoff.md`, `.superpowers/sdd/progress.md`.
- Work: verify functional usability for `/admin/catalog/products`, `/new`, `/[id]/edit` (including SKU matrix, media and 360 sections), `/admin/catalog/categories` (+ new/edit with turntable binding), `/admin/catalog/options` (+ new/edit), `/admin/catalog/rooms` (+ new/edit), and `/admin/catalog/stock` at desktop and mobile, including validation-error and conflict states. This checkpoint verifies navigation, readability, form operation and responsive usability inside the accepted shell; it does not require exact clone parity or a route-specific redesign. Record visual debt for the consolidated 5D pass rather than polishing it here.
- Verification: rerun explicit batch `tests/admin-catalog-read.test.ts`, `tests/cloudinary-folders.test.ts`, `tests/admin-media-routes.test.ts`, `tests/option-group-dto.test.ts`, `tests/admin-option-groups.test.ts`, `tests/room-dto.test.ts`, `tests/admin-rooms-action.test.ts`, `tests/admin-sku-matrix.test.ts`, `tests/admin-products-action.test.ts`, `tests/admin-product-media.test.ts`, `tests/admin-categories-turntable.test.ts`, `tests/admin-stock-action.test.ts`, `tests/admin-legacy-write-retirement.test.ts`, `tests/admin-nav.test.ts`, plus `tests/admin-access-boundary.test.ts`.
- Commit: `docs(phase-5): record 5B visual acceptance checkpoint`
- Stream review range: `git diff '$C5A6..$C5B11' -- 'app/(admin)' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/admin' 'lib/cloudinary' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`
- Checkpoint: 5B complete; 5C may start.

## 4. Stream 5C — Orders, customers, roles, coupons

Stream paths: `app/(admin)/admin/{orders,customers,marketing}/**`, `app/actions/admin/{orders,customers,coupons}.ts`, `lib/{order-admin,customer-admin}.ts`, `tests/**`.

### 5C.0 — Lock admin order mutation policy

- Owner: `impl-5C`. Depends on: 5B.11.
- Files: `lib/order-admin.ts`, `tests/admin-order-policy-table.test.ts` (new), `.superpowers/sdd/phase-5-handoff.md`.
- Interface: `export type PaymentSettlement = 'NONE' | 'PENDING' | 'SUCCEEDED' | 'FAILED'`; `export function classifyPaymentSettlement(payment: { status: PaymentStatus } | null): PaymentSettlement`; total `Record<PaymentStatus, PaymentSettlement>` maps provider-confirmed capture to `SUCCEEDED`, terminal non-payment `CANCELED`/`FAILED`/`EXPIRED` members to `FAILED`, remaining members to `PENDING`, null to `NONE`. `export const ADMIN_CANCEL_POLICY` is total `Record<PaymentInitializationState, AdminCancelBlockReason | 'ALLOWED_IF_UNSETTLED'>`.
- Locked evaluation order: (1) status outside `PENDING`/`PROCESSING` = `STATUS_NOT_CANCELLABLE`; (2) non-null `paymentEverDispatchedAt` = `PAYMENT_DISPATCH_EVIDENCE_PRESENT`; (3) settlement `SUCCEEDED` = `PAYMENT_SUCCEEDED_REFUND_REQUIRED`; (4) `CLAIMED` or non-null `paymentInitializationClaimedAt` = `PAYMENT_CLAIM_IN_FLIGHT`; (5) `DISPATCHED`, `CORRELATED`, `INDETERMINATE` = `PAYMENT_STATE_UNSAFE`; (6) settlement `PENDING` = `PAYMENT_STATE_UNSAFE`; (7) otherwise `{ ok: true }` for null/`NOT_CREATED`/`READY` with `NONE` or `FAILED`. Forward transitions remain payment-agnostic. Cancellation makes no provider call, payment write, snapshot rewrite or dispatch-evidence rewrite.
- RED: `npm test -- tests/admin-order-policy-table.test.ts` — one case per `PaymentInitializationState` plus null, one per settlement, and exhaustiveness of both records. GREEN adds `npm run typecheck`.
- Commit: `feat(admin): lock admin order mutation payment policy`.
- Review range: `git diff '$C5B11..$C5C0' -- 'lib' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`.
- Checkpoint: record seven-rule evaluation table verbatim, exhaustive PaymentInitializationState/PaymentStatus mappings, and the fail-closed/provider-free contract before 5C.1.

### 5C.1 — Order list reads, filters and pagination

- Owner: `impl-5C`. Depends on: 5C.0.
- Files: `lib/order-admin.ts`, `app/(admin)/admin/orders/page.tsx`, `tests/order-admin.test.ts` (extend).
- Interface:

```ts
// lib/order-admin.ts (additions)
export type AdminOrderRow = {
  id: string;
  number: string;
  createdAt: Date;
  status: OrderStatus;
  paymentInitializationState: string;
  paymentLabel: string;
  customerLabel: string;
  itemCount: number;
  total: number;
};
export type AdminOrderListParams = {
  page: number;
  perPage: number;
  status?: OrderStatus;
  query?: string;
  paymentState?: string;
};
export async function listAdminOrders(
  params: AdminOrderListParams,
): Promise<{ rows: AdminOrderRow[]; total: number; page: number; perPage: number }>;
```

- Work: keep the existing legal forward pipeline and cancellation eligibility helpers as the single source of truth; add payment-state filtering only for states that exist in `prisma/schema.prisma`; reuse `lib/admin/pagination.ts`; do not read provider APIs from list pages.
- RED: `npm test -- tests/order-admin.test.ts` (extend: filter mapping, unknown status/payment-state rejection, page clamping, label derivation).
- GREEN: `npm test -- tests/order-admin.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): adapt order list reads and filters`
- Review range: `git diff '$C5C0..$C5C1' -- 'lib' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'app/(admin)/admin/orders' 'tests'`
- Checkpoint: payment-state vocabulary enumerated from schema, for 5C.2/5C.3 policy.

### 5C.2 — Guarded forward status transitions

- Owner: `impl-5C`. Depends on: 5C.1.
- Files: `lib/order-admin.ts`, `app/actions/admin/orders.ts`, `tests/order-admin.test.ts`, `tests/admin-order-transition.test.ts` (new).
- Interface:

```ts
// lib/order-admin.ts
export function nextAdminStatuses(status: OrderStatus): OrderStatus[]; // PENDING->PROCESSING->SHIPPED->DELIVERED
// app/actions/admin/orders.ts
export async function advanceOrderStatus(input: {
  orderId: string;
  expectedStatus: OrderStatus;
  nextStatus: OrderStatus;
}): Promise<AdminActionResult<{ status: OrderStatus }>>;
```

- Work: guard, validate transition legality against `nextAdminStatuses`, then a conditional `updateMany` keyed on `expectedStatus` so a stale tab cannot skip a stage; no payment, stock, or snapshot writes in this action; revalidate list and detail paths.
- RED: `npm test -- tests/admin-order-transition.test.ts` (assert guard before Prisma, illegal jump rejection, stale-expectation conflict with no write, exactly one update on success, no payment/stock field touched).
- GREEN: `npm test -- tests/admin-order-transition.test.ts tests/order-admin.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): guard order status transitions`
- Review range: `git diff '$C5C1..$C5C2' -- 'lib' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`
- Checkpoint: transition matrix recorded.

### 5C.3 — Transactional, idempotent admin cancellation

- Owner: `impl-5C`. Depends on: 5C.2.
- Files: `app/actions/admin/orders.ts`, `lib/order-admin.ts`, `lib/order.ts` and `lib/sales-count.ts` (shared cancellation contract; restoration moves into one named helper), `tests/admin-order-cancel-invariants.test.ts` (new), `tests/admin-legacy-write-retirement.test.ts` (rerun after exemption removal), `tests/cancel-order.test.ts` and `tests/order-transaction.test.ts` (rerun as GREEN batch, extend only if a contract gap is found).
- Interface:

```ts
export type AdminCancelBlockReason =
  | 'STATUS_NOT_CANCELLABLE'
  | 'PAYMENT_DISPATCH_EVIDENCE_PRESENT'
  | 'PAYMENT_SUCCEEDED_REFUND_REQUIRED'
  | 'PAYMENT_CLAIM_IN_FLIGHT'
  | 'PAYMENT_STATE_UNSAFE';
export function canAdminCancel(
  order: Prisma.OrderGetPayload<{ include: { payment: true } }>,
): { ok: true } | { ok: false; reason: AdminCancelBlockReason };
export async function cancelOrderAsAdmin(input: {
  orderId: string;
  expectedStatus: OrderStatus;
}): Promise<AdminActionResult<{ status: OrderStatus; stockRestored: boolean }>>;
```

- Work: guard, evaluate 5C.0 policy, then reuse the existing shared cancellation contract (`runSerializableOrderTransaction` from `lib/order.ts` plus `adjustSalesCount` from `lib/sales-count.ts`) and call exactly one named helper, `restoreCancelledOrderInventory`, from `lib/order-admin.ts` inside the transaction. Move the legacy `productVariantId` restoration from `app/actions/admin/orders.ts` into `restoreCancelledOrderInventory`; after the move, remove the exact `cancelOrderByAdmin` exemption from `tests/admin-legacy-write-retirement.test.ts` and permit the legacy write only inside this single named helper. The helper flips status with conditional `updateMany`, restores canonical `skuId` and legacy `productVariantId` lines exactly once, and decrements each referenced `Product.salesCount` by its cancelled order-item quantity exactly once in that same successful transaction. No inline duplicate restoration path is permitted. No sales-count write occurs for blocked, stale-conflict or retry submissions. Reviews are untouched: no review create, update or delete is permitted under cancellation, under any condition. Never call a provider. Order snapshots, payment fields and dispatch evidence remain unchanged. The input is the concrete `Prisma.OrderGetPayload<{ include: { payment: true } }>` shape, so field-name drift fails typecheck.
- RED: `npm test -- tests/admin-order-cancel-invariants.test.ts` (assert one blocked/allowed case per rule, one call to `restoreCancelledOrderInventory` inside the transaction, no inline duplicate helper logic, no `app/actions/admin/orders.ts` exemption remains, exactly one named legacy-write helper site, no second stock restoration or `Product.salesCount` decrement on retry, restoration and sales-count adjustment inside same transaction as conditional update, zero sales/review writes on blocked and stale paths, zero review writes on successful cancellation, unchanged snapshot/dispatch evidence, and legacy line restoration).
- GREEN: `npm test -- tests/admin-order-cancel-invariants.test.ts tests/admin-legacy-write-retirement.test.ts tests/order-admin.test.ts tests/order-transaction.test.ts tests/cancel-order.test.ts tests/order-payment-actions.test.ts` + `npm run typecheck`.
- Commit: `fix(admin): make admin cancellation transactional and idempotent`
- Review range: `git diff '$C5C2..$C5C3' -- 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`
- Checkpoint: payment-state policy table plus proof of exactly-once restoration; record removal of the `app/actions/admin/orders.ts` exemption, `restoreCancelledOrderInventory` as the single named helper allowed to retain legacy restoration write, and passing legacy-write scan. This is the highest-risk checkpoint and requires external review before 5C.4.

### 5C.4 — Order detail composition

- Owner: `impl-5C`. Depends on: 5C.3.
- Files: `app/(admin)/admin/orders/[id]/page.tsx`, `app/(admin)/admin/orders/_components/*`, `tests/admin-order-detail-render.test.ts` (new).
- Work: render canonical SKU snapshot lines (article number, combination label, unit price, quantity), payment panel with state and claim evidence (no secrets, no raw provider payloads), transition and cancel controls that call the server actions with `expectedStatus`, plus loading, empty, error and blocked-reason states using ported primitives. Keep async page shell out of render tests; expose synchronous presentational components with injected props. Add `data-testid="admin-order-transition"`, `data-testid="admin-order-cancel"`, `data-testid="admin-conflict-alert"` and `data-testid="admin-blocked-reason"` in this task.
- RED: `npm test -- tests/admin-order-detail-render.test.ts` (use `renderToStaticMarkup` against synchronous presentational components with injected order/action props; assert snapshot fields rendered from order items rather than live product data, blocked-cancel reason copy, absence of provider credentials/identifiers that are not part of the order model, and use `readFileSync` for async page-shell source contracts).
- GREEN: `npm test -- tests/admin-order-detail-render.test.ts tests/admin-order-cancel-invariants.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): compose order detail panels`
- Review range: `git diff '$C5C3..$C5C4' -- 'app/(admin)/admin/orders' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`

### 5C.5 — Customers and role controls

- Owner: `impl-5C`. Depends on: 5C.4.
- Files: `app/(admin)/admin/customers/page.tsx`, `[id]/page.tsx`, `app/(admin)/admin/customers/_components/role-control.tsx`, `lib/customer-admin.ts` (read-only unless a gap is proven), `app/actions/admin/customers.ts` (behaviour unchanged), `tests/admin-customers-render.test.ts` (new), `tests/admin-customers-action.test.ts` (extend if present, otherwise create).
- Work: keep the role whitelist, self-demotion block, last-admin block and guarded one-shot update exactly as they are; expose the role control as a server-action form (never hidden navigation); show canonical SKU/article order lines in the customer order history; add loading/empty/error states. Keep async page shells out of render tests; expose synchronous presentational components with injected props.
- RED: `npm test -- tests/admin-customers-render.test.ts` (use `renderToStaticMarkup` against synchronous presentational components with injected customer/role/action props; assert role control posts to the server action, disabled/blocked copy for self and last admin, order history uses snapshot fields; use `readFileSync` for async page-shell source contracts). `tests/admin-customers-action.test.ts` must also assert `requireAdminAction()` before Prisma, role whitelist validation, self-demotion and last-admin zero-write refusals, and exactly one guarded update on success.
- GREEN: `npm test -- tests/admin-customers-render.test.ts tests/admin-customers-action.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): compose customer detail and role controls`
- Review range: `git diff '$C5C4..$C5C5' -- 'app/(admin)/admin/customers' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/customer-admin.ts' 'lib/order-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'lib' 'tests'`

### 5C.6 — Coupon administration presentation

- Owner: `impl-5C`. Depends on: 5C.5.
- Files: `app/(admin)/admin/marketing/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`, `app/(admin)/admin/marketing/_components/coupon-form.tsx`, `tests/admin-coupons-render.test.ts` (new). `app/actions/admin/coupons.ts` stays unchanged.
- Work: presentation, Evironn copy, list/status/toggle affordances, validation-error display, loading/empty/error states. Server-owned totals and validation remain in `lib/coupon.ts`/`lib/coupon-status.ts`. Do not invent a usage relation or usage counters (the `Coupon` model has none). Keep async page shells out of render tests; expose synchronous presentational components with injected props.
- RED: `npm test -- tests/admin-coupons-render.test.ts` (use `renderToStaticMarkup` against synchronous presentational components with injected coupon/status props; assert form fields map exactly to existing coupon fields, no usage-count UI, status derived from `lib/coupon-status.ts`; use `readFileSync` for async page-shell source contracts).
- GREEN: `npm test -- tests/admin-coupons-render.test.ts tests/admin-coupons-action.test.ts tests/coupon-status.test.ts tests/admin-access-boundary.test.ts` + `npm run typecheck`.
- Commit: `feat(admin): compose coupon administration`
- Review range: `git diff '$C5C5..$C5C6' -- 'app/(admin)/admin/marketing' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/customer-admin.ts' 'lib/order-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests'`

### 5C.7 — 5C visual acceptance and stream checkpoint

- Owner: `impl-5C`. Depends on: 5C.6.
- Files: `.superpowers/sdd/phase-5-handoff.md`, `.superpowers/sdd/progress.md`.
- Work: §6 acceptance for `/admin/orders`, `/admin/orders/[id]`, `/admin/customers`, `/admin/customers/[id]`, `/admin/marketing`, `/new`, `/[id]/edit`, both viewports, including blocked-cancel and validation states. Re-run and record render-contract evidence from `tests/admin-order-detail-render.test.ts`, `tests/admin-customers-render.test.ts`, and `tests/admin-coupons-render.test.ts` in the checkpoint.
- Commit: `docs(phase-5): record 5C visual acceptance checkpoint`
- Stream review range: `git diff '$C5B11..$C5C7' -- 'app/(admin)' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'lib' 'tests'`
- Checkpoint: 5C complete; 5D may start.

## 5. Stream 5D — Synthetic read-only demo-admin, integration, acceptance, closeout

Stream paths: `app/(demo-admin)/**`, `components/demo-admin/**`, `lib/demo-admin/**`, `tests/**`, `e2e/**`, `docs/**`, `.superpowers/sdd/**`.

### 5D.1 — Furniture-aware synthetic fixtures and types

- Owner: `impl-5D`. Depends on: 5C.7.
- Files: `lib/demo-admin/types.ts`, `lib/demo-admin/fixtures.ts`, `lib/demo-admin/nav.ts`, `tests/demo-admin-fixtures.test.ts` (extend).
- Interface:

```ts
// lib/demo-admin/types.ts (additions)
export type DemoSkuRow = {
  articleNumber: string;
  combinationLabel: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  active: boolean;
};
export type DemoProductRow = {
  id: string;
  name: string;
  category: string;
  rooms: string[];
  skuCount: number;
  priceFrom: number;
  totalStock: number;
  mediaCount: number;
  turntable: 'ready' | 'partial' | 'none';
  skus: DemoSkuRow[];
};
export type DemoOptionGroupRow = { name: string; values: string[]; usedByProducts: number };
```

- Work: deterministic dataset (frozen ISO date strings, no clock, no randomness), furniture vocabulary derived from the canonical field names established in 5B, and structure informed by the clone `adminData.ts` without importing it. Nav mirrors the admin information architecture within the frozen five-route set (D9).
- RED: `npm test -- tests/demo-admin-fixtures.test.ts` (assert new types are populated, determinism by deep-equal across two imports, referential integrity between products and their SKU rows, no empty datasets, and stable ordering).
- GREEN: `npm test -- tests/demo-admin-fixtures.test.ts tests/demo-admin-isolation.test.ts` + `npm run typecheck`.
- Commit: `feat(demo-admin): extend synthetic furniture fixtures`
- Review range: `git diff '$C5C7..$C5D1' -- 'lib/demo-admin' 'tests'`

### 5D.2 — Demo shell and visual system port

- Owner: `impl-5D`. Depends on: 5D.1.
- Files: `app/(demo-admin)/demo-admin/layout.tsx`, `components/demo-admin/demo-admin-shell.tsx`, `demo-readonly-banner.tsx`, `demo-kpi-grid.tsx`, `demo-data-table.tsx`, `components/demo-admin/demo-chart.tsx` (new), `components/demo-admin/demo-donut.tsx` (new), `components/demo-admin/demo-status.tsx` (new), `public/ritm-logo.svg` (delete), `public/ritm-logo-light.svg` (delete), `tests/demo-admin-render-contract.test.ts` (extend), `tests/demo-admin-isolation.test.ts` (extend), `tests/ritm-legacy-scan.test.ts` (new/final cleanup owner).
- Work: match the ported protected-shell visual language, keep the read-only banner on every route, and keep demo free of Auth.js session/sign-out. Transcribe every admin visual import used by the dashboard or demo routes — chart, donut, status, table, skeleton and related presentational primitives — into the named demo-local files or existing demo components; no `components/admin/**` import survives. Demo components import only from `components/demo-admin/**` and `lib/demo-admin/**`; any needed visual rule from `components/admin/**` is transcribed, never imported (enforced by 5D.4). Before deleting both public Ritm logo assets, run repository-wide reference scan, repoint any remaining reference to `/assets/evironn-logo.svg`, and assert zero references. Author the final case-insensitive scan with exact allowed hits: `lib/cloudinary/folders.ts` single `LEGACY_MEDIA_PREFIX = 'ritm/'`, legacy-reference branch of `app/api/admin/media/delete/route.ts`, and documented non-media inventory outside Phase 5 ownership. No owned admin/demo/logo/uploader/category/legacy-upload hits remain.
- RED: `npm test -- tests/demo-admin-render-contract.test.ts` then `npm test -- tests/ritm-legacy-scan.test.ts` (assert banner presence on every route, nav parity with `lib/demo-admin/nav.ts`, no interactive mutation affordances, exact allowed `ritm` hit set and no public Ritm logo assets). RED evidence is the documented mutation check: introduce one temporary local violation, record the failing assertion text, revert it, and confirm `git status --short` is clean before committing.
- GREEN: `npm test -- tests/demo-admin-render-contract.test.ts tests/ritm-legacy-scan.test.ts tests/demo-admin-isolation.test.ts` + `npm run typecheck`.
- Commit: `feat(demo-admin): port synthetic admin visual system`
- Review range: `git diff '$C5D1..$C5D2' -- 'app/(demo-admin)' 'components/demo-admin' 'public' 'tests'`

### 5D.3 — Synthetic route content for all five demo routes

- Owner: `impl-5D`. Depends on: 5D.2.
- Files: `app/(demo-admin)/demo-admin/page.tsx`, `catalog/page.tsx`, `orders/page.tsx`, `customers/page.tsx`, `marketing/page.tsx`.
- Work: dashboard shows furniture KPIs mirroring 5A.4 semantics from fixtures (products, SKUs, low stock, categories/rooms, 360 coverage); catalog shows product, option-group and SKU/stock/media/360 sections; orders show synthetic SKU/article lines and status/payment labels; customers show synthetic profiles and order history; marketing shows coupon rows without usage counters. Use the demo-local chart/donut/status replacements from 5D.2 and transcribe every remaining admin visual import before route composition. Every route is a server component reading static fixtures only — no Prisma, no actions, no APIs, no forms, no provider calls.
- RED: `npm test -- tests/demo-admin-route-contract.test.ts` (extend: five routes exist, all are non-indexable, all render the read-only banner, catalog exposes option/SKU/360 sections, no route file contains `use server` or a form `action` prop).
- GREEN: `npm test -- tests/demo-admin-route-contract.test.ts tests/demo-admin-render-contract.test.ts tests/demo-admin-fixtures.test.ts tests/demo-admin-isolation.test.ts` + `npm run typecheck`.
- Commit: `feat(demo-admin): compose synthetic route content`
- Review range: `git diff '$C5D2..$C5D3' -- 'app/(demo-admin)' 'tests'`

### 5D.4 — Tighten isolation contracts

- Owner: `impl-5D`. Depends on: 5D.3.
- Files: `tests/demo-admin-isolation.test.ts`.
- Work: build a recursive, depth-unbounded, cycle-safe, alias-aware import closure from these six entrypoints: `app/(demo-admin)/demo-admin/page.tsx`, `app/(demo-admin)/demo-admin/catalog/page.tsx`, `app/(demo-admin)/demo-admin/orders/page.tsx`, `app/(demo-admin)/demo-admin/customers/page.tsx`, `app/(demo-admin)/demo-admin/marketing/page.tsx`, and `app/(demo-admin)/demo-admin/layout.tsx`. Resolve every relative and `@/` import with `readFileSync` and import/export regex. Assert non-empty closure, explicit minimum size, coverage of every file under `app/(demo-admin)/**`, `components/demo-admin/**`, `lib/demo-admin/**`, and unresolved-import failure. Forbid Prisma, `@prisma/client`, Auth.js, `@/auth`, Cloudinary, actions, APIs, providers, `evironn-clone`, `use server`, revalidation, cookies/headers, `action=`/`action={`; forbid `Date.now()`, `Math.random()`, locale-dependent formatting, and every `components/admin/**` file/import. Demo visual rules are demo-local.
- RED: `npm test -- tests/demo-admin-isolation.test.ts`; RED evidence is the documented mutation check: introduce one temporary local violation per class (Prisma import, `use server`, protected component import, `Math.random()`), record each failing assertion, revert, and confirm `git status --short` is clean before committing.
- GREEN: `npm test -- tests/demo-admin-isolation.test.ts` + `npm run typecheck`.
- Commit: `test(demo-admin): tighten isolation and route contracts`
- Review range: `git diff '$C5D3..$C5D4' -- 'tests'`

### 5D.5 — Integration and parity wiring

- Owner: `impl-5D`. Depends on: 5D.4.
- Files: `tests/admin-nav-route-parity.test.ts` (new).
- Work: assert every `ADMIN_NAV`/`ADMIN_CATALOG_TABS` href resolves to an existing route file and every nav-reachable D3 admin route file is reachable from nav (dashboard, catalog products/categories/options/rooms/stock, orders, customers, marketing); separately enumerate retained redirect-only `/admin/catalog` as the sole non-nav boundary; assert every demo nav href resolves to one of five demo routes; assert no protected admin file links to `/demo-admin` and no demo file links into `/admin`.
- RED: `npm test -- tests/admin-nav-route-parity.test.ts`. RED evidence is the documented mutation check: introduce one temporary local violation, record the failing assertion text, revert it, and confirm `git status --short` is clean before committing.
- GREEN: `npm test -- tests/admin-nav-route-parity.test.ts tests/admin-access-boundary.test.ts tests/demo-admin-isolation.test.ts` + `npm run typecheck`.
- Commit: `test(admin): pin navigation and route parity`
- Review range: `git diff '$C5D4..$C5D5' -- 'tests'`

### 5D.6 — Critical Phase 5 end-to-end coverage

- Owner: `impl-5D`. Depends on: 5D.5.
- Files: `e2e/phase5-admin-access.spec.ts`, `e2e/phase5-admin-catalog.spec.ts`, `e2e/phase5-admin-orders.spec.ts`, `e2e/demo-admin.spec.ts` (extend only if assertion missing), `e2e/phase4-database.ts` (shared helper ownership/read-only contract).
- Conventions: `testDir` `./e2e`, Chromium/Desktop Chrome only, `fullyParallel: false`, workers 1, retries 2, `baseURL http://localhost:3000`, web server `npm run dev` with `reuseExistingServer: false`; call `loadE2eEnvironment()` without printing values; authenticate with `registerAndVerify(page, email?)` and `signIn(page, email, password?)`, password `Passw0rd!1`, code `424242`; derive the fixture namespace with the existing `phase4-e2e-${safePart(testInfo.title)}-${sha256(...).slice(0,20)}` helper, capped at 80 characters; create only namespace-owned rows through `e2e/phase4-database.ts`; always call targeted `cleanupPhase4Namespace` in `finally` (including UI-created option/product/SKU/media rows); never truncate, globally reset or reset schema; use role/label/`data-testid` locators; no `.only`, `.todo` or `test.skip` on any required Phase 5 scenario.
- Scenarios: access spec covers anonymous `/admin` redirect to the exact `/login?callbackUrl=/admin` emitted by `lib/admin/require-admin.ts`, CUSTOMER to `/`, ADMIN `data-testid="admin-dashboard"`, and public `/demo-admin` banner with zero `main button`; catalog spec creates one option group/two values, product with exactly two `data-testid="admin-sku-matrix-row"` rows and namespace article numbers, saves, edits via `data-testid="admin-stock-input"`, and sees the new row in `/admin/catalog/products`; orders spec advances PENDING to PROCESSING via `data-testid="admin-order-transition"`, stale submit shows `data-testid="admin-conflict-alert"`, dispatched order shows `data-testid="admin-blocked-reason"` with `PAYMENT_DISPATCH_EVIDENCE_PRESENT`, and `data-testid="admin-order-cancel"` leaves status unchanged. ADMIN setup promotes a namespaced User to ADMIN through the existing E2E client; targeted namespace cleanup removes it.
- RED: `npm run e2e -- e2e/phase5-admin-access.spec.ts`, `npm run e2e -- e2e/phase5-admin-catalog.spec.ts`, `npm run e2e -- e2e/phase5-admin-orders.spec.ts`; record failing assertions. GREEN: same commands plus `npm run e2e -- e2e/demo-admin.spec.ts`.
- Commit: `test(admin): cover critical Phase 5 admin and demo scenarios end to end`.
- Review range: `git diff '$C5D5..$C5D6' -- 'e2e'`.

### 5D.7 — Consolidated Evironn visual parity and full acceptance matrix

- Owner: `impl-5D`. Depends on: 5D.6.
- Files: completed protected admin and demo-admin presentation components under `app/(admin)/**`, `components/admin/**`, `app/(demo-admin)/**`, and `components/demo-admin/**`; `.superpowers/sdd/phase-5-handoff.md` (acceptance matrix section); `.superpowers/sdd/progress.md`.
- Work: with all functionality frozen, compare every completed protected and demo route against the read-only clone `src/admin/AdminShell.tsx`, `AdminShell.css`, `AdminPrimitives.tsx`, and `AdminPrimitives.css`; apply one coherent Evironn shell/primitives/style pass without changing Prisma queries, actions, DTOs, ADMIN boundaries, Cloudinary ownership, payment/stock invariants, or demo isolation. Then execute §6 in full at both viewports, including access, loading/empty/error, keyboard, reduced-motion and accessibility checks, and record one pass/fail line per route/viewport with defects and fix commits. E2E evidence remains mandatory. User desktop/mobile visual acceptance blocks closeout.
- Commit: `feat(admin): complete Evironn visual parity`
- Review range: `git diff '$C5D6..$C5D7' -- 'app/(admin)' 'components/admin' 'app/(demo-admin)' 'components/demo-admin' '.superpowers' 'docs'`

### 5D.8 — Documentation, ADRs and local closeout gate

- Owner: `impl-5D`. Depends on: 5D.7.
- Files: `docs/roadmap/ROADMAP.md`, `docs/roadmap/STATUS.md`, `docs/roadmap/DECISIONS.md` (retain ADR-022 and add ADR-023, ADR-024, ADR-025, ADR-026), `.superpowers/sdd/progress.md`, `.superpowers/sdd/phase-5-handoff.md`.
- Work: record decisions, phase status and delivery summary; preserve protected untracked Phase 2 paths; run §7 in full and record exact output. No PR or push in this task.
- Commit: `docs(phase-5): close out admin and demo-admin phase`
- Review range: `git diff '$C5D7..$C5D8' -- '.superpowers' 'docs'`

### 5D.9 — Push authorization, CI evidence, deployed Preview acceptance and pull request

- Owner: `impl-5D`. Depends on: 5D.8. Files: no source files; `.superpowers/sdd/phase-5-handoff.md` evidence only.
- Steps: record delivery base `da5e87e`, compare HEAD SHA, branch `phase/05-admin-demo`, target `dev`, and §7 summary; STOP for explicit coordinator authorization recorded verbatim. Without authorization task ends. After authorization run `git push -u origin phase/05-admin-demo`; wait for `Quality / quality` success (missing/skipped fails); run exactly one `gh pr create --base dev --head phase/05-admin-demo --title "Phase 5: admin operations and synthetic demo-admin" --body-file .superpowers/sdd/phase-5-handoff.md`; after Preview success record `Deployment Smoke / smoke` success and rerun §6 at 1440×900 and 390×844 for every admin/demo route; verify `gh pr view --json baseRefName,headRefName,mergeable,statusCheckRollup` shows base `dev`, head `phase/05-admin-demo`; append post-PR evidence commit.
- Commit: `docs(phase-5): record push, CI and deployed preview evidence`.
- Review range: `git diff '$C5D8..$C5D9' -- '.superpowers' 'docs'`.

## 6. Visual acceptance scenarios

Environment: `npm run dev` with local fixture provisioning for 5A.6, 5B.11 and 5C.7; provision one ADMIN, one CUSTOMER, one dispatched order, one stale-status conflict, and one empty-projection case without global reset. Use local production preview (`npm run build` then `npm start`) for 5D.7, then deployed Preview URL for 5D.9. Viewports: desktop 1440×900 and mobile 390×844. The matrix is executed twice; both results are recorded. Every row is checked at both viewports.

| Route                                                            | Checks                                                                                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin`                                                         | KPI panels, chart/donut, best sellers, low stock, recent orders, pending payments; skeleton on first paint; empty-state copy when a projection is empty |
| `/admin/catalog/products`                                        | filters (query, category, active, stock), pagination, empty result state, row navigation, mobile table density                                          |
| `/admin/catalog/products/new` and `/[id]/edit`                   | option assignment, SKU matrix generation and inline errors, media upload progress/error, 360 section, submit success and validation failure             |
| `/admin/catalog/categories` (+ new/edit)                         | reorder controls, cover upload, delete blocked when occupied, turntable binding success and conflict                                                    |
| `/admin/catalog/options` (+ new/edit)                            | value list editing, duplicate-slug error, referenced-delete refusal                                                                                     |
| `/admin/catalog/stock`                                           | low/out filters, inline stock edit, stale-value conflict message and reload                                                                             |
| `/admin/orders` and `/admin/orders/[id]`                         | status filter, payment-state filter, transition control, cancel control, blocked-cancel reason, snapshot line rendering                                 |
| `/admin/customers` and `/admin/customers/[id]`                   | pagination, order history, role control, self/last-admin blocked copy                                                                                   |
| `/admin/marketing` (+ new/edit)                                  | list status chips, toggle, validation errors, empty state                                                                                               |
| `/demo-admin`, `/catalog`, `/orders`, `/customers`, `/marketing` | read-only banner, no mutation affordances, deterministic content, mobile navigation                                                                     |

Cross-cutting checks for every route: keyboard-only navigation reaches all controls with visible focus; `prefers-reduced-motion: reduce` removes non-essential animation; loading, empty, error and validation states are all reachable and legible; no console errors; no `Ritm` string anywhere in admin output.

Access checks: anonymous on any `/admin*` route → exact `/login?callbackUrl=/admin` from `requireAdminPage()`; CUSTOMER on any `/admin*` route → `/`; ADMIN → route renders; anonymous on any `/demo-admin*` route → renders; admin server action or `/api/admin/*` request without an ADMIN session → typed failure/401/403 without database access.

Environment presence-only check (booleans only, never values):

```bash
node -e "const { loadEnvConfig } = require('@next/env'); loadEnvConfig(process.cwd()); for (const k of ['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET']) console.log(k, Boolean(process.env[k]))"
```

## 7. Closeout gate

Run in this order, all green, nothing skipped:

```bash
git status --short
git grep -nE "\.(skip|only|todo)\(" -- tests e2e  # must return nothing
npm test -- tests/ritm-legacy-scan.test.ts
npx prisma validate
npm run format
git status --short  # must return nothing; if format changes files, make one dedicated formatting commit and rerun §7 from the first command
npm run gate
npm run build
npm run e2e -- e2e/phase5-admin-access.spec.ts e2e/phase5-admin-catalog.spec.ts e2e/phase5-admin-orders.spec.ts e2e/demo-admin.spec.ts
node -e "const { loadEnvConfig } = require('@next/env'); loadEnvConfig(process.cwd()); for (const k of ['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET']) console.log(k, Boolean(process.env[k]))"
git log --oneline 'da5e87e..HEAD'
git diff --stat 'da5e87e..HEAD' -- 'app/(admin)' 'app/(demo-admin)' 'components/admin' 'components/demo-admin' 'lib/admin' 'lib/cloudinary' 'app/actions' 'app/api/admin' 'services/dto' 'constants' 'lib/order-admin.ts' 'lib/customer-admin.ts' 'lib/order.ts' 'lib/sales-count.ts' 'tests' 'e2e'
```

`tests/ritm-legacy-scan.test.ts` scans `app/**`, `components/**`, `lib/**`, `public/**` case-insensitively. Allowed hits are exactly `lib/cloudinary/folders.ts` with the single `LEGACY_MEDIA_PREFIX = 'ritm/'`, the legacy-reference branch of `app/api/admin/media/delete/route.ts`, and documented non-media inventory outside Phase 5 ownership (`lib/seo.ts`, `lib/email/send-email.ts`, `lib/verification/service.ts`, `lib/demo-data/canonical.ts`, `lib/demo-data/reset-lock.ts`, `app/api/e2e/phase3-probe/route.ts`, `prisma/seed-orders.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `components/shared/**`). `lib/demo-data/canonical.ts` is allowed only with its counted legacy-ID inventory recorded by 5B.2; fixture IDs are never re-signed, uploaded, or deleted by admin media routes. The 5B.2 checkpoint also records counted IDs and dispositions for `Category.coverImagePublicId`, `ProductMedia`, and `SkuMedia`. Zero hits are required in public Ritm logo assets, owned admin/demo copy/shell/skeleton/fixtures, uploader defaults, category form and legacy product upload component.

Immediately after `npm run format`, `git status --short` must be empty. If formatting changes files, commit one dedicated formatting-only change, then rerun all of §7 from its first command before 5D.9.

`Quality / quality` and `Deployment Smoke / smoke` must both have run and passed on branch head; a `skipped` result is a gate failure; no check may be marked `continue-on-error` or made conditional; local gate supplies format, `gate` and E2E because `Quality / quality` does not run them.

Pull request (exactly one, after the gate passes):

```bash
gh pr create --base dev --head phase/05-admin-demo \
  --title "Phase 5: admin operations and synthetic demo-admin" \
  --body-file .superpowers/sdd/phase-5-handoff.md
```

The PR description must state: delivery base `da5e87e`, stream commit list, decisions D1–D15 with ADR-022 through ADR-026 references, both acceptance-matrix results, the closeout gate output summary, both CI check contexts, and the explicit statement that no Phase 6 work is included.

## 8. Out of scope restated

No refunds, provider redesign, outbox/retry, webhook tooling, bulk import/export, additional roles, warehouse analytics, storefront redesign, or schema changes beyond what a task in this plan requires. No new admin routes beyond D3. No new demo routes beyond D9. No changes to `package.json` scripts, CI definitions, or environment variable names.

## Summary

Phase 5 plan for `phase/05-admin-demo` (delivery base `da5e87e`, preparation HEAD `0b9d4c8`) covering protected ADMIN shell/dashboard (5A), canonical furniture catalog/options/SKU/stock/media/360 (5B), commerce operations (5C), and synthetic read-only demo-admin plus closeout (5D). The plan reuses the existing Evironn production foundation (`requireAdmin*` three-boundary guards, `furnitureProductSchema`, `lib/admin/*`, Cloudinary helpers, demo isolation scan), treats `D:\Projects\fashion-shop` as symbol-level technical reference only, and ports presentation from the clone `src/admin` AdminShell/AdminPrimitives without importing its mock state. Parity matrix assigns exactly one disposition per area, including explicit retirements (legacy colorway/image/variant admin writes, `variant-matrix` size-colour generator with legacy `productSchema` admin path, `ritm/*` Cloudinary allowlist, Ritm brand assets/copy, clone `useAdmin`/`adminState`/`adminData` as production code). Execution is a single branch, sequential streams, focused RED/GREEN per task, one full verification gate at closeout, and one PR into `dev`.

## Risks

- Legacy-to-canonical catalog switch (5B.6/5B.10) touches the write path that currently feeds order, cart and wishlist references. Evidence gap 1 states the whole current product admin path is `ProductColorway`/`ProductImage`/`ProductVariant`; if any non-admin consumer still depends on those admin writes, retirement in 5B.10 breaks it. Mitigation: enumerate importers before deletion and keep read compatibility.
- Admin cancellation is currently non-atomic (status update first, then best-effort provider/stock/sales/review work) and supports both `skuId` and legacy `productVariantId` lines (evidence gap 4). Reworking it in 5C.3 risks double stock restoration or divergence from ADR-017/018 payment claim/correlation semantics. Mitigation: conditional status update as the exactly-once key, policy table written before coding, mandatory external review at that checkpoint.
- Changing the Cloudinary allowlist from `ritm/*` to `evironn/*` invalidates existing tests that assert `ritm/products/*` and may orphan already-persisted assets whose public IDs remain under `ritm/*` (evidence gap 5). Mitigation: delete route accepts database-referenced legacy public IDs; the decision is recorded as an ADR.
- The evidence bundle does not establish which styling system `components/admin/ui/*` uses, while clone ships plain CSS files. D8 baseline capture and subset contract prevent a second styling mechanism.
- Clone implements only `/admin` and `/admin/orders`; catalog, customers and promocodes have no direct visual source. Presentation uses ported primitives and existing Evironn patterns, with judgement-based acceptance.
- The current demo dashboard imports admin chart primitives (evidence gap 9). Any primitive that gains a Prisma, Auth.js or server-only dependency during 5A.3 would break demo isolation only at build time, not necessarily in the scan. Mitigation: 5D.2 explicitly re-checks shared primitives for client safety and permits a demo-local transcription.
- Stock edits can race concurrent checkout decrements and oversell. The conditional-update design (D6) mitigates clobbering, but the bundle does not describe the Phase 4 reservation model in enough detail to prove that a stock decrease can never invalidate an existing reservation. Mitigation: 5B.9 restricts writes to `Sku.stock`, and the 5C.3 review re-examines interaction with restoration.
- `OptionGroup`/`OptionValue` fields are schema-locked in 5B.3; DTO tests and typecheck reject field drift.
- npm scripts and CI contexts are fixed in §0.4 and recorded by 5A.0; no command substitution is permitted.
- `Category.turntableProductId` is unique, so two categories cannot share a turntable product. Without explicit conflict handling, binding attempts would fail with an opaque database error. Mitigation: D4 and 5B.8 require a typed conflict result naming the holding category.
- Dashboard and catalog KPIs computed over all SKUs can become unbounded as the catalog grows. Mitigation: 5A.4 requires aggregate/`groupBy`/`take` forms and explicit limits, verified by the focused test.
- Cloudinary behaviour cannot be exercised in CI without credentials, so signing/delete correctness is proven only by unit-level allowlist tests plus a manual presence-only smoke. A misconfigured folder or account would surface only in a real environment.
- The phase runs on a single long-lived branch with four sequential streams, so the delivery diff against `da5e87e` will be large and the final review expensive. Mitigation: one commit per task, per-task review ranges, and stream-boundary reviews.
- `docs/roadmap/STATUS.md` marks two Phase 2 plan documents as protected untracked paths and records `.superpowers/sdd/progress.md` as modified. If they are committed accidentally, the Phase 5 delivery diff becomes ambiguous. Mitigation: 5A.0 commits only Phase 5 documentation; every checkpoint asserts those protected paths remain untracked and untouched.

## Pre-execution confirmations (all resolved)

- Cloudinary allowlist and legacy `ritm/*` handling: D1 and remediation evidence addendum.
- Room administration scope: D10 is binding full CRUD plus product assignment.
- Route granularity: D3.
- Demo route set: D9 freezes five routes.
- `LOW_STOCK_THRESHOLD = 3`, display window `10`, and 360 formula: D11.
- Styling system: D8 baseline-subset rule.
- Package manager, scripts and CI contexts: §0.4 (`format`, `lint`, `typecheck`, `test`, `gate`, `build`, `e2e`; `Quality / quality`, `Deployment Smoke / smoke`).
- Evironn mark: D12, `public/assets/evironn-logo.svg`.
- `OptionGroup`, `OptionValue`, `Room`, and `Sku` fields: schema fields written in 5B.3, 5B.4 and 5B.6.
- ADR ids: D15.
- Protected Phase 2 paths and modified `progress.md`: `docs/roadmap/STATUS.md` is authoritative; paths stay untracked/untouched and are asserted at every checkpoint.
- Payment-state cancellation policy: 5C.0 table.

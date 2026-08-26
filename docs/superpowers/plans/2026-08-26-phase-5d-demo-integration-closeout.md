# Phase 5D Demo Integration and Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Phase 5 with an isolated five-route demo admin, Evironn visual parity, confirmed Phase 5 functional/security fixes, proportional integration evidence, one local completion gate, and separately authorized delivery gates.

**Architecture:** Existing protected-admin reads, DTOs, actions, ADMIN guards, payment/stock policy, immutable snapshots, Cloudinary ownership, and canonical furniture writes remain authoritative. Phase 5D adds deterministic demo-local projections and presentation, applies one shared visual-system pass to representative route templates, verifies every protected/demo route by automated contracts, and uses namespaced fixtures for critical browser journeys without touching historical rows.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma/Neon, Auth.js, Cloudinary, Vitest, Playwright, Tailwind CSS, and existing CSS modules.

## Global Constraints

- Repository: `D:\Projects\evironn`; branch: `phase/05-admin-demo`; Phase 5 delivery base: `da5e87e`; Phase 5D preparation HEAD: `2c5c982`.
- Read-only technical source: `D:\Projects\fashion-shop`. Read-only visual source: `D:\Новая папка (2)\evironn-clone\src\admin`.
- Do not add a Prisma migration, dependency, route family, provider flow, environment name, reset endpoint, or clone runtime module.
- Every protected page/action/API retains `requireAdminPage`, `requireAdminAction`, or `requireAdminApi` before privileged reads/writes.
- Preserve payment initialization state, stock restoration, serializable conflicts, immutable order-item snapshots, canonical furniture writes, Cloudinary destroy-after-commit, and 360 cardinality.
- `/demo-admin` is public, deterministic, read-only, Prisma-free, Auth.js-free, action/API/provider-free, and presentation-independent from `components/admin/**`.
- No active admin, demo-admin, storefront, auth, email, metadata, or SEO output may contain Ritm branding. Only exact inactive compatibility identifiers named in Task 5D.4 may remain.
- Never mutate historical orders, users, coupons, media, or catalog rows. Every browser write uses recorded namespaced IDs and targeted cleanup in `finally`.
- Preserve without modifying, staging, deleting, or cleaning:
  - `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`
  - `docs/superpowers/plans/phase-2-task-3-execution.md`
- Use focused checks during Tasks 5D.1–5D.7. Run the full `format`/`gate`/`build`/critical-E2E sequence exactly once in Task 5D.8.
- Durable plans, reports, code, tests, commits, `STATUS.md`, and `DECISIONS.md` use normal technical English. Visible agent messages use `caveman ultra`.

---

## Execution map

Phase 5D contains exactly eight local execution tasks, 5D.1–5D.8, followed by four post-user-acceptance delivery gates, 5D.9–5D.12. The four delivery gates are not implementation tasks and do not authorize source changes. Each gate stops for its own explicit user authorization; authorization for one gate never implies authorization for the next.

## Source-parity matrix

| Boundary                                                         | Current Evironn owner                                                        | Source evidence                                                                        | Disposition               | Acceptance                                                                                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ADMIN guards, canonical reads/writes, payments, stock, snapshots | `app/(admin)/**`, `app/actions/admin/**`, `app/api/admin/**`, `lib/admin/**` | Current production and focused tests; `fashion-shop` only as read-only precedent       | reuse unchanged           | No semantic diff unless a named 5D defect proves one is required.                                                 |
| Shared admin shell and primitives                                | `components/admin/**`, `app/(admin)/admin/_components/**`                    | Clone `AdminShell.tsx`, `AdminShell.css`, `AdminPrimitives.tsx`, `AdminPrimitives.css` | port presentation         | Shared typography, rail, panels, tables, forms, focus, responsive density.                                        |
| Protected route templates                                        | 22 `page.tsx` entrypoints under `app/(admin)/**`                             | Current real projections/actions plus shared clone language                            | adapt                     | Automated route/render/navigation contracts for all 22; manual paired captures for representative templates only. |
| Demo fixtures and five routes                                    | `lib/demo-admin/**`, `components/demo-admin/**`, `app/(demo-admin)/**`       | Canonical furniture vocabulary; clone hierarchy only                                   | adapt                     | Literal deterministic fixtures, five routes, no mutations or protected imports.                                   |
| Clone `adminData.ts`, `adminState.ts`, `useAdmin.ts`             | no production owner                                                          | incompatible mock runtime                                                              | retire                    | No import, copy, or build-time dependency.                                                                        |
| Ritm visible branding and logo assets                            | active shared/admin/demo/auth/email/SEO sources found by repository scan     | no normative Evironn use                                                               | retire                    | Zero active-output matches; exact inactive compatibility allowlist only.                                          |
| Historical review observations                                   | prior 5A/5B/5C reports and reviews                                           | current source plus focused tests                                                      | verify as a bounded batch | Fix only reproduced or already confirmed functional/security defects; no per-observation production cycle.        |

## Route contracts

`tests/phase-5-route-contract.test.ts` owns the complete automated matrix. Its protected rows are exact:

| Route template                        | Kind          | Primary item | Catalog tab |
| ------------------------------------- | ------------- | ------------ | ----------- |
| `/admin`                              | page          | Dashboard    | none        |
| `/admin/catalog`                      | redirect-only | Catalog      | none        |
| `/admin/catalog/products`             | list          | Catalog      | Products    |
| `/admin/catalog/products/new`         | new           | Catalog      | Products    |
| `/admin/catalog/products/[id]/edit`   | edit          | Catalog      | Products    |
| `/admin/catalog/categories`           | list          | Catalog      | Categories  |
| `/admin/catalog/categories/new`       | new           | Catalog      | Categories  |
| `/admin/catalog/categories/[id]/edit` | edit          | Catalog      | Categories  |
| `/admin/catalog/options`              | list          | Catalog      | Options     |
| `/admin/catalog/options/new`          | new           | Catalog      | Options     |
| `/admin/catalog/options/[id]/edit`    | edit          | Catalog      | Options     |
| `/admin/catalog/rooms`                | list          | Catalog      | Rooms       |
| `/admin/catalog/rooms/new`            | new           | Catalog      | Rooms       |
| `/admin/catalog/rooms/[id]/edit`      | edit          | Catalog      | Rooms       |
| `/admin/catalog/stock`                | page          | Catalog      | Stock       |
| `/admin/orders`                       | list          | Orders       | none        |
| `/admin/orders/[id]`                  | detail        | Orders       | none        |
| `/admin/customers`                    | list          | Customers    | none        |
| `/admin/customers/[id]`               | detail        | Customers    | none        |
| `/admin/marketing`                    | list          | Coupons      | none        |
| `/admin/marketing/new`                | new           | Coupons      | none        |
| `/admin/marketing/[id]/edit`          | edit          | Coupons      | none        |

The test derives actual page files, normalizes `[id]`, compares the set to these 22 rows, asserts each expected `ADMIN_NAV` primary item and `ADMIN_CATALOG_TABS` tab, and proves `/admin/catalog` is the sole redirect-only row. `lib/admin/nav.ts` remains the label/order/match authority.

Demo rows are exactly `/demo-admin`, `/demo-admin/catalog`, `/demo-admin/orders`, `/demo-admin/customers`, and `/demo-admin/marketing`. `lib/demo-admin/nav.ts` must match protected primary labels/order after prefix normalization and must expose no details, edits, actions, or APIs.

## Proportional debt ledger

This ledger replaces the prior 54-row production-work queue. Historical IDs remain traceable through grouped aliases below; they do not each create a fix, report, commit, or review. The Phase 5D closeout report must contain one compact line for every `D5-001` through `D5-054`, naming its group, source artifact, final disposition, and exact evidence reference. That alias-level index is traceability evidence only: G4 observations receive a production fix only when current focused evidence reproduces a functional or security defect.

| Group                                          | Prior aliases                                                                  | Required disposition                                                                                                                                                                                                                                                                                                          | Closure owner        |
| ---------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| G1 — accepted functional blockers              | D5-001–005                                                                     | Fix/verify checkout contact persistence. Prove one test-owned COD creation, provider-free cancellation, and stale conflict. Reconfirm non-self last-admin refusal using controlled mocked/action integration data.                                                                                                            | 5D.5 and 5D.6        |
| G2 — confirmed functional/security defects     | D5-016–019, D5-024, D5-027–034, D5-038–046, D5-052                             | Fix reproduced media fail-closed/path/logging/ownership issues, product detach/parse/room/P2002 issues, stock retry/reporting, and turntable validation/revalidation issues.                                                                                                                                                  | 5D.5                 |
| G3 — demo, parity, navigation, active branding | D5-006–009, D5-015                                                             | Fix demo isolation, route/navigation coverage, visual parity, and active Ritm output.                                                                                                                                                                                                                                         | 5D.1–5D.4 and 5D.7   |
| G4 — bounded historical verification           | D5-010–014, D5-020–023, D5-025–026, D5-035–037, D5-047–048, D5-051, D5-053–054 | One focused evidence batch verifies warm-up reachability, scanner strength, period selection, compatibility media behavior, catalog/legacy reference contracts, lint/build/unused-symbol risk, and historical evidence wording. Apply a narrow correction only when current evidence reproduces a functional/security defect. | 5D.5, 5D.7, 5D.8     |
| G5 — approved non-5D items                     | D5-049–050                                                                     | Vercel initial-load performance remains Phase 6. Real YooKassa sandbox smoke remains optional/non-blocking under ADR-020.                                                                                                                                                                                                     | existing ADR-020/028 |

Newly discovered functional/security debt is added to the 5D report with an owner and disposition. Transfer to Phase 6 requires explicit user approval and an ADR/STATUS record.

## Review boundaries and verification economy

Only three review boundaries are planned:

1. After 5D.4: demo isolation, route/navigation parity, active Evironn branding, and consolidated presentation parity.
2. After 5D.5: confirmed functional/security fixes plus the bounded historical verification batch.
3. After 5D.7: final functional and security reviews over the complete Phase 5D visual/integration candidate.

Reviewers reuse fresh focused evidence and inspect exact bounded diffs. No per-substep reviewer exists. A remediation re-review runs only after material code changes affect the reviewed boundary; documentation/copy-only corrections receive focused checks and diff inspection.

## Task 5D.1: Build deterministic furniture demo data and demo-local primitives

**Files:**

- Modify: `lib/demo-admin/types.ts`, `lib/demo-admin/fixtures.ts`, `lib/demo-admin/nav.ts`.
- Modify: `components/demo-admin/demo-admin-shell.tsx`, `demo-kpi-grid.tsx`, `demo-data-table.tsx`, `demo-readonly-banner.tsx`.
- Create: `components/demo-admin/demo-page-header.tsx`, `components/demo-admin/demo-panel.tsx`, `components/demo-admin/demo-chart.tsx`, `components/demo-admin/demo-donut.tsx`, `components/demo-admin/demo-status.tsx`, `components/demo-admin/demo-icon.tsx`.
- Modify: the namespaced `.demo-admin-*` block in `app/globals.css` only.
- Modify test: `tests/demo-admin-fixtures.test.ts`.
- Create test: `tests/demo-admin-primitives.test.tsx`.

**Interfaces:**

```ts
export type DemoKpi = { id: string; label: string; value: string; detail: string };
export type DemoRevenuePoint = { label: string; value: number };
export type DemoStatusSlice = { status: DemoOrderStatus; label: string; value: number };
export type DemoCatalogProduct = {
  id: string;
  name: string;
  category: string;
  rooms: readonly string[];
  skuCount: number;
  priceFrom: number;
  totalStock: number;
  mediaCount: number;
  turntable: 'ready' | 'partial' | 'none';
};
export type DemoOptionGroupRow = {
  id: string;
  name: string;
  values: readonly { id: string; label: string }[];
  usedByProducts: number;
};
export type DemoSkuStockRow = {
  id: string;
  productId: string;
  articleNumber: string;
  combinationLabel: string;
  selections: readonly string[];
  price: number;
  oldPrice: number | null;
  stock: number;
  active: boolean;
  mediaCount: number;
  turntable: 'ready' | 'partial' | 'none';
};
export type DemoOrderRow = {
  id: string;
  number: string;
  customerName: string;
  status: DemoOrderStatus;
  paymentLabel: string;
  totalAmount: number;
  createdLabel: string;
  lines: readonly {
    productName: string;
    articleNumber: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};
export type DemoCustomerRow = {
  id: string;
  name: string;
  email: `${string}.invalid`;
  role: 'CUSTOMER' | 'ADMIN';
  orderCount: number;
  totalSpent: number;
  registeredLabel: string;
};
export type DemoCouponRow = {
  id: string;
  code: string;
  type: 'PERCENT';
  value: number;
  windowLabel: string;
  active: boolean;
};
export type DemoAdminFixtures = {
  dashboard: {
    kpis: readonly DemoKpi[];
    revenue: readonly DemoRevenuePoint[];
    statuses: readonly DemoStatusSlice[];
  };
  catalog: {
    products: readonly DemoCatalogProduct[];
    options: readonly DemoOptionGroupRow[];
    skus: readonly DemoSkuStockRow[];
  };
  orders: readonly DemoOrderRow[];
  customers: readonly DemoCustomerRow[];
  coupons: readonly DemoCouponRow[];
};
export const demoAdminFixtures: Readonly<DemoAdminFixtures>;
```

Fixtures use literal ISO strings and preformatted display text; no clock, random, environment, network, `Date` construction, locale derivation, or server read. SKU rows include stable product/SKU IDs, article number, combination label, selections, price/old price, stock, active state, media count, and turntable state. Order rows contain snapshot-like product/article/quantity/price fields.

`DemoAdminShell({ children }: { children: React.ReactNode })` owns Evironn wordmark, read-only banner, desktop rail, mobile navigation, and content frame. `DemoChart` consumes `readonly DemoRevenuePoint[]`; `DemoDonut` consumes `readonly DemoStatusSlice[]`; `DemoKpiGrid` consumes `readonly DemoKpi[]`; `DemoStatus` consumes one `DemoOrderStatus`; and `DemoDataTable` consumes readonly column descriptors plus readonly plain rows. None exposes an action column, mutation callback, form, or protected import.

- [ ] Add fixture/primitives assertions, then run RED: `npm test -- tests/demo-admin-fixtures.test.ts tests/demo-admin-primitives.test.tsx`. Expected: current fashion fixtures, Ritm shell, and protected primitive imports fail.
- [ ] Implement the minimal demo data and primitive boundary.
- [ ] Run GREEN: same command. Run `npx prettier --check lib/demo-admin components/demo-admin tests/demo-admin-fixtures.test.ts tests/demo-admin-primitives.test.tsx` and `git diff --check`.
- [ ] Commit: `feat(demo-admin): build deterministic furniture foundation`.

## Task 5D.2: Compose exactly five public read-only demo routes

**Files:**

- Modify: the six entrypoints under `app/(demo-admin)/demo-admin/**` (layout plus five pages).
- Test: `tests/demo-admin-render-contract.test.ts`, `tests/demo-admin-route-contract.test.ts`.

**Route contents:** dashboard KPI/chart/donut/low-stock/recent-order sections; catalog product/options/SKU-stock/media-360 sections; snapshot-like orders; customer role/order/spend rows; coupon type/value/window/status rows. Each page reads `demoAdminFixtures` only and renders the shared demo read-only banner.

- [ ] Extend render/route tests and run RED: `npm test -- tests/demo-admin-fixtures.test.ts tests/demo-admin-primitives.test.tsx tests/demo-admin-render-contract.test.ts tests/demo-admin-route-contract.test.ts`.
- [ ] Compose five pages without forms, mutation buttons, protected links, `fetch`, actions, APIs, or hydration-owned data.
- [ ] Run GREEN: same command, then `npm run typecheck`, touched-file Prettier check, and `git diff --check`.
- [ ] Commit: `feat(demo-admin): compose five read-only routes`.

## Task 5D.3: Apply one shared Evironn presentation pass

**Files:**

- Modify shared protected presentation: `components/admin/admin-shell.tsx`, `components/admin/admin-shell.module.css`, `components/admin/admin-page-header.tsx`, `components/admin/admin-panel.tsx`, `components/admin/admin-kpi-card.tsx`, `components/admin/admin-mobile-menu.tsx`, `components/admin/admin-tab-bar.tsx`, `components/admin/icon.tsx`, `components/admin/ui/button.tsx`, `components/admin/ui/data-table.tsx`, `components/admin/ui/input.tsx`, `components/admin/ui/select.tsx`, `components/admin/ui/status.tsx`, `components/admin/ui/switch.tsx`, `components/admin/ui/table.tsx`.
- Modify protected template owners: `app/(admin)/admin/_components/dashboard-view.tsx`, `dashboard-view.module.css`, `period-toggle.tsx`, `revenue-chart.tsx`, `status-donut.tsx`, `best-sellers.tsx`, `low-stock.tsx`, `recent-orders.tsx`; `app/(admin)/admin/catalog/products/_components/product-filters.tsx`, `product-form.tsx`, `product-table.tsx`, `sku-matrix.tsx`; `app/(admin)/admin/catalog/categories/_components/category-form.tsx`, `category-table.tsx`; `app/(admin)/admin/catalog/options/_components/option-group-form.tsx`, `option-group-table.tsx`, `option-value-editor.tsx`; `app/(admin)/admin/catalog/rooms/_components/room-form.tsx`, `room-table.tsx`; `app/(admin)/admin/catalog/stock/_components/stock-cell.tsx`, `stock-table.tsx`; `app/(admin)/admin/orders/_components/order-detail.tsx`, `order-filters.tsx`, `order-status-actions.tsx`, `order-table.tsx`; `app/(admin)/admin/customers/_components/customer-detail.tsx`, `customer-filters.tsx`, `customer-table.tsx`, `role-toggle.tsx`; `app/(admin)/admin/marketing/_components/coupon-filters.tsx`, `coupon-form.tsx`, `coupon-table.tsx`.
- Modify demo presentation: `components/demo-admin/demo-admin-shell.tsx`, `demo-readonly-banner.tsx`, `demo-kpi-grid.tsx`, `demo-data-table.tsx`, `demo-page-header.tsx`, `demo-panel.tsx`, `demo-chart.tsx`, `demo-donut.tsx`, `demo-status.tsx`, `demo-icon.tsx`, plus the namespaced admin/demo blocks in `app/globals.css`.
- Test: `tests/admin-primitives-contract.test.ts`, `tests/admin-dashboard-render.test.ts`, `tests/admin-route-contract.test.ts`, `tests/admin-customers-render.test.ts`, `tests/admin-coupons-render.test.ts`, `tests/admin-order-detail-render.test.ts`, `tests/demo-admin-render-contract.test.ts`.

Port hierarchy, density, typography, rail, panels, charts, donut, filters, tables, forms, status vocabulary, focus-visible behavior, reduced motion, and responsive breakpoints from the four clone shell/primitive files. Do not edit Prisma reads, server actions, DTOs, authorization, payment/stock modules, Cloudinary modules, fixture semantics, or E2E helpers.

Shared templates, not 27 independent redesigns, are the acceptance unit: dashboard; list/table; form; CRUD form/editor; stock console; detail; and demo dashboard/list templates. No storefront layout, route entrypoint, read/query module, server action, DTO, or E2E helper is authorized in this task; an assertion that cannot be satisfied through the exact presentation owners above stops for a plan correction rather than widening the task.

- [ ] Record failing render/structure assertions with the focused command above.
- [ ] Apply one coherent presentation change through shared primitives and representative template components.
- [ ] Rerun the same focused command, touched-file Prettier check, and `git diff --check`. Run typecheck once only if public component props changed.
- [ ] Commit: `feat(admin): align protected and demo visual system`.

## Task 5D.4: Lock recursive isolation, all-route parity, and active Evironn branding

**Files:**

- Create: `tests/demo-admin-import-graph.test.ts`, `tests/phase-5-route-contract.test.ts`, `tests/phase-5-active-brand.test.ts`.
- Retire after supersession proof: `tests/demo-admin-isolation.test.ts`.
- Rebrand active output in exact current owners: `components/shared/site-header.tsx`, `components/shared/mobile-nav.tsx`, `components/shared/catalog-header-nav.tsx`, `components/shared/profile/profile-view.tsx`, `components/shared/auth/auth-card.tsx`, `components/shared/home/category-bento.tsx`, `drop-promo.tsx`, `editorial-bento.tsx`, `engineered-feature.tsx`, `hero.tsx`, `season-parallax.tsx`; `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`; `lib/email/send-email.ts`, `lib/verification/service.ts`, and `lib/seo.ts`.
- Rebrand inactive non-compatibility fixture/probe identifiers in `lib/demo-data/canonical.ts`, `app/api/e2e/phase3-probe/route.ts`, and `prisma/seed-orders.ts`; preserve behavior and change identifiers/copy only.
- Delete `public/ritm-logo.svg` and `public/ritm-logo-light.svg` only after zero-reference proof.
- Modify `services/dto/cloudinary-image.ts` to import the shared legacy-prefix symbol instead of repeating a legacy literal and to use Evironn-facing validation copy.

**Isolation interface:** test-local `scanDemoClosure(entrypoints)` recursively resolves relative and `@/` static imports/re-exports and literal dynamic imports; rejects unresolved local imports, cycles that evade inspection, Prisma/Auth/actions/APIs/admin components/Cloudinary/providers/server-only/request-cache APIs/environment access, nondeterministic/locale APIs, mutation exports, and form actions. All six demo entrypoints use the same scanner as negative fixtures.

**Brand policy:** active output must have zero case-insensitive `ritm` matches. Production compatibility allowlist is exact and symbol-based, not count-based:

- `lib/cloudinary/folders.ts`: `LEGACY_MEDIA_PREFIX = 'ritm/'`, needed to recognize persisted legacy Cloudinary IDs; never sign/upload it.
- `lib/demo-data/reset-lock.ts`: `ritm:demo-reset-lock`, retained only to preserve the existing inactive reset-lock namespace during Phase 5; tests prove it is never rendered.
- Tests may contain explicit legacy input strings only in named Cloudinary/media compatibility cases and exact historical fixture-contract cases; test occurrences are reported separately and are never production allowlist entries.

Rebrand the exact active/shared references above to Evironn, including headers, mobile nav, home copy/alts, profile/loyalty/order labels, auth copy/metadata, email fallback names/verification subject, catalog brand chip, and SEO fallback. This is a copy/identifier/assets migration within the authorized Evironn rebrand: preserve existing storefront DOM structure, layout, interactions, routes, data flow, and commerce behavior. No storefront redesign is authorized.

- [ ] Run RED: `npm test -- tests/demo-admin-import-graph.test.ts tests/phase-5-route-contract.test.ts tests/phase-5-active-brand.test.ts tests/demo-admin-render-contract.test.ts tests/admin-nav.test.ts tests/evironn-storefront-shell.test.tsx tests/email-branding.test.ts tests/seo.test.ts`.
- [ ] Close isolation, route, and branding failures. Assert all 22 protected and five demo pages, active nav/tab semantics, no cross-link, zero active Ritm output, exact compatibility symbols, and deleted unreferenced logos.
- [ ] Run GREEN: same command, touched-file Prettier check, and `git diff --check`.
- [ ] Commit: `test(phase-5): lock isolation route and brand parity`.
- [ ] Review boundary A: one fresh Sol Medium review over `2c5c982..HEAD`, restricted to demo isolation/parity/presentation/branding. Reuse focused evidence. Remediate Critical/Important findings; re-review only after material code change.
- [ ] After boundary A has zero Critical/Important findings, record its reviewed HEAD as `$C5D4 = git rev-parse HEAD`; this records future evidence and does not claim current plan approval.

## Task 5D.5: Close confirmed functional/security debt and verify historical observations

**Files and owned boundaries:**

- Checkout: `components/evironn/checkout/use-checkout-variant-a.ts`, `checkout-primitives.tsx`, `checkout-variant-a.tsx`, `tests/evironn-checkout-variant-a.test.tsx`, `tests/checkout-form-boundary.test.ts`, `tests/checkout-dto.test.ts`.
- Media/security production: `lib/cloudinary/admin-media.ts`, `lib/cloudinary/admin-media.server.ts`, `lib/cloudinary/folders.ts`, `app/api/admin/media/delete/route.ts`, `app/api/admin/media/sign/route.ts`, `app/actions/admin/products.ts`, `components/admin/media/image-uploader.tsx`, `app/(admin)/admin/catalog/products/_components/product-form.tsx`.
- Media/security tests: `tests/admin-media.test.ts`, `tests/admin-media-routes.test.ts`, `tests/cloudinary-folders.test.ts`, `tests/media-delete-route.test.ts`, `tests/media-sign-route.test.ts`, `tests/admin-product-media.test.ts`, `tests/product-media-stage.test.tsx`.
- Canonical catalog production: `app/actions/admin/products.ts`, `app/actions/admin/rooms.ts`, `app/actions/admin/stock.ts`, `app/actions/admin/categories.ts`, `lib/admin/catalog.ts`, `lib/admin/sku-matrix.ts`, `app/(admin)/admin/catalog/products/_components/product-form.tsx`, `sku-matrix.tsx`, `app/(admin)/admin/catalog/rooms/_components/room-form.tsx`, `app/(admin)/admin/catalog/stock/_components/stock-cell.tsx`, `app/(admin)/admin/catalog/categories/_components/category-form.tsx`.
- Canonical catalog tests: `tests/admin-products-action.test.ts`, `tests/admin-rooms-action.test.ts`, `tests/admin-sku-matrix.test.ts`, `tests/admin-stock-action.test.ts`, `tests/admin-stock-cell.test.tsx`, `tests/admin-catalog-read.test.ts`, `tests/admin-categories-turntable.test.ts`.
- Boundary/history tests: `tests/admin-access-boundary.test.ts`, `tests/admin-warmup-route.test.ts`, `tests/admin-dashboard-render.test.ts`, `tests/admin-dashboard-analytics.test.ts`, `tests/admin-legacy-write-retirement.test.ts`, `tests/admin-customers-action.test.ts`.
- Conditional retirement owner: delete `app/api/health/warmup/route.ts` only when `tests/admin-warmup-route.test.ts` first proves repository-wide zero callers; otherwise leave the route unchanged and record its verified caller/owner.

**Required behavior:**

- Contact name/phone/email remain controlled through quote recalculation, delivery/payment changes, and submit; `placeOrder` receives exact name/email and normalized phone.
- Media path validation rejects padding, C0/C1 controls, zero-width characters, backslashes, and Unicode separators. Ownership lookup errors fail closed without provider calls. Logs contain stable codes/context, never raw public IDs/provider errors. `admin-media.server.ts` is server-only.
- Product media accepts new Evironn IDs and exactly persisted legacy IDs, rejects another owner, visibly preserves unresolved media, rechecks references immediately before post-commit provider delete, and makes no atomic-destroy claim.
- Product detach intent survives a second save; strict parse precedes retained-inactive projection; contradictory detach/submission refuses before writes; room prefill/deselect works; P2002 maps exact targets only.
- Existing SKU stock is read-only in the product matrix; stock conflict updates retry baseline; committed writes report revalidation warnings as committed success; catalog search/sort/pagination clamps correctly.
- Turntable binding clears pending state in `finally`, keeps the current selection outside bounded search, refuses inactive/wrong-category/incomplete-media products, and revalidates trusted public paths.
- Access/legacy scanners cover current aliases/syntax/roots. Dashboard period 7/30/90/default is asserted. Warm-up route is removed only after a repository-wide zero-caller test; otherwise keep it and record the verified owner.
- Non-self last-admin refusal is reconfirmed in `tests/admin-customers-action.test.ts` using controlled mocked Prisma data: acting ADMIN differs from target ADMIN, mocked `adminCount = 1`, target update count remains zero. Never require or create a globally admin-free Neon database.

- [ ] Add smallest failing assertions to existing focused tests. Run one RED command per boundary, not per historical observation:
  - Checkout: `npm test -- tests/evironn-checkout-variant-a.test.tsx tests/checkout-form-boundary.test.ts tests/checkout-dto.test.ts`.
  - Media/security: `npm test -- tests/admin-media.test.ts tests/admin-media-routes.test.ts tests/cloudinary-folders.test.ts tests/media-delete-route.test.ts tests/media-sign-route.test.ts tests/admin-product-media.test.ts tests/product-media-stage.test.tsx`.
  - Canonical catalog: `npm test -- tests/admin-products-action.test.ts tests/admin-rooms-action.test.ts tests/admin-sku-matrix.test.ts tests/admin-stock-action.test.ts tests/admin-stock-cell.test.tsx tests/admin-catalog-read.test.ts tests/admin-categories-turntable.test.ts`.
  - Boundaries/history: `npm test -- tests/admin-access-boundary.test.ts tests/admin-warmup-route.test.ts tests/admin-dashboard-render.test.ts tests/admin-dashboard-analytics.test.ts tests/admin-legacy-write-retirement.test.ts tests/admin-customers-action.test.ts`.
- [ ] Apply minimal production fixes only for confirmed or reproduced functional/security failures. Record G4 items that already pass as verified evidence, not code tasks.
- [ ] Rerun four GREEN commands, then one `npm run typecheck`, touched-file Prettier check, and `git diff --check`.
- [ ] Commit in at most two cohesive commits: use `fix(admin): close functional and media security debt` when admin production changes; use `fix(checkout): preserve contact state` when checkout production changes; when every G4 observation passes and no production change is needed, use `test(phase-5): verify historical debt` for the added regression/evidence tests. Never create one commit per historical observation.
- [ ] Review boundary B: one fresh Sol Medium functional/security review over exact range `$C5D4..HEAD` plus four focused outputs. No per-finding reviewer. Remediate blockers and re-review only after material code changes.
- [ ] After boundary B has zero Critical/Important findings, record its reviewed HEAD as `$C5D5 = git rev-parse HEAD`; this records future evidence and does not create another review boundary.

## Task 5D.6: Add proportional, independently owned critical browser coverage

**Files:**

- Create: `e2e/phase5-database.ts`, `e2e/admin-phase-5.spec.ts`.
- Modify: `e2e/demo-admin.spec.ts` only for five-route public/read-only coverage.
- Reuse read-only patterns from `e2e/phase4-database.ts`; do not modify that file.

**Fixture interface:**

```ts
export type Phase5Fixture = {
  namespace: string;
  adminUserId: string;
  adminEmail: string;
  customerUserId: string;
  customerEmail: string;
  categoryId: string;
  roomId: string;
  optionGroupId: string;
  optionValueIds: readonly [string, string];
  productId: string;
  skuIds: readonly [string, string];
  cartId: string;
  couponId: string;
};
export type Phase5OrderProbe = {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  stockBySkuId: Readonly<Record<string, number>>;
  snapshotLines: readonly { productName: string; articleNumber: string; quantity: number; unitPrice: number }[];
  paymentCount: number;
  paymentInitializationState: string | null;
  paymentInitializationClaimedAt: string | null;
  paymentEverDispatchedAt: string | null;
};
export type Phase5CleanupProbe = {
  remainingOwnedRows: Readonly<Record<string, number>>;
  allZero: boolean;
};
export function phase5Namespace(testInfo: TestInfo): string;
export async function createPhase5Fixture(namespace: string): Promise<Phase5Fixture>;
export async function readPhase5OrderProbe(namespace: string, orderId: string): Promise<Phase5OrderProbe>;
export async function cleanupPhase5Fixture(
  fixture: Phase5Fixture,
  ownedOrderIds: readonly string[],
): Promise<Phase5CleanupProbe>;
export async function disconnectPhase5Database(): Promise<void>;
```

Namespace must match `/^phase5d-e2e-[a-z0-9-]{8,80}$/`. `Phase5Fixture` records the exact IDs and identities shown above. Every helper validates namespace plus recorded ID/identity intersection. `cleanupPhase5Fixture` rejects any order ID not owned by the fixture, deletes only recorded children in dependency order, and proves zero owned rows. No helper truncates, resets schema, seeds globally, calls a provider, or treats substring matches as ownership.

**Scenarios:**

1. `Phase 5D demo routes are public read only`: all five demo routes, banner, furniture sections, no mutations, desktop/mobile overflow.
2. `Phase 5D protected routes remain ADMIN only`: anonymous/customer denial and representative ADMIN route access using its own namespaced fixture.
3. `Phase 5D owned COD order cancels once under stale tabs`: one serial journey owns one fixture and one order. It fills contact fields in checkout, changes quote/delivery/payment state, asserts retained values, submits COD, opens two admin detail pages, lets first cancellation win, asserts stale second intent refuses, then proves status `CANCELLED`, stock restored once, snapshots unchanged, zero Payment rows, unchanged initialization evidence. Cleanup runs in same test's `finally`.
4. `Phase 5D canonical catalog and coupon projections render`: owns and cleans its own namespaced fixture.
5. Browser role controls may promote and restore an owned CUSTOMER while real shared ADMIN rows remain untouched. This is safe UI evidence only and must not claim last-admin isolation; Task 5D.5 action/integration coverage owns that refusal claim.

- [ ] Add each scenario and run its exact grep once to obtain RED, then rerun only that grep to GREEN. Use `--workers=1` for database-backed scenarios.
- [ ] Ensure every scenario has its own setup and `try/finally` cleanup. No order or fixture crosses test/file boundaries. Never reference historical orders `#52`, `#53`, or non-owned users/coupons.
- [ ] Run touched-file Prettier check and `git diff --check`; do not run combined critical set here.
- [ ] Commit: `test(phase-5): cover owned admin and demo journeys`.

## Task 5D.7: Record representative visual evidence and conduct final reviews

**Automated coverage:** `tests/phase-5-route-contract.test.ts`, render contracts, and navigation contracts cover all 22 protected plus five demo routes at route/template level. No screenshot is required per route.

**Manual paired sample:** capture exactly these 12 representative templates at `1440x900` and `390x844` (24 captures total):

1. `/admin` dashboard.
2. `/admin/catalog/products` product list.
3. `/admin/catalog/products/new` product/SKU/media form.
4. `/admin/catalog/categories/{ownedCategoryId}/edit` representative category CRUD.
5. `/admin/catalog/options/{ownedOptionGroupId}/edit` representative option/value CRUD.
6. `/admin/catalog/stock` stock console.
7. `/admin/orders/{ownedOrderId}` order detail.
8. `/admin/customers/{ownedCustomerId}` customer detail/role control.
9. `/admin/marketing/{ownedCouponId}/edit` coupon form.
10. `/demo-admin` demo dashboard.
11. `/demo-admin/catalog` demo catalog.
12. `/demo-admin/orders` demo orders.

**Files:** create `tests/phase-5d-visual-contract.test.ts`, `.superpowers/sdd/phase-5d-visual-matrix.md`, and exactly 24 captures under `.superpowers/sdd/phase-5d-visual-evidence/`. Reuse `e2e/phase5-database.ts` without modification to provision one namespaced fixture, record its dynamic IDs in the matrix, and clean it in `finally`; demo routes use immutable fixtures.

- [ ] Run RED/GREEN: `npm test -- tests/phase-5d-visual-contract.test.ts tests/phase-5-route-contract.test.ts tests/admin-primitives-contract.test.ts tests/admin-dashboard-render.test.ts tests/admin-customers-render.test.ts tests/admin-coupons-render.test.ts tests/admin-order-detail-render.test.ts tests/demo-admin-render-contract.test.ts`.
- [ ] For each sample record resolved URL, fixture ID, two capture paths, overflow boolean, focus/keyboard result, expected/actual nav/tab, console errors, and cleanup. Shared design-system and template evidence supplies parity acceptance for complete 27-route matrix.
- [ ] Run changed-file Prettier check and `git diff --check`. Commit: `docs(phase-5d): record representative visual evidence`.
- [ ] Review boundary C: one fresh final functional reviewer and one fresh final security reviewer inspect `2c5c982..HEAD`, the two prior boundary reports, focused outputs, browser cleanup evidence, and 12-template visual matrix. These two reviewers are parallel roles inside one final boundary, not two boundaries. They do not run full gate. Critical/Important must be zero before 5D.8. Remediation re-review occurs only after material code changes.

## Task 5D.8: Run the single local closeout sequence and stop for user acceptance

**Files:** update `docs/roadmap/STATUS.md`, `.superpowers/sdd/progress.md`, `.superpowers/sdd/phase-5-handoff.md`; create `.superpowers/sdd/phase-5d-closeout-report.md`. Update `docs/roadmap/DECISIONS.md` only for a genuinely new architecture choice.

- [ ] Record exact commit ranges, all 54 alias-to-group debt dispositions/evidence references, focused evidence, review verdicts, owned cleanup, 12-template visual matrix, and pending delivery gates.
- [ ] Verify Cloudinary key presence only; run `npx prisma validate`; run `git grep -nE "\.(skip|only|todo)\(" -- tests e2e`; inspect branch/base, identity, protected files, secret-pattern candidates, and `git diff --check`.
- [ ] Run `npx prettier --check .` as a check-only preflight. If it fails, correct formatting, rerun only affected focused checks, obtain a bounded re-review only when source/test semantics changed, and repeat this check-only preflight until green. Do not start the frozen full sequence while this preflight is red.
- [ ] Freeze and run this full sequence exactly once:

```powershell
npm run format
npm run gate
npm run build
npm run e2e -- e2e/demo-admin.spec.ts e2e/admin-phase-5.spec.ts --grep "Phase 5D" --workers=1
```

- [ ] `npm run format` must be a no-op because the check-only preflight is green. If any frozen-sequence command fails or formatting changes a file, stop: do not repeat the full sequence under this plan. Diagnose with focused checks, record the invalidated evidence, and amend/reapprove the closeout step before another full-sequence attempt.
- [ ] Commit: `docs(phase-5): record demo integration closeout`.
- [ ] STOP — user local visual acceptance. Present 12-template desktop/mobile sample plus automated 27-route coverage. Acceptance does not authorize push.

## Delivery gate 5D.9: Push

**Depends on:** explicit user local visual acceptance and separate explicit push authorization.

- [ ] Verify Git identity, branch `phase/05-admin-demo`, base `origin/dev`, destination not `main`, clean tracked worktree, and protected untracked files unchanged.
- [ ] Push without force: `git push -u origin phase/05-admin-demo`.
- [ ] Record branch HEAD and `Quality / quality` result. Missing/skipped is failure.
- [ ] STOP — no Preview inspection and no PR.

## Delivery gate 5D.10: Vercel Preview inspection

**Depends on:** separate explicit user authorization to inspect automatically created Preview, or authorization before a manual deployment trigger if required.

- [ ] Verify `Deployment Smoke / smoke` ran and passed; skipped is failure.
- [ ] Inspect the same 12 representative templates at desktop/mobile on Preview. Record pass/fail against the existing 24 local captures; do not create a second capture set. Do not run YooKassa sandbox or Cloudinary mutations merely for inspection.
- [ ] Record Preview URL/status and defects without secrets.
- [ ] STOP for explicit user Preview acceptance. Preview acceptance does not authorize PR creation.

## Delivery gate 5D.11: Pull request

**Depends on:** explicit user PR authorization after Preview acceptance.

- [ ] Open one English PR from `phase/05-admin-demo` to `dev` with sections Summary, Changes, Validation, Database and environment, Visual review, and Risks.
- [ ] Verify base `dev`, head `phase/05-admin-demo`, mergeability, and required checks. Never target `main`.
- [ ] STOP for explicit merge authorization.

## Delivery gate 5D.12: Merge

**Depends on:** explicit user merge authorization.

- [ ] Reverify required checks, base/head, user Git/GitHub identity, and no unreviewed diff.
- [ ] Merge with a merge commit only; no squash/rebase.
- [ ] Confirm merge SHA, update durable status, and delete phase branch only after confirmed merge.
- [ ] Do not begin Phase 6.

## Self-review checklist

- [ ] Every path/interface/command is current and exact; no placeholder or invented npm script.
- [ ] Tasks are sequential with no circular dependency.
- [ ] Shared Neon never needs global ADMIN count zero; no non-owned ADMIN is mutated.
- [ ] Every browser mutation uses recorded namespaced ownership and `finally` cleanup; no historical row is mutated.
- [ ] One COD order is created/cancelled/stale-checked inside one serial owned journey; no cross-test state.
- [ ] Automated contracts cover 22 protected plus five demo routes; manual visual acceptance uses 12 representative templates/24 captures.
- [ ] Active admin/demo/storefront output is Ritm-free; compatibility allowlist is exact, inactive, and symbol-based rather than count-frozen.
- [ ] Review boundaries are only after 5D.4, after 5D.5, and final after 5D.7; remediation re-review requires material code changes.
- [ ] Exactly one full local format/gate/build/critical-E2E sequence exists.
- [ ] Plan structure is exactly eight local tasks plus four post-acceptance delivery gates; delivery gates contain no implementation work.
- [ ] Local visual acceptance, push, Preview inspection, PR, and merge are distinct gates.
- [ ] ADMIN, payment/stock/snapshot, Cloudinary, demo-isolation, protected-file, and portfolio-proportionality contracts remain explicit.

# Selected Evironn Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the user-selected light operational Evironn design to the completed protected and demo admin surfaces without changing Phase 5 business behavior.

**Architecture:** Retheme and reshape the existing shared protected-admin shell/primitives first, then map the current dashboard projections into the selected composition and propagate the same language through existing list/form/detail templates. Mirror the presentation in the technically isolated demo-admin implementation without sharing protected modules or introducing new data flows.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind CSS, CSS Modules, existing SVG/icon components, Vitest, and Playwright.

## Global Constraints

- Repository: `D:\Projects\evironn`.
- Visual sources of truth:
  - `docs/design/admin-redesign/concepts/06-selected-evironn-admin.png` — dashboard desktop;
  - `docs/design/admin-redesign/concepts/07-catalog-products-reference.png` — catalog list desktop;
  - `docs/design/admin-redesign/concepts/08-product-form-reference-v2.png` — product/SKU/media/360 form desktop;
  - `docs/design/admin-redesign/concepts/09-order-detail-reference.png` — order detail desktop;
  - `docs/design/admin-redesign/concepts/10-mobile-catalog-reference-v2.png` — catalog mobile.
- Functional source of truth: the completed Phase 5 implementation and its tests; image-generated text and data are never authoritative.
- Before implementation, fetch refs, verify Phase 5 is merged into `origin/dev`, fast-forward local `dev`, and create a new branch `feat/admin-redesign` from exact `origin/dev`. Stop if histories differ, identity is not the user's configured identity, or Phase 5 is not merged.
- Preserve the two protected untracked Phase 2 plan files and any pre-existing `docs/design/**` assets.
- Use the real Evironn logo and `Golos Text` via existing `--ev-font-*` tokens.
- Preserve all route paths, server guards, actions, DTOs, Prisma reads/writes, payment/stock/snapshot policy, Cloudinary boundaries, and demo isolation.
- No dependency, Prisma migration, seed, environment, provider, global-search, analytics-tracking, or storefront work.
- No visual snapshot framework and no brittle assertions against exact CSS class strings or individual pixel values.
- Use focused checks inside Tasks 1–4. Run the complete format/gate/build/critical-E2E sequence once in Task 5.
- Do not push, open a PR, or merge. Stop for local user visual acceptance.

---

## File ownership map

- Admin theme/tokens: `app/globals.css`, `tailwind.config.ts`, `styles/evironn/tokens.css` (read-only unless a missing existing token is proven).
- Protected shell/navigation: `app/(admin)/layout.tsx`, `components/admin/admin-shell.tsx`, `components/admin/admin-shell.module.css`, `components/admin/admin-mobile-menu.tsx`, `lib/admin/nav.ts`.
- Shared protected primitives: `components/admin/admin-page-header.tsx`, `components/admin/admin-panel.tsx`, `components/admin/admin-kpi-card.tsx`, `components/admin/admin-tab-bar.tsx`, `components/admin/ui/**`, `components/admin/skeleton/**` only where geometry must match the redesigned live component.
- Protected dashboard: `app/(admin)/admin/_components/**`; `app/(admin)/admin/page.tsx` changes only if an existing projection must be passed differently, never to add speculative analytics.
- Protected route presentation: existing components under `app/(admin)/admin/catalog/**`, `orders/**`, `customers/**`, and `marketing/**`.
- Demo presentation: `components/demo-admin/**`, `app/(demo-admin)/demo-admin/**`; do not import protected admin components.
- Contracts/evidence: existing `tests/admin-*.test.*`, `tests/phase-5-route-contract.test.ts`, `tests/phase-5d-visual-contract.test.ts`, `tests/demo-admin-*.test.*`, existing Phase 5 E2E specs, and a new visual acceptance matrix under `.superpowers/sdd/` only during closeout.

## Task 1: Establish the Evironn operational shell and tokens

**Files:**

- Modify: `tailwind.config.ts`.
- Modify: `app/globals.css`.
- Modify: `app/(admin)/layout.tsx`.
- Modify: `components/admin/admin-shell.tsx`.
- Modify: `components/admin/admin-shell.module.css`.
- Modify: `components/admin/admin-mobile-menu.tsx` only if required by the new labelled desktop sidebar.
- Modify: `lib/admin/nav.ts` only to change visible dashboard label from `Дашборд` to `Сводка`; do not change route matching.
- Test: `tests/admin-nav.test.ts`, `tests/admin-primitives-contract.test.ts`, `tests/admin-dashboard-render.test.ts`.

**Produces:** A full-height labelled desktop sidebar, top utility bar, real Evironn identity, Golos typography, and unchanged navigation/access contracts.

- [ ] Verify current branch/base/identity and preserve untracked files. Record the exact Phase 5 merge SHA used as the redesign base.
- [ ] Add focused RED assertions that require the real logo path, visible labels `Сводка`, `Каталог`, `Заказы`, `Клиенты`, `Промокоды`, `Открыть магазин`, and existing route hrefs. Assert behavior/accessible text, not CSS class strings.
- [ ] Run `npm test -- tests/admin-nav.test.ts tests/admin-primitives-contract.test.ts tests/admin-dashboard-render.test.ts`; expect only new presentation assertions to fail.
- [ ] Remap `font-admin-head` and `font-admin-body` in `tailwind.config.ts` to `var(--ev-font-body)` with system sans-serif fallback. Do not load another font.
- [ ] Consolidate light admin tokens in `.admin-root`: warm Evironn canvas/surfaces, muted forest-green accent, restrained warning/error colors, 14/20/28 px geometry, pill controls, thin borders, and soft shadows. Remove the unused dark admin override only if repository search proves no consumer; otherwise leave it dormant.
- [ ] Reshape `AdminShell` to the selected reference: labelled desktop sidebar, top search/utility region, content viewport, bottom store/profile actions. Keep `ADMIN_NAV`, `isActiveAdminHref`, sign-out behavior, `ContentReadyGate`, focus behavior, and mobile menu semantics.
- [ ] Treat top search as non-submitting visual utility until an existing route supplies a query contract. Give it the exact placeholder `Поиск заказов, клиентов, товаров` and prevent it from implying a new backend.
- [ ] Align skeleton/sidebar readiness gates with the new shell geometry without adding timing delays.
- [ ] Run the focused Task 1 command, touched-file Prettier check, and `git diff --check`.
- [ ] Stop for the first visual checkpoint at `/admin` shell on `1440×900` and `390×844`. Compare against the approved dashboard and mobile references. Do not continue until the shell geometry, logo, typography, navigation, and mobile behavior are accepted.
- [ ] Commit after acceptance: `feat(admin): apply selected Evironn shell`.

## Task 2: Recompose the live dashboard from existing projections

**Files:**

- Modify: `app/(admin)/admin/_components/dashboard-view.tsx`.
- Modify: `app/(admin)/admin/_components/dashboard-view.module.css`.
- Modify as needed: existing files under `app/(admin)/admin/_components/` for KPI cards, revenue chart, status distribution, best sellers, low stock, and recent orders.
- Modify: `app/(admin)/admin/page.tsx` only when passing an already available projection required by the layout.
- Test: `tests/admin-dashboard-render.test.ts`, `tests/admin-dashboard-analytics.test.ts`.

**Consumes:** Existing `DashboardKpis`, `KpiSeriesPoint`, `StatusDistribution`, `BestSeller`, `AdminLowStockSku`, `RecentOrderRow`, and `AdminCatalogKpis` interfaces.

**Produces:** A live-data dashboard matching the selected reference's composition without invented storefront analytics.

- [ ] Add focused RED assertions for the visible dashboard structure: `Выручка за период`, existing order/average/cancellation metrics, status module, furniture module, and `Последние заказы`. Preserve empty-state coverage.
- [ ] Run `npm test -- tests/admin-dashboard-render.test.ts tests/admin-dashboard-analytics.test.ts`; expect only new composition assertions to fail.
- [ ] Recompose the dashboard into the selected reference hierarchy: dominant revenue chart, compact KPI tiles, right-side status/funnel treatment, furniture module, category or approved fallback module, and full-width recent-orders table.
- [ ] Build the order funnel only from existing order-status counts. Do not display visits, cart additions, checkout conversion, or any generated metric absent from authoritative projections.
- [ ] Use `AdminCatalogKpis`, best sellers, and low-stock data already provided. Add no Prisma query merely to imitate generated artwork; if category distribution is unavailable, render the existing authoritative inventory/status information in that slot.
- [ ] Preserve the `?days=7|30|90` period contract, links, zero-data states, status translations, ruble formatting, and reduced-motion behavior.
- [ ] Run the focused Task 2 command, touched-file Prettier check, and `git diff --check`.
- [ ] Capture `/admin` at `1440×900` and `390×844`; compare macro layout, density, typography, surface hierarchy, and overflow against the approved dashboard reference.
- [ ] Stop for user dashboard acceptance. Remediate visual differences before proceeding.
- [ ] Commit after acceptance: `feat(admin): redesign operational dashboard`.

## Task 3: Propagate the selected language across protected routes

**Files:**

- Modify: shared primitives under `components/admin/**` listed in the ownership map.
- Modify presentation only in existing route components under `app/(admin)/admin/catalog/**`, `orders/**`, `customers/**`, and `marketing/**`.
- Test: relevant existing admin render/action contracts; action implementations are read-only for this task.

**Produces:** Consistent list, form, detail, table, filter, status, dialog, and media-control presentation across all 22 protected route templates.

- [ ] Inventory every protected page against four templates: dashboard, list, form, detail. Map each page to an existing shared primitive before editing; do not create route-specific duplicate primitives.
- [ ] Add or adjust only focused structural/accessibility tests that protect shared component behavior, Russian labels, route links, and form semantics. Do not assert arbitrary Tailwind strings or visual pixel values.
- [ ] Run one RED batch: `npm test -- tests/admin-primitives-contract.test.ts tests/admin-stock-cell.test.tsx tests/admin-order-detail-render.test.ts tests/admin-customers-render.test.ts tests/admin-coupons-render.test.ts tests/phase-5-route-contract.test.ts`.
- [ ] Update `AdminPageHeader`, `AdminPanel`, buttons, inputs, selects, status pills, tab bars, tables, dialogs, and skeletons to the selected design tokens and geometry.
- [ ] Apply those shared primitives to catalog lists/forms/SKU/media/stock, order list/detail, customer list/detail/roles, and coupon list/forms. Preserve every form field, validation message, pending/disabled state, destructive confirmation, and action binding.
- [ ] Verify server guards and mutation imports remain byte-for-byte semantically equivalent. No edits to `app/actions/admin/**`, `app/api/admin/**`, Prisma schema, or provider modules are expected.
- [ ] Run the focused Task 3 command, touched-file Prettier check, `npm run typecheck`, and `git diff --check`.
- [ ] Inspect representative protected routes at desktop/mobile: product list, product form, stock, order detail, customer detail, and coupon form. Compare product list, product form, order detail, and mobile product list against their corresponding approved references; record overflow and keyboard/focus observations.
- [ ] Commit: `feat(admin): unify protected admin presentation`.

## Task 4: Mirror the visual system in isolated demo-admin

**Files:**

- Modify: `components/demo-admin/**`.
- Modify presentation only: `app/(demo-admin)/demo-admin/**`.
- Preserve: `lib/demo-admin/fixtures.ts` and isolation boundaries unless a visible-label-only projection change is required.
- Test: `tests/demo-admin-primitives.test.tsx`, `tests/demo-admin-render-contract.test.ts`, `tests/demo-admin-route-contract.test.ts`, `tests/demo-admin-import-graph.test.ts`, `tests/phase-5-route-contract.test.ts`.

**Produces:** Five public synthetic routes visually aligned with protected admin while retaining independent, Prisma-free, mutation-free presentation.

- [ ] Add focused RED assertions for matching primary Russian navigation labels, the real public-safe Evironn logo asset, persistent read-only disclosure, and unchanged five-route coverage.
- [ ] Run `npm test -- tests/demo-admin-primitives.test.tsx tests/demo-admin-render-contract.test.ts tests/demo-admin-route-contract.test.ts tests/demo-admin-import-graph.test.ts tests/phase-5-route-contract.test.ts`.
- [ ] Mirror the selected shell/tokens through demo-owned CSS and components. Do not import `components/admin/**`, `lib/admin/**`, Auth.js, Prisma, actions, admin APIs, or provider modules.
- [ ] Adapt demo dashboard, catalog, orders, customers, and marketing presentation using existing deterministic fixtures. Keep all controls visibly read-only and prevent form/mutation affordances.
- [ ] Run the focused Task 4 command, touched-file Prettier check, `npm run typecheck`, and `git diff --check`.
- [ ] Inspect all five demo routes at `1440×900` and `390×844`; confirm read-only disclosure, no horizontal page overflow, and navigation parity.
- [ ] Commit: `feat(demo-admin): mirror selected Evironn design`.

## Task 5: Consolidated verification and local visual closeout

**Files:**

- Create: `.superpowers/sdd/admin-redesign-visual-matrix.md`.
- Update: `docs/roadmap/STATUS.md`.
- Update: `docs/roadmap/DECISIONS.md` with the user-approved post-port redesign decision.
- Update: `.superpowers/sdd/progress.md` and current handoff document if present.

**Produces:** One verified local candidate and evidence for user acceptance; no delivery action.

- [ ] Record all five approved reference paths, exact base/HEAD, task commits, focused results, unchanged functional boundaries, and representative route matrix.
- [ ] Run preflight checks: Git identity/branch/base, protected untracked files, no skipped/only/todo tests, secret-pattern candidates without printing values, and `git diff --check`.
- [ ] Run `npx prettier --check .`. Fix formatting before starting the frozen full sequence.
- [ ] Run the full sequence exactly once:

```powershell
npm run format
npm run gate
npm run build
npm run e2e -- e2e/admin-phase-5.spec.ts e2e/demo-admin.spec.ts --workers=1 --retries=0
```

- [ ] If a command fails, stop the frozen sequence, diagnose with focused checks, document invalidated evidence, and do not repeatedly rerun the full suite without a reviewed correction.
- [ ] Capture representative templates at `1440×900` and `390×844`: protected dashboard, product list, product form, stock, order detail, customer detail, coupon form; demo dashboard, catalog, and orders.
- [ ] Record overflow, focus/keyboard, active navigation, console errors, empty/error states, and visual comparison against the relevant approved reference for each route.
- [ ] Commit closeout documentation only after tests and visual evidence are final: `docs(admin): record redesign closeout`.
- [ ] STOP for user local visual acceptance. Do not push, deploy, open a PR, merge, delete a branch, or begin Phase 6.

## Self-review checklist

- [ ] Every task preserves ADMIN guards, mutations, payment/stock/snapshot rules, Cloudinary boundaries, and demo isolation.
- [ ] Generated reference data is never treated as production truth.
- [ ] `Golos Text`, the real Evironn logo, Russian labels, Evironn tokens, and selected composition are explicit.
- [ ] All 22 protected and five demo route templates retain coverage.
- [ ] Focused checks occur during tasks; the full gate/build/E2E sequence occurs only once.
- [ ] Dashboard and final cross-route visual acceptance are separate user gates.
- [ ] No push/PR/merge authorization is implied.

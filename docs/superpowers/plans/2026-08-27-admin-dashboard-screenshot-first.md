# Admin Dashboard Screenshot-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current adapted dashboard presentation with an isolated React/Tailwind/CSS replica of the approved image, accept that replica visually, and only then connect the existing Evironn backend projections without changing the accepted layout.

**Architecture:** `DashboardReferenceView` is a pure presentation component consuming one explicit `DashboardReferenceModel`. A deterministic fixture drives the first screenshot-parity checkpoint. `createDashboardReferenceModel` then maps the existing protected dashboard DTOs into the same model; the server page retains authentication and reads, while the accepted component tree remains unchanged.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind CSS, CSS Modules, Recharts, Prisma/PostgreSQL read projections, Vitest, Playwright/browser screenshots.

## Global Constraints

- Repository: `D:\Projects\evironn`; branch: `feat/admin-redesign`; accepted shell commit: `dc85280`.
- Approved source image: `docs/design/admin-redesign/concepts/06-selected-evironn-admin.png`.
- Native parity viewport: `1536x1024`; delivery checks: `1440x900` and `390x844`.
- Keep Task 1 shell, real Evironn logo, Golos Text, navigation destinations, `requireAdminPage()`, Prisma schema, actions, mutations, and authorization unchanged.
- Do not reset, revert, clean, stash, or overwrite the current dirty worktree. Classify and preserve useful read-only projection work before replacing presentation files.
- Do not install or run `abi/screenshot-to-code`; without a provider API it cannot generate. Reproduce its workflow locally: static replica, browser capture, visual comparison, iterative correction, then data binding.
- No fabricated data may remain after integration. Fixture data exists only for the isolated visual checkpoint.
- No new dependency, migration, provider, environment variable, global search, analytics tracking, storefront work, push, PR, merge, or Task 3 work.
- Focused checks only. Full gate/build/E2E remain reserved for redesign Task 5.

## File ownership

- Visual model and fixture: create `app/(admin)/admin/_components/dashboard-reference-model.ts` and `app/(admin)/admin/_components/dashboard-reference-fixture.ts`.
- Screenshot-first presentation: create `app/(admin)/admin/_components/dashboard-reference-view.tsx` and `app/(admin)/admin/_components/dashboard-reference-view.module.css`.
- Data adapter: create `app/(admin)/admin/_components/create-dashboard-reference-model.ts`.
- Protected route wiring: modify `app/(admin)/admin/page.tsx` and retire the old dashboard component only after the integrated replacement is accepted.
- Existing read-only projections: preserve or minimally correct current changes in `lib/admin/analytics.ts`, `lib/admin/orders.ts`, and their focused tests.
- Evidence: update `.superpowers/sdd/progress.md`; do not commit before user visual acceptance.

---

### Task 1: Freeze the data boundary and current-work classification

**Files:**

- Inspect: `git diff -- app/(admin)/admin/page.tsx lib/admin/analytics.ts lib/admin/orders.ts tests/admin-dashboard-analytics.test.ts`.
- Inspect: `git diff -- app/(admin)/admin/_components/** components/admin/admin-shell.module.css app/(admin)/layout.tsx app/globals.css`.
- Update: `.superpowers/sdd/progress.md`.

**Interfaces:**

- Consumes: current uncommitted Task 2 work based on `dc85280`.
- Produces: an explicit keep/replace manifest; no source edit or destructive Git operation.

- [ ] Record branch, HEAD, identity, status, and the exact dirty-file list.
- [ ] Classify every dirty file as `KEEP_DATA`, `KEEP_SHELL`, `REPLACE_PRESENTATION`, or `DOCS/EVIDENCE`.
- [ ] Keep bounded read-only additions that expose funnel, category, stock, product image, recent-order image, payment, or fulfillment data when their focused tests prove authoritative sourcing.
- [ ] Mark the current `dashboard-view.tsx`, dashboard CSS, KPI, chart, best-seller, and recent-order presentation as replaceable; do not revert them.
- [ ] Add the manifest to `.superpowers/sdd/progress.md` and stop if any dirty change cannot be attributed to the redesign work.

### Task 2: Build an isolated fixture-backed visual replica

**Files:**

- Create: `app/(admin)/admin/_components/dashboard-reference-model.ts`.
- Create: `app/(admin)/admin/_components/dashboard-reference-fixture.ts`.
- Create: `app/(admin)/admin/_components/dashboard-reference-view.tsx`.
- Create: `app/(admin)/admin/_components/dashboard-reference-view.module.css`.
- Modify temporarily: `app/(admin)/admin/page.tsx` to render the fixture-backed component after the existing ADMIN guard.
- Test: `tests/admin-dashboard-render.test.ts`.

**Interfaces:**

- Produces: `DashboardReferenceModel` with `period`, `revenue`, three compact KPIs, five funnel stages, four inventory cards, four category rings plus optional other share, and recent-order rows.
- Produces: `DashboardReferenceView({ model }: { model: DashboardReferenceModel })`.
- Consumes: `DASHBOARD_REFERENCE_FIXTURE`, used only during this task.

- [ ] Add one focused render test requiring the reference regions and Russian accessible labels; do not assert pixel values or CSS class strings.
- [ ] Run `npm test -- tests/admin-dashboard-render.test.ts`; expect the new component contract to fail before implementation.
- [ ] Define the complete view-model types. Keep formatting-ready primitive values and explicit nullable states; presentation must not import Prisma or server modules.
- [ ] Add a deterministic fixture whose content lengths resemble the approved image. Label it as visual-only and prevent export from any production data module.
- [ ] Implement the reference component from a clean component tree rather than reshaping `DashboardView`: sales panel, KPI tiles with icons, calm area chart, five tapered funnel stages, four horizontal furniture cards, four category rings, and compact recent-orders table.
- [ ] Reproduce the approved image's grid proportions, gaps, padding, radii, warm borders, restrained shadows, muted forest green, and one-screen density at `1536x1024`. Preserve the accepted Task 1 shell.
- [ ] Render the fixture-backed view temporarily from the protected server page only in the local worktree. Keep `requireAdminPage()` before rendering.
- [ ] Run the focused render test, touched-file Prettier check, and `git diff --check`.
- [ ] Capture `/admin` at exactly `1536x1024`. Compare it side by side with `06-selected-evironn-admin.png` and iterate on presentation only.
- [ ] Capture at `1440x900` and `390x844`; confirm no document-level horizontal overflow and an intentional single-column mobile flow.
- [ ] STOP for user acceptance of the fixture-backed visual replica. Do not connect live data before approval.

### Task 3: Map existing authoritative projections into the accepted view

**Files:**

- Create: `app/(admin)/admin/_components/create-dashboard-reference-model.ts`.
- Modify: `app/(admin)/admin/page.tsx`.
- Preserve/minimally correct: `lib/admin/analytics.ts`, `lib/admin/orders.ts`.
- Test: `tests/admin-dashboard-analytics.test.ts`, `tests/admin-dashboard-render.test.ts`.

**Interfaces:**

- Consumes: existing `DashboardKpis`, `KpiSeriesPoint[]`, `AdminFunnelProjection`, `BestSeller[]`, `AdminCategorySummary[]`, `RecentOrderRow[]`, period value, and existing formatters.
- Produces: `createDashboardReferenceModel(input): DashboardReferenceModel`.
- Preserves: `DashboardReferenceView` markup and geometry accepted in Task 2.

- [ ] Add focused adapter tests covering normal, zero-data, missing-analytics, long-name, missing-image, zero-stock, unpaid, and cancelled-order inputs.
- [ ] Run the two focused test files; confirm only new adapter expectations fail.
- [ ] Implement the pure adapter. Use persisted values for every field; map unsupported analytics to `null`/`—`, never a synthetic number.
- [ ] Map real product media and stock into the four inventory cards, with deterministic fallback/empty treatment when fewer than four records exist.
- [ ] Map canonical category aggregation into rings and `Другое`; preserve an honest empty state when no distribution exists.
- [ ] Map order snapshot thumbnails, canonical order/payment/fulfillment labels, totals, and links into recent rows.
- [ ] Replace the temporary fixture binding in `page.tsx` with the adapter result while keeping the same accepted `DashboardReferenceView` component.
- [ ] Ensure `DASHBOARD_REFERENCE_FIXTURE` has no production import path.
- [ ] Run the focused analytics/render tests and `npm run typecheck`; then run touched-file Prettier and `git diff --check`.
- [ ] Capture the real-data page at `1536x1024`, `1440x900`, and `390x844`. Compare against the accepted Task 2 replica; only content-driven differences are allowed.
- [ ] STOP for user acceptance of the integrated dashboard.

### Task 4: Retire superseded presentation and record evidence

**Files:**

- Delete only after acceptance: superseded dashboard presentation modules proven to have no imports.
- Update: `tests/admin-dashboard-render.test.ts`.
- Update: `.superpowers/sdd/progress.md`.

**Interfaces:**

- Preserves: protected `/admin`, the accepted Task 1 shell, live dashboard reads, period behavior, links, accessibility, and all Phase 5 security boundaries.
- Produces: one local screenshot-first dashboard candidate ready for Task 3 of the broader redesign, but no delivery action.

- [ ] Use `rg` to prove which old presentation files are unreferenced; delete only those exact files with explicit evidence.
- [ ] Remove the temporary fixture from runtime wiring but retain it as local visual/test evidence if still imported by focused tests; otherwise delete it.
- [ ] Verify no production component imports the fixture and no presentation component imports Prisma/server-only modules.
- [ ] Run focused dashboard tests, `npm run typecheck`, touched-file Prettier, and `git diff --check`.
- [ ] Record reference path, capture paths, intentional differences, preserved projection files, test results, and user acceptance in `.superpowers/sdd/progress.md`.
- [ ] STOP. Do not run the full gate/build/E2E, commit, push, start protected-route Task 3, or perform database cleanup without separate authorization.

## Self-review result

- The plan separates visual reproduction from backend integration and includes two user visual gates.
- The current dirty worktree is preserved through classification rather than reset/revert.
- The fixture cannot become production truth because runtime binding is explicitly removed before closeout.
- Existing authentication, actions, schema, and business behavior remain outside the replacement boundary.
- Unsupported analytics remain nullable; no generated screenshot values survive integration.

# Approved Admin Screen Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the protected Evironn admin presentation with the complete user-approved dashboard, list, form, and detail screen set while preserving all completed Phase 5 backend, authorization, mutation, payment, stock, media, and validation behavior.

**Architecture:** Keep existing Next.js server pages, DTOs, actions, Prisma reads, and protected route boundaries. Implement the approved presentation through shared admin shell/primitives plus bounded route-local views. Treat Superdesign HTML as visual evidence only: copy geometry and composition, then bind existing real props and server data. Do not import static fixture values into production.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, existing Tailwind/admin primitives, Prisma-backed Phase 5 server projections, Vitest, Playwright.

## Global Constraints

- Production repository: `D:\Projects\evironn`; current branch: `feat/admin-redesign`.
- Preserve all existing dirty work. Never reset, clean, rebase, or overwrite user changes.
- Keep `app/(admin)/layout.tsx` server-side `requireAdminPage()` protection.
- Do not modify Prisma schema, migrations, seeds, admin actions, admin API routes, Auth.js, payment code, stock rules, order snapshots, Cloudinary policy, or provider code.
- Keep current route names. Marketing remains `/admin/marketing`; the UI label remains `Промокоды`.
- Use real Evironn data and formatters. Superdesign fixture names, counts, dates, prices, and KPI values are layout examples only.
- Use `Golos Text`, `/assets/evironn-logo.svg`, warm off-white canvas, white panels, forest-green emphasis, existing Material Symbols, Russian copy, and 14/20/28 px geometry.
- Desktop sidebar may remain fixed. Top utility bar must be in document flow, never `position: sticky` or `position: fixed`, and must have a 16 px gap from the sidebar.
- Preserve keyboard navigation, semantic labels/headings/tables, focus-visible styles, reduced motion, loading/error states, internal table scrolling, and zero horizontal page overflow.
- During tasks run focused checks only. Run full format/gate/build/E2E once after all implementation tasks.
- Do not push, deploy, open a PR, merge, delete branches, or begin Phase 6.

## Approved Visual Sources

| Route/template      | Draft ID                                                    | Preview                                                                | Local evidence                                                              |
| ------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Dashboard           | accepted local `/admin` implementation                      | local route                                                            | `app/(admin)/admin/_components/dashboard-reference-view.tsx`                |
| Product list        | `31be6fd0-c57e-4314-9d48-c7d24bf7828e`                      | `https://p.superdesign.dev/draft/31be6fd0-c57e-4314-9d48-c7d24bf7828e` | `.superdesign/tmp/catalog-current.html`                                     |
| Order list          | `597b3048-0783-4a27-aa91-3a625ceb521c`                      | `https://p.superdesign.dev/draft/597b3048-0783-4a27-aa91-3a625ceb521c` | `.superdesign/tmp/orders-register.html`                                     |
| Customer list       | `e921a280-154e-448e-bbe6-47b2f6a10caf`                      | `https://p.superdesign.dev/draft/e921a280-154e-448e-bbe6-47b2f6a10caf` | `.superdesign/tmp/customers-register.html`                                  |
| Coupon list         | `c36b9482-ca43-4473-91a5-3cdacea92004`                      | `https://p.superdesign.dev/draft/c36b9482-ca43-4473-91a5-3cdacea92004` | `.superdesign/tmp/coupons-register.html`                                    |
| Product create/edit | `e8099452-bb28-462b-99ef-ad53962c3b72` (remote v1 baseline) | `https://p.superdesign.dev/draft/e8099452-bb28-462b-99ef-ad53962c3b72` | `.superdesign/tmp/product-editor.html` (contract-aligned v2; authoritative) |
| Order detail        | `6207cc33-109d-4c5d-886e-bac23c564326`                      | `https://p.superdesign.dev/draft/6207cc33-109d-4c5d-886e-bac23c564326` | `.superdesign/tmp/order-detail.html`                                        |
| Customer detail     | `955f3d92-ebf2-4d24-930f-cbcbf04d8bb0`                      | `https://p.superdesign.dev/draft/955f3d92-ebf2-4d24-930f-cbcbf04d8bb0` | `.superdesign/tmp/customer-detail.html`                                     |
| Coupon create/edit  | `3ef8e0ad-9396-4a9b-b56a-faf20cffbb5c`                      | `https://p.superdesign.dev/draft/3ef8e0ad-9396-4a9b-b56a-faf20cffbb5c` | `.superdesign/tmp/coupon-editor.html`                                       |

---

### Task 1: Close the accepted dashboard and shared shell baseline

**Files:**

- Modify: `app/(admin)/layout.tsx`
- Modify: `components/admin/admin-shell.tsx`
- Modify: `components/admin/admin-shell.module.css`
- Modify: `components/admin/admin-mobile-menu.tsx`
- Modify: `components/admin/admin-page-header.tsx`
- Modify: `components/admin/admin-panel.tsx`
- Modify: `components/admin/admin-tab-bar.tsx`
- Modify: `components/admin/ui/button.tsx`
- Modify: `components/admin/ui/input.tsx`
- Modify: `components/admin/ui/select.tsx`
- Modify: `components/admin/ui/status.tsx`
- Modify: `components/admin/ui/table.tsx`
- Modify: `components/admin/ui/data-table.tsx`
- Modify: `components/admin/skeleton/**` only where geometry must match the final shell
- Preserve and complete: current uncommitted dashboard files under `app/(admin)/admin/_components/`
- Test: `tests/admin-primitives-contract.test.ts`
- Test: `tests/admin-nav.test.ts`
- Test: `tests/admin-dashboard-render.test.ts`
- Test: `tests/admin-dashboard-analytics.test.ts`
- Test: `tests/dashboard-reference-model.test.ts`

**Consumes:** Existing `AdminShell`, admin navigation data, dashboard projection interfaces, and accepted fixture-backed dashboard composition.

**Produces:** Stable shared protected-admin frame and primitives used by every later task. Desktop utility bar is normal-flow with exact 16 px sidebar separation; mobile menu remains accessible.

- [ ] Record exact starting branch, HEAD, dirty paths, and protected untracked files in `.superpowers/sdd/progress.md`. Do not change Git state.
- [ ] Add focused assertions proving the real logo, five Russian navigation labels, non-sticky utility bar contract, current-route state, and preserved mobile menu semantics. Tests must assert semantic markers or component output, not arbitrary CSS class lists.
- [ ] Run `npm test -- tests/admin-primitives-contract.test.ts tests/admin-nav.test.ts tests/admin-dashboard-render.test.ts tests/admin-dashboard-analytics.test.ts tests/dashboard-reference-model.test.ts`; new assertions must fail before shell remediation.
- [ ] Consolidate shell spacing, surfaces, typography, buttons, fields, status pills, panels, tables, and skeleton geometry into shared owners. Remove route-specific duplicates only when their replacement is already consumed.
- [ ] Keep global search decorative unless an existing route already supplies behavior. Do not create a search API.
- [ ] Preserve accepted dashboard component hierarchy and real-data adapter. Do not replace it with Superdesign fixture HTML.
- [ ] Run the focused test command again, then `npx prettier --check "app/(admin)/layout.tsx" "app/(admin)/admin/_components/**/*.{ts,tsx,css}" "components/admin/**/*.{ts,tsx,css}"` and `git diff --check`.
- [ ] Inspect `/admin` at `1536x1024`, `1440x900`, and `390x844`. Confirm utility bar scrolls away, desktop sidebar stays aligned, mobile navigation works, and no page overflow exists.
- [ ] Stop for user shell/dashboard acceptance.
- [ ] After acceptance, commit only Task 1 owned files with `feat(admin): finalize redesigned admin shell`.

### Task 2: Implement approved list screens and catalog subroutes

**Files:**

- Modify: `app/(admin)/admin/catalog/_components/catalog-tabs.tsx`
- Modify: `app/(admin)/admin/catalog/products/page.tsx`
- Modify: `app/(admin)/admin/catalog/products/_components/product-filters.tsx`
- Modify: `app/(admin)/admin/catalog/products/_components/product-table.tsx`
- Modify: `app/(admin)/admin/orders/page.tsx`
- Modify: `app/(admin)/admin/orders/_components/order-filters.tsx`
- Modify: `app/(admin)/admin/orders/_components/order-table.tsx`
- Modify: `app/(admin)/admin/customers/page.tsx`
- Modify: `app/(admin)/admin/customers/_components/customer-filters.tsx`
- Modify: `app/(admin)/admin/customers/_components/customer-table.tsx`
- Modify: `app/(admin)/admin/marketing/page.tsx`
- Modify: `app/(admin)/admin/marketing/_components/coupon-filters.tsx`
- Modify: `app/(admin)/admin/marketing/_components/coupon-table.tsx`
- Modify presentation only: category, option, room, and stock list/table files under `app/(admin)/admin/catalog/**`
- Test: `tests/admin-catalog-read.test.ts`
- Test: `tests/admin-customers-render.test.ts`
- Test: `tests/admin-coupons-render.test.ts`
- Test: `tests/admin-stock-cell.test.tsx`
- Test: `tests/admin-route-contract.test.ts`

**Consumes:** Task 1 shell/primitives plus existing list DTOs, query parameters, pagination, actions, and route links.

**Produces:** Four approved primary list compositions plus visually consistent categories, options, rooms, and stock subroutes.

- [ ] Add focused render assertions for each list: heading/action, preserved query controls, table semantics, existing status labels, existing pagination links, and correct detail/edit destinations.
- [ ] Run `npm test -- tests/admin-catalog-read.test.ts tests/admin-customers-render.test.ts tests/admin-coupons-render.test.ts tests/admin-stock-cell.test.tsx tests/admin-route-contract.test.ts`; new presentation contracts must fail first.
- [ ] Port product-list composition from `.superdesign/tmp/catalog-current.html`; bind existing product DTOs, images, category, SKU count, article, price, stock, active state, pagination, and filters. Preserve five catalog tabs.
- [ ] Port order-list composition from `.superdesign/tmp/orders-register.html`; bind only current order fields and statuses. Do not add unsupported KPI queries. Any summary strip must use existing page data or be omitted.
- [ ] Port customer-list composition from `.superdesign/tmp/customers-register.html`; bind current customer totals, order counts, roles/segments only where existing DTOs provide them. Do not infer lifetime analytics absent from the projection.
- [ ] Port coupon-list composition from `.superdesign/tmp/coupons-register.html`; bind existing coupon code, type, amount, limits, dates, usage, and active state. Keep route `/admin/marketing`.
- [ ] Apply Task 1 list primitives to categories, options, rooms, and stock without changing their information architecture or action bindings.
- [ ] Preserve empty states, validation/error banners, pending states, bulk controls where present, and bounded horizontal table scrolling.
- [ ] Run the focused test command, touched-file Prettier, and `git diff --check`.
- [ ] Inspect product, order, customer, coupon, category, option, room, and stock lists at `1440x900` and `390x844`; compare primary routes against approved drafts.
- [ ] Stop for user list-screen acceptance.
- [ ] Commit with `feat(admin): apply approved admin list screens`.

### Task 3: Implement product and coupon create/edit forms

**Files:**

- Modify: `app/(admin)/admin/catalog/products/_components/product-form.tsx`
- Modify: `app/(admin)/admin/catalog/products/_components/sku-matrix.tsx`
- Modify: `app/(admin)/admin/catalog/products/_components/specs-editor.tsx`
- Modify: `components/admin/media/image-preview-card.tsx`
- Modify: `components/admin/media/image-uploader.tsx`
- Modify presentation only: product `new/page.tsx` and `[id]/edit/page.tsx`
- Modify: `app/(admin)/admin/marketing/_components/coupon-form.tsx`
- Modify presentation only: marketing `new/page.tsx` and `[id]/edit/page.tsx`
- Modify presentation only: category, option, and room forms to consume shared form sections
- Test: `tests/admin-products-action.test.ts`
- Test: `tests/admin-sku-matrix.test.ts`
- Test: `tests/admin-product-media.test.ts`
- Test: `tests/admin-media.test.ts`
- Test: `tests/admin-coupons-action.test.ts`
- Test: `tests/admin-coupons-render.test.ts`

**Consumes:** Existing product/coupon form props and server actions. Approved form drafts define layout only.

**Produces:** One shared create/edit product form, one shared create/edit coupon form, and consistent secondary catalog forms.

- [ ] Add focused structural assertions for labelled groups, current fields, validation summaries, pending/disabled controls, destructive confirmations, SKU row editing, media controls, and create/edit mode differences.
- [ ] Run `npm test -- tests/admin-products-action.test.ts tests/admin-sku-matrix.test.ts tests/admin-product-media.test.ts tests/admin-media.test.ts tests/admin-coupons-action.test.ts tests/admin-coupons-render.test.ts`; new form-composition assertions must fail first.
- [ ] Port product form composition from `.superdesign/tmp/product-editor.html`. Keep every existing canonical field and binding: basics, category/room, descriptions/specs, media, 360 contract, options, combination keys, article numbers, prices, old prices, stock, active flags, validation, and delete behavior.
- [ ] Use existing Cloudinary upload/sign/delete controls. Do not replace uploads with static mock controls and do not change folder allowlist behavior.
- [ ] Port coupon form composition from `.superdesign/tmp/coupon-editor.html`. Preserve existing discount type/value, minimum total, maximum discount, usage limits, customer limits, date bounds, active state, validation, and delete behavior. Omit any mock-only condition unsupported by current schema/action.
- [ ] Apply shared grouped form panels to category, option, and room forms without adding fields or changing actions.
- [ ] Run the focused test command, `npm run typecheck` because shared form props and client boundaries are touched, touched-file Prettier, and `git diff --check`.
- [ ] Inspect product new/edit and coupon new/edit at `1440x900` and `390x844`; exercise one validation error, one pending state, SKU overflow, media preview, and destructive dialog.
- [ ] Stop for user form acceptance.
- [ ] Commit with `feat(admin): apply approved admin form screens`.

### Task 4: Implement order and customer detail screens

**Files:**

- Modify: `app/(admin)/admin/orders/_components/order-detail.tsx`
- Modify: `app/(admin)/admin/orders/_components/order-status-actions.tsx`
- Modify presentation only: `app/(admin)/admin/orders/[id]/page.tsx`
- Modify: `app/(admin)/admin/customers/_components/customer-detail.tsx`
- Modify: `app/(admin)/admin/customers/_components/role-toggle.tsx`
- Modify presentation only: `app/(admin)/admin/customers/[id]/page.tsx`
- Test: `tests/admin-order-detail-render.test.ts`
- Test: `tests/admin-order-transition.test.ts`
- Test: `tests/admin-order-cancel-invariants.test.ts`
- Test: `tests/admin-customers-render.test.ts`
- Test: `tests/admin-customers-action.test.ts`

**Consumes:** Existing immutable order snapshot projection, payment/delivery display, guarded transitions/cancellation, customer details, addresses, order history, and role actions.

**Produces:** Approved operational order detail and customer profile without backend changes.

- [ ] Add focused render assertions for order header, snapshot items, totals, payment/delivery details, current transition actions, cancellation affordance, history, customer link, customer contacts, addresses, order history, and role controls.
- [ ] Run `npm test -- tests/admin-order-detail-render.test.ts tests/admin-order-transition.test.ts tests/admin-order-cancel-invariants.test.ts tests/admin-customers-render.test.ts tests/admin-customers-action.test.ts`; new composition assertions must fail first.
- [ ] Port order detail composition from `.superdesign/tmp/order-detail.html`. Use only existing statuses/actions. Never render mock transition steps, services, or timeline events absent from current projection.
- [ ] Preserve cancellation reason, payment/stock invariants, stale-write/conflict behavior, immutable item snapshots, and pending/disabled states.
- [ ] Port customer detail composition from `.superdesign/tmp/customer-detail.html`. Bind current contacts, addresses, order history, totals, role state, and permitted role mutations. Omit mock-only notes, segments, messaging, or marketing controls unless existing production contracts already expose them.
- [ ] Preserve last-admin/self-role protections and existing error states.
- [ ] Run the focused test command, touched-file Prettier, and `git diff --check`.
- [ ] Inspect one paid order, one COD/cancelled order, one normal customer, and one ADMIN customer at `1440x900` and `390x844`.
- [ ] Stop for user detail-screen acceptance.
- [ ] Commit with `feat(admin): apply approved admin detail screens`.

### Task 5: Loading, error, responsive, and cross-route integration

**Files:**

- Modify presentation only: `app/(admin)/admin/loading.tsx`, `error.tsx`, and route-local `loading.tsx` files
- Modify: `components/admin/skeleton/**`
- Modify: `components/admin/admin-mobile-menu.tsx`
- Test: `tests/admin-primitives-contract.test.ts`
- Test: `tests/admin-route-contract.test.ts`
- Test: `tests/phase-5-route-contract.test.ts`

**Consumes:** Final shared primitives and all implemented route templates.

**Produces:** Consistent loading/error/mobile behavior across every protected admin route.

- [ ] Add focused assertions covering shell ownership, all protected route templates, loading/error semantics, mobile navigation labels, and absence of duplicated legacy Ritm presentation.
- [ ] Run `npm test -- tests/admin-primitives-contract.test.ts tests/admin-route-contract.test.ts tests/phase-5-route-contract.test.ts`; new integration assertions must fail first.
- [ ] Align skeleton and error geometry with final list/form/detail templates. Keep errors actionable and preserve retry behavior.
- [ ] Verify active navigation, breadcrumbs, direct URL loading, back navigation, internal table scroll, dialog focus, keyboard traversal, reduced motion, and utility-bar document-flow behavior.
- [ ] Remove superseded route-specific presentation only after `rg` proves no live import remains. Preserve source files outside Task ownership.
- [ ] Run focused tests, touched-file Prettier, `npm run typecheck`, and `git diff --check`.
- [ ] Inspect representative routes at `1536x1024`, `1440x900`, and `390x844`; capture final screenshots for dashboard, four lists, two forms, and two details.
- [ ] Commit with `fix(admin): complete redesigned route integration`.

### Task 6: Final verification and local acceptance

**Files:**

- Create: `.superpowers/sdd/admin-redesign-screen-set-report.md`
- Update: `.superpowers/sdd/progress.md`
- Update: `docs/roadmap/STATUS.md`
- Update: `docs/roadmap/DECISIONS.md` only if implementation reveals a new architecture decision

**Produces:** One verified local candidate. No push or PR.

- [ ] Record exact base, HEAD, commits, owned diff, visual references, focused results, and unchanged backend/security boundaries.
- [ ] Verify Git identity without changing it. Scan tracked diff for secret candidates without printing values. Confirm protected Phase 2 untracked files remain untouched.
- [ ] Run `git diff --check` and scan for `.only`, `.skip`, `test.todo`, `describe.todo`, placeholder text, and active `Ritm` presentation.
- [ ] Run completion gate once:

```powershell
npm run format
npm run gate
npm run build
npm run e2e -- e2e/admin-phase-5.spec.ts --workers=1 --retries=0
```

- [ ] If gate fails, stop the sequence, diagnose with focused checks, fix bounded cause, rerun affected checks, then repeat the full gate only when the fix invalidates full evidence.
- [ ] Capture the nine approved protected templates at `1440x900` and representative mobile templates at `390x844`. Record overflow, console errors, focus/keyboard behavior, loading/error states, and parity findings.
- [ ] Stop for user local visual acceptance. Do not push, deploy, open a PR, merge, delete the branch, or begin Phase 6.
- [ ] After acceptance, commit documentation with `docs(admin): record approved screen set closeout`.

## Self-Review

- All approved screen drafts map to an existing protected route and current DTO/action owner.
- Shared shell/primitives precede route work; list, form, and detail tasks remain independently reviewable.
- Superdesign fixture values never become production truth.
- No task changes Prisma, actions, API routes, authorization, providers, payments, stock, snapshots, or media security.
- Top utility bar is explicitly non-sticky with a 16 px desktop sidebar gap.
- Focused verification occurs per task; complete gate occurs once.
- User visual checkpoints exist after shell/dashboard, lists, forms, details, and final integration.
- No push/PR/merge authorization is inferred.

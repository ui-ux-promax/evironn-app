# Selected Evironn Admin Redesign

**Status:** User-approved visual direction on 2026-08-26.  
**Approved visual references:**

- `docs/design/admin-redesign/concepts/06-selected-evironn-admin.png` — protected dashboard desktop.
- `docs/design/admin-redesign/concepts/07-catalog-products-reference.png` — protected catalog product list desktop.
- `docs/design/admin-redesign/concepts/08-product-form-reference-v2.png` — protected product/SKU/media/360 form desktop.
- `docs/design/admin-redesign/concepts/09-order-detail-reference.png` — protected order detail desktop.
- `docs/design/admin-redesign/concepts/10-mobile-catalog-reference-v2.png` — protected catalog mobile.

**Scope:** Presentation-only redesign of protected `/admin` and public read-only `/demo-admin`.

## Intent

Replace the accepted Phase 5 presentation with the selected light operational dashboard language while preserving every completed Phase 5 route, authorization boundary, read/write contract, DTO, action, fixture, and integration. The selected image is a composition reference, not a source of business truth: generated copy, logo artwork, metrics, statuses, and furniture names must be replaced by the real Evironn assets and existing application projections.

## Design direction

- Preserve the reference's macro composition: a full-height labelled sidebar, a top utility/search bar, a dominant revenue panel, an order funnel/status panel, furniture inventory cards, category distribution, and a recent-orders table.
- Use the real `/assets/evironn-logo.svg`; never reproduce the generated lowercase leaf mark.
- Use `Golos Text` through the existing `--ev-font-*` tokens for headings, body copy, controls, and numeric values.
- Use the existing Evironn palette: warm off-white page, white surfaces, near-black warm text, muted forest green for primary/positive states, and restrained warm amber/terracotta for warnings.
- Use the existing Evironn geometry: 14/20/28 px card radii, pill controls where appropriate, thin warm borders, and restrained soft shadows.
- Keep the interface quiet and operational. No neon, glassmorphism, purple/blue SaaS branding, decorative gradients, invented font, or new icon language.

## Navigation and copy

The labelled desktop sidebar contains exactly:

1. `Сводка` → `/admin`
2. `Каталог` → `/admin/catalog/products`
3. `Заказы` → `/admin/orders`
4. `Клиенты` → `/admin/customers`
5. `Промокоды` → `/admin/marketing`
6. `Открыть магазин` → `/`

Catalog tabs remain `Товары`, `Категории`, `Опции`, `Комнаты`, and `Остатки`. Mobile navigation exposes the same destinations through the existing accessible menu boundary.

Visible UI is Russian. Ruble formatting, status labels, order numbers, customer names, product names, and dates come from existing formatters and projections. The search field is a visual utility unless an existing route already implements its query behavior; the redesign must not invent global search backend scope.

## Protected admin architecture

- `app/(admin)/layout.tsx` keeps server-side `requireAdminPage()` before rendering the client shell.
- `components/admin/admin-shell.tsx` remains the protected shell owner.
- `lib/admin/nav.ts` remains the primary navigation authority.
- Shared admin tokens and primitives own visual consistency; route pages do not duplicate shell styling.
- Existing route-local components retain their data interfaces. Presentation may be reorganized, but queries, actions, validation, stock/payment invariants, media rules, and error semantics do not change.

## Dashboard

The protected dashboard uses current live projections and maps them into the selected composition:

- `Выручка за период`: existing KPI and daily series.
- Compact metrics: orders, average order value, and cancellations.
- `Заказы`: existing status distribution rendered as a compact funnel or ordered status stack. Do not introduce storefront visit/cart conversion numbers because Phase 5 has no authoritative analytics source for them.
- `Товары на складе`: existing best-seller/low-stock/catalog projections with real product media and stock counts.
- `Популярные категории`: derive only from existing canonical category/product/order data. If the current projection cannot supply it without new backend work, retain the current best-seller/status module rather than fabricate data.
- `Последние заказы`: existing recent-order projection and links.

## Remaining protected routes

List pages, detail pages, and forms inherit the selected visual system without changing their information architecture:

- list pages: top utility bar, page title/action, filters, warm table surface, status pills, pagination;
- forms: page title/action, grouped white sections, existing validation and destructive-action affordances;
- details: summary header, state/actions, grouped operational panels, immutable history;
- catalog: existing five-tab hierarchy and SKU/media/360 controls;
- orders/customers/coupons: existing Phase 5 behavior and role/payment/stock protections.

The five approved visual references define the shared shell, table, form, detail, and mobile templates. Other routes must compose those templates; they must not introduce a separate visual direction.

## Demo admin

`/demo-admin` adopts the same visual language and primary navigation, but keeps its existing independent presentation boundary:

- no imports from protected `components/admin/**`;
- no Prisma, Auth.js, actions, mutation APIs, providers, or protected assets requiring authorization;
- synthetic deterministic fixtures only;
- persistent visible read-only disclosure;
- demo routes remain non-indexable.

Equivalent demo tokens may mirror protected values, but demo code remains independently owned under `components/demo-admin/**`.

## Responsive and accessibility behavior

- Desktop reference viewport: `1440×900`; selected dashboard composition is the visual source of truth.
- Mobile acceptance viewport: `390×844`; content becomes a single-column flow with no horizontal page overflow.
- The labelled desktop sidebar collapses into the existing accessible mobile menu pattern.
- Tables use their existing bounded responsive treatment instead of shrinking text below readable sizes.
- Preserve keyboard access, focus-visible rings, labels, semantic headings, reduced-motion behavior, dialogs, and status text independent of color.

## Verification policy

- Focused render/contract checks only during implementation tasks.
- No tests for static pixel values or individual Tailwind class lists.
- One full `npm run format`, `npm run gate`, `npm run build`, and critical admin/demo E2E sequence after the complete redesign.
- Visual acceptance is required twice: shell/dashboard first, then representative protected/demo route templates on desktop and mobile.
- No push, PR, or merge without separate user authorization.

## Non-goals

- No Prisma migration, seed change, provider call, environment-variable change, authorization change, route addition, business-rule change, or new dependency.
- No redesign of the storefront.
- No implementation of global search or new analytics tracking.
- No regeneration of product media.
- No modification of payment, stock, order snapshot, Cloudinary, or role-management semantics.

## Acceptance criteria

1. `/admin` matches the selected reference's macro layout and density while using real Evironn branding, Russian copy, `Golos Text`, and live existing data.
2. All protected admin routes share the selected shell and component language without functional regression.
3. All five demo routes share the same visual direction while remaining public, deterministic, read-only, and technically isolated.
4. Desktop and mobile representative captures have no page overflow, broken controls, missing states, or generated-placeholder content.
5. Focused checks, the single final quality gate, build, and critical E2E pass before delivery.

# Full Evironn Frontend Migration Design

## Status

Proposed correction to the storefront migration strategy. This document is the review gate before rewriting the authoritative roadmap and implementation plans.

## Problem statement

The current repository was bootstrapped from `fashion-shop`, including its RITM presentation. The original roadmap classified `D:\Новая папка (2)\evironn-clone` as a design archive and authorized only selected Evironn interfaces. That classification is wrong for the user's goal: `evironn-clone` is a complete, tested React/Vite frontend implementation and must be the normative UI source for the production Next.js application.

The Phase 2 pilot produced useful canonical catalog and product logic, but its temporary Tailwind presentation is not the accepted Evironn interface. The branch must not merge into `dev` until the full Phase 2 visual source has been ported and accepted.

## Correct source-of-truth model

| Concern                                                    | Normative source                                        | Target responsibility                                      |
| ---------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| Visual composition, copy, interaction, responsive behavior | `evironn-clone`                                         | Preserve rather than redesign                              |
| Route runtime, rendering, metadata                         | Next.js App Router in `evironn`                         | Adapt Vite routing to Next routes                          |
| Commerce, authentication, payments, security, operations   | `fashion-shop` foundation already copied into `evironn` | Reuse proven modules behind the Evironn UI                 |
| Furniture products, options, SKUs, stock, media            | Canonical Prisma furniture domain                       | Supply serializable page DTOs and enforce server authority |
| Product media production                                   | Dedicated per-product asset sessions                    | Add validated media packs without changing the page shell  |

`evironn-clone` and `fashion-shop` remain read-only. All production edits remain in `D:\Projects\evironn`.

## Audit evidence

The clone is an implementation, not a mockup:

- Complete shared `Header` and `Footer15`.
- Complete home page with eight major content sections.
- Chosen production variants: catalog B, cart A, checkout A, auth B, profile A, and order A.
- Complete product page with a fixed room plate, six aligned chair variants, and an interactive 360 viewer.
- Complete admin shell and not-found page.
- 35 contract/state/shell tests plus Playwright configuration.
- Shared design tokens and reduced-motion behavior in `src/index.css`.
- 75 statically referenced public assets totaling approximately 178 MB; the full asset archive contains experimental and source material that must not be copied wholesale.

The target currently contains only 10 files under `public/assets/products` totaling approximately 4.26 MB. Most of the production Evironn presentation has therefore not yet been migrated.

## Binding migration rules

1. Do not invent replacement interfaces when a production clone component already exists.
2. Port the selected JSX, CSS, state helpers, media behavior, copy, and responsive rules first; adapt only framework and data boundaries.
3. Do not convert existing CSS to Tailwind as a migration goal. Preserve and scope the proven CSS. Tailwind remains available for new adapters and foundation-only UI.
4. Install and reuse `framer-motion` and `react-icons` where the clone depends on them instead of rewriting animations and icons.
5. Replace `window.location` routing with App Router pages and `next/link` without changing visible behavior.
6. Keep interactive clone shells as focused Client Components. Fetch and authorize data in Server Components or server modules, then pass serializable DTOs.
7. Preserve pure clone state helpers and adapt their tests to Vitest. Do not hide behavior changes inside framework conversion.
8. Visual parity is a release requirement. Code review alone cannot approve a UI port.
9. Variant-picker/demo routes such as `/catalog-a`, `/catalog-c`, and `/login-variants` are design-development artifacts and are not production routes.
10. Do not merge Phase 2 until shell, home, selected catalog, and selected showcase PDP are visually accepted on desktop and mobile.

## Production route map

| Production route         | Clone source                                                                                            | Next target                                          | Data/behavior adapter                                              | Delivery stage |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ | -------------- |
| Shared storefront chrome | `components/Header.*`, `components/Footer15.*`, `src/index.css`                                         | shop layout and shared components                    | Next links, existing auth/cart display adapters                    | Phase 2A       |
| `/`                      | `HomePage` composition in `App.tsx`, `Hero`, editorial/nature/benefits/category/card/Instagram sections | `app/(shop)/page.tsx` and focused home components    | Preserve clone content/state; connect category/catalog URLs        | Phase 2A       |
| `/catalog`               | `catalog/CatalogVariantB.*`, primitives, card, filter state                                             | `app/(shop)/catalog/page.tsx` and catalog components | Existing Task 2 Prisma filters, facets, pagination, and DTOs       | Phase 2B       |
| `/product/[slug]`        | `components/ProductPage.*`, `productPageState`, `productVideo360`                                       | product route and scoped client scene                | Existing Task 3 canonical SKU resolver plus showcase media profile | Phase 2C       |
| `/cart`                  | `cart/CartVariantA.*`, primitives and state                                                             | existing cart route                                  | Canonical server cart and guest merge                              | Phase 3        |
| `/login`, `/register`    | `auth/AuthVariantB`, `AuthPage.*`                                                                       | auth route group                                     | Auth.js credentials, OAuth, verification                           | Phase 3        |
| `/profile`               | `profile/ProfilePage` variant A                                                                         | profile route                                        | User, addresses, wishlist, order summaries                         | Phase 3        |
| `/checkout`              | `checkout/CheckoutVariantA.*`                                                                           | checkout route                                       | Delivery, services, totals, payment methods                        | Phase 4        |
| `/orders/[number]`       | `order/OrderVariantA.*`                                                                                 | order route                                          | Immutable order snapshots and payment state                        | Phase 4        |
| `/admin/*`               | `admin/AdminShell.*`, primitives                                                                        | protected admin routes                               | Prisma CRUD and ADMIN authorization                                | Phase 5        |
| `/demo-admin/*`          | Same selected admin visual system                                                                       | read-only demo routes                                | Synthetic fixtures only                                            | Phase 5        |
| Not found                | `not-found/NotFoundPage.*`                                                                              | App Router not-found files                           | Next navigation links                                              | Phase 2A       |

## Phase 2 recovery sequence

Phase 2 remains on `phase/02-storefront`, but it is executed across bounded sessions with durable handoffs. The branch gets one final PR only after all Phase 2 visual gates pass.

### Phase 2A — storefront foundation and complete home

- Integrate Evironn fonts, tokens, reset rules, focus treatment, and reduced-motion contract.
- Port `Header` and `Footer15` as the shared storefront chrome.
- Port the complete home composition in its current section order.
- Copy only production-referenced home fonts/images/videos, preserving URLs and verifying hashes/dimensions.
- Adapt internal navigation to real Next routes and URL filters.
- Keep existing clone animation/state helpers and tests.
- Remove inherited RITM home/header/footer presentation only after the Evironn replacements pass visual review.
- Stop for desktop/mobile comparison before Phase 2B.

### Phase 2B — selected catalog UI over canonical catalog logic

- Port selected `CatalogVariantB`, its primitives, card, CSS, and responsive behavior.
- Keep Task 2 parsing, canonical Prisma predicates, facets, server pagination, deterministic sorting, and furniture DTO projections.
- Replace clone mock catalog data with a narrow adapter from the server result.
- Preserve the clone filters' visible layout and behavior while making URL state authoritative.
- Temporarily point every catalog card to the showcase product URL.
- Stop for desktop/mobile comparison before Phase 2C.

### Phase 2C — exact showcase product page

- Port `ProductPage.tsx`, `ProductPage.css`, `productPageState.ts`, and `productVideo360.ts` without visual reinterpretation.
- Preserve the exact fixed room plate, chair placement, glass product panel, three upholstery choices, two wood choices, six aligned visual combinations, accordions, benefits, responsive behavior, reduced motion, and full-screen 360 interaction.
- Keep the existing furniture-background and product-color invariants; this stage generates no new media.
- Reuse Task 3 server-side option parsing, canonical selection, metadata, and structured data behind a showcase adapter.
- Synchronize selected visual combination with a canonical six-SKU matrix and `?option=...` URL state.
- Keep the add-to-cart control visually complete but decorative and non-mutating until Phase 3.
- Redirect non-showcase product routes to the showcase while their media packs are unavailable.
- Stop for desktop/mobile comparison and all six combination/360 checks.

## Showcase and future product onboarding

During Phase 2 every catalog card targets one showcase slug. The showcase is the existing prepared chair, not a generic room compositor for unrelated products.

The first profile contains:

- one fixed room background;
- three upholstery IDs: ivory, graphite, terracotta;
- two wood IDs: walnut, pine;
- six transparent, pixel-aligned product layers;
- one existing turntable video and poster;
- the clone's exact interaction behavior.

Products without a validated media pack do not receive fake scene imagery and do not expose their own PDP route from the catalog. A later onboarding session may enable a product only after its option matrix and assets pass the relevant background-removal and color-variant validation. The page shell is not rewritten during onboarding.

## Server/client boundary

Each migrated route follows the same adapter pattern:

```text
Next Server Page
  -> authentication/database/query modules
  -> serializable Evironn page DTO
  -> ported Client Shell where browser interaction is required
  -> preserved CSS and media behavior
```

Static or presentation-only sections remain Server Components when doing so does not change the clone behavior. Browser-dependent animation, video, pointer dragging, local disclosure state, and responsive media queries remain isolated Client Components.

The server remains authoritative for SKU, price, stock, coupon, delivery, order, payment, role, and review decisions. Ported client state cannot override those values.

## CSS and dependency strategy

- Import the Evironn root tokens once through the Next global stylesheet.
- Scope page CSS under existing Evironn root classes such as `.product-page`, `.cat-*`, `.cart-a`, and admin shell roots.
- Preserve class names during the first port to keep tested behavior and reduce visual drift.
- Resolve collisions deliberately; do not rename entire stylesheets mechanically.
- Use `next/font` only when it can reproduce the clone face. Keep local WOFF2 faces where they are part of the visual reference.
- Add `framer-motion` and `react-icons` at the clone-compatible versions unless a concrete Next incompatibility is demonstrated.

## Asset migration strategy

- Never copy `dist`, logs, generated previews, experimental picker assets, or the complete 382 MB archive.
- Copy production-referenced assets per delivery stage.
- Preserve public paths initially so CSS and state maps can be ported with minimal change.
- Verify every copied file by existence, size, dimensions/duration, and hash where the clone tests already define a contract.
- Verify every individual Git object remains within repository-host limits.
- If a required video exceeds a hosting limit, publish the unchanged asset under the Evironn Cloudinary folder and update only the media manifest; do not recompress silently.
- Retain poster/static fallbacks for every video path.

## Testing and visual acceptance

Every migrated route must satisfy four layers:

1. **Source contract tests** — adapt the relevant clone shell/state tests to Vitest.
2. **Foundation tests** — preserve existing Prisma/auth/commerce/security tests.
3. **Next integration tests** — verify routes, server DTOs, links, metadata, and forbidden mock/legacy reads.
4. **Visual/E2E acceptance** — compare clone and Next at agreed desktop and mobile viewports and exercise real interaction states.

Minimum Phase 2 visual states:

- Header desktop/mobile and navigation drawer.
- Complete home at desktop and mobile, including motion/reduced-motion states.
- Catalog default, filtered, empty, mobile filters, and card hover/focus states.
- Showcase product default and all six material combinations.
- Product 360 open, drag/scrub, pause/play, Escape close, reduced motion, and media failure fallback.
- Footer desktop/mobile.

A UI delivery is not complete when tests pass but the preview differs materially from the selected clone implementation. User visual acceptance blocks the next delivery stage and the Phase 2 PR.

## Existing work preservation

The following Phase 1/2 work remains valuable and must be reused:

- canonical furniture Prisma domain and Neon migration;
- option combination keys and SKU resolution;
- furniture seed infrastructure;
- server-side catalog filters, facets, sorting, and pagination;
- canonical product selection and media fallback logic;
- commerce/security/operations modules inherited from the foundation;
- focused unit tests covering those modules.

The temporary Task 2/3 visual shells may be replaced. No history rewrite, reset, or destructive cleanup is authorized by this design.

## Documentation corrections after approval

After the user approves this design:

1. Amend ADR-002 so `evironn-clone` is the read-only normative frontend implementation source, not merely a design archive.
2. Add an ADR stating that exact source-porting precedes visual redesign and that existing CSS is preserved by default.
3. Replace the current Phase 2 roadmap with Phase 2A/2B/2C and visual gates.
4. Update `STATUS.md` to record that Task 2/3 logic is retained but their temporary presentation is not accepted.
5. Replace the obsolete pilot workflow with the full frontend migration workflow.
6. Create task-level implementation plans only after those corrections are reviewed.

## Non-goals

- Redesigning Evironn.
- Generating new product media during the initial frontend port.
- Activating the product add-to-cart mutation before Phase 3.
- Shipping mock cart/auth/checkout state as production behavior.
- Copying variant-picker routes or development-only assets into production.
- Merging the current Phase 2 branch before complete visual acceptance.

## Acceptance of this design

Approval means the migration proceeds from the global Evironn shell and complete home, then catalog, then showcase PDP. It does not authorize implementation until the authoritative roadmap/decisions are corrected and a task-level plan for Phase 2A is reviewed.

# Evironn migration roadmap

## Goal

Deliver near-complete functional parity with the `fashion-shop` commerce platform while replacing its fashion domain and presentation with the complete Evironn furniture frontend. `D:\Новая папка (2)\evironn-clone` is the read-only normative frontend implementation source. `D:\Projects\fashion-shop` is the read-only technical source. Production work lives in `D:\Projects\evironn`.

## Architecture retained

- Next.js App Router, React, TypeScript, Tailwind CSS
- Prisma with Neon Postgres
- Auth.js, Cloudinary, Resend, YooKassa, DaData
- Upstash, Sentry, CI, Vercel
- Proven commerce, payment reliability, security, and operational modules where domain-neutral

Visual composition, copy, interactions, responsive behavior, CSS, and selected route variants come from `evironn-clone`. Next.js routing, rendering, metadata, Prisma, authentication, commerce, payments, security, CI, and operations come from the production foundation. Framework and data boundaries are adapted without redesigning the accepted Evironn frontend. Blog, newsletter, FAQ, and legal content are deferred beyond MVP.

## Delivery rules

- One phase per Codex session and one branch per phase.
- No phase starts before its predecessor is accepted and merged into `dev`.
- Every phase branch starts from current `dev`.
- Pull requests target `dev`, use English title/body, pass the full quality gate, and merge with a merge commit.
- UI phases require user desktop/mobile visual acceptance before merge.
- Final release uses an English `dev` to `main` pull request and a merge commit.

## Verification cadence

- During each implementation task, run only focused tests for changed behavior, formatting/lint checks for touched files, and critical task-level E2E only when required by the affected user path.
- Run task-level type checking only for changes that affect shared types, DTOs, Prisma/schema boundaries, server contracts, framework configuration, or another broad compile-time surface.
- Task reviewers inspect the task diff and reuse fresh focused evidence; they do not repeat the full project gate without a concrete cross-cutting risk.
- After all tasks in an approved delivery are complete, run the full completion gate once. For Phase 2, each acceptance-gated delivery (`2A`, `2B`, `2C`) is a completion boundary.
- After final-review remediation, rerun affected focused checks. Repeat the full completion gate only if the remediation invalidated it or changed a cross-cutting surface.
- Final completion gate:

```text
npm run format
npm run gate
npm run build
npm run e2e -- <critical current-delivery scenarios>
```

## Phase 1 — furniture domain and database

Branch: `phase/01-furniture-domain`

- Replace fashion products with categories, rooms, products, option groups, option values, SKUs, variant selections, and media.
- Give each SKU a canonical combination key, price, optional old price, stock, active flag, and unique article number.
- Store immutable order-item snapshots for SKU, configuration, image, and pricing.
- Allow one optional 360 product per category using turntable video, poster, and fallback only.
- Retain and adapt users, addresses, carts, wishlists, coupons, reviews, orders, and payments.
- Create a clean Prisma migration and seed 12–15 furniture products, including the existing 360 product.
- Test option matrices, combination keys, SKU uniqueness, snapshots, and seed integrity.

## Phase 2 — storefront

Branch: `phase/02-storefront`

Phase 2 uses three acceptance-gated deliveries on one branch. Existing canonical catalog and PDP logic stays; temporary RITM-derived presentation does not qualify as delivered UI.

### Phase 2A — storefront foundation and complete home

- Port the exact Evironn fonts, tokens, reset, focus, reduced-motion behavior, `Header`, `Footer15`, not-found page, and complete eight-section home composition.
- Preserve clone JSX structure, class names, scoped CSS, interaction helpers, copy, responsive behavior, `framer-motion`, and `react-icons` unless Next.js requires a documented adapter.
- Copy only production-referenced Phase 2A assets; do not copy the full archive or development variants.
- Replace Vite routing with App Router pages and `next/link`; connect navigation to production routes and catalog query URLs.
- Remove inherited RITM shell/home presentation only after replacement tests pass.
- Stop for user desktop/mobile visual acceptance before Phase 2B.

### Phase 2B — selected catalog UI

- Port selected `CatalogVariantB`, its primitives, cards, CSS, interactions, and responsive states.
- Keep Task 2 server filters, facets, deterministic sorting, pagination, Prisma predicates, and furniture card DTOs.
- Make URL state authoritative through a narrow server-to-clone adapter.
- Temporarily point every product card to the single showcase URL.
- Stop for user desktop/mobile visual acceptance before Phase 2C.

### Phase 2C — exact showcase PDP

- Port the complete clone `ProductPage` and its fixed room, glass panel, six upholstery/wood visual combinations, accordions, benefits, responsive behavior, reduced motion, and full-screen 360 interaction.
- Reuse Task 3 server option parsing, canonical SKU resolution, metadata, structured data, and resilient media logic through a showcase DTO.
- Keep add-to-cart visually complete but decorative until Phase 3.
- Redirect non-showcase product routes to the showcase until validated product media packs exist.
- Stop for desktop/mobile acceptance plus all six combinations and 360 states.

Phase 2 merges only after all three deliveries pass automated checks and user visual acceptance.

## Phase 3 — commerce and authentication

Branch: `phase/03-commerce-auth`

- Adapt Auth.js credentials, Google OAuth, verification, roles, and middleware.
- Implement guest cart/wishlist and merge both after sign-in.
- Port selected clone interfaces: cart A, auth B, and profile A. Connect them to production Auth.js and canonical commerce state; do not ship clone mocks.
- Deliver profile, addresses, coupons, server-side totals, and stock validation.
- Prepare reviews with purchase eligibility enforcement.

## Phase 4 — checkout, payments, and orders

Branch: `phase/04-checkout-orders`

- Support Moscow and Moscow Region courier, showroom pickup, and pickup point delivery.
- Add delivery windows, floor/lift, carrying, assembly, and furniture removal.
- Recalculate all rates, services, totals, and stock on the server.
- Route online payment to YooKassa sandbox; treat `cod` as cash on delivery.
- Create orders, snapshots, and stock deductions transactionally.
- Preserve idempotent webhook processing, payment resync, cancellation, and stock restoration.
- Complete verified-purchase reviews.
- Port checkout A and order A, connecting them to server-authoritative delivery, payment, and order state; do not ship clone mocks.

## Phase 5 — admin and demo admin

Branch: `phase/05-admin-demo`

- Protect `/admin` with the ADMIN role.
- Deliver dashboard, categories, products, option matrix, SKUs, stock, media/360, orders, customers, roles, and coupons.
- Reuse Cloudinary signing/deletion with an Evironn-only folder allowlist.
- Keep `/demo-admin` public, read-only, synthetic, independent from Prisma and mutations.
- Port the accepted clone admin visual system for both protected admin and demo admin shells.
- Require admin preview acceptance before merge.

## Phase 6 — hardening and release

Branch: `phase/06-hardening-release`

- Finish Upstash, Sentry, security headers, CSRF, health endpoints, and idempotent demo reset.
- Configure Vercel/Neon environments and sandbox integrations.
- Verify production smoke tests, responsive behavior, error fallbacks, and secret hygiene.
- Complete runbooks and deployment documentation.
- Merge the phase into `dev`, then release through `dev` to `main`.

## Required quality gate

Run this complete gate at the end of the current phase or acceptance-gated delivery, not after every implementation task:

```text
npm run format
npm run gate
npm run build
npm run e2e -- <current phase scenarios>
```

Required coverage across the roadmap: option matrices and SKU uniqueness; filters and pagination; totals, delivery, coupons, stock concurrency and restoration; guest state merge; registration, verification, OAuth, ADMIN protection; cash and YooKassa flows; webhook idempotency and cancellation; purchase-gated reviews; admin CRUD; Cloudinary allowlist; read-only demo admin; video and external-service fallbacks.

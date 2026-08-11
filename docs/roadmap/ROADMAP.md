# Evironn migration roadmap

## Goal

Deliver near-complete functional parity with the `fashion-shop` commerce platform while replacing its fashion domain and presentation with the Evironn furniture store. `D:\Новая папка (2)\evironn-clone` is a read-only local design archive. Production work lives in `D:\Projects\evironn`.

## Architecture retained

- Next.js App Router, React, TypeScript, Tailwind CSS
- Prisma with Neon Postgres
- Auth.js, Cloudinary, Resend, YooKassa, DaData
- Upstash, Sentry, CI, Vercel
- Proven commerce, payment reliability, security, and operational modules where domain-neutral

Evironn UI, furniture data model, catalog behavior, checkout services, admin forms, and related DTOs replace the inherited fashion implementation. Blog, newsletter, FAQ, and legal content are deferred beyond MVP.

## Delivery rules

- One phase per Codex session and one branch per phase.
- No phase starts before its predecessor is accepted and merged into `dev`.
- Every phase branch starts from current `dev`.
- Pull requests target `dev`, use English title/body, pass the full quality gate, and merge with a merge commit.
- UI phases require user desktop/mobile visual acceptance before merge.
- Final release uses an English `dev` to `main` pull request and a merge commit.

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

- Port selected Evironn home, catalog, and product detail interfaces.
- Add server pagination and URL-driven catalog filters.
- Resolve selected options to a SKU on `/product/[slug]`; update price, stock, and media.
- Use Tailwind for layout/UI; isolate complex effects and animation CSS.
- Add reduced-motion behavior plus turntable poster/fallback handling.
- Require desktop/mobile preview acceptance before merge.

## Phase 3 — commerce and authentication

Branch: `phase/03-commerce-auth`

- Adapt Auth.js credentials, Google OAuth, verification, roles, and middleware.
- Implement guest cart/wishlist and merge both after sign-in.
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

## Phase 5 — admin and demo admin

Branch: `phase/05-admin-demo`

- Protect `/admin` with the ADMIN role.
- Deliver dashboard, categories, products, option matrix, SKUs, stock, media/360, orders, customers, roles, and coupons.
- Reuse Cloudinary signing/deletion with an Evironn-only folder allowlist.
- Keep `/demo-admin` public, read-only, synthetic, independent from Prisma and mutations.
- Require admin preview acceptance before merge.

## Phase 6 — hardening and release

Branch: `phase/06-hardening-release`

- Finish Upstash, Sentry, security headers, CSRF, health endpoints, and idempotent demo reset.
- Configure Vercel/Neon environments and sandbox integrations.
- Verify production smoke tests, responsive behavior, error fallbacks, and secret hygiene.
- Complete runbooks and deployment documentation.
- Merge the phase into `dev`, then release through `dev` to `main`.

## Required quality gate

```text
npm run format
npm run gate
npm run build
npm run e2e -- <current phase scenarios>
```

Required coverage across the roadmap: option matrices and SKU uniqueness; filters and pagination; totals, delivery, coupons, stock concurrency and restoration; guest state merge; registration, verification, OAuth, ADMIN protection; cash and YooKassa flows; webhook idempotency and cancellation; purchase-gated reviews; admin CRUD; Cloudinary allowlist; read-only demo admin; video and external-service fallbacks.

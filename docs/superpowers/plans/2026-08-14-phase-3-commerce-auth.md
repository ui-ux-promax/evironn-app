# Phase 3 Commerce and Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Deliver Phase 3 authentication, canonical-SKU cart and wishlist behavior, Cart Variant A, Auth Variant B, Profile Variant A, addresses, coupons, server-authoritative totals and stock validation, and purchase-gated review readiness without entering Phase 4 scope.

**Architecture:** Keep the existing Auth.js, verification, ownership-cookie, merge, Prisma, coupon, profile, address, and review foundations. Next Server Pages and server modules produce serializable Evironn DTOs; thin client controllers connect those DTOs and existing server actions/API routes to clone-derived presentation shells. The server remains authoritative for identity, roles, callback destinations, SKU resolution, stock, prices, discounts, totals, ownership, and review eligibility.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript 5, Auth.js v5, Prisma 6 with Neon, Zod, Zustand, React Icons, clone CSS, Vitest/Testing Library, and Playwright.

## Global Constraints

- Execute implementation only after the coordinator completes the Execution Preflight below and creates `phase/03-commerce-auth` from `origin/dev` at `b31194a`. The preflight authorizes only the listed fetch/fast-forward/branch-creation commands; this plan does not authorize pushing, pull requests, merging, branch deletion, resetting, or cleaning.
- Preserve the existing untracked plans. The only plan file governed by this document is docs/superpowers/plans/2026-08-14-phase-3-commerce-auth.md.
- Treat D:\Projects\fashion-shop and D:\Новая папка (2)\evironn-clone as read-only. All implementation edits belong in D:\Projects\evironn.
- Reuse proven Evironn behavior and the technical source. Do not replace stable Auth.js, verification, ownership, merge, coupon, profile, address, or review logic merely to match clone state organization.
- Assume ADR-001, ADR-007, ADR-010, ADR-012, ADR-013, ADR-014, and the existing canonical furniture SKU schema. The planning audit found no new architecture choice and therefore requires no DECISIONS.md change.
- Do not edit prisma/schema.prisma and do not create a Prisma migration. User, Address, Coupon, Review, Wishlist, Cart, CartItem, Product, Sku, SkuOptionValue, ProductMedia, SkuMedia, Order, and OrderItem already provide the Phase 3 relations.
- The server owns SKU existence and active state, stock ceilings, prices, old prices, line totals, coupon validity, coupon discount, merchandise total, ownership, roles, verification, and review eligibility. Client numbers and IDs are input or display values only.
- Sanitize every callback destination with safeCallbackUrl. Never redirect to a client-supplied origin. Keep generic credential errors, pre-Argon2 rate limiting, constant-time unknown-user password checks, verified-email gating, JWT/session roles, ADMIN middleware enforcement, and disabled dangerous OAuth account linking.
- Preserve signed HttpOnly pending-verification cookies, rate limits, expiry, attempt limits, one-time tickets, and Google email verification. Tests must set RESEND_API_KEY to an empty value and use E2E_TEST_CODE=424242; no test or preview run sends a real verification email.
- Playwright may mutate only a separately supplied disposable database through `E2E_DATABASE_URL`, optional `E2E_DATABASE_URL_UNPOOLED`, and `E2E_DATABASE_ALLOW_WRITES=1`. It must never fall back to `POSTGRES_URL`, `DATABASE_URL`, or any developer, Preview, or Production database. Unit implementation may proceed while these keys are pending, but no Playwright run or Phase 3 completion claim is allowed until the coordinator confirms the disposable database without printing its value.
- Do not implement checkout, delivery rates or slots, payment, order creation/cancellation/reorder/receipt behavior, admin behavior, or performance work. Existing order history may be read for profile presentation and review eligibility only.
- Preserve the accepted Phase 2 header, footer, Catalog Variant B, showcase PDP composition, six option combinations, 360 behavior, responsive behavior, and reduced-motion behavior. Only connect the already-visible PDP add controls and append no new PDP section.
- Preserve the recorded initial Preview loading debt. Do not change the ProductPage handoff timeout, preload strategy, fonts, caching, or route rendering for performance.
- External Google OAuth is not automated against Google in Playwright. Unit/source/controller tests verify provider wiring and safe callback propagation; a real configured Google login is a separate manual Preview smoke after push authorization.
- Use focused tests and touched-file formatting during Tasks 1–8. Run the complete delivery gate only in Task 9, after review findings are resolved.
- Every task writes local evidence to `.superpowers/sdd/phase-3-task-N-report.md` and updates the tracked `.superpowers/sdd/progress.md`. Agent messages use the coordinator-requested caveman ultra style. Reports, code, tests, commits, this plan, STATUS.md, and all durable technical descriptions use normal technical English. New task/delivery reports remain intentionally ignored local evidence unless the user explicitly authorizes force-adding them; the tracked plan, progress file, and STATUS.md are the durable Git handoff.

---

## Execution Preflight — Coordinator Only

Run before Task 1 and before any implementation edit:

    git fetch origin --prune
    git merge-base --is-ancestor ca2323f origin/dev
    git switch dev
    git merge --ff-only origin/dev
    git switch -c phase/03-commerce-auth

- The ancestry command must exit `0`; `origin/dev` must resolve to `b31194a` or a later merge commit containing `ca2323f`.
- If `phase/03-commerce-auth` already exists, do not recreate, reset, or rebase it. Switch to it and verify its merge base with `origin/dev` before continuing.
- Confirm `git status --short --branch` reports `phase/03-commerce-auth`. Preserve all unrelated untracked plans.
- Confirm `user.name` and `user.email` belong to the user. Do not change them.
- Check only whether `E2E_DATABASE_URL`, optional `E2E_DATABASE_URL_UNPOOLED`, and `E2E_DATABASE_ALLOW_WRITES` are present. Never print their values. If absent, record `E2E environment pending`; continue focused unit implementation but do not run Playwright or Task 9 completion.

---

## Planning Audit: Reuse and Proven Adaptations

### Reuse from Evironn

| Area               | Reuse unchanged or with presentation-only wiring                                                                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth.js            | auth.ts, auth.config.ts, middleware.ts, types/next-auth.d.ts, credential authorization, Google provider, JWT/session role propagation, protected-route rules, and sign-in merge event                                                     |
| Verification       | app/actions/verification.ts and lib/verification/code.ts, pending-cookie.ts, service.ts, and ticket.ts, including rate limits, signed pending state, fixed non-production code support, attempt/expiry rules, and verified-ticket sign-in |
| Identity           | lib/auth-identity.ts normalization, lib/auth-credentials.ts constant-time password behavior, and lib/safe-redirect.ts                                                                                                                     |
| Cart ownership     | lib/cart.ts, lib/cart-cookie.ts, canonical recalc support, and guest-to-user merge in lib/cart-merge.ts                                                                                                                                   |
| Wishlist ownership | lib/wishlist-cookie.ts and guest-to-user merge in lib/wishlist-merge.ts                                                                                                                                                                   |
| Coupon             | lib/coupon.ts normalization, active/expiry checks, and integer discount calculation                                                                                                                                                       |
| Profile/address    | app/actions/profile.ts and app/actions/address.ts ownership model and validation, strengthened by focused tests                                                                                                                           |
| Reviews            | lib/review.ts and app/actions/review.ts purchase and duplicate enforcement, retaining canonical SKU and legacy snapshot compatibility                                                                                                     |
| Furniture catalog  | prisma/schema.prisma canonical Sku relations, lib/furniture-product-summary.ts, Catalog Variant B adapter/card, and lib/showcase-product.ts selected SKU DTO                                                                              |

### Comparison with D:\Projects\fashion-shop

- Auth.js, middleware, next-auth augmentation, identity normalization, verification ticket/code/service behavior, cart and wishlist cookies, wishlist merge, profile action, review action, cart POST route, and wishlist count route are the inherited technical foundation; observed differences in many auth files are formatting only.
- fashion-shop cart reads and writes ProductVariant. Evironn already added canonical Sku reads, recalculation, merge, and quantity stock checks. Therefore fashion-shop is evidence for ownership and error behavior, not a cart implementation to copy.
- fashion-shop profile and schema are clothing-domain implementations. Evironn canonical furniture SKU relations and immutable order snapshot fields remain authoritative.
- Existing Evironn tests already extend the source with canonical cart recalc, merge, route, and review coverage. New tests must extend those contracts instead of replacing them.

### Proven incompatibilities requiring adaptation

1. services/dto/cart.dto.ts and POST /api/cart still accept only productVariantId; all new Phase 3 writes must accept canonical skuId and validate active product, active SKU, current stock, and the resulting quantity.
2. The current cart API returns Prisma payloads and the client derives display totals. Phase 3 needs a serializable server projection with canonical configuration and server totals.
3. The current cart summary computes coupon and shipping values in the client. Coupon totals must come from app/actions/coupon.ts; shipping and checkout controls remain inactive until Phase 4.
4. lib/wishlist.ts projects legacy ProductCardData. It must project FurnitureProductCardData, and CatalogCard must use controlled production wishlist state instead of local-only heart state.
5. Current AuthCard, cart presentation, and profile presentation are inherited storefront UIs. Selected clone shells replace their route presentation while production actions and DTOs replace every clone mock controller.
6. The clone auth controller contains phone/SMS login, recovery, fake codes, and fake VK/Yandex/Telegram outcomes. Those paths are excluded; credentials, Google, registration, inline email verification, and safe callback behavior are real.
7. The clone cart controller contains seeded lines, local promo math, delivery rates/slots, payment assumptions, and local saved state. Canonical cart APIs, coupon action, wishlist action, and disabled Phase 4 controls replace them.
8. The clone profile contains fake loyalty, payments, bonuses, notifications, account deletion, linked accounts, order cancellation/reorder/receipt, and local persistence. Only real overview, read-only orders, favorites, profile/password, addresses, and logout ship.
9. e2e/global-setup.ts warms a legacy ProductVariant write and inherits ambient database URLs. It must become read-only warmup plus an explicit disposable-database guard.

## Exact Clone Presentation Contract

| Read-only clone source                                                                                        | Production destination                                                             | Exact material retained                                                                                                                                                                            | Production adapter boundary                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| src/auth/AuthVariantB.tsx and src/auth/AuthPage.tsx Variant B branch                                          | components/evironn/auth/auth-variant-b.tsx                                         | auth-page auth-page--b shell, stage/composition, head, tabs, panel, field/password markup, strength meter, error/code/resend states, divider, social block, footer, copy, and responsive DOM order | components/evironn/auth/auth-variant-b-controller.tsx calls Auth.js and server actions; phone/SMS, recovery, fake success/verdicts, guest checkout, and fake providers are absent |
| src/auth/AuthPage.css                                                                                         | styles/evironn/AuthPage.css                                                        | Full stylesheet copied without redesign; SHA-256 source fingerprint 99ed003b86c079dd3a4142df71615746f9935b4eabcef858acc693942da92442                                                               | No selector renaming; only production state classes already defined by the source are used                                                                                        |
| src/checkout/CheckoutPrimitives.tsx and src/checkout/CheckoutPrimitives.css Field, consent, and submit blocks | components/evironn/forms/form-primitives.tsx and styles/evironn/FormPrimitives.css | chk-field, chk-consents, chk-check, chk-error, and chk-submit DOM/classes and source CSS declarations                                                                                              | Generic typed props, real form submission, and existing Evironn consent validation replace CheckoutForm dependencies                                                              |
| src/cart/CartVariantA.tsx                                                                                     | components/evironn/cart/cart-variant-a.tsx                                         | cart-a head, stepper, list/columns/lines, canonical swatch/meta rows, quantity/money/actions, saved confirmation, support, sticky summary, related grid, empty state, undo bar, and mobile bar     | components/evironn/cart/use-cart-variant-a.ts consumes CartDto, actions, and wishlist state; delivery picker is omitted and checkout controls are visibly disabled                |
| src/cart/CartPrimitives.tsx                                                                                   | components/evironn/cart/cart-primitives.tsx                                        | Steps, QtyStepper, PromoField, SummaryRows, UndoBar, EmptyCart, and SupportLink JSX/classes                                                                                                        | DeliveryPicker and PaymentRow are not ported; totals props are CartTotalsDto and callbacks call production boundaries                                                             |
| src/cart/CartVariantA.css and CartPrimitives.css                                                              | styles/evironn/CartVariantA.css and styles/evironn/CartPrimitives.css              | Full stylesheets copied without redesign; fingerprints 8a83377e890a60e31079bda43eef5ba32cabfc853904731042258308e746c0db and c6b46c6608af07e0b964dc752e289f038ef8ccd00b8db5a3aea314a97eb05e02       | Unused delivery/payment selectors may remain inert; no visual reinterpretation                                                                                                    |
| src/profile/ProfilePage.tsx Variant A                                                                         | components/evironn/profile/profile-variant-a.tsx                                   | prf prf--a shell, identity/logout, sliding nav, overview cards, orders layout, favorites grid, account/security fields, address cards, empty states, toast, and responsive DOM                     | Real ProfilePageDto/actions replace useProfile; nav includes only overview, orders, favorites, profile, and addresses                                                             |
| src/profile/ProfilePage.css                                                                                   | styles/evironn/ProfilePage.css                                                     | Full stylesheet copied without redesign; SHA-256 source fingerprint e55a53ded3f4fd65dfc341470a0f686e8b3b9a4402d26a21ba9ae298a713ea10                                                               | Payment/bonus/notification selectors remain unused                                                                                                                                |

Copy the missing auth composition assets byte-for-byte:

- D:\Новая папка (2)\evironn-clone\public\assets\products\05-graphite-walnut-room-integrated-v2.png to public/assets/products/05-graphite-walnut-room-integrated-v2.png, SHA-256 77ad814923cea3e2381f5596c9a50fba3b07e8446625dcdea90fcece25fc80d7.
- D:\Новая папка (2)\evironn-clone\public\assets\products\05-ivory-walnut-chair-alpha.png to public/assets/products/05-ivory-walnut-chair-alpha.png, SHA-256 75106aba76f8c121adc3a9d5497a6566655a53320ee519267cbe86cac6ef66f1.
- Reuse the existing byte-identical public/assets/products/05-terracotta-walnut-chair-alpha.png, SHA-256 19f4717415537d49bbf6195d79a2ed35ab5a7af240a538a03b9fded5203d385d.

## Cross-Task Interfaces

### Canonical cart contract produced by Task 3

    export interface CartConfigurationItemDto {
      groupSlug: string;
      groupLabel: string;
      valueSlug: string;
      valueLabel: string;
      swatchHex: string | null;
    }

    export interface CartLineDto {
      id: string;
      skuId: string;
      productId: string;
      productSlug: string;
      name: string;
      articleNumber: string;
      configuration: CartConfigurationItemDto[];
      imageUrl: string | null;
      imageAlt: string;
      quantity: number;
      unitPrice: number;
      oldUnitPrice: number | null;
      lineTotal: number;
      oldLineTotal: number | null;
      stock: number;
      available: boolean;
    }

    export interface CartTotalsDto {
      itemCount: number;
      lineCount: number;
      subtotal: number;
      compareAtSubtotal: number;
      saleDiscount: number;
      couponDiscount: number;
      total: number;
    }

    export interface CartDto {
      items: CartLineDto[];
      totals: CartTotalsDto;
    }

    export type CartApiErrorCode =
      | 'INVALID_INPUT'
      | 'SKU_NOT_FOUND'
      | 'OUT_OF_STOCK'
      | 'QUANTITY_EXCEEDS_STOCK'
      | 'CART_ITEM_NOT_FOUND'
      | 'CART_CONFLICT';

    export interface CartApiError {
      error: { code: CartApiErrorCode; message: string; stock?: number };
    }

Task 3 produces CartDto from lib/cart-presentation.ts and all cart API mutations. Tasks 5 and 7 consume it through services/cart.ts and store/cart.ts. The existing legacy CartDetails remains for inherited checkout compilation and receives no Phase 3 client-authority expansion.

### Cart routes produced by Task 3

- GET /api/cart returns CartDto and does not create an empty owner cart.
- POST /api/cart accepts { skuId: string; quantity?: number } and returns CartDto.
- PATCH /api/cart/[id] accepts { quantity: number } and returns CartDto.
- DELETE /api/cart/[id] returns CartDto.
- DELETE /api/cart clears only the resolved owner cart and returns the empty CartDto.
- POST/PATCH return HTTP 409 with CartApiError for stock conflicts, HTTP 404 for absent canonical resources, and HTTP 400 for invalid input.

### Wishlist boundary produced by Task 4

    export type WishlistMutationResult =
      | { ok: true; active: boolean }
      | { ok: false; error: string };

    export async function toggleWishlist(raw: unknown): Promise<WishlistMutationResult>;
    export async function addToWishlist(raw: unknown): Promise<WishlistMutationResult>;
    export async function getWishlistItems(
      session: Session | null,
      token: string | undefined,
    ): Promise<FurnitureProductCardData[]>;

addToWishlist is idempotent and always returns active: true on success. Task 5 consumes it for “save to favorites”; Tasks 6–7 consume canonical wishlist cards.

### Coupon boundary produced by Task 5

    export type ValidateCouponResult =
      | {
          ok: true;
          code: string;
          percent: number;
          discount: number;
          totals: CartTotalsDto;
        }
      | { ok: false; error: string };

The action recalculates from the current owner cart. The cart controller stores only the returned code/percent/totals. Every cart mutation clears the applied coupon view until the user reapplies it.

### Profile boundary produced by Task 6

    export type ProfileSection = 'overview' | 'orders' | 'favorites' | 'profile' | 'addresses';

    export interface ProfileAddressDto {
      id: string;
      label: string;
      city: string;
      street: string;
      comment: string | null;
      isDefault: boolean;
    }

    export interface ProfileOrderLineDto {
      id: string;
      name: string;
      configuration: string;
      imageUrl: string | null;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }

    export interface ProfileOrderDto {
      id: string;
      orderNumber: number;
      status: OrderStatus;
      createdAt: string;
      shippingMethod: string;
      city: string;
      addressLine: string;
      itemsTotal: number;
      discountAmount: number;
      shippingAmount: number;
      totalAmount: number;
      items: ProfileOrderLineDto[];
    }

    export interface ProfilePageDto {
      user: {
        name: string;
        email: string;
        phone: string;
        birthdate: string;
        createdAt: string;
        initials: string;
      };
      stats: { orders: number; favorites: number; addresses: number };
      orders: ProfileOrderDto[];
      favorites: CatalogBCard[];
      addresses: ProfileAddressDto[];
    }

lib/profile-page.ts produces this DTO; app/(shop)/profile/page.tsx passes it to Profile Variant A. Email is display-only.

---

## Task 1: Lock the Foundation Audit and Disposable E2E Boundary

**Files**

- Add: docs/superpowers/plans/2026-08-14-phase-3-commerce-auth.md
- Modify: .env.example
- Create: tests/phase-3-foundation-contract.test.ts
- Create: tests/e2e-database-guard.test.ts
- Create: e2e/database-guard.ts
- Modify: playwright.config.ts
- Modify: e2e/global-setup.ts
- Create as ignored local evidence: .superpowers/sdd/phase-3-foundation-audit.md
- Update: .superpowers/sdd/progress.md

**Contract**

`e2e/database-guard.ts` exports `resolveE2eDatabaseEnvironment(env)`, which throws unless `E2E_DATABASE_ALLOW_WRITES` equals `1` and `E2E_DATABASE_URL` is a valid PostgreSQL URL. `E2E_DATABASE_URL_UNPOOLED` is optional but, when supplied, must also be a valid PostgreSQL URL. The function returns `POSTGRES_URL` from `E2E_DATABASE_URL`, `POSTGRES_URL_NON_POOLING` from `E2E_DATABASE_URL_UNPOOLED ?? E2E_DATABASE_URL`, and `RESEND_API_KEY` as an empty string. No ambient application database URL is accepted.

**TDD steps**

- [ ] Write tests that reject a missing opt-in, reject a missing or non-PostgreSQL E2E URL, reject an invalid optional unpooled URL, ignore ambient POSTGRES_URL/DATABASE_URL values, accept explicit pooled/direct E2E URLs, fall back to the explicit pooled E2E URL only when the unpooled E2E key is absent, and force blank RESEND_API_KEY.
- [ ] Add the source-contract test asserting the canonical Sku/CartItem/OrderItem relations, existing Auth.js role and safe callback imports, cart/wishlist sign-in merge calls, and absence of clone/source absolute paths from production imports.
- [ ] Run:

      npx vitest run tests/e2e-database-guard.test.ts tests/phase-3-foundation-contract.test.ts

  Expected red result: the database-guard module is missing and the new source-boundary assertions identify the legacy global setup write.

- [ ] Add blank `E2E_DATABASE_URL`, `E2E_DATABASE_URL_UNPOOLED`, and `E2E_DATABASE_ALLOW_WRITES` entries with disposable-database warnings to `.env.example`. Do not add values to tracked files.
- [ ] Implement `resolveE2eDatabaseEnvironment`, call it from `playwright.config.ts`, pass its values into `webServer.env`, and retain `E2E_TEST_CODE=424242` and AUTH settings.
- [ ] Replace `e2e/global-setup.ts` direct Neon SQL and POST `/api/cart` warmup with GET-only warmup for `/`, `/catalog`, `/product/noma-woven-lounge`, `/api/cart`, and `/api/wishlist/count`. Remove the `@neondatabase/serverless` import. Keep one Playwright request context alive and use a 15-second interval to GET a DB-backed read route such as `/catalog`; return a teardown that clears the interval and disposes the context. No keep-warm request may mutate data.
- [ ] Extend the source-contract test to require the HTTP keep-warm interval and teardown, forbid direct Neon imports/SQL/write warmups, and require all three E2E environment keys in `.env.example`.
- [ ] Write the ignored local .superpowers/sdd/phase-3-foundation-audit.md with the reuse/adaptation findings above and the explicit conclusion “No new architecture decision; ADR-001/007/010/012/013/014 and the canonical SKU schema govern implementation.” Summarize that conclusion in tracked progress.md; do not force-add the audit.
- [ ] Run:

  ```text
  npx vitest run tests/e2e-database-guard.test.ts tests/phase-3-foundation-contract.test.ts tests/auth-config.test.ts tests/middleware-auth.test.ts tests/cart-merge-canonical.test.ts tests/wishlist.test.ts tests/review.test.ts
  npx prettier --check e2e/database-guard.ts e2e/global-setup.ts playwright.config.ts tests/e2e-database-guard.test.ts tests/phase-3-foundation-contract.test.ts docs/superpowers/plans/2026-08-14-phase-3-commerce-auth.md
  ```

  Expected green result: all listed tests pass; formatting check exits 0; no network email or database connection occurs.

- [ ] Record focused evidence in .superpowers/sdd/phase-3-task-1-report.md and progress.md.
- [ ] Add this plan to Git in the same focused commit; do not add the unrelated preserved plan files.
- [ ] Commit boundary: test: lock phase 3 commerce boundaries

## Task 2: Port Auth Variant B onto Production Auth.js

**Files**

- Create: components/evironn/forms/form-primitives.tsx
- Create: components/evironn/auth/auth-variant-b-state.ts
- Create: components/evironn/auth/auth-variant-b.tsx
- Create: components/evironn/auth/auth-variant-b-controller.tsx
- Create: styles/evironn/FormPrimitives.css
- Create: styles/evironn/AuthPage.css
- Create: public/assets/products/05-graphite-walnut-room-integrated-v2.png
- Create: public/assets/products/05-ivory-walnut-chair-alpha.png
- Modify: app/layout.tsx
- Modify: app/(auth)/layout.tsx
- Modify: app/(auth)/login/page.tsx
- Modify: app/(auth)/register/page.tsx
- Modify: services/dto/auth.dto.ts
- Modify: e2e/helpers.ts
- Modify: e2e/auth.spec.ts
- Create: tests/evironn-auth-variant-b.test.tsx
- Create: tests/evironn-auth-source-contract.test.ts
- Create: tests/evironn-phase-3-assets.test.ts
- Modify: tests/auth-dto.test.ts
- Update: .superpowers/sdd/progress.md

**Interfaces and boundaries**

    export interface AuthVariantBControllerProps {
      initialMode: 'login' | 'register';
      callbackUrl: string;
      initialVerificationPending: boolean;
      oauthError: string | null;
    }

    export type AuthVariantBMode = 'login' | 'register' | 'verify';

The server pages await searchParams, sanitize callbackUrl with safeCallbackUrl, read the signed pending cookie, and pass only safe serializable state. The controller calls signIn('credentials'), registerUser, ensureVerificationGate, verifyEmailCode, resendVerificationCode, and signIn('google', { redirectTo: callbackUrl }). The shell receives state and typed callbacks; it imports no Prisma, cookies, Auth.js server module, or clone hook.

services/dto/auth.dto.ts keeps loginSchema, registerSchema, registerFormSchema, profileSchema, and verifyCodeSchema. Registration presentation uses one required demonstration-service consent mapped to registerFormSchema.agree; it does not invent persisted newsletter consent.

**TDD steps**

- [ ] Write the source-contract test first. Require Auth Variant B route imports, safe callback sanitization, signed pending-cookie read, real Google sign-in, exact auth-page/auth-page--b classes, root CSS imports, and source asset hashes. Forbid useAuth, authState mock verdicts, 123456, phone/SMS mode, recovery mode, VK, Yandex, Telegram, guest checkout, and direct window query parsing.
- [ ] Write jsdom tests for login, registration validation, password visibility/strength, generic bad-credential error, unverified-email transition to verify mode, six-digit verification, resend rate feedback, invocation of the configured Google provider with the sanitized callback URL, OAuthAccountNotLinked copy, and tab keyboard semantics. Mock only the browser boundary; do not contact Google.
- [ ] Run:

      npx vitest run tests/evironn-auth-variant-b.test.tsx tests/evironn-auth-source-contract.test.ts tests/evironn-phase-3-assets.test.ts

  Expected red result: the new components, styles, and two assets are absent.

- [ ] Port the exact Variant B shell and full AuthPage.css. Extract the exact Field, consent, error, checkbox, and submit DOM/CSS blocks into the shared form primitives; do not import checkout state.
- [ ] Copy the two missing binary assets and verify all three auth composition asset hashes.
- [ ] Implement the controller with existing Zod schemas and production actions. Keep generic credential errors, server retry seconds, inline pending verification after register/login gating, safe callback navigation after success, and Google as the only OAuth control.
- [ ] Make app/(auth)/layout.tsx render the accepted StorefrontHeader and StorefrontFooter with getInitialCartCount. Remove VerificationGateHost from this route group only because the inline controller owns pending verification; retain the host in app/(shop)/layout.tsx.
- [ ] Make login/page.tsx and register/page.tsx server boundaries for callback, OAuth error, and pending state. Do not modify auth.ts, auth.config.ts, middleware.ts, next-auth augmentation, credential authorization, or verification cryptography unless a focused test proves a regression.
- [ ] Rewrite e2e/helpers.ts and e2e/auth.spec.ts selectors for Variant B. Registration must use a unique reserved test-domain email, E2E code 424242, and the disposable E2E database guard. Playwright verifies the Google control and safe local callback construction without navigating to or automating Google. Record real Google sign-in as a manual environment-gated Preview smoke.
- [ ] Run:

  ```text
  npx vitest run tests/evironn-auth-variant-b.test.tsx tests/evironn-auth-source-contract.test.ts tests/evironn-phase-3-assets.test.ts tests/auth-dto.test.ts tests/auth-config.test.ts tests/auth-credentials.test.ts tests/auth-identity.test.ts tests/middleware-auth.test.ts tests/safe-redirect.test.ts tests/verification-actions.test.ts tests/verification-code.test.ts tests/verification-cookie.test.ts tests/verification-service.test.ts tests/verification-ticket.test.ts
  npx prettier --check "app/(auth)/layout.tsx" "app/(auth)/login/page.tsx" "app/(auth)/register/page.tsx" components/evironn/forms/form-primitives.tsx components/evironn/auth styles/evironn/FormPrimitives.css styles/evironn/AuthPage.css services/dto/auth.dto.ts e2e/helpers.ts e2e/auth.spec.ts tests/evironn-auth-variant-b.test.tsx tests/evironn-auth-source-contract.test.ts tests/evironn-phase-3-assets.test.ts
  ```

  Expected green result: all listed tests pass, source contracts reject mock auth paths, and asset/style checks pass.

- [ ] Record focused evidence in .superpowers/sdd/phase-3-task-2-report.md and progress.md.
- [ ] Commit boundary: feat: port production auth variant b

## Task 3: Establish Canonical SKU Cart APIs and Activate PDP Add Controls

**Files**

- Create: services/dto/commerce-cart.dto.ts
- Create: lib/cart-presentation.ts
- Modify: services/dto/cart.dto.ts
- Modify: app/api/cart/route.ts
- Modify: app/api/cart/[id]/route.ts
- Modify: services/cart.ts
- Modify: store/cart.ts
- Modify: hooks/use-cart.ts
- Modify: components/evironn/storefront-header.tsx
- Modify: components/shared/cart-badge.tsx
- Modify: components/shared/auth/logout-button.tsx
- Modify: components/evironn/product/ProductPage.tsx
- Modify: tests/cart-route-canonical.test.ts
- Modify: tests/cart.test.ts
- Create: tests/cart-presentation.test.ts
- Create: tests/cart-store.test.ts
- Create: tests/evironn-product-cart.test.tsx
- Update: tests/evironn-product-source-contract.test.ts
- Update: .superpowers/sdd/progress.md

**Interfaces and boundaries**

- services/dto/commerce-cart.dto.ts owns the CartConfigurationItemDto, CartLineDto, CartTotalsDto, CartDto, CartApiErrorCode, and CartApiError definitions shown above plus EMPTY_CART_DTO.
- services/dto/cart.dto.ts changes createCartItemSchema to { skuId, quantity? }. Its inherited CartDetails definitions remain available only to checkout-era code.
- lib/cart-presentation.ts exports buildCartDto(cart: CartWithItems, couponPercent?: number): CartDto. It reads only included database values. compareAtSubtotal uses max(oldPrice or price, price) per line; saleDiscount is compareAtSubtotal minus subtotal; couponDiscount is calcCouponDiscount(subtotal, couponPercent); total is subtotal minus couponDiscount.
- store/cart.ts stores items: CartLineDto[], totals: CartTotalsDto, totalAmount as a compatibility alias of totals.subtotal, loading, and error. fetch/add/update/remove/clear each resolve to CartDto and replace the complete server snapshot.
- Canonical POST mutation runs the SKU/active/stock read, existing-quantity read, and item upsert/update inside a serializable transaction with a bounded retry for Prisma `P2002`/`P2034`. Each retry rereads current quantity and stock before writing. Exhaustion returns HTTP 409 `CART_CONFLICT`; it never becomes a generic 500 or trusts a stale pre-transaction quantity.

**TDD steps**

- [ ] Write DTO/projection tests for canonical article number, ordered option labels/swatches, SKU media then product media fallback, old-price totals, item/line counts, unavailable state, empty cart, and a legacy row projection that never becomes a new write contract.
- [ ] Extend route tests for canonical skuId only, active product/SKU, zero stock, increment beyond stock, quantity maximum, owner scoping, root clear, canonical PATCH stock, and exact CartApiError status/code. Add concurrent/simulated-race cases proving `P2002`/`P2034` retries reread quantity and stock, preserve both valid increments, reject a resulting quantity above stock, and never leak a generic 500.
- [ ] Write store tests proving every response replaces local price/totals, failed mutations retain the prior snapshot and expose an error, and logout resets totals.
- [ ] Write ProductPage tests proving both accepted add buttons submit currentCombination.sku.id, reflect stock, preserve option/360 behavior, and remove the Phase 2 decorative notice.
- [ ] Run:

      npx vitest run tests/cart-presentation.test.ts tests/cart-route-canonical.test.ts tests/cart-store.test.ts tests/evironn-product-cart.test.tsx

  Expected red result: CartDto projection, canonical POST contract, clear route, and active PDP callbacks are absent.

- [ ] Implement buildCartDto over cartInclude. Keep canonical Sku as the primary branch and legacy ProductVariant only as read compatibility for inherited carts.
- [ ] Rework GET/POST/PATCH/DELETE to return CartDto. POST resolves the owner cart, then performs canonical SKU lookup, active checks, current quantity, stock validation, and upsert/update in the bounded serializable transaction described above. PATCH reuses owner-scoped item lookup and current SKU stock. Root DELETE uses deleteMany scoped to the resolved cart ID.
- [ ] Update services/cart.ts and store/cart.ts to consume only CartDto from the network; do not import Prisma payload types into client modules.
- [ ] Make header count use totals.itemCount after loading and preserve server initial count during loading/error. Update cart badge and logout reset for the new store shape.
- [ ] Connect both ProductPage add controls to addCartItem({ skuId: currentCombination.sku.id, quantity: 1 }). Disable only while submitting or when stock is zero. Keep the exact accepted markup/classes, six combinations, modal, motion, and handoff behavior.
- [ ] Run:

  ```text
  npx vitest run tests/cart-presentation.test.ts tests/cart-route-canonical.test.ts tests/cart-store.test.ts tests/cart.test.ts tests/cart-recalc.test.ts tests/cart-merge.test.ts tests/cart-merge-canonical.test.ts tests/resolve-owner-cart.test.ts tests/evironn-product-cart.test.tsx tests/evironn-product-shell.test.tsx tests/evironn-product-source-contract.test.ts
  npm run typecheck
  npx prettier --check services/dto/commerce-cart.dto.ts services/dto/cart.dto.ts lib/cart-presentation.ts app/api/cart services/cart.ts store/cart.ts hooks/use-cart.ts components/evironn/storefront-header.tsx components/shared/cart-badge.tsx components/shared/auth/logout-button.tsx components/evironn/product/ProductPage.tsx tests/cart-presentation.test.ts tests/cart-route-canonical.test.ts tests/cart-store.test.ts tests/evironn-product-cart.test.tsx tests/evironn-product-source-contract.test.ts
  ```

  Expected green result: all focused cart/PDP tests pass, typecheck exits 0, and no new write accepts productVariantId.

- [ ] Record focused evidence in .superpowers/sdd/phase-3-task-3-report.md and progress.md.
- [ ] Commit boundary: feat: add canonical sku cart contracts

## Task 4: Connect Canonical Guest and Account Wishlist State

**Files**

- Modify: lib/wishlist.ts
- Modify: app/actions/wishlist.ts
- Modify: services/dto/wishlist.dto.ts
- Modify: store/wishlist.ts
- Modify: app/api/wishlist/count/route.ts
- Modify: app/(shop)/catalog/page.tsx
- Modify: components/evironn/catalog/catalog-variant-b.tsx
- Modify: components/evironn/catalog/catalog-card.tsx
- Modify: components/evironn/catalog/catalog-variant-b-adapter.ts
- Modify: tests/wishlist.test.ts
- Modify: tests/toggle-wishlist.test.ts
- Create: tests/wishlist-count-route.test.ts
- Create: tests/evironn-catalog-wishlist.test.tsx
- Update: tests/evironn-catalog-source-contract.test.ts
- Modify: e2e/wishlist.spec.ts
- Update: .superpowers/sdd/progress.md

**Interfaces and boundaries**

- getWishlistItems returns FurnitureProductCardData[] by querying active products with furnitureProductCardInclude and mapping with buildFurnitureProductCardData.
- addToWishlist uses wishlistToggleSchema, resolveOwnerWishlist, and a unique upsert/create race guard. It never toggles an existing item off.
- CatalogCard requires wishlisted: boolean and onWishlistToggle(productId): Promise<WishlistMutationResult>. It has no local-only favorite source of truth.
- CatalogVariantB receives initialWishlistedIds: string[]. Its controller maintains a Set, calls toggleWishlist, updates only from successful server results, and restores the prior value on failure.
- buildCatalogBCard(data: FurnitureProductCardData): CatalogBCard is exported for catalog, cart recommendations, and profile favorites.

**TDD steps**

- [ ] Extend wishlist tests for canonical include/projection, active-product filtering, idempotent add, duplicate race, invalid/nonexistent product, guest token creation, authenticated owner use, and both guest merge directions.
- [ ] Write card/catalog tests for controlled pressed state, successful toggle, rollback on error, server-provided initial IDs, and preservation of existing Catalog Variant B markup and media.
- [ ] Write count-route tests for no-create reads, guest cookie ownership, authenticated ownership, and active products only.
- [ ] Run:

      npx vitest run tests/wishlist.test.ts tests/toggle-wishlist.test.ts tests/wishlist-count-route.test.ts tests/evironn-catalog-wishlist.test.tsx tests/evironn-catalog-source-contract.test.ts

  Expected red result: wishlist projection is legacy, addToWishlist and controlled CatalogCard props are absent.

- [ ] Replace legacy productCardInclude/buildProductCardData in lib/wishlist.ts with the canonical furniture adapter. Preserve token ownership and merge functions.
- [ ] Add the idempotent server action while keeping toggleWishlist for heart controls. Both actions revalidate affected catalog/profile paths and return WishlistMutationResult.
- [ ] Make catalog/page.tsx read session and wishlist cookie, obtain IDs without creating a wishlist, and pass a serializable string array into CatalogVariantB.
- [ ] Convert CatalogCard to controlled wishlist state without changing its accepted classes, motion, link, media, badges, color swatches, or responsive behavior.
- [ ] Rewrite e2e/wishlist.spec.ts for a guest catalog heart, registration/verification merge, persisted heart after sign-in, and removal. It may write only through the application against the guarded disposable E2E database.
- [ ] Run:

  ```text
  npx vitest run tests/wishlist.test.ts tests/toggle-wishlist.test.ts tests/wishlist-count-route.test.ts tests/evironn-catalog-wishlist.test.tsx tests/evironn-catalog-source-contract.test.ts tests/auth-config.test.ts
  npx prettier --check lib/wishlist.ts app/actions/wishlist.ts services/dto/wishlist.dto.ts store/wishlist.ts app/api/wishlist/count/route.ts "app/(shop)/catalog/page.tsx" components/evironn/catalog/catalog-variant-b.tsx components/evironn/catalog/catalog-card.tsx components/evironn/catalog/catalog-variant-b-adapter.ts tests/wishlist.test.ts tests/toggle-wishlist.test.ts tests/wishlist-count-route.test.ts tests/evironn-catalog-wishlist.test.tsx tests/evironn-catalog-source-contract.test.ts e2e/wishlist.spec.ts
  ```

  Expected green result: all listed tests pass; guest and account hearts use production state; merge behavior remains green.

- [ ] Record focused evidence in .superpowers/sdd/phase-3-task-4-report.md and progress.md.
- [ ] Commit boundary: feat: connect canonical wishlist state

## Task 5: Port Cart Variant A with Server Totals, Coupon, and Stock

**Files**

- Create: components/evironn/cart/cart-primitives.tsx
- Create: components/evironn/cart/cart-variant-a.tsx
- Create: components/evironn/cart/use-cart-variant-a.ts
- Create: styles/evironn/CartPrimitives.css
- Create: styles/evironn/CartVariantA.css
- Modify: app/layout.tsx
- Modify: app/(shop)/cart/page.tsx
- Modify: app/(shop)/cart/cart-view.tsx
- Modify: app/actions/coupon.ts
- Modify: components/shared/promo-code-field.tsx
- Modify: store/coupon.ts
- Remove: components/shared/cart/cart-related-grid.tsx
- Remove: tests/cart-related-grid.test.ts
- Create: tests/evironn-cart-variant-a.test.tsx
- Create: tests/evironn-cart-source-contract.test.ts
- Modify: tests/coupon.test.ts
- Modify: tests/coupon-status.test.ts
- Modify: e2e/cart.spec.ts
- Modify: e2e/coupon.spec.ts
- Update: .superpowers/sdd/progress.md

**Interfaces and boundaries**

    export interface CartVariantAProps {
      related: CatalogBCard[];
      initialWishlistedIds: string[];
    }

    export interface CartVariantAActions {
      step(itemId: string, quantity: number): Promise<void>;
      remove(itemId: string): Promise<void>;
      clear(): Promise<void>;
      undo(): Promise<void>;
      saveToWishlist(item: CartLineDto): Promise<void>;
      addRelated(skuId: string): Promise<void>;
      applyCoupon(code: string): Promise<void>;
      clearCoupon(): void;
    }

use-cart-variant-a.ts adapts useCartStore, addToWishlist, and validateCoupon. It never imports clone cartState/useCart, derives no price, and accepts no delivery/payment value.

**TDD steps**

- [ ] Write a source-contract test requiring the Cart Variant A files and exact CSS imports while forbidding clone useCart/cartState, seeded products, local promo formulas, DeliveryPicker, PaymentRow, live checkout links, productVariantId writes, and client shipping constants.
- [ ] Write jsdom tests for canonical line metadata/configuration, selected swatches as display-only values, stock-limited quantity controls, server mutation snapshots, error feedback, delete/undo re-add by skuId and quantity, clear, idempotent save-to-wishlist followed by delete, saved confirmation, related add by primarySkuId, empty state, and mobile summary.
- [ ] Extend coupon tests so validateCoupon returns the complete server CartTotalsDto, rejects empty carts, uses current server subtotal, floors discounts, and never persists a coupon. Test that any cart mutation clears the displayed applied coupon.
- [ ] Run:

      npx vitest run tests/evironn-cart-variant-a.test.tsx tests/evironn-cart-source-contract.test.ts tests/coupon.test.ts tests/coupon-status.test.ts

  Expected red result: clone-derived shell/primitives and server totals result are absent.

- [ ] Port Steps, QtyStepper, PromoField, SummaryRows, UndoBar, EmptyCart, and SupportLink with exact JSX/classes. Do not port DeliveryPicker or PaymentRow.
- [ ] Port the Cart Variant A structure and full two CSS files unchanged. Render canonical configuration labels and selected swatches; do not expose a fake SKU color-switch operation.
- [ ] Keep the clone steps as informational progress. Replace desktop/mobile checkout anchors with the same cart-a visual classes rendered as aria-disabled controls labelled “Оформление заказа будет доступно на следующем этапе.” Omit the delivery card and every rate/slot.
- [ ] Build related products in cart/page.tsx with furnitureProductCardInclude, buildFurnitureProductCardData, and buildCatalogBCard. Pass primarySkuId through the related add control and disable it when null or sold out.
- [ ] Make validateCoupon return code, percent, discount, and server totals. SummaryRows renders compareAtSubtotal, saleDiscount, couponDiscount, and total exactly as returned; it renders no shipping amount. Preserve old action fields so inherited checkout-era PromoCodeField still compiles.
- [ ] Implement save-to-wishlist as addToWishlist({ productId }) followed by removeItem only after success. Delete undo re-adds the removed skuId and original quantity; the wishlist remains saved. No local “saved items” database is invented.
- [ ] Replace cart-view.tsx with the production adapter and remove the now-unreferenced legacy related grid/test. Leave checkout components and order code untouched.
- [ ] Rewrite e2e/cart.spec.ts for selected Noma SKU add, guest persistence, quantity/stock response, remove/undo, clear, and sign-in merge. Rewrite e2e/coupon.spec.ts for cart-only valid/invalid coupon totals; it must not visit checkout or create an order.
- [ ] Run:

  ```text
  npx vitest run tests/evironn-cart-variant-a.test.tsx tests/evironn-cart-source-contract.test.ts tests/cart-presentation.test.ts tests/cart-store.test.ts tests/cart-route-canonical.test.ts tests/cart-recalc.test.ts tests/cart-merge.test.ts tests/cart-merge-canonical.test.ts tests/coupon.test.ts tests/coupon-status.test.ts tests/coupon-client-bundle.test.ts
  npm run typecheck
  npx prettier --check components/evironn/cart styles/evironn/CartPrimitives.css styles/evironn/CartVariantA.css "app/(shop)/cart/page.tsx" "app/(shop)/cart/cart-view.tsx" app/actions/coupon.ts components/shared/promo-code-field.tsx store/coupon.ts app/layout.tsx tests/evironn-cart-variant-a.test.tsx tests/evironn-cart-source-contract.test.ts tests/coupon.test.ts tests/coupon-status.test.ts e2e/cart.spec.ts e2e/coupon.spec.ts
  ```

  Expected green result: focused cart/coupon tests pass, typecheck exits 0, and source tests prove no clone controller or Phase 4 calculation entered production.

- [ ] Record focused evidence in .superpowers/sdd/phase-3-task-5-report.md and progress.md.
- [ ] Commit boundary: feat: port cart variant a

## Task 6: Harden Profile Data, Password, and Address Boundaries

**Files**

- Create: services/dto/profile-page.dto.ts
- Create: lib/profile-page.ts
- Modify: app/actions/profile.ts
- Modify: app/actions/address.ts
- Create: tests/profile-page-dto.test.ts
- Create: tests/update-password.test.ts
- Create: tests/address-actions.test.ts
- Modify: tests/update-profile.test.ts
- Update: .superpowers/sdd/progress.md

**Interfaces and boundaries**

- lib/profile-page.ts exports getProfilePageDto(userId: string): Promise<ProfilePageDto>. It uses bounded Prisma selects, reads only the authenticated user’s records, and serializes dates to ISO strings.
- Order rows are built from immutable OrderItem productName, configuration, imageUrl, unitPrice, quantity, and lineTotal snapshots. Reuse formatOrderItemConfiguration from lib/order.ts for the stored configuration array; canonicalSku and legacy ProductVariant are optional read enrichments only.
- updateProfile never accepts or mutates email. updatePassword requires the current password, validates the replacement, and stores only its hash.
- Address actions verify ownership server-side. Exactly one owned address is default whenever at least one address exists; the first address becomes default, setting a default clears the other owned defaults atomically, and deleting the default promotes the oldest remaining owned address in the same transaction.

**TDD steps**

- [ ] Write DTO tests for authenticated ownership, bounded selected fields, ISO dates, initials, counts, canonical snapshot configuration through formatOrderItemConfiguration, null live-SKU fallback, deterministic default-address-first sorting, active-product favorites, and absence of payment/bonus/notification fields.
- [ ] Write action tests for unauthenticated rejection, profile field normalization, immutable email, current-password verification, password hashing, owner-scoped address create/delete/default, first-address default, default deletion promoting the oldest remaining address, foreign-address rejection, bounded `P2034` retry with a fresh owned-address reread, stable conflict exhaustion, and exactly one default after every successful action.
- [ ] Run:

      npx vitest run tests/profile-page-dto.test.ts tests/update-profile.test.ts tests/update-password.test.ts tests/address-actions.test.ts

  Expected red result: ProfilePageDto, password coverage, ownership enforcement, and default-address invariants are absent or incomplete.

- [ ] Implement getProfilePageDto with bounded selects and canonical furniture-card adaptation. Use the shared order snapshot formatter; fall back to stored colorwayName/size only for inherited order rows whose configuration snapshot is absent.
- [ ] Harden profile/password actions without changing the schema, auth model, or public email identity.
- [ ] Refactor address actions around owned-record checks and bounded-retry serializable Prisma transactions. Each retry rereads the owned address set before clearing/setting/promoting defaults. Ensure concurrent or repeated default operations cannot leave two default addresses; map expected ownership/not-found failures and exhausted transaction conflicts to stable action results.
- [ ] Run:

  ```text
  npx vitest run tests/profile-page-dto.test.ts tests/update-profile.test.ts tests/update-password.test.ts tests/address-actions.test.ts tests/wishlist.test.ts tests/cart-presentation.test.ts
  npm run typecheck
  npx prettier --check services/dto/profile-page.dto.ts lib/profile-page.ts app/actions/profile.ts app/actions/address.ts tests/profile-page-dto.test.ts tests/update-password.test.ts tests/address-actions.test.ts tests/update-profile.test.ts
  ```

  Expected green result: all focused data/action tests pass, typecheck exits 0, and no UI, schema, order mutation, or Phase 4 behavior enters the task diff.

- [ ] Record focused evidence in .superpowers/sdd/phase-3-task-6-report.md and progress.md.
- [ ] Commit boundary: feat: harden profile data boundaries

## Task 7: Port Profile Variant A onto the Hardened Boundaries

**Files**

- Create: components/evironn/profile/profile-variant-a.tsx
- Create: components/evironn/profile/use-profile-variant-a.ts
- Create: styles/evironn/ProfilePage.css
- Modify: app/layout.tsx
- Modify: app/(shop)/profile/page.tsx
- Remove: app/(shop)/profile/profile-view.tsx
- Create: tests/evironn-profile-variant-a.test.tsx
- Create: tests/evironn-profile-source-contract.test.ts
- Create: e2e/profile.spec.ts
- Update: .superpowers/sdd/progress.md

**Interfaces and boundaries**

- The route authenticates first, calls getProfilePageDto from Task 6, and passes the DTO to Profile Variant A. Email remains disabled/read-only.
- use-profile-variant-a.ts calls updateProfile, updatePassword, addAddress, deleteAddress, setDefaultAddress, toggleWishlist, and canonical cart add. Successful mutations update safe local display state or call router.refresh; failures preserve prior state and display the server message.
- Logout calls Auth.js signOut. Favorites consume CatalogBCard and primarySkuId. Orders are display-only snapshot data.
- Port the clone’s exact supported Variant A JSX/CSS composition, but exclude its mock controller and unsupported loyalty, payment, bonus, notification, fake order, and fake account state.

**TDD steps**

- [ ] Write jsdom/source tests for exact prf prf--a shell/classes, supported navigation only, read-only orders, real favorites add/remove/add-to-cart, profile/password submission, address add/default/delete, logout, mobile indicator, and absence of fake loyalty/payment/bonus/notification/account/order controls.
- [ ] Run:

      npx vitest run tests/evironn-profile-variant-a.test.tsx tests/evironn-profile-source-contract.test.ts

  Expected red result: the production Variant A shell, controller adapter, exact styles, and route integration do not exist.

- [ ] Port the Variant A shell and full ProfilePage.css unchanged. Render only overview, orders, favorites, profile, and addresses. Overview uses real counts and the latest real order; no invented balance or loyalty tier appears.
- [ ] Render orders read-only. Do not include tracking simulation, receipt, cancellation, reorder, payment, or order-detail mutations.
- [ ] Render favorites with controlled CatalogCard, “В корзину” using primarySkuId, and remove using toggleWishlist. Sold-out/null-SKU cards cannot add.
- [ ] Render profile and password forms with shared form primitives. Keep email read-only. Render an inline address form using existing prf subsection/action classes and fields label/city/street/comment; provide owner-scoped default/delete controls.
- [ ] Replace the route’s old profile-view import with Profile Variant A and remove only the now-unreferenced route-local profile-view.tsx.
- [ ] Write e2e/profile.spec.ts for protected redirect, verified sign-in, profile edit, password change and re-login, address add/default/delete, favorite display/remove/add-to-cart, and read-only order presentation. Use only the guarded disposable E2E database.
- [ ] Run:

  ```text
  npx vitest run tests/evironn-profile-variant-a.test.tsx tests/evironn-profile-source-contract.test.ts tests/profile-page-dto.test.ts tests/update-profile.test.ts tests/update-password.test.ts tests/address-actions.test.ts tests/wishlist.test.ts tests/toggle-wishlist.test.ts tests/cart-store.test.ts tests/middleware-auth.test.ts
  npm run typecheck
  npx prettier --check components/evironn/profile styles/evironn/ProfilePage.css "app/(shop)/profile/page.tsx" app/layout.tsx tests/evironn-profile-variant-a.test.tsx tests/evironn-profile-source-contract.test.ts e2e/profile.spec.ts
  ```

  Expected green result: focused profile UI/integration tests pass, typecheck exits 0, and source tests prove unsupported clone sections are absent.

- [ ] Record focused evidence in .superpowers/sdd/phase-3-task-7-report.md and progress.md.
- [ ] Commit boundary: feat: port production profile variant a

## Task 8: Lock Purchase-Gated Review Readiness and Delivery Integration

**Files**

- Modify: lib/review.ts
- Modify: app/actions/review.ts
- Modify: services/dto/review.dto.ts
- Modify: tests/review.test.ts
- Modify: tests/submit-review.test.ts
- Create: tests/phase-3-integration-contract.test.ts
- Modify: e2e/review.spec.ts
- Update: e2e/helpers.ts
- Update: .superpowers/sdd/progress.md

**Interfaces and boundaries**

- Keep ReviewEligibility as eligible, not-purchased, or already-reviewed.
- Consolidate one owner/product purchase predicate in lib/review.ts and reuse it from getReviewEligibility, canReview, submitReview, and pruneReviewsAfterCancel. A qualifying line contains canonicalSku.productId or the legacy productVariant.productId. Online orders qualify only when non-cancelled and their payment succeeded; COD orders qualify only when order status is DELIVERED. PENDING or PROCESSING COD orders never qualify.
- submitReview accepts only reviewSchema { productId, rating, body? }, obtains userId from auth(), checks server eligibility, handles the unique productId/userId race, and never accepts an eligibility flag from the client.
- Phase 3 exposes no new review presentation on the accepted PDP. Phase 4 remains responsible for the completed verified-purchase review flow.

**TDD steps**

- [ ] Extend review tests for canonical SKU purchase, legacy fallback, unrelated product, cancelled order, unpaid/failed online payment, succeeded online payment, PENDING and PROCESSING COD rejection, DELIVERED COD eligibility, already-reviewed state, duplicate race, rating/body validation, unauthenticated rejection, and pruning only after the last qualifying purchase disappears.
- [ ] Write the integration source-contract test covering all Phase 3 producer/consumer imports, canonical skuId cart writes, server totals, controlled wishlist, protected profile DTO, shared review predicate, absence of clone mock controllers, unchanged Prisma schema contract, and exclusion of checkout/payment/order/admin/performance modules from the delivery diff.
- [ ] Rewrite e2e/review.spec.ts as a Phase 3 readiness check: a newly verified user with no qualifying purchase sees no enabled review submission path and cannot bypass the protected profile/order boundary. Do not create an order or payment fixture.
- [ ] Run:

      npx vitest run tests/review.test.ts tests/submit-review.test.ts tests/phase-3-integration-contract.test.ts

  Expected red result: canonical purchase, COD-state, payment-state, pruning, or cross-delivery cases fail before the shared predicate and completed integrations are present.

- [ ] Refactor only enough review code to share the server predicate and satisfy the new cases. Do not create review UI, order fixtures, an API route, or schema changes.
- [ ] Confirm the integration contract names the concrete Phase 3 files and rejects productVariantId in new cart write paths while permitting legacy read compatibility in cart/order projection.
- [ ] Run:

  ```text
  npx vitest run tests/review.test.ts tests/submit-review.test.ts tests/phase-3-integration-contract.test.ts tests/cart-route-canonical.test.ts tests/cart-merge-canonical.test.ts tests/wishlist.test.ts tests/profile-page-dto.test.ts tests/auth-config.test.ts tests/middleware-auth.test.ts
  npx prettier --check lib/review.ts app/actions/review.ts services/dto/review.dto.ts tests/review.test.ts tests/submit-review.test.ts tests/phase-3-integration-contract.test.ts e2e/review.spec.ts e2e/helpers.ts
  ```

  Expected green result: all listed tests pass; review eligibility remains server-owned; pending COD cannot unlock reviews; no Phase 4 flow appears.

- [ ] Record focused evidence in .superpowers/sdd/phase-3-task-8-report.md and progress.md.
- [ ] Commit boundary: test: enforce purchase-gated reviews

## Task 9: Final Review, Durable Handoff, and Single Completion Gate

**Files**

- Update: docs/roadmap/STATUS.md
- Create as ignored local evidence: .superpowers/sdd/phase-3-delivery-report.md
- Update: .superpowers/sdd/progress.md

**Pre-gate review**

- [ ] Review only origin/dev...HEAD. Confirm every changed production file belongs to Tasks 1–8, all ignored local task reports and the foundation audit exist, their essential evidence is summarized in tracked progress.md/STATUS.md, and no Critical or Important review finding remains.
- [ ] Verify prisma/schema.prisma and prisma/migrations are unchanged.
- [ ] Verify the diff contains no checkout, payment, order mutation, admin, performance, secret, credential, source absolute path, or clone mock-state work.
- [ ] Verify Git user.name and user.email still belong to the user before any commit.
- [ ] Require E2E_DATABASE_URL to identify the disposable test database and E2E_DATABASE_ALLOW_WRITES=1. Keep RESEND_API_KEY blank through the Playwright guard.
- [ ] If the user has already authorized a branch push and a configured Vercel Preview exists, perform the real Google OAuth smoke manually: start from the production Auth Variant B control, complete Google consent outside Playwright, verify the safe local callback, and record pass/fail without credentials or tokens. Otherwise record `pending Preview acceptance`; this external smoke is a post-push acceptance item, not a reason to push from this task. Never fake or automate the external provider.

**Run the completion gate exactly once**

- [ ] Run these commands in order after all review remediation:

  ```text
  npm run format
  npm run gate
  npm run build
  npm run e2e -- e2e/auth.spec.ts e2e/cart.spec.ts e2e/wishlist.spec.ts e2e/profile.spec.ts e2e/coupon.spec.ts e2e/review.spec.ts
  ```

  Expected result: each command exits 0. The Playwright run covers local Auth Variant B registration/login/verification, guest cart and wishlist merge, canonical Cart Variant A operations, profile/address behavior, cart coupon totals, and review readiness without automating Google or creating checkout/payment/order state.

**Durable close**

- [ ] Write the ignored local .superpowers/sdd/phase-3-delivery-report.md with base SHA, HEAD SHA, task commits, focused evidence, full-gate command outputs, source-copy fingerprints, schema/migration status, database guard used, email suppression, Google Preview smoke result or pending status, known exclusions, and visual-review checklist. Do not force-add ignored reports unless the user explicitly authorizes it.
- [ ] Update docs/roadmap/STATUS.md with Phase 3 implementation state, task commits, validation evidence, no-migration statement, no-new-architecture statement, Google Preview smoke result or `pending Preview acceptance`, and “awaiting desktop/mobile visual acceptance” status. Do not claim acceptance before the user gives it.
- [ ] Update progress.md to mark Tasks 1–9 complete and summarize the ignored local reports’ essential evidence.
- [ ] Review the final documentation diff and scan tracked changed files for secrets.
- [ ] Commit boundary: docs: record phase 3 delivery
- [ ] Stop. Do not push, open a pull request, merge, delete the phase branch, or start Phase 4. The coordinator may push the existing phase branch for Vercel Preview only after explicit authorization, then must wait for user desktop/mobile acceptance of Auth B, Cart A, and Profile A.

---

## Final Traceability Matrix

| Phase 3 requirement                            |             Plan task | Production files                                                                                        | Verification                                                                                                    |
| ---------------------------------------------- | --------------------: | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Foundation compatibility audit                 |                     1 | Existing auth/cart/wishlist/profile/review foundations; e2e/database-guard.ts                           | tests/phase-3-foundation-contract.test.ts; ignored local audit summarized in progress.md                        |
| Reuse fashion-shop platform behavior           |   1, 2, 3, 4, 6, 7, 8 | auth.ts, auth.config.ts, middleware.ts, verification modules, ownership/merge modules, actions          | Existing focused foundation tests plus integration source contract                                              |
| Canonical furniture incompatibility adaptation |      3, 4, 5, 6, 7, 8 | commerce-cart DTO/projection, cart routes, furniture wishlist projection, profile DTO, review predicate | cart-route-canonical, cart-presentation, wishlist, profile-page-dto, review tests                               |
| Auth.js credentials                            |                     2 | auth-variant-b-controller.tsx using existing Auth.js config/credential modules                          | auth variant, auth config, credential, identity, auth E2E                                                       |
| Google OAuth                                   |                  2, 9 | auth-variant-b-controller.tsx; existing auth.config.ts/auth.ts                                          | provider/source/controller tests plus manual configured Preview smoke; no external Google Playwright automation |
| Verification                                   |                     2 | auth pages/controller; existing verification actions and signed cookie/ticket modules                   | verification unit suite, auth variant tests, auth E2E                                                           |
| Roles and middleware                           |                  1, 2 | existing auth.config.ts, middleware.ts, types/next-auth.d.ts                                            | auth-config, middleware-auth, require-admin, integration contract                                               |
| Safe callback URLs                             |                     2 | login/register server pages, controller, lib/safe-redirect.ts                                           | safe-redirect, auth source contract, auth E2E                                                                   |
| No real verification emails                    |               1, 2, 9 | e2e/database-guard.ts, playwright.config.ts                                                             | database-guard unit test and delivery report environment evidence                                               |
| Guest cart                                     |                  3, 5 | existing cart cookie/owner modules, canonical API/store, Cart A                                         | resolve-owner-cart, cart route/store tests, cart E2E                                                            |
| Guest cart merge after sign-in                 |               1, 3, 5 | auth.ts existing event, lib/cart-merge.ts                                                               | cart-merge and cart-merge-canonical tests, cart E2E                                                             |
| Guest wishlist                                 |                     4 | existing wishlist cookie/owner modules, catalog controlled heart                                        | wishlist, toggle, catalog wishlist tests, wishlist E2E                                                          |
| Guest wishlist merge after sign-in             |                  1, 4 | auth.ts existing event, lib/wishlist-merge.ts                                                           | wishlist merge cases and wishlist E2E                                                                           |
| Auth Variant B exact presentation              |                     2 | auth-variant-b.tsx, AuthPage.css, form primitives, clone assets                                         | auth source/shell/assets tests and visual acceptance                                                            |
| Cart Variant A exact presentation              |                     5 | cart-variant-a.tsx, cart-primitives.tsx, both exact CSS files                                           | cart source/shell tests, cart E2E, visual acceptance                                                            |
| Profile Variant A exact presentation           |                     7 | profile-variant-a.tsx, ProfilePage.css                                                                  | profile source/shell tests, profile E2E, visual acceptance                                                      |
| Clone mocks excluded                           |         2, 4, 5, 7, 8 | All production controllers and source contracts                                                         | auth/cart/profile/integration source-contract tests                                                             |
| Canonical skuId cart writes                    |                     3 | cart DTO, POST route, services/store, ProductPage                                                       | cart route/DTO/store/PDP tests                                                                                  |
| Current stock validation                       |                  3, 5 | POST and PATCH cart routes, Cart A controls                                                             | route stock conflict tests and cart E2E                                                                         |
| Server prices and line totals                  |                     3 | lib/cart-presentation.ts, cart API responses                                                            | cart-presentation and route tests                                                                               |
| Server coupon validity and totals              |                     5 | lib/coupon.ts reuse, app/actions/coupon.ts                                                              | coupon and coupon-status tests, coupon E2E                                                                      |
| No client delivery/payment totals              |                  5, 8 | Cart A adapter/source contract                                                                          | cart source contract and integration contract                                                                   |
| Wishlist save from cart                        |                  4, 5 | addToWishlist action and Cart A controller                                                              | wishlist action and cart shell tests                                                                            |
| Canonical recommendations/favorites            |            4, 5, 6, 7 | furniture product adapter, buildCatalogBCard, cart/profile server pages                                 | catalog wishlist, cart shell, profile DTO tests                                                                 |
| Profile data                                   |                  6, 7 | lib/profile-page.ts, profile page/shell, profile actions                                                | profile DTO/action/shell tests and profile E2E                                                                  |
| Addresses                                      |                  6, 7 | app/actions/address.ts, profile shell                                                                   | address action tests and profile E2E                                                                            |
| Read-only existing orders                      |                  6, 7 | lib/profile-page.ts, Profile Variant A orders section                                                   | profile DTO/source/shell tests                                                                                  |
| Password update                                |                  6, 7 | existing app/actions/profile.ts hardened/tested                                                         | update-password test and profile E2E                                                                            |
| Purchase-gated review readiness                |                     8 | lib/review.ts, app/actions/review.ts                                                                    | review, submit-review, integration tests and readiness E2E                                                      |
| No schema migration                            |          Global, 1, 9 | prisma/schema.prisma remains unchanged                                                                  | foundation/integration contract and final diff check                                                            |
| No live database mutation                      |                  1, 9 | e2e/database-guard.ts and Playwright config                                                             | database-guard tests and full-gate precondition                                                                 |
| No checkout/payment/order/admin work           | Global, 5, 6, 7, 8, 9 | Disabled cart controls; read-only profile orders                                                        | source contracts and final diff review                                                                          |
| Preserve Phase 2 UI                            |         2, 3, 4, 5, 7 | accepted shell/header/catalog/PDP files with bounded adapters                                           | existing Phase 2 tests plus new source/shell tests and visual acceptance                                        |
| Preserve performance debt                      |       Global, 3, 8, 9 | ProductPage handoff/loading unchanged                                                                   | integration source contract and final diff review                                                               |
| Completion gate exactly once                   |                     9 | delivery-wide                                                                                           | format, gate, build, six critical E2E specs                                                                     |
| Durable reports and status                     |         Every task, 9 | .superpowers/sdd/progress.md, ignored local task/delivery reports, docs/roadmap/STATUS.md               | final documentation review                                                                                      |

## Planner Self-Review

### Coverage

- [x] The plan covers foundation audit; Auth.js/Auth Variant B; canonical cart/Cart Variant A; wishlist; profile/addresses; coupons/totals/stock; reviews; and integration/delivery close.
- [x] Every task lists concrete create/modify/remove/test paths, a producer/consumer boundary, red/green TDD steps, exact focused commands, expected results, and one English conventional commit subject.
- [x] Clone JSX/CSS copy boundaries and mock exclusions are explicit. Missing binary assets have exact source, target, size-independent SHA-256 identity requirements.
- [x] Security, server authority, safe callbacks, roles, verification, email suppression, no live database, no schema migration, Phase 4 exclusions, accepted Phase 2 UI, and performance debt are explicit.
- [x] The complete delivery gate appears in one task and runs once after all focused work and review remediation.

### Placeholder scan

Run this scanner against the saved plan; it must print no matches:

    rg -n -i '\b[T]ODO\b|\b[T]BD\b|implement\s+[l]ater|appropriate\s+[h]andling|similar\s+[t]o\s+another\s+[t]ask' docs/superpowers/plans/2026-08-14-phase-3-commerce-auth.md

### Type and signature consistency

- [x] Cart API, service, store, ProductPage, Cart A, coupon action, and profile favorite boundaries all use skuId and CartDto.
- [x] Wishlist toggle/add actions share WishlistMutationResult; catalog, cart, and profile consume controlled server results.
- [x] validateCoupon returns a complete CartTotalsDto while preserving code, percent, and discount fields required by inherited compile-time consumers.
- [x] ProfilePageDto is serializable; dates are strings, OrderStatus is a generated enum value, favorites are CatalogBCard values, and email has no mutation callback.
- [x] Review eligibility remains derived from authenticated user, canonical or legacy purchase relation, qualifying order/payment state, and unique review state.

### Architecture-change detection

- [x] No genuinely new architecture choice was found. The plan adapts proven interfaces under ADR-001, ADR-007, ADR-010, ADR-012, ADR-013, ADR-014, and the existing canonical SKU schema.
- [x] DECISIONS.md must not change during this delivery unless implementation uncovers a real choice not represented here. In that event, implementation stops and the coordinator runs focused brainstorming before resuming.

### Planner boundary

- [x] This planning pass changes only docs/superpowers/plans/2026-08-14-phase-3-commerce-auth.md.
- [x] It does not implement production code, switch branches, commit, push, open a pull request, merge, delete branches, reset, clean, modify existing untracked plans, send email, or mutate a database.

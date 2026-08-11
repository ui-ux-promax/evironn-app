# Phase 2A Storefront Foundation and Complete Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inherited RITM storefront shell and home with an exact Next.js port of the accepted Evironn clone header, footer, not-found page, and complete eight-section home.

**Architecture:** Keep Next App Router and foundation services. Port clone interaction shells as focused Client Components under `components/evironn`; keep pure helpers unchanged where possible. Import preserved scoped CSS once from the root layout. Phase 2A home remains presentation-driven and does not query Prisma. Navigation uses production Next routes; cart label receives a serializable count adapter with zero fallback. No catalog/PDP/cart/auth behavior changes.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, preserved CSS, Tailwind foundation, Framer Motion, React Icons, Vitest, Testing Library, Playwright.

**Normative source:** `D:\Новая папка (2)\evironn-clone`.

**Production target:** `D:\Projects\evironn` on `phase/02-storefront`.

---

## Scope and ownership

Phase 2A owns only:

- `app/layout.tsx`, `app/globals.css`, `app/(shop)/layout.tsx`, `app/(shop)/page.tsx`, `app/not-found.tsx`;
- new `components/evironn/**` and `styles/evironn/**`;
- Phase 2A assets under `public/assets/{editorial,furniture,hero,products}` and `public/assets/fonts` plus Evironn logo;
- dependency manifests;
- focused unit/contract/E2E tests named below.

Do not edit catalog/PDP canonical helpers, Prisma/schema/seed, auth, cart mutations, wishlist, checkout, orders, admin, API routes, middleware, Vercel config, or Phase 2B/2C visual files. Preserve unrelated working-tree changes.

## Task 1: Lock source contracts and dependencies

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/evironn-phase-2a-source-contract.test.ts`
- Create: `tests/evironn-public-navigation.test.ts`

- [ ] Record task base SHA, `git status --short`, configured `user.name`/`user.email`, and source clone commit or file hashes in task report.
- [ ] Write failing contract test reading production files and asserting: Evironn logo/brand, eight home section component names in order, `/`, `/catalog`, `/cart`, `/login`, `/profile`, no `ritm-logo.svg`, no inherited home imports, and no Vite `window.location` router.
- [ ] Write failing navigation test for a pure route map exported from `components/evironn/public-routes.ts`: home `/`, catalog `/catalog`, room links as canonical catalog query URLs, showcase product `/product/noma-woven-lounge`, cart `/cart`, login `/login`, profile `/profile`.
- [ ] Run `npx vitest run tests/evironn-phase-2a-source-contract.test.ts tests/evironn-public-navigation.test.ts`; expect failure because production port/route map does not exist.
- [ ] Install clone-compatible `framer-motion` and `react-icons` with npm so both manifests update. Do not manually edit lockfile.
- [ ] Create minimal `components/evironn/public-routes.ts` and make navigation test pass. Keep route values readonly and framework-independent.
- [ ] Run focused tests and `npm run typecheck`; expect pass.
- [ ] Commit exact Task 1 files: `test: define Evironn storefront source contracts`.

## Task 2: Port tokens, fonts, logo, header, footer, and not-found

**Source files:**

- `src/index.css`
- `src/assets/evironn-logo.svg`
- `src/assets/sentient-*.woff2`
- `src/assets/open-design-albert-sans.woff2`
- `src/components/Header.tsx`, `Header.css`
- `src/components/Footer15.tsx`, `Footer15.css`
- `src/not-found/NotFoundPage.tsx`, `NotFoundPage.css`
- `tests/designSystemShell.test.mjs`, `controlConsistencyShell.test.mjs`, `publicNavigationShell.test.mjs`, `notFoundShell.test.mjs`

**Target files:**

- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/(shop)/layout.tsx`
- Create: `app/not-found.tsx`
- Create: `components/evironn/storefront-header.tsx`
- Create: `components/evironn/storefront-footer.tsx`
- Create: `components/evironn/not-found-view.tsx`
- Create: `styles/evironn/tokens.css`
- Create: `styles/evironn/header.css`
- Create: `styles/evironn/footer.css`
- Create: `styles/evironn/not-found.css`
- Create: `public/assets/evironn-logo.svg`
- Create: `public/assets/fonts/sentient-italic-400-reference.woff2`
- Create: `public/assets/fonts/sentient-normal-400-reference.woff2`
- Create: `public/assets/fonts/sentient-italic-300-reference.woff2`
- Create: `public/assets/fonts/sentient-benefits-normal-400-reference.woff2`
- Create: `public/assets/fonts/sentient-benefits-italic-300-reference.woff2`
- Create: `public/assets/fonts/open-design-albert-sans.woff2`
- Create: `tests/evironn-storefront-shell.test.tsx`

- [ ] Port clone shell tests into one failing Vitest/Testing Library test. Assert exact nav labels, logo alt, `Корзина (0)`, footer columns/copy, not-found actions, mobile menu accessible state, and no RITM branding.
- [ ] Copy six local font files and logo byte-for-byte. Record SHA-256 and sizes for source/target equality.
- [ ] Port only clone global tokens/reset/focus/reduced-motion rules required by selected production components. Change font URLs to `/assets/fonts/...`; remove remote font-picker imports and experimental selector rules.
- [ ] Port `Header` as `'use client'`. Preserve scroll condensation, liquid-glass SVG/filter map, mobile navigation, DOM/class names, CSS, and cleanup. Replace anchors with `next/link`. Replace clone cart store with required `cartCount: number` prop; shop layout supplies existing safe count if already serializable, otherwise `0` until Phase 3.
- [ ] Port `Footer15` as Client Component only because Framer Motion needs browser runtime. Preserve DOM, motion, copy, CSS, and links.
- [ ] Port not-found content into `app/not-found.tsx` using shared Evironn chrome once; avoid nested duplicate header/footer.
- [ ] Replace shop layout `SiteHeader`/`SiteFooter` with Evironn components. Preserve JSON-LD and `VerificationGateHost`.
- [ ] Import Evironn CSS from root layout after foundation globals. Do not convert styles to Tailwind.
- [ ] Run focused shell/source tests, typecheck, and `git diff --check`; expect pass.
- [ ] Commit exact Task 2 files: `feat: port Evironn storefront shell`.

## Task 3: Port interactive hero

**Source files:** `Hero.tsx`, `Hero.css`, `HeroProductCaption.tsx`, `HeroProductCard.tsx`, `HeroProductMedia.tsx`, `HeroRoomMedia.tsx`, `heroProductMotion.ts`, `heroProducts.ts`, `heroProductState.ts`, `heroRooms.ts`, `heroRoomState.ts`; clone tests `heroAssets`, `heroProductState`, `heroRoomState`.

**Target files:**

- Create matching kebab-case modules under `components/evironn/home/`
- Create `styles/evironn/home/hero.css`
- Copy exact referenced files into `public/assets/hero/`
- Copy clone `src/assets/furni-hero.png` to `public/assets/hero/living-room-idle.png`
- Create: `tests/evironn-hero-state.test.ts`
- Create: `tests/evironn-hero-assets.test.ts`
- Create: `tests/evironn-hero-shell.test.tsx`

- [ ] Port state/asset tests first. Assert room/product IDs, transitions, lock/back behavior, reduced-motion path, media URLs, and source/target SHA-256 equality. Run; expect missing-module/assets failure.
- [ ] Copy only: `kitchen-idle.jpg`, `bedroom-idle.jpg`, `terrace-idle.jpg`; eight `*-forward.mp4`, eight `*-reverse.mp4`, eight `*-focus.webp` entries listed by clone `heroProducts.ts`; living room image above.
- [ ] Port pure helpers without semantic changes. Replace `new URL(..., import.meta.url)` with public URL constant. Route product CTAs to showcase URL and room CTAs to catalog query URLs.
- [ ] Port interactive components as Client Components. Preserve DOM/classes, timers, video fallback events, pointer/keyboard behavior, resize listeners, Framer Motion, and reduced motion. Ensure every effect cleans listeners/timers.
- [ ] Port CSS unchanged except asset path and deliberate collision fixes. Keep hero root scope.
- [ ] Run three focused tests, typecheck, Prettier check on Task 3 files, and `git diff --check`; expect pass.
- [ ] Commit exact Task 3 files: `feat: port interactive Evironn hero`.

## Task 4: Port remaining seven home sections

**Source component set:** `FurnitureEditorialSections.*`, `InteractiveFurnitureCards.*`, `FurnitureCaption.tsx`, `furnitureCaptionMotion.ts`, `furniturePlayback.ts`, `EditorialStatement.*`, `NatureSection.*`, `BenefitsShowcaseSection.*`, `InstagramFollowSection.*`, `useEditorialAnimation.ts`.

**Target files:** matching kebab-case modules under `components/evironn/home/`, matching CSS under `styles/evironn/home/`, exact referenced assets under `public/assets/editorial`, `public/assets/furniture`, and `public/assets/products`; tests `evironn-home-state.test.ts`, `evironn-home-assets.test.ts`, `evironn-home-shell.test.tsx`.

- [ ] Port clone `furnitureContent`, `furniturePlayback`, `categoryMedia`, and relevant shell assertions into failing Vitest tests. Assert complete section order after hero: categories, interactive cards, editorial statement, nature, benefits, parallax, Instagram.
- [ ] Build explicit asset manifest from selected source modules. It must contain four category images, parallax image, editorial font, three material details, two furniture wide images, five product idle images, ten product forward/reverse videos, two product cutouts, and three room images reused by Instagram. Copy byte-for-byte; test existence, nonzero size, and SHA-256 equality. Do not copy product-page media or experimental `src/assets` files.
- [ ] Port pure playback/caption helpers unchanged. Route every product link to showcase URL; route category/Instagram links through `public-routes.ts`.
- [ ] Port seven sections and CSS preserving DOM, copy, motion, hover/touch state, parallax behavior, responsive breakpoints, reduced motion, and cleanup.
- [ ] Keep decorative media as `<img>`/`<video>` when exact clone layout depends on native sizing. Document any `next/image` exception; do not change rendered geometry.
- [ ] Run focused state/assets/shell tests, typecheck, Prettier check, and `git diff --check`; expect pass.
- [ ] Commit exact Task 4 files: `feat: port complete Evironn home sections`.

## Task 5: Compose Next home and remove inherited presentation

**Files:**

- Modify: `app/(shop)/page.tsx`
- Delete only after replacement passes: inherited RITM home components under `components/shared/home/**`, `components/shared/site-header.tsx`, `components/shared/site-footer.tsx` when no remaining import exists
- Modify: `tests/evironn-phase-2a-source-contract.test.ts`
- Create: `e2e/evironn-home.spec.ts`

- [ ] Extend source contract test first: exact eight-section order, no Prisma/auth/wishlist query in home page, no inherited home/header/footer imports, single header/footer from shop layout. Run; expect failure against old page.
- [ ] Replace home page with exact clone composition: Hero, FurnitureCategorySection, InteractiveFurnitureCards, EditorialStatement, NatureSection, BenefitsShowcaseSection, FurnitureWorksParallax, InstagramFollowSection. Remove `force-dynamic` and all product/auth/database reads from home.
- [ ] Delete inherited presentation files only after `rg` confirms zero imports. Preserve shared components used by catalog/PDP/commerce.
- [ ] Add Playwright scenarios at 1440×1000 and 390×844: brand/header, mobile menu, all eight sections in order, footer, showcase product links, catalog links, keyboard focus, no horizontal overflow, no console/page errors. Add reduced-motion scenario verifying motion/video fallback contract without autoplay dependence.
- [ ] Run focused tests and `npm run e2e -- e2e/evironn-home.spec.ts`; expect all pass. If runtime/database blocks despite static home, record exact blocker; do not weaken assertions.
- [ ] Run `npm run format`, `npm run gate`, `npm run build`, focused E2E, and `git diff --check`. Record test counts and warnings.
- [ ] Commit exact Task 5 files: `feat: replace inherited storefront home`.

## Task 6: Review, Preview, and visual acceptance stop

- [ ] Generate Phase 2A base-to-HEAD diff. Review for spec compliance and code quality. Remediate all Critical/Important findings; repeat review.
- [ ] Verify no secrets, source `.git`, `node_modules`, `dist`, logs, picker routes, mock commerce state, Phase 2B/2C UI, or oversized Git objects were added.
- [ ] Update `docs/roadmap/STATUS.md`, `.superpowers/sdd/progress.md`, and task reports with commits, checks, deviations, asset inventory, review results, and Preview URL.
- [ ] Push `phase/02-storefront` only after configured identity/account check. Do not open Phase 2 PR yet.
- [ ] Present Vercel Preview for user comparison with clone at desktop and mobile. Stop. Phase 2B remains unauthorized until explicit visual acceptance.

## Final self-review

- Spec coverage: shell, tokens/fonts, eight-section home, not-found, navigation, motion, reduced motion, exact assets, route adaptation, source tests, Next integration, E2E, review, and visual gate each have an owner.
- Boundaries: no Prisma or commerce changes; existing Task 2/3 logic untouched; no PDP media generation; no mock production state.
- Type consistency: browser interactions stay in Client Components; route maps and state helpers remain pure; server layout passes serializable primitives only.
- Placeholder scan: no `TODO`, ellipsis, “similar files”, guessed runtime SHA, or omitted validation command.
- Visual rule: tests and review cannot authorize Phase 2B; user acceptance required.

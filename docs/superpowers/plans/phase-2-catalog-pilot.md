# Phase 2 Catalog Pilot Implementation Plan

> **Current execution boundary (2026-08-11):** Task 1 is complete. Execute Task 2 only, then stop for review and user evaluation. Tasks 3 and 4 are retained as future draft scope and are not currently authorized.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a bounded, visually reviewable Evironn home/catalog/product pilot backed only by the canonical furniture catalog, with server pagination, URL filters, server-owned SKU resolution, responsive Tailwind UI, reduced motion, and resilient 360 media.

**Architecture:** Keep the existing Next.js App Router, Prisma, React, TypeScript, and Tailwind stack. Replace storefront reads of the temporary `ProductColorway`/`ProductVariant` adapter with small server-side projection helpers over `Product.skus`, normalized option selections, `ProductMedia`, and `SkuMedia`; catalog state remains URL-driven, and PDP option links round-trip through the page server component so the server resolves the canonical SKU. Port only three selected visual slices from the Evironn archive: a furniture hero/category entry on home, the catalog filter/product grid, and the PDP media/configurator.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript 5.7, Prisma 6, Tailwind CSS 3, CSS Modules for isolated media/motion effects, Vitest/Testing Library, Playwright.

## Global Constraints

- Work only on `phase/02-storefront`; do not commit to `dev` or `main`.
- Pilot scope only: selected home, catalog, and product interfaces. Do not implement authentication, cart/commerce mutations, checkout, admin, reviews, or broad storefront polish.
- `Product`, `Sku`, normalized `SkuOptionValue` selections, `ProductMedia`, and `SkuMedia` are canonical. Do not read `ProductColorway`, `ProductVariant`, or `ProductImage` from pilot storefront paths.
- The server owns SKU resolution, stock, price, and selected media. PDP controls are links that encode selections in `?option=group:value,...`; the server validates and canonicalizes them before rendering.
- Catalog filters are URL-driven and products are paginated with Prisma `skip`/`take`; never fetch the complete result set and paginate in memory.
- Use Tailwind utilities for layout and controls. Put only 360/media transitions or keyframes that Tailwind cannot express cleanly in a colocated CSS Module.
- Respect `prefers-reduced-motion`; no autoplay, forced smooth scrolling, reveal transform, or looping animation is required to understand or operate the pilot.
- A turntable uses the Phase 1 contract: one video, one poster, and one static fallback. Do not build a frame-sequence or 3D viewer.
- Preserve user changes. The pre-existing edits to `docs/roadmap/STATUS.md`, `.superpowers/`, and `docs/superpowers/` are coordinator-owned.
- Each task uses TDD, a focused verification run, one English conventional commit, an implementer report, and a fresh task review before the next task begins.
- Before every commit, verify `git config user.name` and `git config user.email`; do not add AI/bot/co-author trailers.

## Pilot File Map

| Area                  | Responsibility                                                                                                    | Files owned in this pilot                                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical projections | Stable DTOs and pure SKU/media selection helpers shared by home, catalog, and PDP                                 | `lib/furniture-product-summary.ts`, `lib/get-furniture-product.ts`, `lib/product-selection.ts`, `tests/furniture-product-summary.test.ts`, `tests/product-selection.test.ts`                               |
| Catalog               | Parse furniture URLs, build canonical Prisma predicates, query one server page, and render furniture facets/cards | `constants/config.ts`, `lib/catalog-filters.ts`, `lib/find-products.ts`, `hooks/use-catalog-url.ts`, `app/(shop)/catalog/page.tsx`, `components/shared/catalog/*` listed in Task 2, catalog unit/E2E tests |
| Product               | Server-resolved option URL, selected SKU price/stock/media, 360 video/poster/static fallback                      | `app/(shop)/product/[slug]/page.tsx`, `components/shared/product/product-view.tsx`, `components/shared/product/purchase-panel.tsx`, new media component/module, product unit/E2E tests                     |
| Home                  | Small furniture hero, category links, and canonical bestseller grid                                               | `app/(shop)/page.tsx`, new home pilot components/module, `components/shared/home/bestsellers-section.tsx`, landing unit/E2E tests                                                                          |

Files outside this map are out of scope. In particular, do not edit `prisma/schema.prisma`, migrations, seed data, `store/`, `services/dto/cart.dto.ts`, `app/api/cart/`, auth, checkout, orders, reviews, admin, or demo-admin.

---

### Task 1: Canonical Furniture Storefront Projections

**Files:**

- Create: `lib/product-selection.ts`
- Create: `lib/furniture-product-summary.ts`
- Create: `lib/get-furniture-product.ts`
- Create: `tests/furniture-product-summary.test.ts`
- Create: `tests/product-selection.test.ts`

**Interfaces:**

- Consumes: existing `buildCombinationKey(selections: SkuOptionSelection[]): string` from `lib/furniture-sku.ts` and canonical Prisma relations from ADR-004/ADR-011.
- Produces:
  - `FurnitureProductCardData` with `primarySkuId`, `imageUrl`, `minPrice`, `minOldPrice`, `soldOut`, and furniture option swatches; it has no colorway/size/legacy variant fields.
  - `parseOptionParam(raw): Record<string, string>`.
  - `serializeOptionParam(selection): string` with stable group ordering.
  - `resolveSelectedSku(product, requested): ResolvedProductSelection`, where the selected SKU is active, belongs to the product, has a complete canonical combination, and media precedence is selected SKU images -> product images.
  - `productDetailInclude` containing category, rooms, ordered product option groups/values, active SKUs with selections/media, and ordered product media only.

**Dependencies:** None. Tasks 2, 3, and 4 consume these DTOs and helpers.

- [ ] **Step 1: Write failing tests for canonical card projection**

  In `tests/furniture-product-summary.test.ts`, construct a typed fixture with two active canonical SKUs, normalized selections, product media, and no legacy relations. Assert that `buildFurnitureProductCardData`:

  ```ts
  expect(card.primarySkuId).toBe('sku-cheap');
  expect(card.minPrice).toBe(124000);
  expect(card.minOldPrice).toBe(139000);
  expect(card.imageUrl).toBe('/assets/products/chair-oak.webp');
  expect(card.soldOut).toBe(false);
  expect(card.optionSwatches).toEqual([
    { groupSlug: 'finish', valueSlug: 'oak', label: 'Дуб', swatchHex: '#c8a97e' },
    { groupSlug: 'finish', valueSlug: 'walnut', label: 'Орех', swatchHex: '#6b4a30' },
  ]);
  expect(card).not.toHaveProperty('colorways');
  expect(card).not.toHaveProperty('sizes');
  ```

  Add a sold-out case proving inactive SKUs do not affect price or availability and SKU image absence falls back to the first ordered product `IMAGE`.

- [ ] **Step 2: Run the card test and confirm the legacy projection fails**

  Run: `npx vitest run tests/furniture-product-summary.test.ts`

  Expected: FAIL because the current include and DTO expose `colorways`/`variants` and have no canonical SKU fields.

- [ ] **Step 3: Implement the minimal canonical card projection**

  Add `furnitureProductCardInclude` as a Prisma-checked include equivalent to:

  ```ts
  export const furnitureProductCardInclude = {
    category: { select: { name: true, slug: true } },
    media: { where: { kind: 'IMAGE' }, orderBy: { sortOrder: 'asc' as const } },
    skus: {
      where: { active: true },
      orderBy: [{ price: 'asc' as const }, { id: 'asc' as const }],
      include: {
        media: { where: { kind: 'IMAGE' }, orderBy: { sortOrder: 'asc' as const } },
        selections: {
          include: { optionGroup: true, optionValue: true },
          orderBy: { optionGroup: { sortOrder: 'asc' as const } },
        },
      },
    },
  } satisfies Prisma.ProductInclude;
  ```

  Derive visible price/old price/stock from active canonical SKUs, prefer the cheapest in-stock SKU and then the cheapest active SKU, and deduplicate swatches by `groupSlug:valueSlug`. Keep the existing badge calculation but feed it canonical stock and price values.

- [ ] **Step 4: Write failing tests for option parsing and server SKU resolution**

  In `tests/product-selection.test.ts`, cover:

  ```ts
  expect(parseOptionParam('upholstery:ivory-boucle,finish:oak')).toEqual({
    upholstery: 'ivory-boucle',
    finish: 'oak',
  });
  expect(serializeOptionParam({ upholstery: 'ivory-boucle', finish: 'oak' })).toBe(
    'finish:oak,upholstery:ivory-boucle',
  );
  expect(resolveSelectedSku(product, { finish: 'oak', upholstery: 'ivory-boucle' }).sku.id).toBe('sku-oak');
  expect(resolveSelectedSku(product, { finish: 'invalid' }).canonicalSelection).toEqual(defaultCompleteSelection);
  expect(resolveSelectedSku(product, completeSelection).images).toEqual(skuImages);
  ```

  Also assert: partial input is completed only with a valid SKU combination; an impossible combination falls back deterministically to the first in-stock active SKU then first active SKU; inactive SKUs never resolve; SKU media falls back to product images; turntable video/poster/fallback remain product-level media.

- [ ] **Step 5: Run the selection test and confirm it fails**

  Run: `npx vitest run tests/product-selection.test.ts`

  Expected: FAIL because `lib/product-selection.ts` does not exist.

- [ ] **Step 6: Implement pure selection helpers and canonical detail include**

  Use `buildCombinationKey` for exact matching. The returned shape must be explicit and serializable:

  ```ts
  export interface ResolvedProductSelection {
    sku: {
      id: string;
      articleNumber: string;
      combinationKey: string;
      price: number;
      oldPrice: number | null;
      stock: number;
    };
    canonicalSelection: Record<string, string>;
    optionGroups: Array<{
      slug: string;
      name: string;
      values: Array<{ slug: string; name: string; swatchHex: string | null; available: boolean }>;
    }>;
    images: Array<{ url: string; alt: string }>;
    turntable: {
      videoUrl: string;
      posterUrl: string;
      fallbackUrl: string;
      alt: string;
    } | null;
  }
  ```

  `available` means at least one active SKU is compatible with the other currently selected groups plus that value. The parser must ignore malformed tokens, blank values, duplicate groups after the first occurrence, and prototype-pollution keys (`__proto__`, `prototype`, `constructor`).

  Export `getFurnitureProductBySlug` from `lib/get-furniture-product.ts` using the canonical `productDetailInclude`; do not include legacy relations. Leave `lib/product-summary.ts` and `lib/get-product.ts` unchanged in Task 1 so existing routes continue to type-check until their owning tasks cut over.

- [ ] **Step 7: Run focused tests and type checking**

  Run: `npx vitest run tests/furniture-product-summary.test.ts tests/product-selection.test.ts tests/furniture-domain.test.ts`

  Expected: PASS.

  Run: `npm run typecheck`

  Expected: PASS with the existing storefront still compiling against its untouched legacy helpers; do not begin Tasks 2-4.

- [ ] **Step 8: Commit Task 1**

  Verify identity with `git config user.name` and `git config user.email`, stage only Task 1 files, then commit:

  ```text
  feat: add canonical furniture storefront projections
  ```

  Write the implementer report to the coordinator-assigned path and include focused command output plus the exact commit SHA.

---

### Task 2: URL-Driven Furniture Catalog with Server Pagination

**Files:**

- Modify: `constants/config.ts`
- Modify: `lib/catalog-filters.ts`
- Modify: `lib/find-products.ts`
- Modify: `hooks/use-catalog-url.ts`
- Modify: `app/(shop)/catalog/page.tsx`
- Modify: `components/shared/catalog/filter-controls.tsx`
- Modify: `components/shared/catalog/active-filter-chips.tsx`
- Modify: `components/shared/catalog/catalog-product-card.tsx`
- Modify: `components/shared/catalog/catalog-hero.tsx`
- Modify: `components/shared/catalog/catalog-states.tsx`
- Modify: `components/shared/catalog/pagination.tsx`
- Create: `components/shared/catalog/option-facet.tsx`
- Delete after imports are removed: `components/shared/catalog/size-filter.tsx`
- Delete after imports are removed: `components/shared/catalog/color-filter.tsx`
- Modify: `tests/catalog-filters.test.ts`
- Modify: `tests/catalog-pagination.test.ts`
- Modify: `tests/catalog-product-card.test.ts`
- Create: `tests/find-products.test.ts`
- Replace pilot scenarios in: `e2e/catalog.spec.ts`

**Interfaces:**

- Consumes: canonical `furnitureProductCardInclude`/`buildFurnitureProductCardData` from Task 1.
- Produces:
  - `CatalogParams` containing `categories`, `rooms`, `options`, `priceFrom`, `priceTo`, `inStock`, `sort`, `page`, and optional `query`.
  - URL contract: `category=sofas,chairs`, `room=living`, `option=finish:oak,upholstery:sage-linen`, `priceFrom=50000`, `priceTo=180000`, `inStock=1`, `sort=price-asc`, `page=2`, `q=noma`.
  - `CatalogResult.facets` for categories, rooms, canonical option groups/values, and global active-SKU price bounds.

**Dependencies:** Task 1 approved.

- [ ] **Step 1: Rewrite filter tests for the furniture URL contract**

  Replace fashion assertions in `tests/catalog-filters.test.ts` with exact cases for category, room, normalized option selections, price, stock, search, sort, and page. The central predicate expectation is:

  ```ts
  expect(buildProductWhere(parseCatalogParams(input))).toMatchObject({
    active: true,
    category: { slug: { in: ['sofas'] } },
    rooms: { some: { room: { slug: { in: ['living'] } } } },
    skus: {
      some: {
        active: true,
        stock: { gt: 0 },
        price: { gte: 50000, lte: 180000 },
        AND: [
          { selections: { some: { optionGroup: { slug: 'finish' }, optionValue: { slug: { in: ['oak'] } } } } },
          {
            selections: {
              some: { optionGroup: { slug: 'upholstery' }, optionValue: { slug: { in: ['sage-linen'] } } },
            },
          },
        ],
      },
    },
  });
  ```

  Multiple values within one option group use `in` (OR); separate groups become `AND`. Invalid option tokens are ignored. Preserve deterministic `id` tie-breaks and `CATALOG_PAGE_SIZE = 12`.

- [ ] **Step 2: Run filter tests and confirm they fail against legacy predicates**

  Run: `npx vitest run tests/catalog-filters.test.ts`

  Expected: FAIL because current filters target gender, size, colorways, and product variants.

- [ ] **Step 3: Implement furniture URL parsing and Prisma predicates**

  Remove clothing sizes/gender/brand/colorway handling from this pilot path. Build one `SkuWhereInput` containing active, optional stock, optional price, and one selection predicate per option group, then assign it to `where.skus.some`. Keep product search as case-insensitive name matching and server order as existing denormalized product columns plus `id`.

  In `constants/config.ts`, remove catalog UI dependence on `CLOTHING_SIZES`/`GENDER_OPTIONS`; do not delete constants still used by non-pilot legacy/admin code.

- [ ] **Step 4: Write failing query orchestration tests**

  In `tests/find-products.test.ts`, mock Prisma and assert:

  - count/facets run before the page query;
  - an out-of-range `page=999` is clamped before `skip` is calculated;
  - the product query receives canonical `furnitureProductCardInclude`, deterministic `orderBy`, `skip`, and `take: 12`;
  - category/room/option facets are built from canonical relations only;
  - price bounds aggregate active canonical SKUs only;
  - no call targets `productColorway` or `productVariant`.

  Use this critical expectation for page 2:

  ```ts
  expect(prisma.product.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ skip: 12, take: 12, include: furnitureProductCardInclude }),
  );
  ```

- [ ] **Step 5: Run the query test and confirm it fails**

  Run: `npx vitest run tests/find-products.test.ts`

  Expected: FAIL because `findProducts` still queries legacy colorway/variant facets.

- [ ] **Step 6: Rework `findProducts` around canonical queries**

  Keep the count-then-clamp-then-page-query sequence. Load categories and rooms ordered by `sortOrder`; load product option groups/values ordered by group/value order and attach counts for active matching products. Facet queries may be independent of the current facet's own selected values, but must respect the other active filters so displayed non-zero counts do not promise an empty result. Do not materialize all matching products.

- [ ] **Step 7: Rewrite catalog components as a furniture pilot**

  `FilterControls` renders category, room, canonical option groups, price, and stock. `OptionFacet` uses `paramKey="option"`, toggles one `groupSlug:valueSlug` token, renders swatches when `swatchHex` exists, and otherwise renders a checkbox row. `ActiveFilterChips` labels option tokens from facets and removes exactly one token.

  `CatalogProductCard` becomes display/navigation only for this pilot:

  ```tsx
  <article data-testid="catalog-product-card" className="...Tailwind classes...">
    <Link href={`/product/${data.slug}`} aria-label={data.name}>
      ...
    </Link>
    <p>{data.categoryName}</p>
    <PriceTag price={data.minPrice} compareAtPrice={data.minOldPrice} />
    <p>{data.soldOut ? 'Нет в наличии' : 'В наличии'}</p>
  </article>
  ```

  Do not import the cart store, size guide, legacy variants, or issue wishlist/cart mutations. Preserve semantic headings, keyboard focus, responsive one/two/three-column layout, loading/empty states, and server count. Pagination keeps query parameters and uses a compact page window (`1`, nearby pages, `gap`, last) rather than rendering unbounded buttons.

- [ ] **Step 8: Update component tests, failing first**

  Update the three catalog component tests to assert furniture card content, canonical option chip toggling, and compact pagination. Run before implementation completion to observe failures, then run again:

  Run: `npx vitest run tests/catalog-product-card.test.ts tests/catalog-pagination.test.ts`

  Expected final result: PASS.

- [ ] **Step 9: Replace catalog E2E scenarios with pilot behavior**

  In `e2e/catalog.spec.ts`, cover only:

  1. `/catalog` renders furniture cards sourced from Phase 1 fixtures.
  2. Category + room + option changes update the URL and reset `page`.
  3. Price and stock filters narrow results.
  4. Page 2 changes the URL and product slice when more than 12 fixtures match; if the seed has only 12-15 products, use an unfiltered first page and assert the expected second-page remainder.
  5. Invalid/out-of-range values produce a stable empty or clamped state without a server error.

  Do not assert cart, wishlist, authentication, or checkout behavior.

- [ ] **Step 10: Verify and commit Task 2**

  Run:

  ```text
  npx vitest run tests/catalog-filters.test.ts tests/find-products.test.ts tests/catalog-product-card.test.ts tests/catalog-pagination.test.ts
  npm run typecheck
  npm run e2e -- e2e/catalog.spec.ts
  ```

  Expected: all PASS. If E2E cannot connect to the configured database, record the exact environmental failure; do not claim the scenario passed.

  Verify Git identity, stage only Task 2 files, and commit:

  ```text
  feat: add server-driven furniture catalog
  ```

  Write the assigned implementer report with command output and commit SHA.

---

### Task 3: Server-Resolved Product Configuration and Resilient 360 Media

**Files:**

- Modify: `app/(shop)/product/[slug]/page.tsx`
- Modify: `components/shared/product/product-view.tsx`
- Modify: `components/shared/product/purchase-panel.tsx`
- Create: `components/shared/product/product-media-stage.tsx`
- Create: `components/shared/product/product-media-stage.module.css`
- Modify: `tests/product-view-color-selection.test.ts` (rename test descriptions/fixtures to canonical options; the filename may remain to avoid an unrelated rename)
- Create: `tests/product-media-stage.test.tsx`
- Replace pilot scenarios in: `e2e/product.spec.ts`

**Interfaces:**

- Consumes: `parseOptionParam`, `serializeOptionParam`, `resolveSelectedSku`, `ResolvedProductSelection`, and canonical `getFurnitureProductBySlug` from Task 1.
- Produces: `/product/[slug]?option=finish:oak,upholstery:ivory-boucle` as the canonical selected-configuration URL and a product view whose price, old price, article, stock, availability, and media all come from the server-resolved SKU.

**Dependencies:** Task 1 approved. Task 2 approved so product links and styling use the same canonical card DTO.

- [ ] **Step 1: Write failing PDP component tests for canonical option links**

  Rewrite the existing product-view selection fixture around `ResolvedProductSelection`. Assert:

  ```ts
  expect(screen.getByRole('link', { name: 'Орех' })).toHaveAttribute(
    'href',
    '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
  );
  expect(screen.getByText('EV-NWL-OAK')).toBeVisible();
  expect(screen.getByText(/124[\s\u00a0]000 ₽/)).toBeVisible();
  expect(screen.getByText('В наличии: 3')).toBeVisible();
  ```

  Assert incompatible values are disabled/non-linked, active selection uses `aria-current="true"`, and no cart store call/import is needed.

- [ ] **Step 2: Run the PDP component test and confirm it fails**

  Run: `npx vitest run tests/product-view-color-selection.test.ts`

  Expected: FAIL because the current view manages colorway/variant client state and uses legacy cart IDs.

- [ ] **Step 3: Rebuild the PDP server boundary**

  In the page server component:

  ```ts
  const requested = parseOptionParam(first(searchParams.option));
  const selection = resolveSelectedSku(product, requested);
  ```

  Pass only serializable product/selection data to the client-free view where possible. Generate metadata and Product JSON-LD from canonical product/SKU media and canonical active SKUs. The visible page must not query/render mock fashion reviews, legacy fallback T-shirt images, colorways, sizes, `ProductVariant`, cart mutation controls, auth state, review eligibility, or wishlist state.

  If the incoming option string is partial/invalid, render the deterministic valid selection. A canonical redirect is optional only if it can be implemented without a navigation loop; rendering a canonical `<link>` and valid option hrefs is sufficient for the pilot.

- [ ] **Step 4: Implement the Tailwind furniture configurator**

  `ProductView` owns the responsive Evironn archive-derived split: media stage first, then product title/category, article, price/old price, stock, option groups, description/specs, and a visibly disabled commerce CTA with helper text that cart activation is outside this pilot. `PurchasePanel` becomes a presentational server-compatible option panel: no `useState`, Axios, countdown, router checkout, or cart store.

  Each option value is either a `Link` with a fully serialized prospective selection or a disabled `span/button`; changing any option always round-trips through the server. Tailwind handles all layout, typography, borders, responsive behavior, selected states, and focus states.

- [ ] **Step 5: Write failing media fallback tests**

  In `tests/product-media-stage.test.tsx`, mock `next/image`, `matchMedia`, and media events. Cover:

  - normal mode renders video with `poster`, `muted`, `loop`, `playsInline`, and an explicit play/pause control;
  - video does not autoplay by default;
  - `prefers-reduced-motion: reduce` initially renders the poster/static presentation and never starts playback without explicit user action;
  - video `error` replaces the video with `fallbackUrl` and announces `360° недоступен, показано статичное изображение` in a polite status region;
  - missing/incomplete turntable data renders the selected SKU/product image gallery only.

- [ ] **Step 6: Run the media test and confirm it fails**

  Run: `npx vitest run tests/product-media-stage.test.tsx`

  Expected: FAIL because `ProductMediaStage` does not exist.

- [ ] **Step 7: Implement `ProductMediaStage` and isolated CSS**

  Use a native `<video>` and React state only for explicit playback/error/fallback. The component contract is:

  ```ts
  interface ProductMediaStageProps {
    images: Array<{ url: string; alt: string }>;
    turntable: {
      videoUrl: string;
      posterUrl: string;
      fallbackUrl: string;
      alt: string;
    } | null;
  }
  ```

  Keep CSS Module content limited to aspect-stage layering, opacity transition, and any one required keyframe. Include:

  ```css
  @media (prefers-reduced-motion: reduce) {
    .mediaTransition {
      transition: none;
      animation: none;
    }
  }
  ```

  Never hide the poster/fallback behind a JS-only state; the stage must remain meaningful with JS disabled or a failed video.

- [ ] **Step 8: Replace product E2E scenarios with pilot behavior**

  Use `noma-woven-lounge` (the seeded turntable product). Cover:

  1. default valid canonical SKU displays article, price, stock, and furniture image;
  2. selecting `finish=walnut` updates `?option=...` and updates article/price/stock from the server response;
  3. an invalid combination never exposes an inactive/non-product SKU and falls back deterministically;
  4. 360 stage has poster and a static fallback path;
  5. reduced-motion emulation produces no autoplay/looping motion and leaves a visible static product image.

  Do not add-to-cart or enter checkout.

- [ ] **Step 9: Verify and commit Task 3**

  Run:

  ```text
  npx vitest run tests/product-selection.test.ts tests/product-view-color-selection.test.ts tests/product-media-stage.test.tsx
  npm run typecheck
  npm run e2e -- e2e/product.spec.ts
  ```

  Expected: all PASS, subject to the same explicit database-environment reporting rule.

  Verify Git identity, stage only Task 3 files, and commit:

  ```text
  feat: add server-resolved furniture product view
  ```

  Write the assigned implementer report with command output and commit SHA.

---

### Task 4: Selected Evironn Home Slice and Pilot Acceptance Scenarios

**Files:**

- Modify: `app/(shop)/page.tsx`
- Create: `components/shared/home/furniture-hero.tsx`
- Create: `components/shared/home/category-showcase.tsx`
- Create: `components/shared/home/home-pilot-motion.module.css`
- Modify: `components/shared/home/bestsellers-section.tsx`
- Create: `tests/home-catalog-pilot.test.tsx`
- Replace pilot scenarios in: `e2e/landing.spec.ts`
- Modify: `e2e/landing-motion.spec.ts`

**Interfaces:**

- Consumes: canonical `furnitureProductCardInclude`/`buildFurnitureProductCardData` from Task 1 and existing ordered `Category` data.
- Produces: a small home composition containing a responsive furniture hero, category links to the Task 2 URL contract, and up to six canonical bestseller cards linking to Task 3 PDPs.

**Dependencies:** Tasks 1-3 approved.

- [ ] **Step 1: Write a failing home composition test**

  In `tests/home-catalog-pilot.test.tsx`, render the new home components with canonical furniture fixtures and assert:

  ```ts
  expect(screen.getByRole('heading', { level: 1, name: /мебель для спокойных интерьеров/i })).toBeVisible();
  expect(screen.getByRole('link', { name: /смотреть каталог/i })).toHaveAttribute('href', '/catalog');
  expect(screen.getByRole('link', { name: 'Кресла' })).toHaveAttribute('href', '/catalog?category=armchairs');
  expect(screen.getByRole('link', { name: /Noma Woven Lounge/i })).toHaveAttribute(
    'href',
    '/product/noma-woven-lounge',
  );
  ```

  Assert there is no RITM/fashion copy, clothing category, or legacy product media URL in the rendered output.

- [ ] **Step 2: Run the home test and confirm it fails**

  Run: `npx vitest run tests/home-catalog-pilot.test.tsx`

  Expected: FAIL because the current home composition and bestsellers tabs are fashion-oriented.

- [ ] **Step 3: Implement the bounded home composition**

  Query in parallel:

  - up to six active bestseller/new products with canonical `furnitureProductCardInclude`;
  - up to six categories ordered by `sortOrder`, selecting `name`, `slug`, `tagline`, and `coverImage`.

  Render only:

  1. `FurnitureHero`: Evironn furniture headline/copy, `/catalog` CTA, one existing local furniture asset, responsive Tailwind layout.
  2. `CategoryShowcase`: category links using `/catalog?category=<slug>` and category cover or a neutral Tailwind fallback.
  3. `BestsellersSection`: canonical display-only furniture cards and category chips from the loaded categories.

  Remove `IntroSection`, `EditorialSection`, and `SeasonSection` from the pilot page composition without deleting those files. Do not redesign global header/footer, implement a full archive landing page, add new external assets, or touch deferred routes.

- [ ] **Step 4: Isolate and reduce home motion**

  Prefer Tailwind `motion-reduce:*` variants. Put only a subtle hero/media entrance in `home-pilot-motion.module.css`; the page must be fully visible before JS hydration. The reduced-motion block must remove transform/animation/transition. Reuse `RevealObserver` only if the no-JS and reduced-motion tests remain true; otherwise omit reveal behavior from the pilot home.

- [ ] **Step 5: Replace landing E2E coverage**

  `e2e/landing.spec.ts` verifies the three selected slices, furniture copy, category URL, and product URL. `e2e/landing-motion.spec.ts` keeps only a reduced-motion scenario that asserts computed `animationName === 'none'`, visible content, and no auto-advancing carousel expectation.

- [ ] **Step 6: Run focused pilot verification**

  Run:

  ```text
  npx vitest run tests/home-catalog-pilot.test.tsx tests/furniture-product-summary.test.ts
  npm run typecheck
  npm run e2e -- e2e/landing.spec.ts e2e/landing-motion.spec.ts
  ```

  Expected: all PASS, subject to explicit reporting of unavailable database/environment dependencies.

- [ ] **Step 7: Commit Task 4**

  Verify Git identity, stage only Task 4 files, and commit:

  ```text
  feat: add Evironn catalog pilot home
  ```

  Write the assigned implementer report with command output and commit SHA.

---

## Pilot Integration Gate (Root Coordinator, Not an Additional Implementation Task)

After all four task reviews have no open Critical or Important findings:

- [ ] Dispatch one fresh Sol High reviewer for the pilot merge-base-to-HEAD diff only.
- [ ] Resolve all Critical/Important findings through the owning task implementer and repeat focused review as required.
- [ ] Run fresh repository checks from `phase/02-storefront`:

  ```text
  npm run format
  npm run gate
  npm run build
  npm run e2e -- e2e/catalog.spec.ts e2e/product.spec.ts e2e/landing.spec.ts e2e/landing-motion.spec.ts
  ```

- [ ] Review `git diff dev...HEAD`, verify only pilot files changed, and scan tracked changes for secrets.
- [ ] Record Luna/Sol invocations, review iterations, Critical/Important/Minor findings, failed checks, manual interventions, elapsed time, and the user's before/after model-limit readings in the coordinator's pilot report/progress files.
- [ ] Provide desktop and mobile preview instructions and stop for user visual acceptance. Do not continue into the remainder of Phase 2.

## Architecture Pause Conditions

No new architecture decision is required by this plan: it applies ADR-004, ADR-006, ADR-007, ADR-010, and ADR-011 through existing App Router search parameters and canonical Prisma relations.

Pause implementation for focused brainstorming and a `DECISIONS.md` update if any task discovers that it must:

- change the Prisma schema or Phase 1 media/SKU contract;
- add a client/API SKU resolver instead of server page resolution;
- activate canonical cart mutations or change cart DTO/API behavior;
- introduce a 3D/frame-sequence viewer, external media service, or new animation library;
- define a different permanent public catalog URL taxonomy than category/room/canonical option-group slugs;
- broaden the pilot to global storefront redesign, auth, reviews, commerce, checkout, or admin.

## Self-Review Record

- Spec coverage: selected home/catalog/PDP interfaces, server pagination, URL filters, canonical SKU price/stock/media, Tailwind, isolated CSS, reduced motion, and video/poster/static fallback are each owned by a task.
- Scope exclusions: authentication, commerce writes, checkout, admin, broad polish, schema changes, and remaining Phase 2 are explicitly excluded.
- Type consistency: Tasks 2 and 4 consume `FurnitureProductCardData`; Task 3 consumes `ResolvedProductSelection`; both are defined in Task 1 with stable field names.
- Placeholder scan: no implementation step depends on TBD/TODO/follow-up behavior.

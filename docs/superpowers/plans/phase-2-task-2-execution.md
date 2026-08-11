# Phase 2 Task 2 Server-Driven Furniture Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inherited fashion catalog with a URL-driven furniture catalog that reads only canonical Phase 1 relations and retrieves one deterministic server-paginated page at a time.

**Architecture:** Parse the public query string into a furniture-only `CatalogParams`, build one canonical `ProductWhereInput` whose SKU constraints share the same active SKU, and query counts/facets before clamping and loading the requested page with Task 1's `furnitureProductCardInclude`. Keep controls URL-driven; cards are server-projected, display-only links with no cart, wishlist, size, colorway, or variant behavior.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript 5.7, Prisma 6, Tailwind CSS 3, Vitest/Testing Library, Playwright.

## Global Constraints

- Work only on `phase/02-storefront`; Task 1 commits `03e94bb` and `1b9fc3d` are the canonical interface baseline.
- Execute Task 2 only. Do not open, edit, test as new behavior, or begin Task 3 product-detail or Task 4 home work.
- Do not modify Prisma schema, migrations, seed data, cart/wishlist/auth/checkout/admin/demo-admin code, Task 1 projection files, or legacy compatibility code outside the catalog cutover.
- Canonical reads are `Product`, `Category`, `Room`, `ProductRoom`, `ProductOptionGroup`, `ProductOptionValue`, `Sku`, `SkuOptionValue`, `ProductMedia`, and `SkuMedia`. No Task 2 query may call `productColorway`, `productVariant`, or `productImage`.
- Preserve `CATALOG_PAGE_SIZE = 12`; query pages with Prisma `skip`/`take`, never in-memory slicing.
- TDD order is binding: run each named red command and record the expected failure before implementation, then rerun it green.
- Stop after focused verification, report, commit, and fresh Task 2 review. Do not continue to Tasks 3–4.

## Exact File Ownership

**Modify:**

- `lib/catalog-filters.ts` — furniture URL parsing, canonical SKU predicate, stable sort/pagination.
- `lib/find-products.ts` — canonical count/facet/page orchestration and `FurnitureProductCardData` projection.
- `hooks/use-catalog-url.ts` — deterministic list toggles, filter page reset, query-preserving page navigation.
- `app/(shop)/catalog/page.tsx` — furniture metadata/copy and removal of auth/wishlist catalog reads.
- `components/shared/catalog/filter-controls.tsx` — category, room, canonical option, price, and stock controls.
- `components/shared/catalog/mobile-filter-drawer.tsx` — active-count keys must match the new catalog contract.
- `components/shared/catalog/active-filter-chips.tsx` — canonical labels and exact token removal.
- `components/shared/catalog/catalog-product-card.tsx` — display/navigation-only canonical card.
- `components/shared/catalog/catalog-hero.tsx` — Evironn furniture image and copy.
- `components/shared/catalog/catalog-states.tsx` — furniture loading/empty semantics.
- `components/shared/catalog/pagination.tsx` — compact page window while preserving URL state.
- `tests/catalog-filters.test.ts`, `tests/catalog-product-card.test.ts`, `tests/catalog-pagination.test.ts` — replace inherited expectations.
- `e2e/catalog.spec.ts` — replace fashion/commerce scenarios with bounded pilot coverage.

**Create:**

- `components/shared/catalog/option-facet.tsx` — one canonical option-group control.
- `tests/find-products.test.ts` — Prisma orchestration and canonical-query guard.
- `tests/catalog-option-facet.test.tsx` — option toggling and active-chip removal.

**Delete only after imports are gone:**

- `components/shared/catalog/size-filter.tsx`
- `components/shared/catalog/color-filter.tsx`

**Read-only dependencies:**

- `lib/furniture-product-summary.ts`: consume `furnitureProductCardInclude`, `buildFurnitureProductCardData`, `FurnitureProductCardData` unchanged.
- `constants/config.ts`: consume `CATALOG_PAGE_SIZE`, sort values, badge thresholds unchanged. `CLOTHING_SIZES` and `GENDER_OPTIONS` remain because non-pilot code may still use them; Task 2 only removes catalog imports.
- `components/shared/catalog/checkbox-facet.tsx`, `price-filter.tsx`, `in-stock-toggle.tsx`, `sort-select.tsx`, `filter-sidebar.tsx`: reuse unchanged unless a type-only compile error proves a minimal catalog-owned edit is necessary and the report names it.

## Interfaces

`lib/catalog-filters.ts` must export:

```ts
export interface CatalogParams {
  categories: string[];
  rooms: string[];
  options: Record<string, string[]>;
  priceFrom?: number;
  priceTo?: number;
  inStock: boolean;
  sort: SortValue;
  page: number;
  query?: string;
}

export const PAGE_SIZE = CATALOG_PAGE_SIZE;
export function parseCatalogParams(sp: RawSearchParams): CatalogParams;
export function buildProductWhere(params: CatalogParams): Prisma.ProductWhereInput;
export function buildOrderBy(sort: SortValue): Prisma.ProductOrderByWithRelationInput[];
export function buildPagination(page: number): { skip: number; take: number };
```

The URL contract is:

```text
/catalog?category=sofas,chairs&room=living&option=finish:oak,finish:walnut,upholstery:sage-linen&priceFrom=50000&priceTo=180000&inStock=1&sort=price-asc&page=2&q=noma
```

Normalize CSV values to trimmed lowercase slugs, preserve first-seen order, remove duplicates, and ignore malformed/prototype-pollution option tokens. Multiple values in one option group are OR'd with `in`; different groups are separate `AND` selection predicates on one active SKU.

`lib/find-products.ts` must export:

```ts
export interface Facet {
  value: string;
  label: string;
  count: number;
}
export interface OptionFacet {
  slug: string;
  name: string;
  values: Array<{ value: string; label: string; swatchHex: string | null; count: number }>;
}
export interface CatalogResult {
  products: FurnitureProductCardData[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    categories: Facet[];
    rooms: Facet[];
    options: OptionFacet[];
    price: { min: number; max: number };
  };
}
```

## Task 2.1: Furniture URL Contract and Canonical Predicate

- [ ] **Write the red filter tests.** Replace `tests/catalog-filters.test.ts` with cases for defaults; normalized/deduplicated category, room, and option CSV; invalid option tokens; price/stock/search/sort/page; same-group OR; cross-group AND; and every sort ending in `{ id: 'asc' }`. Assert the central predicate:

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
        { selections: { some: { optionGroup: { slug: 'finish' }, optionValue: { slug: { in: ['oak', 'walnut'] } } } } },
        {
          selections: { some: { optionGroup: { slug: 'upholstery' }, optionValue: { slug: { in: ['sage-linen'] } } } },
        },
      ],
    },
  },
});
```

- [ ] **Run red:** `npx vitest run tests/catalog-filters.test.ts`

  Expected: FAIL because current `CatalogParams` and predicates still use gender, brand, colorway, size, and `ProductVariant`.

- [ ] **Implement minimal green in `lib/catalog-filters.ts`.** Build a `Prisma.SkuWhereInput` with `active: true`, optional stock/price, and one `selections.some` entry per sorted option-group key. Assign `where.skus = { some: skuWhere }` whenever SKU-level filtering is present; category, room, and case-insensitive name remain product predicates. Keep the current deterministic denormalized product sorts and page-size export.

- [ ] **Run green:** `npx vitest run tests/catalog-filters.test.ts`

  Expected: PASS.

## Task 2.2: Canonical Query Orchestration and Server Pagination

- [ ] **Write `tests/find-products.test.ts` red.** Hoist spies for `product.count/findMany`, `category.findMany`, `room.findMany`, `optionGroup.findMany`, `sku.aggregate`, and legacy `productColorway/productVariant` methods. Return `total = 25`, canonical facet metadata, empty page products, and active-SKU price bounds. Assert:

```ts
expect(prisma.product.findMany).toHaveBeenCalledWith(
  expect.objectContaining({
    include: furnitureProductCardInclude,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    skip: 12,
    take: 12,
  }),
);
expect(result).toMatchObject({ page: 2, total: 25, totalPages: 3 });
expect(legacyColorwayFindMany).not.toHaveBeenCalled();
expect(legacyVariantAggregate).not.toHaveBeenCalled();
```

Add a `page=999` case with `total = 25` and assert `page === 3` plus `skip === 24`. Compare Vitest `invocationCallOrder` to prove the total/facet promises settle before the page `product.findMany` call. Assert category/room ordering by `sortOrder`, option group/value ordering, active canonical SKU price aggregation, and no all-product fetch for in-memory pagination.

- [ ] **Run red:** `npx vitest run tests/find-products.test.ts`

  Expected: FAIL because the file does not exist and current orchestration calls legacy relations.

- [ ] **Implement minimal green in `lib/find-products.ts`.** In the first phase, concurrently load total, ordered categories, ordered rooms, ordered canonical option groups/values, per-value product counts, and global active-SKU `_min/_max.price`. For a category/room facet count, remove that facet's current selection and add the candidate; for an option count, remove selections for that option group and add the candidate value while retaining all other filters. This prevents a non-zero facet from promising an empty result. Then compute:

```ts
const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
const page = Math.min(params.page, totalPages);
const raw = await prisma.product.findMany({
  where,
  include: furnitureProductCardInclude,
  orderBy: buildOrderBy(params.sort),
  ...buildPagination(page),
});
const products = raw.map((product) => buildFurnitureProductCardData(product, now, cfg));
```

Facet metadata and counts may use bounded per-value `product.count` calls; they must not materialize matching products. Price bounds must come from `prisma.sku.aggregate({ where: { active: true, product: { active: true } } })`.

- [ ] **Run green:** `npx vitest run tests/find-products.test.ts tests/catalog-filters.test.ts`

  Expected: PASS.

## Task 2.3: URL Controls, Canonical Facets, and Compact Pagination

- [ ] **Write component reds.** Create `tests/catalog-option-facet.test.tsx` with a mocked `useCatalogUrl` and assert `OptionFacet` toggles the exact `finish:oak` token under `paramKey="option"`, renders `swatchHex`, and exposes counts. Render `ActiveFilterChips` with category, room, and option facets; assert the option label is resolved from `groupSlug:valueSlug` and removal calls `toggleInList('option', 'finish:oak')` exactly once. Rewrite `tests/catalog-pagination.test.ts` to cover `totalPages=100`, expecting only first/current-neighbor/last pages plus inert accessible gaps, and verify page navigation delegates to `setPage`.

- [ ] **Run red:**

```text
npx vitest run tests/catalog-option-facet.test.tsx tests/catalog-pagination.test.ts
```

Expected: FAIL because `OptionFacet` and compact pagination do not exist and chips still understand fashion keys.

- [ ] **Implement minimal green.** Add `option-facet.tsx` using `getList('option')` and `toggleInList('option', `${group.slug}:${value.value}`)`. Update `FilterControls` to render categories, rooms, each canonical option group, price, and stock. Update `ActiveFilterChips` to enumerate only `category`, `room`, `option`, and `inStock`. Update `MobileFilterDrawer` active-count keys to the same contract. In `use-catalog-url`, deduplicate toggled lists and keep all existing query parameters during page navigation; any non-page mutation deletes `page`. In `pagination.tsx`, use a pure compact-window helper returning page numbers and `'gap'`, never an array of all pages.

- [ ] **Run green:**

```text
npx vitest run tests/catalog-option-facet.test.tsx tests/catalog-pagination.test.ts tests/catalog-filters.test.ts
```

Expected: PASS.

## Task 2.4: Furniture Catalog Presentation

- [ ] **Rewrite `tests/catalog-product-card.test.ts` red.** Use a `FurnitureProductCardData` fixture for `noma-woven-lounge`; assert the canonical image/link/category/current and old prices/availability/swatches render, `data-testid="catalog-product-card"` exists, and no cart, wishlist, size guide, size selector, or legacy variant action is present. Add a sold-out assertion.

- [ ] **Run red:** `npx vitest run tests/catalog-product-card.test.ts`

  Expected: FAIL because the current card accepts `ProductCardData` and imports client commerce state.

- [ ] **Implement minimal green.** Make `CatalogProductCard` accept only `{ data: FurnitureProductCardData }`; remove `'use client'`, state, store, wishlist, size guide, and mutation controls. Render an `<article data-testid="catalog-product-card">`, canonical image, product link, category, `PriceTag price={data.minPrice} compareAtPrice={data.minOldPrice}`, option swatches, and Russian stock text. Preserve keyboard focus and responsive Tailwind layout.

  In `app/(shop)/catalog/page.tsx`, remove `auth`, cookies, wishlist helpers, and `wishlisted` props; keep JSON-LD because its structural input is compatible. Replace RITM metadata with Evironn metadata and `/assets/products/03-ivory-lounge-idle.webp`. Update `CatalogHero` to use `/assets/products/05-two-seat-sofa-idle.webp` and furniture copy. Replace clothing empty-state icon/copy in `catalog-states.tsx`. Keep the existing one/two/three-column grid and server result count.

- [ ] **Delete `size-filter.tsx` and `color-filter.tsx` only after `rg -n "SizeFilter|ColorFilter|size-filter|color-filter" app components tests` returns no imports.**

- [ ] **Run green:** `npx vitest run tests/catalog-product-card.test.ts tests/catalog-option-facet.test.tsx tests/catalog-pagination.test.ts`

  Expected: PASS.

## Task 2.5: Catalog E2E and Focused Verification

- [ ] **Replace `e2e/catalog.spec.ts` with bounded pilot scenarios:** canonical furniture cards and `/product/<slug>` links; category + room + option URL changes with `page` reset; price + stock narrowing; invalid values and `page=999` producing an empty or clamped non-error state; no cart/wishlist/auth/checkout assertions.

- [x] **Resolve the pagination fixture conflict before claiming E2E completion.** The committed seed has exactly 12 products and page size is 12, so it cannot demonstrate a non-empty second slice. Coordinator decision: use (b), because Task 2 must not mutate seed/schema or add fixture teardown risk. The mocked `find-products` test covers page 2 (`skip: 12`, `take: 12`); E2E covers the seeded first page and out-of-range clamp without claiming a non-empty second slice.

- [ ] **Run focused verification:**

```text
npx vitest run tests/catalog-filters.test.ts tests/find-products.test.ts tests/catalog-option-facet.test.tsx tests/catalog-product-card.test.ts tests/catalog-pagination.test.ts
npm run typecheck
npm run e2e -- e2e/catalog.spec.ts
```

Expected: all PASS. If the database or preview environment is unavailable, preserve exact output in the report and do not claim E2E passed.

- [ ] **Review scope and secrets:**

```text
git status --short
git diff --check
git diff --name-only 1b9fc3d..HEAD
git diff -- app/(shop)/catalog lib/catalog-filters.ts lib/find-products.ts hooks/use-catalog-url.ts components/shared/catalog tests e2e/catalog.spec.ts
```

Confirm no Task 3/4, schema, seed, auth, cart, wishlist, checkout, admin, or demo-admin files changed, and no credentials/tokens appear in the diff.

## Commit, Report, and Review Handoff

- [ ] Verify `git config user.name` and `git config user.email` still match the user's configured identity.
- [ ] Stage only the exact Task 2 files above. Do not stage coordinator-owned roadmap/progress files or unrelated work.
- [ ] Commit once with `feat: add server-driven furniture catalog`. Do not amend Task 1, add AI/co-author trailers, push, merge, or open a pull request.
- [ ] Write `.superpowers/sdd/task-2-report.md` containing: commit SHA; exact changed/deleted file list; red commands and observed failures; green/focused commands and full outcomes; E2E environment/fixture decision; deviations; and confirmation that Tasks 3–4 were not touched.
- [ ] Generate the coordinator-assigned Task 2 diff package from `1b9fc3d` to the Task 2 commit for a fresh Sol Medium review. Return every Critical/Important finding to the Task 2 implementer and repeat focused verification/review until approved.
- [ ] Stop. The coordinator records the approved result in `.superpowers/sdd/progress.md`; no worker begins Task 3 or Task 4 without explicit user approval.

## Self-Review Record

- Spec coverage: URL filters, canonical predicates, canonical facets, server pagination, furniture card rendering, responsive controls, stable empty/loading states, and focused E2E are each owned above.
- Type consistency: Task 2 consumes Task 1's exact `FurnitureProductCardData`, `furnitureProductCardInclude`, and `buildFurnitureProductCardData`; no new Task 3/4 interface is introduced.
- Scope correction: `mobile-filter-drawer.tsx` and a dedicated option-facet test are explicitly owned because the original draft omitted files needed to remove fashion URL keys safely.
- Placeholder scan: every implementation step is concrete; the only unresolved item is the explicit 12-product E2E acceptance conflict requiring coordinator authorization.

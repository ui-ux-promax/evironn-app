# Phase 2B Selected Catalog UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Port clone `CatalogVariantB` into production `/catalog`, preserving its visual structure, responsive states, controls, card playback, and copy while feeding it canonical server catalog data.

**Architecture:** Keep `findProducts`, `parseCatalogParams`, Prisma predicates, facets, deterministic sorting, pagination, and `FurnitureProductCardData` server-authoritative. Add narrow serializable adapters for clone control/card models. Render a focused Client Component for URL-driven controls, drawer, paging, and hover media; render data query and JSON-LD in the existing Server Page. Every card links to `SHOWCASE_PRODUCT_PATH`.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Vitest + Testing Library, Playwright, Framer Motion not required, `react-icons`, preserved clone CSS, existing Evironn tokens and `furniture-playback` helpers.

## Global Constraints

- `D:\Projects\evironn` only production write target; `D:\Новая папка (2)\evironn-clone` and `D:\Projects\fashion-shop` read-only.
- Preserve clone composition, copy, class names, interactions, responsive behavior, CSS, media behavior, and reduced-motion behavior.
- Keep Task 2 URL parsing, canonical Prisma predicates, facets, deterministic sorting, server pagination, and furniture DTO projections.
- Client Components receive serializable DTOs only. Prisma, price, stock, SKU, and facet counts stay server-side.
- URL is authoritative for `category`, `room`, `option`, `priceFrom`, `priceTo`, `inStock`, `sort`, `page`, and `q`.
- `/catalog` is production route. Do not add `/catalog-a`, `/catalog-b`, `/catalog-c`, or variant-picker routes.
- Every catalog card uses `SHOWCASE_PRODUCT_PATH` (`/product/noma-woven-lounge`), regardless of source product slug.
- Reuse existing production assets. Add no catalog archive, generated preview, mock product data, or new product media.
- Reuse `CARD_PLAYBACK_RATE`, `getMediaLayerState`, and `getReverseStartTime` from `components/evironn/home/furniture-playback.ts`.
- Do not activate cart, wishlist mutation, or product-specific PDP navigation in Phase 2B.
- Task checks stay focused. No full gate, production build, full Vitest, or full E2E until final delivery gate.
- Each task ends with fresh focused evidence and independent reviewer checkpoint. Blocking Critical/Important findings return to owning implementer.

## File ownership map

| Task | Owned files                                                                                                                                                                                                               | Responsibility                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1    | `components/evironn/catalog/catalog-variant-b-adapter.ts`, `components/evironn/catalog/catalog-url-state.ts`, `tests/evironn-catalog-adapter.test.ts`, `tests/evironn-catalog-url-state.test.ts`                          | Serializable server-to-clone models, media manifest, URL normalization/state helpers        |
| 2    | `components/evironn/catalog/catalog-card.tsx`, `tests/evironn-catalog-card.test.tsx`                                                                                                                                      | Clone card markup, hover/focus playback, frozen-frame fallback, showcase link               |
| 3    | `components/evironn/catalog/catalog-primitives.tsx`, `styles/evironn/catalog-primitives.css`, `tests/evironn-catalog-primitives.test.tsx`                                                                                 | Pagination, price range, checkbox rows, chips, result count, empty state, drawer primitives |
| 4    | `components/evironn/catalog/catalog-variant-b.tsx`, `styles/evironn/catalog-variant-b.css`, `app/(shop)/catalog/page.tsx`, `app/(shop)/catalog/loading.tsx`, `app/layout.tsx`, `tests/evironn-catalog-variant-b.test.tsx` | Stage, room tabs, toolbar, grid, drawer composition, route integration, global CSS imports  |
| 5    | `e2e/catalog.spec.ts`, `tests/evironn-catalog-source-contract.test.ts`, `docs/roadmap/STATUS.md`, `.superpowers/sdd/progress.md`                                                                                          | Critical route E2E, source/forbidden-route contracts, delivery evidence                     |

No task edits another task's owned files. Existing `components/shared/catalog/*`, `lib/catalog-filters.ts`, `lib/find-products.ts`, `lib/furniture-product-summary.ts`, `components/evironn/home/furniture-playback.ts`, and `components/evironn/public-routes.ts` remain reusable dependencies; modify them only if a reviewer proves a narrowly scoped compatibility defect and records it before code change.

---

### Task 1: Build canonical catalog adapter and URL model

**Files:**

- Create: `components/evironn/catalog/catalog-variant-b-adapter.ts`
- Create: `components/evironn/catalog/catalog-url-state.ts`
- Test: `tests/evironn-catalog-adapter.test.ts`
- Test: `tests/evironn-catalog-url-state.test.ts`

**Interfaces:**

- Consumes: `CatalogResult` from `lib/find-products.ts`; `FurnitureProductCardData` from `lib/furniture-product-summary.ts`; `SHOWCASE_PRODUCT_PATH` from `components/evironn/public-routes.ts`; existing asset paths under `public/assets/products` and `public/assets/hero`.
- Produces:

```ts
export type CatalogBMedia = {
  idle: string;
  forward: string;
  reverse: string;
};

export type CatalogBCard = FurnitureProductCardData & {
  href: typeof SHOWCASE_PRODUCT_PATH;
  media: CatalogBMedia;
  note: string;
  colors: Array<{ label: string; swatchHex: string | null }>;
};

export type CatalogBFacetGroup = {
  key: string;
  title: string;
  values: Array<{
    id: string;
    label: string;
    count: number;
    swatchHex?: string | null;
  }>;
  kind: 'pill' | 'check' | 'swatch';
};

export type CatalogBModel = {
  cards: CatalogBCard[];
  total: number;
  shown: number;
  page: number;
  totalPages: number;
  roomTabs: Array<{ id: string; label: string; image: string }>;
  facetGroups: CatalogBFacetGroup[];
  price: { min: number; max: number };
};

export function buildCatalogBModel(result: CatalogResult): CatalogBModel;
export function mediaForFurnitureCard(data: FurnitureProductCardData): CatalogBMedia;
export function catalogBQueryFromSearchParams(sp: URLSearchParams): URLSearchParams;
export function normalizeCatalogBQuery(sp: URLSearchParams): URLSearchParams;
```

- Binding decisions:
  - Map room tabs exactly: `all` uses `/assets/hero/kitchen-idle.jpg`; `living` uses `/assets/editorial/images/71c2b8589fc6.png`; `dining` uses `/assets/hero/kitchen-idle.jpg`; `bedroom` uses `/assets/hero/bedroom-idle.jpg`; `terrace` uses `/assets/hero/terrace-idle.jpg`.
  - Map server `facets.categories` to `category` pill group.
  - Map server option group `finish` and any option group with at least one `swatchHex` value to swatch group; map remaining option groups to check groups. Preserve server group/value order.
  - Use `category`, `room`, and `option` query tokens unchanged. Do not invent clone-only `colors`, `materials`, or `seats` query keys.
  - `mediaForFurnitureCard` selects existing 01–05 media by canonical `imageUrl` basename (`01-bar-stool`, `02-rocking-chair`, `03-ivory-lounge`, `04-dark-accent`, `05-two-seat-sofa`); unknown basename falls back to `03-ivory-lounge` media while retaining server image as idle card image only if media manifest lacks a match. Test every seeded card maps to known existing media.
  - `note` derives from `categoryName` and available swatch labels; it is presentation copy only and never used for filtering or pricing.
  - `href` is always `SHOWCASE_PRODUCT_PATH`.
  - `normalizeCatalogBQuery` keeps only approved keys, normalizes list values with stable deduplication, deletes `page` when any filter/sort/room changes, and returns `/catalog` semantics when query becomes empty.

- [ ] **Step 1: Write failing adapter tests.** Assert 12 seeded DTOs produce serializable cards, all card `href` values equal `/product/noma-woven-lounge`, server facets preserve order/counts, five media sets resolve to existing public paths, room tabs use exact paths, and no clone mock product fields enter model.

```ts
it('adapts canonical furniture cards to showcase-linked Variant B cards', () => {
  const model = buildCatalogBModel(resultFixture);
  expect(model.cards).toHaveLength(2);
  expect(model.cards[0].href).toBe('/product/noma-woven-lounge');
  expect(model.cards[0].media.idle).toMatch(/^\/assets\/products\/\d\d-/);
  expect(model.facetGroups.map((group) => group.key)).toEqual(['category', 'finish', 'upholstery']);
});
```

- [ ] **Step 2: Run RED checks.**

Run: `npx vitest run tests/evironn-catalog-adapter.test.ts tests/evironn-catalog-url-state.test.ts`

Expected: FAIL because adapter modules and exported functions do not exist.

- [ ] **Step 3: Implement minimal adapter and query normalization.** Keep functions pure. Return plain objects containing strings, numbers, booleans, arrays, and null; no Prisma object, Date, React element, or function crosses boundary.

- [ ] **Step 4: Run GREEN checks.**

Run: `npx vitest run tests/evironn-catalog-adapter.test.ts tests/evironn-catalog-url-state.test.ts`

Expected: PASS; no source clone import, mock catalog import, or forbidden variant route literal.

- [ ] **Step 5: Reviewer checkpoint.** Reviewer inspects only Task 1 diff. Reject if server filter semantics change, DTO contains non-serializable values, media path lacks existence tests, query drops unknown safety handling, or product links use source slug.

- [ ] **Step 6: Commit after approval.**

```text
feat: add catalog variant b server adapter
```

---

### Task 2: Port catalog card and playback behavior

**Files:**

- Create: `components/evironn/catalog/catalog-card.tsx`
- Test: `tests/evironn-catalog-card.test.tsx`

**Interfaces:**

- Consumes: `CatalogBCard` from Task 1; `CARD_PLAYBACK_RATE`, `getMediaLayerState`, `getReverseStartTime` from `components/evironn/home/furniture-playback.ts`; `react-icons/fi` Heart icon; `next/link`.
- Produces:

```ts
export function CatalogCard({ product, eager }: { product: CatalogBCard; eager?: boolean }): React.ReactElement;
```

- Binding decisions:
  - Preserve clone classes: `cat-card`, `cat-card--compact`, `cat-card__frame`, `cat-card__media`, `cat-card__badge`, `cat-card__peek`, `cat-card__fav`, `cat-card__body`, `cat-card__name`, `cat-card__note`, `cat-card__price`, `cat-card__colors`.
  - Preserve idle image, `preload="none"`, fine-pointer hover/focus forward playback, reverse playback, canvas frozen frame, operation race guard, muted inline video, `loading="eager"` for first four cards, and reduced-motion CSS behavior.
  - Card link `href={product.href}`. Favorite button remains local decorative state; no wishlist mutation.
  - Show server badge label, sold-out `Под заказ`, server price/old price, category-derived note, swatch labels, and accessible card name/price.

- [ ] **Step 1: Write failing component tests.** Mock only Next image/link boundary if needed. Assert showcase href, no product-specific href, server price/badge/availability, eager first-card image behavior, favorite `aria-pressed` toggle, and playback helper use through source contract.

```tsx
it('renders compact furniture card with showcase destination and canonical values', () => {
  render(<CatalogCard product={cardFixture} eager />);
  expect(screen.getByRole('link', { name: /Noma/i })).toHaveAttribute('href', '/product/noma-woven-lounge');
  expect(screen.getByText(/89/)).toBeTruthy();
  expect(screen.getByRole('button', { name: /избранное/i })).toHaveAttribute('aria-pressed', 'false');
});
```

- [ ] **Step 2: Run RED.**

Run: `npx vitest run tests/evironn-catalog-card.test.tsx`

Expected: FAIL because ported card module does not exist.

- [ ] **Step 3: Port minimal clone card.** Import shared playback helpers; do not duplicate helper algorithms.

- [ ] **Step 4: Run GREEN.**

Run: `npx vitest run tests/evironn-catalog-card.test.tsx tests/evironn-home-state.test.ts`

Expected: PASS.

- [ ] **Step 5: Reviewer checkpoint.** Reviewer checks exact clone class structure, no cart/wishlist API, no mock data, no per-card product route, lazy media behavior, operation race guard, keyboard focus activation, and fallback layer exclusivity.

- [ ] **Step 6: Commit after approval.**

```text
feat: port catalog variant b card
```

---

### Task 3: Port catalog primitives and primitive CSS

**Files:**

- Create: `components/evironn/catalog/catalog-primitives.tsx`
- Create: `styles/evironn/catalog-primitives.css`
- Test: `tests/evironn-catalog-primitives.test.tsx`

**Interfaces:**

- Consumes: `CatalogBFacetGroup` from Task 1; `pageWindow` behavior ported as local pure helper; callback-driven state from Task 4.
- Produces:

```ts
export function Pagination(props: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}): React.ReactElement | null;

export function PriceRange(props: {
  value: [number, number];
  min: number;
  max: number;
  onChange: (value: [number, number]) => void;
}): React.ReactElement;

export function CheckRow(props: {
  label: string;
  count?: number;
  checked: boolean;
  disabled?: boolean;
  swatchHex?: string | null;
  onChange: () => void;
}): React.ReactElement;

export function ChipRow(props: {
  chips: Array<{ id: string; label: string }>;
  onRemove: (id: string) => void;
  onClear: () => void;
}): React.ReactElement | null;

export function ResultCount(props: { shown: number; total: number }): React.ReactElement;
export function EmptyState(props: { onReset: () => void }): React.ReactElement;
```

- Binding decisions:
  - Preserve clone labels, `cat-*` class names, box pagination, active chips, price dual range, disabled zero-count options, focus ring, and reduced-motion CSS.
  - Use server `min/max` price bounds, not clone `PRICE_BOUNDS`.
  - Clamp lower/upper values by `step=100`, maintain at least one step gap, and emit numeric values through callback.
  - `Pagination` never emits page below 1 or above total; current page gets `aria-current="page"`; gaps are inert.

- [ ] **Step 1: Write failing primitive tests.** Cover page window edges/gaps, callback page selection, price lower/upper clamping, checked/disabled checkbox semantics, chip removal/clear, result status, empty reset action, and keyboard-visible labels.

```tsx
it('renders compact box pagination with current page and inert gaps', () => {
  render(<Pagination page={6} total={12} onChange={vi.fn()} />);
  expect(screen.getByRole('button', { name: '6' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getAllByText('…')).toHaveLength(2);
});
```

- [ ] **Step 2: Run RED.**

Run: `npx vitest run tests/evironn-catalog-primitives.test.tsx`

Expected: FAIL because primitive module does not exist.

- [ ] **Step 3: Port primitives and CSS.** Preserve clone selectors and token references. Scope all rules under `cat-*`; do not convert to Tailwind.

- [ ] **Step 4: Run GREEN.**

Run: `npx vitest run tests/evironn-catalog-primitives.test.tsx`

Expected: PASS.

- [ ] **Step 5: Reviewer checkpoint.** Reviewer checks no clone mock imports, server bounds used, focus/reduced-motion contracts retained, disabled options remain keyboard-correct, and CSS has no global leakage.

- [ ] **Step 6: Commit after approval.**

```text
feat: port catalog variant b primitives
```

---

### Task 4: Compose `/catalog` with exact Variant B shell

**Files:**

- Create: `components/evironn/catalog/catalog-variant-b.tsx`
- Create: `styles/evironn/catalog-variant-b.css`
- Modify: `app/(shop)/catalog/page.tsx`
- Modify: `app/(shop)/catalog/loading.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/evironn-catalog-variant-b.test.tsx`

**Interfaces:**

- Consumes: `CatalogBModel`, `normalizeCatalogBQuery` from Task 1; `CatalogCard` from Task 2; primitives from Task 3; `CatalogResult` from `lib/find-products.ts`; `SHOWCASE_PRODUCT_PATH` only through adapter.
- Produces:

```ts
export function CatalogVariantB({ model }: { model: CatalogBModel }): React.ReactElement;
```

- Server Page contract remains:

```ts
const sp = await searchParams;
const result = await findProducts(sp);
const model = buildCatalogBModel(result);
return <CatalogVariantB model={model} />;
```

- Binding decisions:
  - Keep `dynamic = 'force-dynamic'`, metadata, canonical `/catalog`, and catalog JSON-LD from current page.
  - Replace inherited Tailwind catalog presentation only after ported shell tests pass.
  - Stage exact structure: `<main className="cat-b" id="main-content">`, `cat-b__stage`, stage media/scrim/inner, eyebrow, H1, room tablist; then sticky `cat-b__bar`; then `cat-b__body`, chips, grid, box pager, drawer root/scrim/drawer.
  - Room tab click updates `room` URL and deletes `page`; sort click updates `sort` and deletes `page`; facet changes update URL immediately on desktop; drawer changes stay draft-local until `Показать N` applies all draft values; reset clears approved catalog keys.
  - Read current URL through `useSearchParams`; never maintain independent authoritative room/filter/sort/page state.
  - Page changes call `router.push` with query state and `scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' })` on grid.
  - Drawer closes on scrim, close button, Escape, and successful apply; body scroll lock restores previous value.
  - Room tab images use exact Task 1 paths. Grid uses `CatalogCard` with first four `eager`.
  - Mobile breakpoints preserve clone behavior: stage/tab overflow, horizontal sort controls, responsive card columns, drawer width/animation, and reduced-motion overrides.

- [ ] **Step 1: Write failing shell tests.** Assert main ID, stage H1/eyebrow, five room tabs, tablist semantics, four sort buttons, filter button, result count, card grid, drawer labels, exact clone class names, and no inherited `CatalogProductCard`, `FilterSidebar`, `MobileFilterDrawer`, `CatalogHero`, or `EmptyCatalog` imports.

```tsx
it('composes Variant B shell from serializable model', () => {
  render(<CatalogVariantB model={modelFixture} />);
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  expect(screen.getByRole('heading', { name: /Мебель под комнату/i })).toBeTruthy();
  expect(screen.getAllByRole('tab')).toHaveLength(5);
  expect(screen.getByRole('button', { name: /Фильтры/i })).toBeTruthy();
  expect(screen.getAllByTestId('catalog-card')).toHaveLength(modelFixture.cards.length);
});
```

- [ ] **Step 2: Run RED.**

Run: `npx vitest run tests/evironn-catalog-variant-b.test.tsx`

Expected: FAIL because shell module does not exist.

- [ ] **Step 3: Implement shell and route adapter.** Import three catalog CSS files once from `app/layout.tsx`; do not import clone CSS from read-only path at runtime. Keep page server-side and shell client-side.

- [ ] **Step 4: Run focused GREEN checks.**

Run: `npx vitest run tests/evironn-catalog-variant-b.test.tsx tests/evironn-catalog-adapter.test.ts tests/evironn-catalog-url-state.test.ts tests/evironn-catalog-card.test.tsx tests/evironn-catalog-primitives.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run focused type/format checks because route and client/server boundary changed.**

Run: `npm run typecheck`; `npx prettier --check app/(shop)/catalog/page.tsx app/(shop)/catalog/loading.tsx app/layout.tsx components/evironn/catalog styles/evironn/catalog-*.css tests/evironn-catalog-*.test.*`

Expected: TypeScript exit 0; Prettier clean for listed files.

- [ ] **Step 6: Reviewer checkpoint.** Reviewer checks clone DOM/CSS parity, URL authority, server DTO-only boundary, no duplicate query engine, drawer keyboard behavior, mobile/reduced-motion selectors, metadata/JSON-LD retention, and no legacy presentation import.

- [ ] **Step 7: Commit after approval.**

```text
feat: compose selected catalog variant b
```

---

### Task 5: Add critical catalog E2E and delivery evidence

**Files:**

- Modify: `e2e/catalog.spec.ts`
- Create: `tests/evironn-catalog-source-contract.test.ts`
- Modify: `docs/roadmap/STATUS.md`
- Modify: `.superpowers/sdd/progress.md`

**Interfaces:**

- Consumes: production `/catalog`; Task 1–4 selectors and URL behavior; existing seeded 12-product catalog; clone contract files read-only for source comparison.
- Produces: focused E2E covering default, URL filters, room/sort/page reset, empty state, mobile drawer, card showcase destination, and reduced-motion shell; source contract forbidding mock data and variant routes; durable task/delivery report.

- [ ] **Step 1: Write failing source-contract tests.** Assert production catalog source imports only canonical `findProducts`/adapter/card/primitives, has no `CATALOG_PRODUCTS`, `CatalogVariantA`, `CatalogVariantC`, `/catalog-a`, `/catalog-b`, `/catalog-c`, inherited `CatalogProductCard`, or legacy filter component references, and every card destination resolves to `/product/noma-woven-lounge`.

- [ ] **Step 2: Run RED.**

Run: `npx vitest run tests/evironn-catalog-source-contract.test.ts`

Expected: FAIL until route source points at ported Variant B.

- [ ] **Step 3: Add focused E2E scenarios.** Keep existing server contract scenarios where still valid, replacing positional controls with stable `role`/class/test IDs from ported shell.

```ts
test('catalog default renders seeded cards and showcase links', async ({ page }) => {
  await page.goto('/catalog');
  await expect(page.locator('.cat-card')).toHaveCount(12);
  await expect(page.locator('.cat-card__frame').first()).toHaveAttribute('href', '/product/noma-woven-lounge');
});

test('room, sort, filter, and page controls keep URL authoritative', async ({ page }) => {
  await page.goto('/catalog?page=2');
  await page.getByRole('tab', { name: 'Спальня' }).click();
  await expect(page).toHaveURL(/room=bedroom/);
  await expect(page).not.toHaveURL(/page=/);
  await page.getByRole('button', { name: 'Цена' }).click();
  await expect(page).toHaveURL(/sort=price-asc/);
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await expect(page.getByRole('complementary', { name: 'Фильтры' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('complementary', { name: 'Фильтры' })).not.toBeVisible();
});
```

Required scenarios: default 12 cards; category/room/option URL changes delete page; sort URL changes delete page; mobile drawer draft/apply/Escape; invalid filters render empty state without application error; out-of-range page remains successful and server-clamped; reduced-motion disables stage/drawer/indicator transitions; card hrefs all use showcase path.

- [ ] **Step 4: Run focused tests and one critical E2E file.**

Run: `npx vitest run tests/evironn-catalog-source-contract.test.ts tests/catalog-filters.test.ts tests/catalog-pagination.test.ts tests/catalog-option-facet.test.tsx tests/catalog-product-card.test.ts`; `npm run e2e -- e2e/catalog.spec.ts`

Expected: Focused tests pass; catalog E2E passes or reports existing runtime timeout precisely. Do not claim pass without current output.

- [ ] **Step 5: Reviewer checkpoint.** Final delivery reviewer inspects delivery-base-to-HEAD diff only. Check scope, source fidelity, URL/server authority, accessibility, asset paths, forbidden route/mock scan, focused evidence, and no accidental edits to existing untracked plans.

- [ ] **Step 6: Record evidence.** Update `STATUS.md` and `.superpowers/sdd/progress.md` with changed files, reviewer result, exact focused commands/output, E2E result, asset inventory, and remaining risks. Record initial Preview slowness as follow-up; do not optimize in Phase 2B.

- [ ] **Step 7: Delivery boundary.** After all task reviews pass, coordinator runs exactly once: `npm run format`, `npm run gate`, `npm run build`, `npm run e2e -- e2e/catalog.spec.ts`; then presents Preview for user desktop/mobile acceptance. No Phase 2C before acceptance.

## Final evidence checklist

- [ ] All five task reviewers report Critical 0, Important 0.
- [ ] Canonical server catalog logic unchanged and focused tests pass.
- [ ] Adapter serializability, media manifest, and exact asset existence verified.
- [ ] Clone Variant B shell/classes/copy/responsive/reduced-motion behavior ported.
- [ ] Cards use lazy hover playback, fallback layers, accessible focus, and showcase URL.
- [ ] URL controls authoritative; filter/sort/room changes reset page; drawer apply semantics preserved.
- [ ] Default, filtered, empty, mobile drawer, card hover/focus, pagination, and reduced-motion E2E evidence recorded.
- [ ] Final completion gate run once at delivery boundary only.
- [ ] User desktop/mobile visual acceptance received before Phase 2C.

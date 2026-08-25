# Phase 5B - Canonical Furniture Catalog Administration

Target file: `docs/superpowers/plans/2026-08-25-phase-5b-canonical-catalog-admin.md`

| Field | Value |
| --- | --- |
| Repository | `D:\Projects\evironn` (production, write target) |
| Branch | `phase/05-admin-demo` |
| Delivery base | `da5e87e` (`origin/dev`, read without fetch) |
| Accepted predecessor | `C5A_ACCEPTED = 42ec908` (`feat(admin): align dashboard with Evironn shell`) |
| Technical source | `D:\Projects\fashion-shop` (read-only, symbol/file-level patterns only) |
| Visual source | `D:\Новая папка (2)\evironn-clone` (read-only, presentation reference only) |
| Master plan | `docs/superpowers/plans/2026-08-20-phase-5-admin-demo.md`, Stream 5B, tasks 5B.1-5B.11 |
| Scope | Canonical catalog reads, Cloudinary ownership, option groups/values, rooms, SKU matrix, canonical product/SKU actions, ProductMedia/SkuMedia, category turntable binding, guarded stock console, legacy admin-write retirement, functional checkpoint |
| Out of scope | Prisma schema changes, package scripts, CI, env names, providers, storefront routes, Phase 5C, Phase 5D, Phase 6, push, PR, merge, full gate/build/E2E |

## 0. Source-parity summary

1. **Reuse unchanged**: `lib/admin/require-admin.ts`, `lib/admin/pagination.ts`, `lib/admin/api-error.ts`, `components/admin/admin-ready.ts`, `components/admin/content-ready-gate.tsx`, `components/admin/ui/*`, `components/admin/skeleton/*`, `components/admin/media/*`, `lib/cloudinary/{config,server,sign,url,validate}.ts`, `lib/furniture-sku.ts :: buildCombinationKey`, `services/dto/product.dto.ts :: furnitureProductSchema`, all Phase 4 cart/checkout/order/payment/wishlist logic, `app/actions/admin/customers.ts` role safeguards, existing category CRUD/reorder/occupied-delete refusal.
2. **Adapt to canonical furniture**: admin catalog routes/forms, `app/actions/admin/products.ts`, `app/actions/admin/categories.ts` (turntable only), media API routes, `lib/cloudinary/admin-media.ts`, `lib/admin/nav.ts`, and the stock surface. Legacy clothing-shaped **reads and writes inside admin** are replaced by canonical relations; legacy reads outside admin remain.
3. **Port presentation only**: clone `AdminShell.tsx`/`AdminShell.css`/`AdminPrimitives.tsx`/`AdminPrimitives.css` were already absorbed into the accepted 5A shell. 5B composes the frozen primitives. No route-specific redesign; exact parity is one 5D pass. Never import from `fashion-shop` or `evironn-clone` at build time.
4. **Retire with evidence**: legacy admin colorway/image/variant writes, the legacy admin `productSchema` path when no non-admin consumer remains, the `variant-matrix.tsx` clothing generator, `colorway-card.tsx`, the literal `ritm/*` signer allowlist and the literal `'ritm/categories'` folder in the category form, and Ritm admin presentation references reachable from 5B files. Retained: legacy read compatibility, and exactly one named `cancelOrderByAdmin` legacy restock site until 5C.3.

## 1. Non-negotiable execution rules

- **No Prisma schema changes.** Every behaviour uses existing models, composite keys and unique constraints. If a requirement appears to need a column, stop and raise a blocked question instead of editing `prisma/schema.prisma`.
- **Guard first.** Protected pages call `requireAdminPage()` before any privileged read. Server actions call `requireAdminAction()` before any Prisma or provider access. Admin API handlers call `requireAdminApi()` as the first statement. No pre-guard query.
- **Zod before writes.** Order inside every action: `requireAdminAction()` -> schema `safeParse` -> ownership/reference checks -> `prisma.$transaction` -> `revalidatePath` -> typed result.
- **Separation.** `lib/admin/*` and `services/dto/*` are server-side read/validation contracts. `app/actions/admin/*` are the only write entry points. `_components/*` are presentation; they take serializable props and call actions, never Prisma.
- **Phase 4 invariants.** 5B never writes `Order`, `OrderItem`, `Payment`, `CartItem`, `WishlistItem` or any snapshot row. A referenced `Sku` is deactivated, never deleted. Order snapshots keep their copied SKU/article/combination/configuration/image/pricing values regardless of later catalog edits.
- **Stock authority is single.** `Sku.stock` of an **existing** SKU is mutated only by `setSkuStock` (5B.9) under its expected-current guard. `saveFurnitureProduct` (5B.6) sets `stock` only when it creates a new `Sku` row and never includes `stock` in an update payload. See 3.1 rule S.
- **Cloudinary.** Sign only the five Evironn folders. Destroy only Evironn-owned IDs or exact database-referenced legacy IDs. Never re-sign or re-upload a legacy ID. No secret values in responses, logs, tests or commit messages.
- **Visual freeze (ADR-022).** New routes reuse existing admin primitives and the accepted 5A shell. Functional and responsive usability fixes are allowed; visual redesign and exact clone parity are deferred to 5D. Record visual debt as text; do not fix it here.
- **No half-cutover.** A page, form and action must be type-compatible at the end of every task. When a canonical contract is introduced before its consumer is migrated, the new symbol ships tested but unwired, or is exposed as an optional prop with a default that renders nothing, and the named interim contract in 3.1 rule A applies.
- **Verification economy.** Each task runs only its focused RED/GREEN commands plus `npm run typecheck`, `npx prettier --check` on touched files and `git diff --check`. One consolidated focused batch at 5B.11. No `npm run gate`, no `npm run build`, no E2E in 5B.
- **Delivery boundary.** Commit locally on `phase/05-admin-demo` only. No push, PR, merge, or tag creation beyond recording SHAs in this plan's closeout section.
- **Commit hygiene.** One commit per task, the conventional subject given per task, no unrelated files. The two protected untracked Phase 2 plan files (`docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`, `docs/superpowers/plans/phase-2-task-3-execution.md`) stay untracked and unstaged in every commit.

## 2. Shared contracts defined once (do not invent alternatives)

### 2.1 `lib/admin/action-result.ts` (created in 5B.3; used by 5B.4/5B.6/5B.7/5B.8/5B.9)

```ts
export type AdminActionErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'SLUG_TAKEN'
  | 'ARTICLE_NUMBER_TAKEN'
  | 'OPTION_GROUP_IN_USE'
  | 'OPTION_VALUE_IN_USE'
  | 'ROOM_HAS_PRODUCTS'
  | 'MIGRATION_INCOMPLETE'
  | 'MEDIA_OWNERSHIP_REJECTED'
  | 'PRODUCT_HAS_REFERENCES'
  | 'TURNTABLE_BINDING_CONFLICT'
  | 'TURNTABLE_MEDIA_REQUIRED'
  | 'TURNTABLE_BOUND_PRODUCT_LOCKED'
  | 'STALE_VALUE'
  | 'UNEXPECTED';

export type AdminActionErrorDetails = Record<string, string | number | boolean | string[]>;

export type AdminActionOk<T> = { ok: true; data: T; warnings?: string[] };

/** `error` duplicates `message` so existing `{ ok, error }` consumers stay compatible. */
export type AdminActionError = {
  ok: false;
  code: AdminActionErrorCode;
  message: string;
  error: string;
  details?: AdminActionErrorDetails;
};

export type AdminActionResult<T = null> = AdminActionOk<T> | AdminActionError;

export function adminOk<T>(data: T, warnings?: string[]): AdminActionOk<T>;
export function adminError(
  code: AdminActionErrorCode,
  message: string,
  details?: AdminActionErrorDetails,
): AdminActionError;
```

Compatibility decision: existing `app/actions/admin/categories.ts` CRUD/reorder results keep their current field surface. They may be re-typed as `AdminActionResult<...>` only because `error` is retained; `tests/categories-action.test.ts` must stay green without edits to its assertions.

`PRODUCT_HAS_REFERENCES` is the single code added for the reference-aware product delete guard in 5B.6 (3.1 rule R). Do not add further codes without a plan amendment.

Warning literals are fixed strings so tests can assert them exactly. The only warning literals used in 5B are `'existing-sku-stock-ignored'` (5B.6) and `'media-destroy-failed'` (5B.7).

### 2.2 `lib/admin/catalog.ts` read contract (created in 5B.1)

```ts
export type AdminPagedResult<T> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

export type AdminCatalogProductFlag = 'incomplete-zero-sku' | 'no-media' | 'inactive' | 'turntable-bound';

export type AdminCatalogProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  roomNames: string[];
  active: boolean;
  isBestseller: boolean;
  sortOrder: number;
  skuCount: number;
  activeSkuCount: number;
  totalStock: number;
  minPrice: number | null;
  maxPrice: number | null;
  mediaCount: number;
  turntableReady: boolean;
  flags: AdminCatalogProductFlag[];
};

export type AdminCatalogProductListParams = {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  roomId?: string;
  status?: 'all' | 'active' | 'inactive' | 'incomplete';
  sort?: 'sortOrder' | 'name' | 'minPrice' | 'stock';
};

export type AdminOptionGroupRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
  values: {
    id: string;
    name: string;
    slug: string;
    swatchHex: string | null;
    sortOrder: number;
  }[];
};

export type AdminRoomRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
};

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
  turntableProductId: string | null;
  turntableProductName: string | null;
};

export type AdminSkuStockListParams = {
  page?: number;
  limit?: number;
  q?: string;
  productId?: string;
  status?: 'all' | 'active' | 'inactive';
  sort?: 'stock' | 'articleNumber' | 'productName';
};

export type AdminSkuStockRow = {
  skuId: string;
  productId: string;
  productName: string;
  articleNumber: string;
  combinationKey: string;
  optionLabels: string[];
  price: number;
  stock: number;
  active: boolean;
};

export type AdminProductDraft = {
  identity: { productId: string; slug: string; hasLegacyTree: boolean; canonicalSkuCount: number };
  values: FurnitureProductValues;
};

export function listAdminCatalogProducts(
  params: AdminCatalogProductListParams,
): Promise<AdminPagedResult<AdminCatalogProductRow>>;
export function getAdminProductDraft(productId: string): Promise<AdminProductDraft | null>;
export function listAdminOptionGroupsForCatalog(): Promise<AdminOptionGroupRow[]>;
export function listAdminRoomsForCatalog(): Promise<AdminRoomRow[]>;
export function listAdminCategoriesForCatalog(): Promise<AdminCategoryRow[]>;
export function listAdminSkuStock(
  params: AdminSkuStockListParams,
): Promise<AdminPagedResult<AdminSkuStockRow>>;
```

Rules: `lib/admin/catalog.ts` performs reads only, never calls guards (callers guard), never returns Prisma model instances, and always feeds `page`/`limit` through `lib/admin/pagination.ts`. `getAdminProductDraft(...).values` must satisfy `furnitureProductSchema.safeParse(...).success === true`; identity fields live in `identity`, never inside `values`. All six functions above are implemented in 5B.1 so later tasks consume a frozen contract; `listAdminSkuStock` is consumed by 5B.9, `getAdminProductDraft` by 5B.6, `listAdminOptionGroupsForCatalog`/`listAdminRoomsForCatalog` by 5B.3/5B.4/5B.6, `listAdminCategoriesForCatalog` by 5B.8.

### 2.3 `lib/cloudinary/folders.ts` (created in 5B.2)

```ts
export const EVIRONN_MEDIA_FOLDERS = [
  'evironn/uploads',
  'evironn/categories',
  'evironn/products',
  'evironn/skus',
  'evironn/turntable',
] as const;
export type EvironnMediaFolder = (typeof EVIRONN_MEDIA_FOLDERS)[number];
export const LEGACY_MEDIA_PREFIX = 'ritm/';

export function isSafeMediaPath(value: string): boolean;          // rejects '', whitespace-only, leading '/', '..', '//', '\\', control chars
export function isEvironnMediaFolder(value: string): value is EvironnMediaFolder;
export function isEvironnPublicId(value: string): boolean;        // safe path AND starts with `${folder}/` for one allowed folder
export function isLegacyPublicId(value: string): boolean;         // safe path AND startsWith LEGACY_MEDIA_PREFIX
export function assertSignableFolder(value: string): EvironnMediaFolder; // throws on non-allowlisted folder
```

### 2.4 `lib/admin/sku-matrix.ts` (created in 5B.5)

```ts
export type SkuMatrixAxis = {
  optionGroupId: string;
  optionGroupSlug: string;
  optionGroupName: string;
  sortOrder: number;
  values: { optionValueId: string; optionValueSlug: string; optionValueName: string; sortOrder: number }[];
};

export type SkuMatrixSelection = {
  optionGroupId: string;
  optionGroupSlug: string;
  optionValueId: string;
  optionValueSlug: string;
};

export type SkuMatrixRowState = 'existing' | 'new';

export type SkuMatrixRow = {
  combinationKey: string;
  selections: SkuMatrixSelection[];
  skuId: string | null;
  articleNumber: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  active: boolean;
  referenced: boolean;
  state: SkuMatrixRowState;
};

export type SkuDeactivationInstruction = {
  skuId: string;
  combinationKey: string;
  reason: 'removed-referenced-combination';
};

export type SkuMatrixResult = {
  rows: SkuMatrixRow[];
  deactivations: SkuDeactivationInstruction[];
  removals: { skuId: string; combinationKey: string }[]; // unreferenced rows safe to delete
};

export function buildSkuMatrix(input: {
  axes: SkuMatrixAxis[];
  existing: {
    skuId: string;
    combinationKey: string;
    articleNumber: string;
    price: number;
    oldPrice: number | null;
    stock: number;
    active: boolean;
    referenced: boolean;
  }[];
}): SkuMatrixResult;
```

Determinism: axes sorted by `(sortOrder, optionGroupSlug)`, values by `(sortOrder, optionValueSlug)`, rows generated as a nested cross-product in axis order, `combinationKey` produced only by `buildCombinationKey`. `referenced` means the SKU has at least one `cartItems` or `orderItems` row.

Stock semantics: `SkuMatrixRow.stock` carries the persisted value for `state === 'existing'` and the operator-entered initial value for `state === 'new'`. For `state === 'existing'` the value is display-only: the client component renders it read-only with the note that stock is managed in the stock console, and `saveFurnitureProduct` ignores it (3.1 rule S). `buildSkuMatrix` never decides stock authority; it only carries the field.

### 2.5 Canonical media input contract (used by 5B.7 and 5B.8)

```ts
export type AdminMediaInput = {
  id: string | null;                 // existing row id when editing
  kind: 'IMAGE' | 'TURN_TABLE_VIDEO' | 'TURN_TABLE_POSTER' | 'TURN_TABLE_FALLBACK';
  url: string;
  publicId: string | null;
  alt: string | null;
  sortOrder: number;
};
```

Ownership rule: a `publicId` that is new or changed for its row must satisfy `isEvironnPublicId`. A legacy `publicId` is accepted only when the exact same persisted row already holds that value (exact-row verification against the database inside the transaction).

### 2.6 Route and test-ID conventions

- New route trees: `app/(admin)/admin/catalog/options/**`, `app/(admin)/admin/catalog/rooms/**`, `app/(admin)/admin/catalog/stock/**` (chosen so `catalog-tabs.tsx` and `lib/admin/nav.ts` remain the single navigation source).
- `data-testid` pattern `admin-<area>-<element>[-<id>]`, for example `admin-options-table`, `admin-rooms-form-slug`, `admin-stock-row-<skuId>`, `admin-stock-input-<skuId>`, `admin-stock-save-<skuId>`, `admin-stock-stale-<skuId>`, `admin-product-matrix-row-<combinationKey>`, `admin-product-matrix-stock-<combinationKey>`, `admin-category-turntable-select`.
- Revalidation paths are listed per task; no wildcard revalidation.

## 3. Gap resolution map (evidence bundle, "5B task gaps")

| Gap | Resolution | Owning task |
| --- | --- | --- |
| 1 no canonical read module | `lib/admin/catalog.ts` per 2.2 with `incomplete-zero-sku` flag; list surface cut over, edit surface deferred to 5B.6 per 3.1 rule A | 5B.1 |
| 2 no folder module / ownership | `lib/cloudinary/folders.ts` + sign allowlist + delete ownership resolver | 5B.2 |
| 3 no option DTO/action/result | `lib/admin/action-result.ts`, `services/dto/option-group.dto.ts`, `app/actions/admin/option-groups.ts` | 5B.3 |
| 4 Room CRUD missing | `services/dto/room.dto.ts`, `app/actions/admin/rooms.ts`, rooms routes, product-form assignment control (unrendered until 5B.6) | 5B.4 |
| 5 legacy-only matrix | `lib/admin/sku-matrix.ts` + client matrix component (mounted in 5B.6) | 5B.5 |
| 6 legacy product write path | canonical single-transaction write with fixed ordering, migration-on-save, reference-aware delete policy (rule R) and split stock authority (rule S) | 5B.6 |
| 7 no canonical media persistence | in-transaction media write + post-commit destroy | 5B.7 |
| 8 no turntable binding action | `setCategoryTurntable` with typed conflict/holder result | 5B.8 |
| 9 no stock console | `setSkuStock` with expected-current guard; sole existing-SKU stock mutation path | 5B.9 |
| 10 legacy writes remain | static scan, importer enumeration, bounded removal, named exemption preserved | 5B.10 |
| 11 no functional checkpoint | desktop/mobile functional pass, visual debt log, consolidated focused batch, durable handoff | 5B.11 |

### 3.1 Binding decision rules (resolve the four review blockers; no other reading is permitted)

**Rule A - interim product read/form contract (5B.1 -> 5B.6).**

- 5B.1 cuts over the product **list** read path only: `app/(admin)/admin/catalog/products/page.tsx` calls `listAdminCatalogProducts`, and `product-table.tsx` / `product-filters.tsx` accept exactly `AdminCatalogProductRow[]` and `AdminCatalogProductListParams`.
- 5B.1 does **not** touch `app/(admin)/admin/catalog/products/[id]/edit/page.tsx`, `products/new/page.tsx`, `products/_components/product-form.tsx`, `products/_components/colorway-card.tsx`, `products/_components/variant-matrix.tsx`, or `app/actions/admin/products.ts`. The interim contract is named and frozen: the edit and new pages keep their current legacy read and keep passing the current legacy `ProductValues`-shaped defaults (from `services/dto/product.dto.ts`) into `product-form.tsx`, which keeps calling the current legacy save action in `app/actions/admin/products.ts`. No prop or action signature changes in 5B.1.
- `getAdminProductDraft` is implemented and covered by `tests/admin-catalog-read.test.ts` in 5B.1 but has no route consumer until 5B.6. That is intentional and must not be "helpfully" wired early.
- The edit/new page cutover to `getAdminProductDraft` + canonical form + `saveFurnitureProduct` happens in the single 5B.6 commit so pages, form and action change together.
- The same rule governs pre-landed UI: 5B.4 adds the room control to `product-form.tsx` behind optional props with empty defaults (nothing renders while the legacy pages omit them), and 5B.5 creates `sku-matrix.tsx` without importing it into `product-form.tsx`. Both become live in 5B.6.
- 5B.1 handoff wording is exactly: legacy relation reads are removed from the admin product **list** query only; the edit page keeps its legacy read/form/action contract until 5B.6; no non-admin legacy reader is touched.

**Rule V - option link detachment versus retained SKUs (5B.6).** Definitions used verbatim by implementation and tests, evaluated against the post-reconciliation state computed in 5B.6 step 1:

- `retained SKU` - an existing `Sku` row that is not in `SkuMatrixResult.removals`, therefore still present after step 5.
- `sellable SKU` - a retained or newly created SKU whose `active` value after step 5 is `true`.
- `retained inactive SKU` - a retained SKU whose `active` value after step 5 is `false`, including every row named by `SkuMatrixResult.deactivations` and any row the operator deactivated manually. A `retained inactive referenced SKU` additionally has `referenced === true`.
- Per-product detachment of `ProductOptionValue` is refused with `OPTION_VALUE_IN_USE` **only** when at least one sellable SKU still has a `SkuOptionValue` row selecting that `optionValueId`. Detachment is allowed when the only remaining selectors are retained inactive SKUs, referenced or not.
- Per-product detachment of `ProductOptionGroup` is refused with `OPTION_GROUP_IN_USE` under the same rule, evaluated on `SkuOptionValue.optionGroupId` of sellable SKUs.
- Detaching `ProductOptionValue` / `ProductOptionGroup` rows never deletes `SkuOptionValue` rows. Retained inactive SKUs keep their immutable selections so cart/order references and order snapshots stay intact. `OptionValue` and `OptionGroup` rows themselves are never deleted by 5B.6.
- Refusal details carry `details.optionValueSlug` or `details.optionGroupSlug`, `details.sellableSkuCount`, and `details.blockingCombinationKeys` (string array, capped at 20 entries).
- This per-product detach rule is deliberately weaker than the **global** `deleteOptionGroup` / value deletion rule in 5B.3, which still refuses while any `ProductOptionValue` or `SkuOptionValue` row references the value or group (the restrictive FKs demand it). Both rules coexist; neither may be relaxed to satisfy the other.

**Rule R - reference-aware product delete and deactivate (5B.6).**

- Preflight computes, in one read pass:

```ts
type ProductReferenceCounts = {
  referencedSkuCount: number;           // Sku rows of this product with >= 1 CartItem or >= 1 OrderItem
  referencedLegacyVariantCount: number; // legacy ProductVariant rows of this product with >= 1 CartItem or >= 1 OrderItem via productVariantId
  referencedWishlistCount: number;      // WishlistItem rows pointing at this product or its SKUs, when such a relation exists
};
```

- The legacy path is reached through the existing legacy tree (`Product -> ProductColorway -> ProductVariant`) and the compatibility field `productVariantId` on cart and order items; read the exact relation names from `prisma/schema.prisma` (read-only) and from the current legacy branches in `app/actions/admin/products.ts`. The current schema confirms `WishlistItem.productId -> Product.id`, so `referencedWishlistCount` is the real count of wishlist rows for the product and must never be hard-coded to `0`.
- `deleteFurnitureProduct` hard-deletes only when all three counts are `0` **and** no category holds the product as `turntableProductId`. Any non-zero count refuses `PRODUCT_HAS_REFERENCES` with the three counts in `details`, performs zero writes, and instructs the operator to deactivate instead.
- Deactivation never deletes. `setProductActive` is a single `prisma.product.update({ data: { active } })` with the turntable guard applied before `active: false`; it writes no child rows, deletes nothing, and never touches legacy children, `salesCount`, cart, wishlist, order, payment or snapshot rows.
- A permitted hard delete removes only rows owned by the product, explicitly and child-first inside the transaction: `SkuMedia`, `SkuOptionValue`, `Sku`, `ProductMedia`, `ProductOptionValue`, `ProductOptionGroup`, `ProductRoom`, legacy `ProductVariant`, legacy `ProductImage`, legacy `ProductColorway`, then `Product`. Never rely on database cascade to decide safety; the reference count is the guard. Legacy children are never deleted while referenced. Preflight captures public IDs from the exact owned `SkuMedia`, `ProductMedia`, and legacy `ProductImage` rows; provider deletion runs only after the database transaction commits, once per no-longer-referenced ID, and a provider failure is non-fatal with warning `media-destroy-failed`.
- `tests/admin-products-action.test.ts` carries the zero-write invariant: a refused delete issues no `delete`/`deleteMany` against `Product`, `ProductColorway`, `ProductImage`, `ProductVariant`, `Sku`, `SkuOptionValue`, `SkuMedia`, `ProductMedia`, `CartItem`, `WishlistItem` or `OrderItem`, and the returned code is `PRODUCT_HAS_REFERENCES`. A separate case proves a legacy-only reference (zero canonical SKU references, non-zero `referencedLegacyVariantCount`) also refuses.

**Rule S - stock authority split (5B.6 / 5B.9).**

- `saveFurnitureProduct` never includes `stock` in an update payload for an existing `Sku`. New SKU rows are created with the submitted `stock`.
- `furnitureProductSchema` keeps requiring `stock` per SKU; no DTO rule is relaxed. The form pre-fills the persisted value for existing rows and renders it read-only (`admin-product-matrix-stock-<combinationKey>`), and the action drops the field for existing rows.
- When a submitted existing-row `stock` differs from the persisted value, the action still succeeds and returns `warnings: ['existing-sku-stock-ignored']`.
- Every existing-SKU stock mutation goes through `setSkuStock` (5B.9) with `expectedStock` / `nextStock` and the `STALE_VALUE` conflict payload. This is the only concurrency-safe stock path in 5B, so a stale product save can never overwrite a checkout decrement.
- `tests/admin-products-action.test.ts` asserts: the update payload for an existing SKU contains no `stock` key even when the submitted value differs from persisted; the persisted value is unchanged; the warning literal is returned; and a new SKU's create payload does include `stock`. Checkpoint 2 reviews this rule explicitly.

### 3.2 Remaining ambiguity bounds for fresh implementers

- **Legacy `publicId` column names** on `ProductImage`/`ProductColorway`: read the exact field names from `prisma/schema.prisma` (read-only) and the existing legacy delete path in `app/actions/admin/products.ts`. If no legacy public-ID column exists, restrict legacy delete acceptance to `Category.coverImagePublicId`, `ProductMedia.publicId`, `SkuMedia.publicId` and record the finding in the 5B.2 evidence note.
- **DTO strictness**: assert `furnitureProductSchema` behaviour in the 5B.1 RED test before shaping the draft. Never relax an existing DTO rule to make a draft parse.
- **SKU disposal**: default policy is deactivate. Hard delete a `Sku` only when it has zero `cartItems` and zero `orderItems`. If either count cannot be determined cheaply, deactivate. Product-level disposal follows rule R.
- **Denormalized fields**: `Product.minPrice` and `Product.discountPct` are recomputed from active SKUs inside the same transaction. `Product.salesCount` is never written by 5B.

## 4. Tasks

### 5B.1 Canonical catalog read layer

- **Owner**: Luna High implementer (5B.1).
- **Dependencies**: none beyond `C5A_ACCEPTED`.
- **Files**: create `lib/admin/catalog.ts`, `tests/admin-catalog-read.test.ts`. Adapt `app/(admin)/admin/catalog/products/page.tsx` (list read only), `products/_components/product-table.tsx`, `products/_components/product-filters.tsx` (data shape only, no visual change).
- **Explicitly not touched in 5B.1** (rule A): `products/[id]/edit/page.tsx`, `products/new/page.tsx`, `products/_components/product-form.tsx`, `colorway-card.tsx`, `variant-matrix.tsx`, `app/actions/admin/products.ts`, `services/dto/product.dto.ts`. Their legacy read/prop/action contract stays intact until the single 5B.6 cutover commit.
- **Reuse**: `lib/admin/pagination.ts` clamps and parsers, `lib/admin/require-admin.ts :: requireAdminPage`, `services/dto/product.dto.ts :: furnitureProductSchema`/`FurnitureProductValues`, existing readiness gate and skeletons.
- **Interfaces**: exactly 2.2, all six functions. Canonical reads use `Product` with `select`/`include` over `category`, `rooms.room`, `optionGroups.optionGroup`, `optionValues`, `skus.selections`, `media`, and `skus.media` where the draft needs it. `flags` includes `incomplete-zero-sku` when `skuCount === 0`; the marker is presentational only and must not block reads.
- **Write ordering**: none (read-only module).
- **RED**: `npm test -- tests/admin-catalog-read.test.ts` (fails: module missing). The test asserts pagination clamping, the `incomplete-zero-sku` marker, deterministic row ordering, `listAdminSkuStock` clamping/ordering, and `furnitureProductSchema.safeParse(getAdminProductDraft(...).values).success === true` on fixture data.
- **GREEN**: `npm test -- tests/admin-catalog-read.test.ts`; `npm run typecheck` (proves the untouched legacy edit path still type-checks against its legacy form and action); `npx prettier --check lib/admin/catalog.ts tests/admin-catalog-read.test.ts "app/(admin)/admin/catalog/products/**"`; `git diff --check`.
- **Commit**: `feat(admin): add canonical catalog read layer`.
- **Review range**: none standalone (folded into checkpoint 1 range).
- **Handoff evidence**: focused test output, typecheck result, and the rule A statement verbatim - legacy relation reads are removed from the admin product list query only; the edit page keeps its legacy read/form/action contract until 5B.6; `getAdminProductDraft` and `listAdminSkuStock` ship tested but unwired; no non-admin legacy reader is touched.

### 5B.2 Cloudinary Evironn folder and public-ID ownership

- **Owner**: Luna High implementer (5B.2).
- **Dependencies**: 5B.1 (catalog reads used for resolver fixtures only).
- **Files**: create `lib/cloudinary/folders.ts`, `tests/cloudinary-folders.test.ts`, `tests/admin-media-routes.test.ts`. Adapt `app/api/admin/media/sign/route.ts`, `app/api/admin/media/delete/route.ts`, `lib/cloudinary/admin-media.ts`, `app/(admin)/admin/catalog/categories/_components/category-form.tsx`.
- **Reuse**: `requireAdminApi`, `lib/admin/api-error.ts`, `lib/cloudinary/{config,sign,server,url,validate}.ts` unchanged, `components/admin/media/image-uploader.tsx` API.
- **Interfaces**: 2.3 plus, in `lib/cloudinary/admin-media.ts`:

```ts
export type MediaDeleteDecision =
  | { allowed: true; reason: 'evironn-folder' | 'db-referenced-legacy' }
  | { allowed: false; reason: 'unsafe-path' | 'foreign-public-id' };

export function resolveMediaDeleteDecision(publicId: string): Promise<MediaDeleteDecision>;
```

  The resolver checks, in order: `isSafeMediaPath`, `isEvironnPublicId`, then exact-value existence in `Category.coverImagePublicId`, `ProductMedia.publicId`, `SkuMedia.publicId` and any legacy public-ID column confirmed to exist.
- **Write ordering**: sign route: `requireAdminApi()` -> config presence check -> parse body -> `assertSignableFolder` -> signature. Delete route: `requireAdminApi()` -> config presence check -> parse body -> `resolveMediaDeleteDecision` -> idempotent destroy -> typed response. Refusals use the existing error envelope with no secret material.
- **RED**: `npm test -- tests/cloudinary-folders.test.ts tests/admin-media-routes.test.ts` (fails). Tests assert the exact five folders, `LEGACY_MEDIA_PREFIX`, traversal/leading-slash/empty-segment rejection, `ritm/*` sign refusal, Evironn-ID delete acceptance, database-referenced legacy delete acceptance, foreign-ID delete refusal, guard-before-config-before-body ordering, and absence of secret values in responses.
- **GREEN**: `npm test -- tests/cloudinary-folders.test.ts tests/admin-media-routes.test.ts tests/media-sign-route.test.ts tests/media-delete-route.test.ts tests/admin-media.test.ts tests/categories-action.test.ts`; `npm run typecheck`; prettier check on touched files; `git diff --check`.
- **Legacy inventory evidence** (required before checkpoint 1, counts only, no secret values): number of `ritm/` values in `Category.coverImagePublicId`, `ProductMedia.publicId`, `SkuMedia.publicId`, confirmed `ProductImage.publicId`, plus `rg -c "ritm/" lib/demo-data/canonical.ts` and `rg -n "ritm/" app components lib services`. Every remaining signer caller found by the code scan is migrated to `EVIRONN_MEDIA_FOLDERS` in this commit or explicitly recorded as read-only legacy. Counts and dispositions are recorded in the closeout section at 5B.11; unrelated repository-wide branding cleanup remains 5D.
- **Commit**: `feat(media): enforce Evironn Cloudinary folder ownership`.
- **Review checkpoint 1** follows this commit (see 5).
- **Handoff evidence**: focused test output, inventory counts, statement that no legacy ID is signable and no secret is logged.

### 5B.3 Option groups and option values

- **Owner**: Luna High implementer (5B.3).
- **Dependencies**: 5B.1; review checkpoint 1 resolved.
- **Files**: create `lib/admin/action-result.ts`, `services/dto/option-group.dto.ts`, `app/actions/admin/option-groups.ts`, `app/(admin)/admin/catalog/options/page.tsx`, `options/new/page.tsx`, `options/[id]/edit/page.tsx`, `options/_components/option-group-form.tsx`, `options/_components/option-group-table.tsx`, `options/_components/option-value-editor.tsx`, `tests/option-group-dto.test.ts`, `tests/admin-option-groups.test.ts`. Adapt `lib/admin/nav.ts`, `app/(admin)/admin/catalog/_components/catalog-tabs.tsx`.
- **Reuse**: `requireAdminPage`/`requireAdminAction`, `lib/admin/pagination.ts`, `listAdminOptionGroupsForCatalog`, `app/actions/admin/categories.ts` guard-first CRUD/reorder shape, `services/dto/category.dto.ts` slug rules, frozen admin UI primitives.
- **Interfaces**:

```ts
// services/dto/option-group.dto.ts
export const optionValueSchema: z.ZodType<{
  id?: string; name: string; slug: string; swatchHex: string | null; sortOrder: number;
}>;
export const optionGroupSchema: z.ZodType<{
  id?: string; name: string; slug: string; sortOrder: number; values: OptionValueValues[];
}>;
export type OptionGroupValues = z.infer<typeof optionGroupSchema>;

// app/actions/admin/option-groups.ts
export async function saveOptionGroup(input: unknown): Promise<AdminActionResult<{ id: string }>>;
export async function deleteOptionGroup(input: unknown): Promise<AdminActionResult<null>>;
export async function reorderOptionGroups(input: unknown): Promise<AdminActionResult<null>>;
```

  DTO rules: trimmed non-empty names, kebab slugs unique within the payload, optional `swatchHex` as `#rrggbb`, non-negative integer `sortOrder`, at least one value per group.
- **Write ordering**: guard -> parse -> uniqueness precheck (`OptionGroup.slug`, `(optionGroupId, slug)`) -> `$transaction`: upsert group scalars -> delete removed values only when unreferenced by `ProductOptionValue`/`SkuOptionValue` -> update kept values -> create new values -> normalize `sortOrder`. Deletion refuses with `OPTION_GROUP_IN_USE` / `OPTION_VALUE_IN_USE` plus `details.referencedBy` counts. Revalidate `/admin/catalog/options` and `/admin/catalog/products`.
- **Scope note (rule V)**: this task owns **global** option-group and option-value deletion, which stays strict - any `ProductOptionValue` or `SkuOptionValue` reference refuses, because the schema FKs are restrictive. The weaker per-product detach rule lives only in 5B.6 and must not be copied here.
- **RED**: `npm test -- tests/option-group-dto.test.ts tests/admin-option-groups.test.ts`.
- **GREEN**: the same plus `npm test -- tests/admin-nav.test.ts tests/admin-route-contract.test.ts tests/admin-access-boundary.test.ts`; `npm run typecheck`; prettier; `git diff --check`.
- **Commit**: `feat(admin): add option group and value administration`.
- **Review range**: none standalone (folded into checkpoint 2 range).
- **Handoff evidence**: focused test output, reference-safe deletion transcript, nav/tab snapshot, one-line statement that global deletion strictness differs from 5B.6 per-product detachment by design.

### 5B.4 Room CRUD and product assignments

- **Owner**: Luna High implementer (5B.4).
- **Dependencies**: 5B.3 (`AdminActionResult`, nav pattern).
- **Files**: create `services/dto/room.dto.ts`, `app/actions/admin/rooms.ts`, `app/(admin)/admin/catalog/rooms/page.tsx`, `rooms/new/page.tsx`, `rooms/[id]/edit/page.tsx`, `rooms/_components/room-form.tsx`, `rooms/_components/room-table.tsx`, `tests/room-dto.test.ts`, `tests/admin-rooms-action.test.ts`. Adapt `lib/admin/nav.ts`, `catalog-tabs.tsx`, and add the room multi-select to `products/_components/product-form.tsx`.
- **Interim product-form contract (rule A)**: the multi-select is added behind optional props with defaults - `availableRooms?: Pick<AdminRoomRow, 'id' | 'name' | 'slug'>[]` (default `[]`) and `selectedRoomIds?: string[]` (default `[]`) - and is rendered only when `availableRooms.length > 0`. The legacy edit/new pages do not pass them in 5B.4, so no legacy prop or action signature changes and nothing renders. 5B.6 supplies real data and wires the value into `saveFurnitureProduct`. Do not submit room ids from the legacy action.
- **Reuse**: category reorder transaction shape, occupied-delete refusal shape, pagination, `listAdminRoomsForCatalog`, frozen primitives.
- **Interfaces**:

```ts
export const roomSchema: z.ZodType<{ id?: string; name: string; slug: string; sortOrder: number }>;
export async function saveRoom(input: unknown): Promise<AdminActionResult<{ id: string }>>;
export async function deleteRoom(input: unknown): Promise<AdminActionResult<null>>;
export async function reorderRooms(input: unknown): Promise<AdminActionResult<null>>;
```

- **Write ordering**: guard -> parse -> `Room.slug` uniqueness precheck -> `$transaction`: upsert room, then contiguous `sortOrder` normalization. Delete: count `ProductRoom` rows first; a non-zero count refuses `ROOM_HAS_PRODUCTS` with `details.productCount`. Revalidate `/admin/catalog/rooms` and `/admin/catalog/products`.
- **RED**: `npm test -- tests/room-dto.test.ts tests/admin-rooms-action.test.ts`.
- **GREEN**: the same plus `npm test -- tests/admin-nav.test.ts tests/admin-route-contract.test.ts tests/admin-access-boundary.test.ts`; typecheck; prettier; `git diff --check`.
- **Commit**: `feat(admin): add room administration and assignments`.
- **Handoff evidence**: focused output, `ROOM_HAS_PRODUCTS` transcript, and the explicit note that the product form gained inert optional room props only, with persistence landing in 5B.6.

### 5B.5 Deterministic SKU option matrix

- **Owner**: Luna High implementer (5B.5).
- **Dependencies**: 5B.1, 5B.3.
- **Files**: create `lib/admin/sku-matrix.ts`, `app/(admin)/admin/catalog/products/_components/sku-matrix.tsx`, `tests/admin-sku-matrix.test.ts`.
- **Interim contract (rule A)**: `sku-matrix.tsx` is created but **not** imported by `product-form.tsx` in this task; the legacy `variant-matrix.tsx` stays mounted until 5B.6 and is deleted in 5B.10.
- **Reuse**: `lib/furniture-sku.ts :: buildCombinationKey` (mandatory single source of keys), existing table/input primitives, 5B.1 draft types.
- **Interfaces**: exactly 2.4. The client component is presentation plus local state; it never queries Prisma and never constructs keys itself.
- **Behaviour**: full cross-product of selected option values; stable ordering; existing SKU field values preserved on regeneration; `stock` on `state === 'existing'` rows is rendered read-only with the stock-console note and is never submitted as an update (rule S); disappearing combinations become `deactivations` when `referenced` and `removals` otherwise; duplicate group selections surface the existing `buildCombinationKey` error rather than a new one.
- **Write ordering**: none (pure function plus client state; persistence is 5B.6).
- **RED**: `npm test -- tests/admin-sku-matrix.test.ts`.
- **GREEN**: the same plus `npm test -- tests/furniture-domain.test.ts tests/furniture-schema.test.ts`; typecheck; prettier; `git diff --check`.
- **Commit**: `feat(admin): add deterministic SKU option matrix`.
- **Handoff evidence**: focused output, ordering transcript, read-only existing-stock assertion, explicit statement that `variant-matrix.tsx` still exists and is retired in 5B.10.

### 5B.6 Canonical product and SKU write action

- **Owner**: Luna High implementer (5B.6).
- **Dependencies**: 5B.1, 5B.3, 5B.4, 5B.5.
- **Files**: adapt `app/actions/admin/products.ts`, `app/(admin)/admin/catalog/products/_components/product-form.tsx`, `products/new/page.tsx`, `products/[id]/edit/page.tsx`; create `tests/admin-products-action.test.ts`.
- **Cutover (rule A, one commit)**: this task performs the edit/new page cutover to `getAdminProductDraft`, mounts `sku-matrix.tsx` in `product-form.tsx`, passes real `availableRooms`/`selectedRoomIds`, and replaces the legacy save call with `saveFurnitureProduct`. Pages, form and action must change together so no intermediate state has mismatched props. Legacy `ProductColorway`/`ProductImage`/`ProductVariant` **rows** remain readable; only the admin write path changes here, and legacy symbols are deleted in 5B.10.
- **Reuse**: `furnitureProductSchema`/`FurnitureProductValues`, `buildCombinationKey`, `AdminActionResult`, `getAdminProductDraft`, `buildSkuMatrix` output, `specs-editor.tsx` for `Product.specs`.
- **Interfaces**:

```ts
export async function saveFurnitureProduct(
  input: unknown,
): Promise<AdminActionResult<{ productId: string; skuCount: number; deactivatedSkuIds: string[] }>>;
export async function setProductActive(
  input: unknown,
): Promise<AdminActionResult<{ productId: string; active: boolean }>>;
export async function deleteFurnitureProduct(input: unknown): Promise<AdminActionResult<null>>;
```

- **Write ordering (single `prisma.$transaction`, exactly this sequence)**:
  1. **Preflight, no writes.** Load current canonical state (`Sku` rows with `selections` plus `cartItems`/`orderItems` reference counts, `ProductRoom`, `ProductOptionGroup`, `ProductOptionValue`, `ProductMedia`, affected `SkuMedia`) and legacy-tree presence. Compute the reconciliation sets `skuUpdates`, `skuCreates`, `skuDeactivations`, `skuRemovals`, then derive `retainedSkuIds`, `sellableSkuIds` and the rule V detach guard. Compute `ProductReferenceCounts` (rule R) when the call is a delete. Every refusal that can be decided here (`VALIDATION_ERROR`, `MIGRATION_INCOMPLETE`, `SLUG_TAKEN`, `ARTICLE_NUMBER_TAKEN`, `OPTION_VALUE_IN_USE`, `OPTION_GROUP_IN_USE`, `PRODUCT_HAS_REFERENCES`, `TURNTABLE_BOUND_PRODUCT_LOCKED`) is returned before any write.
  2. `Product` scalars (`name`, `slug`, `brand`, `gender`, `categoryId`, `description`, `fitNote`, `specs`, `isBestseller`, `active`, `sortOrder`) create or update.
  3. `ProductRoom`: `deleteMany` removed pairs, `createMany` added pairs.
  4. **Additive option links**: `ProductOptionGroup` `createMany` added pairs; `ProductOptionValue` `createMany` added triples. No removals in this step.
  5. `Sku` reconciliation: update kept rows (`price`, `oldPrice`, `active`, `articleNumber` - **never `stock`**, rule S); create new rows with `combinationKey` from `buildCombinationKey` and the submitted `stock`; apply `skuDeactivations` as `active: false`. For each `skuRemoval` (zero `cartItems`, zero `orderItems`), capture exact owned `SkuMedia.publicId` values from preflight, delete `SkuMedia`, then `SkuOptionValue`, then `Sku`, even though the current schema declares both child relations `onDelete: Cascade`; the explicit order preserves cleanup evidence and avoids relying on implicit cascade behaviour. Destroy captured no-longer-referenced assets only after commit, using the same non-fatal warning contract as rule R.
  6. `SkuOptionValue`: `createMany` for newly created SKUs only. Selections of existing SKUs are immutable; a changed selection means a new SKU plus deactivation of the old one.
  7. **Subtractive option links**, evaluated against the post-step-5/6 state: `ProductOptionValue` `deleteMany` removed triples, then `ProductOptionGroup` `deleteMany` removed pairs, each permitted only under rule V. The preflight guard from step 1 is re-checked here as a defensive backstop; a mismatch throws a sentinel so the whole transaction rolls back, and the action maps that sentinel to `OPTION_VALUE_IN_USE` / `OPTION_GROUP_IN_USE` with the rule V details. Removing these link rows never deletes `SkuOptionValue` rows.
  8. Recompute `Product.minPrice` and `Product.discountPct` from active SKUs. When there are no active SKUs, persist `minPrice: 0` and `discountPct: 0`, matching the non-null schema defaults and the existing aggregate contract. `salesCount` untouched.
  9. Media writes are appended here by 5B.7 (after step 8, still inside the same transaction).
- **Stock authority (rule S)**: existing-SKU `stock` is read-only in the form, dropped from update payloads, and mutated only by `setSkuStock` (5B.9). A divergent submitted value returns `warnings: ['existing-sku-stock-ignored']`.
- **Migration-on-save**: when the product has zero canonical SKUs and a legacy tree, the same submit path creates canonical rows and leaves legacy `ProductColorway`/`ProductImage`/`ProductVariant` rows untouched for read compatibility. If the submitted draft lacks option groups, option values or at least one SKU, refuse with `MIGRATION_INCOMPLETE` and `details.missing`.
- **Interim media contract (5B.6 -> 5B.7)**: the canonical form does not make ProductMedia/SkuMedia editable in 5B.6. Any existing canonical media is preserved and may be rendered read-only; ordinary product saves neither delete nor rewrite it. The only media rows removed in 5B.6 are rows owned by an explicitly removed SKU under step 5, with post-commit asset cleanup. Editable canonical media input and general media reconciliation become live only in 5B.7; no submitted media field may be silently ignored.
- **Turntable guard**: before `active: false` or delete, check `Category.turntableProductId === productId`; on match refuse `TURNTABLE_BOUND_PRODUCT_LOCKED` with `details.categoryId` and `details.categorySlug`.
- **Deletion and deactivation policy**: exactly rule R. Hard delete only with zero canonical SKU references, zero legacy `ProductVariant` references and zero wishlist references; otherwise refuse `PRODUCT_HAS_REFERENCES` and deactivate through `setProductActive`. Deactivation never deletes rows. Never delete cart, wishlist, order-item, payment or snapshot rows, and never delete legacy children while referenced.
- **Revalidation**: `/admin/catalog/products`, `/admin/catalog/products/${productId}/edit`, `/admin/catalog` (exact paths only).
- **RED**: `npm test -- tests/admin-products-action.test.ts`.
- **GREEN**: `npm test -- tests/admin-products-action.test.ts tests/product-dto.test.ts tests/product-aggregates.test.ts tests/furniture-domain.test.ts tests/order-snapshot.test.ts`; typecheck; prettier; `git diff --check`.
- **Required focused cases in `tests/admin-products-action.test.ts`** (in addition to the happy path):
  1. Rule V allow - detaching an option value selected only by a retained inactive referenced SKU succeeds, the `SkuOptionValue` row survives, and the SKU stays `active: false`.
  2. Rule V refuse - detaching an option value still selected by a sellable SKU returns `OPTION_VALUE_IN_USE` with `details.sellableSkuCount` and `details.blockingCombinationKeys`, and persists nothing.
  3. Rule V group variant - the same allow/refuse pair for `ProductOptionGroup`.
  4. Rule R canonical - delete refused with `PRODUCT_HAS_REFERENCES` when a canonical SKU has order or cart items; zero-write invariant asserted.
  5. Rule R legacy - delete refused when only a legacy `ProductVariant` is referenced; zero-write invariant asserted; legacy children untouched.
  6. Rule R deactivate - `setProductActive(false)` writes only `Product.active` and deletes nothing.
  7. Rule S existing - a stale submitted `stock` for an existing SKU is not written, the persisted value is unchanged, and `warnings` contains `'existing-sku-stock-ignored'`.
  8. Rule S new - a newly created SKU persists the submitted `stock`.
  9. Migration refusal - `MIGRATION_INCOMPLETE` with `details.missing`.
  10. Turntable lock - `TURNTABLE_BOUND_PRODUCT_LOCKED` on deactivate and on delete.
- **Commit**: `feat(admin): write canonical product and SKU rows`.
- **Handoff evidence**: focused output, ordered transaction transcript (steps 1-8), child-first removed-SKU transcript with post-commit asset cleanup, rule V allow/refuse transcript, rule R refusal transcript with the three counts and the confirmed `WishlistItem.productId` relation, rule S warning transcript, migration refusal transcript, zero-active-SKU `0/0` aggregate transcript, turntable-lock transcript, the interim read-only/preserved media contract, and a statement that pages/form/action cut over in this single commit.

### 5B.7 Product form media: ProductMedia and SkuMedia

- **Owner**: Luna High implementer (5B.7).
- **Dependencies**: 5B.2, 5B.6.
- **Files**: adapt `app/actions/admin/products.ts` (media stage), `products/_components/product-form.tsx`, `products/_components/sku-matrix.tsx` (per-SKU media slots), `lib/cloudinary/admin-media.ts` (reuse destroy plus decision), optionally a narrow typed media extension in `services/dto/product.dto.ts`; create `tests/admin-product-media.test.ts`.
- **Reuse**: `AdminMediaInput` (2.5), `components/admin/media/image-uploader.tsx`, `image-preview-card.tsx`, `EVIRONN_MEDIA_FOLDERS`, the existing 360 cardinality rule in `furnitureProductSchema`, `tests/product-media-stage.test.tsx` render contract.
- **Write ordering (inside the 5B.6 transaction, as step 9, after step 8)**:
  1. Read current `ProductMedia` rows for the product and `SkuMedia` rows for affected SKUs.
  2. Validate each incoming `publicId`: new or changed values must pass `isEvironnPublicId`; legacy values must match the exact persisted row value, otherwise refuse `MEDIA_OWNERSHIP_REJECTED` with `details.publicIdKind`.
  3. `deleteMany` all media rows for the affected owners, then `createMany` the final ordered set. This avoids `(owner, kind, sortOrder)` unique collisions during reorder and is safe because order history stores copied image values, never media foreign keys.
  4. Collect `publicIdsToDestroy` = Evironn IDs present before and absent after, excluding IDs still referenced by any other row.
  5. Never call Cloudinary destroy inside the transaction.
- **Post-commit**: after the transaction resolves, call the existing idempotent destroy helper exactly once per collected asset; failures are non-fatal and surface through `AdminActionOk.warnings` as `'media-destroy-failed'`.
- **Bound-product rule**: if the product is a category turntable holder, refuse the save with `TURNTABLE_MEDIA_REQUIRED` when the final media set lacks exactly one `TURN_TABLE_VIDEO`, one `TURN_TABLE_POSTER` and one `TURN_TABLE_FALLBACK`.
- **RED**: `npm test -- tests/admin-product-media.test.ts`.
- **GREEN**: `npm test -- tests/admin-product-media.test.ts tests/product-media-stage.test.tsx tests/admin-products-action.test.ts tests/admin-media.test.ts tests/order-snapshot.test.ts`; typecheck; prettier; `git diff --check`.
- **Commit**: `feat(admin): persist canonical product and SKU media`.
- **Review checkpoint 2** follows this commit (see 5).
- **Handoff evidence**: focused output, ownership refusal transcript, destroy-after-commit ordering proof, snapshot-immutability statement.

### 5B.8 Category turntable binding and 360 contract

- **Owner**: Luna High implementer (5B.8).
- **Dependencies**: 5B.7; review checkpoint 2 resolved.
- **Files**: adapt `app/actions/admin/categories.ts`, `services/dto/category.dto.ts` (binding input only), `app/(admin)/admin/catalog/categories/_components/category-form.tsx`, `categories/page.tsx`; create `tests/admin-categories-turntable.test.ts`.
- **Reuse**: existing category CRUD/reorder/occupied-delete refusal unchanged, `listAdminCategoriesForCatalog`, `listAdminCatalogProducts` for the eligible-product picker, `EVIRONN_MEDIA_FOLDERS`.
- **Interfaces**:

```ts
export async function setCategoryTurntable(
  input: unknown,
): Promise<AdminActionResult<{ categoryId: string; productId: string | null }>>;
```

  Zod input `{ categoryId: string; productId: string | null }`; `null` performs an explicit unbind.
- **Write ordering**: guard -> parse -> load category and product -> when binding, verify the product owns exactly one `TURN_TABLE_VIDEO`, one `TURN_TABLE_POSTER` and one `TURN_TABLE_FALLBACK` (`TURNTABLE_MEDIA_REQUIRED` otherwise) -> check the unique FK: if another category already holds the product, refuse `TURNTABLE_BINDING_CONFLICT` with `details.holderCategoryId`, `details.holderCategoryName`, `details.holderCategorySlug` -> `$transaction` single `Category.update` of `turntableProductId` -> revalidate `/admin/catalog/categories` and `/admin/catalog/categories/${categoryId}/edit`.
- **RED**: `npm test -- tests/admin-categories-turntable.test.ts`.
- **GREEN**: `npm test -- tests/admin-categories-turntable.test.ts tests/categories-action.test.ts tests/category-dto.test.ts tests/admin-products-action.test.ts`; typecheck; prettier; `git diff --check`.
- **Commit**: `feat(admin): bind category turntable product`.
- **Handoff evidence**: focused output, conflict-naming transcript, unbind transcript, confirmation that category CRUD behaviour is unchanged.

### 5B.9 Guarded stock console

- **Owner**: Luna High implementer (5B.9).
- **Dependencies**: 5B.1, 5B.3 (`AdminActionResult`), 5B.6 (canonical SKUs exist).
- **Files**: create `app/actions/admin/stock.ts`, `app/(admin)/admin/catalog/stock/page.tsx`, `stock/_components/stock-table.tsx`, `stock/_components/stock-cell.tsx`, `tests/admin-stock-action.test.ts`. Adapt `lib/admin/nav.ts`, `catalog-tabs.tsx`. `lib/admin/catalog.ts` is not edited unless `listAdminSkuStock` is missing a filter this page needs, in which case the diff is limited to that filter.
- **Reuse**: `listAdminSkuStock` from 5B.1, `changeUserRole` one-shot guarded update pattern, `updateMany` race-detection pattern from `app/actions/admin/orders.ts`, pagination, frozen table primitives.
- **Interfaces**:

```ts
export async function setSkuStock(
  input: unknown,
): Promise<AdminActionResult<{ skuId: string; stock: number }>>;
```

  Zod: `skuId` non-empty string, `expectedStock` integer `>= 0`, `nextStock` integer `>= 0`.
- **Write ordering**: guard -> parse -> `prisma.sku.updateMany({ where: { id: skuId, stock: expectedStock }, data: { stock: nextStock } })` -> when `count === 0`, read the current row and return `STALE_VALUE` with `details.currentStock` (or `NOT_FOUND` when the SKU is absent) -> revalidate `/admin/catalog/stock` and `/admin/catalog/products`. No order, payment, cart, wishlist or snapshot write. No `Product.salesCount` write.
- **Authority statement (rule S)**: `setSkuStock` is the only path in 5B that mutates `Sku.stock` on an existing SKU. `saveFurnitureProduct` sets stock only when creating a new SKU row.
- **RED**: `npm test -- tests/admin-stock-action.test.ts`.
- **GREEN**: `npm test -- tests/admin-stock-action.test.ts tests/admin-nav.test.ts tests/admin-route-contract.test.ts tests/admin-access-boundary.test.ts tests/payment-sync.test.ts`; typecheck; prettier; `git diff --check`.
- **Handoff evidence**: focused output, stale-value transcript with `currentStock`, statement that only `Sku.stock` is written and that it is the sole existing-SKU stock mutation path.
- **Commit**: `feat(admin): add guarded SKU stock console`.

### 5B.10 Legacy admin-write retirement

- **Owner**: Luna High implementer (5B.10).
- **Dependencies**: 5B.6, 5B.7, 5B.9.
- **Files**: adapt `app/actions/admin/products.ts` (remove legacy write branches), delete `app/(admin)/admin/catalog/products/_components/variant-matrix.tsx` and `colorway-card.tsx` once zero importers remain, adapt `services/dto/product.dto.ts` (remove legacy `productSchema`/`ProductValues` only if zero non-admin importers), create `tests/admin-legacy-write-retirement.test.ts`.
- **Mandatory static scan before any deletion** (record raw output in the closeout section):

```
rg -n "productSchema|ProductValues" app lib services components tests
rg -n "productColorway|productImage|productVariant" app lib services components
rg -n "variant-matrix|colorway-card" app components tests
rg -n "ritm/" app lib components services tests
```

- **Removal rules**: remove only admin-only write branches and symbols with zero remaining importers. Preserve every legacy read consumer named in the evidence bundle (`lib/admin/analytics.ts`, `app/actions/admin/orders.ts`, `app/actions/order.ts`, `lib/payment-sync.ts`, `lib/cart-merge.ts`, `lib/checkout-page.ts`, `lib/order.ts`, `lib/review.ts`, legacy-focused tests) and the compatibility field `productVariantId`. No legacy database rows are deleted by this task; retirement is code-only.
- **Single named exemption preserved verbatim**: `app/actions/admin/orders.ts :: cancelOrderByAdmin :: productVariantId branch :: prisma.productVariant.update({ data: { stock: { increment: item.quantity } } })`. The retirement test asserts exactly one legacy admin write site remains and that it is this one. No whole-file exemption.
- **Inventory required**: count of products with zero canonical SKUs, plus legacy `ritm/` public-ID counts and dispositions from 5B.2 (5D owns repository-wide cleanup).
- **RED**: `npm test -- tests/admin-legacy-write-retirement.test.ts` (fails while legacy admin writes exist).
- **GREEN**: `npm test -- tests/admin-legacy-write-retirement.test.ts tests/admin-products-action.test.ts tests/admin-orders-action.test.ts tests/cancel-order.test.ts tests/cart-merge-canonical.test.ts tests/cart-route-canonical.test.ts tests/order-transaction.test.ts tests/order-snapshot.test.ts`; typecheck; prettier; `git diff --check`.
- **Commit**: `refactor(admin): retire legacy catalog write path`.
- **Handoff evidence**: scan output, importer enumeration per removed symbol, exemption assertion, zero-canonical-SKU and legacy-ID inventory, statement that legacy rows and legacy read paths remain intact.

### 5B.11 Local functional UX checkpoint and handoff

- **Owner**: Luna High implementer (5B.11).
- **Dependencies**: 5B.1-5B.10 committed.
- **Files**: adapt only `docs/superpowers/plans/2026-08-25-phase-5b-canonical-catalog-admin.md` (append "5B closeout evidence"). No source edits except a functional-only fix, which must be its own commit with its own focused test.
- **Functional pass (local dev, desktop about 1440px and mobile about 390px)** across `/admin/catalog`, `/admin/catalog/products`, `/admin/catalog/products/new`, `/admin/catalog/products/[id]/edit`, `/admin/catalog/categories` (plus new/edit), `/admin/catalog/options` (plus new/edit), `/admin/catalog/rooms` (plus new/edit), and `/admin/catalog/stock`. Keep this proportional for a portfolio project: manually verify one end-to-end canonical product journey (option group + room + two-SKU matrix + product/SKU media), one guarded stock update with one stale conflict, one category 360 bind/unbind with one invalid-media refusal, one referenced-product delete/deactivate refusal, ADMIN access to each new route, and responsive usability at both viewports. The focused automated tests remain the evidence for the remaining typed error branches; do not reproduce every unit-test case manually.
- **Visual debt**: record clone-parity deltas as text for the single 5D pass. Do not restyle.
- **Consolidated focused batch (run once)**:

```
npm test -- tests/admin-catalog-read.test.ts tests/cloudinary-folders.test.ts tests/admin-media-routes.test.ts tests/option-group-dto.test.ts tests/admin-option-groups.test.ts tests/room-dto.test.ts tests/admin-rooms-action.test.ts tests/admin-sku-matrix.test.ts tests/admin-products-action.test.ts tests/admin-product-media.test.ts tests/admin-categories-turntable.test.ts tests/admin-stock-action.test.ts tests/admin-legacy-write-retirement.test.ts tests/require-admin.test.ts tests/admin-access-boundary.test.ts tests/admin-route-contract.test.ts tests/admin-nav.test.ts tests/furniture-domain.test.ts tests/furniture-schema.test.ts tests/product-dto.test.ts tests/product-aggregates.test.ts tests/product-media-stage.test.tsx tests/cart-route-canonical.test.ts tests/cart-merge-canonical.test.ts tests/order-snapshot.test.ts tests/order-transaction.test.ts tests/cancel-order.test.ts tests/admin-orders-action.test.ts tests/payment-sync.test.ts tests/media-sign-route.test.ts tests/media-delete-route.test.ts tests/admin-media.test.ts tests/categories-action.test.ts tests/category-dto.test.ts tests/cloudinary-config.test.ts tests/cloudinary-server.test.ts tests/cloudinary-sign.test.ts tests/cloudinary-url.test.ts tests/cloudinary-validate.test.ts
npm run typecheck
```

  Plus prettier check on all files changed in 5B and `git diff --check`. No gate, no build, no E2E.
- **Closeout record**: per-task commit SHAs, checkpoint SHAs (`C5B_MEDIA`, `C5B_CANONICAL`, `C5B_FINAL`), batch result, legacy inventory, `WishlistItem` reference finding from rule R, 5D visual-debt list, and 5C carry-over items (`cancelOrderByAdmin` exemption until 5C.3, `lib/admin/analytics.ts` canonical aggregates).
- **Commit**: `docs(phase-5b): record 5B functional checkpoint evidence`.
- **Review checkpoint 3** follows this commit (see 5).
- **Handoff evidence**: the closeout section itself, plus a one-paragraph statement that no push, PR, merge, schema change or 5C/5D work occurred.

## 5. Review checkpoints (exactly three)

1. **Cloudinary and security boundary - after the 5B.2 commit (`C5B_MEDIA`).** Range: `git log --oneline 42ec908..C5B_MEDIA`, `git diff 42ec908..C5B_MEDIA`. Focus: guard-first ordering in both media routes, exact five-folder allowlist, legacy sign refusal, delete ownership resolution (Evironn folder or exact database-referenced legacy ID), traversal/leading-slash/empty-segment rejection, absence of secret material, canonical read-layer correctness including `incomplete-zero-sku`, and rule A compliance (list-only cutover, legacy edit/form/action contract untouched, `getAdminProductDraft` tested but unwired).
2. **Canonical product, SKU and media boundary - after the 5B.7 commit (`C5B_CANONICAL`).** Range: `git diff C5B_MEDIA..C5B_CANONICAL`. Focus: single-transaction ordering (preflight -> Product -> ProductRoom -> additive option links -> Sku -> SkuOptionValue -> subtractive option links -> denormalized recompute -> media); `buildCombinationKey` as the only key source; rule V detachment semantics, including that removal is allowed when only retained inactive referenced SKUs select the value and that `SkuOptionValue` rows are never cascaded away; referenced-SKU deactivation instead of deletion; rule R reference-aware delete/deactivate with the zero-write invariant across canonical and legacy references; rule S stock authority (no `stock` key in existing-SKU update payloads, `existing-sku-stock-ignored` warning, read-only stock UI); migration-on-save refusal; media ownership rules; no destroy before commit with one destroy per removed asset; order-snapshot immutability; DTO reuse without rule relaxation; rule A single-commit cutover of pages, form and action.
3. **Final stock, 360 and legacy-retirement functional/security boundary - after 5B.10 and 5B.11 (`C5B_FINAL`).** Range: `git diff C5B_CANONICAL..C5B_FINAL`. Focus: `setSkuStock` expected-current guard and `STALE_VALUE` payload as the sole existing-SKU stock path, turntable cardinality and typed binding conflict, retirement scan completeness with preserved read compatibility and no legacy row deletion, exactly one named `cancelOrderByAdmin` exemption, Phase 4 invariants intact, frozen shell respected, consolidated batch evidence, handoff completeness.

No paid review for the mechanical DTO/UI tasks 5B.1, 5B.3, 5B.4, 5B.5, 5B.8 and 5B.9 individually; their evidence rolls into the adjacent checkpoint range.

## 6. Definition of done for Phase 5B

- Tasks 5B.1-5B.11 committed on `phase/05-admin-demo`, one commit per task (plus at most one functional-fix commit from 5B.11).
- No Prisma schema, package-script, CI, env-name, provider, storefront, 5C, 5D or Phase 6 change.
- Every new route guarded; every new action guard-then-Zod-then-transaction; every media API guard-first.
- 5B.1 left the legacy product edit/form/action contract intact; the cutover happened entirely inside the 5B.6 commit, with no intermediate task shipping mismatched props.
- Per-product option link detachment follows rule V; global option deletion stays strict; no `SkuOptionValue` row of a retained SKU was deleted.
- Product hard delete is refused whenever canonical SKU, legacy `ProductVariant` or wishlist references exist; deactivation never deletes; legacy children are never deleted while referenced; the zero-write invariant test is green.
- `saveFurnitureProduct` writes `stock` only on newly created SKUs; every existing-SKU stock change went through `setSkuStock` with an expected-current guard.
- No legacy `ritm/*` folder is signable; only the named `cancelOrderByAdmin` legacy write site remains.
- Consolidated focused batch and typecheck green once at 5B.11; no gate, build or E2E executed.
- Closeout evidence, 5D visual debt and 5C carry-over recorded in this plan file. No push, PR or merge.

## 7. Remediation record (2026-08-25 planner review pass)

Four Important review findings were resolved in place; scope, task count and checkpoint count are unchanged.

| Finding | Correction |
| --- | --- |
| 5B.1 interim product read/form contract | Rule A in 3.1, the 5B.1 "explicitly not touched" list, the list-only file scope, and the corrected 5B.1 handoff wording; the edit/new cutover moved into the single 5B.6 commit, with 5B.4 optional props and the unwired 5B.5 component covered by the same rule; checkpoint 1 and 2 focus updated. |
| 5B.6 option-value removal versus referenced-SKU deactivation | Rule V in 3.1 with exact `retained` / `sellable` / `retained inactive referenced` definitions, transaction reordered so SKU reconciliation (step 5/6) precedes subtractive link removal (step 7), non-cascade statement, separation from the stricter global 5B.3 rule, and required focused cases 1-3 in `tests/admin-products-action.test.ts`. |
| 5B.6 delete/deactivate ignores legacy references | Rule R in 3.1 with `ProductReferenceCounts`, the new `PRODUCT_HAS_REFERENCES` code, child-first delete order only for zero-reference products, deactivation-never-deletes statement, bounded `WishlistItem` schema read, and required focused cases 4-6 including the zero-write invariant. |
| 5B.6 absolute SKU stock write bypasses the 5B.9 guard | Rule S in 3.1 plus the 5B.6 step 5 restriction, read-only existing-stock UI in 2.4 and 5B.5, the fixed `existing-sku-stock-ignored` warning literal, the 5B.9 sole-authority statement, required focused cases 7-8, checkpoint 2 focus, the 5B.11 functional step and a definition-of-done bullet. |

## 8. 5B closeout evidence

### Delivery commits

- 5B.1 canonical catalog read: `dab95de`
- 5B.2 Cloudinary boundary: `ff7ba29`; remediation: `a81257d`
- 5B.3 option groups and values: `1b93559`
- 5B.4 rooms: `0c103ce`
- 5B.5 SKU matrix: `961400a`
- 5B.6 canonical product/SKU action: `039e0cc`
- 5B.7 canonical product and SKU media: `9ef01bd`; remediation: `180f894`
- 5B.8 category turntable binding: `9d2405b`
- 5B.9 guarded SKU stock console: `4b5863c`
- 5B.10 legacy admin-write retirement: `8d6ce62`
- 5B.11 functional checkpoint evidence: pending until this closeout is committed.

Review checkpoints:

- `C5B_MEDIA = a81257d`; fresh Claude Opus review approved the Cloudinary remediation.
- `C5B_CANONICAL = 180f894`; the initial review found Critical/Important findings, all were remediated, and the bounded fresh Claude Opus remediation re-review approved the result.
- `C5B_FINAL = pending until the final closeout review and docs commit.`

### Automated evidence

The consolidated focused batch completed with `39 test files passed; 298 tests passed`. `npm run typecheck` passed. The source/test-only Prettier sweep over all changed 5B TypeScript, TSX and CSS files passed, and `git diff --check` passed. Per the approved scope, no full gate, production build or E2E run was executed.

### Legacy inventory and disposition

The required static scans produced these bounded findings:

- `productSchema` / `ProductValues`: no production legacy DTO symbols remain; remaining matches are canonical `furnitureProductSchema` / `FurnitureProductValues` and retirement-test assertions.
- `productColorway` / `productImage` / `productVariant`: remaining production matches are compatibility reads, media ownership resolution, order/cart/payment/demo-reset paths, and focused tests. The only remaining legacy admin write is `app/actions/admin/orders.ts :: cancelOrderByAdmin :: productVariantId branch :: prisma.productVariant.update({ data: { stock: { increment: item.quantity } } })`.
- `variant-matrix` / `colorway-card`: both retired admin components are deleted; remaining matches are static retirement assertions and the canonical matrix contract test.
- `ritm/`: legacy public IDs remain in compatibility helpers, read/ownership paths and tests. Legacy folders are not signable. Repository-wide cleanup is deferred to 5D.

Database inventory counts (products with zero canonical SKUs and legacy `ritm/` public-ID counts) were unavailable because this worktree had no database connection variables. No environment values were printed, no schema or database rows were changed, and no legacy rows were deleted. `WishlistItem.productId` is a confirmed Prisma schema reference to `Product` and remains covered by Rule R.

### Handoff and deferred visual work

5B reuses the accepted admin shell and clone primitives. Exact clone parity for typography, spacing, media details and responsive polish is visual debt for one 5D pass; no visual redesign was included in 5B. The 5C handoff preserves the named `cancelOrderByAdmin` exemption until 5C.3 and carries `lib/admin/analytics.ts` canonical aggregate migration forward. No 5C or 5D implementation occurred.

Automated functional evidence is green. This closeout does not claim desktop/mobile visual acceptance, and no push, PR, merge, schema change, provider change or release action occurred.

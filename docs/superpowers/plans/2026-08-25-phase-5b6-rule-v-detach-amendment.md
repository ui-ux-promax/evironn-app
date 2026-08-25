# Phase 5B.6 Rule V Detach Amendment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow explicit admin-only option-link detachment while preserving strict furniture draft validation and retained inactive SKU selections.

**Architecture:** Keep `furnitureProductSchema` unchanged. Parse an admin save envelope, build a strict validation projection from the submitted draft plus persisted retained-inactive SKU selections during no-write preflight, and apply explicit detach IDs only after SKU reconciliation in the existing product transaction.

**Tech Stack:** Next.js App Router, TypeScript, Zod, Prisma, Vitest, existing Evironn admin actions/forms.

## Global Constraints

- No Prisma schema changes.
- Guard first; Zod before writes; one product transaction with Rule V checked before and during subtractive link deletion.
- `SkuOptionValue` rows for retained inactive SKUs are never deleted.
- Existing SKU `stock` is never written by product save; only new SKU creation receives submitted stock.
- Preserve the existing `tests/admin-products-action.test.ts` legacy coverage; extend it, never replace it wholesale.
- No gate, build, E2E, push, PR, merge, Phase 5C, or Phase 5D work.

---

### Task 1: Admin save-envelope contract and strict validation projection

**Files:**
- Modify: `app/actions/admin/products.ts`
- Modify: `lib/admin/catalog.ts` only if the draft needs a serializable retained-inactive projection
- Test: `tests/admin-products-action.test.ts`

**Interfaces:**
- Consumes: `furnitureProductSchema`, current canonical SKU selections/reference counts, `AdminActionResult`.
- Produces: an internal admin input parser for `{ product: unknown; detachOptionGroupIds?: string[]; detachOptionValueIds?: string[] }` and a strict normalized product projection passed to `furnitureProductSchema` before any transaction write.

- [ ] **Step 1: Write failing tests** for malformed detach arrays, a draft whose detached value is needed only by a retained inactive SKU, and a sellable detached-value refusal. Assert the existing `furnitureProductSchema` tests remain unchanged.
- [ ] **Step 2: Run RED**

Run: `npm test -- tests/admin-products-action.test.ts`

Expected: the new canonical cases fail because `saveFurnitureProduct` and the admin envelope/projection do not exist; existing legacy cases remain passing.

- [ ] **Step 3: Implement minimal envelope/projection**

Parse the envelope after `requireAdminAction()`. Read current canonical state without writes. Add only persisted selections belonging to retained inactive SKUs to the validation projection so strict `furnitureProductSchema.safeParse()` succeeds. Keep detach IDs explicit and separate from `FurnitureProductValues`; do not relax the shared DTO.

- [ ] **Step 4: Run GREEN**

Run: `npm test -- tests/admin-products-action.test.ts tests/product-dto.test.ts`

Expected: all existing tests and the new envelope/projection tests pass.

- [ ] **Step 5: Commit**

This amendment is part of the single 5B.6 commit; do not create a separate production commit.

### Task 2: Rule V transaction integration and form transport

**Files:**
- Modify: `app/actions/admin/products.ts`
- Modify: `app/(admin)/admin/catalog/products/_components/product-form.tsx`
- Modify: `app/(admin)/admin/catalog/products/new/page.tsx`
- Modify: `app/(admin)/admin/catalog/products/[id]/edit/page.tsx`
- Test: `tests/admin-products-action.test.ts`

**Interfaces:**
- Consumes: Task 1 admin envelope/projection, `buildSkuMatrix`, real room props, existing product action result.
- Produces: `saveFurnitureProduct(input: unknown)`, `setProductActive(input: unknown)`, and `deleteFurnitureProduct(input: unknown)` with the approved 5B.6 output types and explicit Rule V behavior.

- [ ] **Step 1: Write failing tests** for value/group detach allow with retained inactive referenced SKU, value/group refusal with sellable SKU and zero writes, existing-stock warning/no stock update, new-SKU stock creation, migration refusal, reference-aware delete/deactivate, turntable lock, and ordered child-first cleanup.
- [ ] **Step 2: Run RED**

Run: `npm test -- tests/admin-products-action.test.ts`

Expected: canonical action exports/cases fail while preserved legacy cases pass.

- [ ] **Step 3: Implement transaction and form transport**

Cut pages/form/action together. Keep strict draft validation, pass detach arrays explicitly from the form, reconcile SKUs before subtractive links, apply Rule V after post-reconciliation state, preserve inactive selections, and keep existing SKU stock out of update payloads. Use exact revalidation paths.

- [ ] **Step 4: Run GREEN and focused regressions**

Run: `npm test -- tests/admin-products-action.test.ts tests/product-dto.test.ts tests/product-aggregates.test.ts tests/furniture-domain.test.ts tests/order-snapshot.test.ts`; then `npm run typecheck`, Prettier on every touched file, and `git diff --check`.

Expected: all focused tests pass; no schema, build, gate, E2E, or provider command runs.

- [ ] **Step 5: Commit**

```text
git commit -m "feat(admin): write canonical product and SKU rows"
```

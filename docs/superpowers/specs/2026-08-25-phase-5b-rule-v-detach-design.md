# Phase 5B Rule V detach design

## Context

The canonical furniture DTO intentionally validates a complete product draft: every submitted SKU must select one value from every submitted option group. Rule V has a separate persistence requirement: a product option link may be detached while a retained inactive SKU keeps its immutable `SkuOptionValue` selection. Parsing a detached draft directly with `furnitureProductSchema` therefore rejects the input before the action can evaluate Rule V.

## Decision

Keep `furnitureProductSchema` strict and unchanged. Add a narrow admin-only save envelope around the draft:

```ts
type AdminFurnitureProductInput = {
  product: unknown;
  detachOptionGroupIds?: string[];
  detachOptionValueIds?: string[];
};
```

The envelope is Zod-validated before any write. `saveFurnitureProduct` then loads the current canonical state during its no-write preflight and builds a validation projection by retaining the persisted selections of SKUs that will remain inactive, including referenced inactive SKUs. The strict `furnitureProductSchema` validates that projection. The explicit detach arrays are applied only in transaction step 7, after SKU reconciliation; Rule V permits detachment only when no sellable retained/new SKU selects the target. `SkuOptionValue` rows of retained inactive SKUs are never deleted.

This keeps the shared DTO useful for storefront and ordinary product drafts, makes the exceptional admin intent explicit instead of inferring it from missing values, and preserves the single product-save transaction. New products submit empty detach arrays. Existing product forms expose detach intent separately from the SKU matrix; the matrix remains a representation of SKU combinations, not an implicit destructive command.

## Error and safety behavior

- Malformed envelope or invalid normalized draft returns `VALIDATION_ERROR` before writes.
- A target not linked to the product returns `NOT_FOUND`/`VALIDATION_ERROR` according to the existing action result contract.
- A sellable SKU selecting a detached option returns `OPTION_VALUE_IN_USE` or `OPTION_GROUP_IN_USE` with `sellableSkuCount` and capped `blockingCombinationKeys`; the transaction performs zero writes.
- A retained inactive referenced SKU keeps its `SkuOptionValue` rows and remains inactive.
- Existing SKU stock remains read-only and is never included in update payloads.

## Scope

Only Phase 5B.6 admin product input normalization, form intent transport, Rule V preflight/transaction tests, and the corresponding task evidence change. No Prisma schema, shared DTO relaxation, storefront behavior, or Phase 5C/5D work is introduced.

## Verification

TDD covers malformed envelope, strict projection acceptance for retained inactive selections, Rule V allow/refuse, zero-write refusal, and unchanged DTO regression tests. Focused Phase 5B.6 tests plus the existing product DTO/aggregate/domain/snapshot tests remain the gate; no full gate, build, or E2E is run in 5B.

Approved by the user on 2026-08-25 after the Rule V/DTO conflict was demonstrated.

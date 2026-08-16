# Phase 4 Task 4 Report

## Outcome

Implemented canonical furniture order placement as a bounded serializable transaction and added durable, dispatch-aware YooKassa initialization under ADR-017.

## Changes

- `placeOrder` now authenticates with Auth.js, parses the canonical strict schema, resolves the existing owner cart without creation, and rejects legacy buy-now input.
- Order placement re-reads the owner cart, canonical SKU availability, coupon eligibility, delivery selection, and services inside a three-attempt `Serializable` transaction.
- The transaction conditionally reserves canonical SKU stock, creates the order and immutable item snapshots, persists delivery/service/totals/coupon data, stores the exact online return URL, and deletes only the placed owner-cart item ids.
- New placement writes do not read or update `ProductVariant`. Existing cancellation compatibility for historical order items remains unchanged.
- Online initialization now derives one durable YooKassa request from the committed order, enforces the 23-hour replay window, verifies provider amount/order metadata, and idempotently persists the local payment correlation.
- Adapter-proven pre-dispatch failure is the only path that cancels the pending order and restores stock. Dispatched, unknown, malformed, persistence-failure, and post-window outcomes preserve the order and reserved stock.
- The blocked placement result reuses the exact shared blocked DTO and carries no error, redirect URL, retry-create action, or success flag.
- Removed checkout-page buy-now query forwarding.
- Added one adjacent compatibility edit in `components/shared/checkout/checkout-form.tsx`: the inherited form narrows the exact blocked result by shape so the strict DTO compiles until Task 6 replaces that form.
- Retained the legacy `checkoutSchema` and non-authoritative `calcShipping` export only for the inherited Task 6 checkout component/tests. Neither is used by the new placement path.

## TDD Evidence

Initial RED runs proved the missing transaction helper, payment-initialization module, durable provider adapter APIs, strict placement behavior, and dispatch-boundary handling. The final added RED pair failed because unknown adapter throws escaped and cached SDK state hid missing local credentials.

After the minimal fixes:

- `npx vitest run tests/payment-initialization.test.ts tests/yookassa-lib.test.ts`: 2 files, 22 tests passed.
- Full focused Task 4 command: 9 files, 60 tests passed.
- `npm run typecheck`: passed.
- Task 4 Prettier check, including the adjacent compatibility file: passed.
- `git diff --check`: passed; Git emitted only expected LF-to-CRLF working-copy warnings.

## Boundaries

- No database or provider call was made.
- No migration was deployed.
- No external Preview smoke was performed because the required environment variables were absent in the supplied preflight.
- No Task 5 reconciliation/cancellation expansion, Task 6 UI port, provider E2E, admin, refund, outbox, or operations work was added.
- The two protected untracked Phase 2 plan files were preserved and are not part of this task.

## Review Remediation

- Projected full `PlaceOrderInput` to the strict quote input before invoking the quote builder; added an integration regression using the real schema composition.
- Removed inherited checkout buy-now forwarding while retaining only its compatibility prop type.
- Enforced `YOOKASSA_MODE=sandbox` before any online transaction or provider configuration call.
- Classified provider lookup rejection as `INDETERMINATE`.
- Made placement failure codes non-overlapping with the exact blocked DTO branch.
- Allowlisted domain placement errors; coded infrastructure failures are logged and returned as sanitized `ORDER_FAILED`.

Remediation RED/GREEN evidence:

- Initial review regressions: 5 runtime failures and 1 unused `@ts-expect-error` type failure.
- Dedicated action-to-real-builder regression reproduced `INVALID_INPUT` with the faulty full-form pass-through, then passed after quote-field projection was restored.
- Focused remediation command: 4 files, 27 tests passed.
- `npm run typecheck`: passed.
- Final Task 4 focused command, including the action-builder integration regression: 10 files, 66 tests passed.
- Final touched-file Prettier check and `git diff --check`: passed.

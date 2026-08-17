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

## Review Remediation Wave 2

- Made verified `CREATED` correlation persistence and proven `NOT_CREATED` cancellation mutually exclusive with serializable transactions. Payment persistence guards the order remains `PENDING`; cancellation guards both `PENDING` and no related payment. Lost races and transaction failures return `INDETERMINATE` without restoring stock.
- Replaced placement/quote cart reads with a canonical SKU-only Prisma select. It reads scalar `productVariantId` only to reject legacy lines and never loads the `ProductVariant` relation.
- Corrected the transaction retry regression so the operation and transaction-scoped re-read execute on all three P2034 attempts.
- Pinned the exact persisted `paymentReturnUrl` update and proved it occurs before `ensureOnlinePayment`.
- Replaced the brittle buy-now source assertion with a runtime checkout submission-helper test proving only form values reach `placeOrder`.

Wave 2 RED/GREEN evidence:

- RED reproduced the payment race (`NOT_CREATED` canceled after a live payment correlation), both legacy relation query shapes, and the missing runtime checkout submission boundary.
- Focused wave 2 command: 5 files, 26 tests passed.
- `npm run typecheck`: passed.
- Final Task 4 focused command, including wave 2 regressions: 11 files, 68 tests passed.
- Final touched-file Prettier check, `git diff --check`, and changed-file secret scan: passed.

## Durable Claim Remediation

Ownership history remains separated as follows:

- Existing Task 4 production: `cd982c7..c831598`.
- ADR-018 durable-claim design: `8e289e7`.
- Amended plan series: `08610e9..d2d23bd`.
- Approved Task 3A schema foundation: `4340dc7`.
- This remediation delta: `4340dc7..HEAD`.

Changes in this remediation:

- Replaced process-local payment initialization with a durable `READY`/`CLAIMED`/`DISPATCHED`/`CORRELATED`/`NOT_CREATED` claim protocol. Every create attempt is conditionally claimed by exact timestamp; only the claim owner may correlate, mark dispatch evidence, release an expired claim, or cancel a proven never-dispatched order.
- Made `ensureOnlinePayment` total across read, claim, durable-request, provider, persistence, release, and cancellation failures. Failures return `INDETERMINATE`, emit structured logs, and preserve order/stock unless a guarded serializable first-attempt no-dispatch cancellation commits.
- New online orders write `READY` in the placement transaction; COD orders write no payment initialization state. Pre-transaction Auth.js/cookie/cart failures are sanitized, unexpected post-commit initializer rejection becomes durable pending, and sales/address side-effect failures cannot replace the committed result.
- Removed the inherited partial checkout action wrapper and disabled its legacy CTA. Added the boundary regression and removed the obsolete submission test.
- Canonical snapshots now prefer SKU media and fall back to product media.

Fresh remediation evidence:

- Mandated focused GREEN command: 11 files, 73 tests passed.
- `npm run typecheck`: passed.
- Touched-file Prettier write/check: passed.
- `git diff --check`: passed; only expected LF-to-CRLF warnings were emitted.
- No database, migration, external provider, Preview, full gate, build, or E2E command was run.

Concerns:

- Provider and database concurrency behavior is covered with deterministic mocked transaction boundaries only; live non-production verification remains outside this bounded task.

## Durable Claim Review Remediation

- Claim time now comes from the live injected clock. The atomic claim requires an online pending order, no Payment, the exact READY/DISPATCHED origin, exact retained dispatch evidence, and `createdAt > claimNow - W`.
- A fresh `dispatchNow` is captured immediately before durable-request construction/provider use. Crossing W releases only the exact owned claim to its exact origin, preserves prior evidence, performs zero provider calls, and fails closed on guard loss or release failure.
- Claim release and finish mutations now include online method, pending status, no Payment where applicable, exact claim timestamp, and exact retained write-once evidence. First dispatch evidence uses `dispatchNow`; DISPATCHED replay preserves the original timestamp.
- Verified provider correlation with a null confirmation URL persists `Payment` plus `CORRELATED` and returns `CREATED` with `confirmationUrl: null`.
- Added deterministic same-claim correlation/no-dispatch races in both commit orders, READY/DISPATCHED advancing-clock releases, DISPATCHED replay preservation, changed-evidence rejection, release throw handling, and focused read/claim/request/provider/persist/correlation/cancellation failure coverage.
- Added a placement retry integration regression where the first full callback completes then receives P2034; the second callback re-reads changed authoritative quote/snapshot/coupon/service/totals and its stock/order/item/cart-delete writes are the committed values.

Review-remediation verification is limited to focused mocked tests, TypeScript, formatting, and diff checks. No database, provider, full gate, build, or E2E command was run.

## Durable Claim Review Remediation 2

- Added an explicit pre-claim coherence check: READY is claimable only with null dispatch evidence; DISPATCHED is claimable only with non-null evidence. Incoherent pairs and CLAIMED/CORRELATED/NOT_CREATED/null states perform zero transaction/provider calls.
- Added deterministic normal concurrent READY coverage proving one claim winner and one provider call, plus prior-DISPATCHED proven-no-dispatch preservation and expired-release guard loss from changed evidence, missing claim ownership, changed state, and transaction throw.
- Strengthened the real `placeOrder`/checkout-builder P2034 integration: both transaction clients execute two canonical cart reads, coupon lookup, SKU reservation, order/item creation, and targeted cart deletion. Changed second-attempt SKU price/stock/media/configuration, coupon, services, delivery, totals, and immutable snapshot values are asserted on the committed order write.

This section reports deterministic focused evidence only. It does not claim live database/provider concurrency coverage.

# Phase 4 Durable Payment Claim Design

## Context

ADR-017 permits deterministic YooKassa create replay only before `Order.createdAt + 23 hours` and allows local cancellation with stock restoration only when an adapter proves that no provider request was dispatched. Task 4 review found a cross-process race: one attempt could return proven `NOT_CREATED` and cancel while an earlier or concurrent attempt had dispatched and later established `CREATED`.

The current process-local mutex cannot close this race across application instances. The existing `Payment` row also cannot serve as a pre-dispatch claim because its primary key must remain the verified YooKassa provider id.

## Decision

Add a durable per-order initialization state and timestamps:

```prisma
enum PaymentInitializationState {
  READY
  CLAIMED
  DISPATCHED
  CORRELATED
  NOT_CREATED
}

model Order {
  paymentInitializationState     PaymentInitializationState?
  paymentInitializationClaimedAt DateTime?
  paymentEverDispatchedAt         DateTime?
}
```

New online orders persist `READY` in their order-creation transaction. COD orders and historical rows keep null. A separate additive migration creates the enum and columns without rewriting historical application data.

## State Flow

Before any create call, `ensureOnlinePayment` atomically claims one eligible order:

- order is online and `PENDING`;
- no local `Payment` exists;
- current time is before ADR-017's replay bound;
- origin is coherent: `READY` with null `paymentEverDispatchedAt`, or `DISPATCHED` with non-null durable dispatch evidence;
- the caller retains the exact origin and original `paymentEverDispatchedAt`;
- one conditional update matches that exact origin and dispatch evidence, changes state to `CLAIMED`, and records `paymentInitializationClaimedAt`.

Only the update winner may call YooKassa. A loser returns `INDETERMINATE` without dispatch, cancellation, or stock restoration.

Winning the claim does not authorize dispatch after the replay bound. Immediately before building the durable provider request or invoking YooKassa, `ensureOnlinePayment` reads a fresh injected clock and rechecks `freshNow < Order.createdAt + 23 hours`. If the bound has closed, the path makes zero durable-request and provider calls and performs one exact-owner guarded release:

- a `READY`-origin claim returns to `READY` and clears `paymentInitializationClaimedAt`;
- a `DISPATCHED`-origin claim returns to `DISPATCHED`, clears `paymentInitializationClaimedAt`, and requires the original non-null `paymentEverDispatchedAt` to remain exactly unchanged.

Only a one-row release returns `BLOCKED_AFTER_RETRY_WINDOW`. A changed or missing dispatch timestamp, zero-count release, or release exception returns `INDETERMINATE` and remains fail-closed; the row may remain `CLAIMED`. This release never writes `READY` to a historical, COD, or `DISPATCHED`-origin order.

After the provider boundary:

- Verified `CREATED`: one transaction rechecks `PENDING`, verifies no conflicting correlation, creates or repairs the provider-id `Payment`, and changes state to `CORRELATED`.
- Dispatched rejection, timeout, malformed response, or unknown result: one guarded write changes `CLAIMED` to `DISPATCHED`, clears `paymentInitializationClaimedAt`, and sets `paymentEverDispatchedAt` only if it is still null. The public result is `INDETERMINATE`.
- Proven no-dispatch with null `paymentEverDispatchedAt`: one guarded transaction changes `CLAIMED` to `NOT_CREATED`, cancels the `PENDING` order, and restores canonical SKU stock exactly once.
- Proven no-dispatch after an earlier dispatch: one exact-owner guarded write changes `CLAIMED` to `DISPATCHED`, clears `paymentInitializationClaimedAt`, requires and preserves the original `paymentEverDispatchedAt` exactly, returns `INDETERMINATE`, and preserves the pending order and stock. A zero-count or throwing guarded write also returns `INDETERMINATE`; it may leave `CLAIMED` fail-closed. Equivalent durable evidence without the final `DISPATCHED` state is not a successful path.

A crash in `CLAIMED` is ambiguous by construction. There is no stale-claim takeover and no timeout-based inference. Automatic create and cancellation remain blocked until verified provider reconciliation or manual investigation.

## Error Handling

`ensureOnlinePayment` remains a total four-outcome API. Database read failures, claim failures, correlation conflicts, and provider-detail exceptions return `INDETERMINATE` after structured logging. They never throw through `placeOrder` after the durable order transaction commits.

Pre-commit cart ownership and database failures are routed through the sanitized placement error boundary. No raw Prisma code or message reaches clients.

## Compatibility

Placement uses a canonical-only cart projection. It may inspect the scalar legacy `productVariantId` only to reject incompatible cart lines; it does not join or write `ProductVariant`. Immutable order snapshots fall back from SKU media to canonical product media.

The inherited checkout form is not treated as a production order submitter until Task 6 supplies canonical delivery, service, address, contact, and payment input. Any temporary helper must either submit a complete `PlaceOrderInput` or remain outside production runtime wiring.

## Verification

Focused tests must prove:

- one winner dispatches across concurrent claims;
- an advancing fresh clock that closes the replay window after a `READY`-origin claim makes zero durable-request/provider calls, restores exact state `READY`, clears `paymentInitializationClaimedAt`, and returns `BLOCKED_AFTER_RETRY_WINDOW`;
- the same advancing-clock path after a `DISPATCHED`-origin claim with durable dispatch evidence makes zero durable-request/provider calls, restores exact state `DISPATCHED`, clears `paymentInitializationClaimedAt`, preserves the original `paymentEverDispatchedAt` byte-for-time, and returns `BLOCKED_AFTER_RETRY_WINDOW`;
- changed/missing dispatch evidence, a zero-count expired-claim release, or a throwing expired-claim release returns `INDETERMINATE` and may leave `CLAIMED` fail-closed;
- `NOT_CREATED` first cannot cancel an order after any durable dispatch evidence;
- an ambiguous `CLAIMED` crash never retries or cancels automatically;
- a `DISPATCHED` replay uses the exact ADR-017 request and idempotency key;
- a prior-dispatch replay that receives proven no dispatch finishes in exact state `DISPATCHED`, clears `paymentInitializationClaimedAt`, preserves the original `paymentEverDispatchedAt` byte-for-time, returns `INDETERMINATE`, and never leaves a successful path in `CLAIMED`;
- a zero-count or throwing guarded prior-dispatch completion returns `INDETERMINATE` and may remain `CLAIMED` fail-closed;
- correlation and cancellation are mutually exclusive transactions;
- every database/provider exception maps to `INDETERMINATE` or sanitized placement failure;
- transaction retries execute the full quote/cart/coupon/SKU operation each time;
- exact `paymentReturnUrl` is persisted before provider initialization;
- canonical product media supplies the order snapshot fallback;
- no new placement read joins `ProductVariant`.

No real provider or database call is part of focused Task 4 verification.

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
- state is `READY` or `DISPATCHED`;
- one conditional update changes state to `CLAIMED` and records `paymentInitializationClaimedAt`.

Only the update winner may call YooKassa. A loser returns `INDETERMINATE` without dispatch, cancellation, or stock restoration.

After the provider boundary:

- Verified `CREATED`: one transaction rechecks `PENDING`, verifies no conflicting correlation, creates or repairs the provider-id `Payment`, and changes state to `CORRELATED`.
- Dispatched rejection, timeout, malformed response, or unknown result: one transaction changes `CLAIMED` to `DISPATCHED` and sets `paymentEverDispatchedAt` only if it is still null. The public result is `INDETERMINATE`.
- Proven no-dispatch with null `paymentEverDispatchedAt`: one guarded transaction changes `CLAIMED` to `NOT_CREATED`, cancels the `PENDING` order, and restores canonical SKU stock exactly once.
- Proven no-dispatch after any earlier dispatch: change back to `DISPATCHED` or retain equivalent durable dispatched evidence, return `INDETERMINATE`, and preserve order and stock.

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
- `NOT_CREATED` first cannot cancel an order after any durable dispatch evidence;
- an ambiguous `CLAIMED` crash never retries or cancels automatically;
- a `DISPATCHED` replay uses the exact ADR-017 request and idempotency key;
- correlation and cancellation are mutually exclusive transactions;
- every database/provider exception maps to `INDETERMINATE` or sanitized placement failure;
- transaction retries execute the full quote/cart/coupon/SKU operation each time;
- exact `paymentReturnUrl` is persisted before provider initialization;
- canonical product media supplies the order snapshot fallback;
- no new placement read joins `ProductVariant`.

No real provider or database call is part of focused Task 4 verification.

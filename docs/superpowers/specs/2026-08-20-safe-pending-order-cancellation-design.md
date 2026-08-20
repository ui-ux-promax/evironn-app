# Safe cancellation of pending online orders

## Goal

Allow a customer to cancel an online order when YooKassa still reports the payment as `pending`, matching the established storefront UX while preventing a later successful payment from becoming an unhandled charge.

## Design

When the customer cancels a correctly correlated `PENDING` online order:

1. The application does not call YooKassa `/cancel` for provider status `pending`.
2. A guarded local transition changes the order to `CANCELLED` and restores SKU/variant stock exactly once.
3. Sales counters and review eligibility are adjusted using the same guarded transition.
4. The local payment remains `pending` until YooKassa reports its real terminal status.

When YooKassa later reports `payment.succeeded` for that cancelled order:

1. Reconciliation records the payment as `succeeded` with `paidAt`.
2. The order remains `CANCELLED`; it is never moved to fulfillment.
3. The application creates a full YooKassa refund using a deterministic idempotency key derived from the payment ID.
4. Repeated webhook deliveries retry the refund safely; a provider failure returns an error so YooKassa can retry delivery.

When YooKassa reports `payment.canceled` after the local cancellation, reconciliation only finalizes the local payment state and does not restore stock or sales a second time.

`waiting_for_capture` keeps the existing provider cancellation flow. COD cancellation is unchanged.

## Boundaries and safety

- Provider ID, order number, amount, ownership, and initialization correlation are verified before local cancellation.
- A stale page cannot cancel a payment that is already `succeeded`.
- Refund requests are full-amount only and use YooKassa's refund API with deterministic idempotency.
- No production database reset, broad cleanup, or two-stage payment change is introduced.

## Tests

- Customer cancellation succeeds for a correlated provider `pending` payment without calling `/cancel`.
- Stock, sales count, and review cleanup execute once for that local transition.
- A late `succeeded` status for a cancelled order records payment success, leaves fulfillment cancelled, and calls the refund adapter.
- Repeated late-success reconciliation is idempotent.
- A later provider `canceled` status does not duplicate cancellation side effects.
- YooKassa refund payload and idempotency key are covered by the provider contract tests.

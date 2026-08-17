# Phase 4 Task 5 Report

## Scope

Implemented payment reconciliation and customer cancellation hardening only.

- Payment, order, and stock finalization now run in one serializable transaction.
- Final local payment states repair stale pending orders without repeating stock restoration.
- Missing local payments can be recovered only from verified YooKassa details with exact provider id, order number, RUB amount, one online pending order, and conflict guards.
- Recovery marks initialization `CORRELATED`, records provider dispatch evidence, and is idempotent for an existing exact Payment.
- Online customer cancellation uses a fresh owned pending correlation, requires `CORRELATED`, exact stored amount, pending local payment, provider cancellation, and a verified canceled reload before local reconciliation.
- COD cancellation uses one serializable local transaction. Canonical SKU stock is authoritative; legacy ProductVariant remains read compatibility.
- `NOT_CREATED` completion is not canceled a second time. Indeterminate, blocked, conflicting, provider-failed, non-final, and local-transaction-failed paths return `CANCELLATION_PENDING_SYNC` without local cancellation.
- Successful cancellation prunes reviews after the committed transition.

## TDD Evidence

RED command:

`npx vitest run tests/payment-sync.test.ts tests/cancel-order.test.ts tests/yookassa-webhook.test.ts tests/cancel-order-dialog.test.ts`

Result before implementation: 4 files failed, 13 tests failed, 27 passed. Failures covered absent serializable reconciliation, missing recovery, provider-first cancellation, pending-sync behavior, and fresh correlation reads.

## Verification

- Focused GREEN suite: 8 files, 123 tests passed.
- `npm run typecheck`: passed.
- Touched-file Prettier check: passed.
- `git diff --check`: passed; only existing line-ending warnings were printed.

## Environment And External Services

Presence-only preflight found all requested external variables absent: `AUTH_SECRET`, `AUTH_TRUST_HOST`, `RESEND_API_KEY`, `EMAIL_FROM_TRANSACTIONAL`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `DADATA_TOKEN`, `NEXT_PUBLIC_SITE_URL`; `YOOKASSA_MODE=sandbox` was also absent.

No provider, database, Preview, E2E, build, or full-gate call was made. Live YooKassa/DaData smoke remains blocked by absent credentials; no fake production behavior was added.

## Preservation

The pre-existing `.superpowers/sdd/progress.md` modification and the two protected untracked Phase 2 plan files were not included in Task 5 edits.

## Task Review Remediation

Review result before remediation: Critical 0, Important 2, not approved.

- Recovery now re-reads the exact order and payment inside the serializable transaction. It preserves the fresh non-null `paymentEverDispatchedAt` value instead of writing stale candidate evidence, and the guarded update includes the exact order number and correlation facts.
- `getPaymentDetails` returns null only for explicit provider not-found responses. Transport, authentication, and other provider failures propagate to recovery.
- The webhook returns HTTP 500 when missing-payment provider lookup or correlation persistence fails, allowing YooKassa retry instead of acknowledging a lost event.
- RED evidence: 3 files, 4 expected failures covering the evidence interleaving, provider transport failure, provider lookup recovery failure, and correlation persistence failure.
- GREEN evidence: affected regressions passed 50/50; full Task 5 focused suite passed 128/128; typecheck, touched Prettier, and diff check passed.
- No database, provider, E2E, build, or full-gate call was made.

### Provider Boundary Re-review Remediation

- Inspected installed `@webzaytsev/yookassa-ts-sdk`: `YooKassaErr` stores the provider error code in `Error.name`; HTTP fallback errors use names such as `HTTP_404`.
- Explicit absence now recognizes exact SDK names `not_found` and `HTTP_404` in addition to explicit numeric 404 shapes.
- A successful but malformed/invalid provider payload now throws `Malformed YooKassa payment response`; it is never classified as absent. Recovery maps it to `provider-lookup-failed`, and the webhook returns HTTP 500 for retry.
- RED evidence: exact SDK-name and malformed-payload tests produced 3 expected failures.
- Final focused suite: 8 files, 132 tests passed. Typecheck, touched Prettier, and diff check passed.

### Cancellation Retry And Status Validation Remediation

- Customer cancellation now reloads authoritative provider details even when a repeated provider cancel call rejects. A verified `canceled` payment still enters local reconciliation; failed cancel plus pending/non-final reload remains `CANCELLATION_PENDING_SYNC`.
- `getPaymentStatus` now accepts only `pending`, `waiting_for_capture`, `succeeded`, or `canceled` from a valid response object. Missing or unknown status throws.
- The webhook also rejects an invalid status value before reconciliation, returning HTTP 500 for provider retry.
- RED evidence: 3 files, 4 expected failures. Affected GREEN evidence: 45/45 passed.
- Final focused suite: 8 files, 136 tests passed. Typecheck, touched Prettier, and diff check passed.

### Shared Payment Details Status Remediation

- Added the exact supported provider status union: `pending`, `waiting_for_capture`, `succeeded`, and `canceled`.
- The shared YooKassa details parser rejects any missing or unknown status as malformed.
- Missing-payment recovery also validates the runtime status before order lookup or persistence, so an invalid adapter result becomes `provider-lookup-failed` and webhook HTTP 500.
- RED evidence: provider and recovery tests produced 2 expected failures; the webhook retry assertion already matched the hardened error contract.
- Affected GREEN evidence: 3 files, 60 tests passed. Final focused suite: 8 files, 139 tests passed. Typecheck, touched Prettier, and diff check passed.

### Capture-State And Review-Pruning Remediation

- A persisted local `waiting_for_capture` payment is now transitionable to either provider-final `succeeded` or `canceled` inside the existing serializable transaction.
- Every winning committed canceled reconciliation, including stale-final repair, now prunes reviews after commit for unique affected product ids and the order owner.
- Losing guards, conflicts, and no-op paths do not prune reviews.
- `getPaymentStatus` now exposes the exact `Promise<PaymentProviderStatus>` contract.
- RED evidence: 1 file, 3 expected failures. Focused GREEN evidence: 29/29 passed.
- External-service preflight remains unchanged: credentials are absent; no database, provider, Preview, E2E, build, or full-gate call was made.
- Final focused suite: 8 files, 141 tests passed. Typecheck, touched ESLint, touched Prettier, and diff check passed.

### Recovered Success Timestamp Remediation

- Missing-payment recovery now records `paidAt` when the verified provider payment is already `succeeded`.
- The timestamp uses an injectable clock for deterministic tests and is written only during new correlation creation; final-state and idempotency guards are unchanged.
- RED evidence: the recovered succeeded row omitted `paidAt`. Focused GREEN evidence: 30/30 payment-sync tests passed.
- External credentials remain absent. No database, provider, Preview, E2E, build, or full-gate call was made.
- Final focused suite: 8 files, 142 tests passed. Typecheck, touched ESLint, touched Prettier, and diff check passed.

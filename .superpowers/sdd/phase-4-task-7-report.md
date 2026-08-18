# Phase 4 Task 7 Report

## Scope

Ported Order Variant A to an authenticated, owner-scoped production DTO and server-action boundary. The order page now renders immutable item, delivery, service, and money snapshots; uses canonical product ownership only for live links and review targets; and exposes only real payment resync, proof-gated cancellation, verified continuation, catalog navigation, and review submission.

The exact clone CSS files were copied without semantic changes:

- `OrderVariantA.css`: `86EC6B153D735D05C1AA9F6E89E56FD20E4179CFE6F8D445624B065E8933927D`
- `OrderPrimitives.css`: `2B9B742C16BE4F51E57D823132AAC14D27E1FD2DCCDAED7D1586F4BC807209A1`

## Payment and cancellation behavior

- Pending online orders reconcile an existing correlated payment by verified provider id, amount, and order-number metadata.
- Resync is authenticated, owner-scoped, pending-online-only, and lookup/reconciliation-only. It never creates or cancels a provider payment.
- Orders at or after the 23-hour retry window render `PAYMENT_INITIALIZATION_BLOCKED` with the exact durable-order copy, no continuation URL, and no retry-create action.
- `CANCEL_ORDER` is available only when the local payment is correlated, pending, and amount-consistent. Existing cancellation and stock-restoration transactions remain authoritative.
- `CANCELLATION_PENDING_SYNC` remains visible through the action error instead of being converted to success.

## Review behavior

Review targets are deduplicated from canonical or legacy live product relations, while item rendering remains snapshot-based. Eligibility is delegated to `getReviewEligibility`, which uses the shared purchase predicate: online payment must be succeeded; COD must be delivered. Existing reviews render read-only state; eligible products render the real `ReviewForm`.

## TDD evidence

RED command:

```text
npx vitest run tests/order-page-dto.test.ts tests/order-payment-actions.test.ts tests/evironn-order-source-contract.test.ts tests/evironn-order-variant-a.test.tsx tests/evironn-order-assets.test.ts
```

Result: 5 test files failed for the expected missing DTO, component, and CSS files.

GREEN command:

```text
npx vitest run tests/order-page-dto.test.ts tests/order-payment-actions.test.ts tests/order-page-canonical.test.ts tests/evironn-order-source-contract.test.ts tests/evironn-order-variant-a.test.tsx tests/evironn-order-assets.test.ts tests/review.test.ts tests/submit-review.test.ts tests/order-links.test.ts tests/payment-sync.test.ts tests/cancel-order.test.ts tests/profile-page-dto.test.ts
```

Result: 12 files, 87 tests passed.

Additional focused evidence:

- `npm run typecheck`: passed.
- Touched-file Prettier check: passed.
- `git diff --check`: passed.
- No live database or YooKassa call was performed.

## Residual concerns

Live database/provider behavior remains deferred to Phase 4 Task 8 E2E and the final completion gate. Missing-provider-id recovery cannot infer a provider object from absence and deliberately remains blocked/lookup-only.

## Task 7 Remediation 1

Review remediation hardened the production order boundary without changing the approved clone CSS. Initialization is now null for final orders and terminal payment states; missing online payment is recovered with audited `ensureOnlinePayment` only before the retry window, while reads at or after the window remain lookup/reconciliation-only. Continue and cancellation require fresh verified provider metadata and a pending provider status; failed or non-pending lookups suppress both actions. Showroom labels require an exact `CHECKOUT_POLICY` id/name/address snapshot, and legacy, incomplete, or unknown pickup rows remain neutral. Order A restores the supported metadata, placed-banner, address, summary, tracking, and review hierarchy, with the production `ReviewForm` outside the clone rating selector.

Remediation RED reproduced 10 behavioral failures across the DTO, payment recovery, source-contract, and hierarchy assertions. One source assertion was corrected after identifying a false-positive regex that crossed the closed rating block. The final focused remediation command passed 4 files / 28 tests. The complete Task 7 focused regression command passed 13 files / 111 tests. `npm run typecheck`, touched-file Prettier, and `git diff --check` passed. CSS fingerprints remain the approved `OrderVariantA.css` and `OrderPrimitives.css` hashes above. No database, provider, full gate, build, E2E, push, pull request, or merge was performed.

## Task 7 Remediation 2

Closed the final review blockers. Order-page recovery now passes a live clock into `ensureOnlinePayment`, preserving the pre-dispatch retry-window recheck; the payment-initialization regression proves an advancing clock releases the claim without provider creation. Payment initialization statuses and `BlockedPaymentInitializationBaseDto` now live in the shared DTO module; checkout and order DTOs own their exact action tuples without a checkout-specific re-export. Order metadata uses a server-preformatted Moscow date, invalid or null legacy service details zero the service total, thumbnails expose descriptive labels, and Panel restores the clone `<header>` hierarchy. Cancellation reuses the accessible shared confirmation dialog and retains `CANCELLATION_PENDING_SYNC` errors.

Remediation 2 focused evidence: 15 files / 156 tests passed, including payment initialization; `npm run typecheck` passed. Prettier and `git diff --check` remain required before commit.

## Task 7 Remediation 3

### Scope and files

This remediation addresses only the four findings from `phase-4-task-7-acceptance-review.md`:

- `lib/order-page.ts` now preserves the `BLOCKED_AFTER_RETRY_WINDOW` result from `ensureOnlinePayment` in the DTO build context. A request that begins before the 23-hour window and crosses the boundary during the live pre-dispatch check now returns `PAYMENT_INITIALIZATION_BLOCKED`.
- `services/dto/order-page.dto.ts` uses the shared `PaymentInitializationStatus` vocabulary for ready, pending, and blocked order initialization branches. Order consumers use the full shared literals; Checkout DTO types remain unchanged.
- `components/evironn/order/order-primitives.tsx` restores the clone Panel header hierarchy: direct `<header>` children are `<h2>` and optional `<p>`, with no wrapper or non-clone header class. `tests/evironn-order-variant-a.test.tsx` now checks that exact hierarchy.
- `tests/order-page-dto.test.ts` adds fixtures immediately before and at the Europe/Moscow midnight boundary, asserting both created-at and stored delivery-date labels without timezone drift.

Changed source and tests:

- `lib/order-page.ts`
- `services/dto/order-page.dto.ts`
- `components/evironn/order/order-primitives.tsx`
- `components/evironn/order/order-variant-a.tsx`
- `tests/order-page-dto.test.ts`
- `tests/order-page-payment-recovery.test.ts`
- `tests/evironn-order-source-contract.test.ts`
- `tests/evironn-order-variant-a.test.tsx`

Protected pre-existing changes were preserved: `.superpowers/sdd/progress.md` remains modified, and both protected untracked Phase 2 plan files remain unmodified and untracked.

### TDD evidence

RED command:

```text
npx vitest run tests/order-page-dto.test.ts tests/order-page-payment-recovery.test.ts tests/evironn-order-source-contract.test.ts tests/evironn-order-variant-a.test.tsx
```

Result: 4 files failed, 5 tests failed. Failures were the expected missing blocked DTO assertion, short `READY`/`PENDING` status values, and clone Panel hierarchy mismatch.

GREEN command:

```text
npx vitest run tests/order-page-dto.test.ts tests/order-page-payment-recovery.test.ts tests/order-payment-actions.test.ts tests/evironn-order-source-contract.test.ts tests/evironn-order-variant-a.test.tsx tests/payment-initialization.test.ts tests/cancel-order.test.ts tests/review.test.ts tests/submit-review.test.ts
```

Result: 9 files passed, 115 tests passed, exit 0.

Additional required verification:

- `npm run typecheck` — passed, `tsc --noEmit` exit 0.
- `npx prettier --check services/dto/order-page.dto.ts lib/order-page.ts components/evironn/order/order-variant-a.tsx components/evironn/order/order-primitives.tsx tests/order-page-dto.test.ts tests/order-page-payment-recovery.test.ts tests/evironn-order-source-contract.test.ts tests/evironn-order-variant-a.test.tsx` — all matched files use Prettier code style.
- `git diff --check` — passed.

### Concerns and exclusions

No full gate, production build, E2E, database access, YooKassa call, or external provider call was performed, per remediation scope. Live payment/provider and database behavior remains deferred to the approved Phase 4 completion checks. The initial broader Prettier command also inspected untouched `tests/submit-review.test.ts`, which has a pre-existing formatting warning; it was not modified. All remediation-owned files pass the final targeted Prettier check.

## Task 7 Acceptance Review

Fresh Sol Medium review of `6373dac..f303387` approved the complete Task 7 delivery: Critical 0 / Important 0 / Minor 0. The review confirmed live retry-window outcome propagation, shared payment-initialization status vocabulary, exact clone Panel header hierarchy, Europe/Moscow midnight-boundary coverage, accessible cancellation confirmation, safe legacy service fallback, thumbnail labels, exact CSS fingerprints, owner-scoped order reads/actions, immutable snapshots, and proof-gated payment cancellation/resync.

No product source was changed during review. No full gate, build, E2E, database, or provider call was performed. Review report: `.superpowers/sdd/phase-4-task-7-acceptance-review-2.md`.

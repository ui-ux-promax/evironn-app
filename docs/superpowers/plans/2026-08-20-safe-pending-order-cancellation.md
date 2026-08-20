# Safe Pending Order Cancellation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task.

**Goal:** Let customers cancel correctly correlated unpaid online orders locally while automatically refunding any payment that succeeds after cancellation.

**Architecture:** Keep YooKassa as the source of truth for payment state. A `pending` customer cancellation performs one guarded local order transition and leaves the local payment pending. Reconciliation handles the late-success race by recording payment success without fulfillment and issuing a deterministic full refund through the YooKassa adapter; repeated webhooks reuse the same idempotency key.

**Tech Stack:** Next.js server actions, Prisma, YooKassa SDK, Vitest, TypeScript.

## Global Constraints

- Do not call YooKassa `/cancel` for provider status `pending`.
- Verify payment ID, amount, order number, ownership, and initialization correlation before local cancellation.
- Keep `waiting_for_capture` provider cancellation and COD cancellation unchanged.
- Never move a locally cancelled order into fulfillment.
- Preserve the two protected untracked Phase 2 plan files.

---

### Task 1: YooKassa refund adapter

**Files:**

- Modify: `lib/yookassa.ts`
- Test: `tests/yookassa-lib.test.ts`

**Interfaces:**

- Produce `refundPayment(paymentId: string, amountRub: number): Promise<void>`.
- Use `sdk.refunds.create({ payment_id, amount: { value, currency: CurrencyEnum.RUB } }, idempotencyKey)`.
- Derive the idempotency key as `refund-canceled-order-${paymentId}`.

- [ ] Add a failing provider contract test that expects the refund payload and deterministic key.
- [ ] Run `npx vitest run tests/yookassa-lib.test.ts`; expect the new test to fail because `refundPayment` is absent.
- [ ] Implement the adapter and extend the test SDK mock with `refunds.create`.
- [ ] Run the focused provider test; expect all tests to pass.

### Task 2: Local cancellation of a correlated pending online order

**Files:**

- Modify: `app/actions/order.ts`
- Modify: `lib/order-page.ts`
- Test: `tests/cancel-order.test.ts`
- Test: `tests/order-page-dto.test.ts`
- Test: `tests/order-page-payment-recovery.test.ts`

**Interfaces:**

- `cancelOrder` locally transitions a verified pending online order to `CANCELLED`, restores stock, decrements sales counters, prunes reviews, and leaves `Payment.status` as `pending`.
- `buildOrderPageDto` exposes `canCancel` when fresh provider proof is either `pending` or `waiting_for_capture`.

- [ ] Replace the pending-provider test expectation from an error to `{ ok: true }` and assert no `cancelPayment` or `reconcilePaymentStatus` call.
- [ ] Add assertions for guarded local transition and one-time stock/sales/review side effects.
- [ ] Run the focused cancellation and order-page tests; expect failures before implementation.
- [ ] Extract or reuse the guarded local cancellation path for online `pending` orders.
- [ ] Keep the existing `waiting_for_capture` path provider-backed and keep `succeeded` rejection intact.
- [ ] Set page cancellation proof for provider `pending` as well as `waiting_for_capture`.
- [ ] Run the focused tests; expect all to pass.

### Task 3: Late success refund and post-cancellation provider events

**Files:**

- Modify: `lib/payment-sync.ts`
- Test: `tests/payment-sync.test.ts`

**Interfaces:**

- `reconcilePaymentStatus` imports `refundPayment` and returns only after the full refund request is accepted.
- For remote `succeeded` with a locally `CANCELLED` order, it records payment success, keeps the order cancelled, then calls `refundPayment` outside the database transaction.
- For remote `canceled` with a locally `CANCELLED` order, it finalizes pending local payment state without restoring stock or sales again.

- [ ] Add tests for late `succeeded`, repeated late `succeeded`, and later `canceled` after local cancellation.
- [ ] Run `npx vitest run tests/payment-sync.test.ts`; expect the new tests to fail before implementation.
- [ ] Add a transaction result carrying an optional refund request, update payment status atomically, and issue the refund after commit with the deterministic key handled by the adapter.
- [ ] Convert refund failures into logged thrown errors so webhook delivery is retried.
- [ ] Run the focused payment-sync tests; expect all to pass.

### Task 4: Integration verification and commit

**Files:**

- Modify: `tests/admin-orders-action.test.ts` only if the changed shared payment behavior requires updated expectations.

- [ ] Run focused payment/order tests:
      `npx vitest run tests/cancel-order.test.ts tests/order-page-dto.test.ts tests/order-page-payment-recovery.test.ts tests/payment-sync.test.ts tests/yookassa-lib.test.ts tests/yookassa-webhook.test.ts tests/order-payment-actions.test.ts`
- [ ] Run `npm run typecheck`.
- [ ] Run ESLint on changed TypeScript files and `git diff --check`.
- [ ] Review the diff for accidental changes and confirm protected untracked files remain untouched.
- [ ] Commit with `fix: allow safe cancellation of pending online orders`.

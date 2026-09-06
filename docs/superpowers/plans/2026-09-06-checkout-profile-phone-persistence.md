# Checkout Profile Phone Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save the authenticated customer's normalized checkout phone to their profile whenever the durable order transaction commits.

**Architecture:** Extend the existing serializable `placeOrder` transaction with one `transaction.user.update` after stock reservation, order creation, and purchased-cart-line deletion have all succeeded. Reuse the already parsed `PlaceOrderInput.contactPhone`; existing checkout defaults and profile DTOs will read the updated `User.phone` without UI or schema changes.

**Tech Stack:** Next.js Server Actions, TypeScript, Prisma, Zod, Vitest

## Global Constraints

- Reuse the existing nullable `User.phone` field; do not add a Prisma migration.
- Persist only the validated `PlaceOrderInput.contactPhone` value in `+7XXXXXXXXXX` form.
- Replace any previous profile phone with the phone from the most recently committed order.
- Keep contact name, email, guest behavior, payment initialization, and address persistence unchanged.
- Keep the phone update inside the existing serializable order transaction so failed placement attempts do not persist it.
- Preserve unrelated user changes and protected untracked Phase 2 plan files.

---

### Task 1: Persist the checkout phone atomically with order placement

**Files:**

- Modify: `tests/place-order.test.ts`
- Modify: `tests/place-order-online.test.ts`
- Modify: `tests/place-order-builder-integration.test.ts`
- Modify: `app/actions/order.ts`
- Verify: `tests/profile-page-dto.test.ts`

**Interfaces:**

- Consumes: `placeOrder(raw: unknown): Promise<PlaceOrderResult>` and the normalized `PlaceOrderInput.contactPhone: string` produced by `placeOrderSchema`.
- Produces: one transactional Prisma call, `transaction.user.update({ where: { id: userId }, data: { phone: form.contactPhone } })`; no new exported API.

- [ ] **Step 1: Write the failing transaction regression test**

In `tests/place-order.test.ts`, extend `transactionClient()` with a user update spy:

```ts
user: {
  update: vi.fn(async () => ({ id: 'user-1', phone: '+79231445566' })),
},
```

Add this test inside `describe('placeOrder transactional canonical placement', ...)`:

```ts
it('stores the normalized checkout phone on the authenticated user inside the order transaction', async () => {
  const tx = transactionClient();
  mocks.transaction.mockImplementation(async (operation: (transaction: typeof tx) => unknown) => operation(tx));

  await expect(placeOrder({ ...validForm, contactPhone: '8 (923) 144-55-66' })).resolves.toEqual({
    ok: true,
    code: 'ORDER_READY',
    orderNumber: 1042,
  });

  expect(tx.user.update).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data: { phone: '+79231445566' },
  });
});
```

Strengthen the existing canonical-SKU failure test with:

```ts
expect(tx.user.update).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run the regression test and verify RED**

Run:

```bash
npx vitest run tests/place-order.test.ts --reporter=dot
```

Expected: FAIL only because `tx.user.update` was not called for the successful placement; the existing stock-failure test remains green.

- [ ] **Step 3: Implement the minimal transactional update**

In `app/actions/order.ts`, immediately after the successful `cartItem.deleteMany` count check and before returning the committed order data, add:

```ts
await transaction.user.update({
  where: { id: userId },
  data: { phone: form.contactPhone },
});
```

Do not add a separate post-transaction update, catch block, schema change, or profile UI state.

- [ ] **Step 4: Update the two neighboring transaction fixtures**

In the transaction object created in `tests/place-order-online.test.ts`, add:

```ts
user: { update: vi.fn(async () => ({ id: 'user-1' })) },
```

In both the `transaction` object and the object returned by `transactionFor` in `tests/place-order-builder-integration.test.ts`, add:

```ts
user: { update: vi.fn(async () => ({ id: 'user-1' })) },
```

These fixtures model the existing Prisma transaction surface; do not weaken any order, stock, cart, or payment assertions.

- [ ] **Step 5: Run focused GREEN verification**

Run:

```bash
npx vitest run tests/place-order.test.ts tests/place-order-online.test.ts tests/place-order-builder-integration.test.ts tests/profile-page-dto.test.ts --reporter=dot
```

Expected: PASS for all four files. The new test proves normalization and transactional persistence; the existing profile DTO test proves `User.phone` remains the profile source.

- [ ] **Step 6: Run scoped static checks**

Run:

```bash
npx prettier --check app/actions/order.ts tests/place-order.test.ts tests/place-order-online.test.ts tests/place-order-builder-integration.test.ts
npx eslint app/actions/order.ts tests/place-order.test.ts tests/place-order-online.test.ts tests/place-order-builder-integration.test.ts
npm run typecheck
git diff --check
```

Expected: all commands exit 0. Existing non-blocking warnings may be reported, but no new lint error is allowed.

- [ ] **Step 7: Review and commit the bounded implementation**

Confirm the diff contains only the four implementation/test files above, then run:

```bash
git add app/actions/order.ts tests/place-order.test.ts tests/place-order-online.test.ts tests/place-order-builder-integration.test.ts
git commit -m "feat: save checkout phone to profile"
```

Expected: one conventional commit; no protected untracked file is staged.

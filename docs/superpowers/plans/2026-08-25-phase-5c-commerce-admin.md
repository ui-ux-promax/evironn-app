# Phase 5C Commerce Administration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task. Use `test-driven-development` for behavior changes, `systematic-debugging` for unexpected failures, and `verification-before-completion` before completion claims. Steps use checkbox (`- [ ]`) syntax for tracking.

## Current closeout state — 2026-08-26

- Phase 5C is implemented through checkpoint HEAD `72227e8` (`docs(phase-5c): record commerce admin checkpoint`) on `phase/05-admin-demo`; bounded final-review remediation is in progress.
- Focused typechecks passed at 5C.3 and the role-form remediation checkpoint. No full suite, gate, build, E2E, database CLI, or provider run occurred.
- High-risk 5C.3 Sol review `Mill` covered the 5C.0 policy plus the exact 5C.3 range and returned `APPROVE`, Critical 0 / Important 0 / Minor 0.
- Fresh final Sol review `Nash` on 2026-08-26 returned `REQUEST CHANGES`, Critical 0 / Important 2 / Minor 1. Remediation targets: page-local `requireAdminPage()` plus a focused boundary assertion for `/admin/marketing/new`, and reconciliation of current-state durable documents. Final approval is not claimed.
- COD disposable-order and stale-tab conflict evidence remain unavailable because checkout contact-input values did not persist. No push, PR, merge, or 5D work occurred.

**Goal:** Complete protected administration for orders, customers, roles, and coupons while preserving Phase 4 payment, inventory, immutable-snapshot, sales-count, and review invariants.

**Architecture:** Keep pure order policy in `lib/order-admin.ts`, Prisma-backed projections in `lib/admin/*`, and writes in ADMIN-guarded server actions. Cancellation runs through the existing serializable transaction helper; one server-only cancellation module resolves canonical and legacy inventory references before any write and applies status, stock, and sales-count changes atomically. Existing customer-role and coupon write contracts are reused unchanged.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Auth.js, Zod, Vitest, existing Evironn admin primitives.

## Global constraints

- Scope is exactly 5C.0–5C.7. No Phase 5D implementation or Phase 6 work.
- Work on existing branch `phase/05-admin-demo` from preparation base `5f31f2d`.
- Preserve the two protected untracked Phase 2 plan files. Never stage, modify, delete, or clean them.
- Reuse current Evironn and read-only `D:\Projects\fashion-shop` code where compatible. Use `D:\Новая папка (2)\evironn-clone\src\admin` only as a presentation reference.
- `requireAdminPage`, `requireAdminAction`, and `requireAdminApi` remain the server-side authority. Authorization precedes privileged reads and writes.
- No Prisma schema, migration, provider, environment-contract, package-script, CI, demo-admin, storefront, or broad refactor changes.
- Forward order transitions remain `PENDING -> PROCESSING -> SHIPPED -> DELIVERED`, use an expected-status conditional update, and never touch payment, stock, snapshots, or reviews.
- Admin cancellation is provider-free and fail-closed. It never writes Payment fields, claim/dispatch evidence, order snapshots, or Review rows.
- Cancellation supports both canonical `skuId` and legacy `productVariantId` order lines. All lines are resolved before the first transaction write.
- Status cancellation, stock restoration, and `Product.salesCount` decrement commit once in the same serializable transaction or roll back together.
- Order and customer histories render stored `OrderItem` snapshots, never live mutable catalog details.
- Existing role whitelist, self-demotion refusal, last-admin refusal, and guarded role update remain unchanged.
- Coupon actions and validation remain unchanged. Do not invent coupon usage relations, counters, or attribution.
- The accepted admin shell remains stable. Exact Evironn/clone visual parity is deferred to 5D under ADR-022.
- Behavior tasks 5C.0–5C.6 run only their focused RED/GREEN commands. Task 5C.7 is a documentation/manual-acceptance checkpoint with one focused structural check. Run typecheck only at the two shared-contract checkpoints named below. Do not run the full test suite, gate, build, E2E, database CLI commands, or providers in 5C. Application-mediated access to the authorized non-production database is permitted only for 5C.7 acceptance.
- Use Luna High implementers and fresh Sol Medium reviewers on the normal/default service tier. Run one high-risk review after 5C.3 and one final review after 5C.7; do not add per-task reviewers.
- One local commit per task. No push, PR, merge, branch deletion, or 5D start without explicit user authorization.
- After each task commit capture the named checkpoint required by that task: `$C5C0` through `$C5C7`. In any fresh shell, recover task commits by their unique exact subjects with the helper below; never depend on inherited shell variables. The high-risk review uses exact 5C.3 range `"$C5C2..$C5C3"` plus compact 5C.0 policy evidence. The final review uses preparation base through current immutable final HEAD.

## Source-parity matrix

| Surface                                     | Classification       | Evidence and disposition                                                                                          |
| ------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ADMIN guards and accepted shell             | reuse unchanged      | Existing Evironn guard helpers and 5A/5B shell remain authoritative.                                              |
| Order list and detail reads                 | adapt                | Move direct page queries into bounded `lib/admin/orders.ts` projections; preserve current filters and primitives. |
| Forward transition helper                   | reuse unchanged      | Reuse `nextOrderStatus` and existing labels.                                                                      |
| Forward transition action                   | adapt                | Add expected-status input and conditional write.                                                                  |
| Current provider-coupled admin cancellation | retire with evidence | Remove YooKassa calls, Payment writes, review pruning, and best-effort post-status side effects.                  |
| Canonical/legacy restoration                | adapt                | Resolve both reference types once and restore them transactionally.                                               |
| Serializable transaction helper             | reuse unchanged      | Reuse `runSerializableOrderTransaction` from `lib/order.ts`.                                                      |
| Sales-count aggregation                     | adapt                | Preserve `adjustSalesCount`; add a strict transaction-injected variant in the same module.                        |
| Review eligibility and pruning              | reuse unchanged      | Existing customer-cancellation behavior remains untouched; admin cancellation performs no review mutation.        |
| Order/customer snapshots                    | reuse unchanged      | Use stored `OrderItem` fields and existing configuration formatter.                                               |
| Customer list/detail                        | adapt                | Move bounded reads to `lib/admin/customers.ts`; retain SQL escaping/sort whitelist.                               |
| Role action core                            | reuse unchanged      | `changeUserRole`, DTO validation, and safeguards retain their behavior.                                           |
| Role form adapter/presentation              | adapt                | Add a FormData adapter and visible self/last-admin blocking state.                                                |
| Coupon actions/validation/status            | reuse unchanged      | Existing action and helpers remain authoritative.                                                                 |
| Coupon page reads and presentation          | adapt                | Reuse current working page reads/KPIs; compose existing fields/actions without new analytics or relations.        |
| Clone admin presentation                    | port presentation    | Reuse already accepted primitives now; exact parity remains 5D work.                                              |

## Locked cancellation policy

Current Prisma stores `Payment.status` as a string and `PaymentInitializationState` as `READY | CLAIMED | DISPATCHED | CORRELATED | NOT_CREATED`. Implement this current-schema adaptation of the master seven-rule policy:

```ts
export type AdminPaymentSettlement = 'NONE' | 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';

export type AdminCancelBlockReason =
  | 'STATUS_NOT_CANCELLABLE'
  | 'PAYMENT_DISPATCH_EVIDENCE_PRESENT'
  | 'PAYMENT_SUCCEEDED_REFUND_REQUIRED'
  | 'PAYMENT_CLAIM_IN_FLIGHT'
  | 'PAYMENT_STATE_UNSAFE';

export const ADMIN_CANCEL_POLICY: Record<PaymentInitializationState, AdminCancelBlockReason | 'ALLOWED_IF_UNSETTLED'>;
```

Known settlement mapping is exact: `pending` and `waiting_for_capture` → `PENDING`; `succeeded` → `SUCCEEDED`; `canceled` → `FAILED`; absent Payment → `NONE`; every unknown string → `UNKNOWN`.

Evaluation order is binding:

1. Status outside `PENDING`/`PROCESSING` → `STATUS_NOT_CANCELLABLE`.
2. Non-null `paymentEverDispatchedAt` → `PAYMENT_DISPATCH_EVIDENCE_PRESENT`.
3. `SUCCEEDED` settlement → `PAYMENT_SUCCEEDED_REFUND_REQUIRED`.
4. `CLAIMED` state or non-null claim timestamp → `PAYMENT_CLAIM_IN_FLIGHT`.
5. `DISPATCHED` or `CORRELATED` state → `PAYMENT_STATE_UNSAFE`.
6. `PENDING` or `UNKNOWN` settlement → `PAYMENT_STATE_UNSAFE`.
7. Otherwise allow null/`READY`/`NOT_CREATED` initialization with `NONE` or `FAILED` settlement.

This preserves the approved master policy: a safe `FAILED` settlement does not become an automatic blocker.

## Fresh-shell review range recovery

Use this compact read-only helper when a review starts in a fresh shell:

```powershell
function Get-Phase5CTaskCommit([string]$Subject) {
  $rows = @(git log --format='%H%x09%s' '5f31f2d..HEAD')
  $matches = @($rows | Where-Object { ($_ -split "`t", 2)[1] -ceq $Subject })
  if ($matches.Count -ne 1) { throw "Expected one Phase 5C commit with subject: $Subject" }
  return ($matches[0] -split "`t", 2)[0]
}
```

Task subjects are the exact commit subjects written under 5C.0–5C.7. The helper rejects missing or duplicate matches; it does not enforce ancestry beyond Git's own selected range.

---

### 5C.0: Lock the pure order mutation policy

**Files:**

- Modify: `lib/order-admin.ts`
- Create: `tests/admin-order-policy-table.test.ts`
- Modify: `.superpowers/sdd/phase-5-handoff.md`
- Add to Git: `docs/superpowers/plans/2026-08-25-phase-5c-commerce-admin.md`

**Produces:**

```ts
export function classifyAdminPaymentSettlement(payment: { status: string } | null): AdminPaymentSettlement;
export function canAdminCancel(order: {
  status: OrderStatus;
  paymentInitializationState: PaymentInitializationState | null;
  paymentInitializationClaimedAt: Date | null;
  paymentEverDispatchedAt: Date | null;
  payment: { status: string } | null;
}): { ok: true } | { ok: false; reason: AdminCancelBlockReason };
```

- [ ] Write table-driven tests for every initialization state, every settlement class, the seven-rule precedence, safe `NONE`/`FAILED`, and unsafe unknown strings.
- [ ] Run RED: `npm test -- tests/admin-order-policy-table.test.ts`. Expected: fail because the policy exports do not exist.
- [ ] Implement only the pure types, maps, classifier, and policy in `lib/order-admin.ts`. Preserve `nextOrderStatus`, labels, and existing compatibility exports.
- [ ] Run GREEN: `npm test -- tests/admin-order-policy-table.test.ts tests/order-admin.test.ts`.
- [ ] Record the locked seven-rule policy and exact preparation base in `.superpowers/sdd/phase-5-handoff.md` before 5C.1.
- [ ] Commit: `feat(admin): lock fail-closed order mutation policy`.
- [ ] Capture `$C5C0 = (git rev-parse HEAD).Trim()`.

**Review range:** `"5f31f2d..$C5C0"`; no external review at this boundary. Policy evidence is included with the 5C.3 high-risk review.

---

### 5C.1: Add bounded order administration reads

**Files:**

- Create: `lib/admin/orders.ts`
- Modify: `app/(admin)/admin/orders/page.tsx`
- Modify: `app/(admin)/admin/orders/_components/order-filters.tsx`
- Modify: `app/(admin)/admin/orders/_components/order-table.tsx`
- Create: `tests/admin-orders-read.test.ts`
- Extend: `tests/admin-access-boundary.test.ts`

**Produces:**

```ts
export type AdminOrderListInput = {
  page: number;
  limit: number;
  query: string;
  status?: OrderStatus;
  payment?: 'none' | 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
};

export type AdminOrderRow = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: string | null;
  paymentMethod: string;
  contactName: string;
  contactEmail: string;
  itemCount: number;
  totalAmount: number;
  coverImage: string | null;
  createdAt: Date;
};

export type AdminOrderListResult = {
  rows: AdminOrderRow[];
  total: number;
  pagination: { page: number; limit: number; totalPages: number; hasPrevious: boolean; hasNext: boolean };
  statusCounts: Record<OrderStatus, number>;
  filteredRevenue: number;
};

export async function listAdminOrders(input: AdminOrderListInput): Promise<AdminOrderListResult>;
```

- [ ] Write focused read tests for numeric order-number search, text contact search, status/payment filters, pagination bounds, deterministic order, stored-image cover selection, and global status counts.
- [ ] Run RED: `npm test -- tests/admin-orders-read.test.ts`. Expected: fail because `listAdminOrders` does not exist.
- [ ] Move current page query/projection logic into `lib/admin/orders.ts`; keep queries bounded with `skip`/`take`, order by `createdAt DESC, id DESC`, and never call providers.
- [ ] Keep `requireAdminPage()` before `listAdminOrders()` and render the existing Evironn table/filter primitives from the returned DTO.
- [ ] Extend the access-boundary test only for the new privileged read name and ordering.
- [ ] Run GREEN: `npm test -- tests/admin-orders-read.test.ts tests/admin-access-boundary.test.ts`.
- [ ] Commit: `feat(admin): add bounded order administration reads`.
- [ ] Capture `$C5C1 = (git rev-parse HEAD).Trim()`.

**Review range:** `"$C5C0..$C5C1"`; no external review at this boundary.

---

### 5C.2: Guard forward order status transitions

**Files:**

- Modify: `services/dto/order-admin.dto.ts`
- Modify: `app/actions/admin/orders.ts`
- Modify: `app/(admin)/admin/orders/_components/order-status-actions.tsx`
- Create: `tests/admin-order-transition.test.ts`
- Extend: `tests/admin-orders-action.test.ts`

**Produces:**

```ts
export const orderStatusUpdateSchema = z
  .object({
    orderId: z.string().min(1),
    expectedStatus: z.enum(['PENDING', 'PROCESSING', 'SHIPPED']),
    nextStatus: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED']),
  })
  .strict();

export async function advanceOrderStatus(input: unknown): Promise<AdminActionResult<{ status: OrderStatus }>>;
```

- [ ] Write tests proving ADMIN guard precedes Prisma, malformed/unknown fields are rejected, illegal jumps make zero writes, stale expected status returns a typed conflict, and success performs one conditional `updateMany` plus list/detail revalidation.
- [ ] Run RED: `npm test -- tests/admin-order-transition.test.ts`. Expected: fail on the missing expected-status contract.
- [ ] Adapt the action to validate `nextStatus === nextOrderStatus(expectedStatus)` and update with `{ id, status: expectedStatus }`; do not read or write payment, stock, snapshots, or reviews.
- [ ] Wire the existing status control to submit both expected and next status.
- [ ] Run GREEN: `npm test -- tests/admin-order-transition.test.ts tests/admin-orders-action.test.ts`.
- [ ] Commit: `feat(admin): guard forward order status transitions`.
- [ ] Capture `$C5C2 = (git rev-parse HEAD).Trim()`.

**Review range:** `"$C5C1..$C5C2"`; no external review at this boundary.

---

### 5C.3: Make admin cancellation atomic and idempotent

**Files:**

- Create: `lib/admin/order-cancellation.server.ts`
- Modify: `lib/admin/action-result.ts` to add `ORDER_CANCELLATION_BLOCKED`
- Modify: `lib/sales-count.ts`
- Modify: `services/dto/order-admin.dto.ts`
- Modify: `app/actions/admin/orders.ts`
- Modify: `app/(admin)/admin/orders/_components/order-status-actions.tsx`
- Create: `tests/admin-order-cancel-invariants.test.ts`
- Extend: `tests/admin-orders-action.test.ts`
- Extend: `tests/admin-legacy-write-retirement.test.ts`

**Produces:**

```ts
export async function adjustSalesCountInTransaction(
  transaction: Pick<Prisma.TransactionClient, 'product'>,
  items: ReadonlyArray<{ productId: string; quantity: number }>,
  sign: 1 | -1,
): Promise<void>;

export const adminOrderCancelSchema = z
  .object({
    orderId: z.string().min(1),
    expectedStatus: z.enum(['PENDING', 'PROCESSING']),
  })
  .strict();

export type ResolvedCancelledOrderItem = {
  kind: 'canonical' | 'legacy';
  inventoryId: string;
  productId: string;
  quantity: number;
};

export function resolveCancelledOrderInventoryReferences(
  items: ReadonlyArray<{
    quantity: number;
    skuId: string | null;
    canonicalSku: { id: string; productId: string } | null;
    productVariantId: string | null;
    productVariant: { id: string; colorway: { productId: string } } | null;
  }>,
): { ok: true; items: ResolvedCancelledOrderItem[] } | { ok: false; reason: 'INVALID_INVENTORY_REFERENCE' };

export async function restoreCancelledOrderInventory(
  transaction: Pick<Prisma.TransactionClient, 'sku' | 'productVariant' | 'product'>,
  items: ReadonlyArray<ResolvedCancelledOrderItem>,
): Promise<void>;

export async function cancelOrderAsAdmin(
  input: unknown,
): Promise<AdminActionResult<{ status: 'CANCELLED'; stockRestored: true }>>;
```

`lib/sales-count.ts` keeps the existing best-effort `adjustSalesCount` behavior for current callers. The new transaction-injected export reuses `salesDeltaByProduct`, does not swallow errors, and performs no global Prisma access.

`lib/admin/order-cancellation.server.ts` owns one resolver for canonical and legacy order lines and one `restoreCancelledOrderInventory` helper. The action uses `runSerializableOrderTransaction` and follows this order inside each attempt:

1. Read the order, Payment, and both inventory relations through the transaction client.
2. Evaluate `canAdminCancel` and expected status.
3. Resolve every line; reject dual, missing, mismatched, or wrong-product references before any write.
4. Conditional `order.updateMany` by id and expected status; zero count returns a stale conflict.
5. Restore canonical and legacy stock and decrement sales count through transaction-injected helpers.
6. Commit once; any error rolls back all changes.

- [ ] Write focused tests for every policy block, safe COD/online failure cases, stale race, canonical/legacy/mixed lines, invalid reference zero-write behavior, rollback, serializable retry, exactly-once stock/sales updates, and absence of provider/Payment/snapshot/Review mutations.
- [ ] Run RED: `npm test -- tests/admin-order-cancel-invariants.test.ts tests/admin-legacy-write-retirement.test.ts`. Expected: fail on current provider-coupled and non-transactional cancellation.
- [ ] Implement the server-only resolver/transaction helper, transaction-injected sales-count function, strict cancellation DTO, and action whose first operation is `requireAdminAction()`.
- [ ] Remove YooKassa, Payment-update, logger-based best-effort restoration, and review-pruning behavior from admin cancellation only.
- [ ] Move the sole allowed legacy admin restoration write from `app/actions/admin/orders.ts` to `restoreCancelledOrderInventory`; keep legacy reads elsewhere.
- [ ] Revalidate admin order list/detail plus customer/profile/order-history paths only after a successful commit.
- [ ] Run GREEN: `npm test -- tests/admin-order-cancel-invariants.test.ts tests/admin-orders-action.test.ts tests/admin-legacy-write-retirement.test.ts tests/order-transaction.test.ts tests/cancel-order.test.ts tests/order-payment-actions.test.ts`.
- [ ] Run shared-contract check: `npm run typecheck`.
- [ ] Commit: `fix(admin): make order cancellation atomic and idempotent`.
- [ ] In the fresh review shell load `Get-Phase5CTaskCommit`, set `$C5C2 = Get-Phase5CTaskCommit 'feat(admin): guard forward order status transitions'` and `$C5C3 = (git rev-parse HEAD).Trim()`, then run one fresh Sol Medium high-risk review over `git diff "$C5C2..$C5C3"` plus compact 5C.0 policy evidence and focused test output. Review payment policy, provider-free behavior, transaction ordering, all-line preflight, exactly-once stock/sales changes, legacy compatibility, and forbidden writes. Resolve all Critical/Important findings before 5C.4; rerun only affected checks.
- [ ] When remediation changes code, commit it separately; in a new review shell recover `$C5C2` again and set `$C5C3 = (git rev-parse HEAD).Trim()`, then require one fresh high-risk re-review over `"$C5C2..$C5C3"`. Do not start 5C.4 until the current range has zero Critical/Important findings.

**Review range:** exact 5C.3 task/remediation range `"$C5C2..$C5C3"`; 5C.0 policy is compact contract evidence, not a widened diff.

---

### 5C.4: Compose immutable-snapshot order detail

**Files:**

- Modify: `lib/admin/orders.ts`
- Modify: `app/(admin)/admin/orders/[id]/page.tsx`
- Create: `app/(admin)/admin/orders/_components/order-detail.tsx`
- Adapt: `app/(admin)/admin/orders/_components/order-status-actions.tsx`
- Create: `tests/admin-order-detail-render.test.ts`

**Produces:**

```ts
export type AdminOrderItemSnapshot = {
  id: string;
  articleNumber: string | null;
  combinationLabel: string;
  productName: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: Date;
  contact: { name: string; email: string; phone: string };
  delivery: { method: string; address: string; date: Date | null; window: string | null };
  totals: { items: number; discount: number; shipping: number; services: number; total: number };
  items: AdminOrderItemSnapshot[];
  payment: {
    method: string;
    status: string | null;
    initializationState: PaymentInitializationState | null;
    claimEvidencePresent: boolean;
    dispatchEvidencePresent: boolean;
  };
  nextStatus: OrderStatus | null;
  cancelDecision: { ok: true } | { ok: false; reason: AdminCancelBlockReason };
};

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null>;
```

`combinationLabel` is derived only through the existing stored-snapshot formatter. The DTO contains no provider credentials, provider identifiers, or raw provider payload.

- [ ] Write a synchronous render-contract test proving snapshot fields are rendered without live catalog joins, blocked cancellation reasons are visible, controls submit expected status, and required IDs exist: `admin-order-transition`, `admin-order-cancel`, `admin-conflict-alert`, and `admin-blocked-reason`.
- [ ] Run RED: `npm test -- tests/admin-order-detail-render.test.ts`. Expected: fail because the injected detail component/projection does not exist.
- [ ] Add the bounded detail projection and compose the existing admin primitives with loading, missing, blocked, conflict, and action states. Place `data-testid="admin-order-transition"`, `admin-order-cancel`, `admin-conflict-alert`, and `admin-blocked-reason` on their owning elements.
- [ ] Keep `requireAdminPage()` before the privileged read.
- [ ] Run GREEN: `npm test -- tests/admin-order-detail-render.test.ts tests/admin-access-boundary.test.ts`.
- [ ] Commit: `feat(admin): compose immutable snapshot order detail`.
- [ ] Capture `$C5C4 = (git rev-parse HEAD).Trim()`.

**Review range:** `"$C5C3..$C5C4"`; no external review at this boundary.

---

### 5C.5: Compose customer history and role controls

**Files:**

- Create: `lib/admin/customers.ts`
- Modify: `app/(admin)/admin/customers/page.tsx`
- Modify: `app/(admin)/admin/customers/[id]/page.tsx`
- Adapt: `app/(admin)/admin/customers/_components/customer-table.tsx`
- Create: `app/(admin)/admin/customers/_components/customer-detail.tsx`
- Adapt: `app/(admin)/admin/customers/_components/role-toggle.tsx`
- Modify narrowly: `app/actions/admin/customers.ts` only to add a FormData adapter around unchanged `changeUserRole`
- Create: `tests/admin-customers-read.test.ts`
- Create: `tests/admin-customers-render.test.ts`

**Produces:**

```ts
export type AdminCustomerListInput = {
  page: number;
  limit: number;
  query: string;
  role?: UserRole;
  sort?: 'registered' | 'orders' | 'spent';
};

export type AdminCustomerRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  orderCount: number;
  totalSpent: number;
  createdAt: Date;
};

export type AdminCustomerListResult = {
  rows: AdminCustomerRow[];
  total: number;
  pagination: { page: number; limit: number; totalPages: number; hasPrevious: boolean; hasNext: boolean };
};

export type AdminCustomerDetail = AdminCustomerRow & {
  emailVerified: Date | null;
  image: string | null;
  birthdate: Date | null;
  reviewSummary: { count: number; averageRating: number | null };
  wishlistCount: number;
  cartCount: number;
  newsletterActive: boolean;
  roleControl: { isSelf: boolean; isLastAdmin: boolean };
  orders: Array<{
    id: string;
    orderNumber: number;
    status: OrderStatus;
    createdAt: Date;
    totalAmount: number;
    paymentStatus: string | null;
    items: AdminOrderItemSnapshot[];
  }>;
};

export async function listAdminCustomers(input: AdminCustomerListInput): Promise<AdminCustomerListResult>;
export async function getAdminCustomerDetail(
  userId: string,
  actingAdminId: string,
): Promise<AdminCustomerDetail | null>;

export async function changeUserRoleFromForm(previous: RoleActionResult, formData: FormData): Promise<RoleActionResult>;
```

- [ ] Write focused tests for bounded pagination, escaped text search, whitelisted sorting, role filtering, maximum 50 recent orders, snapshot-only order lines, and stored payment status used by `orderStatusView`.
- [ ] Write a render test for customer identity, totals/history including “Ожидает оплаты” payment context, a real server-action form, disabled self-demotion/last-admin presentation, action errors, and empty states.
- [ ] Run RED: `npm test -- tests/admin-customers-read.test.ts tests/admin-customers-render.test.ts`. Expected: fail because the read boundary/detail projection does not exist.
- [ ] Move the proven raw SQL/list logic into `lib/admin/customers.ts`; preserve `escapeLike` and `buildCustomerOrderByClause`.
- [ ] Add bounded detail/history reads using stored order-item snapshots and no live catalog joins.
- [ ] Keep `changeUserRole`, `roleChangeSchema`, and `roleChangeGuard` behavior unchanged. Add only `changeUserRoleFromForm` to parse `userId`/`role` from FormData and delegate to `changeUserRole`; wire `role-toggle.tsx` as a server-action form with visible self/last-admin blocking state.
- [ ] Keep `requireAdminPage()` before both privileged reads, pass `session.user.id` into `getAdminCustomerDetail`, preserve existing profile/review/wishlist/cart/newsletter fields, and render loading/missing/empty states with current primitives.
- [ ] Run GREEN: `npm test -- tests/admin-customers-read.test.ts tests/admin-customers-render.test.ts tests/admin-customers-action.test.ts`.
- [ ] Commit: `feat(admin): compose customer history and role controls`.
- [ ] Capture `$C5C5 = (git rev-parse HEAD).Trim()`.

**Review range:** `"$C5C4..$C5C5"`; no external review at this boundary.

---

### 5C.6: Compose coupon administration

**Files:**

- Modify: `app/(admin)/admin/marketing/page.tsx`
- Modify: `app/(admin)/admin/marketing/new/page.tsx`
- Modify: `app/(admin)/admin/marketing/[id]/edit/page.tsx`
- Adapt: `app/(admin)/admin/marketing/_components/coupon-table.tsx`
- Adapt: `app/(admin)/admin/marketing/_components/coupon-form.tsx`
- Create: `tests/admin-coupons-render.test.ts`

**Produces:**

```ts
export type CouponRow = {
  id: string;
  code: string;
  percent: number;
  active: boolean;
  status: 'active' | 'inactive' | 'expired';
  expiresLabel: string;
  createdLabel: string;
};

export type CouponFormProps = {
  mode: 'create' | 'edit';
  coupon?: { id: string; code: string; percent: number; active: boolean; expiresAt: string };
};
```

- [ ] Write render tests for existing active/inactive/expired status precedence, list rows, form fields, validation errors, loading/empty states, and explicit absence of usage counters.
- [ ] Run RED: `npm test -- tests/admin-coupons-render.test.ts`. Expected: fail on missing accepted presentation/form contracts.
- [ ] Reuse current page reads, filters, status KPIs, `couponSchema`, `normalizeCouponCode`, `couponStatus`, and all existing server actions. Adapt only page/component composition and Evironn copy; do not add a read module, pagination contract, usage model, or new analytics semantics.
- [ ] Keep `requireAdminPage()` before current Prisma reads.
- [ ] Run GREEN: `npm test -- tests/admin-coupons-render.test.ts tests/admin-coupons-action.test.ts tests/coupon-status.test.ts`.
- [ ] Run shared-contract check for the completed read/UI group: `npm run typecheck`.
- [ ] Commit: `feat(admin): compose coupon administration`.
- [ ] Capture `$C5C6 = (git rev-parse HEAD).Trim()`.

**Review range:** `"$C5C5..$C5C6"`; no external review at this boundary.

---

### Historical 5C.7 execution checklist: record the bounded 5C checkpoint

**Files:**

- Modify: `.superpowers/sdd/phase-5-handoff.md`
- Modify: `.superpowers/sdd/progress.md`
- Modify: `docs/roadmap/STATUS.md`
- Modify: `docs/superpowers/plans/2026-08-25-phase-5c-commerce-admin.md` only for actual closeout evidence

- [ ] Run checkpoint RED before documentation:

```powershell
rg -n "Phase 5C checkpoint" ".superpowers/sdd/phase-5-handoff.md" ".superpowers/sdd/progress.md" "docs/roadmap/STATUS.md"
```

Historical expected result before the checkpoint: no completed 5C checkpoint record. The checkpoint is now recorded below; do not replay task test batches.

- [ ] Run changed-file formatting and structural checks once:

```powershell
$changed = @(git diff --name-only 5f31f2d -- '*.ts' '*.tsx' '*.md')
if ($changed.Count -gt 0) { npx prettier --check -- $changed }
git diff --check
```

- [ ] Confirm presence only, never values, of `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` in `.env.local`:

```powershell
$envLines = @(Get-Content -LiteralPath '.env.local')
foreach ($key in @('POSTGRES_URL', 'POSTGRES_URL_NON_POOLING')) {
  if (-not ($envLines -match "^\s*$key\s*=\s*\S+")) { throw "$key is missing or blank" }
  Write-Output "$key=present"
}
```

- [ ] Run `npm run dev`. Acceptance uses the user-authorized non-production Neon target under ADR-019/020 through the application only; no Prisma/SQL/database CLI command is allowed.
- [ ] Use explicit Phase 5C-owned fixtures: one disposable COD order created through the storefront, one existing unsafe online order when available, one non-owner CUSTOMER account, and one coupon code prefixed `PHASE5C_`. Record order IDs/numbers, user ID, coupon code, original role, and fixture state in the handoff without secrets.
- [ ] At `1440x900` and `390x844`, verify `/admin/orders`, one order detail, `/admin/customers`, one customer detail, `/admin/marketing`, new coupon, and coupon edit. Use two tabs for one stale transition conflict; advance/cancel only the disposable COD order; use the unsafe online order only for blocked-reason display. If a required order fixture is unavailable, record that scenario as unavailable rather than passed.
- [ ] Exercise one permitted role change on the Phase 5C customer, verify self/last-admin refusal without a write, then restore the original role through the UI. Create/edit/toggle/delete the `PHASE5C_` coupon through the UI. Targeted cleanup owns the coupon and role restoration; the disposable order remains a named non-production history fixture because no delete workflow exists. Do not call payment providers.
- [ ] Update handoff, progress, STATUS, and plan closeout with exact task commits, focused command results, fixture/cleanup state, both viewport results, unavailable scenarios, unresolved functional defects, and remaining 5D visual-parity debt.
- [ ] Run checkpoint GREEN: `rg -n "Phase 5C checkpoint" ".superpowers/sdd/phase-5-handoff.md" ".superpowers/sdd/progress.md" "docs/roadmap/STATUS.md"`. Expected: completed checkpoint matches in all three files.
- [ ] Commit: `docs(phase-5c): record commerce admin checkpoint`.
- [ ] Capture `$C5C7 = (git rev-parse HEAD).Trim()`.
- [x] In a fresh final-review shell set `$C5C_FINAL = (git rev-parse HEAD).Trim()` and run one fresh Sol Medium final functional/security review over `git diff "5f31f2d..$C5C_FINAL"` plus focused evidence. Nash returned `REQUEST CHANGES` on 2026-08-26 with Critical 0 / Important 2 / Minor 1; bounded remediation is in progress and final approval is not claimed.
- [ ] Stop for user acceptance. Do not push, open a PR, merge, or start 5D.

**Review range:** exact Phase 5C base through current immutable final candidate, recovered in the review shell as `"5f31f2d..$C5C_FINAL"`.

#### 5C.7 closeout evidence

- Structural RED was clean before documentation. Changed-file Prettier and `git diff --check` passed; both required database variable names were present without exposing values.
- `npm run dev` served `http://localhost:3000`; acceptance used application UI only. Disposable COD creation failed closed because checkout phone/email values did not persist. Unsafe online order `#52` supplied blocked-reason display; safe COD cancellation and stale conflict are unavailable.
- Customer role promotion/restoration and coupon `PHASE5C_20260826` create/edit/toggle/delete passed. Both viewport route inspections passed with no browser errors; existing smooth-scroll warning only.
- Unresolved checkout contact-input defect and remaining 5D visual-parity debt are recorded in durable handoff/progress/STATUS. High-risk 5C.3 Sol review `Mill` returned `APPROVE`, Critical 0 / Important 0 / Minor 0. Fresh final Sol review `Nash` returned `REQUEST CHANGES`, Critical 0 / Important 2 / Minor 1; final approval is not claimed. Stop for user acceptance after bounded remediation; no push, PR, merge, or 5D.

## Review checkpoints

1. **High-risk review after 5C.3 — complete:** Sol `Mill`, `APPROVE`, Critical 0 / Important 0 / Minor 0; scope was the 5C.0 policy plus the exact 5C.3 range.
2. **Final review after 5C.7 — remediation in progress:** Sol `Nash`, 2026-08-26, `REQUEST CHANGES`, Critical 0 / Important 2 / Minor 1; final approval is not claimed.

Reviewers reuse existing evidence and do not run the full gate, build, E2E, database, or provider commands.

## Explicit non-goals

- Refunds, provider cancellation, payment reconciliation tooling, webhook changes, outbox/retry architecture, or payment schema redesign.
- Customer cancellation rewrite or review-policy redesign.
- Prisma schema/migration changes, coupon usage tracking, coupon-order relations, or new roles.
- Demo-admin, Cloudinary, environment variables, analytics warehousing, bulk operations, imports, or exports.
- Exact clone parity, shell redesign, broad performance work, Phase 6 hardening, or production release.

## Definition of done

- Eight bounded task commits implement 5C.0–5C.7, plus remediation commits only when a review finding requires code changes.
- ADMIN protection remains server-side and precedes privileged reads/writes.
- Forward transitions are expected-status conditional and payment-agnostic.
- Admin cancellation is fail-closed, provider-free, serializable, idempotent, and atomic across status, canonical/legacy stock, and sales count.
- Safe `FAILED` settlement behavior matches the approved master policy; unknown payment status blocks.
- Payment fields, claim/dispatch evidence, snapshots, and reviews remain unchanged by admin cancellation.
- Order/customer histories use stored snapshots; role safeguards and coupon write contracts remain unchanged.
- Focused task checks, formatting, `git diff --check`, bounded application-mediated non-production acceptance, one high-risk review, and one final review are recorded truthfully.
- No full suite, gate, build, E2E, database CLI/provider call, push, PR, merge, 5D, or Phase 6 work is claimed.

## Planner self-review

- Scope: exactly 5C.0–5C.7; every brief requirement has one owning task.
- Reuse: existing Evironn/fashion-shop reads, helpers, role action, coupon action, primitives, and snapshot formatters are retained or narrowly adapted.
- Types: current string Payment status and current five-member initialization enum are used; no nonexistent Prisma PaymentStatus/INDETERMINATE member is invented.
- Verification: one focused RED/GREEN cycle per behavior task, one structural checkpoint for 5C.7, typecheck at two shared-contract boundaries, two meaningful reviews, and no consolidated/full-suite replay.
- Placeholders: none; all files, interfaces, commands, commit subjects, review boundaries, and stop conditions are explicit.

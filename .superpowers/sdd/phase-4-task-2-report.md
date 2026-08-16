# Phase 4 Task 2 Report

## Scope

Implemented the additive delivery snapshot schema and migration, ADR-016 policy, strict cart-only checkout DTOs, and pure checkout domain calculations. No database connection, migration application, server action, UI, webhook, payment creation, or order-flow implementation was performed.

## Reader and writer audit

Audit command:

```powershell
rg -n "prisma\.(order|payment|coupon)|tx\.(order|payment|coupon)|OrderGetPayload|shippingMethod|shippingAmount|serviceAmount|deliveryWindow|pickupPointId|createPayment|payment-\$\{input\.orderId\}|metadata.*orderNumber|Coupon" app lib services components prisma tests
```

Production readers:

- Order page: `app/(shop)/orders/[number]/page.tsx` reads the order, items, payment, `shippingMethod`, and `shippingAmount`.
- Profile: `lib/profile-page.ts` and profile components read current order totals and shipping fields.
- Admin: order list/detail/dashboard/customer pages and `lib/admin/analytics.ts` read order/payment aggregates and details.
- Eligibility and reconciliation: `lib/review.ts` reads qualifying orders; `lib/payment-sync.ts` reads the local payment and order.
- Coupon checkout: `lib/coupon.ts` reads one coupon by normalized code.

Production writers:

- `app/actions/order.ts` creates/deletes orders and order items, creates the local Payment row, and performs guarded cancellation updates.
- `lib/payment-sync.ts` updates payment/order final states and restores cancellation side effects.
- `app/actions/admin/orders.ts` updates order/payment status.
- `app/actions/admin/coupons.ts` performs coupon administration CRUD only.
- `prisma/seed-orders.ts` is a fixture writer for orders and payments.

No existing column stores immutable delivery zone/date/window, pickup identity, floor/lift/intercom, service lines, or service total. Existing readers remain compatible because all new snapshot fields are nullable and `serviceAmount` defaults to zero. Existing writers may omit every new field. Rollback is application-first while retaining the additive migration; destructive contraction is not authorized.

`Order.shippingMethod` remains `courier` or `pickup`. New showroom and pickup-point orders persist `pickup` plus their server-owned snapshot. A legacy `pickup` with no `pickupPointId` resolves to `legacy-pickup`, never showroom.

## Payment provider audit

Durable evidence present:

- `Order.orderNumber` is unique.
- `Payment.id` is the provider payment id and `Payment.orderId` is unique.
- `lib/yookassa.ts` sends deterministic idempotency key `payment-<orderId>` and metadata `{ orderNumber }`.
- Webhooks carry provider payment id and verify it with `payments.load(id)` before local reconciliation.

Evidence not established:

- Installed `@webzaytsev/yookassa-ts-sdk` documents same-key retry and contains an application example storing a key for 86,400 seconds, but it does not prove YooKassa's provider-side bounded idempotency retention window `T`.
- The installed payment API surface loads by provider id; no audited payment lookup by order metadata was found.
- Current webhook and order-page resync require an existing local `Payment.id`; they cannot recover a provider object after a successful provider create followed by a failed local Payment write.
- Current create errors do not prove the required total `NOT_CREATED`, `CREATED`, and `INDETERMINATE` outcome taxonomy.

Decision: `PAYMENT_AUTO_RETRY_UNSAFE`. No automatic late retry, stock release, provider-dependent cleanup, or provider-dependent assumption is authorized by Task 2. Provider work must stop until an approved ADR-010 decision supplies a bounded `T` and unambiguous recovery/proof contract.

## Coupon audit

`Coupon` has only identity, code, percent, active, expiry, and created-at fields. `lib/coupon.ts` performs a stateless read. Admin CRUD changes coupon definitions but there is no usage relation, redemption counter, limit, reservation, or checkout compensation writer. No coupon usage migration is required.

## TDD evidence

RED:

```powershell
npx vitest run tests/phase-4-schema-contract.test.ts tests/checkout-domain.test.ts tests/checkout-dto.test.ts tests/yookassa-provider-contract.test.ts
```

Observed expected failures: missing migration SQL, missing checkout domain module, missing checkout DTO module, and missing provider unsafe evidence. One deterministic-correlation assertion already passed.

GREEN:

```powershell
npx vitest run tests/phase-4-schema-contract.test.ts tests/checkout-domain.test.ts tests/checkout-dto.test.ts tests/yookassa-provider-contract.test.ts tests/order-snapshot.test.ts tests/order-shipping.test.ts
```

Result: 6 files passed, 31 tests passed.

## Migration safety

Forward path: deploy nullable snapshot columns plus `serviceAmount INTEGER NOT NULL DEFAULT 0`, generate Prisma Client, then let later Phase 4 tasks adopt new readers and writers.

Rollback path: roll application code back while leaving additive columns in place. Old code ignores them. No backfill, removal, rename, retype, reset, delete, truncate, or database command was executed.

## Verification

- `npx prisma validate`: passed using non-secret local placeholder URL variables; no database connection.
- `npm run prisma:generate`: passed.
- `npm run typecheck`: passed.
- Focused Vitest: 6 files passed, 31 tests passed.
- Protected plans remain untracked and byte-identical:
  - `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9`
  - `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`

## Deviations

The requested Prettier command cannot infer a parser for `prisma/schema.prisma`. Prisma formatting was checked with `prisma format`; TypeScript files were formatted with Prettier. Migration SQL is intentionally simple additive PostgreSQL and is covered by the schema contract test and `git diff --check`.

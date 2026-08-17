# Phase 4 Task 3A Report

## Scope

Implemented only the ADR-018 durable payment claim schema checkpoint:

- added the `PaymentInitializationState` enum with `READY`, `CLAIMED`, `DISPATCHED`, `CORRELATED`, and `NOT_CREATED` in the approved order;
- added nullable `Order.paymentInitializationState`, `Order.paymentInitializationClaimedAt`, and `Order.paymentEverDispatchedAt` fields with no defaults;
- added the separate exact additive migration `20260817_phase4_payment_claim`;
- extended the Phase 4 schema contract with exact enum, column, SQL, destructive-statement, prior-migration hash, and historical-null compatibility assertions.

No application behavior, provider integration, database connection, migration deployment, database push/reset, seed, backfill, or external service call was added or run.

## TDD Evidence

RED was run before editing `prisma/schema.prisma` or creating the migration:

```text
npx vitest run tests/phase-4-schema-contract.test.ts
3 failed, 6 passed
```

The expected failures were the missing enum and fields, the missing separate migration, and the absent nullable historical-state contract. Existing delivery and payment-replay checks remained green.

GREEN after the schema and migration changes:

```text
npx vitest run tests/phase-4-schema-contract.test.ts tests/phase-4-migration-status.test.ts tests/yookassa-provider-contract.test.ts
3 files passed, 45 tests passed
```

## Focused Verification

- `npx prisma validate` passed using ephemeral non-secret localhost datasource placeholders. The first invocation without placeholders stopped before validation because the Prisma CLI process did not load `POSTGRES_URL_NON_POOLING`; no database connection was attempted.
- `npm run prisma:generate` passed using the same ephemeral non-secret placeholders and generated Prisma Client 6.19.3.
- `npm run typecheck` passed.
- `npx prettier --check tests/phase-4-schema-contract.test.ts` passed.
- The plan's combined Prettier command cannot parse `prisma/schema.prisma` or the SQL migration because this repository has no Prisma or SQL Prettier parser. The TypeScript contract was formatted with the repository Prettier version; Prisma validation accepted the schema; the SQL contract requires the migration's exact planned text.
- `git diff --check` passed.
- Delivery migration SHA-256 remained `E8972D3AB2A83A5DC19854C7F6EE575F2C4F34665A4EDC67670A061A8D61209A`.
- Payment replay migration SHA-256 remained `268D1DDEA90D2920320B61E4F375C07C27CB0151AD72F67AEFC70A1CA713AD18`.
- Protected untracked Phase 2 plan hashes remained `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9` and `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`.

## Migration Safety

The migration is expansion-only. Historical orders remain compatible because all three columns are nullable and have no default or backfill. Application rollback retains the additive migration; dropping the enum or columns is not part of this task.

## Concerns

The Prisma 6.19.3 CLI reports the existing deprecation warning for `package.json#prisma`. This task does not change Prisma configuration. No Task 4 remediation was started.

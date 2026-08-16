# Architecture decisions

## ADR-001 — foundation reuse

Reuse `fashion-shop` as the production foundation. Preserve stable platform, commerce, payment, security, CI, and operations code unless the furniture domain requires change. Do not reimplement proven behavior without a concrete incompatibility.

## ADR-002 — source and target boundaries

`D:\Новая папка (2)\evironn-clone` is the read-only normative frontend implementation source for visual composition, copy, interactions, responsive behavior, CSS, media behavior, and selected route variants. `D:\Projects\fashion-shop` is the read-only technical source for reusable platform behavior. All production edits occur in `D:\Projects\evironn`.

## ADR-003 — branch model

`main` is accepted release state. `dev` is phase integration state. Work occurs only on named phase branches after Bootstrap. Phase and release pull requests use merge commits; squash and rebase merges are forbidden.

## ADR-004 — furniture variants

Furniture products use normalized option groups and values. Sellable SKUs reference selected values and own canonical combination key, unique article number, price, optional old price, stock, active state, and media overrides. Combination-key generation must be deterministic and tested.

## ADR-005 — immutable order history

Order items store snapshots of the purchased SKU, selected configuration, image, unit price, and totals. Later catalog edits must not alter historical orders.

## ADR-006 — 360 media

A category may feature at most one 360 product. MVP accepts turntable video with poster and static fallback; no frame-sequence viewer. Admin validation enforces the media contract.

## ADR-007 — server authority

The server owns SKU resolution, stock, prices, coupons, delivery/service rates, order totals, payment state, and review eligibility. Client values are display/input only.

## ADR-008 — demo isolation

`/demo-admin` remains public and read-only, uses synthetic fixtures, never reads Prisma, and exposes no mutations. `/admin` requires the ADMIN role.

## ADR-009 — deferred scope

Blog, newsletter, FAQ, and legal content routes are outside MVP. Reintroduction requires a new approved scope decision.

## ADR-010 — architecture changes

Approved phase requirements are executed without repeating discovery. Any new architecture choice pauses implementation, runs a focused brainstorming workflow, and updates this file before code resumes.

## ADR-011 — furniture schema cutover compatibility

Phase 1 makes `Category`, `Room`, `Product`, `OptionGroup`, `OptionValue`, `Sku`, normalized SKU selections, and product/SKU media the canonical furniture catalog. Legacy `ProductColorway`/`ProductVariant` relations remain as a typed compatibility adapter for inherited storefront and operational paths until Phase 2 rewires those reads and writes. New furniture seed data writes only canonical tables; order items keep nullable live SKU references while storing immutable article, combination, configuration, image, and pricing snapshots.

## ADR-012 — source port before redesign

Existing production clone interfaces are ported before any visual redesign. Preserve selected JSX structure, class names, CSS, motion, media behavior, copy, and responsive states by default. Tailwind remains available for new adapters and foundation-only UI, but converting proven clone CSS to Tailwind is not a migration goal. `framer-motion` and `react-icons` are reused where already required. Any material visual reinterpretation needs explicit user approval.

## ADR-013 — staged UI and data adaptation

Each route uses a Next Server Page or server module to produce a serializable Evironn DTO for the ported interactive shell. Server authority from ADR-007 remains unchanged. Phase 2 proceeds in order: shared shell and complete home, selected catalog B over Task 2 logic, exact showcase PDP over Task 3 logic. Until product-specific media packs are validated, all catalog cards target one showcase slug and non-showcase PDP routes redirect there. The showcase add-to-cart control remains decorative until Phase 3.

## ADR-014 — proportional verification cadence

Implementation tasks use the smallest verification set that proves the changed behavior: focused tests, checks for touched files, and critical task-level E2E only when necessary. Full formatting, lint, type checking, Vitest, production build, and current-delivery E2E run once after all tasks in the phase or acceptance-gated delivery are complete. Reviewers reuse valid focused evidence and do not rerun the complete project gate without a concrete cross-cutting risk. Final-review remediation reruns affected checks; the complete gate is repeated only when that remediation invalidates prior evidence or changes a cross-cutting surface.

## ADR-015 — Phase 4 shared non-production E2E database

Phase 4 Playwright and migration verification use the user-authorized shared non-production Neon `dev` branch/database. Its normalized `hostname/database` SHA-256 fingerprint is `4e408e2198d9448ac9bc15b5aa150b05dbeb61c75ce05d11e0e8a8b18cf088eb`. The user confirmed that no separate Production database exists, so the forbidden fingerprint list is empty until a Production target is introduced. The runner must receive `E2E_DATABASE_URL`, optional `E2E_DATABASE_URL_UNPOOLED`, `E2E_DATABASE_ALLOW_WRITES=1`, and the approved target fingerprint explicitly; parsed identities must match the approved fingerprint. Ambient application URLs are equality probes only, never URL sources. Phase 4 tests own uniquely prefixed records and use targeted cleanup only. `TRUNCATE`, `prisma migrate reset`, schema reset, global delete/reset, and Production database access are forbidden.

## ADR-016 — Phase 4 delivery and service policy

Focused brainstorming completed and the user approved option 1 on 2026-08-16. Courier costs 1,900 RUB in Moscow and Moscow Region and is free from 150,000 RUB discounted goods total after coupon. No-lift carrying is 350 RUB per floor above the first, assembly is 3,900 RUB, and old-furniture removal costs 2,400 RUB. The exact showroom/pickup identities, addresses, hours, courier/showroom/pickup lead times, three window labels, four-date horizon, and courier-only service availability are adopted from `evironn-clone/src/cart/cartState.ts:4,77-117,312-331` and `evironn-clone/src/checkout/checkoutState.ts:25-86,144-166,465-499,536-586`. The server owns the policy under ADR-007.

## ADR-017 — bounded YooKassa payment initialization recovery

Focused brainstorming completed and the user approved bounded deterministic replay on 2026-08-16. Official YooKassa documentation states that an idempotency key is retained for 24 hours after the first request and that a repeated request after that period is processed as new. Phase 4 therefore treats the provider retention interval as `T = 24 hours` and permits automatic create replay only inside a conservative application window `W = 23 hours` measured from durable `Order.createdAt`. No provider create call is allowed at or after `createdAt + W`.

Every online order stores a nullable `paymentReturnUrl` in the same transaction as the order, immutable item snapshots, and stock reservation. Together with the durable order id, order number, total, currency, capture mode, locale, description, and metadata, this makes every permitted replay use the same deterministic idempotency key and the same provider request data. A provider object returned from create, load, or a verified webhook recovery is `CREATED` only after its provider id, RUB amount, and exact unique `orderNumber` metadata match the durable order. A missing local `Payment` row is recovered idempotently from that verified object.

`NOT_CREATED` requires conclusive proof that no provider object was created: either the adapter proves that no request was dispatched, or YooKassa returns a narrow non-retryable rejection that cannot represent an earlier idempotent success. Generic `invalid_request`, idempotency-key errors, HTTP 429, timeout, network failure, HTTP 5xx, malformed response, unknown response, absent proof, and local `Payment` write failure are `INDETERMINATE`. Provider-list absence is never authoritative proof of `NOT_CREATED`, because the installed SDK has no payment-list metadata filter and an empty scan does not prove provider non-creation.

`CREATED` and `INDETERMINATE` preserve the order and reserved stock. Only verified `NOT_CREATED` may enter the existing guarded local cancellation/restoration transaction. Webhook recovery for a missing local `Payment` loads the provider object and correlates only one online pending order by exact unique `orderNumber` metadata and RUB amount. At or after `createdAt + W`, recovery is lookup/reconciliation/manual-investigation only: no create replay, fake success, automatic order deletion, automatic cancellation, or automatic stock restoration is permitted. This decision adds no outbox, payment-event architecture, refund flow, or two-stage capture.

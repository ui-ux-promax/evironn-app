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

`NOT_CREATED` requires adapter-proven evidence that no provider request was dispatched. Once any create request is dispatched, every provider rejection or error response is `INDETERMINATE` unless a verified provider object establishes `CREATED`; this includes `invalid_request`, idempotency-key errors, HTTP 400/429, timeout, network failure, HTTP 5xx, malformed response, unknown response, absent proof, and local `Payment` write failure. Provider-list absence is never authoritative proof of `NOT_CREATED`, because the installed SDK has no payment-list metadata filter and an empty scan does not prove provider non-creation.

`CREATED` and `INDETERMINATE` preserve the order and reserved stock. Only adapter-proven no-dispatch `NOT_CREATED` may enter the existing guarded local cancellation/restoration transaction. Webhook recovery for a missing local `Payment` loads the provider object and correlates only one online pending order by exact unique `orderNumber` metadata and RUB amount. At or after `createdAt + W`, recovery is lookup/reconciliation/manual-investigation only: no create replay, fake success, automatic order deletion, automatic cancellation, or automatic stock restoration is permitted. This decision adds no outbox, payment-event architecture, refund flow, or two-stage capture.

## ADR-018 - durable YooKassa create claim

Focused brainstorming completed and the user approved a durable per-order payment-create claim on 2026-08-17. Process-local locking and database advisory locks were rejected because neither preserves whether an earlier process may have dispatched a provider request. Disabling all automatic `NOT_CREATED` cancellation was also rejected because it would discard the approved safe no-dispatch cancellation path.

Each new online order stores a durable initialization state. An automatic create attempt must first win an atomic `READY` or replayable `DISPATCHED` to `CLAIMED` transition while the order is online, `PENDING`, inside ADR-017's `W = 23 hours` window, and has no local `Payment`. Only the winning process may call YooKassa. Other processes observe `CLAIMED` and return `INDETERMINATE` without provider or stock mutation. `paymentInitializationClaimedAt` records when the exclusive attempt began.

The winner retains the exact pre-claim origin. If the application window closes after the claim but before provider dispatch, an exact-owner guarded release restores `READY` only for a `READY`-origin claim and restores `DISPATCHED` for a `DISPATCHED`-origin claim whose original non-null `paymentEverDispatchedAt` still matches. Both releases clear `paymentInitializationClaimedAt` and make zero provider calls. A missing or changed dispatch timestamp, zero-count guarded release, or release exception returns `INDETERMINATE` and remains fail-closed. This recovery never writes `READY` to historical, COD, or `DISPATCHED`-origin orders.

`paymentEverDispatchedAt` is write-once evidence that at least one provider request may have crossed the dispatch boundary. A dispatched error records `DISPATCHED` and this timestamp before exposing `INDETERMINATE`; a later replay may claim the same deterministic ADR-017 request, but a later adapter-proven no-dispatch result cannot cancel or restore stock once `paymentEverDispatchedAt` is non-null. A verified provider object atomically creates or repairs the provider-id `Payment` correlation and marks the initialization `CORRELATED` only while the order remains `PENDING`.

When a `DISPATCHED`-origin replay with proven no dispatch still owns its exact claim, it must guardedly finish in `DISPATCHED`, clear `paymentInitializationClaimedAt`, preserve the original `paymentEverDispatchedAt` exactly, return `INDETERMINATE`, and leave the pending order and reserved stock unchanged. A zero-count or throwing guarded write also returns `INDETERMINATE`; it may leave `CLAIMED` fail-closed rather than inventing a successful release.

Only the claim owner may convert a first-attempt adapter-proven no-dispatch result to `NOT_CREATED`, and only in one transaction guarded by `status = PENDING`, absent `Payment`, `state = CLAIMED`, and null `paymentEverDispatchedAt`; that transaction cancels the order and restores canonical SKU stock exactly once. A process crash while state is `CLAIMED` is deliberately fail-closed: the order and stock remain reserved and subsequent automatic create/cancel attempts return `INDETERMINATE` until verified reconciliation or manual investigation. No timeout may infer that dispatch did not occur.

Historical orders may keep a null initialization state and are lookup/reconciliation-only until safely classified. This decision adds one Prisma enum and three nullable `Order` columns through a separate additive migration; application code writes `READY` only for new online orders. It adds no outbox, refund flow, two-stage capture, provider-list inference, or automatic stale-claim takeover.

## ADR-019 — portfolio-only E2E target policy

The user confirmed on 2026-08-18 that Evironn is a portfolio project with no real customer orders and no Production database. Phase 4 completion E2E and migration readiness therefore run only against the existing shared Neon `dev` branch. Keep explicit E2E URLs, `E2E_DATABASE_ALLOW_WRITES=1`, and the approved-dev fingerprint as the target boundary; permit the tracked forbidden-fingerprint list to remain empty until a Production target exists. Never invent a Production fingerprint or use the ambient application database as the E2E URL source. Standalone readiness and Playwright must load `.env.local` before resolving the guard. Targeted unique-record cleanup remains required; global reset/truncate operations remain forbidden.

## ADR-020 — proportional portfolio E2E scope

The user approved on 2026-08-19 to simplify Phase 4 E2E to the proportional `fashion-shop` model. E2E is a functional portfolio smoke layer, not an infrastructure-safety acceptance system. Future test execution should use one explicitly selected non-production Neon `dev` target through the existing application-style connection convention (`POSTGRES_URL_NON_POOLING` or `POSTGRES_URL`), without requiring `E2E_DATABASE_URL`, target fingerprints, forbidden-fingerprint policy, standalone database-readiness checks, or delivery-manifest hashing.

Keep the valuable browser journeys: authentication, cart/checkout, COD order creation, order ownership and snapshots, cancellation/stock behavior, and purchase-gated reviews. Fixtures must still use unique test-owned identities and targeted cleanup; `TRUNCATE`, schema reset, global delete/reset, and Production database access remain forbidden by convention. Vitest continues to mock external providers. Real YooKassa sandbox payment creation/cancellation is an optional manual smoke and must not block portfolio acceptance; COD and lookup-only blocked-payment behavior remain sufficient automated payment coverage until a provider smoke is intentionally run. Implementation removes mandatory fingerprint/readiness/manifest machinery; legacy E2E URL names remain compatibility inputs only.

## ADR-021 — bounded multi-session Phase 5 delivery

The user approved splitting Phase 5 into bounded sessions 5A–5D while retaining one branch `phase/05-admin-demo` and one final pull request into `dev`. Phase 5 is larger than previous deliveries because it combines ADMIN authorization, dashboard, furniture catalog/option/SKU/media administration, commerce operations, and an isolated public demo admin. Forcing all work into one conversation would reduce context quality without improving integration safety.

Each internal delivery ends with durable progress and a handoff but does not merge independently. The sequence is 5A access/shell/dashboard foundation, 5B furniture catalog/SKU/media operations, 5C orders/customers/roles/coupons, and 5D synthetic read-only demo/integration/visual acceptance. Coordination and implementation use Luna High. Planning, task review, high-risk review, final functional review, and ADMIN/role/Cloudinary security review use fresh read-only Claude Opus XHigh CLI runs with structured output, bounded budgets, and no repository mutation. Fresh Sol Medium is fallback only when Claude is genuinely unavailable after one bounded retry, and the substitution reason must be recorded. Codex agents use the normal/default service tier.

## ADR-022 — defer exact admin visual parity until functional completion

The user accepted the current Phase 5A dashboard on 2026-08-25 and chose to defer further admin visual work until the protected admin and synthetic demo-admin are functionally complete. Streams 5B and 5C therefore implement canonical furniture administration and commerce operations inside the accepted shell without route-by-route redesign or speculative visual polishing. Presentation components must remain separated from Prisma reads, server actions, validation, and domain DTOs so the final style pass does not rewrite business logic.

Stream 5D owns one consolidated visual-parity pass across every completed `/admin` and `/demo-admin` route. It uses `D:\Новая папка (2)\evironn-clone\src\admin` as the read-only normative visual source, preserves all ADMIN guards, real-data projections, mutations, demo isolation, loading/empty/error states, and responsive behavior, and ends with desktop/mobile user acceptance. The post-adjustment 5A diff does not require a separate paid Opus re-review; functional, security, and final review are performed at the meaningful Phase 5 boundaries defined by the plan.

## ADR-023 — explicit admin-only option-link detach intent

Focused brainstorming completed and the user approved the narrow admin-only detach-intent approach on 2026-08-25 after a Rule V/DTO conflict was demonstrated. The shared `furnitureProductSchema` remains strict and unchanged: every submitted SKU must select one value from every submitted option group. `saveFurnitureProduct` accepts an admin-only envelope carrying the draft plus explicit `detachOptionGroupIds` and `detachOptionValueIds` arrays. During no-write preflight, the action builds a strict validation projection by retaining selections belonging to retained inactive SKUs; after SKU reconciliation, one transaction applies the explicit detach intent under Rule V. Sellable selectors refuse with `OPTION_VALUE_IN_USE` or `OPTION_GROUP_IN_USE`; retained inactive SKUs keep their `SkuOptionValue` rows. This keeps the shared DTO safe for storefront and ordinary drafts while making the exceptional destructive intent explicit and preserving one product-save flow. No schema change, separate provider abstraction, or storefront behavior is introduced.

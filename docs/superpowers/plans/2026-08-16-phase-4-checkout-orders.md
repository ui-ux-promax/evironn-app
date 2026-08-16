# Phase 4 Checkout, Payments, and Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILLS: Use superpowers:executing-plans for coordinator checkpoints and superpowers:subagent-driven-development to implement this plan sequentially task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver server-authoritative furniture checkout, transactional order creation, YooKassa sandbox and cash-on-delivery flows, resilient payment/cancellation behavior, verified-purchase reviews, and the accepted Checkout Variant A and Order Variant A interfaces.

**Architecture:** Keep Auth.js, Prisma/Neon, canonical furniture SKUs, coupons, YooKassa reconciliation, cancellation, DaData, and review eligibility as the production foundation. Add only the delivery and service snapshot fields proven missing by the Phase 4 audit, calculate quotes through one shared server module, create order snapshots and reserve stock in one serializable database transaction, and adapt the clone shells to serializable production DTOs and server actions. Preserve mixed-version reads by retaining `Order.shippingMethod` values `courier` and `pickup`; distinguish showroom and pickup-point orders with additive pickup-point snapshot fields.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Prisma 6 with Neon WebSocket adapter, Auth.js 5, Zod, Zustand, YooKassa SDK, DaData, Vitest, Playwright, CSS from the read-only Evironn clone.

---

## Approved Boundary and Audit Conclusions

- Delivery base is merge commit `868310fff1ad9bbc980fe54710e7dfb311f1f288` (`origin/dev`, pull request #3). Final Phase 3 branch commit `f3d8a93` is its ancestor.
- Work remains on `phase/04-checkout-orders`. Never commit to `dev` or `main`.
- Read-only technical source is `D:\Projects\fashion-shop`. Read-only visual source is `D:\Новая папка (2)\evironn-clone`.
- Reuse current production `placeOrder`, order snapshots, YooKassa creation, webhook verification, payment reconciliation, cancellation, stock restoration, DaData suggestions, coupon checks, Auth.js ownership, and purchase predicates. Replace only incompatibilities proven by the canonical furniture SKU and delivery/service requirements.
- Exact audit proves `Order` lacks delivery date/window, zone, floor/lift, pickup-point, and service-price snapshots. An additive schema expansion is required. No existing column or table is removed, renamed, or retyped.
- Existing `Order.shippingMethod` remains the compatibility discriminator: persist `courier` for courier and `pickup` for both showroom and pickup-point. Only a non-null, server-owned Phase 4 pickup snapshot differentiates the two new modes. A legacy `pickup` row with no `pickupPointId` remains neutral self-pickup and must never be relabeled as showroom.
- The coordinator completed the required focused `superpowers:brainstorming` checkpoint before Task 1 dispatch. On 2026-08-16 the user explicitly approved option 1: adopt the exact audited clone-derived Phase 4 delivery policy. Task 1 records this binding choice as ADR-016; it is no longer an unresolved inference.
- ADR-016 policy is: courier costs `1,900 RUB` in both Moscow and Moscow Region; courier becomes free from `150,000 RUB` discounted goods total after coupon; carrying without a lift costs `350 RUB` per floor above the first; assembly costs `3,900 RUB`; old-furniture removal costs `2,400 RUB`; showroom/pickup ids, names, addresses, hours, lead times, windows, four-day horizon, and service availability match the audited clone exactly. Evidence: `evironn-clone/src/cart/cartState.ts:4,77-117` and `evironn-clone/src/checkout/checkoutState.ts:25-86,144-166,536-586`, plus the user's 2026-08-16 approval for applying the same courier tariff to Moscow Region.
- Client labels and identifiers remain inputs only. The server resolves ADR-016 pickup identities, labels, addresses, civil dates, windows, rates, and totals from one policy module; tests cite ADR-016 and its exact source lines.
- Every delivery day is a `Europe/Moscow` civil date. Slot IDs carry `YYYY-MM-DD` plus a server window id; `deliveryDate` stores that date as the UTC-midnight sentinel `YYYY-MM-DDT00:00:00.000Z`; DTOs emit the date-only string and never parse it as a browser-local instant. Slot generation and validation derive "today" in `Europe/Moscow` and must agree across UTC/Moscow midnight boundaries.
- Online checkout maps to production `paymentMethod: 'online'` and YooKassa redirect. Cash on delivery maps to `paymentMethod: 'cod'`. Do not collect or validate raw card fields in Evironn; YooKassa owns payment details.
- Online-provider correlation uses the existing durable foundation: `Order.id` supplies deterministic idempotency key `payment-<orderId>`, unique `Order.orderNumber` is YooKassa metadata, and `Payment.id` stores the provider id. Only a provider-proven `NOT_CREATED` outcome permits one local cancellation/restoration transaction. `CREATED`, timeout, failed local `Payment` write, late retry, or any other `INDETERMINATE` state preserves the order and reserved stock until verified reconciliation; no ambiguity may delete the order or restore stock.
- The order page must never synthesize courier contacts, support tickets, documents, payment success, recommendations, or review eligibility. Unsupported clone mock actions are omitted; supported actions use production URLs/actions.
- Phase 4 excludes admin, Cloudinary, demo-admin, Sentry/operations hardening, performance work, refunds, two-stage capture, and new payment-event/outbox architecture.
- ADR-013 remains binding: the accepted showcase PDP stays fixed to Noma and non-showcase product routes keep redirecting there. Phase 4 must not broaden product routing or navigate namespace fixture PDPs; E2E injects namespace-owned canonical cart lines through a guarded authenticated fixture boundary.

## Migration Safety Contract

Task 2 must use the `migration` skill in addition to TDD.

- **Readers before expansion:** `app/(shop)/orders/[number]/page.tsx`, `lib/profile-page.ts`, `components/evironn/profile/profile-variant-a.tsx`, admin order readers, `lib/review.ts`, and payment reconciliation read current `Order` and `OrderItem` fields.
- **Writers before expansion:** `app/actions/order.ts`, `prisma/seed-orders.ts`, payment reconciliation, cancellation, and admin status actions.
- **Forward path:** add nullable snapshot columns and `serviceAmount` with a zero default; generate Prisma client; update new writers; update Phase 4 readers with null-safe fallbacks; deploy the same migration to the explicitly selected non-production E2E database.
- **Rollback path:** roll application code back first; old code ignores additive columns and still sees `courier`/`pickup`. Keep the additive migration applied. Dropping columns is a separate destructive contraction and is not authorized in Phase 4.
- **Mixed-version safety:** no new required value is needed by old readers. New readers accept pre-Phase-4 rows where every new column is null/defaulted.
- **Idempotence:** the non-exposing migration wrapper must invoke the real `prisma migrate deploy` subprocess twice against the explicit non-production E2E database; the second invocation must report no pending migration. The wrapper captures raw stdout/stderr in-process with piped stdio, emits only exit status, allowlisted error category, migration names/counts, booleans, and fingerprints, and discards raw output without forwarding it to reports or agent messages. Never use `TRUNCATE`, `prisma migrate reset`, global delete/reset, or Production.
- **Payment correlation proof:** Task 2 must re-audit the deterministic idempotency key, unique order number metadata, provider-id `Payment` primary key, webhook payload, and order-page resync before relying on the existing schema. If any link cannot recover a missing local `Payment` row without ambiguity, stop under ADR-010 and revise the additive migration before provider work.

## Agent and Review Protocol

For every implementation task:

1. Coordinator writes `.superpowers/sdd/phase-4-task-N-brief.md` with only the bounded task, interfaces below, focused commands, constraints, report path, and task base SHA.
2. Fresh Sol medium implementer uses `caveman ultra` for messages, TDD for logic/bug fixes, and writes `.superpowers/sdd/phase-4-task-N-report.md` in normal technical English.
3. Implementer runs only the focused commands listed for the task, touched-file Prettier, and `git diff --check`. Typecheck runs only where this plan marks a broad type/schema/contract boundary.
4. Implementer verifies Git identity before committing and uses the exact English conventional commit subject listed by the task.
5. Fresh Sol xhigh reviewer receives only the task brief, report, constraints, task base-to-HEAD diff, and fresh focused evidence. It must not run the full gate. Critical/Important findings return to the owning implementer; the task does not advance until both counts are zero.
6. Coordinator updates `.superpowers/sdd/progress.md` after each approved task with commit range, evidence, review result, and next task.

Database command evidence is allowlisted. Raw Prisma/readiness stdout or stderr, URLs, hostnames, database names, usernames, query parameters, and credentials must never appear in task reports, progress, STATUS, agent messages, or review inputs. Only sanitized exit status, error category, migration names/counts, booleans, and SHA-256 fingerprints may be recorded.

Protected pre-existing untracked plans must remain byte-identical and untracked:

- `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` SHA-256 `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9`
- `docs/superpowers/plans/phase-2-task-3-execution.md` SHA-256 `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`

The reviewed Phase 4 plan may also be untracked when Task 1 begins. Task 1 stages it without content edits and includes it in the Task 1 commit; the two protected Phase 2 plans remain untracked.

---

### Task 1: Record Approved Policy and Lock the Environment Contract

**Files:**

- Track without content edits: `docs/superpowers/plans/2026-08-16-phase-4-checkout-orders.md`
- Modify: `docs/roadmap/STATUS.md`
- Modify: `docs/roadmap/DECISIONS.md`
- Modify: `.superpowers/sdd/progress.md`
- Modify: `.env.example`
- Modify: `e2e/database-guard.ts`
- Create: `e2e/database-target.ts`
- Create: `scripts/e2e-database-fingerprint.ts`
- Modify: `tests/e2e-database-guard.test.ts`
- Create report: `.superpowers/sdd/phase-4-task-1-report.md`

- [ ] **Step 0: Confirm the completed coordinator-owned decision checkpoint**

Before dispatching the Task 1 implementer, the coordinator records that focused `superpowers:brainstorming` completed on 2026-08-16 and the user approved option 1 exactly as listed in ADR-016 below. No implementer reopens the decision. If the approved policy changes, stop under ADR-010 and repeat focused brainstorming before code changes.

- [ ] **Step 1: Reconfirm branch, identity, base, and protected plans**

Run:

```powershell
git status --short --branch
git branch --show-current
git rev-parse HEAD
git config user.name
git config user.email
git merge-base --is-ancestor f3d8a93 origin/dev
Get-FileHash 'docs\superpowers\plans\2026-08-12-phase-2a-executable-storefront-home.md' -Algorithm SHA256
Get-FileHash 'docs\superpowers\plans\phase-2-task-3-execution.md' -Algorithm SHA256
```

Expected: branch `phase/04-checkout-orders`, HEAD `868310f...`, user identity `ui-ux-promax <gojjoy22@gmail.com>`, ancestor check exit 0, and the two hashes above. Before Task 1 edits, the only untracked files may be the two protected Phase 2 plans and this reviewed Phase 4 plan. After the Task 1 commit, only the two protected Phase 2 plans remain untracked.

- [ ] **Step 2: Pin ADR-016 and specify non-exposing database fingerprint confirmation**

Record the completed policy decision with exact evidence:

| Policy input                                                 | Accepted value                                                                                                     | Binding evidence                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Moscow and Moscow Region courier tariffs; free-delivery rule | `1,900 RUB` in either zone; free from `150,000 RUB` discounted goods total after coupon                            | user approval 2026-08-16; `cartState.ts:4,77-80,312-331`; `checkoutState.ts:25-33,559-586` |
| Showroom and pickup points                                   | exact `pt-dizavod`, `pt-danilov`, and `pt-vdnh` names, addresses, hours, and showroom/pickup roles                 | user approval 2026-08-16; `checkoutState.ts:35-49,69-86`                                   |
| Lead times, number of days shown, windows                    | courier +2 days, showroom +1 day, pickup point +2 days; four dates; `10:00-14:00`, `14:00-18:00`, `18:00-22:00`    | user approval 2026-08-16; `cartState.ts:77-117`; `checkoutState.ts:61-66`                  |
| Carrying, assembly, removal                                  | courier-only; no-lift carrying `(floor - 1) * 350`, assembly `3,900`, removal `2,400`; lift carrying included/free | user approval 2026-08-16; `checkoutState.ts:144-166,465-499,536-586`                       |

Task 1 writes this exact decision as ADR-016 and links `CHECKOUT_POLICY`, tests, STATUS, progress, and reports to ADR-016. Any deviation requires a new ADR-010 checkpoint; implementation must not silently alter a tariff, identity, address, lead time, window, horizon, or service rule.

Separately, the user sets the explicit shared-dev URL and every required forbidden Production reference in local environment variables outside chat. After Step 6 creates the acquisition CLI, run `npx tsx scripts/e2e-database-fingerprint.ts E2E_DATABASE_URL [PRODUCTION_DATABASE_URL]`. The script accepts variable names only, parses values in-process, normalizes pooler/unpooled `hostname/database`, and emits only presence/validity booleans, SHA-256 fingerprints, and equality booleans; it never emits a URL, hostname, database name, username, query, or password. The coordinator asks the user to confirm only the resulting non-secret approved-dev and forbidden fingerprints, then tracks those hashes in ADR-015/`e2e/database-target.ts`. Raw Production identity is never requested, read from a file, displayed, or tracked. Task 1 must not authorize database writes or finish the environment guard until the approved fingerprint and all required forbidden fingerprints are confirmed. If a required forbidden reference is unavailable, stop for input/authority rather than inspecting an unapproved source.

- [ ] **Step 3: Write failing E2E guard tests**

Define `DatabaseTargetPolicy = { approvedDevFingerprint: string; forbiddenFingerprints: readonly string[] }` and `resolveE2eDatabaseEnvironment(env, targetPolicy = TRACKED_TARGET_POLICY)`. Extend `tests/e2e-database-guard.test.ts` with exact cases proving:

```typescript
expect(() =>
  resolveE2eDatabaseEnvironment(
    {
      POSTGRES_URL: 'postgresql://ambient.example/app',
      POSTGRES_URL_NON_POOLING: 'postgresql://ambient-direct.example/app',
      E2E_DATABASE_ALLOW_WRITES: '1',
      E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
    },
    testPolicy,
  ),
).toThrow('E2E_DATABASE_URL');

expect(
  resolveE2eDatabaseEnvironment(
    {
      E2E_DATABASE_ALLOW_WRITES: '1',
      E2E_DATABASE_URL: 'postgresql://phase4.example/dev',
      E2E_DATABASE_TARGET_FINGERPRINT: testPolicy.approvedDevFingerprint,
    },
    testPolicy,
  ),
).toMatchObject({
  POSTGRES_URL: 'postgresql://phase4.example/dev',
  POSTGRES_URL_NON_POOLING: 'postgresql://phase4.example/dev',
  RESEND_API_KEY: '',
});
```

Unit tests inject a test-local policy and URLs; they never need the real target preimage or module mocking. Also assert:

- an explicitly present empty `E2E_DATABASE_URL_UNPOOLED` is invalid;
- both pooled and unpooled normalized `hostname/database` identities equal the caller-supplied target fingerprint and `targetPolicy.approvedDevFingerprint`;
- the target differs from every injected/tracked forbidden fingerprint; present ambient database URLs are parsed internally only as equality probes and never returned, printed, or used as URL sources;
- credentials/query parameters never affect or appear in the fingerprint/error output;
- error copy says `approved non-production E2E database` and implementation contains no ambient URL fallback expression.

- [ ] **Step 4: Run RED**

Run:

```powershell
npx vitest run tests/e2e-database-guard.test.ts
```

Expected: fail on stale disposable-only wording or missing new assertions; no database connection occurs.

- [ ] **Step 5: Correct durable handoff records before environment authorization**

Update `docs/roadmap/STATUS.md` so its current-state block says:

- active phase/branch is Phase 4 / `phase/04-checkout-orders` from `origin/dev` merge `868310f`;
- Phase 3 pull request #3 merged with merge commit `868310f`; final Phase 3 branch commit is `f3d8a93`;
- Phase 3 Auth B, Cart A, and Profile A desktop/mobile visual acceptance is complete;
- Phase 3 completion evidence remains `format`, `gate` (170 files / 930 tests), and `build` passed;
- Phase 3 E2E was invoked but stopped before Playwright because explicit E2E database variables were absent; no ambient database was used;
- Google OAuth/other external smoke not proved by that local gate remains stated honestly rather than rewritten as passed;
- Phase 4 is authorized and no Phase 4 implementation evidence exists yet.

Replace the stale top title/current section in `.superpowers/sdd/progress.md` with a Phase 4 coordinator section while preserving historical Phase 2/3 records below it. Record delivery base `868310f`, branch, plan path, protected hashes, nine pending tasks, the completed ADR-016 decision, and that ADR-015/database writes remain blocked until Step 6 obtains non-secret fingerprint confirmation.

- [ ] **Step 6: Implement identity-bound environment documentation and guard**

Change `.env.example` comments to describe the explicit approved non-production E2E database, required non-secret target fingerprint, optional unpooled URL, and Production/reset prohibitions. Do not add endpoints or credentials.

Implement pure fingerprint helpers, injectable `DatabaseTargetPolicy`, the acquisition CLI, and the environment guard first. Unit tests use only `testPolicy`. Then run the Step 2 CLI command, obtain user confirmation of only the emitted non-secret fingerprints, and finalize `TRACKED_TARGET_POLICY`; if confirmation is unavailable, stop Task 1 here with no database write authorization and no commit.

`e2e/database-target.ts` exports `DatabaseTargetPolicy`, the confirmed approved-dev and required forbidden SHA-256 fingerprints, and pure normalization/fingerprint helpers. `scripts/e2e-database-fingerprint.ts` is the only acquisition CLI and prints hashes/booleans only. Keep `resolveE2eDatabaseEnvironment(env, targetPolicy = TRACKED_TARGET_POLICY)` strict: require `E2E_DATABASE_ALLOW_WRITES=1`; require valid explicit pooled URL; use explicit unpooled URL only when present and valid; otherwise fall back only to explicit pooled E2E URL; require the caller target fingerprint to equal `targetPolicy.approvedDevFingerprint`; require both URLs to normalize to it; reject every `targetPolicy.forbiddenFingerprints` member and equality with any present ambient forbidden identity; blank `RESEND_API_KEY`; never return/output an ambient URL or raw identity.

After fingerprint confirmation, append ADR-015 and ADR-016 to `docs/roadmap/DECISIONS.md` with these exact numbers and content:

```markdown
## ADR-015 — Phase 4 shared non-production E2E database

Phase 4 Playwright and migration verification may use the user-authorized shared non-production Neon `dev` branch/database whose normalized `hostname/database` SHA-256 fingerprint is recorded here. Fingerprints are derived locally by the non-exposing preflight; raw identities/URLs are never printed or tracked. The runner must receive `E2E_DATABASE_URL`, optional `E2E_DATABASE_URL_UNPOOLED`, `E2E_DATABASE_ALLOW_WRITES=1`, and the approved target fingerprint explicitly; parsed pooled/unpooled identities must match the tracked approved fingerprint and differ from every required forbidden fingerprint. Ambient application URLs may be parsed only as internal equality probes and must never be output or used as URL sources. Phase 4 tests own uniquely prefixed product/SKU/coupon/user/order records and remove only those records in a retry-safe targeted transaction. Production, `TRUNCATE`, `prisma migrate reset`, schema reset, and global delete/reset operations are forbidden.

## ADR-016 — Phase 4 delivery and service policy

Focused brainstorming completed and the user approved option 1 on 2026-08-16. Courier costs 1,900 RUB in Moscow and Moscow Region and is free from 150,000 RUB discounted goods total after coupon. No-lift carrying is 350 RUB per floor above the first, assembly is 3,900 RUB, and old-furniture removal costs 2,400 RUB. The exact showroom/pickup identities, addresses, hours, courier/showroom/pickup lead times, three window labels, four-date horizon, and courier-only service availability are adopted from `evironn-clone/src/cart/cartState.ts:4,77-117,312-331` and `evironn-clone/src/checkout/checkoutState.ts:25-86,144-166,465-499,536-586`. The server owns the policy under ADR-007.
```

- [ ] **Step 7: Run GREEN and formatting**

Run:

```powershell
npx vitest run tests/e2e-database-guard.test.ts
npx prettier --check docs/roadmap/STATUS.md docs/roadmap/DECISIONS.md .superpowers/sdd/progress.md .env.example e2e/database-guard.ts e2e/database-target.ts scripts/e2e-database-fingerprint.ts tests/e2e-database-guard.test.ts
git diff --check
```

Expected: focused tests pass, Prettier passes, diff check exits 0, protected hashes remain unchanged.

- [ ] **Step 8: Commit and review**

Commit subject:

```text
docs: initialize phase 4 delivery
```

Reviewer checks factual Phase 3 closeout, completed brainstorming/user approval, exact ADR-016 values/citations, unambiguous ADR-015/ADR-016 numbering, executable CLI-before-confirmation sequencing, injectable target policy, non-exposing fingerprint acquisition, no ambient/equality escape, protected hashes, and no checkout/payment/order implementation mixed into Task 1.

---

### Task 2: Add Compatibility-Safe Delivery Snapshot and Domain Contracts

**Required skills:** `migration`, `superpowers:test-driven-development`

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260816_phase4_delivery_snapshots/migration.sql`
- Modify: `constants/config.ts`
- Create: `services/dto/checkout.dto.ts`
- Create: `lib/checkout-domain.ts`
- Create: `tests/phase-4-schema-contract.test.ts`
- Create: `tests/checkout-domain.test.ts`
- Create: `tests/checkout-dto.test.ts`
- Create: `tests/yookassa-provider-contract.test.ts`
- Create report: `.superpowers/sdd/phase-4-task-2-report.md`

- [ ] **Step 1: Map live readers and writers before schema edits**

Record in the task report the exact output of:

```powershell
rg -n "prisma\.(order|payment|coupon)|tx\.(order|payment|coupon)|OrderGetPayload|shippingMethod|shippingAmount|serviceAmount|deliveryWindow|pickupPointId|createPayment|payment-\$\{input\.orderId\}|metadata.*orderNumber|Coupon" app lib services components prisma tests
```

Classify every production match as reader, writer, or fixture. Confirm:

- no existing column already stores immutable delivery window, pickup-point identity, floor/lift, or service lines;
- `Payment.id` remains the provider id, `Order.orderNumber` is unique, `createPayment` passes deterministic idempotency key `payment-<orderId>` and metadata order number, and webhook/order-page code can be extended to verify provider details and recover a missing local `Payment` row;
- the YooKassa provider/SDK audit records a bounded idempotency retention window `T` and the create-outcome evidence required for three total states: `NOT_CREATED` (provider explicitly rejected before creation and a provider lookup proves no object), `CREATED` (provider object/id returned or lookup proves an object), and `INDETERMINATE` (timeout, network/5xx, malformed response, or no proof). If the current provider contract cannot audit `T` and these proofs, set `PAYMENT_AUTO_RETRY_UNSAFE`, permit no automatic late retry or stock release, and stop online external E2E cleanup as blocked under ADR-010;
- `Coupon` is currently stateless (`prisma/schema.prisma:426-433` has no usage relation/limit and `lib/coupon.ts` only reads); there is no hidden coupon writer to migrate or compensate.

If any audit conclusion differs, stop under ADR-010 rather than adding duplicate state or assuming correlation/usage semantics. Record the exact provider documentation/SDK evidence and `T` in the Task 2 report; no unbounded idempotency retry is allowed.

- [ ] **Step 2: Write RED schema and domain tests**

`tests/phase-4-schema-contract.test.ts` must parse `prisma/schema.prisma` and migration SQL and assert the additive `Order` fields:

```prisma
deliveryZone      String?
deliveryDate      DateTime?
deliveryWindow    String?
pickupPointId     String?
pickupPointName   String?
pickupPointAddress String?
floor             Int?
liftType          String?
intercom          String?
serviceDetails    Json?
serviceAmount     Int       @default(0)
```

The SQL assertions must require only `ADD COLUMN`, nullable columns/default `0`, and forbid `DROP`, `RENAME`, `ALTER COLUMN`, `TRUNCATE`, `DELETE FROM`, and reset statements.

`tests/checkout-domain.test.ts` must load the exact accepted ADR policy from `constants/config.ts` and assert:

- courier supports `moscow` and `moscow-region`, with each zone's tariff and any free-delivery threshold/basis matching the recorded ADR exactly;
- the approved ADR-016 values are exactly `1,900`, `150,000`, `350`, `3,900`, and `2,400` in their respective formulas, including the same courier tariff for both zones;
- showroom/pickup-point rates, pickup ids/labels/addresses, service availability, lift/floor formula, assembly/removal rates, slot lead days, window ids/labels, and horizon match the recorded ADR exactly;
- no clone mock constant is imported into production policy;
- slot generation derives the civil date in `Europe/Moscow`, emits stable `YYYY-MM-DD:<window-id>` ids, persists UTC-midnight date sentinels, and does not shift across `2026-08-16T20:59:59Z` / `2026-08-16T21:00:00Z` or during DTO serialization;
- persisted `shippingMethod` maps courier to `courier` and both new pickup modes to `pickup`;
- legacy `shippingMethod: 'pickup'` with null pickup snapshot maps to neutral `legacy-pickup`, never showroom.

`tests/checkout-dto.test.ts` must reject unknown keys, impossible service/method combinations, missing courier address/slot, missing pickup point, floor outside `1..60`, unsupported zone, and payment methods other than `online`/`cod`.

- [ ] **Step 3: Run RED**

Run:

```powershell
npx vitest run tests/phase-4-schema-contract.test.ts tests/checkout-domain.test.ts tests/checkout-dto.test.ts tests/yookassa-provider-contract.test.ts
```

Expected: fail because schema, DTO, and domain module do not exist.

- [ ] **Step 4: Implement exact domain types and pure calculations**

`services/dto/checkout.dto.ts` must export strict Zod schemas and inferred types with these public values:

```typescript
export const deliveryMethodSchema = z.enum(['courier', 'showroom', 'pickup-point']);
export const deliveryZoneSchema = z.enum(['moscow', 'moscow-region']);
export const liftTypeSchema = z.enum(['passenger', 'freight', 'none']);
export const paymentMethodSchema = z.enum(['online', 'cod']);

export const checkoutAddressSchema = z
  .object({
    city: z.string().trim().min(1).max(100),
    addressLine: z.string().trim().min(1).max(200),
    addressComment: z.string().trim().max(300).optional(),
    floor: z.number().int().min(1).max(60).optional(),
    liftType: liftTypeSchema.optional(),
    intercom: z.string().trim().max(40).optional(),
  })
  .strict();

export const checkoutQuoteInputSchema = z
  .object({
    deliveryMethod: deliveryMethodSchema,
    deliveryZone: deliveryZoneSchema.optional(),
    deliverySlotId: z.string().min(1),
    pickupPointId: z.string().min(1).optional(),
    address: checkoutAddressSchema.optional(),
    services: z.object({ carrying: z.boolean(), assembly: z.boolean(), removal: z.boolean() }),
    couponCode: z.string().trim().max(40).optional(),
  })
  .strict();
```

Add schema-level conditional validation driven by the accepted policy: courier requires zone, address, and a server-owned slot; non-courier methods reject courier address/zone and any service not approved for that mode; showroom requires the exact approved showroom id; pickup point requires an exact approved selectable id; carrying without a lift requires a floor; lift/floor rules follow the ADR. Export inferred `CheckoutQuoteInput`.

Export separate strict `placeOrderSchema` by extending the quote input with bounded non-empty `contactName`, normalized `contactPhone`, validated `contactEmail`, and `paymentMethod`. Export inferred `PlaceOrderInput`. Phase 4 Checkout A is cart-only: both `buyNowVariantId` and `buyNowSkuId` are rejected as unknown keys and removed from the checkout route/controller contract. A future buy-now source requires a separate ADR-010 decision and discriminated quote-source design; legacy order-item reads remain compatibility-only.

`constants/config.ts` must expose one typed immutable `CHECKOUT_POLICY` whose values cite the accepted ADR. `lib/checkout-domain.ts` exports typed `buildDeliverySlots(now, method)`, `resolveDeliverySelection(input, now)`, `calculateServiceLines(input)`, `calculateCheckoutTotals(input)`, `toPersistedShippingMethod(method)`, `moscowDateOnly(now)`, `toDeliveryDateSentinel(dateOnly)`, and `fromDeliveryDateSentinel(value)`. The module is pure and client-safe: no Prisma, Auth.js, cookies, environment, network, or clone imports.

- [ ] **Step 5: Add additive Prisma expansion and SQL migration**

Add the fields exactly to `Order`. The SQL migration uses quoted camel-case column names, `INTEGER NOT NULL DEFAULT 0` for `serviceAmount`, nullable types for every other new field, and no backfill query. Do not alter `shippingMethod`, current order status enum, `Payment`, `OrderItem`, or review tables.

- [ ] **Step 6: Run GREEN and broad schema checks**

Run:

```powershell
npx vitest run tests/phase-4-schema-contract.test.ts tests/checkout-domain.test.ts tests/checkout-dto.test.ts tests/yookassa-provider-contract.test.ts tests/order-snapshot.test.ts tests/order-shipping.test.ts
npx prisma validate
npm run prisma:generate
npm run typecheck
npx prettier --check prisma/schema.prisma prisma/migrations/20260816_phase4_delivery_snapshots/migration.sql constants/config.ts services/dto/checkout.dto.ts lib/checkout-domain.ts tests/phase-4-schema-contract.test.ts tests/checkout-domain.test.ts tests/checkout-dto.test.ts tests/yookassa-provider-contract.test.ts
git diff --check
```

Expected: all focused tests and Prisma validation pass; generated client/typecheck pass; existing snapshot tests still pass.

- [ ] **Step 7: Commit and review**

Commit subject:

```text
feat: add delivery snapshot contracts
```

Reviewer checks reader/writer/payment/coupon map, additive-only SQL, existing-order null fallbacks, exact ADR-016 citations/values, no clone-policy inference beyond approved decision, Europe/Moscow date-only behavior, provider outcome taxonomy and audited bounded idempotency window, durable provider-correlation proof, stateless coupon proof, cart-only input contract, no contraction, and DTO/domain type consistency.

---

### Task 3: Build Authenticated Checkout Read Model and Server Quote

**Files:**

- Create: `services/dto/checkout-page.dto.ts`
- Create: `lib/checkout-page.ts`
- Create: `app/actions/checkout.ts`
- Modify: `lib/coupon.ts`
- Modify: `app/api/dadata/suggest/route.ts`
- Create: `tests/checkout-page.test.ts`
- Create: `tests/checkout-quote.test.ts`
- Modify: `tests/dadata-suggest-route.test.ts`
- Create report: `.superpowers/sdd/phase-4-task-3-report.md`

- [ ] **Step 1: Run presence-only external-service preflight**

Do not print values and do not read `.env*`. Run:

```powershell
$names = @('AUTH_SECRET','AUTH_TRUST_HOST','RESEND_API_KEY','EMAIL_FROM_TRANSACTIONAL','YOOKASSA_SHOP_ID','YOOKASSA_SECRET_KEY','YOOKASSA_MODE','DADATA_TOKEN','NEXT_PUBLIC_SITE_URL')
$names | ForEach-Object {
  $present = -not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_))
  [pscustomobject]@{ Name = $_; Present = $present }
}
[pscustomobject]@{
  Name = 'YOOKASSA_MODE=sandbox'
  Present = ([Environment]::GetEnvironmentVariable('YOOKASSA_MODE') -eq 'sandbox')
}
```

Record booleans only in the task report. Missing YooKassa or DaData credentials defer their external smoke; they do not authorize mock production behavior.

- [ ] **Step 2: Write RED read-model and quote tests**

`tests/checkout-page.test.ts` must mock cookies/Prisma and prove `getCheckoutPageDto({ userId, cookieToken, now, client })`:

- resolves the authenticated cart by `userId`, not a stolen cookie;
- reads only canonical active SKU cart lines through `cartPresentationInclude`/`buildCartDto`;
- returns all owner addresses in default-first order, bounded contact fields, server delivery options, server pickup points, and initial slots;
- maps a selected saved address as `city`, exact `street -> addressLine`, and `comment -> addressComment`, while leaving floor/lift/intercom as explicit unsaved inputs;
- returns `EMPTY_CART` when no owner cart exists instead of creating one;
- never exposes Prisma `Date`, user id, password hash, raw coupon row, provider secret, or legacy clone fixture.

`tests/checkout-quote.test.ts` must prove `getCheckoutQuote(raw)`:

- authenticates through Auth.js and owner cart;
- re-reads current SKU price, active state, stock, quantity, and cart subtotal on every call;
- normalizes/checks coupon through a transaction-compatible `checkCoupon(raw, client, now)` reader;
- resolves slot/pickup labels server-side and rejects stale/forged ids;
- quotes the exact mapped saved-address payload without parsing or changing the stored street text;
- calculates coupon, delivery, service, and final totals on the server;
- returns complete current cart/quote DTO, never a client-supplied price;
- returns typed errors for empty cart, invalid input, unavailable SKU, quantity above stock, invalid coupon, and stale slot.
- pins the shared `PAYMENT_INITIALIZATION_READY`/`PAYMENT_INITIALIZATION_PENDING`/`PAYMENT_INITIALIZATION_BLOCKED` literals and exact blocked DTO formatter without invoking provider code.

Extend DaData route tests so upstream results are narrowed to serializable suggestions containing only `value`, `city`, `region`, `street`, and `house`; absence of `DADATA_TOKEN` returns an empty list without fabricated suggestions.

- [ ] **Step 3: Run RED**

Run:

```powershell
npx vitest run tests/checkout-page.test.ts tests/checkout-quote.test.ts tests/dadata-suggest-route.test.ts tests/coupon.test.ts
```

Expected: fail on missing DTO/read model/action and raw DaData pass-through.

- [ ] **Step 4: Implement serializable checkout DTOs**

`services/dto/checkout-page.dto.ts` must define and export:

```typescript
export interface CheckoutSavedAddressDto {
  id: string;
  label: string;
  city: string;
  /** Exact Prisma Address.street value; Phase 4 does not split or parse it. */
  street: string;
  comment: string | null;
  isDefault: boolean;
}

export interface CheckoutServiceLineDto {
  id: 'carrying' | 'assembly' | 'removal';
  label: string;
  amount: number;
}

export interface CheckoutTotalsDto {
  itemsSubtotal: number;
  compareAtSubtotal: number;
  saleDiscount: number;
  couponDiscount: number;
  deliveryAmount: number;
  serviceAmount: number;
  total: number;
  itemCount: number;
  lineCount: number;
}

export interface CheckoutQuoteDto {
  cart: CartDto;
  coupon: { code: string; percent: number } | null;
  delivery: {
    method: DeliveryMethod;
    zone: DeliveryZone | null;
    slot: DeliverySlotDto;
    pickupPoint: PickupPointDto | null;
  };
  serviceLines: CheckoutServiceLineDto[];
  totals: CheckoutTotalsDto;
}
```

`CheckoutPageDto` includes contact defaults, saved addresses, initial cart, delivery options, pickup points, slots, and no database objects. The saved-address adapter mirrors the actual Phase 3 `Address` model (`label`, `city`, `street`, `comment`, `isDefault`); selecting one maps `street` directly to checkout `addressLine` and `comment` to `addressComment`. It never parses a street into house/flat and never claims saved floor/lift/intercom values exist; those order-specific fields remain explicit checkout inputs and are included in the immutable order snapshot.

The module also exports the shared serializable payment-initialization vocabulary used by Task 4 placement results and Task 7 order DTOs:

```typescript
export type PaymentInitializationStatus =
  'PAYMENT_INITIALIZATION_READY' | 'PAYMENT_INITIALIZATION_PENDING' | 'PAYMENT_INITIALIZATION_BLOCKED';

export interface BlockedPaymentInitializationDto {
  status: 'PAYMENT_INITIALIZATION_BLOCKED';
  orderNumber: number;
  heading: 'Платёж требует проверки';
  message: string;
  continuePaymentUrl: null;
  canRetryCreate: false;
  allowedActions: readonly ['OPEN_ORDER'];
}
```

For the blocked DTO, `message` is exactly `Заказ №<orderNumber> сохранён. Повторное создание платежа отключено; статус проверяется.` Task 3 tests pin the union literals, exact heading/message formatter, `continuePaymentUrl: null`, `canRetryCreate: false`, and `OPEN_ORDER` as the only checkout-side action. No Task 3 code invokes a payment provider.

- [ ] **Step 5: Implement one server-owned quote path**

`lib/checkout-page.ts` owns reusable Prisma selections and functions `getCheckoutPageDto({ userId, cookieToken, now, client })` and `buildCheckoutQuote({ userId, cookieToken, raw, now, client })`. These data functions receive an already authenticated owner id; the route and public action own Auth.js redirects/results. Use `cartPresentationInclude` and `buildCartDto`; fail closed on legacy cart lines because Phase 4 writes canonical SKUs only. The quote boundary is cart-only and does not accept a buy-now source.

Refactor `lib/coupon.ts` so `checkCoupon` accepts an optional minimal Prisma-compatible coupon reader and injected clock while preserving current call sites:

```typescript
export async function checkCoupon(
  rawCode: string,
  client: CouponReader = prisma,
  now: () => Date = () => new Date(),
): Promise<CouponCheck>;
```

`app/actions/checkout.ts` exports `getCheckoutQuote(raw): Promise<CheckoutQuoteResult>`, obtains Auth.js ownership and cookie token itself, and returns a discriminated result. No `userId`, cart id/token, price, rate, total, or buy-now identifier is accepted from the client. Coupon validation is eligibility-only because the audited `Coupon` model has no usage state; if a future usage limit is required, stop under ADR-010 rather than adding client-side or best-effort accounting.

Normalize the DaData route response rather than returning upstream JSON wholesale. This is the only DaData behavior change; keep rate limiting, bounded query, and missing-token empty fallback.

- [ ] **Step 6: Run GREEN and broad contract checks**

Run:

```powershell
npx vitest run tests/checkout-page.test.ts tests/checkout-quote.test.ts tests/dadata-suggest-route.test.ts tests/coupon.test.ts tests/coupon-status.test.ts tests/cart-presentation.test.ts
npm run typecheck
npx prettier --check services/dto/checkout-page.dto.ts lib/checkout-page.ts app/actions/checkout.ts lib/coupon.ts app/api/dadata/suggest/route.ts tests/checkout-page.test.ts tests/checkout-quote.test.ts tests/dadata-suggest-route.test.ts
git diff --check
```

Expected: focused quote/read/coupon/DaData/cart tests pass and typecheck exits 0.

- [ ] **Step 7: Commit and review**

Commit subject:

```text
feat: add server checkout quotes
```

Reviewer checks Auth.js ownership, actual `Address`-model alignment, serialization, no client arithmetic, no raw DaData leak, stateless coupon evidence, coupon clock/client compatibility, cart-only quote boundary, and exact DTO names used by later tasks.

---

### Task 4: Make Canonical Order Placement Transactional

**Files:**

- Modify: `app/actions/order.ts`
- Modify: `app/(shop)/checkout/page.tsx` only to remove legacy buy-now forwarding
- Modify: `lib/order.ts`
- Modify: `lib/checkout-page.ts`
- Modify: `lib/yookassa.ts`
- Create: `lib/payment-initialization.ts`
- Modify: `services/dto/order.dto.ts`
- Modify: `tests/place-order.test.ts`
- Modify: `tests/place-order-online.test.ts`
- Modify: `tests/order-snapshot.test.ts`
- Modify: `tests/order-coupon.test.ts`
- Create: `tests/order-transaction.test.ts`
- Create: `tests/payment-initialization.test.ts`
- Modify: `tests/yookassa-lib.test.ts`
- Create report: `.superpowers/sdd/phase-4-task-4-report.md`

- [ ] **Step 1: Write RED transaction and canonical-SKU tests**

Replace old compensation-oriented expectations with tests that prove:

- one `prisma.$transaction` with `Serializable` isolation re-reads the owned cart, coupon, current SKU price/stock, delivery selection, and services;
- order row, immutable `OrderItem` snapshots, conditional SKU decrements, and deletion of only the placed owner cart items occur through the same transaction client;
- no `ProductVariant` lookup/update and no buy-now identifier is used for new writes;
- stock failure on any line aborts the transaction and leaves no order/items/decrements committed;
- transaction `P2034` retries are bounded to three attempts and a final conflict returns an honest retry error;
- persisted order fields include server-computed `itemsTotal`, `discountAmount`, `shippingAmount`, `serviceAmount`, `totalAmount`, coupon, delivery zone/date/window, pickup-point snapshot, floor/lift/intercom, and `serviceDetails`;
- submitted client totals/rates/labels/stock are ignored because schemas do not accept them;
- the audited stateless coupon is read in the transaction and snapshot on the order, with no nonexistent usage mutation or compensation invented;
- once the transaction commits, the cart is empty and retrying the same browser submission cannot create another order from the same cart.

Online tests must additionally prove:

- YooKassa receives the transaction-created order id/number and server total;
- a local `Payment` row stores provider id, pending status, amount, confirmation URL;
- `createPayment` still uses idempotency key `payment-<orderId>` and metadata `orderNumber`, and `getPaymentDetails` returns provider id/status/amount/metadata/confirmation URL for verified recovery;
- provider-create outcomes are total and explicit: `NOT_CREATED` only when the provider explicitly rejects before creation and a lookup proves no object; `CREATED` when a provider object/id is returned or lookup proves one; `INDETERMINATE` for timeout, network/5xx, malformed response, or absent proof;
- verified `NOT_CREATED` invokes exactly one local cancellation/restoration transaction guarded by `PENDING` order state, while `CREATED` and `INDETERMINATE` preserve the durable order/stock and never delete or restore them during initialization;
- retry/order-page continuation invokes `ensureOnlinePayment` with the same idempotency key only before the audited provider retention deadline `createdAt + T`, verifies provider amount/metadata against the durable order, and creates/upserts the one local `Payment` correlation;
- after `T`, no new provider create call is issued unless the provider contract separately proves the original key cannot create/replay a payment. The order exposes `PAYMENT_INITIALIZATION_BLOCKED` for manual/provider investigation; no unsafe auto-release, fake success, or stock restoration occurs;
- the blocked placement result contains the exact Task 3 heading/message, durable order number, `continuePaymentUrl: null`, `canRetryCreate: false`, and `allowedActions: ['OPEN_ORDER']`; serialization tests reject any provider URL, retry-create action, or success flag on this branch;
- provider success plus three injected local payment-write failures leaves exactly one pending order, its stock reserved once, and the same provider id recoverable on a later retry;
- definitive provider rejection, network timeout, local `Payment` write failure, late retry after `T`, and webhook/resync recovery each have focused tests proving exactly-once stock effects;
- a conflicting provider id/order/amount fails closed and stops under ADR-010 rather than reassigning correlation;
- COD never creates or cancels provider payment.

- [ ] **Step 2: Run RED**

Run:

```powershell
npx vitest run tests/place-order.test.ts tests/place-order-online.test.ts tests/order-transaction.test.ts tests/order-snapshot.test.ts tests/order-coupon.test.ts tests/payment-initialization.test.ts tests/yookassa-lib.test.ts
```

Expected: fail because current implementation decrements stock and creates order/items outside one transaction, still accepts legacy buy-now variants, and has no provider outcome taxonomy/retry bound.

- [ ] **Step 3: Share quote/snapshot logic with the transaction**

Expose a transaction-compatible cart quote builder from `lib/checkout-page.ts`; do not call the public server action from `placeOrder`. `lib/order.ts` retains `buildOrderSnapshot` and `formatOrderItemConfiguration`, removes the old flat two-method `calcShipping` authority, and adds typed helpers for serializing service details and the resolved delivery snapshot.

`services/dto/order.dto.ts` must consume or re-export the canonical `placeOrderSchema` and `PlaceOrderInput` from `services/dto/checkout.dto.ts` while retaining bounded order-result types. It must not define a second place-order input schema. Its blocked branch reuses `BlockedPaymentInitializationDto` exactly: `{ ok: false, code: 'PAYMENT_INITIALIZATION_BLOCKED', paymentInitialization: BlockedPaymentInitializationDto }`. The pending and ready branches remain distinct, so a blocked result cannot carry a provider redirect or continue-payment URL.

Remove the current checkout page's `buyNow` query forwarding in the same task so the intermediate commit does not call the new cart-only action with a rejected legacy key. The full route/UI replacement remains Task 6.

Keep legacy `OrderItem.productVariantId` read compatibility, but new snapshots set canonical `skuId`, article, combination key, product slug, configuration JSON, image, current unit/old price, quantity, and line total. Preserve the proven stateless coupon behavior: eligibility is read inside the transaction and the accepted code/discount are snapshotted; there is no `CouponUsage` model or writer to mutate. If the audit discovers usage state, stop under ADR-010 and add transactional consumption plus rollback before continuing.

`lib/payment-initialization.ts` owns `ensureOnlinePayment({ orderId, now, client })` and returns `NOT_CREATED`, `CREATED`, `INDETERMINATE`, or `BLOCKED_AFTER_RETRY_WINDOW`. It derives the existing idempotency key from the durable order id, invokes YooKassa only inside the audited retention window `T`, verifies provider details against unique order number and exact amount, and idempotently persists the provider-id `Payment`. A separate `cancelUncreatedPayment` transaction conditionally cancels/restores only a verified `NOT_CREATED` order. `lib/yookassa.ts` adds bounded `getPaymentDetails` and provider-error classification; no provider secret or raw payload crosses the module boundary.

- [ ] **Step 4: Implement serializable transactional placement**

`placeOrder` flow:

1. Authenticate with Auth.js; parse strict `placeOrderSchema`.
2. Resolve owner cart token without creating a cart.
3. For online payment, validate sandbox configuration before the database transaction so a known local configuration error cannot strand an order.
4. Run a bounded three-attempt serializable transaction.
5. Inside each attempt, rebuild the cart quote from current database state, conditionally decrement every canonical SKU, create `Order` plus all `OrderItem` snapshots, and delete only that owner cart's placed items through `tx`.
6. COD returns durable success after commit. Online calls `ensureOnlinePayment`; ready correlation returns the confirmation URL, verified `NOT_CREATED` performs exactly-once local cancellation/restoration, while `CREATED`/`INDETERMINATE` returns `PAYMENT_INITIALIZATION_PENDING` with the durable order number and keeps stock/order correlation intact. After `T`, return `PAYMENT_INITIALIZATION_BLOCKED` and do not create/release automatically.
7. Adjust sales count and save the actual `city/addressLine/addressComment` fields as existing non-critical post-commit behavior; log failures without rewriting money/stock/payment state.
8. Return a discriminated result: COD ready, online redirect ready, verified-not-created canceled, online initialization pending, or the exact `PAYMENT_INITIALIZATION_BLOCKED` DTO with durable `orderNumber`, blocked heading/message, `continuePaymentUrl: null`, `canRetryCreate: false`, and checkout-side `allowedActions: ['OPEN_ORDER']`. Never return internal ids, tokens, provider secrets, or untrusted totals. The UI routes pending/blocked initialization to the real order page; blocked state never offers a duplicate checkout submission, provider redirect, or create retry after `T`.

Delete outdated comments claiming the current Neon adapter lacks transaction/nested-create support; `lib/prisma-client.ts` explicitly uses the WebSocket adapter that supports them.

- [ ] **Step 5: Run GREEN and broad contract checks**

Run:

```powershell
npx vitest run tests/place-order.test.ts tests/place-order-online.test.ts tests/order-transaction.test.ts tests/order-snapshot.test.ts tests/order-coupon.test.ts tests/payment-initialization.test.ts tests/yookassa-lib.test.ts tests/checkout-quote.test.ts tests/cart-route-canonical.test.ts
npm run typecheck
npx prettier --check app/actions/order.ts app/'(shop)'/checkout/page.tsx lib/order.ts lib/checkout-page.ts lib/yookassa.ts lib/payment-initialization.ts services/dto/order.dto.ts tests/place-order.test.ts tests/place-order-online.test.ts tests/order-transaction.test.ts tests/order-snapshot.test.ts tests/order-coupon.test.ts tests/payment-initialization.test.ts tests/yookassa-lib.test.ts
git diff --check
```

Expected: all focused order/quote/cart tests pass and typecheck exits 0.

- [ ] **Step 6: Commit and review**

Commit subject:

```text
feat: create furniture orders transactionally
```

Reviewer checks cart/order/stock atomicity, `NOT_CREATED`/`CREATED`/`INDETERMINATE` taxonomy, audited bounded retry window `T`, no delete/restore after provider invocation without proof, stateless coupon proof, canonical SKU-only cart writes, durable idempotent provider correlation, post-window blocked state, ownership, server totals, snapshot completeness, and no admin/refund/outbox expansion.

---

### Task 5: Harden Payment Reconciliation and Customer Cancellation

**Files:**

- Modify: `lib/payment-sync.ts`
- Modify: `lib/payment-initialization.ts`
- Modify: `lib/yookassa.ts`
- Modify: `app/actions/order.ts`
- Modify: `app/api/yookassa/webhook/route.ts`
- Modify: `tests/payment-sync.test.ts`
- Modify: `tests/cancel-order.test.ts`
- Modify: `tests/yookassa-webhook.test.ts` only for changed result/type expectations
- Modify: `tests/cancel-order-dialog.test.ts`
- Create report: `.superpowers/sdd/phase-4-task-5-report.md`

- [ ] **Step 1: Write RED reconciliation/cancellation tests**

Extend tests to prove:

- `pending -> succeeded` changes payment and `PENDING -> PROCESSING` order in one serializable transaction;
- `pending -> canceled` changes payment/order and restores canonical SKU stock in the same transaction;
- repeated webhook/return-page events remain idempotent and never restore stock twice;
- final-state conflicts remain ignored;
- a pre-existing final local payment with a stale `PENDING` order is repaired without duplicating inventory effects;
- cancellation side effects use canonical SKU, with legacy ProductVariant only as read compatibility;
- Auth.js owner mismatch and non-`PENDING` orders return the same safe failure without provider or stock mutation;
- COD cancellation uses one local transaction;
- a webhook for a provider id with no local `Payment` loads verified provider details, correlates only an online `PENDING` order by exact metadata order number and amount, creates the missing local `Payment` idempotently, and then reconciles;
- webhook recovery rejects missing/forged metadata, amount mismatch, non-online/final orders, and conflicting existing payment correlation without changing stock;
- an online order page with no local `Payment` calls `ensureOnlinePayment` with the same idempotency key and then reconciles the verified status;
- online cancellation first ensures durable provider correlation, calls YooKassa cancellation, reloads the provider status, and does not mutate local order/payment/stock until `canceled` is verified;
- a verified `NOT_CREATED` initialization outcome uses the guarded local cancellation/restoration transaction exactly once; an `INDETERMINATE` or `BLOCKED_AFTER_RETRY_WINDOW` outcome never releases stock;
- provider cancel failure/timeout or non-final status returns `CANCELLATION_PENDING_SYNC`, leaves local order/payment/stock unchanged, and remains recoverable by retry/webhook/order-page resync;
- verified provider cancellation followed by an injected local transaction failure also returns `CANCELLATION_PENDING_SYNC`; a later webhook/resync applies local payment/order/stock cancellation exactly once;
- successful online cancellation marks local payment canceled through reconciliation and restores stock once;
- cancellation still calls `pruneReviewsAfterCancel` for unique product ids after the committed transition.

- [ ] **Step 2: Run RED**

Run:

```powershell
npx vitest run tests/payment-sync.test.ts tests/cancel-order.test.ts tests/yookassa-webhook.test.ts tests/cancel-order-dialog.test.ts
```

Expected: fail because current payment/order/stock writes are split, missing-payment webhooks cannot recover correlation, and online cancellation lacks verified/provider-first recovery semantics.

- [ ] **Step 3: Put final payment/order/inventory transitions behind one transaction**

Refactor `reconcilePaymentStatus` so it re-reads the payment/order inside a serializable transaction, conditionally applies the allowed transition, and restores stock only after winning `PENDING -> CANCELLED`. Preserve structured results and current webhook/order-page callers. Sales-count adjustment and review pruning may run after commit, keyed by the transition result; money/order/stock must not be partially committed. `payment.status`, `order.status`, and stock increments share the same winning transaction, so a retry after commit observes a final state and cannot increment twice.

Add `recoverPaymentCorrelation(providerId)` for webhook/resync. It loads provider details from YooKassa, treats provider data—not notification metadata—as authoritative, requires exact unique order number, exact amount, `paymentMethod: 'online'`, and a compatible pending order, then creates the missing provider-id `Payment` idempotently. A conflict returns a structured ignored/error result and preserves the durable order/stock for investigation; it never guesses another order.

Refactor `cancelOrder`:

- authenticate and load only an owned `PENDING` order;
- for online payment, call `ensureOnlinePayment` first if the local `Payment` is absent; if provider correlation/status remains indeterminate, return `CANCELLATION_PENDING_SYNC` and preserve local state;
- if `ensureOnlinePayment` proves `NOT_CREATED`, call the guarded local cancellation transaction; if it returns `BLOCKED_AFTER_RETRY_WINDOW`, expose manual/provider investigation and preserve local state;
- call `cancelPayment(providerId)`, then load verified provider details; only verified `canceled` enters the shared reconciliation transaction;
- if the provider is canceled but the local transaction fails, return `CANCELLATION_PENDING_SYNC`; retry/webhook/order-page resync loads the same terminal provider state and applies it exactly once;
- for COD, use the same local cancellation transaction without provider calls;
- revalidate profile and order paths only after success.

Do not add refunds or allow cancellation of succeeded/processing orders.

- [ ] **Step 4: Run GREEN**

Run:

```powershell
npx vitest run tests/payment-sync.test.ts tests/payment-initialization.test.ts tests/yookassa-lib.test.ts tests/cancel-order.test.ts tests/yookassa-webhook.test.ts tests/cancel-order-dialog.test.ts tests/review.test.ts tests/submit-review.test.ts
npm run typecheck
npx prettier --check lib/payment-sync.ts lib/payment-initialization.ts lib/yookassa.ts app/actions/order.ts app/api/yookassa/webhook/route.ts tests/payment-sync.test.ts tests/payment-initialization.test.ts tests/yookassa-lib.test.ts tests/cancel-order.test.ts tests/yookassa-webhook.test.ts tests/cancel-order-dialog.test.ts
git diff --check
```

Expected: all focused reconciliation/cancellation/review tests pass; typecheck exits 0.

- [ ] **Step 5: Commit and review**

Commit subject:

```text
fix: harden payment and cancellation transitions
```

Reviewer checks missing-payment recovery by verified metadata/amount, provider-confirmed customer cancellation, provider-canceled/local-failure recovery, transactional inventory gate, repeated-event idempotency, final-state conflicts, review pruning, and preservation of webhook source verification.

---

### Task 6: Port Checkout Variant A to Production State

**Files:**

- Create: `components/evironn/checkout/checkout-variant-a.tsx`
- Create: `components/evironn/checkout/checkout-primitives.tsx`
- Create: `components/evironn/checkout/use-checkout-variant-a.ts`
- Create: `styles/evironn/CheckoutVariantA.css`
- Create: `styles/evironn/CheckoutPrimitives.css`
- Modify: `app/(shop)/checkout/page.tsx`
- Modify: `app/(shop)/checkout/loading.tsx`
- Delete after replacement passes: `components/shared/checkout/checkout-form.tsx`
- Modify or reuse: `components/shared/checkout/address-suggest.tsx`
- Modify: `components/evironn/cart/cart-variant-a.tsx`
- Modify: `tests/evironn-cart-source-contract.test.ts`
- Modify: `tests/evironn-cart-variant-a.test.tsx`
- Create: `tests/evironn-checkout-source-contract.test.ts`
- Create: `tests/evironn-checkout-variant-a.test.tsx`
- Create: `tests/evironn-checkout-assets.test.ts`
- Create report: `.superpowers/sdd/phase-4-task-6-report.md`

- [ ] **Step 1: Write RED source, UI, and cart-entry tests**

Checkout source tests must require:

- production files import no clone `useCheckout`, `checkoutState`, `useCart`, fixture cart/profile data, card-number validation, or fake payment timers;
- route authenticates on the server and passes only `CheckoutPageDto` to the client shell;
- all quote-changing actions call `getCheckoutQuote` and replace the displayed server quote;
- submit calls `placeOrder`, redirects to YooKassa URL only for ready online correlation, routes COD and `PAYMENT_INITIALIZATION_PENDING` to `/orders/<number>?placed=1` with truthful state, and handles `PAYMENT_INITIALIZATION_BLOCKED` as a separate terminal checkout result;
- blocked checkout renders `Платёж требует проверки` and `Заказ №<number> сохранён. Повторное создание платежа отключено; статус проверяется.`, shows the durable order number, sets `continuePaymentUrl` to null, locks the submit path against repeat create, offers only navigation to the real order page, and never redirects to YooKassa or reports success;
- three visible receiving modes: courier, showroom, pickup point;
- showroom and selectable pickup points render only the ids/facts accepted in the policy ADR, with no hard-coded clone fixture count or address;
- courier exposes Moscow/Moscow Region, address, floor/lift, carrying, assembly, removal, and server slots;
- online/cod labels are truthful, and demo/sandbox copy states money is not charged when `NEXT_PUBLIC_DEMO_MODE === 'true'`;
- quote errors, stale stock, coupon errors, submit errors, loading, empty cart, and mobile summary states are rendered and announced;
- quantity/remove actions use existing canonical cart store snapshots, clear stale coupon state, and re-quote after success;
- no `Math.floor`, rate constant, percentage calculation, or total arithmetic exists in client checkout files.

Cart tests must replace the Phase 3 disabled CTA contract with enabled links to `/checkout` on desktop/mobile when every line is available, and disabled honest controls when cart is empty/unavailable/loading.

- [ ] **Step 2: Run RED**

Run:

```powershell
npx vitest run tests/evironn-checkout-source-contract.test.ts tests/evironn-checkout-variant-a.test.tsx tests/evironn-checkout-assets.test.ts tests/evironn-cart-source-contract.test.ts tests/evironn-cart-variant-a.test.tsx
```

Expected: fail because Checkout A production files do not exist and cart controls remain Phase 3-disabled.

- [ ] **Step 3: Copy exact CSS and preserve fingerprints**

Copy without semantic rewriting:

- `D:\Новая папка (2)\evironn-clone\src\checkout\CheckoutVariantA.css` to `styles/evironn/CheckoutVariantA.css`; expected SHA-256 `4EF7DF1ADABF1B2B0731F03C71A3E292F86E936ED5ACADCC5CFA69FB2F3F0E31`.
- `D:\Новая папка (2)\evironn-clone\src\checkout\CheckoutPrimitives.css` to `styles/evironn/CheckoutPrimitives.css`; expected SHA-256 `A6862F4B6C18A5B2914823B70238832437167CDB55429C68AC06E76778E0D04B`.

The asset test compares source and target bytes/hash. If Next-specific CSS import placement requires a wrapper change, keep target CSS bytes exact and change only TypeScript import location.

- [ ] **Step 4: Port primitives and replace mock controller**

Port `CheckoutVariantA` and `CheckoutPrimitives` JSX/class structure from the clone. Adapt imports to existing Evironn cart primitives, `next/link`, and production DTOs. Required incompatibility edits:

- `ReceivePicker` renders `courier`, `showroom`, and `pickup-point` while keeping clone classes;
- `PaymentPicker` maps visible card-online choice to `online` and cash-on-delivery to `cod`; omit raw card fields;
- `AddressBook` consumes owner `CheckoutSavedAddressDto[]`, not clone constants;
- selecting an address maps exact `street -> addressLine` and `comment -> addressComment`; the UI does not split saved street text into house/flat, and floor/lift/intercom remain explicit current-order inputs. Manual/DaData street and house presentation fields may be composed into one trimmed `addressLine` by the controller, but a saved `addressLine` is always preserved byte-for-text after trimming rather than parsed;
- `SlotPicker`, pickup points, labels, prices, order lines, promo totals, service lines, and final total come from server DTOs;
- unsupported mock success card is replaced by real navigation after `placeOrder` success.

`use-checkout-variant-a.ts` owns local form inputs and pending/error state only. It uses existing `useCartStore` for quantity/remove snapshots, `getCheckoutQuote` for authoritative quotes, and `placeOrder` for submit. Use request revision tokens so stale quote responses cannot overwrite a newer form/cart state. Never optimistic-update money values.

After a blocked placement result, the controller stores the exact serialized blocked DTO, sets a terminal `submitLocked` state, disables every repeat-order/create control, and calls only `router.replace('/orders/<number>?placed=1')`. If navigation is delayed or fails, Checkout A keeps the exact blocked heading/message and one `Открыть заказ №<number>` action visible. It never calls `placeOrder` again, never uses a provider URL, and never converts blocked state to pending or success.

- [ ] **Step 5: Replace route and enable cart entry**

`app/(shop)/checkout/page.tsx` authenticates, resolves owner cart/user DTO, redirects signed-out to `/login?callbackUrl=%2Fcheckout`, redirects empty cart to `/cart`, rejects/ignores legacy `buyNow` query parameters rather than forwarding them to the cart-only contract, sets Evironn metadata, and renders `CheckoutVariantA`.

Update Cart Variant A desktop/mobile checkout controls to real `/checkout` links when current canonical cart items are available. Preserve accepted Cart A CSS/classes; update only the Phase 4 source tests and behavior assertions.

Delete the inherited shared checkout form only after zero production import proof:

```powershell
rg -n "components/shared/checkout/checkout-form|CheckoutForm" app components tests
```

- [ ] **Step 6: Run GREEN and UI-focused checks**

Run:

```powershell
npx vitest run tests/evironn-checkout-source-contract.test.ts tests/evironn-checkout-variant-a.test.tsx tests/evironn-checkout-assets.test.ts tests/evironn-cart-source-contract.test.ts tests/evironn-cart-variant-a.test.tsx tests/checkout-page.test.ts tests/checkout-quote.test.ts tests/checkout-defaults.test.ts tests/checkout-sandbox-copy.test.ts
npm run typecheck
npx prettier --check components/evironn/checkout/checkout-variant-a.tsx components/evironn/checkout/checkout-primitives.tsx components/evironn/checkout/use-checkout-variant-a.ts app/'(shop)'/checkout/page.tsx app/'(shop)'/checkout/loading.tsx components/shared/checkout/address-suggest.tsx components/evironn/cart/cart-variant-a.tsx tests/evironn-checkout-source-contract.test.ts tests/evironn-checkout-variant-a.test.tsx tests/evironn-checkout-assets.test.ts tests/evironn-cart-source-contract.test.ts tests/evironn-cart-variant-a.test.tsx
git diff --check
```

Expected: checkout/cart focused suites pass, exact CSS hashes match, typecheck exits 0.

- [ ] **Step 7: Commit and review**

Commit subject:

```text
feat: port production checkout variant a
```

Reviewer checks exact CSS, clone class/interaction preservation, all three policy-approved methods, actual saved-address mapping, server-only money, stale-response protection, cart-only canonical integration, distinct pending/blocked payment-initialization states, blocked repeat-create lock and exact copy, no fake card/payment state, and desktop/mobile text fit.

---

### Task 7: Port Order Variant A and Complete Verified-Purchase Reviews

**Files:**

- Create: `services/dto/order-page.dto.ts`
- Create: `lib/order-page.ts`
- Create: `components/evironn/order/order-variant-a.tsx`
- Create: `components/evironn/order/order-primitives.tsx`
- Create: `components/evironn/order/use-order-variant-a.ts`
- Create: `styles/evironn/OrderVariantA.css`
- Create: `styles/evironn/OrderPrimitives.css`
- Rewrite: `app/(shop)/orders/[number]/page.tsx`
- Modify: `app/(shop)/orders/[number]/loading.tsx`
- Modify: `app/actions/order.ts`
- Reuse or adapt: `components/shared/product/review-form.tsx`
- Reuse or adapt: `components/shared/orders/cancel-order-button.tsx`
- Create: `tests/order-page-dto.test.ts`
- Create: `tests/order-payment-actions.test.ts`
- Rewrite: `tests/order-page-canonical.test.ts`
- Create: `tests/evironn-order-source-contract.test.ts`
- Create: `tests/evironn-order-variant-a.test.tsx`
- Create: `tests/evironn-order-assets.test.ts`
- Modify: `tests/review.test.ts`
- Modify: `tests/submit-review.test.ts`
- Create report: `.superpowers/sdd/phase-4-task-7-report.md`

- [ ] **Step 1: Write RED order DTO/UI/review tests**

`OrderPageDto` tests must prove:

- Auth.js user id scopes the query; foreign/missing numbers return `NOT_FOUND` without leaking existence;
- pending online payment with or without a local `Payment` first ensures or recovers durable provider correlation, performs verified provider status reconciliation, then refetches on applied/repaired transitions;
- canonical immutable snapshots render without live SKU/product dependency; product href exists only when a live slug is available;
- new delivery/service snapshots render exactly, while old orders with null fields fall back to current created-at/address/shipping values;
- a Phase 4 delivery day renders from the stored `YYYY-MM-DD` sentinel without browser/server timezone shift, including UTC/Moscow midnight boundary fixtures;
- status maps `PENDING/PROCESSING/SHIPPED/DELIVERED/CANCELLED` to clone-compatible placed/collecting/on-way/delivered/cancelled UI stages;
- payment summary distinguishes pending online, succeeded online, canceled online, and COD; the summary heading never says paid for pending/COD;
- `payment.initialization` is a serializable discriminated union. Its blocked branch is `{ status: 'PAYMENT_INITIALIZATION_BLOCKED', orderNumber, heading: 'Платёж требует проверки', message: 'Заказ №<number> сохранён. Повторное создание платежа отключено; статус проверяется.', continuePaymentUrl: null, canRetryCreate: false, allowedActions }`;
- blocked `allowedActions` initially contains only `RESYNC_PAYMENT`; it may include `CANCEL_ORDER` only after the latest server-side provider lookup proves a correlatable payment can be canceled or proves `NOT_CREATED` so guarded local cancellation is safe. It never contains `CONTINUE_PAYMENT` or `RETRY_CREATE`;
- `canCancel` is true only for owned `PENDING` orders whose COD state or latest provider proof permits the existing safe cancellation path; `continuePaymentUrl` is exposed only for a provider-correlated ready payment inside `T`, never for pending-indeterminate or blocked state;
- blocked order-page reads and safe resync are lookup/reconciliation-only: they do not automatically create or cancel a provider payment, do not issue a create call after `T`, and preserve the order/stock until provider proof allows a safe transition;
- review targets use `getReviewEligibility`/shared purchase predicate per unique product: online requires succeeded payment, COD requires `DELIVERED`, canceled/pending COD is not eligible, already-reviewed is read-only;
- service lines and money satisfy `itemsSubtotal - couponDiscount + deliveryAmount + serviceAmount === total` from stored snapshots, not reconstructed clone mock math.

UI/source tests must forbid clone `useOrder`, `orderState`, `findOrder`, `createProfileData`, fixture courier contacts, fake support submission, fake document download, fake rating toast, and fake recommendations. They also assert exact blocked copy/order number, no blocked `continuePaymentUrl`, no automatic create/cancel on render, disabled repeat create, lookup-only `RESYNC_PAYMENT`, and `CANCEL_ORDER` only when the DTO carries provider-proven permission. Supported actions are safe resync, proof-gated real cancel, ready-only continue payment, product/catalog navigation, and product review submission.

`tests/order-payment-actions.test.ts` proves `resyncOrderPayment(orderNumber)` authenticates the owner, performs provider lookup/reconciliation only after `T`, never calls provider create/cancel, returns the refreshed blocked DTO when proof remains absent, and exposes `CANCEL_ORDER` only after verified provider state makes the existing cancellation path safe. Foreign/final orders fail without provider mutation.

- [ ] **Step 2: Run RED**

Run:

```powershell
npx vitest run tests/order-page-dto.test.ts tests/order-payment-actions.test.ts tests/order-page-canonical.test.ts tests/evironn-order-source-contract.test.ts tests/evironn-order-variant-a.test.tsx tests/evironn-order-assets.test.ts tests/review.test.ts tests/submit-review.test.ts tests/order-links.test.ts
```

Expected: fail because production order DTO/Variant A files do not exist and the old page derives review access with a looser predicate.

- [ ] **Step 3: Copy exact CSS and preserve fingerprints**

Copy without semantic rewriting:

- `D:\Новая папка (2)\evironn-clone\src\order\OrderVariantA.css` to `styles/evironn/OrderVariantA.css`; expected SHA-256 `86EC6B153D735D05C1AA9F6E89E56FD20E4179CFE6F8D445624B065E8933927D`.
- `D:\Новая папка (2)\evironn-clone\src\order\OrderPrimitives.css` to `styles/evironn/OrderPrimitives.css`; expected SHA-256 `2B9B742C16BE4F51E57D823132AAC14D27E1FD2DCCDAED7D1586F4BC807209A1`.

- [ ] **Step 4: Implement bounded owner-scoped order DTO**

`lib/order-page.ts` owns the exact Prisma selection and exports `getOrderPageDto({ userId, orderNumber })`. `services/dto/order-page.dto.ts` exports serializable status/payment-initialization/delivery/items/money/review-target types and reuses the Task 3 status literals. Instants cross as ISO; promised delivery days cross only as `YYYY-MM-DD` plus a preformatted `Europe/Moscow` label derived by the shared date-only helper. No client/server-local `Date` parsing and no Prisma object crosses the boundary.

For an online order after `createdAt + T` without safe correlation, `getOrderPageDto` performs only provider lookup/reconciliation permitted by the audited contract and returns `PAYMENT_INITIALIZATION_BLOCKED`. It must not invoke provider create or cancel automatically. `resyncOrderPayment(orderNumber)` is owner-scoped and lookup/reconciliation-only after `T`; it refreshes the DTO. The existing `cancelOrder` action remains proof-gated and is not exposed until the refreshed DTO includes `CANCEL_ORDER`.

For old rows, fallback rules are explicit:

- null `deliveryDate` uses `createdAt` only as an order-date display, not a promised delivery date;
- null `deliveryWindow` renders `Срок согласует менеджер`;
- null `serviceDetails` is an empty list and `serviceAmount` remains zero;
- `shippingMethod === 'pickup'` plus null `pickupPointId` renders neutral `Самовывоз` using stored city/address facts; it is never called showroom;
- showroom renders only when `pickupPointId`, name, and address match the exact approved server-owned showroom snapshot; a non-showroom id renders pickup point from its immutable snapshot, and an unknown/incomplete id remains neutral `Пункт выдачи` rather than being guessed;
- absent live product relation keeps snapshot name/image/configuration and routes to `/catalog`.

- [ ] **Step 5: Port Order A against real DTO/actions**

Port clone `OrderVariantA` and primitives class/JSX structure. Replace controller contracts with production props/state:

- initial order DTO from server;
- `placed` from `searchParams.placed === '1'`;
- cancel action calls `cancelOrder(order.id)`, keeps `CANCELLATION_PENDING_SYNC` visible as a truthful retry/resync state, and refreshes only after applied cancellation;
- ready continue-payment uses only a verified server correlation URL inside `T`; pending shows `PAYMENT_INITIALIZATION_PENDING` without fake failure/success;
- blocked renders the exact `Платёж требует проверки` heading and durable-order message, no continue URL/provider redirect, no retry-create control, a `Проверить статус платежа` lookup-only resync action, and a cancel action only when `allowedActions` contains provider-proven `CANCEL_ORDER`;
- review section renders the existing production `ReviewForm` in `.ord-rate` styling for each eligible product, read-only copy for already-reviewed/not-purchased states;
- unsupported courier contact, support form, document download, reorder, and mock also-buy actions are not rendered unless backed by an existing production action/DTO.

Rewrite `app/(shop)/orders/[number]/page.tsx` as the authenticated Server Component adapter. Preserve provider resync and `notFound` ownership behavior. Remove old Tailwind page composition only after replacement tests pass.

- [ ] **Step 6: Run GREEN and broad order/review checks**

Run:

```powershell
npx vitest run tests/order-page-dto.test.ts tests/order-payment-actions.test.ts tests/order-page-canonical.test.ts tests/evironn-order-source-contract.test.ts tests/evironn-order-variant-a.test.tsx tests/evironn-order-assets.test.ts tests/review.test.ts tests/submit-review.test.ts tests/order-links.test.ts tests/payment-sync.test.ts tests/cancel-order.test.ts tests/profile-page-dto.test.ts
npm run typecheck
npx prettier --check services/dto/order-page.dto.ts lib/order-page.ts app/actions/order.ts components/evironn/order/order-variant-a.tsx components/evironn/order/order-primitives.tsx components/evironn/order/use-order-variant-a.ts app/'(shop)'/orders/'[number]'/page.tsx app/'(shop)'/orders/'[number]'/loading.tsx tests/order-page-dto.test.ts tests/order-payment-actions.test.ts tests/order-page-canonical.test.ts tests/evironn-order-source-contract.test.ts tests/evironn-order-variant-a.test.tsx tests/evironn-order-assets.test.ts tests/review.test.ts tests/submit-review.test.ts
git diff --check
```

Expected: focused order/payment/cancel/review/profile regressions pass, CSS hashes match, typecheck exits 0.

- [ ] **Step 7: Commit and review**

Commit subject:

```text
feat: port production order variant a
```

Reviewer checks owner scope, immutable snapshots, neutral legacy pickup, Europe/Moscow date-only rendering, missing-payment recovery, exact blocked DTO/copy, no blocked continue/retry-create path, lookup-only safe resync, proof-gated cancellation, truthful pending-sync headings/actions, exact CSS, no fabricated clone state, and shared verified-purchase predicate.

---

### Task 8: Add Phase 4 Safe Database Fixtures and Critical E2E Scenarios

**Files:**

- Create: `e2e/phase4-database.ts`
- Create: `e2e/database-readiness.ts`
- Create: `e2e/database-command-report.ts`
- Create: `scripts/e2e-prisma-migrate.ts`
- Modify: `e2e/helpers.ts`
- Rewrite: `e2e/checkout.spec.ts`
- Rewrite: `e2e/yookassa.spec.ts`
- Rewrite: `e2e/review.spec.ts`
- Create: `e2e/order.spec.ts`
- Modify: `playwright.config.ts` only if the test process needs an explicit safe helper environment
- Modify: `tests/e2e-database-guard.test.ts`
- Create: `tests/phase-4-e2e-safety-contract.test.ts`
- Create report: `.superpowers/sdd/phase-4-task-8-report.md`

- [ ] **Step 1: Write RED safety contract**

`tests/phase-4-e2e-safety-contract.test.ts` must scan Phase 4 E2E files and require:

- every generated email/id includes a `phase4-e2e-<run-id>` namespace;
- database helper obtains URLs only through `resolveE2eDatabaseEnvironment(process.env)`;
- readiness and migration sources never inherit or forward subprocess stdout/stderr; the real Prisma deploy runs only through `scripts/e2e-prisma-migrate.ts` with piped capture and allowlisted `DatabaseCommandReport` output;
- command reports may contain only exit status, allowlisted error category, migration names/counts, booleans, and fingerprints; tests fail on URL, hostname, database name, username, query, password, raw stdout/stderr fields, `stdio: 'inherit'`, or direct `npx prisma migrate deploy` outside the wrapper;
- representative Prisma success/error fixtures containing a full URL, host, database, username, query, and password are captured in memory by tests; serialized `DatabaseCommandReport` output must contain none of those raw substrings, and an unrecognized error maps to `UNRECOGNIZED_DATABASE_COMMAND_ERROR` without forwarding message/stack text;
- setup creates a namespace-owned active furniture `Product`, canonical sellable `Sku`, required product/option/media joins, and exact namespace coupon; tests never decrement a shared seed SKU or consume a shared coupon;
- after browser registration/verification, a guarded helper resolves only that exact namespace email/user/cart and inserts the namespace SKU cart line; no write scenario navigates a namespace PDP or depends on product-route expansion;
- ADR-013 remains unchanged: the contract reads `app/(shop)/product/[slug]/page.tsx`, `lib/showcase-product.ts`, `tests/product-page-canonical.test.tsx`, and `tests/evironn-catalog-source-contract.test.ts`; it requires the `slug !== SHOWCASE_PRODUCT_SLUG` guard, redirect through the default showcase canonical path, the single showcase DTO authority, and catalog-card showcase routing, forbids `/product/<namespace-slug>` navigation in every Phase 4 E2E source, and fails if fixture setup or redirect/showcase resolution substitutes a shared Noma SKU;
- cleanup first resolves exact namespace product/SKU/coupon/user/order/cart/wishlist ids, then deletes dependent rows with `where: { ...Id: { in: ownedIds } }` or exact namespace predicates inside one serializable transaction;
- cleanup covers payment, review, order item, order, cart item, cart, wishlist item, wishlist, address, account, verification records, namespace product/SKU dependencies, coupon, and user;
- cleanup refuses to delete an online order or owned SKU while provider status/cancellation is indeterminate; the test must first obtain a verified terminal provider state through production reconciliation;
- setup/cleanup are concurrent-namespace safe and retry-idempotent: unique constraints isolate creation, transaction rollback prevents partial cleanup, and a second cleanup resolves no owned rows and performs no shared mutation;
- `markOwnedOrderAsLegacySnapshot` nulls only nullable Phase 4 columns and writes `serviceAmount: 0`;
- current stateless Coupon schema is asserted; if a usage relation/writer appears, the safety contract fails until cleanup targets exact owned usage rows;
- no `TRUNCATE`, `migrate reset`, `db push`, raw unbounded `deleteMany({})`, `deleteMany()` without `where`, or mutation of Production/ambient URL variables;
- no test relies on legacy fashion product slugs or ProductVariant ids.

- [ ] **Step 2: Run RED**

Run:

```powershell
npx vitest run tests/phase-4-e2e-safety-contract.test.ts tests/e2e-database-guard.test.ts
```

Expected: fail because Phase 4 fixture helper and updated scenarios do not exist.

- [ ] **Step 3: Build explicit targeted database helper**

`e2e/phase4-database.ts` creates its own Prisma client with the explicit guarded E2E pooled URL. Export:

```typescript
export function phase4Namespace(testInfoTitle: string): string;
export async function createPhase4CheckoutFixture(namespace: string): Promise<Phase4CheckoutFixture>;
export async function seedOwnedCartLine(email: string, skuId: string, quantity?: number): Promise<void>;
export async function markOwnedOrderDelivered(email: string, orderNumber: number): Promise<void>;
export async function markOwnedOrderAsLegacySnapshot(email: string, orderNumber: number): Promise<void>;
export async function readOwnedOrder(email: string, orderNumber: number): Promise<Phase4OrderProbe>;
export async function createPhase4BlockedPaymentFixture(namespace: string): Promise<Phase4BlockedPaymentFixture>;
export async function cleanupPhase4Namespace(
  namespace: string,
  neverAttemptedProofs?: readonly Phase4NeverAttemptedProviderProof[],
): Promise<Phase4CleanupResult>;
export async function disconnectPhase4Database(): Promise<void>;
```

`createPhase4CheckoutFixture` reads one canonical furniture product only as a schema/template source, then creates a unique active product root, canonical SKU/article/stock, necessary option selections/media rows, and coupon code owned by the namespace. Its product slug is never navigated or made generally routable. After `registerAndVerify` completes in the browser, `seedOwnedCartLine` requires the exact namespace email, asserts the user is verified, resolves/creates only that user's cart, and inserts only the returned namespace SKU. The browser then enters through `/cart` or `/checkout`. Shared Noma/product/SKU/coupon rows and ADR-013 routing remain untouched. All subsequent reads/writes use namespace/email/order number plus resolved owner ids. `markOwnedOrderAsLegacySnapshot` nulls only `deliveryZone`, `deliveryDate`, `deliveryWindow`, pickup snapshot fields, floor/lift/intercom, and `serviceDetails`, and sets non-null `serviceAmount` to `0`.

`createPhase4BlockedPaymentFixture` directly inserts one exact namespace-owned pending online order with immutable SKU snapshots, reserved namespace stock, `createdAt` before `T`, and no local `Payment`; it never calls `placeOrder`, `ensureOnlinePayment`, or YooKassa. Its returned proof records the exact order id as `providerRequestIssued: false`. Cleanup may treat only that exact helper-created id as `NOT_CREATED_BY_CONSTRUCTION`; it verifies namespace ownership, absent `Payment`, and the returned proof before targeted deletion/stock normalization. Any ordinary online order without this proof remains provider-indeterminate and blocks cleanup.

`cleanupPhase4Namespace` first verifies every owned online order is provider-terminal and locally reconciled. If not, it returns `{ ok: false, reason: 'PROVIDER_STATE_INDETERMINATE', orderNumbers }` and preserves orders/SKUs/stock. Otherwise one serializable transaction deletes exact dependents and namespace roots; cascade use is allowed only from an already exact namespace-owned root. A concurrent namespace cannot match those ids/slugs/codes, and retry after success is a no-op.

- [ ] **Step 4: Replace stale fashion E2E flows with canonical furniture scenarios**

Create a `phase4-e2e-<run-id>` checkout fixture per write scenario. Register/verify the namespace user through the browser, seed that authenticated owner's cart with the namespace SKU through `seedOwnedCartLine`, then exercise cart/checkout/order/payment/review through browser routes. Do not navigate the fixture product route or change showcase resolution. Existing focused PDP/cart tests continue to cover the accepted Noma option-selection/add-to-cart UI without shared Phase 4 database mutation.

`e2e/checkout.spec.ts` covers:

1. signed-out `/checkout` redirects to login with safe callback;
2. courier COD in `moscow-region` using an ADR-approved slot/service combination and namespace coupon; browser rows match the server quote, order route persists exact snapshots, and cart becomes empty;
3. showroom COD uses the approved showroom snapshot/rules and order page labels it only from that snapshot;
4. pickup-point COD uses one approved non-showroom point and its server-owned address;
5. customer cancellation changes status once and restores the namespace-owned SKU by exact quantity; a repeated cancellation/resync does not increment it again.

`e2e/order.spec.ts` covers foreign order 404, signed-out redirect, new snapshot rendering plus an exact Phase 4-owned order converted through `markOwnedOrderAsLegacySnapshot`, mobile `390x844`, desktop `1440x1000`, keyboard cancellation dialog, and reduced motion.

`e2e/review.spec.ts` places a unique COD order, uses the targeted helper to mark only that owned order `DELIVERED`, submits a product review, reloads to prove persistence/already-reviewed state, cancels no delivered order, and cleans only its namespace.

`e2e/yookassa.spec.ts` always keeps the COD regression. The online sandbox scenario runs only when `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, and exact `YOOKASSA_MODE=sandbox` are present and Task 2 recorded an auditable provider retry window `T`. It covers redirect plus idempotent continuation/recovery inside `T`, definitive `NOT_CREATED`, and post-window blocked behavior. The blocked UI scenario uses `createPhase4BlockedPaymentFixture`, whose setup proves no provider request was issued, and asserts `Платёж требует проверки`, the durable order number, exact blocked message, no YooKassa/continue URL, no repeat-create control, lookup-only `Проверить статус платежа`, and no cancel control until provider proof allows it. Teardown requests provider cancellation for attempted sandbox payments and waits for verified local reconciliation; the direct blocked fixture uses only its `NOT_CREATED_BY_CONSTRUCTION` proof for targeted cleanup. If an attempted provider state remains indeterminate, the window is unauditable, or the window expired without correlation, targeted cleanup returns blocked and leaves the durable correlation/stock intact for manual/provider recovery. It must never substitute fake success, fake cancellation, local payment, or order deletion.

Wrap each write scenario in `try/finally` cleanup and disconnect in suite teardown.

- [ ] **Step 5: Verify migration forward/idempotent path on explicit non-production DB**

Only after the tracked approved-dev fingerprint and every required forbidden fingerprint exist, run the non-secret readiness and migration wrappers. `e2e/database-command-report.ts` defines the only printable schema:

```typescript
export interface DatabaseCommandReport {
  ok: boolean;
  exitCode: number;
  errorCategory:
    | 'NONE'
    | 'CONFIGURATION'
    | 'IDENTITY_MISMATCH'
    | 'CONNECTIVITY'
    | 'MIGRATION_FAILED'
    | 'UNRECOGNIZED_DATABASE_COMMAND_ERROR';
  targetFingerprint: string | null;
  checks: Readonly<Record<string, boolean>>;
  migrationNames: readonly string[];
  migrationCount: number;
  noPendingMigrations: boolean;
}
```

`e2e/database-readiness.ts` validates explicit variables, normalized pooled/unpooled approved identity, inequality with every forbidden fingerprint (including ambient Production equality probes), read-only connectivity/current-database fingerprint equality, and migration state; it catches and categorizes every error without printing raw values or stack/error text. `scripts/e2e-prisma-migrate.ts` invokes the real local `prisma migrate deploy` subprocess with guarded explicit URLs and `stdio` pipes, parses only migration names/counts and success/no-pending/error-category facts, discards raw buffers, and prints one sanitized report. Both top-level entry points catch every thrown/rejected error, emit the allowlisted fallback category with non-zero exit status, and never let Node print an uncaught message/stack. Neither tool forwards raw subprocess output to the agent transcript. `E2E_DATABASE_URL_UNPOOLED` remains optional and falls back to the explicit pooled E2E URL:

```powershell
npx tsx e2e/database-readiness.ts --mode=migration
npx tsx scripts/e2e-prisma-migrate.ts deploy
npx tsx scripts/e2e-prisma-migrate.ts deploy
```

Expected sanitized reports: readiness booleans/fingerprints only; first migration invocation applies the Phase 4 additive migration when needed and reports only allowlisted migration names/counts; second reports `noPendingMigrations: true`. Raw Prisma/readiness output is never copied into reports or agent messages. Never run reset, push, seed, or global cleanup.

- [ ] **Step 6: Run GREEN safety and one critical task-level E2E**

Run:

```powershell
npx vitest run tests/phase-4-e2e-safety-contract.test.ts tests/e2e-database-guard.test.ts
npm run e2e -- e2e/checkout.spec.ts --grep "showroom COD"
npx prettier --check e2e/phase4-database.ts e2e/database-readiness.ts e2e/database-command-report.ts scripts/e2e-prisma-migrate.ts e2e/helpers.ts e2e/checkout.spec.ts e2e/yookassa.spec.ts e2e/review.spec.ts e2e/order.spec.ts playwright.config.ts tests/phase-4-e2e-safety-contract.test.ts tests/e2e-database-guard.test.ts
git diff --check
```

Expected: safety tests pass; one critical COD path passes when explicit E2E variables are present. If variables are absent, record the guard failure exactly and do not claim Playwright passed. Do not run the complete Phase 4 E2E set in this task.

- [ ] **Step 7: Commit and review**

Commit subject:

```text
test: cover phase 4 purchase flows
```

Reviewer checks ADR-013 preservation, no namespace PDP navigation/route expansion, exact verified-owner cart seeding, no showcase-SKU substitution, approved database identity, non-exposing real migration/readiness wrappers, no raw Prisma/identity output, namespace-owned product/SKU/coupon isolation, transactional concurrent/idempotent cleanup, exact blocked-payment UI/actions, provider-indeterminate/post-window refusal, no resets/shared mutations, canonical SKU flow, truthful external skip, persisted delivery/services, exactly-once cancellation stock proof, review gate, and responsive/accessibility coverage.

---

### Task 9: Integration Contract, Final Review, Completion Gate, and Stop

**Files:**

- Create: `docs/superpowers/manifests/phase-4-delivery-manifest.json`
- Create: `tests/phase-4-integration-contract.test.ts`
- Modify: `docs/roadmap/STATUS.md`
- Modify: `.superpowers/sdd/progress.md`
- Create report: `.superpowers/sdd/phase-4-delivery-report.md`

- [ ] **Step 1: Write RED integration contract**

Pin the exact Phase 4 delivery file list and SHA/count metadata in `docs/superpowers/manifests/phase-4-delivery-manifest.json`. The canonical manifest schema is `{ schemaVersion, baseSha, fileCount, totalBytes, entries[] }`; entries are lexicographically sorted `{ path, sha256, bytes }`, the manifest path is explicitly excluded from `entries` and has no self-digest, and all hashes are computed from the final committed file bytes. `tests/phase-4-integration-contract.test.ts` must independently verify:

- base `868310f` and manifest paths;
- additive migration fields and no destructive SQL;
- canonical SKU-only cart writes and explicit rejection of buy-now identifiers;
- one server quote authority used by preview and placement;
- transactional order/cart snapshot/stock and transactional payment cancellation restoration;
- total YooKassa initialization outcomes `NOT_CREATED`, `CREATED`, and `INDETERMINATE`; only provider-proven `NOT_CREATED` performs guarded local cancellation/restoration, while `CREATED`/`INDETERMINATE` preserve durable order/stock and recover missing-payment correlation through webhook/order-page reconciliation;
- audited idempotency retention window `T`, same-key automatic continuation only before `createdAt + T`, `PAYMENT_AUTO_RETRY_UNSAFE` when `T` cannot be proved, and `PAYMENT_INITIALIZATION_BLOCKED` with no new create/release/fake success after the bound unless the provider separately proves safety;
- exact blocked placement/order DTO fields, Russian heading/message, durable order number, null continue URL, disabled repeat create, lookup-only resync, and provider-proof-gated cancellation across Checkout A, Order A, source tests, and E2E;
- three policy-approved delivery methods, two courier zones, slots, lift/floor, carrying, assembly, removal, and `Europe/Moscow` date-only sentinels;
- completed focused brainstorming plus unambiguous ADR-015/ADR-016 numbering; ADR-016 exact values `1,900`, `150,000`, `350`, `3,900`, and `2,400`, exact pickup/lead-time/window/service facts, and cited clone evidence; no unaudited clone import or value bypasses the accepted ADR;
- exact Checkout/Order CSS hashes;
- no clone mocks/technical-source imports, legacy fashion checkout slug, fake payment success, admin, Cloudinary, demo-admin, Sentry/performance work;
- protected Phase 2 plan hashes unchanged;
- ADR-013 showcase-only PDP redirect remains intact; Phase 4 E2E never navigates a namespace PDP and seeds the namespace SKU only into the exact verified owner's cart through the guarded helper;
- environment-variable-name-only fingerprint acquisition emits only presence/validity/fingerprint/equality data; `DatabaseTargetPolicy` is injectable for tests; approved/forbidden E2E identity guard, namespace-owned product/SKU/coupon fixtures, concurrent/idempotent cleanup, and provider-terminal refusal remain enforced;
- readiness and real Prisma migration deploy run only through sanitizing wrappers that capture/discard raw output and expose allowlisted exit status, error category, migration names/counts, booleans, and fingerprints;
- STATUS/progress/report identify any deferred external smoke honestly.

- [ ] **Step 2: Run RED, then create provisional manifest and close records**

Run RED before creating/finalizing the manifest:

```powershell
npx vitest run tests/phase-4-integration-contract.test.ts
```

Expected: fail on missing manifest/closeout records.

Create a provisional manifest using the canonical schema from the committed Phase 4 diff plus Task 9-owned contract/closeout files. Exclude the manifest itself from its entries; do not claim final HEAD yet. Update STATUS/progress with task commit ranges, focused evidence, sanitized migration/E2E database state, policy/fingerprint decisions, external credential presence booleans, and no pass claim for any deferred smoke.

- [ ] **Step 3: Run focused GREEN only**

Run:

```powershell
npx vitest run tests/phase-4-integration-contract.test.ts tests/phase-4-schema-contract.test.ts tests/phase-4-e2e-safety-contract.test.ts
npx prettier --check docs/superpowers/manifests/phase-4-delivery-manifest.json tests/phase-4-integration-contract.test.ts docs/roadmap/STATUS.md .superpowers/sdd/progress.md .superpowers/sdd/phase-4-delivery-report.md
git diff --check
```

Expected: focused integration/safety/schema contracts pass. Do not run the full gate yet.

- [ ] **Step 4: Commit contract and obtain a pre-gate diff review**

Commit subject:

```text
test: lock phase 4 delivery contracts
```

Commit the provisional contract with the exact subject above. Dispatch a fresh Sol xhigh reviewer with `caveman ultra` messages over the current delivery diff for a pre-gate review:

```text
868310fff1ad9bbc980fe54710e7dfb311f1f288..HEAD
```

The reviewer receives approved requirements, ADRs, constraints, provisional manifest, delivery report, and fresh focused evidence. It reviews only the Phase 4 delivery diff and must not perform a full-project review or repeat the full gate. Return every Critical/Important finding to the owning task implementer; do not proceed while either count is non-zero. After remediation, rerun only affected focused checks unless the remediation changes a cross-cutting surface.

- [ ] **Step 5: Prove completion readiness, then run the complete Phase 4 gate exactly once**

Before any completion-gate command, run `npx tsx e2e/database-readiness.ts --mode=completion`. It must emit one sanitized `DatabaseCommandReport` proving explicit E2E URL/write opt-in, approved-dev fingerprint equality, inequality with every required forbidden fingerprint (including equality probes against present ambient Production identities), read-only connectivity/current-database fingerprint equality, applied Phase 4 migration, required Auth/COD readiness, and unique-fixture capability. It must never print raw URL, hostname, database name, username, query, password, subprocess output, stack, or error message. Presence-only external checks must also run for the approved names. If readiness is absent or any check fails, set delivery state `BLOCKED_COMPLETION_READINESS` in the report/progress, record only the sanitized error category/booleans/fingerprints, and stop before `npm run format`; do not run or claim the completion gate. Missing optional YooKassa/DaData credentials may defer only their external smoke after COD/order/review readiness is proven.

After readiness and pre-gate review are clean, run:

```powershell
npm run format
npm run gate
npm run build
npm run e2e -- e2e/checkout.spec.ts e2e/order.spec.ts e2e/yookassa.spec.ts e2e/review.spec.ts
```

Expected: format/gate/build pass; critical COD/order/review E2E scenarios pass against the approved non-production database. Online YooKassa redirect may be skipped only for missing sandbox credentials and must be recorded as deferred external Preview smoke. A database guard/readiness failure blocks completion and is not a passing E2E result.

- [ ] **Step 6: Commit final tracked evidence and manifest**

After the one completion gate, update `.superpowers/sdd/phase-4-delivery-report.md`, STATUS, and progress with exact fresh sanitized outputs, readiness result, policy/fingerprint state, and honest external-smoke status. Generate the final manifest over the exact final file bytes, excluding the manifest itself and sorting entries. Run:

```powershell
npx vitest run tests/phase-4-integration-contract.test.ts
npx prettier --check docs/superpowers/manifests/phase-4-delivery-manifest.json docs/roadmap/STATUS.md .superpowers/sdd/progress.md .superpowers/sdd/phase-4-delivery-report.md
git diff --check
git status --short --branch
git diff --check 868310f..HEAD
git diff --name-only 868310f..HEAD
git grep -n -I -E '(sk_live_|ghp_|github_pat_|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)' $(git diff --name-only 868310f..HEAD)
Get-FileHash 'docs\superpowers\plans\2026-08-12-phase-2a-executable-storefront-home.md' -Algorithm SHA256
Get-FileHash 'docs\superpowers\plans\phase-2-task-3-execution.md' -Algorithm SHA256
```

Commit all final evidence and manifest bytes with:

```text
docs: record phase 4 completion evidence
```

The final evidence commit is the last planned tracked mutation before final review. Its manifest excludes itself, so no self-reference or post-gate hash drift exists.

- [ ] **Step 7: Fresh final review over the actual final HEAD, then stop**

Run the final changed-path listing, identity/log check, protected-plan hashes, and tracked secret scan against the actual final HEAD. Then dispatch a fresh Sol xhigh reviewer with `caveman ultra` messages over exactly `868310f..HEAD` (the final evidence commit included). It receives the final manifest/report and fresh focused evidence, reviews only that delivery diff, and must return Critical 0 / Important 0 before completion. No tracked file may change after a clean final review. If findings require remediation, change only the owning files, rerun affected focused checks (repeat the full gate only if remediation changes a cross-cutting surface), commit refreshed evidence/manifest, and dispatch a new reviewer over the new actual `868310f..HEAD`; loop until clean.

```powershell
git status --short --branch
git diff --check 868310f..HEAD
git diff --name-only 868310f..HEAD
git log --format='%h %an <%ae> %s' 868310f..HEAD
git grep -n -I -E '(sk_live_|ghp_|github_pat_|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)' $(git diff --name-only 868310f..HEAD)
Get-FileHash 'docs\superpowers\plans\2026-08-12-phase-2a-executable-storefront-home.md' -Algorithm SHA256
Get-FileHash 'docs\superpowers\plans\phase-2-task-3-execution.md' -Algorithm SHA256
```

Stop. Do not push, create a Vercel Preview, open a pull request, merge, delete the branch, or begin Phase 5. The coordinator returns the local completion evidence and waits for explicit authorization to push the existing Phase 4 branch for desktop/mobile visual acceptance. The final reviewer result is session evidence; no unreviewed tracked mutation may be made to record it.

---

## Self-Review Checklist

- [x] All Phase 4 roadmap requirements map to Tasks 2–8: Moscow/Moscow Region courier, showroom, pickup point, slots, floor/lift, carrying, assembly, removal, server recalculation, coupons/SKU price/stock, YooKassa/COD, transactional order/snapshot/stock, webhook resync, cancellation/restoration, reviews, Checkout A, and Order A.
- [x] Task 1 corrects stale Phase 3 status with PR #3, `868310f`, `f3d8a93`, and honest environment/E2E state; delivery policy is resolved, while missing approved/required-forbidden Neon fingerprints still block database guard completion and writes.
- [x] Coordinator-owned focused brainstorming completed; user approved option 1; ADR-015 is reserved for the shared non-production database and ADR-016 locks exact clone-derived tariff/pickup/lead-time/window/service values with citations.
- [x] Schema expansion is proven necessary, additive, reversible at application level, mixed-version safe, idempotently deployable, and contains no contraction/reset.
- [x] DTO names and fields are consistent across Tasks 2–7: `CheckoutQuoteInput`, `PlaceOrderInput`, `CheckoutPageDto`, `CheckoutQuoteDto`, `CheckoutTotalsDto`, and `OrderPageDto`; saved addresses map the actual `Address` schema without parsing.
- [x] `shippingMethod` compatibility is consistent: courier `courier`; new showroom/pickup point `pickup` with exact snapshot; null legacy pickup remains neutral.
- [x] Delivery slot generation, persistence, and rendering use one `Europe/Moscow` date-only/UTC-sentinel contract with midnight-boundary tests.
- [x] Phase 4 checkout is cart-only; both buy-now keys are rejected and removed rather than pretending the cart quote builder covers them.
- [x] Client code performs no price, coupon, delivery, service, total, stock, payment, or review-eligibility decision.
- [x] The existing coupon is proven stateless; no usage mutation is invented, and E2E uses a namespace-owned coupon.
- [x] Online provider work is real YooKassa sandbox only; `NOT_CREATED`/`CREATED`/`INDETERMINATE` are total, same-key continuation is bounded by audited `T`, and unauditable/post-window states block automatic create/release while deterministic metadata can recover a missing local `Payment`.
- [x] `PAYMENT_INITIALIZATION_BLOCKED` is serialized consistently through checkout/order DTOs, Checkout A, Order A, actions, source tests, and E2E with exact copy/order number, no redirect/continue/retry create, lookup-only resync, and provider-proof-gated cancellation.
- [x] Provider-confirmed cancellation plus local failure is recoverable by retry/webhook/order-page reconciliation with exactly-once inventory effects.
- [x] New order writes are canonical SKU-only and cart-only; legacy ProductVariant remains read-compatible only.
- [x] Order placement and payment-cancellation inventory transitions are transactionally gated and idempotent.
- [x] Order UI does not fabricate courier, support, document, reorder, recommendation, payment, or review state.
- [x] ADR-013 remains intact: Phase 4 E2E never navigates a namespace PDP, never broadens showcase routing, and seeds a namespace canonical SKU only into the exact verified owner's cart through a guarded helper.
- [x] Fingerprint acquisition accepts environment variable names and emits no raw identity; target policy is injectable; E2E uses approved identity-bound URLs/write opt-in, namespace-owned Product/SKU/coupon/user/order fixtures, concurrent/idempotent targeted cleanup, provider-terminal refusal, no Production, no ambient fallback, and no reset/truncate/global delete.
- [x] Readiness and real Prisma migration deploy capture and discard raw output, emit only allowlisted status/category/migration names/counts/booleans/fingerprints, and forbid raw database identity in reports or agent messages.
- [x] Completion readiness is proven before `npm run format`; missing critical database/COD/order/review readiness blocks the completion gate.
- [x] The manifest schema excludes self-digest, sorts exact final entries, and final tracked evidence is committed before a fresh reviewer inspects `868310f..actual final HEAD`; no tracked mutation follows clean review.
- [x] Task reviewers use focused evidence; the completion gate runs once after readiness and pre-gate review, repeating only if later cross-cutting remediation invalidates it.
- [x] Admin, Cloudinary, demo-admin, Sentry/operations, performance, refunds, and new architecture remain excluded.
- [x] Protected untracked Phase 2 plans remain unmodified and untracked.
- [x] Execution stops before push, Preview, PR, merge, branch deletion, or Phase 5.

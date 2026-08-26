# Phase 5D Boundary C Functional Review

Date: 2026-08-26
Reviewed range: `2c5c982..687e34a`
Reviewed HEAD: `687e34a01c099c9b72ca636cf7c30817f1a7b4ce`
Role: fresh read-only functional reviewer

## Verdict

**REQUEST CHANGES**

- Critical: 0
- Important: 1
- Minor: 0

Boundary C functional acceptance is blocked by I1. The prior Boundary A and Boundary B acceptance decisions remain valid for their reviewed scopes, and the new route, owned-browser, cleanup, and COD evidence is otherwise coherent.

## Evidence reviewed

- `.superpowers/sdd/phase-5d-review-C.diff`, supplied for exact range `2c5c982..687e34a`.
- Approved Phase 5D implementation plan: `docs/superpowers/plans/2026-08-26-phase-5d-demo-integration-closeout.md`.
- Boundary A final acceptance: `.superpowers/sdd/phase-5d-review-A-acceptance.md` (`C0/I0/M0`).
- Boundary B fresh re-review: `.superpowers/sdd/phase-5d-review-B-rereview.md` (`C0/I0/M0`).
- Task reports: `.superpowers/sdd/phase-5d-task-3-report.md`, `.superpowers/sdd/phase-5d-task-5-report.md`, and `.superpowers/sdd/phase-5d-task-6-report.md`.
- Representative visual evidence: `.superpowers/sdd/phase-5d-visual-matrix.md`, `e2e/phase-5d-visual-capture.spec.ts`, `tests/phase-5d-visual-contract.test.ts`, and the 24 PNG files under `.superpowers/sdd/phase-5d-visual-evidence/`.
- Route/render/navigation and isolation evidence: `tests/phase-5-route-contract.test.ts`, `tests/demo-admin-import-graph.test.ts`, `e2e/demo-admin.spec.ts`, and the accepted Boundary A report.
- Owned browser fixture and COD evidence: `e2e/phase5-database.ts`, `e2e/admin-phase-5.spec.ts`, and the Task 5D.6 report.
- Current repository checks were read-only: exact HEAD/status inspection, `git diff --check 2c5c982..687e34a`, screenshot count and dimensions, and targeted source/diff searches. No full gate, build, combined critical E2E, database mutation, provider call, or product edit was performed.

## Findings

### I1 — Six representative protected routes have unresolved hydration mismatches

**Severity: Important**

The committed visual matrix records React hydration mismatch errors for six of the twelve representative templates:

1. `/admin/catalog/products`
2. `/admin/catalog/products/new`
3. `/admin/catalog/categories/{ownedCategoryId}/edit`
4. `/admin/catalog/stock`
5. `/admin/orders/{ownedOrderId}`
6. `/admin/marketing/{ownedCouponId}/edit`

Each recorded error begins: `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up.` These are interactive protected list, form, stock, order, and coupon templates, so an unresolved server/client attribute divergence is a functional runtime risk rather than merely a visual-review concern.

The current evidence cannot support a benign disposition:

- `captureViewport` truncates every console or page error to its first line and then merges desktop and mobile results, so the committed matrix does not identify the differing element/attribute, source owner, or affected viewport.
- `tests/phase-5d-visual-contract.test.ts` only asserts that `consoleErrors` is an array. It therefore passes with arbitrary runtime errors and does not protect the evidence set from this regression.
- No committed focused diagnosis proves that the warnings are solely capture-environment instrumentation or that the affected DOM attributes are functionally irrelevant.

**Required disposition:** diagnose the complete warning on the six affected routes and either fix the responsible server/client render divergence or record conclusive route- and viewport-specific evidence that an external capture-only mutation caused it. Regenerate the bounded visual evidence and make the focused evidence contract reject unexpected console/page errors (or enforce an exact, justified, narrowly scoped allowlist). Boundary C functional acceptance requires fresh evidence at the remediated HEAD with no unexplained hydration mismatch.

## Accepted dispositions

### Exact route, render, and navigation contracts

Accepted for this boundary. The exact route contract derives and locks 22 protected pages and five public demo pages, the sole `/admin/catalog` redirect, protected primary navigation and catalog tabs, demo navigation parity, and protected/demo link separation. Boundary A independently accepted the recursive demo closure and active-brand boundaries.

### Owned E2E fixture and cleanup

Accepted for the executed Phase 5D.6 and 5D.7 journeys. Fixture creation records exact IDs and namespaced identities; ownership is validated before reads and cleanup; supplied order IDs are rejected unless they belong to the fixture; cleanup deletes recorded dependency rows and reports all 26 owned-row probes as zero. The visual matrix records `allZero: true` for the single owned capture fixture. The Task 5D.6 report records zero cleanup after each independently owned browser journey and after diagnostic recovery.

### COD stale-tab, stock, snapshot, and payment invariants

Accepted. The serial owned browser journey proves:

- retained checkout name, normalized phone, and email before submission;
- one owned COD order with status `PENDING` and stock reduced from the fixture baseline only for the ordered SKU;
- one winning cancellation and refusal of the second stale-tab cancellation intent;
- final status `CANCELLED` and exactly one stock restoration to `12/13`;
- immutable product/article/quantity/unit-price snapshots before and after cancellation;
- zero payment rows; and
- unchanged null payment initialization state, claim timestamp, and ever-dispatched timestamp.

Cleanup runs in the test's `finally` block and the supplied focused run passed with retries disabled and one worker.

### Twelve-template matrix and 24 captures

Structurally accepted, subject to I1. The matrix contains exactly the approved twelve templates and 24 unique PNG paths. Files exist; all desktop captures use a 1440-pixel viewport width and all mobile captures use 390 pixels, with the protected samples at the requested viewport dimensions and longer demo pages captured full-page. Recorded resolved paths match expectations, overflow is false at both viewports, keyboard focus moves from the body, and cleanup is zero.

Screenshots are evidence, not independent visual acceptance. This functional review does not replace the user's separate desktop/mobile visual acceptance gate.

## Final disposition

Boundary C functional review cannot approve `687e34a` while I1 remains open. Exact blocker: six representative protected templates emit unexplained React hydration mismatch errors, while the committed capture and contract omit the diagnostic detail needed to prove or prevent the divergence. Critical and Minor counts are zero; Important count is one.

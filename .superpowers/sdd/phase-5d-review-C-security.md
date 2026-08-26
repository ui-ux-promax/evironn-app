# Phase 5D Boundary C Security Review

Date: 2026-08-26

Reviewed range: `2c5c982..687e34a`

Role: fresh read-only security reviewer

## Verdict

**APPROVE**

- Critical: 0
- Important: 0
- Minor: 0

No high-confidence exploitable security vulnerability was identified in the exact reviewed range. Critical and Important findings are zero, so Boundary C satisfies its security acceptance condition.

## Evidence reviewed

- `.superpowers/sdd/phase-5d-review-C.diff` and repository diff for `2c5c982..687e34a`.
- Approved Phase 5D plan: `docs/superpowers/plans/2026-08-26-phase-5d-demo-integration-closeout.md`.
- Boundary A final acceptance and Boundary B fresh re-review.
- Task 5D.6 report, browser specifications, fixture helper, and the representative visual matrix.
- Server-side ADMIN guards, protected page/action/API contracts, role mutation policy, order cancellation policy and transaction implementation, Cloudinary media validation and ownership code, recursive demo import-graph scanner, and relevant focused tests.
- All 24 committed PNG artifacts were checked for PNG text/EXIF metadata chunks; none was present. Representative order, customer, coupon, and demo captures were visually inspected.
- Added textual content was scanned for common credential, private-key, database-URL, and token patterns. No added secret-pattern hit was found. `git diff --check 2c5c982..687e34a` passed.

No test suite, full gate, build, combined critical E2E, database mutation, Prisma CLI mutation, or provider operation was run by this reviewer. Fresh focused outputs recorded by the owning tasks and prior reviews were reused.

## Findings

None.

## Security dispositions

### ADMIN guards and protected/demo route isolation

**PASS.** `app/(admin)/layout.tsx` enforces `requireAdminPage` for the protected route group. The local page, server-action, and admin API contracts additionally require the appropriate guard before privileged reads, writes, or provider access. The browser evidence confirms anonymous redirect, CUSTOMER denial, and ADMIN access without relying on client-side role decisions.

The five `/demo-admin` routes remain public by design and contain deterministic synthetic projections only. They expose no forms, mutation controls, server actions, APIs, Prisma/Auth.js reads, provider calls, or links into protected `/admin` routes.

### Recursive demo import-graph isolation

**PASS.** `tests/demo-admin-import-graph.test.ts` walks all six demo entrypoints through relative and `@/` imports, re-exports, literal dynamic imports, and cycles. It fails closed on unresolved local imports and rejects Node built-ins, disallowed bare imports, CommonJS `require` forms, non-literal dynamic imports, filesystem/network/cache/environment/auth/provider boundaries, mutation-like calls, server directives, and protected admin dependencies. Source inspection found no bypass in the actual demo closure.

### Owned fixture namespace, ID validation, and cleanup safety

**PASS.** `e2e/phase5-database.ts` requires a randomized `phase5d-e2e-*` namespace, derives owned identities and slugs from it, records exact IDs, validates uniqueness and relational ownership, and rejects non-owned order IDs before cleanup. Deletes use recorded ID plus identity/relationship intersections in dependency order. Each database-backed scenario owns one fixture and cleans it in `finally`; the Task 5D.6 and visual-matrix evidence report zero rows across every owned probe.

The fixed E2E password is not a production credential: it is paired with unguessable randomized `.invalid` fixture identities, used only for transient test-owned accounts, and the accounts are deleted by ownership-validated cleanup. No historical or shared identity is addressed by that credential.

### Browser role scope

**PASS.** Browser role coverage promotes and restores only the fixture-owned CUSTOMER. It does not target a shared ADMIN and does not claim browser proof of last-admin isolation. The server action independently authenticates ADMIN on every call, validates the requested role, blocks self-demotion and a non-self last-admin demotion, and conditionally updates the observed target role. The focused action evidence owns the last-admin refusal claim.

### Order cancellation race, payment, and provider boundaries

**PASS.** Cancellation is ADMIN-guarded and validates `orderId` plus expected cancellable status. The complete operation runs in the existing serializable transaction with a conditional status update; inventory references and positive quantities are validated before writes, and stock restoration plus sales-count adjustment occur in the same transaction. Unsafe status, dispatched/claimed/indeterminate payment state, successful payment, and pending/unknown settlement fail closed. The admin cancellation path makes no YooKassa call or Payment write. Browser evidence demonstrates one winning COD cancellation, refusal of the stale second intent, one stock restoration, unchanged snapshots, zero Payment rows, and unchanged payment-initialization evidence.

### Media and Cloudinary validation

**PASS.** Upload signing is ADMIN-only and uses an exact Evironn folder allowlist. Delete is ADMIN-only, rejects unsafe paths before lookup/provider access, permits current Evironn namespaces, and permits legacy IDs only when referenced by an owned database record. `isSafeMediaPath` rejects outer and segment padding, empty/traversal segments, slash/backslash ambiguity, maximum-length overflow, C0/C1 controls, Unicode line separators, and the complete Unicode `Cf` class. Product media preserves only accepted Evironn IDs or exactly persisted legacy IDs, performs reference checks before post-commit deletion, and does not expose Cloudinary secrets to client source or artifacts. No provider call was made during this review.

### Secrets and test artifacts

**PASS.** No added credential, private key, database URL, provider secret, or bearer-token pattern was found. Environment access in the E2E helper reads the database URL without serializing or logging its value. The matrix contains localhost URLs, synthetic fixture IDs/namespaces, cleanup counts, and concise console summaries only.

The screenshots contain synthetic names, an `.invalid` email, fixture identifiers, a test phone number, and deterministic demo data. They contain no session cookie, provider credential, database URL, real account credential, or PNG text/EXIF metadata. All displayed database-backed rows belong to the recorded namespace and the matrix records successful zero-row cleanup.

### Hydration summaries

**NOT A SECURITY FINDING.** Six protected-route captures record the generic first line of React's hydration mismatch diagnostic. The available detailed diagnostics attribute the differences to presentation-only style serialization, including `caret-color: transparent` and Radix inline styles. Source inspection found no new raw-HTML, script, URL-execution, authentication, authorization, or sensitive-data sink associated with those routes. The summaries therefore remain a functional/visual diagnostic, not evidence of XSS, privilege bypass, or data disclosure. This disposition does not claim that the hydration warning itself is resolved.

## Acceptance disposition

Boundary C security review is accepted for `2c5c982..687e34a`: Critical 0, Important 0, Minor 0. No security remediation or re-review is required before Task 5D.8.

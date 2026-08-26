# Task 5D.6 report

## Scope

Task 5D.6 adds independently owned, serial browser coverage for the five approved Phase 5 journeys. The browser fixtures use the `phase5d-e2e-*` namespace, record every created ID, validate ownership before cleanup, and clean up in each test `finally` block. No historical orders, shared users, global seeds, provider calls, Prisma CLI mutations, or schema operations were used.

## Coverage

- `Phase 5D demo routes are public read only`: all five demo routes, furniture text, read-only controls, and desktop/mobile horizontal-overflow checks.
- `Phase 5D protected routes remain ADMIN only`: anonymous redirect, CUSTOMER denial, and owned ADMIN access.
- `Phase 5D owned COD order cancels once under stale tabs`: owned showroom COD order, retained contact values, two admin tabs, one winning cancellation, second cancellation refusal, single stock restoration to the fixture baseline, unchanged order snapshots, zero payments, and unchanged payment-initialization evidence.
- `Phase 5D canonical catalog and coupon projections render`: owned product and coupon projections in the admin UI.
- `Phase 5D browser role controls promote and restore an owned CUSTOMER`: owned CUSTOMER promotion and restoration only; this does not claim last-admin isolation.

## Focused evidence

All commands used `--workers=1 --retries=0` and were run one scenario at a time:

| Scenario                       | Result          |
| ------------------------------ | --------------- |
| Demo routes                    | 1 passed, 13.8s |
| Protected routes               | 1 passed, 33.7s |
| Owned COD stale tabs           | 1 passed, 59.5s |
| Catalog and coupon projections | 1 passed, 33.4s |
| Owned role promote/restore     | 1 passed, 33.1s |

Additional evidence:

- `npx prettier --check e2e/admin-phase-5.spec.ts e2e/phase5-database.ts e2e/demo-admin.spec.ts` passed.
- `git diff --check` passed.
- Failed diagnostic attempts were followed by the fixture helper's `finally` cleanup. Read-only recovery checks showed zero Phase 5 users, products, and orders before reruns; three earlier retry-created fixtures were also removed through `cleanupPhase5Fixture`, each with `allZero: true` across all owned row probes.

## Test-only corrections made during GREEN

- Treat the Auth.js callback as a same-origin URL and assert pathname `/admin`.
- Select the showroom delivery method before selecting the owned showroom point.
- Assert the checkout phone mask rendered by the application.
- Assert uppercase coupon normalization.
- Assert cancellation restores stock to the fixture baseline (`12/13`), rather than comparing against the pre-cancellation (`11/13`) snapshot.
- Reload the customer detail after promotion before asserting the demotion control.
- Assert the policy-guard refusal returned for the already-cancelled stale tab; focused unit coverage owns the stale conditional-write branch.

## Disposition

Task 5D.6 is complete. Commit subject: `test(phase-5): cover owned admin and demo journeys`.

# Task 3 Report — Demo Reset, Environment, CI, and Deployment Smoke

Date: 2026-08-29
Branch: `phase/06-hardening-release`
Base task commits: `4c3c6d3` (Task 1), `2e83b0f` (Task 2)

## Scope and stop conditions

Task 3 remained within the approved brief. No database command, database access, reset invocation, provider operation, Vercel call or mutation, GitHub settings operation, deployment, deployed smoke, full gate, build, or E2E was run. No new architecture or ownership model was introduced.

The two pre-existing untracked Phase 2 plan files were preserved. Existing `.superpowers/sdd/progress.md` changes were not modified or staged.

## Characterization and TDD evidence

Initial inspection confirmed the environment guard already required both `DEMO_MODE=true` and `VERCEL_ENV=production`. Existing reset, route, CI, cron, and smoke characterization passed before final test additions.

New `tests/demo-reset-lock.test.ts` was written before the production change. First run:

```text
npx vitest run tests/demo-reset-lock.test.ts
```

Result: exit 0, 4 tests passed. This first test version did not reproduce the defect because its blank stub values prevented nullish alias mixing.

The test was corrected to represent absent variables as absent for the mixed-alias case. RED run:

```powershell
npx vitest run tests/demo-reset-lock.test.ts
```

Result: exit 1, 1 of 4 tests failed. Expected failure: `fails closed for incomplete mixed Redis aliases before work`; current implementation resolved instead of rejecting. This demonstrated that `KV_REST_API_URL` could combine with `UPSTASH_REDIS_REST_TOKEN`.

Minimal GREEN change: `lib/demo-data/reset-lock.ts` now resolves one complete preferred `KV_REST_API_*` pair or one complete fallback `UPSTASH_REDIS_REST_*` pair. Partial or mixed configuration returns the existing `Demo reset lock is not configured` error before Redis construction or reset work. Existing lock key, random owner token, `nx: true`, `ex: 900`, competing-owner rejection, and compare-and-delete Lua release remain unchanged.

GREEN run:

```powershell
npx vitest run tests/demo-reset-lock.test.ts
```

Result: exit 0, 4 tests passed.

Additional characterization assertions cover the four `DEMO_MODE`/`VERCEL_ENV` combinations, isolated reset cleanup predicates, canonical inventory/coupon behavior, required environment names, CI database naming, smoke route/status checks, and absence of `continue-on-error`.

## Focused verification

Characterization and final focused command:

```powershell
npx vitest run tests/demo-data-canonical.test.ts tests/demo-data-reset.test.ts tests/demo-reset-lock.test.ts tests/demo-reset-route.test.ts tests/ci-workflow.test.ts tests/vercel-cron.test.ts tests/smoke-script.test.ts
```

Result: exit 0, 7 files / 18 tests passed. This command passed once before the final test assertions and once after all Task 3 changes.

Initial formatting check:

```powershell
npx prettier --check lib/demo-data/reset-lock.ts tests/demo-data-canonical.test.ts tests/demo-data-reset.test.ts tests/demo-reset-lock.test.ts tests/ci-workflow.test.ts tests/vercel-cron.test.ts tests/smoke-script.test.ts docs/operations/phase-6a-hardening.md
```

Result: exit 1 because `tests/smoke-script.test.ts` needed formatting. Applied the focused formatter:

```powershell
npx prettier --write tests/smoke-script.test.ts
```

Result: exit 0.

Repeated focused formatting check with the same file list: exit 0, all files matched Prettier style.

Whitespace check:

```powershell
git diff --check
```

Result: exit 0. Git reported only existing LF/CRLF conversion warnings; no whitespace errors.

Typecheck: not run. Final production change is local implementation logic with no exported type, DTO, route signature, or shared TypeScript contract change.

## Secret scan

Ran the required path-only scan exactly:

```powershell
git grep -IlE '(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|sk_live_[A-Za-z0-9]{16,}|postgres(ql)?://[^[:space:]\"]+:[^[:space:]\"]+@)' -- . ':!package-lock.json' ':!.env.example'
```

Result: exit 0; paths listed only:

```text
.github/workflows/ci.yml
tests/phase-5-active-brand.test.ts
vitest.config.ts
```

`.github/workflows/ci.yml` and `vitest.config.ts` are known dummy build/test database fixtures. `tests/phase-5-active-brand.test.ts` contains one dummy database fixture line, confirmed by path/line metadata as `fixture=True`; no credential value was printed. No unexplained secret-bearing path was found.

## Changed files

- `lib/demo-data/reset-lock.ts` — fixed mixed/partial Redis alias acceptance with local complete-pair resolution.
- `tests/demo-reset-lock.test.ts` — added preferred-pair, lock ownership, mixed-alias fail-closed, and runtime-error propagation coverage.
- `tests/demo-data-canonical.test.ts` — completed environment guard matrix.
- `tests/demo-data-reset.test.ts` — made portfolio/demo cleanup predicates explicit.
- `tests/ci-workflow.test.ts` — asserted `evironn_build` and rejected `ritm_build`.
- `tests/vercel-cron.test.ts` — asserted required Redis, Sentry, demo, cron, and smoke environment names.
- `tests/smoke-script.test.ts` — asserted non-success route failure, manual redirect handling, protected `/admin` validation, and no `continue-on-error`.
- `docs/operations/phase-6a-hardening.md` — added one short local/deployed-authorization/rollback operations document with no production evidence claims.

Inspected and unchanged: `lib/demo-data/contracts.ts`, `lib/demo-data/canonical.ts`, `lib/demo-data/reset.ts`, `app/api/cron/reset-demo/route.ts`, `.env.example`, `.github/workflows/deployment-smoke.yml`, `vercel.json`, and `scripts/smoke-production.mjs`. Their required contracts were already present.

## Self-review

- Reset remains limited to the isolated portfolio/demo model; no per-row ownership or reset redesign was added.
- Global temporary-data cleanup remains unchanged; customer order/payment deletion remains visitor-predicate constrained.
- Canonical furniture inventory and coupons remain source-controlled and idempotently restored.
- Route authentication and error-body hiding remain unchanged.
- CI retains existing quality commands and contains no database mutation or E2E command.
- Vercel retains one daily `/api/cron/reset-demo` schedule.
- Deployment smoke retains the approved public alias, completed-deployment failure check, required public/demo/health routes, and `/admin` denial.
- No secrets or provider values were added or printed.

## Concerns

- Deployed, provider, Vercel, GitHub, database, and reset evidence remains intentionally unverified under the brief's stop condition.
- Full gate, build, and E2E remain outside Task 3 and require the later Phase 6 checkpoint/closeout scope.
- The path-only scan includes known dummy fixture paths listed above; no real secret was exposed.

## Remediation evidence

Date: 2026-08-29
Base commit: `1c39766` (`fix: close demo operations defects`)

Reviewer finding addressed: `tests/demo-data-reset.test.ts` covered only the legacy `productVariant` fallback. The fixture now includes a `sku` delegate, and the canonical reset assertions exercise the preferred SKU branch. For every canonical inventory row, the test asserts the exact `articleNumber` selector and exact `price`, `oldPrice`, `stock`, and `active` update payload. The repeated-reset test now asserts `sku.update` is called `CANONICAL_INVENTORY.length * 2` times, preserving idempotency coverage on the canonical branch.

The reset cleanup assertions now require exact empty-filter calls for `cart`, `wishlistItem`, `emailVerificationCode`, and `verificationToken`. Existing exact assertions for `cartItem`, `wishlist`, and `subscriber` remain. No production file changed; no new abstraction was added. The existing `productVariant` mock remains in the fixture for compatibility, but the remediation test deliberately selects the canonical `sku` branch.

TDD/characterization note: the new assertions were added before the focused run. The test passed immediately because production `resetDemoData` already implemented the canonical `db.sku` branch; no demonstrated production defect existed, so no production change was made.

Focused test command:

```powershell
npx vitest run tests/demo-data-canonical.test.ts tests/demo-data-reset.test.ts tests/demo-reset-lock.test.ts tests/demo-reset-route.test.ts tests/ci-workflow.test.ts tests/vercel-cron.test.ts tests/smoke-script.test.ts
```

Result:

```text
Test Files  7 passed (7)
Tests  18 passed (18)
Process exit code: 0
```

Prettier command:

```powershell
npx prettier --write tests/demo-data-reset.test.ts .superpowers/sdd/task-3-report.md
```

Result:

```text
tests/demo-data-reset.test.ts 158ms (unchanged)
.superpowers/sdd/task-3-report.md 110ms (unchanged)
Process exit code: 0
```

Whitespace command:

```powershell
git diff --check
```

Result: exit 0; no whitespace errors. Existing line-ending conversion warnings remain non-errors.

Scope confirmation: no database access, reset invocation, provider/Vercel/GitHub operation, deployment smoke, full gate, build, or E2E was run. Existing `.superpowers/sdd/progress.md` modification and two pre-existing untracked Phase 2 plan files were preserved.

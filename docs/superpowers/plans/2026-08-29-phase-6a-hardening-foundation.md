# Phase 6A Hardening Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Confirm and minimally strengthen Evironn's inherited hardening foundation at portfolio/demo scale without creating a security or platform framework.

**Architecture:** Preserve the working Evironn implementation and compare it with the read-only `D:\Projects\fashion-shop` technical source. Change only demonstrated stale identifiers or defects, add the smallest useful regression coverage, and keep deployed/provider/database work behind separate user authorization.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Auth.js, Prisma/Neon, Upstash Redis, Sentry, GitHub Actions, and Vercel configuration.

## Global Constraints

- Work only on `phase/06-hardening-release`. Before Task 1 changes anything, run `git rev-parse HEAD`, verify that commit contains this approved plan, and record that exact hash in `.superpowers/sdd/progress.md` as the Phase 6A implementation baseline.
- Evironn is a portfolio/demo project without real clients or valuable production data. Phase 6A confirms and minimally strengthens the existing foundation; it must not become a security/platform framework.
- Reuse working Evironn code. Keep Redis configuration checks at their current owners; do not create `lib/redis-config.ts`. Do not add configuration resolvers, policy engines, changed-path collectors, secret scanners, runbook-test frameworks, ownership models, or other abstractions without a demonstrated defect that cannot be fixed at the current owner.
- No application code, tests, provider, database, Vercel, or GitHub operation begins until the user approves this plan.
- During execution, no database command, provider call, Vercel mutation, GitHub settings mutation, deployment, full gate, build, E2E, push, pull request, merge, or 6B work belongs to Phase 6A.
- `D:\Projects\fashion-shop` is read-only. Never copy its RITM names, URLs, environment evidence, counts, or provider identifiers.
- Preserve Phase 4 payment/stock behavior and Phase 5 protected ADMIN/public synthetic demo-admin isolation.
- Never print secrets, credentials, DSNs, tokens, cookies, payment data, or personal data. Environment inspection is presence-only.
- At most one conventional commit may be created per task. A characterization-only task needs no commit.
- Do not create or edit `docs/roadmap/DECISIONS.md` in Phase 6A.

## Binding behavior

ordinary rate-limit consumers fail open when Redis configuration is absent, as current; runtime Redis errors are not masked as absent configuration; demo reset fails closed when Redis/lock configuration is absent; reset only with `DEMO_MODE=true` and `VERCEL_ENV=production`; `CRON_SECRET` required; existing NX lock, TTL 900 seconds, random owner token, compare-and-delete Lua preserved; reset only for isolated portfolio/demo database, so global temporary cart/wishlist/verification/subscriber cleanup is acceptable there; no per-row ownership model; no demo-reset ownership redesign; no ownership tests/block flow/brainstorming `DECISIONS.md` gate; no DB/provider/Vercel mutation without separate authorization.

## Compact source-parity matrix

| Boundary                           | Current Evironn path                                                                                                                                                                                                                                                                                                                                                                                                                       | Read-only technical-source path                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Current focused evidence                                                                                                                                                                                                                                                                          | Observed difference                                                                                                                                                                                         | Decision        | Required verification                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate-limit implementation          | `D:\Projects\evironn\lib\rate-limit.ts`; `D:\Projects\evironn\lib\rate-limit-response.ts`                                                                                                                                                                                                                                                                                                                                                  | `D:\Projects\fashion-shop\lib\rate-limit.ts`; `D:\Projects\fashion-shop\lib\rate-limit-response.ts`                                                                                                                                                                                                                                                                                                                                                                                     | `D:\Projects\evironn\tests\rate-limit.test.ts`; `D:\Projects\evironn\tests\rate-limit-response.test.ts`                                                                                                                                                                                           | Behavior matches the source pattern, including `KV_REST_API_*`/`UPSTASH_REDIS_REST_*` aliases and absent-configuration fail-open. Evironn still uses `stride-app:*` prefixes.                               | adapt           | Replace only prefixes with `evironn-app:*`; characterize one complete preferred alias pair, one representative incomplete or mixed configuration, fail-open unavailable configuration, and an unmasked configured runtime Redis error.                                                                                     |
| Rate-limit consumers               | `D:\Projects\evironn\auth.config.ts`; `D:\Projects\evironn\app\actions\auth.ts`; `D:\Projects\evironn\app\actions\verification.ts`; `D:\Projects\evironn\app\api\dadata\suggest\route.ts`; `D:\Projects\evironn\app\api\cart\route.ts`; `D:\Projects\evironn\app\(auth)\register\page.tsx`                                                                                                                                                 | `D:\Projects\fashion-shop\auth.config.ts`; `D:\Projects\fashion-shop\app\actions\auth.ts`; `D:\Projects\fashion-shop\app\actions\verification.ts`; `D:\Projects\fashion-shop\app\api\dadata\suggest\route.ts`; `D:\Projects\fashion-shop\app\api\cart\route.ts`; `D:\Projects\fashion-shop\app\(auth)\register\page.tsx`                                                                                                                                                                | `D:\Projects\evironn\tests\register-user.test.ts`; `D:\Projects\evironn\tests\verification-actions.test.ts`; `D:\Projects\evironn\tests\dadata-suggest-route.test.ts`; `D:\Projects\evironn\tests\cart-route-canonical.test.ts`; `D:\Projects\evironn\tests\evironn-auth-source-contract.test.ts` | Evironn has furniture-era route and UI adaptations; limiter call order and short-circuits already exist.                                                                                                    | reuse unchanged | Characterize login/register, verification resend/gate, DaData missing-token short-circuit, and cart behavior. Modify a consumer only if a focused test demonstrates a defect.                                                                                                                                              |
| CSRF and middleware                | `D:\Projects\evironn\middleware.ts`; `D:\Projects\evironn\lib\security\csrf.ts`                                                                                                                                                                                                                                                                                                                                                            | `D:\Projects\fashion-shop\middleware.ts`; `D:\Projects\fashion-shop\lib\security\csrf.ts`                                                                                                                                                                                                                                                                                                                                                                                               | `D:\Projects\evironn\tests\csrf.test.ts`; `D:\Projects\evironn\tests\middleware-auth.test.ts`                                                                                                                                                                                                     | Functional source parity; Evironn matcher and Auth.js composition are already broad enough for page-posted Server Actions and API routes, with the YooKassa webhook exemption.                              | reuse unchanged | Characterize cross-site rejection before Auth.js, same-origin delegation, malformed Origin rejection, safe methods, and the single webhook exemption. Fix only a demonstrated bypass or matcher gap.                                                                                                                       |
| Security headers and CSP           | `D:\Projects\evironn\lib\security\headers.mjs`                                                                                                                                                                                                                                                                                                                                                                                             | `D:\Projects\fashion-shop\lib\security\headers.mjs`                                                                                                                                                                                                                                                                                                                                                                                                                                     | `D:\Projects\evironn\tests\security-headers.test.ts`                                                                                                                                                                                                                                              | Functional parity. Current Evironn sources cover Cloudinary, YooKassa, DaData, Sentry regional ingest, Google Fonts, and preview-only Vercel Live.                                                          | reuse unchanged | Assert critical sources and production exclusion/preview inclusion for Vercel Live. Do not create exact-equality tests for every directive.                                                                                                                                                                                |
| Sentry, logger, and PII            | `D:\Projects\evironn\sentry.server.config.ts`; `D:\Projects\evironn\sentry.edge.config.ts`; `D:\Projects\evironn\instrumentation.ts`; `D:\Projects\evironn\instrumentation-client.ts`; `D:\Projects\evironn\app\global-error.tsx`; `D:\Projects\evironn\lib\observability\sentry-options.ts`; `D:\Projects\evironn\lib\pii-scrub.ts`; `D:\Projects\evironn\lib\logger.ts`; `D:\Projects\evironn\app\api\admin\observability\test\route.ts` | `D:\Projects\fashion-shop\sentry.server.config.ts`; `D:\Projects\fashion-shop\sentry.edge.config.ts`; `D:\Projects\fashion-shop\instrumentation.ts`; `D:\Projects\fashion-shop\instrumentation-client.ts`; `D:\Projects\fashion-shop\app\global-error.tsx`; `D:\Projects\fashion-shop\lib\observability\sentry-options.ts`; `D:\Projects\fashion-shop\lib\pii-scrub.ts`; `D:\Projects\fashion-shop\lib\logger.ts`; `D:\Projects\fashion-shop\app\api\admin\observability\test\route.ts` | `D:\Projects\evironn\tests\sentry-options.test.ts`; `D:\Projects\evironn\tests\pii-scrub.test.ts`; `D:\Projects\evironn\tests\observability-test-route.test.ts`                                                                                                                                   | Sentry options, instrumentation, PII scrub, logger bridge, and ADMIN gate match the source foundation. Logger service remains `stride-app`.                                                                 | adapt           | Replace only logger service with `evironn-app`; add one bridge regression and reuse current Sentry/PII/ADMIN tests. No exhaustive per-file instrumentation suite.                                                                                                                                                          |
| Readiness and health               | `D:\Projects\evironn\lib\observability\readiness.ts`; `D:\Projects\evironn\app\api\health\route.ts`                                                                                                                                                                                                                                                                                                                                        | `D:\Projects\fashion-shop\lib\observability\readiness.ts`; `D:\Projects\fashion-shop\app\api\health\route.ts`                                                                                                                                                                                                                                                                                                                                                                           | `D:\Projects\evironn\tests\readiness.test.ts`; route is also listed in `D:\Projects\evironn\tests\smoke-script.test.ts`                                                                                                                                                                           | Functional parity: coarse `{ ok }`, DB probe, Redis-configuration dependency, and 200/503 mapping. No dedicated route test exists.                                                                          | reuse unchanged | Add one route-level characterization for status and minimal body. Fix only a demonstrated response or dependency defect.                                                                                                                                                                                                   |
| Demo reset and cron                | `D:\Projects\evironn\lib\demo-data\contracts.ts`; `D:\Projects\evironn\lib\demo-data\canonical.ts`; `D:\Projects\evironn\lib\demo-data\reset.ts`; `D:\Projects\evironn\lib\demo-data\reset-lock.ts`; `D:\Projects\evironn\app\api\cron\reset-demo\route.ts`                                                                                                                                                                                | `D:\Projects\fashion-shop\lib\demo-data\contracts.ts`; `D:\Projects\fashion-shop\lib\demo-data\canonical.ts`; `D:\Projects\fashion-shop\lib\demo-data\reset.ts`; `D:\Projects\fashion-shop\lib\demo-data\reset-lock.ts`; `D:\Projects\fashion-shop\app\api\cron\reset-demo\route.ts`                                                                                                                                                                                                    | `D:\Projects\evironn\tests\demo-data-canonical.test.ts`; `D:\Projects\evironn\tests\demo-data-reset.test.ts`; `D:\Projects\evironn\tests\demo-reset-route.test.ts`; `D:\Projects\evironn\tests\vercel-cron.test.ts`                                                                               | Evironn canonical furniture inventory is intentional. Guard, idempotency, global temporary-data cleanup, cron authentication, and lock algorithm match the source. Lock key remains `ritm:demo-reset-lock`. | adapt           | Replace only the lock key with `evironn:demo-reset-lock`; characterize one complete preferred alias pair, one representative incomplete or mixed configuration that fails closed before work, one unmasked configured runtime Redis error, environment guard, idempotency, and NX/900-second TTL/random token/Lua release. |
| Environment, CI, Vercel, and smoke | `D:\Projects\evironn\.env.example`; `D:\Projects\evironn\.github\workflows\ci.yml`; `D:\Projects\evironn\.github\workflows\deployment-smoke.yml`; `D:\Projects\evironn\vercel.json`; `D:\Projects\evironn\scripts\smoke-production.mjs`                                                                                                                                                                                                    | `D:\Projects\fashion-shop\.env.example`; `D:\Projects\fashion-shop\.github\workflows\ci.yml`; `D:\Projects\fashion-shop\.github\workflows\deployment-smoke.yml`; `D:\Projects\fashion-shop\vercel.json`; `D:\Projects\fashion-shop\scripts\smoke-production.mjs`                                                                                                                                                                                                                        | `D:\Projects\evironn\tests\ci-workflow.test.ts`; `D:\Projects\evironn\tests\vercel-cron.test.ts`; `D:\Projects\evironn\tests\smoke-script.test.ts`                                                                                                                                                | Evironn correctly uses public alias `https://evironn-app.vercel.app`, keeps the required smoke job unskipped, and documents current variables. CI still uses active `ritm_build` dummy database names.      | adapt           | Rename dummy CI database names to `evironn_build`; characterize environment names, cron, smoke routes, completed-deployment failure behavior, and public alias. No deployment or provider call.                                                                                                                            |
| Retired warmup                     | `D:\Projects\evironn\app\api\health\warmup\route.ts`: none; `D:\Projects\evironn\app\api\admin\health\warmup\route.ts`: none                                                                                                                                                                                                                                                                                                               | `D:\Projects\fashion-shop\app\api\health\warmup\route.ts`: none; `D:\Projects\fashion-shop\app\api\admin\health\warmup\route.ts`                                                                                                                                                                                                                                                                                                                                                        | `D:\Projects\evironn\tests\admin-warmup-route.test.ts`; technical-source equivalent test: none                                                                                                                                                                                                    | Evironn intentionally retired the inherited ADMIN warmup route after proving no caller.                                                                                                                     | retire          | Keep both routes absent and preserve the existing no-caller regression test.                                                                                                                                                                                                                                               |
| Legacy Cloudinary compatibility    | `D:\Projects\evironn\lib\cloudinary\folders.ts`                                                                                                                                                                                                                                                                                                                                                                                            | Technical-source equivalent folder module: none                                                                                                                                                                                                                                                                                                                                                                                                                                         | `D:\Projects\evironn\tests\phase-5-active-brand.test.ts`; `D:\Projects\evironn\tests\media-sign-route.test.ts`                                                                                                                                                                                    | `LEGACY_MEDIA_PREFIX = 'ritm/'` remains an intentional read/delete compatibility boundary; signing already rejects RITM folders.                                                                            | reuse unchanged | Keep the symbol and its narrow tests. Do not classify it as stale active branding or broaden Phase 6A into media migration.                                                                                                                                                                                                |
| Operations guidance                | `D:\Projects\evironn\docs\operations`: none                                                                                                                                                                                                                                                                                                                                                                                                | `D:\Projects\fashion-shop\docs\operations\security-verification.md`; `D:\Projects\fashion-shop\docs\operations\demo-data-runbook.md`                                                                                                                                                                                                                                                                                                                                                    | Evironn operations document: none                                                                                                                                                                                                                                                                 | Useful source guidance exists, but it contains RITM deployment/provider details and exceeds this checkpoint when copied wholesale.                                                                          | port narrowly   | Create at most one short Evironn document only because the current operations directory is absent; document local checks, authorization boundaries, reset preconditions, and rollback expectations without deployed claims.                                                                                                |

## Dependencies and global stop conditions

Tasks are sequential: Task 1 establishes the accepted reuse/cleanup baseline; Task 2 verifies runtime security and observability boundaries; Task 3 verifies reset and operational boundaries; Task 4 runs one combined checkpoint and one review.

Stop and return to the user without broadening scope if any required fix needs a Prisma/schema change, new provider contract, new infrastructure abstraction, per-row ownership, a different demo-reset model, or deployed/provider/database mutation. A failed characterization is not permission for a rewrite: isolate the demonstrated defect at its current owner first.

---

### Task 1 Audit and minimal Evironn hardening cleanup

**Files**

- Modify: `D:\Projects\evironn\lib\rate-limit.ts`
- Modify: `D:\Projects\evironn\lib\logger.ts`
- Modify: `D:\Projects\evironn\lib\demo-data\reset-lock.ts`
- Modify: `D:\Projects\evironn\.github\workflows\ci.yml`
- Modify: `D:\Projects\evironn\tests\phase-5-active-brand.test.ts`
- Verify unchanged: `D:\Projects\evironn\lib\cloudinary\folders.ts`
- Verify absent: `D:\Projects\evironn\app\api\health\warmup\route.ts`
- Verify absent: `D:\Projects\evironn\app\api\admin\health\warmup\route.ts`
- Verify unchanged: `D:\Projects\evironn\tests\admin-warmup-route.test.ts`
- Read-only comparison: every technical-source path listed in the source-parity matrix

**Characterization and RED/GREEN**

- [ ] Reconfirm the matrix against the recorded approved-plan baseline; classify formatting and Evironn domain adaptations as reuse, not rewrite candidates.
- [ ] Extend `tests/phase-5-active-brand.test.ts` to assert these exact active values: rate-limit prefixes `evironn-app:login`, `evironn-app:verify`, `evironn-app:resend`, `evironn-app:newsletter`, `evironn-app:dadata`, `evironn-app:cart`, and `evironn-app:auth`; logger service `evironn-app`; reset lock key `evironn:demo-reset-lock`; CI dummy database `evironn_build`. Preserve `LEGACY_MEDIA_PREFIX = 'ritm/'` as the only intentional active compatibility identifier in application source.
- [ ] RED: run the focused command before production edits. Expected: the new stale-identifier assertions fail on the current `stride-app`, `ritm:demo-reset-lock`, and `ritm_build` values; warmup regression remains green.
- [ ] GREEN: replace only those demonstrated stale literals. Do not add a namespace helper or shared configuration abstraction.
- [ ] Preserve both retired warmup routes as absent and keep `tests/admin-warmup-route.test.ts` unchanged.

Run:

```powershell
npx vitest run tests/phase-5-active-brand.test.ts tests/admin-warmup-route.test.ts tests/ci-workflow.test.ts
```

Expected: all three files pass; no active `stride-app`, `ritm:demo-reset-lock`, or `ritm_build` remains; the Cloudinary legacy symbol remains; no warmup route or caller is reintroduced.

**Commit limit:** at most one commit, subject `fix: clean stale hardening identifiers`. Do not commit if execution is not separately authorized.

**Stop condition:** stop if another RITM identifier appears outside historical tests, fixtures, docs, build output, or the intentional Cloudinary compatibility symbol and its removal is not proven safe.

---

### Task 2 Verify critical security and observability boundaries

**Files**

- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\rate-limit.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\rate-limit-response.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\auth.config.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\app\actions\auth.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\app\actions\verification.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\app\api\dadata\suggest\route.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\app\api\cart\route.ts`
- Inspect; modify only if registration coverage proves it necessary: `D:\Projects\evironn\app\(auth)\register\page.tsx`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\middleware.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\security\csrf.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\security\headers.mjs`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\sentry.server.config.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\sentry.edge.config.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\instrumentation.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\instrumentation-client.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\app\global-error.tsx`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\observability\sentry-options.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\pii-scrub.ts`
- Inspect; Task 1 owns the service-name edit: `D:\Projects\evironn\lib\logger.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\observability\readiness.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\app\api\health\route.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\app\api\admin\observability\test\route.ts`
- Modify focused tests: `D:\Projects\evironn\tests\rate-limit.test.ts`, `D:\Projects\evironn\tests\csrf.test.ts`, `D:\Projects\evironn\tests\middleware-auth.test.ts`, `D:\Projects\evironn\tests\security-headers.test.ts`, `D:\Projects\evironn\tests\sentry-options.test.ts`, `D:\Projects\evironn\tests\pii-scrub.test.ts`, `D:\Projects\evironn\tests\readiness.test.ts`, `D:\Projects\evironn\tests\observability-test-route.test.ts`
- Create: `D:\Projects\evironn\tests\logger-sentry-bridge.test.ts`
- Create: `D:\Projects\evironn\tests\health-route.test.ts`
- Reuse unchanged consumer tests: `D:\Projects\evironn\tests\rate-limit-response.test.ts`, `D:\Projects\evironn\tests\register-user.test.ts`, `D:\Projects\evironn\tests\verification-actions.test.ts`, `D:\Projects\evironn\tests\dadata-suggest-route.test.ts`, `D:\Projects\evironn\tests\cart-route-canonical.test.ts`, `D:\Projects\evironn\tests\evironn-auth-source-contract.test.ts`

**Characterization and conditional RED/GREEN**

- [ ] In existing `tests/rate-limit.test.ts`, keep the Redis configuration matrix portfolio-sized: prove one complete preferred alias pair works, one representative incomplete or mixed configuration is unavailable and fails open for the ordinary limiter, and one configured runtime Redis error propagates unchanged rather than being relabeled absent configuration. Existing coverage may satisfy these cases; add only missing assertions. Keep any fix inside `lib/rate-limit.ts`; do not create `lib/redis-config.ts`.
- [ ] Characterize login/register, `resendVerificationCode`, `ensureVerificationGate`, cart, and DaData separately. Preserve DaData's no-token return before limiter and upstream calls.
- [ ] Characterize middleware ordering: a cross-site state-changing request returns 403 without invoking Auth.js; same-origin requests delegate; malformed explicit Origin is rejected; safe methods and `/api/yookassa/webhook` retain current behavior.
- [ ] Characterize critical CSP/header behavior only: Cloudinary image source, YooKassa frame sources, DaData and regional Sentry connections, Google Fonts, HSTS, frame denial, and Vercel Live present only for preview/development. Do not introduce an exact-equality framework for all directives.
- [ ] Create one logger bridge test proving `service: 'evironn-app'`, scrubbed structured fields, scrubbed Sentry extras, and one `captureException` call for an error. Reuse current PII and runtime-option tests; do not add one test per Sentry file.
- [ ] Create one health-route test proving `{ ok: true }`/200 and `{ ok: false }`/503 with no dependency details or error text in the body. Keep `checkReadiness` coarse.
- [ ] Reuse the existing controlled-observability test to prove denial is forwarded and only ADMIN can emit the controlled event and flush Sentry.
- [ ] Run characterization first. It may pass immediately. Treat only a genuine failing behavior assertion as RED; make the smallest owner-local GREEN fix and rerun this same command. Do not manufacture a RED state for already-correct behavior.

Run:

```powershell
npx vitest run tests/rate-limit.test.ts tests/rate-limit-response.test.ts tests/register-user.test.ts tests/verification-actions.test.ts tests/dadata-suggest-route.test.ts tests/cart-route-canonical.test.ts tests/evironn-auth-source-contract.test.ts tests/csrf.test.ts tests/middleware-auth.test.ts tests/security-headers.test.ts tests/sentry-options.test.ts tests/pii-scrub.test.ts tests/logger-sentry-bridge.test.ts tests/readiness.test.ts tests/health-route.test.ts tests/observability-test-route.test.ts
```

Expected: every listed file passes; absent Redis configuration alone fails open for ordinary consumers; runtime Redis errors reject; critical CSRF/CSP/header boundaries pass; Sentry remains errors-only with PII disabled/scrubbed; health stays coarse; observability emission stays ADMIN-only.

**Commit limit:** at most one commit, subject `test: verify critical hardening boundaries` when characterization alone is sufficient, or `fix: close critical hardening defects` when a demonstrated defect requires production code. Do not create both.

**Stop condition:** stop before introducing a generalized security-policy layer, exhaustive Sentry instrumentation suite, all-directive CSP equality contract, or any change to provider configuration.

---

### Task 3 Verify demo reset, environment, CI, and deployment smoke

**Files**

- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\demo-data\contracts.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\demo-data\canonical.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\lib\demo-data\reset.ts`
- Inspect after Task 1's key edit; modify only for a demonstrated defect: `D:\Projects\evironn\lib\demo-data\reset-lock.ts`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\app\api\cron\reset-demo\route.ts`
- Inspect; modify only if the documented contract is incomplete: `D:\Projects\evironn\.env.example`
- Inspect after Task 1's dummy-name edit; modify only for a demonstrated defect: `D:\Projects\evironn\.github\workflows\ci.yml`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\.github\workflows\deployment-smoke.yml`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\vercel.json`
- Inspect; modify only for a demonstrated defect: `D:\Projects\evironn\scripts\smoke-production.mjs`
- Modify focused tests: `D:\Projects\evironn\tests\demo-data-canonical.test.ts`, `D:\Projects\evironn\tests\demo-data-reset.test.ts`, `D:\Projects\evironn\tests\demo-reset-route.test.ts`, `D:\Projects\evironn\tests\ci-workflow.test.ts`, `D:\Projects\evironn\tests\vercel-cron.test.ts`, `D:\Projects\evironn\tests\smoke-script.test.ts`
- Create: `D:\Projects\evironn\tests\demo-reset-lock.test.ts`
- Create one short document because Evironn currently has no operations directory: `D:\Projects\evironn\docs\operations\phase-6a-hardening.md`
- Read-only documentation sources: `D:\Projects\fashion-shop\docs\operations\security-verification.md`; `D:\Projects\fashion-shop\docs\operations\demo-data-runbook.md`

**Characterization and conditional RED/GREEN**

- [ ] Keep the accepted reset model explicit: only the isolated portfolio/demo database is eligible; global temporary cart, wishlist, verification, and subscriber cleanup is acceptable there; customer order/payment cleanup remains constrained by the current visitor predicate; canonical furniture inventory and coupons are restored idempotently.
- [ ] Extend the environment characterization to require both `DEMO_MODE=true` and `VERCEL_ENV=production`. Preserve failure for every other combination. Do not add per-row ownership, ownership tests, block reports, or an ownership decision flow.
- [ ] In new `tests/demo-reset-lock.test.ts`, keep the Redis configuration matrix portfolio-sized: prove one complete preferred alias pair works, one representative incomplete or mixed configuration fails closed before `work` runs, and one configured acquisition or release runtime Redis error propagates unchanged rather than being relabeled absent configuration. For the configured case, prove acquisition uses `nx: true` and `ex: 900`, the value is a random owner token, a competing owner cannot run work, and release uses the existing compare-and-delete Lua with the same owner token. Keep any fix inside `lib/demo-data/reset-lock.ts`; do not create `lib/redis-config.ts`.
- [ ] Reuse route tests to prove missing `CRON_SECRET` returns 503, wrong/missing bearer returns 401, valid authorization delegates under the lock, and internal failures return only `{ ok: false }`.
- [ ] Verify `.env.example` names both Redis alias pairs, Sentry variables, `DEMO_MODE`, `CRON_SECRET`, and `SMOKE_BASE_URL` without real values. Do not inspect provider values.
- [ ] Verify CI uses `evironn_build`, performs no database mutation or E2E, and preserves its existing quality commands. Verify `vercel.json` retains the one daily `/api/cron/reset-demo` schedule.
- [ ] Verify deployment smoke uses public alias `https://evironn-app.vercel.app`, has no job-level skip, fails non-success deployment status, checks required public/demo/health routes, and confirms `/admin` denial. No required smoke may pass as skipped.
- [ ] Create `docs/operations/phase-6a-hardening.md` by adapting only useful portions of the two source documents. Keep it short: local focused commands; separate user-authorized deployed checks; presence-only environment review; reset preconditions and fail-closed behavior; approved public alias; rollback to last known-good code/config; no secrets; no production evidence claims. Do not create documentation wording tests.
- [ ] Run characterization first. It may pass immediately except for newly added lock coverage. Fix only a demonstrated defect at the current owner; do not add a reset or deployment framework.

Run:

```powershell
npx vitest run tests/demo-data-canonical.test.ts tests/demo-data-reset.test.ts tests/demo-reset-lock.test.ts tests/demo-reset-route.test.ts tests/ci-workflow.test.ts tests/vercel-cron.test.ts tests/smoke-script.test.ts
```

Expected: all listed files pass; reset guards/idempotency/lock semantics are proven; CI and cron contracts remain mutation-free; deployment smoke is required, public-alias based, and never skipped.

Run the standard path-only repository secret scan:

```powershell
git grep -IlE '(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|sk_live_[A-Za-z0-9]{16,}|postgres(ql)?://[^[:space:]\"]+:[^[:space:]\"]+@)' -- . ':!package-lock.json' ':!.env.example'
```

Expected: no unexplained secret-bearing path is listed. `.github/workflows/ci.yml` and `vitest.config.ts` are known fixture/config paths containing dummy database URLs and may appear; record them as explained test/build evidence rather than requiring an exact result count. Output remains path-only and prints no matched value. Inspect any other path without printing the matched value and continue only after it is safely dispositioned.

**Commit limit:** at most one commit, subject `test: verify demo reset and deployment contracts` when only tests/docs change, or `fix: close demo operations defects` when a demonstrated production defect is fixed. Do not create both.

**Stop condition:** stop before any database access, reset invocation, provider/Vercel/GitHub call, smoke against a deployed URL, or change that needs real environment evidence. Record local evidence only.

---

### Task 4 Run the Phase 6A focused checkpoint

**Files**

- Review the exact Phase 6A implementation diff from the recorded approved-plan baseline across the files listed in Tasks 1–3.
- Modify after successful review: `D:\Projects\evironn\docs\roadmap\STATUS.md`
- Modify after successful review: `D:\Projects\evironn\.superpowers\sdd\progress.md`
- Do not create a separate completion report.
- Do not modify: `D:\Projects\evironn\docs\roadmap\DECISIONS.md`

**Checkpoint**

- [ ] Confirm Tasks 1–3 are complete and no stop condition fired.
- [ ] Tasks 1–3 already own their full focused test runs. Run only the small cross-boundary checkpoint below; do not repeat their complete unions unless remediation changes the affected behavior.

Run:

```powershell
npx vitest run tests/phase-5-active-brand.test.ts tests/admin-warmup-route.test.ts tests/rate-limit.test.ts tests/logger-sentry-bridge.test.ts tests/demo-reset-lock.test.ts tests/demo-reset-route.test.ts tests/ci-workflow.test.ts tests/smoke-script.test.ts
```

Expected: every listed checkpoint file passes with no skipped required smoke assertion and no unexpected external access. Task-specific evidence remains the successful commands already recorded by Tasks 1–3.

- [ ] Build the Prettier path list manually from exactly the files changed by Tasks 1–3. Do not use a script, custom changed-path collector, glob, directory, broad owner-surface superset, `git diff` command substitution, or Task 4 documentation. The required planned list is:

  - `lib/rate-limit.ts`
  - `lib/logger.ts`
  - `lib/demo-data/reset-lock.ts`
  - `.github/workflows/ci.yml`
  - `tests/phase-5-active-brand.test.ts`
  - `tests/rate-limit.test.ts`
  - `tests/csrf.test.ts`
  - `tests/middleware-auth.test.ts`
  - `tests/security-headers.test.ts`
  - `tests/logger-sentry-bridge.test.ts`
  - `tests/health-route.test.ts`
  - `tests/demo-reset-lock.test.ts`
  - `tests/ci-workflow.test.ts`
  - `docs/operations/phase-6a-hardening.md`

- [ ] Append a path from this exact conditional list only when that file appears in the final Tasks 1–3 diff because characterization exposed a demonstrated defect or the named assertion required an edit: `lib/rate-limit-response.ts`, `auth.config.ts`, `app/actions/auth.ts`, `app/actions/verification.ts`, `app/(auth)/register/page.tsx`, `app/api/dadata/suggest/route.ts`, `app/api/cart/route.ts`, `middleware.ts`, `lib/security/csrf.ts`, `lib/security/headers.mjs`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `instrumentation-client.ts`, `app/global-error.tsx`, `lib/observability/sentry-options.ts`, `lib/pii-scrub.ts`, `lib/observability/readiness.ts`, `app/api/health/route.ts`, `app/api/admin/observability/test/route.ts`, `lib/demo-data/contracts.ts`, `lib/demo-data/canonical.ts`, `lib/demo-data/reset.ts`, `app/api/cron/reset-demo/route.ts`, `.github/workflows/deployment-smoke.yml`, `vercel.json`, `scripts/smoke-production.mjs`, `tests/sentry-options.test.ts`, `tests/pii-scrub.test.ts`, `tests/readiness.test.ts`, `tests/observability-test-route.test.ts`, `tests/demo-data-canonical.test.ts`, `tests/demo-data-reset.test.ts`, `tests/demo-reset-route.test.ts`, `tests/vercel-cron.test.ts`, and `tests/smoke-script.test.ts`. Do not append unchanged files. Keep `.env.example` out even if it changes.

Run this exact command pattern after manually deleting absent conditional paths and manually appending only present conditional paths on the same line:

```powershell
npx prettier --check lib/rate-limit.ts lib/logger.ts lib/demo-data/reset-lock.ts .github/workflows/ci.yml tests/phase-5-active-brand.test.ts tests/rate-limit.test.ts tests/csrf.test.ts tests/middleware-auth.test.ts tests/security-headers.test.ts tests/logger-sentry-bridge.test.ts tests/health-route.test.ts tests/demo-reset-lock.test.ts tests/ci-workflow.test.ts docs/operations/phase-6a-hardening.md
```

Expected: the final command names every Prettier-supported file changed by Tasks 1–3 exactly once, names no unchanged file, excludes `.env.example`, and exits 0. If any required planned path did not change, remove it manually before running; if any exact conditional path changed, append it manually before running. Record the final command verbatim in `progress.md`. No helper or changed-path collector is created.

- [ ] Run whitespace validation.

Run:

```powershell
git diff --check
```

Expected: exit code 0 with no whitespace errors.

- [ ] Run `npm run typecheck` only if the final diff changes an exported TypeScript type, shared DTO, route signature, or another shared TypeScript contract. Expected when run: exit code 0. If the diff contains only literals, local logic, tests, YAML/JSON, and Markdown, record `NOT RUN — no shared TypeScript contract changed` in `progress.md`.
- [ ] Send one exact Phase 6A diff from the recorded approved-plan baseline and the focused evidence above to one fresh isolated Sol Medium functional/security reviewer on the normal/default service tier. Reviewer visible updates use `caveman ultra`; review report uses normal technical English and reports Critical, Important, and Minor findings. Review must cover only demonstrated 6A behavior, portfolio proportionality, fail-open/fail-closed boundaries, CSRF/CSP, Sentry/PII/ADMIN control, reset guards/lock/idempotency, required smoke, secret safety, and scope exclusions.
- [ ] Do not run a second broad review. If the reviewer finds Critical or Important defects, remediate only those exact findings, rerun affected focused tests plus Prettier and `git diff --check`, and continue the same review thread until no blocking finding remains. A finding that requires excluded architecture or external mutation triggers the stop condition instead.
- [ ] Update `docs/roadmap/STATUS.md` and `.superpowers/sdd/progress.md` in normal technical English with the exact changed boundaries, focused command outcomes, conditional typecheck disposition, secret-scan result, reviewer verdict, and explicit note that full gate/build/E2E remain Phase 6D work. Do not create a completion-report framework and do not edit `DECISIONS.md`.

**Commit limit:** at most one commit, subject `docs: record phase 6a focused checkpoint`. No push follows.

**Stop condition:** stop after the local checkpoint and documentation update. Do not push, open a pull request, merge, begin 6B, run the full gate, build, E2E, deployed smoke, provider checks, or database commands.

## Scope exclusions

- No new Redis/configuration abstraction, policy framework, path collector, secret scanner, ownership model, completion-report system, or repeated checkpoint.
- No exhaustive Sentry-per-file tests and no exact-equality framework for every CSP directive.
- No demo-reset ownership redesign, ownership tests, blocked report, brainstorming flow, or `DECISIONS.md` gate.
- No Prisma/schema/migration work, database command, database mutation, reset execution, provider operation, Vercel change, GitHub settings change, deployment, full gate, build, E2E, push, pull request, merge, or 6B work.
- No broad operations suite. One short Phase 6A operations document is the maximum because Evironn currently has no operations directory.
- No performance work; accepted initial Vercel latency remains Phase 6C.
- No real YooKassa sandbox operation; it remains optional under ADR-020.

## Approval stop

Planning ends with this rewritten four-task plan. Implementation remains stopped until the user explicitly approves execution. After Phase 6A execution, stop again at the focused checkpoint for user direction; Phase 6D owns the complete gate/build/E2E closeout.

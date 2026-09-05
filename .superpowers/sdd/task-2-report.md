# Task 2 report: critical security and observability boundaries

Date: 2026-08-29
Branch: `phase/06-hardening-release`
Base implementation commit: `4c3c6d3`

## Result

Task 2 completed with one demonstrated production defect fixed in `lib/rate-limit.ts`.

The Redis configuration resolver now accepts only complete alias pairs. It prefers the complete `KV_REST_API_URL` + `KV_REST_API_TOKEN` pair, otherwise accepts the complete `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` pair. Mixed or incomplete aliases remain unavailable and ordinary consumers fail open. Configured runtime Redis errors still propagate unchanged.

No provider, database, Vercel, GitHub, branch, or external-service mutation was performed. No full gate, build, or E2E run was performed, per the Task 2 brief.

## Commands and exit results

Initial characterization, before adding missing Task 2 coverage:

```powershell
npx vitest run tests/rate-limit.test.ts tests/rate-limit-response.test.ts tests/register-user.test.ts tests/verification-actions.test.ts tests/dadata-suggest-route.test.ts tests/cart-route-canonical.test.ts tests/evironn-auth-source-contract.test.ts tests/csrf.test.ts tests/middleware-auth.test.ts tests/security-headers.test.ts tests/sentry-options.test.ts tests/pii-scrub.test.ts tests/logger-sentry-bridge.test.ts tests/readiness.test.ts tests/health-route.test.ts tests/observability-test-route.test.ts
```

Exit 0. Vitest reported 14 passed files and 55 passed tests; absent new test files were not collected.

Test-first RED:

The same command, after adding the missing logger/health coverage and boundary assertions, exited 1. Vitest reported 2 failed files, 14 passed files, 2 failed tests, and 61 passed tests.

- Genuine defect: mixed `KV_REST_API_URL` + `UPSTASH_REDIS_REST_TOKEN` was treated as configured; expected unavailable/fail-open, received configured behavior.
- Test-double characterization mistake: same-origin middleware correctly delegated to the inline Auth.js mock and returned 307; the assertion incorrectly expected the wrapper's 200 response. The test was corrected without production change.

GREEN and final focused verification:

```powershell
npx vitest run tests/rate-limit.test.ts tests/rate-limit-response.test.ts tests/register-user.test.ts tests/verification-actions.test.ts tests/dadata-suggest-route.test.ts tests/cart-route-canonical.test.ts tests/evironn-auth-source-contract.test.ts tests/csrf.test.ts tests/middleware-auth.test.ts tests/security-headers.test.ts tests/sentry-options.test.ts tests/pii-scrub.test.ts tests/logger-sentry-bridge.test.ts tests/readiness.test.ts tests/health-route.test.ts tests/observability-test-route.test.ts
```

Exit 0. Vitest reported 16 passed files and 63 passed tests.

Focused formatting, lint, and whitespace verification command:

```powershell
npx prettier --check lib/rate-limit.ts tests/rate-limit.test.ts tests/dadata-suggest-route.test.ts tests/csrf.test.ts tests/middleware-auth.test.ts tests/security-headers.test.ts tests/logger-sentry-bridge.test.ts tests/health-route.test.ts
npx eslint lib/rate-limit.ts tests/rate-limit.test.ts tests/dadata-suggest-route.test.ts tests/csrf.test.ts tests/middleware-auth.test.ts tests/security-headers.test.ts tests/logger-sentry-bridge.test.ts tests/health-route.test.ts
git diff --check
```

Exit 0 for all three checks. Prettier reported all matched files use code style. Git emitted existing LF/CRLF conversion warnings only; no whitespace errors.

## Characterization and coverage

- Redis matrix: complete preferred alias pair, mixed aliases unavailable/fail-open, configured runtime error identity preserved, and absent configuration fail-open for auth/cart.
- Login/register, verification, resend, verification gate, cart, and DaData consumer tests reused. DaData now explicitly proves missing `DADATA_TOKEN` returns before limiter and upstream fetch.
- CSRF/middleware ordering: cross-site state-changing requests return 403 before Auth.js; same-origin state-changing requests delegate; malformed explicit origins reject; safe methods and YooKassa webhook exemption remain covered.
- CSP/security headers: critical Cloudinary image, YooKassa frame, DaData, regional Sentry, Google Fonts, HSTS, frame denial, and Vercel Live preview-only boundaries asserted without all-directive equality.
- Logger bridge: service `evironn-app`, structured-field scrubbing, Sentry extra scrubbing, and one `captureException` call for an error.
- Health: 200 `{ ok: true }` and 503 `{ ok: false }`; body contains no dependency details or error text.
- Controlled observability route: existing denial forwarding and ADMIN-only event/flush coverage passed unchanged.
- Existing PII and Sentry runtime-option tests passed unchanged.

## Changed files

- `lib/rate-limit.ts`: owner-local complete-pair Redis credential resolution; existing Evironn prefixes and fail-open/runtime-error behavior retained.
- `tests/rate-limit.test.ts`: compact Redis configuration matrix and runtime error assertion.
- `tests/dadata-suggest-route.test.ts`: missing-token ordering assertion.
- `tests/csrf.test.ts`: malformed explicit origin assertion.
- `tests/middleware-auth.test.ts`: CSRF-before-Auth.js and same-origin delegation assertions.
- `tests/security-headers.test.ts`: critical CSP/header boundary assertions.
- `tests/logger-sentry-bridge.test.ts`: new logger/Sentry bridge test.
- `tests/health-route.test.ts`: new coarse health response test.
- `.superpowers/sdd/task-2-report.md`: this report.

Task 1-owned `lib/logger.ts` was inspected and not modified.

## Self-review

- One production defect fixed at the narrowest owner-local layer.
- No `lib/redis-config.ts`, generalized security-policy layer, exhaustive Sentry suite, provider configuration change, or all-directive CSP contract introduced.
- Redis runtime failures remain outside configuration detection and reject unchanged.
- CSRF, CSP, Sentry PII, ADMIN observability, coarse health, Phase 4 payment/stock, and Phase 5 ADMIN/demo isolation boundaries remain within scope and focused tests pass.
- Only Task 2 files were changed; protected pre-existing untracked Phase 2 plan files and pre-existing `.superpowers/sdd/progress.md` modification were preserved and not staged.
- No secrets were added or printed.

## Concerns

None within Task 2. Full Phase 6 completion gate, production build, and E2E remain intentionally pending for the phase closeout.

## Commit and post-check evidence

- Commit command: `git commit -m "fix: close critical hardening defects"` exited 0.
- Exactly one Task 2 commit was created; no second conventional commit was created.
- Staged-file audit before commit contained exactly these nine Task 2 files: this report, `lib/rate-limit.ts`, five modified focused tests, and the two new focused tests.
- Task 1 `lib/logger.ts`, `.superpowers/sdd/progress.md`, and both protected untracked Phase 2 plan files were not staged.
- Initial commit output included 9 files, 323 insertions, and 20 deletions; final report amendment output included 9 files, 332 insertions, and 20 deletions.
- Post-check: branch remains `phase/06-hardening-release`; preserved progress and protected plan changes remain outside Task 2 commit.

## Reviewer follow-up

The Important finding was fixed by explicitly stubbing all four Redis alias environment variables to empty strings in `tests/rate-limit.test.ts` `beforeEach`, before each case sets its intended configuration. The compact preferred-pair, mixed/incomplete, runtime-error, and absent-configuration matrix is unchanged.

The Minor finding was fixed by adding `afterEach(() => vi.restoreAllMocks())` in `tests/logger-sentry-bridge.test.ts` and removing the assertion-dependent manual console-spy restore.

Affected focused verification:

```powershell
npx vitest run tests/rate-limit.test.ts tests/logger-sentry-bridge.test.ts
npx prettier --check tests/rate-limit.test.ts tests/logger-sentry-bridge.test.ts
git diff --check
```

Exit 0 for all checks. Vitest reported 2 passed files and 5 passed tests. Prettier reported all matched files use code style. Git emitted existing LF/CRLF conversion warnings only; no whitespace errors.

The existing Task 2 commit was amended; no second commit was created.

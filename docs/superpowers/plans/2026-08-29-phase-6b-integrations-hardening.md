# Phase 6B Integrations Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify and minimally strengthen Evironn's existing environment and external-provider boundaries, fixing only a focused, proven DaData timeout gap while preserving accepted Cloudinary, Resend, YooKassa, payment, stock, and recovery contracts.

**Architecture:** Keep every provider contract at its current owner boundary. Use existing Vitest mocks to characterize accepted behavior, add only a route-local DaData timeout if the focused RED test proves the gap, and document a compact environment-role contract without introducing provider or configuration abstractions. Preserve the Phase 4, Phase 5, and Phase 6A boundaries and stop after a focused local checkpoint and review.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Prisma-owned payment state contracts, Cloudinary SDK, Resend, DaData HTTP API, YooKassa SDK, Prettier.

## Global Constraints

- Work only on branch `phase/06-hardening-release`; preserve the Phase 6A checkpoint and the two protected untracked Phase 2 plan files.
- Before Task 1 changes any implementation or durable status file, derive the approved-plan baseline with `git log -1 --format=%H -- docs/superpowers/plans/2026-08-29-phase-6b-integrations-hardening.md`, verify that commit contains this plan and `docs/superpowers/specs/2026-08-29-phase-6b-planning-brief.md`, and record the exact hash in `.superpowers/sdd/progress.md` as the Phase 6B implementation baseline. All Phase 6B diff checks must use that recorded approved-plan commit, never a pre-planning commit or the moving `HEAD`.
- Evironn is a portfolio/demo project with no real customer orders and no Production database. Use proportional, deterministic local verification.
- Preserve accepted Phase 4 payment/stock/snapshot/recovery contracts, Phase 5 ADMIN/Cloudinary/demo-admin contracts, and Phase 6A hardening contracts.
- Reuse compatible `fashion-shop` behavior only where the evidence bundle already classifies it as compatible. Do not copy RITM names, URLs, provider IDs, counts, or environment evidence.
- Never print environment values, tokens, credentials, DSNs, credential-bearing URLs, cookies, payment data, personal data, or provider responses containing secrets. Environment inspection is limited to names, target/environment, and presence.
- No real provider, database, Vercel, GitHub, deployment, build, E2E, full-gate, push, PR, merge, branch-deletion, or release operation belongs in Phase 6B.
- Do not add a provider framework, universal adapter, policy engine, configuration abstraction, environment-management platform, operations-test framework, secret-scanner framework, path collector, payment abstraction, or infrastructure layer.
- Do not add newsletter routes, subscription services, unsubscribe flows, pages, actions, database behavior, or provider behavior. ADR-009 keeps the newsletter subsystem deferred; retain only the existing generic `newsletter` sender kind.
- Preserve ADR-017's `W = 23 hours`, exact YooKassa correlation rules, `NOT_CREATED`/`INDETERMINATE`/`CREATED` classification, and no-create-after-window rule.
- Preserve ADR-018's durable `READY`/`CLAIMED`/`DISPATCHED`/`CORRELATED` claim model, write-once dispatch evidence, exact-owner guarded releases, and fail-closed behavior. Never infer no dispatch from a timeout.
- Under ADR-020, Vitest mocks external providers. Real YooKassa sandbox creation, cancellation, and refund remain optional manual smoke and non-blocking.
- No performance or initial-load work; Phase 6C owns it. No release closeout; Phase 6D owns it.
- Use existing focused suites when they already prove behavior. Add no exhaustive environment/provider matrix and no duplicate test for a contract already covered.
- During each task, run only its focused command and touched-file formatting. Run `npm run typecheck` only if a shared TypeScript contract, DTO, route signature, Prisma boundary, or framework configuration changes.
- Implementation may create at most one local conventional commit per task, after that task's Critical/Important review findings are resolved; maximum four Phase 6B task commits. Planning remains commit-free. Push, PR, merge, branch deletion, and release remain forbidden.
- Each task receives one fresh bounded review at its stated boundary. Reviewers inspect the assigned diff and reuse fresh command evidence; they do not rerun broad unions without a concrete risk.
- If characterization contradicts the evidence bundle or exposes a new architecture choice, stop the task. Do not expand implementation; return the finding for planning and user approval.

---

### Task 1: Environment and Provider-Contract Inventory Cleanup

**Files:**

- Modify: `.env.example` only if its names or adjacent comments contradict the evidence-listed canonical contract; otherwise leave unchanged.
- Modify: `docs/operations/phase-6a-hardening.md`
- Read/characterize owners: `lib/prisma-client.ts`, `lib/cloudinary/config.ts`, `lib/email/resend-client.ts`, `lib/email/send-email.ts`, `lib/verification/service.ts`, `lib/yookassa.ts`, `lib/payment-environment.ts`, `app/api/dadata/suggest/route.ts`, `lib/rate-limit.ts`, `lib/demo-data/reset-lock.ts`, `app/api/cron/reset-demo/route.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `instrumentation-client.ts`, and `next.config.mjs`.
- Test: no new test file unless an actual environment-name mismatch is found. A documentation-only role clarification does not justify an environment permutation suite.

**Ownership:** Environment names stay owned by their existing provider/database call sites. `.env.example` remains the canonical checked-in name inventory; `docs/operations/phase-6a-hardening.md` owns concise operator guidance. This task does not centralize runtime configuration.

**Interfaces:**

- Consumes: exact environment names and role classification from `.superpowers/sdd/phase-6b-planner-evidence.md`.
- Produces: one documented local/Preview/Production/build/optional-smoke contract using names and presence only; no new runtime API.
- Preserves: `VERCEL_ENV`, `VERCEL_URL`, and `VERCEL_GIT_COMMIT_SHA` as host metadata only where current code consumes them; `E2E_DATABASE_*` names as compatibility inputs under ADR-020; both complete Redis alias pairs; existing `EMAIL_FROM_NEWSLETTER` generic sender configuration without a newsletter subsystem.

**Exact behavior:**

- Document local runtime as database/Auth.js plus optional Resend, DaData, Cloudinary, YooKassa sandbox, Redis, and `NEXT_PUBLIC_SITE_URL`; absent optional providers must follow their owner fallback contracts.
- Document Preview as the same runtime contract plus Vercel metadata, with no production-only demo reset guard. Note that public and Sentry build/runtime values are target-specific without claiming deployed presence.
- Document Production as requiring database/Auth and provider values for enabled paths; YooKassa stays sandbox for the portfolio demo. Demo reset additionally requires `DEMO_MODE=true`, `VERCEL_ENV=production`, one complete Redis alias pair, and `CRON_SECRET`.
- Document build as consuming only current public/Sentry configuration and performing no database mutation.
- Document optional smoke with local/script input `SMOKE_BASE_URL` and the approved GitHub deployment-smoke alias `https://evironn-app.vercel.app`, without running either.
- Keep `.env.example` names already listed by evidence. Change only a demonstrated stale name, omission, or misleading comment; do not rename variables or add aliases for symmetry.

**Reuse versus demonstrated change:** Reuse all current runtime readers. Demonstrated change is narrow operations guidance: current documentation lacks one explicit environment-role contract. `.env.example` changes only if focused static characterization proves drift.

**Focused RED/characterization:** Step 1 compares declared names with exact current readers and establishes whether `.env.example` has drift; the evidence-proven documentation gap is absence of one compact environment-role contract.

**Minimal GREEN:** Add only the compact operations guidance and correct `.env.example` only for a specific name/comment mismatch printed by Step 1. No runtime code or new test follows from documentation-only work.

- [ ] **Step 1: Run a name-only characterization before editing**

```powershell
$declared = Select-String -Path '.env.example' -Pattern '^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=' | ForEach-Object { $_.Matches[0].Groups[1].Value } | Sort-Object -Unique
$readers = @('lib/prisma-client.ts','lib/cloudinary/config.ts','lib/email/resend-client.ts','lib/email/send-email.ts','lib/verification/service.ts','lib/yookassa.ts','lib/payment-environment.ts','app/api/dadata/suggest/route.ts','lib/rate-limit.ts','lib/demo-data/reset-lock.ts','app/api/cron/reset-demo/route.ts','sentry.server.config.ts','sentry.edge.config.ts','instrumentation.ts','instrumentation-client.ts','next.config.mjs')
$dotNames = rg -o --no-filename 'process\.env\.[A-Z][A-Z0-9_]*' $readers | ForEach-Object { $_ -replace '^process\.env\.', '' }
$bracketNames = rg -o --no-filename 'process\.env\[[''\"][A-Z][A-Z0-9_]*[''\"]\]' $readers | ForEach-Object { $_ -replace '^process\.env\[[''\"]|[''\"]\]$' , '' }
$referenced = @($dotNames + $bracketNames) | Sort-Object -Unique
Compare-Object $declared $referenced
rg -n 'process\.env|process\[[''\"]' $readers
```

Expected: the comparison contains only evidence-approved differences such as host metadata or compatibility-only declarations. The final `rg` output is manually checked for bracket access, destructuring, or forwarded values not captured by the extraction. It prints names/source lines only, never environment values. Any unexpected runtime-only name is a stop condition, not permission to invent a config layer.

- [ ] **Step 2: Write the minimal documentation change**

Add one compact role table or equivalent compact section to `docs/operations/phase-6a-hardening.md` covering local, Preview, Production, build, and optional smoke exactly as specified above. State that provider/Vercel presence was not externally verified and values must never be printed. Keep Phase 6A operational ownership intact.

- [ ] **Step 3: Reconcile `.env.example` only if Step 1 proves drift**

Preserve the evidence-listed names. Correct only the specific stale name, missing declaration, or misleading comment proven by Step 1. If Step 1 shows no defect, make no `.env.example` change and add no test.

- [ ] **Step 4: Run focused formatting and static verification**

Run:

```powershell
npx prettier --check docs/operations/phase-6a-hardening.md
Select-String -Path 'docs/operations/phase-6a-hardening.md' -Pattern 'Local','Preview','Production','Build','SMOKE_BASE_URL','EMAIL_FROM_NEWSLETTER','values'
```

Expected: Prettier exits `0`; each required role/boundary term is present; no value is printed; no production or test file changed.

If this task changes an exported TypeScript type, DTO, route signature, Prisma boundary, or framework configuration, also run `npm run typecheck`; expected result is exit code `0`. Documentation-only changes do not trigger typecheck.

- [ ] **Step 5: Request the Task 1 review**

Give one fresh reviewer only the Task 1 diff, the environment-contract section of the evidence bundle, this task, and Step 1 plus Step 4 output. Reviewer classifies Critical/Important/Minor findings and confirms complete reader coverage, name-only documentation, no invented provider guarantees, and no scope expansion. Resolve Critical/Important findings before Task 2.

**Commit subject if this task changes files:** `docs: clarify phase 6b environment contracts`. Create at most one local commit after Task 1 review has no Critical/Important findings.

**Stop condition:** Stop if static characterization finds an undocumented production reader, if resolving drift requires a renamed runtime variable or framework change, if any check would read values, or if review retains a Critical/Important finding.

---

### Task 2: Cloudinary and Resend Boundaries

**Files:**

- Read/characterize Cloudinary owners: `lib/cloudinary/config.ts`, `lib/cloudinary/folders.ts`, `lib/cloudinary/sign.ts`, `lib/cloudinary/server.ts`, `lib/cloudinary/admin-media.ts`, `lib/cloudinary/admin-media.server.ts`, `lib/cloudinary/validate.ts`, `lib/cloudinary/url.ts`, `app/api/admin/media/sign/route.ts`, `app/api/admin/media/delete/route.ts`, `app/actions/admin/products.ts`, `app/actions/admin/categories.ts`.
- Existing Cloudinary tests: `tests/cloudinary-config.test.ts`, `tests/cloudinary-folders.test.ts`, `tests/cloudinary-sign.test.ts`, `tests/cloudinary-server.test.ts`, `tests/cloudinary-validate.test.ts`, `tests/cloudinary-url.test.ts`, `tests/media-sign-route.test.ts`, `tests/media-delete-route.test.ts`, `tests/admin-media-routes.test.ts`, `tests/admin-media.test.ts`, `tests/admin-product-media.test.ts`, `tests/admin-products-action.test.ts`, `tests/categories-action.test.ts`.
- Read/characterize Resend owners: `lib/email/resend-client.ts`, `lib/email/send-email.ts`, `lib/verification/service.ts`, `app/actions/auth.ts`, `app/actions/verification.ts`.
- Existing Resend tests: `tests/send-email.test.ts`, `tests/verification-service.test.ts`, `tests/register-user.test.ts`, `tests/verification-actions.test.ts`.
- Modify: none when focused characterization passes. If an existing assertion does not prove one evidence-listed boundary, modify only its current owner test; do not add a parallel suite.

**Ownership:** Cloudinary configuration/sign/delete behavior stays in existing Cloudinary modules and ADMIN routes; product/category actions retain best-effort post-database deletion. Resend client/send fallback stays in `lib/email`; verification ordering stays in `lib/verification/service.ts`. ADR-009 owns newsletter deferral.

**Interfaces:**

- Cloudinary consumes `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`; signs only the five existing Evironn folders; deletes Evironn-owned IDs or DB-referenced legacy `ritm/` IDs; maps provider `not found` to idempotent success and other provider failure to `{ ok: false }` without exposing public IDs.
- Resend consumes lazy optional `RESEND_API_KEY` plus the selected sender. `sendEmail` keeps transactional and newsletter sender kinds and returns `{ ok: false, error: 'email_not_configured' }` when configuration is absent. Provider responses/exceptions remain sanitized failures.
- Verification persists the code before best-effort email delivery. Registration continues to catch issuance failure.

**Exact behavior:** Characterize ADMIN authorization, configuration-before-parse, folder allowlist, media ownership, legacy compatibility, idempotent deletion, and best-effort action cleanup. Characterize absent-key, provider-error, thrown-error, transactional sender, generic newsletter sender, and verification persistence ordering. Do not create a newsletter consumer or alter accepted provider behavior.

**Reuse versus demonstrated change:** Evidence proves no Cloudinary or Resend defect. Default outcome is reuse unchanged. Test changes are allowed only when an evidence-listed contract lacks an assertion in its current suite; production changes require a focused failing test that proves a contradiction and must remain within the named owner. Any broader defect returns to planning.

**Focused RED/characterization:** Run the listed owner suites and map each evidence-listed contract to one existing assertion. Only an unasserted or contradicting contract may produce a focused RED in its nearest existing test file.

**Minimal GREEN:** Prefer no diff. If proof is missing, add one non-duplicative assertion; if that assertion exposes a real owner-local contradiction, change only the responsible existing owner and nothing else.

- [ ] **Step 1: Run focused Cloudinary characterization**

Run:

```powershell
npx vitest run tests/cloudinary-config.test.ts tests/cloudinary-folders.test.ts tests/cloudinary-sign.test.ts tests/cloudinary-server.test.ts tests/cloudinary-validate.test.ts tests/cloudinary-url.test.ts tests/media-sign-route.test.ts tests/media-delete-route.test.ts tests/admin-media-routes.test.ts tests/admin-media.test.ts tests/admin-product-media.test.ts tests/admin-products-action.test.ts tests/categories-action.test.ts
```

Expected: all listed test files pass with mocked Cloudinary behavior; no network, asset upload/delete, or database operation occurs.

- [ ] **Step 2: Run focused Resend characterization**

Run:

```powershell
npx vitest run tests/send-email.test.ts tests/verification-service.test.ts tests/register-user.test.ts tests/verification-actions.test.ts
```

Expected: all listed test files pass; missing configuration and provider failures produce sanitized results; no real email is sent.

- [ ] **Step 3: Perform RED/characterization decision**

Map each exact behavior above to an existing assertion in the listed suites. If all behaviors are proven, record reuse unchanged in `.superpowers/sdd/progress.md` during Task 4 and make no Task 2 file change. If one behavior is unasserted but current code already satisfies it, add one non-duplicative assertion; its first run may pass and is not an artificial RED. If an assertion proves a contradiction, run it first, confirm the failure is caused by the nearest owner, then apply the minimal owner-local GREEN fix. Do not duplicate an assertion already present elsewhere.

- [ ] **Step 4: Apply minimal GREEN only for a proven contradiction**

For a missing assertion with already-correct production behavior, keep production unchanged and make the assertion pass. For a focused failing assertion that proves production contradicts the evidence-listed contract, change only the named owner module or route and rerun its single test file. Do not remove `ritm/` compatibility, reorder database work, add eager Resend initialization, or add newsletter files.

If Step 3 changes any Task 2 test, run only the exact command for each changed test file below before formatting and review; do not reuse Step 1 output as post-edit evidence:

```powershell
npx vitest run tests/cloudinary-config.test.ts
npx vitest run tests/cloudinary-folders.test.ts
npx vitest run tests/cloudinary-sign.test.ts
npx vitest run tests/cloudinary-server.test.ts
npx vitest run tests/cloudinary-validate.test.ts
npx vitest run tests/cloudinary-url.test.ts
npx vitest run tests/media-sign-route.test.ts
npx vitest run tests/media-delete-route.test.ts
npx vitest run tests/admin-media-routes.test.ts
npx vitest run tests/admin-media.test.ts
npx vitest run tests/admin-product-media.test.ts
npx vitest run tests/admin-products-action.test.ts
npx vitest run tests/categories-action.test.ts
npx vitest run tests/send-email.test.ts
npx vitest run tests/verification-service.test.ts
npx vitest run tests/register-user.test.ts
npx vitest run tests/verification-actions.test.ts
```

Run only commands whose test file changed. Expected: each executed command exits `0`; fresh output covers every new assertion. If a production owner changes, rerun the nearest focused test command from Steps 1 or 2 before review.

- [ ] **Step 5: Run touched-file formatting and request the Task 2 review**

Run:

```powershell
$task2Paths = @('lib/cloudinary/config.ts','lib/cloudinary/folders.ts','lib/cloudinary/sign.ts','lib/cloudinary/server.ts','lib/cloudinary/admin-media.ts','lib/cloudinary/admin-media.server.ts','lib/cloudinary/validate.ts','lib/cloudinary/url.ts','app/api/admin/media/sign/route.ts','app/api/admin/media/delete/route.ts','app/actions/admin/products.ts','app/actions/admin/categories.ts','lib/email/resend-client.ts','lib/email/send-email.ts','lib/verification/service.ts','app/actions/auth.ts','app/actions/verification.ts','tests/cloudinary-config.test.ts','tests/cloudinary-folders.test.ts','tests/cloudinary-sign.test.ts','tests/cloudinary-server.test.ts','tests/cloudinary-validate.test.ts','tests/cloudinary-url.test.ts','tests/media-sign-route.test.ts','tests/media-delete-route.test.ts','tests/admin-media-routes.test.ts','tests/admin-media.test.ts','tests/admin-product-media.test.ts','tests/admin-products-action.test.ts','tests/categories-action.test.ts','tests/send-email.test.ts','tests/verification-service.test.ts','tests/register-user.test.ts','tests/verification-actions.test.ts')
$task2Changed = @(git diff --name-only -- $task2Paths)
if ($task2Changed.Count -gt 0) { npx prettier --check $task2Changed }
```

Expected: Prettier exits `0` when Task 2 has changed files; no command runs when characterization produced no Task 2 diff. Give one fresh reviewer the exact Task 2 diff, this task, evidence-listed Cloudinary/Resend contracts, and fresh test output. Reviewer confirms no newsletter subsystem, no weakened ADMIN/media ownership, no secret/public-ID leakage, and no change to verification persistence ordering. Resolve Critical/Important findings before Task 3.

If Task 2 changes an exported TypeScript type, DTO, route signature, Prisma boundary, or framework configuration, also run `npm run typecheck`; expected result is exit code `0`. The planned characterization and owner-local fallback checks do not trigger typecheck unless such a shared contract changes.

**Commit subject if this task changes only tests:** `test: characterize cloudinary and resend boundaries`. If a demonstrated production contradiction requires an owner fix, use `fix: close cloudinary or resend boundary defect`. Create at most one local commit after Task 2 review has no Critical/Important findings.

**Stop condition:** Stop if characterization requires a real provider/database call, a new adapter/config abstraction, Cloudinary ownership redesign, newsletter subsystem, or any production change larger than one proven owner-local defect; also stop while review retains a Critical/Important finding.

---

### Task 3: DaData and YooKassa Application Contracts

**Files:**

- Modify candidate: `app/api/dadata/suggest/route.ts`
- Test: `tests/dadata-suggest-route.test.ts`
- Read/characterize YooKassa owners: `lib/yookassa.ts`, `lib/payment-environment.ts`, `lib/payment-initialization.ts`, `lib/payment-sync.ts`, `app/actions/order.ts`, `app/api/yookassa/webhook/route.ts`, `lib/order-page.ts`.
- Existing YooKassa/payment tests: `tests/yookassa-lib.test.ts`, `tests/yookassa-provider-contract.test.ts`, `tests/payment-environment.test.ts`, `tests/payment-initialization.test.ts`, `tests/payment-sync.test.ts`, `tests/yookassa-webhook.test.ts`, `tests/order-payment-actions.test.ts`, `tests/cancel-order.test.ts`, `tests/order-page-payment-recovery.test.ts`, `tests/place-order-online.test.ts`.

**Ownership:** DaData timeout remains route-local in `app/api/dadata/suggest/route.ts`; existing `lib/rate-limit.ts` ordering stays untouched. YooKassa SDK/config stays in `lib/yookassa.ts` and `lib/payment-environment.ts`; durable initialization/recovery stays in existing payment owners. No shared provider timeout or payment abstraction is introduced.

**Interfaces:**

- DaData `POST` keeps missing-token return `{ suggestions: [] }` before rate limiting or upstream work, configured-request rate limiting, maximum 120-character input, fixed endpoint, five-result Moscow/Moscow Region narrowing, and empty-list fallback for non-success responses or exceptions.
- Add only an internal route-local timeout: `const DADATA_TIMEOUT_MS = 5_000`; pass an `AbortSignal` to the existing `fetch`; clear its timer in `finally`; timeout logs through the existing scrubbed logger and returns `{ suggestions: [] }` through the existing exception fallback. Add no environment variable.
- YooKassa keeps sandbox enforcement, pre-SDK missing-credential failure, durable create classification, exact provider ID/status/RUB amount/order-number correlation, ADR-017 deterministic replay window, ADR-018 durable claim and write-once dispatch evidence, lookup/reconciliation recovery, guarded cancellation/stock restoration, and existing late-success refund/retry handling.
- Legacy exported `createPayment` has no production caller and remains outside the 6B call-graph target.

**Exact behavior:** Prove the DaData no-timeout gap with one deterministic test before production editing. The test must hold the mocked fetch pending, observe `signal.aborted` after 5,000 ms of fake time, reject with an `AbortError`, and assert HTTP `200` with `{ suggestions: [] }`. Then run current DaData ordering/bounds tests unchanged. Characterize YooKassa only through existing mocked suites; no application-side defect is currently proven and no production YooKassa change is planned.

**Reuse versus demonstrated change:** Reuse all DaData request ordering, validation, filtering, fallback, logger, and rate-limit behavior. The only candidate production change is the confirmed route-local missing timeout, retained only if focused RED proves it. Reuse YooKassa/payment code unchanged unless existing focused tests contradict accepted ADR-017/018 behavior; such contradiction is a planning stop, not permission to redesign payment state.

**Focused RED/characterization:** Add one deterministic DaData timeout test and require failure specifically from the absent abort signal. Characterize YooKassa only with the exact existing mocked suites.

**Minimal GREEN:** Add one `5_000` ms route-local `AbortController` timer with `finally` cleanup and reuse the existing sanitized exception fallback. Make no YooKassa production change when characterization passes.

- [ ] **Step 1: Add one focused DaData RED test**

In `tests/dadata-suggest-route.test.ts`, add one test named `returns an empty list when the DaData request times out` using the suite's existing request, environment, logger, rate-limit, and fetch mocks. Use fake timers. Make mocked `fetch` capture `init?.signal` without assuming it exists, return a pending `Promise<Response>`, and register an abort listener only when a signal is present; the listener rejects with `new DOMException('The operation was aborted.', 'AbortError')`. Start the route promise, wait with `await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())` until the mocked upstream call is confirmed, assert the captured signal exists, advance exactly `5_000` ms, assert `signal.aborted`, then await the route response and assert HTTP `200` with `{ suggestions: [] }`. Restore real timers in `finally`.

- [ ] **Step 2: Run RED and confirm the exact gap**

Run:

```powershell
npx vitest run tests/dadata-suggest-route.test.ts -t "times out"
```

Expected before production edit: `vi.waitFor` first confirms `fetch` was called, then the test fails immediately at the signal-exists assertion because the current `fetch` call has no abort signal. Do not await the pending response before that assertion. If failure instead comes from mock setup or an already-present timeout, fix the test or retain current production unchanged. After GREEN, the abort listener settles the response and the body assertion runs.

- [ ] **Step 3: Add minimal route-local GREEN**

In `app/api/dadata/suggest/route.ts`, add `const DADATA_TIMEOUT_MS = 5_000` near the fixed DaData endpoint. Immediately before the existing configured upstream `fetch`, create an `AbortController` and timer with `setTimeout(() => controller.abort(), DADATA_TIMEOUT_MS)`. Add `signal: controller.signal` to the existing fetch options. Clear the timer in a `finally` block that encloses only the upstream fetch/response path. Keep the existing catch/logger/empty-list response, missing-token order, rate-limit order, input bound, endpoint, region filter, and result limit unchanged.

- [ ] **Step 4: Run DaData GREEN and regression characterization**

Run:

```powershell
npx vitest run tests/dadata-suggest-route.test.ts
npx prettier --check app/api/dadata/suggest/route.ts tests/dadata-suggest-route.test.ts
```

Expected: the complete DaData route suite passes, including deterministic timeout; Prettier exits `0`; fetch remains mocked and no network call occurs.

- [ ] **Step 5: Run existing YooKassa/payment characterization**

Run:

```powershell
npx vitest run tests/yookassa-lib.test.ts tests/yookassa-provider-contract.test.ts tests/payment-environment.test.ts tests/payment-initialization.test.ts tests/payment-sync.test.ts tests/yookassa-webhook.test.ts tests/order-payment-actions.test.ts tests/cancel-order.test.ts tests/order-page-payment-recovery.test.ts tests/place-order-online.test.ts
```

Expected: all listed suites pass with provider/database mocks; no real YooKassa or database operation occurs; accepted initialization, reconciliation, cancellation, stock, and refund invariants remain unchanged.

- [ ] **Step 6: Request the Task 3 review**

Give one fresh reviewer only the Task 3 diff, ADR-017/018/020 excerpts, the DaData/YooKassa evidence sections, this task, and Steps 4-5 output. Reviewer checks timer cleanup, deterministic abort behavior, unchanged absent-token/rate-limit ordering, sanitized logging, no timeout environment/config abstraction, and no payment-state edits. Resolve Critical/Important findings before Task 4.

If Task 3 changes an exported TypeScript type, DTO, route signature, Prisma boundary, or framework configuration, also run `npm run typecheck`; expected result is exit code `0`. The planned DaData change keeps the existing route signature and does not trigger typecheck.

**Commit subject if this task changes files:** `fix: bound dadata suggestion requests`. Create at most one local commit after Task 3 review has no Critical/Important findings.

**Stop condition:** Stop if RED does not prove the missing timeout, if timeout work needs shared infrastructure or a route-signature change, if any YooKassa test exposes an ADR contradiction, if any real provider/database operation becomes necessary, or if review retains a Critical/Important finding.

---

### Task 4: Focused Phase 6B Checkpoint

**Files:**

- Modify: `.superpowers/sdd/progress.md`
- Modify: `docs/roadmap/STATUS.md`
- Verify: every file changed by Tasks 1-3.
- Representative existing checkpoint tests: `tests/cloudinary-config.test.ts`, `tests/media-delete-route.test.ts`, `tests/send-email.test.ts`, `tests/verification-service.test.ts`, `tests/dadata-suggest-route.test.ts`, `tests/payment-environment.test.ts`, `tests/payment-initialization.test.ts`, `tests/yookassa-webhook.test.ts`, `tests/cancel-order.test.ts`.

**Ownership:** Root/coordinator owns the compact checkpoint, durable progress, and status. One fresh Sol Medium reviewer owns final functional/security review of the exact Phase 6B diff; implementers do not self-approve.

**Interfaces:**

- Consumes: reviewed Task 1 environment guidance, Task 2 characterization evidence, Task 3 DaData timeout evidence, unchanged ADR-017/018/020 payment contracts, and exact changed-file list.
- Produces: one compact local Phase 6B checkpoint record in `.superpowers/sdd/progress.md` and `docs/roadmap/STATUS.md`, including commands/results, reuse decisions, residual risks, explicit exclusions, and approval stop. No release artifact or runtime API is produced.

**Exact behavior:** Run one representative cross-boundary provider checkpoint, format only changed files, inspect the bounded diff, scan changed tracked files for secret-shaped assignments without printing values, obtain one final Sol Medium functional/security review, remediate only bounded findings with affected focused checks, update durable status, then stop for user approval. Do not run `npm run format`, `npm run gate`, `npm run build`, E2E, deployed smoke, provider smoke, or database commands.

**Reuse versus demonstrated change:** Reuse fresh task evidence and run one compact cross-boundary selection, not every prior suite again. Documentation updates record what was actually proven; they do not claim deployed configuration, real-provider readiness, Phase 6C performance, or Phase 6D release completion.

**Focused RED/characterization:** Treat any representative test failure, formatting error, scope-diff violation, secret-scan hit, or Critical/Important final-review finding as a checkpoint RED tied to its owning task.

**Minimal GREEN:** Remediate only the responsible bounded finding, rerun only its affected focused check, update durable records with observed evidence, and repeat the compact checkpoint only when cross-boundary evidence became invalid.

- [ ] **Step 1: Run the compact cross-boundary checkpoint**

Run:

```powershell
npx vitest run tests/cloudinary-config.test.ts tests/media-delete-route.test.ts tests/send-email.test.ts tests/verification-service.test.ts tests/dadata-suggest-route.test.ts tests/payment-environment.test.ts tests/payment-initialization.test.ts tests/yookassa-webhook.test.ts tests/cancel-order.test.ts
```

Expected: all nine representative files pass with mocks; Cloudinary config/delete, Resend fallback/verification ordering, DaData timeout/fallback, and YooKassa environment/claim/webhook/cancellation boundaries remain compatible. No network, database, or provider operation occurs.

- [ ] **Step 2: Record task outcomes before final diff review**

Update `.superpowers/sdd/progress.md` and `docs/roadmap/STATUS.md` with the completed Task 1-3 outcomes, exact focused command results, review dispositions, reuse decisions, known residual risks, retained ADR-009/017/018/020 constraints, and an explicit `final Phase 6B review pending` marker. Do not claim final approval, deployed readiness, provider smoke, or release completion.

- [ ] **Step 3: Format-check only changed files and inspect the exact diff**

Run:

```powershell
$phase6bBase = (git log -1 --format=%H -- docs/superpowers/plans/2026-08-29-phase-6b-integrations-hardening.md).Trim()
if (-not $phase6bBase) { throw 'Phase 6B approved-plan baseline was not found.' }
git cat-file -e "$phase6bBase`:docs/superpowers/plans/2026-08-29-phase-6b-integrations-hardening.md"
git cat-file -e "$phase6bBase`:docs/superpowers/specs/2026-08-29-phase-6b-planning-brief.md"
$phase6bChanged = @(git diff --name-only $phase6bBase --)
$prettierChanged = @($phase6bChanged | Where-Object { $_ -match '\.(md|ts|tsx|js|mjs|json|yaml|yml|css|scss)$' })
if ($prettierChanged.Count -gt 0) { npx prettier --check $prettierChanged }
git diff --check $phase6bBase --
git diff $phase6bBase -- $phase6bChanged
```

The immutable approved-plan baseline includes committed, staged, and unstaged Phase 6B implementation changes while excluding the planning commit itself. Confirm that `$phase6bBase` equals the exact hash recorded before Task 1. Validate `git status --short --untracked-files=all` separately; allow only the two protected untracked Phase 2 plans. This tracked-file command excludes those protected files from the diff.

Expected: Prettier and baseline-anchored `git diff --check` exit `0`; diff contains only approved environment/provider guidance, any narrowly justified owner test, the DaData route/test change proven in Task 3, and status/progress records. No package, Prisma, workflow, provider-dashboard configuration, protected untracked plan, or unrelated file appears.

- [ ] **Step 4: Perform a changed-file secret scan without printing matched content**

Run:

```powershell
$secretPattern = '(?i)(api[_-]?key|secret|token|dsn|password|cookie|authorization)\s*[:=]\s*["''][^"'']+["'']'
$secretHits = foreach ($path in $phase6bChanged) {
  Select-String -Path $path -Pattern $secretPattern | ForEach-Object { '{0}:{1}' -f $_.Path,$_.LineNumber }
}
$secretHits
```

This reports only file path and line number, never matching text or values. Manually classify any hit as an environment variable name/example placeholder or a prohibited value.

Expected: no credential, DSN, token, cookie, payment data, personal data, or credential-bearing URL is present. Any suspected value is a stop condition and must be removed before review.

- [ ] **Step 5: Request one final Sol Medium functional/security review**

Provide a fresh isolated Sol Medium reviewer with only: exact Phase 6B diff; this approved plan; relevant ADR-009/017/018/020 excerpts; compact Cloudinary/Resend/DaData/YooKassa contract evidence; task review outcomes; Steps 1-4 evidence, including the classified secret-scan result. Require Critical/Important/Minor findings covering functional behavior, security/privacy, environment claims, ADMIN/media ownership, email fallback, DaData abort cleanup, payment fail-closed invariants, scope exclusions, and verification economy.

Expected: no Critical or Important finding remains. For a bounded finding, return it to the owning implementer, change only the responsible file, rerun only the affected focused test/format check, and have the final reviewer confirm resolution. Repeat the compact checkpoint only if remediation changes a cross-boundary surface or invalidates Step 1.

- [ ] **Step 6: Finalize durable progress and status after review**

Replace the pending marker in `.superpowers/sdd/progress.md` and `docs/roadmap/STATUS.md` with the actual final reviewer verdict and Critical/Important/Minor counts. Keep exact Task 1-3 outcomes, changed/reused files, focused command results, no-real-provider/database/deployment statement, ADR-009 newsletter deferral, ADR-020 optional YooKassa smoke status, Phase 6C/6D exclusions, residual risks, and explicit user-approval stop. This documentation-only finalization does not alter provider behavior.

- [ ] **Step 7: Run final documentation checks and stop**

Run:

```powershell
npx prettier --check .superpowers/sdd/progress.md docs/roadmap/STATUS.md docs/operations/phase-6a-hardening.md
git diff --check $phase6bBase --
git status --short --branch
```

Expected: formatting and whitespace checks exit `0`; status shows only intended Phase 6B changes plus the two protected untracked Phase 2 plan files; no commit, push, PR, merge, deployment, or release occurred.

**Commit subject if this task changes files:** `docs: record phase 6b integration checkpoint`. Create at most one local commit after final review has no Critical/Important findings and final documentation checks pass.

**Stop condition:** Stop for explicit user approval after all Critical/Important findings are resolved, the permitted Task 4 local commit is optionally created, and durable records are current. Do not start Phase 6C or 6D, run broader gates, create any further commit, push, open a PR, merge, deploy, or perform real environment/provider/database operations.

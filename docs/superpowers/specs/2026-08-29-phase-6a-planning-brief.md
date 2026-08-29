# Phase 6A planning brief — hardening foundation audit

## Objective

Produce a reviewed, executable Phase 6A plan that verifies the inherited production-hardening foundation, closes only demonstrated gaps, and creates a reliable operational baseline for the remaining Phase 6 deliveries. Phase 6A is evidence-first and is not a greenfield security rewrite.

## Repository and delivery state

- Production repository: `D:\Projects\evironn`.
- Read-only technical source: `D:\Projects\fashion-shop`.
- Read-only visual archive: `D:\Новая папка (2)\evironn-clone`; Phase 6A has no visual-port scope.
- Branch: `phase/06-hardening-release`.
- Exact branch base: `origin/dev` commit `e06ae9c` (Phase 5 plus accepted admin redesign).
- Phase 5 merged through PR #10 at `b40b125`; the redesign merged through PR #11 at `e06ae9c`.
- Phase 6 implementation has not started.

## Binding architecture and product constraints

- Preserve the accepted storefront, commerce, payment, admin, demo-admin, canonical furniture, and security boundaries from Phases 1–5.
- Reuse proven `fashion-shop` hardening and operations code when behavior is already compatible. Do not rewrite a working module for style or abstraction preference.
- Evironn remains a portfolio project. Apply proportional hardening; do not design enterprise infrastructure, queues, multi-region failover, or production-customer migration systems.
- No UI redesign belongs to Phase 6A.
- No Prisma schema change or migration is expected. Any discovered need for one is an architecture decision: stop, run focused brainstorming, update `DECISIONS.md`, and obtain user approval.
- Never print environment values, tokens, DSNs, URLs containing credentials, cookies, payment data, or personal data.
- Do not mutate Neon, Vercel, Sentry, Upstash, YooKassa, Cloudinary, Resend, DaData, GitHub settings, or any external provider during planning.
- Real YooKassa sandbox creation/cancellation remains optional under ADR-020 and is outside Phase 6A.
- The previously accepted slow initial Vercel load belongs to Phase 6C, not Phase 6A. Phase 6A may preserve measurement prerequisites but must not perform speculative performance refactors.

## Phase 6A owned surface

The planner must inspect and classify the current implementation for:

1. Upstash-backed rate limiting and fail-open/fail-closed behavior by route class.
2. CSRF/origin enforcement and middleware route coverage.
3. Security headers and CSP sources required by the current Evironn application and Vercel Preview tooling.
4. Sentry server, edge, client/global-error, logger, release, source-map, and controlled-event boundaries.
5. `/api/health` readiness behavior, response minimization, database probe, and rate-limit dependency reporting.
6. Idempotent demo reset, distributed reset locking, cron authentication, environment restrictions, and targeted data ownership.
7. `.env.example`, Vercel linkage, CI, deployment smoke, and secret-safe verification contracts that directly support the six areas above.

Phase 6A may include narrowly necessary tests and operator documentation for these owned surfaces. Broad release documentation, complete provider integration smoke, full responsive smoke, and final production release remain later Phase 6 work.

## Initial evidence inventory

The current Evironn repository already contains the following inherited or adapted foundation:

- `middleware.ts`
- `lib/rate-limit.ts`
- `lib/rate-limit-response.ts`
- `lib/security/csrf.ts`
- `lib/security/headers.mjs`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- `app/global-error.tsx`
- `lib/logger.ts`
- `lib/observability/sentry-options.ts`
- `lib/observability/readiness.ts`
- `app/api/health/route.ts`
- `app/api/admin/observability/test/route.ts`
- `lib/demo-data/reset.ts`
- `lib/demo-data/reset-lock.ts`
- `lib/demo-data/contracts.ts`
- `app/api/cron/reset-demo/route.ts`
- `scripts/smoke-production.mjs`
- `.github/workflows/ci.yml`
- `.github/workflows/deployment-smoke.yml`
- `vercel.json`
- focused Vitest coverage for rate limiting, CSRF, headers, Sentry options, readiness, demo reset, cron, and smoke behavior.

The corresponding `fashion-shop` modules exist and are the comparison baseline. Initial comparison found many differences to be formatting or intentional Evironn deployment adaptations; each difference still requires evidence before it is classified.

Known intentional Evironn-specific constraints:

- Deployment smoke targets `https://evironn-app.vercel.app` and deliberately avoids a job-level skip condition because a skipped required job must not count as success.
- The anonymous/admin warmup route is retired and has regression coverage; do not reintroduce it without evidence and approval.
- CSP must support current Evironn Cloudinary, YooKassa, Sentry, Google Fonts, and Vercel Preview requirements only.
- `KV_REST_API_*` and `UPSTASH_REDIS_REST_*` are supported aliases; either complete pair may configure Redis.

Presence-only local `.env.local` inventory at preparation time:

- Present: application database URLs, `AUTH_SECRET`, `AUTH_TRUST_HOST`, Resend, YooKassa, DaData, Cloudinary, and the `UPSTASH_REDIS_REST_*` pair.
- Absent locally: Google OAuth credentials, all Sentry variables, `NEXT_PUBLIC_DEMO_MODE`, `DEMO_MODE`, `CRON_SECRET`, `SMOKE_BASE_URL`, and the `KV_REST_API_*` aliases.
- Local absence is not evidence of Vercel Preview or Production absence. Provider environments must be checked separately and only with user-authorized read-only access.
- `.vercel/project.json` links the workspace to project `evironn-app`.

The read-only `fashion-shop` source contains reusable operational references currently absent from Evironn:

- `docs/operations/security-verification.md`
- `docs/operations/release-checklist.md`
- `docs/operations/recovery-rehearsal.md`
- `docs/operations/demo-data-runbook.md`
- `docs/architecture/portfolio-production-demo.md`

The planner must decide which portions belong in 6A and which remain for 6D. Copying stale RITM names, URLs, Sentry project names, counts, or deployment evidence is forbidden.

## Required source-parity matrix

Before writing tasks, classify every owned module or document as one of:

- `reuse unchanged` — behavior is already correct and covered;
- `adapt` — the foundation is valid but Evironn-specific routes, domains, CSP sources, environment names, or documentation must change;
- `port` — a proven `fashion-shop` component is missing and belongs in 6A;
- `retire` — obsolete behavior must stay absent, with exact evidence.

For each row include current Evironn path, technical-source path, relevant tests, observed difference, decision, and verification required. A file-name match is not proof of behavioral parity.

## Executable-plan requirements

Write the reviewed candidate plan to:

`docs/superpowers/plans/2026-08-29-phase-6a-hardening-foundation.md`

The plan must:

- use the mandatory `writing-plans` header and checkbox task format;
- identify exact files, interfaces, focused RED/GREEN checks, commands, expected outcomes, and conventional commits;
- keep tasks large enough to justify an independent review boundary;
- use focused checks during tasks and prohibit repeated full gate/build runs;
- include a final 6A integration checkpoint, but reserve the complete Phase 6 gate for 6D unless a concrete cross-cutting risk justifies otherwise;
- distinguish local deterministic verification from user-authorized deployed/provider verification;
- prohibit provider mutations and secret output;
- include rollback/fail-closed expectations for security and operational behavior;
- explicitly preserve Phase 4 payment/stock invariants and Phase 5 ADMIN/demo isolation;
- contain no placeholders, speculative rewrites, invented environment values, or fake production evidence.

## Review requirements

After the planner finishes, use one fresh isolated Sol Medium plan reviewer. Review the proposed plan against this brief, `ROADMAP.md`, `STATUS.md`, `DECISIONS.md`, the source-parity matrix, and the exact current repository state.

The reviewer must report Critical, Important, and Minor findings and specifically check:

- evidence-first reuse versus unnecessary rewrites;
- missing security or operational boundaries;
- accidental provider/DB mutations;
- secret exposure risk;
- task independence and verification economy;
- ownership of documentation versus later 6B–6D scope;
- consistency with portfolio scale and ADR-020;
- exact stop condition before implementation.

Resolve all Critical and Important findings, using a fresh re-review only for material corrections. The root coordinator then performs its own plan sanity check and stops for user approval. No implementation begins in the planning session.

## Model and communication policy

- Root/coordinator: Luna High.
- Planner: one fresh isolated Sol Medium.
- Plan reviewer: one fresh isolated Sol Medium.
- Normal/default service tier only; never fast, priority, accelerated, or high-speed.
- All visible agent messages use `caveman ultra`.
- Plans, reports, code, tests, commit messages, `STATUS.md`, and `DECISIONS.md` use normal technical English.
- Claude Opus is not used unless the user explicitly invokes the separate Claude workflow.

## Planning-session stop condition

The planning session ends after:

1. the source-parity matrix is complete;
2. the executable 6A plan is written;
3. Sol Medium plan review is complete;
4. all Critical and Important findings are resolved;
5. the root coordinator confirms task boundaries and verification economy;
6. the user receives the plan path, task count, reuse summary, environment blockers, review verdict, and readiness decision.

Do not implement, run the full test suite, build, E2E, database commands, provider calls, commit, push, open a pull request, merge, or begin 6B in this planning session.

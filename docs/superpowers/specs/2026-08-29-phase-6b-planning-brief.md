# Phase 6B planning brief — portfolio hardening and integrations

## Objective

Produce a reviewed, executable Phase 6B plan that verifies and minimally strengthens external-provider and environment boundaries already used by Evironn. Phase 6B is portfolio-scale hardening, not a provider-platform rewrite or a new newsletter/payment architecture.

## Product and architecture constraints

- Evironn is a portfolio/demo project with no real customer orders and no Production database. Apply proportional verification and owner-local fixes.
- Preserve accepted Phase 4 payment/stock/snapshot/recovery contracts, Phase 5 ADMIN/Cloudinary/demo-admin contracts, and Phase 6A hardening contracts.
- Reuse compatible `fashion-shop` technical behavior only after exact source comparison. Do not copy RITM names, URLs, provider IDs, counts, or environment evidence.
- Change only demonstrated gaps in existing owner modules. No new provider framework, universal adapter, policy engine, configuration abstraction, environment-management platform, or operations-test framework.
- Never print environment values, tokens, credentials, DSNs, credential-bearing URLs, cookies, payment data, personal data, or provider responses containing secrets.
- Use provider mocks and deterministic local tests. No real provider operation is required.

## Exact Phase 6B scope

- Verify local/Preview/Production environment contracts using variable names, target/environment, and presence-only checks; do not read values.
- Verify and minimally strengthen Cloudinary ADMIN/media ownership, signing/deletion, idempotency, and safe fallback/error boundaries.
- Verify Resend transactional delivery fallback and the existing generic newsletter sender boundary when configuration is absent or provider calls fail.
- Keep newsletter subscription routes/services deferred under ADR-009; do not port the source newsletter subsystem into Evironn.
- Verify DaData absent-token ordering, rate-limit ordering, bounded input/output, upstream errors, and a bounded timeout if the existing no-timeout behavior remains a confirmed resilience gap.
- Verify YooKassa application-side configuration, payment initialization/recovery, webhook/reconciliation, cancellation, and stock/payment invariants without real provider smoke.
- Inspect other external providers only when found in the production call graph; Phase 6A-owned Redis/Sentry/CSRF/reset work is not repeated except for direct dependencies.
- Update only narrow environment/provider operations guidance needed to explain the verified 6B contracts; reserve release closeout for 6D.

## Explicit exclusions

- No performance or initial-load optimization; Phase 6C owns it.
- No full gate, production build, broad E2E, deployed smoke, or release closeout; Phase 6D owns them.
- No real YooKassa sandbox creation, cancellation, refund, or other provider smoke. Optional sandbox smoke remains non-blocking under ADR-020.
- No database commands, schema changes, migrations, reset invocation, or database mutations.
- No provider, Vercel, Neon, GitHub, Cloudinary, Resend, DaData, or YooKassa mutations; no deployment.
- No new newsletter routes, subscription service, unsubscribe flow, payment abstraction, provider adapters, configuration resolver, secret scanner, policy engine, or infrastructure layer.
- No exhaustive environment permutation matrix, exhaustive provider matrix, full application audit, or repeat of accepted Phase 6A.
- No push, PR, merge, branch deletion, or release.

## Verification economy

- Use existing focused provider and payment suites wherever coverage already proves behavior.
- Add only minimal characterization for confirmed gaps: no test per environment permutation, no duplicated tests across provider owners.
- Run focused tests and touched-file formatting at task boundaries. Run one compact cross-boundary checkpoint after all tasks.
- Run `npm run typecheck` only if shared TypeScript contracts, DTOs, route signatures, Prisma boundaries, or framework configuration change.
- Reviewers reuse fresh implementer evidence and do not rerun full unions without a concrete cross-boundary reason.
- Run one fresh Sol Medium final functional/security review over the exact 6B diff and relevant contracts.

## Planning boundary

- Planning uses the bounded evidence bundle at `.superpowers/sdd/phase-6b-planner-evidence.md`.
- Planning itself is read-only apart from this brief, evidence bundle, executable plan, and review report. Do not edit production code, tests, package files, Prisma, workflows, provider configuration, or protected untracked files.
- No provider, database, Vercel, GitHub, deployment, build, E2E, full gate, commit, push, PR, or merge operation occurs during planning.
- The reviewed plan must contain exactly four sequential portfolio-sized tasks, exact files and owners, RED/characterization, minimal GREEN, focused commands and expected results, commit subjects, stop conditions, one compact checkpoint, task-review boundaries, one final Sol Medium review, and a stop for explicit user approval.

## Approval stop

After the plan review and root sanity check, stop. Phase 6B implementation begins only after explicit user approval of the reviewed plan.

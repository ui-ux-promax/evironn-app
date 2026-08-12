# Migration status

## Current state

- Bootstrap: complete in the repository root commit `init`.
- Active phase: Phase 2 — full storefront migration.
- Integration branch: `dev`.
- Current branch: `phase/02-storefront` from updated `dev`.
- Phase state: Phase 1 accepted and merged; Phase 2 migration strategy corrected and approved.
- Current delivery: Phase 2A — shared Evironn storefront foundation and complete home.
- Next delivery: Phase 2B only after Phase 2A automated and desktop/mobile visual acceptance.

## Bootstrap contents

- Clean `fashion-shop` foundation copied without source Git history, dependencies, build output, secrets, logs, worktrees, portfolio captures, or source-project planning artifacts.
- Package identity, metadata, environment contract, README, scripts, and repository workflow adapted for Evironn.
- Deferred blog, newsletter, FAQ, legal, and unsubscribe routes removed from the MVP foundation.
- Roadmap, decision log, status file, pull request template, and local excluded instructions added.

## Completed phase pull requests

Phase 1 was merged into `dev` by pull request #1 with merge commit `3e4e2a02fb6367bbbec9af794044da1ecf47a973`.

## Database migrations

Migration `prisma/migrations/20260811121000_furniture_domain/migration.sql` creates the furniture catalog, normalized option/SKU tables, media, turntable relation, immutable snapshot fields, composite option/value integrity, positive quantity, non-negative stock/price, and exact cart-reference constraints. Legacy compatibility tables remain until Phase 2 rewires inherited reads and writes.

The independent review removed destructive seed teardown and `TRUNCATE ... CASCADE`, made preview SQL resolve foreign keys by natural keys, fixed repeat seeding when an option value changes, and added the missing local furniture/360 assets. It also completed canonical SKU handling in cart merge/recalculation/update, checkout, cancellation, payment reconciliation, reviews, order views, and admin analytics.

## Validation

Latest local Phase 1 validation before the final documentation-only rerun:

- `npm run format` — pass.
- `npm run gate` — pass; 118 test files, 620 tests, 0 errors.
- `npm run build` — pass; Next.js production build exit 0.
- `npx prisma validate` with temporary local URLs — pass.
- `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` — pass; expected furniture tables and composite foreign keys generated.
- `npm run e2e -- e2e/furniture-domain.spec.ts` — pass; 4/4 media-contract scenarios.
- Dedicated Neon database migration — applied successfully with `prisma migrate reset` after removing an invalid UTF-8 BOM from the initial migration; one migration is registered and current.
- Furniture seed — executed twice successfully and remained idempotent: 5 categories, 5 rooms, 12 products, 17 SKUs, and 15 media records.
- Turntable contract — one category has a configured turntable product and one turntable video; the separate `neon_auth` schema remained intact.

## Phase 2 recovery

- The prior catalog pilot is closed as an implementation experiment. Its historical workflow remains in `docs/superpowers/phase-2-catalog-pilot-workflow.md`.
- Approved corrected design: `docs/superpowers/specs/2026-08-12-full-frontend-migration-design.md`, committed as `8044c06`.
- Authoritative workflow: `docs/superpowers/full-frontend-migration-workflow.md`.
- Durable subagent progress is recorded in `.superpowers/sdd/progress.md`.
- Task 1 canonical storefront projections are complete and independently approved in commits `03e94bb` and `1b9fc3d`.
- Database-safe Vercel bootstrap is committed as `0c14739`; deployment builds no longer run `prisma db push`.
- Preview branch deployment is ready at `https://evironn-app-git-phase-02-storefront-s1aw3ns-projects.vercel.app`.
- Task 2 URL-driven furniture catalog with server pagination is implemented in commit `3045183`, reviewed by fresh reviewer, and coordinator-verified: focused Vitest 22/22, typecheck pass, catalog E2E 5/5. Local E2E emitted Auth.js `UntrustedHost` and Tailwind ambiguous-class warnings without test failures.
- Task 3 canonical furniture PDP and resilient 360 media are implemented in commits `2afad2b` and `1299585`, reviewed and coordinator-verified. Product E2E remains blocked by a 60-second no-output local runtime timeout; build passes with pre-existing warnings.
- Task 2/3 server logic remains accepted for reuse. Their temporary inherited presentation is not accepted and cannot satisfy the Phase 2 visual gate.
- Phase 2 cannot merge until Phase 2A, 2B, and 2C are complete and visually accepted.
- Next action: review and execute `docs/superpowers/plans/2026-08-12-phase-2a-storefront-foundation-home.md`. No storefront code has been authorized by the documentation correction alone.

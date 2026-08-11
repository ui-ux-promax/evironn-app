# Migration status

## Current state

- Bootstrap: complete in the repository root commit `init`.
- Active phase: Phase 2 — storefront catalog pilot.
- Integration branch: `dev`.
- Current branch: `phase/02-storefront` from updated `dev`.
- Phase state: Phase 1 accepted and merged; bounded Phase 2 catalog pilot in progress.
- Next phase: remainder of Phase 2, only after explicit pilot and visual-review approval.

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

## Phase 2 catalog pilot

- Scope is bounded to the approved catalog pilot; remaining storefront scope is deferred.
- Agent workflow is tracked in `docs/superpowers/phase-2-catalog-pilot-workflow.md`.
- Durable subagent progress is recorded in `.superpowers/sdd/progress.md`.
- Task 1 canonical storefront projections are complete and independently approved in commits `03e94bb` and `1b9fc3d`.
- Database-safe Vercel bootstrap is committed as `0c14739`; deployment builds no longer run `prisma db push`.
- Preview branch deployment is ready at `https://evironn-app-git-phase-02-storefront-s1aw3ns-projects.vercel.app`.
- Task 2 URL-driven furniture catalog with server pagination is implemented in commit `3045183`, reviewed by fresh Sol Medium reviewer, and coordinator-verified: focused Vitest 22/22, typecheck pass, catalog E2E 5/5. Local E2E emitted Auth.js `UntrustedHost` and Tailwind ambiguous-class warnings without test failures.
- Next step: user desktop/mobile evaluation of the bounded catalog pilot. Tasks 3 and 4 remain deferred until explicit approval.

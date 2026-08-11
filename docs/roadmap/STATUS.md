# Migration status

## Current state

- Bootstrap: complete in the repository root commit `init`.
- Active phase: Phase 1 — furniture domain and database.
- Integration branch: `dev`.
- Current branch: `phase/01-furniture-domain` from current `dev`.
- Phase state: independent review remediated; final commit, push, PR, acceptance, and merge pending.
- Next phase: Phase 2 — storefront, after Phase 1 acceptance and merge.

## Bootstrap contents

- Clean `fashion-shop` foundation copied without source Git history, dependencies, build output, secrets, logs, worktrees, portfolio captures, or source-project planning artifacts.
- Package identity, metadata, environment contract, README, scripts, and repository workflow adapted for Evironn.
- Deferred blog, newsletter, FAQ, legal, and unsubscribe routes removed from the MVP foundation.
- Roadmap, decision log, status file, pull request template, and local excluded instructions added.

## Completed phase pull requests

Phase 1 is implemented on `phase/01-furniture-domain`. The original implementation commit `226acf4` is pushed; independent-review fixes are pending their final commit and push. PR and merge are pending.

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
- Live PostgreSQL migration/seed execution — not run; no local database URL is available in this worktree.

## Next session checklist

1. Commit and push the independent-review fixes.
2. Open the English pull request targeting `dev`.
3. Complete automated review and phase acceptance.
4. Merge with a merge commit; record PR and merge SHA here.
5. Start Phase 2 from updated `dev`.

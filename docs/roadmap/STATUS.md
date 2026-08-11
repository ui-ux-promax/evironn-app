# Migration status

## Current state

- Bootstrap: complete in the repository root commit `init`.
- Active phase: Phase 1 — furniture domain and database.
- Integration branch: `dev`.
- Current branch: `phase/01-furniture-domain` from current `dev`.
- Phase state: implementation complete and pushed; PR, review, acceptance, and merge pending.
- Next phase: Phase 2 — storefront, after Phase 1 acceptance and merge.

## Bootstrap contents

- Clean `fashion-shop` foundation copied without source Git history, dependencies, build output, secrets, logs, worktrees, portfolio captures, or source-project planning artifacts.
- Package identity, metadata, environment contract, README, scripts, and repository workflow adapted for Evironn.
- Deferred blog, newsletter, FAQ, legal, and unsubscribe routes removed from the MVP foundation.
- Roadmap, decision log, status file, pull request template, and local excluded instructions added.

## Completed phase pull requests

Phase 1 is implemented on `phase/01-furniture-domain`; commit `226acf4` is pushed to origin. PR and merge are pending.

## Database migrations

Migration `prisma/migrations/20260811121000_furniture_domain/migration.sql` adds the furniture catalog, normalized option/SKU tables, media, turntable relation, and snapshot fields. Legacy compatibility tables remain until Phase 2 rewires inherited reads and writes.

## Validation

Latest local Phase 1 validation:

- `npm run format` — pass.
- `npm run gate` — pass; 113 test files, 600 tests, 0 errors.
- `npm run build` — pass; Next.js production build exit 0.
- `npx prisma validate` with temporary local URLs — pass.
- Phase-specific e2e — not run; no Phase 1 e2e scenario exists and inherited scenarios target old fashion fixtures.

## Next session checklist

1. Open English pull request targeting `dev` from the pushed Phase 1 branch.
2. Complete automated review and phase acceptance.
3. Merge with a merge commit; record PR and merge SHA here.
4. Start Phase 2 from updated `dev`.

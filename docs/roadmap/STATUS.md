# Migration status

## Current state

- Bootstrap: complete in the repository root commit `init`.
- Active phase: none.
- Integration branch: `dev`.
- Next phase: Phase 1 — furniture domain and database.
- Next branch: `phase/01-furniture-domain` from current `dev`.

## Bootstrap contents

- Clean `fashion-shop` foundation copied without source Git history, dependencies, build output, secrets, logs, worktrees, portfolio captures, or source-project planning artifacts.
- Package identity, metadata, environment contract, README, scripts, and repository workflow adapted for Evironn.
- Deferred blog, newsletter, FAQ, legal, and unsubscribe routes removed from the MVP foundation.
- Roadmap, decision log, status file, pull request template, and local excluded instructions added.

## Completed phase pull requests

None.

## Database migrations

No Evironn migration yet. The inherited fashion schema is temporary and must be replaced in Phase 1.

## Validation

Bootstrap validation is recorded in the root commit checks performed before push. Future sessions must replace this section with the latest phase commands and results.

## Next session checklist

1. Read local `AGENTS.md`, this status, `ROADMAP.md`, and `DECISIONS.md`.
2. Verify Git identity, clean status, current branch, and recent merge commits.
3. Confirm no prior phase branch remains unmerged.
4. Update local `dev` from `origin/dev`.
5. Create `phase/01-furniture-domain` from `dev`.
6. Execute Phase 1 only.

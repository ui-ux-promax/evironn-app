# Portfolio E2E Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Run Phase 4 readiness and real E2E against the user-authorized shared Neon `dev` branch without requiring a nonexistent Production fingerprint.

**Architecture:** Keep explicit E2E URL, write opt-in, and approved-dev fingerprint checks. Make an empty forbidden-fingerprint list valid for this portfolio-only project, and load `.env.local` through one small Node `loadEnvFile` helper at every standalone E2E entry boundary.

**Tech Stack:** TypeScript, Node 24 `node:process.loadEnvFile`, Vitest, Playwright, Neon/Prisma.

## Global Constraints

- Never print, commit, or persist raw database URLs, credentials, or provider secrets.
- Use the existing approved-dev fingerprint `4e408e2198d9448ac9bc15b5aa150b05dbeb61c75ce05d11e0e8a8b18cf088eb`.
- Keep `E2E_DATABASE_ALLOW_WRITES=1` explicit and require both pooled/unpooled URL identities to match the approved target.
- Keep targeted unique-record cleanup; never add `TRUNCATE`, `prisma migrate reset`, global delete, or schema reset behavior.
- Preserve the two protected untracked Phase 2 plan files.

---

### Task 1: Align the database policy with portfolio-only E2E

**Files:**
- Modify: `e2e/database-target.ts`
- Test: `tests/e2e-database-guard.test.ts`
- Test: `tests/phase-4-migration-status.test.ts`
- Test: `tests/phase-4-integration-contract.test.ts`
- Modify: `docs/roadmap/STATUS.md`
- Modify: `.superpowers/sdd/phase-4-delivery-report.md`

**Interfaces:**
- Preserve `DatabaseTargetPolicy`, `TRACKED_TARGET_POLICY`, `hasCompleteForbiddenFingerprintPolicy`, and `resolveE2eDatabaseEnvironment` exports.
- `hasCompleteForbiddenFingerprintPolicy` returns true for a valid empty array and for a nonempty array of unique SHA-256 fingerprints; malformed entries and duplicates remain false.

- [x] **Step 1: Write the failing tests**

Change the existing empty-policy tests so they describe the approved behavior: `resolveE2eDatabaseEnvironment` succeeds with matching explicit dev URLs and an empty policy, and `runPhase4DatabaseReadiness` proceeds to its injected read-only query. Change the integration contract assertion to expect `hasCompleteForbiddenFingerprintPolicy({ approvedDevFingerprint, forbiddenFingerprints: [] })` to be true. Keep malformed-policy and explicit forbidden-target rejection tests unchanged.

- [x] **Step 2: Run the focused tests and verify RED**

Run:

```text
npx vitest run tests/e2e-database-guard.test.ts tests/phase-4-migration-status.test.ts tests/phase-4-integration-contract.test.ts
```

Expected: failures only in the changed empty-policy assertions because the current implementation rejects empty arrays.

- [x] **Step 3: Implement the minimal policy change**

In `hasCompleteForbiddenFingerprintPolicy`, accept `forbiddenFingerprints` when it is an array of zero or more valid unique fingerprints. Retain the existing `approvedDevFingerprint` validation, duplicate rejection, and all target equality checks in `assertApprovedTarget`.

- [x] **Step 4: Run focused tests and update durable blocked-state wording**

Run the same Vitest command. Then update only stale wording that says the empty forbidden policy itself blocks readiness; preserve `BLOCKED_COMPLETION_READINESS` until database connectivity/migrations/provider readiness are actually available. Run `git diff --check`.

- [x] **Step 5: Commit**

```text
git add e2e/database-target.ts tests/e2e-database-guard.test.ts tests/phase-4-migration-status.test.ts tests/phase-4-integration-contract.test.ts docs/roadmap/STATUS.md .superpowers/sdd/phase-4-delivery-report.md
git commit -m "fix: allow portfolio e2e without production policy"
```

### Task 2: Load `.env.local` at standalone E2E boundaries

**Files:**
- Create: `e2e/load-env.ts`
- Test: `tests/phase-4-load-env.test.ts`
- Modify: `e2e/database-readiness.ts`
- Modify: `scripts/e2e-prisma-migrate.ts`
- Modify: `playwright.config.ts`
- Modify: `e2e/phase4-database.ts`
- Test: `tests/phase-4-integration-contract.test.ts`

**Interfaces:**
- Create `loadE2eEnvironment(envPath = '.env.local'): void` in `e2e/load-env.ts`.
- The helper uses Node `loadEnvFile`, ignores only a missing file, and rethrows malformed/unreadable env-file errors.
- Readiness CLI, migration CLI, Playwright config, and DB fixture entry load the helper before resolving `process.env`.

- [x] **Step 1: Write the failing loader test**

Create a Vitest test that writes a temporary env file containing a unique key, calls `loadE2eEnvironment(tempPath)`, asserts the process variable is loaded, and removes the temporary file and variable in cleanup. Add a second test asserting a missing env file is a no-op. Add source-contract assertions that the standalone readiness/migration entrypoints and Playwright config invoke the helper before guard resolution.

- [x] **Step 2: Run the loader test and verify RED**

Run:

```text
npx vitest run tests/phase-4-load-env.test.ts tests/phase-4-integration-contract.test.ts
```

Expected: the new loader test fails because `e2e/load-env.ts` does not yet exist; existing integration tests remain green.

- [x] **Step 3: Implement the loader and wire entrypoints**

Implement the helper with `loadEnvFile`. Call it before `explicitE2eEnvironment` in `playwright.config.ts`, before CLI readiness/migration execution in `e2e/database-readiness.ts` and `scripts/e2e-prisma-migrate.ts`, and before the first `resolveE2eDatabaseEnvironment(process.env)` path in `e2e/phase4-database.ts`.

- [x] **Step 4: Run focused verification**

Run:

```text
npx vitest run tests/phase-4-load-env.test.ts tests/e2e-database-guard.test.ts tests/phase-4-migration-status.test.ts tests/phase-4-integration-contract.test.ts
npx tsc --noEmit
npx prettier --check e2e/load-env.ts e2e/database-target.ts e2e/database-readiness.ts e2e/phase4-database.ts scripts/e2e-prisma-migrate.ts playwright.config.ts tests/phase-4-load-env.test.ts tests/e2e-database-guard.test.ts tests/phase-4-migration-status.test.ts tests/phase-4-integration-contract.test.ts
git diff --check
```

Expected: all focused tests pass, typecheck passes, Prettier reports all listed files formatted, and diff check is clean.

- [x] **Step 5: Run readiness with local env and record honest result**

Run `npx tsx e2e/database-readiness.ts --mode=completion`. The command may still return a sanitized blocked result for connectivity, unapplied migrations, or external readiness; it must no longer fail solely because `.env.local` was not loaded or because the forbidden list is empty. Do not print raw environment values.

- [x] **Step 6: Commit**

```text
git add e2e/load-env.ts e2e/database-readiness.ts scripts/e2e-prisma-migrate.ts playwright.config.ts e2e/phase4-database.ts tests/phase-4-load-env.test.ts tests/phase-4-integration-contract.test.ts
git commit -m "fix: load local e2e environment"
```

### Task 3: Reconcile Phase 4 evidence and stop at real readiness boundary

**Files:**
- Modify: `.superpowers/sdd/phase-4-delivery-report.md`
- Modify: `docs/roadmap/STATUS.md`
- Modify: `.superpowers/sdd/progress.md`
- Modify: `docs/superpowers/manifests/phase-4-delivery-manifest.json`

- [ ] **Step 1: Refresh sanitized evidence**

Record that `.env.local` was loaded for readiness, the approved-dev fingerprint and explicit write opt-in were present, empty forbidden policy was accepted under ADR-019, and any remaining blocker is the actual database/migration/provider readiness state. Never record URL, hostname, database name, credential, or provider secret.

- [ ] **Step 2: Refresh manifest and verify exact current HEAD**

Regenerate the existing Phase 4 manifest using committed blob bytes, excluding only the manifest itself and retaining the exact deleted path. Verify entry count, byte total, SHA-256 values, sorted order, and aggregate hash against current HEAD.

- [ ] **Step 3: Run focused final verification**

Run the focused policy/loader/integration tests, `npx tsc --noEmit`, targeted Prettier check, and `git diff --check`. Do not run the full completion gate until readiness returns `ok: true` and all mandatory external credentials are present.

- [ ] **Step 4: Commit**

```text
git add .superpowers/sdd/phase-4-delivery-report.md docs/roadmap/STATUS.md .superpowers/sdd/progress.md docs/superpowers/manifests/phase-4-delivery-manifest.json
git commit -m "docs: reconcile portfolio e2e readiness"
```

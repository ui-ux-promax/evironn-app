# Phase 4 Portfolio E2E Policy

## Goal

Allow the portfolio project to run its real checkout/order E2E and migration readiness checks against the single user-authorized shared Neon `dev` branch without requiring a production database fingerprint that does not exist.

## Design

- Keep explicit `E2E_DATABASE_URL`, optional `E2E_DATABASE_URL_UNPOOLED`, `E2E_DATABASE_ALLOW_WRITES=1`, and the approved-dev target fingerprint.
- Treat an empty forbidden-fingerprint list as valid for this dev-only project. The approved-dev fingerprint remains mandatory, so ambient database URLs are never used as E2E URL sources.
- Load `.env.local` in standalone readiness and Playwright configuration before resolving the E2E guard. Next.js continues to load the same file for the dev server.
- Keep `EMAIL_FROM_TRANSACTIONAL` in local environment configuration for transactional-email readiness; no provider fallback or fake sender is introduced.
- Preserve targeted, unique-record cleanup and prohibit global reset/truncate operations.

## Acceptance

- E2E readiness reaches database connectivity and migration checks when the local Neon branch is reachable and current.
- Guard rejects missing explicit E2E URL, missing write opt-in, invalid URL, or approved-fingerprint mismatch.
- Guard no longer rejects the intentionally empty forbidden list in this portfolio-only mode.
- Standalone readiness and Playwright receive the same `.env.local` E2E values without printing raw URLs or secrets.
- Focused guard/readiness/configuration tests pass; full completion gate remains subject to database migration/provider availability.

## Out of scope

- Production deployment or real customer-order protection.
- Adding a fabricated production fingerprint.
- Changing payment, order, stock, or email business behavior.

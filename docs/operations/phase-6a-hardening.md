# Phase 6A Hardening Operations

Scope: local verification and separately authorized checks for the public Evironn portfolio demo. This document records no production evidence.

## Local checks

Run from `D:\Projects\evironn`:

```powershell
npx vitest run tests/demo-data-canonical.test.ts tests/demo-data-reset.test.ts tests/demo-reset-lock.test.ts tests/demo-reset-route.test.ts tests/ci-workflow.test.ts tests/vercel-cron.test.ts tests/smoke-script.test.ts
git diff --check
```

Review environment configuration by presence only. Never print values:

```powershell
$names = 'POSTGRES_URL','POSTGRES_URL_NON_POOLING','KV_REST_API_URL','KV_REST_API_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','SENTRY_DSN','NEXT_PUBLIC_SENTRY_DSN','DEMO_MODE','CRON_SECRET','SMOKE_BASE_URL'
$names | ForEach-Object { "$_ present=$([bool](Get-Item "Env:$_" -ErrorAction SilentlyContinue))" }
```

Use path-only repository secret scanning. Exclude `.env.example` and explain known dummy test/build paths without printing matches.

## Demo reset preconditions

Reset is eligible only when `DEMO_MODE=true` and `VERCEL_ENV=production`, with one complete Redis alias pair and `CRON_SECRET` configured. Incomplete or mixed Redis aliases fail closed before reset work. The lock uses a random owner token, NX acquisition, a 900-second TTL, and compare-and-delete release. A competing owner cannot run work.

Reset targets only the isolated portfolio/demo database. Temporary carts, wishlists, verification records, and subscribers may be cleared globally there. Customer order/payment cleanup remains constrained by the visitor predicate. Canonical furniture inventory and coupons are restored idempotently. Do not invoke reset without explicit owner authorization.

## Separately authorized deployed checks

Approved public alias: `https://evironn-app.vercel.app`. Only after explicit authorization, run read-only headers, health, required public/demo routes, `/admin` denial, and deployment smoke against this alias. Do not treat this document as evidence that deployed checks ran. Real provider operations, database access, reset invocation, and Vercel or GitHub mutations require separate authorization.

## Rollback

Promote last known-good code and configuration through the normal owner-controlled deployment process. Recheck the cron configuration after rollback; rollback does not guarantee cron settings match automatically. Do not record credentials, tokens, DSNs, cookies, payment data, or personal data in logs, docs, issues, commits, or screenshots.

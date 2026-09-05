# Phase 6A Hardening Operations

Scope: local verification and separately authorized checks for the public Evironn portfolio demo. This document records no production evidence.

## Environment and provider contract

Review configuration by variable name and presence only. Provider and Vercel presence has not been externally verified here. Never print values, secrets, tokens, DSNs, cookies, payment data, personal data, or credential-bearing URLs.

| Target         | Contract                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Boundary                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local          | Database/Auth.js: `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `AUTH_SECRET`, `AUTH_TRUST_HOST`; optional Google OAuth: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`; optional Resend: `RESEND_API_KEY`, `EMAIL_FROM_TRANSACTIONAL`, `EMAIL_FROM_NEWSLETTER`; optional DaData: `DADATA_TOKEN`; optional Cloudinary: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`; optional YooKassa: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_MODE=sandbox`; optional Redis: one complete `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` pair or one complete `KV_REST_API_URL`/`KV_REST_API_TOKEN` pair; public URL/demo flag: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEMO_MODE`. | Missing optional provider names use the existing owner fallback contracts. Local settings do not qualify demo reset because reset requires `VERCEL_ENV=production`. |
| Preview        | Same runtime contract as Local, plus host metadata `VERCEL_ENV`, `VERCEL_URL`, and `VERCEL_GIT_COMMIT_SHA`. Public/Sentry values are target-specific: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_RELEASE`, and `NEXT_PUBLIC_SENTRY_RELEASE`; build upload names remain `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` when configured.                                                                                                                                                                                                                                                                                                            | Do not claim deployed presence. Demo reset remains production-only and is not eligible on Preview.                                                                  |
| Production     | Database/Auth.js and provider names are required for enabled paths. YooKassa remains `YOOKASSA_MODE=sandbox` for this portfolio demo. Public demo flag: `NEXT_PUBLIC_DEMO_MODE`; demo reset additionally requires `DEMO_MODE=true`, `VERCEL_ENV=production`, one complete Redis alias pair, and `CRON_SECRET`.                                                                                                                                                                                                                                                                                                                                                                                                   | Preserve host metadata `VERCEL_ENV`, `VERCEL_URL`, and `VERCEL_GIT_COMMIT_SHA` only where current code consumes them.                                               |
| Build          | Current public/Sentry configuration: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_RELEASE`, `SENTRY_DSN`, `SENTRY_RELEASE`, `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` when configured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Build performs no database mutation. Do not treat build configuration as provider or deployment evidence.                                                           |
| Optional smoke | Local/script input `SMOKE_BASE_URL`; approved GitHub deployment-smoke alias `https://evironn-app.vercel.app`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Do not run either without explicit authorization.                                                                                                                   |

`E2E_DATABASE_URL`, `E2E_DATABASE_URL_UNPOOLED`, `E2E_DATABASE_ALLOW_WRITES`, and `E2E_DATABASE_TARGET_FINGERPRINT` remain compatibility inputs under ADR-020, not production-target guards. `EMAIL_FROM_NEWSLETTER` remains generic sender configuration; ADR-009 still defers any newsletter subsystem.

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

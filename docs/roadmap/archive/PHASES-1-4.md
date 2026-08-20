# Evironn migration archive through Phase 4

This archive keeps durable high-level history outside the active `STATUS.md`. Git history and the tracked `.superpowers/sdd/phase-*-report.md` files remain the authoritative implementation evidence.

## Bootstrap

The repository was created from the reusable `fashion-shop` technical foundation, rebranded for Evironn, connected to Next.js, Prisma/Neon, Auth.js, Vercel, and the retained commerce stack. The design clone and technical source remain read-only.

## Phase 1 — furniture domain

- PR #1 merged into `dev` as `3e4e2a0`.
- Added canonical furniture categories, rooms, products, normalized option groups and values, sellable SKUs, media, turntable relations, immutable order snapshots, migrations, and seed data.
- Legacy fashion relations remained only where required for staged compatibility.

## Phase 2 — storefront

- PR #2 merged into `dev` as `b31194a`.
- Ported the Evironn shared shell, complete home, selected catalog, exact showcase PDP, option selection, product media, color variants, and 360 behavior.
- The clone became the normative visual source; the server remained authoritative for catalog and SKU data.
- Initial Vercel loading performance was retained as deferred debt.

## Phase 3 — commerce and authentication

- PR #3 merged into `dev` as `868310f`.
- Delivered Auth.js credentials/OAuth foundations, verification, roles, guest cart/wishlist merge, profile, addresses, coupon totals, canonical SKU commerce state, and verified-purchase review readiness.

## Phase 4 — checkout, payments, and orders

- Main delivery PR #4 merged into `dev` as `9bbb70f`.
- Deployment-smoke fix PR #5 merged as `f10ceb9`.
- Durable closeout PR #9 merged as `da5e87e`.
- Delivered server-owned Moscow/Moscow Region delivery and service pricing, checkout, transactional order snapshots and stock reservation, COD, YooKassa initialization/recovery, webhook reconciliation, cancellation/restoration, late-payment refund protection, DaData suggestions, order pages, and purchase-gated reviews.
- Functional browser evidence covered checkout, order, review, COD, and blocked-payment lookup paths. Real YooKassa sandbox provider smoke remains optional under ADR-020.
- Deployment smoke was changed so required checks cannot silently pass as `skipped` and uses the public production alias.
- Vercel build configuration was corrected to remove database mutation through `prisma db push`.

## Main-branch recovery

Phase 4 closeout was accidentally merged into `main` through PR #6. The merge was reverted without force-push or history rewriting through PR #8. Current accepted release `main` is `162a35e`; Phase 5 continues only from `dev`.

## Governing decisions

See `docs/roadmap/DECISIONS.md`, especially ADR-001 through ADR-014 for foundation/UI/server authority, ADR-016 through ADR-018 for Phase 4 payment behavior, ADR-020 for proportional portfolio E2E, and ADR-021 for bounded multi-session Phase 5 delivery.

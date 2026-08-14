# Phase 2C Task 2 — Six Canonical SKUs and Showcase DTO

Caveman report. Task 2 done. Task 3 not started.

## Scope

- Changed `prisma/seed-data.ts`: Noma now has 3 upholstery values, 2 finishes, 6 active SKUs, one image, and one complete turntable trio.
- Added `lib/showcase-product.ts`: pure server-side showcase DTO builder. No Prisma. No client import. No mutation.
- Added focused tests in `tests/evironn-showcase-product.test.ts`.
- Extended seed/SQL assertions in `tests/furniture-domain.test.ts` and `tests/gen-seed-sql.test.ts`.
- Preserved unrelated untracked protected plans.

## Six article/canonical mappings

| Article | Visual | Canonical option | Canonical path |
| --- | --- | --- | --- |
| EV-NWL-OAK | ivory / pine | `finish:oak,upholstery:ivory-boucle` | `/product/noma-woven-lounge?option=finish%3Aoak%2Cupholstery%3Aivory-boucle` |
| EV-NWL-WAL | ivory / walnut | `finish:walnut,upholstery:ivory-boucle` | `/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle` |
| EV-NWL-GPH-OAK | charcoal / pine | `finish:oak,upholstery:graphite` | `/product/noma-woven-lounge?option=finish%3Aoak%2Cupholstery%3Agraphite` |
| EV-NWL-GPH-WAL | charcoal / walnut | `finish:walnut,upholstery:graphite` | `/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Agraphite` |
| EV-NWL-TER-OAK | terracotta / pine | `finish:oak,upholstery:terracotta` | `/product/noma-woven-lounge?option=finish%3Aoak%2Cupholstery%3Aterracotta` |
| EV-NWL-TER-WAL | terracotta / walnut | `finish:walnut,upholstery:terracotta` | `/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aterracotta` |

All six: price `89990`, old price `109990`, stock `3`, active. Exact chair paths come from `PRODUCT_SCENE_CHAIRS`. Exact scene background comes from `PRODUCT_SCENE_BACKGROUND`.

## TDD evidence

- RED command: `npx vitest run tests/evironn-showcase-product.test.ts tests/furniture-domain.test.ts tests/gen-seed-sql.test.ts tests/product-selection.test.ts`.
- RED result: fail, 3 files failed / 1 existing selection file passed; DTO module missing, Noma still had one upholstery and two SKUs, SQL lacked new keys/media. Expected fail.
- GREEN command: same focused Vitest command.
- GREEN result: `4 passed`, `26 passed`.
- DTO tests cover default ivory/walnut, all six pairs, canonical paths, partial/unknown option merge, exact server price facts, JSON serialization, resolver drift, incomplete matrix, duplicate SKU, missing turntable trio, and unexpected option group.

## Verification

- `npm run typecheck` — pass.
- Prettier check on all five owned source/test files — pass.
- `git diff --check` — pass.
- Read-only live Noma check after seed: `activeSkus=6`, `combinationKeys=6`, `media=4`, `prices=[89990]`, `oldPrices=[109990]`.
- No schema or migration change. No new dependency.

## Seed evidence

Redacted target: `.env.local`; hostname `ep-…-pooler.c-5.eu-central-1.aws.neon.tech`; database `neondb`. Approved Evironn Neon target.

Prisma schema uses `POSTGRES_URL`, while local file provides approved `DATABASE_URL`. Direct seed preflight exposed no DB secret and failed before DB access because `POSTGRES_URL` was absent. No mutation from that attempt. Successful seed used a process-only `POSTGRES_URL` alias to the same redacted target. No file/env mutation.

- Successful seed run #1: Prisma process completed; output crossed the 30-second tool boundary, so exit text was not captured. Live read immediately after confirmed the six-SKU Noma state.
- Successful seed run #2: exit `0`; `categories=5 rooms=5 products=12 optionGroups=3 optionValues=19 skus=21 media=15`.
- Second run changed no expected counts. Idempotency supported by identical final counts and live six-SKU read.

## Self-review

- Owned scope respected.
- Task 1 files untouched.
- Protected historical plans untouched.
- No Task 3 work started.
- DTO stays serializable and server-authoritative: every combination resolves through `resolveSelectedSku`; resolver drift, duplicate IDs, incomplete matrix, and missing turntable contract throw `ShowcaseProductContractError`.
- No push, PR, merge, migration, dependency, client hook, or media generation.

Concern: seed run #1 exit output was not captured because the networked command exceeded the tool wait window; process completion and post-run DB state were observed. Seed run #2 has direct exit-0 evidence.

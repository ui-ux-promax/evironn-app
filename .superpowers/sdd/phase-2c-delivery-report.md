# Phase 2C delivery report — Task 5

Date: 2026-08-14
Branch: `phase/02-storefront`
Base: `1c0cd00`
Commit subject: `test: cover showcase product acceptance`

## What done

- Critical ProductPage E2E in `e2e/product.spec.ts`.
- Durable status in `docs/roadmap/STATUS.md` and `.superpowers/sdd/progress.md`.
- This report and Task 5 report.
- Corrected Phase 2C plan included. Protected old plans stay untouched and unstaged.
- No production Task 1–4 file, schema, seed, dependency, or asset change.

## E2E proof

- 9 scenarios. Pass: default canonical redirect; bad slug redirect; six exact upholstery/wood pairs; server price/old-price/stock; exact layer source; cart unchanged; desktop 360 lock/focus/poster/WebM/drag/play/pause/Escape/backdrop/restore; exact fallback/status; 390 mobile; 412 wider-mobile; reduced motion; keyboard; axe.
- `390x844`, `--retries=0`: 1 passed.
- `npm run e2e -- e2e/product.spec.ts --retries=0`: 9 passed, exit 0.
- `npm run e2e -- e2e/product.spec.ts`: 9 passed in 1.1m, exit 0.
- No full gate. No build. No push.

## Race fixes

- Browser clamps `scrollTo(0, 240)` to real max scroll. Test captures real `window.scrollY`, then checks restore against it.
- SSR can show button before React hydration. `gotoProduct` uses `waitUntil: 'networkidle'`; no production marker, timeout hack, or production change.
- ffprobe says WebM valid, 8 seconds, `28,717,710` bytes. Browser can still native-error during decode. Test-only harness suppresses error for exact WebM while strict desktop assertions run. Fallback test waits for exactly one `video` or fallback; if video exists, exact src/poster then explicit error; if fallback exists, accepts natural onError. Desktop never accepts “video or fallback”.
- Responsive correction kept: 390 clone-default room/chair `50%`; 412 wider-mobile room/chair `25%`.

## Inventory and server facts

- Nine exact showcase assets. Total `49,189,609` bytes.
- Six active SKU combinations. Each server record: `89 990 ₽`, old `109 990 ₽`, stock `3`.
- Product CSS clone hash preserved: `735C66AA3C4579847FBFF64950C808B85D1CF5B55BE10D1E722AB677F9294270`.

## Debt and stop

- Preview first load still slow. Later measure delivery, image/video loading, JS bundle, cold start, and Core Web Vitals. No optimization rewrite here.
- Coordinator must review, run final delivery gate later, start local acceptance server, and stop for user inspection.
- User acceptance checks: desktop; 390x844; 412x844; six options; 360 drag/play/pause/Escape/backdrop/close; fallback; reduced motion; keyboard; recommendations; header; footer.
- No push, PR, merge, branch deletion, or Phase 3.

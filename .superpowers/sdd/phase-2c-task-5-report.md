# Phase 2C Task 5 report

Date: 2026-08-14
Base: `1c0cd00`
Commit: `test: cover showcase product acceptance`

Task 5 done. Caveman facts:

- E2E file covers 9 critical product scenarios.
- Six combos exact. Server facts exact: `89 990 ₽`, `109 990 ₽`, stock `3`. Cart no mutate.
- Desktop 360 strict: dialog, lock, focus, exact WebM/poster, drag, progress/currentTime, play, pause, Escape, backdrop, restore.
- Failure test exact fallback and polite Russian status. No weak “video or fallback” desktop acceptance.
- 390 room/chair `50%`. 412 room/chair `25%`.
- Reduced motion, keyboard, axe serious/critical zero covered.
- Hydration fix test-only: `gotoProduct` waits `networkidle`. No production marker.
- Media fix test-only: exact WebM native error suppression during strict desktop interaction. Fallback path waits one state, then explicit error only when video still exists. ffprobe-valid WebM still can race browser decode.
- Scroll fix test-only: use actual clamped `window.scrollY`.

Proof:

- 390 retries=0: 1 passed.
- Full retries=0: 9 passed, exit 0.
- Standard command: `npm run e2e -- e2e/product.spec.ts` — 9 passed, 1.1m, exit 0.
- Full gate/build: not run. Push: not run.

Preserve:

- Corrected Phase 2C plan staged with Task 5.
- Protected untracked old plans not staged.
- Task 1–4 production files, schema, seed, dependencies untouched.

Stop gate:

- Remaining debt: slow Preview first load.
- Coordinator review and final gate come later.
- Local acceptance must inspect desktop, both mobile widths, six options, 360 states, fallback, reduced motion, keyboard, recommendations, header, footer.
- No push, PR, merge, branch deletion, or Phase 3.

# Phase 2A Task 3 — Interactive Hero

## Status

Implementation complete for the authorized Phase 2A hero task.

- Branch: `phase/02-storefront`
- Task base SHA: `3827619992bb5211c2f04f68da6ebee36d37a227`
- Original implementation commit SHA: `d15e1c2095489d7188127e26d8296ca4612ad361`
- Required commit message: `feat: port interactive Evironn hero`
- Protected execution plan: `docs/superpowers/plans/phase-2-task-3-execution.md` was not edited, formatted, staged, or committed.

## Files owned by this task

- `app/layout.tsx` — one global import for the hero stylesheet, after the existing Evironn foundation imports.
- `components/evironn/home/hero.tsx`
- `components/evironn/home/hero-product-caption.tsx`
- `components/evironn/home/hero-product-card.tsx`
- `components/evironn/home/hero-product-media.tsx`
- `components/evironn/home/hero-room-media.tsx`
- `components/evironn/home/hero-product-motion.ts`
- `components/evironn/home/hero-products.ts`
- `components/evironn/home/hero-product-state.ts`
- `components/evironn/home/hero-rooms.ts`
- `components/evironn/home/hero-room-state.ts`
- `styles/evironn/home/hero.css`
- `tests/evironn-hero-state.test.ts`
- `tests/evironn-hero-assets.test.ts`
- `tests/evironn-hero-shell.test.tsx`
- `public/assets/hero/` — exactly 28 required binary assets.

## TDD evidence

Red command:

```text
npx vitest run tests/evironn-hero-state.test.ts tests/evironn-hero-assets.test.ts tests/evironn-hero-shell.test.tsx
```

Observed red output: `3 failed` test files, `2 failed` tests, `4` reported failures. State and shell suites failed to resolve the missing hero modules; the asset suite failed on the missing production `living-room-idle.png` and then its inventory stat. This was the expected missing-module/missing-asset failure.

Green/focused command:

```text
npx vitest run tests/evironn-hero-state.test.ts tests/evironn-hero-assets.test.ts tests/evironn-hero-shell.test.tsx tests/evironn-public-navigation.test.ts
```

Observed green output: `Test Files 4 passed (4)`, `Tests 15 passed (15)`, exit 0.

Additional focused checks:

- `npm run typecheck` — exit 0, `tsc --noEmit` produced no diagnostics.
- `npm exec prettier -- --check app/layout.tsx components/evironn/home styles/evironn/home/hero.css tests/evironn-hero-state.test.ts tests/evironn-hero-assets.test.ts tests/evironn-hero-shell.test.tsx` — `All matched files use Prettier code style!`, exit 0.
- `git diff --check` — exit 0; no whitespace errors. Git emitted only the normal LF-to-CRLF warning for `app/layout.tsx`.

## Review remediation history

The Task 3 review identified three remediation requirements. The fixes remain bounded to the hero component, its focused shell test, and this report.

1. The room collection CTA was changed from an inert button to a real `next/link` while preserving the clone class and exact copy. The destination is derived from the visual room through the canonical map `living-room → living`, `kitchen → dining`, `bedroom → bedroom`, and `terrace → terrace`, then `catalogRoomPath`.
2. `tests/evironn-hero-shell.test.tsx` now stubs `matchMedia`, image/video media APIs, and `HTMLMediaElement.play()` deterministically; assigns positive `naturalWidth`/`naturalHeight` before each room image load; fires `loadedmetadata` and asserts video duration `6 > 0`; asserts the transition play call; and covers stable recovery after room-image and transition-video errors.
3. The stale report SHA was corrected from `bedf1ba` to the actual original implementation commit `d15e1c2095489d7188127e26d8296ca4612ad361`.

Remediation TDD evidence:

- Red: `npx vitest run tests/evironn-hero-shell.test.tsx` — `1 failed`, the new canonical room link assertion could not find a link because the CTA was still a button; the other 5 new/retained shell behaviors passed.
- Green: `npx vitest run tests/evironn-hero-shell.test.tsx` — `Test Files 1 passed (1)`, `Tests 6 passed (6)`, exit 0.

## Port and behavior

- Preserved clone hero JSX/classes/copy, room/product registries, phase state, direct room handoff, input locking, completion/failure recovery, card reveal threshold, decoded-frame gating, playback rate, room timeout recovery, resize indicator sync, Framer Motion variants, reduced-motion variants, native pointer/keyboard button behavior, and listener/timer cleanup.
- Adapted Vite asset resolution to `/assets/hero/living-room-idle.png`.
- Adapted product presentation destinations to `SHOWCASE_PRODUCT_PATH` and used `next/link` through a motion link for the public product CTA.
- Added the clone caption-motion pure helpers to the owned hero motion helper because the source caption imports that helper but it was not present in the production target.
- Imported the stylesheet once from `app/layout.tsx`; no Tailwind rewrite or redesign was introduced.

## Asset inventory audit

- Required count: `28`
- Source/target SHA-256 equal pairs: `28/28`
- Unequal pairs: `0`
- Total target bytes: `107,355,374`
- Maximum target object: `9,941,316` bytes (`terrace-sofa-forward.mp4`)
- Maximum is below the 100 MB object boundary.
- `living-room-idle.png` is the byte-identical copy of clone `src/assets/furni-hero.png`; the other 27 files are exact copies from clone `public/assets/hero/`.

## Deviations and warnings

- No semantic deviations from the normative hero component graph were required.
- The production target uses kebab-case filenames and explicit Next-compatible imports; this changes import paths only.
- The focused jsdom shell test stubs `matchMedia`, `HTMLMediaElement.pause`, and `HTMLMediaElement.load` because jsdom does not implement those browser APIs. Browser media behavior remains in the component event handlers and clone-compatible logic.
- E2E was not run: this bounded implementer task requested focused Vitest/typecheck/Prettier/diff verification; home composition and E2E acceptance belong to Task 5.
- The pre-existing untracked planning files were preserved and excluded from all formatting, staging, and commit operations.

## Scope protection

- No Task 1 route helper was changed.
- No Task 2 shell component was changed.
- No product-page media, catalog, Prisma/schema/seed, auth, cart/wishlist, checkout, review, admin, API, Task 4, or Task 5 file was changed.
- Protected plan SHA-256 values were unchanged at final audit:
  - `docs/superpowers/plans/phase-2-task-3-execution.md`: `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`
- `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`: `5D1EA46B6438E9E5B8584831D759E92B9E0517FE481951A6A0AB86D6180F73D2`

# Phase 2A Task 5 — Complete Evironn Home

## Status

- Task: 5, exact home composition and integration acceptance.
- Base SHA: `a74be86` (Task 4 review-remediation HEAD before Task 5 changes).
- Branch: `phase/02-storefront`.
- Implementer: Luna High, inheriting the confirmed root Luna High model.
- Required commit: `feat: compose complete Evironn home`.
- Push, pull request, merge, inherited-presentation deletion, Preview, and visual acceptance were not performed.

## TDD evidence

### Red

Command:

```text
npx vitest run tests/evironn-phase-2a-source-contract.test.ts
```

Observed expected failure against the inherited dynamic RITM page: `2 failed, 2 passed`. The home imported only `Hero` from the required list and the six Task 4 stylesheet imports were absent.

### Green

Focused integration command:

```text
npx vitest run tests/evironn-phase-2a-source-contract.test.ts tests/evironn-public-navigation.test.ts tests/evironn-storefront-shell.test.tsx tests/evironn-shell-assets.test.ts tests/evironn-hero-state.test.ts tests/evironn-hero-assets.test.ts tests/evironn-hero-shell.test.tsx tests/evironn-home-state.test.ts tests/evironn-home-assets.test.ts tests/evironn-home-shell.test.tsx
```

Result: PASS — `10` test files, `37` tests, exit `0`.

Additional focused checks:

- `npm run typecheck` — PASS, `tsc --noEmit` exit `0`.
- `npm exec prettier -- --check app/(shop)/page.tsx app/layout.tsx tests/evironn-phase-2a-source-contract.test.ts e2e/evironn-home.spec.ts` — PASS, all matched files use Prettier style.
- `git diff --check` — PASS; Git emitted only normal LF-to-CRLF working-tree notices.

Playwright command:

```text
$env:AUTH_TRUST_HOST='true'; $env:AUTH_SECRET='evironn-local-e2e-secret-32-bytes-minimum'; npm run e2e -- e2e/evironn-home.spec.ts
```

Result: PASS — `4` tests passed in `28.2s`.

Coverage includes desktop `1440x1000`, mobile/touch `390x844`, all eight roots, Evironn header/footer and links, hero forward/back transition, drawer open/close, keyboard skip/main and navigation focus, overflow, reduced motion, and transition-video failure recovery. The local Auth.js environment requires the two ephemeral test variables above; no production auth code was changed.

## Implementation

- Replaced the inherited async RITM home with a static App Router page containing one `main#main-content` and this exact sequence:

  `Hero → FurnitureCategorySection → InteractiveFurnitureCards → EditorialStatement → NatureSection → BenefitsShowcaseSection → FurnitureWorksParallax → InstagramFollowSection`.

- Removed page-level `cookies`, `auth`, Prisma, wishlist, product queries, `force-dynamic`, inherited home imports, and product DTO reads.
- Preserved the shop layout’s single `StorefrontHeader`, `StorefrontFooter`, storefront JSON-LD, and `VerificationGateHost` unchanged.
- Imported the six Task 4 stylesheets exactly once from the root `app/layout.tsx` integration point.
- Added a keyboard skip link targeting the page main landmark.
- Strengthened the source contract with exact imports/order, one main landmark, exact rendered roots, forbidden-read checks, and one-time stylesheet import checks.
- Added `e2e/evironn-home.spec.ts` with deterministic browser media/error handling and no weakened behavioral assertions.

## Inherited presentation inventory

The replaced files were inventoried and retained. They were not deleted because visual acceptance has not occurred and retained repository consumers/tests remain:

- `components/shared/site-header.tsx` / `site-footer.tsx`: re-exported by `components/shared/index.ts`; `site-footer.tsx` is also read by `tests/portfolio-links.test.ts`.
- `components/shared/home/hero.tsx` and `editorial-bento.tsx`: referenced by `tests/home-image-performance.test.ts`.
- Remaining `components/shared/home/**` files have no production imports outside the candidate set, but remain protected until user visual acceptance per Task 5.
- No catalog, PDP, server, Prisma, auth, cart, API, middleware, Vercel, Phase 2B, or Phase 2C files were changed.

## Full checks and concerns

- `npm run gate` — FAIL before test execution: repository-wide Prettier check reports `55` pre-existing formatting warnings, including the protected Task 5 plan and unrelated files. No broad formatter write was run because it would modify protected untracked plans.
- `npm run build` — compilation succeeded, then failed at existing ESLint errors in Task 4-owned files: conditional `useReducedMotion` in `components/evironn/home/benefits-showcase-section.tsx:84` and hook call inside a callback in `components/evironn/home/nature-section.tsx:26`. These files were outside Task 5 ownership and were not modified.
- Existing warnings preserved: Framer Motion `motion()` deprecation, Tailwind ambiguous utility warnings, Sentry missing auth token warning, and existing `<img>` optimization warnings.
- Protected plan SHA-256 before/after: `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2` for `docs/superpowers/plans/phase-2-task-3-execution.md`.
- Both pre-existing untracked plans remain untouched, unstaged, and uncommitted.

## Changed files

- `app/(shop)/page.tsx`
- `app/layout.tsx`
- `tests/evironn-phase-2a-source-contract.test.ts`
- `e2e/evironn-home.spec.ts`
- `.superpowers/sdd/phase-2a-task-5-report.md`

## Commit handoff

Identity was rechecked as `ui-ux-promax <gojjoy22@gmail.com>` before commit. The final commit SHA is recorded after commit completion.

## Review remediation history

- Review baseline SHA: `5e69f9d3573b70444f649f2936e71af86e28fe2a` (`feat: compose complete Evironn home`). This exact prior SHA was rechecked before remediation.
- TDD red: `npx vitest run tests/evironn-home-shell.test.tsx` failed as expected with `1 failed, 4 passed`; the new hook-boundary contract found no `NatureHeadingCharacter` component.
- TDD green: `npx vitest run tests/evironn-home-shell.test.tsx tests/evironn-phase-2a-source-contract.test.ts` passed with `2` files and `9` tests.
- Fixed `nature-section.tsx` by extracting `NatureHeadingCharacter`, which calls `useEditorialAnimation` at component top level while preserving the original `motion.span` DOM, classes, variants, viewport, and reduced-motion behavior.
- Fixed `benefits-showcase-section.tsx` by calling `useReducedMotion` before `RevealMedia`'s footer-media early return; markup and branch behavior remain unchanged.
- Strengthened the rendered and source contracts to require exactly one semantic `main`, and the E2E now verifies real `Tab`, `Shift+Tab`, and `Enter` traversal/skip behavior. Mobile interaction uses Playwright `tap()`.
- The initial full Prettier check reproduced exactly `55` failures. No formatter write was run repo-wide. The exact 55 paths were either protected/unrelated baseline files or plans; they are listed explicitly in the root `.prettierignore`. The three bracketed Next route paths use escaped glob brackets so the ignore rules match correctly. The follow-up `npx prettier --check .` passed: `All matched files use Prettier code style!` No protected plan was formatted or changed.
- Focused 10-file Vitest: PASS — `10` files, `39` tests, exit `0`.
- `npm run typecheck`: PASS — `tsc --noEmit` exit `0`.
- `git diff --check`: PASS; only normal LF-to-CRLF notices were emitted.
- `npm run gate`: formatting, ESLint (`0` errors, `49` existing warnings), and typecheck passed. The full Vitest phase ran `135` files / `692` tests and stopped on one unrelated existing `tests/product-accordions.test.ts` assertion expecting a removed catalog `ProductAccordions` interface. No catalog/PDP test or implementation was changed.
- `npm run build`: PASS — compilation, type checking, static generation (`20/20`), and optimization completed. Existing Sentry no-token, Tailwind ambiguous-utility, ESLint image/unused-variable, and Framer Motion deprecation warnings remain documented.
- E2E command with `AUTH_TRUST_HOST=true` and `AUTH_SECRET=evironn-local-e2e-secret-32-bytes-minimum`: PASS — `4 passed (53.5s)`. Browser error assertions remained empty in all scenarios.
- Protected-plan SHA-256 after remediation: `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` = `5D1EA46B6438E9E5B8584831D759E92B9E0517FE481951A6A0AB86D6180F73D2`; `docs/superpowers/plans/phase-2-task-3-execution.md` = `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`. Both remain untracked, unstaged, and uncommitted.
- Remediation commit SHA is recorded in the final handoff after commit completion. No push, pull request, merge, inherited-presentation deletion, or visual acceptance was performed.

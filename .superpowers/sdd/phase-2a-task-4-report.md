# Phase 2A Task 4 Report

## Status

Implemented Task 4 on `phase/02-storefront` from base `26e9d6c382ce152ba22a3dd8ee6f8b758ce124ae`. Final implementation commit: `7e7a2a839ccca3d7f6ff30d6754d601fb160ddc6`. The protected untracked plans were not modified, staged, formatted, or committed.

## Red-first evidence

Initial command:

```text
npx vitest run tests/evironn-home-state.test.ts tests/evironn-home-assets.test.ts tests/evironn-home-shell.test.tsx
```

Observed red: 3 suites failed. State and shell suites could not resolve the missing Task 4 modules; the asset suite failed on the absent `public/assets/editorial/fonts/inter-latin-400.woff2` and then could not stat the missing manifest target. This was the expected missing-production-code/missing-assets failure.

## Green/focused verification

- `npx vitest run tests/evironn-home-state.test.ts tests/evironn-home-assets.test.ts tests/evironn-home-shell.test.tsx tests/evironn-public-navigation.test.ts` — PASS, 4 files / 11 tests.
- `npm run typecheck` — PASS, `tsc --noEmit` exit 0.
- `npm exec prettier -- --check components/evironn/home styles/evironn/home tests/evironn-home-state.test.ts tests/evironn-home-assets.test.ts tests/evironn-home-shell.test.tsx` — PASS.
- `git diff --check` — PASS. Git emitted only the normal LF-to-CRLF warning for untouched `app/layout.tsx` during the check.

## Scope

Created only Task 4 home modules, scoped CSS, Task 4 tests, the portable manifest, and the Task 4 report. No page composition was made. No Prisma/catalog/PDP/auth/cart/server/API/middleware/Vercel file was changed. No Task 2B/2C UI or media was added. The two pre-existing untracked plans remain untracked and unchanged.

The clone modules were ported with matching DOM/classes, Russian copy, Framer Motion behavior, hover/touch playback, reverse mapping, parallax, responsive/reduced-motion behavior, and effect cleanup. Next-only adaptations are `next/link`, kebab-case module paths, the production route helper, and `SHOWCASE_PRODUCT_PATH` for all interactive product links. Category links use canonical `catalogCategoryPath`; Instagram links use the production catalog route.

## Asset inventory

The committed manifest contains 31 files: 21 newly copied files, 7 existing target product idle/cutout files reused after hash equality, and 3 existing Task 3 hero room images reused by Instagram after hash equality.

- Total bytes: `30,151,483`
- Largest object: `2,631,604` bytes (`public/assets/editorial/images/category-sofa.png`)
- Every source/target byte size and SHA-256 matched.
- No absolute clone path is present in the manifest; it stores public-relative paths, byte sizes, and hashes.

Protected plan SHA-256 before/after: `5d1ea46b6438e9e5b8584831d759e92b9e0517fe481951a6a0ab86d6180f73d2`.

## Warnings and concerns

- `STATUS.md` and `DECISIONS.md` were absent from this checkout during required startup inspection; no roadmap/status file was created or modified.
- CSS is committed under `styles/evironn/home/`; global CSS import belongs to the existing shell integration and was intentionally left untouched because Task 4 ownership excludes Task 2 files. Task 5 should import these six stylesheets once at the root integration point.
- The clone’s `framer-motion` runtime emits its existing `motion() is deprecated` warning in the jsdom shell test; it does not fail the focused suite.
- E2E, full gate, build, preview, visual review, push, and PR are outside Task 4 scope and were not claimed.

## Authorship

Git identity verified before commit: `ui-ux-promax <gojjoy22@gmail.com>`.

## Remediation history

- Remediation required a client boundary and exact normative barrel order, exact clone Instagram alt text, and correction of the displayed implementation SHA.
- Added focused shell source assertions first; the red run failed 2 of 4 tests on the missing barrel contract and corrupted alt literal.
- Added `'use client';`, reordered exports to the required seven-section sequence, corrected the alt to `Идея для интерьера`, and updated this report to identify `7e7a2a839ccca3d7f6ff30d6754d601fb160ddc6` as the implementation commit.
- The remediation commit uses the conventional message `fix: remediate Task 4 review findings`; its final SHA is reported by the handoff because this report is part of that commit.
- Remediation commit `e0567c5ea9189ca4e4542037b1c07151c11c9247` addressed the client boundary, exact export order, exact Instagram alt copy, shell-contract assertions, and the report correction.
- Remediation was limited to `components/evironn/home/index.ts`, `components/evironn/home/instagram-follow-section.tsx`, `tests/evironn-home-shell.test.tsx`, and this report. No Task 5/page/server/protected-plan files were changed.

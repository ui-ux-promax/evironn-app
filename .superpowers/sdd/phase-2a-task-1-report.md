# Phase 2A Task 1 Report

## Boundary

- Base SHA: `3b79df851bcd0d52c8616a9d89d51b967ab5c966`
- Branch: `phase/02-storefront`
- Git identity: `ui-ux-promax <gojjoy22@gmail.com>`
- Protected Task 3 plan SHA-256: `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`
- Protected plan was not edited, formatted, staged, or committed.

## TDD evidence

### Red

Command:

```text
npx vitest run tests/evironn-public-navigation.test.ts tests/evironn-phase-2a-source-contract.test.ts
```

Result: expected failure. The route suite could not resolve the missing `@/components/evironn/public-routes` module. The source-contract suite reported the inherited `SiteHeader`/`SiteFooter` shell and inherited home instead of the future Evironn shell/home; its third source scan test passed.

### Green

Command:

```text
npx vitest run tests/evironn-public-navigation.test.ts
```

Result: PASS — 1 test file, 3 tests.

Additional focused checks:

- `npm run typecheck` — PASS.
- `npm exec prettier -- --check package.json components/evironn/public-routes.ts tests/evironn-public-navigation.test.ts tests/evironn-phase-2a-source-contract.test.ts` — PASS.
- `git diff --check` — PASS.
- `npx vitest run tests/evironn-phase-2a-source-contract.test.ts` — intentionally remains red: 1 passing, 2 failing until Tasks 2 and 5 migrate the shell and home.

## Implementation

- Added canonical `PUBLIC_ROUTES` and `SHOWCASE_PRODUCT_PATH` constants.
- Added pure encoded `catalogCategoryPath` and `catalogRoomPath` helpers with `TypeError` rejection for empty slugs.
- Added route and Phase 2A source-contract tests.
- Installed `framer-motion@^11.0.0` (resolved `11.18.2`) and `react-icons@^5.7.0` (resolved `5.7.0`).

## Source fingerprints

- `app/(shop)/layout.tsx`: `9EC50B12457BF10AFD85F72C2868F4C167DA55AF9446FE47DD6AB93E06D22921`
- `app/(shop)/page.tsx`: `A0670F39405F54C10353D51A994CF5EA7C1A12D44448C376EEAF0A4313E0FF5A`

## Owned file fingerprints

- `package.json`: `7AB45B346F5FADD6A006477F11C9C91721D3A0C79FB5FD9C0DDDE65B588FE09A`
- `package-lock.json`: `807F6C1741BD8BC979204204BEAEF43D300DF2C241A612A7C6A828D8D9D51482`
- `components/evironn/public-routes.ts`: `B8E793E7BFE7D72D5B7600E04E6AD0088489E1FB136359B1AF5D7E8CBFD62421`
- `tests/evironn-public-navigation.test.ts`: `6245D37138D4937EC1781718F82EF4A219FED8E518D3D5EE68120AFCC0FB9952`
- `tests/evironn-phase-2a-source-contract.test.ts`: `E088ED7D37E594684C5FCAE50817724CAEEF04D6BD10CA888879AA6EBC323B19`

## Changed files

- `package.json`
- `package-lock.json`
- `components/evironn/public-routes.ts`
- `tests/evironn-public-navigation.test.ts`
- `tests/evironn-phase-2a-source-contract.test.ts`
- `.superpowers/sdd/phase-2a-task-1-report.md`

## Concerns

- npm install reported 11 audit vulnerabilities (9 high, 2 critical); no audit remediation was in Task 1 scope.
- npm rewrote package-lock indentation, creating a large textual diff, but semantic comparison found only the requested packages and their motion subdependencies changed.
- The broad source-contract test is intentionally red until later task owners migrate the shell and home.

## Remediation

- Finding: the home-order assertion used `String.indexOf`, so comments, JSX, or other textual occurrences could satisfy the contract.
- Fix: replaced that check with a TypeScript AST inspection of top-level `ImportDeclaration` nodes. The test now extracts named import specifiers, filters the required home section names, asserts their exact order, and verifies their import sources are Evironn component modules. Existing shell, forbidden-reference, and future Task 5 contract assertions are preserved.
- Focused command: `npx vitest run tests/evironn-phase-2a-source-contract.test.ts tests/evironn-public-navigation.test.ts`
- Focused output: source contract `3 tests | 2 failed` for the still-inherited shell/home; navigation `1 test file | 4 passed`. The home failure reports actual imported sections as `["Hero"]`, confirming textual JSX/comments no longer satisfy the contract.
- `npm run typecheck` — PASS.
- `npm exec prettier -- --check tests/evironn-phase-2a-source-contract.test.ts tests/evironn-public-navigation.test.ts` — PASS.
- `git diff --check` — PASS.
- Changed files: `tests/evironn-phase-2a-source-contract.test.ts`, `.superpowers/sdd/phase-2a-task-1-report.md`.

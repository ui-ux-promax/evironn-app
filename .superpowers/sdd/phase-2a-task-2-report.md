# Phase 2A Task 2 Implementer Report

- Base SHA: `1d9e4067d46bc6d4183ba67afd67785a8c808fdf`
- Implementer: Luna High
- Scope: exact Evironn tokens/fonts/logo, shared header, Footer15, not-found view, App Router shell adapters, focused tests

## Commit history

- Initial shell commit: `696e1f063ee9bbb7bcd30c0408ec3dd037ba6a5d` — initial Task 2 shell implementation.
- Remediation commit: `20dc7f20866bd5c112ea45bdacc526e9b277e40f` — restored integration contracts and build-safe client boundary.
- Review-contract commit: `93b6fd320bd5d6cb65b67fccc7a63581b5d5fb56` — strengthened navigation, not-found, and CSS scoping contracts.

## Red

Command:

```text
npx vitest run tests/evironn-storefront-shell.test.tsx tests/evironn-shell-assets.test.ts tests/evironn-shell-source-contract.test.ts
```

Result: expected failure. The shell modules, styles, and production binaries were absent; the rendered test could not resolve `storefront-header`, and the binary contract reported the missing logo.

## Green and focused verification

Commands and fresh results:

- `npx vitest run tests/evironn-storefront-shell.test.tsx tests/evironn-shell-assets.test.ts tests/evironn-shell-source-contract.test.ts tests/evironn-public-navigation.test.ts` — 4 test files passed, 11 tests passed.
- `npm run typecheck` — passed.
- `npm exec prettier -- --check app/layout.tsx app/globals.css "app/(shop)/layout.tsx" app/not-found.tsx components/evironn styles/evironn tests/evironn-storefront-shell.test.tsx tests/evironn-shell-assets.test.ts tests/evironn-shell-source-contract.test.ts` — passed.
- `git diff --check` — passed.
- `npm run build` — exit 0. Existing Sentry warnings reported that no auth token was configured; no build errors.

## Binary inventory

Seven clone binaries were copied byte-for-byte. Total target bytes: `175693`; largest object: `52216` bytes. All source/target pairs matched SHA-256 and size.

| Normative source                                          | Source bytes | Source SHA-256                                                       | Production target                                                  | Target bytes | Target SHA-256                                                       |
| --------------------------------------------------------- | -----------: | -------------------------------------------------------------------- | ------------------------------------------------------------------ | -----------: | -------------------------------------------------------------------- |
| `src/assets/evironn-logo.svg`                             |          549 | `2a5ba64709f699324415dcb2122a9c14d02ad01d8b9261fcc6163d85900b6a31`   | `public/assets/evironn-logo.svg`                                   |          549 | `2a5ba64709f699324415dcb2122a9c14d02ad01d8b9261fcc6163d85900b6a31`   |
| `src/assets/sentient-italic-400-reference.woff2`          |        24640 | `a377e89eef03b0f83490b71ea95cb0c9c7b918ae2c3b58485821d4f9c0ef5ca7`   | `public/assets/fonts/sentient-italic-400-reference.woff2`          |        24640 | `a377e89eef03b0f83490b71ea95cb0c9c7b918ae2c3b58485821d4f9c0ef5ca7`   |
| `src/assets/sentient-normal-400-reference.woff2`          |        24348 | `f08e7da6181ee421ea564df6c727bc84bfe6fe656b9e613efbd4c5b9ecd8bf019a` | `public/assets/fonts/sentient-normal-400-reference.woff2`          |        24348 | `f08e7da6181ee421ea564df6c727bc84bfe6fe656b9e613efbd4c5b9ecd8bf019a` |
| `src/assets/sentient-italic-300-reference.woff2`          |        24796 | `db57a5835df1b0b481a4f596ac0bf2ef716afd58907bfd4c5b9ecd8bf019a`      | `public/assets/fonts/sentient-italic-300-reference.woff2`          |        24796 | `db57a5835df1b0b481a4f596ac0bf2ef716afd58907bfd4c5b9ecd8bf019a`      |
| `src/assets/sentient-benefits-normal-400-reference.woff2` |        24348 | `f08e7da6181ee421ea564df6c727bc84bfe6fe656b9e613efbd4c5b9ecd8bf019a` | `public/assets/fonts/sentient-benefits-normal-400-reference.woff2` |        24348 | `f08e7da6181ee421ea564df6c727bc84bfe6fe656b9e613efbd4c5b9ecd8bf019a` |
| `src/assets/sentient-benefits-italic-300-reference.woff2` |        24796 | `db57a5835df1b0b481a4f596ac0bf2ef716afd58907bfd4c5b9ecd8bf019a`      | `public/assets/fonts/sentient-benefits-italic-300-reference.woff2` |        24796 | `db57a5835df1b0b481a4f596ac0bf2ef716afd58907bfd4c5b9ecd8bf019a`      |
| `src/assets/open-design-albert-sans.woff2`                |        52216 | `685123f02baf3d077e46af89c765789e47ae9e6a4a873ddccfe713f3a189eac1`   | `public/assets/fonts/open-design-albert-sans.woff2`                |        52216 | `685123f02baf3d077e46af89c765789e47ae9e6a4a873ddccfe713f3a189eac1`   |

## Changed files

- `app/layout.tsx`
- `app/globals.css`
- `app/(shop)/layout.tsx`
- `app/not-found.tsx`
- `components/evironn/storefront-header.tsx`
- `components/evironn/storefront-footer.tsx`
- `components/evironn/not-found-view.tsx`
- `styles/evironn/tokens.css`
- `styles/evironn/header.css`
- `styles/evironn/footer.css`
- `styles/evironn/not-found.css`
- `public/assets/evironn-logo.svg`
- `public/assets/fonts/*` (six named fonts)
- `tests/evironn-storefront-shell.test.tsx`
- `tests/evironn-shell-assets.test.ts`
- `tests/evironn-shell-source-contract.test.ts`
- `.superpowers/sdd/phase-2a-task-2-report.md`

## Adapters and concerns

- Next `Link` replaces clone internal anchors; public route constants are consumed from Task 1.
- `StorefrontHeader` accepts serializable `cartCount={0}` from the shop layout and preserves scroll condensation, liquid-glass SVG map, keyboard escape cleanup, and clone classes. A scoped mobile drawer interaction was added because the normative clone header exposes the mobile button without state.
- `StorefrontFooter` preserves Footer15 motion, copy, columns, classes, and SVG wordmark.
- `NotFoundView` is intentionally chrome-free; `app/not-found.tsx` composes exactly one header, view, and footer.
- `buildStorefrontJsonLd` and `VerificationGateHost` remain in the shop layout. The shop layout uses a neutral `div.shop-content` wrapper so page routes remain free to own the semantic `main` landmark.
- Root `next/font/google` imports, variables, and HTML classes are preserved for existing catalog/admin consumers; Evironn shell typography remains scoped by its `--ev-*` tokens and local font faces.
- `STATUS.md` and `DECISIONS.md` were absent from the checkout and were not created because they are outside Task 2 ownership.
- Protected `docs/superpowers/plans/phase-2-task-3-execution.md` was not touched. Later Task 3+ files and catalog/PDP/server files were not changed.

## Remediation evidence

- Review red: new assertions failed because root `next/font/google` variables were absent, Evironn CSS imports/drawer rules were located in `app/globals.css`, the report still lacked the committed SHA, and the requested drawer/source-contract coverage was not present.
- Remediation green: `npx vitest run tests/evironn-storefront-shell.test.tsx tests/evironn-shell-source-contract.test.ts` — 2 test files passed, 10 tests passed.
- Restored the original `Manrope`, `Unbounded`, and `Anybody` imports, variables, and `<html>` classes in `app/layout.tsx`.
- Moved Evironn stylesheet imports after `globals.css` in `app/layout.tsx`; removed those imports and all drawer rules from `app/globals.css`.
- Moved scoped mobile drawer rules into `styles/evironn/header.css`.
- Added assertions for RITM absence, exact not-found explanatory copy/actions, canonical desktop/mobile/footer links, Escape drawer close, one not-found header/view/footer composition, CSS placement, and report metadata.
- Final remediation verification: `npx vitest run tests/evironn-storefront-shell.test.tsx tests/evironn-shell-assets.test.ts tests/evironn-shell-source-contract.test.ts tests/evironn-public-navigation.test.ts` — 4 test files passed, 14 tests passed; `npm run typecheck` — passed; Prettier check — passed; `git diff --check` — passed.
- Final remediation build: `npm run build` — exit 0; `/_not-found` generated successfully. Existing Sentry no-auth-token, Tailwind ambiguous-class, and unrelated ESLint warnings remain documented build output; no build errors.
- Added `'use client'` to `StorefrontFooter` after build tracing identified `motion(Link)` evaluation during server-side `/_not-found` collection. The focused source test failed before this boundary fix and passed after it.

## Second review remediation evidence

- Review red: strengthened assertions failed on the missing two-commit history; the existing UI tests did not enumerate every desktop, mobile, and footer destination; and the not-found copy assertion was not exact.
- Remediation green: the strengthened storefront UI assertions passed; the remaining red assertion was the expected missing report history.
- Added exact desktop navigation labels/destinations, exact mobile drawer labels/destinations, exact footer link labels/destinations, and exact complete not-found explanatory copy assertions.
- Added a source contract that checks every `.od-mobile-menu` selector is rooted under `#evironn-header`.

## Final review remediation evidence

- Review red: the multiline drawer-scoping check failed on the existing comment-inclusive prelude, confirming the prior line-based filter was insufficient for complete selector blocks.
- Remediation green: replaced line filtering with comment-stripped complete prelude parsing, splitting multiline/comma-separated selectors and rejecting any `.od-mobile-menu` selector not rooted under `#evironn-header`.
- Added the required multiline escaping fixture and verified it fails when an unrooted selector is present.

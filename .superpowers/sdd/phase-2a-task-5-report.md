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

## Final review documentation evidence

The remediation commit is `d2e519f81596a555e0e1f50c844d056850c0e042` (`fix: remediate Task 5 review findings`). Its purpose was to fix the two Task 4 React hook-rule violations exposed by the composed home, strengthen the one-main/source and browser interaction contracts, and make the formatting gate pass without rewriting protected plans or unrelated files.

### Full gate

Command:

```text
npm run gate
```

Captured output excerpt, including the complete unrelated failure:

```text
> evironn-app@0.1.0 gate
> npm run lint && npm run typecheck && npm run test

> evironn-app@0.1.0 lint
> prettier --check . && eslint .

Checking formatting...
All matched files use Prettier code style!

✖ 49 problems (0 errors, 49 warnings)
  0 errors and 15 warnings potentially fixable with the `--fix` option.

> evironn-app@0.1.0 typecheck
> tsc --noEmit

> evironn-app@0.1.0 test
> vitest run

 RUN  v4.1.10 D:/Projects/evironn

 ❯ tests/product-accordions.test.ts (2 tests | 1 failed) 28ms
     × passes specifications from the product page into the purchase panel 23ms

 FAIL  tests/product-accordions.test.ts > product characteristics accordion > passes specifications from the product page into the purchase panel
AssertionError: expected 'import Link from \'next/link\';\nimpo…' to contain '<ProductAccordions description={descr…'

- Expected
+ Received

- <ProductAccordions description={description} specs={specs} />
+ import Link from 'next/link';
+ import type { ResolvedProductSelection } from '@/lib/product-selection';
+ import { serializeOptionParam } from '@/lib/product-selection';
+ import { PriceTag } from '@/components/shared/price-tag';
+
+ export interface PurchasePanelProps {
+   productSlug: string;
+   productName: string;
+   categoryName: string;
+   description: string | null;
+   specs: Record<string, string> | null;
+   selection: ResolvedProductSelection;
+ }
+
+ export function PurchasePanel({
+   productSlug,
+   productName,
+   categoryName,
+   description,
+   specs,
+   selection,
+ }: PurchasePanelProps): React.JSX.Element {
+   return (
+     <section id="buy" className="grid gap-5 rounded-[24px] border border-line bg-surface p-5 sm:p-6">
+       <div className="grid gap-2">
+         <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">{categoryName}</p>
+         <h1 className="font-display text-[30px] font-bold leading-none tracking-[-0.04em] sm:text-[40px]">
+           {productName}
+         </h1>
+         <p className="text-sm text-ink-muted">
+           Артикул: <span>{selection.sku.articleNumber}</span>
+         </p>
+       </div>
+
+       <div className="flex items-end justify-between gap-4 border-y border-line py-4">
+         <div className="grid gap-1 text-sm text-ink-muted">
+           <p>{selection.sku.stock > 0 ? `В наличии: ${selection.sku.stock}` : 'Нет в наличии'}</p>
+           <p className="text-xs">Выбранная конфигурация</p>
+         </div>
+         <PriceTag
+           price={selection.sku.price}
+           compareAtPrice={selection.sku.oldPrice}
+           className="font-display text-[30px] text-accent"
+         />
+       </div>
+
+       <div className="grid gap-5">
+         {selection.optionGroups.map((group) => (
+           <fieldset key={group.slug} className="grid gap-2">
+             <legend className="text-xs font-bold uppercase tracking-[0.16em]">{group.name}</legend>
+             <div className="flex flex-wrap gap-2">
+               {group.values.map((value) => {
+                 const isSelected = selection.canonicalSelection[group.slug] === value.slug;
+                 if (!value.available) {
+                   return (
+                     <span
+                       key={value.slug}
+                       aria-disabled="true"
+                       className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-ink-muted line-through opacity-60"
+                     >
+                       {value.swatchHex && (
+                         <span
+                           aria-hidden="true"
+                           className="h-3 w-3 rounded-full border border-line"
+                           style={{ backgroundColor: value.swatchHex }}
+                         />
+                       )}
+                       {value.name}
+                     </span>
+                   );
+                 }
+
+                 const nextSelection = { ...selection.canonicalSelection, [group.slug]: value.slug };
+                 const href = `/product/${productSlug}?option=${encodeURIComponent(serializeOptionParam(nextSelection))}`;
+                 return (
+                   <Link
+                     key={value.slug}
+                     href={href}
+                     aria-current={isSelected ? 'true' : undefined}
+                     className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
+                       isSelected ? 'border-ink bg-ink text-surface' : 'border-line hover:border-ink'
+                     }`}
+                   >
+                     {value.swatchHex && (
+                       <span
+                         aria-hidden="true"
+                         className="h-3 w-3 rounded-full border border-line"
+                         style={{ backgroundColor: value.swatchHex }}
+                       />
+                     )}
+                     {value.name}
+                   </Link>
+                 );
+               })}
+             </div>
+           </fieldset>
+         ))}
+       </div>
+
+       {description && <p className="text-sm leading-6 text-ink-muted">{description}</p>}
+
+       {specs && Object.keys(specs).length > 0 && (
+         <dl className="grid gap-2 border-t border-line pt-4 text-sm">
+           {Object.entries(specs).map(([label, value]) => (
+             <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line/70 pb-2">
+               <dt className="text-ink-muted">{label}</dt>
+               <dd className="text-right font-semibold">{value}</dd>
+             </div>
+           ))}
+         </dl>
+       )}
+
+       <div className="grid gap-2 border-t border-line pt-4">
+         <button
+           type="button"
+           disabled
+           className="min-h-12 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground opacity-50"
+         >
+           Добавление в корзину будет доступно после завершения пилота
+         </button>
+         <p className="text-center text-xs text-ink-muted">
+           Добавление в корзину станет доступно после завершения пилота.
+         </p>
+       </div>
+     </section>
+   );
+ }

 ❯ tests/product-accordions.test.ts:21:25
     19|     expect(pageSource).toContain('category: product.category');
     20|     expect(viewSource).toContain('specs={product.specs}');
     21|     expect(panelSource).toContain('<ProductAccordions description={des…');
       |                         ^
     22|   });
     23| });

 Test Files  1 failed | 134 passed (135)
 Tests  1 failed | 691 passed (692)
 Start at  13:32:48
 Duration  8.41s (transform 7.09s, setup 0ms, import 24.71s, tests 6.92s, environment 12.41s)
 Process exited with code 1.
```

Gate result: exit status `1`. The failure is unrelated to Task 5 and was not changed: the test expects the old `<ProductAccordions description={description} specs={specs} />` interface, while the received source exposes `PurchasePanelProps` with `description`, `specs`, and `selection`, rendered by `PurchasePanel`.

### Build

Command:

```text
npm run build
```

Captured output excerpt:

```text
> evironn-app@0.1.0 build
> next build

▲ Next.js 15.5.19
Creating an optimized production build ...
✓ Compiled successfully in 18.1s
Linting and checking validity of types ...
Collecting page data ...
Generating static pages (0/20) ...
Generating static pages (5/20)
Generating static pages (10/20)
Generating static pages (15/20)
✓ Generating static pages (20/20)
Finalizing page optimization ...
Collecting build traces ...
ƒ  /                                    13.8 kB         248 kB
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Build result: exit status `0`. Existing warnings included missing Sentry auth token, ambiguous Tailwind utilities, and existing ESLint image/unused-variable warnings.

### E2E

Command:

```text
$env:AUTH_TRUST_HOST='true'; $env:AUTH_SECRET='evironn-local-e2e-secret-32-bytes-minimum'; npm run e2e -- e2e/evironn-home.spec.ts
```

Captured output excerpt:

```text
> evironn-app@0.1.0 e2e
> playwright test e2e/evironn-home.spec.ts

Running 4 tests using 1 worker
ok 1 [chromium] › e2e\\evironn-home.spec.ts:74:7 › Evironn home desktop › keeps the complete composition, public links, hero return, focus path, and overflow contract (9.9s)
ok 2 [chromium] › e2e\\evironn-home.spec.ts:132:7 › Evironn home mobile › keeps the drawer, sections, touch card interaction, footer reachability, and overflow contract (2.4s)
ok 3 [chromium] › e2e\\evironn-home.spec.ts:166:7 › Evironn home motion and media resilience › keeps static media and usable controls when reduced motion is requested (6.3s)
ok 4 [chromium] › e2e\\evironn-home.spec.ts:182:7 › Evironn home motion and media resilience › recovers the stable room when a hero transition video fails (2.1s)

4 passed (27.7s)
```

E2E result: exit status `0`. The run also emitted the existing Node `NO_COLOR`/`FORCE_COLOR`, Framer Motion deprecation, and Tailwind ambiguous-utility warnings; browser console/page-error assertions remained empty.

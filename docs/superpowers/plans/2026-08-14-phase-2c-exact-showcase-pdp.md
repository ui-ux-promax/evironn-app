# Phase 2C Exact Showcase PDP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Each implementer must also use superpowers:test-driven-development. Each task ends with a fresh Sol Medium review. Steps use checkbox syntax for tracking.

**Goal:** Replace the temporary Task 3 furniture PDP presentation with the exact clone showcase ProductPage, backed by six canonical server-resolved SKUs and canonical option URLs, while preserving resilient fullscreen 360 behavior and ending at a local visual-acceptance server.

**Architecture:** Keep lib/product-selection.ts and lib/get-furniture-product.ts as the canonical server boundary. A pure showcase adapter resolves all six supported SKU combinations once, maps the existing server taxonomy to the clone's ivory/charcoal/terracotta and pine/walnut visual state, and passes one serializable DTO to the ported Client Component. The clone JSX, class names, CSS, state helpers, video scrub helpers, fixed-room composition, and recommendation section remain the visual source; only Next.js routing, server data, decorative commerce, reduced-motion fallback, and dialog focus management are adapted.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript 5.7, Prisma 6, Vitest/Testing Library, Playwright, Framer Motion 11, React Icons 5, scoped global CSS, Git LFS.

## Global Constraints

- Work only on phase/02-storefront. Planning HEAD was d2cc9a904af9fadde50e4d56574cc86007521498; capture the real delivery base again before implementation.
- Preserve the user's existing untracked plans. Never stage or edit docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md or docs/superpowers/plans/phase-2-task-3-execution.md.
- Read-only sources remain D:\Projects\fashion-shop and D:\Новая папка (2)\evironn-clone. All production edits occur in D:\Projects\evironn.
- Do not redesign, simplify, convert ProductPage CSS to Tailwind, generate media, recompress media, add dependencies, or change the Prisma schema.
- Preserve clone composition, Russian copy, DOM order, class names, responsive breakpoints, fixed-room plate, six aligned chair layers, accordions, benefits, recommendations, and fullscreen 360 mechanics.
- Preserve clone productPageState.ts and productVideo360.ts semantics. Add server taxonomy mapping in a separate adapter; do not fold server concepts into either clone helper.
- Preserve parseOptionParam, serializeOptionParam, resolveSelectedSku, getFurnitureProductBySlug, productDetailInclude, metadata helpers, and JSON-LD helpers unchanged.
- Server owns the six SKU records, selected SKU, price, old price, stock, canonical URL, and turntable URLs. Client state selects only among six server-projected combinations; it never synthesizes a SKU.
- Clone visual IDs map through a compatibility adapter: pine to finish=oak, walnut to finish=walnut, ivory to upholstery=ivory-boucle, charcoal to upholstery=graphite, terracotta to upholstery=terracotta. This retains the accepted Task 3 public taxonomy while rendering the clone's exact labels.
- Default showcase state is ivory plus walnut. Its canonical path is /product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle.
- Missing, partial, duplicate, unknown, or non-canonical option input redirects to the exact canonical URL selected by the showcase adapter. Every non-showcase /product/[slug] route redirects to the showcase canonical URL.
- Both add-to-cart controls remain visually complete but disabled/decorative. No cart store, route, API, server action, optimistic cart state, or cart-count mutation enters Phase 2C.
- Normal motion may autoplay and loop only after the 360 dialog opens, matching the clone. Reduced motion starts static, does not autoplay or loop, and requires explicit playback.
- Every video failure leaves a visible static fallback and a polite status. Escape, backdrop click, close button, focus entry/return, scroll-lock restoration, pointer scrubbing, pause/play, and touch drag hints remain covered.
- Task checks are focused. Do not run npm run gate, the complete Vitest suite, production build, or full product E2E during individual tasks.
- After all tasks and final review, run exactly one completion gate: npm run format, npm run gate, npm run build, and npm run e2e -- e2e/product.spec.ts.
- Phase 2C stops with a running local server and local acceptance URLs. Do not push, open a pull request, merge, delete the branch, or begin Phase 3.
- All agent messages and reports use caveman ultra. Code, tests, commit subjects, and durable documents use normal technical English.
- Model policy is binding: Luna High coordinates; the Phase 2C planner uses Sol Max; task implementers use Luna High; task and final reviewers use Sol Medium. Every subagent prompt starts with `Use caveman ultra for all communication and reports.` Use the normal/default service tier; never request priority, fast, high-speed, or accelerated execution.
- Before copying any asset, recheck the source hash and destination. Copy only when the destination is absent; reuse an equal-hash destination; stop on any unequal-hash collision. Never overwrite silently.
- PNG is already covered by Git LFS. WebM is not covered at planning time; Task 1 must add the exact `*.webm` LFS rule before copying the turntable video and prove the resulting attribute.
- Before any live seed, identify the exact Evironn database target from the same environment Prisma will use, reporting only hostname and database name. Never print credentials. Stop before mutation if the target is missing, ambiguous, belongs to `fashion-shop`, or cannot be proven to be the approved Evironn database.

## Binding Execution-State Remediation Before Task 2

During plan correction, a concurrent execution created local unpushed Task 1 commit `70b692ef3c11d44b257b5fbc7c6b0ca6f151bcc0` while `origin/phase/02-storefront` remained at `d2cc9a904af9fadde50e4d56574cc86007521498`. That commit contains the 28.7 MiB WebM as a normal Git blob, does not contain the corrected `.gitattributes`, and does not track this executable plan.

Stop before Task 2. Do not create a follow-up LFS commit: that would leave the raw WebM in branch history. Ask the user for explicit authorization to amend the local unpushed Task 1 commit. After authorization only:

1. Confirm HEAD is still the Task 1 commit or identify every later local commit before changing history. Never amend an unexpected HEAD.
2. Add the exact `*.webm filter=lfs diff=lfs merge=lfs -text` rule with `apply_patch`.
3. Renormalize only `public/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm` through Git LFS.
4. Stage `.gitattributes`, the renormalized WebM pointer, and this executable plan. Do not stage either protected historical plan.
5. Verify the staged WebM blob is an LFS pointer, `git check-attr` reports `filter: lfs`, and `git lfs ls-files` includes the exact file.
6. Amend only the local unpushed Task 1 commit without changing its conventional subject or configured user identity.
7. Verify the rewritten branch remains ahead of origin, no raw WebM exists in the rewritten branch history, and no push occurred.

If HEAD moved, the branch was pushed, identity differs, or safe local-only remediation cannot be proven, stop and report exact state. Do not use reset, rebase, filter-repo, or destructive cleanup without a new explicit user decision.

## Normative Source Record

| Clone file                         |  Bytes | SHA-256                                                          |
| ---------------------------------- | -----: | ---------------------------------------------------------------- |
| src/components/ProductPage.tsx     | 22,213 | 9CDA27567C234804E0C07A8E4CA3EA38D60D49448E959DB19367ABBA5369F68F |
| src/components/ProductPage.css     | 18,104 | 735C66AA3C4579847FBFF64950C808B85D1CF5B55BE10D1E722AB677F9294270 |
| src/components/productPageState.ts |  1,943 | 3182DDE373B199F06364D88A5F10B70C9D96685FA1059452E26CECF905C71DDF |
| src/components/productVideo360.ts  |  1,258 | 835D5A93EFBCDB1D9B065B3F0A08FB7D95E99444AE65B51C72BE81F5C52DEDA2 |

The clone tests prove the exact selector matrix, fixed room plus transparent layers, one-open accordion behavior, touch hint, circular video drag, seek coalescing, backdrop/Escape close, scroll lock, responsive 25% mobile positioning, and fullscreen editorial split. The older 2026-08-05 two-toggle plan is historical and superseded by the current six-combination ProductPage source and tests.

At planning time, the normative clone `ProductPage.css` passes the target repository's current Prettier configuration unchanged. Task 3 must repeat this preflight before copying. The production copy must retain SHA-256 `735C66AA3C4579847FBFF64950C808B85D1CF5B55BE10D1E722AB677F9294270` before and after the final formatter; any drift stops completion rather than being accepted as an incidental formatting rewrite.

## Audited ProductPage Asset Manifest

All nine files exist in the clone, are absent from production at planning time, and remain below the 100 MiB object limit. Total: 49,189,609 bytes (46.91 MiB). Git LFS already tracks PNG. It does not track WebM at planning time; Task 1 adds and verifies that rule before copying the 28.7 MiB video.

| Public path                                                           |      Bytes | Dimensions / duration  | SHA-256                                                          | Role                           |
| --------------------------------------------------------------------- | ---------: | ---------------------- | ---------------------------------------------------------------- | ------------------------------ |
| /assets/products/05-graphite-walnut-room-background-fixed.png         |  2,182,988 | 1536x1024 RGB          | 174C075A8BF5A04902988C0B4BF13E7457675FFD57D0FE9BBC538DBFE11F8C6A | One fixed room plate           |
| /assets/products/05-ivory-walnut-chair-fixed-alpha.png                |  2,476,114 | 1536x1024 RGBA         | 89689C049A8471BA0A3751CA106DF35CBEF983B3DDC436DA92E1139BDB308B07 | Ivory/walnut layer             |
| /assets/products/05-ivory-pine-chair-fixed-alpha.png                  |  2,475,996 | 1536x1024 RGBA         | D13AC589A4A5C515F1527861C3EF40F5D1FD0CA1195907C4CF7DC8AE5F560F9D | Ivory/pine layer               |
| /assets/products/05-graphite-walnut-chair-fixed-alpha.png             |  2,534,916 | 1536x1024 RGBA         | 45B21105F96F17936C88615B253C8883FC6C2E3C4F62414EBBCCB97F533EC06A | Charcoal/walnut layer          |
| /assets/products/05-graphite-pine-chair-fixed-alpha.png               |  2,562,642 | 1536x1024 RGBA         | B4885CFD87DBDF26C76C05940C3BAEC8C1A6A9AA52509CFEBC88EB80649214EE | Charcoal/pine layer            |
| /assets/products/05-terracotta-walnut-chair-fixed-alpha.png           |  2,555,550 | 1536x1024 RGBA         | 00414891406C376F9BB229490025F1732A3F52E4BE84517AFFA2A0047C482F41 | Terracotta/walnut layer        |
| /assets/products/05-terracotta-pine-chair-fixed-alpha.png             |  2,522,477 | 1536x1024 RGBA         | 0889692D1E2182BBF39DC71D30036FB7E9514BFD89305F7B45A6574D1EB33629 | Terracotta/pine layer          |
| /assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm | 28,717,710 | 1920x1080 VP9, 8.000 s | B07555E15A67EB1886F993FB7C26E925616C0C3989A60ADE108017281E722142 | Fullscreen draggable 360 video |
| /assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png |  3,161,216 | 1920x1080 RGBA         | E5F4279D5B307282D127ED585037ACB44130E0DE239836E56DD99ED3CECB6E48 | 360 poster and static fallback |

The ProductPage recommendation dependency already uses the Phase 2A InteractiveFurnitureCards implementation and its existing product media. Do not recopy those assets.

## File Ownership Map

| Task | Owned files                                                                                                                                                                                                                                                                                                                                                                                                     | Deliverable                                                                |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | `.gitattributes`; this executable plan; nine audited binaries; components/evironn/product/productPageState.ts; components/evironn/product/productVideo360.ts; tests/evironn-product-assets.test.ts; tests/evironn-product-state.test.ts; tests/evironn-product-video-360.test.ts                                                                                                                                | Durable tracked plan, WebM LFS rule, exact media, pure clone helpers       |
| 2    | prisma/seed-data.ts; lib/showcase-product.ts; tests/evironn-showcase-product.test.ts; tests/furniture-domain.test.ts; tests/gen-seed-sql.test.ts                                                                                                                                                                                                                                                                | Six canonical SKUs and serializable showcase DTO                           |
| 3    | components/evironn/product/ProductPage.tsx; styles/evironn/ProductPage.css; styles/evironn/ProductPage.next.css; app/layout.tsx; tests/product-view-color-selection.test.ts; tests/product-media-stage.test.tsx; tests/purchase-panel-loading.test.ts; tests/evironn-product-shell.test.tsx                                                                                                                     | Exact client scene, panel, selectors, 360, accessibility                   |
| 4    | app/(shop)/product/[slug]/page.tsx; app/(shop)/product/[slug]/loading.tsx; app/(shop)/product/[slug]/not-found.tsx; components/shared/product/product-view.tsx; components/shared/product/purchase-panel.tsx; components/shared/product/product-media-stage.tsx; components/shared/product/product-media-stage.module.css; tests/product-page-canonical.test.tsx; tests/evironn-product-source-contract.test.ts | App Router integration, redirects, metadata, retirement of temporary shell |
| 5    | e2e/product.spec.ts; docs/roadmap/STATUS.md; .superpowers/sdd/progress.md; .superpowers/sdd/phase-2c-delivery-report.md                                                                                                                                                                                                                                                                                         | Acceptance coverage, delivery record, final gate, local server             |

No task may edit a previous task's production files. Review remediation returns to the owning implementer.

---

### Task 1: Copy Exact Assets and Pure Clone Helpers

**Interfaces**

- Consumes: the four normative clone files and nine audited clone assets.
- Produces: PRODUCT_SCENE_BACKGROUND, PRODUCT_SCENE_CHAIRS, UPHOLSTERY_OPTIONS, WOOD_OPTIONS, AccordionKey, toggleAccordion, dragHintForInput, videoTimeFromDrag, coalesceVideoSeek, and the exact public paths used by later tasks.

- [ ] **Step 1: Write failing helper and asset contracts.**

Create tests/evironn-product-state.test.ts by porting all behavior assertions from clone tests/productPageState.test.mjs that target productPageState.ts. Create tests/evironn-product-video-360.test.ts by porting all assertions from clone tests/productVideo360.test.mjs. Create tests/evironn-product-assets.test.ts with the exact nine-row manifest above and assertions for existence, byte size, SHA-256, unique paths, total 49,189,609, maximum object size below 100 * 1024 * 1024, and the exact `*.webm filter=lfs diff=lfs merge=lfs -text` rule in `.gitattributes`.

```ts
expect(PRODUCT_SCENE_CHAIRS).toEqual({
  ivory: {
    walnut: '/assets/products/05-ivory-walnut-chair-fixed-alpha.png',
    pine: '/assets/products/05-ivory-pine-chair-fixed-alpha.png',
  },
  charcoal: {
    walnut: '/assets/products/05-graphite-walnut-chair-fixed-alpha.png',
    pine: '/assets/products/05-graphite-pine-chair-fixed-alpha.png',
  },
  terracotta: {
    walnut: '/assets/products/05-terracotta-walnut-chair-fixed-alpha.png',
    pine: '/assets/products/05-terracotta-pine-chair-fixed-alpha.png',
  },
});
expect(videoTimeFromDrag(1.5, 180, 720, 3)).toBe(0.75);
expect(coalesceVideoSeek(true, 1.25, 4.5)).toEqual({ shouldSeek: false, time: 4.5 });
```

- [ ] **Step 2: Run RED.**

Run:

```powershell
npx vitest run tests/evironn-product-assets.test.ts tests/evironn-product-state.test.ts tests/evironn-product-video-360.test.ts
```

Expected: FAIL because production helpers and nine assets do not exist.

- [ ] **Step 3: Register WebM in LFS, then copy helpers and assets without transformation or overwrite.**

Use `apply_patch` to add this exact line to `.gitattributes` before any WebM copy:

```gitattributes
*.webm filter=lfs diff=lfs merge=lfs -text
```

Do not add a duplicate rule. Confirm the effective attribute before copying:

```powershell
git check-attr filter diff merge text -- "public/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm"
```

Expected: `filter: lfs`, `diff: lfs`, `merge: lfs`, `text: unset`.

Run:

```powershell
$cloneRoot = 'D:\Новая папка (2)\evironn-clone'
$targetRoot = 'D:\Projects\evironn'
New-Item -ItemType Directory -Force -Path (Join-Path $targetRoot 'components\evironn\product') | Out-Null
Copy-Item -LiteralPath (Join-Path $cloneRoot 'src\components\productPageState.ts') -Destination (Join-Path $targetRoot 'components\evironn\product\productPageState.ts')
Copy-Item -LiteralPath (Join-Path $cloneRoot 'src\components\productVideo360.ts') -Destination (Join-Path $targetRoot 'components\evironn\product\productVideo360.ts')
$assetNames = @(
  '05-graphite-walnut-room-background-fixed.png',
  '05-ivory-walnut-chair-fixed-alpha.png',
  '05-ivory-pine-chair-fixed-alpha.png',
  '05-graphite-walnut-chair-fixed-alpha.png',
  '05-graphite-pine-chair-fixed-alpha.png',
  '05-terracotta-walnut-chair-fixed-alpha.png',
  '05-terracotta-pine-chair-fixed-alpha.png',
  '05-graphite-walnut-lounge-chair-turntable-alpha.webm',
  '05-graphite-walnut-lounge-chair-turntable-poster.png'
)
foreach ($name in $assetNames) {
  $sourcePath = Join-Path $cloneRoot ('public\assets\products\' + $name)
  $targetPath = Join-Path $targetRoot ('public\assets\products\' + $name)
  if (Test-Path -LiteralPath $targetPath) {
    $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourcePath).Hash
    $targetHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $targetPath).Hash
    if ($sourceHash -ne $targetHash) {
      throw "Asset collision with different hash: $targetPath"
    }
    continue
  }
  Copy-Item -LiteralPath $sourcePath -Destination $targetPath
}
```

Do not copy product360Options.ts, Product360OptionsPage.tsx, development picker assets, integrated room experiments, dist, logs, or previews.

- [ ] **Step 4: Verify GREEN and source fidelity.**

Run:

```powershell
npx vitest run tests/evironn-product-assets.test.ts tests/evironn-product-state.test.ts tests/evironn-product-video-360.test.ts
npx prettier --check "components/evironn/product/productPageState.ts" "components/evironn/product/productVideo360.ts" "tests/evironn-product-assets.test.ts" "tests/evironn-product-state.test.ts" "tests/evironn-product-video-360.test.ts"
git check-attr filter -- "public/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm"
git lfs ls-files
git diff --check
```

Expected: all focused tests pass; copied binary hashes equal the manifest; helper behavior equals clone tests; the WebM is reported with `filter: lfs` and appears in `git lfs ls-files`. Formatting may change punctuation only, never behavior or exported names.

- [ ] **Step 5: Commit, report, review.**

Stage this executable Phase 2C plan together with Task 1. Do not stage either protected historical plan. Commit subject: feat: add showcase product media and helpers

Write .superpowers/sdd/phase-2c-task-1-report.md with changed files, RED/GREEN output, nine hashes, total bytes, and zero extra assets. Dispatch one fresh Sol Medium reviewer over the Task 1 diff only. Do not advance until Critical=0 and Important=0.

---

### Task 2: Build Six Canonical SKUs and Showcase DTO

**Interfaces**

- Consumes: getFurnitureProductBySlug, resolveSelectedSku, parseOptionParam, serializeOptionParam, formatPrice, SHOWCASE_PRODUCT_PATH, PRODUCT_SCENE_BACKGROUND, and PRODUCT_SCENE_CHAIRS.
- Produces: SHOWCASE_PRODUCT_SLUG, ShowcaseUpholsteryId, ShowcaseWoodId, ShowcaseCombinationDto, ShowcaseProductPageDto, and buildShowcaseProductPageDto(product, rawOption).

- [ ] **Step 1: Write RED seed and adapter tests.**

In tests/furniture-domain.test.ts assert the Noma seed has exactly three upholstery values, two finish values, six active complete SKUs, six unique combination keys, price 89,990, old price 109,990, and the exact audited turntable URLs. Update tests/gen-seed-sql.test.ts to require all six combination keys and the new WebM/poster paths.

Create tests/evironn-showcase-product.test.ts with a six-SKU FurnitureProductForSelection fixture. Assert:

- default input selects ivory/walnut;
- every visual pair maps to one unique server SKU and exact canonical path;
- all six combinations are returned;
- unknown/partial values merge with the default pair and canonicalize;
- incomplete matrix, duplicate SKU, missing turntable trio, or unexpected selected option throws ShowcaseProductContractError;
- DTO is JSON-serializable;
- DTO prices come from resolved SKUs and use formatPrice;
- scene background and chair paths come from the untouched clone state manifest.

```ts
expect(dto.combinations.map(({ upholstery, wood }) => [upholstery, wood])).toEqual([
  ['ivory', 'pine'],
  ['ivory', 'walnut'],
  ['charcoal', 'pine'],
  ['charcoal', 'walnut'],
  ['terracotta', 'pine'],
  ['terracotta', 'walnut'],
]);
expect(dto.selected.canonicalPath).toBe(
  '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
);
```

- [ ] **Step 2: Run RED.**

Run:

```powershell
npx vitest run tests/evironn-showcase-product.test.ts tests/furniture-domain.test.ts tests/gen-seed-sql.test.ts tests/product-selection.test.ts
```

Expected: FAIL because the seed has two SKUs and no showcase DTO.

- [ ] **Step 3: Expand only the Noma seed record.**

Keep finish values oak and walnut for compatibility. Keep ivory-boucle; add upholstery values graphite and terracotta using clone swatch colors #31312f and #a85b43. Keep EV-NWL-OAK and EV-NWL-WAL, update both to price 89990 and oldPrice 109990, then add:

```ts
sku('EV-NWL-GPH-OAK', [
  { groupSlug: 'finish', valueSlug: 'oak' },
  { groupSlug: 'upholstery', valueSlug: 'graphite' },
], 89990, 3, 109990),
sku('EV-NWL-GPH-WAL', [
  { groupSlug: 'finish', valueSlug: 'walnut' },
  { groupSlug: 'upholstery', valueSlug: 'graphite' },
], 89990, 3, 109990),
sku('EV-NWL-TER-OAK', [
  { groupSlug: 'finish', valueSlug: 'oak' },
  { groupSlug: 'upholstery', valueSlug: 'terracotta' },
], 89990, 3, 109990),
sku('EV-NWL-TER-WAL', [
  { groupSlug: 'finish', valueSlug: 'walnut' },
  { groupSlug: 'upholstery', valueSlug: 'terracotta' },
], 89990, 3, 109990),
```

Replace only Noma's product media with one IMAGE and one complete turntable trio. Use the audited poster for IMAGE, TURN_TABLE_POSTER, and TURN_TABLE_FALLBACK; use the audited WebM for TURN_TABLE_VIDEO. Duplicate URL use across media kinds is intentional: the normative clone has one exact poster and no separate fallback bitmap.

- [ ] **Step 4: Implement lib/showcase-product.ts.**

Use these public types and mapping records:

```ts
export const SHOWCASE_PRODUCT_SLUG = 'noma-woven-lounge' as const;
export type ShowcaseUpholsteryId = 'ivory' | 'charcoal' | 'terracotta';
export type ShowcaseWoodId = 'pine' | 'walnut';

const canonicalByVisual = {
  ivory: 'ivory-boucle',
  charcoal: 'graphite',
  terracotta: 'terracotta',
} as const;

const finishByWood = {
  pine: 'oak',
  walnut: 'walnut',
} as const;

export interface ShowcaseCombinationDto {
  upholstery: ShowcaseUpholsteryId;
  wood: ShowcaseWoodId;
  canonicalOption: string;
  canonicalPath: string;
  chairUrl: string;
  sku: {
    id: string;
    articleNumber: string;
    price: number;
    oldPrice: number | null;
    stock: number;
    priceLabel: string;
    oldPriceLabel: string | null;
  };
}

export interface ShowcaseProductPageDto {
  product: {
    name: 'Кресло Graphite';
    description: string;
    categoryName: string;
    categorySlug: string;
  };
  sceneBackgroundUrl: string;
  selected: ShowcaseCombinationDto;
  combinations: ShowcaseCombinationDto[];
  turntable: {
    videoUrl: string;
    posterUrl: string;
    fallbackUrl: string;
    alt: string;
  };
}
```

buildShowcaseProductPageDto must construct all six complete canonical selections, call resolveSelectedSku for each, reject any resolver drift or duplicate SKU ID, project exact server facts, and choose the selected pair by merging parsed input over the ivory/walnut default. It must not query Prisma, import client hooks, or mutate product data.

- [ ] **Step 5: Run GREEN, typecheck, and apply seed locally.**

Before seeding, inspect the URL used by Prisma without exposing username, password, query parameters, or the full connection string. Record only hostname and database name. Confirm it is the approved Evironn database. If that cannot be proven, stop and request user confirmation before `prisma:seed`.

Run:

```powershell
npx vitest run tests/evironn-showcase-product.test.ts tests/furniture-domain.test.ts tests/gen-seed-sql.test.ts tests/product-selection.test.ts
npm run typecheck
npx prettier --check "prisma/seed-data.ts" "lib/showcase-product.ts" "tests/evironn-showcase-product.test.ts" "tests/furniture-domain.test.ts" "tests/gen-seed-sql.test.ts"
npm run prisma:seed
npm run prisma:seed
git diff --check
```

Expected: focused tests and typecheck pass; both explicit seed runs complete; the second run changes no counts and proves idempotency; current local Noma resolves six active combinations. No schema migration exists. Report the redacted hostname/database target and both seed results.

- [ ] **Step 6: Commit, report, review.**

Commit subject: feat: add six-configuration showcase projection

Write .superpowers/sdd/phase-2c-task-2-report.md with the six article numbers, canonical paths, seed counts, two seed runs, and focused evidence. Dispatch one fresh Sol Medium reviewer over Task 2 only. Require Critical=0 and Important=0.

---

### Task 3: Port Exact ProductPage Scene, Panel, and Fullscreen 360

**Interfaces**

- Consumes: ShowcaseProductPageDto, exact clone helpers, existing createFurnitureCaptionVariants, existing InteractiveFurnitureCards, PUBLIC_ROUTES, and the existing fixed storefront header/footer.
- Produces: ProductPage({ model }: { model: ShowcaseProductPageDto }) with the clone DOM/class contract and no commerce mutation.

- [ ] **Step 1: Write RED component, source, and interaction tests.**

Repurpose tests/product-view-color-selection.test.ts to render the new ProductPage DTO, click all upholstery/wood controls, assert the exact chair layer changes immediately, and assert window.history.replaceState receives the matching server-projected canonical path without router navigation or scroll change.

Repurpose tests/product-media-stage.test.tsx to cover 360 open/close, exact video/poster/fallback URLs, no playback before open, normal open playback, pointer pause/scrub, seek coalescing, pause/play labels, video error fallback, and reduced-motion no-autoplay/no-loop until explicit click.

Repurpose tests/purchase-panel-loading.test.ts to assert both add controls are disabled/decorative, have unchanged visible copy, and have no cart/store/action import.

Create tests/evironn-product-shell.test.tsx to assert clone root/section/aside/modal class names, Russian copy, three benefits, four features, four accordions, recommendations heading, backdrop close, Escape close, scroll lock restoration, dialog focus entry/return, and clone mobile positioning: default 50% at 390px plus 25% wider-mobile positioning from 401px through 640px.

- [ ] **Step 2: Run RED.**

Run:

```powershell
npx vitest run tests/product-view-color-selection.test.ts tests/product-media-stage.test.tsx tests/purchase-panel-loading.test.ts tests/evironn-product-shell.test.tsx tests/evironn-product-state.test.ts tests/evironn-product-video-360.test.ts
```

Expected: FAIL because the exact ProductPage component and CSS are absent.

- [ ] **Step 3: Copy clone ProductPage source and CSS, then make only boundary adaptations.**

Before copying, run the target Prettier configuration against the read-only clone CSS and recompute its SHA-256. Expected: Prettier check passes and hash equals `735C66AA3C4579847FBFF64950C808B85D1CF5B55BE10D1E722AB677F9294270`. Stop on either mismatch. Then copy clone src/components/ProductPage.tsx to components/evironn/product/ProductPage.tsx and clone src/components/ProductPage.css to styles/evironn/ProductPage.css. Preserve ProductPage.css byte-for-byte. Add styles/evironn/ProductPage.next.css for Next-only rules; do not edit the clone CSS for adapters.

In ProductPage.tsx:

1. Add use client.
2. Replace clone cart-store and Vite-route imports with type-only ShowcaseProductPageDto, next/link, PUBLIC_ROUTES, current InteractiveFurnitureCards, and current furniture-caption-motion paths.
3. Accept model and initialize selectedUpholstery/selectedWood from model.selected.
4. Derive currentCombination only from model.combinations.
5. On selection, update the two visual IDs and call window.history.replaceState(null, '', next.canonicalPath). Never resolve a SKU client-side.
6. Read scene background, chair, price, old price, stock, video, poster, and fallback from model/currentCombination.
7. Keep both add buttons visually unchanged but disabled, aria-disabled, and described by one visually hidden Phase 3 notice.
8. Preserve coalesceVideoSeek and videoTimeFromDrag calls unchanged.
9. Add isVideoFailed and render the fallback image with product-page__product-media when video fails.
10. Skip open-time play and loop when reducedMotion is true; explicit playback remains available.
11. Focus the close button after open, contain Tab focus inside the dialog, and restore focus to the launch button on close.
12. Keep backdrop, close button, Escape, body/root scroll lock, pointer capture, and scroll restoration.

Use this bounded selection function:

```ts
const selectCombination = (upholstery: ShowcaseUpholsteryId, wood: ShowcaseWoodId) => {
  const next = model.combinations.find(
    (combination) => combination.upholstery === upholstery && combination.wood === wood,
  );
  if (!next) return;
  setSelectedUpholstery(upholstery);
  setSelectedWood(wood);
  window.history.replaceState(null, '', next.canonicalPath);
};
```

The Next adapter stylesheet may contain only disabled-control normalization, hidden descriptive text, and fallback layer visibility. It may not alter clone geometry, colors, type, spacing, breakpoints, or animation timing.

- [ ] **Step 4: Register the exact CSS once.**

Add these imports after catalog styles in app/layout.tsx:

```ts
import '../styles/evironn/ProductPage.css';
import '../styles/evironn/ProductPage.next.css';
```

Do not import global CSS from the Client Component.

- [ ] **Step 5: Run GREEN and focused checks.**

Run:

```powershell
npx vitest run tests/product-view-color-selection.test.ts tests/product-media-stage.test.tsx tests/purchase-panel-loading.test.ts tests/evironn-product-shell.test.tsx tests/evironn-product-state.test.ts tests/evironn-product-video-360.test.ts tests/evironn-product-assets.test.ts
npm run typecheck
npx prettier --check "components/evironn/product/ProductPage.tsx" "styles/evironn/ProductPage.css" "styles/evironn/ProductPage.next.css" "app/layout.tsx" "tests/product-view-color-selection.test.ts" "tests/product-media-stage.test.tsx" "tests/purchase-panel-loading.test.ts" "tests/evironn-product-shell.test.tsx"
git diff --check
```

Expected: focused tests pass; typecheck passes; normative CSS remains Prettier-clean and its production SHA-256 remains `735C66AA3C4579847FBFF64950C808B85D1CF5B55BE10D1E722AB677F9294270`. Do not add it to `.prettierignore`; do not accept any formatter-induced drift.

- [ ] **Step 6: Commit, report, review.**

Commit subject: feat: port exact showcase product scene

Write .superpowers/sdd/phase-2c-task-3-report.md with clone-vs-production source mapping, every allowed adapter, six-combination evidence, 360/reduced-motion/fallback evidence, and CSS hash evidence. Dispatch one fresh Sol Medium reviewer. Reviewer must compare the production JSX/class sequence and CSS against the normative clone, not merely inspect screenshots. Require Critical=0 and Important=0.

---

### Task 4: Connect App Router, Canonical Redirects, Metadata, and JSON-LD

**Interfaces**

- Consumes: SHOWCASE_PRODUCT_SLUG, buildShowcaseProductPageDto, getFurnitureProductBySlug, format-neutral SEO helpers, and ProductPage.
- Produces: one canonical showcase route for every product URL; canonical metadata and structured data from the server DTO.

- [ ] **Step 1: Rewrite tests/product-page-canonical.test.tsx RED.**

Keep its existing mocks for getFurnitureProductBySlug, notFound, metadata, Product JSON-LD, and BreadcrumbList. Add a redirect mock with a stable REDIRECT sentinel. Assert:

- the showcase route without option redirects to default canonical option;
- a partial or invalid option redirects once to the resolved canonical path;
- a canonical six-combination URL renders ProductPage with the matching selected DTO;
- every non-showcase slug redirects to the default showcase canonical URL;
- missing showcase product or incomplete six-SKU/turntable contract invokes notFound;
- metadata canonical, Open Graph, Twitter, Product JSON-LD, and breadcrumbs use the canonical showcase path and audited poster;
- aggregate offers use all six active server SKUs;
- no legacy shared ProductView, PurchasePanel, ProductMediaStage, cart, wishlist, review, auth, checkout, or fashion relation appears in the route boundary.

- [ ] **Step 2: Write tests/evironn-product-source-contract.test.ts RED.**

Assert the route imports only getFurnitureProductBySlug, buildShowcaseProductPageDto, ProductPage, Next redirect/notFound, and SEO helpers for product behavior. Assert the clone helper imports and ProductPage CSS imports exist. Recursively scan app for product variant/demo routes. Assert the four temporary shared visual files have no production references before deletion.

- [ ] **Step 3: Run RED.**

Run:

```powershell
npx vitest run tests/product-page-canonical.test.tsx tests/evironn-product-source-contract.test.ts tests/evironn-showcase-product.test.ts tests/product-selection.test.ts
```

Expected: FAIL because the route still renders the temporary Task 3 shell and does not redirect.

- [ ] **Step 4: Replace only the route presentation boundary.**

Use this order in app/(shop)/product/[slug]/page.tsx:

```ts
const product = await getFurnitureProductBySlug(SHOWCASE_PRODUCT_SLUG);
if (!product) notFound();

let model: ShowcaseProductPageDto;
try {
  model = buildShowcaseProductPageDto(product, first(option));
} catch {
  notFound();
}

const canonicalRaw = model.selected.canonicalOption;
if (slug !== SHOWCASE_PRODUCT_SLUG || first(option) !== canonicalRaw) {
  redirect(model.selected.canonicalPath);
}
```

generateMetadata resolves the same model but never redirects. It sets the canonical URL to model.selected.canonicalPath, uses model.product clone copy, uses the audited poster as social image, and retains existing product/breadcrumb JSON-LD helpers. The page returns the two JSON-LD scripts and ProductPage model without the old max-width/Tailwind wrapper.

- [ ] **Step 5: Remove temporary inherited PDP presentation only after GREEN.**

Delete:

- app/(shop)/product/[slug]/loading.tsx
- app/(shop)/product/[slug]/not-found.tsx
- components/shared/product/product-view.tsx
- components/shared/product/purchase-panel.tsx
- components/shared/product/product-media-stage.tsx
- components/shared/product/product-media-stage.module.css

The global Evironn not-found page becomes the fallback. Keep lib/product-selection.ts, lib/get-furniture-product.ts, services/dto/product.dto.ts, product accordions used elsewhere, SEO helpers, and all canonical server tests.

- [ ] **Step 6: Run GREEN, typecheck, and forbidden-reference scans.**

Run:

```powershell
npx vitest run tests/product-page-canonical.test.tsx tests/evironn-product-source-contract.test.ts tests/evironn-showcase-product.test.ts tests/product-selection.test.ts tests/product-dto.test.ts tests/evironn-product-shell.test.tsx
npm run typecheck
npx prettier --check "app/(shop)/product/[slug]/page.tsx" "tests/product-page-canonical.test.tsx" "tests/evironn-product-source-contract.test.ts"
rg -n "ProductView|PurchasePanel|ProductMediaStage|useCartStore|setCartCount|addProductToCart|axios|/checkout" "app/(shop)/product/[slug]" "components/evironn/product"
git diff --check
```

Expected: tests/typecheck/format pass; rg returns no forbidden product-boundary matches; no catalog, home, auth, cart, checkout, review, admin, Prisma schema, or migration file changed.

- [ ] **Step 7: Commit, report, review.**

Commit subject: feat: connect canonical showcase product route

Write .superpowers/sdd/phase-2c-task-4-report.md with redirect matrix, metadata/JSON-LD evidence, deleted temporary files, and preserved server files. Dispatch one fresh Sol Medium reviewer. Require Critical=0 and Important=0.

---

### Task 5: Product E2E, Delivery Records, Final Review, Gate, and Local Acceptance

**Interfaces**

- Consumes: completed Tasks 1-4 and a locally seeded database.
- Produces: critical desktop/mobile/six-combination/360 acceptance evidence, durable Phase 2C status, one full completion gate, and a running local URL.

- [ ] **Step 1: Rewrite e2e/product.spec.ts with critical Phase 2C scenarios.**

Cover:

1. /product/noma-woven-lounge redirects to the default encoded canonical URL and renders exact scene/panel/recommendation composition.
2. A non-showcase slug redirects to the same showcase URL.
3. All six upholstery/wood pairs update aria-pressed state, exact chair src, canonical URL, server-projected 89 990 ₽ / 109 990 ₽, and never mutate cart count.
4. Desktop 360 opens the dialog, locks scroll, focuses close, loads exact WebM/poster, pauses on pointer drag, changes progress/currentTime, resumes/pauses, closes with Escape, restores scroll and launch focus.
5. Video error leaves the exact static fallback visible and announces the polite Russian status.
6. A 390x844 context keeps the fixed scene at clone-default 50% room/chair positioning, stacked glass panel, all selectors, mobile dialog, and close control usable; a 412x844 context verifies clone 25% wider-mobile room/chair positioning.
7. Reduced motion has no meaningful CSS transition/animation duration, no video autoplay/loop before explicit opt-in, and visible poster/fallback.
8. Keyboard traversal reaches selectors, launch, modal close, playback, accordions, catalog link, and recommendation links. Axe scan of .product-page has no critical or serious violations.

Use these six canonical option strings:

```ts
const combinations = [
  ['ivory', 'pine', 'finish%3Aoak%2Cupholstery%3Aivory-boucle', '05-ivory-pine-chair-fixed-alpha.png'],
  ['ivory', 'walnut', 'finish%3Awalnut%2Cupholstery%3Aivory-boucle', '05-ivory-walnut-chair-fixed-alpha.png'],
  ['charcoal', 'pine', 'finish%3Aoak%2Cupholstery%3Agraphite', '05-graphite-pine-chair-fixed-alpha.png'],
  ['charcoal', 'walnut', 'finish%3Awalnut%2Cupholstery%3Agraphite', '05-graphite-walnut-chair-fixed-alpha.png'],
  ['terracotta', 'pine', 'finish%3Aoak%2Cupholstery%3Aterracotta', '05-terracotta-pine-chair-fixed-alpha.png'],
  ['terracotta', 'walnut', 'finish%3Awalnut%2Cupholstery%3Aterracotta', '05-terracotta-walnut-chair-fixed-alpha.png'],
] as const;
```

- [ ] **Step 2: Run focused E2E before final review.**

Run:

```powershell
npm run e2e -- e2e/product.spec.ts
```

Expected: every Phase 2C scenario passes. If local Neon or media loading fails, record the exact failure; do not claim pass.

- [ ] **Step 3: Update durable records.**

Update docs/roadmap/STATUS.md with task commits/reviews, six-SKU seed state, nine-asset inventory total, focused evidence, remaining Preview loading debt, and the local-acceptance stop gate. Update .superpowers/sdd/progress.md and create .superpowers/sdd/phase-2c-delivery-report.md. DECISIONS.md remains unchanged because the plan uses ADR-004, ADR-006, ADR-007, ADR-010, ADR-012, ADR-013, and ADR-014 without a new architecture decision.

- [ ] **Step 4: Commit Task 5 and run its reviewer checkpoint.**

Commit subject: test: cover showcase product acceptance

Dispatch one fresh Sol Medium reviewer over Task 5 only. Require Critical=0 and Important=0. Reviewer reuses fresh E2E evidence and does not run the full gate.

- [ ] **Step 5: Run one final delivery review.**

Dispatch one fresh Sol Medium reviewer over delivery-base-to-HEAD only. Review exact clone fidelity, six-SKU server authority, redirects, metadata, structured data, media inventory, fallback, reduced motion, accessibility, scope, deleted temporary shell, and secret hygiene. Return Critical/Important findings to owning implementers. Rerun only affected focused checks after remediation.

- [ ] **Step 6: Run the completion gate exactly once after final-review remediation.**

Run:

```powershell
npm run format
$productCssHash = (Get-FileHash -Algorithm SHA256 -LiteralPath "styles/evironn/ProductPage.css").Hash
if ($productCssHash -ne "735C66AA3C4579847FBFF64950C808B85D1CF5B55BE10D1E722AB677F9294270") { throw "ProductPage.css drift: $productCssHash" }
npm run gate
npm run build
npm run e2e -- e2e/product.spec.ts
git diff --check
git status --short --branch
git diff --name-only $deliveryBase..HEAD
git grep -n -I -E "(SECRET|TOKEN|PASSWORD|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY)" -- .
```

Expected: format succeeds without changing normative ProductPage CSS; exact CSS hash assertion passes; gate passes all formatting/lint/type/Vitest checks; build exits 0; product E2E passes all Phase 2C scenarios; whitespace and secret scans are clean. Repeat the full gate only if final remediation changed a cross-cutting surface or invalidated this evidence.

- [ ] **Step 7: Start the local acceptance server and stop all repository actions.**

Run:

```powershell
$acceptancePort = 3000..3010 | Where-Object {
  -not (Get-NetTCPConnection -State Listen -LocalPort $_ -ErrorAction SilentlyContinue)
} | Select-Object -First 1
if (-not $acceptancePort) { throw 'No free acceptance port in 3000..3010' }
npm run dev -- --hostname 127.0.0.1 --port $acceptancePort
```

Never stop or reuse an unrelated listener. If port 3000 is occupied, use the first free port and report it. Keep the resulting dev-server session running.

Leave the server running and report:

- `http://127.0.0.1:<actual-port>/product/noma-woven-lounge`
- `http://127.0.0.1:<actual-port>/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle`

Ask the user to inspect desktop, 390x844 mobile, all six combinations, 360 open/drag/pause/play/Escape/backdrop/close, fallback, reduced motion, keyboard focus, recommendations, header, and footer. Do not push, create a PR, merge, delete the branch, or begin Phase 3.

## Reviewer Checkpoint Template

Every task reviewer receives only:

- this plan's Global Constraints and assigned task;
- task base SHA and task commit/remediation SHAs;
- exact owned-file diff;
- implementer report;
- fresh focused command output;
- normative clone paths needed for comparison.

Reviewer reports Critical, Important, and Minor findings with file/line evidence. Critical or Important findings return to the same implementer. The coordinator does not dispatch the next task until re-review reports Critical=0 and Important=0.

## Self-Review Record

- Spec coverage: exact clone JSX/classes/CSS/state/video helpers, fixed room, six combinations, canonical option state, serializable server DTO, six canonical SKUs, non-showcase redirect, metadata/JSON-LD, decorative cart, fullscreen 360, fallback, responsive behavior, reduced motion, accessibility, focused TDD, reviewers, one final gate, and local server each have an owning task.
- Source coverage: all user-requested project documents, current production Task 3 logic/tests, compatible fashion-shop color URL/preload patterns, all requested clone files/tests/design/plans, and direct ProductPage assets were inspected.
- Type consistency: ProductPage consumes ShowcaseProductPageDto; DTO combinations carry canonical server SKU facts and clone visual IDs; route, metadata, E2E, and client selection use the same canonical paths.
- Ownership consistency: no production file is shared between task owners; remediation returns to the owner.
- Placeholder scan: no TBD, TODO, generic error-handling step, unspecified test, or unowned implementation remains.
- Scope: no redesign, new media, schema migration, dependency, push, PR, merge, branch deletion, Phase 3 work, or performance rewrite is included.

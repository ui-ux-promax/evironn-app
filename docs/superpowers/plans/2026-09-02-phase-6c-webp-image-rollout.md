# Phase 6C WebP Image Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the approved `public/assets` PNG/JPG inventory with smaller, verified WebP files while preserving dimensions, alpha bytes, visible RGB pixels, routes, data contracts, and the accepted Evironn design.

**Architecture:** Generate only the approved adjacent WebP outputs with `sharp`, reuse all pre-existing WebP files byte-for-byte, and update only static asset-path contracts in the enumerated application, seed, SEO, fixture, unit, and E2E files. Keep source PNG/JPG files until path, invariant, browser, and visual gates pass; then delete exactly the approved sources and report measured byte totals without making an unmeasured speed claim.

**Tech Stack:** Windows PowerShell, Node.js, `sharp`, Next.js App Router, React, TypeScript, Prisma seed data, Vitest, Playwright Chromium.

## Global Constraints

- Scope is limited to `public/assets`, the exact source references listed below, and this already-approved plan. Do not change infrastructure, services, package files, Prisma schema or migrations, workflows, provider configuration, unrelated tests, `public/home`, or `public/products`.
- Use static, source-analyzable `/assets/.../*.webp` strings. Apply Vercel React guidance conservatively: do not add runtime asset selection, client state, dynamic imports, loading changes, image services, or speculative architecture.
- Preserve width, height, aspect ratio, composition, transparency, routes, data, interaction behavior, and accepted desktop/mobile design. Do not resize, crop, recompose, or introduce a new image treatment.
- Opaque inputs use WebP `quality: 92`. Alpha inputs use WebP `lossless: true`.
- Existing WebP files are collision-protected and must never be decoded/re-encoded, overwritten, renamed, deleted, or selected as conversion inputs or outputs.
- Create WebP files first, update references second, run focused RED/GREEN checks third, verify home/catalog/PDP/auth/admin locally at desktop and mobile fourth, and delete source PNG/JPG files last.
- Every command below runs from `D:\Projects\evironn`. Commands are implementation-session commands only; the planning session must not run them.
- Stop immediately on an unexpected working-tree path, missing input, output collision, duplicate output, changed pre-existing WebP hash, source metadata mismatch, failed alpha/visible-RGB comparison, stale source reference, absent referenced asset, failed test, 404, gray screen, console error, transparency loss, route/data/design drift, or protected-file hash change.
- Preserve without modification, staging, cleanup, or deletion: `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` with SHA-256 `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9`, and `docs/superpowers/plans/phase-2-task-3-execution.md` with SHA-256 `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`.
- One Luna High implementer owns each task. Each task has one commit owner. A fresh Sol Medium reviewer must approve the exact task diff and focused evidence before the next task. Resolve all Critical and Important findings within that task's allowlist.
- Task boundaries are separate PowerShell/agent contexts. No task may rely on shell variables surviving a prior command. Each task must redeclare its own literal allowlist; Task 1 completion must report literal `ASSETS_BEFORE`, `SOURCE_BYTES`, `GENERATED_OUTPUT_BYTES`, and the 14 existing-WebP baseline hashes to the coordinator, who passes them into later task prompts or records them in the task evidence.
- Within each task, run its prelude and all numbered command blocks in one continuous PowerShell session. If a numbered block is started in a new shell, rerun that task's complete prelude first; no block depends on a previous shell process.
- Do not push, open a pull request, deploy, merge, fetch, pull, switch branches, reset, rebase, clean, or perform provider/database operations. Those actions require separate user authorization.
- This rollout may report measured byte reduction only. It must not claim faster loading or deployed performance without a separate comparable performance measurement.

## Implementation baseline preflight (not counted as a rollout task)

After the user approves this plan, the Luna coordinator must anchor implementation to an immutable commit containing exactly these three planning artifacts: `docs/superpowers/specs/2026-09-02-phase-6c-webp-image-rollout-design.md`, `.superpowers/sdd/phase-6c-webp-image-rollout-evidence.md`, and this plan. Record that commit SHA before Task 1. If creating that planning-artifact commit is not separately authorized, stop before implementation. Task 1 then expects the two protected plans to be the only untracked paths; the planning artifacts are tracked in the immutable baseline. This preflight is coordinator-owned and is not a fourth task.

Exact authorized preflight commands:

```powershell
if (@(git diff --cached --name-only).Count -ne 0) { throw 'Preflight requires an empty index.' }
git add -- docs/superpowers/specs/2026-09-02-phase-6c-webp-image-rollout-design.md docs/superpowers/plans/2026-09-02-phase-6c-webp-image-rollout.md
git add -f -- .superpowers/sdd/phase-6c-webp-image-rollout-evidence.md
$expectedPlanningPaths = @('docs/superpowers/specs/2026-09-02-phase-6c-webp-image-rollout-design.md','docs/superpowers/plans/2026-09-02-phase-6c-webp-image-rollout.md','.superpowers/sdd/phase-6c-webp-image-rollout-evidence.md')
$stagedPlanningPaths = @(git diff --cached --name-only)
if (@(Compare-Object -ReferenceObject $expectedPlanningPaths -DifferenceObject $stagedPlanningPaths).Count -ne 0) { throw "Planning baseline must stage exactly three artifacts: $($stagedPlanningPaths -join ', ')" }
git diff --cached --check
git config user.name
git config user.email
git commit -m "docs: prepare phase 6c webp image rollout"
$implementationBaseline = git rev-parse HEAD
$status = @(git status --short --untracked-files=all)
$expectedProtectedPaths = @('docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md','docs/superpowers/plans/phase-2-task-3-execution.md')
$actualProtectedPaths = @($status | ForEach-Object { $_.Substring(3) })
if (@(Compare-Object -ReferenceObject $expectedProtectedPaths -DifferenceObject $actualProtectedPaths).Count -ne 0) { throw "Unexpected post-baseline status: $($status -join ' | ')" }
"IMPLEMENTATION_BASELINE=$implementationBaseline"
```

Expected: the index initially is empty; exactly three planning artifacts are staged (the evidence path is force-added because `.superpowers/sdd` is ignored); commit succeeds with the user's identity; post-commit untracked status contains exactly the two protected plans; record `IMPLEMENTATION_BASELINE` and use it as the immutable Task 1 base.

## Exact Asset Allowlist

### 25 PNG inputs

Opaque PNG inputs:

1. `public/assets/editorial/images/71c2b8589fc6.png`
2. `public/assets/editorial/images/category-bedside.png`
3. `public/assets/editorial/images/category-console.png`
4. `public/assets/editorial/images/category-reading-chair.png`
5. `public/assets/editorial/images/category-sofa.png`
6. `public/assets/furniture/craftsmanship-wide.png`
7. `public/assets/furniture/material-joinery-detail.png`
8. `public/assets/furniture/material-textile-detail.png`
9. `public/assets/furniture/material-wood-detail.png`
10. `public/assets/furniture/materials-room-wide.png`
11. `public/assets/hero/living-room-idle.png`
12. `public/assets/products/05-graphite-walnut-room-background-fixed.png`
13. `public/assets/products/05-graphite-walnut-room-integrated-v2.png`

Alpha PNG inputs:

14. `public/assets/products/01-bar-stool-cutout.png`
15. `public/assets/products/03-ivory-lounge-cutout.png`
16. `public/assets/products/03-ivory-lounge-turntable-alpha-poster.png`
17. `public/assets/products/05-graphite-pine-chair-fixed-alpha.png`
18. `public/assets/products/05-graphite-walnut-chair-fixed-alpha.png`
19. `public/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png`
20. `public/assets/products/05-ivory-pine-chair-fixed-alpha.png`
21. `public/assets/products/05-ivory-walnut-chair-alpha.png`
22. `public/assets/products/05-ivory-walnut-chair-fixed-alpha.png`
23. `public/assets/products/05-terracotta-pine-chair-fixed-alpha.png`
24. `public/assets/products/05-terracotta-walnut-chair-alpha.png`
25. `public/assets/products/05-terracotta-walnut-chair-fixed-alpha.png`

### 3 JPG inputs

1. `public/assets/hero/bedroom-idle.jpg`
2. `public/assets/hero/kitchen-idle.jpg`
3. `public/assets/hero/terrace-idle.jpg`

### 27 new WebP outputs

Opaque quality-92 outputs:

1. `public/assets/editorial/images/71c2b8589fc6.webp`
2. `public/assets/editorial/images/category-bedside.webp`
3. `public/assets/editorial/images/category-console.webp`
4. `public/assets/editorial/images/category-reading-chair.webp`
5. `public/assets/editorial/images/category-sofa.webp`
6. `public/assets/furniture/craftsmanship-wide.webp`
7. `public/assets/furniture/material-joinery-detail.webp`
8. `public/assets/furniture/material-textile-detail.webp`
9. `public/assets/furniture/material-wood-detail.webp`
10. `public/assets/furniture/materials-room-wide.webp`
11. `public/assets/products/05-graphite-walnut-room-background-fixed.webp`
12. `public/assets/products/05-graphite-walnut-room-integrated-v2.webp`
13. `public/assets/hero/bedroom-idle.webp`
14. `public/assets/hero/kitchen-idle.webp`
15. `public/assets/hero/terrace-idle.webp`

Alpha lossless outputs:

16. `public/assets/products/01-bar-stool-cutout.webp`
17. `public/assets/products/03-ivory-lounge-cutout.webp`
18. `public/assets/products/03-ivory-lounge-turntable-alpha-poster.webp`
19. `public/assets/products/05-graphite-pine-chair-fixed-alpha.webp`
20. `public/assets/products/05-graphite-walnut-chair-fixed-alpha.webp`
21. `public/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.webp`
22. `public/assets/products/05-ivory-pine-chair-fixed-alpha.webp`
23. `public/assets/products/05-ivory-walnut-chair-alpha.webp`
24. `public/assets/products/05-ivory-walnut-chair-fixed-alpha.webp`
25. `public/assets/products/05-terracotta-pine-chair-fixed-alpha.webp`
26. `public/assets/products/05-terracotta-walnut-chair-alpha.webp`
27. `public/assets/products/05-terracotta-walnut-chair-fixed-alpha.webp`

### Living-room deduplication mapping

- Retire `public/assets/hero/living-room-idle.png` and map its remaining stale contract to existing `/assets/hero/living-room-idle-5f0f1836.webp`.
- Do not create `public/assets/hero/living-room-idle.webp`.

### 14 pre-existing WebP files protected by the collision/no-reencode gate

1. `public/assets/hero/bedroom-bed-focus.webp`
2. `public/assets/hero/bedroom-chair-focus.webp`
3. `public/assets/hero/chair-focus.webp`
4. `public/assets/hero/kitchen-dining-focus.webp`
5. `public/assets/hero/kitchen-island-focus.webp`
6. `public/assets/hero/living-room-idle-5f0f1836.webp`
7. `public/assets/hero/sofa-focus.webp`
8. `public/assets/hero/terrace-chair-focus.webp`
9. `public/assets/hero/terrace-sofa-focus.webp`
10. `public/assets/products/01-bar-stool-idle.webp`
11. `public/assets/products/02-rocking-chair-idle.webp`
12. `public/assets/products/03-ivory-lounge-idle.webp`
13. `public/assets/products/04-dark-accent-idle.webp`
14. `public/assets/products/05-two-seat-sofa-idle.webp`

## Changed-Path Contract

- Task 1 may add only the 27 new WebP output paths listed above.
- Task 2 may modify only these production, Prisma seed, SEO, and admin-fixture paths:
  - `app/(admin)/admin/_components/dashboard-reference-fixture.ts`
  - `components/evironn/auth/auth-variant-b.tsx`
  - `components/evironn/catalog/catalog-variant-b-adapter.ts`
  - `components/evironn/home/benefits-showcase-section.tsx`
  - `components/evironn/home/editorial-statement.tsx`
  - `components/evironn/home/furniture-editorial-sections.tsx`
  - `components/evironn/home/hero-rooms.ts`
  - `components/evironn/home/home-assets.ts`
  - `components/evironn/home/instagram-follow-section.tsx`
  - `components/evironn/home/nature-section.tsx`
  - `components/evironn/product/productPageState.ts`
  - `lib/seo.ts`
  - `prisma/seed-data.ts`
- Task 2 may modify only these unit/component contract paths:
  - `tests/evironn-auth-source-contract.test.ts`
  - `tests/evironn-phase-3-assets.test.ts`
  - `tests/evironn-catalog-adapter.test.ts`
  - `tests/evironn-catalog-variant-b.test.tsx`
  - `tests/evironn-hero-shell.test.tsx`
  - `tests/evironn-home-assets.test.ts`
  - `tests/evironn-product-assets.test.ts`
  - `tests/evironn-product-state.test.ts`
  - `tests/evironn-showcase-product.test.ts`
  - `tests/furniture-domain.test.ts`
  - `tests/gen-seed-sql.test.ts`
  - `tests/product-media-stage.test.tsx`
  - `tests/product-page-canonical.test.tsx`
  - `tests/product-view-color-selection.test.ts`
- Task 2 may modify only these E2E paths:
  - `e2e/furniture-domain.spec.ts`
  - `e2e/product.spec.ts`
- Task 3 may modify only `tests/evironn-hero-assets.test.ts` to retire its stale source-directory manifest contract, and may delete only the 25 PNG and 3 JPG inputs listed above. It may not modify another tracked file.
- All other tracked and untracked paths are forbidden. If `git status --short` shows a path outside the task allowlist plus the two protected pre-existing plans, stop and ask the coordinator to resolve ownership.

---

### Task 1: Generate and Prove the 27 WebP Outputs

**Owner:** One Luna High asset implementer. This owner creates and verifies only the 27 new WebP files and owns the Task 1 commit.

**Files:**

- Create: the exact 27 new WebP output paths in the asset allowlist.
- Modify: none.
- Delete: none.

**Interfaces:**

- Consumes: the 27 conversion inputs, one living-room deduplication input, and 14 protected existing WebP files listed above.
- Produces: 27 non-empty adjacent WebP outputs; captured `public/assets` baseline bytes; source-subset bytes; generated-output bytes; source/output dimensions, alpha, visible-RGB, hash, and byte evidence for Task 2 and Task 3.

- [ ] **Step 1: Prove exact clean ownership and protected-file identity**

Run:

```powershell
git status --short
Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md','docs/superpowers/plans/phase-2-task-3-execution.md' | Select-Object Path,Hash
```

Expected: status contains only the two protected untracked plans; hashes equal the two Global Constraints values. Any other path or hash stops Task 1.

- [ ] **Step 2: Run the existing-WebP collision gate and exact sharp conversion**

Run this exact PowerShell/Node block. It asserts 28 inputs, 27 unique absent outputs, the forbidden un-hashed living-room output's absence, and disjointness from all 14 existing WebP files before `sharp` writes anything. It captures existing-WebP SHA-256 values and the complete `public/assets` byte total before conversion, encodes opaque files at quality 92, encodes alpha files losslessly, and confirms existing WebP hashes did not change.

```powershell
$opaque = @(
  'public/assets/editorial/images/71c2b8589fc6.png',
  'public/assets/editorial/images/category-bedside.png',
  'public/assets/editorial/images/category-console.png',
  'public/assets/editorial/images/category-reading-chair.png',
  'public/assets/editorial/images/category-sofa.png',
  'public/assets/furniture/craftsmanship-wide.png',
  'public/assets/furniture/material-joinery-detail.png',
  'public/assets/furniture/material-textile-detail.png',
  'public/assets/furniture/material-wood-detail.png',
  'public/assets/furniture/materials-room-wide.png',
  'public/assets/products/05-graphite-walnut-room-background-fixed.png',
  'public/assets/products/05-graphite-walnut-room-integrated-v2.png',
  'public/assets/hero/bedroom-idle.jpg',
  'public/assets/hero/kitchen-idle.jpg',
  'public/assets/hero/terrace-idle.jpg'
)
$alpha = @(
  'public/assets/products/01-bar-stool-cutout.png',
  'public/assets/products/03-ivory-lounge-cutout.png',
  'public/assets/products/03-ivory-lounge-turntable-alpha-poster.png',
  'public/assets/products/05-graphite-pine-chair-fixed-alpha.png',
  'public/assets/products/05-graphite-walnut-chair-fixed-alpha.png',
  'public/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
  'public/assets/products/05-ivory-pine-chair-fixed-alpha.png',
  'public/assets/products/05-ivory-walnut-chair-alpha.png',
  'public/assets/products/05-ivory-walnut-chair-fixed-alpha.png',
  'public/assets/products/05-terracotta-pine-chair-fixed-alpha.png',
  'public/assets/products/05-terracotta-walnut-chair-alpha.png',
  'public/assets/products/05-terracotta-walnut-chair-fixed-alpha.png'
)
$dedupe = 'public/assets/hero/living-room-idle.png'
$existing = @(
  'public/assets/hero/bedroom-bed-focus.webp',
  'public/assets/hero/bedroom-chair-focus.webp',
  'public/assets/hero/chair-focus.webp',
  'public/assets/hero/kitchen-dining-focus.webp',
  'public/assets/hero/kitchen-island-focus.webp',
  'public/assets/hero/living-room-idle-5f0f1836.webp',
  'public/assets/hero/sofa-focus.webp',
  'public/assets/hero/terrace-chair-focus.webp',
  'public/assets/hero/terrace-sofa-focus.webp',
  'public/assets/products/01-bar-stool-idle.webp',
  'public/assets/products/02-rocking-chair-idle.webp',
  'public/assets/products/03-ivory-lounge-idle.webp',
  'public/assets/products/04-dark-accent-idle.webp',
  'public/assets/products/05-two-seat-sofa-idle.webp'
)
$outputs = @($opaque + $alpha | ForEach-Object { [IO.Path]::ChangeExtension($_, '.webp') })
if (($opaque.Count + $alpha.Count + 1) -ne 28) { throw 'Input allowlist must contain 28 records.' }
if ($outputs.Count -ne 27 -or ($outputs | Sort-Object -Unique).Count -ne 27) { throw 'Output allowlist must contain 27 unique records.' }
$outputBasenames = @($outputs | ForEach-Object { [IO.Path]::GetFileName($_) })
if (($outputBasenames | Sort-Object -Unique).Count -ne 27) { throw 'Output basenames must contain 27 unique records.' }
if (Test-Path -LiteralPath 'public/assets/hero/living-room-idle.webp') { throw 'Forbidden living-room output exists.' }
$allInputs = @($opaque + $alpha + $dedupe)
$missingInputs = @($allInputs | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) })
if ($missingInputs.Count) { throw "Missing inputs: $($missingInputs -join ', ')" }
$collisions = @($outputs | Where-Object { Test-Path -LiteralPath $_ })
if ($collisions.Count) { throw "Output collisions: $($collisions -join ', ')" }
$overlap = @($outputs | Where-Object { $existing -contains $_ })
if ($overlap.Count) { throw "Existing WebP selected as output: $($overlap -join ', ')" }
$missingExisting = @($existing | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) })
if ($missingExisting.Count) { throw "Missing protected WebP: $($missingExisting -join ', ')" }
$expectedSourceMetadata = @(
  @{ Path='public/assets/editorial/images/71c2b8589fc6.png'; Bytes=1859747; Width=2528; Height=1696; Channels=3; Alpha=$false },
  @{ Path='public/assets/editorial/images/category-bedside.png'; Bytes=2270030; Width=1448; Height=1086; Channels=3; Alpha=$false },
  @{ Path='public/assets/editorial/images/category-console.png'; Bytes=1990841; Width=1448; Height=1086; Channels=3; Alpha=$false },
  @{ Path='public/assets/editorial/images/category-reading-chair.png'; Bytes=2439310; Width=1448; Height=1086; Channels=3; Alpha=$false },
  @{ Path='public/assets/editorial/images/category-sofa.png'; Bytes=2631604; Width=1448; Height=1086; Channels=3; Alpha=$false },
  @{ Path='public/assets/furniture/craftsmanship-wide.png'; Bytes=1742126; Width=1672; Height=941; Channels=3; Alpha=$false },
  @{ Path='public/assets/furniture/material-joinery-detail.png'; Bytes=1875598; Width=1254; Height=1254; Channels=3; Alpha=$false },
  @{ Path='public/assets/furniture/material-textile-detail.png'; Bytes=2610989; Width=1254; Height=1254; Channels=3; Alpha=$false },
  @{ Path='public/assets/furniture/material-wood-detail.png'; Bytes=1681846; Width=1254; Height=1254; Channels=3; Alpha=$false },
  @{ Path='public/assets/furniture/materials-room-wide.png'; Bytes=2255183; Width=1774; Height=887; Channels=3; Alpha=$false },
  @{ Path='public/assets/hero/living-room-idle.png'; Bytes=2422566; Width=1536; Height=1024; Channels=3; Alpha=$false },
  @{ Path='public/assets/products/05-graphite-walnut-room-background-fixed.png'; Bytes=2182988; Width=1536; Height=1024; Channels=3; Alpha=$false },
  @{ Path='public/assets/products/05-graphite-walnut-room-integrated-v2.png'; Bytes=2556946; Width=1536; Height=1024; Channels=3; Alpha=$false },
  @{ Path='public/assets/products/01-bar-stool-cutout.png'; Bytes=273844; Width=1254; Height=1254; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/03-ivory-lounge-cutout.png'; Bytes=1223561; Width=1254; Height=1254; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/03-ivory-lounge-turntable-alpha-poster.png'; Bytes=566704; Width=1920; Height=1080; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/05-graphite-pine-chair-fixed-alpha.png'; Bytes=2562642; Width=1536; Height=1024; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/05-graphite-walnut-chair-fixed-alpha.png'; Bytes=2534916; Width=1536; Height=1024; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png'; Bytes=3161216; Width=1920; Height=1080; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/05-ivory-pine-chair-fixed-alpha.png'; Bytes=2475996; Width=1536; Height=1024; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/05-ivory-walnut-chair-alpha.png'; Bytes=328129; Width=1536; Height=1024; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/05-ivory-walnut-chair-fixed-alpha.png'; Bytes=2476114; Width=1536; Height=1024; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/05-terracotta-pine-chair-fixed-alpha.png'; Bytes=2522477; Width=1536; Height=1024; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/05-terracotta-walnut-chair-alpha.png'; Bytes=349533; Width=1536; Height=1024; Channels=4; Alpha=$true },
  @{ Path='public/assets/products/05-terracotta-walnut-chair-fixed-alpha.png'; Bytes=2555550; Width=1536; Height=1024; Channels=4; Alpha=$true },
  @{ Path='public/assets/hero/bedroom-idle.jpg'; Bytes=273941; Width=1248; Height=832; Channels=3; Alpha=$false },
  @{ Path='public/assets/hero/kitchen-idle.jpg'; Bytes=241034; Width=1168; Height=784; Channels=3; Alpha=$false },
  @{ Path='public/assets/hero/terrace-idle.jpg'; Bytes=285542; Width=1168; Height=784; Channels=3; Alpha=$false }
)
if ($expectedSourceMetadata.Count -ne 28) { throw 'Source metadata allowlist must contain 28 records.' }
$env:EVIRONN_SOURCE_METADATA = $expectedSourceMetadata | ConvertTo-Json -Compress
node --input-type=module -e "import assert from 'node:assert/strict'; import fs from 'node:fs'; import sharp from 'sharp'; const expected=JSON.parse(process.env.EVIRONN_SOURCE_METADATA); for (const item of expected) { const m=await sharp(item.Path).metadata(); assert.equal(fs.statSync(item.Path).size,item.Bytes,item.Path+' bytes'); assert.equal(m.width,item.Width,item.Path+' width'); assert.equal(m.height,item.Height,item.Path+' height'); assert.equal(m.channels,item.Channels,item.Path+' channels'); assert.equal(Boolean(m.hasAlpha),item.Alpha,item.Path+' alpha'); } const source=expected.find((item)=>item.Path.endsWith('/living-room-idle.png')); const mapped=await sharp('public/assets/hero/living-room-idle-5f0f1836.webp').metadata(); assert.equal(mapped.width,source.Width,'living-room mapped width'); assert.equal(mapped.height,source.Height,'living-room mapped height'); console.log('PASS: 28 source metadata records and living-room mapped dimensions.');"
if ($LASTEXITCODE -ne 0) { throw 'Source metadata verification failed.' }
Remove-Item Env:EVIRONN_SOURCE_METADATA
$existingBaseline = @{
  'public/assets/hero/bedroom-bed-focus.webp'='3653539AEB27781C967BC06F5820CE99B1E81087554FB93DA31B9A159E807F84'; 'public/assets/hero/bedroom-chair-focus.webp'='590365D870BAC10C835C46BEA3875FE47DAE404BA32E5C2BC40CCBD6BAACAF0F'; 'public/assets/hero/chair-focus.webp'='9307EE6798158F3FFEE650CCF201759BA2A59FC53D62782C40D3E45A8C65ED84'; 'public/assets/hero/kitchen-dining-focus.webp'='F1C31AAF156CEEC7DDE5A59A6F05BBF66016C90E4ADAE27353AD17B70A16B423'; 'public/assets/hero/kitchen-island-focus.webp'='76E491CB50A332DAE95F196AD8811A375357E5357AD97B841881CFEB10C56CE4'; 'public/assets/hero/living-room-idle-5f0f1836.webp'='5F0F1836760241BE5F6DE79E25937C5B21FD4B2CA6EC73394A6D0FAC89AC8C7F'; 'public/assets/hero/sofa-focus.webp'='77E104AC672CD58E87F94796F132478530D94FEA610489656594F0FD136C39C2'; 'public/assets/hero/terrace-chair-focus.webp'='F087A6BADB3703CAB15C9E5E113893101FB0DFC74D036563E47B681CA467458F'; 'public/assets/hero/terrace-sofa-focus.webp'='1086C631DF3B004810D9573121B4859724BE5E61D402AA117226F9E492A5BFE2'; 'public/assets/products/01-bar-stool-idle.webp'='8CDC194EF844599EDFA3D2D0BF979C2904BB8039C1C79BBB7B8765C6379671E8'; 'public/assets/products/02-rocking-chair-idle.webp'='0990C6FC32A8F921025260786CC2B728B909B4BB37C3DB71234DA237B220434E'; 'public/assets/products/03-ivory-lounge-idle.webp'='9D81E08FE8DD5B44422CF48547E57E390F6BAC6C97CAD81057654FB20BF5493E'; 'public/assets/products/04-dark-accent-idle.webp'='8E90DA84BE0341CB6167D771C545E767D0DC4FAE62033A49F85A168CE2346E74'; 'public/assets/products/05-two-seat-sofa-idle.webp'='A373295B1173ED4EE5F27EE255DC770A6DA52784D19BD664B95C7365D8167D69'
}
if ($existingBaseline.Count -ne 14) { throw 'Existing WebP baseline must contain 14 records.' }
foreach ($path in $existingBaseline.Keys) { if ((Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash -ne $existingBaseline[$path]) { throw "Existing WebP baseline mismatch: $path" } }
$existingBefore = $existingBaseline
$assetsBefore = (Get-ChildItem -LiteralPath 'public/assets' -File -Recurse | Measure-Object -Property Length -Sum).Sum
$sourceBytes = (Get-Item -LiteralPath $allInputs | Measure-Object -Property Length -Sum).Sum
$conversionSourceBytes = (Get-Item -LiteralPath @($opaque + $alpha) | Measure-Object -Property Length -Sum).Sum
if ($sourceBytes -ne 50350973) { throw "Source byte baseline mismatch: $sourceBytes" }
if ($conversionSourceBytes -ne 47928407) { throw "Conversion-source byte baseline mismatch: $conversionSourceBytes" }
$env:EVIRONN_OPAQUE_INPUTS = $opaque | ConvertTo-Json -Compress
$env:EVIRONN_ALPHA_INPUTS = $alpha | ConvertTo-Json -Compress
node --input-type=module -e "import sharp from 'sharp'; const opaque=JSON.parse(process.env.EVIRONN_OPAQUE_INPUTS); const alpha=JSON.parse(process.env.EVIRONN_ALPHA_INPUTS); for (const input of opaque) await sharp(input).webp({quality:92}).toFile(input.replace(/\.(png|jpg)$/i,'.webp')); for (const input of alpha) await sharp(input).webp({lossless:true}).toFile(input.replace(/\.png$/i,'.webp'));"
if ($LASTEXITCODE -ne 0) { throw 'sharp conversion failed.' }
Remove-Item Env:EVIRONN_OPAQUE_INPUTS,Env:EVIRONN_ALPHA_INPUTS
foreach ($path in $existingBaseline.Keys) { if ((Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash -ne $existingBaseline[$path]) { throw "Existing WebP changed: $path" } }
$outputBytes = (Get-Item -LiteralPath $outputs | Measure-Object -Property Length -Sum).Sum
if ($outputBytes -le 0 -or $outputBytes -ge $conversionSourceBytes) { throw "Generated output bytes must be non-zero and less than converted-source bytes: $outputBytes / $conversionSourceBytes" }
"ASSETS_BEFORE=$assetsBefore SOURCE_BYTES=$sourceBytes CONVERSION_SOURCE_BYTES=$conversionSourceBytes GENERATED_OUTPUT_BYTES=$outputBytes"
```

Expected: no collision or hash exception; exactly 27 files are created; `SOURCE_BYTES=50350973`; `CONVERSION_SOURCE_BYTES=47928407`; every output is non-empty; generated output total is less than `47,928,407` bytes. Record the exact `ASSETS_BEFORE`, `SOURCE_BYTES`, `CONVERSION_SOURCE_BYTES`, and `GENERATED_OUTPUT_BYTES` values in Task 1 evidence. Do not describe these byte results as a speed improvement.

- [ ] **Step 3: Verify dimensions, aspect ratios, alpha-byte equality, and visible-RGB preservation**

Run:

```powershell
$env:EVIRONN_OPAQUE_INPUTS = $opaque | ConvertTo-Json -Compress
$env:EVIRONN_ALPHA_INPUTS = $alpha | ConvertTo-Json -Compress
node --input-type=module -e "import assert from 'node:assert/strict'; import fs from 'node:fs'; import sharp from 'sharp'; const opaque=JSON.parse(process.env.EVIRONN_OPAQUE_INPUTS); const alpha=JSON.parse(process.env.EVIRONN_ALPHA_INPUTS); for (const input of opaque) { const output=input.replace(/\.(png|jpg)$/i,'.webp'); const [s,o]=await Promise.all([sharp(input).metadata(),sharp(output).metadata()]); assert.equal(o.width,s.width,output+' width'); assert.equal(o.height,s.height,output+' height'); assert.equal(o.width/o.height,s.width/s.height,output+' aspect ratio'); assert.equal(Boolean(o.hasAlpha),false,output+' must remain opaque'); assert.ok(fs.statSync(output).size>0,output+' empty'); } for (const input of alpha) { const output=input.replace(/\.png$/i,'.webp'); const [s,o]=await Promise.all([sharp(input).metadata(),sharp(output).metadata()]); assert.equal(o.width,s.width,output+' width'); assert.equal(o.height,s.height,output+' height'); assert.equal(o.width/o.height,s.width/s.height,output+' aspect ratio'); assert.equal(Boolean(s.hasAlpha),true,input+' source alpha'); assert.equal(Boolean(o.hasAlpha),true,output+' output alpha'); const [sr,or]=await Promise.all([sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true}),sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true})]); assert.deepEqual(or.info,sr.info,output+' raw info'); let alphaMismatch=0; let visibleRgbMismatch=0; let transparentRgbDifferences=0; for (let i=0; i<sr.data.length; i+=4) { if (sr.data[i+3]!==or.data[i+3]) alphaMismatch++; else if (sr.data[i+3]>0) { for (let channel=0; channel<3; channel++) if (sr.data[i+channel]!==or.data[i+channel]) visibleRgbMismatch++; } else if (sr.data[i]!==or.data[i] || sr.data[i+1]!==or.data[i+1] || sr.data[i+2]!==or.data[i+2]) transparentRgbDifferences++; } assert.equal(alphaMismatch,0,output+' alpha mismatch'); assert.equal(visibleRgbMismatch,0,output+' visible RGB mismatch'); assert.ok(fs.statSync(output).size>0,output+' empty'); } console.log('PASS: 15 opaque dimension/opacity checks; 12 alpha dimension/alpha-byte/visible-RGB checks; transparent-only RGB differences permitted.');"
if ($LASTEXITCODE -ne 0) { throw 'Image invariant verification failed.' }
Remove-Item Env:EVIRONN_OPAQUE_INPUTS,Env:EVIRONN_ALPHA_INPUTS
```

Expected: `PASS: 15 opaque dimension/opacity checks; 12 alpha dimension/alpha-byte/visible-RGB checks; transparent-only RGB differences permitted.` The ratio equality is derived from unchanged integer width and height. Any alpha-byte mismatch or RGB mismatch where source alpha is greater than zero blocks rollout; RGB differences where source alpha is zero are permitted and must be reported as transparent-only differences.

- [ ] **Step 4: Verify Task 1 changed paths, commit, and review**

Run:

```powershell
git status --short
git diff --check -- public/assets
git config user.name
git config user.email
git add -- $outputs
git diff --cached --name-status
git commit -m "chore: add WebP image assets"
```

Expected: before staging, only 27 new WebP files plus the two protected plans are present; staged diff contains exactly 27 additions and no modification/deletion; identity remains `ui-ux-promax <gojjoy22@gmail.com>`; commit succeeds. Fresh Sol Medium review must confirm the exact allowlist, collision gate, no-reencode hashes, quality settings, dimensions, opacity, alpha-byte/visible-RGB checks, byte checks, and protected files. No Task 2 work starts until verdict is READY with Critical 0 and Important 0.

---

### Task 2: Migrate Every Runtime and Contract Reference with RED/GREEN Proof

**Owner:** One fresh Luna High reference implementer. This owner modifies only the Task 2 changed-path allowlist and owns the Task 2 commit.

**Files:**

- Modify: all and only the 13 production/seed/SEO/fixture paths, 14 unit/component test paths, and 2 E2E paths in the Changed-Path Contract when they contain an approved source occurrence. The hero binary manifest is intentionally deferred to Task 3 because its final 44-file directory contract cannot pass while the 28 sources still exist.
- Create: none.
- Delete: none.

**Interfaces:**

- Consumes: Task 1's reviewed 27 WebP outputs, exact generated byte sizes/SHA-256 values, and existing `/assets/hero/living-room-idle-5f0f1836.webp`.
- Produces: static `.webp` references across production, Prisma seed, SEO, admin fixture, unit, and E2E contracts; updated `home-assets.ts` byte/SHA-256 records; unchanged home manifest count of 31; no stale approved PNG/JPG reference. The hero directory-manifest contract remains deferred to Task 3, where it changes exactly from 45 to 44 because the living-room PNG is retired without a replacement basename while three JPG entries become three WebP entries.

Task 2 shell prelude (run once in the task's own PowerShell session; later steps do not inherit Task 1 variables):

```powershell
$opaque = @(
  'public/assets/editorial/images/71c2b8589fc6.png','public/assets/editorial/images/category-bedside.png','public/assets/editorial/images/category-console.png','public/assets/editorial/images/category-reading-chair.png','public/assets/editorial/images/category-sofa.png','public/assets/furniture/craftsmanship-wide.png','public/assets/furniture/material-joinery-detail.png','public/assets/furniture/material-textile-detail.png','public/assets/furniture/material-wood-detail.png','public/assets/furniture/materials-room-wide.png','public/assets/products/05-graphite-walnut-room-background-fixed.png','public/assets/products/05-graphite-walnut-room-integrated-v2.png','public/assets/hero/bedroom-idle.jpg','public/assets/hero/kitchen-idle.jpg','public/assets/hero/terrace-idle.jpg'
)
$alpha = @(
  'public/assets/products/01-bar-stool-cutout.png','public/assets/products/03-ivory-lounge-cutout.png','public/assets/products/03-ivory-lounge-turntable-alpha-poster.png','public/assets/products/05-graphite-pine-chair-fixed-alpha.png','public/assets/products/05-graphite-walnut-chair-fixed-alpha.png','public/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png','public/assets/products/05-ivory-pine-chair-fixed-alpha.png','public/assets/products/05-ivory-walnut-chair-alpha.png','public/assets/products/05-ivory-walnut-chair-fixed-alpha.png','public/assets/products/05-terracotta-pine-chair-fixed-alpha.png','public/assets/products/05-terracotta-walnut-chair-alpha.png','public/assets/products/05-terracotta-walnut-chair-fixed-alpha.png'
)
$dedupe = 'public/assets/hero/living-room-idle.png'
$allInputs = @($opaque + $alpha + $dedupe)
$outputs = @($opaque + $alpha | ForEach-Object { [IO.Path]::ChangeExtension($_, '.webp') })
$scoped = @(
  'app/(admin)/admin/_components/dashboard-reference-fixture.ts','components/evironn/auth/auth-variant-b.tsx','components/evironn/catalog/catalog-variant-b-adapter.ts','components/evironn/home/benefits-showcase-section.tsx','components/evironn/home/editorial-statement.tsx','components/evironn/home/furniture-editorial-sections.tsx','components/evironn/home/hero-rooms.ts','components/evironn/home/home-assets.ts','components/evironn/home/instagram-follow-section.tsx','components/evironn/home/nature-section.tsx','components/evironn/product/productPageState.ts','lib/seo.ts','prisma/seed-data.ts','tests/evironn-auth-source-contract.test.ts','tests/evironn-phase-3-assets.test.ts','tests/evironn-catalog-adapter.test.ts','tests/evironn-catalog-variant-b.test.tsx','tests/evironn-hero-shell.test.tsx','tests/evironn-home-assets.test.ts','tests/evironn-product-assets.test.ts','tests/evironn-product-state.test.ts','tests/evironn-showcase-product.test.ts','tests/furniture-domain.test.ts','tests/gen-seed-sql.test.ts','tests/product-media-stage.test.tsx','tests/product-page-canonical.test.tsx','tests/product-view-color-selection.test.ts','e2e/furniture-domain.spec.ts','e2e/product.spec.ts'
)
$sourceBasenames = @($allInputs | ForEach-Object { [IO.Path]::GetFileName($_) })
$pattern = ($sourceBasenames | ForEach-Object { [regex]::Escape($_) }) -join '|'
if ($allInputs.Count -ne 28 -or $outputs.Count -ne 27 -or $scoped.Count -ne 29) { throw 'Task 2 prelude allowlist mismatch.' }
```

- [ ] **Step 1: Update exact test and E2E expectations first**

Replace each approved `.png`/`.jpg` asset occurrence in the 14 unit/component and 2 E2E files listed in the Task 2 changed-path contract with its adjacent `.webp` output. Defer `tests/evironn-hero-assets.test.ts` entirely to Task 3: its final 44-file directory manifest cannot be GREEN while the 28 source files remain. Update expected MIME values from PNG/JPEG to WebP where `e2e/furniture-domain.spec.ts` asserts MIME/path pairs. Keep routes, selectors, DTO values other than media paths/hashes/sizes, and test behavior unchanged.

- [ ] **Step 2: Run focused tests and prove RED for old application references**

Run:

```powershell
npx vitest run tests/evironn-auth-source-contract.test.ts tests/evironn-phase-3-assets.test.ts tests/evironn-catalog-adapter.test.ts tests/evironn-catalog-variant-b.test.tsx tests/evironn-hero-shell.test.tsx tests/evironn-home-assets.test.ts tests/evironn-product-assets.test.ts tests/evironn-product-state.test.ts tests/evironn-showcase-product.test.ts tests/furniture-domain.test.ts tests/gen-seed-sql.test.ts tests/product-media-stage.test.tsx tests/product-page-canonical.test.tsx tests/product-view-color-selection.test.ts
```

Expected RED: source-backed contracts that still read old production values fail: `tests/evironn-auth-source-contract.test.ts` for auth composition paths, `tests/evironn-catalog-adapter.test.ts` and `tests/evironn-catalog-variant-b.test.tsx` for catalog basenames/room URLs, `tests/evironn-hero-shell.test.tsx` for kitchen selectors, `tests/evironn-product-state.test.ts` for scene/variant URLs, and the seed/PDP contracts (`tests/evironn-showcase-product.test.ts`, `tests/furniture-domain.test.ts`, `tests/gen-seed-sql.test.ts`, `tests/product-page-canonical.test.tsx`) where old literals remain. `tests/evironn-product-assets.test.ts` may fail on stale generated size/hash literals; pure prop-driven/filesystem-only contracts may remain GREEN. `tests/evironn-hero-assets.test.ts` is intentionally not run and remains the reviewed transitional exception until Task 3. If no source-backed contract fails, stop because the expected RED boundary was not exercised.

- [ ] **Step 3: Apply the minimal static production/reference migration**

In the 13 approved non-test files, replace only approved source paths/basenames with the exact WebP mappings. Use literal `/assets/.../*.webp` URL strings where URLs are currently used and literal adjacent `public/assets/.../*.webp` paths only where filesystem paths are currently used. Do not compute extensions at runtime.

Update every affected `components/evironn/home/home-assets.ts` manifest entry with the generated WebP file's exact byte length and lowercase SHA-256, using:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath $outputs | Select-Object Path,Hash
Get-Item -LiteralPath $outputs | Select-Object FullName,Length
```

Expected: 27 hashes and 27 non-zero byte lengths. Copy values exactly into existing manifest fields. Apply the deterministic mapping to every occurrence in the allowlisted Task 2 files: update 15 entries in `components/evironn/home/home-assets.ts`, the eight PNG entries in `tests/evironn-product-assets.test.ts`, all listed production/seed/SEO/fixture literals, and every listed unit/E2E expectation. Do not change manifest shapes, home count `31`, or any non-media test data. Task 3 separately updates the deferred hero manifest contract with the three JPG-to-WebP entries, living-room removal, and final count/total.

- [ ] **Step 4: Run focused GREEN tests**

Run the same focused Vitest command from Step 2.

Expected GREEN: all 14 Task 2 Vitest files pass; home manifest count remains 31; all mapped image path, generated home-manifest size/hash, seed/DTO/SQL, catalog, auth, PDP, and selector assertions pass. The two E2E files are not claimed RED and run GREEN in Task 3. `tests/evironn-hero-assets.test.ts` remains the sole intentional transitional contract and is reviewed after source deletion in Task 3.

- [ ] **Step 5: Prove reference completeness and asset existence**

Run:

```powershell
$scoped = @(
  'app/(admin)/admin/_components/dashboard-reference-fixture.ts',
  'components/evironn/auth/auth-variant-b.tsx',
  'components/evironn/catalog/catalog-variant-b-adapter.ts',
  'components/evironn/home/benefits-showcase-section.tsx',
  'components/evironn/home/editorial-statement.tsx',
  'components/evironn/home/furniture-editorial-sections.tsx',
  'components/evironn/home/hero-rooms.ts',
  'components/evironn/home/home-assets.ts',
  'components/evironn/home/instagram-follow-section.tsx',
  'components/evironn/home/nature-section.tsx',
  'components/evironn/product/productPageState.ts',
  'lib/seo.ts',
  'prisma/seed-data.ts',
  'tests/evironn-auth-source-contract.test.ts','tests/evironn-phase-3-assets.test.ts','tests/evironn-catalog-adapter.test.ts','tests/evironn-catalog-variant-b.test.tsx','tests/evironn-hero-shell.test.tsx','tests/evironn-home-assets.test.ts','tests/evironn-product-assets.test.ts','tests/evironn-product-state.test.ts','tests/evironn-showcase-product.test.ts','tests/furniture-domain.test.ts','tests/gen-seed-sql.test.ts','tests/product-media-stage.test.tsx','tests/product-page-canonical.test.tsx','tests/product-view-color-selection.test.ts',
  'e2e/furniture-domain.spec.ts','e2e/product.spec.ts'
)
$sourceBasenames = @($allInputs | ForEach-Object { [IO.Path]::GetFileName($_) })
$pattern = ($sourceBasenames | ForEach-Object { [regex]::Escape($_) }) -join '|'
$stale = Select-String -LiteralPath $scoped -Pattern $pattern
if ($stale) { $stale | Select-Object Path,LineNumber,Line; throw 'Stale approved PNG/JPG reference remains.' }
$missingOutputs = @($outputs | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) })
if ($missingOutputs.Count) { throw "Referenced WebP output missing: $($missingOutputs -join ', ')" }
if (-not (Test-Path -LiteralPath 'public/assets/hero/living-room-idle-5f0f1836.webp' -PathType Leaf)) { throw 'Hashed living-room WebP missing.' }
$scopedText = ($scoped | ForEach-Object { Get-Content -Raw -LiteralPath $_ }) -join [Environment]::NewLine
$urlRefs = @([regex]::Matches($scopedText, '(?<![A-Za-z0-9])/(assets/[A-Za-z0-9._/-]+\.webp)') | ForEach-Object { $_.Groups[1].Value })
$filesystemRefs = @([regex]::Matches($scopedText, '(?<![A-Za-z0-9])(public/assets/[A-Za-z0-9._/-]+\.webp)') | ForEach-Object { $_.Groups[1].Value })
$referencedFiles = @(
  ($urlRefs | ForEach-Object { ('public/' + $_).Replace('/','\') })
  ($filesystemRefs | ForEach-Object { $_.Replace('/','\') })
) | Sort-Object -Unique
$missingReferenced = @($referencedFiles | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) })
if ($missingReferenced.Count) { throw "Referenced WebP path missing: $($missingReferenced -join ', ')" }
```

Expected: no stale source basename, no missing WebP output, and every extracted `/assets/.../*.webp` or `public/assets/.../*.webp` reference resolves to a file under `public/assets`. Historical planning prose is intentionally excluded. Do not search-and-replace or edit outside `$scoped`.

- [ ] **Step 6: Run focused formatting/diff checks, commit, and review**

Run:

```powershell
npx prettier --check "app/(admin)/admin/_components/dashboard-reference-fixture.ts" components/evironn/auth/auth-variant-b.tsx components/evironn/catalog/catalog-variant-b-adapter.ts components/evironn/home/benefits-showcase-section.tsx components/evironn/home/editorial-statement.tsx components/evironn/home/furniture-editorial-sections.tsx components/evironn/home/hero-rooms.ts components/evironn/home/home-assets.ts components/evironn/home/instagram-follow-section.tsx components/evironn/home/nature-section.tsx components/evironn/product/productPageState.ts lib/seo.ts prisma/seed-data.ts tests/evironn-auth-source-contract.test.ts tests/evironn-phase-3-assets.test.ts tests/evironn-catalog-adapter.test.ts tests/evironn-catalog-variant-b.test.tsx tests/evironn-hero-shell.test.tsx tests/evironn-home-assets.test.ts tests/evironn-product-assets.test.ts tests/evironn-product-state.test.ts tests/evironn-showcase-product.test.ts tests/furniture-domain.test.ts tests/gen-seed-sql.test.ts tests/product-media-stage.test.tsx tests/product-page-canonical.test.tsx tests/product-view-color-selection.test.ts e2e/furniture-domain.spec.ts e2e/product.spec.ts
git diff --check -- "app/(admin)/admin/_components/dashboard-reference-fixture.ts" components/evironn tests lib/seo.ts prisma/seed-data.ts e2e/furniture-domain.spec.ts e2e/product.spec.ts
git status --short
Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md','docs/superpowers/plans/phase-2-task-3-execution.md' | Select-Object Path,Hash
git config user.name
git config user.email
git add -- "app/(admin)/admin/_components/dashboard-reference-fixture.ts" components/evironn/auth/auth-variant-b.tsx components/evironn/catalog/catalog-variant-b-adapter.ts components/evironn/home/benefits-showcase-section.tsx components/evironn/home/editorial-statement.tsx components/evironn/home/furniture-editorial-sections.tsx components/evironn/home/hero-rooms.ts components/evironn/home/home-assets.ts components/evironn/home/instagram-follow-section.tsx components/evironn/home/nature-section.tsx components/evironn/product/productPageState.ts lib/seo.ts prisma/seed-data.ts tests/evironn-auth-source-contract.test.ts tests/evironn-phase-3-assets.test.ts tests/evironn-catalog-adapter.test.ts tests/evironn-catalog-variant-b.test.tsx tests/evironn-hero-shell.test.tsx tests/evironn-home-assets.test.ts tests/evironn-product-assets.test.ts tests/evironn-product-state.test.ts tests/evironn-showcase-product.test.ts tests/furniture-domain.test.ts tests/gen-seed-sql.test.ts tests/product-media-stage.test.tsx tests/product-page-canonical.test.tsx tests/product-view-color-selection.test.ts e2e/furniture-domain.spec.ts e2e/product.spec.ts
git diff --cached --name-only
git commit -m "fix: migrate image references to WebP"
```

Expected: Prettier and diff checks pass; changed/staged paths are a subset of the exact Task 2 allowlist; identity remains the user's; commit succeeds. Fresh Sol Medium review checks static analyzable paths, complete mappings, exact hash/size/MIME contracts, living-room deduplication, preserved routes/data/design, and no client/runtime/loading architecture change. No Task 3 work starts until verdict is READY with Critical 0 and Important 0.

---

### Task 3: Browser/Visual Gate, Source Retirement, and Final Focused Verification

**Owner:** One fresh Luna High closeout implementer. This owner performs local browser verification, deletes only the 28 approved source files after all visual gates pass, and owns the Task 3 commit.

**Files:**

- Delete: the exact 25 PNG and 3 JPG input paths in the asset allowlist.
- Modify: `tests/evironn-hero-assets.test.ts` only, changing its directory-manifest expectation from the transitional source-inclusive set to the final 44-file WebP-only set.

**Interfaces:**

- Consumes: reviewed Task 1 outputs and byte/hash evidence, reviewed Task 2 static references, and the immutable existing-WebP baseline hashes declared in the Task 3 prelude. Task 3 independently measures `ASSETS_BEFORE` before deletion; no shell variable is inherited.
- Produces: local desktop/mobile evidence for home, catalog, selected PDP, authentication, and admin; focused E2E evidence; exact final source/output and `public/assets` byte measurements; one bounded hero-contract modification plus source-retirement commit.

Task 3 shell prelude (run in its own PowerShell session; no Task 1 or Task 2 variable is inherited):

```powershell
$opaque = @(
  'public/assets/editorial/images/71c2b8589fc6.png','public/assets/editorial/images/category-bedside.png','public/assets/editorial/images/category-console.png','public/assets/editorial/images/category-reading-chair.png','public/assets/editorial/images/category-sofa.png','public/assets/furniture/craftsmanship-wide.png','public/assets/furniture/material-joinery-detail.png','public/assets/furniture/material-textile-detail.png','public/assets/furniture/material-wood-detail.png','public/assets/furniture/materials-room-wide.png','public/assets/products/05-graphite-walnut-room-background-fixed.png','public/assets/products/05-graphite-walnut-room-integrated-v2.png','public/assets/hero/bedroom-idle.jpg','public/assets/hero/kitchen-idle.jpg','public/assets/hero/terrace-idle.jpg'
)
$alpha = @(
  'public/assets/products/01-bar-stool-cutout.png','public/assets/products/03-ivory-lounge-cutout.png','public/assets/products/03-ivory-lounge-turntable-alpha-poster.png','public/assets/products/05-graphite-pine-chair-fixed-alpha.png','public/assets/products/05-graphite-walnut-chair-fixed-alpha.png','public/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png','public/assets/products/05-ivory-pine-chair-fixed-alpha.png','public/assets/products/05-ivory-walnut-chair-alpha.png','public/assets/products/05-ivory-walnut-chair-fixed-alpha.png','public/assets/products/05-terracotta-pine-chair-fixed-alpha.png','public/assets/products/05-terracotta-walnut-chair-alpha.png','public/assets/products/05-terracotta-walnut-chair-fixed-alpha.png'
)
$dedupe = 'public/assets/hero/living-room-idle.png'
$allInputs = @($opaque + $alpha + $dedupe)
$outputs = @($opaque + $alpha | ForEach-Object { [IO.Path]::ChangeExtension($_, '.webp') })
$existingBaseline = @{
  'public/assets/hero/bedroom-bed-focus.webp'='3653539AEB27781C967BC06F5820CE99B1E81087554FB93DA31B9A159E807F84'; 'public/assets/hero/bedroom-chair-focus.webp'='590365D870BAC10C835C46BEA3875FE47DAE404BA32E5C2BC40CCBD6BAACAF0F'; 'public/assets/hero/chair-focus.webp'='9307EE6798158F3FFEE650CCF201759BA2A59FC53D62782C40D3E45A8C65ED84'; 'public/assets/hero/kitchen-dining-focus.webp'='F1C31AAF156CEEC7DDE5A59A6F05BBF66016C90E4ADAE27353AD17B70A16B423'; 'public/assets/hero/kitchen-island-focus.webp'='76E491CB50A332DAE95F196AD8811A375357E5357AD97B841881CFEB10C56CE4'; 'public/assets/hero/living-room-idle-5f0f1836.webp'='5F0F1836760241BE5F6DE79E25937C5B21FD4B2CA6EC73394A6D0FAC89AC8C7F'; 'public/assets/hero/sofa-focus.webp'='77E104AC672CD58E87F94796F132478530D94FEA610489656594F0FD136C39C2'; 'public/assets/hero/terrace-chair-focus.webp'='F087A6BADB3703CAB15C9E5E113893101FB0DFC74D036563E47B681CA467458F'; 'public/assets/hero/terrace-sofa-focus.webp'='1086C631DF3B004810D9573121B4859724BE5E61D402AA117226F9E492A5BFE2'; 'public/assets/products/01-bar-stool-idle.webp'='8CDC194EF844599EDFA3D2D0BF979C2904BB8039C1C79BBB7B8765C6379671E8'; 'public/assets/products/02-rocking-chair-idle.webp'='0990C6FC32A8F921025260786CC2B728B909B4BB37C3DB71234DA237B220434E'; 'public/assets/products/03-ivory-lounge-idle.webp'='9D81E08FE8DD5B44422CF48547E57E390F6BAC6C97CAD81057654FB20BF5493E'; 'public/assets/products/04-dark-accent-idle.webp'='8E90DA84BE0341CB6167D771C545E767D0DC4FAE62033A49F85A168CE2346E74'; 'public/assets/products/05-two-seat-sofa-idle.webp'='A373295B1173ED4EE5F27EE255DC770A6DA52784D19BD664B95C7365D8167D69'
}
$scoped = @(
  'app/(admin)/admin/_components/dashboard-reference-fixture.ts','components/evironn/auth/auth-variant-b.tsx','components/evironn/catalog/catalog-variant-b-adapter.ts','components/evironn/home/benefits-showcase-section.tsx','components/evironn/home/editorial-statement.tsx','components/evironn/home/furniture-editorial-sections.tsx','components/evironn/home/hero-rooms.ts','components/evironn/home/home-assets.ts','components/evironn/home/instagram-follow-section.tsx','components/evironn/home/nature-section.tsx','components/evironn/product/productPageState.ts','lib/seo.ts','prisma/seed-data.ts','tests/evironn-auth-source-contract.test.ts','tests/evironn-phase-3-assets.test.ts','tests/evironn-catalog-adapter.test.ts','tests/evironn-catalog-variant-b.test.tsx','tests/evironn-hero-assets.test.ts','tests/evironn-hero-shell.test.tsx','tests/evironn-home-assets.test.ts','tests/evironn-product-assets.test.ts','tests/evironn-product-state.test.ts','tests/evironn-showcase-product.test.ts','tests/furniture-domain.test.ts','tests/gen-seed-sql.test.ts','tests/product-media-stage.test.tsx','tests/product-page-canonical.test.tsx','tests/product-view-color-selection.test.ts','e2e/furniture-domain.spec.ts','e2e/product.spec.ts'
)
$sourceBasenames = @($allInputs | ForEach-Object { [IO.Path]::GetFileName($_) })
$pattern = ($sourceBasenames | ForEach-Object { [regex]::Escape($_) }) -join '|'
$assetsBeforeDeletion = (Get-ChildItem -LiteralPath 'public/assets' -File -Recurse | Measure-Object -Property Length -Sum).Sum
if ($allInputs.Count -ne 28 -or $outputs.Count -ne 27 -or $existingBaseline.Count -ne 14 -or $scoped.Count -ne 30) { throw 'Task 3 prelude allowlist mismatch.' }
```

- [ ] **Step 1: Run focused Chromium E2E before deletion**

Run:

```powershell
npx playwright test e2e/furniture-domain.spec.ts e2e/product.spec.ts --project=chromium
```

Expected GREEN: both focused specs pass, including WebP path/MIME, product poster/cutout/scene, and six alpha-variant assertions. Any 404, failed image load, console error, or route assertion failure blocks deletion.

- [ ] **Step 2: Perform mandatory local desktop/mobile visual verification before deletion**

Run the existing local application without changing configuration:

```powershell
npm run dev
```

In Chromium, inspect the existing home (`/`), catalog (`/catalog`), selected showcase PDP reached from a catalog card, existing authentication route reached from the header/account control, and protected admin (`/admin`) at `1440x1000` and `390x844`. Use an already authenticated local ADMIN session for `/admin`; if none exists, stop at this step and ask the user to log in through the existing `/login` route with an existing local ADMIN account, then resume after confirmation. Do not create, promote, seed, or delete an account, and do not record credentials, cookies, or personal data. For each surface, hard-reload, exercise its existing image-bearing state changes, and inspect Network and Console.

Expected for both viewports and all five surfaces: every approved image request returns HTTP 200 with `image/webp`; no approved PNG/JPG request occurs; no 404; no gray screen; no console error; transparent cutouts/posters retain clean edges with no opaque box, halo, clipping, or color/composition shift; room/editorial images preserve framing and aspect ratio; existing routes, catalog data, PDP variants, auth behavior, admin fixture content, responsive layout, and accepted design remain unchanged. Stop the local server after inspection. Any failed condition blocks source deletion and requires Task 2 remediation/re-review within its allowlist.

- [ ] **Step 3: Finalize the hero manifest contract, gate, then delete exactly the 28 approved source files**

Only after Steps 1–2 are fully green, first update `tests/evironn-hero-assets.test.ts` so its hero-directory manifest expects 44 entries: all non-target hero video/focus entries unchanged, the three idle JPG entries replaced by their adjacent WebP paths and metadata, `living-room-idle.png` absent, and existing `living-room-idle-5f0f1836.webp` retained exactly once. Change no other assertion or test behavior. Then run this immediate pre-delete gate in the same PowerShell session:

Before the gate, run the deferred contract alone:

```powershell
npx vitest run tests/evironn-hero-assets.test.ts
```

Expected RED: the final 44-entry manifest fails only because the three retired JPG files and `living-room-idle.png` still exist in the hero directory. If it passes, or fails for any other reason, stop and inspect the contract before deletion.

```powershell
$status = @(git status --short --untracked-files=all)
$allowedBeforeDelete = @(' M tests/evironn-hero-assets.test.ts','?? docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md','?? docs/superpowers/plans/phase-2-task-3-execution.md')
if (@(Compare-Object -ReferenceObject $allowedBeforeDelete -DifferenceObject $status).Count -ne 0) { throw "Unexpected pre-delete status: $($status -join ', ')" }
if (@($allInputs | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) }).Count -ne 0) { throw 'All 28 approved source inputs must exist immediately before deletion.' }
$sourceBytesBeforeDelete = (Get-Item -LiteralPath $allInputs | Measure-Object -Property Length -Sum).Sum
if ($sourceBytesBeforeDelete -ne 50350973) { throw "Source byte total changed: $sourceBytesBeforeDelete" }
$missingOutputs = @($outputs | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) -or (Get-Item -LiteralPath $_).Length -le 0 })
if ($missingOutputs.Count) { throw "Missing or empty output before deletion: $($missingOutputs -join ', ')" }
foreach ($path in $existingBaseline.Keys) { if ((Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash -ne $existingBaseline[$path]) { throw "Existing WebP changed before deletion: $path" } }
$protectedExpected = @{
  'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md'='FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9'
  'docs/superpowers/plans/phase-2-task-3-execution.md'='F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2'
}
foreach ($path in $protectedExpected.Keys) {
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash -ne $protectedExpected[$path]) { throw "Protected file changed: $path" }
}
$allInputs | ForEach-Object { Remove-Item -LiteralPath $_ -ErrorAction Stop }
$remaining = @($allInputs | Where-Object { Test-Path -LiteralPath $_ })
if ($remaining.Count) { throw "Approved source deletion incomplete: $($remaining -join ', ')" }
```

Expected: exactly 28 allowlisted source files are absent. Git remains the recovery mechanism. Do not delete any existing WebP, `public/home`, `public/products`, or unlisted asset.

- [ ] **Step 4: Re-run image invariants, no-reencode gate, stale-reference gate, and exact byte measurements**

Run:

```powershell
$missingOutputs = @($outputs | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) -or (Get-Item -LiteralPath $_).Length -le 0 })
if ($missingOutputs.Count) { throw "Missing or empty output: $($missingOutputs -join ', ')" }
$outputBytes = (Get-Item -LiteralPath $outputs | Measure-Object -Property Length -Sum).Sum
if ($outputBytes -ge 47928407) { throw "Converted output did not shrink against its 27 conversion inputs: $outputBytes" }
$assetsBeforeGeneration = $assetsBeforeDeletion - $outputBytes
$assetsAfter = (Get-ChildItem -LiteralPath 'public/assets' -File -Recurse | Measure-Object -Property Length -Sum).Sum
$expectedAssetsAfter = $assetsBeforeDeletion - 50350973
if ($assetsAfter -ne $expectedAssetsAfter) { throw "public/assets total mismatch: actual=$assetsAfter expected=$expectedAssetsAfter" }
$savedBytes = 50350973 - $outputBytes
$savedPercent = [math]::Round(($savedBytes / 50350973) * 100, 6)
foreach ($path in $existingBaseline.Keys) { if ((Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash -ne $existingBaseline[$path]) { throw "Existing WebP changed: $path" } }
$stale = Select-String -LiteralPath $scoped -Pattern $pattern
if ($stale) { $stale | Select-Object Path,LineNumber,Line; throw 'Stale approved source reference remains.' }
"ASSETS_BEFORE_GENERATION=$assetsBeforeGeneration ASSETS_BEFORE_DELETION=$assetsBeforeDeletion ASSETS_AFTER=$assetsAfter SOURCE_BYTES=50350973 OUTPUT_BYTES=$outputBytes SAVED_BYTES=$savedBytes SAVED_PERCENT=$savedPercent"
```

Expected: all 27 outputs exist and are non-empty; output total is less than `47,928,407`, the measured 27-file conversion-source total; actual `public/assets` after total equals the measured pre-deletion total minus `50,350,973` because outputs already exist in that pre-deletion total; all 14 existing WebP hashes match the immutable baseline; no stale scoped reference remains. Report original pre-generation total reconstructed as `pre-deletion total - OUTPUT_BYTES`, plus measured post-deletion total and net retired-source savings `50,350,973 - OUTPUT_BYTES`. State explicitly that no loading-speed or deployed-performance result was measured.

Re-run the exact Task 1 Step 3 Node invariant command after temporarily redefining `$opaque` and `$alpha` as the original source lists is impossible after deletion, so the pre-deletion alpha-byte/visible-RGB evidence is authoritative. After deletion, verify output metadata alone with:

```powershell
$env:EVIRONN_OPAQUE_OUTPUTS = @($outputs[0..14]) | ConvertTo-Json -Compress
$env:EVIRONN_ALPHA_OUTPUTS = @($outputs[15..26]) | ConvertTo-Json -Compress
node --input-type=module -e "import assert from 'node:assert/strict'; import fs from 'node:fs'; import sharp from 'sharp'; const opaque=JSON.parse(process.env.EVIRONN_OPAQUE_OUTPUTS); const alpha=JSON.parse(process.env.EVIRONN_ALPHA_OUTPUTS); for (const path of opaque) { const m=await sharp(path).metadata(); assert.equal(m.format,'webp'); assert.equal(Boolean(m.hasAlpha),false,path); assert.ok(m.width>0&&m.height>0&&fs.statSync(path).size>0,path); } for (const path of alpha) { const m=await sharp(path).metadata(); assert.equal(m.format,'webp'); assert.equal(Boolean(m.hasAlpha),true,path); assert.ok(m.width>0&&m.height>0&&fs.statSync(path).size>0,path); } console.log('PASS: 27 retained WebP outputs decode with expected alpha state.');"
if ($LASTEXITCODE -ne 0) { throw 'Post-deletion WebP decode verification failed.' }
Remove-Item Env:EVIRONN_OPAQUE_OUTPUTS,Env:EVIRONN_ALPHA_OUTPUTS
```

Expected: `PASS: 27 retained WebP outputs decode with expected alpha state.`

- [ ] **Step 5: Re-run focused GREEN contracts after deletion**

Run:

```powershell
npx vitest run tests/evironn-auth-source-contract.test.ts tests/evironn-phase-3-assets.test.ts tests/evironn-catalog-adapter.test.ts tests/evironn-catalog-variant-b.test.tsx tests/evironn-hero-assets.test.ts tests/evironn-hero-shell.test.tsx tests/evironn-home-assets.test.ts tests/evironn-product-assets.test.ts tests/evironn-product-state.test.ts tests/evironn-showcase-product.test.ts tests/furniture-domain.test.ts tests/gen-seed-sql.test.ts tests/product-media-stage.test.tsx tests/product-page-canonical.test.tsx tests/product-view-color-selection.test.ts
npx playwright test e2e/furniture-domain.spec.ts e2e/product.spec.ts --project=chromium
```

Expected GREEN: all focused Vitest files and both focused Chromium specs pass with source files absent. No complete gate, unrelated test, or production build is run for this tight portfolio remediation.

- [ ] **Step 6: Verify bounded ownership, protected files, commit, and final review**

Run:

```powershell
git status --short
git diff --check -- public/assets
Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md','docs/superpowers/plans/phase-2-task-3-execution.md' | Select-Object Path,Hash
git config user.name
git config user.email
git add -- tests/evironn-hero-assets.test.ts $allInputs
$stagedNames = @(git diff --cached --name-only)
$expectedNames = @('tests/evironn-hero-assets.test.ts') + $allInputs
if (@(Compare-Object -ReferenceObject $expectedNames -DifferenceObject $stagedNames).Count -ne 0) { throw 'Task 3 staged names must contain exactly the hero-contract modification and 28 approved deletions.' }
$modifiedNames = @(git diff --cached --diff-filter=M --name-only)
$deletedNames = @(git diff --cached --diff-filter=D --name-only)
if ($modifiedNames.Count -ne 1 -or $modifiedNames[0] -ne 'tests/evironn-hero-assets.test.ts') { throw 'Task 3 may modify only tests/evironn-hero-assets.test.ts.' }
if (@(Compare-Object -ReferenceObject $allInputs -DifferenceObject $deletedNames).Count -ne 0) { throw 'Task 3 deletions must match the exact 28-input allowlist.' }
git diff --cached --name-status
git commit -m "chore: remove replaced PNG and JPG assets"
```

Expected: the Task 3 staged diff contains exactly one modification of `tests/evironn-hero-assets.test.ts` plus exactly 28 deletions; protected hashes equal their baseline values; identity remains the user's; commit succeeds. Fresh Sol Medium final review checks all three task commits as one bounded rollout and reports Critical/Important/Minor findings. It must verify the 28-to-27 conversion plus one living-room deduplication, unchanged 14 existing WebP files, exact changed-path contract, RED/GREEN evidence, dimensions/aspect/alpha-byte/visible-RGB evidence, byte arithmetic, local desktop/mobile results, 404/gray-screen/console/transparency gates, preserved routes/data/design, and absence of package/infrastructure/service/runtime-loading changes. Resolve every Critical or Important finding with only affected focused checks; re-run a broader check only if remediation invalidates earlier evidence.

## Completion Stop and Implementation Handoff

After final review is READY, the coordinator must present:

- the three commit SHAs and exact changed-path ledger;
- 28 retired source records, 27 new WebP records, one living-room mapping, and 14 unchanged existing WebP records;
- source/output bytes, saved bytes/percentage, and total `public/assets` before/after bytes;
- focused RED/GREEN Vitest and Playwright results;
- desktop/mobile results for home, catalog, selected PDP, authentication, and admin;
- explicit confirmation that no loading-speed or deployed-performance claim was measured;
- protected-file hashes and final Critical/Important/Minor review counts.

Then stop with `READY FOR USER IMPLEMENTATION ACCEPTANCE`. Do not push, open a pull request, deploy, merge, begin Phase 6D, or perform any external operation without separate explicit user authorization.

Implementation-session handoff: use `superpowers:subagent-driven-development` with one fresh Luna High implementer per sequential task and fresh Sol Medium review gates. Re-read this plan, the approved design, evidence bundle, `AGENTS.md`, roadmap/status/decisions, and Phase 6 handoff; verify current branch/HEAD/identity/status without changing Git state; obtain explicit user approval of this plan before Task 1.

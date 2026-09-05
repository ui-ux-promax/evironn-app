# Phase 6C WebP Image Rollout Design

## Status

Approved user decision. This document records the fixed implementation boundary; it does not authorize implementation, deletion, deployment, push, pull request, or merge.

## Goal

Convert the approved image inventory under `D:\Projects\evironn\public\assets` to WebP, preserve dimensions, composition, and transparency, replace every real application/seed/SEO/fixture/test/E2E reference, and remove replaced source images only after all checks pass.

## Binding decisions

- Scope is only `public/assets` plus the source references that point to those assets.
- Convert 25 PNG and 3 JPG source records. Existing 14 WebP files are reused unchanged.
- `public/assets/hero/living-room-idle.png` is a duplicate predecessor of `public/assets/hero/living-room-idle-5f0f1836.webp`; do not create `living-room-idle.webp`. Update the remaining stale test contract to the hashed WebP and delete the predecessor only after verification.
- The executable conversion set is therefore 27 new WebP files: 12 opaque PNG, 3 opaque JPG, and 12 alpha PNG. The living-room predecessor is the one approved deduplicated source record.
- Opaque images use WebP `quality: 92`.
- Images with an alpha channel use lossless WebP (`lossless: true`) to preserve furniture edges and transparency.
- Width, height, aspect ratio, visual composition, route behavior, and existing UI design remain unchanged. No resize, crop, recomposition, or new image treatment is allowed.
- Old `public/home` and `public/products` catalogs are outside scope and must not be changed.
- Update real links in production code, Prisma seed, SEO, admin fixtures, unit tests, and E2E. Historical planning prose is not a runtime link and is not a target.
- Create outputs first, update references second, validate third, delete source PNG/JPG last. Git is the recovery mechanism.
- Local desktop/mobile visual verification is mandatory for home, catalog, PDP, authentication, and admin. Preview deployment, push, PR, and merge require separate user authorization.

## Exact asset rules

The source and output allowlists are recorded in the evidence bundle and executable plan. Every converted output stays beside its source with only the extension changed to `.webp`; the living-room source maps to the existing hashed output. No output may collide with an existing WebP or another output. Existing WebP files are never re-encoded.

## Acceptance

The rollout is acceptable only when:

1. The exact allowlist has 25 PNG and 3 JPG source records, 14 unchanged pre-existing WebP records, 27 newly generated WebP outputs, and the one living-room deduplication mapping.
2. Every output has the source width and height; alpha outputs have `hasAlpha=true`, preserve the source alpha byte for every pixel, and preserve source RGB values at every pixel where source alpha is greater than zero. RGB differences are permitted only where source alpha is zero, because those RGB values are invisible. Opaque outputs remain opaque.
3. Every newly generated output is non-empty and the converted source subset is smaller in total bytes than its original PNG/JPG subset. Overall `public/assets` total bytes before/after are measured and reported without claiming a speed improvement.
4. No stale references to replaced PNG/JPG paths remain in the scoped runtime, seed, SEO, fixture, unit-test, or E2E surfaces; no reference points to an absent asset.
5. Focused RED/GREEN contracts pass, local desktop/mobile checks show no 404, gray screen, console error, or transparency loss, and all protected pre-existing untracked files remain unchanged.

## Explicit exclusions

No production code behavior beyond asset path replacement, no package/config/provider/database change, no new service or image pipeline, no build/E2E/deployment in planning, no provider/database operation, no `public/home` or `public/products` edit, and no external publication without explicit authorization.

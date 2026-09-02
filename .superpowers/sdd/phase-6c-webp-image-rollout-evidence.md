# Phase 6C WebP Image Rollout Evidence

## Baseline

- Repository: `D:\Projects\evironn`
- Branch: `phase/06-hardening-release`
- HEAD: `92cb33232aafc29388d692ee4d193a5907400cdd`
- Pre-document baseline working tree: only the two protected untracked Phase 2 plans were present; the three planning artifacts were added afterward by this planning session and remain the only new paths.
- Protected paths: `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`, `docs/superpowers/plans/phase-2-task-3-execution.md`
- Protected SHA-256: `FD43E58AF19E79F746C41126572072E38792052F202AE5C1C26E4EFDB5F6E6E9`, `F1BE0E060EDA06AFA2AFDFF53D4DCECD338B3C67514E412E2ADD0605C503A7E2`
- Current `public` directories: `assets`, `home`, `products`; only `public/assets` is owned.
- Inventory command used Node `sharp` metadata only; no asset was written or changed.

## Exact inventory

Metadata: `width x height`, source byte size, channel result. All existing WebP records are opaque 3-channel files.

### 25 PNG sources

Opaque PNG (13):

| Path                                                                  |     Bytes |  Dimensions |
| --------------------------------------------------------------------- | --------: | ----------: |
| `public/assets/editorial/images/71c2b8589fc6.png`                     | 1,859,747 | 2528 x 1696 |
| `public/assets/editorial/images/category-bedside.png`                 | 2,270,030 | 1448 x 1086 |
| `public/assets/editorial/images/category-console.png`                 | 1,990,841 | 1448 x 1086 |
| `public/assets/editorial/images/category-reading-chair.png`           | 2,439,310 | 1448 x 1086 |
| `public/assets/editorial/images/category-sofa.png`                    | 2,631,604 | 1448 x 1086 |
| `public/assets/furniture/craftsmanship-wide.png`                      | 1,742,126 |  1672 x 941 |
| `public/assets/furniture/material-joinery-detail.png`                 | 1,875,598 | 1254 x 1254 |
| `public/assets/furniture/material-textile-detail.png`                 | 2,610,989 | 1254 x 1254 |
| `public/assets/furniture/material-wood-detail.png`                    | 1,681,846 | 1254 x 1254 |
| `public/assets/furniture/materials-room-wide.png`                     | 2,255,183 |  1774 x 887 |
| `public/assets/hero/living-room-idle.png`                             | 2,422,566 | 1536 x 1024 |
| `public/assets/products/05-graphite-walnut-room-background-fixed.png` | 2,182,988 | 1536 x 1024 |
| `public/assets/products/05-graphite-walnut-room-integrated-v2.png`    | 2,556,946 | 1536 x 1024 |

Alpha PNG (12, 4 channels):

| Path                                                                          |     Bytes |  Dimensions |
| ----------------------------------------------------------------------------- | --------: | ----------: |
| `public/assets/products/01-bar-stool-cutout.png`                              |   273,844 | 1254 x 1254 |
| `public/assets/products/03-ivory-lounge-cutout.png`                           | 1,223,561 | 1254 x 1254 |
| `public/assets/products/03-ivory-lounge-turntable-alpha-poster.png`           |   566,704 | 1920 x 1080 |
| `public/assets/products/05-graphite-pine-chair-fixed-alpha.png`               | 2,562,642 | 1536 x 1024 |
| `public/assets/products/05-graphite-walnut-chair-fixed-alpha.png`             | 2,534,916 | 1536 x 1024 |
| `public/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png` | 3,161,216 | 1920 x 1080 |
| `public/assets/products/05-ivory-pine-chair-fixed-alpha.png`                  | 2,475,996 | 1536 x 1024 |
| `public/assets/products/05-ivory-walnut-chair-alpha.png`                      |   328,129 | 1536 x 1024 |
| `public/assets/products/05-ivory-walnut-chair-fixed-alpha.png`                | 2,476,114 | 1536 x 1024 |
| `public/assets/products/05-terracotta-pine-chair-fixed-alpha.png`             | 2,522,477 | 1536 x 1024 |
| `public/assets/products/05-terracotta-walnut-chair-alpha.png`                 |   349,533 | 1536 x 1024 |
| `public/assets/products/05-terracotta-walnut-chair-fixed-alpha.png`           | 2,555,550 | 1536 x 1024 |

### 3 JPG sources

All are opaque 3-channel files:

| Path                                  |   Bytes | Dimensions |
| ------------------------------------- | ------: | ---------: |
| `public/assets/hero/bedroom-idle.jpg` | 273,941 | 1248 x 832 |
| `public/assets/hero/kitchen-idle.jpg` | 241,034 | 1168 x 784 |
| `public/assets/hero/terrace-idle.jpg` | 285,542 | 1168 x 784 |

### 14 existing WebP files, unchanged

| Path                                                |   Bytes |  Dimensions |
| --------------------------------------------------- | ------: | ----------: |
| `public/assets/hero/bedroom-bed-focus.webp`         | 106,352 |  1168 x 768 |
| `public/assets/hero/bedroom-chair-focus.webp`       | 147,978 |  1168 x 768 |
| `public/assets/hero/chair-focus.webp`               | 174,412 |  1168 x 768 |
| `public/assets/hero/kitchen-dining-focus.webp`      |  81,900 |  1168 x 784 |
| `public/assets/hero/kitchen-island-focus.webp`      |  89,754 |  1168 x 784 |
| `public/assets/hero/living-room-idle-5f0f1836.webp` | 223,502 | 1536 x 1024 |
| `public/assets/hero/sofa-focus.webp`                |  93,922 |  1168 x 768 |
| `public/assets/hero/terrace-chair-focus.webp`       | 139,436 |  1168 x 784 |
| `public/assets/hero/terrace-sofa-focus.webp`        | 222,370 |  1168 x 784 |
| `public/assets/products/01-bar-stool-idle.webp`     |   9,908 |   720 x 720 |
| `public/assets/products/02-rocking-chair-idle.webp` |  21,798 |   720 x 720 |
| `public/assets/products/03-ivory-lounge-idle.webp`  |  62,648 |   720 x 720 |
| `public/assets/products/04-dark-accent-idle.webp`   |  58,332 |   720 x 720 |
| `public/assets/products/05-two-seat-sofa-idle.webp` |  33,462 |   720 x 720 |

Totals: PNG `49,550,456` bytes; JPG `800,517` bytes; source PNG/JPG subset `50,350,973` bytes; existing WebP `1,465,774` bytes; all listed image files `51,816,747` bytes.

Protected existing-WebP baseline SHA-256 values, used to detect accidental re-encoding:

`bedroom-bed-focus.webp=3653539AEB27781C967BC06F5820CE99B1E81087554FB93DA31B9A159E807F84`; `bedroom-chair-focus.webp=590365D870BAC10C835C46BEA3875FE47DAE404BA32E5C2BC40CCBD6BAACAF0F`; `chair-focus.webp=9307EE6798158F3FFEE650CCF201759BA2A59FC53D62782C40D3E45A8C65ED84`; `kitchen-dining-focus.webp=F1C31AAF156CEEC7DDE5A59A6F05BBF66016C90E4ADAE27353AD17B70A16B423`; `kitchen-island-focus.webp=76E491CB50A332DAE95F196AD8811A375357E5357AD97B841881CFEB10C56CE4`; `living-room-idle-5f0f1836.webp=5F0F1836760241BE5F6DE79E25937C5B21FD4B2CA6EC73394A6D0FAC89AC8C7F`; `sofa-focus.webp=77E104AC672CD58E87F94796F132478530D94FEA610489656594F0FD136C39C2`; `terrace-chair-focus.webp=F087A6BADB3703CAB15C9E5E113893101FB0DFC74D036563E47B681CA467458F`; `terrace-sofa-focus.webp=1086C631DF3B004810D9573121B4859724BE5E61D402AA117226F9E492A5BFE2`; `01-bar-stool-idle.webp=8CDC194EF844599EDFA3D2D0BF979C2904BB8039C1C79BBB7B8765C6379671E8`; `02-rocking-chair-idle.webp=0990C6FC32A8F921025260786CC2B728B909B4BB37C3DB71234DA237B220434E`; `03-ivory-lounge-idle.webp=9D81E08FE8DD5B44422CF48547E57E390F6BAC6C97CAD81057654FB20BF5493E`; `04-dark-accent-idle.webp=8E90DA84BE0341CB6167D771C545E767D0DC4FAE62033A49F85A168CE2346E74`; `05-two-seat-sofa-idle.webp=A373295B1173ED4EE5F27EE255DC770A6DA52784D19BD664B95C7365D8167D69`.

## Conversion/output allowlist

The 27 new outputs are the same paths as the 25 PNG and 3 JPG lists above after extension replacement, except `public/assets/hero/living-room-idle.png`, which has no new output. Its approved output is the existing `public/assets/hero/living-room-idle-5f0f1836.webp`. Therefore:

- Opaque conversion set: the 12 opaque PNG paths above excluding `living-room-idle.png`, plus all 3 JPG paths; output each as the same relative path with `.webp`.
- Alpha conversion set: all 12 alpha PNG paths above; output each as the same relative path with `.webp`.
- Deduplication set: `public/assets/hero/living-room-idle.png` to `/assets/hero/living-room-idle-5f0f1836.webp`; no `living-room-idle.webp`.
- Collision gate: before writing, assert every 27 output path is absent, assert no output basename duplicates another output, and assert the 14 existing WebP files are not selected as source or output. The current inventory has no exact path collision; the only semantic duplicate is the living-room pair.

## Real reference inventory

The following current files contain references to the 28 source basenames. Replace only source-path occurrences; update byte/hash manifests from generated files. Existing WebP references remain unchanged.

Production, seed, SEO, and fixture surfaces:

- `app/(admin)/admin/_components/dashboard-reference-fixture.ts`: category sofa/reading-chair/console PNGs.
- `components/evironn/auth/auth-variant-b.tsx`: integrated room PNG, ivory alpha PNG, terracotta alpha PNG.
- `components/evironn/catalog/catalog-variant-b-adapter.ts`: cutout basenames, terracotta alpha basename, editorial living PNG, bedroom/kitchen/terrace JPG room images.
- `components/evironn/home/benefits-showcase-section.tsx`: two cutouts and craftsmanship PNG.
- `components/evironn/home/editorial-statement.tsx`: three material PNGs.
- `components/evironn/home/furniture-editorial-sections.tsx`: five editorial PNGs.
- `components/evironn/home/hero-rooms.ts`: bedroom/kitchen/terrace JPG room images.
- `components/evironn/home/home-assets.ts`: five editorial PNGs, five furniture PNGs, two cutouts, three JPGs; replace manifest sizes and SHA-256 values.
- `components/evironn/home/instagram-follow-section.tsx`: three JPG room images.
- `components/evironn/home/nature-section.tsx`: materials-room-wide PNG.
- `components/evironn/product/productPageState.ts`: seven product scene/alpha PNGs.
- `lib/seo.ts`: default Open Graph cutout PNG.
- `prisma/seed-data.ts`: bar-stool cutout, turntable poster, terracotta alpha PNG.

Unit and component contracts:

- `tests/evironn-auth-source-contract.test.ts`, `tests/evironn-phase-3-assets.test.ts`: auth composition asset paths.
- `tests/evironn-catalog-adapter.test.ts`, `tests/evironn-catalog-variant-b.test.tsx`: catalog image paths and basenames.
- `tests/evironn-hero-assets.test.ts`: bedroom/kitchen/terrace JPG manifest entries and stale living PNG entry; add/update the hashed WebP contract and remove the old PNG entry after the path assertion is corrected.
- `tests/evironn-hero-shell.test.tsx`: kitchen idle image selectors and load assertions.
- `tests/evironn-home-assets.test.ts`: manifest count stays 31; generated byte/hash values must be updated through `home-assets.ts`.
- `tests/evironn-product-assets.test.ts`, `tests/evironn-product-state.test.ts`: product scene/alpha manifest and state paths.
- `tests/evironn-showcase-product.test.ts`, `tests/furniture-domain.test.ts`, `tests/gen-seed-sql.test.ts`: turntable poster seed/DTO SQL contracts.
- `tests/product-media-stage.test.tsx`, `tests/product-page-canonical.test.tsx`, `tests/product-view-color-selection.test.ts`: PDP poster/background/variant paths.

E2E:

- `e2e/furniture-domain.spec.ts`: product poster and cutout MIME/path assertions.
- `e2e/product.spec.ts`: product scene, poster, and six alpha variant paths.

Stale living-room contract found at `tests/evironn-hero-assets.test.ts:151`; production already uses the hashed WebP at `components/evironn/home/hero-rooms.ts:29` and the living-room shell tests already assert that hashed URL.

## Current classification and gap

- Reuse unchanged: all 14 existing WebP files, current rendering/layout/media components, existing route behavior, and existing test architecture.
- Adapt: the listed production path constants, seed, SEO, admin fixture, `home-assets.ts`, hero/product manifests, and exact reference contracts.
- Port: none. No new image service, package, route, or asset pipeline is justified.
- Retire: 27 replaced PNG/JPG files after validation; the living-room PNG is retired after its test contract points to the existing hashed WebP. `public/home` and `public/products` remain untouched.

## Alpha verification correction

The binding alpha invariant is: equal width and height; output `hasAlpha=true`; identical alpha bytes for every pixel; identical RGB bytes for every pixel whose source alpha is greater than zero; RGB differences are permitted only where source alpha is zero. The executable plan contains the exact Node command and reports `alphaMismatch`, `visibleRgbMismatch`, and transparent-only RGB differences.

User-provided dry-run evidence for the exact sharp conversion: all 12 alpha files had `alphaMismatch=0` and `visibleRgbMismatch=0`; differences occurred only in RGB values of fully transparent source pixels. The generated 27 outputs totaled `7,510,922` bytes against `47,928,407` conversion-source bytes, a measured reduction of `84.33%`; no output exceeded its source. Full byte-for-byte comparison of invisible RGB values is intentionally not an acceptance criterion.

## Forbidden during planning

No production/test/asset/package/Prisma/workflow/provider configuration change; no build, E2E, deployment, provider/database operation; no push, PR, merge, or branch operation. Evidence is value-free and contains no secrets.

## Task 2 bounded sentinel exception

`SYNTHETIC_TEST_SENTINEL_EXCEPTION` is limited to the exact literal `/assets/products/server-upload.webp` in `tests/evironn-catalog-adapter.test.ts`. The literal occurs exactly twice and nowhere else in production code, Prisma seed, SEO, admin fixtures, or E2E. `public/assets/products/server-upload.webp` is intentionally absent. The test exercises pass-through of an unknown server-provided `imageUrl`; the `forward` and `reverse` fallbacks remain existing real assets. The corrected completeness gate excluded only this exact literal and reported zero missing remaining references. No placeholder asset, fixture change, runtime change, wildcard, directory, or generic exemption was introduced. This is not a production asset or runtime completeness debt.

## Task 3 Preview seed, snapshot rewrite, and gate evidence

`NEON_PREVIEW_PRISMA_SEED_AUTHORIZED_BY_USER`: user explicitly authorized exactly the штатный `npm run prisma:seed` against the current Neon Preview target. The seed completed through its existing upsert path (`categories=5 rooms=5 products=16 optionGroups=3 optionValues=19 skus=25 media=19`). No reset, truncate, delete, ad hoc SQL, migration, schema change, provider mutation, or cron reset was used.

Post-seed read-only proof: Noma poster/fallback URLs are WebP; Sora terracotta catalog media is WebP; all six Noma showcase SKUs have stock `3`; `ProductMedia`, `SkuMedia`, and `ProductImage` contain zero legacy `.png`, `.jpg`, or `.jpeg` URLs. Focused Chromium E2E completed with 12 passing tests and one flaky test recovered on retry (exit 0).

`NEON_PREVIEW_TWO_ORDERITEM_IMAGEURL_REWRITE_AUTHORIZED_BY_USER`: user explicitly authorized rewriting exactly the two confirmed `OrderItem.imageUrl` rows for orders 52 and 53. Read-only preconditions matched both row IDs, order IDs, order numbers, and the exact legacy PNG path; no conflicting rows matched. A Prisma transaction updated only `imageUrl` for those two rows and reported `affected=2`. No other fields, order rows, ProductMedia, SkuMedia, or ProductImage rows were changed.

Post-rewrite read-only proof: orders 52 and 53 both point to `/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.webp`; global legacy `.png`, `.jpg`, and `.jpeg` `OrderItem.imageUrl` count is `0`. Exact public visual/network checks at `1440x1000` and `390x844` for home, catalog, showcase PDP, and login reported HTTP 200, zero broken images, zero failed asset responses, zero legacy image requests, and zero console errors. The existing authenticated `/profile` and `/admin` session rendered without broken images, legacy image requests, or console errors at the available browser viewport `874x920`.

Task 3 then passed the exact pre-delete conditions and removed only the 28 approved PNG/JPG source files. Post-delete checks reported 27 non-empty WebP outputs, output bytes `7,510,922`, `public/assets` after bytes `207,834,476`, saved bytes `42,840,051` (`85.082866%`), 14 unchanged existing-WebP hashes, and zero stale approved source references. Retained-output metadata verification passed for all 27 files. Post-delete focused Vitest passed `15` files and `85` tests; focused Chromium passed `13` tests. No loading-speed or deployed-performance claim was measured.

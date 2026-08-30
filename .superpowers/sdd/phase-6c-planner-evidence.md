# Phase 6C Planner Evidence

## 1. Repository and phase state

- Repository: `D:\Projects\evironn`.
- Branch: `phase/06-hardening-release`.
- HEAD: `071807cba8e1c4cfb4185306e9534014107fe3e1`.
- HEAD subject: `docs: approve phase 6c performance design`.
- `origin/dev` and local `dev` point to `e06ae9c` (accepted Phase 5/admin redesign merge); Phase 6A and 6B are user-accepted on this branch.
- Git identity observed read-only: `ui-ux-promax <gojjoy22@gmail.com>`.
- Remote observed read-only: `origin https://github.com/ui-ux-promax/evironn-app.git`.
- Worktree before evidence: no tracked changes; exactly two protected untracked files listed in Section 8.
- Approved design: `docs/superpowers/specs/2026-08-30-phase-6c-performance-design.md`.
- No production code, tests, package files, lockfile, Prisma/schema, workflow, Vercel configuration, provider configuration, commit, push, deployment, provider operation, database operation, build, full gate, broad E2E, or Phase 6D operation occurred.

## 2. Accepted boundary contracts

Phase 6A/6B evidence and status were read for preservation only. Relevant frozen contracts:

- `/demo-admin` remains public, synthetic, read-only, Prisma-independent; `/admin` remains ADMIN-protected.
- Server owns prices, SKU resolution, stock, carts, totals, payment state, and review eligibility.
- CSRF/middleware, CSP/security headers, Sentry/PII scrubbing, Redis rate limits, health/readiness, demo reset guard/lock/cron, Cloudinary allowlist/delete, Resend sanitization, DaData timeout, and YooKassa durable claim/recovery boundaries remain unchanged.
- No shared caching of user-specific or personalized data is permitted without new proof and approved scope.
- HTML routes observed below are `private, no-cache, no-store, max-age=0, must-revalidate`; no plan may turn dynamic or personalized reads into shared cache without proving public safety.

## 3. Current route ownership inventory

### Primary `/`

- `app/(shop)/page.tsx` is a server page with no direct database read. It renders eight accepted Evironn sections: `Hero`, `FurnitureCategorySection`, `InteractiveFurnitureCards`, `EditorialStatement`, `NatureSection`, `BenefitsShowcaseSection`, `FurnitureWorksParallax`, and `InstagramFollowSection`.
- `app/(shop)/layout.tsx` is an async server layout. It builds storefront JSON-LD, calls `getInitialCartCount()`, and renders `StorefrontHeader`, content, `StorefrontFooter`, and `VerificationGateHost`.
- `lib/storefront-cart-count.ts` calls Auth.js, reads cookies, resolves an owner cart with `create: false`, and counts cart items. This is a dynamic/personalized boundary and is not a caching candidate.
- `components/evironn/home/hero.tsx` is a client boundary. It renders four room idle images and delegates room/product interaction state to client media components.
- `components/evironn/home/hero-room-media.tsx` renders all four room images without a loading policy; `hero-rooms.ts` identifies their public paths.
- `components/evironn/home/hero-product-media.tsx` renders eight focus images plus sixteen forward/reverse hero videos, each with `preload="auto"`; videos load on interaction state but are present in the initial DOM.
- `components/evironn/home/interactive-furniture-cards.tsx` renders five idle images and five forward videos with `preload="auto"`; reverse sources are assigned during interaction.
- `components/evironn/home/furniture-editorial-sections.tsx`, `benefits-showcase-section.tsx`, `nature-section.tsx`, and `instagram-follow-section.tsx` render accepted below-fold image media using existing `<img>` elements and Framer Motion reveal behavior.
- `app/layout.tsx` imports three `next/font/google` families (`Manrope`, `Unbounded`, `Anybody`) and the full accepted Evironn stylesheet set. The deployed HTML exposed four self-hosted font preloads and eight stylesheet links.
- `next.config.mjs` already disables the powered-by header, applies security headers, configures Cloudinary image patterns, and externalizes existing server packages. No configuration rewrite is justified by current evidence.

### `/catalog` guardrail

- `app/(shop)/catalog/page.tsx` declares `dynamic = 'force-dynamic'`, calls Auth.js and cookies, runs `findProducts(sp)` plus wishlist reads in parallel, and emits catalog JSON-LD.
- `lib/find-products.ts` performs product total, category/room/options/price reads, facet-count reads, and paginated product reads through Prisma. The current query fan-out is an intentional guardrail surface, not a Phase 6C optimization target.
- Catalog renders existing `CatalogVariantB` client interactions and product media. No catalog task may be derived from its slower HTML total time.

### Selected PDP guardrail

- Selected public route: `/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle`.
- `app/(shop)/product/[slug]/page.tsx` declares `dynamic = 'force-dynamic'`, loads the showcase product through `getFurnitureProductBySlug()`, builds metadata/JSON-LD, and renders `ProductPageHandoff`.
- `components/evironn/product/product-page-handoff.tsx` waits for fonts plus the scene background and selected chair image, then reveals the client `ProductPage`; it has an existing 5-second reveal timeout.
- `ProductPage.tsx` owns the accepted selected chair, 360 video, options, accordions, and add-to-cart behavior. Related `InteractiveFurnitureCards` also appear below the PDP.
- PDP timing is a regression guardrail only. No PDP media, preload, dynamic rendering, or related-products change is in Phase 6C.

## 4. Source-parity classification

| Surface                                                                | Classification  | Evidence-based decision                                                                                       |
| ---------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| Root/shop server layout, cart-count/auth/cookie boundary               | reuse unchanged | Preserve dynamic/personalized behavior; no shared cache.                                                      |
| Root accepted home composition, CSS, typography, motion, accessibility | reuse unchanged | No redesign, quality reduction, or visual reinterpretation.                                                   |
| Home hero media scheduling                                             | adapt candidate | Only potential owner-local candidate; select one narrow change only if browser/resource evidence confirms it. |
| Catalog data/query/rendering                                           | reuse unchanged | Guardrail only; no catalog optimization.                                                                      |
| PDP data/rendering/media                                               | reuse unchanged | Guardrail only; no PDP optimization.                                                                          |
| New dependency/framework/service                                       | retire          | Forbidden by approved design.                                                                                 |
| Phase 6A/6B security/provider boundaries                               | reuse unchanged | Preserve owners and contracts; no cache/auth bypass.                                                          |
| Phase 6D build/deploy/after-measurement/release                        | retire from 6C  | Explicitly deferred.                                                                                          |

Totals: reuse unchanged 7, adapt candidate 1, port 0, retire/deferred 3. These are planning classifications, not implementation permission.

## 5. Public baseline protocol and safe results

### Conditions

- Target host: `https://evironn-app.vercel.app/`.
- Browser: Codex In-app Browser, selected for target URL.
- Browser viewport: `390x844`.
- Runs: three fresh browser tabs per route, unique `phase6c_browser` query value, anonymous visible-page checks, 2.5-second post-DOM-content-loaded settle. No cookies, local storage, credentials, or browser profiles were inspected.
- Same selected browser, viewport, location, and navigation protocol for all nine browser checks. Browser API did not expose cache-clear control or the page Performance API; therefore these are fresh-tab/cache-buster checks, not a claim of independently verified cache eviction.
- Supplemental server-response probes: three unique-query `curl.exe --compressed` GETs per route, from the same execution location, no request headers or cookies supplied. These are HTML response timing proxies, not mobile browser CWV measurements.
- First public request after idle was recorded only as `cold candidate`; no Vercel platform evidence proves a cold start.

### Browser route checks

All runs reached `readyState=complete`, matched the route marker, and returned no captured warning/error console entries.

| Route        | Individual browser checks | Stable DOM state                            | Images | Videos | Scripts | Stylesheets |
| ------------ | ------------------------: | ------------------------------------------- | -----: | -----: | ------: | ----------: |
| `/`          |                       3/3 | H1 `Мебель с душой, созданная поколениями`  |     54 |     21 |      17 |           8 |
| `/catalog`   |                       3/3 | H1 `Мебель под комнату, а не под категорию` |     10 |      8 |      15 |           8 |
| selected PDP |                       3/3 | H1 `Кресло Graphite`                        |      7 |      5 |      16 |           8 |

The selected PDP was reached from a public catalog card href and returned HTTP 200 with its product marker. Public catalog currently exposed 16 products, including Phase 4 fixture-named records; this is observed deployment state only and not a Phase 6C data-cleanup scope.

### Supplemental HTML response probes

Individual runs are retained here; median is the middle value of each three-run series. Values are response timing/HTML transfer observations only.

| Route        | TTFB seconds (runs)          | Median TTFB | Total seconds (runs)         | Median total | Compressed HTML bytes (runs) | Median bytes |
| ------------ | ---------------------------- | ----------: | ---------------------------- | -----------: | ---------------------------- | -----------: |
| `/`          | 0.574976, 0.509746, 0.451204 |    0.509746 | 0.667489, 0.606614, 0.453771 |     0.606614 | 11310, 11261, 11262          |        11262 |
| `/catalog`   | 0.526019, 0.456626, 0.464313 |    0.464313 | 2.268524, 1.728930, 1.724334 |     1.728930 | 11676, 11661, 11660          |        11661 |
| selected PDP | 0.498312, 0.466676, 0.514135 |    0.498312 | 1.850962, 1.817008, 1.870800 |     1.850962 | 9550, 9577, 9560             |         9560 |

Safe headers observed on fresh probes for all three routes: HTTP `200`, `Server: Vercel`, `Content-Type: text/html; charset=utf-8`, `Content-Encoding: gzip`, `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`, `X-Vercel-Cache: MISS`, `Transfer-Encoding: chunked`, and route-correct `X-Matched-Path`. `X-Vercel-Id` varied per request and is retained only as request trace metadata in raw evidence, not treated as stable deployment identity. No stable public deployment commit/build ID was exposed by the checked response metadata.

### Metrics unavailable from selected browser surface

The selected in-app browser's read-only page evaluation exposed `document` but not `window.performance`, `PerformanceObserver`, or `navigator`. Consequently FCP, LCP timing/element from PerformanceEntry, CLS, INP, TBT, actual browser transferred bytes, actual browser request count, waterfall, and cache-cleared state are unavailable. This is an evidence limitation, not a zero value. The plan must preserve an explicit stop/user-decision path if a reproducible source for these metrics would require installing software, external authorization, or a different measurement surface.

## 6. Resource ownership and bottleneck evidence

### Directly observed home resource pressure

- Deployed home DOM after settle: 54 images, 21 videos, 17 scripts, 8 stylesheets.
- Deployed home HTML exposed 31 preload links, including four fonts and broad home image media. Catalog exposed 4 preloads; PDP exposed 8.
- `HeroProductMedia` owns 16 hero video elements with `preload="auto"`, while no hero product is active at initial state. The component later calls `video.load()` when an interaction selects a product, so initial auto-preload is a concrete owner-local scheduling question.
- Local read-only asset inventory: 16 hero MP4 files total `103,076,167` bytes; 12 hero idle/focus images total `4,279,207` bytes. These are repository asset sizes, not a claim that all bytes transferred in a browser run.
- Public HEAD samples confirmed large cacheable hero assets are deployed: `living-room-idle.png` 2,422,566 bytes, `category-sofa.png` 2,631,604 bytes, `category-console.png` 1,990,841 bytes, `materials-room-wide.png` 2,255,183 bytes, `craftsmanship-wide.png` 1,742,126 bytes, `05-ivory-walnut-chair-fixed-alpha.png` 2,476,114 bytes, and `sofa-forward.mp4` 6,918,992 bytes. Sampled assets returned `Cache-Control: public, max-age=0, must-revalidate` and `X-Vercel-Cache: HIT` or `MISS` per request.
- Home below-fold images remain intentional accepted content. Do not delete, replace, or quality-reduce them for synthetic score.

### Server versus browser/resource separation

- Root HTML median TTFB is 0.509746 s and median compressed HTML is 11,262 bytes. This does not prove server is fast under all regions, but it does not identify a dominant HTML-size bottleneck.
- Root is dynamic because shared shop layout performs Auth.js/cookie/cart ownership work; no safe public shared cache is demonstrated.
- Home's most concrete local pressure is initial client media/resource scheduling, especially inactive hero videos with `preload="auto"`; confidence is high for resource-pressure diagnosis, moderate for impact on LCP/first interaction because the selected browser surface could not expose actual request timing or LCP.
- Catalog and PDP have higher total HTML response proxies but different intentional Prisma/data and handoff owners. They are guardrails, not optimization candidates.

## 7. Candidate and no-change decision boundary

One candidate only: a route-local initial hero-video scheduling adjustment owned by `components/evironn/home/hero-product-media.tsx` and its focused state/media tests, if a plan-authorized measurement can confirm unnecessary initial transfer/CPU pressure without harming hover/tap interaction. The exact implementation must be selected by the planner from current code and evidence; no speculative multi-component media rewrite is approved.

Valid no-change outcome: if actual mobile browser metrics/waterfall cannot be obtained reproducibly with existing tools, or if the evidence does not distinguish safe owner-local gain from measurement noise, document the diagnosis, preserve production files, and stop. Do not convert uncertainty into a performance claim.

## 8. Protected files and safety baseline

Protected pre-existing untracked files and hashes captured before planning artifacts:

- `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` — `c9ac4d833e4f0aea2a474115f3aef58ffd04ef0c`.
- `docs/superpowers/plans/phase-2-task-3-execution.md` — `acbeaf76e79ad2ae6dcb3541a306e6af7c80055e`.

Planning artifacts may be created only at the three approved paths plus safe raw evidence under `.superpowers/sdd/phase-6c-baseline/`. Raw evidence must exclude cookies, authorization headers, tokens, secret values, personal data, and full environment dumps. Secret scans must output paths/lines or counts only, never matched values.

## 9. Required planner deliverable

Create exactly one complete executable plan at `docs/superpowers/plans/2026-08-30-phase-6c-performance-resilience.md`. It must derive task count from this evidence, separate baseline measurement from any implementation, include exact files/owners and commands with expected outputs, genuine RED/characterization semantics, focused verification and review boundaries, changed-path allowlist/collector, immutable future implementation baseline, no-change executable path, stop conditions, and explicit Phase 6D exclusions. Do not implement after writing the plan.

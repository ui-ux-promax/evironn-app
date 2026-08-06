# P0 Clean-room Extraction Implementation Plan

> **For implementation workers:** Execute tasks sequentially. Follow test-driven development for behavior and repository contracts. Commit each task after its checks pass.

**Goal:** Produce a clean, verified Vite/React baseline for approved Evironn home and product routes.

**Architecture:** Start with repository contracts and toolchain, then import only the reachable application graph with semantic names and curated assets. Finish with browser smoke coverage and a full repository audit.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Framer Motion 11, Vitest, ESLint, Prettier, Playwright.

## Global Constraints

- Source directories are read-only.
- `design-system.html` is visual authority; approved home/product output must not be redesigned.
- Only `/` and `/product` ship in P0.
- No provenance-bearing project identifiers, reference-site URLs, local absolute paths, captures, generators, screenshots, logs, or experimental routes.
- English Conventional Commits using configured user identity.
- No assistant/tool attribution or co-author trailers.

---

### Task 1: Repository Toolchain and Contracts

**Files:**
- Create: `package.json`, `package-lock.json`, TypeScript/Vite/ESLint/Prettier configs
- Create: `.github/workflows/quality.yml`, `README.md`
- Create: `scripts/check-repository.mjs`
- Create: `tests/repository-contract.test.ts`

**Produces:** Stable script contract and automated repository cleanliness check used by later tasks.

- [ ] Write a failing repository-contract test for required scripts, neutral package metadata, permitted routes, forbidden markers, and ignored build artifacts.
- [ ] Run the test and confirm failure because toolchain files are absent.
- [ ] Add minimal package/config/workflow files and repository audit script.
- [ ] Install dependencies and run repository-contract test until green.
- [ ] Run format-check, lint, and typecheck on the tooling baseline.
- [ ] Commit as `chore: establish project quality gates`.

### Task 2: Approved Application Extraction

**Files:**
- Create: `index.html`, `src/`, curated `public/assets/`
- Create/modify: focused Vitest suites under `tests/`
- Remove from import graph: experimental 3D/360 option pages and unused components

**Consumes:** Script contract and repository audit from Task 1.

**Produces:** Approved `/` and `/product` implementation with semantic project-owned names.

- [ ] Add failing tests for route selection, expected home/product composition, required assets, and absence of experimental routes/provenance identifiers.
- [ ] Run focused tests and confirm expected failures because application code is absent.
- [ ] Copy only reachable application files and exact referenced assets from the read-only source.
- [ ] Rename `GraftFurnitureSections` and related selectors/assets to semantic Evironn names.
- [ ] Rename numbered or provenance-oriented shared component identifiers where they expose implementation history.
- [ ] Remove unused components, test-only routes, old screenshots, logs, generated artifacts, and source documentation.
- [ ] Update tests to Vitest while preserving approved behavior coverage.
- [ ] Run focused tests, repository audit, typecheck, and build.
- [ ] Commit as `refactor: extract approved storefront baseline`.

### Task 3: Browser Gate and Public-tree Audit

**Files:**
- Create: `playwright.config.ts`, `e2e/approved-routes.spec.ts`
- Create: `docs/asset-inventory.md`
- Modify: quality scripts/config only when required by verified failures

**Consumes:** Approved application from Task 2.

**Produces:** Full P0 evidence and documented asset inventory.

- [ ] Add Playwright tests for `/` and `/product` at 390x844, 820x1180, and 1440x900.
- [ ] Confirm tests fail before browser configuration/server wiring exists.
- [ ] Add minimal Playwright configuration and web server wiring.
- [ ] Test route landmarks, product 360 launch, console errors, and horizontal overflow.
- [ ] Record shipped assets, purpose, and known licensing source/status without unsupported claims.
- [ ] Run `npm run gate:full` and inspect complete output.
- [ ] Inspect `git status`, tracked-file list, commit metadata, and forbidden-marker scan.
- [ ] Commit as `test: verify approved storefront baseline`.


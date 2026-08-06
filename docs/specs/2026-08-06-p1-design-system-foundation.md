# P1 Design-System Foundation

## Goal

Create the reusable foundation for Evironn HTML/Vite prototypes without changing the approved visual output of `/` or `/product`.

## Scope

- Extract canonical semantic tokens from the read-only design-system source archive.
- Add a source-only `prototypes/` workspace contract and a typed route registry for all approved future storefront/admin paths.
- Add typed furniture mock-data contracts aligned with the master plan domain contracts.
- Add reusable prototype shell, header, footer, and UI primitives.
- Add automated design-system checks for P1-owned files.
- Preserve existing approved pages and their existing assets, DOM structure, interactions, and route behavior.

## Non-goals

- No catalog, cart, checkout, auth, profile, blog, legal, or admin page implementation.
- No redesign or migration of existing `/` or `/product` components.
- No copy of `design-system.html`, its source assets, screenshots, prompts, logs, or generator artifacts.
- No new visual token values outside the extracted canonical set.
- No backend, Next.js, Prisma, payment, or external service work.

## Design decisions

### Token boundary

Canonical tokens live in `src/design-system/tokens.css` and are exposed with `--ev-ds-*` names. Values come from two explicit source layers: the source token block supplies semantic HSL colors, Golos Text/Fraunces font stacks, 14/20/28/pill radii, documented shadows, and `cubic-bezier(0.32, 0.72, 0, 1)` easing; source specimens supply the 4px-based spacing scale, label/body/price type sizes, button control sizes, spinner linear timing, and focus/outline shadows. Container width and page gutter are compatibility aliases of the approved P0 layout contract, not new brand values. Existing `--ev-*` variables remain available to approved pages; P1-owned code uses only `--ev-ds-*` tokens.

### Prototype boundary

P1-owned source lives under `src/prototypes/`. Top-level `prototypes/README.md` documents that this is a Vite source workspace, not a public route. The existing root Vite entry remains the only shipped entry in P1. Future phase pages can import the foundation without moving approved pages.

### Route registry

`src/prototypes/routes.ts` is the single typed inventory for approved storefront and admin paths. It stores path pattern, area, phase, and implementation status. P1 registers `/` and `/product` as implemented and records later approved paths as planned metadata. `/demo-admin` is rejected by the registry and is never registered.

### Data boundary

`src/prototypes/data/types.ts` owns contracts for categories, products, option groups/values, variants, media, and 360 assets. Fixtures use stable IDs and local asset paths only. Components consume these types; they do not invent product-shaped object literals inline.

### Component boundary

`src/prototypes/ui` owns presentational primitives: `Button`, `Badge`, `Card`, `TextField`, and `StatusMessage`. `src/prototypes/layout` owns `PrototypeShell`, `PrototypeHeader`, and `PrototypeFooter`. Components expose semantic HTML, keyboard operation, visible focus, disabled/loading states, and reduced-motion-safe CSS.

### Audit boundary

`scripts/check-design-system.mjs` scans only P1-owned files: `src/design-system`, `src/prototypes`, and `prototypes`. It rejects raw color literals, non-token radii, shadows, font declarations, transition durations, animation durations, and forbidden route/provenance markers. Token declarations themselves are allowlisted by file path. Existing approved baseline styles are intentionally outside this audit so their output remains unchanged.

## Testing strategy

- Vitest contract tests run before implementation for tokens, route registry, mock-data shape, primitive markup, and audit failures.
- Component tests use `react-dom/server` to verify semantic markup without adding a new test framework.
- Existing P0 Vitest and Playwright suites remain unchanged except formatting normalization required to make the committed quality contract reproducible.
- P1 browser checks verify `/` and `/product` remain green at 390x844, 820x1180, and 1440x900.
- Final `npm run gate:full` is required before phase review.

## Acceptance criteria

1. P1-owned files use canonical `--ev-ds-*` tokens; design-system audit exits zero.
2. Typed route registry lists every approved route and rejects `/demo-admin`.
3. Typed mock data covers category, product, option, variant, media, and 360 contracts.
4. Shared shell and primitives render semantic, accessible markup with explicit loading/error states.
5. Root Vite build remains one shipped entry; no `/demo-admin` or unapproved public route appears.
6. Existing `/` and `/product` output passes unchanged P0 browser coverage.
7. `npm run gate:full` exits zero.

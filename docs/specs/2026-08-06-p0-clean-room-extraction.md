# P0 Clean-room Extraction

## Goal

Create a clean public baseline containing only approved Evironn home and product routes, their reachable code, required assets, tests, and repository tooling.

## Sources

- Visual authority: `C:\Users\010726Admin\Downloads\prototypes-furni\design-system.html`.
- Approved React source: `C:\Users\010726Admin\Downloads\prototypes-furni\.captures\evironn-clone`.
- Destination repository: `D:\Projects\evironn-app`.

Source directories are read-only. No source Git history is imported.

## Routes

- `/` renders approved home.
- `/product` renders approved product page.
- Any other path renders a small not-found state or returns to `/`.
- Experimental `/product-3d` and `/product-360-options` routes do not ship.

## Clean-room rules

- Keep only code reachable from `/` or `/product`.
- Rename provenance-bearing project identifiers to Evironn-owned semantic names.
- Remove old screenshots, logs, handoffs, generators, captures, temporary pages, source maps, and unused assets.
- No references to local absolute paths, reference-site URLs, or external asset hotlinks.
- `framer-motion` is an allowed runtime dependency.
- Third-party package and asset licensing must remain accurate. Unverified assets are recorded for follow-up, not misrepresented.

## Quality contract

Required scripts:

- `format`, `format:check`, `lint`, `typecheck`, `test`, `test:e2e`, `build`, `gate`, `gate:full`.
- `gate` runs format-check, repository audit, lint, typecheck, and Vitest.
- `gate:full` runs gate, build, and Playwright.
- Playwright covers `/` and `/product` at 390x844, 820x1180, and 1440x900, including console errors and horizontal overflow.
- CI runs `gate:full` on pushes and pull requests.

## Git contract

- Feature branch: `prototype/clean-room-baseline`.
- English Conventional Commits.
- User Git identity only.
- No assistant/tool attribution or generated co-author trailers.

## Acceptance criteria

1. Home and product routes match the approved baseline without experimental routes.
2. Every referenced local asset exists; no unreferenced source asset is copied intentionally.
3. Repository audit rejects forbidden internal markers and local paths.
4. `npm run gate:full` exits zero.
5. Public tree contains only product code, required assets, neutral documentation, and repository tooling.

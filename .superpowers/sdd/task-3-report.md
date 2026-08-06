# Task 3: Browser Gate and Public-tree Audit

## Status

Complete. Chromium browser coverage and the full quality gate pass.

## RED evidence

- `npm run test:e2e` before browser wiring failed because Playwright had no config/web server (`Missing script: dev` after config was introduced).
- After config/server wiring, the first browser run failed deterministically because the Chromium executable was not installed. Installing the pinned Playwright Chromium runtime removed that environment-only failure.
- `npm run gate:full` initially exposed two quality issues: the new spec needed Prettier formatting, and Vitest was collecting `e2e/` plus dependency test directories. Formatting and explicit Vitest excludes were the minimal fixes.

## GREEN evidence

- `npm run gate:full`: exit 0; format check, repository audit, ESLint, TypeScript, 44 Vitest tests, Vite build, and Playwright all passed.
- `npm run test:e2e`: 7 tests passed in Chromium.
- `node scripts/check-repository.mjs`: Repository audit passed.
- Public tree inspection found 64 files under `public/assets`; no forbidden markers, local paths, experimental route files, screenshots, logs, or source maps were found.

## Browser matrix

| Route | 390x844 | 820x1180 | 1440x900 |
|---|---:|---:|---:|
| `/` | pass | pass | pass |
| `/product` | pass | pass | pass |

Every matrix case asserted an HTTP-success response, visible `main` and `h1` landmarks, no page errors or error-level console messages, and `scrollWidth <= innerWidth`. The product suite additionally verified the visible 360 launch button, an open accessible dialog, and its accessible close control at 390x844.

## Asset inventory

See [`docs/asset-inventory.md`](../../docs/asset-inventory.md). It lists all 64 shipped public assets with path, format, approximate size, purpose, and provenance/license status. Since no source license records were supplied, each status is explicitly marked `follow-up required`.

## Concerns

- Asset provenance and licensing remain unverified and require owner follow-up before external publication.
- Browser binaries are machine-local Playwright installations; CI must run its normal browser install step.
- Existing development-tool advisories are documented in Task 2 and are outside this browser-gate change.

## Commit

Pending: `test: verify approved storefront baseline`

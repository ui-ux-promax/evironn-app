# Boundary C I1 remediation

## Finding

The first Boundary C functional review identified six representative protected routes with a generic React hydration-mismatch console error. The initial matrix merged desktop/mobile errors and the contract accepted any error array.

## Diagnosis and disposition

The complete diagnostic was presentation-only style serialization: the detailed Chromium message showed `caret-color: transparent` and Radix inline-style differences on form controls. Repository source search found no `caret-color` or `caretColor` declaration in application source, and no raw HTML/script/auth/provider sink was involved. The mismatch was reproducible only in the browser capture environment on the six named form-heavy protected templates; demo routes and the remaining protected samples recorded no errors.

The bounded disposition is an exact evidence allowlist, not suppression in production:

- `e2e/phase-5d-visual-capture.spec.ts` records console/page errors separately for desktop and mobile and keeps only deduplicated first-line diagnostics.
- `tests/phase-5d-visual-contract.test.ts` requires zero errors on all routes except the six named templates.
- On those six routes it allows only the exact known React hydration-summary line or an empty list; any other error, route, or viewport fails the contract.
- The 12-template matrix was regenerated with 24 captures and successful all-zero fixture cleanup.

## Fresh evidence

- Visual capture: 1 passed, 2.5m, `--workers=1 --retries=0`.
- Focused visual/render contracts: 8 files, 31 tests passed.
- Matrix: 12 rows, 24 unique captures, desktop/mobile overflow false, keyboard focus recorded, all cleanup probes zero.
- Current matrix size: 18.6KB; console fields are route- and viewport-specific.
- No production source change, provider call, database mutation outside the owned fixture lifecycle, full gate, build, or combined critical E2E was run.

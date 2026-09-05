# Phase 6C performance baseline

Decision: NO_CHANGE
Measurement surface available: true
Measurement surface reason: none
Playwright package: 1.60.0
Browser version: 148.0.7778.96
Cache identity: comparable across all ten observations
Cold classification: cold candidate; platform cold state unproven

## Conditions

Anonymous Chromium, fresh context per navigation, 390x844 viewport, blocked service workers, disabled cache, 4x CPU slowdown, 150 ms latency, fixed 1.6 Mbps download, fixed 750 Kbps upload, DOMContentLoaded plus 2500 ms endpoint.
No interaction occurred. `readyState` is informational. Neither `load` nor `readyState === "complete"` is required for comparability.

## Route series

### home

Runs: 3; fingerprint consistency: true
TTFB median: 91.5
FCP median: 6272
Observation-window LCP candidate median: 6272
CLS median: 0
TBT median: 1164
Observed bytes median: unavailable
Request starts median: 83

### catalog

Runs: 3; fingerprint consistency: true
TTFB median: 84
FCP median: 2392
Observation-window LCP candidate median: 3608
CLS median: 0.00031452583741812417
TBT median: 1477
Observed bytes median: unavailable
Request starts median: 35

### pdp

Runs: 3; fingerprint consistency: true
TTFB median: 91.29999999701977
FCP median: 2316
Observation-window LCP candidate median: 2316
CLS median: 0
TBT median: 384
Observed bytes median: unavailable
Request starts median: 43

## Diagnosis and scope

Compare TTFB against FCP/LCP and per-group resource ledgers; evidence is observational and does not prove a deployed cause.
Only exact HERO_VIDEO_PATHS request pathnames are attributed to heroProductVideo; owner-local scheduling remains subject to the frozen component contract.
Exact owner request-start median: 16
Exact owner observed-byte median: unavailable
Per-run combined non-owner request starts: [67,67,67]
Per-run combined non-owner bytes: [null,null,null]
Combined non-owner request-start median: 67
Combined non-owner observed-byte median: unavailable
Owner decision evaluation: NO_CHANGE; mode: requestStarts

Task 3: skipped because Candidate Decision Rule did not pass.
Task 4: jump directly to Task 4 closeout on NO_CHANGE; no Task 3 implementation.
Catalog and PDP are regression guardrails only. No deployed after-comparison exists in Phase 6C; Phase 6D owns deployment and comparable public after-measurement.

# Phase 6C Primary Image Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` task-by-task. Use `superpowers:test-driven-development` for the production change, `superpowers:verification-before-completion` before completion claims, and `superpowers:systematic-debugging` only for an unexpected failure. Steps use checkbox syntax.

**Goal:** Measure one owner-local candidate, add native lazy loading to five below-fold editorial images, retain it only when one controlled local before/after gate passes, otherwise restore that owner, complete closeout, and stop candidate progression.

**Architecture:** Reuse the existing dependency-free Phase 6C collector and add only exact five-image accounting, home performance metrics, fixed screenshots, and `/catalog`/selected-PDP guardrails. Use one dedicated Playwright config for one source/viewport-entry regression test. Local `next dev` is controlled diagnostic A/B only; it is not production-like and cannot support a deployed-performance claim.

**Tech Stack:** Next.js 15, React 18.3.1, TypeScript, Node.js built-ins, existing Vitest/Playwright/Chromium, PowerShell, Git.

## Global Constraints

- Work only in `D:\Projects\evironn` on `phase/06-hardening-release` after explicit user approval of this plan.
- Planning baseline is `f2910e3378fa47117df86378aa5c8172ae2755e1`; implementation must record the later approved planning-artifact commit SHA before editing production code.
- Primary production scope is exactly `components/evironn/home/furniture-editorial-sections.tsx`.
- Exact production change is three JSX attribute insertions, `loading="lazy"`, on two category `<img>` templates and one parallax `<img>` template. These templates render exactly five below-fold editorial images.
- No production edit anywhere else. No interactive-card, hero-video, Instagram, nature, benefits, or editorial-statement edit. No fallback ladder, multi-owner selection, owner exclusions, attempt archive, or owner transition.
- One focused regression test only: `e2e/performance/furniture-editorial-lazy.spec.ts`. It covers source invariants and viewport entry for all five exact image nodes.
- `/catalog` and `/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle` are guardrails only. They receive measurement repeats; no code change targets them.
- Every local run uses fresh anonymous Chromium contexts, service workers blocked, disabled browser cache, viewport `390x844`, 4x CPU slowdown, 150 ms latency, 200000 B/s download, 93750 B/s upload, no interaction for metric runs, identical installed Playwright/Chromium versions.
- Local `next dev` at `http://127.0.0.1:3106` is a controlled diagnostic A/B surface only. It is not production-like and cannot make a deployed or production-bundle performance claim. Vercel/public after-measurement remains later authorized scope.
- One comparison consists of three fresh-context home runs before and three after, plus three before and three after runs for each guardrail route. No automatic second candidate or automatic retry cycle exists.
- Retain gate: all six home runs comparable; selected five-image group request-start median reaches metric endpoint with at least one fewer request and at least `50%` reduction; at least one of FCP, observed LCP candidate, or TBT improves by at least `10%`; the other two do not regress by more than `10%`; fixed screenshot/DOM checks show no above-fold visual or hero-readiness regression; both guardrail routes show no median regression greater than `10%` for TTFB, FCP, observed LCP candidate, TBT, CLS, or request starts. Arithmetic uses unrounded medians, lower-is-better improvement `(before - after) / before`, `before > 0`; exact `10%` improvement and `50%` request reduction pass; exact `10%` regression does not reject, greater regression rejects. Zero-to-zero is neutral, zero-to-positive is regression.
- Any missing, non-finite, failed, or incomparable metric fails retain gate. Restore primary owner, preserve evidence, write `PRIMARY_CANDIDATE_REJECTED`, stop candidate progression, complete Task 4 closeout. Newly generated remediation decisions/receipts/reports never use `NO_CHANGE`; historical `NO_CHANGE` text already present in `docs/roadmap/STATUS.md` remains untouched.
- Preserve hero/media behavior, room/product transitions, reduced motion, pointer/keyboard/touch behavior, accessibility names, SEO metadata/schema, cart/auth behavior, and all existing Phase 6A/6B contracts.
- Do not remove assets, lower quality, add dependencies/services, redesign, change shared caching/dynamic rendering, modify providers/auth/security/payments/database/Prisma/schema/migrations/workflows/package/lockfile/Vercel configuration.
- Do not run `npm run build`, `npm run gate`, complete Vitest, broad E2E, deployment, Vercel/public after-measurement, provider/database mutation, push, PR, merge, release closeout, or Phase 6D.
- Do not print secrets, environment values, headers, cookies, authorization data, request/response bodies, storage, personal data, or matched secret text.
- Preserve protected untracked files and exact `git hash-object` values without modification, staging, deletion, or cleanup:
  - `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md` — `c9ac4d833e4f0aea2a474115f3aef58ffd04ef0c`
  - `docs/superpowers/plans/phase-2-task-3-execution.md` — `acbeaf76e79ad2ae6dcb3541a306e6af7c80055e`

## Revised Task Count

Four implementation tasks plus Task 0 approval gate. No task owns another production candidate.

| Task | Owner                                          | Result                                                                              | Commit subject                                                                                              |
| ---- | ---------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 0    | Coordinator                                    | Approval gate; no implementation                                                    | none before approval                                                                                        |
| 1    | Luna High measurement owner                    | Minimal five-image collector extension, config, immutable before evidence           | `test: measure phase 6c primary image candidate`                                                            |
| 2    | Luna High primary owner                        | RED/GREEN source/viewport test and exact three-attribute production edit; no commit | none                                                                                                        |
| 3    | Luna High comparison owner                     | One after measurement; retain or restore only primary owner                         | RETAIN: `perf: defer below-fold editorial images`; REJECT: `docs: record phase 6c primary candidate result` |
| 4    | Luna High closeout owner plus focused reviewer | Guardrails, allowlist, scan, durable report, approval stop                          | `docs: checkpoint phase 6c primary remediation`                                                             |

## Exact Files

- Modify: `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs` — add only five-path accounting, fixed metrics, screenshot/DOM checks, and primary comparison; no generic ownership or fallback machinery.
- Modify: `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs` — focused pure-function tests for five-path accounting and gate arithmetic.
- Create: `.superpowers/sdd/phase-6c-baseline/playwright-phase-6c.config.mjs` — isolated config for the one regression test; ignored path requires `git add -f`.
- Modify only after approval: `components/evironn/home/furniture-editorial-sections.tsx`.
- Create only while candidate retained: `e2e/performance/furniture-editorial-lazy.spec.ts`.
- Create: `.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1`, `implementation-baseline.txt`, `before/summary.json`, `before/summary.md`, `before/raw/home-run-1.json` through `home-run-3.json`, `before/raw/catalog-run-1.json` through `catalog-run-3.json`, `before/raw/pdp-run-1.json` through `pdp-run-3.json`, `before/screenshots/home-00500ms.png`, `home-01500ms.png`, `home-02500ms.png`, `home-05000ms.png`, `home-10000ms.png`, `home-20000ms.png`, `home-30000ms.png`, matching `after/` files, `primary-comparison.json`, `primary-candidate-rejected.json` when rejected, `changed-paths.txt`, and `delivery-report.md`.
- Modify: `.superpowers/sdd/progress.md` and Phase 6C section of `docs/roadmap/STATUS.md`; preserve history and keep Phase 6D pending.
- Never create `owner-selection.json`, `excluded-owners.json`, candidate archives, fallback receipts, or multi-owner reports.

Exact evidence arrays used by collector output and changed-path checks:

```powershell
$BeforeEvidence = @(
  '.superpowers/sdd/phase-6c-remediation/before/summary.json',
  '.superpowers/sdd/phase-6c-remediation/before/summary.md',
  '.superpowers/sdd/phase-6c-remediation/before/raw/home-run-1.json',
  '.superpowers/sdd/phase-6c-remediation/before/raw/home-run-2.json',
  '.superpowers/sdd/phase-6c-remediation/before/raw/home-run-3.json',
  '.superpowers/sdd/phase-6c-remediation/before/raw/catalog-run-1.json',
  '.superpowers/sdd/phase-6c-remediation/before/raw/catalog-run-2.json',
  '.superpowers/sdd/phase-6c-remediation/before/raw/catalog-run-3.json',
  '.superpowers/sdd/phase-6c-remediation/before/raw/pdp-run-1.json',
  '.superpowers/sdd/phase-6c-remediation/before/raw/pdp-run-2.json',
  '.superpowers/sdd/phase-6c-remediation/before/raw/pdp-run-3.json',
  '.superpowers/sdd/phase-6c-remediation/before/screenshots/home-00500ms.png',
  '.superpowers/sdd/phase-6c-remediation/before/screenshots/home-01500ms.png',
  '.superpowers/sdd/phase-6c-remediation/before/screenshots/home-02500ms.png',
  '.superpowers/sdd/phase-6c-remediation/before/screenshots/home-05000ms.png',
  '.superpowers/sdd/phase-6c-remediation/before/screenshots/home-10000ms.png',
  '.superpowers/sdd/phase-6c-remediation/before/screenshots/home-20000ms.png',
  '.superpowers/sdd/phase-6c-remediation/before/screenshots/home-30000ms.png'
)
$AfterEvidence = $BeforeEvidence.ForEach({ $_ -replace '/before/', '/after/' })
```

## Narrow Measurement Contracts

`PRIMARY_IMAGE_TARGETS` is exactly:

```js
[
  '/assets/editorial/images/category-sofa.png',
  '/assets/editorial/images/category-console.png',
  '/assets/editorial/images/category-reading-chair.png',
  '/assets/editorial/images/category-bedside.png',
  '/assets/editorial/images/71c2b8589fc6.png',
];
```

Exact source/alt pairs: `category-sofa.png` / `Светлый диван букле в интерьере`; `category-console.png` / `Дубовая консоль со скульптурным светильником`; `category-reading-chair.png` / `Плетёное кресло в светлом интерьере`; `category-bedside.png` / `Прикроватная тумба в спальне`; `71c2b8589fc6.png` / empty alt. Do not broaden this set.

The collector adds only:

```js
export const PRIMARY_IMAGE_TARGETS;
export function summarizePrimaryImageRun(observation): {
  comparable: boolean;
  reason: string | null;
  requestStarts: number;
  observedBytes: number | null;
  targets: Array<{ pathname: string; requestStarts: number; loading: string | null; viewportClass: 'above-fold' | 'below-fold' | 'crosses-fold'; complete: boolean; naturalWidth: number | null; naturalHeight: number | null }>;
  metrics: { ttfbMs: number | null; fcpMs: number | null; lcpMs: number | null; tbtMs: number | null; cls: number | null };
  visual: { screenshotPaths: string[]; samples: Array<{ timeMs: 500 | 1500 | 2500 | 5000 | 10000 | 20000 | 30000; screenshotWidth: 390; screenshotHeight: 844; screenshotPath: string; screenshotSha256: string }>; aboveFoldBoxes: Array<{ timeMs: 500 | 1500 | 2500 | 5000 | 10000 | 20000 | 30000; selector: 'header' | '#evironn-hero' | '#evironn-hero h1' | '#evironn-hero img' | '#evironn-hero video'; x: number; y: number; width: number; height: number; visibility: string; opacity: string; backgroundColor: string }>; heroReadiness: Array<{ timeMs: 500 | 1500 | 2500 | 5000 | 10000 | 20000 | 30000; ready: boolean }>; };
};
export function comparePrimaryImageRuns(input: {
  homeBefore: ReturnType<typeof summarizePrimaryImageRun>[];
  homeAfter: ReturnType<typeof summarizePrimaryImageRun>[];
  catalogBefore: RouteGuardrailRun[];
  catalogAfter: RouteGuardrailRun[];
  pdpBefore: RouteGuardrailRun[];
  pdpAfter: RouteGuardrailRun[];
}): {
  decision: 'RETAIN' | 'PRIMARY_CANDIDATE_REJECTED';
  reason: string;
  requestReductionFraction: number | null;
  improvements: { fcp: number | null; lcp: number | null; tbt: number | null };
  homeMedians: { before: { requestStarts: number | null; fcpMs: number | null; lcpMs: number | null; tbtMs: number | null }; after: { requestStarts: number | null; fcpMs: number | null; lcpMs: number | null; tbtMs: number | null } };
  guardrails: { catalog: RouteGateResult; pdp: RouteGateResult };
  visual: { comparable: boolean; aboveFoldUnchanged: boolean; heroReadinessUnchanged: boolean; screenshotPairs: Array<{ timeMs: 500 | 1500 | 2500 | 5000 | 10000 | 20000 | 30000; before: string; after: string; beforeSha256: string; afterSha256: string; contentHashMatch: boolean; geometryDeltaPx: number; visibilityMatch: boolean; opacityMatch: boolean; backgroundColorMatch: boolean; heroReadinessMatch: boolean; verdict: 'PASS' | 'FAIL' }>; pass: boolean };
  evidence: { before: string[]; after: string[]; localClassification: 'controlled-local-diagnostic-only' };
};
type RouteGuardrailRun = { comparable: boolean; endpointMs: number; ttfbMs: number | null; fcpMs: number | null; lcpMs: number | null; tbtMs: number | null; cls: number | null; requestStarts: number | null };
type RouteMetricMedians = { ttfbMs: number | null; fcpMs: number | null; lcpMs: number | null; tbtMs: number | null; cls: number | null; requestStarts: number | null };
type RouteGateResult = { comparable: boolean; before: RouteMetricMedians; after: RouteMetricMedians; regressionFractions: { ttfb: number; fcp: number; lcp: number; tbt: number; cls: number; requestStarts: number }; passed: boolean };
```

`comparePrimaryImageRuns()` computes unrounded three-run medians from samples ending at `domContentLoadedEventEnd + 2500 ms`; request starts after that endpoint are excluded. Visual samples occur at exactly `500`, `1500`, `2500`, `5000`, `10000`, `20000`, and `30000 ms`; screenshot dimensions must be `390x844`. Capture each screenshot with Playwright `animations: 'disabled'`, `caret: 'hide'`, and identical masks for `#evironn-hero video` and `#evironn-hero img`, using one fixed opaque mask color. Compute SHA-256 over these stabilized PNG bytes and require `contentHashMatch`; the hashes prove the masked, deterministic screenshot content, not equality of live video frames. Also require every listed above-fold box geometry delta at that same `timeMs` to be at most `1` CSS px, computed visibility/opacity/background-color to match, and every hero-readiness boolean to match. A pair `verdict` is deterministically `PASS` only when all stabilized screenshot, DOM, style, and readiness comparisons pass. It returns `PRIMARY_CANDIDATE_REJECTED` for incomplete/incomparable data, any gate miss, visual/DOM mismatch, request-reduction miss, performance miss, or guardrail regression. It never returns `NO_CHANGE`, `RETRY`, a fallback owner, or an exclusion transition.

---

### Task 0: Approval Gate — no implementation

- [ ] Read `AGENTS.md`, roadmap, `STATUS.md`, `DECISIONS.md`, brief, this plan, and protected-file rules.
- [ ] Verify branch `phase/06-hardening-release`, implementation parent `f2910e3378fa47117df86378aa5c8172ae2755e1`, user Git identity, clean tracked diff, and protected hashes.
- [ ] Obtain explicit user approval. Only after approval may coordinator commit revised planning artifacts and record that commit SHA. Do not start Task 1 before approval.

Expected: no production/test/evidence implementation path changed; no build, gate, E2E, deploy, push, PR, merge, or Phase 6D action.

### Task 1: Minimal Collector Extension and Controlled Before Evidence

**Files:** two existing collector files, dedicated config, before evidence, implementation baseline.

- [ ] **Step 1: Freeze baseline and hashes.** Record approved planning-artifact SHA in `implementation-baseline.txt`; verify both protected `git hash-object` values exactly.
- [ ] **Step 2: Write RED unit contracts.** Test exact five-path accounting, `loading`/viewport/readiness fields, endpoint-bounded request starts, concrete `RouteGuardrailRun` medians, exact `50%` request reduction, exact `10%` improvement, exact `10%` non-rejecting regression, zero-baseline rules, visual mismatch rejection, and incomparable-data rejection as `PRIMARY_CANDIDATE_REJECTED`. No generic owner/fallback/archive/exclusion tests.
- [ ] **Step 3: Add isolated config.** Create ignored `.superpowers/sdd/phase-6c-baseline/playwright-phase-6c.config.mjs` with exact contents:

```js
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: resolve(dirname(fileURLToPath(import.meta.url)), '../../../e2e'),
  testMatch: '**/performance/furniture-editorial-lazy.spec.ts',
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3106',
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: {} }],
});
```

No global setup and no webServer field permitted.

- [ ] **Step 4: Add exact controlled-run wrapper.** Create ignored `.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1` with this complete flow:

```powershell
param([ValidateSet('before','after','red','green')][string]$Action)
$EvidenceRoot = (Resolve-Path '.superpowers/sdd/phase-6c-remediation').Path
$RootPid = $null
function Stop-RecordedTree {
  if ($null -eq $RootPid) { return }
  $Tree = [System.Collections.Generic.HashSet[int]]::new()
  [void]$Tree.Add([int]$RootPid)
  do {
    $Children = @(Get-CimInstance Win32_Process | Where-Object { $Tree.Contains([int]$_.ParentProcessId) -and -not $Tree.Contains([int]$_.ProcessId) })
    foreach ($Child in $Children) { [void]$Tree.Add([int]$Child.ProcessId) }
  } while ($Children.Count -gt 0)
  foreach ($ProcessId in @($Tree | Sort-Object -Descending)) { Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 500
  if (@(Get-CimInstance Win32_Process | Where-Object { $Tree.Contains([int]$_.ProcessId) }).Count -gt 0) { throw 'Phase 6C server process tree did not exit.' }
  if (@(Get-NetTCPConnection -LocalPort 3106 -State Listen -ErrorAction SilentlyContinue).Count -gt 0) { throw 'Phase 6C port 3106 remains occupied.' }
}
try {
  if (@(Get-NetTCPConnection -LocalPort 3106 -State Listen -ErrorAction SilentlyContinue).Count -gt 0) { throw 'Phase 6C port 3106 is already occupied before server start.' }
  $Out = Join-Path $EvidenceRoot "$Action-server.stdout.log"
  $Err = Join-Path $EvidenceRoot "$Action-server.stderr.log"
  $Npm = (Get-Command npm.cmd).Source
  $Server = Start-Process -FilePath $Npm -ArgumentList @('run','dev','--','--hostname','127.0.0.1','--port','3106') -PassThru -WindowStyle Hidden -RedirectStandardOutput $Out -RedirectStandardError $Err
  $RootPid = $Server.Id
  $Deadline = [DateTime]::UtcNow.AddMinutes(3)
  do {
    try { $Ready = (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:3106/assets/products/01-bar-stool-idle.webp' -TimeoutSec 5).StatusCode -eq 200 } catch { $Ready = $false }
    if (-not $Ready) { Start-Sleep -Seconds 2 }
  } until ($Ready -or [DateTime]::UtcNow -ge $Deadline)
  if (-not $Ready) { throw 'Phase 6C local server readiness failed.' }
  if ($Action -in @('before','after')) {
    foreach ($Path in @('/', '/catalog', '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle')) { $null = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3106$Path" -TimeoutSec 60 }
    $Label = $Action
    & node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' '--primary-series' '--label' $Label '--output-root' ".superpowers/sdd/phase-6c-remediation/$Label" '--host' 'http://127.0.0.1:3106'
  } else {
    foreach ($Path in @('/', '/catalog', '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle')) { $null = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3106$Path" -TimeoutSec 60 }
    & npx.cmd --no-install playwright test --config '.superpowers/sdd/phase-6c-baseline/playwright-phase-6c.config.mjs' 'e2e/performance/furniture-editorial-lazy.spec.ts' '--project=chromium'
  }
  if ($LASTEXITCODE -ne 0) { throw "Phase 6C $Action command failed with exit code $LASTEXITCODE." }
} finally { Stop-RecordedTree }
```

The wrapper starts `npm.cmd run dev -- --hostname 127.0.0.1 --port 3106`, polls the static readiness asset until HTTP `200` or 3-minute failure, warms exact routes, runs one exact collector or Playwright command, and tears down the recorded process tree in `finally`. Collector output writes only the exact evidence filenames; wrapper stdout/stderr redirects create only the eight named transient logs, which Task 4 deletes after validation. It has no global setup/webServer and prints no environment value or server log.

- [ ] **Step 5: Run RED and syntax.** Run `node --check '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs'` and `node --check '.superpowers/sdd/phase-6c-baseline/playwright-phase-6c.config.mjs'`. Validate `.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1` without printing its source:

```powershell
$Tokens = $null
$Errors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile(
  (Resolve-Path '.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1').Path,
  [ref]$Tokens,
  [ref]$Errors
)
if ($Errors.Count -ne 0) {
  throw "PowerShell parser found $($Errors.Count) error(s)."
}
```

Then run `node --test '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs'`, which also parses the test module. Expected: syntax checks pass; existing tests pass; new narrow contracts fail only because exports are absent. Runner failure is not RED.

- [ ] **Step 6: Implement narrow collector behavior.** Reuse existing navigation/throttling/request/screenshot primitives. Add CLI `--primary-series --label before --output-root '.superpowers/sdd/phase-6c-remediation/before' --host 'http://127.0.0.1:3106'` and the same command with `--label after --output-root '.superpowers/sdd/phase-6c-remediation/after'`; require the supplied host to be `http://127.0.0.1:3106` for this local diagnostic and route every collector URL through it, rejecting any public/deployed origin. Count only exact five paths through `domContentLoadedEventEnd + 2500 ms`; read five DOM nodes, loading, rect class, readiness, FCP/LCP/TBT/CLS, fixed screenshots. Record exact TTFB/FCP/LCP/TBT/CLS/request starts for catalog/PDP only. Add no CDP ownership graph, source-map/hydration attribution, fallback ranker, archive manager, or generic owner type.
- [ ] **Step 7: Run GREEN focused collector checks.** Run collector tests. Run Prettier only on `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs`, `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs`, and `.superpowers/sdd/phase-6c-baseline/playwright-phase-6c.config.mjs`. Validate `.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1` only with the PowerShell parser command from Step 5; Prettier must not receive the `.ps1` path. Expected: focused checks pass; no generic ownership/fallback symbols added.
- [ ] **Step 8: Capture one controlled before series.** Run `powershell -NoProfile -ExecutionPolicy Bypass -File '.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1' -Action before`; wrapper writes only the exact before filenames listed under Exact Files and labels every summary `controlled-local-diagnostic-only`. No public request.
- [ ] **Step 9: Commit Task 1 evidence.** Define `$Task1Paths = @('.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs', '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs', '.superpowers/sdd/phase-6c-baseline/playwright-phase-6c.config.mjs', '.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1', '.superpowers/sdd/phase-6c-remediation/implementation-baseline.txt') + $BeforeEvidence`; run `git add -f -- $Task1Paths`; verify `@(git diff --cached --name-only | Sort-Object)` equals `@($Task1Paths | Sort-Object)` exactly, protected hashes still match, then commit `test: measure phase 6c primary image candidate`. No production file or focused E2E test is staged.

Expected before evidence: `before/summary.json`, `before/summary.md`, nine named raw route files, seven named home screenshots, exact five-target ledger, route medians, and comparable reason. No public request.

### Task 2: TDD RED/GREEN and Exact Primary Edit

**Files:** `components/evironn/home/furniture-editorial-sections.tsx`; `e2e/performance/furniture-editorial-lazy.spec.ts` while candidate retained.

- [ ] **Step 1: Write one focused source/viewport-entry test.** Read source; assert exact five paths/alts and, after GREEN, exactly three `loading="lazy"` attributes on the two category templates and parallax template. Create the anonymous page with dedicated config; install request listeners and five pathname-specific load promises before `page.goto('/')`; then navigate and inspect all five nodes at `390x844`. Assert lazy attribute, unchanged src/alt, stable dimensions, no pre-scroll request when target is at least twice viewport height. Scroll each target; resolve its already-registered request/load state (accept a request observed during an earlier scroll), assert complete, positive natural dimensions, unchanged alt, no above-fold geometry change. No other owner/media/route.
- [ ] **Step 2: Run RED.** Run `powershell -NoProfile -ExecutionPolicy Bypass -File '.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1' -Action red`. Wrapper starts, readiness-checks, warms, runs exact `npx --no-install playwright test --config '.superpowers/sdd/phase-6c-baseline/playwright-phase-6c.config.mjs' 'e2e/performance/furniture-editorial-lazy.spec.ts' --project=chromium`, tears down in `finally`. Expected: only absent `loading="lazy"` fails; runner/server failure is not RED.
- [ ] **Step 3: Add exact production change.** Insert only `loading="lazy"` into two category `<img>` templates and one parallax `<img>` template. Change no other token.
- [ ] **Step 4: Run GREEN.** Run `powershell -NoProfile -ExecutionPolicy Bypass -File '.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1' -Action green`; wrapper runs the same exact Playwright command. Then run `npx --no-install vitest run 'tests/evironn-home-shell.test.tsx' 'tests/evironn-phase-2a-source-contract.test.ts'` and `npx --no-install prettier --check 'components/evironn/home/furniture-editorial-sections.tsx' 'e2e/performance/furniture-editorial-lazy.spec.ts'`. Expected: one test passes for all five nodes; production diff contains exactly three attribute insertions.

### Task 3: One Controlled After Comparison; Retain or Restore Primary Only

**Files:** before/after evidence, `primary-comparison.json`, `primary-candidate-rejected.json` when rejected, primary production file, focused test conditional on result.

- [ ] **Step 1: Capture one identical after series.** Run `powershell -NoProfile -ExecutionPolicy Bypass -File '.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1' -Action after`; wrapper starts fresh local server, readiness-checks, warms exact routes, runs collector with `--primary-series --label after --output-root '.superpowers/sdd/phase-6c-remediation/after' --host 'http://127.0.0.1:3106'`, tears down in `finally`. Same fixed conditions, three home and guardrail repeats, same screenshots, no public/Vercel request.
- [ ] **Step 2: Compare.** Run `node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --primary-compare --before-root '.superpowers/sdd/phase-6c-remediation/before' --after-root '.superpowers/sdd/phase-6c-remediation/after' --output '.superpowers/sdd/phase-6c-remediation/primary-comparison.json'`. The comparator computes the deterministic screenshot-pair verdict from the recorded boxes, computed styles, hero-readiness booleans, and exact screenshot dimensions before deciding; no later reviewer input is required for gate execution. Write exact fields `{ decision, reason, requestReductionFraction, improvements, homeMedians, guardrails, visual, evidence }`; decision only `RETAIN` or `PRIMARY_CANDIDATE_REJECTED`; local classification exactly `controlled-local-diagnostic-only`.
- [ ] **Step 3: RETAIN.** Proceed only when full gate passes. Run `git add -- 'components/evironn/home/furniture-editorial-sections.tsx' 'e2e/performance/furniture-editorial-lazy.spec.ts'`; run `git add -f -- $AfterEvidence '.superpowers/sdd/phase-6c-remediation/primary-comparison.json'`; compare cached names exactly with the new Task 3 set `{ production path, focused test, $AfterEvidence, primary-comparison.json }`; do not restage Task 1 committed paths. Commit `perf: defer below-fold editorial images`. Task 4 later adds closeout docs and validates cumulative branch paths.
- [ ] **Step 4: PRIMARY_CANDIDATE_REJECTED.** Preserve complete before/after evidence and exact reason. In this task, treat the committed Task 1 blob as authoritative: set `$BaselinePath = '.superpowers/sdd/phase-6c-remediation/implementation-baseline.txt'`; set `$CommittedBaselineText = (& git show ("HEAD:{0}" -f $BaselinePath)).Trim()`; set `$WorkingBaselineText = (Get-Content -Raw $BaselinePath).Trim()`; require `$WorkingBaselineText -eq $CommittedBaselineText`, otherwise stop for tampering. Set `$ImplementationBaseline = $CommittedBaselineText`; require exactly 40 lowercase hex characters and execute `git cat-file -e ("{0}^{commit}" -f $ImplementationBaseline)` before any restore. Restore only `components/evironn/home/furniture-editorial-sections.tsx` from the immutable baseline recorded in `$ImplementationBaseline`; use `git show` for that exact baseline blob, then verify with `$BaselineBlob = (& git rev-parse ("{0}:{1}" -f $ImplementationBaseline, 'components/evironn/home/furniture-editorial-sections.tsx')).Trim()` and `$CurrentBlob = (& git hash-object -- 'components/evironn/home/furniture-editorial-sections.tsx').Trim()`, requiring equality. Confirm the focused test did not exist in the baseline, then delete only the untracked candidate file with `Remove-Item -LiteralPath 'e2e/performance/furniture-editorial-lazy.spec.ts'` after exact path validation; verify it is absent. Write `primary-candidate-rejected.json` with status, owner path, exact reason, evidence arrays, and `nextStep: 'separate evidence/plan cycle required'`. Run `git add -f -- $AfterEvidence '.superpowers/sdd/phase-6c-remediation/primary-comparison.json' '.superpowers/sdd/phase-6c-remediation/primary-candidate-rejected.json'`; compare cached names exactly with `{ $AfterEvidence, primary-comparison.json, primary-candidate-rejected.json }`; the restored production path and deleted focused-test path are intentionally absent because they have no remaining diff. Commit as `docs: record phase 6c primary candidate result`. Stop candidate progression, continue Task 4 closeout. No next candidate, fallback, owner transition, newly generated `NO_CHANGE`, or Phase 6D.

### Task 4: Closeout, Allowlist, Focused Review, Approval Stop

- [ ] **Step 1: Load immutable baseline, outcome, and exact allowlists.** Set `$BaselinePath = '.superpowers/sdd/phase-6c-remediation/implementation-baseline.txt'`; set `$CommittedBaselineText = (& git show ("HEAD:{0}" -f $BaselinePath)).Trim()`; set `$WorkingBaselineText = (Get-Content -Raw $BaselinePath).Trim()`; require `$WorkingBaselineText -eq $CommittedBaselineText`, otherwise stop for tampering. Set `$ImplementationBaseline = $CommittedBaselineText`; require exactly 40 lowercase hex characters and `git cat-file -e "$ImplementationBaseline^{commit}"`. Load `$Decision` from `primary-comparison.json`; require `RETAIN` or `PRIMARY_CANDIDATE_REJECTED`. Execute the exact `$BeforeEvidence` and `$AfterEvidence` definitions above. Before the first changed-path observation, construct the literal eight-path list `before-server.stdout.log`, `before-server.stderr.log`, `after-server.stdout.log`, `after-server.stderr.log`, `red-server.stdout.log`, `red-server.stderr.log`, `green-server.stdout.log`, and `green-server.stderr.log` under `.superpowers/sdd/phase-6c-remediation`; resolve every existing entry, require containment under that exact evidence root, delete only those entries with `Remove-Item -LiteralPath`, and verify all eight are absent. Then define:

```powershell
$CommonPaths = @(
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs',
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs',
  '.superpowers/sdd/phase-6c-baseline/playwright-phase-6c.config.mjs',
  '.superpowers/sdd/phase-6c-remediation/run-controlled-primary.ps1',
  '.superpowers/sdd/phase-6c-remediation/implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-remediation/primary-comparison.json',
  '.superpowers/sdd/phase-6c-remediation/delivery-report.md',
  '.superpowers/sdd/phase-6c-remediation/changed-paths.txt',
  '.superpowers/sdd/progress.md',
  'docs/roadmap/STATUS.md'
) + $BeforeEvidence + $AfterEvidence
$RetainPaths = $CommonPaths + @('components/evironn/home/furniture-editorial-sections.tsx', 'e2e/performance/furniture-editorial-lazy.spec.ts')
$RejectPaths = $CommonPaths + @('.superpowers/sdd/phase-6c-remediation/primary-candidate-rejected.json')
$AllowedPaths = if ($Decision -eq 'RETAIN') { $RetainPaths } else { $RejectPaths }
```

Collect exact tracked, staged, working, and ignored evidence names before closeout; fail on any unexpected non-protected path and, after closeout artifacts exist, require equality with the single final set `@($AllowedPaths + $ProtectedPaths | Sort-Object -Unique)`:

```powershell
$IgnoredOwnedScopes = @(
  '.superpowers/sdd/phase-6c-remediation',
  '.superpowers/sdd/phase-6c-baseline/playwright-phase-6c.config.mjs'
)
$ObservedPaths = @(
  (& git diff --name-only "$ImplementationBaseline..HEAD")
  (& git diff --cached --name-only)
  (& git diff --name-only)
  (& git ls-files --others --exclude-standard)
  (& git ls-files --others --ignored --exclude-standard -- $IgnoredOwnedScopes)
) | Where-Object { $_ } | Sort-Object -Unique
$ProtectedPaths = @('docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md', 'docs/superpowers/plans/phase-2-task-3-execution.md')
$UnexpectedPaths = @($ObservedPaths | Where-Object { $AllowedPaths -notcontains $_ -and $ProtectedPaths -notcontains $_ })
if ($UnexpectedPaths.Count -gt 0) { $UnexpectedPaths | ForEach-Object { Write-Output $_ }; throw 'unexpected path outside exact allowlist' }
```

Task 1 cached set must equal its explicit collector/config/wrapper/before-evidence list. Task 3 RETAIN cached set must equal only new production/test/after/comparison paths; Task 3 REJECT cached set must equal only after/comparison/rejection paths. The rejected production path is restored to baseline and the candidate test is removed, so neither has a remaining diff or belongs in the rejection cache set. Protected Phase 2 files are hash-checked exceptions, never staged. Non-ignored untracked files are collected repo-wide. Ignored files are collected only inside the two exact owned scopes, avoiding unrelated ignored dependencies, caches, local tools, and environment files while still detecting stale or unexpected remediation evidence.

- [ ] **Step 2: Run final focused validation.** Run `node --test '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs'`; run the focused Playwright command only when RETAIN; run existing contracts `npx --no-install vitest run 'tests/evironn-home-shell.test.tsx' 'tests/evironn-phase-2a-source-contract.test.ts'`; when RETAIN, run Prettier on `components/evironn/home/furniture-editorial-sections.tsx` and `e2e/performance/furniture-editorial-lazy.spec.ts`; always run Prettier only on the two collector `.mjs` files and dedicated config `.mjs`; validate the PowerShell wrapper only with the Step 5 parser command; run `git diff --check`. No build/gate/complete Vitest/broad E2E/deploy.
- [ ] **Step 3: Write provisional closeout artifacts.** Write `changed-paths.txt` with selected allowlist plus the exact observed tracked/staged/working/ignored path sets; write `delivery-report.md` with decision, local classification, before/after medians, guardrail medians, deterministic visual result, focused checks, restore proof when rejected, protected hashes, and `reviewStatus: 'pending'`; update only Phase 6C sections of `.superpowers/sdd/progress.md` and `docs/roadmap/STATUS.md`, preserving Phase 6D pending and historical `NO_CHANGE`. Recompute `$ObservedPaths`; require no unexpected non-protected path, but defer final equality until all closeout files exist.
- [ ] **Step 4: Scan and stage provisional closeout.** Set `$OutcomePaths = if ($Decision -eq 'RETAIN') { $RetainPaths } else { $RejectPaths }`; set `$ScanPaths = @($OutcomePaths | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Sort-Object -Unique)` and require no missing path. Run the exact value-free scan below; ripgrep exit `1` means no match, any other execution code fails, and only relative paths print on a hit. Then define `$CloseoutPaths = @('.superpowers/sdd/phase-6c-remediation/changed-paths.txt', '.superpowers/sdd/phase-6c-remediation/delivery-report.md', '.superpowers/sdd/progress.md', 'docs/roadmap/STATUS.md')`; run `git add -f -- $CloseoutPaths`; assert `@(git diff --cached --name-only | Sort-Object)` equals `@($CloseoutPaths | Sort-Object)` exactly. Do not commit yet.

```powershell
$SecretPaths = @()
foreach ($Pattern in @(
  '("(password|secret|token|authorization|cookie|api[_-]?key|private[_-]?key)"\s*:)',
  '(BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,})'
)) {
  $Matches = @(& rg.exe -l -i --hidden --glob '!*.log' $Pattern -- $ScanPaths)
  $RgCode = $LASTEXITCODE
  if ($RgCode -notin @(0, 1)) { throw "value-free secret scan execution failed with code $RgCode" }
  $SecretPaths += $Matches
}
$SecretPaths = @($SecretPaths | Where-Object { $_ } | Sort-Object -Unique)
if ($SecretPaths.Count -gt 0) { $SecretPaths | ForEach-Object { Write-Output $_ }; throw 'value-free secret scan found paths' }
Write-Output 'value-free-secret-scan=0 paths'
```

- [ ] **Step 5: Fresh focused review after staged closeout.** Sol Medium reviewer checks the staged production/test/evidence diff plus provisional closeout artifacts: primary scope, three insertions, one test, one A/B comparison, guardrail-only routes, gate math, deterministic screenshot-content comparison, restore proof, allowlist, hashes, terminology, scan scope, and no-scope-expansion constraints. Record exact verdict and Critical/Important/Minor counts. If any Critical or Important finding remains, stop without commit and require correction plus a fresh review; no implementation begins from this review.
- [ ] **Step 6: Finalize and commit closeout.** After the reviewer records verdict/counts, replace `reviewStatus: 'pending'` with the exact verdict and Critical/Important/Minor counts in `delivery-report.md`; update `changed-paths.txt` with the final observed sets; rerun the outcome-specific scan against all existing `$OutcomePaths`; recompute both protected files with `git hash-object` and require the exact recorded hashes; rerun `git add -f -- $CloseoutPaths`; assert the exact cached set again and require final repo-wide `$ObservedPaths` equality with `$AllowedPaths` plus `$ProtectedPaths`; commit `docs: checkpoint phase 6c primary remediation`. Do not stage production code, focused test, or prior Task 1/3 paths again.
- [ ] **Step 7: User stop.** Update only Phase 6C durable sections. Do not push, PR, merge, deploy, run public after-measurement, or begin Phase 6D. If rejected, stop for separate short evidence/plan cycle.

## Stop Conditions

Stop for protected hash mismatch, wrong identity, unexpected path, failed teardown, missing/incomparable evidence, gate miss, visual/DOM regression, secret scan hit, unrelated production diff, reviewer Critical/Important finding, or scope broadening. Rejection is `PRIMARY_CANDIDATE_REJECTED`, never `NO_CHANGE`.

## Final Handoff

Report revised task count (`4 + Task 0`), exact production/test paths, before/after metrics, guardrail medians, visual result, local diagnostic classification, decision, restore proof when rejected, changed-path ledger, focused checks, reviewer verdict with Critical/Important/Minor counts, protected hashes, secret scan, Git status, and explicit stop before Vercel/public measurement and Phase 6D.

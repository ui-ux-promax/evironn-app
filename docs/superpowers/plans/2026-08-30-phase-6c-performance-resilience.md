# Phase 6C Performance and Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Use superpowers:test-driven-development for the conditional production change, superpowers:systematic-debugging for unexpected results, and superpowers:verification-before-completion before any completion claim. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reproducible anonymous mobile baseline for the public home route, make at most one owner-local hero-video scheduling change when the measured resource evidence satisfies the approved decision rule, and close Phase 6C with bounded evidence without making a deployed-performance claim.

**Architecture:** Measurement and implementation are separate gates. A Playwright-based read-only collector records safe browser timing, resource, request, and LCP-owner evidence for `/`, `/catalog`, and the selected PDP under one fixed mobile protocol; its decision report either authorizes the single `HeroProductMedia` preload change or selects the equally valid no-change path. The conditional implementation changes only inactive home hero-video scheduling and proves the owner contract with a focused source/behavior characterization test; all deployment and comparable public after-measurement work remains in Phase 6D.

**Tech Stack:** Next.js, React, TypeScript, Vitest, existing Playwright installation, Chromium DevTools Protocol, PowerShell, Git.

## Global Constraints

- Work only on branch `phase/06-hardening-release` in `D:\Projects\evironn`.
- The implementation baseline is the future commit checked out after the Phase 6C plan, plan-review corrections, and user approval have been committed. It must not be the pre-plan commit `071807cba8e1c4cfb4185306e9534014107fe3e1`.
- Measure `https://evironn-app.vercel.app/` anonymously. Never send credentials, cookies, authorization headers, environment values, personal data, or mutation requests.
- Optimize `/` only. `/catalog` and `/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle` are regression guardrails, not optimization targets.
- Preserve the accepted visual design, media quality, responsive behavior, keyboard/touch behavior, reduced-motion behavior, accessibility, SEO metadata/schema, authentication, business logic, provider behavior, and all Phase 6A/6B security boundaries.
- Do not change shared caching, dynamic rendering, personalized cart/auth reads, catalog/PDP code, fonts, below-fold media, image quality, dependencies, package files, lockfiles, Prisma/schema/migrations, workflows, Vercel/provider configuration, or protected files.
- Do not run a production build, `npm run gate`, the complete Vitest suite, broad E2E, provider/database operations, deployment, push, pull request, merge, or Phase 6D work.
- Do not install software or browsers. If the existing Playwright package or compatible Chromium executable is unavailable, record that limitation and execute the no-change path.
- Treat the first request after operator-confirmed idle only as a `cold candidate`; never claim a proven Vercel cold start without platform evidence.
- Use three fresh browser contexts per route, `390x844` viewport, one execution host/location, blocked service workers, disabled browser cache, 4x CPU slowdown, 150 ms latency, 1.6 Mbps download, 750 Kbps upload, and the same navigation/settle protocol.
- Browser cache remains disabled, but comparable navigation identity is stable: the default protocol adds no query cache-buster. If measured routing behavior demonstrates that a query cache-buster is necessary, the operator must supply one fixed non-secret value plus its reason and reuse that same value for the cold candidate and every home/catalog/PDP repeat run. Any missing reason, generated/per-run value, or mixed value makes the complete series incomparable and selects `NO_CHANGE`.
- Record the exact installed `@playwright/test` package version and `browser.version()` in every raw observation and both summaries. Every collected run must use identical values; a version mismatch makes the affected series incomparable and selects `NO_CHANGE`.
- Run comparability requires HTTP `200`, the route marker before the fixed `domContentLoadedEventEnd + 2500 ms` endpoint, completion of that exact fixed observation window, and all required Navigation Timing/CDP fields. `document.readyState` is informational only: never require `complete`, wait for `load`, or extend the endpoint.
- Use medians only for comparable three-run series. Report unavailable, noisy, or incomparable values explicitly; never convert missing data into zero or a pass.
- A guardrail passes only when a comparable local proxy shows no regression greater than 10%. If no comparable after-surface exists in Phase 6C, report the guardrail as deferred to Phase 6D instead of claiming a pass.
- Public after-measurement, production build, full gate, broad E2E, deployment, release closeout, push, PR, merge, and deployed-performance claims belong exclusively to Phase 6D.

## File Structure and Ownership

Phase 6C has four independently reviewable tasks because the evidence establishes four ownership boundaries: immutable safety baseline, reproducible measurement and decision, one conditional owner-local implementation, and bounded closeout.

| Path                                                                                     | Task owner                  | Responsibility                                                                                                                                   | Change rule                                                                                   |
| ---------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `.superpowers/sdd/phase-6c-implementation-baseline.txt`                                  | Task 1                      | Immutable SHA of the approved planning-artifact commit                                                                                           | Create once; one lowercase 40-character SHA plus newline                                      |
| `.superpowers/sdd/phase-6c-planning-artifact-manifest.json`                              | Task 1                      | Immutable path/blob manifest for the approved design, planning brief, planner evidence, plan, and any committed Phase 6C plan-review disposition | Create once from the future baseline commit; never derive from the pre-plan HEAD              |
| `.superpowers/sdd/phase-6c-measurement-commit.txt`                                       | Task 2                      | Durable SHA of the original Task 2 measurement-evidence commit                                                                                   | Create immediately after that commit; one lowercase 40-character SHA plus newline             |
| `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs`                           | Task 2                      | Dependency-free RED/GREEN contract for medians, noisy/unavailable series, sanitization, and decisions                                            | Create before collector implementation; run with `node --test`                                |
| `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs`                                | Task 2                      | Anonymous Chromium/CDP collector and deterministic median summarizer                                                                             | Create; no application imports and no mutations                                               |
| `.superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json`                             | Task 2                      | First observed home navigation after operator-confirmed idle                                                                                     | Generated; sanitized JSON                                                                     |
| `.superpowers/sdd/phase-6c-baseline/raw/home-run-1.json` through `home-run-3.json`       | Task 2                      | Individual home observations                                                                                                                     | Generated; sanitized JSON                                                                     |
| `.superpowers/sdd/phase-6c-baseline/raw/catalog-run-1.json` through `catalog-run-3.json` | Task 2                      | Individual catalog guardrails                                                                                                                    | Generated; sanitized JSON                                                                     |
| `.superpowers/sdd/phase-6c-baseline/raw/pdp-run-1.json` through `pdp-run-3.json`         | Task 2                      | Individual PDP guardrails                                                                                                                        | Generated; sanitized JSON                                                                     |
| `.superpowers/sdd/phase-6c-baseline/summary.json`                                        | Task 2                      | Machine-readable conditions, individual values, medians, availability, and uncertainty                                                           | Generated from raw files                                                                      |
| `.superpowers/sdd/phase-6c-baseline/summary.md`                                          | Task 2                      | Human-readable baseline and server-versus-resource diagnosis                                                                                     | Generated from raw files                                                                      |
| `.superpowers/sdd/phase-6c-baseline/decision.md`                                         | Task 2                      | Exact candidate/no-change decision and evidence citations                                                                                        | Create after reviewing generated evidence                                                     |
| `tests/performance/hero-product-media-scheduling.test.ts`                                | Task 3, candidate path only | Characterize existing activation loading and enforce inactive-video preload contract                                                             | Create only after candidate gate passes                                                       |
| `components/evironn/home/hero-product-media.tsx`                                         | Task 3, candidate path only | Existing owner of 16 inactive hero videos                                                                                                        | Change only `preload="auto"` to `preload="none"`; preserve activation `video.load()` behavior |
| `.superpowers/sdd/phase-6c-delivery-report.md`                                           | Task 4                      | Final evidence, decision, checks, review findings, limitations, and Phase 6D handoff                                                             | Create on both candidate and no-change paths                                                  |
| `.superpowers/sdd/phase-6c-changed-paths.txt`                                            | Task 4                      | Exact final changed-path ledger against the immutable implementation baseline                                                                    | Create on both candidate and no-change paths                                                  |
| `.superpowers/sdd/progress.md`                                                           | Task 4                      | Durable agentic progress                                                                                                                         | Modify only Phase 6C section                                                                  |
| `docs/roadmap/STATUS.md`                                                                 | Task 4                      | Project status and explicit approval stop                                                                                                        | Modify only Phase 6C status                                                                   |

No other file is owned by this delivery. Raw evidence may contain request URLs, public resource URLs, status codes, timing numbers, sizes, and the allowlisted safe response-header names listed in Task 2. It must not contain request headers, request bodies, response bodies, `Set-Cookie`, cookies, authorization data, environment data, or personal data.

The Task 2 evidence allowlist is static. Every Task 2-4 exact-set collector and staging command must reuse this exact 15-path array; recursive discovery is permitted only to compare actual directory contents against it, never to define ownership or staging:

```powershell
$ApprovedBaselinePaths = @(
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs',
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs',
  '.superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/summary.json',
  '.superpowers/sdd/phase-6c-baseline/summary.md',
  '.superpowers/sdd/phase-6c-baseline/decision.md'
)
```

## Candidate Decision Rule

Task 3 is authorized only when all following conditions are true in Task 2 evidence:

1. The existing Playwright and Chromium surface runs without installation, login, deployment, provider/database mutation, or secret access.
2. At least two of three complete comparable home runs record one or more pre-interaction request starts whose normalized pathname is in the exact 16-path allowlist derived from every `HERO_PRODUCTS` `forwardSrc` and `reverseSrc` value: `/assets/hero/sofa-forward.mp4`, `/assets/hero/sofa-reverse.mp4`, `/assets/hero/chair-forward.mp4`, `/assets/hero/chair-reverse.mp4`, `/assets/hero/kitchen-dining-forward.mp4`, `/assets/hero/kitchen-dining-reverse.mp4`, `/assets/hero/kitchen-island-forward.mp4`, `/assets/hero/kitchen-island-reverse.mp4`, `/assets/hero/bedroom-chair-forward.mp4`, `/assets/hero/bedroom-chair-reverse.mp4`, `/assets/hero/bedroom-bed-forward.mp4`, `/assets/hero/bedroom-bed-reverse.mp4`, `/assets/hero/terrace-chair-forward.mp4`, `/assets/hero/terrace-chair-reverse.mp4`, `/assets/hero/terrace-sofa-forward.mp4`, or `/assets/hero/terrace-sofa-reverse.mp4`. Query strings and fragments are removed before comparison. No pointer, keyboard, touch, scroll, or programmatic media interaction may occur.
3. Owner contribution is material only when all three complete comparable home runs rank `heroProductVideo` strictly first by observed bytes and median owner bytes exceed the median of the three per-run combined non-owner byte values. For each run, compute combined non-owner bytes by summing every non-owner group in that run before calculating its three-run median; never subtract independently calculated medians. Pass all three complete per-run group ledgers into `decideCandidate`, which performs the ranking, per-run combination, median, and dominance checks itself. This rule is derived from observed owner contribution and peer groups, not an arbitrary byte threshold. `decision.md` must show owner, each non-owner group, per-run combined non-owner, and total values from the same runs. The request-ID ledger accumulates `Network.dataReceived.encodedDataLength`; a later `Network.loadingFinished.encodedDataLength` replaces, rather than adds to, that request's accumulated encoded bytes. A failed or still in-flight request retains its accumulated encoded bytes. Request counts include every `Network.requestWillBeSent` start even when throttling leaves the request failed or incomplete. If byte accounting is unavailable or incomparable for any home run, request-start evidence may decide only when all three runs rank owner request starts strictly first and median owner starts exceed the median of the three per-run combined non-owner request-start values. Any missing run, tie, per-run ranking failure, or median-dominance failure selects `NO_CHANGE`.
4. The collector attributes those exact allowlisted requests to initially inactive video elements in `components/evironn/home/hero-product-media.tsx`; comparison groups separately report document, script, stylesheet, font, image, other video, and other requests/bytes. Evidence does not implicate catalog, PDP, shared layout, authentication, data reads, fonts, image quality, or below-fold accepted media as the selected change owner.
5. The proposed change remains exactly `preload="auto"` to `preload="none"` for video elements in that one owner, while retaining the existing activation-time `video.load()` call.

If any condition is false, unavailable, noisy, or requires new tooling/authorization, Task 2 records `Decision: NO_CHANGE` and Task 3 is skipped. No-change is a successful executable Phase 6C result, not a failure.

---

### Task 1: Freeze the Approved Implementation Baseline and Safety Controls

**Files:**

- Create: `.superpowers/sdd/phase-6c-implementation-baseline.txt`
- Create: `.superpowers/sdd/phase-6c-planning-artifact-manifest.json`
- Protect unchanged: `docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md`
- Protect unchanged: `docs/superpowers/plans/phase-2-task-3-execution.md`

**Interfaces:**

- Consumes: the checked-out future commit containing approved Phase 6C planning artifacts.
- Produces: one immutable SHA plus a baseline-resolved path/blob manifest used by every changed-path, diff, review, and secret-scan command in Tasks 2-4.

- [ ] **Step 0: After explicit user plan approval, create and verify the planning-handoff commit before implementation.**

Do not run this step during planning or before the user explicitly approves the reviewed plan. The coordinator stages the tracked planning paths normally and force-adds ignored SDD evidence. A committed review disposition is optional, but when one exists it must be force-added and verified with the same commit.

Run:

```powershell
$NormalPlanningPaths = @(
  'docs/superpowers/specs/2026-08-30-phase-6c-performance-design.md',
  'docs/superpowers/specs/2026-08-30-phase-6c-planning-brief.md',
  'docs/superpowers/plans/2026-08-30-phase-6c-performance-resilience.md'
)
$PlannerEvidencePath = '.superpowers/sdd/phase-6c-planner-evidence.md'
$ReviewDispositionPaths = @(Get-ChildItem -LiteralPath '.superpowers/sdd' -File | Where-Object {
  $_.Name -match '^phase-6c-.*(plan-review|review-disposition).*\.(md|json|txt)$'
} | ForEach-Object {
  [IO.Path]::GetRelativePath((Get-Location).Path, $_.FullName).Replace('\', '/')
})
if ($ReviewDispositionPaths.Count -gt 1) { throw 'More than one Phase 6C plan-review disposition artifact; planning handoff is ambiguous.' }
$PlanningHandoffPaths = @($NormalPlanningPaths + $PlannerEvidencePath + $ReviewDispositionPaths | Sort-Object -Unique)
foreach ($Path in $PlanningHandoffPaths) {
  if (-not (Test-Path -LiteralPath $Path)) { throw "Missing approved planning artifact: $Path" }
}
$ExpectedCommitPaths = @($PlanningHandoffPaths | Where-Object {
  $Path = $_
  $WorkingBlob = (git hash-object -- $Path).Trim()
  git cat-file -e "HEAD:$Path" 2>$null
  if ($LASTEXITCODE -ne 0) { return $true }
  $HeadBlob = (git rev-parse "HEAD:$Path").Trim()
  $WorkingBlob -ne $HeadBlob
} | Sort-Object -Unique)
if ($ExpectedCommitPaths.Count -eq 0) { throw 'No approved planning-artifact change is available for the future planning commit.' }

git config --get user.name
git config --get user.email
git add -- $NormalPlanningPaths
git add -f -- $PlannerEvidencePath
if ($ReviewDispositionPaths.Count -eq 1) { git add -f -- $ReviewDispositionPaths[0] }
$StagedPlanningPaths = @(git -c core.quotePath=false diff --cached --name-only | Sort-Object -Unique)
$StagedDifference = @(Compare-Object -ReferenceObject $ExpectedCommitPaths -DifferenceObject $StagedPlanningPaths)
if ($StagedDifference.Count -ne 0) {
  $StagedDifference | Format-Table -AutoSize
  throw 'Staged planning paths do not exactly match approved planning handoff.'
}
git commit -m "docs: record phase 6c performance plan"

$ApprovedPlanningCommit = (git rev-parse HEAD).Trim()
$PlanningCommitSubject = (git log -1 --format=%s).Trim()
$CommittedPlanningPaths = @(git -c core.quotePath=false diff-tree --no-commit-id --name-only -r $ApprovedPlanningCommit | Sort-Object -Unique)
$CommittedDifference = @(Compare-Object -ReferenceObject $ExpectedCommitPaths -DifferenceObject $CommittedPlanningPaths)
if ($ApprovedPlanningCommit -notmatch '^[0-9a-f]{40}$') { throw 'Approved planning commit SHA is invalid.' }
if ($PlanningCommitSubject -ne 'docs: record phase 6c performance plan') { throw 'Approved planning commit subject mismatch.' }
if ($CommittedDifference.Count -ne 0) {
  $CommittedDifference | Format-Table -AutoSize
  throw 'Approved planning commit paths do not exactly match planning handoff.'
}
$PlanningHandoffPaths | ForEach-Object { git cat-file -e "${ApprovedPlanningCommit}:$_" }
Write-Output "approved-planning-commit=$ApprovedPlanningCommit"
Write-Output "planning-handoff-commit-paths=$($ExpectedCommitPaths.Count) verified"
Write-Output "planning-handoff-tree-artifacts=$($PlanningHandoffPaths.Count) verified"
```

Expected: identity remains `ui-ux-promax <gojjoy22@gmail.com>`; staged and committed path comparisons are empty; `planning-handoff-commit-paths=` reports the exact changed artifact count; `planning-handoff-tree-artifacts=4 verified` appears without a disposition or `planning-handoff-tree-artifacts=5 verified` with one. The design may already be unchanged in `HEAD`; it is still staged normally and verified in the resulting tree without being falsely required in the new commit diff. Stop before commit if identity differs. Task 1 Step 1 must use this exact checked-out commit as the implementation baseline.

- [ ] **Step 1: Confirm implementation starts from the future approved planning commit.**

Run:

```powershell
$PlanningStart = '071807cba8e1c4cfb4185306e9534014107fe3e1'
$ImplementationBaseline = (git rev-parse HEAD).Trim()
$Branch = (git branch --show-current).Trim()
$Ancestor = (git merge-base --is-ancestor $PlanningStart $ImplementationBaseline); $AncestorExit = $LASTEXITCODE
$RequiredPlanningArtifacts = @(
  'docs/superpowers/specs/2026-08-30-phase-6c-performance-design.md',
  'docs/superpowers/specs/2026-08-30-phase-6c-planning-brief.md',
  '.superpowers/sdd/phase-6c-planner-evidence.md',
  'docs/superpowers/plans/2026-08-30-phase-6c-performance-resilience.md'
)
$MissingPlanningArtifacts = @($RequiredPlanningArtifacts | Where-Object {
  git cat-file -e "${ImplementationBaseline}:$_" 2>$null
  $LASTEXITCODE -ne 0
})
$CommittedReviewDispositionPaths = @(git -c core.quotePath=false ls-tree -r --name-only $ImplementationBaseline | Where-Object {
  $_ -match '(^|/)phase-6c-.*(plan-review|review-disposition).*\.(md|json|txt)$'
})
if ($CommittedReviewDispositionPaths.Count -gt 1) { throw 'More than one committed Phase 6C plan-review disposition artifact; baseline ownership is ambiguous.' }
[pscustomobject]@{
  Branch = $Branch
  Baseline = $ImplementationBaseline
  IsPrePlanHead = ($ImplementationBaseline -eq $PlanningStart)
  RequiredPlanningArtifactsPresent = ($MissingPlanningArtifacts.Count -eq 0)
  ReviewDispositionPath = if ($CommittedReviewDispositionPaths.Count -eq 1) { $CommittedReviewDispositionPaths[0] } else { 'Not committed by workflow' }
  PlanningStartIsAncestor = ($AncestorExit -eq 0)
} | Format-List
```

Expected output:

```text
Branch                  : phase/06-hardening-release
IsPrePlanHead           : False
RequiredPlanningArtifactsPresent : True
PlanningStartIsAncestor : True
```

`Baseline` must match `^[0-9a-f]{40}$` and must differ from `071807cba8e1c4cfb4185306e9534014107fe3e1`. `ReviewDispositionPath` must be either the one committed Phase 6C plan-review disposition artifact or `Not committed by workflow`; when present, it becomes mandatory in the manifest.

Stop if any expected condition is false. The coordinator must obtain the approved planning-artifact commit; it must not substitute the current pre-plan SHA or amend production history.

- [ ] **Step 2: Record the immutable baseline and planning-artifact manifest without rewriting either later.**

Create `.superpowers/sdd/phase-6c-implementation-baseline.txt` from the already validated value:

```powershell
$ImplementationBaseline | Set-Content '.superpowers/sdd/phase-6c-implementation-baseline.txt'
$ManifestPaths = @($RequiredPlanningArtifacts + $CommittedReviewDispositionPaths | Sort-Object -Unique)
$ManifestEntries = @($ManifestPaths | ForEach-Object {
  $Blob = (git rev-parse "${ImplementationBaseline}:$_").Trim()
  if ($Blob -notmatch '^[0-9a-f]{40}$') { throw "Invalid planning-artifact blob SHA: $_" }
  [ordered]@{ path = $_; blob = $Blob }
})
[ordered]@{
  schemaVersion = 1
  baselineCommit = $ImplementationBaseline
  requiredArtifactCount = $RequiredPlanningArtifacts.Count
  reviewDisposition = if ($CommittedReviewDispositionPaths.Count -eq 1) { $CommittedReviewDispositionPaths[0] } else { $null }
  artifacts = $ManifestEntries
} | ConvertTo-Json -Depth 5 | Set-Content '.superpowers/sdd/phase-6c-planning-artifact-manifest.json'
```

Then run:

```powershell
$Recorded = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
if ($Recorded -notmatch '^[0-9a-f]{40}$') { throw 'Phase 6C baseline must be one lowercase 40-character SHA.' }
if ($Recorded -eq '071807cba8e1c4cfb4185306e9534014107fe3e1') { throw 'Pre-plan HEAD is not an implementation baseline.' }
git cat-file -e "${Recorded}^{commit}"
$Manifest = Get-Content -Raw '.superpowers/sdd/phase-6c-planning-artifact-manifest.json' | ConvertFrom-Json
if ($Manifest.baselineCommit -ne $Recorded) { throw 'Planning-artifact manifest baseline mismatch.' }
if ($Manifest.requiredArtifactCount -lt 4) { throw 'Planning-artifact manifest omits a required artifact.' }
foreach ($Artifact in $Manifest.artifacts) {
  git cat-file -e "${Recorded}:$($Artifact.path)"
  $ActualBlob = (git rev-parse "${Recorded}:$($Artifact.path)").Trim()
  if ($ActualBlob -ne $Artifact.blob) { throw "Planning-artifact blob mismatch: $($Artifact.path)" }
}
$RequiredPlanningArtifacts | ForEach-Object {
  if ($_ -notin @($Manifest.artifacts.path)) { throw "Required planning artifact missing from manifest: $_" }
}
if ($CommittedReviewDispositionPaths.Count -eq 1 -and $Manifest.reviewDisposition -ne $CommittedReviewDispositionPaths[0]) { throw 'Committed plan-review disposition missing from manifest.' }
Write-Output "phase6c-baseline=$Recorded"
Write-Output "planning-artifacts=$($Manifest.artifacts.Count) verified"
```

Expected: exit `0`, one `phase6c-baseline=` line followed by the future approved planning commit SHA, and `planning-artifacts=4 verified` when no review-disposition artifact was committed or `planning-artifacts=5 verified` when one was committed.

- [ ] **Step 3: Verify protected files before any delivery work.**

Run:

```powershell
$Protected = @(
  @{ Path = 'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md'; Hash = 'c9ac4d833e4f0aea2a474115f3aef58ffd04ef0c' },
  @{ Path = 'docs/superpowers/plans/phase-2-task-3-execution.md'; Hash = 'acbeaf76e79ad2ae6dcb3541a306e6af7c80055e' }
)
foreach ($Item in $Protected) {
  $Actual = (git hash-object -- $Item.Path).Trim()
  if ($Actual -ne $Item.Hash) { throw "Protected file changed: $($Item.Path)" }
  Write-Output "protected-ok $($Item.Path)"
}
```

Expected:

```text
protected-ok docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md
protected-ok docs/superpowers/plans/phase-2-task-3-execution.md
```

- [ ] **Step 4: Establish the changed-path collector and allowlists.**

Because `.superpowers/sdd/.gitignore` contains `*`, normal diff, status, and untracked commands cannot discover newly created Phase 6C artifacts there. Use this exact collector after every task. Each task supplies its exact `$ExpectedOwnedPaths`; `$ExplicitOwnedIgnoredPaths` must explicitly enumerate every approved ignored path that currently exists. Protected files are pre-existing exceptions only: hash-check them, exclude them from the owned-set comparison, and never stage them.

```powershell
$Baseline = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
$BaselineDiff = @(git -c core.quotePath=false diff --name-only --diff-filter=ACMRTUXB "$Baseline...HEAD")
$StagedDiff = @(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMRTUXB)
$WorkingDiff = @(git -c core.quotePath=false diff --name-only --diff-filter=ACMRTUXB)
$StatusPaths = @(git -c core.quotePath=false status --short --untracked-files=all | ForEach-Object {
  if ($_.Length -lt 4) { return }
  $Path = $_.Substring(3)
  if ($Path -match ' -> ') { $Path = ($Path -split ' -> ', 2)[1] }
  $Path.Trim('"')
})
$ExplicitOwnedIgnoredPaths = @(
  '.superpowers/sdd/phase-6c-implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-planning-artifact-manifest.json'
) | Where-Object { Test-Path -LiteralPath $_ }
$ProtectedExceptions = @(
  'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
  'docs/superpowers/plans/phase-2-task-3-execution.md'
)
$Changed = @($BaselineDiff + $StagedDiff + $WorkingDiff + $StatusPaths + $ExplicitOwnedIgnoredPaths | Where-Object { $_ } | Sort-Object -Unique)
$OwnedChanged = @($Changed | Where-Object { $_ -notin $ProtectedExceptions })
$ExpectedOwnedPaths = @(
  '.superpowers/sdd/phase-6c-implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-planning-artifact-manifest.json'
) | Sort-Object -Unique
$SetDifference = @(Compare-Object -ReferenceObject $ExpectedOwnedPaths -DifferenceObject $OwnedChanged)
if ($SetDifference.Count -ne 0) {
  $SetDifference | Format-Table -AutoSize
  throw 'Changed paths do not exactly match Task 1 executed-path allowlist.'
}
$Changed | ForEach-Object { Write-Output $_ }
```

Task 1 allowlist:

```text
.superpowers/sdd/phase-6c-implementation-baseline.txt
.superpowers/sdd/phase-6c-planning-artifact-manifest.json
```

The two protected untracked paths may appear in `$Changed` because they predate Phase 6C, but they are not members of `$ExpectedOwnedPaths`; their hashes must still match Step 3. Any missing expected path or any unexpected owned path stops the task without deleting, resetting, or cleaning user work.

- [ ] **Step 5: Commit only the baseline record.**

Run:

```powershell
git config --get user.name
git config --get user.email
git add -f -- '.superpowers/sdd/phase-6c-implementation-baseline.txt' '.superpowers/sdd/phase-6c-planning-artifact-manifest.json'
git diff --cached --name-only
git commit -m "docs: record phase 6c implementation baseline"
```

Expected staged paths: exactly `.superpowers/sdd/phase-6c-implementation-baseline.txt` and `.superpowers/sdd/phase-6c-planning-artifact-manifest.json`. `-f` is mandatory because `.superpowers/sdd/.gitignore` contains `*`. Expected commit subject: `docs: record phase 6c implementation baseline`. Stop before commit if identity is not `ui-ux-promax <gojjoy22@gmail.com>`.

**Review boundary:** Coordinator verifies the SHA conditions, protected hashes, two exact staged paths, and commit ownership. No performance conclusion is reviewed in this task.

---

### Task 2: Collect the Reproducible Public Baseline and Make the Candidate Decision

**Files:**

- Create: `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs`
- Create: `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/home-run-1.json`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/home-run-2.json`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/home-run-3.json`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/catalog-run-1.json`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/catalog-run-2.json`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/catalog-run-3.json`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/pdp-run-1.json`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/pdp-run-2.json`
- Create: `.superpowers/sdd/phase-6c-baseline/raw/pdp-run-3.json`
- Create: `.superpowers/sdd/phase-6c-baseline/summary.json`
- Create: `.superpowers/sdd/phase-6c-baseline/summary.md`
- Create: `.superpowers/sdd/phase-6c-baseline/decision.md`
- Create: `.superpowers/sdd/phase-6c-measurement-commit.txt`

**Interfaces:**

- Consumes: immutable baseline SHA from Task 1, existing local `@playwright/test` package and browser executable, public anonymous routes, and Candidate Decision Rule.
- Produces: dependency-free collector contracts, ten individual observations, deterministic medians, availability flags, a server-versus-resource diagnosis, exactly one decision token (`CANDIDATE` or `NO_CHANGE`), and a durable SHA of the original measurement-evidence commit.

- [ ] **Step 1: Preflight existing measurement capability without installing anything.**

Run:

```powershell
node -e "const p=require.resolve('@playwright/test'); console.log('playwright-module=' + p)"
node -e "console.log('playwright-package-version=' + require('@playwright/test/package.json').version)"
npx --no-install playwright --version
```

Expected: all three commands exit `0`; first line resolves a repository-installed module, second records the exact installed `@playwright/test` package version, and third prints the existing CLI version. The collector records the package version from `@playwright/test/package.json` and the launched browser's exact `browser.version()` value; it does not infer either value from free-form CLI output. If any preflight fails or browser launch later reports a missing executable, do not run install commands. Still complete the dependency-free RED/GREEN collector cycle in Steps 2-6, skip network Steps 7-10, run `--unavailable` in Step 11 with reason `existing reproducible browser measurement surface unavailable`, then continue through Task 2 safety, commit, and review.

- [ ] **Step 2: Write dependency-free collector contract tests before implementation.**

Create `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs` using only `node:test` and `node:assert/strict`. Import these exact named exports from `./collect-phase-6c.mjs`: `assertComparableCacheIdentity`, `buildNavigationUrl`, `deriveDeploymentIdentity`, `medianComparable`, `summarizeSeries`, `sanitizeHeaders`, `sanitizePublicUrl`, `summarizeRequestLedger`, and `decideCandidate`. Use the complete dependency-free contract below. It proves stable default and operator-supplied navigation identity, mixed-series rejection, deterministic public-resource deployment fingerprinting, request starts, multiple encoded chunks, completion replacement without double counting, failed/in-flight partial-byte preservation, all-three-run byte ranking, request-start fallback when bytes are unavailable, and rejection for any per-run ranking or median-dominance failure.

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertComparableCacheIdentity,
  buildNavigationUrl,
  decideCandidate,
  deriveDeploymentIdentity,
  medianComparable,
  sanitizeHeaders,
  sanitizePublicUrl,
  summarizeRequestLedger,
  summarizeSeries,
} from './collect-phase-6c.mjs';

const heroVideoPaths = new Set(['/assets/hero/sofa-forward.mp4']);

function homeRun({
  ownerBytes,
  imageBytes,
  scriptBytes,
  ownerStarts = 6,
  imageStarts = 2,
  scriptStarts = 1,
  byteAccountingComparable = true,
}) {
  return {
    byteAccountingComparable,
    groups: {
      heroProductVideo: { observedBytes: ownerBytes, requestStarts: ownerStarts },
      image: { observedBytes: imageBytes, requestStarts: imageStarts },
      script: { observedBytes: scriptBytes, requestStarts: scriptStarts },
    },
  };
}

test('medianComparable sorts a complete three-value series', () => {
  assert.deepEqual(medianComparable([900, 100, 500]), { available: true, value: 500 });
});

test('summarizeSeries rejects incomplete and noisy samples', () => {
  const summary = summarizeSeries([
    { valid: true, comparable: true, value: 100 },
    { valid: false, comparable: false, value: null },
    { valid: true, comparable: false, value: 120 },
  ]);
  assert.equal(summary.comparable, false);
  assert.equal(summary.median.available, false);
  assert.match(summary.reason, /incomplete|noisy/i);
});

test('summarizeSeries preserves unavailable mode', () => {
  const summary = summarizeSeries([
    { valid: false, comparable: false, unavailableReason: 'MEASUREMENT_SURFACE_UNAVAILABLE' },
    { valid: false, comparable: false, unavailableReason: 'MEASUREMENT_SURFACE_UNAVAILABLE' },
    { valid: false, comparable: false, unavailableReason: 'MEASUREMENT_SURFACE_UNAVAILABLE' },
  ]);
  assert.deepEqual(summary.median, {
    available: false,
    reason: 'MEASUREMENT_SURFACE_UNAVAILABLE',
  });
});

test('sanitizers retain only approved headers and public URL fields', () => {
  const blockedAuthorizationHeader = ['author', 'ization'].join('');
  const blockedCookieHeader = ['set', 'cookie'].join('-');
  assert.deepEqual(
    sanitizeHeaders({
      'content-type': 'video/mp4',
      [blockedAuthorizationHeader]: 'forbidden',
      [blockedCookieHeader]: 'forbidden',
    }),
    { 'content-type': 'video/mp4' },
  );
  assert.equal(
    sanitizePublicUrl(
      'https://evironn-app.vercel.app/product/noma-woven-lounge?option=finish%3Awalnut&phase6c_measure=phase6c-fixed-series#private',
    ),
    'https://evironn-app.vercel.app/product/noma-woven-lounge?option=finish%3Awalnut',
  );
});

test('navigation URL has no cache-buster by default and preserves the PDP option', () => {
  assert.equal(buildNavigationUrl('/'), 'https://evironn-app.vercel.app/');
  assert.equal(
    buildNavigationUrl('/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle'),
    'https://evironn-app.vercel.app/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
  );
});

test('one fixed operator cache-buster is reused and mixed series are rejected', () => {
  const fixed = {
    value: 'phase6c-fixed-series',
    reason: 'operator documented stable routing requirement',
  };
  assert.equal(
    buildNavigationUrl('/catalog', fixed),
    'https://evironn-app.vercel.app/catalog?phase6c_measure=phase6c-fixed-series',
  );
  assert.doesNotThrow(() => assertComparableCacheIdentity(Array(10).fill(null)));
  assert.doesNotThrow(() => assertComparableCacheIdentity(Array(10).fill(fixed)));
  assert.throws(
    () => assertComparableCacheIdentity([...Array(9).fill(fixed), { ...fixed, value: 'phase6c-other-series' }]),
    /mixed cache identity/i,
  );
});

test('request ledger counts starts and accumulates multiple encoded chunks', () => {
  const ledger = summarizeRequestLedger(
    [
      {
        method: 'Network.requestWillBeSent',
        requestId: 'owner-1',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4?cache=1',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'owner-1', encodedDataLength: 120 },
      { method: 'Network.dataReceived', requestId: 'owner-1', encodedDataLength: 80 },
    ],
    { heroVideoPaths },
  );
  assert.deepEqual(ledger.groups.heroProductVideo, {
    requestStarts: 1,
    observedBytes: 200,
    completedRequests: 0,
    failedRequests: 0,
    inFlightRequests: 1,
  });
});

test('loadingFinished encoded bytes replace accumulated chunks without double counting', () => {
  const ledger = summarizeRequestLedger(
    [
      {
        method: 'Network.requestWillBeSent',
        requestId: 'owner-1',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'owner-1', encodedDataLength: 120 },
      { method: 'Network.dataReceived', requestId: 'owner-1', encodedDataLength: 80 },
      { method: 'Network.loadingFinished', requestId: 'owner-1', encodedDataLength: 150 },
    ],
    { heroVideoPaths },
  );
  assert.equal(ledger.groups.heroProductVideo.observedBytes, 150);
  assert.equal(ledger.groups.heroProductVideo.completedRequests, 1);
  assert.equal(ledger.groups.heroProductVideo.inFlightRequests, 0);
});

test('failed and in-flight requests preserve partial encoded bytes', () => {
  const ledger = summarizeRequestLedger(
    [
      {
        method: 'Network.requestWillBeSent',
        requestId: 'failed',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'failed', encodedDataLength: 40 },
      { method: 'Network.loadingFailed', requestId: 'failed' },
      {
        method: 'Network.requestWillBeSent',
        requestId: 'in-flight',
        url: 'https://evironn-app.vercel.app/assets/hero/sofa-forward.mp4',
        resourceType: 'Media',
      },
      { method: 'Network.dataReceived', requestId: 'in-flight', encodedDataLength: 60 },
    ],
    { heroVideoPaths },
  );
  assert.equal(ledger.groups.heroProductVideo.requestStarts, 2);
  assert.equal(ledger.groups.heroProductVideo.observedBytes, 100);
  assert.equal(ledger.groups.heroProductVideo.failedRequests, 1);
  assert.equal(ledger.groups.heroProductVideo.inFlightRequests, 1);
});

test('decideCandidate accepts byte evidence only when owner ranks first in all three runs and dominates combined non-owner median', () => {
  const result = decideCandidate({
    homeRuns: [
      homeRun({ ownerBytes: 600, imageBytes: 250, scriptBytes: 100 }),
      homeRun({ ownerBytes: 700, imageBytes: 300, scriptBytes: 120 }),
      homeRun({ ownerBytes: 800, imageBytes: 350, scriptBytes: 140 }),
    ],
    activationLoadPreserved: true,
  });
  assert.equal(result.decision, 'CANDIDATE');
  assert.equal(result.mode, 'observedBytes');
  assert.deepEqual(result.perRunCombinedNonOwner, [350, 420, 490]);
  assert.equal(result.ownerMedian, 700);
  assert.equal(result.combinedNonOwnerMedian, 420);
});

test('decideCandidate uses request-start fallback when byte accounting is unavailable', () => {
  const result = decideCandidate({
    homeRuns: [
      homeRun({ ownerBytes: null, imageBytes: null, scriptBytes: null, byteAccountingComparable: false }),
      homeRun({ ownerBytes: null, imageBytes: null, scriptBytes: null, byteAccountingComparable: false }),
      homeRun({ ownerBytes: null, imageBytes: null, scriptBytes: null, byteAccountingComparable: false }),
    ],
    activationLoadPreserved: true,
  });
  assert.equal(result.decision, 'CANDIDATE');
  assert.equal(result.mode, 'requestStarts');
  assert.deepEqual(result.perRunCombinedNonOwner, [3, 3, 3]);
  assert.equal(result.ownerMedian, 6);
  assert.equal(result.combinedNonOwnerMedian, 3);
});

test('decideCandidate rejects when owner fails strict ranking in any run', () => {
  const result = decideCandidate({
    homeRuns: [
      homeRun({ ownerBytes: 600, imageBytes: 250, scriptBytes: 100 }),
      homeRun({ ownerBytes: 300, imageBytes: 350, scriptBytes: 100 }),
      homeRun({ ownerBytes: 800, imageBytes: 350, scriptBytes: 140 }),
    ],
    activationLoadPreserved: true,
  });
  assert.equal(result.decision, 'NO_CHANGE');
  assert.match(result.reasons.join(' '), /run 2.*rank/i);
});

test('decideCandidate rejects when median owner does not dominate per-run combined non-owner values', () => {
  const result = decideCandidate({
    homeRuns: [
      homeRun({ ownerBytes: 600, imageBytes: 400, scriptBytes: 300 }),
      homeRun({ ownerBytes: 610, imageBytes: 410, scriptBytes: 300 }),
      homeRun({ ownerBytes: 620, imageBytes: 420, scriptBytes: 300 }),
    ],
    activationLoadPreserved: true,
  });
  assert.equal(result.decision, 'NO_CHANGE');
  assert.match(result.reasons.join(' '), /combined non-owner median/i);
});

test('deriveDeploymentIdentity records unavailable build id and deterministic public resource fingerprint', () => {
  const resources = [
    { url: 'https://evironn-app.vercel.app/_next/static/chunks/a.js?x=1', type: 'Script' },
    { url: 'https://evironn-app.vercel.app/_next/static/css/b.css#fragment', type: 'Stylesheet' },
  ];
  const first = deriveDeploymentIdentity(resources, null);
  const reordered = deriveDeploymentIdentity([...resources].reverse(), null);
  const changed = deriveDeploymentIdentity(
    [{ url: 'https://evironn-app.vercel.app/_next/static/chunks/c.js', type: 'Script' }],
    null,
  );
  assert.deepEqual(first.platformBuildId, {
    available: false,
    value: null,
    reason: 'public build identifier not exposed',
  });
  assert.equal(first.resourceFingerprint.algorithm, 'sha256');
  assert.match(first.resourceFingerprint.value, /^[0-9a-f]{64}$/);
  assert.equal(first.resourceFingerprint.value, reordered.resourceFingerprint.value);
  assert.notEqual(first.resourceFingerprint.value, changed.resourceFingerprint.value);
});
```

- [ ] **Step 3: Run collector contracts and verify genuine RED.**

Run:

```powershell
node --test '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs'
```

Expected: exit nonzero because `collect-phase-6c.mjs` or its exact named exports do not exist. A failure caused by missing Node built-ins is not acceptable. Do not weaken assertions.

- [ ] **Step 4: Create the collector with fixed conditions and safe output schema.**

Implement `.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs` with these fixed inputs:

```js
const CONDITIONS = Object.freeze({
  host: 'https://evironn-app.vercel.app',
  viewport: { width: 390, height: 844 },
  runsPerRoute: 3,
  cpuSlowdownMultiplier: 4,
  latencyMs: 150,
  downloadBytesPerSecond: 200000,
  uploadBytesPerSecond: 93750,
  serviceWorkers: 'block',
  waitUntil: 'domcontentloaded',
  observationWindowAfterDomContentLoadedMs: 2500,
  cacheDisabled: true,
  queryCacheBuster: null,
  queryCacheBusterReason: null,
  browser: 'chromium',
});

const ROUTES = Object.freeze([
  { key: 'home', path: '/', marker: 'Мебель с душой, созданная поколениями' },
  { key: 'catalog', path: '/catalog', marker: 'Мебель под комнату, а не под категорию' },
  {
    key: 'pdp',
    path: '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    marker: 'Кресло Graphite',
  },
]);

const SAFE_RESPONSE_HEADERS = new Set([
  'cache-control',
  'content-encoding',
  'content-length',
  'content-type',
  'date',
  'server',
  'transfer-encoding',
  'x-matched-path',
  'x-vercel-cache',
  'x-vercel-id',
]);

const HERO_VIDEO_PATHS = new Set([
  '/assets/hero/sofa-forward.mp4',
  '/assets/hero/sofa-reverse.mp4',
  '/assets/hero/chair-forward.mp4',
  '/assets/hero/chair-reverse.mp4',
  '/assets/hero/kitchen-dining-forward.mp4',
  '/assets/hero/kitchen-dining-reverse.mp4',
  '/assets/hero/kitchen-island-forward.mp4',
  '/assets/hero/kitchen-island-reverse.mp4',
  '/assets/hero/bedroom-chair-forward.mp4',
  '/assets/hero/bedroom-chair-reverse.mp4',
  '/assets/hero/bedroom-bed-forward.mp4',
  '/assets/hero/bedroom-bed-reverse.mp4',
  '/assets/hero/terrace-chair-forward.mp4',
  '/assets/hero/terrace-chair-reverse.mp4',
  '/assets/hero/terrace-sofa-forward.mp4',
  '/assets/hero/terrace-sofa-reverse.mp4',
]);
```

For every navigation, the collector must:

- launch one new Chromium browser and one new context with the fixed viewport and `serviceWorkers: 'block'`;
- create a CDP session, call `Network.enable`, `Network.setCacheDisabled({ cacheDisabled: true })`, `Network.emulateNetworkConditions` with the fixed latency/throughput, and `Emulation.setCPUThrottlingRate({ rate: 4 })`;
- add init-script `PerformanceObserver` collectors for `paint`, `largest-contentful-paint`, `layout-shift`, and `longtask` before navigation;
- build the route URL unchanged by default, retaining the PDP `option` value and adding no `phase6c_measure` parameter; never use clock-derived, random, route-specific, or run-specific navigation identity;
- accept optional `--cache-buster <value> --cache-buster-reason <reason>` only as a pair after the operator has demonstrated and documented why stable query identity is necessary; append exactly `phase6c_measure=<value>` without changing it across the cold candidate or any repeat route/run, store both fields in every raw `conditions` object, and make `assertComparableCacheIdentity` reject any mixed/missing value or reason across all ten observations;
- issue one anonymous `page.goto()` and no pointer, keyboard, touch, scroll, form, storage, or media action;
- after `page.goto(..., { waitUntil: 'domcontentloaded' })`, set the observation endpoint to `domContentLoadedEventEnd + 2500 ms`; require the route marker in an `h1` before that endpoint, wait only the remaining duration to the fixed lifecycle endpoint, then read Navigation Timing, observer state, DOM counts, LCP element/resource, and CDP request/loading data before closing context and browser; if the marker arrives after the endpoint, mark the run invalid/incomparable instead of extending the window; label the resulting LCP only as `observation-window LCP candidate`, because this fixed endpoint does not prove final LCP;
- record `document.readyState` only as informational diagnostic data at the fixed read point; never wait for or require `readyState === 'complete'`, the `load` event, or any post-endpoint state;
- mark a run comparable only when the document response is HTTP `200`, the route marker matched before the fixed endpoint, the collector completed the entire fixed window without extending it, and every required Navigation Timing/CDP field is present and numeric; record each comparability predicate separately in raw evidence;
- record the exact installed `@playwright/test` package version and exact launched `browser.version()` in `conditions`; require the same pair across the cold candidate and all nine repeat runs, and mark any mismatched repeat series incomparable rather than normalizing or ignoring the mismatch;
- record deployment identity without response bodies or private headers: when an exact public build identifier is exposed by a same-origin public response/resource identifier, store it; otherwise store `{ available: false, value: null, reason: "public build identifier not exposed" }`. Independently derive `resourceFingerprint` as lowercase SHA-256 over sorted unique same-origin Script/Stylesheet URL pathnames after removing queries/fragments. Summaries must report per-route repeat-series fingerprint consistency, compare the cold candidate with home repeats, and mark a series incomparable when available fingerprints differ; unavailable identity remains explicit uncertainty, never a fabricated value;
- sanitize response headers through `SAFE_RESPONSE_HEADERS`; never serialize request headers, request/response bodies, cookies, storage, environment values, or console payloads;
- calculate TTFB as `responseStart - requestStart`, FCP from the `first-contentful-paint` entry, observation-window LCP candidate from the last LCP observation before the fixed endpoint, CLS as the sum of layout shifts with `hadRecentInput === false`, and TBT as the sum of `max(0, duration - 50)` for long tasks;
- maintain one request-ID ledger from `Network.requestWillBeSent`, `Network.dataReceived`, `Network.loadingFinished`, and `Network.loadingFailed`; count every request start, accumulate only `Network.dataReceived.encodedDataLength` chunks, replace that accumulated value with `Network.loadingFinished.encodedDataLength` on successful completion, and retain accumulated encoded bytes for failed or still in-flight requests; never add completion bytes to chunk bytes;
- mark that run's byte accounting unavailable/incomparable when required CDP encoded-length fields are absent or non-numeric; never fall back to decoded `dataLength`, and never coerce unavailable bytes to zero;
- classify resources into document, script, stylesheet, font, image, `heroProductVideo`, other video, and other groups; report request-start count and observed bytes for every group and the home total so owner contribution is comparable rather than isolated;
- pass all three complete per-run resource-group ledgers to `decideCandidate`; inside that function derive each run's combined non-owner bytes or request starts before calculating medians, require strict owner-first ranking in every run, reject ties, and reject when median owner does not exceed median per-run combined non-owner contribution;
- record INP as `{ "available": false, "reason": "no interaction is performed by the fixed anonymous navigation protocol" }` rather than zero;
- classify an initial hero-video request only when its query/fragment-free URL pathname is an exact member of `HERO_VIDEO_PATHS` before the collector's settle endpoint;
- write each raw file atomically and generate both summaries solely from the raw files.

The collector must export the nine pure functions consumed by `collect-phase-6c.test.mjs` and import `@playwright/test` only inside cold-candidate and repeat-series execution. Its `--unavailable`, `--summarize`, `--decision`, `--record-no-change-fallback`, and `--validate-existing` modes must run without loading Playwright so the no-tooling and candidate-fallback paths remain executable. `--record-no-change-fallback <code>` must preserve raw observations, set `Decision: NO_CHANGE`, append the exact fallback code/reason to `summary.json`, `summary.md`, and `decision.md`, and regenerate those three files atomically.

Each raw JSON file must use this complete top-level shape:

```json
{
  "schemaVersion": 1,
  "label": "home-run-1",
  "classification": "repeat",
  "capturedAtUtc": "2026-08-30T00:00:00.000Z",
  "conditions": {
    "playwrightPackageVersion": "installed @playwright/test package version",
    "browserVersion": "launched Chromium browser.version()",
    "queryCacheBuster": null,
    "queryCacheBusterReason": null
  },
  "deploymentIdentity": {
    "platformBuildId": {
      "available": false,
      "value": null,
      "reason": "public build identifier not exposed"
    },
    "resourceFingerprint": {
      "available": true,
      "algorithm": "sha256",
      "input": "sorted unique same-origin Script/Stylesheet pathnames without query or fragment",
      "value": "64 lowercase hexadecimal characters"
    }
  },
  "route": {
    "key": "home",
    "requestedPath": "/",
    "finalPublicUrlWithoutCacheBuster": "https://evironn-app.vercel.app/"
  },
  "document": {
    "status": 200,
    "markerMatched": true,
    "readyState": "interactive",
    "readyStateInformationalOnly": true,
    "safeHeaders": {}
  },
  "observationEndpoint": {
    "basis": "domContentLoadedEventEnd",
    "windowMs": 2500,
    "endpointFromNavigationStartMs": 0,
    "actualReadFromNavigationStartMs": 0,
    "markerMatchedBeforeEndpoint": true,
    "fixedWindowCompleted": true
  },
  "comparability": {
    "httpStatus200": true,
    "markerMatchedBeforeEndpoint": true,
    "fixedWindowCompleted": true,
    "requiredTimingFieldsAvailable": true,
    "requiredCdpFieldsAvailable": true,
    "playwrightAndBrowserVersionsMatchSeries": true,
    "comparable": true,
    "reason": null
  },
  "metrics": {
    "ttfbMs": { "available": true, "value": 0 },
    "fcpMs": { "available": true, "value": 0 },
    "lcpObservationWindowCandidateMs": {
      "available": true,
      "value": 0,
      "windowBasis": "domContentLoadedEventEnd",
      "windowMs": 2500,
      "endpointFromNavigationStartMs": 0
    },
    "cls": { "available": true, "value": 0 },
    "tbtMs": { "available": true, "value": 0 },
    "inpMs": { "available": false, "reason": "no interaction is performed by the fixed anonymous navigation protocol" },
    "observedBytes": { "available": true, "value": 0 },
    "requestStarts": { "available": true, "value": 0 }
  },
  "lcpOwner": { "available": true, "tagName": "H1", "selector": "main h1", "resourceUrl": null },
  "dom": { "images": 0, "videos": 0, "scripts": 0, "stylesheets": 0, "preloads": 0 },
  "initialHeroVideos": {
    "requestStarts": 0,
    "observedBytes": 0,
    "completedRequests": 0,
    "failedRequests": 0,
    "inFlightRequests": 0,
    "urls": []
  },
  "resourceGroups": {},
  "resources": [],
  "errors": []
}
```

Numeric zeroes above define types only. Generated values must come from browser/CDP observations; unavailable observations use `{ "available": false, "reason": "specific reason" }`.

- [ ] **Step 5: Run collector contracts and verify GREEN.**

Run:

```powershell
node --test '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs'
```

Expected: exactly fourteen tests pass. This proves stable navigation identity, mixed-series rejection, deterministic public deployment-resource fingerprinting with explicit unavailable build ID, median calculation, incomplete/noisy handling, unavailable mode, header and URL sanitization, request-ledger accounting, all-three-run byte ranking, request-start fallback, and rejection of ranking or dominance failures without Playwright, network access, or new dependencies.

- [ ] **Step 6: Verify collector syntax and output-path confinement before network access.**

Run:

```powershell
node --check '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs'
rg -n --fixed-strings -e 'Set-Cookie' -e 'Authorization' -e 'process.env' -e 'localStorage' -e 'sessionStorage' -e 'request.headers' -e 'postData' -- '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs'
```

Expected: `node --check` exits `0`. `rg` prints no lines and exits `1`. Any match blocks measurement until removed; do not print matched runtime values.

- [ ] **Step 7: Record the cold candidate only after operator-confirmed idle.**

Do not implement a long sleep. The operator starts this command after at least five minutes without requests from this task to the public target:

```powershell
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --cold-candidate
```

This default command sends the route URL with no query cache-buster. If, and only if, prior failed routing evidence demonstrates that a query cache-buster is necessary, run both Step 7 and Step 8 in the same PowerShell session with one fixed operator-supplied value and non-empty reason:

```powershell
$Phase6cFixedCacheBuster = Read-Host 'One fixed non-secret Phase 6C cache-buster reused for all ten observations'
$Phase6cCacheBusterReason = Read-Host 'Measured routing reason requiring this fixed query value'
if ([string]::IsNullOrWhiteSpace($Phase6cFixedCacheBuster) -or [string]::IsNullOrWhiteSpace($Phase6cCacheBusterReason)) {
  throw 'Fixed cache-buster and documented reason are both required.'
}
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --cold-candidate --cache-buster $Phase6cFixedCacheBuster --cache-buster-reason $Phase6cCacheBusterReason
```

Expected output:

```text
wrote .superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json
classification=cold candidate; platform cold state unproven
```

Expected JSON: home route, HTTP `200`, matching H1, safe headers only, and `classification: "cold candidate"`. Stop on authentication, non-200 response, route mismatch, consent/interstitial requirement, or any request for credentials.

- [ ] **Step 8: Run exactly three fresh-context observations per route.**

Run:

```powershell
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --repeat-series
```

Default remains no query cache-buster. When Step 7 used the exceptional fixed operator value, use the same two still-in-scope variables for every route/run:

```powershell
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --repeat-series --cache-buster $Phase6cFixedCacheBuster --cache-buster-reason $Phase6cCacheBusterReason
```

Expected output lists these nine files once each, then prints `repeat-series=9/9 complete`:

```text
home-run-1.json
home-run-2.json
home-run-3.json
catalog-run-1.json
catalog-run-2.json
catalog-run-3.json
pdp-run-1.json
pdp-run-2.json
pdp-run-3.json
```

Each comparable file must report HTTP `200`, `markerMatched: true`, marker match before the fixed endpoint, `fixedWindowCompleted: true`, required timing/CDP fields available, identical Playwright package/browser versions and other conditions, and an empty `errors` array. All ten raw files must contain either `queryCacheBuster: null` plus `queryCacheBusterReason: null`, or the same fixed non-null pair; any mixed identity invalidates every comparable series and selects `NO_CHANGE`. `readyState` may be `interactive` or `complete` and remains informational only. Retry no sample silently. If one run fails, retain it, label the series incomplete/noisy in the summary, and choose `NO_CHANGE` unless all three valid comparable home samples remain.

- [ ] **Step 9: Generate and validate deterministic summaries.**

Run:

```powershell
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --summarize
node -e "const s=require('./.superpowers/sdd/phase-6c-baseline/summary.json'); if(s.schemaVersion!==1||s.routes.home.runs.length!==3||s.routes.catalog.runs.length!==3||s.routes.pdp.runs.length!==3) process.exit(1); console.log('summary-series=3x3 valid');"
```

Expected:

```text
wrote .superpowers/sdd/phase-6c-baseline/summary.json
wrote .superpowers/sdd/phase-6c-baseline/summary.md
summary-series=3x3 valid
```

`summary.json` and `summary.md` must include exact installed Playwright package version and `browser.version()` with an explicit same-version-across-runs check; the default null query-cache-buster fields or one fixed operator value and its documented reason; an explicit all-ten-observations cache-identity check; platform build-ID availability/value-or-reason; each observation's safe public-resource fingerprint; per-route repeat-series fingerprint consistency; cold-candidate versus home-repeat consistency; explicit uncertainty when deployment identity is unavailable; conditions; all individual values; medians for TTFB, FCP, observation-window LCP candidate, CLS, TBT, observed bytes, request starts, exact-owner request starts, and exact-owner observed bytes; INP availability; safe document headers; LCP candidate owner/resource; each run's fixed DCL-relative endpoint and actual read endpoint; each separate comparability predicate; informational `readyState`; DOM counts; per-resource-group bytes/request starts; incomplete/in-flight/failed counts; server-versus-browser/resource diagnosis; public variability; and explicit statements that catalog/PDP are guardrails and no deployed after-comparison exists in Phase 6C. Comparability never depends on `readyState === 'complete'` or the load event. If navigation identities or available deployment-resource fingerprints differ, or the fixed `domContentLoadedEventEnd + 2500 ms` endpoint does not yield a comparable candidate across all three runs, report the affected series unavailable/incomparable rather than final.

- [ ] **Step 10: Apply the exact candidate gate.**

Run:

```powershell
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --decision
Get-Content '.superpowers/sdd/phase-6c-baseline/decision.md'
```

Expected first line is exactly one of:

```text
Decision: CANDIDATE
```

```text
Decision: NO_CHANGE
```

For `CANDIDATE`, the document must cite individual home runs satisfying Conditions 2-4; HTTP `200`, marker-before-endpoint, fixed-window completion, required timing/CDP-field availability, identical exact Playwright package/browser versions, and informational-only `readyState`; exact matched `HERO_VIDEO_PATHS`; each complete per-run group ledger passed to `decideCandidate`; owner request starts and observed bytes including failed/in-flight requests; every other initial resource group's per-run values; each run's combined non-owner and total values; medians calculated from those three per-run combined values; owner percentage contribution; proof owner ranks strictly first in every run and exceeds combined non-owner median under the selected byte or request-start mode; exact owner `components/evironn/home/hero-product-media.tsx`; exact conditional change; and absence of evidence supporting any broader change. It must state that neither `load` nor `readyState === 'complete'` is a comparability requirement.

For `NO_CHANGE`, the document must identify each unmet condition, retain the owner-local scheduling diagnosis as uncertain when applicable, state that no application production file or application test outside the measurement-evidence directory will change, and jump directly to Task 4.

- [ ] **Step 11: Execute the no-tooling no-change fallback when the collector cannot run.**

If Step 1 or browser launch fails, create the ten raw files as unavailable records with the same schema, each containing an empty safe-header object, no resources, no URLs beyond the public route, and one error code `MEASUREMENT_SURFACE_UNAVAILABLE` with no raw stack or environment output. Generate summaries that state all browser metrics unavailable and preserve the existing supplemental HTML observations from the approved planner evidence as context, not as replacement mobile measurements. Set `decision.md` first line to `Decision: NO_CHANGE` and reason to `existing reproducible browser measurement surface unavailable`.

Run:

```powershell
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --unavailable 'existing reproducible browser measurement surface unavailable'
node -e "const s=require('./.superpowers/sdd/phase-6c-baseline/summary.json'); if(s.decision!=='NO_CHANGE'||s.measurementSurface.available!==false) process.exit(1); console.log('no-change-fallback=valid');"
```

Expected: collector lists all ten unavailable raw files, writes both summaries and `decision.md`, then validation prints `no-change-fallback=valid`.

- [ ] **Step 12: Run value-free secret and safety scans.**

Run:

```powershell
$ScanRoots = @('.superpowers/sdd/phase-6c-baseline')
$SensitiveKeyPattern = '^(?i:authorization|set-cookie|cookie|password|secret|token|api[_-]?key)$'
$SensitiveAssignmentPattern = '(?im)^\s*(?:authorization|set-cookie|cookie|password|secret|token|api[_-]?key)\s*[:=]\s*(?:["''][^"'']+["'']|[^\s#][^\r\n#]*)'
$PrivateKeyPattern = '-----BEGIN (?:[A-Z0-9][A-Z0-9 -]* )?PRIVATE KEY(?: BLOCK)?-----'
function Test-SensitiveJsonKey([object]$Value) {
  if ($null -eq $Value) { return $false }
  if ($Value -is [System.Collections.IDictionary]) {
    foreach ($Key in $Value.Keys) {
      if ([string]$Key -match $SensitiveKeyPattern) { return $true }
      if (Test-SensitiveJsonKey $Value[$Key]) { return $true }
    }
    return $false
  }
  if ($Value -is [System.Collections.IEnumerable] -and $Value -isnot [string]) {
    foreach ($Item in $Value) { if (Test-SensitiveJsonKey $Item) { return $true } }
  }
  return $false
}
$ScanFiles = @($ScanRoots | ForEach-Object {
  if (Test-Path -LiteralPath $_ -PathType Container) {
    Get-ChildItem -LiteralPath $_ -File -Recurse
  } elseif (Test-Path -LiteralPath $_ -PathType Leaf) {
    Get-Item -LiteralPath $_
  } else {
    throw "Secret scan root missing: $_"
  }
} | Sort-Object FullName -Unique)
$ViolatingPaths = @($ScanFiles | ForEach-Object {
  $RelativePath = [IO.Path]::GetRelativePath((Get-Location).Path, $_.FullName).Replace('\', '/')
  $Raw = [IO.File]::ReadAllText($_.FullName)
  if ($_.Extension -ieq '.json') {
    try { $Json = $Raw | ConvertFrom-Json -AsHashtable -Depth 100 } catch { throw "Secret scan JSON parse failed: $RelativePath" }
    $Violates = Test-SensitiveJsonKey $Json
  } else {
    $Violates = ($Raw -match $PrivateKeyPattern -or $Raw -match $SensitiveAssignmentPattern)
  }
  if ($Violates) { $RelativePath }
} | Sort-Object -Unique)
if ($ViolatingPaths.Count -ne 0) {
  $ViolatingPaths | ForEach-Object { Write-Output $_ }
  throw 'Potential secret-bearing path found; inspect locally without printing values.'
}
Write-Output 'secret-scan=0 paths'
```

Expected: `secret-scan=0 paths`. JSON files are parsed and inspected by key only, detecting case-insensitive quoted keys named `authorization`, `set-cookie`, `cookie`, `password`, `secret`, `token`, `api_key`, or `api-key` without inspecting JSON values. Non-JSON artifacts are checked for private-key markers and sensitive assignment syntax. On failure it prints relative path names only, never keys, matched text, or values.

- [ ] **Step 13: Verify changed paths and protected hashes.**

Run this exact Task 2 collector:

```powershell
$Baseline = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
$ApprovedBaselinePaths = @(
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs',
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs',
  '.superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/summary.json',
  '.superpowers/sdd/phase-6c-baseline/summary.md',
  '.superpowers/sdd/phase-6c-baseline/decision.md'
)
$ActualBaselinePaths = @(Get-ChildItem -LiteralPath '.superpowers/sdd/phase-6c-baseline' -File -Recurse | ForEach-Object {
  [IO.Path]::GetRelativePath((Get-Location).Path, $_.FullName).Replace('\', '/')
} | Sort-Object -Unique)
$BaselineContentDifference = @(Compare-Object -ReferenceObject $ApprovedBaselinePaths -DifferenceObject $ActualBaselinePaths)
if ($BaselineContentDifference.Count -ne 0) {
  $BaselineContentDifference | Format-Table -AutoSize
  throw 'Phase 6C baseline directory contents differ from the static 15-path allowlist.'
}
$BaselineDiff = @(git -c core.quotePath=false diff --name-only --diff-filter=ACMRTUXB "$Baseline...HEAD")
$StagedDiff = @(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMRTUXB)
$WorkingDiff = @(git -c core.quotePath=false diff --name-only --diff-filter=ACMRTUXB)
$StatusPaths = @(git -c core.quotePath=false status --short --untracked-files=all | ForEach-Object {
  if ($_.Length -lt 4) { return }
  $Path = $_.Substring(3)
  if ($Path -match ' -> ') { $Path = ($Path -split ' -> ', 2)[1] }
  $Path.Trim('"')
})
$ExplicitOwnedIgnoredPaths = @(
  '.superpowers/sdd/phase-6c-implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-planning-artifact-manifest.json',
  $ApprovedBaselinePaths
) | Where-Object { Test-Path -LiteralPath $_ }
$ProtectedExceptions = @(
  'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
  'docs/superpowers/plans/phase-2-task-3-execution.md'
)
$Changed = @($BaselineDiff + $StagedDiff + $WorkingDiff + $StatusPaths + $ExplicitOwnedIgnoredPaths | Where-Object { $_ } | Sort-Object -Unique)
$OwnedChanged = @($Changed | Where-Object { $_ -notin $ProtectedExceptions })
$ExpectedOwnedPaths = @(
  '.superpowers/sdd/phase-6c-implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-planning-artifact-manifest.json',
  $ApprovedBaselinePaths
) | Sort-Object -Unique
$SetDifference = @(Compare-Object -ReferenceObject $ExpectedOwnedPaths -DifferenceObject $OwnedChanged)
if ($SetDifference.Count -ne 0) {
  $SetDifference | Format-Table -AutoSize
  throw 'Changed paths do not exactly match Task 2 executed-path allowlist.'
}
$Changed | ForEach-Object { Write-Output $_ }
```

Expected: both exact-set comparisons are empty; recursive actual contents equal the static 15 approved paths with no extra or missing file; changed paths contain only Task 1 plus those exact Task 2 paths and the two protected pre-existing exceptions. Repeat Task 1 Step 3 and expect both `protected-ok` lines. Any production, test, package, lockfile, Prisma, workflow, Vercel, provider, status, progress, or unexpected baseline-directory path stops Task 2.

- [ ] **Step 14: Commit measurement evidence, then durably record its exact SHA.**

Run:

```powershell
git config --get user.name
git config --get user.email
$ApprovedBaselinePaths = @(
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs',
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs',
  '.superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/summary.json',
  '.superpowers/sdd/phase-6c-baseline/summary.md',
  '.superpowers/sdd/phase-6c-baseline/decision.md'
)
$ActualBaselinePaths = @(Get-ChildItem -LiteralPath '.superpowers/sdd/phase-6c-baseline' -File -Recurse | ForEach-Object {
  [IO.Path]::GetRelativePath((Get-Location).Path, $_.FullName).Replace('\', '/')
} | Sort-Object -Unique)
if (@(Compare-Object -ReferenceObject $ApprovedBaselinePaths -DifferenceObject $ActualBaselinePaths).Count -ne 0) {
  throw 'Refusing to stage: baseline directory contents differ from static 15-path allowlist.'
}
git add -f -- $ApprovedBaselinePaths
git diff --cached --name-only
$StagedEvidencePaths = @(git -c core.quotePath=false diff --cached --name-only | Sort-Object -Unique)
if (@(Compare-Object -ReferenceObject $ApprovedBaselinePaths -DifferenceObject $StagedEvidencePaths).Count -ne 0) {
  throw 'Measurement evidence staging does not exactly equal the static 15-path allowlist.'
}
git commit -m "test: capture phase 6c performance baseline"

$MeasurementCommit = (git rev-parse HEAD).Trim()
if ($MeasurementCommit -notmatch '^[0-9a-f]{40}$') { throw 'Measurement commit SHA unavailable.' }
$MeasurementSubject = (git log -1 --format=%s $MeasurementCommit).Trim()
if ($MeasurementSubject -ne 'test: capture phase 6c performance baseline') { throw 'Measurement commit subject mismatch.' }
$MeasurementPaths = @(git -c core.quotePath=false diff-tree --no-commit-id --name-only -r $MeasurementCommit | Sort-Object -Unique)
if (@(Compare-Object -ReferenceObject $ApprovedBaselinePaths -DifferenceObject $MeasurementPaths).Count -ne 0) {
  throw 'Measurement commit paths do not exactly equal the static 15-path allowlist.'
}
$PlanningBaseline = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
git merge-base --is-ancestor $PlanningBaseline $MeasurementCommit
if ($LASTEXITCODE -ne 0) { throw 'Measurement commit is not a descendant of the planning baseline.' }
git merge-base --is-ancestor $MeasurementCommit HEAD
if ($LASTEXITCODE -ne 0) { throw 'Measurement commit is not an ancestor of HEAD.' }
$MeasurementCommit | Set-Content '.superpowers/sdd/phase-6c-measurement-commit.txt'
git add -f -- '.superpowers/sdd/phase-6c-measurement-commit.txt'
$ReceiptStagedPaths = @(git -c core.quotePath=false diff --cached --name-only)
if ($ReceiptStagedPaths.Count -ne 1 -or $ReceiptStagedPaths[0] -ne '.superpowers/sdd/phase-6c-measurement-commit.txt') {
  throw 'Measurement receipt staging mismatch.'
}
git commit -m "docs: record phase 6c measurement commit"

$RecordedMeasurementCommit = (Get-Content -Raw '.superpowers/sdd/phase-6c-measurement-commit.txt').Trim()
if ($RecordedMeasurementCommit -ne $MeasurementCommit) { throw 'Measurement receipt SHA mismatch.' }
git cat-file -e "${RecordedMeasurementCommit}^{commit}"
Write-Output "measurement-evidence-commit=$RecordedMeasurementCommit"
```

Expected: first commit has exact subject `test: capture phase 6c performance baseline`, stages exactly the static 15 approved baseline paths, never the directory, is a descendant of the immutable planning baseline, and is an ancestor of `HEAD`; recursive actual contents, staged paths, and committed paths each equal the static array with no extra or missing path. Second commit stages only `.superpowers/sdd/phase-6c-measurement-commit.txt`; final output reports the first commit's exact 40-character SHA. `-f` is mandatory because `.superpowers/sdd/.gitignore` contains `*`. Stop before either commit if identity differs from `ui-ux-promax <gojjoy22@gmail.com>`.

**Review boundary:** One fresh Sol Medium reviewer receives only the two Task 2 commit diffs, approved measurement conditions, Candidate Decision Rule, and compact route-owner evidence. Reviewer checks reproducibility, safe output schema, encoded-byte replacement semantics, failed/in-flight preservation, all-three-run ranking, per-run combined non-owner medians, decision determinism, durable measurement SHA, anonymous/read-only behavior, and scope. Critical or Important findings return to Task 2 ownership and block Task 3. Reviewer does not rerun a full gate, build, broad E2E, provider operation, or deployment.

**Task 2 blocking-review remediation procedure:** The Task 2 owner may edit only the static 15 `$ApprovedBaselinePaths`; `.superpowers/sdd/phase-6c-measurement-commit.txt` remains the immutable receipt for the original evidence commit. Apply the exact findings, then rerun `node --check`, all fourteen dependency-free collector tests, `--validate-existing`, Task 2 Step 12 secret scan, Task 2 Step 13 static content/changed-path checks, and Prettier check for every changed approved baseline path. Stage only through the exact static array and reject any staged path outside it:

```powershell
$ApprovedBaselinePaths = @(
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs',
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs',
  '.superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/summary.json',
  '.superpowers/sdd/phase-6c-baseline/summary.md',
  '.superpowers/sdd/phase-6c-baseline/decision.md'
)
git add -f -- $ApprovedBaselinePaths
$Task2RemediationStaged = @(git -c core.quotePath=false diff --cached --name-only | Sort-Object -Unique)
if ($Task2RemediationStaged.Count -eq 0 -or @($Task2RemediationStaged | Where-Object { $_ -notin $ApprovedBaselinePaths }).Count -ne 0) {
  throw 'Task 2 remediation staging is empty or outside the exact static allowlist.'
}
git commit -m "test: remediate phase 6c measurement review"
$Task2RemediationCommit = (git rev-parse HEAD).Trim()
if ($Task2RemediationCommit -notmatch '^[0-9a-f]{40}$') { throw 'Task 2 remediation SHA unavailable.' }
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'Staged diff remains after Task 2 remediation commit.' }
git diff --quiet
if ($LASTEXITCODE -ne 0) { throw 'Working diff remains after Task 2 remediation commit.' }
Write-Output "task2-remediation=$Task2RemediationCommit"
```

Record every Task 2 remediation SHA for Task 4. Re-review only after staged and working diffs are empty. No Task 3 work may start while a blocking Task 2 finding remains.

---

### Task 3: Conditionally Change Initial Home Hero-Video Scheduling

**Entry condition:** `.superpowers/sdd/phase-6c-baseline/decision.md` begins `Decision: CANDIDATE`, Task 2 review has no unresolved Critical or Important findings, and every Candidate Decision Rule condition is evidenced. Otherwise skip this task without creating either owned file.

**Files:**

- Create: `tests/performance/hero-product-media-scheduling.test.ts`
- Modify: `components/evironn/home/hero-product-media.tsx`

**Interfaces:**

- Consumes: existing TSX `<video>` elements, their current `preload="auto"` values, and existing activation-time `video.load()` behavior.
- Produces: inactive hero videos advertise `preload="none"`; existing active selection still invokes `video.load()` and existing playback/state behavior remains owned by the component.

- [ ] **Step 1: Write a characterization test for the existing activation contract.**

Create `tests/performance/hero-product-media-scheduling.test.ts` with the existing TypeScript compiler API, not a regular expression over JSX. The AST parser must see the complete self-closing `<video />` node even when `ref`, `className`, `src`, and event handlers contain nested JSX expressions and braces. Use this contract:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { HERO_PRODUCT_IDS } from '../../components/evironn/home/hero-product-state';

const ownerPath = resolve(process.cwd(), 'components/evironn/home/hero-product-media.tsx');
const ownerSource = readFileSync(ownerPath, 'utf8');
const normalizedOwnerSource = ownerSource.replace(/\r\n/g, '\n');
const sourceFile = ts.createSourceFile(ownerPath, ownerSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const videoBlocks: ts.JsxSelfClosingElement[] = [];
const loadCalls: ts.CallExpression[] = [];
function visit(node: ts.Node) {
  if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(sourceFile) === 'video') {
    videoBlocks.push(node);
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText(sourceFile) === 'video' &&
    node.expression.name.text === 'load'
  ) {
    loadCalls.push(node);
  }
  ts.forEachChild(node, visit);
}
visit(sourceFile);

function preloadValues() {
  return videoBlocks.flatMap((block) =>
    block.attributes.properties.flatMap((attribute) => {
      if (!ts.isJsxAttribute(attribute) || attribute.name.getText(sourceFile) !== 'preload') return [];
      if (!attribute.initializer || !ts.isStringLiteral(attribute.initializer)) return [];
      return [attribute.initializer.text];
    }),
  );
}

describe('HeroProductMedia scheduling contract', () => {
  it('keeps explicit activation-time media loading in the owner', () => {
    expect(videoBlocks).toHaveLength(1);
    expect(HERO_PRODUCT_IDS).toHaveLength(8);
    expect(videoBlocks.length * HERO_PRODUCT_IDS.length * 2).toBe(16);
    expect(preloadValues()).toHaveLength(1);
    expect(loadCalls).toHaveLength(1);
    expect(normalizedOwnerSource).toContain("(['forward', 'reverse'] as const).map");
    expect(normalizedOwnerSource).toContain('const video = videoRefs.current[key];');
    expect(normalizedOwnerSource).toContain(
      "video.addEventListener('loadeddata', revealAndPlay, { once: true });\n      video.load();",
    );
    expect(videoBlocks[0].getText(sourceFile)).toContain(
      "src={direction === 'forward' ? product.forwardSrc : product.reverseSrc}",
    );
  });
});
```

This is a characterization, not a fabricated RED test: it must pass before implementation. Exact AST counts prove one JSX video template expands over eight products and two directions to sixteen elements; the owner-specific source assertions tie deferred preload safety to the actual `videoRefs.current[key]` activation branch and its existing `loadeddata` listener followed by `video.load()`.

- [ ] **Step 2: Run the characterization and verify green baseline semantics.**

Run:

```powershell
npx --no-install vitest run 'tests/performance/hero-product-media-scheduling.test.ts' -t 'keeps explicit activation-time media loading in the owner'
```

Expected: one test passes before implementation. If it fails because AST counts, the 16-element expansion, or actual owner activation-time `.load()` contract differs, execute the Task 3 fallback procedure below. Do not invent a new interaction mechanism.

- [ ] **Step 3: Add the genuine RED scheduling assertion.**

Extend the same `describe` block with:

```ts
it('does not preload inactive hero videos before activation', () => {
  expect(videoBlocks).toHaveLength(1);
  expect(preloadValues()).toEqual(['none']);
});
```

- [ ] **Step 4: Run the scheduling assertion and verify the expected RED failure.**

Run:

```powershell
npx --no-install vitest run 'tests/performance/hero-product-media-scheduling.test.ts' -t 'does not preload inactive hero videos before activation'
```

Expected: one test fails with received preload values `['auto']`. If it passes before implementation, deployed evidence and checked-out owner differ; execute the Task 3 fallback procedure and do not edit production code.

**Task 3 candidate-to-no-change fallback ownership:** Task 3 owns every fallback discovered by characterization, RED, focused verification, or Task 3 review. Final no-change state must restore `components/evironn/home/hero-product-media.tsx` exactly from the immutable implementation-baseline blob and must omit `tests/performance/hero-product-media-scheduling.test.ts`, regardless of how many Task 3 remediation commits exist. Before any Task 3 commit, restore the component from the immutable baseline, remove the newly created uncommitted scheduling test, run the collector's dependency-free fallback mode, and commit only the amended evidence before Task 4:

```powershell
$Baseline = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
git restore --source=$Baseline --staged --worktree -- 'components/evironn/home/hero-product-media.tsx'
if (Test-Path 'tests/performance/hero-product-media-scheduling.test.ts') {
  Remove-Item -LiteralPath 'tests/performance/hero-product-media-scheduling.test.ts'
}
git restore --staged -- 'tests/performance/hero-product-media-scheduling.test.ts' 2>$null
$BaselineComponentBlob = (git rev-parse "${Baseline}:components/evironn/home/hero-product-media.tsx").Trim()
$CurrentComponentBlob = (git hash-object -- 'components/evironn/home/hero-product-media.tsx').Trim()
if ($CurrentComponentBlob -ne $BaselineComponentBlob) { throw 'Component does not match immutable baseline after pre-commit fallback restoration.' }
if ((git diff --cached --name-only -- 'components/evironn/home/hero-product-media.tsx' 'tests/performance/hero-product-media-scheduling.test.ts') -or (git diff --name-only -- 'components/evironn/home/hero-product-media.tsx' 'tests/performance/hero-product-media-scheduling.test.ts')) {
  throw 'Task 3 component/test path remains in cached or working diff after pre-commit fallback restoration.'
}
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --record-no-change-fallback 'OWNER_CHARACTERIZATION_OR_SCHEDULING_CONTRACT_MISMATCH'
$FallbackEvidencePaths = @(
  '.superpowers/sdd/phase-6c-baseline/decision.md',
  '.superpowers/sdd/phase-6c-baseline/summary.md',
  '.superpowers/sdd/phase-6c-baseline/summary.json'
) | Sort-Object -Unique
git add -f -- $FallbackEvidencePaths
$FallbackStaged = @(git -c core.quotePath=false diff --cached --name-only | Sort-Object -Unique)
if (@(Compare-Object -ReferenceObject $FallbackEvidencePaths -DifferenceObject $FallbackStaged).Count -ne 0) {
  throw 'Pre-commit fallback staging does not exactly equal the three evidence paths.'
}
git commit -m "docs: record phase 6c no-change fallback"
```

Expected staged paths: exactly the three amended Task 2 evidence files; `decision.md` begins `Decision: NO_CHANGE`; both summaries name the fallback code and retain raw observations unchanged. Capture the resulting fallback evidence SHA immediately:

```powershell
$FallbackEvidenceCommit = (git rev-parse HEAD).Trim()
if ($FallbackEvidenceCommit -notmatch '^[0-9a-f]{40}$') { throw 'Fallback evidence commit SHA unavailable.' }
Write-Output "fallback-evidence=$FallbackEvidenceCommit"
```

If fallback becomes necessary after the candidate commit or any Task 3 remediation commit, do not revert only one commit. Require a clean tracked worktree, resolve every Task 3 candidate/remediation receipt, create one dedicated restoration commit from the immutable baseline tree, and then create the separate fallback-evidence commit above:

```powershell
$Baseline = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'Staged changes must be empty before Task 3 fallback restoration.' }
git diff --quiet
if ($LASTEXITCODE -ne 0) { throw 'Working changes must be empty before Task 3 fallback restoration.' }
$Task3History = @(git log "$Baseline..HEAD" --format='%H|%s' | Where-Object {
  $Subject = ($_ -split '\|', 2)[1]
  $Subject -eq 'perf: defer inactive home hero videos' -or $Subject -eq 'perf: remediate phase 6c hero scheduling'
})
$CandidateCommits = @($Task3History | Where-Object { ($_ -split '\|', 2)[1] -eq 'perf: defer inactive home hero videos' } | ForEach-Object { ($_ -split '\|', 2)[0] })
$Task3RemediationCommits = @($Task3History | Where-Object { ($_ -split '\|', 2)[1] -eq 'perf: remediate phase 6c hero scheduling' } | ForEach-Object { ($_ -split '\|', 2)[0] })
if ($CandidateCommits.Count -ne 1) { throw 'Exactly one Task 3 candidate commit is required for committed fallback.' }
foreach ($Task3Sha in @($CandidateCommits + $Task3RemediationCommits)) {
  if ($Task3Sha -notmatch '^[0-9a-f]{40}$') { throw 'Invalid Task 3 candidate/remediation SHA.' }
  $Task3Paths = @(git -c core.quotePath=false diff-tree --no-commit-id --name-only -r $Task3Sha)
  if ($Task3Paths.Count -eq 0 -or @($Task3Paths | Where-Object { $_ -notin @('components/evironn/home/hero-product-media.tsx', 'tests/performance/hero-product-media-scheduling.test.ts') }).Count -ne 0) {
    throw "Task 3 commit owns an unexpected path: $Task3Sha"
  }
}
git cat-file -e "${Baseline}:components/evironn/home/hero-product-media.tsx"
git cat-file -e "${Baseline}:tests/performance/hero-product-media-scheduling.test.ts" 2>$null
if ($LASTEXITCODE -eq 0) { throw 'Scheduling test unexpectedly exists in immutable implementation baseline.' }
git restore --source=$Baseline --staged --worktree -- 'components/evironn/home/hero-product-media.tsx'
if (git ls-files --error-unmatch -- 'tests/performance/hero-product-media-scheduling.test.ts' 2>$null) {
  git rm -f -- 'tests/performance/hero-product-media-scheduling.test.ts'
} elseif (Test-Path -LiteralPath 'tests/performance/hero-product-media-scheduling.test.ts') {
  Remove-Item -LiteralPath 'tests/performance/hero-product-media-scheduling.test.ts'
}
$FallbackRestoreStaged = @(git -c core.quotePath=false diff --cached --name-only | Sort-Object -Unique)
if ($FallbackRestoreStaged.Count -eq 0 -or @($FallbackRestoreStaged | Where-Object { $_ -notin @('components/evironn/home/hero-product-media.tsx', 'tests/performance/hero-product-media-scheduling.test.ts') }).Count -ne 0) {
  throw 'Fallback restoration staging is empty or outside Task 3 ownership.'
}
git commit -m "perf: restore phase 6c hero scheduling baseline"
$FallbackRestoreCommit = (git rev-parse HEAD).Trim()
if ($FallbackRestoreCommit -notmatch '^[0-9a-f]{40}$') { throw 'Fallback restoration commit SHA unavailable.' }
$FinalComponentBlob = (git rev-parse 'HEAD:components/evironn/home/hero-product-media.tsx').Trim()
$BaselineComponentBlob = (git rev-parse "${Baseline}:components/evironn/home/hero-product-media.tsx").Trim()
if ($FinalComponentBlob -ne $BaselineComponentBlob) { throw 'Final HeroProductMedia blob differs from immutable baseline.' }
git cat-file -e 'HEAD:tests/performance/hero-product-media-scheduling.test.ts' 2>$null
if ($LASTEXITCODE -eq 0) { throw 'Scheduling test remains in final fallback tree.' }
$ResidualCandidatePaths = @(git diff --name-only "$Baseline...HEAD" -- 'components/evironn/home/hero-product-media.tsx' 'tests/performance/hero-product-media-scheduling.test.ts')
if ($ResidualCandidatePaths.Count -ne 0) { throw 'Task 3 candidate paths remain after fallback restoration.' }
Write-Output "candidate=$($CandidateCommits[0])"
Write-Output "task3-remediations=$($Task3RemediationCommits -join ',')"
Write-Output "fallback-restore=$FallbackRestoreCommit"
```

Task 4 resolves the distinct candidate, every Task 3 remediation, fallback-restoration, and fallback-evidence commits from exact subjects and reports them separately from the durable original measurement SHA. Task 4 may not start until fallback changes are committed, staged and working diffs are empty, final component blob equals the immutable baseline, scheduling test is absent from `HEAD`, and final changed-path comparison selects the no-change allowlist. No fallback edit may remain uncommitted.

- [ ] **Step 5: Make the minimal owner-local implementation.**

In `components/evironn/home/hero-product-media.tsx`, replace every owner-local video JSX attribute:

```tsx
preload = 'auto';
```

with:

```tsx
preload = 'none';
```

Do not change video sources, image sources, media quality, loop/muted/playsInline settings, refs, state, effects, event handlers, `video.load()`, `video.play()`, classes, DOM order, copy, accessibility, motion, or any other component.

- [ ] **Step 6: Run the focused scheduling contract and verify green.**

Run:

```powershell
npx --no-install vitest run 'tests/performance/hero-product-media-scheduling.test.ts'
```

Expected: exactly two tests pass: activation-time loading remains present; every owner-local video tag uses `preload="none"`; no owner-local `preload="auto"` remains.

- [ ] **Step 7: Run the existing hero interaction/state tests without broadening scope.**

Run:

```powershell
npx --no-install vitest run 'tests/evironn-hero-shell.test.tsx' 'tests/evironn-hero-state.test.ts'
```

Expected: exactly thirteen existing hero tests pass. These are regression guardrails for the component's interaction, state, keyboard, cleanup, reduced-motion, and route contracts; do not modify either existing test file. Any real failure triggers systematic debugging within the Task 3 owner boundary; a required broader change converts the result to `NO_CHANGE`.

- [ ] **Step 8: Format only the two owned files and rerun the focused contract.**

Run:

```powershell
npx --no-install prettier --write 'tests/performance/hero-product-media-scheduling.test.ts' 'components/evironn/home/hero-product-media.tsx'
npx --no-install prettier --check 'tests/performance/hero-product-media-scheduling.test.ts' 'components/evironn/home/hero-product-media.tsx'
npx --no-install vitest run 'tests/performance/hero-product-media-scheduling.test.ts'
```

Expected: Prettier check reports both files formatted; two focused tests pass.

- [ ] **Step 9: Inspect the exact bounded diff and scheduling literals.**

Run:

```powershell
$Baseline = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
git add -N -- 'tests/performance/hero-product-media-scheduling.test.ts'
git diff -- 'components/evironn/home/hero-product-media.tsx' 'tests/performance/hero-product-media-scheduling.test.ts'
rg -n 'preload="(auto|none)"|\.load\(\)' 'components/evironn/home/hero-product-media.tsx'
```

Expected: `git add -N` exposes the untracked scheduling test to `git diff` without staging its contents; production diff contains only `preload="auto"` to `preload="none"`; test diff contains only the two named contracts; `rg` prints no `preload="auto"`, at least one `preload="none"`, and the preserved `.load()` call.

- [ ] **Step 10: Verify changed paths, protected hashes, and value-free secret scan.**

Run Task 1 Step 4 collector. Reuse this exact static 15-path `$ApprovedBaselinePaths` array from Task 2 Step 13; do not enumerate the directory dynamically or stage a directory wildcard. First compare recursive actual contents with the static array and fail on any extra or missing path. Extend `$ExplicitOwnedIgnoredPaths` with `.superpowers/sdd/phase-6c-measurement-commit.txt` and the static array. Candidate-path `$ExpectedOwnedPaths` is exactly:

```powershell
$ApprovedBaselinePaths = @(
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs',
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs',
  '.superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/summary.json',
  '.superpowers/sdd/phase-6c-baseline/summary.md',
  '.superpowers/sdd/phase-6c-baseline/decision.md'
)
$ActualBaselinePaths = @(Get-ChildItem -LiteralPath '.superpowers/sdd/phase-6c-baseline' -File -Recurse | ForEach-Object {
  [IO.Path]::GetRelativePath((Get-Location).Path, $_.FullName).Replace('\', '/')
} | Sort-Object -Unique)
if (@(Compare-Object -ReferenceObject $ApprovedBaselinePaths -DifferenceObject $ActualBaselinePaths).Count -ne 0) {
  throw 'Phase 6C baseline directory contents differ from the static 15-path allowlist.'
}
$ExplicitOwnedIgnoredPaths = @(
  '.superpowers/sdd/phase-6c-implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-planning-artifact-manifest.json',
  '.superpowers/sdd/phase-6c-measurement-commit.txt',
  $ApprovedBaselinePaths
) | Where-Object { Test-Path -LiteralPath $_ }
$ExpectedOwnedPaths = @(
  '.superpowers/sdd/phase-6c-implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-planning-artifact-manifest.json',
  '.superpowers/sdd/phase-6c-measurement-commit.txt',
  $ApprovedBaselinePaths,
  'components/evironn/home/hero-product-media.tsx',
  'tests/performance/hero-product-media-scheduling.test.ts'
) | Sort-Object -Unique
```

Run the collector using these exact arrays, require empty `Compare-Object` output after removing only the two protected pre-existing exceptions, and stage only the two Task 3 paths. Repeat Task 1 Step 3. Then run the same dependency-free quoted-JSON-key/private-key validator from Task 2 Step 12 with this exact root set:

```powershell
$ScanRoots = @(
  'components/evironn/home/hero-product-media.tsx',
  'tests/performance/hero-product-media-scheduling.test.ts'
)
```

Keep the Task 2 Step 12 `$SensitiveKeyPattern`, `$SensitiveAssignmentPattern`, `$PrivateKeyPattern`, extension-specific JSON/non-JSON branching, `Test-SensitiveJsonKey`, file expansion, path-only failure output, and zero-path assertion unchanged. Expected: `secret-scan=0 paths`; no matched key, text, or value is emitted.

- [ ] **Step 11: Commit the conditional candidate as one owner-local unit.**

Run:

```powershell
git config --get user.name
git config --get user.email
git add -- 'tests/performance/hero-product-media-scheduling.test.ts' 'components/evironn/home/hero-product-media.tsx'
git diff --cached --name-only
git commit -m "perf: defer inactive home hero videos"
```

Expected staged paths: exactly the two Task 3 owned files. Stop before commit if identity differs from `ui-ux-promax <gojjoy22@gmail.com>`.

**Review boundary:** One fresh Sol Medium reviewer receives only the Task 3 commit diff, Task 2 `summary.md` and `decision.md`, the frozen `HeroProductMedia` ownership statement, and focused command output. Reviewer checks that evidence authorized the candidate, production change is only the preload literal, activation loading remains, tests have genuine characterization/RED semantics, and no visual/security/cache/provider boundary changed. Critical or Important findings return to the Task 3 implementer and block Task 4. No full gate, build, broad E2E, deployment, or public after-claim is permitted.

**Task 3 blocking-review remediation procedure:** The Task 3 owner may edit only `components/evironn/home/hero-product-media.tsx` and `tests/performance/hero-product-media-scheduling.test.ts`. Apply only the accepted finding, rerun the two scheduling tests, the thirteen existing hero shell/state tests, the bounded diff and preload/`video.load()` inspection, the protected-file check, and the value-free scan. Stage exactly those two paths, reject any other staged path, commit with `perf: remediate phase 6c hero scheduling`, record the exact 40-character SHA in the Task 4 report/progress/status, and require empty staged and working diffs before re-review. If the correction invalidates the candidate, use the committed Task 3 baseline-restoration fallback procedure and record the candidate, every Task 3 remediation, fallback-restoration, and fallback-evidence SHA; no Task 4 step may hide an uncommitted Task 3 remediation.

---

### Task 4: Close Phase 6C, Review the Bounded Delivery, and Stop for Approval

**Files:**

- Create: `.superpowers/sdd/phase-6c-delivery-report.md`
- Create: `.superpowers/sdd/phase-6c-changed-paths.txt`
- Modify: `.superpowers/sdd/progress.md`
- Modify: `docs/roadmap/STATUS.md`

**Interfaces:**

- Consumes: immutable baseline, Task 2 evidence and decision, optional Task 3 commit and focused checks, protected-file hashes, and review findings.
- Produces: durable candidate/no-change closeout, exact Phase 6D handoff, and explicit user-approval stop.

- [ ] **Step 1: Create the delivery report for the executed path.**

Read and validate the distinct commit values before writing the report. Never derive the original measurement SHA from the latest commit touching the mutable summary files.

```powershell
$PlanningCommit = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
$MeasurementCommit = (Get-Content -Raw '.superpowers/sdd/phase-6c-measurement-commit.txt').Trim()
$ApprovedBaselinePaths = @(
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs',
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs',
  '.superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/summary.json',
  '.superpowers/sdd/phase-6c-baseline/summary.md',
  '.superpowers/sdd/phase-6c-baseline/decision.md'
)
$History = @(git log "$PlanningCommit..HEAD" --format='%H|%s')
function Resolve-OptionalCommit([string]$ExactSubject, [string]$AbsentText) {
  $Matches = @($History | Where-Object { ($_ -split '\|', 2)[1] -eq $ExactSubject } | ForEach-Object { ($_ -split '\|', 2)[0] })
  if ($Matches.Count -gt 1) { throw "Ambiguous commit subject: $ExactSubject" }
  if ($Matches.Count -eq 1) {
    if ($Matches[0] -notmatch '^[0-9a-f]{40}$') { throw "Invalid commit SHA for: $ExactSubject" }
    return $Matches[0]
  }
  return $AbsentText
}
$CandidateCommit = Resolve-OptionalCommit 'perf: defer inactive home hero videos' 'Not created.'
$FallbackRestoreCommit = Resolve-OptionalCommit 'perf: restore phase 6c hero scheduling baseline' 'Not created.'
$FallbackEvidenceCommit = Resolve-OptionalCommit 'docs: record phase 6c no-change fallback' 'Not created.'
$Task2RemediationCommits = @($History | Where-Object { ($_ -split '\|', 2)[1] -eq 'test: remediate phase 6c measurement review' } | ForEach-Object { ($_ -split '\|', 2)[0] })
$Task3RemediationCommits = @($History | Where-Object { ($_ -split '\|', 2)[1] -eq 'perf: remediate phase 6c hero scheduling' } | ForEach-Object { ($_ -split '\|', 2)[0] })
$Task4RemediationCommits = @($History | Where-Object { ($_ -split '\|', 2)[1] -eq 'docs: remediate phase 6c closeout review' } | ForEach-Object { ($_ -split '\|', 2)[0] })
foreach ($RemediationSha in @($Task2RemediationCommits + $Task3RemediationCommits + $Task4RemediationCommits)) {
  if ($RemediationSha -notmatch '^[0-9a-f]{40}$') { throw 'Invalid remediation commit SHA.' }
}
$Decision = (Get-Content '.superpowers/sdd/phase-6c-baseline/decision.md' -TotalCount 1).Trim()
if ($PlanningCommit -notmatch '^[0-9a-f]{40}$' -or $MeasurementCommit -notmatch '^[0-9a-f]{40}$') { throw 'Planning or measurement SHA is invalid.' }
git cat-file -e "${MeasurementCommit}^{commit}"
$MeasurementSubject = (git log -1 --format=%s $MeasurementCommit).Trim()
if ($MeasurementSubject -ne 'test: capture phase 6c performance baseline') { throw 'Durable measurement commit subject mismatch.' }
$MeasurementPaths = @(git -c core.quotePath=false diff-tree --no-commit-id --name-only -r $MeasurementCommit | Sort-Object -Unique)
if (@(Compare-Object -ReferenceObject $ApprovedBaselinePaths -DifferenceObject $MeasurementPaths).Count -ne 0) { throw 'Durable measurement commit paths differ from the static 15-path allowlist.' }
git merge-base --is-ancestor $PlanningCommit $MeasurementCommit
if ($LASTEXITCODE -ne 0) { throw 'Measurement commit is not a descendant of the planning baseline.' }
git merge-base --is-ancestor $MeasurementCommit HEAD
if ($LASTEXITCODE -ne 0) { throw 'Measurement commit is not an ancestor of HEAD.' }
if ($Decision -eq 'Decision: CANDIDATE') {
  if ($CandidateCommit -eq 'Not created.' -or $FallbackRestoreCommit -ne 'Not created.' -or $FallbackEvidenceCommit -ne 'Not created.') {
    throw 'Candidate decision commit history is inconsistent.'
  }
} elseif ($Decision -eq 'Decision: NO_CHANGE') {
  if ($CandidateCommit -ne 'Not created.' -and ($FallbackRestoreCommit -eq 'Not created.' -or $FallbackEvidenceCommit -eq 'Not created.')) {
    throw 'Candidate-to-no-change history must include distinct baseline-restoration and fallback-evidence commits.'
  }
  if ($CandidateCommit -eq 'Not created.' -and $FallbackRestoreCommit -ne 'Not created.') { throw 'Fallback restoration exists without candidate.' }
  $FinalComponentBlob = (git rev-parse 'HEAD:components/evironn/home/hero-product-media.tsx').Trim()
  $BaselineComponentBlob = (git rev-parse "${PlanningCommit}:components/evironn/home/hero-product-media.tsx").Trim()
  if ($FinalComponentBlob -ne $BaselineComponentBlob) { throw 'No-change component blob differs from immutable baseline.' }
  git cat-file -e 'HEAD:tests/performance/hero-product-media-scheduling.test.ts' 2>$null
  if ($LASTEXITCODE -eq 0) { throw 'No-change final tree still contains scheduling test.' }
} else {
  throw 'Unknown Phase 6C decision token.'
}
Write-Output "planning=$PlanningCommit"
Write-Output "measurement=$MeasurementCommit"
Write-Output "candidate=$CandidateCommit"
Write-Output "fallback-restore=$FallbackRestoreCommit"
Write-Output "fallback-evidence=$FallbackEvidenceCommit"
Write-Output "task2-remediations=$($Task2RemediationCommits -join ',')"
Write-Output "task3-remediations=$($Task3RemediationCommits -join ',')"
Write-Output "task4-remediations=$($Task4RemediationCommits -join ',')"
```

Expected: planning and measurement values each match `^[0-9a-f]{40}$`; measurement commit has exact subject `test: capture phase 6c performance baseline`, exact static 15-path diff, planning-baseline ancestry, and `HEAD` ancestry; candidate, fallback-restoration, and fallback-evidence receipts each report their distinct 40-character SHA when created or exact `Not created.` text. A candidate-to-`NO_CHANGE` path must show all three history receipts plus every Task 3 remediation SHA, must have the baseline component blob, and must omit the scheduling test. A retained candidate shows only the candidate SHA; a direct no-change path may show no candidate/fallback receipt. `.superpowers/sdd/phase-6c-delivery-report.md` must contain these sections with those concrete values copied from evidence and command output:

```markdown
# Phase 6C Performance and Resilience Delivery Report

## Immutable baseline

- Approved planning-artifact commit
- Original measurement-evidence commit
- Candidate commit, or `Not created.`
- Candidate fallback-restoration commit, or `Not created.`
- Fallback evidence commit, or `Not created.`
- Pre-review closeout checkpoint commit, initially `Not created yet by ordered lifecycle.` and replaced with its concrete SHA during finalization
- Review remediation commits, or `None` (list every Task 2/3/4 remediation SHA with its owner)

## Measurement conditions and availability

## Individual observations and medians

## Server-versus-browser/resource diagnosis

## Decision

`CANDIDATE` or `NO_CHANGE`, with exact satisfied or unmet gate conditions.

## Changed files and ownership

## Focused validation

## Task reviews

## Security and protected-file checks

## Limitations and uncertainty

## Phase 6D handoff

Phase 6D owns production build, complete gate, broad E2E, deployment, comparable public after-measurement, release closeout, push, PR, merge, and any deployed-performance claim. Phase 6C makes no deployed improvement percentage claim.

## Approval stop

Approval stop is authorized only after a fresh Sol Medium review of the exact finalization `HEAD` reports no Critical or Important findings and the bounded state remains clean. This report does not require a commit to attest to a review that occurs after that commit. No Phase 6D action is authorized.
```

Write each available commit value on its corresponding bullet. The ordered pre-review checkpoint value is the exact text `Not created yet by ordered lifecycle.` only in the initial report and must be replaced by its known SHA in the finalization/receipt commit; no commit is required to record its own SHA. On a direct no-change path, explicitly state that no application production file or application test outside the measurement-evidence directory changed and why that result is valid. On candidate-to-no-change fallback, state that application production/test changes existed across the candidate and any remediation commits, were removed by the distinct baseline-restoration commit, and are absent from the final tree; do not falsely report that no candidate existed.

- [ ] **Step 2: Update durable progress and project status narrowly.**

In `.superpowers/sdd/progress.md`, append one Phase 6C entry containing task completion, decision, evidence paths, commit SHAs, focused check results, review disposition, and approval stop. In `docs/roadmap/STATUS.md`, update only Phase 6C status with the same decision and Phase 6D boundary. Do not alter accepted Phase 6A/6B history, protected Phase 2 records, release state, or provider/environment claims.

- [ ] **Step 3: Run focused documentation formatting only.**

Run:

```powershell
npx --no-install prettier --write '.superpowers/sdd/phase-6c-delivery-report.md' '.superpowers/sdd/progress.md' 'docs/roadmap/STATUS.md'
npx --no-install prettier --check '.superpowers/sdd/phase-6c-delivery-report.md' '.superpowers/sdd/progress.md' 'docs/roadmap/STATUS.md'
```

Expected: all three files pass Prettier. Do not run repository-wide `npm run format`; that belongs to the complete delivery gate in Phase 6D.

- [ ] **Step 4: Collect final changed paths against the immutable future baseline.**

Run:

```powershell
$Baseline = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
$Decision = (Get-Content '.superpowers/sdd/phase-6c-baseline/decision.md' -TotalCount 1).Trim()
$ApprovedBaselinePaths = @(
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs',
  '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs',
  '.superpowers/sdd/phase-6c-baseline/raw/cold-candidate.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/home-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/catalog-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-1.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-2.json',
  '.superpowers/sdd/phase-6c-baseline/raw/pdp-run-3.json',
  '.superpowers/sdd/phase-6c-baseline/summary.json',
  '.superpowers/sdd/phase-6c-baseline/summary.md',
  '.superpowers/sdd/phase-6c-baseline/decision.md'
)
$ActualBaselinePaths = @(Get-ChildItem -LiteralPath '.superpowers/sdd/phase-6c-baseline' -File -Recurse | ForEach-Object {
  [IO.Path]::GetRelativePath((Get-Location).Path, $_.FullName).Replace('\', '/')
} | Sort-Object -Unique)
if (@(Compare-Object -ReferenceObject $ApprovedBaselinePaths -DifferenceObject $ActualBaselinePaths).Count -ne 0) {
  throw 'Phase 6C baseline directory contents differ from the static 15-path allowlist.'
}
$ProtectedExceptions = @(
  'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
  'docs/superpowers/plans/phase-2-task-3-execution.md'
)
$ExpectedOwnedPaths = @(
  '.superpowers/sdd/phase-6c-implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-planning-artifact-manifest.json',
  '.superpowers/sdd/phase-6c-measurement-commit.txt',
  $ApprovedBaselinePaths,
  '.superpowers/sdd/phase-6c-delivery-report.md',
  '.superpowers/sdd/phase-6c-changed-paths.txt',
  '.superpowers/sdd/progress.md',
  'docs/roadmap/STATUS.md'
)
if ($Decision -eq 'Decision: CANDIDATE') {
  $ExpectedOwnedPaths += 'components/evironn/home/hero-product-media.tsx'
  $ExpectedOwnedPaths += 'tests/performance/hero-product-media-scheduling.test.ts'
} elseif ($Decision -ne 'Decision: NO_CHANGE') {
  throw 'Unknown Phase 6C decision token.'
}
$ExpectedOwnedPaths = @($ExpectedOwnedPaths | Where-Object { $_ } | Sort-Object -Unique)

# Include manifest path in expected and explicit ignored sets before validation.
'.superpowers/sdd/phase-6c-changed-paths.txt' | Set-Content '.superpowers/sdd/phase-6c-changed-paths.txt'
$BaselineDiff = @(git -c core.quotePath=false diff --name-only --diff-filter=ACMRTUXB "$Baseline...HEAD")
$StagedDiff = @(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMRTUXB)
$WorkingDiff = @(git -c core.quotePath=false diff --name-only --diff-filter=ACMRTUXB)
$StatusPaths = @(git -c core.quotePath=false status --short --untracked-files=all | ForEach-Object {
  if ($_.Length -lt 4) { return }
  $Path = $_.Substring(3)
  if ($Path -match ' -> ') { $Path = ($Path -split ' -> ', 2)[1] }
  $Path.Trim('"')
})
$ExplicitOwnedIgnoredPaths = @(
  '.superpowers/sdd/phase-6c-implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-planning-artifact-manifest.json',
  '.superpowers/sdd/phase-6c-measurement-commit.txt',
  $ApprovedBaselinePaths,
  '.superpowers/sdd/phase-6c-delivery-report.md',
  '.superpowers/sdd/phase-6c-changed-paths.txt',
  '.superpowers/sdd/progress.md'
) | Where-Object { Test-Path -LiteralPath $_ }
$Changed = @($BaselineDiff + $StagedDiff + $WorkingDiff + $StatusPaths + $ExplicitOwnedIgnoredPaths | Where-Object { $_ } | Sort-Object -Unique)
$OwnedChanged = @($Changed | Where-Object { $_ -notin $ProtectedExceptions })
$SetDifference = @(Compare-Object -ReferenceObject $ExpectedOwnedPaths -DifferenceObject $OwnedChanged)
if ($SetDifference.Count -ne 0) {
  $SetDifference | Format-Table -AutoSize
  throw 'Final changed paths do not exactly match executed-path allowlist.'
}
$Changed | Set-Content '.superpowers/sdd/phase-6c-changed-paths.txt'
$Changed | ForEach-Object { Write-Output $_ }
```

The collector combines baseline, staged, working, all-status/untracked, and explicit ignored-path sources. `.superpowers/sdd/phase-6c-changed-paths.txt` is in `$ExpectedOwnedPaths` before validation. Candidate-path exact allowlist:

```text
.superpowers/sdd/phase-6c-implementation-baseline.txt
.superpowers/sdd/phase-6c-planning-artifact-manifest.json
.superpowers/sdd/phase-6c-measurement-commit.txt
.superpowers/sdd/phase-6c-delivery-report.md
.superpowers/sdd/phase-6c-changed-paths.txt
.superpowers/sdd/progress.md
docs/roadmap/STATUS.md
components/evironn/home/hero-product-media.tsx
tests/performance/hero-product-media-scheduling.test.ts
```

The static 15-path `$ApprovedBaselinePaths` array is also the exact recursive-content allowlist; no wildcard or dynamically discovered path is a comparison member. No-change exact allowlist omits component and scheduling-test paths. Protected files may appear only in `$Changed` as pre-existing exceptions, must remain hash-identical, and are excluded from `$OwnedChanged`; they are never expected delivery paths. Missing expected paths, extra baseline files, or paths outside executed allowlist block completion. Preserve unrelated user work and request direction rather than cleaning it.

- [ ] **Step 5: Recheck protected hashes and run final value-free secret scan.**

Repeat Task 1 Step 3 and require both `protected-ok` lines. Run:

```powershell
$ScanRoots = @(
  '.superpowers/sdd/phase-6c-implementation-baseline.txt',
  '.superpowers/sdd/phase-6c-planning-artifact-manifest.json',
  '.superpowers/sdd/phase-6c-measurement-commit.txt',
  '.superpowers/sdd/phase-6c-baseline',
  '.superpowers/sdd/phase-6c-delivery-report.md',
  '.superpowers/sdd/phase-6c-changed-paths.txt',
  '.superpowers/sdd/progress.md',
  'docs/roadmap/STATUS.md'
)
if (Test-Path 'tests/performance/hero-product-media-scheduling.test.ts') { $ScanRoots += 'tests/performance/hero-product-media-scheduling.test.ts' }
if (Test-Path 'components/evironn/home/hero-product-media.tsx') { $ScanRoots += 'components/evironn/home/hero-product-media.tsx' }
$SensitiveKeyPattern = '^(?i:authorization|set-cookie|cookie|password|secret|token|api[_-]?key)$'
$SensitiveAssignmentPattern = '(?im)^\s*(?:authorization|set-cookie|cookie|password|secret|token|api[_-]?key)\s*[:=]\s*(?:["''][^"'']+["'']|[^\s#][^\r\n#]*)'
$PrivateKeyPattern = '-----BEGIN (?:[A-Z0-9][A-Z0-9 -]* )?PRIVATE KEY(?: BLOCK)?-----'
function Test-SensitiveJsonKey([object]$Value) {
  if ($null -eq $Value) { return $false }
  if ($Value -is [System.Collections.IDictionary]) {
    foreach ($Key in $Value.Keys) {
      if ([string]$Key -match $SensitiveKeyPattern) { return $true }
      if (Test-SensitiveJsonKey $Value[$Key]) { return $true }
    }
    return $false
  }
  if ($Value -is [System.Collections.IEnumerable] -and $Value -isnot [string]) {
    foreach ($Item in $Value) { if (Test-SensitiveJsonKey $Item) { return $true } }
  }
  return $false
}
$ScanFiles = @($ScanRoots | ForEach-Object {
  if (Test-Path -LiteralPath $_ -PathType Container) {
    Get-ChildItem -LiteralPath $_ -File -Recurse
  } elseif (Test-Path -LiteralPath $_ -PathType Leaf) {
    Get-Item -LiteralPath $_
  } else {
    throw "Secret scan root missing: $_"
  }
} | Sort-Object FullName -Unique)
$ViolatingPaths = @($ScanFiles | ForEach-Object {
  $RelativePath = [IO.Path]::GetRelativePath((Get-Location).Path, $_.FullName).Replace('\', '/')
  $Raw = [IO.File]::ReadAllText($_.FullName)
  if ($_.Extension -ieq '.json') {
    try { $Json = $Raw | ConvertFrom-Json -AsHashtable -Depth 100 } catch { throw "Secret scan JSON parse failed: $RelativePath" }
    $Violates = Test-SensitiveJsonKey $Json
  } else {
    $Violates = ($Raw -match $PrivateKeyPattern -or $Raw -match $SensitiveAssignmentPattern)
  }
  if ($Violates) { $RelativePath }
} | Sort-Object -Unique)
if ($ViolatingPaths.Count -ne 0) {
  $ViolatingPaths | ForEach-Object { Write-Output $_ }
  throw 'Potential secret-bearing path found; inspect locally without printing values.'
}
Write-Output 'secret-scan=0 paths'
```

Expected: `secret-scan=0 paths`. JSON files are parsed and inspected by key only for case-insensitive quoted sensitive keys; JSON values are not scanned. Non-JSON artifacts are checked for private-key markers and sensitive assignment syntax. Only relative path names may be emitted on failure; never emit matched keys, text, or values.

- [ ] **Step 6: Run the final bounded validation set for the executed path.**

Candidate path:

```powershell
node --check '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs'
node --test '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs'
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --validate-existing
npx --no-install vitest run 'tests/performance/hero-product-media-scheduling.test.ts'
npx --no-install vitest run 'tests/evironn-hero-shell.test.tsx' 'tests/evironn-hero-state.test.ts'
npx --no-install prettier --check '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs' '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' '.superpowers/sdd/phase-6c-baseline/summary.md' '.superpowers/sdd/phase-6c-baseline/decision.md' 'tests/performance/hero-product-media-scheduling.test.ts' 'components/evironn/home/hero-product-media.tsx' '.superpowers/sdd/phase-6c-delivery-report.md' '.superpowers/sdd/progress.md' 'docs/roadmap/STATUS.md'
```

Expected: collector syntax passes; fourteen dependency-free collector tests pass; existing ten raw files and both summaries validate without network access; two scheduling tests and thirteen existing hero shell/state tests pass; all listed files pass Prettier.

No-change path:

```powershell
node --check '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs'
node --test '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs'
node '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' --validate-existing
npx --no-install prettier --check '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.test.mjs' '.superpowers/sdd/phase-6c-baseline/collect-phase-6c.mjs' '.superpowers/sdd/phase-6c-baseline/summary.md' '.superpowers/sdd/phase-6c-baseline/decision.md' '.superpowers/sdd/phase-6c-delivery-report.md' '.superpowers/sdd/progress.md' 'docs/roadmap/STATUS.md'
```

Expected: collector syntax passes; fourteen dependency-free collector tests pass; evidence validates; documentation passes Prettier. Confirm final exact-set collector selects no-change allowlist and `git diff --name-only "$Baseline...HEAD"` contains neither `components/evironn/home/hero-product-media.tsx` nor `tests/performance/hero-product-media-scheduling.test.ts`.

- [ ] **Step 7: Commit the pre-review closeout checkpoint and prove a clean bounded state.**

Run:

```powershell
$CloseoutPaths = @(
  '.superpowers/sdd/phase-6c-delivery-report.md',
  '.superpowers/sdd/phase-6c-changed-paths.txt',
  '.superpowers/sdd/progress.md',
  'docs/roadmap/STATUS.md'
)
git config --get user.name
git config --get user.email
git add -f -- $CloseoutPaths[0..2]
git add -- $CloseoutPaths[3]
$CheckpointStaged = @(git -c core.quotePath=false diff --cached --name-only | Sort-Object -Unique)
if (@(Compare-Object -ReferenceObject ($CloseoutPaths | Sort-Object -Unique) -DifferenceObject $CheckpointStaged).Count -ne 0) {
  throw 'Pre-review closeout checkpoint staging mismatch.'
}
git commit -m "docs: checkpoint phase 6c closeout"
$CloseoutCheckpointCommit = (git rev-parse HEAD).Trim()
if ($CloseoutCheckpointCommit -notmatch '^[0-9a-f]{40}$') { throw 'Closeout checkpoint SHA unavailable.' }
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'Staged diff remains after closeout checkpoint.' }
git diff --quiet
if ($LASTEXITCODE -ne 0) { throw 'Working diff remains after closeout checkpoint.' }
$ProtectedExceptions = @(
  'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
  'docs/superpowers/plans/phase-2-task-3-execution.md'
)
$UnexpectedStatus = @(git -c core.quotePath=false status --short --untracked-files=all | ForEach-Object {
  if ($_.Length -lt 4) { return }
  $Path = $_.Substring(3).Trim('"')
  if ($Path -notin $ProtectedExceptions) { $Path }
})
if ($UnexpectedStatus.Count -ne 0) { $UnexpectedStatus | ForEach-Object { Write-Output $_ }; throw 'Bounded worktree is not clean after closeout checkpoint.' }
Write-Output "closeout-checkpoint=$CloseoutCheckpointCommit"
Write-Output 'bounded-worktree=clean; protected-untracked-exceptions=2'
```

Expected: staged paths exactly equal the four Task 4-owned paths, checkpoint subject is `docs: checkpoint phase 6c closeout`, tracked staged/working diffs are empty, and the only status entries are the two hash-verified protected untracked exceptions. Stop before commit if identity differs from `ui-ux-promax <gojjoy22@gmail.com>`.

- [ ] **Step 8: Review the clean checkpoint, commit owner remediations, then finalize receipts.**

Give the reviewer only:

- immutable baseline SHA;
- final changed-path collector;
- bounded diff from that SHA;
- `summary.md`, `decision.md`, and delivery report;
- Candidate Decision Rule;
- focused validation output;
- relevant frozen Phase 6A/6B preservation contracts.

Reviewer must inspect the exact clean checkpoint commit and report Critical, Important, and Minor findings. Verify measurement integrity, no-change correctness or candidate authorization, owner-local scope, interaction-loading preservation, absence of shared-cache/auth/provider/security changes, safe evidence, protected hashes, and Phase 6D separation. Critical or Important findings return to the owning task. Rerun only affected focused checks; do not repeat a full gate.

**Review-remediation ownership:** Task 2 evidence/decision findings use the static 15-path remediation procedure and a dedicated `test: remediate phase 6c measurement review` commit. Task 3 component/test findings use the exact two-path procedure and a dedicated `perf: remediate phase 6c hero scheduling` commit; candidate-to-`NO_CHANGE` uses Task 3's baseline-restoration fallback. Task 4 report/progress/status/ledger findings use the exact four-path closeout set and a dedicated `docs: remediate phase 6c closeout review` commit. Each remediation commit stages only its owner's paths, reruns affected focused checks plus protected/secret checks, records its exact SHA in coordinator output, and ends with empty staged and working diffs. No owner may edit another owner's path to fold receipts together.

After every accepted remediation SHA is known and the clean-checkpoint review has no unresolved Critical or Important finding, refresh the report, progress, and status with the checkpoint SHA, every Task 2/3/4 remediation SHA, exact finding disposition, and final executed-path facts; regenerate the path-only changed-path ledger. The receipt commit must not claim or record its own SHA. Rerun Steps 4-6, then run:

```powershell
$Baseline = (Get-Content -Raw '.superpowers/sdd/phase-6c-implementation-baseline.txt').Trim()
$History = @(git log "$Baseline..HEAD" --format='%H|%s')
$CloseoutCheckpointMatches = @($History | Where-Object { ($_ -split '\|', 2)[1] -eq 'docs: checkpoint phase 6c closeout' } | ForEach-Object { ($_ -split '\|', 2)[0] })
if ($CloseoutCheckpointMatches.Count -ne 1) { throw 'Closeout checkpoint commit is missing or ambiguous.' }
$Task2RemediationCommits = @($History | Where-Object { ($_ -split '\|', 2)[1] -eq 'test: remediate phase 6c measurement review' } | ForEach-Object { ($_ -split '\|', 2)[0] })
$Task3RemediationCommits = @($History | Where-Object { ($_ -split '\|', 2)[1] -eq 'perf: remediate phase 6c hero scheduling' } | ForEach-Object { ($_ -split '\|', 2)[0] })
$Task4RemediationCommits = @($History | Where-Object { ($_ -split '\|', 2)[1] -eq 'docs: remediate phase 6c closeout review' } | ForEach-Object { ($_ -split '\|', 2)[0] })
foreach ($ReceiptSha in @($CloseoutCheckpointMatches + $Task2RemediationCommits + $Task3RemediationCommits + $Task4RemediationCommits)) {
  if ($ReceiptSha -notmatch '^[0-9a-f]{40}$') { throw 'Invalid closeout/remediation receipt SHA.' }
}
$FinalizationPaths = @(
  '.superpowers/sdd/phase-6c-delivery-report.md',
  '.superpowers/sdd/phase-6c-changed-paths.txt',
  '.superpowers/sdd/progress.md',
  'docs/roadmap/STATUS.md'
)
git add -f -- $FinalizationPaths[0..2]
git add -- $FinalizationPaths[3]
$FinalizationStaged = @(git -c core.quotePath=false diff --cached --name-only | Sort-Object -Unique)
if (@(Compare-Object -ReferenceObject ($FinalizationPaths | Sort-Object -Unique) -DifferenceObject $FinalizationStaged).Count -ne 0) {
  throw 'Finalization receipt staging mismatch.'
}
git commit -m "docs: finalize phase 6c review receipts"
$FinalizationCommit = (git rev-parse HEAD).Trim()
if ($FinalizationCommit -notmatch '^[0-9a-f]{40}$') { throw 'Finalization receipt SHA unavailable.' }
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'Staged diff remains after finalization receipt.' }
git diff --quiet
if ($LASTEXITCODE -ne 0) { throw 'Working diff remains after finalization receipt.' }
$ProtectedExceptions = @(
  'docs/superpowers/plans/2026-08-12-phase-2a-executable-storefront-home.md',
  'docs/superpowers/plans/phase-2-task-3-execution.md'
)
$UnexpectedStatus = @(git -c core.quotePath=false status --short --untracked-files=all | ForEach-Object {
  if ($_.Length -lt 4) { return }
  $Path = $_.Substring(3).Trim('"')
  if ($Path -notin $ProtectedExceptions) { $Path }
})
if ($UnexpectedStatus.Count -ne 0) { $UnexpectedStatus | ForEach-Object { Write-Output $_ }; throw 'Bounded worktree is not clean after finalization receipt.' }
Write-Output "closeout-checkpoint=$($CloseoutCheckpointMatches[0])"
Write-Output "task2-remediations=$($Task2RemediationCommits -join ',')"
Write-Output "task3-remediations=$($Task3RemediationCommits -join ',')"
Write-Output "task4-remediations=$($Task4RemediationCommits -join ',')"
Write-Output "finalization-receipt=$FinalizationCommit"
Write-Output 'bounded-worktree=clean; protected-untracked-exceptions=2'
```

Expected: finalization stages exactly delivery report, changed-path ledger, progress, and status. Including the regenerated ledger handles both retained-candidate and post-checkpoint candidate-to-`NO_CHANGE` remediation paths. Receipt files record the already-known checkpoint/remediation SHAs without requiring a commit to contain its own SHA. Tracked staged/working diffs are empty afterward; only the two protected untracked exceptions remain.

- [ ] **Step 9: Re-review the exact final clean bounded state.**

Give a fresh Sol Medium reviewer the exact finalization `HEAD`, immutable baseline, final bounded diff, refreshed ledger/report/status, measurement summary/decision, focused validation output, and frozen Phase 6A/6B contracts. Reviewer must inspect that exact commit state and report Critical, Important, and Minor findings. If any Critical or Important finding exists, return to Step 8: commit the correction under its owning Task 2/3/4 subject, refresh all known receipts in a new distinct `docs: finalize phase 6c review receipts` commit, prove the bounded state clean, then obtain another fresh exact-state review. Do not stop while the latest final bounded state lacks a fresh clean review or retains a blocking finding.

Expected: fresh reviewer reports no Critical or Important findings against the exact final `HEAD`; Step 4 exact changed-path assertion, Step 5 secret/protected checks, Step 6 focused checks, `git diff --cached --quiet`, and `git diff --quiet` remain successful. Status may contain only the two protected untracked exceptions.

- [ ] **Step 10: Stop for explicit user approval.**

Only after Step 9 passes, report the executed decision, exact commit SHAs, focused checks, latest fresh review disposition, evidence paths, limitations, and clean bounded-state proof. Do not run production build, full gate, broad E2E, deploy, perform public after-measurement, push, open a PR, merge, or begin Phase 6D.

## Stop Conditions

Stop immediately and record the reason without expanding scope when any step requires:

- authentication, cookies, credentials, secret values, environment inspection, or personal data;
- deployment, Vercel/GitHub/provider/database mutation, a paid service, software/browser installation, or network location changes;
- shared caching or altered dynamic behavior for auth/cart/personalized data;
- catalog/PDP optimization, redesign, image/media quality reduction, font rewrite, below-fold media removal, dependency/framework addition, or broad refactor;
- modification of Phase 6A/6B security/provider/payment/database/admin/demo contracts;
- production build, full gate, broad E2E, push, PR, merge, release closeout, or deployed-performance claim;
- a changed path outside the executed-path allowlist;
- a protected-file hash mismatch;
- non-reproducible, unavailable, noisy, or incomparable evidence that cannot satisfy every Candidate Decision Rule condition.

The last condition selects the executable `NO_CHANGE` path. It does not authorize alternative optimization work.

## Phase 6C Acceptance Conditions

Phase 6C reaches its approval stop only when:

1. The immutable baseline is a future commit containing approved Phase 6C planning artifacts and differs from `071807cba8e1c4cfb4185306e9534014107fe3e1`.
2. Protected Phase 2 files retain hashes `c9ac4d833e4f0aea2a474115f3aef58ffd04ef0c` and `acbeaf76e79ad2ae6dcb3541a306e6af7c80055e`.
3. Measurement evidence follows the fixed anonymous protocol with browser cache disabled and no query cache-buster by default, or one documented fixed operator-supplied value reused across all ten observations; mixed navigation identity is incomparable. Measurement-surface unavailability is recorded explicitly.
4. `decision.md` selects exactly one valid path: evidenced `CANDIDATE` or executable `NO_CHANGE`.
5. Candidate path changes only `components/evironn/home/hero-product-media.tsx` plus its focused application test and preserves activation-time loading; no-change path changes no application production file or application test outside the measurement-evidence directory.
6. Focused checks for the executed path pass, quoted-key/private-key scan reports zero paths without emitting values, changed paths match the allowlist, and no Critical or Important review findings remain.
7. Durable report, progress, and status state the uncertainty and make no deployed improvement claim.
8. Pre-review closeout is committed before final review; owner remediations are committed separately; a distinct finalization/receipt commit records all already-known checkpoint/remediation SHAs without recording its own SHA.
9. One fresh Sol Medium review passes against the exact final bounded `HEAD`; staged and working tracked diffs are empty, status contains only the two protected untracked exceptions, and work then stops before every Phase 6D-owned action for explicit user approval.

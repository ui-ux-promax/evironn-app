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

# yolo-driver.ps1 - YOLO forward driver: loop /dev-builder across all Phases
#
# Windows-native PowerShell version. Streams assistant text live (no jq needed).
# ASCII-only to avoid PowerShell 5.1 ANSI/UTF-8 encoding issues.
#
# Each iteration:
#   1. Run `claude -p "/dev-builder"` (non-interactive, exits after Phase completes)
#   2. Check .forge\.yolo-continue - if present, re-invoke for next Phase
#   3. If absent, all Phases are done (or user intervened)
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\yolo-driver.ps1 [project-dir]
#   Default project-dir: current directory
#
# Prerequisites:
#   - Product-Spec.md + DEV-PLAN.md at project root
#   - .forge\config with FORGE_MODE=yolo
#   - claude CLI available in PATH
#
# Design: https://github.com/zxpmail/ReqForge (dogfood-05-tracking.md)

param(
    [string]$Project = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

# UTF-8 console encoding so claude's Unicode output (Chinese errors, etc.) doesn't garble
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Set-Location $Project

# === Preflight checks ===
function Test-File($path, $label) {
    if (-not (Test-Path $path)) {
        Write-Host "[FAIL] Missing ${label}: $path" -ForegroundColor Red
        exit 1
    }
}
Test-File "Product-Spec.md" "Product-Spec.md"
Test-File "DEV-PLAN.md" "DEV-PLAN.md"
Test-File ".forge\config" ".forge\config"

$config = Get-Content ".forge\config" -Raw
if ($config -notmatch "(?m)^FORGE_MODE=yolo") {
    Write-Host "[FAIL] .forge\config must contain FORGE_MODE=yolo" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "[FAIL] claude CLI not found in PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================================="
Write-Host "  YOLO Driver - multi-Phase /dev-builder"
Write-Host "  Project: $Project"
Write-Host "==================================================================="
Write-Host ""

$iteration = 0
while ($true) {
    $iteration++

    # Show current Phase from scope
    if (Test-Path ".forge\active-scope.json") {
        $current = Get-Content ".forge\active-scope.json" -Raw
        $preview = $current.Substring(0, [Math]::Min(120, $current.Length))
        Write-Host ">> [${iteration}] $preview"
    } else {
        Write-Host ">> [${iteration}] Starting Phase 1"
    }

    # Run dev-builder in non-interactive YOLO mode.
    # --dangerously-skip-permissions: skip all approval prompts (in -p mode, default
    #   permission mode hangs waiting for stdin = "black screen no output")
    # --output-format stream-json: stream tokens live (PowerShell parses JSON per line)
    # --include-partial-messages: include partial text chunks for real-time output
    # Tee-Object saves raw JSONL to .forge\yolo-run-N.jsonl for post-mortem.
    # < NUL closes stdin to prevent any prompt from hanging.
    $logFile = ".forge\yolo-run-${iteration}.jsonl"
    if (Test-Path $logFile) { Remove-Item $logFile -Force }

    $cmd = 'claude -p "/dev-builder" --dangerously-skip-permissions --output-format stream-json --verbose --include-partial-messages < NUL 2>&1'
    cmd /c $cmd | Tee-Object -FilePath $logFile | ForEach-Object {
        try {
            $obj = $_ | ConvertFrom-Json -ErrorAction Stop
            if ($obj.type -eq "assistant" -and $obj.message.content) {
                foreach ($c in $obj.message.content) {
                    if ($c.type -eq "text" -and $c.text) {
                        Write-Host $c.text -NoNewline
                    }
                }
            }
        } catch {
            # non-JSON line or parse error - skip (already in log file via Tee-Object)
        }
    }
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        Write-Host ""
        Write-Host "[!]  claude exited with non-zero status (${exitCode}) at iteration ${iteration}"
    }

    # Check handoff signal
    if (Test-Path ".forge\.yolo-continue") {
        $next = Get-Content ".forge\.yolo-continue" -Raw
        $preview = $next.Substring(0, [Math]::Min(200, $next.Length))
        Write-Host ""
        Write-Host "-> [OK] Phase complete: $preview"
        Remove-Item ".forge\.yolo-continue" -Force
        Write-Host "-> Continuing to next Phase..."
        Write-Host ""
    } elseif ($exitCode -eq 0) {
        # Clean exit + no handoff = genuine completion (last Phase done)
        Write-Host ""
        Write-Host "==================================================================="
        Write-Host "  [DONE] All phases complete (${iteration} iteration(s))"
        Write-Host "==================================================================="
        break
    } else {
        # Non-zero exit + no handoff = claude errored (API limit, auth, etc.)
        # Don't mistake this for completion.
        Write-Host ""
        Write-Host "==================================================================="
        Write-Host "  [FAIL] claude errored at iteration ${iteration} (exit ${exitCode})"
        Write-Host "  No .yolo-continue handoff written."
        Write-Host "  Check .forge\yolo-run-${iteration}.jsonl for details."
        Write-Host "  529 / 429 = rate limit (retry); other codes = check auth/config."
        Write-Host "==================================================================="
        exit 1
    }
}

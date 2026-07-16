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
    [Parameter(Position = 0)]
    [string]$Project = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

# UTF-8 console encoding so claude's Unicode output (Chinese errors, etc.) doesn't garble
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Always resolve to absolute path — relative log paths must not land under $HOME
$Project = [System.IO.Path]::GetFullPath($Project)
if (-not (Test-Path -LiteralPath $Project -PathType Container)) {
    Write-Host "[FAIL] Project directory not found: $Project" -ForegroundColor Red
    exit 1
}
Set-Location -LiteralPath $Project

# === Preflight checks (absolute paths — cwd-safe) ===
function Test-File($rel, $label) {
    $path = Join-Path $Project $rel
    if (-not (Test-Path -LiteralPath $path)) {
        Write-Host "[FAIL] Missing ${label}: $path" -ForegroundColor Red
        exit 1
    }
}
Test-File "Product-Spec.md" "Product-Spec.md"
Test-File "DEV-PLAN.md" "DEV-PLAN.md"
Test-File ".forge\config" ".forge\config"

$forgeDir = Join-Path $Project ".forge"
if (-not (Test-Path -LiteralPath $forgeDir -PathType Container)) {
    New-Item -ItemType Directory -Path $forgeDir -Force | Out-Null
}

$config = Get-Content (Join-Path $forgeDir "config") -Raw
if ($config -notmatch "(?m)^FORGE_MODE=yolo") {
    Write-Host "[FAIL] .forge\config must contain FORGE_MODE=yolo" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "[FAIL] claude CLI not found in PATH" -ForegroundColor Red
    exit 1
}

# Count "## Phase" headings in DEV-PLAN — used when .yolo-continue is missing.
# Dogfood finding: Claude Code `claude -p` often does NOT fire Stop hooks, so
# phase-exit-guard never writes .yolo-continue; agents also skip YOLO Step 5a.
$phaseCount = @(Select-String -LiteralPath (Join-Path $Project "DEV-PLAN.md") -Pattern '^## Phase\b').Count
if ($phaseCount -lt 1) { $phaseCount = 1 }
$maxIterations = $phaseCount + 2

Write-Host ""
Write-Host "==================================================================="
Write-Host "  YOLO Driver - multi-Phase /dev-builder"
Write-Host "  Project: $Project"
Write-Host "  CWD:     $(Get-Location)"
Write-Host "  Phases:  $phaseCount (from DEV-PLAN.md)"
Write-Host "  Logs:    $forgeDir\yolo-run-N.jsonl"
Write-Host "==================================================================="
Write-Host ""

$iteration = 0
while ($true) {
    $iteration++
    if ($iteration -gt $maxIterations) {
        Write-Host "[FAIL] Exceeded max iterations ($maxIterations). Aborting." -ForegroundColor Red
        exit 1
    }

    # Show current Phase from scope
    $scopeFile = Join-Path $forgeDir "active-scope.json"
    if (Test-Path -LiteralPath $scopeFile) {
        $current = Get-Content -LiteralPath $scopeFile -Raw
        $preview = $current.Substring(0, [Math]::Min(120, $current.Length))
        Write-Host ">> [${iteration}] $preview"
    } else {
        Write-Host ">> [${iteration}] Starting Phase (iteration $iteration / ~$phaseCount)"
    }

    # Run dev-builder in non-interactive YOLO mode.
    # --dangerously-skip-permissions: skip all approval prompts (in -p mode, default
    #   permission mode hangs waiting for stdin = "black screen no output")
    # --output-format stream-json: stream tokens live
    # --include-partial-messages: include partial text chunks for real-time output
    # Log UTF-8 via StreamWriter (Tee-Object writes UTF-16 and breaks post-mortem tools).
    # < NUL closes stdin to prevent any prompt from hanging.
    $logFile = Join-Path $forgeDir "yolo-run-${iteration}.jsonl"
    if (Test-Path -LiteralPath $logFile) { Remove-Item -LiteralPath $logFile -Force }

    $utf8 = New-Object System.Text.UTF8Encoding $false
    $logWriter = New-Object System.IO.StreamWriter($logFile, $false, $utf8)
    $thinkDots = 0

    try {
        # cd /d into project inside cmd — do not rely on inherited cwd alone
        $cmd = "cd /d `"$Project`" && claude -p `"/dev-builder`" --dangerously-skip-permissions --output-format stream-json --verbose --include-partial-messages < NUL 2>&1"
        cmd /c $cmd | ForEach-Object {
            $line = $_
            $logWriter.WriteLine($line)
            try {
                $obj = $line | ConvertFrom-Json -ErrorAction Stop

                # Legacy / aggregated assistant messages
                if ($obj.type -eq "assistant" -and $obj.message.content) {
                    foreach ($c in $obj.message.content) {
                        if ($c.type -eq "text" -and $c.text) {
                            Write-Host $c.text -NoNewline
                        }
                        elseif ($c.type -eq "tool_use" -and $c.name) {
                            Write-Host ""
                            Write-Host "[tool] $($c.name)" -ForegroundColor DarkGray
                        }
                    }
                }
                # Claude Code stream-json wraps deltas in stream_event
                elseif ($obj.type -eq "stream_event" -and $obj.event) {
                    $e = $obj.event
                    if ($e.type -eq "content_block_delta" -and $e.delta) {
                        if ($e.delta.type -eq "text_delta" -and $e.delta.text) {
                            Write-Host $e.delta.text -NoNewline
                        }
                        elseif ($e.delta.type -eq "thinking_delta") {
                            # Heartbeat so long thinking is not mistaken for a hang
                            $thinkDots++
                            if (($thinkDots % 40) -eq 0) {
                                Write-Host "." -NoNewline -ForegroundColor DarkGray
                            }
                        }
                    }
                    elseif ($e.type -eq "content_block_start" -and $e.content_block) {
                        $cb = $e.content_block
                        if ($cb.type -eq "tool_use" -and $cb.name) {
                            Write-Host ""
                            Write-Host "[tool] $($cb.name)" -ForegroundColor DarkGray
                        }
                        elseif ($cb.type -eq "thinking") {
                            Write-Host ""
                            Write-Host "[thinking]" -ForegroundColor DarkGray
                        }
                    }
                }
                elseif ($obj.type -eq "result") {
                    Write-Host ""
                    if ($obj.is_error) {
                        Write-Host "[result] ERROR: $($obj.result)" -ForegroundColor Red
                    }
                }
            } catch {
                # non-JSON line - already in log
            }
        }
        $exitCode = $LASTEXITCODE
    } finally {
        $logWriter.Flush()
        $logWriter.Close()
    }

    Write-Host ""

    if ($exitCode -ne 0) {
        Write-Host "[!]  claude exited with non-zero status (${exitCode}) at iteration ${iteration}"
    }

    # Check handoff signal
    $continueFile = Join-Path $forgeDir ".yolo-continue"
    $hasContinue = Test-Path -LiteralPath $continueFile

    # Backup: Stop hooks often skip under `claude -p`. If YOLO + mid-pipeline, synth continue.
    if (-not $hasContinue -and $exitCode -eq 0 -and $iteration -lt $phaseCount) {
        $payload = @{
            yolo           = $true
            source         = "yolo-driver-synth"
            completedIter  = $iteration
            expectedPhases = $phaseCount
            note           = "Stop hook / agent Step 5a did not write .yolo-continue; driver continuing by DEV-PLAN phase count"
        } | ConvertTo-Json -Compress
        Set-Content -LiteralPath $continueFile -Value $payload -Encoding utf8
        $hasContinue = $true
        Write-Host ""
        Write-Host "-> [synth] No .yolo-continue after Phase iteration $iteration/$phaseCount (Stop hook likely skipped in -p mode). Continuing..." -ForegroundColor Yellow
    }

    if ($hasContinue) {
        $next = Get-Content -LiteralPath $continueFile -Raw
        $preview = $next.Substring(0, [Math]::Min(200, $next.Length))
        Write-Host ""
        Write-Host "-> [OK] Phase handoff: $preview"
        Remove-Item -LiteralPath $continueFile -Force
        if ($iteration -ge $phaseCount) {
            Write-Host ""
            Write-Host "==================================================================="
            Write-Host "  [DONE] Reached planned phase count (${iteration}/${phaseCount})"
            Write-Host "==================================================================="
            break
        }
        Write-Host "-> Continuing to next Phase..."
        Write-Host ""
    } elseif ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "==================================================================="
        Write-Host "  [DONE] All phases complete (${iteration} iteration(s), plan=$phaseCount)"
        Write-Host "==================================================================="
        break
    } else {
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

# dogfood-05-reset.ps1 - Clear md-toc implementation so yolo-driver can re-test 3-Phase continuum
#
# Keeps: Product-Spec.md, DEV-PLAN.md, .forge confirm/config, Forge adapter install.
# Removes: packages/md-toc source/tests/dist/memory artifacts that make agent skip to Phase 3.
#
# Usage (from anywhere):
#   powershell -ExecutionPolicy Bypass -File C:\work\ReqForge\scripts\dogfood-05-reset.ps1
#   powershell -ExecutionPolicy Bypass -File C:\work\ReqForge\scripts\dogfood-05-reset.ps1 C:\work\dogfood-05
#
# Then run YOLO (independent of ReqForge chat session):
#   powershell -ExecutionPolicy Bypass -File C:\work\ReqForge\scripts\yolo-driver.ps1 C:\work\dogfood-05

param(
    [string]$Project = "C:\work\dogfood-05"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Project)) {
    Write-Host "[FAIL] Project not found: $Project" -ForegroundColor Red
    exit 1
}

$pkg = Join-Path $Project "packages\md-toc"
if (-not (Test-Path $pkg)) {
    Write-Host "[FAIL] Expected packages\md-toc under $Project" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================================="
Write-Host "  dogfood-05 reset - wipe implementation, keep Spec/Plan gates"
Write-Host "  Project: $Project"
Write-Host "==================================================================="
Write-Host ""

# Must keep
$keepRoot = @(
    "Product-Spec.md",
    "DEV-PLAN.md",
    ".forge\config",
    ".forge\spec-confirmed.json",
    ".forge\plan-confirmed.json",
    ".claude"
)
foreach ($rel in $keepRoot) {
    $p = Join-Path $Project $rel
    if (-not (Test-Path $p)) {
        Write-Host "[WARN] Missing keep-path: $rel" -ForegroundColor Yellow
    } else {
        Write-Host "[keep] $rel"
    }
}

# Wipe implementation / history that implies phases done.
# CRITICAL: also remove packages/md-toc/.git — otherwise agent sees "3 Phases
# committed, working tree deleted" and hangs in restore-vs-rebuild thinking.
$removePkg = @(
    "src",
    "test",
    "dist",
    "memory",
    "PROJECT-HEALTH.md",
    "LICENSE",
    "README.md",
    "changes",
    ".claude\worktrees",
    ".git",
    "remind"
)
foreach ($rel in $removePkg) {
    $p = Join-Path $pkg $rel
    if (Test-Path $p) {
        Remove-Item -Recurse -Force $p
        Write-Host "[rm]   packages\md-toc\$rel"
    }
}

# Project-root transient YOLO / phase artifacts
$removeRoot = @(
    ".forge\.yolo-continue",
    ".forge\active-scope.json",
    ".forge\implementer-session.json",
    ".forge\.verify-block",
    ".forge\verify-uncertain.json",
    ".forge\yolo-run-1.jsonl",
    ".forge\yolo-run-2.jsonl",
    ".forge\yolo-run-3.jsonl",
    ".forge\yolo-run-4.jsonl",
    ".forge\yolo-run-5.jsonl",
    "changes",
    "PROJECT-HEALTH.md"
)
foreach ($rel in $removeRoot) {
    $p = Join-Path $Project $rel
    if (Test-Path $p) {
        Remove-Item -Recurse -Force $p
        Write-Host "[rm]   $rel"
    }
}

# Also remove any extra yolo-run-*.jsonl
Get-ChildItem (Join-Path $Project ".forge") -Filter "yolo-run-*.jsonl" -ErrorAction SilentlyContinue |
    ForEach-Object {
        Remove-Item -Force $_.FullName
        Write-Host "[rm]   .forge\$($_.Name)"
    }

# Fresh git so agent cannot restore deleted Phase 1-3 from history
# (git writes CRLF warnings to stderr — do not let $ErrorActionPreference Stop abort)
Push-Location $pkg
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
    git init -q 2>&1 | Out-Null
    git add package.json tsconfig.json pnpm-lock.yaml .gitignore 2>&1 | Out-Null
    git -c user.email="dogfood@local" -c user.name="dogfood" commit -q -m "chore: tooling skeleton only (dogfood reset)" 2>&1 | Out-Null
    $log = git log --oneline -1 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[git]  packages\md-toc re-init with skeleton only ($log)"
    } else {
        Write-Host "[WARN] git commit failed — delete .git manually if present" -ForegroundColor Yellow
    }
} finally {
    $ErrorActionPreference = $prevEap
    Pop-Location
}

# Keep package.json / tsconfig / lock / node_modules so agent does not re-scaffold tooling forever.
Write-Host ""
Write-Host "[keep] packages\md-toc\package.json, tsconfig.json, node_modules (tooling)"
Write-Host ""
Write-Host "==================================================================="
Write-Host "  [OK] Reset done. Next:"
Write-Host "  powershell -ExecutionPolicy Bypass -File C:\work\ReqForge\scripts\yolo-driver.ps1 $Project"
Write-Host "  Success = ~3 claude -p iterations with .yolo-continue between them."
Write-Host "  Live UI: [tool] Name + text; dots = thinking (not hung)."
Write-Host "==================================================================="
Write-Host ""

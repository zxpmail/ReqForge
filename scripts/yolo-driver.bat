@echo off
REM yolo-driver.bat — YOLO forward driver: loop /dev-builder across all Phases
REM
REM Each iteration:
REM   1. Run `claude -p "/dev-builder"` (non-interactive, exits after Phase completes)
REM   2. Check .forge/.yolo-continue — if present, re-invoke for next Phase
REM   3. If absent, all Phases are done (or user intervened)
REM
REM The dev-builder agent writes .yolo-continue at Phase completion (YOLO mode only).
REM This file is the ONLY machine-readable handoff — no prose-drift risk.
REM
REM Usage:
REM   scripts\yolo-driver.bat [project-dir]     Default: current directory
REM
REM Prerequisites:
REM   - Product-Spec.md + DEV-PLAN.md at project root
REM   - .forge\config with FORGE_MODE=yolo
REM   - claude CLI available in PATH
REM
REM Design: https://github.com/zxpmail/ReqForge (dogfood-05-tracking.md)

setlocal enabledelayedexpansion

set PROJECT=%~1
if "%PROJECT%"=="" set PROJECT=%CD%
cd /d "%PROJECT%" 2>nul
if errorlevel 1 (
    echo ❌ Cannot access: %PROJECT%
    exit /b 1
)

REM === Preflight checks ===
if not exist "Product-Spec.md" (
    echo ❌ Missing: Product-Spec.md
    exit /b 1
)
if not exist "DEV-PLAN.md" (
    echo ❌ Missing: DEV-PLAN.md
    exit /b 1
)
if not exist ".forge\config" (
    echo ❌ Missing: .forge\config
    exit /b 1
)

REM Check FORGE_MODE=yolo
findstr /i "^FORGE_MODE=yolo" ".forge\config" >nul 2>&1
if errorlevel 1 (
    echo ❌ .forge\config must contain FORGE_MODE=yolo
    exit /b 1
)

REM Check claude CLI
where claude >nul 2>&1
if errorlevel 1 (
    echo ❌ claude CLI not found in PATH
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════
echo   YOLO Driver — multi-Phase /dev-builder
echo   Project: %PROJECT%
echo ═══════════════════════════════════════════
echo.

set ITERATION=0

:loop
set /a ITERATION+=1

REM Show current Phase from scope
if exist ".forge\active-scope.json" (
    for /f "usebackq delims=" %%a in (".forge\active-scope.json") do set CURRENT=%%a
    echo ▶ [!ITERATION!] !CURRENT:~0,120!
) else (
    echo ▶ [!ITERATION!] Starting Phase 1
)

REM Run dev-builder in non-interactive mode
claude -p "/dev-builder"

REM Check handoff signal
if exist ".forge\.yolo-continue" (
    for /f "usebackq delims=" %%a in (".forge\.yolo-continue") do set NEXT_PHASE=%%a
    echo → ✓ Phase complete: !NEXT_PHASE:~0,200!
    del ".forge\.yolo-continue" 2>nul

    REM Each `claude -p` is a fresh session (no --resume/--continue),
    REM so context is already clean — no explicit clear needed.

    echo → Continuing to next Phase...
    echo.
    goto loop
)

echo.
echo ═══════════════════════════════════════════
echo   ✅ All phases complete (%ITERATION% iteration^(s^))
echo ═══════════════════════════════════════════

endlocal

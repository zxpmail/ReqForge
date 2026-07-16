@echo off
REM yolo-driver.bat — YOLO forward driver: loop /dev-builder across all Phases
REM
REM Each iteration:
REM   1. Run `claude -p "/dev-builder"` (non-interactive, exits after Phase completes)
REM   2. Check .forge/.yolo-continue — if present, re-invoke for next Phase
REM   3. If absent + exit 0 + iteration < phaseCount → synth continue (Stop hooks
REM      often skip under claude -p)
REM   4. If absent + exit 0 + iteration >= phaseCount → DONE
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

REM Count "## Phase" headings in DEV-PLAN
set PHASE_COUNT=0
for /f %%a in ('findstr /R /C:"^## Phase" "DEV-PLAN.md" 2^>nul ^| find /C /V ""') do set PHASE_COUNT=%%a
if !PHASE_COUNT! LSS 1 set PHASE_COUNT=1
set /a MAX_ITER=!PHASE_COUNT!+2

echo.
echo ═══════════════════════════════════════════
echo   YOLO Driver — multi-Phase /dev-builder
echo   Project: %PROJECT%
echo   Phases:  !PHASE_COUNT! (from DEV-PLAN.md)
echo ═══════════════════════════════════════════
echo.

set ITERATION=0

:loop
set /a ITERATION+=1
if !ITERATION! GTR !MAX_ITER! (
    echo ❌ Exceeded max iterations (!MAX_ITER!). Aborting.
    exit /b 1
)

REM Show current Phase from scope
if exist ".forge\active-scope.json" (
    for /f "usebackq delims=" %%a in (".forge\active-scope.json") do set CURRENT=%%a
    echo ▶ [!ITERATION!] !CURRENT:~0,120!
) else (
    echo ▶ [!ITERATION!] Starting Phase (iteration !ITERATION! / ~!PHASE_COUNT!)
)

REM Run dev-builder in non-interactive YOLO mode.
REM --dangerously-skip-permissions: skip all approval prompts (in -p mode, default
REM   permission mode hangs waiting for stdin = "black screen no output")
REM Output buffers until exit (no stream-json on .bat; use yolo-driver.ps1 or .sh for streaming)
claude -p "/dev-builder" --dangerously-skip-permissions < NUL
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
    echo ⚠️  claude exited with non-zero status (%EXIT_CODE%) at iteration !ITERATION!
)

REM Synth continue when Stop hook / agent skipped writing handoff
if not exist ".forge\.yolo-continue" if "%EXIT_CODE%"=="0" if !ITERATION! LSS !PHASE_COUNT! (
    > ".forge\.yolo-continue" echo {"yolo":true,"source":"yolo-driver-synth","completedIter":!ITERATION!,"expectedPhases":!PHASE_COUNT!}
    echo → ⚠ synth: no .yolo-continue after iteration !ITERATION!/!PHASE_COUNT! (Stop hook likely skipped in -p mode). Continuing...
)

REM Check handoff signal
if exist ".forge\.yolo-continue" (
    for /f "usebackq delims=" %%a in (".forge\.yolo-continue") do set NEXT_PHASE=%%a
    echo → ✓ Phase handoff: !NEXT_PHASE:~0,200!
    del ".forge\.yolo-continue" 2>nul

    if !ITERATION! GEQ !PHASE_COUNT! (
        echo.
        echo ═══════════════════════════════════════════
        echo   ✅ Reached planned phase count (!ITERATION!/!PHASE_COUNT!)
        echo ═══════════════════════════════════════════
        goto done
    )

    echo → Continuing to next Phase...
    echo.
    goto loop
)

if "%EXIT_CODE%"=="0" (
    echo.
    echo ═══════════════════════════════════════════
    echo   ✅ All phases complete (!ITERATION! iteration^(s^), plan=!PHASE_COUNT!)
    echo ═══════════════════════════════════════════
    goto done
)

REM Non-zero exit + no handoff = error
echo.
echo ═══════════════════════════════════════════
echo   ❌ claude errored at iteration !ITERATION! (exit %EXIT_CODE%)
echo   No .yolo-continue handoff written.
echo   529 / 429 = rate limit (retry^); other codes = check auth/config.
echo ═══════════════════════════════════════════
exit /b 1

:done
endlocal

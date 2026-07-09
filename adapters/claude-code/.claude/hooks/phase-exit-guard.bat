@echo off
REM Stop hook: block agent stop while .forge/phase-exit-block or .forge/.verify-block exists (Ralph-style phase completion)
REM Mirrors phase-exit-guard.sh. Agent writes phase-exit-block when Phase/DEV-PLAN acceptance is incomplete; forge-verify CLI writes .verify-block on new failures.

setlocal enabledelayedexpansion

call :check_yolo
set YOLO_ACTIVE=!YOLO_ACTIVE!

set BLOCK_FILE=%CLAUDE_PROJECT_DIR%\.forge\phase-exit-block
set VERIFY_BLOCK=%CLAUDE_PROJECT_DIR%\.forge\.verify-block

REM Exit only if BOTH block files are absent (gate on either)
if not exist "%BLOCK_FILE%" if not exist "%VERIFY_BLOCK%" exit /b 0

set REASON=
if exist "%BLOCK_FILE%" call :read_first_line "%BLOCK_FILE%" BLOCK_REASON
if exist "%VERIFY_BLOCK%" call :read_first_line "%VERIFY_BLOCK%" VERIFY_REASON
if defined BLOCK_REASON (
    if defined VERIFY_REASON (
        set REASON=!BLOCK_REASON!; !VERIFY_REASON!
    ) else (
        set REASON=!BLOCK_REASON!
    )
) else (
    if defined VERIFY_REASON set REASON=!VERIFY_REASON!
)

if "!REASON!"=="" set REASON=Phase or DEV-PLAN acceptance criteria not complete, or forge-verify detected new failures. See DEV-PLAN.md and dev-builder phase verification.

if !YOLO_ACTIVE! equ 1 (
    if not exist "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending" mkdir "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending"
    echo phase-exit-guard: !REASON! > "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending\phase-exit"
    exit /b 0
)

echo {"decision": "block", "reason": "!REASON! — Complete Phase four-step verification and fix forge-verify failures, then remove block files before stopping."}
exit /b 0

:check_yolo
set YOLO_ACTIVE=0
if exist "%CLAUDE_PROJECT_DIR%\.forge\config" (
    findstr /i "^FORGE_MODE=yolo" "%CLAUDE_PROJECT_DIR%\.forge\config" >nul 2>&1
    if not errorlevel 1 (
        set YOLO_ACTIVE=1
        goto :eof
    )
)
if exist "%USERPROFILE%\.forge\config" (
    findstr /i "^FORGE_MODE=yolo" "%USERPROFILE%\.forge\config" >nul 2>&1
    if not errorlevel 1 (
        set YOLO_ACTIVE=1
        goto :eof
    )
)
if /i "%FORGE_MODE%"=="yolo" set YOLO_ACTIVE=1
goto :eof

REM read_first_line <file> <out_var> — sets <out_var> to first line of <file>, cleared if file unreadable
:read_first_line
set %2=
if not exist "%~1" goto :eof
for /f "usebackq delims=" %%a in ("%~1") do (
    set %2=%%a
    goto :eof
)
goto :eof

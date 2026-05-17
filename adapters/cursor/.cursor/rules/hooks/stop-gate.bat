@echo off
REM Stop hook: block stop if code was modified without review
REM State file .needs-review: needs_review = block, clean = allow + cleanup
REM YOLO mode: write async file instead of blocking
REM   Priority: project .forge/config > global ~/.forge/config > env var FORGE_MODE

setlocal enabledelayedexpansion

call :check_yolo
set YOLO_ACTIVE=!YOLO_ACTIVE!

set STATE_FILE=%CLAUDE_PROJECT_DIR%\.claude\.needs-review

if not exist "%STATE_FILE%" exit /b 0

set STATE=
for /f "usebackq delims=" %%a in ("%STATE_FILE%") do set STATE=%%a
set STATE=%STATE: =%

if /i "%STATE%"=="needs_review" (
    if !YOLO_ACTIVE! equ 1 (
        if not exist "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending" mkdir "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending"
        echo stop-gate: code not reviewed > "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending\review-needed"
        exit /b 0
    )
    echo {"decision": "block", "reason": "Code modified without review. Dispatch code-reviewer for two-stage review."}
    exit /b 0
)

if /i "%STATE%"=="clean" (
    del "%STATE_FILE%" 2>nul
    exit /b 0
)

exit /b 0

:check_yolo
set YOLO_ACTIVE=0
if exist "%CLAUDE_PROJECT_DIR%\.forge\config" (
    findstr /i "^FORGE_MODE=yolo" "%CLAUDE_PROJECT_DIR%\.forge\config" >nul 2>&1
    if !errorlevel! equ 0 set YOLO_ACTIVE=1 & goto :eof
)
if exist "%USERPROFILE%\.forge\config" (
    findstr /i "^FORGE_MODE=yolo" "%USERPROFILE%\.forge\config" >nul 2>&1
    if !errorlevel! equ 0 set YOLO_ACTIVE=1 & goto :eof
)
if /i "%FORGE_MODE%"=="yolo" set YOLO_ACTIVE=1 & goto :eof
goto :eof

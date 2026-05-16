@echo off
REM Stop hook: block stop if code was modified without review
REM State file .needs-review: needs_review = block, clean = allow + cleanup

setlocal enabledelayedexpansion

set STATE_FILE=%CLAUDE_PROJECT_DIR%\.claude\.needs-review

if not exist "%STATE_FILE%" exit /b 0

set STATE=
for /f "usebackq delims=" %%a in ("%STATE_FILE%") do set STATE=%%a
set STATE=%STATE: =%

if /i "%STATE%"=="needs_review" (
    echo {"decision": "block", "reason": "Code modified without review. Dispatch code-reviewer for two-stage review."}
    exit /b 0
)

if /i "%STATE%"=="clean" (
    del "%STATE_FILE%" 2>nul
    exit /b 0
)

exit /b 0

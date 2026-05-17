@echo off
REM Hook: SessionStart
REM Check FEEDBACK-INDEX.md for pending feedback entries

setlocal enabledelayedexpansion

set FEEDBACK_INDEX=%CLAUDE_PROJECT_DIR%\.claude\feedback\FEEDBACK-INDEX.md

if not exist "%FEEDBACK_INDEX%" exit /b 0

set COUNT=0
for /f "usebackq tokens=*" %%a in ("%FEEDBACK_INDEX%") do (
    set "LINE=%%a"
    if "!LINE:~0,3!"=="- [" set /a COUNT+=1
)

if %COUNT% gtr 0 (
    echo [listening] Feedback count: %COUNT%. Consider running evolution-runner.
)

exit /b 0

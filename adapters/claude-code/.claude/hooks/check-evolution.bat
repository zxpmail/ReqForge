@echo off
REM Hook: SessionStart
REM Check FEEDBACK-INDEX.md for pending feedback entries
REM Hard trigger: if entries exist, Agent MUST dispatch evolution-runner

setlocal enabledelayedexpansion

set FEEDBACK_INDEX=%CLAUDE_PROJECT_DIR%\.claude\feedback\FEEDBACK-INDEX.md

if not exist "%FEEDBACK_INDEX%" exit /b 0

set COUNT=0
for /f "usebackq tokens=*" %%a in ("%FEEDBACK_INDEX%") do (
    set "LINE=%%a"
    if "!LINE:~0,3!"=="- [" set /a COUNT+=1
)

if %COUNT% gtr 0 (
    echo {"additionalContext": "Mandatory action: Project has %COUNT% feedback entries with scored data. You MUST dispatch evolution-runner sub-agent now to scan for evolution proposals. Do not skip this step."}
)

exit /b 0

@echo off
REM Post-Tool-Use hook: check if project code was modified but memory files were not updated
REM Triggers after file edits in the project code directory
REM If code changed but task-history.md wasn't touched in the same session, output a reminder

setlocal enabledelayedexpansion

set "PROJECT_DIR=%CLAUDE_PROJECT_DIR%"
if "%PROJECT_DIR%"=="" set "PROJECT_DIR=%CD%"
set "MEMORY_DIR=%PROJECT_DIR%\memory"
set "TASK_HISTORY=%MEMORY_DIR%\task-history.md"

REM Skip if memory system not initialized yet
if not exist "%MEMORY_DIR%" exit /b 0

REM Skip if task-history.md doesn't exist yet (will be created on next Task)
if not exist "%TASK_HISTORY%" exit /b 0

REM Check if task-history.md was modified within the last 60 seconds using PowerShell
for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "$f='%TASK_HISTORY%'; $mod=(Get-Item $f).LastWriteTime; $age=((Get-Date)-$mod).TotalSeconds; if($age -lt 60){echo 'recent'}else{echo 'stale'}"`) do set "FRESHNESS=%%a"

if "%FRESHNESS%"=="recent" exit /b 0

REM Memory exists but wasn't updated recently
echo {"decision": "approve", "reason": "Reminder: project memory exists but task-history.md was not updated after code changes. Consider appending to memory/task-history.md and checking if decisions-log.md or project-memory.md need updates."}

exit /b 0

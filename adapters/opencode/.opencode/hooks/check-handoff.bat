@echo off
REM Hook: PostToolUse — suggest session handoff when context usage is high
REM Only fires when memory/ exists (project uses Forge dev flow)

setlocal enabledelayedexpansion

set "PROJECT_DIR=%CLAUDE_PROJECT_DIR%"
if "%PROJECT_DIR%"=="" set "PROJECT_DIR=%CD%"

if not exist "%PROJECT_DIR%\memory" exit /b 0

set "HANDOFF_FILE=%PROJECT_DIR%\memory\handoff.md"
if exist "%HANDOFF_FILE%" (
  for /f %%d in ('powershell -Command "(Get-Item '%HANDOFF_FILE%').LastWriteTime.ToString('yyyy-MM-dd')"') do set "FILE_DATE=%%d"
  for /f %%d in ('powershell -Command "Get-Date -Format 'yyyy-MM-dd'"') do set "TODAY=%%d"
  if "!FILE_DATE!"=="!TODAY!" exit /b 0
)

echo {"additionalContext": "Tip: Session running for a while. If context feels full, run /handoff to generate a session handoff document, then /clear to reset."}

exit /b 0

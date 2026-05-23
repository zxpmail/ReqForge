@echo off
REM BeforeCommand: block stop while .forge/phase-exit-block exists

setlocal enabledelayedexpansion

call :check_yolo
set YOLO_ACTIVE=!YOLO_ACTIVE!

set BLOCK_FILE=%CLAUDE_PROJECT_DIR%\.forge\phase-exit-block

if not exist "%BLOCK_FILE%" exit /b 0

set REASON=
for /f "usebackq delims=" %%a in ("%BLOCK_FILE%") do (
  set REASON=%%a
  goto :got_reason
)
:got_reason

if "!REASON!"=="" set REASON=Phase or DEV-PLAN acceptance criteria not complete.

if !YOLO_ACTIVE! equ 1 (
    if not exist "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending" mkdir "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending"
    echo phase-exit-guard: !REASON! > "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending\phase-exit"
    exit /b 0
)

echo {"decision": "block", "reason": "!REASON! — Complete Phase four-step verification in dev-builder, then remove .forge/phase-exit-block before stopping."}
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

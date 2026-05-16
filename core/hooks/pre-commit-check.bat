@echo off
REM Hook: PreToolUse before git commit
REM Run tsc --noEmit before commit, block if compilation fails

setlocal enabledelayedexpansion

if "%CLAUDE_PROJECT_DIR%"=="" exit /b 0

set TSCONFIG=
for /r "%CLAUDE_PROJECT_DIR%" %%f in (tsconfig.json) do (
    set "FP=%%f"
    echo !FP! | findstr /i "\\node_modules\\ \\\.next\\" >nul
    if !errorlevel! neq 0 (
        set TSCONFIG=%%f
        goto :found
    )
)
:found

if "%TSCONFIG%"=="" exit /b 0

for %%i in ("%TSCONFIG%") do set PROJECT_CODE=%%~dpi
cd /d "%PROJECT_CODE%"

set TSC_PASS=1
for /f "usebackq delims=" %%o in (`npx tsc --noEmit 2^>^&1`) do set TSC_PASS=0

if !TSC_PASS! equ 0 (
    echo TypeScript compilation failed. Commit blocked.>&2
    npx tsc --noEmit>&2
    exit /b 2
)

exit /b 0

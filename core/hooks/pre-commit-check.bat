@echo off
REM Hook: PreToolUse before git commit
REM Run tsc --noEmit before commit, block if compilation fails
REM YOLO mode: write build error log instead of blocking
REM   Priority: project .forge/config > global ~/.forge/config > env var FORGE_MODE

setlocal enabledelayedexpansion

call :check_yolo

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
    if !YOLO_ACTIVE! equ 1 (
        if not exist "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending" mkdir "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending"
        npx tsc --noEmit > "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending\build-error.log" 2>&1
        echo [yolo] Build errors logged to .claude\.yolo-pending\build-error.log >&2
        exit /b 0
    )
    echo TypeScript compilation failed. Commit blocked.>&2
    npx tsc --noEmit>&2
    exit /b 2
)

REM Karpathy violation check (advisory, non-blocking)
if exist "%CLAUDE_PROJECT_DIR%\scripts\check-karpathy-violations.bat" (
    call "%CLAUDE_PROJECT_DIR%\scripts\check-karpathy-violations.bat"
)

REM README version order check — verify first version listed matches package.json
for /f "tokens=2 delims=: " %%v in ('findstr /r "version" "%CLAUDE_PROJECT_DIR%\package.json" 2^>nul') do set PKG_VER=%%v
set PKG_VER=!PKG_VER:"=!
for %%R in ("%CLAUDE_PROJECT_DIR%\README.md" "%CLAUDE_PROJECT_DIR%\README.zh-CN.md") do (
    if exist %%R (
        for /f "tokens=3 delims=v " %%v in ('findstr /r "^### v" %%R 2^>nul') do (
            set FIRST_VER=%%v
            goto :readme_check_%%~nxR
        )
        :readme_check_%%~nxR
        if not "!FIRST_VER!"=="" if not "!PKG_VER!"=="" (
            if not "!FIRST_VER!"=="!PKG_VER!" (
                echo WARNING: %%~nxR first version !FIRST_VER! does not match package.json !PKG_VER! >&2
            )
        )
        set FIRST_VER=
    )
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

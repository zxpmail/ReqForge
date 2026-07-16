@echo off
REM Hook: PreToolUse before git commit
REM Light commit gate — intentionally narrower than forge-verify:
REM   - Compile: TypeScript only (tsconfig → tsc --noEmit). No tsconfig → skip.
REM     Full language-aware compile = pnpm forge-verify / Phase completion.
REM   - README: ### vX.Y.Z newest-first (same logic as .sh; exit 2 blocks).
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

if not "%TSCONFIG%"=="" (
    for %%i in ("%TSCONFIG%") do set PROJECT_CODE=%%~dpi
    cd /d "%PROJECT_CODE%"

    set TSC_PASS=1
    for /f "usebackq delims=" %%o in (`npx tsc --noEmit 2^>^&1`) do set TSC_PASS=0

    if !TSC_PASS! equ 0 (
        if !YOLO_ACTIVE! equ 1 (
            if not exist "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending" mkdir "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending"
            npx tsc --noEmit > "%CLAUDE_PROJECT_DIR%\.claude\.yolo-pending\build-error.log" 2>&1
            echo [yolo] Build errors logged to .claude\.yolo-pending\build-error.log >&2
        ) else (
            echo TypeScript compilation failed. Commit blocked.>&2
            npx tsc --noEmit>&2
            exit /b 2
        )
    )
)

REM Karpathy violation check (advisory, non-blocking)
if exist "%CLAUDE_PROJECT_DIR%\scripts\check-karpathy-violations.bat" (
    call "%CLAUDE_PROJECT_DIR%\scripts\check-karpathy-violations.bat"
)

REM README version order — prefer shared script; PowerShell fallback matches .sh semantics
if exist "%CLAUDE_PROJECT_DIR%\scripts\hooks\readme-version-order.mjs" (
    node "%CLAUDE_PROJECT_DIR%\scripts\hooks\readme-version-order.mjs"
    if errorlevel 1 exit /b 2
) else (
    set README_ORDER_FAIL=0
    for %%R in ("%CLAUDE_PROJECT_DIR%\README.md" "%CLAUDE_PROJECT_DIR%\README.zh-CN.md") do (
        if exist %%R (
            powershell -NoProfile -Command "$p='%%~fR'; $vs=@(); Get-Content -LiteralPath $p | ForEach-Object { if ($_ -match '^### v(\d+\.\d+\.\d+)') { $vs += $Matches[1] } }; $vs=$vs | Select-Object -First 10; $prev=$null; foreach($v in $vs){ if($prev -and ([version]$v -gt [version]$prev)){ Write-Error ('ERROR: README version order wrong in {0}: {1} comes before {2} (should be newest first)' -f (Split-Path $p -Leaf), $v, $prev); exit 2 }; $prev=$v }; exit 0"
            if errorlevel 1 set README_ORDER_FAIL=1
        )
    )
    if !README_ORDER_FAIL! neq 0 exit /b 2
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

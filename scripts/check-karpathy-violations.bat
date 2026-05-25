@echo off
REM check-karpathy-violations.bat
REM Optional pre-commit helper: detects Karpathy-principle violations in staged diff.
REM Advisory only — always exits 0.

setlocal enabledelayedexpansion

REM --- Check for oversized single-file diff ---
set MAX_DIFF=200
set VIOLATIONS=0

for /f "tokens=1,2,3" %%a in ('git diff --cached --numstat 2^>nul') do (
    if %%a gtr !MAX_DIFF! (
        echo [Karpathy] Simplicity First: %%c has %%a added lines (^>%MAX_DIFF%^).
        echo    Consider splitting into smaller changes.
        set /a VIOLATIONS+=1
    )
)

REM --- Check for format-only changes ---
for /f "tokens=1" %%a in ('git diff --cached 2^>nul ^| findstr /r "^[+-]" ^| findstr /v "^[+-][+-][+-]" ^| find /c /v ""') do set TOTAL=%%a
for /f "tokens=1" %%a in ('git diff --cached --ignore-all-space --ignore-blank-lines 2^>nul ^| findstr /r "^[+-]" ^| findstr /v "^[+-][+-][+-]" ^| find /c /v ""') do set FORMAT_TOTAL=%%a

if defined TOTAL if defined FORMAT_TOTAL (
    if not "!TOTAL!"=="0" (
        set /a FORMAT_DIFF=!TOTAL!-!FORMAT_TOTAL!
        set /a FORMAT_RATIO=!FORMAT_DIFF!*100/!TOTAL!
        if !FORMAT_RATIO! lss 50 (
            echo [Karpathy] Surgical Changes: !FORMAT_DIFF!/!TOTAL! lines are format-only.
            echo    These should not be in same commit as functional changes.
            set /a VIOLATIONS+=1
        )
    )
)

if !VIOLATIONS! gtr 0 (
    echo.
    echo Karpathy violations detected (advisory, non-blocking^).
)

exit /b 0

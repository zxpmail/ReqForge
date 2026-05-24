@echo off
REM Hook: SessionStart
REM 0) Inject forge-bootstrap iron laws (always)
REM 1) Check FEEDBACK-INDEX.md -> mandatory evolution dispatch
REM 2) Project state (Product-Spec / DEV-PLAN / code) routing

setlocal enabledelayedexpansion

set "PROJECT_DIR=%CLAUDE_PROJECT_DIR%"
if "%PROJECT_DIR%"=="" set "PROJECT_DIR=%CD%"

set "HOOK_DIR=%~dp0"
if "%HOOK_DIR:~-1%"=="\" set "HOOK_DIR=%HOOK_DIR:~0,-1%"

set "BOOTSTRAP_FILE="
if exist "%PROJECT_DIR%\.claude\templates\forge-bootstrap.md" set "BOOTSTRAP_FILE=%PROJECT_DIR%\.claude\templates\forge-bootstrap.md"
if "%BOOTSTRAP_FILE%"=="" if exist "%PROJECT_DIR%\.cursor\rules\templates\forge-bootstrap.md" set "BOOTSTRAP_FILE=%PROJECT_DIR%\.cursor\rules\templates\forge-bootstrap.md"
if "%BOOTSTRAP_FILE%"=="" if exist "%PROJECT_DIR%\.opencode\templates\forge-bootstrap.md" set "BOOTSTRAP_FILE=%PROJECT_DIR%\.opencode\templates\forge-bootstrap.md"
if "%BOOTSTRAP_FILE%"=="" if exist "%PROJECT_DIR%\core\templates\forge-bootstrap.md" set "BOOTSTRAP_FILE=%PROJECT_DIR%\core\templates\forge-bootstrap.md"
if "%BOOTSTRAP_FILE%"=="" if exist "%HOOK_DIR%\..\templates\forge-bootstrap.md" set "BOOTSTRAP_FILE=%HOOK_DIR%\..\templates\forge-bootstrap.md"

if not "%BOOTSTRAP_FILE%"=="" (
  node -e "const fs=require('fs');const p=process.argv[1];const t=fs.readFileSync(p,'utf8').replace(/\s+/g,' ').trim();console.log(JSON.stringify({additionalContext:'Session Iron Laws (MANDATORY - forge-bootstrap): '+t}));" "%BOOTSTRAP_FILE%"
) else (
  echo {"additionalContext": "Session Iron Laws (MANDATORY): Skill before action. No /dev-builder or /dev-planner until Product-Spec.md saved and user confirmed. No app code under src|app|lib|packages until then. No /dev-builder without DEV-PLAN.md. Use /bug-fixer with repro + failing test. Hook blocks are hard stops. One Phase per /dev-builder invocation."}
)

set "FEEDBACK_INDEX="
if exist "%PROJECT_DIR%\.claude\feedback\FEEDBACK-INDEX.md" set "FEEDBACK_INDEX=%PROJECT_DIR%\.claude\feedback\FEEDBACK-INDEX.md"
if "%FEEDBACK_INDEX%"=="" if exist "%PROJECT_DIR%\.cursor\rules\feedback\FEEDBACK-INDEX.md" set "FEEDBACK_INDEX=%PROJECT_DIR%\.cursor\rules\feedback\FEEDBACK-INDEX.md"
if "%FEEDBACK_INDEX%"=="" if exist "%PROJECT_DIR%\.opencode\feedback\FEEDBACK-INDEX.md" set "FEEDBACK_INDEX=%PROJECT_DIR%\.opencode\feedback\FEEDBACK-INDEX.md"
if "%FEEDBACK_INDEX%"=="" if exist "%PROJECT_DIR%\core\feedback\FEEDBACK-INDEX.md" set "FEEDBACK_INDEX=%PROJECT_DIR%\core\feedback\FEEDBACK-INDEX.md"
if "%FEEDBACK_INDEX%"=="" if exist "%HOOK_DIR%\..\feedback\FEEDBACK-INDEX.md" set "FEEDBACK_INDEX=%HOOK_DIR%\..\feedback\FEEDBACK-INDEX.md"

if not "%FEEDBACK_INDEX%"=="" (
  set COUNT=0
  for /f "usebackq tokens=*" %%a in ("%FEEDBACK_INDEX%") do (
    set "LINE=%%a"
    if "!LINE:~0,3!"=="- [" set /a COUNT+=1
  )
  if !COUNT! gtr 0 (
    echo {"additionalContext": "Mandatory action: Project has !COUNT! feedback entries with scored data. You MUST dispatch evolution-runner sub-agent now to scan for evolution proposals. Do not skip this step."}
  )
)

set HAS_SPEC=0
set HAS_PLAN=0
set HAS_CODE=0
if exist "%PROJECT_DIR%\Product-Spec.md" set HAS_SPEC=1
if exist "%PROJECT_DIR%\DEV-PLAN.md" set HAS_PLAN=1
if exist "%PROJECT_DIR%\src" set HAS_CODE=1
if "%HAS_CODE%"=="0" if exist "%PROJECT_DIR%\app" set HAS_CODE=1
if "%HAS_CODE%"=="0" if exist "%PROJECT_DIR%\lib" set HAS_CODE=1
if "%HAS_CODE%"=="0" if exist "%PROJECT_DIR%\packages" set HAS_CODE=1

set "STATE_MSG=Project state: Product-Spec"
if "%HAS_SPEC%"=="0" (set "STATE_MSG=%STATE_MSG% ❌") else (set "STATE_MSG=%STATE_MSG% ✅")
set "STATE_MSG=%STATE_MSG%, DEV-PLAN"
if "%HAS_PLAN%"=="0" (set "STATE_MSG=%STATE_MSG% ❌") else (set "STATE_MSG=%STATE_MSG% ✅")
set "STATE_MSG=%STATE_MSG%, Code"
if "%HAS_CODE%"=="0" (set "STATE_MSG=%STATE_MSG% ❌") else (set "STATE_MSG=%STATE_MSG% ✅")
set "STATE_MSG=%STATE_MSG%."

if "%HAS_SPEC%"=="0" (
  set "STATE_MSG=%STATE_MSG% Next: describe your product idea to generate Product-Spec.md (use /product-spec-builder). HARD-GATE: no /dev-builder or app code until Spec confirmed."
) else if "%HAS_PLAN%"=="0" (
  set "STATE_MSG=%STATE_MSG% Next: generate DEV-PLAN.md from your spec (use /dev-planner). HARD-GATE: no /dev-builder until plan exists."
) else if "%HAS_CODE%"=="0" (
  set "STATE_MSG=%STATE_MSG% Next: start building (use /dev-builder)."
) else (
  set "STATE_MSG=%STATE_MSG% In development - continue with current phase or /dev-builder."
)

node -e "console.log(JSON.stringify({additionalContext: process.argv[1]}));" "%STATE_MSG%"

exit /b 0

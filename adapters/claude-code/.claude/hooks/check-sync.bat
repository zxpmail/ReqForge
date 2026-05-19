@echo off
REM Hook: PostToolUse — check if core/ files diverge from adapters/
REM Only fires when core/ exists (ReqForge self-development context)
REM Returns additionalContext when sync is needed

setlocal enabledelayedexpansion

set "PROJECT_DIR=%CLAUDE_PROJECT_DIR%"
if "%PROJECT_DIR%"=="" set "PROJECT_DIR=%CD%"

if not exist "%PROJECT_DIR%\core\skills\dev-builder\SKILL.md" exit /b 0

for /f %%i in ('cd /d "%PROJECT_DIR%" && certutil -hashfile core\skills\dev-builder\SKILL.md MD5 ^| find /v "MD5" ^| find /v "CertUtil"') do set "CORE_HASH=%%i"
for /f %%i in ('cd /d "%PROJECT_DIR%" && certutil -hashfile adapters\claude-code\.claude\skills\dev-builder\SKILL.md MD5 ^| find /v "MD5" ^| find /v "CertUtil"') do set "ADAPTER_HASH=%%i"

if not "!CORE_HASH!"=="!ADAPTER_HASH!" (
  echo {"additionalContext": "SynCheck: core/skills/ differs from adapters/ — run pnpm sync before committing."}
)

exit /b 0

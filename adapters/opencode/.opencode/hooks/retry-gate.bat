@echo off
REM Retry Gate: block auto-retry when retry limit is reached
REM Reads .forge/.retry-counter.json and prevents infinite review-fix loops
REM State "escalated" = block, "active" with retries >= max = block, otherwise pass

setlocal enabledelayedexpansion

set RETRY_FILE=%CLAUDE_PROJECT_DIR%\.forge\.retry-counter.json

if not exist "%RETRY_FILE%" exit /b 0

REM Parse JSON values using findstr (no node dependency needed)
set STATE=
for /f "usebackq delims=" %%a in (`findstr /i "state" "%RETRY_FILE%" 2^>nul`) do (
  set LINE=%%a
  set LINE=!LINE: =!
  for /f "tokens=2 delims=:" %%b in ("!LINE!") do (
    set VAL=%%b
    set VAL=!VAL:"=!
    set VAL=!VAL:,=!
    if "!VAL!"=="active" set STATE=active
    if "!VAL!"=="escalated" set STATE=escalated
    if "!VAL!"=="resolved" set STATE=resolved
  )
)

set RETRIES=0
for /f "usebackq delims=" %%a in (`findstr /i "retries" "%RETRY_FILE%" 2^>nul ^| findstr /v "max_retries"`) do (
  set LINE=%%a
  set LINE=!LINE: =!
  for /f "tokens=2 delims=:" %%b in ("!LINE!") do set RETRIES=%%b
)

set MAX=3
for /f "usebackq delims=" %%a in (`findstr /i "max_retries" "%RETRY_FILE%" 2^>nul`) do (
  set LINE=%%a
  set LINE=!LINE: =!
  for /f "tokens=2 delims=:" %%b in ("!LINE!") do set MAX=%%b
)

if /i "!STATE!"=="escalated" (
    echo {"decision": "block", "reason": "Retry limit reached (escalated). The auto-fix loop cannot continue. Present options to the user: A) Manual fix, B) Skip task, C) Adjust approach."}
    exit /b 0
)

if /i "!STATE!"=="active" (
    if !RETRIES! geq !MAX! (
        echo {"decision": "block", "reason": "Retry count (!RETRIES!) has reached the limit (!MAX!). Set state to escalated and present options to the user."}
        exit /b 0
    )
)

exit /b 0

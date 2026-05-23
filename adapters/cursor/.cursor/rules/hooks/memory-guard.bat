@echo off
REM PostToolUse: memory guard — compaction + handoff tip (delegates to legacy scripts)

set "HOOK_DIR=%~dp0"
call "%HOOK_DIR%context-compaction.bat"
call "%HOOK_DIR%check-handoff.bat"
exit /b 0

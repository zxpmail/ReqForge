@echo off
REM Hook: PreToolUse
REM Hallucination Gate: Verify file paths before Write/Edit operations

setlocal enabledelayedexpansion

set /p INPUT=
for /f "tokens=2 delims=:, " %%a in ('echo %INPUT% ^| findstr /i "tool_input"') do set FILE_PATH=%%a
if "%FILE_PATH%"=="" exit /b 0

REM Check parent directory exists
for %%f in ("%FILE_PATH%") do set PARENT=%%~dpf
if exist "%PARENT%" exit /b 0

REM Allow node_modules virtual directories
echo "%PARENT%" | findstr /i "node_modules" >nul && exit /b 0
echo "%PARENT%" | findstr /i ".pnpm" >nul && exit /b 0

echo {"decision":"block","reason":"Hallucination Gate: target directory '%PARENT%' does not exist. Verify the correct path before writing."}
exit /b 0

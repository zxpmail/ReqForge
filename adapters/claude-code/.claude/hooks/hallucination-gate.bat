@echo off
REM Hook: PreToolUse
REM Hallucination Gate: Verify file paths before Write/Edit operations (Windows)

setlocal enabledelayedexpansion

set /p INPUT=
if "%INPUT%"=="" exit /b 0

for /f "delims=" %%t in ('node -e "try{const j=JSON.parse(process.argv[1]);process.stdout.write(j.tool_name||j.tool||'')}catch(e){}" "%INPUT%"') do set TOOL_NAME=%%t
for /f "delims=" %%p in ('node -e "try{const j=JSON.parse(process.argv[1]);const ti=j.tool_input||{};process.stdout.write(ti.file_path||ti.path||'')}catch(e){}" "%INPUT%"') do set FILE_PATH=%%p

if /i not "%TOOL_NAME%"=="Write" if /i not "%TOOL_NAME%"=="Edit" exit /b 0
if "%FILE_PATH%"=="" exit /b 0

for %%f in ("%FILE_PATH%") do set PARENT=%%~dpf
if exist "%PARENT%" exit /b 0

echo "%PARENT%" | findstr /i "node_modules" >nul && exit /b 0
echo "%PARENT%" | findstr /i ".pnpm" >nul && exit /b 0

echo {"decision":"block","reason":"Hallucination Gate: target directory '%PARENT%' does not exist. Verify the correct path before writing."}
exit /b 0

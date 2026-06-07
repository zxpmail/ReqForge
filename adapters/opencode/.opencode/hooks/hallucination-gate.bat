@echo off
REM Hook: PreToolUse
REM 1) Spec-Before-Code Gate  2) Hallucination Gate (paths)

setlocal enabledelayedexpansion

set /p INPUT=
if "%INPUT%"=="" exit /b 0

set "HOOK_DIR=%~dp0"
set "ROOT=%HOOK_DIR%..\.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "PRETMP=%TEMP%\forge-pretool-%RANDOM%.json"
> "%PRETMP%" echo !INPUT!

node "%ROOT%\scripts\hooks\spec-before-code-gate.mjs" < "%PRETMP%" > "%TEMP%\forge-spec-gate-out.txt" 2>nul
for %%A in ("%TEMP%\forge-spec-gate-out.txt") do if %%~zA gtr 0 (
  type "%TEMP%\forge-spec-gate-out.txt"
  del "%PRETMP%" 2>nul
  exit /b 0
)

for /f "delims=" %%t in ('node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(j.tool_name||j.tool||'');" "%PRETMP%"') do set TOOL_NAME=%%t
for /f "delims=" %%p in ('node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const ti=j.tool_input||{};process.stdout.write(ti.file_path||ti.path||'');" "%PRETMP%"') do set FILE_PATH=%%p

del "%PRETMP%" 2>nul

if /i not "%TOOL_NAME%"=="Write" if /i not "%TOOL_NAME%"=="Edit" exit /b 0
if "%FILE_PATH%"=="" exit /b 0

for %%f in ("%FILE_PATH%") do set "PARENT=%%~dpf"
if exist "%PARENT%" exit /b 0

echo "%PARENT%" | findstr /i "node_modules" >nul && exit /b 0
echo "%PARENT%" | findstr /i ".pnpm" >nul && exit /b 0

echo {"decision":"block","reason":"Hallucination Gate: target directory '%PARENT%' does not exist. Verify the correct path before writing.\n\n─── Recovery Options ───\n1. Run 'dir' to list existing directories in the parent\n2. Correct the file_path to use an existing directory\n3. If the directory should be created, use 'mkdir' first\n4. Then retry this write."}
exit /b 0

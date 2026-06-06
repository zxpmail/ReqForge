@echo off
REM Hook: PostToolUse after git commit
REM Auto-push after successful commit

setlocal enabledelayedexpansion

more > "%TEMP%\forge_hook_stdin.txt"

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$c=Get-Content '%TEMP%\forge_hook_stdin.txt' -Raw 2>$null; if($c){try{$j=$c|ConvertFrom-Json; if($j.tool_exit_code -ne $null){$j.tool_exit_code}else{$j.exit_code}}catch{''}}else{''}" 2^>nul`) do set EXIT_CODE=%%i

del "%TEMP%\forge_hook_stdin.txt" 2>nul

if "%EXIT_CODE%"=="0" (
    git push 2>&1 || ver>nul
)

exit /b 0

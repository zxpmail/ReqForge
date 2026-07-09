@echo off
REM Post-Tool-Use hook: compact task-history.md when it exceeds 30 entries
REM Archives old entries to keep context lean and prevent context rot
REM Runs silently — only modifies files when compaction actually happens

setlocal enabledelayedexpansion

set "PROJECT_DIR=%CLAUDE_PROJECT_DIR%"
if "%PROJECT_DIR%"=="" set "PROJECT_DIR=%CD%"
set "TASK_HISTORY=%PROJECT_DIR%\memory\task-history.md"

REM Skip if not initialized yet
if not exist "%TASK_HISTORY%" exit /b 0

REM Count data rows using PowerShell
for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "$f='%TASK_HISTORY%'; $lines=Get-Content $f; $count=0; foreach($l in $lines){if($l -match '^\| \d'){$count++}}; echo $count"`) do set "ENTRY_COUNT=%%a"

if "%ENTRY_COUNT%"=="" exit /b 0
if %ENTRY_COUNT% LEQ 30 exit /b 0

REM Compact via PowerShell — keep last 25 entries, archive the rest
set "ARCHIVE_FILE=%PROJECT_DIR%\memory\task-history-archive.md"

powershell -NoProfile -Command ^
  "$f='%TASK_HISTORY%';" ^
  "$af='%ARCHIVE_FILE%';" ^
  "$lines=Get-Content $f;" ^
  "$headerEnd=0; $tableStart=0; $i=0;" ^
  "foreach($l in $lines){$i++; if($l -match '^\|---'){$headerEnd=$i; if($tableStart -eq 0){$tableStart=$i}}}" ^
  "$firstData=$tableStart+1;" ^
  "$excess=($lines.Count - $firstData + 1) - 25;" ^
  "if($excess -le 0){exit};" ^
  "$archived=@();" ^
  "for($j=$firstData; $j -lt ($firstData+$excess); $j++){$archived+=$lines[$j-1]};" ^
  "Add-Content $af '';" ^
  "Add-Content $af '### Archived on %DATE%';" ^
  "Add-Content $af '';" ^
  "$archived | Add-Content $af;" ^
  "$keep=@();" ^
  "for($j=0;$j -lt ($firstData+$excess-1);$j++){$keep+=$lines[$j]};" ^
  "for($j=$firstData+$excess-1;$j -lt $lines.Count;$j++){$keep+=$lines[$j]};" ^
  "Set-Content $f $keep"

exit /b 0
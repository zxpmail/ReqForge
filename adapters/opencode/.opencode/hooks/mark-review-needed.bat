@echo off
REM PostToolUse hook: mark code files as needing review after edit/create
REM Uses PowerShell to parse JSON stdin and check file extension

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"try {$c = [Console]::In.ReadToEnd(); if ($c) {$fp = ($c ^| ConvertFrom-Json).tool_input.file_path; if ($fp) {$ext = [IO.Path]::GetExtension($fp).ToLower(); $excluded = @('.md','.txt','.json','.yaml','.yml','.toml','.log','.lock','.env'); if (-not ($excluded -contains $ext)) {$dir = [Environment]::GetEnvironmentVariable('CLAUDE_PROJECT_DIR'); if ($dir) {$nf = [IO.Path]::Combine($dir, '.claude', '.needs-review'); try {[IO.File]::WriteAllText($nf, 'needs_review')} catch {}}}}}}" catch {}"

exit /b 0

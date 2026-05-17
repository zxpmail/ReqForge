@echo off
REM Hook: UserPromptSubmit
REM Delegate to PowerShell script for Chinese keyword matching
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0detect-feedback-signal.ps1"
exit /b 0

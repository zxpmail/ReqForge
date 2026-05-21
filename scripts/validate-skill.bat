@echo off
REM validate-skill.bat — Windows wrapper for validate-skill.sh
REM Requires Git Bash (sh) on PATH

sh "%~dp0validate-skill.sh" %*
exit /b %ERRORLEVEL%

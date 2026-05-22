@echo off
REM create-skill.bat — Windows wrapper for create-skill.sh
REM Requires Git Bash (sh) on PATH

sh "%~dp0create-skill.sh" %*
exit /b %ERRORLEVEL%

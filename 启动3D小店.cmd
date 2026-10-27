@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not defined NOODLE_PORT set "NOODLE_PORT=4174"
where node >nul 2>nul
if %errorlevel%==0 goto systemnode
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" goto bundlednode
echo 请安装 Node.js，然后重新双击此文件。
pause
exit /b 1
:systemnode
start "" http://127.0.0.1:%NOODLE_PORT%
node server.cjs
goto end
:bundlednode
start "" http://127.0.0.1:%NOODLE_PORT%
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.cjs
:end
pause

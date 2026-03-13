@echo off
setlocal

set "ROOT=%~dp0"
set "PHP=%ROOT%php_runtime\php.exe"

if not exist "%PHP%" (
  echo Could not find bundled PHP at: "%PHP%"
  echo Install PHP and add it to PATH, or restore php_runtime/.
  pause
  exit /b 1
)

set "HOST=127.0.0.1"
set "PORT=8000"

echo Starting PHP server at http://%HOST%:%PORT%/
echo Tip: open your CMS page via the PHP server URL (not VS Code Live Server) so uploads/save work.
echo Example: http://127.0.0.1:8000/wwieufbwiesudnoweidjnowaesidkwuaehfbcweiufbcwkeufbweaukifbcawuedfwbieuoaieufbweiuafb.html
echo.

"%PHP%" -S %HOST%:%PORT% -t "%ROOT%"

endlocal


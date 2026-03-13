param(
  [string]$HostName = "127.0.0.1",
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$php = Join-Path $root "php_runtime\\php.exe"

if (-not (Test-Path $php)) {
  Write-Host "Could not find bundled PHP at: $php" -ForegroundColor Red
  Write-Host "Install PHP and ensure it's on PATH, or restore php_runtime/." -ForegroundColor Yellow
  exit 1
}

Write-Host ("Starting PHP server at http://{0}:{1}/" -f $HostName, $Port) -ForegroundColor Green
Write-Host "Tip: open your CMS page via the PHP server URL (not VS Code Live Server) so uploads/save work." -ForegroundColor Yellow
Write-Host "Example: http://127.0.0.1:8000/wwieufbwiesudnoweidjnowaesidkwuaehfbcweiufbcwkeufbweaukifbcawuedfwbieuoaieufbweiuafb.html" -ForegroundColor DarkGray

& $php -S "$HostName`:$Port" -t $root


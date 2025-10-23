$Root = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) ".."

$backend = Start-Process "npm" -ArgumentList "--prefix", (Join-Path $Root "backend"), "run", "dev" -PassThru -NoNewWindow
$frontend = Start-Process "npm" -ArgumentList "--prefix", (Join-Path $Root "frontend"), "run", "dev" -PassThru -NoNewWindow

Write-Host "Frontend and backend dev servers running. Press Ctrl+C to stop." -ForegroundColor Green

try {
    Wait-Process -Id $backend.Id, $frontend.Id
}
finally {
    if (!$backend.HasExited) { Stop-Process -Id $backend.Id -Force }
    if (!$frontend.HasExited) { Stop-Process -Id $frontend.Id -Force }
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Claude Code + OmniRoute (Unlimited Tokens Active)      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if OmniRoute server is running
$health = omniroute health 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting OmniRoute daemon..." -ForegroundColor Yellow
    omniroute serve --daemon
    Start-Sleep -Seconds 2
} else {
    Write-Host "OmniRoute is active on http://localhost:20128" -ForegroundColor Green
}

Write-Host "Active Providers: Gemini, Moonshot, OpenAI (Configured)" -ForegroundColor Cyan
Write-Host "`nLaunching Claude Code via OmniRoute..." -ForegroundColor Green
Write-Host "==========================================================`n" -ForegroundColor Cyan

omniroute launch

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Claude Code + Google Gemini 2.0 Flash (Free & Fast)    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Check for GEMINI_API_KEY in environment or .env.gemini
$envFile = "$PSScriptRoot\.env.gemini"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*GEMINI_API_KEY\s*=\s*(.+)$") {
            $env:GEMINI_API_KEY = $matches[1].Trim()
        }
    }
}

if (-not $env:GEMINI_API_KEY) {
    Write-Host "`nGoogle Gemini API Key chahiye (100% Free)." -ForegroundColor Yellow
    Write-Host "Agar aapke paas key nahi hai toh
     yahan se turant free banayein: https://aistudio.google.com/app/apikey" -ForegroundColor Cyan
    $key = Read-Host "`nEnter your Gemini API Key"
    if ($key) {
        $env:GEMINI_API_KEY = $key.Trim()
        Set-Content -Path $envFile -Value "GEMINI_API_KEY=$($env:GEMINI_API_KEY)"
        Write-Host "Key saved to .env.gemini for future runs!`n" -ForegroundColor Green
    } else {
        Write-Host "API key enter nahi ki gayi. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n1. Starting Gemini 2.0 Flash LiteLLM proxy on port 4000..." -ForegroundColor Yellow
# Stop any existing process on port 4000
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$litellmExe = "$env:APPDATA\Python\Python314\Scripts\litellm.exe"
if (-not (Test-Path $litellmExe)) {
    $litellmExe = "litellm"
}

# Start LiteLLM proxy in the background
$proxyProcess = Start-Process $litellmExe -ArgumentList "--model gemini/gemini-2.0-flash --port 4000" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

Write-Host "2. LiteLLM Proxy is running in background (PID: $($proxyProcess.Id))!" -ForegroundColor Green
Write-Host "3. Connecting Claude Code to Gemini Proxy..." -ForegroundColor Yellow

$env:ANTHROPIC_BASE_URL = "http://localhost:4000"
$env:ANTHROPIC_API_KEY = "dummy"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Launching Claude Code! (Gemini API Connected)          " -ForegroundColor Green
Write-Host "==========================================================`n" -ForegroundColor Cyan

try {
    claude
} finally {
    Write-Host "`nStopping Gemini LiteLLM proxy..." -ForegroundColor Gray
    Stop-Process -Id $proxyProcess.Id -Force -ErrorAction SilentlyContinue
}

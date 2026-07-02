$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js was not found. Install the LTS version from https://nodejs.org/' -ForegroundColor Red
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $root 'node_modules\vite\bin\vite.js'))) {
    Write-Host 'Preparing CanvasNote for the first launch...'
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$portInUse = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $portInUse) {
    Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev','--','--host','127.0.0.1') -WorkingDirectory $root -WindowStyle Hidden
}

$ready = $false
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5173' -TimeoutSec 1
        if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 500
}

if (-not $ready) {
    Write-Host 'CanvasNote could not start. Port 5173 may be unavailable.' -ForegroundColor Red
    exit 1
}

Start-Process 'http://127.0.0.1:5173'
Write-Host 'CanvasNote is open at http://127.0.0.1:5173' -ForegroundColor Green

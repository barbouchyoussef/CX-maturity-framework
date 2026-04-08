$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

$python = Get-Command python -ErrorAction SilentlyContinue
$py = Get-Command py -ErrorAction SilentlyContinue

if (-not $python -and -not $py) {
    Write-Error "Python is not installed or not on PATH. Install Python 3.11+, then rerun this script."
}

if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Installing frontend dependencies..."
    Push-Location $frontend
    npm.cmd install
    Pop-Location
}

Write-Host "Installing/updating backend dependencies..."
Push-Location $backend
if ($python) {
    & python -m pip install -r requirements.txt
} else {
    & py -m pip install -r requirements.txt
}
Pop-Location

Write-Host "Starting FastAPI backend on http://127.0.0.1:8000 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    (Join-Path $backend "run.ps1")
)

Write-Host "Starting Vite frontend on http://localhost:5173 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd `"$frontend`"; npm.cmd run dev"
)

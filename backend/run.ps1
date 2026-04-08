$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$python = Get-Command python -ErrorAction SilentlyContinue

if ($python) {
    & python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
} else {
    & py -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
}

# Local dev: backend (8000) + frontend (5173)
# Requires: Python 3.12+, Node 20+, Postgres on localhost:5432 (or set DATABASE_URL in backend/.env)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path "$root\backend\.env")) {
  Copy-Item "$root\backend\.env.example" "$root\backend\.env"
  Write-Host "Created backend/.env from .env.example — edit JWT_SECRET and DATABASE_URL if needed."
}

Write-Host "Checking Postgres (localhost:5432)..."
$pg = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
if (-not $pg.TcpTestSucceeded) {
  Write-Host ""
  Write-Host "Postgres is not running on port 5432."
  Write-Host "  Option A: Install Docker Desktop, then: docker compose up postgres -d"
  Write-Host "  Option B: Install PostgreSQL locally (user orbit / password orbit / db orbitdb)"
  Write-Host "  Option C: Paste your Railway DATABASE_URL into backend/.env"
  Write-Host ""
}

Write-Host "Running migrations..."
Push-Location "$root\backend"
python -m alembic upgrade head
Pop-Location

Write-Host "Starting backend on http://127.0.0.1:8000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

Write-Host "Starting frontend on http://localhost:5173 ..."
Push-Location "$root\frontend"
npm run dev

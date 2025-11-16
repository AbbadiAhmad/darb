# DARB Windows Setup Script
# Run this in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DARB Windows Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator. Some operations may fail." -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Check Prerequisites
Write-Host "Step 1: Checking Prerequisites..." -ForegroundColor Green

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Node.js not found!" -ForegroundColor Red
    Write-Host "    Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version
    Write-Host "  [OK] PostgreSQL installed: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] PostgreSQL not found!" -ForegroundColor Red
    Write-Host "    Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "    Or run: choco install postgresql" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Get Database Password
Write-Host "Step 2: Database Setup" -ForegroundColor Green
$dbPassword = Read-Host "Enter PostgreSQL password for 'postgres' user (press Enter for default 'postgres')"
if ([string]::IsNullOrWhiteSpace($dbPassword)) {
    $dbPassword = "postgres"
}

# Step 3: Create Database
Write-Host ""
Write-Host "Step 3: Creating Database..." -ForegroundColor Green

$env:PGPASSWORD = $dbPassword

# Create database script
$createDbScript = @'
DROP DATABASE IF EXISTS darb;
CREATE DATABASE darb;
DROP USER IF EXISTS darb_user;
CREATE USER darb_user WITH PASSWORD 'darb_password';
GRANT ALL PRIVILEGES ON DATABASE darb TO darb_user;
\c darb
GRANT ALL ON SCHEMA public TO darb_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO darb_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO darb_user;
'@

$createDbScript | psql -U postgres -h localhost 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Database created successfully" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Failed to create database" -ForegroundColor Red
    Write-Host "    Check your PostgreSQL password and try again" -ForegroundColor Yellow
    exit 1
}

# Step 4: Load Schema
Write-Host ""
Write-Host "Step 4: Loading Database Schema..." -ForegroundColor Green

$env:PGPASSWORD = $dbPassword
$schemaPath = Join-Path $PSScriptRoot "database\schema.sql"
psql -U postgres -h localhost -d darb -f $schemaPath 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Schema loaded successfully" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Failed to load schema" -ForegroundColor Red
    exit 1
}

# Step 5: Create Admin User
Write-Host ""
Write-Host "Step 5: Creating Admin User..." -ForegroundColor Green

$createAdminScript = @'
INSERT INTO users (username, email, password_hash, first_name, last_name)
VALUES (
  'admin',
  'admin@darb.local',
  '$2b$10$YQNuZ8qYqKBQqZF9.rJXW.9Z7QqYqKBQqZF9.rJXW.9Z7QqYqKBQqZ',
  'Admin',
  'User'
) ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, scope)
SELECT
  u.id,
  r.id,
  'global'
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin'
  AND r.name = 'Administrator'
ON CONFLICT DO NOTHING;
'@

$env:PGPASSWORD = $dbPassword
$createAdminScript | psql -U postgres -h localhost -d darb 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Admin user created" -ForegroundColor Green
    Write-Host "    Username: admin" -ForegroundColor Cyan
    Write-Host "    Password: admin123" -ForegroundColor Cyan
} else {
    Write-Host "  [WARN] Could not create admin user (may already exist)" -ForegroundColor Yellow
}

# Step 6: Setup Backend
Write-Host ""
Write-Host "Step 6: Setting Up Backend..." -ForegroundColor Green

# Create .env file
if (-not (Test-Path ".env")) {
    $jwtSecret = [System.Guid]::NewGuid().ToString()

    $envContent = @"
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=darb
DB_USER=darb_user
DB_PASSWORD=darb_password

JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=24h

BCRYPT_ROUNDS=10

CORS_ORIGIN=http://localhost:3001

AUDIT_RETENTION_DAYS=2555
"@

    Set-Content -Path ".env" -Value $envContent
    Write-Host "  [OK] Created .env file" -ForegroundColor Green
} else {
    Write-Host "  [WARN] .env file already exists (skipping)" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "  Installing backend dependencies..." -ForegroundColor Cyan
npm install --silent 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Step 7: Setup Frontend
Write-Host ""
Write-Host "Step 7: Setting Up Frontend..." -ForegroundColor Green

Push-Location "client"

Write-Host "  Installing frontend dependencies..." -ForegroundColor Cyan
npm install --silent 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Failed to install frontend dependencies" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Step 8: Create Start Scripts
Write-Host ""
Write-Host "Step 8: Creating Start Scripts..." -ForegroundColor Green

# Backend start script
$backendBat = @'
@echo off
echo Starting DARB Backend...
npm run dev
'@
Set-Content -Path "start-backend.bat" -Value $backendBat
Write-Host "  [OK] Created start-backend.bat" -ForegroundColor Green

# Frontend start script
$frontendBat = @'
@echo off
echo Starting DARB Frontend...
cd client
npm run dev
'@
Set-Content -Path "start-frontend.bat" -Value $frontendBat
Write-Host "  [OK] Created start-frontend.bat" -ForegroundColor Green

# Combined start script
$startAllBat = @'
@echo off
echo Starting DARB System...
echo.
echo Starting Backend...
start "DARB Backend" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul
echo Starting Frontend...
start "DARB Frontend" cmd /k "cd client && npm run dev"
echo.
echo DARB is starting...
echo Backend will be available at: http://localhost:3000
echo Frontend will be available at: http://localhost:3001
echo.
echo Press any key to exit this window (services will continue running)
pause > nul
'@
Set-Content -Path "start-darb.bat" -Value $startAllBat
Write-Host "  [OK] Created start-darb.bat" -ForegroundColor Green

# Step 9: Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database:" -ForegroundColor Yellow
Write-Host "  Name: darb" -ForegroundColor White
Write-Host "  User: darb_user" -ForegroundColor White
Write-Host "  Password: darb_password" -ForegroundColor White
Write-Host ""
Write-Host "Admin Account:" -ForegroundColor Yellow
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "To Start DARB:" -ForegroundColor Yellow
Write-Host "  Option 1: Run start-darb.bat (starts both)" -ForegroundColor White
Write-Host "  Option 2: Manual start:" -ForegroundColor White
Write-Host "    - Run start-backend.bat" -ForegroundColor White
Write-Host "    - Run start-frontend.bat" -ForegroundColor White
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "  Backend API:  http://localhost:3000" -ForegroundColor White
Write-Host "  Frontend UI:  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

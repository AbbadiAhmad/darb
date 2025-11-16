# Windows Setup Guide for DARB

## Quick Setup (Automated)

### Option 1: Using PowerShell Script (Recommended)

1. **Open PowerShell as Administrator**:
   - Press `Windows + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Navigate to DARB directory**:
   ```powershell
   cd C:\Abbadi-local\Dar\darb
   ```

3. **Run setup script**:
   ```powershell
   # Allow script execution (one-time)
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

   # Run setup
   .\setup-windows.ps1
   ```

4. **Follow the prompts**:
   - Enter your PostgreSQL password (default: `postgres`)
   - Script will automatically:
     - Create database and user
     - Load schema
     - Create admin user
     - Install dependencies
     - Create start scripts

5. **Start DARB**:
   ```powershell
   # Double-click or run:
   .\start-darb.bat
   ```

---

## Manual Setup (If Script Fails)

### Prerequisites

1. **Install Node.js**:
   - Download from: https://nodejs.org/
   - Choose LTS version (20.x or higher)
   - Verify: `node --version`

2. **Install PostgreSQL**:
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, remember the password for 'postgres' user
   - Verify: `psql --version`

### Step-by-Step Setup

#### 1. Create Database

Open **SQL Shell (psql)** from Start Menu:

```sql
-- Create database
CREATE DATABASE darb;

-- Create user
CREATE USER darb_user WITH PASSWORD 'darb_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE darb TO darb_user;

-- Exit
\q
```

#### 2. Load Schema

```powershell
cd C:\Abbadi-local\Dar\darb
psql -U postgres -d darb -f database\schema.sql
```

#### 3. Create Admin User

```powershell
psql -U postgres -d darb
```

```sql
-- Create admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name)
VALUES (
  'admin',
  'admin@darb.local',
  '$2b$10$YQNuZ8qYqKBQqZF9.rJXW.9Z7QqYqKBQqZF9.rJXW.9Z7QqYqKBQqZ',
  'Admin',
  'User'
);

-- Assign Administrator role
INSERT INTO user_roles (user_id, role_id, scope)
SELECT
  u.id,
  r.id,
  'global'
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin'
  AND r.name = 'Administrator';

-- Verify
SELECT u.username, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';

\q
```

#### 4. Setup Backend

```powershell
# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env (use notepad or your preferred editor)
notepad .env
```

**Edit `.env` with these values**:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=darb
DB_USER=darb_user
DB_PASSWORD=darb_password
JWT_SECRET=your-random-secret-key-change-this
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3001
```

#### 5. Setup Frontend

```powershell
cd client
npm install
cd ..
```

#### 6. Start Services

**Backend** (in first PowerShell window):
```powershell
npm run dev
```

**Frontend** (in second PowerShell window):
```powershell
cd client
npm run dev
```

---

## Access Application

- **Frontend UI**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/api/v1/health

**Login Credentials**:
- Username: `admin`
- Password: `admin123`

---

## Common Issues

### Issue 1: PostgreSQL Not Found

**Error**: `'psql' is not recognized as an internal or external command`

**Solution**:
1. Find PostgreSQL bin directory (usually `C:\Program Files\PostgreSQL\15\bin`)
2. Add to System PATH:
   - Windows Settings → System → About → Advanced system settings
   - Environment Variables → System Variables → Path → Edit
   - Add: `C:\Program Files\PostgreSQL\15\bin`
   - Restart PowerShell

### Issue 2: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace <PID> with actual number)
taskkill /PID <PID> /F

# Or change port in .env
# PORT=3001
```

### Issue 3: Database Connection Failed

**Error**: `password authentication failed for user "darb_user"`

**Solution**:
1. Check PostgreSQL service is running:
   - Services (services.msc) → postgresql-x64-15 → Start
2. Verify credentials in `.env` match database setup
3. Check `pg_hba.conf` allows local connections

### Issue 4: npm install Fails

**Solution**:
```powershell
# Clear cache
npm cache clean --force

# Delete node_modules
Remove-Item -Recurse -Force node_modules

# Delete lock file
Remove-Item package-lock.json

# Try again
npm install
```

### Issue 5: Permission Denied

**Error**: Running scripts blocked by execution policy

**Solution**:
```powershell
# Allow for current session only
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Or allow permanently (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned
```

---

## Useful Commands

### Database Management

```powershell
# Connect to database
psql -U darb_user -d darb

# Backup database
pg_dump -U darb_user darb > backup.sql

# Restore database
psql -U darb_user darb < backup.sql

# Reset database (WARNING: destroys all data)
psql -U postgres -c "DROP DATABASE darb;"
psql -U postgres -c "CREATE DATABASE darb;"
psql -U postgres -d darb -f database\schema.sql
```

### Service Management

```powershell
# Start backend (development mode)
npm run dev

# Start backend (production)
npm run build
npm start

# Start frontend
cd client
npm run dev

# Build frontend for production
cd client
npm run build
```

### Check Service Status

```powershell
# Check if backend is running
curl http://localhost:3000/api/v1/health

# Check if PostgreSQL is running
Get-Service postgresql*

# Check ports in use
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432
```

---

## Alternative: Using Docker Desktop

If you prefer Docker, you need to start Docker Desktop first:

1. **Install Docker Desktop for Windows**:
   - Download from: https://www.docker.com/products/docker-desktop/

2. **Start Docker Desktop**:
   - Launch from Start Menu
   - Wait for "Docker Desktop is running" in system tray

3. **Verify Docker is running**:
   ```powershell
   docker ps
   ```

4. **Run DARB**:
   ```powershell
   docker-compose up -d
   ```

**Note**: Docker Desktop requires:
- Windows 10/11 Pro, Enterprise, or Education
- WSL 2 enabled
- Virtualization enabled in BIOS

If you don't have these requirements, use the manual setup instead.

---

## Next Steps

After successful setup:

1. **Test the API**:
   ```powershell
   # Login
   curl -X POST http://localhost:3000/api/v1/auth/login `
     -H "Content-Type: application/json" `
     -d '{\"username\":\"admin\",\"password\":\"admin123\"}'
   ```

2. **Access Frontend**:
   - Open browser: http://localhost:3001
   - Login with admin/admin123

3. **Read Documentation**:
   - [API Documentation](API_DOCUMENTATION.md)
   - [Architecture Guide](ARCHITECTURE.md)
   - [Implementation Notes](IMPLEMENTATION_NOTES.md)

4. **Create Your First Process**:
   - Navigate to Processes
   - Click "Create New Process"
   - Define your workflow

---

## Uninstall

To completely remove DARB:

```powershell
# Stop services
# Press Ctrl+C in backend and frontend windows

# Remove database
psql -U postgres -c "DROP DATABASE darb;"
psql -U postgres -c "DROP USER darb_user;"

# Remove project files
cd ..
Remove-Item -Recurse -Force darb
```

---

## Getting Help

- **Documentation**: Check README.md, SETUP.md, QUICKSTART.md
- **Logs**: Look at terminal output for error details
- **Database**: Use pgAdmin to inspect database
- **Issues**: https://github.com/AbbadiAhmad/darb/issues

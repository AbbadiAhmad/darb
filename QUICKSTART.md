# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 20+ installed (`node --version`)
- ✅ PostgreSQL 15+ installed OR Docker Desktop running
- ✅ npm or yarn package manager

## Option 1: Docker Setup (Recommended)

### Step 1: Start Docker Desktop

**Windows:**
- Open Docker Desktop application
- Wait for "Docker Desktop is running" message in system tray
- Verify: Open PowerShell and run `docker ps`

**macOS/Linux:**
- Start Docker Desktop or Docker daemon
- Verify: `docker ps`

### Step 2: Run with Docker Compose

```bash
# Navigate to project directory
cd darb

# Start all services (PostgreSQL + Backend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Option 2: Manual Setup (No Docker Required)

If Docker Desktop is not available, follow these steps:

### Step 1: Install PostgreSQL

**Windows:**
```powershell
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql

# Start PostgreSQL service
net start postgresql-x64-15
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql-15
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Switch to postgres user (Linux/macOS)
sudo -u postgres psql

# Or on Windows, open pgAdmin or use:
psql -U postgres
```

In PostgreSQL shell:
```sql
CREATE DATABASE darb;
CREATE USER darb_user WITH PASSWORD 'darb_password';
GRANT ALL PRIVILEGES ON DATABASE darb TO darb_user;
\q
```

### Step 3: Load Database Schema

```bash
# Navigate to project directory
cd darb

# Load schema
psql -U darb_user -d darb -f database/schema.sql

# On Windows:
psql -U postgres -d darb -f database/schema.sql
```

### Step 4: Install Backend Dependencies

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Step 5: Configure Environment

Edit `.env` file:
```env
NODE_ENV=development
PORT=3000

# Update these to match your PostgreSQL setup
DB_HOST=localhost
DB_PORT=5432
DB_NAME=darb
DB_USER=darb_user
DB_PASSWORD=darb_password

# Generate a secure secret
JWT_SECRET=your_secure_random_secret_key_here
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:3001
```

### Step 6: Start Backend

```bash
# Development mode with auto-reload
npm run dev

# Or build and run production
npm run build
npm start
```

Backend will start at: http://localhost:3000

### Step 7: Setup Frontend

Open a new terminal:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start at: http://localhost:3001

### Step 8: Create Admin User

Connect to database and create first user:

```bash
psql -U darb_user -d darb
```

```sql
-- Create admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name)
VALUES (
  'admin',
  'admin@darb.local',
  '$2b$10$rGKqXvM8K6Y5YjXvF8K5LOcKqXvM8K6Y5YjXvF8K5LOcKqXvM8K6Y',
  'Admin',
  'User'
);

-- Assign Administrator role
INSERT INTO user_roles (user_id, role_id, scope)
SELECT
  (SELECT id FROM users WHERE username = 'admin'),
  (SELECT id FROM roles WHERE name = 'Administrator'),
  'global';

-- Verify
SELECT u.username, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';
```

## Verification

### Test Backend

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return token and user info
```

### Access Frontend

Open browser: http://localhost:3001

Login with:
- Username: `admin`
- Password: `admin123`

## Troubleshooting

### Docker Issues

**Error: Docker daemon not running**
- Solution: Start Docker Desktop application
- Verify: `docker ps` should not error

**Error: Port 5432 already in use**
- Solution: Stop local PostgreSQL or change port in docker-compose.yml
```yaml
ports:
  - "5433:5432"  # Use 5433 instead
```

### PostgreSQL Issues

**Error: Connection refused**
- Check PostgreSQL is running: `sudo systemctl status postgresql` (Linux)
- Check port: `netstat -an | grep 5432`
- Verify credentials in `.env`

**Error: Database does not exist**
- Create database: `createdb -U postgres darb`
- Or use pgAdmin to create database

**Error: Permission denied**
- Grant permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE darb TO darb_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO darb_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO darb_user;
```

### Node.js Issues

**Error: Cannot find module**
- Solution: `rm -rf node_modules && npm install`

**Error: Port 3000 already in use**
- Solution: Change port in `.env`: `PORT=3001`
- Or kill process:
  - Windows: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
  - Linux/macOS: `lsof -ti:3000 | xargs kill`

**Error: TypeScript compilation errors**
- Solution: `npm run build` to see detailed errors
- Check Node version: `node --version` (should be 20+)

### Frontend Issues

**Error: Failed to fetch**
- Check backend is running on port 3000
- Check CORS settings in backend `.env`
- Open browser console for details

**Error: npm install fails**
- Clear cache: `npm cache clean --force`
- Delete lock file: `rm package-lock.json`
- Try again: `npm install`

## Common Commands

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Run linter

# Frontend (from client/ directory)
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Docker
docker-compose up -d              # Start in background
docker-compose down               # Stop all services
docker-compose logs -f backend    # View backend logs
docker-compose logs -f postgres   # View database logs
docker-compose restart backend    # Restart backend

# Database
psql -U darb_user -d darb                    # Connect to database
psql -U darb_user -d darb -f schema.sql      # Load schema
pg_dump -U darb_user darb > backup.sql       # Backup database
```

## Next Steps

After successful setup:

1. Explore the API documentation: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. Understand the architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
3. Review implementation notes: [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md)
4. Create your first process via the frontend
5. Start building your workflows!

## Getting Help

- Check logs: `docker-compose logs -f` or `npm run dev`
- Review documentation in the repository
- Check GitHub issues: https://github.com/AbbadiAhmad/darb/issues

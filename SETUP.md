# DARB - Setup Guide

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+
- (Optional) Docker and Docker Compose

## Quick Start with Docker

The easiest way to run DARB is using Docker Compose:

```bash
# 1. Set environment variables (optional)
export JWT_SECRET="your-secure-secret-key"

# 2. Start all services
docker-compose up -d

# 3. Check logs
docker-compose logs -f backend
```

The application will be available at:
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001

## Manual Setup

### 1. Database Setup

```bash
# Create database
createdb darb

# Run schema
psql -d darb -f database/schema.sql

# Or using docker
docker run -d \
  --name darb-postgres \
  -e POSTGRES_DB=darb \
  -e POSTGRES_USER=darb_user \
  -e POSTGRES_PASSWORD=darb_password \
  -p 5432:5432 \
  postgres:15-alpine
```

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
npm run migrate

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

### 3. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

## Default Credentials

After running the database schema, you can create a default admin user:

```sql
-- Connect to database
psql -d darb

-- Create admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name)
VALUES (
  'admin',
  'admin@darb.local',
  '$2b$10$rGKqXvM8K6Y5YjXvF8K5LOcKqXvM8K6Y5YjXvF8K5LOcKqXvM8K6Y',
  'Admin',
  'User'
);

-- Get admin user ID
SELECT id FROM users WHERE username = 'admin';

-- Assign Administrator role (use the user ID from above)
INSERT INTO user_roles (user_id, role_id, scope)
SELECT
  (SELECT id FROM users WHERE username = 'admin'),
  (SELECT id FROM roles WHERE name = 'Administrator'),
  'global';
```

**Note:** The password hash above is for 'admin123'. Change this in production!

## Environment Variables

Key environment variables to configure:

```bash
# Server
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=darb
DB_USER=darb_user
DB_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:3001
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login

### Processes
- `GET /api/v1/processes` - List all processes
- `POST /api/v1/processes` - Create new process
- `GET /api/v1/processes/:id` - Get process details
- `PUT /api/v1/processes/:id` - Update process
- `POST /api/v1/processes/:id/publish` - Publish process

### Execution
- `POST /api/v1/execution/instances` - Start process instance
- `GET /api/v1/execution/instances` - List instances
- `GET /api/v1/execution/instances/:id` - Get instance details
- `GET /api/v1/execution/tasks` - List tasks
- `POST /api/v1/execution/tasks/:id/assign` - Assign task
- `POST /api/v1/execution/tasks/:id/complete` - Complete task

### Work Items
- `GET /api/v1/work-items` - List work items
- `POST /api/v1/work-items` - Create work item
- `GET /api/v1/work-items/:id` - Get work item details
- `PUT /api/v1/work-items/:id` - Update work item
- `POST /api/v1/work-items/:id/comments` - Add comment

### Audit
- `GET /api/v1/audit` - Query audit trail

## Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## Production Deployment

### Using Docker

```bash
# Build production image
docker build -t darb:latest .

# Run with docker-compose
docker-compose -f docker-compose.yml up -d
```

### Manual Deployment

1. Build the application:
```bash
npm run build
cd client && npm run build
```

2. Set up a reverse proxy (nginx/Apache)
3. Configure SSL certificates
4. Set up monitoring and logging
5. Configure backup strategy for PostgreSQL

## Security Considerations

1. **Change default JWT secret** in production
2. **Use strong database passwords**
3. **Enable HTTPS** for production
4. **Configure CORS** appropriately
5. **Set up rate limiting** on API endpoints
6. **Regular security updates** for dependencies
7. **Implement backup strategy** for database
8. **Enable PostgreSQL SSL** connections

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U darb_user -d darb

# Check if PostgreSQL is running
systemctl status postgresql
# or
docker ps | grep postgres
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Migration Issues
```bash
# Reset database (WARNING: destroys all data)
psql -d darb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -d darb -f database/schema.sql
```

## Support

For issues and questions:
- GitHub Issues: [Project Repository]
- Documentation: See CRS-Comprehensive-Requirements.md

## License

See LICENSE file for details.

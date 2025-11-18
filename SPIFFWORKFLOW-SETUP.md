# SpiffWorkflow Docker Setup

This docker-compose configuration runs a complete SpiffWorkflow environment for development and testing.

## Services Included

- **spiffworkflow-backend**: API server running on port 8000
- **spiffworkflow-frontend**: Web UI running on port 8001
- **spiffworkflow-connector**: Connector proxy for external integrations on port 8004

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux) 20.10+
- Docker Compose 2.0+

**IMPORTANT**: Make sure Docker Desktop is running before executing any docker commands.

## Quick Start

### 0. Ensure Docker is Running

**Windows/Mac**:
- Open Docker Desktop application
- Wait for the Docker icon in the system tray to show "Docker Desktop is running"

**Linux**:
```bash
sudo systemctl status docker
```

### 1. (Optional) Configure ports

Copy the example environment file if you want to customize ports:
```bash
cp .env.example .env
# Edit .env to customize ports if needed
```

### 2. Start all services

```bash
docker compose up -d
```

**Note**: On older systems, use `docker-compose` (with hyphen) instead of `docker compose`

### 3. Pull images (if needed)

If you get image pull errors, try pulling them explicitly first:
```bash
docker compose pull
```

### 4. Check service status

```bash
docker compose ps
```

### 5. View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f spiffworkflow-backend
docker compose logs -f spiffworkflow-frontend
```

### 6. Access SpiffWorkflow

- **Frontend UI**: http://localhost:8001
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/v1.0/ui (Swagger)
- **Health Check**: http://localhost:8000/v1.0/status
- **Connector Proxy**: http://localhost:8004

### 7. Stop services

```bash
docker compose down
```

### 8. Stop and remove all data (clean slate)

```bash
docker compose down -v
```

## Default Credentials

SpiffWorkflow in local development mode uses open authentication.
No login credentials are required for local testing.

## Troubleshooting

### Docker Desktop Not Running

**Error**: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

**Solution**:
1. Open Docker Desktop application
2. Wait for it to fully start (Docker icon in system tray should be green)
3. Try the docker commands again

### Cannot Pull Images

**Error**: `unable to get image 'ghcr.io/sartography/spiffworkflow-backend:latest'`

**Solutions**:

1. Check your internet connection
2. Try pulling images explicitly:
```bash
docker compose pull
```

3. If behind a proxy, configure Docker Desktop proxy settings:
   - Open Docker Desktop → Settings → Resources → Proxies

4. Try pulling a specific image to test:
```bash
docker pull ghcr.io/sartography/spiffworkflow-backend:latest
```

### Services Won't Start

Check if ports are already in use:
```bash
# Windows (PowerShell)
netstat -ano | findstr :8000
netstat -ano | findstr :8001
netstat -ano | findstr :8004

# Linux/Mac
lsof -i :8000
lsof -i :8001
lsof -i :8004
```

### Services Keep Restarting

Check the logs for errors:
```bash
docker compose logs spiffworkflow-backend
docker compose logs spiffworkflow-frontend
docker compose logs spiffworkflow-connector
```

### Database Issues

The setup uses SQLite stored in a Docker volume. To reset:
```bash
docker compose down -v
docker compose up -d
```

### View Backend Logs for Errors

```bash
docker compose logs spiffworkflow-backend | tail -n 100
```

### Reset Everything

```bash
docker compose down -v
docker compose up -d
```

## Volumes

Data is persisted in Docker volumes:
- `spiffworkflow_backend_db`: SQLite database file

## Process Models

BPMN process models are stored in the `./process_models` directory and mounted into the backend container.

## Next Steps

Once SpiffWorkflow is running:
1. Access the frontend at http://localhost:7001
2. Create your first process model
3. Test the workflow execution
4. Explore the API at http://localhost:7000/v1.0/ui

## Integration with Darb

This is a standalone SpiffWorkflow setup. Integration with the Darb ticketing system will be configured in subsequent steps.

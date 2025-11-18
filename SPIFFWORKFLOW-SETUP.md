# SpiffWorkflow Docker Setup

This docker-compose configuration runs a complete SpiffWorkflow environment for development and testing.

## Services Included

- **spiffworkflow-backend**: API server running on port 7000
- **spiffworkflow-frontend**: Web UI running on port 7001
- **spiffworkflow-db**: PostgreSQL database on port 5432
- **spiffworkflow-redis**: Redis cache on port 6379

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Start all services

```bash
docker-compose up -d
```

### 2. Check service status

```bash
docker-compose ps
```

### 3. View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f spiffworkflow-backend
docker-compose logs -f spiffworkflow-frontend
```

### 4. Access SpiffWorkflow

- **Frontend UI**: http://localhost:7001
- **Backend API**: http://localhost:7000
- **API Documentation**: http://localhost:7000/v1.0/ui (Swagger)
- **Health Check**: http://localhost:7000/v1.0/status

### 5. Stop services

```bash
docker-compose down
```

### 6. Stop and remove all data (clean slate)

```bash
docker-compose down -v
```

## Default Credentials

In local development mode, SpiffWorkflow typically uses:
- **Username**: admin
- **Password**: admin

*Note: These credentials may vary based on the SpiffWorkflow version and configuration.*

## Troubleshooting

### Services won't start

Check if ports are already in use:
```bash
# Check port 7000
lsof -i :7000

# Check port 7001
lsof -i :7001

# Check port 5432
lsof -i :5432
```

### Backend fails to connect to database

Wait for the database to be fully ready:
```bash
docker-compose logs spiffworkflow-db
```

Check the health status:
```bash
docker-compose ps
```

### View backend logs for errors

```bash
docker-compose logs spiffworkflow-backend | tail -n 100
```

### Reset everything

```bash
docker-compose down -v
docker-compose up -d
```

## Volumes

Data is persisted in Docker volumes:
- `spiffworkflow-db-data`: Database files
- `spiffworkflow-redis-data`: Redis cache
- `spiffworkflow-process-models`: BPMN process models
- `spiffworkflow-backend-logs`: Application logs

## Network

All services are connected via the `spiffworkflow-network` bridge network, allowing them to communicate using service names.

## Next Steps

Once SpiffWorkflow is running:
1. Access the frontend at http://localhost:7001
2. Create your first process model
3. Test the workflow execution
4. Explore the API at http://localhost:7000/v1.0/ui

## Integration with Darb

This is a standalone SpiffWorkflow setup. Integration with the Darb ticketing system will be configured in subsequent steps.

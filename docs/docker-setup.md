# Docker Setup

This project uses Docker Compose to manage local development databases and services.

## Services

### Databases

- **PostgreSQL** (port 5432): Primary database for feed and user services
- **Redis** (port 6380): Caching and session storage
- **RabbitMQ** (port 5673): Message queuing for background jobs
- **pgAdmin** (port 8080): PostgreSQL management UI (optional)

## Quick Start

1. **Copy environment variables:**

   ```bash
   cp .env.example .env.local
   ```

2. **Start all services:**

   ```bash
   make up
   ```

3. **Check status:**
   ```bash
   make status
   ```

## Available Commands

- `make up` - Start all services in detached mode
- `make down` - Stop all services and remove containers
- `make dev` - Start development services with hot-reload
- `make logs` - Show logs from all services
- `make clean` - Remove containers, networks, and volumes
- `make rebuild` - Rebuild and start all services
- `make test` - Run tests against the database services
- `make tools` - Start database management tools (pgAdmin)
- `make reset-db` - Reset databases for testing

## Database URLs

The services expect these database URLs (configured in .env.local):

```bash
TEST_DATABASE_URL=postgresql://znews:znews_password@localhost:5432/znews_test
REDIS_URL=redis://localhost:6380
RABBITMQ_URL=amqp://znews:znews_password@localhost:5673/znews
```

## Management UIs

- **pgAdmin**: http://localhost:8080 (admin@znews.local / admin_password)
- **RabbitMQ Management**: http://localhost:15673 (znews / znews_password)

## Development Workflow

1. Start databases: `make up`
2. Start individual services with hot-reload: `make dev`
3. Run tests: `make test`
4. Check logs: `make logs`
5. Clean up when done: `make down`

## Troubleshooting

If ports are already in use:

- Check what's using the port: `lsof -i :PORT`
- Update port mappings in docker-compose.yml if needed
- Use `make clean` to remove any conflicting containers

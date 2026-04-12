.PHONY: help up down logs clean rebuild dev test

# Default target
help:
	@echo "Available commands:"
	@echo "  up       - Start all services in detached mode"
	@echo "  down     - Stop all services and remove containers"
	@echo "  logs     - Show logs from all services"
	@echo "  clean    - Remove containers, networks, and volumes"
	@echo "  rebuild  - Rebuild and start all services"
	@echo "  dev      - Start development services with hot-reload"
	@echo "  test     - Run tests against the database services"
	@echo "  status   - Check status of all services"

# Start all services
up:
	@echo "Starting znews services..."
	docker-compose up -d

# Stop all services
down:
	@echo "Stopping znews services..."
	docker-compose down

# Show logs
logs:
	@echo "Showing logs from all services..."
	docker-compose logs -f

# Clean up everything
clean:
	@echo "Cleaning up all containers, networks, and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Rebuild and start services
rebuild:
	@echo "Rebuilding and starting all services..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# Start development services
dev:
	@echo "Starting development services..."
	docker-compose --profile dev up -d

# Run tests
test:
	@echo "Running tests against database services..."
	docker-compose exec postgres pg_isready -U znews -d znews_test
	docker-compose exec redis redis-cli ping
	docker-compose exec rabbitmq rabbitmq-diagnostics -q ping

# Check service status
status:
	@echo "Checking service status..."
	docker-compose ps
	@echo ""
	@echo "Database connectivity:"
	docker-compose exec postgres pg_isready -U znews -d znews_test
	docker-compose exec redis redis-cli ping
	docker-compose exec rabbitmq rabbitmq-diagnostics -q ping

# View database management tools
tools:
	@echo "Starting database management tools..."
	docker-compose --profile tools up -d

# Stop database management tools
stop-tools:
	@echo "Stopping database management tools..."
	docker-compose --profile tools down

# Reset databases (for testing)
reset-db:
	@echo "Resetting databases..."
	docker-compose down -v
	docker-compose up -d postgres redis rabbitmq
	@echo "Waiting for databases to be ready..."
	sleep 10
	docker-compose exec -T postgres psql -U znews -d znews_test -c "SELECT 'Database ready' as status;"

# Health check
health:
	@echo "Checking service health..."
	@docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
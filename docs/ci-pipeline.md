# CI Pipeline Documentation

This document describes the CI/CD pipeline setup for the znews project.

## Overview

The znews project uses GitHub Actions for continuous integration and deployment with parallel test execution across multiple services.

## Pipeline Structure

### Workflows

#### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

1. **lint** - Code quality checks (runs in parallel)
2. **test-feed-service** - Feed service tests with Node.js matrix
3. **test-crawler** - Go crawler service tests
4. **test-discovery-service** - Python discovery service tests with Python version matrix
5. **test-integration** - End-to-end integration tests
6. **build** - Build all applications and create Docker images

**Parallel Execution:**

- Quality checks run in parallel
- Service tests run in parallel after linting
- Integration tests run after all service tests pass
- Build job runs after all tests pass

#### 2. CD Pipeline (`.github/workflows/cd.yml`)

**Triggers:**

- Push to `main` branch
- Manual workflow dispatch

**Environments:**

- **Staging**: Automated deployment after CI success
- **Production**: Manual promotion from staging

#### 3. Security Audit (`.github/workflows/security-audit.yml`)

**Triggers:**

- Weekly schedule (Mondays at 2 AM)
- Push to main/develop branches
- Pull requests to main/develop branches

**Scans:**

- NPM dependency vulnerabilities
- Go dependency vulnerabilities
- Python dependency vulnerabilities
- Python code security (bandit)

## Parallel Test Execution

### Node.js Services (Feed Service)

- **Node.js Matrix**: Tests across Node.js 18 and 20
- **Databases**: PostgreSQL, Redis, RabbitMQ as service containers
- **Environment Variables**: Properly configured for each test run

### Go Services (Crawler)

- **Single Version**: Go 1.21
- **Coverage**: HTML and XML reports
- **Upload**: Codecov integration

### Python Services (Discovery Service)

- **Python Matrix**: Tests across Python 3.9, 3.10, 3.11
- **Dependencies**: pip with caching
- **Coverage**: XML and HTML reports
- **Testing**: pytest with coverage

### Integration Tests

- **Sequential**: Run after all unit tests pass
- **Full Stack**: All services running together
- **Smoke Tests**: Basic functionality validation

## Turbo Configuration

The `turbo.json` file is optimized for CI:

```json
{
  "pipeline": {
    "test": {
      "cache": true,
      "cacheKey": "test-${{branch}}-${{hashFiles('**/package.json','**/go.mod','**/pyproject.toml')}}"
    },
    "test:feed-service": {
      "cache": true,
      "cacheKey": "test-feed-${{branch}}-${{hashFiles('apps/feed-service/**/package.json')}}"
    },
    "test:crawler": {
      "cache": true,
      "cacheKey": "test-crawler-${{branch}}-${{hashFiles('apps/crawler/go.mod')}}"
    },
    "test:discovery-service": {
      "cache": true,
      "cacheKey": "test-discovery-${{branch}}-${{hashFiles('apps/discovery-service/pyproject.toml')}}"
    }
  }
}
```

## Environment Variables

### CI Environment

- `NODE_ENV`: test
- `CI`: automatically set by GitHub Actions
- `TEST_DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `RABBITMQ_URL`: RabbitMQ connection string

### Secrets (GitHub Secrets)

- `STAGING_DATABASE_URL`
- `PRODUCTION_DATABASE_URL`
- `STAGING_REDIS_URL`
- `PRODUCTION_REDIS_URL`
- `STAGING_RABBITMQ_URL`
- `PRODUCTION_RABBITMQ_URL`

## Performance Optimizations

### Caching

- **Node.js**: pnpm package caching
- **Python**: pip dependency caching
- **Go**: Go module caching
- **Docker**: Layer caching for builds

### Parallel Execution

- **Matrix Testing**: Multiple Node.js/Python versions
- **Service Isolation**: Each test in separate containers
- **Early Feedback**: Linting runs first in parallel

### Build Optimization

- **Turbo Remote Caching**: Build artifact sharing
- **Docker Layer Caching**: Reusable build layers
- **Selective Builds**: Only build changed services

## Monitoring & Reporting

### Coverage Reports

- **CodeCov**: Unified coverage tracking
- **Service-Specific**: Individual coverage files per service
- **Thresholds**: Configurable coverage requirements

### Security Reports

- **NPM**: `npm audit` with JSON output
- **Go**: `govulncheck` vulnerability scanning
- **Python**: `safety`, `bandit`, `pip-audit` scanning

### Build Artifacts

- **Distribution**: Build artifacts stored for 30 days
- **Docker Images**: Multi-stage builds optimized for production
- **Test Results**: JUnit XML format for integration

## Local Development

### Running CI Locally

```bash
# Install dependencies
pnpm install

# Run tests (parallel)
pnpm test

# Run specific service tests
pnpm test:feed-service
pnpm test:crawler
pnpm test:discovery-service

# Run integration tests
pnpm test:integration
```

### Docker Compose for CI

```bash
# Start CI-like environment
docker-compose up -d

# Run tests with databases
TEST_DATABASE_URL=postgresql://znews:znews_password@localhost:5432/znews_test \
  REDIS_URL=redis://localhost:6379 \
  RABBITMQ_URL=amqp://znews:znews_password@localhost:5672/znews \
  pnpm test
```

## Best Practices

1. **Atomic Commits**: Small, focused changes for better CI performance
2. **Branch Protection**: PRs must pass CI before merge
3. **Security Scanning**: Automated vulnerability checks on every PR
4. **Coverage Thresholds**: Minimum 80% coverage required
5. **Cache Utilization**: Maximize build cache usage
6. **Parallel Execution**: Leverage matrix testing for faster feedback

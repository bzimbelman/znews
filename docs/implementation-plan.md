# znews Implementation Plan (TDD Checklist)

## Phase 1: Foundation Setup

- [x] **Configure Turborepo with test runners for TS/Go/Python** ✅
  - Created Turborepo workspace with proper TypeScript configuration
  - Set up test runners for TypeScript (Jest), Go (native testing), and Python (pytest)
  - Implemented shared packages for types, utilities, and test helpers
  - Added comprehensive .gitignore for build artifacts and dependencies
  - Migrated from npm to pnpm for better monorepo support
  - **Deliverables**:
    - Root package.json with workspace configuration
    - Turbo build pipeline with parallel execution
    - TypeScript configuration with path mapping
    - Jest test configuration for all TypeScript services
    - Go test framework with Makefile
    - Python pytest configuration with coverage
    - Shared types and utilities package
    - Testing utilities package with database helpers
    - All tests passing with 100% coverage on basic functionality
- [x] Implement Docker Compose for local test databases (PostgreSQL/Redis/RabbitMQ) ✅
  - Created docker-compose.yml with PostgreSQL, Redis, and RabbitMQ services
  - Added health checks and proper initialization scripts
  - Configured port mappings to avoid conflicts
  - Created Makefile with convenient management commands
  - Added .env.example with proper configuration
  - All services running and healthy
- [x] Set up CI pipeline with parallel test execution ✅
  - Created GitHub Actions CI workflow with parallel test execution
  - Added test matrix for Node.js (18, 20) and Python (3.9, 3.10, 3.11)
  - Configured service containers for database dependencies
  - Implemented Turbo caching for build artifacts
  - Added security audit workflow with dependency scanning
  - Created CD pipeline for staging/production deployments
  - Added comprehensive CI documentation
- [x] Create test fixtures for sample news sources and articles ✅
  - Created comprehensive test fixtures with 5 sample sources, 5 articles, and 2 users
  - Added helper functions for filtering articles by source, category, and tag
  - All fixtures follow the established type definitions and include realistic sample data

## Phase 2: Core Services (TDD)

### Content Ingestion Pipeline (Go)

- [ ] Write tests for static crawler (Colly/goquery) with mock HTTP responses
- [ ] Implement static crawler to pass tests
- [ ] Write tests for JS crawler (Rod) with browser pool management
- [ ] Implement JS crawler to pass tests
- [ ] Write tests for content processor (deduplication, paywall detection)
- [ ] Implement processor to pass tests

### Feed Generation Service (NestJS)

- [ ] Write tests for feed assembly algorithm (blocked sources, paywall filtering)
- [ ] Implement feed service to pass tests
- [ ] Write tests for cursor-based pagination
- [ ] Write tests for "caught up" marker insertion
- [ ] Write tests for ad placement logic (free tier)

### User Profile Service (NestJS)

- [ ] Write tests for source blocking with reason aggregation
- [ ] Implement blocking logic to pass tests
- [ ] Write tests for paywall subscription management
- [ ] Write tests for topic interest weighting

### Discovery Service (Python)

- [ ] Write tests for embedding pipeline with mock articles
- [ ] Implement embedding computation to pass tests
- [ ] Write tests for source similarity matching
- [ ] Write tests for contextual ad targeting

## Phase 3: Integration

- [ ] Write end-to-end tests for crawl scheduling (Airflow → Go → RabbitMQ)
- [ ] Write tests for cache invalidation flow (Redis → PostgreSQL)
- [ ] Implement contract tests between services
- [ ] Verify all RabbitMQ message schemas with validation tests

## Phase 4: Frontend (React Native)

- [ ] Write snapshot tests for feed components with mock data
- [ ] Implement widget integration tests (iOS/Android)
- [ ] Write tests for paywall management UI flows
- [ ] Verify source blocking UX with user journey tests

## Phase 5: Validation

- [ ] Run full TDD cycle for breaking news detection
- [ ] Verify all test coverage meets 80%+ threshold
- [ ] Execute performance tests at Phase 1 scale (10K users)
- [ ] Complete security scan with OWASP ZAP

## Completed ✅

### Phase 1 Foundation (Completed)

- **Turborepo Configuration**:
  - Created workspace structure with apps and packages
  - Set up TypeScript configuration with path mapping
  - Configured test runners for TS/Go/Python
  - Migrated to pnpm package manager
  - Added comprehensive .gitignore

### Core Services Structure (Created)

- **Feed Service** (NestJS/TypeScript): Basic service with test coverage
- **Crawler Service** (Go): Project structure with test framework
- **Discovery Service** (Python/FastAPI): Project setup with pytest
- **Shared Packages**: Types, utilities, and test helpers
- **Testing Infrastructure**: Database helpers, HTTP testing utilities

_Checklist maintained per TDD principle: Tests written before implementation_

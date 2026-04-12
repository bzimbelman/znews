# znews Implementation Plan (TDD Checklist)

## Phase 1: Foundation Setup
- [ ] Configure Turborepo with test runners for TS/Go/Python
- [ ] Implement Docker Compose for local test databases (PostgreSQL/Redis/RabbitMQ)
- [ ] Set up CI pipeline with parallel test execution
- [ ] Create test fixtures for sample news sources and articles

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

*Checklist maintained per TDD principle: Tests written before implementation*

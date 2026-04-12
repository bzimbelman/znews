# znews

A news aggregation and discovery platform with AI-powered personalization.

## Project Structure

This project uses Turborepo to manage multiple services:

```
znews/
├── apps/                    # Applications and services
│   ├── feed-service/        # NestJS feed generation service (TypeScript)
│   ├── user-profile-service/# NestJS user profile service (TypeScript)
│   ├── discovery-service/   # FastAPI discovery service (Python)
│   └── crawler/             # Go web crawler service
├── packages/               # Shared packages
│   ├── shared/             # Shared types, utils, and constants
│   └── testing/           # Test utilities and helpers
└── docs/                  # Documentation
```

## Development

### Prerequisites

- Node.js 18+
- Go 1.21+
- Python 3.11+
- Docker (for local databases)
- pnpm (package manager)

### Setup

1. Install dependencies:

```bash
pnpm install
```

2. Install Go dependencies:

```bash
cd apps/crawler && go mod tidy
```

3. Install Python dependencies:

```bash
cd apps/discovery-service && pip install -e .
```

### Running Tests

Run all tests across all services:

```bash
pnpm test
```

Run tests for specific services:

```bash
# TypeScript services
pnpm run test -- --workspace=apps/feed-service
pnpm run test -- --workspace=apps/user-profile-service

# Go service
cd apps/crawler && make test

# Python service
cd apps/discovery-service && pytest
```

### Dependency Management

This project uses pnpm for package management:

```bash
# Check dependencies
pnpm run dep:check

# Update dependencies
pnpm run dep:update

# Check outdated packages
pnpm run dep:outdated

# Clean and prune
pnpm run clean
```

Run tests for specific services:

```bash
# TypeScript services
npm run test -- --workspace=apps/feed-service
npm run test -- --workspace=apps/user-profile-service

# Go service
cd apps/crawler && make test

# Python service
cd apps/discovery-service && pytest
```

### Development Mode

Start all services in development mode:

```bash
npm run dev
```

### Building

Build all services:

```bash
npm run build
```

## Services

### Feed Service (TypeScript/NestJS)

- Generates personalized news feeds
- Handles pagination and ad placement
- Manages source blocking and paywall detection

### User Profile Service (TypeScript/NestJS)

- User preference management
- Subscription handling
- Source blocking with reason tracking

### Discovery Service (Python/FastAPI)

- Article embeddings and similarity matching
- Contextual ad targeting
- Source recommendations

### Crawler Service (Go)

- Static HTML crawling (Colly/goquery)
- JavaScript crawling (Rod)
- Content processing and deduplication

## Testing

This project follows Test-Driven Development (TDD) principles. Tests are written before implementation:

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Service-to-service communication
3. **E2E Tests**: End-to-end workflows
4. **Performance Tests**: Load and stress testing

## CI/CD

The project includes:

- Turborepo for parallel test execution
- Docker Compose for local development
- GitHub Actions for CI pipeline
- Code coverage reporting (>80% target)

## Contributing

1. Follow the TDD approach: write tests first
2. Maintain code consistency across services
3. Update documentation as needed
4. Ensure all tests pass before submitting changes

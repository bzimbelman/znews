# znews - Technology Stack

## Overview

znews uses a multi-language backend with a cross-platform React Native frontend. The stack is chosen to maximize code sharing across platforms, deliver native-quality performance where it matters, and keep operational complexity manageable for a small team.

```
┌─────────────────────────────────────────────────────────┐
│                      Clients                            │
│  React Native (iOS + Android) │ react-native-web (Web)  │
│  Native Widgets (Swift / Kotlin)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway (TypeScript/Node)               │
│                GraphQL + REST                            │
└──────┬────────────┬──────────────────┬──────────────────┘
       │            │                  │
       ▼            ▼                  ▼
┌────────────┐ ┌──────────────┐ ┌─────────────────┐
│  Feed Gen  │ │  User Profile│ │   Ad Service    │
│   (TS)     │ │    (TS)      │ │     (TS)        │
└──────┬─────┘ └──────┬───────┘ └────────┬────────┘
       │              │                  │
       └──────┬───────┴──────────────────┘
              │
       ┌──────▼──────┐
       │  PostgreSQL  │──── pgvector
       │    + Redis   │
       └──────┬──────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼──────────┐  ┌──────▼──────────┐
│  Ingestion   │  │   Discovery     │
│  Pipeline    │  │   Service       │
│   (Go)       │  │   (Python)      │
└──────────────┘  └─────────────────┘
```

---

## Frontend

### React Native + TypeScript

React Native is the primary framework for all client applications. A single TypeScript codebase produces iOS, Android, and web builds.

| Concern | Technology | Notes |
|---------|-----------|-------|
| Framework | React Native (New Architecture) | Fabric renderer + TurboModules for native performance |
| Language | TypeScript | Shared types with the Node.js API layer |
| Web | react-native-web | Production-proven at Meta and Twitter/X. Supports responsive layouts for mobile web, tablet, and desktop |
| Build tooling | Expo | Managed builds, OTA updates, push notification infrastructure |
| Navigation | React Navigation | Standard for React Native, supports deep linking |
| State management | Zustand or TanStack Query | Lightweight; TanStack Query handles server state and caching |
| Scrolling | FlashList | Virtualized list optimized for large feeds; outperforms FlatList |
| Styling | Nativewind (Tailwind for RN) | Consistent styling across mobile and web |

### Platform Widgets (Native Code)

Widgets cannot be built in React Native — they require native platform code. Each platform gets its own widget implementation sharing data through the React Native bridge.

**iOS Widgets (Swift + WidgetKit):**
- Home screen widgets (small, medium, large) showing latest headlines
- Lock screen widgets with top story summary
- StandBy mode widget for ambient news display
- Live Activities for breaking news (Dynamic Island + lock screen banner)
- Widget push updates via APNs for real-time content refresh
- Interactive widgets (iOS 17+) with tap-to-save and topic navigation

**Android Widgets (Kotlin + Jetpack Glance):**
- Home screen widgets matching iOS sizes
- Lock screen widgets via Android's widget framework
- Background refresh via WorkManager

### Platform Integration — Replacing the Default News Feed

A key goal is for znews to serve as the primary news feed on each platform. Here is what is technically possible and the strategy for each.

**Android — Swipe-Left Feed**

The "swipe left to see news" experience on Android is controlled by the launcher, not by a system setting. There is no public API to register as the default feed provider on the stock Pixel Launcher or other OEM launchers. The swipe-left panel uses a private `SYSTEM_APPLICATION_OVERLAY` permission restricted to system apps.

*Strategy:*
- Build a **launcher feed overlay module** compatible with custom launchers that support pluggable feed providers. Launchers with this capability include Nova Launcher, Smart Launcher (which already has its own "Your Feed" RSS reader), Lawnchair, and Kvaesitso.
- Follow the pattern established by [Neo-Feed](https://github.com/NeoApplications/Neo-Feed), an open-source RSS reader specifically designed to replace Google Discover in compatible launchers.
- Long-term: pursue OEM partnerships (Samsung demonstrated this is possible by shipping Samsung News as the default feed on Galaxy devices, replacing Google Discover).
- The standalone znews app remains the primary experience; the launcher overlay is a bonus integration.

**iOS — News Feed Surface**

Apple News cannot be replaced or uninstalled. There is no system setting to change the default news provider on iOS.

*Strategy:*
- Build a comprehensive set of **WidgetKit widgets** that provide a news feed experience directly on the home screen, lock screen, and StandBy mode.
- Use **Live Activities** for breaking news, placing updates in the Dynamic Island and on the lock screen in real time.
- Use **widget push updates** (server-to-APNs-to-WidgetKit) to keep widget content fresh without relying on the app being open.
- The goal is to make the znews widget experience compelling enough that users place it prominently and check it before (or instead of) opening Apple News.

**Web**

The web version is built from the same React Native codebase using react-native-web. It supports responsive layouts:
- Mobile web: single-column feed, optimized for touch
- Tablet: two-column layout with article preview panel
- Desktop: three-column layout with source sidebar, feed, and article reader

The web version serves as both a standalone product and a way to reduce friction for new users (no app store download required). It is NOT a PWA — PWAs cannot create home screen widgets, lack background sync on iOS, and have storage eviction issues. The web version is a standard web application served via Cloudflare CDN.

---

## Backend

The backend uses three languages, each chosen for the specific workload it handles.

### API Gateway + Feed Service + User Profile + Ad Service — TypeScript / Node.js

| Concern | Technology | Notes |
|---------|-----------|-------|
| Runtime | Node.js 22+ | Stable LTS, native TypeScript support via `--experimental-strip-types` or tsx |
| Framework | Fastify | Fastest Node.js HTTP framework; plugin architecture |
| API | Apollo Server (GraphQL) | Feed is polymorphic (articles, ads, markers); GraphQL handles this naturally |
| Auth | Passport.js + JWT | Standard auth flow; JWT for stateless API auth |
| Validation | Zod | Schema validation shared with frontend |
| ORM | Drizzle ORM | Type-safe, SQL-first, good PostgreSQL support including pgvector |

TypeScript is the right choice here because it shares the language and type definitions with the React Native frontend. Feed item types, API schemas, and validation rules are defined once and used in both the API and the client.

### Content Ingestion Pipeline — Go

| Concern | Technology | Notes |
|---------|-----------|-------|
| Runtime | Go 1.22+ | Best-in-class concurrency for crawling hundreds of sources |
| HTTP client | net/http + colly | colly for structured crawling with robots.txt respect |
| RSS/Atom | gofeed | Parses RSS, Atom, and JSON Feed formats |
| HTML parsing | goquery | jQuery-like HTML traversal for scraping fallback |
| Job queue | NATS client (nats.go) | Pulls crawl jobs from NATS JetStream |
| Rate limiting | Custom token bucket + Redis | Per-source rate limiting |
| Scheduling | robfig/cron | In-process cron for the tiered refresh scheduler |

Go is chosen for the crawler because it handles massive concurrent I/O efficiently with goroutines. Crawling hundreds of sources simultaneously — each with rate limiting, retry logic, and content parsing — is a problem Go was designed to solve. Go's standard library HTTP client, combined with colly for crawl management, provides a production-grade crawling foundation.

### Discovery Service — Python / FastAPI

| Concern | Technology | Notes |
|---------|-----------|-------|
| Runtime | Python 3.12+ | Richest AI/ML ecosystem |
| Framework | FastAPI | Async, fast, auto-generated OpenAPI docs |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | Small (80MB), fast, runs on CPU, 384-dim vectors |
| Inference | ONNX Runtime | Optimized inference without full PyTorch overhead |
| Vector search | pgvector via asyncpg | Query embeddings directly in PostgreSQL |
| ML utilities | scikit-learn, numpy | Clustering, similarity computation |

Python is chosen for the discovery service because the sentence-transformers ecosystem, ONNX Runtime, and the broader ML tooling are most mature in Python. This service runs as a separate process from the main API — it handles embedding computation for new articles (batch, async) and serves discovery queries (source recommendations, content suggestions).

---

## Data Layer

### PostgreSQL (via Neon)

PostgreSQL is the single source of truth for all structured data. Using one database reduces operational burden and keeps the system simple.

| Extension | Purpose |
|-----------|---------|
| pgvector | Vector embeddings for discovery/similarity search (HNSW index) |
| pg_trgm | Trigram similarity for fuzzy text search |

Four schemas: `content` (sources, articles), `users` (accounts, preferences, blocked sources, paywall subscriptions), `feed` (read state, feed positions), `ads` (campaigns, creatives, impressions).

Article table partitioned by `published_at` (monthly). Old partitions archived to cold storage.

### Redis (via Upstash)

| Use Case | Pattern |
|----------|--------|
| Feed page cache | `feed:{user_id}:cursor:{cursor}` — 5 min TTL |
| Article metadata cache | `article:{id}` — 1 hour TTL |
| Crawl rate limiting | Token bucket per source |
| Ad frequency capping | Counter per user per campaign |
| Session store | JWT refresh tokens |

### NATS JetStream

Event streaming and job queue:
- `crawl.pending` — crawl jobs for the Go ingestion workers
- `article.created` / `article.updated` — triggers feed cache invalidation
- `ads.impression` — async impression logging (keeps feed responses fast)

### Cloudflare R2

S3-compatible object storage with zero egress fees:
- Article thumbnail images
- Open Graph images
- Archived article snapshots

---

## Infrastructure

### Deployment Targets

| Component | Platform | Rationale |
|-----------|----------|-----------|
| API servers (TypeScript) | Fly.io (2-4 instances) | Simple deployment, auto-scaling, global edge |
| Ingestion workers (Go) | Fly.io (1-2 instances) | Separate from API to avoid resource contention |
| Discovery service (Python) | Fly.io (1 instance) | Co-located with other services |
| NATS JetStream | Fly.io (1 instance, persistent volume) | Lightweight, self-hosted |
| PostgreSQL | Neon | Managed, serverless scaling, built-in pgvector, branching for dev |
| Redis | Upstash | Serverless, pay-per-request, no idle costs |
| Object storage | Cloudflare R2 | Zero egress, S3-compatible |
| CDN | Cloudflare | Free tier is generous, integrates with R2 |
| Web hosting | Cloudflare Pages | Static hosting for react-native-web build |

### Monitoring and Operations

| Concern | Technology |
|---------|-----------|
| Error tracking | Sentry |
| Metrics + dashboards | Grafana Cloud (free tier) |
| Logging | Structured JSON logs → Grafana Loki |
| Uptime monitoring | Better Stack or Grafana Synthetic Monitoring |
| CI/CD | GitHub Actions |

### Why Not AWS/GCP/Azure

Managed services on hyperscalers are expensive for a startup with no revenue. Neon + Fly.io + Cloudflare provides managed PostgreSQL, easy container deployment, and a CDN at a fraction of the cost. The architecture is portable — all components use standard protocols (PostgreSQL, S3, HTTP) and can migrate to AWS when scale and revenue justify the operational investment.

---

## Development Tooling

| Tool | Purpose |
|------|---------|
| Turborepo or Nx | Monorepo management across TS frontend, TS API, Go crawler, Python discovery |
| Docker Compose | Local development environment (Postgres, Redis, NATS) |
| GitHub Actions | CI/CD pipelines per service |
| Bruno or Insomnia | API testing (GraphQL + REST) |
| ESLint + Prettier | TypeScript linting and formatting |
| golangci-lint | Go linting |
| Ruff | Python linting and formatting |

---

## Language Boundary Communication

The three backend languages communicate through well-defined interfaces:

```
                  GraphQL/REST
React Native ◄──────────────────► TypeScript API (Fastify)
                                       │
                                       │ PostgreSQL (shared DB)
                                       │ NATS JetStream (events)
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
              Go Crawler        Python Discovery    TypeScript API
              (writes to DB,    (reads/writes DB,   (reads DB,
               publishes to      serves REST API     serves GraphQL)
               NATS)             for recommendations)
```

- **Go ↔ TypeScript:** Via PostgreSQL (Go writes articles, TS reads them) and NATS (Go publishes events, TS consumes them for cache invalidation).
- **Python ↔ TypeScript:** Via PostgreSQL (Python reads articles for embedding, writes embeddings back) and a REST API (TypeScript calls Python's FastAPI endpoints for discovery recommendations).
- **Go ↔ Python:** No direct communication needed. Go writes articles to the database; Python reads them asynchronously for embedding computation.

This "shared database + event bus" pattern avoids the complexity of service mesh, gRPC schema management, or API versioning between internal services. It is appropriate for a small team and can be decomposed into proper service boundaries later if needed.

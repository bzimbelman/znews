# znews - Technology Stack

## Overview

znews uses a multi-language backend with a cross-platform React Native frontend. The stack is chosen to maximize code sharing across platforms, deliver native-quality performance where it matters, and keep operational complexity manageable for a small team.

**Core principle: self-hosted first.** Every component runs locally via Docker Compose for development. Every component can be self-hosted in production. Managed/hosted alternatives are noted as optional but never required.

```
┌─────────────────────────────────────────────────────────┐
│                      Clients                            │
│  React Native (iOS + Android) │ react-native-web (Web)  │
│  Native Widgets (Swift / Kotlin)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            API Gateway (NestJS + Fastify adapter)        │
│         GraphQL + REST │ Keycloak auth                   │
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
       │  + Redis     │
       └──────┬──────┘
              │
    ┌─────────┼──────────────┐
    │         │              │
┌───▼────┐ ┌─▼──────────┐ ┌─▼─────────────┐
│Airflow │ │  Ingestion  │ │  Discovery    │
│(sched) │ │  Pipeline   │ │  Service      │
│        │ │  (Go)       │ │  (Python)     │
└───┬────┘ └──────┬──────┘ └──────┬────────┘
    │             │               │
    └──────┬──────┴───────────────┘
           │
    ┌──────▼──────┐
    │  RabbitMQ   │
    │  (message   │
    │   bus)      │
    └─────────────┘
```

---

## Frontend

### React Native + TypeScript

React Native is the primary framework for all client applications. A single TypeScript codebase produces iOS, Android, and web builds.

| Concern | Technology | Notes |
|---------|-----------|-------|
| Framework | React Native (New Architecture) | Fabric renderer + TurboModules for native performance |
| Language | TypeScript | Shared types with the NestJS API layer |
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

The web version serves as both a standalone product and a way to reduce friction for new users (no app store download required). It is NOT a PWA — PWAs cannot create home screen widgets, lack background sync on iOS, and have storage eviction issues. The web version is a standard web application served by Nginx (self-hosted) or a CDN in production.

---

## Backend

The backend uses three languages, each chosen for the specific workload it handles, plus Airflow for scheduling.

### API Gateway + Feed Service + User Profile + Ad Service — NestJS (TypeScript)

| Concern | Technology | Notes |
|---------|-----------|-------|
| Runtime | Node.js 22+ | Stable LTS, native TypeScript support |
| Framework | NestJS + Fastify adapter | NestJS provides modules, DI, guards, interceptors. Fastify adapter gives 2-3x Express performance. |
| API | Apollo Server via `@nestjs/graphql` | Feed is polymorphic (articles, ads, markers); GraphQL handles this naturally |
| Auth | Keycloak via `@nestjs/passport` + keycloak-connect | Self-hosted identity provider. Handles registration, login, token management, OIDC. |
| Validation | Zod or class-validator | Schema validation shared with frontend |
| ORM | Drizzle ORM | Type-safe, SQL-first, good PostgreSQL support including pgvector |
| Queue integration | `amqplib` via NestJS microservices | RabbitMQ consumer/producer for async tasks and event handling |
| Caching | `@nestjs/cache-manager` with Redis | Feed cache, article metadata cache |

**Why NestJS over standalone Fastify:** This service has 5+ modules (feed, users, auth, admin, ads), both GraphQL and REST endpoints, queue consumers, and caching. NestJS provides the module system, dependency injection, lifecycle hooks (graceful k8s shutdown via `OnModuleDestroy`), and integrated support for GraphQL, queues, and caching that would otherwise require building a bespoke framework on top of Fastify. The Fastify adapter gives NestJS Fastify's HTTP performance.

**Why Keycloak over custom auth:** Keycloak is a battle-tested, self-hosted identity provider that handles user registration, login, password reset, token refresh, OIDC, and eventually social login — all out of the box with an admin UI. Building this from scratch with Passport.js + JWT is undifferentiated work that distracts from building the actual product.

### Content Ingestion Pipeline — Go

| Concern | Technology | Notes |
|---------|-----------|-------|
| Runtime | Go 1.22+ | Best-in-class concurrency for crawling hundreds of sources |
| Static crawling | net/http + colly | colly for structured crawling with robots.txt respect. Handles ~80% of news sources. |
| JS rendering | Rod (go-rod/rod) | Headless Chrome via DevTools Protocol. Built-in PagePool for concurrent browser pages. For the ~20% of sources that require JavaScript. |
| RSS/Atom | gofeed | Parses RSS, Atom, and JSON Feed formats |
| HTML parsing | goquery | jQuery-like HTML traversal for content extraction |
| Message bus | amqp091-go | Official RabbitMQ Go client. Consumes crawl jobs from Airflow, publishes article events. |
| Rate limiting | Custom token bucket + Redis | Per-source rate limiting |

**Two-tier crawl architecture:** Most major news sites serve article content in initial HTML (for SEO) or via RSS feeds. The Go crawler uses Colly/goquery as the primary path (fast, ~5-20ms per page, ~1-2MB memory per request). For the ~20% of sources that require JavaScript rendering, Rod manages a pool of headless Chrome tabs (~50-150MB RAM each). A per-domain configuration flags whether a source needs JS rendering, with automatic fallback: if static extraction returns suspiciously short content, the page is retried through the headless browser pool.

**Why Rod over chromedp:** Rod has built-in `PagePool` for concurrent browser management, decode-on-demand architecture (lower CPU waste on ad-heavy news pages), and ships with a pinned Chromium version (avoids browser upgrade breakage). chromedp's single event-loop design can deadlock under high concurrency.

### Crawl Scheduling — Apache Airflow

| Concern | Technology | Notes |
|---------|-----------|-------|
| Runtime | Python 3.12+ | Airflow is Python-native |
| Scheduler | Airflow scheduler | Cron-like scheduling for hundreds of sources at different intervals |
| UI | Airflow web UI | Full DAG visualization, job history, retry controls, failure alerting |
| Executor | CeleryExecutor (dev) or KubernetesExecutor (prod) | CeleryExecutor uses RabbitMQ as broker. KubernetesExecutor spawns k8s pods per task. |
| Job dispatch | RabbitMQ | Airflow publishes "crawl source X" messages; Go workers consume them |

**Why Airflow for scheduling:** The crawl scheduler must manage hundreds of recurring jobs at different intervals, persist job state, retry failures with backoff, alert on repeated failures, and provide a UI for operators to see what's running and manually re-trigger jobs. Building this on top of a bare cron library (like Go's robfig/cron) would mean building a scheduling platform from scratch. Airflow is purpose-built for this — it handles schedule management, retries, alerting, and provides a full web UI out of the box.

Airflow does not do the crawling. It triggers crawl jobs by publishing to RabbitMQ. The Go crawler consumes those messages, does the work, and reports results back. Airflow tracks success/failure.

### Discovery Service — Python / FastAPI

| Concern | Technology | Notes |
|---------|-----------|-------|
| Runtime | Python 3.12+ | Richest AI/ML ecosystem |
| Framework | FastAPI | Async, fast, auto-generated OpenAPI docs |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | Small (80MB model), fast, runs on CPU, 384-dim vectors |
| Inference | ONNX Runtime | Optimized inference without full PyTorch overhead |
| Vector search | pgvector via asyncpg | Query embeddings directly in PostgreSQL |
| ML utilities | scikit-learn, numpy | Clustering, similarity computation |

**Why pgvector (not RAG):** pgvector is used for **similarity search**, not retrieval-augmented generation. Each article gets a 384-dimension vector embedding representing its content. These embeddings enable queries like "find sources that publish content similar to what this user reads" and "find articles similar to ones this user engaged with." This is pure math — cosine distance between vectors — not LLM-powered generation. No prompts, no completions, no token costs. pgvector keeps this capability inside PostgreSQL, avoiding a separate vector database.

If the discovery service doesn't end up needing vector similarity (e.g., keyword/topic matching proves sufficient), pgvector can be dropped with zero impact on the rest of the system.

**Why ONNX Runtime (not an LLM):** ONNX Runtime runs the embedding model — a small neural network that converts text to a numerical vector. This is not an LLM and not a substitute for one. The model (all-MiniLM-L6-v2) is 80MB, runs on CPU in ~5ms per article, is free, deterministic, and fully self-hosted. An LLM API call for the same embedding would cost $0.001-0.01 per article, take 500-2000ms, and require an external service. ONNX Runtime is the right tool for this specific job.

If we later add features that require actual LLM capabilities (article summarization, natural language discovery queries), those would be separate integrations calling an LLM API or a self-hosted model — distinct from the embedding pipeline.

---

## Data Layer

### PostgreSQL

PostgreSQL is the single source of truth for all structured data. Self-hosted via Docker (local) or a k8s StatefulSet (production). Optionally use a managed service (Neon, RDS, Cloud SQL) in production.

| Extension | Purpose |
|-----------|---------|
| pgvector | Vector embeddings for discovery/similarity search (HNSW index) |
| pg_trgm | Trigram similarity for fuzzy text search and breaking news cross-source correlation |

Four schemas: `content` (sources, articles), `users` (accounts, preferences, blocked sources, paywall subscriptions), `feed` (read state, feed positions), `ads` (campaigns, creatives, impressions).

Article table partitioned by `published_at` (monthly). Old partitions archived to cold storage.

### Redis

Self-hosted via Docker (local) or k8s (production). Optionally use a managed service (ElastiCache, Memorystore) in production.

| Use Case | Pattern |
|----------|--------|
| Feed page cache | `feed:{user_id}:cursor:{cursor}` — 5 min TTL |
| Article metadata cache | `article:{id}` — 1 hour TTL |
| Crawl rate limiting | Token bucket per source |
| Ad frequency capping | Counter per user per campaign |
| Session cache | Keycloak session data |

### RabbitMQ

Single message bus for all backend service communication. Self-hosted via Docker (local) or the RabbitMQ Cluster Operator on k8s (production).

| Use Case | Exchange/Queue Pattern |
|----------|----------------------|
| Crawl job dispatch | Airflow publishes to `crawl.jobs` queue → Go workers consume |
| Article events | Go publishes to `article.events` topic exchange → TS feed service, Python discovery service consume |
| Async tasks | TS publishes to `tasks.*` queues (feed cache rebuild, ad impression logging) → TS workers consume |
| Crawl results | Go publishes success/failure to `crawl.results` → Airflow callback consumer tracks completion |

RabbitMQ's management UI provides real-time monitoring of queue depths, message rates, consumer status, and lets operators inspect and retry failed messages. Dead-letter exchanges handle failed message routing automatically.

### MinIO

S3-compatible object storage, self-hosted. Docker container for local dev, k8s deployment for production. Optionally use S3, R2, or GCS in production.

- Article thumbnail images
- Open Graph images
- Archived article snapshots

---

## Authentication — Keycloak

Keycloak is a self-hosted identity and access management server. It runs as a Docker container (local) or k8s deployment (production).

| Capability | Notes |
|-----------|-------|
| User registration + login | Built-in flows with customizable themes |
| Password reset | Email-based recovery flow |
| Token management | OIDC/OAuth2 access + refresh tokens |
| Admin UI | Full user management, role assignment, session monitoring |
| Social login (future) | Google, Apple, GitHub sign-in via OIDC federation |
| API protection | NestJS validates Keycloak-issued JWTs; no custom auth code needed |

---

## Infrastructure

### Local Development (Docker Compose)

Everything runs locally with a single `docker-compose up`:

| Service | Image | Notes |
|---------|-------|-------|
| PostgreSQL + pgvector | pgvector/pgvector:pg16 | With pgvector extension pre-installed |
| Redis | redis:7-alpine | Caching and rate limiting |
| RabbitMQ | rabbitmq:3-management | Message bus + management UI on port 15672 |
| Keycloak | quay.io/keycloak/keycloak | Auth server with admin UI |
| MinIO | minio/minio | S3-compatible object storage + web console |
| Airflow | apache/airflow | Scheduler + web UI. Uses CeleryExecutor with RabbitMQ as broker. |
| NestJS API | Custom Dockerfile | TypeScript API server |
| Go Crawler | Custom Dockerfile | Ingestion pipeline |
| Python Discovery | Custom Dockerfile | FastAPI discovery service |
| Nginx | nginx:alpine | Reverse proxy + static file serving for web app |

### Production (Kubernetes)

All services deploy to k8s. The architecture is container-native from day one — Docker Compose locally maps directly to k8s Deployments/StatefulSets in production.

| Component | k8s Resource | Scaling |
|-----------|-------------|---------|
| NestJS API | Deployment (2-4 replicas) | HPA based on CPU/request latency |
| Go Crawler | Deployment (1-2 replicas) | Scale manually based on source count |
| Python Discovery | Deployment (1 replica) | Scale based on embedding queue depth |
| Airflow | Helm chart (official) | KubernetesExecutor spawns pods per crawl task |
| PostgreSQL | StatefulSet or managed (RDS/Cloud SQL/Neon) | Vertical scaling, read replicas at scale |
| Redis | StatefulSet or managed (ElastiCache) | Single instance initially, Sentinel for HA |
| RabbitMQ | RabbitMQ Cluster Operator | 3-node quorum queue cluster for HA |
| Keycloak | Deployment (2 replicas) | Stateless with external DB (shares PostgreSQL) |
| MinIO | StatefulSet or managed (S3/R2/GCS) | Erasure coding for HA at scale |
| Nginx / Ingress | Ingress Controller (Nginx or Traefik) | Edge proxy, TLS termination, static assets |

**Optional production enhancements:**
- CDN (Cloudflare, CloudFront) in front of the Ingress for static asset caching and DDoS protection
- Managed database (Neon, RDS, Cloud SQL) to reduce PostgreSQL ops burden
- Managed Redis (ElastiCache, Memorystore) for HA without managing Sentinel

### Monitoring and Operations

All monitoring is self-hosted, running alongside the application in Docker Compose (local) or k8s (production).

| Concern | Technology | Notes |
|---------|-----------|-------|
| Metrics collection | Prometheus | Scrapes all services. Airflow, RabbitMQ, and Redis have native Prometheus exporters. |
| Dashboards | Grafana | Self-hosted. Pre-built dashboards for RabbitMQ, PostgreSQL, Redis, Airflow. |
| Logging | Grafana Loki | Aggregates structured JSON logs from all services |
| Error tracking | Sentry (self-hosted) | Self-hosted Sentry or GlitchTip as a lighter alternative |
| Uptime | Grafana Synthetic Monitoring or Blackbox Exporter | Endpoint health checks |
| CI/CD | GitHub Actions | Build, test, and deploy pipelines per service |

---

## Development Tooling

| Tool | Purpose |
|------|---------|
| Turborepo | Monorepo management. TS-dominant; Go and Python services use thin package.json wrappers that shell out to native build commands. |
| Docker Compose | Local development environment — all infrastructure + services |
| GitHub Actions | CI/CD pipelines per service |
| Bruno or Insomnia | API testing (GraphQL + REST) |
| ESLint + Prettier | TypeScript linting and formatting |
| golangci-lint | Go linting |
| Ruff | Python linting and formatting |

**Turborepo and polyglot support:** Turborepo is JavaScript-focused but orchestrates Go and Python tasks through package.json scripts. Each Go/Python service has a minimal `package.json` defining `build`, `test`, and `lint` scripts that call native tools (`go build`, `pytest`, `ruff`). Turborepo's caching works for these tasks based on file hashing. This is slightly indirect but avoids adding a second build orchestration tool for a TS-dominant monorepo.

---

## Language Boundary Communication

The backend languages communicate through RabbitMQ (events + job dispatch) and PostgreSQL (shared data):

```
                  GraphQL/REST
React Native ◄──────────────────► NestJS API (TypeScript)
                                       │
                                       │ PostgreSQL (shared DB)
                                       │ RabbitMQ (events + tasks)
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
              Go Crawler        Python Discovery    Airflow (Python)
              (consumes crawl   (reads/writes DB,   (schedules crawl
               jobs from RMQ,    serves REST API     jobs, publishes
               publishes events  for recs, consumes  to RMQ, tracks
               to RMQ, writes    article events      success/failure)
               articles to DB)   from RMQ)
```

- **Airflow → Go:** Airflow publishes crawl job messages to RabbitMQ. Go workers consume them.
- **Go → TypeScript:** Go publishes `article.created` / `article.updated` events to RabbitMQ. NestJS consumers handle cache invalidation.
- **Go → Python:** Go publishes article events to RabbitMQ. Python discovery service consumes them and computes embeddings.
- **TypeScript → Python:** NestJS calls Python's FastAPI endpoints for discovery recommendations (HTTP/REST).
- **Go → Airflow:** Go publishes crawl result messages to RabbitMQ. An Airflow callback consumer tracks job completion.

All cross-service communication goes through RabbitMQ or direct HTTP calls. No service mesh, no gRPC, no shared in-process state. This is appropriate for a small team and can be decomposed further if needed.

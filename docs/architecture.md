# znews - System Architecture

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│                                                                          │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐    │
│   │  iOS App     │  │ Android App  │  │   Web App                  │    │
│   │  (React      │  │ (React       │  │   (react-native-web)       │    │
│   │   Native)    │  │  Native)     │  │   mobile / tablet / desktop│    │
│   ├──────────────┤  ├──────────────┤  └────────────────────────────┘    │
│   │ iOS Widgets  │  │Android Widget│                                     │
│   │ (Swift/      │  │(Kotlin/      │                                     │
│   │  WidgetKit)  │  │ Glance)      │                                     │
│   └──────┬───────┘  └──────┬───────┘                                     │
└──────────┼─────────────────┼─────────────────────────────────────────────┘
           │                 │
           └────────┬────────┘
                    │  HTTPS / GraphQL
                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Nginx / Ingress Controller                             │
│              (reverse proxy, TLS, static assets)                         │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (NestJS + Fastify adapter)                │
│                                                                          │
│   ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐    │
│   │  GraphQL API    │  │  REST API        │  │  WebSocket (future)  │    │
│   │  (Apollo via    │  │  (admin,         │  │  (live updates)      │    │
│   │   @nestjs/      │  │   webhooks)      │  │                      │    │
│   │   graphql)      │  │                  │  │                      │    │
│   └────────┬────────┘  └────────┬─────────┘  └──────────┬───────────┘    │
└────────────┼────────────────────┼────────────────────────┼───────────────┘
             │                    │                        │
     ┌───────┴────────────────────┴────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION SERVICES                             │
│                                                                          │
│   ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────────┐   │
│   │ Feed Gen    │ │ User Profile │ │ Ad Service │ │ Discovery       │   │
│   │ Service     │ │ Service      │ │            │ │ Service         │   │
│   │ (NestJS     │ │ (NestJS      │ │ (NestJS    │ │ (Python/FastAPI)│   │
│   │  module)    │ │  module)     │ │  module)   │ │                 │   │
│   └──────┬──────┘ └──────┬───────┘ └─────┬──────┘ └───────┬─────────┘   │
└──────────┼───────────────┼───────────────┼─────────────────┼─────────────┘
           │               │               │                 │
           └───────┬───────┴───────┬───────┘                 │
                   │               │                         │
                   ▼               ▼                         │
            ┌────────────┐  ┌────────────┐                   │
            │ PostgreSQL │  │   Redis    │◄──────────────────┘
            │ + pgvector │  │            │
            └──────┬─────┘  └────────────┘
                   │
                   │  shared database + message bus
                   │
┌──────────────────┼───────────────────────────────────────────────────────┐
│                  │     SCHEDULING + INGESTION LAYER                       │
│                  │                                                        │
│   ┌──────────────▼──────────────────────────────────────────────────┐    │
│   │                      Apache Airflow                             │    │
│   │              (scheduler + web UI + DAG management)               │    │
│   │  Manages crawl schedules per source, tracks success/failure,     │    │
│   │  retries, alerting. Publishes crawl jobs to RabbitMQ.            │    │
│   └───────────────────────────┬──────────────────────────────────────┘    │
│                               │ publishes crawl jobs                     │
│                               ▼                                          │
│   ┌───────────────────────────────────────────────────────────────┐      │
│   │                       RabbitMQ                                 │      │
│   │            (message bus for all backend services)              │      │
│   └───────────────────────────┬───────────────────────────────────┘      │
│                               │ crawl jobs consumed                      │
│                               ▼                                          │
│   ┌───────────────────────────────────────────────────────────────┐      │
│   │              Content Ingestion Pipeline (Go)                   │      │
│   │                                                                │      │
│   │   ┌──────────────────────────────────────────────────────┐    │      │
│   │   │  Static Path (80%)        │  JS Path (20%)           │    │      │
│   │   │  Colly + goquery          │  Rod headless browser    │    │      │
│   │   │  net/http + gofeed (RSS)  │  pool (Chrome DevTools)  │    │      │
│   │   └──────────────────────────────────────────────────────┘    │      │
│   │                                                                │      │
│   │   → Writes articles to PostgreSQL                              │      │
│   │   → Publishes events to RabbitMQ (article.created/updated)     │      │
│   │   → Publishes crawl results to RabbitMQ (success/failure)      │      │
│   │   → Stores images to MinIO                                     │      │
│   └───────────────────────────────────────────────────────────────┘      │
│                                                                          │
│   ┌──────────────────────┐    ┌──────────────────────┐                   │
│   │ Keycloak             │    │ MinIO                │                   │
│   │ (auth server)        │    │ (object storage)     │                   │
│   └──────────────────────┘    └──────────────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Service Descriptions

### 1. Content Ingestion Pipeline (Go)

The ingestion pipeline fetches, parses, and stores articles from hundreds of news sources. It runs as a separate process from the API servers to avoid resource contention. It does NOT manage its own scheduling — Airflow handles that.

#### Two-Tier Crawl Architecture

Most major news sites serve article content in initial HTML (for SEO) or via RSS feeds. The crawler uses two paths:

```
RabbitMQ crawl job
       │
       ▼
  ┌─────────────────────────────────────────────────┐
  │              Domain Router                       │
  │  (checks per-source config for rendering mode)   │
  └─────────┬───────────────────────┬───────────────┘
            │                       │
   Static (default)          JS-Required
            │                       │
            ▼                       ▼
  ┌─────────────────┐    ┌─────────────────────┐
  │  HTTP GET +      │    │  Rod PagePool        │
  │  Colly/goquery   │    │  (headless Chrome)   │
  │  or gofeed (RSS) │    │  ~50-150MB per tab   │
  │  ~5-20ms/page    │    │  ~2-5s per page      │
  └────────┬─────────┘    └──────────┬──────────┘
           │                         │
           │   ┌─────────────────────┘
           │   │
           ▼   ▼
  ┌─────────────────────────────────────────────────┐
  │              Content Processor                    │
  │  - Parse title, author, summary, publish date    │
  │  - Extract/download thumbnail image → MinIO      │
  │  - Compute content_hash (detect changes)         │
  │  - Classify topics (rule-based)                  │
  │  - Detect paywall status                         │
  │  - Deduplicate by URL hash                       │
  └────────┬────────────────────┬───────────────────┘
           │                    │
           ▼                    ▼
  ┌─────────────┐      ┌──────────────┐
  │ PostgreSQL  │      │  RabbitMQ    │
  │ (article    │      │  article.    │
  │  upsert)    │      │  created     │
  └─────────────┘      │  + crawl.    │
                        │  results    │
                        └──────────────┘
```

**Static path (~80% of sources):** Colly or `net/http` + goquery for HTML, gofeed for RSS/Atom. Fast, lightweight. Most major news outlets (BBC, CNN, NYT, AP, The Guardian, NPR) serve content in initial HTML because SEO requires it.

**JS path (~20% of sources):** Rod manages a pool of headless Chrome tabs for sources that require JavaScript rendering (SPA-heavy digital outlets, pages with JS-driven content loading). Per-domain configuration flags which sources need JS. Automatic fallback: if static extraction returns content under 200 characters, retry through the browser pool.

**Fallback rendering service (optional):** For production deployments that want to decouple browser management, deploy Browserless as a sidecar Docker container. The Go crawler sends HTTP POST requests to get rendered HTML instead of managing Chrome processes directly.

#### Crawl Job Flow

```
1. Airflow triggers a crawl DAG task on schedule
2. Airflow publishes message to RabbitMQ: { sourceId: 42, type: "crawl" }
3. Go worker consumes message from crawl.jobs queue
4. Worker fetches source config from PostgreSQL (or Redis cache)
5. Worker routes to static or JS path based on source config
6. Worker fetches and parses content
7. For each article found:
   a. Check url_hash against existing articles (dedup)
   b. If new: parse, compute content_hash, store to PostgreSQL
   c. If existing: compare content_hash, update only if changed
   d. Download thumbnail image to MinIO
   e. Publish article.created or article.updated to RabbitMQ
8. Publish crawl result (success + article count, or failure + error) to RabbitMQ
9. Airflow callback consumer records job completion/failure
```

### 2. Crawl Scheduling — Apache Airflow

Airflow manages all crawl scheduling. It does not crawl — it decides *when* to crawl and delegates the work to Go workers via RabbitMQ.

#### Tiered Refresh Scheduling

Sources and articles are refreshed at decreasing frequencies as content ages:

```
┌─────────────────────────────────────────────────────────────────┐
│                    REFRESH TIER LOGIC                            │
│                                                                  │
│  Article Age          Tier          Refresh Interval             │
│  ─────────────────────────────────────────────────────           │
│  Flagged breaking     BREAKING      Every 3 minutes              │
│  < 24 hours           FRESH         Every 1 hour                 │
│  1 - 7 days           RECENT        Every 6 hours                │
│  7 - 30 days          OLDER         Every 24 hours               │
│  > 30 days            ARCHIVED      No refresh; move to archive  │
│                                                                  │
│  Tier transitions happen automatically when an article's age     │
│  crosses a threshold.                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation in Airflow:**
- A master DAG queries the sources table for sources due for crawling and generates crawl tasks dynamically.
- Each source has its own crawl interval stored in the database. Airflow's scheduler respects these intervals.
- Article re-fetch DAGs query for articles whose `next_refresh_at` has passed and dispatch re-fetch jobs.
- Airflow's built-in retry logic handles transient failures (network timeouts, rate limits). Persistent failures trigger alerts.

**Breaking News Detection:**
An article is elevated to the BREAKING tier when any of:
- The source publishes 3+ articles in the same hour (burst detection)
- Multiple sources publish articles with high title similarity within 30 minutes (cross-source correlation via pg_trgm)
- The source's RSS feed includes explicit breaking/urgent metadata
- A manual flag is set by an operator

Breaking status automatically gets reevaluated every hour, dropping the article to FRESH tier unless the article has been refreshed multiple times in the last hour.

### 3. Feed Generation Service (NestJS module)

The feed service assembles personalized, chronological feeds for each user. It is the most user-facing service and directly implements znews's core differentiators.

#### Feed Assembly Algorithm

```
REQUEST: feed(userId, cursor, pageSize=25)

1. Load user context (cached in Redis, fallback to Postgres):
   - Blocked source IDs
   - Paywall subscription source IDs
   - Paywall display preference (hide / show_flagged)
   - Topic interests and weights
   - User tier (free / paid)

2. Query articles from PostgreSQL:
   SELECT * FROM content.articles
   WHERE status = 'active'
     AND source_id NOT IN (blocked_source_ids)
     AND published_at < cursor
     [AND (is_paywall = FALSE OR source_id IN (paywall_sub_ids))  -- if hide mode]
   ORDER BY published_at DESC
   LIMIT pageSize + 1

3. For each article:
   a. Check read state (feed.read_state table)
   b. Flag paywall content user doesn't subscribe to (if show_flagged mode)
   c. Check if article falls before user's last_seen_at timestamp

4. Insert "You're all caught up" marker at the chronological position
   matching the user's last_seen_at timestamp

5. If user is on free tier:
   Insert clearly-labeled ad placements every 8-12 articles
   (ads are a separate data type, never mixed with articles)

6. Return:
   {
     items: [Article | Advertisement | CaughtUpMarker],
     cursor: last_article.published_at,
     hasMore: boolean
   }
```

#### Cursor-Based Pagination

The feed uses cursor-based pagination with `published_at` timestamps, not offset-based pagination. New articles are being ingested continuously — offset pagination would cause items to shift and repeat. Cursor pagination provides stable, consistent results.

```
Page 1:  cursor=null          → articles from now backward, limit 25
Page 2:  cursor=2026-04-12T14:30:00Z → articles before that timestamp, limit 25
...
Last page: hasMore=false      → "You've reached the end of your feed"
```

#### The "Caught Up" Marker

When a user opens the app, we record the timestamp of the newest article they see. On their next visit, as they scroll through new content, they encounter the marker at the chronological position of that timestamp: "You're all caught up — everything below this you've already had the chance to see."

This is NOT infinite scroll. The feed has a definite end. No recycling of content.

```
┌────────────────────────────┐
│  Article (10 min ago)      │  ◄── New since last visit
│  Article (25 min ago)      │
│  Article (1 hour ago)      │
│  ADVERTISEMENT             │  ◄── Free tier only, clearly labeled
│  Article (2 hours ago)     │
│  Article (3 hours ago)     │
├────────────────────────────┤
│  ✓ You're all caught up    │  ◄── Caught-up marker
├────────────────────────────┤
│  Article (5 hours ago)     │  ◄── Already available last visit
│  Article (8 hours ago)     │
│  ...                       │
│  END OF FEED               │  ◄── Terminal boundary
└────────────────────────────┘
```

#### Ad Insertion (Free Tier)

Ads are injected into the feed response as a distinct type — `Advertisement`, never `Article`. The client renders them with a visually different treatment. The ad service selects placements based on:
- Topic relevance (match ad targeting to surrounding article topics)
- Frequency capping (max 3 impressions per campaign per user per day, tracked in Redis)
- Budget pacing (distribute spend evenly across campaign duration)

Ad impressions are logged asynchronously via RabbitMQ to keep feed responses fast.

---

### 4. User Profile Service (NestJS module)

Manages all user-specific data: preferences, blocked sources, paywall declarations, and topic interests. Auth is handled by Keycloak — this service manages the application-level user data only.

#### Source Blocking

Blocking is a first-class feature. Users can block any source and provide a reason:

| Reason | Description |
|--------|-------------|
| MISINFORMATION | Source publishes false or misleading content |
| CLICKBAIT | Source uses sensational or misleading headlines |
| POLITICAL_BIAS | Source exhibits strong political bias |
| LOW_QUALITY | Source has poor writing, excessive ads, or thin content |
| IRRELEVANT | Source covers topics the user is not interested in |
| OTHER | User-provided free-text reason |

Block reasons are aggregated anonymously across all users to build content quality signals. Individual user blocks are never shared.

#### Paywall Management

Users declare which paid publications they subscribe to. The feed service uses this list to:
- **Hide mode (default):** Exclude paywalled content from unsubscribed sources
- **Show flagged mode:** Include all content but add a paywall indicator

---

### 5. Discovery Service (Python / FastAPI)

AI-powered content and source discovery using vector similarity search.

#### Embedding Pipeline

```
Article event received from RabbitMQ
       │
       ▼
  ┌──────────────────────────┐
  │  Load article text       │
  │  (title + summary)       │
  └────────────┬─────────────┘
               │
               ▼
  ┌──────────────────────────┐
  │  Compute embedding       │
  │  (all-MiniLM-L6-v2,     │
  │   384 dimensions,        │
  │   via ONNX Runtime,      │
  │   ~5ms per article)      │
  └────────────┬─────────────┘
               │
               ▼
  ┌──────────────────────────┐
  │  Store in PostgreSQL     │
  │  articles.embedding      │
  │  (pgvector column)       │
  └──────────────────────────┘
```

Embeddings are computed in batches, not synchronously with article ingestion. The discovery service consumes `article.created` events from RabbitMQ and processes them in batches.

#### Source Similarity

Each source gets a composite embedding: the centroid (average) of its most recent 100 articles' embeddings, recomputed daily. When a user requests source discovery:
1. Compute the user's interest centroid from their followed (non-blocked) sources
2. Query pgvector for sources with nearby centroids that the user doesn't follow or block
3. Rank by similarity and return suggestions

---

### 6. Ad Service (NestJS module)

Manages advertising campaigns, creative assets, targeting, and impression tracking for the free tier.

**Design principles:**
- Ads are **never** stored in the articles table or served through the same data path
- Ad items in the feed always carry `type: "advertisement"` — enforced at the data model level
- The client renders ads with a distinct background color, border, and "ADVERTISEMENT" label
- Paid tier users never receive any ad data in their feed responses

#### Impression Flow

```
Feed request (free tier)
       │
       ▼
  Select ad placement (topic targeting + frequency cap in Redis)
       │
       ▼
  Include ad in feed response
       │
       ▼
  Client renders ad (with clear labeling)
       │
       ▼
  Client reports impression → NestJS API
       │
       ▼
  NestJS publishes to RabbitMQ ads.impressions queue (async)
       │
       ▼
  Worker writes to ads.impressions table + updates budget counter
```

---

### 7. API Gateway (NestJS)

The NestJS application is the single entry point for all client requests. Keycloak handles authentication — the API validates Keycloak-issued JWTs on each request.

#### GraphQL Schema (Key Types)

```graphql
union FeedItem = Article | Advertisement | CaughtUpMarker | FeedEnd

type Query {
  feed(cursor: String, pageSize: Int = 25): FeedConnection!
  article(id: ID!): Article
  sources(query: String, page: Int): SourceConnection!
  discoverSources(limit: Int = 10): [SourceSuggestion!]!
  discoverArticles(limit: Int = 10): [Article!]!
  blockedSources: [BlockedSource!]!
  paywallSubscriptions: [Source!]!
}

type Mutation {
  blockSource(sourceId: ID!, reason: BlockReason!, detail: String): Boolean!
  unblockSource(sourceId: ID!): Boolean!
  declarePaywall(sourceId: ID!): Boolean!
  removePaywall(sourceId: ID!): Boolean!
  updatePreferences(input: PreferencesInput!): Preferences!
  markSeen(articleIds: [ID!]!): Boolean!
  markRead(articleId: ID!): Boolean!
  addSource(url: String!): Source!
}

type FeedConnection {
  items: [FeedItem!]!
  cursor: String
  hasMore: Boolean!
  totalUnread: Int
}

type Article {
  id: ID!
  title: String!
  summary: String
  source: Source!
  publishedAt: DateTime!
  imageUrl: String
  articleUrl: String!
  isPaywall: Boolean!
  paywallNotice: Boolean!
  isRead: Boolean!
  topics: [String!]!
}

type Advertisement {
  id: ID!
  headline: String!
  body: String
  imageUrl: String
  clickUrl: String!
  advertiser: String!
  label: String!            # Always "ADVERTISEMENT"
}

type CaughtUpMarker {
  timestamp: DateTime!
  message: String!
}

enum BlockReason {
  MISINFORMATION
  CLICKBAIT
  POLITICAL_BIAS
  IRRELEVANT
  LOW_QUALITY
  OTHER
}
```

REST endpoints handle:
- `GET /health`, `GET /ready` — health and readiness probes for k8s
- `POST /webhooks/ad-partner` — ad partner callbacks
- `GET /admin/*` — admin dashboard API (protected by Keycloak admin role)

Auth endpoints are handled by Keycloak directly (OIDC flows). The NestJS API only validates tokens.

---

## Data Model

### Content Schema

```sql
CREATE SCHEMA content;

CREATE TABLE content.sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    url             TEXT NOT NULL UNIQUE,
    feed_url        TEXT,
    feed_type       TEXT,                    -- 'rss', 'atom', 'json_feed', 'html_scrape'
    render_mode     TEXT DEFAULT 'static',   -- 'static' or 'js' (determines crawl path)
    is_paywall      BOOLEAN DEFAULT FALSE,
    content_type    TEXT DEFAULT 'editorial',
    crawl_config    JSONB DEFAULT '{}',
    robots_txt      TEXT,
    robots_fetched  TIMESTAMPTZ,
    reliability     REAL DEFAULT 1.0,
    block_rate      REAL DEFAULT 0.0,
    crawl_interval  TEXT DEFAULT '1 hour',   -- Airflow schedule interval
    next_crawl_at   TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content.articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID NOT NULL REFERENCES content.sources(id),
    url             TEXT NOT NULL,
    url_hash        TEXT GENERATED ALWAYS AS (encode(sha256(url::bytea), 'hex')) STORED,
    title           TEXT NOT NULL,
    summary         TEXT,
    author          TEXT,
    published_at    TIMESTAMPTZ NOT NULL,
    fetched_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    content_hash    TEXT,
    image_url       TEXT,
    image_stored    TEXT,                    -- MinIO object key
    is_paywall      BOOLEAN DEFAULT FALSE,
    topics          TEXT[],
    embedding       vector(384),
    metadata        JSONB DEFAULT '{}',
    refresh_tier    TEXT DEFAULT 'fresh',
    next_refresh_at TIMESTAMPTZ,
    status          TEXT DEFAULT 'active'
) PARTITION BY RANGE (published_at);

CREATE INDEX idx_articles_feed ON content.articles (published_at DESC, source_id)
    WHERE status = 'active';
CREATE UNIQUE INDEX idx_articles_url ON content.articles (url_hash);
CREATE INDEX idx_articles_refresh ON content.articles (next_refresh_at)
    WHERE status = 'active' AND next_refresh_at IS NOT NULL;

CREATE TABLE content.source_embeddings (
    source_id       UUID PRIMARY KEY REFERENCES content.sources(id),
    embedding       vector(384) NOT NULL,
    article_count   INTEGER NOT NULL,
    computed_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### Users Schema

```sql
CREATE SCHEMA users;

-- Keycloak manages authentication. This table stores application-level user data.
-- The id matches the Keycloak user ID (sub claim from JWT).
CREATE TABLE users.profiles (
    id              UUID PRIMARY KEY,        -- matches Keycloak user ID
    email           TEXT NOT NULL UNIQUE,
    tier            TEXT DEFAULT 'free',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users.blocked_sources (
    user_id         UUID NOT NULL REFERENCES users.profiles(id),
    source_id       UUID NOT NULL REFERENCES content.sources(id),
    reason          TEXT NOT NULL,
    reason_detail   TEXT,
    blocked_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, source_id)
);

CREATE TABLE users.paywall_subscriptions (
    user_id         UUID NOT NULL REFERENCES users.profiles(id),
    source_id       UUID NOT NULL REFERENCES content.sources(id),
    declared_at     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, source_id)
);

CREATE TABLE users.topic_interests (
    user_id         UUID NOT NULL REFERENCES users.profiles(id),
    topic           TEXT NOT NULL,
    weight          REAL DEFAULT 1.0,
    PRIMARY KEY (user_id, topic)
);

CREATE TABLE users.preferences (
    user_id         UUID PRIMARY KEY REFERENCES users.profiles(id),
    paywall_behavior TEXT DEFAULT 'hide',
    feed_density    TEXT DEFAULT 'normal',
    timezone        TEXT DEFAULT 'UTC',
    preferences     JSONB DEFAULT '{}'
);
```

### Feed Schema

```sql
CREATE SCHEMA feed;

CREATE TABLE feed.read_state (
    user_id         UUID NOT NULL,
    article_id      UUID NOT NULL,
    read_at         TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

CREATE INDEX idx_read_state_cleanup ON feed.read_state (read_at);

CREATE TABLE feed.user_feed_position (
    user_id         UUID PRIMARY KEY,
    last_seen_at    TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Ads Schema

```sql
CREATE SCHEMA ads;

CREATE TABLE ads.campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id   UUID NOT NULL,
    name            TEXT NOT NULL,
    budget_cents    BIGINT NOT NULL,
    spent_cents     BIGINT DEFAULT 0,
    cpm_cents       INTEGER NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    targeting       JSONB DEFAULT '{}',
    status          TEXT DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ads.creatives (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES ads.campaigns(id),
    headline        TEXT NOT NULL,
    body            TEXT,
    image_url       TEXT,
    click_url       TEXT NOT NULL,
    status          TEXT DEFAULT 'active'
);

CREATE TABLE ads.impressions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creative_id     UUID NOT NULL,
    user_id         UUID,
    shown_at        TIMESTAMPTZ DEFAULT NOW(),
    clicked         BOOLEAN DEFAULT FALSE,
    clicked_at      TIMESTAMPTZ
);
```

---

## RabbitMQ Topology

### Exchanges

| Exchange | Type | Purpose |
|----------|------|---------|
| `article.events` | topic | Article lifecycle events (created, updated, archived) |
| `crawl.jobs` | direct | Crawl job dispatch from Airflow to Go workers |
| `crawl.results` | direct | Crawl completion reports from Go back to Airflow callback |
| `tasks` | direct | Async task dispatch (feed cache rebuild, ad impressions) |
| `tasks.dlx` | fanout | Dead-letter exchange for failed tasks |

### Queues

| Queue | Bound To | Consumer |
|-------|----------|----------|
| `crawl.jobs.go` | crawl.jobs | Go crawler workers |
| `article.events.feed` | article.events (routing key: `article.*`) | NestJS feed cache invalidation |
| `article.events.discovery` | article.events (routing key: `article.created`) | Python discovery embedding |
| `crawl.results.airflow` | crawl.results | Airflow callback consumer |
| `tasks.feed-cache` | tasks (routing key: `feed.rebuild`) | NestJS feed cache worker |
| `tasks.ad-impressions` | tasks (routing key: `ads.impression`) | NestJS ad impression writer |
| `tasks.dlq` | tasks.dlx | Dead-letter queue for failed tasks (manual inspection) |

### Dead-Letter Handling

Every task queue is configured with a dead-letter exchange (`tasks.dlx`). Messages that fail after N retries (configurable per queue, default 3) are automatically routed to `tasks.dlq`. The RabbitMQ management UI lets operators inspect failed messages, see error details, and manually re-queue them.

---

## Caching Strategy

### Cache Layers

```
Client (in-memory via TanStack Query)
    │
    ▼
Nginx (static assets only)
    │
    ▼
Redis (application cache)
    │
    ▼
PostgreSQL (source of truth)
```

### Redis Cache Entries

| Key Pattern | Data | TTL | Invalidation |
|-------------|------|-----|-------------|
| `feed:{userId}:c:{cursor}` | Serialized feed page | 5 min | On article event matching user prefs; on pref change |
| `article:{id}` | Article metadata JSON | 1 hour | On re-fetch with changed content_hash |
| `source:{id}` | Source metadata JSON | 24 hours | On admin update |
| `user:{id}:prefs` | User preferences + blocked sources | 1 hour | On preference mutation |
| `user:{id}:paywalls` | Paywall subscription list | 1 hour | On paywall mutation |
| `ratelimit:crawl:{sourceId}` | Token bucket counter | Self-expiring | N/A |
| `adcap:{userId}:{campaignId}` | Impression counter | 24 hours | Self-expiring |

### Cache Invalidation Flow

```
Go crawler writes article to Postgres
       │
       ▼
Publishes "article.created" to RabbitMQ article.events exchange
       │
       ▼
NestJS cache invalidation consumer receives event
       │
       ▼
Determine affected users (those not blocking this source)
       │
       ▼
Delete feed cache keys: DEL feed:{userId}:*
```

At small scale (< 100K users), this fan-out is feasible. At larger scale, switch to short TTL expiry (5 min) without explicit per-user invalidation.

---

## Scalability Phases

### Phase 1: Launch (0 - 10K users)

Local Docker Compose or single-node k8s:

```
k8s namespace: znews
  NestJS API × 2 replicas
  Go Crawler × 1 replica
  Python Discovery × 1 replica
  Airflow (scheduler + webserver + 1 worker)
  PostgreSQL × 1 (StatefulSet)
  Redis × 1
  RabbitMQ × 1
  Keycloak × 1
  MinIO × 1
  Nginx Ingress
```

- Direct database queries for feed generation (Redis cache optional at this scale)
- Single Go worker handles all crawling
- Embedding computation runs inline in the discovery worker
- Estimated infrastructure: 1-2 modest VMs or a small k8s cluster

### Phase 2: Growth (10K - 100K users)

- Enable Redis feed caching with event-driven invalidation
- PostgreSQL: add table partitioning on articles, add read replica for feed queries
- Scale ingestion workers to 2-3
- Airflow: switch to KubernetesExecutor (spawns k8s pods per crawl task, scales automatically)
- RabbitMQ: 3-node quorum queue cluster for HA
- Add Typesense for full-text article search if Postgres FTS is insufficient
- Scale NestJS API to 4 replicas with HPA
- Consider managed PostgreSQL (RDS/Cloud SQL) to reduce ops

### Phase 3: Scale (100K - 1M users)

- Shard read state table by user_id hash
- Evaluate dedicated vector store (Qdrant) if pgvector queries degrade
- Consider CQRS: write articles to Postgres, project to a read-optimized store for feed generation
- Scale NestJS API to 8-12 replicas
- Multiple Airflow worker pods
- Redis Sentinel or Redis Cluster for HA
- CDN in front of Ingress for static assets and DDoS protection

---

## Security Considerations

- All external communication over HTTPS (TLS terminated at Nginx/Ingress)
- Authentication via Keycloak (OIDC). NestJS validates JWTs — no custom auth code.
- Keycloak handles password hashing, account lockout, and brute force protection
- Rate limiting at the API gateway (per-IP and per-user)
- Input validation on all GraphQL mutations (class-validator or Zod)
- SQL parameterization via Drizzle ORM (no raw string interpolation)
- CORS restricted to known client origins
- Content Security Policy headers on web responses
- No PII stored beyond email (in Keycloak) and user preferences (in PostgreSQL)
- Block reasons are aggregated anonymously — individual user blocks are not exposed
- No user tracking — see features.md for the full privacy policy
- RabbitMQ internal traffic uses AMQP with TLS in production
- k8s NetworkPolicies restrict pod-to-pod communication to required paths only

---

## Monitoring and Observability

All self-hosted:

| Signal | Tool | Key Metrics |
|--------|------|-------------|
| Metrics | Prometheus | Feed latency p50/p95/p99, crawl success rate, cache hit rate, RabbitMQ queue depth, active users |
| Dashboards | Grafana | Pre-built dashboards for RabbitMQ, PostgreSQL, Redis, Airflow, NestJS |
| Logs | Grafana Loki | Structured JSON logs from all services |
| Errors | Sentry (self-hosted) or GlitchTip | Error rate, stack traces, error classification |
| Alerts | Grafana Alerting | Feed latency > 500ms, crawl failure rate > 10%, queue depth spike, disk usage |
| Job monitoring | Airflow web UI | Crawl DAG status, task history, retry counts, SLA violations |
| Message monitoring | RabbitMQ Management UI | Queue depths, consumer status, dead-letter queue inspection |

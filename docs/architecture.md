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
│                         EDGE / CDN (Cloudflare)                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (TypeScript / Fastify)                    │
│                                                                          │
│   ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐    │
│   │  GraphQL API    │  │  REST API        │  │  WebSocket (future)  │    │
│   │  (Apollo)       │  │  (auth, admin,   │  │  (live updates)      │    │
│   │                 │  │   webhooks)      │  │                      │    │
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
│   │ (TypeScript)│ │ (TypeScript) │ │(TypeScript)│ │ (Python/FastAPI)│   │
│   └──────┬──────┘ └──────┬───────┘ └─────┬──────┘ └───────┬─────────┘   │
└──────────┼───────────────┼───────────────┼─────────────────┼─────────────┘
           │               │               │                 │
           └───────┬───────┴───────┬───────┘                 │
                   │               │                         │
                   ▼               ▼                         │
            ┌────────────┐  ┌────────────┐                   │
            │ PostgreSQL │  │   Redis    │                   │
            │ (Neon)     │  │ (Upstash)  │◄──────────────────┘
            │ + pgvector │  │            │
            └──────┬─────┘  └────────────┘
                   │
                   │  shared database
                   │
┌──────────────────┼───────────────────────────────────────────────────────┐
│                  │     INGESTION LAYER                                    │
│                  │                                                        │
│   ┌──────────────▼──────────────────────────────────────────────────┐    │
│   │              Content Ingestion Pipeline (Go)                    │    │
│   │                                                                  │    │
│   │   ┌───────────┐   ┌────────────┐   ┌────────────────────────┐   │    │
│   │   │ Scheduler │──▶│ Crawl Job  │──▶│ Crawl Workers (pool)   │   │    │
│   │   │ (cron)    │   │ Queue      │   │ - RSS/Atom fetcher     │   │    │
│   │   └───────────┘   │ (NATS)     │   │ - HTML scraper         │   │    │
│   │                    └────────────┘   │ - Content processor    │   │    │
│   │                                     │ - Deduplicator         │   │    │
│   │                                     └────────────────────────┘   │    │
│   └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   ┌──────────────────────┐    ┌──────────────────────┐                   │
│   │ NATS JetStream       │    │ Cloudflare R2        │                   │
│   │ (event bus + queues) │    │ (images, archives)   │                   │
│   └──────────────────────┘    └──────────────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Service Descriptions

### 1. Content Ingestion Pipeline (Go)

The ingestion pipeline is responsible for discovering, fetching, parsing, and storing articles from hundreds of news sources. It runs as a separate process from the API servers to avoid resource contention.

#### Components

**Source Registry**
A PostgreSQL table containing all known news sources — their URLs, RSS feed locations, feed type (RSS/Atom/JSON Feed/HTML scrape), crawl configuration, paywall status, and reliability scores.

**Scheduler**
An in-process cron that runs every minute. It queries the source registry for sources whose `next_refresh_at` has passed and for articles whose `next_refresh_at` has passed, then publishes crawl jobs to the NATS queue.

**Crawl Job Queue (NATS JetStream)**
Durable job queue with at-least-once delivery. Jobs contain the source ID and optional article URL (for re-fetching specific articles). Consumer groups distribute work across crawl workers.

**Crawl Workers**
A pool of goroutines that:
1. Pull jobs from NATS
2. Check per-source rate limits (Redis token bucket, default 1 req/10s per source)
3. Respect `robots.txt` directives
4. Fetch RSS/Atom feeds (preferred) or scrape HTML (fallback)
5. Parse articles: extract title, author, summary, publish date, image URL
6. Compute content hash to detect changes on re-fetch
7. Deduplicate by URL hash
8. Write to PostgreSQL
9. Publish `article.created` or `article.updated` events to NATS
10. Download and store article images to R2

**Content Processor**
After raw article data is extracted:
- Topic classification (rule-based initially: keyword matching against a topic taxonomy; ML-based later)
- Paywall detection (inherit from source-level flag; heuristic detection for mixed sources)
- Content type tagging (editorial vs. sponsored/native ad content from the source)

#### Tiered Refresh Scheduling

Articles are refreshed at decreasing frequencies as they age. This keeps the system current for breaking news without wasting resources on stale content.

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
│  crosses a threshold. The scheduler picks up the new interval    │
│  on the next cycle.                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Breaking News Detection:**
An article is elevated to the BREAKING tier when any of these conditions are met:
- The source publishes 3+ articles in the same hour (burst detection)
- Multiple sources publish articles with high title similarity within a 30-minute window (cross-source correlation via trigram similarity)
- The source's RSS feed includes explicit breaking/urgent metadata
- A manual flag is set by an admin

Breaking status automatically expires after 2 hours, dropping the article to FRESH.

#### Crawl Data Flow

```
Source RSS/HTML
       │
       ▼
  ┌─────────┐     ┌──────────┐     ┌─────────────┐
  │  Fetch   │────▶│  Parse   │────▶│  Deduplicate│
  │  (HTTP)  │     │  (goquery│     │  (url_hash) │
  └─────────┘     │  /gofeed)│     └──────┬──────┘
                   └──────────┘            │
                                           ▼
                              ┌────────────────────┐
                              │  Content Processor  │
                              │  - topic classify   │
                              │  - paywall detect   │
                              │  - content hash     │
                              └─────────┬──────────┘
                                        │
                          ┌─────────────┼──────────────┐
                          ▼             ▼              ▼
                   ┌───────────┐ ┌───────────┐ ┌────────────┐
                   │ PostgreSQL│ │   NATS    │ │ Cloudflare │
                   │ (article  │ │ (event:   │ │ R2 (image  │
                   │  upsert)  │ │ article.  │ │  storage)  │
                   └───────────┘ │ created)  │ └────────────┘
                                 └───────────┘
```

---

### 2. Feed Generation Service (TypeScript / Node.js)

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

The feed uses cursor-based pagination with `published_at` timestamps, not offset-based pagination. This is essential because new articles are being ingested continuously — offset pagination would cause items to shift and repeat. Cursor pagination provides stable, consistent results regardless of concurrent writes.

```
Page 1:  cursor=null          → articles from now backward, limit 25
Page 2:  cursor=2026-04-12T14:30:00Z → articles before that timestamp, limit 25
Page 3:  cursor=2026-04-12T10:15:00Z → articles before that timestamp, limit 25
...
Last page: hasMore=false      → "You've reached the end of your feed"
```

#### The "Caught Up" Marker

When a user opens the app, we record the timestamp of the newest article they see. On their next visit, as they scroll down through new content, they will encounter the marker at the chronological position of that timestamp. The marker says: "You're all caught up — everything below this you've already had the chance to see."

This is NOT infinite scroll. The feed has a definite end. Once the user scrolls past all available articles, the feed shows a terminal message and stops. There is no recycling of content.

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

Ad impressions are logged asynchronously via NATS to keep feed responses fast.

---

### 3. User Profile Service (TypeScript / Node.js)

Manages all user-specific data: accounts, preferences, blocked sources, paywall declarations, and topic interests.

#### Source Blocking

Blocking is a first-class feature. Users can block any source and provide a reason:

| Reason | Description |
|--------|-------------|
| MISINFORMATION | Source publishes false or misleading content |
| CLICKBAIT | Source uses sensational headlines that misrepresent content |
| POLITICAL_BIAS | Source exhibits strong political bias |
| LOW_QUALITY | Source has poor writing, excessive ads, or thin content |
| IRRELEVANT | Source covers topics the user is not interested in |
| OTHER | User-provided free-text reason |

Block reasons create an aggregate feedback loop. Sources with high block rates for MISINFORMATION can be flagged for review, and their content can be deprioritized in discovery recommendations for all users.

#### Paywall Management

Users declare which paid publications they subscribe to. This is a simple list of source IDs. The feed service uses this list to:
- **Hide mode**: Exclude paywalled content from sources the user doesn't subscribe to
- **Show flagged mode**: Include all content but add a visual paywall indicator on content from unsubscribed sources

Users can toggle between these modes at any time.

---

### 4. Discovery Service (Python / FastAPI)

AI-powered content and source discovery. Helps users find new sources that match their interests and reading patterns.

#### Embedding Pipeline

```
New article arrives (via NATS event or polling)
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
  │   via ONNX Runtime)      │
  └────────────┬─────────────┘
               │
               ▼
  ┌──────────────────────────┐
  │  Store in PostgreSQL     │
  │  articles.embedding      │
  │  (pgvector column)       │
  └──────────────────────────┘
```

Embeddings are computed in batches, not synchronously with article ingestion. A background worker polls for articles without embeddings and processes them in batches of 100.

#### Source Similarity

Each source gets a composite embedding: the centroid (average) of its most recent 100 articles' embeddings. This is recomputed daily.

When a user requests source discovery:
1. Compute the user's interest centroid from the embeddings of sources they follow (non-blocked)
2. Query pgvector for sources with nearby centroids that the user does not already follow or block
3. Rank by similarity and return top suggestions with explanations ("Similar to sources you read like...")

#### Content Recommendations (Paid Tier)

For paid users, the discovery service also recommends individual articles:
1. Compute a reading profile from the user's recent read articles' embeddings
2. Find unread articles with high similarity to the reading profile
3. Boost articles from sources the user has not seen before (diversity)
4. Return recommendations as a separate feed section

---

### 5. Ad Service (TypeScript / Node.js)

Manages advertising campaigns, creative assets, targeting, and impression tracking for the free tier.

#### Design Principles

- Ads are **never** stored in the articles table or served through the same data path
- Ad items in the feed always carry `type: "advertisement"` — this is enforced at the data model level
- The client renders ads with a distinct background color, border, and "ADVERTISEMENT" label
- Paid tier users never receive any ad data in their feed responses

#### Impression Flow

```
Feed request (free tier)
       │
       ▼
  Select ad placement
  (topic targeting + frequency cap check in Redis)
       │
       ▼
  Include ad in feed response
       │
       ▼
  Client renders ad (with clear labeling)
       │
       ▼
  Client reports impression → NATS "ads.impression"
       │
       ▼
  Impression consumer writes to ads.impressions table (async)
       │
       ▼
  Budget tracker updates campaign spend (Redis counter)
```

---

### 6. API Gateway (TypeScript / Node.js / Fastify + Apollo Server)

The API gateway is the single entry point for all client requests. It handles authentication, rate limiting, and routes requests to the appropriate service.

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
```

REST endpoints handle:
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` — authentication
- `POST /webhooks/ad-partner` — ad partner callbacks
- `GET /health` — health checks
- `GET /admin/*` — admin dashboard API (protected)

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
    is_paywall      BOOLEAN DEFAULT FALSE,
    content_type    TEXT DEFAULT 'editorial', -- 'editorial', 'mixed'
    crawl_config    JSONB DEFAULT '{}',
    robots_txt      TEXT,
    robots_fetched  TIMESTAMPTZ,
    reliability     REAL DEFAULT 1.0,
    block_rate      REAL DEFAULT 0.0,        -- aggregate block rate across users
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
    image_stored    TEXT,                    -- R2 object key
    is_paywall      BOOLEAN DEFAULT FALSE,
    topics          TEXT[],
    embedding       vector(384),
    metadata        JSONB DEFAULT '{}',
    refresh_tier    TEXT DEFAULT 'fresh',
    next_refresh_at TIMESTAMPTZ,
    status          TEXT DEFAULT 'active'    -- 'active', 'archived', 'removed'
) PARTITION BY RANGE (published_at);

-- Monthly partitions created automatically
-- Index for feed queries
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

CREATE TABLE users.accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    tier            TEXT DEFAULT 'free',      -- 'free', 'paid'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users.blocked_sources (
    user_id         UUID NOT NULL REFERENCES users.accounts(id),
    source_id       UUID NOT NULL REFERENCES content.sources(id),
    reason          TEXT NOT NULL,
    reason_detail   TEXT,
    blocked_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, source_id)
);

CREATE TABLE users.paywall_subscriptions (
    user_id         UUID NOT NULL REFERENCES users.accounts(id),
    source_id       UUID NOT NULL REFERENCES content.sources(id),
    declared_at     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, source_id)
);

CREATE TABLE users.topic_interests (
    user_id         UUID NOT NULL REFERENCES users.accounts(id),
    topic           TEXT NOT NULL,
    weight          REAL DEFAULT 1.0,
    PRIMARY KEY (user_id, topic)
);

CREATE TABLE users.preferences (
    user_id         UUID PRIMARY KEY REFERENCES users.accounts(id),
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

-- Clean up entries older than 30 days via scheduled job
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

## Caching Strategy

### Cache Layers

```
Client (in-memory)
    │
    ▼
Cloudflare CDN (static assets, images)
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
| `feed:{userId}:c:{cursor}` | Serialized feed page | 5 min | On new article matching user prefs; on pref change |
| `article:{id}` | Article metadata JSON | 1 hour | On re-fetch with changed content_hash |
| `source:{id}` | Source metadata JSON | 24 hours | On admin update |
| `user:{id}:prefs` | User preferences + blocked sources | 1 hour | On preference mutation |
| `user:{id}:paywalls` | Paywall subscription list | 1 hour | On paywall mutation |
| `ratelimit:crawl:{sourceId}` | Token bucket counter | N/A | Self-expiring |
| `adcap:{userId}:{campaignId}` | Impression counter | 24 hours | Self-expiring |

### Cache Invalidation Flow

```
Go crawler writes article to Postgres
       │
       ▼
Publishes "article.created" to NATS
       │
       ▼
TS cache invalidation consumer receives event
       │
       ▼
Determine affected users (those not blocking this source
and following relevant topics)
       │
       ▼
Delete feed cache keys: DEL feed:{userId}:*
```

At small scale (< 100K users), this fan-out is feasible. At larger scale, switch to short TTL expiry (5 min) without explicit per-user invalidation — the cache naturally refreshes fast enough.

---

## Scalability Phases

### Phase 1: Launch (0 - 10K users)

```
Fly.io:
  API Server × 2 (TypeScript)
  Ingestion Worker × 1 (Go)
  Discovery Worker × 1 (Python)
  NATS × 1

Neon: Starter plan (1 Postgres instance)
Upstash: Free tier Redis
R2: Pay-as-you-go
```

- Direct database queries for feed generation (no Redis cache needed yet)
- Single Go worker handles all crawling
- Embedding computation runs inline in the discovery worker
- Estimated monthly cost: $50-150

### Phase 2: Growth (10K - 100K users)

- Enable Redis feed caching
- Add PostgreSQL table partitioning on articles
- Add Postgres read replica for feed queries (Neon supports this natively)
- Scale ingestion workers to 2-3
- Add Typesense for full-text article search if Postgres FTS is insufficient
- Scale API servers to 4
- Estimated monthly cost: $300-800

### Phase 3: Scale (100K - 1M users)

- Shard read state table by user_id hash
- Evaluate dedicated vector store (Qdrant) if pgvector queries degrade
- Consider CQRS: write articles to Postgres, project to a read-optimized store for feed generation
- Scale API servers to 8-12
- Multiple NATS nodes in cluster mode
- Move to managed Kubernetes or dedicated cloud infrastructure
- Estimated monthly cost: $2,000-8,000

---

## Security Considerations

- All API communication over HTTPS (enforced at Cloudflare)
- JWT tokens for authentication, short-lived access tokens (15 min) + longer refresh tokens (7 days)
- Password hashing via Argon2id
- Rate limiting at the API gateway (per-IP and per-user)
- Input validation on all GraphQL mutations (Zod schemas)
- SQL parameterization via Drizzle ORM (no raw string interpolation)
- CORS restricted to known client origins
- Content Security Policy headers on web responses
- No PII stored beyond email and hashed password
- Block reasons are aggregated anonymously — individual user blocks are not exposed to source publishers

---

## Monitoring and Observability

| Signal | Tool | Key Metrics |
|--------|------|-------------|
| Errors | Sentry | Error rate, error classification, stack traces |
| Metrics | Grafana Cloud | Feed latency p50/p95/p99, crawl success rate, cache hit rate, active users |
| Logs | Grafana Loki | Structured JSON logs from all services |
| Uptime | Better Stack | API endpoint availability, latency from multiple regions |
| Alerts | Grafana Alerting | Feed latency > 500ms, crawl failure rate > 10%, error spike |

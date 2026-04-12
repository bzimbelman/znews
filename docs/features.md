# znews - Features

## Design Principles

Before listing features, these principles govern every decision:

1. **The feed serves the reader, not the advertiser.** Every feature is evaluated against this.
2. **Advertising is honest.** It is never disguised, always labeled, always visually distinct.
3. **No tracking.** znews does not track user behavior for advertising purposes, does not build advertising profiles, does not sell or share user data, and does not use third-party tracking pixels, cookies, or fingerprinting. User preferences (blocked sources, topic interests) are stored solely to deliver the feed the user asked for.
4. **The feed is finite.** It has a beginning and an end. No infinite scroll. No content recycling. No dark patterns.
5. **Users are in control.** If a user does not want to see something, they can remove it. If they want to add something, they can add it. Their choices are respected immediately.

---

## Core Features (Both Free and Paid Tiers)

### Chronological Feed

The feed presents articles in reverse chronological order — newest first. Users scroll through content that is ordered by time, not by an opaque engagement algorithm. When they reach content they have already had the opportunity to see, a clear "You're all caught up" marker tells them so. When they reach the end of available content, the feed says so and stops.

There is no infinite scroll. There is no recycling of content that was already shown. The feed respects the user's time.

### Source Blocking

Users can block any content provider from their feed. Blocking is immediate — blocked sources disappear from the feed on the next load. Users can optionally provide a reason for blocking:

- **Misinformation** — source publishes false or misleading content
- **Clickbait** — source uses sensational or misleading headlines
- **Political bias** — source exhibits strong political bias
- **Low quality** — source has poor writing, excessive ads, or thin content
- **Irrelevant** — source covers topics the user does not care about
- **Other** — free-text reason

Block reasons are aggregated anonymously across all users to build content quality signals. Sources with high block rates for misinformation are flagged for review and deprioritized in discovery. Individual user blocks are never shared with publishers or other users.

### Paywall Management

Users declare which paid publications they subscribe to (e.g., "I have a New York Times subscription"). The feed uses this to:

- **Hide mode (default):** Content from paywalled sources the user does not subscribe to is excluded from the feed entirely. No more clicking a headline only to hit a paywall.
- **Show flagged mode:** All content appears, but paywalled articles from unsubscribed sources are clearly marked with a paywall indicator. Users who sometimes want to use their limited free article views can choose this mode.

Users can switch between modes at any time. Adding or removing a paywall subscription takes effect on the next feed load.

### Source Navigation

Every article in the feed links directly to the original source. znews does not trap users inside the app — it takes them to the journalism. Users can tap through to the original article on the publisher's site.

Note: znews does not currently provide protection from tracking by the sites you visit. When you navigate to a publisher's site, that site's own tracking and cookies apply. Article previews (see below) can reduce the need to visit external sites.

### Topic Interests

Users can follow topics (technology, politics, science, sports, etc.) to tune their feed toward subjects they care about. Topics can be weighted — boost topics you want more of, suppress topics you want less of. Unfollowing a topic does not block it entirely; it reduces its presence in the feed.

### Read State Tracking

The feed tracks which articles a user has seen. Seen articles are visually dimmed or collapsed (user preference). The feed never presents already-seen content as if it were new. Read state is stored per-user and cleaned up after 30 days.

### Push Notifications

Users can opt into push notifications for:
- Breaking news across all followed topics
- Breaking news from specific sources
- Daily digest summary (configurable time)

Notifications are delivered via platform-native push (APNs for iOS, FCM for Android). Users control notification preferences granularly — per topic, per source, or globally.

### Home Screen and Lock Screen Widgets

**iOS:**
- Home screen widgets (small, medium, large) showing latest headlines from the user's feed
- Lock screen widget with top story
- StandBy mode widget for ambient news display
- Widgets update via push-triggered WidgetKit reloads for near-real-time freshness

**Android:**
- Home screen widgets matching iOS sizes
- Lock screen widget
- Background refresh via WorkManager

Widgets reflect the user's full feed preferences — blocked sources are excluded, paywall filtering is applied.

### Feed Density Options

Three display density modes:
- **Compact** — headline + source name only, maximum articles per screen
- **Normal** — headline + source + summary snippet + thumbnail
- **Expanded** — headline + source + full summary + large image

### Dark Mode

Full dark mode support across all platforms. Follows system preference or manual toggle.

### Privacy — No Tracking

znews collects the minimum data necessary to deliver a personalized feed:
- Email address (for account)
- Feed preferences (blocked sources, topic interests, paywall subscriptions)
- Read state (which articles were seen, cleaned up after 30 days)

znews does **not**:
- Track browsing behavior outside the app
- Build advertising profiles
- Use third-party analytics SDKs that track users
- Deploy tracking pixels, fingerprinting, or cross-site cookies
- Share or sell any user data to third parties
- Track which external articles users click through to

Ad targeting in the free tier is based solely on the topics of surrounding articles in the feed — contextual targeting only, not behavioral targeting. This means the ad system knows "this part of the feed is about technology" but never knows "this user visited a car dealership website last Tuesday."

---

## Free Tier Features

Everything in Core Features, plus:

### Clearly Labeled Advertising

The free tier includes advertising content to support the platform. All advertising is:
- Visually distinct from editorial content (different background color, border, and layout)
- Labeled with a prominent "ADVERTISEMENT" tag that is never ambiguous
- Placed at a fixed ratio of approximately 1 ad per 8-12 articles
- Contextually targeted based on surrounding article topics (not user tracking)
- Never disguised as editorial content, never styled to look like an article

Users always know what is an ad and what is news. This is the fundamental promise of the free tier.

### Basic Article Preview

Free tier users can see a basic preview of articles without leaving the app:
- Article title and summary (pulled from RSS/article metadata)
- Source attribution and publish date
- First paragraph when available
- Thumbnail image

This reduces the need to navigate to external sites (and their tracking) for quick scanning, while still linking to the full article when the user wants the complete content.

---

## Paid Tier Exclusive Features

### Zero Advertising

The paid tier contains no advertising of any kind. No ads in the feed, no sponsored content, no promotional placements. The feed is purely editorial content from the user's configured sources and topics.

### Enhanced Article Preview

Paid users get a richer in-app article preview:
- Full article summary (AI-generated when RSS summary is insufficient)
- Key quotes and highlights extracted from the article
- Related articles from other sources covering the same story
- Reading time estimate
- Preview images at full resolution

The enhanced preview is designed to let users get the substance of most articles without navigating to external sites. This provides a meaningful privacy benefit — fewer site visits means less exposure to third-party tracking. When users want the full article, the direct link is always available.

### AI-Powered Source Discovery

The discovery service recommends new content sources based on the user's existing preferences:
- "Sources similar to ones you read" — vector similarity matching across source embeddings
- "Sources covering topics you follow" — topic-matched recommendations from sources the user has not encountered
- "Highly rated sources" — sources with low block rates and high engagement from users with similar interests
- Users can preview a recommended source's recent articles before deciding to add it

### AI-Powered Content Recommendations

A dedicated "Discover" section (separate from the main chronological feed) surfaces individual articles the user might find interesting:
- Based on reading history and topic interests
- Boosted for source diversity (articles from sources the user does not normally see)
- Clearly separated from the main feed to avoid polluting the chronological experience

### Advanced Feed Organization

Paid users can organize their feed into custom sections:
- **Pinned topics** — create named sections (e.g., "Tech," "Local," "Science") that appear as tabs or a sidebar
- **Priority sources** — mark specific sources as priority; their content appears in a dedicated section at the top of the feed
- **Custom sections** — group sources and topics into named collections with independent chronological feeds

### Breaking News Live Activities

Real-time breaking news surfaces via platform-specific live notification surfaces:
- **iOS:** Dynamic Island integration and lock screen Live Activities for developing stories
- **Android:** Persistent lock screen notifications for breaking stories

Live activities update as the story develops, showing the latest headline and source count. They expire automatically when the story leaves the breaking tier.

### Feed Export

Paid users can save and share curated article lists:
- Save articles to named collections
- Export collections as shareable links
- Export reading history as structured data (CSV/JSON)

### Priority Content Refresh

Sources that paid users follow are crawled at a higher frequency. If a paid user follows a niche source that would normally be refreshed every 6 hours, the system escalates it to hourly refresh. This ensures paid users get fresher content from the sources they care about most.

### Reading Analytics

A personal dashboard showing:
- Reading patterns (time of day, topics, sources)
- Source diversity metrics ("you read from N different sources this week")
- Topic distribution over time
- No data leaves the user's account — this is personal insight, not tracked behavior

### Advanced Blocking Rules

Beyond blocking individual sources, paid users can create keyword-based filters:
- Block articles containing specific keywords in the title or summary
- Block articles matching regex patterns
- Block articles from specific authors
- Temporary mute (block for 24h, 1 week, or 1 month — useful for avoiding spoilers or overexposed stories)

---

## Future / Roadmap Features

These features are planned but not part of the initial release. They apply to both tiers unless noted.

### Multi-Perspective Story Grouping
Automatically group articles from different sources covering the same story. Show users how a story is being reported across their sources, including which sources are covering it and which are not.

### Content Quality Scoring
Community-driven quality signals combined with AI analysis. Articles and sources receive quality indicators based on factual accuracy, source reliability, and aggregate user feedback (block reasons, engagement patterns).

### Newsletter Integration
Import email newsletters directly into the znews feed. Users forward newsletters to a znews-provided email address, and the content appears in their feed alongside regular articles, subject to the same blocking and filtering rules.

### Podcast Clip Integration
Surface relevant podcast clips alongside related articles. When a podcast discusses a news story, the relevant clip appears in the feed near articles about the same topic.

### Collaborative Feeds (Paid)
Shared feeds for teams, families, or interest groups. Members contribute sources and topics to a shared feed. Useful for newsrooms, research teams, or families who want a shared news experience.

### API Access (Paid)
REST/GraphQL API for developers to build on top of znews. Access your feed programmatically, integrate with other tools, build custom dashboards.

### Multi-Language Support
Support for non-English sources and UI. Topic taxonomy and discovery in multiple languages. Translation of article summaries.

### Offline Reading
Download articles for offline reading (both tiers). Paid tier gets offline support for enhanced previews. Sync read state when back online.

---

## Feature Tier Summary

| Feature | Free | Paid |
|---------|------|------|
| Chronological feed | Yes | Yes |
| "Caught up" marker | Yes | Yes |
| Source blocking with reasons | Yes | Yes |
| Paywall management | Yes | Yes |
| Source navigation | Yes | Yes |
| Topic interests | Yes | Yes |
| Read state tracking | Yes | Yes |
| Push notifications | Yes | Yes |
| Home screen / lock screen widgets | Yes | Yes |
| Feed density options | Yes | Yes |
| Dark mode | Yes | Yes |
| No user tracking | Yes | Yes |
| Basic article preview | Yes | Yes |
| Clearly labeled advertising | Yes | — |
| **Zero advertising** | — | Yes |
| **Enhanced article preview (AI)** | — | Yes |
| **AI source discovery** | — | Yes |
| **AI content recommendations** | — | Yes |
| **Advanced feed organization** | — | Yes |
| **Breaking news Live Activities** | — | Yes |
| **Feed export** | — | Yes |
| **Priority content refresh** | — | Yes |
| **Reading analytics** | — | Yes |
| **Advanced blocking rules** | — | Yes |

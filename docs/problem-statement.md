# znews - Problem Statement

## The Problem

Modern news feeds from major technology companies — Google, Apple, Samsung, and others — are poorly curated and fail to serve their users effectively. These platforms have optimized for engagement metrics and advertising revenue rather than delivering genuine value to the people who rely on them for information. The result is a degraded news experience that erodes trust, wastes time, and actively works against the user's interests.

### Advertising Disguised as Content

Native advertising has become so deeply integrated into news feeds that users cannot reliably distinguish sponsored content from legitimate journalism. A Stanford University study found that over 80% of students from middle school through college could not differentiate between a legitimate news story and a sponsored advertisement. The Federal Trade Commission requires clear and prominent disclosure when advertising could be mistaken for editorial material, yet the defining characteristic of effective native advertising is its invisibility — it is designed to blend in, not stand out. With native display ad spending in the US expected to reach $147.98 billion in 2026, the incentive to blur these lines will only intensify.

Current news feeds present advertising content with equal or greater prominence than actual news. Users are forced to mentally filter every item in their feed, never confident whether what they are reading is journalism or a paid placement.

### Paywall Friction

News feeds routinely surface content from publications that sit behind paywalls the user does not subscribe to. The experience is jarring: a compelling headline leads to a blocked article, wasting the user's time and attention. Users have no meaningful way to tell their feed which paid publications they have access to, resulting in a feed cluttered with inaccessible content. This creates frustration and trains users to distrust what their feed surfaces.

### Misinformation and Low-Quality Content

Fake news, clickbait, and low-quality content receive equal or better promotion than accurate, well-sourced journalism. Algorithmic recommendation systems optimize for clicks and engagement rather than accuracy or trustworthiness. The platforms that deliver these feeds have little financial incentive to deprioritize sensational content — it drives the engagement metrics that sustain their advertising business.

### Doom Scrolling by Design

Infinite scrolling is a deliberate design choice that removes natural stopping points, exploiting psychological reward mechanisms to keep users engaged far longer than they intend. Research published in 2025 identifies this as a public health challenge, linking prolonged scrolling to anxiety, depression, degraded social interaction, and existential dread. News feeds recycle the same content repeatedly, creating the illusion of an endless stream while delivering diminishing returns. Users report spending significant time scrolling through content they have already seen, with no clear indication of where new content ends and recycled content begins.

### Lack of User Control

Users have minimal ability to shape their news experience. They cannot effectively block specific content providers, manage which paywalled sources appear, or organize their feed to prioritize freshness. The algorithms that determine what appears are opaque and serve the platform's interests, not the user's. When users express preferences — following topics, dismissing stories — the platforms treat these signals as data points for their advertising models rather than genuine personalization inputs.

---

## The Solution: znews

znews is a news aggregation tool designed to return control to the user and deliver a higher-quality content experience. It operates on a simple principle: the feed should serve the reader, not the advertiser.

### Two-Tier Model

**Free Tier — Honest Advertising**
The free tier includes advertising content but treats users with respect. All advertising is clearly and prominently labeled as such — visually distinct from editorial content with no ambiguity. Users always know what is an ad and what is news. The advertising supports the platform's operation while maintaining trust.

**Paid Tier — No Advertising**
The paid tier removes all advertising content entirely. Users receive a clean feed of the news sources and topics they care about, with no sponsored content of any kind.

### Paywall Management

In both tiers, users can declare which paid publications they subscribe to. Content from those publications appears normally in the feed. Content from paywalled sources the user does not subscribe to is either hidden or clearly marked, according to user preference. Users can add or remove paywall subscriptions at any time, and the feed adjusts immediately.

### Source Blocking and Personalization

Users can block any content provider from their feed. Blocking is straightforward — if a user does not trust a source, does not want to see its content, or finds it irrelevant, they remove it. Users can provide reasons for blocking (misinformation, clickbait, political bias, irrelevance, etc.), which helps znews improve its content quality signals over time. Users can also identify and add new sources they want included in their feed, allowing them to discover content from outlets they trust but might not have encountered otherwise.

### Anti-Doom-Scroll Design

znews presents content chronologically with clear boundaries. Users see the newest content first and can scroll to older content in a defined, finite list. When they reach the end of unread content, the feed tells them so — clearly and honestly. There is no infinite scroll. There is no recycling of already-seen content. The feed respects the user's time and provides natural stopping points.

### Source Navigation

When users identify a news source of interest, the feed provides direct navigation to that source. Users can follow links to the original publisher, encouraging direct engagement with journalism rather than keeping users trapped within the aggregator.

---

## Competitive Landscape

### Major Incumbents

**Google News / Google Discover**
The dominant player, pre-installed on Android devices and deeply integrated into Google's ecosystem. Google acknowledged problems with its Discover feed in early 2026, implementing changes to prioritize locally relevant content and reduce sensational material. However, Google's core business model depends on advertising, creating a structural conflict of interest between serving users and serving advertisers. Google Discover's algorithmic curation has been criticized for surfacing clickbait, recycling content, and prioritizing engagement over quality.

**Apple News**
Available on iOS and macOS, Apple News combines a free ad-supported tier with Apple News+ ($12.99/month), which bundles access to hundreds of magazines and newspapers. Apple positions itself as privacy-focused, but the free tier still mixes advertising with editorial content. The platform is limited to Apple's ecosystem and has faced criticism from publishers over revenue sharing terms. Apple's curation leans heavily on editorial picks, which improves quality but limits personalization.

**Samsung Free (formerly Samsung Daily)**
Pre-installed on Samsung devices, Samsung Free aggregates news alongside other content. It is heavily ad-supported and has been widely criticized for low-quality content, clickbait, and aggressive advertising integration. It represents the worst of the current landscape — prioritizing engagement metrics over user value.

**Flipboard**
A visually polished, magazine-style aggregator that is free and available across platforms. Flipboard allows users to create topic-based "magazines" and follow interests. However, users report increasing ad volume that makes reading difficult, content recommendation algorithms that surface irrelevant material, political bias in editorial curation, paywall friction when articles link to external subscription sites, and app stability issues. Flipboard's ad-supported model creates the same structural tension between user experience and revenue.

**SmartNews**
Claims to use machine learning to surface quality content. SmartNews has invested in self-serve advertising solutions and location-based targeting, indicating a deepening commitment to advertising revenue. While it offers local news and multiple perspectives, the advertising integration follows the same problematic patterns as other incumbents.

### Newer Entrants and Niche Players

**Ground News**
Differentiates through media bias analysis, showing users how stories are covered across the political spectrum and which outlets are reporting (or not reporting) each story. Offers a free tier with limited features and paid plans ($4.99-$14.99/month). Ground News addresses the bias problem but does not solve advertising transparency, paywall management, or doom scrolling.

**Particle**
Built by former Twitter engineers, Particle uses AI to provide multi-perspective summaries of stories, showing how coverage varies across "red" and "blue" leaning outlets. Offers a free tier and Particle+ ($2.99/month) with premium features including AI-powered summaries and podcast clip integration. Particle focuses on AI summarization and perspective diversity but does not address source blocking, paywall management, or anti-doom-scroll design.

**Feedly / Inoreader**
RSS-based readers that give users explicit control over their sources. Feedly offers AI-powered features for professionals (plans from $6-$18/month). These tools appeal to power users but require significant setup effort and lack the mainstream accessibility needed for broad adoption. They are content management tools more than curated news experiences.

**Readless**
Transforms newsletters and RSS feeds into condensed AI-powered digests, claiming to save 30+ hours monthly. Focused on efficiency and information density rather than the broader feed experience.

**Syft AI**
Offers custom topic channels, multilingual summaries, and source filtering. Delivers a curated set of top stories daily rather than an ongoing feed. An emerging player without significant market adoption.

**FeedWave**
Positions itself as a privacy-first AI RSS reader with no ads and no tracking. Focuses on article summarization and reader mode. Lacks mainstream visibility.

**Artifact (Defunct)**
Built by Instagram co-founders, Artifact used AI for personalized news recommendations and was well-regarded for content quality. It shut down in early 2024, citing an insufficient market opportunity. Its closure highlights the difficulty of building a sustainable news aggregator business, but also the gap that remains unfilled.

### Competitive Gaps That znews Addresses

| Capability | Google News | Apple News | Flipboard | Ground News | Particle | Feedly | **znews** |
|---|---|---|---|---|---|---|---|
| Clear ad labeling | Poor | Moderate | Poor | Good | Moderate | N/A | **Explicit** |
| Ad-free paid tier | No | Partial | No | Limited | Yes | Yes | **Yes** |
| Paywall management | No | Bundled only | No | No | No | No | **Yes** |
| Source blocking | Limited | Limited | Limited | No | No | Yes | **Yes** |
| Anti-doom-scroll | No | No | No | No | No | N/A | **Yes** |
| Finite, chronological feed | No | No | No | No | No | Yes | **Yes** |
| Source discovery | Algorithmic | Editorial | Topic-based | Bias-based | AI-based | Manual | **User-driven** |
| Block reasons/feedback | No | No | No | No | No | No | **Yes** |

---

## Key Differentiators

1. **Advertising Honesty** — In the free tier, advertising is never disguised. It is always visually distinct and clearly labeled. This is a trust-first approach that no major incumbent commits to.

2. **Paywall Awareness** — No other aggregator lets users declare their subscriptions and filter the feed accordingly. znews eliminates the frustration of clicking through to blocked content.

3. **Meaningful Personalization Through Blocking** — Users can remove any source for any reason. The blocking mechanism is a first-class feature, not an afterthought. Blocking reasons create a feedback loop that improves content quality for all users over time.

4. **Anti-Doom-Scroll Architecture** — A finite, chronological feed with clear "you're caught up" boundaries. No infinite scroll, no content recycling, no dark patterns designed to maximize time-on-app.

5. **Source Transparency and Navigation** — Direct links to original sources with no friction. znews succeeds when users find and engage with quality journalism, not when they stay inside the app longer.

6. **Two-Tier Sustainability** — The free tier sustains the platform through honest advertising. The paid tier offers a premium, ad-free experience. Both tiers deliver the same content quality and user control — the only difference is the presence of (clearly labeled) ads.

---

## Market Opportunity

The global news aggregator market was valued at approximately $13.5-15 billion in 2024-2025 and is projected to grow at a CAGR of 9-12%, reaching $30-45 billion by 2033. Over 70% of users prefer personalized news feeds, yet existing solutions consistently prioritize advertiser interests over user satisfaction.

The closure of Artifact in 2024 — despite strong user sentiment — suggests that the challenge is not building a better product but building a sustainable business model. znews addresses this directly with its two-tier approach: the free tier generates advertising revenue (with advertising that is honest, not deceptive), while the paid tier provides a premium revenue stream from users willing to pay for a clean experience.

The growing public awareness of doom scrolling's mental health impacts, increasing regulatory attention to native advertising disclosure (including New York's AI disclosure law taking effect June 2026), and persistent user dissatisfaction with incumbent news feeds create a favorable environment for a product that puts the user first.

---

## Summary

The news feed is broken. The platforms that deliver it have structural incentives to keep it broken. znews exists to build something better — a feed that respects its users, labels advertising honestly, manages paywall complexity, gives users real control over their sources, and stops when there is nothing new to show. The goal is not to maximize engagement. The goal is to deliver accurate, relevant, trustworthy news to people who want it.

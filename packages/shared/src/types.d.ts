export interface Article {
    id: string;
    title: string;
    content: string;
    url: string;
    publishedAt: Date;
    author?: string;
    source: string;
    sourceUrl: string;
    tags: string[];
    language: string;
    wordCount: number;
    imageUrl?: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Source {
    id: string;
    name: string;
    url: string;
    rssUrl?: string;
    category: string;
    language: string;
    isActive: boolean;
    lastCrawledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface User {
    id: string;
    email: string;
    preferences: UserPreferences;
    blockedSources: string[];
    subscription?: Subscription;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserPreferences {
    topics: string[];
    keywords: string[];
    language: string;
    maxArticlesPerFeed: number;
    adPreferences: AdPreferences;
}
export interface Subscription {
    id: string;
    userId: string;
    plan: "free" | "premium";
    validUntil: Date;
    autoRenew: boolean;
}
export interface AdPreferences {
    personalizedAds: boolean;
    categories: string[];
    frequency: "low" | "medium" | "high";
}
export interface FeedItem {
    article: Article;
    relevanceScore: number;
    isBlocked: boolean;
    hasPaywall: boolean;
    adPosition?: number;
}
export interface Feed {
    id: string;
    userId: string;
    items: FeedItem[];
    cursor: string;
    hasMore: boolean;
    lastUpdated: Date;
}
export interface CrawlJob {
    id: string;
    sourceId: string;
    status: "pending" | "running" | "completed" | "failed";
    articles: Article[];
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
}
export interface Embedding {
    id: string;
    articleId: string;
    vector: number[];
    model: string;
    createdAt: Date;
}
//# sourceMappingURL=types.d.ts.map
"use strict";
// Test utilities and helpers
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDatabaseHelper = void 0;
class TestDatabaseHelper {
    constructor() {
        Object.defineProperty(this, "articles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "sources", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "users", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    async reset() {
        this.articles = [];
        this.sources = [];
        this.users = [];
    }
    async createArticle(article) {
        const newArticle = {
            id: article.id || `article-${Date.now()}`,
            title: article.title || "Test Article",
            content: article.content || "Test content",
            url: article.url || "https://example.com/article",
            publishedAt: article.publishedAt || new Date(),
            author: article.author,
            source: article.source || "test-source",
            sourceUrl: article.sourceUrl || "https://example.com",
            tags: article.tags || [],
            language: article.language || "en",
            wordCount: article.wordCount || 100,
            imageUrl: article.imageUrl,
            category: article.category || "general",
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.articles.push(newArticle);
        return newArticle;
    }
    async createSource(source) {
        const newSource = {
            id: source.id || `source-${Date.now()}`,
            name: source.name || "Test Source",
            url: source.url || "https://example.com",
            rssUrl: source.rssUrl,
            category: source.category || "news",
            language: source.language || "en",
            isActive: source.isActive ?? true,
            lastCrawledAt: source.lastCrawledAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.sources.push(newSource);
        return newSource;
    }
    async createUser(user) {
        const newUser = {
            id: user.id || `user-${Date.now()}`,
            email: user.email || "test@example.com",
            preferences: user.preferences || {
                topics: [],
                keywords: [],
                language: "en",
                maxArticlesPerFeed: 50,
                adPreferences: {
                    personalizedAds: true,
                    categories: [],
                    frequency: "medium",
                },
            },
            blockedSources: user.blockedSources || [],
            subscription: user.subscription,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.push(newUser);
        return newUser;
    }
    async findArticle(id) {
        return this.articles.find((article) => article.id === id) || null;
    }
    async findSource(id) {
        return this.sources.find((source) => source.id === id) || null;
    }
    async findUser(id) {
        return this.users.find((user) => user.id === id) || null;
    }
}
exports.TestDatabaseHelper = TestDatabaseHelper;
//# sourceMappingURL=database.js.map
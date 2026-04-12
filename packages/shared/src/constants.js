"use strict";
// Test constants and fixtures
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_ERRORS = exports.TEST_ENDPOINTS = exports.TEST_CONFIG = void 0;
exports.TEST_CONFIG = {
    database: {
        url: process.env.TEST_DATABASE_URL || "postgresql://localhost:5432/znews_test",
        redisUrl: process.env.TEST_REDIS_URL || "redis://localhost:6379",
        rabbitmqUrl: process.env.TEST_RABBITMQ_URL || "amqp://localhost:5672",
    },
    api: {
        baseUrl: "http://localhost:3000",
        timeout: 10000,
    },
    mockData: {
        article: {
            title: "Breaking: Major Discovery in AI Research",
            content: "Scientists have made a groundbreaking discovery in artificial intelligence research...",
            url: "https://example.com/breaking-ai-discovery",
            source: "tech-news",
            category: "technology",
            tags: ["AI", "research", "breakthrough"],
            wordCount: 500,
        },
        source: {
            name: "Tech News Daily",
            url: "https://technewsdaily.com",
            category: "technology",
            language: "en",
        },
        user: {
            email: "test@example.com",
            preferences: {
                topics: ["technology", "science"],
                keywords: ["AI", "machine learning"],
                language: "en",
                maxArticlesPerFeed: 25,
                adPreferences: {
                    personalizedAds: true,
                    categories: ["technology"],
                    frequency: "medium",
                },
            },
        },
    },
};
exports.TEST_ENDPOINTS = {
    articles: "/api/articles",
    sources: "/api/sources",
    users: "/api/users",
    feeds: "/api/feeds",
    auth: "/api/auth",
};
exports.TEST_ERRORS = {
    invalidInput: {
        statusCode: 400,
        message: "Invalid input data",
    },
    notFound: {
        statusCode: 404,
        message: "Resource not found",
    },
    unauthorized: {
        statusCode: 401,
        message: "Unauthorized access",
    },
    forbidden: {
        statusCode: 403,
        message: "Access forbidden",
    },
};
//# sourceMappingURL=constants.js.map
// Test utilities and helpers

import { Article, Source, User } from "@znews/shared";

export class TestDatabaseHelper {
  private articles: Article[] = [];
  private sources: Source[] = [];
  private users: User[] = [];

  async reset() {
    this.articles = [];
    this.sources = [];
    this.users = [];
  }

  async createArticle(article: Partial<Article>): Promise<Article> {
    const newArticle: Article = {
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

  async createSource(source: Partial<Source>): Promise<Source> {
    const newSource: Source = {
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

  async createUser(user: Partial<User>): Promise<User> {
    const newUser: User = {
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

  async findArticle(id: string): Promise<Article | null> {
    return this.articles.find((article) => article.id === id) || null;
  }

  async findSource(id: string): Promise<Source | null> {
    return this.sources.find((source) => source.id === id) || null;
  }

  async findUser(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null;
  }
}

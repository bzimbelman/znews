import { Test, TestingModule } from "@nestjs/testing";
import { FeedService } from "./feed/feed.service";

describe("FeedService", () => {
  let service: FeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedService],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a feed", async () => {
    const userId = "user-123";
    const articles = [
      {
        id: "article-1",
        title: "Test Article 1",
        content: "Test content 1",
        url: "https://example.com/1",
        publishedAt: new Date(),
        source: "test-source",
        sourceUrl: "https://example.com",
        tags: [],
        language: "en",
        wordCount: 100,
        category: "general",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "article-2",
        title: "Test Article 2",
        content: "Test content 2",
        url: "https://example.com/2",
        publishedAt: new Date(),
        source: "test-source",
        sourceUrl: "https://example.com",
        tags: [],
        language: "en",
        wordCount: 100,
        category: "general",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const feed = await service.createFeed(userId, articles);

    expect(feed).toBeDefined();
    expect(feed.userId).toBe(userId);
    expect(feed.items).toHaveLength(2);
    expect(feed.hasMore).toBe(false);
  });
});

// Test fixtures for sample news sources and articles

import { Article, Source, User } from "@znews/shared";

export const sampleSources: Source[] = [
  {
    id: "techcrunch",
    name: "TechCrunch",
    url: "https://techcrunch.com",
    rssUrl: "https://techcrunch.com/feed/",
    category: "technology",
    language: "en",
    isActive: true,
    lastCrawledAt: new Date("2024-01-15T10:30:00Z"),
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-15T10:30:00Z"),
  },
  {
    id: "reuters",
    name: "Reuters",
    url: "https://www.reuters.com",
    rssUrl: "https://www.reuters.com/rss/",
    category: "business",
    language: "en",
    isActive: true,
    lastCrawledAt: new Date("2024-01-15T09:45:00Z"),
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-15T09:45:00Z"),
  },
  {
    id: "bbc-sport",
    name: "BBC Sport",
    url: "https://www.bbc.com/sport",
    rssUrl: "https://feeds.bbci.co.uk/sport/rss.xml",
    category: "sports",
    language: "en",
    isActive: true,
    lastCrawledAt: new Date("2024-01-15T11:15:00Z"),
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-15T11:15:00Z"),
  },
  {
    id: "nytimes",
    name: "The New York Times",
    url: "https://www.nytimes.com",
    rssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    category: "general",
    language: "en",
    isActive: true,
    lastCrawledAt: new Date("2024-01-15T08:20:00Z"),
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-15T08:20:00Z"),
  },
  {
    id: "wired",
    name: "WIRED",
    url: "https://www.wired.com",
    rssUrl: "https://www.wired.com/feed/rss",
    category: "technology",
    language: "en",
    isActive: true,
    lastCrawledAt: new Date("2024-01-15T14:30:00Z"),
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-15T14:30:00Z"),
  },
];

export const sampleArticles: Article[] = [
  {
    id: "ai-breakthrough-001",
    title: "Breakthrough in Quantum Computing Achieved by Researchers",
    content:
      "Scientists at MIT have announced a major breakthrough in quantum computing, successfully creating a quantum processor with 100 qubits that maintains stability for unprecedented periods. This advancement brings practical quantum computing significantly closer to reality and could revolutionize fields from cryptography to drug discovery. The team, led by Professor Sarah Chen, developed new error correction techniques that allow quantum bits to maintain their quantum state for up to 10 seconds, a tenfold improvement over previous attempts. This stability is crucial for running complex algorithms that would otherwise be impossible on today's quantum computers.",
    url: "https://techcrunch.com/2024/01/15/quantum-breakthrough-mit/",
    publishedAt: new Date("2024-01-15T09:00:00Z"),
    author: "Sarah Johnson",
    source: "techcrunch",
    sourceUrl: "https://techcrunch.com",
    tags: ["quantum computing", "MIT", "breakthrough", "technology"],
    language: "en",
    wordCount: 250,
    imageUrl:
      "https://techcrunch.com/wp-content/uploads/2024/01/quantum-computing.jpg",
    category: "technology",
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z"),
  },
  {
    id: "crypto-regulation-002",
    title:
      "Global Regulators Reach Historic Agreement on Cryptocurrency Framework",
    content:
      "Financial regulators from 30 countries have agreed on a comprehensive framework for cryptocurrency regulation, marking the first global consensus on digital asset oversight. The agreement, reached at the Financial Stability Board meeting in Basel, Switzerland, establishes clear guidelines for crypto exchanges, stablecoins, and decentralized finance platforms. Key provisions include mandatory licensing for crypto service providers, strict capital requirements, and robust anti-money laundering controls. The framework also addresses consumer protection, with provisions for insurance and dispute resolution mechanisms. This move is expected to bring much-needed clarity to the volatile crypto market and could trigger institutional investment as regulatory uncertainty decreases.",
    url: "https://www.reuters.com/markets/cryptocurrencies/global-regulators-crypto-framework-2024-01-15/",
    publishedAt: new Date("2024-01-15T08:30:00Z"),
    author: "Michael Chen",
    source: "reuters",
    sourceUrl: "https://www.reuters.com",
    tags: ["cryptocurrency", "regulation", "financial stability", "global"],
    language: "en",
    wordCount: 320,
    imageUrl: "https://www.reuters.com/assets/2024-01-15/crypto-regulation.jpg",
    category: "business",
    createdAt: new Date("2024-01-15T08:30:00Z"),
    updatedAt: new Date("2024-01-15T08:30:00Z"),
  },
  {
    id: "champions-league-003",
    title:
      "Manchester City Dramatic Champions League Victory Against Bayern Munich",
    content:
      "Manchester City secured a dramatic 3-2 victory over Bayern Munich in the Champions League quarter-final first leg, thanks to a last-minute goal from substitute Jack Grealish. The match was a thrilling encounter that saw both teams exchange leads multiple times. City's Erling Haaland opened the scoring in the 12th minute, but Bayern equalized through Harry Kane just before halftime. The second half was even more dramatic, with Joshua Kimmich putting Bayern ahead in the 68th minute, only for Phil Foden to equalize seven minutes later. Grealish's 89th-minute winner came from a beautiful team build-up that showcased City's attacking prowess. The result gives City a significant advantage heading into the second leg at the Allianz Arena.",
    url: "https://www.bbc.com/sport/football/67982354",
    publishedAt: new Date("2024-01-15T11:00:00Z"),
    author: "James Wilson",
    source: "bbc-sport",
    sourceUrl: "https://www.bbc.com/sport",
    tags: ["football", "champions league", "manchester city", "bayern munich"],
    language: "en",
    wordCount: 280,
    imageUrl:
      "https://ichef.bbci.co.uk/onesport/cps/640/cpsprodpb/12C6E/production/_1234567890_champions-league.jpg",
    category: "sports",
    createdAt: new Date("2024-01-15T11:00:00Z"),
    updatedAt: new Date("2024-01-15T11:00:00Z"),
  },
  {
    id: "ai-ethics-004",
    title:
      "AI Ethics Panel Calls for Stricter Regulations on Facial Recognition Technology",
    content:
      "A bipartisan panel of AI ethics experts has called for immediate stricter regulations on facial recognition technology, citing growing concerns about privacy violations and algorithmic bias. The report, commissioned by the National Academy of Sciences, warns that current facial recognition systems have error rates of up to 34% for darker-skinned individuals and women, leading to potential false arrests and discrimination. The panel recommends a moratorium on government use of facial recognition until bias can be mitigated, mandatory transparency requirements for companies using the technology, and stronger data protection measures. The report also calls for independent oversight of facial recognition deployments and mandatory impact assessments before any government agency can deploy such systems.",
    url: "https://www.nytimes.com/2024/01/15/technology/ai-ethics-facial-recognition-regulation.html",
    publishedAt: new Date("2024-01-15T07:45:00Z"),
    author: "Dr. Emily Rodriguez",
    source: "nytimes",
    sourceUrl: "https://www.nytimes.com",
    tags: ["AI ethics", "facial recognition", "privacy", "regulation"],
    language: "en",
    wordCount: 350,
    imageUrl: "https://www.nytimes.com/2024/01/15/technology/ai-ethics.jpg",
    category: "technology",
    createdAt: new Date("2024-01-15T07:45:00Z"),
    updatedAt: new Date("2024-01-15T07:45:00Z"),
  },
  {
    id: "metaverse-005",
    title:
      "Major Tech Companies Form Alliance to Create Open Metaverse Standards",
    content:
      "A coalition of major technology companies including Meta, Microsoft, Apple, and Google has announced the formation of the Metaverse Standards Organization, aimed at creating interoperable standards for the emerging metaverse. The organization will work on establishing technical specifications for virtual worlds, ensuring that users can move seamlessly between different platforms and retain their digital assets. This move is seen as a response to concerns about fragmented metaverse experiences and corporate silos. The alliance will also focus on addressing privacy, security, and accessibility concerns as the metaverse develops. Industry analysts believe this collaboration could accelerate the adoption of metaverse technologies and prevent the dominance of any single platform.",
    url: "https://www.wired.com/story/metaverse-standards-organization-tech-companies/",
    publishedAt: new Date("2024-01-15T13:30:00Z"),
    author: "Alex Thompson",
    source: "wired",
    sourceUrl: "https://www.wired.com",
    tags: ["metaverse", "standards", "interoperability", "technology"],
    language: "en",
    wordCount: 290,
    imageUrl:
      "https://www.wired.com/wp-content/uploads/2024/01/metaverse-standards.jpg",
    category: "technology",
    createdAt: new Date("2024-01-15T13:30:00Z"),
    updatedAt: new Date("2024-01-15T13:30:00Z"),
  },
];

export const sampleUsers: User[] = [
  {
    id: "user-001",
    email: "alice.johnson@example.com",
    preferences: {
      topics: ["technology", "business", "science"],
      keywords: ["AI", "machine learning", "cryptocurrency", "innovation"],
      language: "en",
      maxArticlesPerFeed: 25,
      adPreferences: {
        personalizedAds: true,
        categories: ["technology", "business"],
        frequency: "medium",
      },
    },
    blockedSources: ["wired"],
    subscription: {
      id: "sub-001",
      userId: "user-001",
      plan: "premium",
      validUntil: new Date("2024-12-31T23:59:59Z"),
      autoRenew: true,
    },
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
  },
  {
    id: "user-002",
    email: "bob.smith@example.com",
    preferences: {
      topics: ["sports", "technology", "entertainment"],
      keywords: ["football", "champions league", "gaming", "movies"],
      language: "en",
      maxArticlesPerFeed: 50,
      adPreferences: {
        personalizedAds: false,
        categories: ["sports", "entertainment"],
        frequency: "low",
      },
    },
    blockedSources: [],
    subscription: {
      id: "sub-002",
      userId: "user-002",
      plan: "free",
      validUntil: new Date("2024-06-30T23:59:59Z"),
      autoRenew: false,
    },
    createdAt: new Date("2024-01-01T11:00:00Z"),
    updatedAt: new Date("2024-01-15T11:00:00Z"),
  },
];

export const getSampleArticleBySource = (sourceId: string): Article[] => {
  return sampleArticles.filter((article) => article.source === sourceId);
};

export const getSampleArticlesByCategory = (category: string): Article[] => {
  return sampleArticles.filter((article) => article.category === category);
};

export const getSampleArticlesByTag = (tag: string): Article[] => {
  return sampleArticles.filter((article) => article.tags.includes(tag));
};

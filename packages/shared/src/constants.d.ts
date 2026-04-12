export declare const TEST_CONFIG: {
    database: {
        url: string;
        redisUrl: string;
        rabbitmqUrl: string;
    };
    api: {
        baseUrl: string;
        timeout: number;
    };
    mockData: {
        article: {
            title: string;
            content: string;
            url: string;
            source: string;
            category: string;
            tags: string[];
            wordCount: number;
        };
        source: {
            name: string;
            url: string;
            category: string;
            language: string;
        };
        user: {
            email: string;
            preferences: {
                topics: string[];
                keywords: string[];
                language: string;
                maxArticlesPerFeed: number;
                adPreferences: {
                    personalizedAds: boolean;
                    categories: string[];
                    frequency: string;
                };
            };
        };
    };
};
export declare const TEST_ENDPOINTS: {
    articles: string;
    sources: string;
    users: string;
    feeds: string;
    auth: string;
};
export declare const TEST_ERRORS: {
    invalidInput: {
        statusCode: number;
        message: string;
    };
    notFound: {
        statusCode: number;
        message: string;
    };
    unauthorized: {
        statusCode: number;
        message: string;
    };
    forbidden: {
        statusCode: number;
        message: string;
    };
};
//# sourceMappingURL=constants.d.ts.map
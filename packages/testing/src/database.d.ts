import { Article, Source, User } from "@znews/shared";
export declare class TestDatabaseHelper {
    private articles;
    private sources;
    private users;
    reset(): Promise<void>;
    createArticle(article: Partial<Article>): Promise<Article>;
    createSource(source: Partial<Source>): Promise<Source>;
    createUser(user: Partial<User>): Promise<User>;
    findArticle(id: string): Promise<Article | null>;
    findSource(id: string): Promise<Source | null>;
    findUser(id: string): Promise<User | null>;
}
//# sourceMappingURL=database.d.ts.map
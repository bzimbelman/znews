import { Express } from "express";
export declare class TestHttpHelper {
    private app;
    constructor(app: Express);
    get(path: string, headers?: Record<string, string>): Promise<import("superagent/lib/node/response")>;
    post(path: string, data: any, headers?: Record<string, string>): Promise<import("superagent/lib/node/response")>;
    put(path: string, data: any, headers?: Record<string, string>): Promise<import("superagent/lib/node/response")>;
    delete(path: string, headers?: Record<string, string>): Promise<import("superagent/lib/node/response")>;
}
export declare function createMockAuthHeaders(userId: string, token?: string): {
    Authorization: string;
    "Content-Type": string;
};
//# sourceMappingURL=http.d.ts.map
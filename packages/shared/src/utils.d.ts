export declare function generateId(prefix?: string): string;
export declare function sanitizeText(text: string): string;
export declare function extractDomain(url: string): string;
export declare function calculateReadTime(content: string, wordsPerMinute?: number): number;
export declare function truncateText(text: string, maxLength: number): string;
export declare function validateEmail(email: string): boolean;
export declare function isValidUrl(url: string): boolean;
export declare function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=utils.d.ts.map
"use strict";
// Shared utility functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.sanitizeText = sanitizeText;
exports.extractDomain = extractDomain;
exports.calculateReadTime = calculateReadTime;
exports.truncateText = truncateText;
exports.validateEmail = validateEmail;
exports.isValidUrl = isValidUrl;
exports.debounce = debounce;
exports.throttle = throttle;
function generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}
function sanitizeText(text) {
    return text
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[^\w\s\-.,:;!?()"'`]/g, "")
        .substring(0, 1000);
}
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace("www.", "");
    }
    catch {
        return "";
    }
}
function calculateReadTime(content, wordsPerMinute = 200) {
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
}
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + "...";
}
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
}
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
//# sourceMappingURL=utils.js.map
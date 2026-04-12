"use strict";
// HTTP testing utilities
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestHttpHelper = void 0;
exports.createMockAuthHeaders = createMockAuthHeaders;
const supertest_1 = __importDefault(require("supertest"));
class TestHttpHelper {
    constructor(app) {
        Object.defineProperty(this, "app", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: app
        });
    }
    async get(path, headers) {
        return (0, supertest_1.default)(this.app)
            .get(path)
            .set(headers || {})
            .expect("Content-Type", /json/);
    }
    async post(path, data, headers) {
        return (0, supertest_1.default)(this.app)
            .post(path)
            .send(data)
            .set(headers || {})
            .expect("Content-Type", /json/);
    }
    async put(path, data, headers) {
        return (0, supertest_1.default)(this.app)
            .put(path)
            .send(data)
            .set(headers || {})
            .expect("Content-Type", /json/);
    }
    async delete(path, headers) {
        return (0, supertest_1.default)(this.app)
            .delete(path)
            .set(headers || {})
            .expect("Content-Type", /json/);
    }
}
exports.TestHttpHelper = TestHttpHelper;
function createMockAuthHeaders(userId, token) {
    return {
        Authorization: token
            ? `Bearer ${token}`
            : `Basic ${btoa(`${userId}:test-token`)}`,
        "Content-Type": "application/json",
    };
}
//# sourceMappingURL=http.js.map
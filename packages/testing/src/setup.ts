// Test setup utilities for all services
import { jest } from "@jest/globals";

// Mock external dependencies
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

jest.mock("pg", () => ({
  Client: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

// Set test environment
process.env.NODE_ENV = "test";

// Global test timeout
jest.setTimeout(10000);

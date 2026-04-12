module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/apps", "<rootDir>/packages"],
  testMatch: [
    "**/__tests__/**/*.ts",
    "**/?(*.)+(spec|test).ts",
    "**/*.spec.ts",
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleNameMapper: {
    "^@znews/(.*)$": "<rootDir>/packages/$1/src",
  },
  collectCoverageFrom: [
    "apps/**/*.ts",
    "packages/**/*.ts",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/coverage/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/packages/testing/src/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

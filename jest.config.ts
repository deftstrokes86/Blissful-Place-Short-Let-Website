import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // UI component tests and config/env tests.
  testMatch: [
    "<rootDir>/src/app/**/__tests__/**/*.test.{tsx,ts}",
    "<rootDir>/src/components/**/__tests__/**/*.test.{tsx,ts}",
    "<rootDir>/src/cms/__tests__/**/*.test.{tsx,ts}",
  ],
  transform: {},
};

export default createJestConfig(config);

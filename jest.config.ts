import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // UI component tests — app pages and shared components.
  testMatch: [
    "<rootDir>/src/app/**/__tests__/**/*.test.tsx",
    "<rootDir>/src/components/**/__tests__/**/*.test.tsx",
  ],
  transform: {},
};

export default createJestConfig(config);

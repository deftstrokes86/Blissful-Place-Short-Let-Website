import { defineConfig, devices } from "@playwright/test";

const cmsE2EPort = Number.parseInt(process.env.CMS_E2E_PORT ?? "3100", 10);
const baseURL = process.env.CMS_E2E_BASE_URL ?? `http://127.0.0.1:${cmsE2EPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `cmd /c npm run dev -- --port ${cmsE2EPort}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});

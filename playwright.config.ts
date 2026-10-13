import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    ...devices["Desktop Chrome"],
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    baseURL: "http://127.0.0.1:5186",
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
    screenshot: "only-on-failure",
  },
  webServer: {
    reuseExistingServer: !process.env.CI,
    command: "npm run dev -- --host 127.0.0.1 --port 5186 --strictPort",
    url: "http://127.0.0.1:5186",
  },
  reporter: "list",
});

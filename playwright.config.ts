import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4173;
// Trailing slash matters: combined with relative (non-leading-slash) paths
// in tests, this makes `new URL(path, baseURL)` resolve *under* the /blog
// basePath instead of replacing it. See README/e2e docs for the gotcha.
const baseURL = `http://127.0.0.1:${PORT}/blog/`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run build:e2e && npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      // Stable, non-routable base URL for the audio-player e2e suite to
      // intercept via page.route(). If you already have a dev/e2e server
      // running locally without this var, kill it and rerun so the audio
      // player picks it up (reuseExistingServer won't rebuild for you).
      NEXT_PUBLIC_AUDIO_BASE_URL: "https://audio-fixtures.invalid/audio",
    },
  },
  projects: [
    {
      name: "Desktop Chrome - Light",
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      name: "Desktop Chrome - Dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
    {
      name: "Mobile Chrome - Light",
      use: { ...devices["Pixel 5"], colorScheme: "light" },
    },
    {
      name: "Mobile Chrome - Dark",
      use: { ...devices["Pixel 5"], colorScheme: "dark" },
    },
  ],
});

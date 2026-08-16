import { test, expect } from "@playwright/test";
import { routeAudio } from "./fixtures/tts";

// Real S3 latency/CORS behavior, real edge-tts audio, and the generation
// pipeline itself aren't e2e-testable here — they're covered by the
// pipeline's own workflow run once it exists. This suite exercises the
// player against routed fixture responses (see e2e/fixtures/tts.ts).
const POST_URL = "welcome";
const SLUG = "welcome";

test.describe("Audio player", () => {
  test("listen icon is visible in the reading-time row", async ({ page }) => {
    await page.goto(POST_URL);
    await expect(
      page.getByRole("button", { name: /listen to this article/i })
    ).toBeVisible();
  });

  test("shows a graceful message when the article has no audio yet", async ({
    page,
  }) => {
    await routeAudio(page, { slug: SLUG, mp3: 404 });
    await page.goto(POST_URL);

    await page.getByRole("button", { name: /listen to this article/i }).click();
    const dialog = page.getByRole("dialog", { name: /audio player/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/isn't available yet/i)).toBeVisible();
    await expect(dialog.locator("audio")).toHaveCount(0);
  });

  test("opens full playback controls when audio is available", async ({
    page,
  }) => {
    await routeAudio(page, { slug: SLUG });
    await page.goto(POST_URL);

    await page.getByRole("button", { name: /listen to this article/i }).click();
    const dialog = page.getByRole("dialog", { name: /audio player/i });

    await expect(dialog.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /playback speed/i })
    ).toBeVisible();
    await expect(dialog.getByRole("slider", { name: /seek/i })).toBeVisible();
  });

  test("play/pause toggles playback", async ({ page }) => {
    await routeAudio(page, { slug: SLUG });
    await page.goto(POST_URL);
    await page.getByRole("button", { name: /listen to this article/i }).click();
    const dialog = page.getByRole("dialog", { name: /audio player/i });

    await dialog.getByRole("button", { name: "Play", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Pause" })).toBeVisible();
    await expect(page.locator("audio")).toHaveJSProperty("paused", false);

    await dialog.getByRole("button", { name: "Pause" }).click();
    await expect(dialog.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    await expect(page.locator("audio")).toHaveJSProperty("paused", true);
  });

  test("speed control cycles through presets", async ({ page }) => {
    await routeAudio(page, { slug: SLUG });
    await page.goto(POST_URL);
    await page.getByRole("button", { name: /listen to this article/i }).click();
    const dialog = page.getByRole("dialog", { name: /audio player/i });
    const speedButton = dialog.getByRole("button", { name: /playback speed/i });

    await expect(speedButton).toHaveText("1x");
    await speedButton.click();
    await expect(speedButton).toHaveText("1.25x");
    await expect(page.locator("audio")).toHaveJSProperty("playbackRate", 1.25);

    await speedButton.click();
    await expect(speedButton).toHaveText("1.5x");
    await speedButton.click();
    await expect(speedButton).toHaveText("2x");
    await speedButton.click();
    await expect(speedButton).toHaveText("0.75x");
  });

  test("highlights the word currently being spoken", async ({ page }) => {
    await routeAudio(page, { slug: SLUG });
    await page.goto(POST_URL);
    await page.getByRole("button", { name: /listen to this article/i }).click();
    const dialog = page.getByRole("dialog", { name: /audio player/i });

    await dialog.getByRole("button", { name: "Play", exact: true }).click();
    const activeWord = page.locator("span.tts-active-word");
    await expect(activeWord).toHaveCount(1, { timeout: 10_000 });
    await expect(activeWord).toHaveText(/hello/i);
  });

  test("playback still works when timing data is missing (highlighting disabled)", async ({
    page,
  }) => {
    await routeAudio(page, { slug: SLUG, json: 404 });
    await page.goto(POST_URL);
    await page.getByRole("button", { name: /listen to this article/i }).click();
    const dialog = page.getByRole("dialog", { name: /audio player/i });

    await dialog.getByRole("button", { name: "Play", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Pause" })).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(page.locator("span.tts-active-word")).toHaveCount(0);
  });

  test("article auto-scrolls to follow the highlighted word", async ({
    page,
  }) => {
    await routeAudio(page, { slug: SLUG });
    await page.goto(POST_URL);

    // Scroll the highlighted region out of view before starting playback.
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(2200); // clear the manual-scroll suppression window

    await page.getByRole("button", { name: /listen to this article/i }).click();
    const dialog = page.getByRole("dialog", { name: /audio player/i });
    await dialog.getByRole("button", { name: "Play", exact: true }).click();

    const activeWord = page.locator("span.tts-active-word");
    await expect(activeWord).toHaveCount(1, { timeout: 10_000 });
    await expect(activeWord).toBeInViewport({ timeout: 10_000 });
  });
});

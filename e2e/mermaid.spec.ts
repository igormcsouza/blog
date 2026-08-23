import { test, expect } from "@playwright/test";
import { routeAudio } from "./fixtures/tts";

const POST_URL = "event-driven-architecture-from-first-principles";
const SLUG = "event-driven-architecture-from-first-principles";

test.describe("Mermaid diagrams", () => {
  test("all iteration diagrams render as SVG, not raw text", async ({
    page,
  }) => {
    await page.goto(POST_URL);

    const diagrams = page.locator("[data-mermaid] svg");
    await expect(diagrams.first()).toBeVisible({ timeout: 10_000 });
    await expect(diagrams).toHaveCount(6);

    // The raw Mermaid syntax should never be visible as text — it should
    // have been replaced by the rendered SVG.
    await expect(page.getByText("C4Context", { exact: false })).toHaveCount(
      0
    );
  });

  test("diagram content is excluded from read-aloud word-wrapping", async ({
    page,
  }) => {
    await routeAudio(page, { slug: SLUG });
    await page.goto(POST_URL);

    await page
      .getByRole("button", { name: /listen to this article/i })
      .click();
    const dialog = page.getByRole("dialog", { name: /audio player/i });
    await dialog.getByRole("button", { name: "Play", exact: true }).click();

    // wrapWords() runs once playback starts and wraps every narratable DOM
    // token in a span[data-tts-word] — diagram labels inside [data-mermaid]
    // must never be among them (see lib/tts-text.ts SKIP_SELECTOR).
    await expect(
      page.locator("#article-body span[data-tts-word]").first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator("[data-mermaid] span[data-tts-word]")
    ).toHaveCount(0);
  });
});

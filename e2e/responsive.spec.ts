import { test, expect } from "@playwright/test";

test.describe("Responsive layout", () => {
  test("home page has no horizontal overflow at the current viewport", async ({
    page,
  }) => {
    await page.goto("");
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test("post page has no horizontal overflow at the current viewport", async ({
    page,
  }) => {
    await page.goto("containerization-a-chroot-with-steroids");
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test("the tag sidebar stacks below the post list on narrow viewports", async ({
    page,
  }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width >= 640, "desktop-only layout check");

    await page.goto("");
    const postList = page.locator("main .col-span-12").first();
    const tagsCard = page.locator("div.rounded-lg", { has: page.getByRole("heading", { name: "Tags" }) });

    const postBox = await postList.boundingBox();
    const tagsBox = await tagsCard.boundingBox();
    expect(postBox && tagsBox && tagsBox.y).toBeGreaterThan(
      (postBox?.y ?? 0) + (postBox?.height ?? 0) - 50
    );
  });

  test("favicon resolves under the /blog base path", async ({ page }) => {
    await page.goto("");
    const iconHref = await page
      .locator("link[rel='icon']")
      .getAttribute("href");
    expect(iconHref).toBe("/blog/favicon.svg");

    const response = await page.request.get(iconHref!);
    expect(response.status()).toBe(200);
  });
});
